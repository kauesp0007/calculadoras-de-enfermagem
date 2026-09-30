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
    let viewMode = "full";
    let anchorTop = 12;
    const toolbarIds = ["barraAcessibilidade", "global-header-container", "language-selector-placeholder"];
    const toolbars = new Set();
    // 390px = 650px da versão anterior menos 40%. A altura independe do anúncio.
    const cardWidth = 390;
    const toolbarObserver = new ResizeObserver(() => requestPosition(true));
    const pageObserver = new MutationObserver(() => {
        if (connectToolbars()) requestPosition(true);
    });
    let measurePending = false;

    function connectToolbars() {
        const current = new Set(toolbarIds.map((id) => document.getElementById(id)).filter(Boolean));
        let changed = false;
        for (const el of toolbars) {
            if (!current.has(el)) {
                toolbarObserver.unobserve(el);
                toolbars.delete(el);
                changed = true;
            }
        }
        for (const el of current) {
            if (!toolbars.has(el)) {
                toolbars.add(el);
                toolbarObserver.observe(el);
                changed = true;
            }
        }
        return changed;
    }

    function measureAnchor() {
        const bottoms = [];
        for (const el of toolbars) {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight) {
                bottoms.push(rect.bottom);
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

    function position(measure = false) {
        if (disposed) return;
        if (measure) measureAnchor();
        const width = Math.min(cardWidth, Math.max(1, window.innerWidth - 24));
        const available = window.innerHeight - anchorTop - 12;
        if (available < 240) {
            const wasOpen = resolved;
            settle("fallback");
            close();
            if (wasOpen) {
                chrome.runtime.sendMessage({ type: "gasometria:fallback", session }).catch(() => {});
            }
            return false;
        }
        const height = viewMode === "compact" ? Math.min(available, Math.max(240, Math.round(available / 2))) : available;
        host.style.setProperty("width", width + "px", "important");
        host.style.setProperty("height", height + "px", "important");
        host.style.setProperty("top", anchorTop + "px", "important");
        return true;
    }

    function requestPosition(measure = false) {
        if (disposed) return;
        measurePending = measurePending || measure;
        if (!animationFrame) {
            animationFrame = requestAnimationFrame(() => {
                animationFrame = null;
                const shouldMeasure = measurePending;
                measurePending = false;
                position(shouldMeasure);
            });
        }
    }

    function onResize() { requestPosition(true); }

    function close() {
        if (disposed) return;
        disposed = true;
        clearTimeout(timeout);
        cancelAnimationFrame(animationFrame);
        window.removeEventListener("resize", onResize);
        toolbarObserver.disconnect();
        pageObserver.disconnect();
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
        } else if (message.type === "gasometria:view" && ["full", "compact"].includes(message.mode)) {
            viewMode = message.mode;
            position();
            sendResponse({ ok: true });
        }
        return false;
    }

    const opening = new Promise((resolve) => { resolveOpening = resolve; });
    globalThis[KEY] = { close };
    chrome.runtime.onMessage.addListener(onMessage);
    window.addEventListener("resize", onResize);
    connectToolbars();
    if (!position(true)) return opening;
    (document.body || document.documentElement).appendChild(host);
    pageObserver.observe(document.body || document.documentElement, { childList: true, subtree: true });
    timeout = setTimeout(() => {
        settle("fallback");
        close();
    }, 6000);
    return opening;
})();
