"use strict";

const pendingTabs = new Set();
const embeddedMessages = new Set(["braden:ready", "braden:close"]);

async function openStandalone() {
    await chrome.windows.create({
        url: chrome.runtime.getURL("braden.html"),
        type: "popup", 
        width: 820, // Ajustado para a nova largura dupla
        height: 800
    });
}

chrome.action.onClicked.addListener(async (tab) => {
    if (!Number.isInteger(tab.id) || pendingTabs.has(tab.id)) return;
    pendingTabs.add(tab.id);
    
    try {
        await chrome.action.setBadgeText({ tabId: tab.id, text: "" });
        await chrome.action.setTitle({ tabId: tab.id, title: "Abrir Calculadora de Braden" });
        
        if (!/^https?:\/\//i.test(tab.url || "")) {
            await openStandalone();
            return;
        }
        
        try {
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id, frameIds: [0] },
                world: "ISOLATED", 
                files: ["content-script.js"]
            });
            
            if (!results[0] || !["ready", "closed"].includes(results[0].result?.status)) {
                await openStandalone();
            }
        } catch (_) {
            await openStandalone();
        }
    } catch (_) {
        await chrome.action.setBadgeText({ tabId: tab.id, text: "!" }).catch(() => {});
    } finally {
        pendingTabs.delete(tab.id);
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === "braden:fallback") {
        openStandalone().then(() => sendResponse({ ok: true }), () => sendResponse({ ok: false }));
        return true;
    }
    
    if (!message || !embeddedMessages.has(message.type) ||
        sender.id !== chrome.runtime.id || !Number.isInteger(sender.tab?.id) ||
        typeof message.session !== "string") return false;
        
    const forwarded = { type: message.type, session: message.session };
    chrome.tabs.sendMessage(sender.tab.id, forwarded, { frameId: 0 }).then(
        (response) => sendResponse({ ok: response?.ok === true }),
        () => sendResponse({ ok: false })
    );
    return true;
});