"use strict";

(() => {
    const form = document.getElementById("gasometria-form");
    const resultSection = document.getElementById("resultado-gasometria");
    const error = document.getElementById("form-error");
    const embedded = location.hash === "#embedded";
    const session = new URLSearchParams(location.search).get("session");
    const fieldIds = Gasometria.FIELDS.map((field) => field.id);
    const heightButton = document.getElementById("btnAltura");
    const viewFeedback = document.getElementById("view-feedback");
    let viewMode = "full";
    let fullPopupHeight;

    function resetFeedback() {
        resultSection.hidden = true;
        resultSection.removeAttribute("data-tone");
        document.getElementById("resultado-status").textContent = "";
        document.getElementById("resultado-details").replaceChildren();
        error.hidden = true;
        error.textContent = "";
        for (const id of fieldIds) document.getElementById(id).removeAttribute("aria-invalid");
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
        resultSection.scrollIntoView({ block: "start", behavior: "auto" });
    }

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        resetFeedback();
        const raw = Object.fromEntries(fieldIds.map((id) => [id, document.getElementById(id).value]));
        const result = Gasometria.calculate(raw);
        if (!result.ok) {
            error.textContent = result.errors.map((item) => item.message).join(" ");
            error.hidden = false;
            for (const item of result.errors) document.getElementById(item.field).setAttribute("aria-invalid", "true");
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
            document.getElementById("main-content").scrollTop = 0;
            document.getElementById("ph").focus({ preventScroll: true });
        });
    });

    function send(type, options = {}) {
        return chrome.runtime.sendMessage({ type, session, ...options });
    }

    function refreshViewButton() {
        const small = window.innerHeight < 480;
        const compact = viewMode === "compact";
        heightButton.setAttribute("aria-pressed", String(compact));
        document.getElementById("altura-label").textContent = compact ? "Altura completa" : small ? "Compactar" : "Meia altura";
        const description = compact ? "Mostrar em altura completa" : small ?
            "Compactar com rolagem interna, respeitando a altura mínima de 240 pixels" :
            "Mostrar em meia altura, com rolagem interna";
        heightButton.setAttribute("aria-label", description);
        heightButton.title = description;
    }

    heightButton.addEventListener("click", async () => {
        const next = viewMode === "full" ? "compact" : "full";
        heightButton.disabled = true;
        viewFeedback.hidden = true;
        viewFeedback.textContent = "";
        try {
            if (embedded && typeof chrome !== "undefined" && chrome.runtime?.id) {
                const response = await send("gasometria:view", { mode: next });
                if (response?.ok !== true) throw new Error("resize");
            } else if (typeof chrome !== "undefined" && chrome.windows?.getCurrent) {
                const current = await chrome.windows.getCurrent();
                if (current.type === "popup" && Number.isInteger(current.id)) {
                    if (viewMode === "full") fullPopupHeight = current.height || window.outerHeight;
                    const frameHeight = Math.max(0, (current.height || window.outerHeight) - window.innerHeight);
                    const fullHeight = Math.min(fullPopupHeight, window.screen.availHeight);
                    const height = next === "full" ? fullHeight :
                        Math.min(fullHeight, Math.max(240, Math.round((fullHeight - frameHeight) / 2)) + frameHeight);
                    await chrome.windows.update(current.id, { height });
                } else {
                    document.body.classList.toggle("page-compact", next === "compact");
                }
            } else {
                document.body.classList.toggle("page-compact", next === "compact");
            }
            viewMode = next;
            refreshViewButton();
        } catch (_) {
            viewFeedback.textContent = "Não foi possível alterar a altura. Recarregue a extensão e a página para tentar novamente.";
            viewFeedback.hidden = false;
        } finally {
            heightButton.disabled = false;
        }
    });
    window.addEventListener("resize", refreshViewButton);
    refreshViewButton();

    async function closeCalculator() {
        if (embedded && typeof chrome !== "undefined" && chrome.runtime?.id) {
            try { await send("gasometria:close"); } catch (_) { /* Contexto recarregado. */ }
        } else {
            form.reset();
            window.close();
        }
    }

    document.getElementById("btnFechar").addEventListener("click", closeCalculator);
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            event.preventDefault();
            closeCalculator();
        }
    });

    // Só prontidão, fechamento e modo de altura; nunca os valores do formulário.
    if (embedded && session && typeof chrome !== "undefined" && chrome.runtime?.id) {
        send("gasometria:ready").catch(() => {});
    }
})();
