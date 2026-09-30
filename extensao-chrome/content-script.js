/* Executado apenas após o clique do usuário, no mundo ISOLATED do Chrome. */
(() => {
    "use strict";
    const KEY = "__calculadoraGasometriaArterialController_v1";
    if (globalThis[KEY]) {
        globalThis[KEY].close();
        return { status: "closed" };
    }

    const session = crypto.randomUUID();
    const previousFocus = document.activeElement;
    const host = document.createElement("div");
    host.id = "ce-gasometria-" + chrome.runtime.id;
    host.setAttribute("role", "complementary");
    host.setAttribute("aria-label", "Calculadora de gasometria arterial");
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
    frame.title = "Calculadora de gasometria arterial";
    frame.src = chrome.runtime.getURL("calculator.html") + "?session=" + session + "#embedded";
    frame.referrerPolicy = "no-referrer";
    frame.style.cssText = "display:block;width:100%;height:100%;border:0;background:#fff;border-radius:15px;";
    shadow.appendChild(frame);

    let resolveOpening;
    let resolved = false;
    let disposed = false;
    let timeout;
    let animationFrame;
    // 390px é a largura do anúncio. 310px é somente o fallback de seu posicionador.
    let referenceWidth = 390;
    let referenceHeight = 310;
    const promo = document.getElementById("premium-promo-banner");
    if (promo) {
        const bounds = promo.getBoundingClientRect();
        if (bounds.width > 0) referenceWidth = bounds.width;
        if (bounds.height > 0) referenceHeight = bounds.height;
    }

    function settle(status) {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeout);
        resolveOpening({ status });
    }

    function position() {
        if (disposed) return;
        const width = Math.min(Math.round(referenceWidth * 5 / 3), Math.max(1, window.innerWidth - 24));
        const height = Math.min(Math.round(referenceHeight), Math.max(1, window.innerHeight - 24));
        let top = 140;
        const bottoms = [];
        ["barraAcessibilidade", "global-header-container", "language-selector-placeholder"].forEach((id) => {
            const el = document.getElementById(id);
            if (!el) return;
            const rect = el.getBoundingClientRect();
            if (rect.bottom > 0 && rect.top < window.innerHeight) bottoms.push(rect.bottom);
        });
        if (bottoms.length) top = Math.max(...bottoms) + 12;
        top = Math.max(12, Math.min(top, window.innerHeight - height - 12));
        host.style.setProperty("width", width + "px", "important");
        host.style.setProperty("height", height + "px", "important");
        host.style.setProperty("top", top + "px", "important");
    }

    function requestPosition() {
        if (!animationFrame) {
            animationFrame = requestAnimationFrame(() => {
                animationFrame = null;
                position();
            });
        }
    }

    function close() {
        if (disposed) return;
        disposed = true;
        clearTimeout(timeout);
        cancelAnimationFrame(animationFrame);
        window.removeEventListener("resize", requestPosition);
        window.removeEventListener("scroll", requestPosition);
        chrome.runtime.onMessage.removeListener(onMessage);
        host.remove();
        if (globalThis[KEY]?.close === close) delete globalThis[KEY];
        settle("closed");
        if (previousFocus?.isConnected && typeof previousFocus.focus === "function") {
            previousFocus.focus({ preventScroll: true });
        }
    }

    function onMessage(message, sender, sendResponse) {
        if (sender.id !== chrome.runtime.id || message?.session !== session) return false;
        if (message.type === "gasometria:ready") {
            host.style.setProperty("visibility", "visible", "important");
            settle("ready");
            frame.focus({ preventScroll: true });
            sendResponse({ ok: true });
        } else if (message.type === "gasometria:close") {
            close();
            sendResponse({ ok: true });
        }
        return false;
    }

    const opening = new Promise((resolve) => { resolveOpening = resolve; });
    globalThis[KEY] = { close };
    chrome.runtime.onMessage.addListener(onMessage);
    window.addEventListener("resize", requestPosition);
    window.addEventListener("scroll", requestPosition, { passive: true });
    position();
    (document.body || document.documentElement).appendChild(host);
    timeout = setTimeout(() => {
        settle("fallback");
        close();
    }, 6000);
    return opening;
})();
