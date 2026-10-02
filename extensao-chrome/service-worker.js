"use strict";

const ACCESS_URL = "https://asjkftjfbkuuhilnqonx.supabase.co/functions/v1/extension-access";
const AUTH_BRIDGE_URL = "https://www.calculadorasdeenfermagem.com.br/conta/extensao-login.html";
const SUBSCRIBE_URL = "https://www.calculadorasdeenfermagem.com.br/conta/assinatura.html?utm_source=chrome_extension&utm_medium=extension&utm_campaign=gasometria_premium";
const ACCESS_TIMEOUT_MS = 8000;

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {
    chrome.action.setTitle({ title: "Recarregue a extensão para abrir o painel lateral." }).catch(() => {});
});

chrome.sidePanel.onClosed.addListener(({ windowId }) => {
    chrome.runtime.sendMessage({ type: "gasometria:panel-closed", windowId }).catch(() => {});
});

function parseCodeFromRedirect(url) {
    const parsed = new URL(url);
    const params = new URLSearchParams(parsed.hash.replace(/^#/, ""));
    const code = String(params.get("code") || "");
    if (!/^[A-Za-z0-9_-]{40,60}$/.test(code)) throw new Error("auth_code_missing");
    return code;
}

function base64Url(bytes) {
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function createVerifier() {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return base64Url(bytes);
}

async function sha256Base64Url(value) {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
    return base64Url(new Uint8Array(digest));
}

async function launchAuth(interactive) {
    const redirectUri = chrome.identity.getRedirectURL("gasometria-auth");
    const verifier = createVerifier();
    const challenge = await sha256Base64Url(verifier);
    const authUrl = new URL(AUTH_BRIDGE_URL);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("source", "chrome_extension");
    authUrl.searchParams.set("code_challenge", challenge);
    authUrl.searchParams.set("code_challenge_method", "S256");

    const flowDetails = {
        url: authUrl.toString(),
        interactive: !!interactive
    };
    if (!interactive) {
        flowDetails.abortOnLoadForNonInteractive = false;
        flowDetails.timeoutMsForNonInteractive = 10000;
    }
    const responseUrl = await chrome.identity.launchWebAuthFlow(flowDetails);
    if (!responseUrl) throw new Error("auth_cancelled");
    return { code: parseCodeFromRedirect(responseUrl), verifier };
}

async function exchangeCode(code, verifier) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ACCESS_TIMEOUT_MS);
    try {
        const url = new URL(ACCESS_URL);
        url.searchParams.set("code", code);
        url.searchParams.set("code_verifier", verifier);
        url.searchParams.set("extension_id", chrome.runtime.id);
        const response = await fetch(url.toString(), {
            method: "GET",
            headers: { "Accept": "application/json" },
            cache: "no-store",
            signal: controller.signal
        });
        const data = await response.json().catch(() => ({}));
        if (response.status === 401) return { authenticated: false, premium: false, plan: "free", reason: "expired_code" };
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
    try {
        const auth = await launchAuth(interactive);
        return await exchangeCode(auth.code, auth.verifier);
    } catch (error) {
        const name = String(error?.name || "");
        const message = String(error?.message || error || "");
        if (name === "AbortError") {
            return { authenticated: false, premium: false, plan: "free", unavailable: true, reason: "timeout" };
        }
        if (!interactive && (message.includes("interaction_required") || message.includes("auth_cancelled") || message.includes("The user did not approve access"))) {
            return { authenticated: false, premium: false, plan: "free", reason: "signed_out" };
        }
        if (!interactive) {
            return { authenticated: false, premium: false, plan: "free", reason: "signed_out" };
        }
        throw error;
    }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (sender.id !== chrome.runtime.id || !message?.type?.startsWith("premium:")) return false;

    (async () => {
        switch (message.type) {
            case "premium:get-state":
                return resolveAccess({ interactive: false });
            case "premium:login":
                return resolveAccess({ interactive: true });
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
