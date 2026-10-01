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
    
    // CAIXA FIXA E IMÓVEL
    for (const [property, value] of Object.entries({
        position: "fixed", right: "12px", top: "12px", display: "block", overflow: "hidden",
        "z-index": "2147483647", "border-radius": "16px", "box-sizing": "border-box",
        "box-shadow": "0 25px 50px -12px rgba(0,0,0,0.5)", border: "1px solid rgba(26,62,116,0.3)",
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
    
    const cardWidth = 780; 

    function settle(status) {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeout);
        resolveOpening({ status });
    }

    function position() {
        if (disposed) return;
        const width = Math.min(cardWidth, Math.max(1, window.innerWidth - 24));
        
        host.style.setProperty("width", width + "px", "important");
        // Trava a altura para ocupar a janela inteira, respeitando a margem de 12px no topo e na base.
        host.style.setProperty("height", "calc(100vh - 24px)", "important");
        return true;
    }

    function close() {
        if (disposed) return;
        disposed = true;
        clearTimeout(timeout);
        chrome.runtime.onMessage.removeListener(onMessage);
        window.removeEventListener("resize", position);
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
    window.addEventListener("resize", position);
    
    if (!position()) return opening;
    (document.body || document.documentElement).appendChild(host);
    
    timeout = setTimeout(() => { settle("fallback"); close(); }, 6000);
    return opening;
})();