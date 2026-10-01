"use strict";

const ACCESS_URL = "https://asjkftjfbkuuhilnqonx.supabase.co/functions/v1/extension-access";
const AUTH_BRIDGE_URL = "https://www.calculadorasdeenfermagem.com.br/conta/extensao-login.html";
const SUBSCRIBE_URL = "https://www.calculadorasdeenfermagem.com.br/conta/assinatura.html?utm_source=chrome_extension&utm_medium=extension&utm_campaign=gasometria_premium";
const TOKEN_KEY = "gasometriaFirebaseIdToken";
const ACCESS_TIMEOUT_MS = 8000;

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {
    chrome.action.setTitle({ title: "Recarregue a extensão para abrir o painel lateral." }).catch(() => {});
});

chrome.sidePanel.onClosed.addListener(({ windowId }) => {
    chrome.runtime.sendMessage({ type: "gasometria:panel-closed", windowId }).catch(() => {});
});

function decodeJwtPayload(token) {
    try {
        const part = String(token || "").split(".")[1];
        if (!part) return null;
        const normalized = part.replace(/-/g, "+").replace(/_/g, "/");
        const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
        return JSON.parse(atob(padded));
    } catch (_) {
        return null;
    }
}

function tokenIsFresh(token) {
    const payload = decodeJwtPayload(token);
    return !!(payload && Number(payload.exp) * 1000 > Date.now() + 60_000);
}

async function storedToken() {
    const data = await chrome.storage.local.get(TOKEN_KEY);
    const token = String(data[TOKEN_KEY] || "");
    if (!tokenIsFresh(token)) {
        if (token) await chrome.storage.local.remove(TOKEN_KEY);
        return "";
    }
    return token;
}

async function saveToken(token) {
    if (!tokenIsFresh(token)) throw new Error("invalid_or_expired_token");
    await chrome.storage.local.set({ [TOKEN_KEY]: token });
    return token;
}

function parseTokenFromRedirect(url) {
    const parsed = new URL(url);
    const hash = new URLSearchParams(parsed.hash.replace(/^#/, ""));
    const token = hash.get("id_token") || "";
    if (!token) throw new Error("auth_token_missing");
    return token;
}

async function launchAuth(interactive) {
    const redirectUri = chrome.identity.getRedirectURL("gasometria-auth");
    const authUrl = new URL(AUTH_BRIDGE_URL);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("source", "chrome_extension");

    const responseUrl = await chrome.identity.launchWebAuthFlow({
        url: authUrl.toString(),
        interactive: !!interactive
    });
    if (!responseUrl) throw new Error("auth_cancelled");
    return saveToken(parseTokenFromRedirect(responseUrl));
}

async function accessFromToken(token) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ACCESS_TIMEOUT_MS);
    try {
        const response = await fetch(ACCESS_URL, {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token,
                "Accept": "application/json"
            },
            cache: "no-store",
            signal: controller.signal
        });
        const data = await response.json().catch(() => ({}));
        if (response.status === 401) {
            await chrome.storage.local.remove(TOKEN_KEY);
            return { authenticated: false, premium: false, plan: "free", reason: "signed_out" };
        }
        if (!response.ok) throw new Error(data.error || ("access_http_" + response.status));
        const premium = data.plan === "premium";
        return {
            authenticated: true,
            premium,
            plan: premium ? "premium" : "free",
            premium_expires_at: data.premium_expires_at || null
        };
    } finally {
        clearTimeout(timeout);
    }
}

async function resolveAccess({ interactive = false } = {}) {
    let token = await storedToken();

    if (!token) {
        try {
            token = await launchAuth(interactive);
        } catch (error) {
            if (interactive) throw error;
            return { authenticated: false, premium: false, plan: "free", reason: "signed_out" };
        }
    }

    try {
        return await accessFromToken(token);
    } catch (error) {
        if (String(error?.name || "") === "AbortError") {
            return { authenticated: true, premium: false, plan: "free", unavailable: true, reason: "timeout" };
        }
        return { authenticated: true, premium: false, plan: "free", unavailable: true, reason: "access_unavailable" };
    }
}

async function logout() {
    await chrome.storage.local.remove(TOKEN_KEY);
    return { authenticated: false, premium: false, plan: "free", reason: "signed_out" };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (sender.id !== chrome.runtime.id || !message?.type?.startsWith("premium:")) return false;

    (async () => {
        switch (message.type) {
            case "premium:get-state":
                return resolveAccess({ interactive: false });
            case "premium:login":
                await launchAuth(true);
                return resolveAccess({ interactive: false });
            case "premium:logout":
                return logout();
            case "premium:subscribe":
                await chrome.tabs.create({ url: SUBSCRIBE_URL });
                return { ok: true };
            default:
                throw new Error("unsupported_message");
        }
    })().then(sendResponse).catch((error) => {
        sendResponse({
            authenticated: false,
            premium: false,
            plan: "free",
            error: String(error?.message || error || "unknown_error")
        });
    });
    return true;
});
