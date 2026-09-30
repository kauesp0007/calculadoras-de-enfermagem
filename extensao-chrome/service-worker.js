"use strict";

const pendingTabs = new Set();
const embeddedMessages = new Set(["gasometria:ready", "gasometria:close"]);

async function openStandalone() {
    await chrome.windows.create({
        url: chrome.runtime.getURL("calculator.html"),
        type: "popup", width: 674, height: 370
    });
}

chrome.action.onClicked.addListener(async (tab) => {
    if (!Number.isInteger(tab.id) || pendingTabs.has(tab.id)) return;
    pendingTabs.add(tab.id);
    try {
        await chrome.action.setBadgeText({ tabId: tab.id, text: "" });
        await chrome.action.setTitle({ tabId: tab.id, title: "Abrir ou fechar a calculadora de gasometria arterial" });
        if (!/^https?:\/\//i.test(tab.url || "")) {
            await openStandalone();
            return;
        }
        try {
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id, frameIds: [0] },
                world: "ISOLATED", files: ["content-script.js"]
            });
            if (!results[0] || !["ready", "closed"].includes(results[0].result?.status)) {
                await openStandalone();
            }
        } catch (_) {
            // Chrome Web Store, PDF, permissões revogadas ou página restrita.
            await openStandalone();
        }
    } catch (_) {
        // Não registrar URL da aba nem parâmetros laboratoriais em logs.
        await chrome.action.setBadgeText({ tabId: tab.id, text: "!" }).catch(() => {});
        await chrome.action.setTitle({
            tabId: tab.id, title: "Não foi possível abrir. Tente novamente em uma página comum."
        }).catch(() => {});
    } finally {
        pendingTabs.delete(tab.id);
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || !embeddedMessages.has(message.type) ||
        sender.id !== chrome.runtime.id || !Number.isInteger(sender.tab?.id) ||
        !Number.isInteger(sender.frameId) || sender.frameId <= 0 ||
        typeof message.session !== "string" || !/^[a-f0-9-]{36}$/i.test(message.session)) return false;

    let url;
    try { url = new URL(sender.url); } catch (_) { return false; }
    const ownPage = new URL(chrome.runtime.getURL("calculator.html"));
    if (url.protocol !== ownPage.protocol || url.hostname !== ownPage.hostname || url.pathname !== ownPage.pathname ||
        url.hash !== "#embedded" || url.searchParams.get("session") !== message.session) return false;

    chrome.tabs.sendMessage(sender.tab.id, {
        type: message.type, session: message.session
    }, { frameId: 0 }).then(
        () => sendResponse({ ok: true }),
        () => sendResponse({ ok: false })
    );
    return true;
});
