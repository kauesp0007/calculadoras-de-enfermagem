"use strict";

(() => {
    const form = document.getElementById("gasometria-form");
    const resultSection = document.getElementById("resultado-gasometria");
    const error = document.getElementById("form-error");
    const embedded = location.hash === "#embedded";
    const session = new URLSearchParams(location.search).get("session");
    const fieldIds = Gasometria.FIELDS.map((field) => field.id);

    function resetFeedback() {
        resultSection.hidden = true;
        error.hidden = true;
        error.textContent = "";
        for (const id of fieldIds) document.getElementById(id).removeAttribute("aria-invalid");
    }

    function addDetail(label, value) {
        const row = document.createElement("div");
        const term = document.createElement("dt");
        const description = document.createElement("dd");
        term.textContent = label;
        description.textContent = value;
        row.append(term, description);
        document.getElementById("resultado-details").appendChild(row);
    }

    function render(result) {
        document.getElementById("resultado-title").textContent = result.title;
        document.getElementById("resultado-summary").textContent = result.summary;
        document.getElementById("resultado-compensacao").textContent = result.compensation.message;
        const expected = document.getElementById("resultado-esperado");
        expected.textContent = result.compensation.expectedText;
        expected.hidden = !result.compensation.expectedText;
        document.getElementById("resultado-details").replaceChildren();
        addDetail("pH", Gasometria.format(result.values.ph, 2) + " — " + result.phState);
        addDetail("PaCO₂", Gasometria.format(result.values.paco2) + " mmHg");
        addDetail("HCO₃⁻", Gasometria.format(result.values.hco3) + " mEq/L");
        for (const item of result.supplemental) {
            addDetail(item.label, item.value + " — " + item.status);
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
            "resultado-esperado", "resultado-note"
        ]) document.getElementById(id).textContent = "";
        requestAnimationFrame(() => {
            document.getElementById("main-content").scrollTop = 0;
            document.getElementById("ph").focus({ preventScroll: true });
        });
    });

    function send(type) {
        return chrome.runtime.sendMessage({ type, session });
    }

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

    // Só a prontidão e o fechamento são comunicados; nunca os valores do formulário.
    if (embedded && session && typeof chrome !== "undefined" && chrome.runtime?.id) {
        send("gasometria:ready").catch(() => {});
    }
})();
