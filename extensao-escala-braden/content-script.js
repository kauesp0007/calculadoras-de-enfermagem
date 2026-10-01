(() => {
    "use strict";
    
    const KEY = "__calculadoraBradenController_v1";
    if (globalThis[KEY]) {
        globalThis[KEY].close();
        return { status: "closed" };
    }
    
    const session = crypto.randomUUID();
    const previousFocus = document.activeElement;
    
    const host = document.createElement("div");
    host.id = "ce-braden-" + chrome.runtime.id;
    host.style.setProperty("all", "initial", "important");
    
    for (const [property, value] of Object.entries({
        position: "fixed", right: "12px", display: "block", overflow: "hidden",
        "z-index": "2147483647", "border-radius": "16px", "box-sizing": "border-box",
        "box-shadow": "0 18px 45px rgba(0,0,0,.19)", border: "1px solid rgba(26,62,116,.16)",
        background: "#fff", isolation: "isolate", "color-scheme": "light",
        "pointer-events": "auto", visibility: "hidden"
    })) host.style.setProperty(property, value, "important");

    const shadow = host.attachShadow({ mode: "closed" });
    const frame = document.createElement("iframe");
    frame.src = chrome.runtime.getURL("braden.html") + "?session=" + session + "#embedded";
    frame.style.cssText = "display:block;width:100%;height:100%;border:0;background:#fff;border-radius:15px;";
    shadow.appendChild(frame);

    let resolveOpening;
    let resolved = false;
    let disposed = false;
    let timeout;
    let anchorTop = 12;
    
    // Largura dupla solicitada para Braden: 780px
    const cardWidth = 780; 
    
    const toolbarIds = ["barraAcessibilidade", "global-header-container", "language-selector-placeholder"];
    
    function measureAnchor() {
        const bottoms = [];
        for (const id of toolbarIds) {
            const el = document.getElementById(id);
            if (el) {
                const rect = el.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight) {
                    bottoms.push(rect.bottom);
                }
            }
        }
        anchorTop = bottoms.length ? Math.max(...bottoms) + 12 : 12;
    }

    function settle(status) {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeout);
        resolveOpening({ status });
    }

    function position() {
        if (disposed) return;
        measureAnchor();
        
        const width = Math.min(cardWidth, Math.max(1, window.innerWidth - 24));
        const available = window.innerHeight - anchorTop - 12;
        
        if (available < 240) {
            const wasOpen = resolved;
            settle("fallback");
            close();
            if (wasOpen) chrome.runtime.sendMessage({ type: "braden:fallback", session }).catch(() => {});
            return false;
        }
        
        host.style.setProperty("width", width + "px", "important");
        host.style.setProperty("height", available + "px", "important");
        host.style.setProperty("top", anchorTop + "px", "important");
        return true;
    }

    function close() {
        if (disposed) return;
        disposed = true;
        clearTimeout(timeout);
        chrome.runtime.onMessage.removeListener(onMessage);
        host.remove();
        if (globalThis[KEY]?.close === close) delete globalThis[KEY];
        settle("closed");
        if (previousFocus?.isConnected && typeof previousFocus.focus === "function") previousFocus.focus({ preventScroll: true });
    }

    function onMessage(message, sender, sendResponse) {
        if (sender.id !== chrome.runtime.id || message?.session !== session) return false;
        if (message.type === "braden:ready") {
            host.style.setProperty("visibility", "visible", "important");
            settle("ready");
            sendResponse({ ok: true });
        } else if (message.type === "braden:close") {
            close();
            sendResponse({ ok: true });
        }
        return false;
    }

    const opening = new Promise((resolve) => { resolveOpening = resolve; });
    globalThis[KEY] = { close };
    chrome.runtime.onMessage.addListener(onMessage);
    
    if (!position()) return opening;
    (document.body || document.documentElement).appendChild(host);
    
    timeout = setTimeout(() => { settle("fallback"); close(); }, 6000);
    return opening;
})();