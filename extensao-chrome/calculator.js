"use strict";

(() => {
    const form = document.getElementById("gasometria-form");
    const resultSection = document.getElementById("resultado-gasometria");
    const error = document.getElementById("form-error");
    const fieldIds = Gasometria.FIELDS.map((field) => field.id);
    const heightButton = document.getElementById("btnAltura");
    const viewFeedback = document.getElementById("view-feedback");
    let viewMode = "full";
    const shell = document.getElementById("calculator-shell");
    const main = document.getElementById("main-content");
    const body = document.getElementById("calculator-body");
    const header = document.getElementById("calculator-header");
    const footer = document.getElementById("calculator-footer");
    const references = document.getElementById("referencias");
    const referencesButton = document.getElementById("btnReferencias");
    let fullCardHeight = 0;
    let ownWindowId;
    let pendingFrame;
    let disposed = false;
    let premiumAccess = false;
    const premiumCard = document.getElementById("premium-access-card");
    const premiumStatus = document.getElementById("premium-access-status");
    const premiumMessage = document.getElementById("premium-access-message");
    const loginButton = document.getElementById("btnEntrarPremium");
    const subscribeButton = document.getElementById("btnAssinarPremium");

    function runtimeMessage(type) {
        return new Promise((resolve, reject) => {
            if (typeof chrome === "undefined" || !chrome.runtime?.id) {
                reject(new Error("extension_runtime_unavailable"));
                return;
            }
            chrome.runtime.sendMessage({ type }, (response) => {
                const runtimeError = chrome.runtime.lastError;
                if (runtimeError) {
                    reject(new Error(runtimeError.message));
                    return;
                }
                resolve(response || {});
            });
        });
    }

    function lockCalculator(locked) {
        premiumAccess = !locked;
        document.body.dataset.access = locked ? "locked" : "premium";
        for (const field of Gasometria.FIELDS) {
            document.getElementById(field.id).disabled = locked;
        }
        calculateButton.disabled = locked;
        clearButton.disabled = locked;
        if (locked) {
            resetFeedback();
            form.reset();
        }
        fitCard();
    }

    function renderPremiumState(state) {
        const premium = !!state?.premium;
        const authenticated = !!state?.authenticated;
        const unavailable = !!state?.unavailable;
        premiumCard.dataset.state = premium ? "premium" : unavailable ? "error" : "free";

        if (premium) {
            premiumStatus.textContent = "Premium ativo — calculadora liberada.";
            premiumMessage.textContent = "Sua assinatura foi confirmada pelo mesmo sistema Premium do site. Os campos e o cálculo estão liberados.";
            loginButton.hidden = true;
            subscribeButton.hidden = true;
            lockCalculator(false);
            return;
        }

        lockCalculator(true);
        loginButton.hidden = false;
        subscribeButton.hidden = false;

        if (unavailable) {
            premiumStatus.textContent = "Não foi possível confirmar a assinatura agora. Por segurança, o uso permanece bloqueado.";
        } else if (authenticated) {
            premiumStatus.textContent = "Conta verificada: plano Free. Assine o Premium para liberar o preenchimento e o cálculo.";
        } else {
            premiumStatus.textContent = "Entre para verificar uma assinatura Premium existente.";
        }
    }

    async function refreshPremiumState(interactive) {
        loginButton.disabled = true;
        subscribeButton.disabled = true;
        premiumStatus.textContent = interactive ? "Abrindo login seguro..." : "Verificando acesso...";
        try {
            const state = await runtimeMessage(interactive ? "premium:login" : "premium:get-state");
            if (state?.error && !state?.authenticated) {
                renderPremiumState({ authenticated: false, premium: false });
                premiumStatus.textContent = "Login não concluído. Você pode tentar novamente.";
                return;
            }
            renderPremiumState(state);
        } catch (_) {
            renderPremiumState({ authenticated: false, premium: false, unavailable: true });
        } finally {
            loginButton.disabled = false;
            subscribeButton.disabled = false;
            fitCard();
        }
    }

    function resetFeedback() {
        resultSection.hidden = true;
        resultSection.removeAttribute("data-tone");
        document.getElementById("resultado-status").textContent = "";
        document.getElementById("resultado-details").replaceChildren();
        error.hidden = true;
        error.textContent = "";
        for (const id of fieldIds) document.getElementById(id).removeAttribute("aria-invalid");
        fitCard();
    }

    // Cores de apresentação: não modificam a interpretação do núcleo clínico.
    function parameterTone(id, value) {
        if (value === null) return { tone: "neutral", label: "Opcional" };
        const ranges = { ph: [7.35, 7.45], paco2: [35, 45], hco3: [22, 26], pao2: [80, 100], be: [-2, 2] };
        if (id === "sato2") return value > 95 ?
            { tone: "reference", label: "Acima de 95%" } : { tone: "attention", label: "95% ou menos" };
        const [low, high] = ranges[id];
        if (value >= low && value <= high) return { tone: "reference", label: "Na faixa de referência" };
        const reduced = value < low;
        if (id === "ph") return { tone: reduced ? "acid" : "alkaline", label: reduced ? "Acidemia" : "Alcalemia" };
        const tone = id === "pao2" ? "attention" :
            id === "paco2" ? (reduced ? "alkaline" : "acid") : (reduced ? "acid" : "alkaline");
        return { tone, label: reduced ? "Abaixo da referência" : "Acima da referência" };
    }

    function outcomeTone(code) {
        if (code === "reference") return { tone: "reference", label: "Na faixa de referência" };
        if (code === "inconsistent") return { tone: "attention", label: "Conferir valores" };
        if (code.startsWith("mixed-")) return { tone: "attention", label: "Padrão misto" };
        if (code.endsWith("-acidosis")) return { tone: "acid", label: "Acidose" };
        if (code.endsWith("-alkalosis")) return { tone: "alkaline", label: "Alcalose" };
        return { tone: "attention", label: "Avaliar em conjunto" };
    }

    function addDetail(id, label, value, rawValue) {
        const row = document.createElement("div");
        const term = document.createElement("dt");
        const description = document.createElement("dd");
        const number = document.createElement("span");
        const badge = document.createElement("span");
        const status = parameterTone(id, rawValue);
        row.setAttribute("data-parameter", id);
        row.setAttribute("data-tone", status.tone);
        term.textContent = label;
        number.textContent = value;
        badge.className = "status-badge";
        badge.textContent = status.label;
        description.append(number, badge);
        row.append(term, description);
        document.getElementById("resultado-details").appendChild(row);
    }

    function render(result) {
        const status = outcomeTone(result.code);
        resultSection.setAttribute("data-tone", status.tone);
        document.getElementById("resultado-status").textContent = status.label;
        document.getElementById("resultado-title").textContent = result.title;
        document.getElementById("resultado-summary").textContent = result.summary;
        document.getElementById("resultado-compensacao").textContent = result.compensation.message;
        const expected = document.getElementById("resultado-esperado");
        expected.textContent = result.compensation.expectedText;
        expected.hidden = !result.compensation.expectedText;
        document.getElementById("resultado-details").replaceChildren();
        addDetail("ph", "pH", Gasometria.format(result.values.ph, 2), result.values.ph);
        addDetail("paco2", "PaCO₂", Gasometria.format(result.values.paco2) + " mmHg", result.values.paco2);
        addDetail("hco3", "HCO₃⁻", Gasometria.format(result.values.hco3) + " mEq/L", result.values.hco3);
        for (const [index, item] of result.supplemental.entries()) {
            const id = fieldIds[index + 3];
            addDetail(id, item.label, item.value, result.values[id]);
        }
        document.getElementById("resultado-note").textContent = result.notes.join(" ");
        resultSection.hidden = false;
        resultSection.focus({ preventScroll: true });
        fitCard();
        const resultBounds = resultSection.getBoundingClientRect();
        const mainBounds = main.getBoundingClientRect();
        if (resultBounds.bottom > mainBounds.bottom) {
            main.scrollTop += resultBounds.top - mainBounds.top;
        }
    }

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!premiumAccess) {
            premiumStatus.textContent = "Assinatura Premium necessária para calcular.";
            premiumCard.scrollIntoView({ block: "nearest" });
            return;
        }
        resetFeedback();
        const raw = Object.fromEntries(fieldIds.map((id) => [id, document.getElementById(id).value]));
        const result = Gasometria.calculate(raw);
        if (!result.ok) {
            error.textContent = result.errors.map((item) => item.message).join(" ");
            error.hidden = false;
            for (const item of result.errors) document.getElementById(item.field).setAttribute("aria-invalid", "true");
            fitCard();
            document.getElementById(result.errors[0].field).focus();
            return;
        }
        render(result);
    });

    form.addEventListener("input", resetFeedback);
    form.addEventListener("reset", () => {
        resetFeedback();
        document.getElementById("resultado-details").replaceChildren();
        for (const id of [
            "resultado-title", "resultado-summary", "resultado-compensacao",
            "resultado-esperado", "resultado-note", "resultado-status"
        ]) document.getElementById(id).textContent = "";
        requestAnimationFrame(() => {
            main.scrollTop = 0;
            fitCard();
            document.getElementById("ph").focus({ preventScroll: true });
        });
    });

    function refreshViewButton() {
        const small = fullCardHeight < 480;
        const compact = viewMode === "compact";
        heightButton.setAttribute("aria-pressed", String(compact));
        document.getElementById("altura-label").textContent = compact ? "Altura completa" : small ? "Compactar" : "Meia altura";
        const description = compact ? "Mostrar em altura completa" : small ?
            "Compactar com rolagem interna, respeitando a altura mínima de 240 pixels" :
            "Mostrar em meia altura, com rolagem interna";
        heightButton.setAttribute("aria-label", description);
        heightButton.title = description;
    }

    function fitCard() {
        if (disposed) return;
        const padding = window.getComputedStyle(main);
        const natural = Math.ceil(
            header.getBoundingClientRect().height + footer.getBoundingClientRect().height +
            body.getBoundingClientRect().height +
            (parseFloat(padding.paddingTop) || 0) + (parseFloat(padding.paddingBottom) || 0) + 2
        );
        fullCardHeight = Math.min(Math.max(1, window.innerHeight), Math.max(1, natural));
        const height = viewMode === "compact" ?
            Math.min(fullCardHeight, Math.max(240, Math.round(fullCardHeight / 2))) : fullCardHeight;
        shell.style.setProperty("--card-height", height + "px");
        refreshViewButton();
    }

    function requestFit() {
        if (disposed || pendingFrame) return;
        pendingFrame = requestAnimationFrame(() => {
            pendingFrame = null;
            fitCard();
        });
    }

    loginButton.addEventListener("click", () => refreshPremiumState(true));
    subscribeButton.addEventListener("click", async () => {
        subscribeButton.disabled = true;
        try {
            await runtimeMessage("premium:subscribe");
        } finally {
            subscribeButton.disabled = false;
        }
    });
    heightButton.addEventListener("click", () => {
        viewMode = viewMode === "full" ? "compact" : "full";
        fitCard();
    });

    referencesButton.addEventListener("click", () => {
        const show = references.hidden || !references.open;
        references.hidden = !show;
        references.open = show;
        referencesButton.setAttribute("aria-expanded", String(show));
        fitCard();
        if (show) main.scrollTop = main.scrollHeight;
    });
    references.addEventListener("toggle", () => {
        if (!references.open) {
            if (references.contains(document.activeElement)) referencesButton.focus({ preventScroll: true });
            references.hidden = true;
        }
        referencesButton.setAttribute("aria-expanded", String(!references.hidden && references.open));
        requestFit();
    });

    function resetPanel() {
        viewMode = "full";
        references.hidden = true;
        references.open = false;
        referencesButton.setAttribute("aria-expanded", "false");
        viewFeedback.hidden = true;
        form.reset();
        fitCard();
    }

    function onNativeMessage(message, sender, sendResponse) {
        if (sender.id !== chrome.runtime.id || message?.type !== "gasometria:panel-closed" ||
            !Number.isInteger(message.windowId) || message.windowId !== ownWindowId) return false;
        resetPanel();
        sendResponse({ ok: true });
        return false;
    }

    async function updateNativeContext() {
        if (typeof chrome === "undefined" || !chrome.windows?.getCurrent) return;
        try {
            const current = await chrome.windows.getCurrent();
            ownWindowId = current.id;
            const layout = await chrome.sidePanel.getLayout();
            document.getElementById("panel-position-help").hidden = layout.side !== "left";
            fitCard();
        } catch (_) { /* O Chrome controla a posição do painel. */ }
    }

    async function closeCalculator() {
        resetPanel();
        try {
            if (typeof chrome === "undefined" || !chrome.sidePanel?.close) throw new Error("preview");
            const current = await chrome.windows.getCurrent();
            await chrome.sidePanel.close({ windowId: current.id });
        } catch (_) {
            viewFeedback.textContent = "Use o botão de fechar do painel lateral do Chrome.";
            viewFeedback.hidden = false;
            fitCard();
        }
    }

    document.getElementById("btnFechar").addEventListener("click", closeCalculator);
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            event.preventDefault();
            closeCalculator();
        }
    });

    const observer = new ResizeObserver(requestFit);
    [body, header, footer].forEach(el => observer.observe(el));
    window.addEventListener("resize", requestFit);
    window.addEventListener("focus", updateNativeContext);
    if (typeof chrome !== "undefined" && chrome.runtime?.id) {
        chrome.runtime.onMessage.addListener(onNativeMessage);
    }
    window.addEventListener("pagehide", () => {
        disposed = true;
        observer.disconnect();
        cancelAnimationFrame(pendingFrame);
        window.removeEventListener("resize", requestFit);
        window.removeEventListener("focus", updateNativeContext);
        if (typeof chrome !== "undefined" && chrome.runtime?.id) {
            chrome.runtime.onMessage.removeListener(onNativeMessage);
        }
    });
    lockCalculator(true);
    fitCard();
    updateNativeContext();
    refreshPremiumState(false);
})();
