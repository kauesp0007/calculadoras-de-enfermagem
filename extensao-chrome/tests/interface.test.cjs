"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Gasometria = require("../gasometria-core.js");

module.exports = async function testInterface() {
    const code = fs.readFileSync(path.join(__dirname, "../calculator.js"), "utf8");
    const css = fs.readFileSync(path.join(__dirname, "../calculator.css"), "utf8");
    let checks = 0;
    // DOM/APIs simulados: mede o card real e exerce handlers sem abrir janelas.
    function harness(options = {}) {
        const elements = new Map(), observers = [], frames = new Map(), listeners = new Set(), closes = [];
        let frameId = 0;
        let premiumState = options.premium !== false;
        class Element {
            constructor(id = "") {
                this.id = id; this.children = []; this.attributes = new Map(); this.events = new Map();
                this.value = ""; this.hidden = false; this.open = false; this._text = ""; this.scrollTop = 0; this.dataset = {};
                const properties = new Map();
                this.style = {
                    setProperty(name, value) { properties.set(name, value); },
                    getPropertyValue(name) { return properties.get(name); }
                };
            }
            set textContent(value) { this._text = value; this.children = []; }
            get textContent() { return this._text + this.children.map(child => child.textContent).join(""); }
            setAttribute(name, value) { this.attributes.set(name, value); }
            getAttribute(name) { return this.attributes.get(name); }
            removeAttribute(name) { this.attributes.delete(name); }
            append(...children) { this.children.push(...children); }
            appendChild(child) { this.children.push(child); }
            replaceChildren(...children) { this.children = children; this._text = ""; }
            addEventListener(name, fn) { this.events.set(name, fn); }
            focus() { this.focused = true; document.activeElement = this; }
            scrollIntoView() {}
            contains(target) { return this === target || this.children.some(child => child.contains(target)); }
            get scrollHeight() { return bodyHeight() + 22; }
            getBoundingClientRect() {
                const header = 100, footer = 40;
                const height = parseFloat(get("calculator-shell").style.getPropertyValue("--card-height")) || 0;
                if (this.id === "calculator-header") return { height: header, top: 0, bottom: header };
                if (this.id === "calculator-footer") return { height: footer, top: height - footer, bottom: height };
                if (this.id === "calculator-body") return { height: bodyHeight() };
                if (this.id === "calculator-shell") return { top: 0, height, bottom: height, width: Math.min(window.innerWidth, 390) };
                const mainTop = header + 1;
                if (this.id === "main-content") return { top: mainTop, bottom: height - footer - 1, height: height - header - footer - 2 };
                const resultTop = mainTop + 10 + (options.bodyHeight || 500) - get("main-content").scrollTop;
                return { top: resultTop, bottom: resultTop + 420, height: 420 };
            }
            async emit(name, event = {}) { await this.events.get(name)?.({ preventDefault() {}, ...event }); }
        }
        const get = id => {
            if (!elements.has(id)) elements.set(id, new Element(id));
            return elements.get(id);
        };
        function bodyHeight() {
            return (options.bodyHeight || 500) + (get("resultado-gasometria").hidden ? 0 : 420) +
                (get("referencias").hidden ? 0 : 200) + (get("form-error").hidden ? 0 : 60) +
                (get("view-feedback").hidden ? 0 : 60) + (get("panel-position-help").hidden ? 0 : 60);
        }
        for (const id of ["resultado-gasometria", "referencias", "form-error", "view-feedback", "panel-position-help"]) get(id).hidden = true;
        const window = {
            innerHeight: options.height || 760, innerWidth: options.width || 390,
            events: new Map(),
            getComputedStyle() { return { paddingTop: "10px", paddingBottom: "12px" }; },
            addEventListener(name, fn) { this.events.set(name, fn); },
            removeEventListener(name, fn) { if (this.events.get(name) === fn) this.events.delete(name); }
        };
        const chrome = {
            runtime: {
                id: "own-extension",
                lastError: null,
                onMessage: {
                    addListener(fn) { listeners.add(fn); }, removeListener(fn) { listeners.delete(fn); }
                },
                sendMessage(message, callback) {
                    if (message && (message.type === "premium:get-state" || message.type === "premium:login")) {
                        const premium = premiumState;
                        callback({ authenticated: true, premium, plan: premium ? "premium" : "free" });
                        return;
                    }
                    if (message && message.type === "premium:subscribe") {
                        callback({ ok: true });
                        return;
                    }
                    callback({});
                }
            },
            windows: { async getCurrent() { return { id: 41, type: "normal" }; } },
            sidePanel: {
                async getLayout() { return { side: options.side || "right" }; },
                async close(value) { closes.push(value); if (options.rejectClose) throw new Error("close"); }
            }
        };
        const document = {
            getElementById: get,
            createElement: () => new Element(),
            events: new Map(),
            visibilityState: "visible",
            addEventListener(name, fn) { this.events.set(name, fn); },
            removeEventListener(name, fn) { if (this.events.get(name) === fn) this.events.delete(name); }
        };
        get("gasometria-form").reset = () => {
            Gasometria.FIELDS.forEach(field => { get(field.id).value = ""; });
            return get("gasometria-form").emit("reset");
        };
        class Observer {
            constructor(callback) { this.callback = callback; this.targets = new Set(); observers.push(this); }
            observe(target) { this.targets.add(target); }
            disconnect() { this.targets.clear(); this.disconnected = true; }
        }
        new Function("document", "window", "chrome", "Gasometria", "requestAnimationFrame", "cancelAnimationFrame", "ResizeObserver", code)(
            document, window, chrome, Gasometria,
            fn => { const id = ++frameId; frames.set(id, fn); return id; }, id => frames.delete(id), Observer
        );
        function flush() { const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn()); }
        return {
            get, document, window, closes, observers, listeners, frames, flush,
            setPremium(value) { premiumState = !!value; },
            async ready() { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); flush(); },
            async calculate(values) {
                Gasometria.FIELDS.forEach(field => { get(field.id).value = values[field.id] === undefined ? "" : String(values[field.id]); });
                await get("gasometria-form").emit("submit"); flush();
            },
            row(id) { return get("resultado-details").children.find(row => row.getAttribute("data-parameter") === id); },
            height() { return parseFloat(get("calculator-shell").style.getPropertyValue("--card-height")); },
            message(message, sender = { id: "own-extension" }) {
                let response;
                [...listeners][0](message, sender, value => { response = value; });
                flush(); return response;
            }
        };
    }

    const ui = harness();
    await ui.ready();
    const normal = { ph: 7.4, paco2: 40, hco3: 24, pao2: 95, be: 0, sato2: 98 };
    const outcomes = [
        [normal, "reference", "Na faixa de referência"],
        [{ ph: 7.29, paco2: 26, hco3: 12 }, "acid", "Acidose"],
        [{ ph: 7.47, paco2: 32, hco3: 22 }, "alkaline", "Alcalose"],
        [{ ph: 7.47, paco2: 32, hco3: 27 }, "attention", "Padrão misto"],
        [{ ph: 7.47, paco2: 40, hco3: 22 }, "attention", "Conferir valores"],
        [{ ph: 7.4, paco2: 32, hco3: 20 }, "attention", "Avaliar em conjunto"],
        [{ ph: 7.34, paco2: 40, hco3: 24 }, "attention", "Avaliar em conjunto"]
    ];
    for (const [values, tone, label] of outcomes) {
        await ui.calculate(values);
        assert.equal(ui.get("resultado-gasometria").hidden, false);
        assert.equal(ui.get("resultado-gasometria").getAttribute("data-tone"), tone);
        assert.equal(ui.get("resultado-status").textContent, label);
        assert.equal(ui.get("resultado-title").textContent, Gasometria.calculate(values).title);
        assert.equal(ui.get("resultado-details").children.length, 6);
        checks += 1;
    }
    const boundaries = [
        ["ph", 7.34, "acid", "Acidemia"], ["ph", 7.35, "reference"], ["ph", 7.45, "reference"], ["ph", 7.46, "alkaline", "Alcalemia"],
        ["paco2", 34, "alkaline"], ["paco2", 35, "reference"], ["paco2", 45, "reference"], ["paco2", 46, "acid"],
        ["hco3", 21, "acid"], ["hco3", 22, "reference"], ["hco3", 26, "reference"], ["hco3", 27, "alkaline"],
        ["pao2", 79, "attention"], ["pao2", 80, "reference"], ["pao2", 100, "reference"], ["pao2", 101, "attention"],
        ["be", -3, "acid"], ["be", -2, "reference"], ["be", 0, "reference"], ["be", 2, "reference"], ["be", 3, "alkaline"],
        ["sato2", 95, "attention"], ["sato2", 95.1, "reference"], ["sato2", 100, "reference"]
    ];
    for (const [id, value, tone, label] of boundaries) {
        await ui.calculate({ ...normal, [id]: value });
        const row = ui.row(id);
        assert.equal(row.getAttribute("data-tone"), tone);
        assert.ok(row.children[1].children[1].textContent.length > 0);
        if (label) assert.equal(row.children[1].children[1].textContent, label);
        checks += 1;
    }
    await ui.calculate({ ph: 7.4, paco2: 40, hco3: 24 });
    for (const id of ["pao2", "be", "sato2"]) {
        assert.equal(ui.row(id).getAttribute("data-tone"), "neutral");
        assert.equal(ui.row(id).children[1].children[0].textContent, "Não informado");
        assert.equal(ui.row(id).children[1].children[1].textContent, "Opcional");
        checks += 1;
    }
    await ui.get("gasometria-form").emit("input");
    assert.equal(ui.get("resultado-gasometria").hidden, true);
    assert.equal(ui.get("resultado-gasometria").getAttribute("data-tone"), undefined);
    assert.equal(ui.get("resultado-details").children.length, 0);
    assert.equal(ui.get("resultado-status").textContent, "");
    checks += 1;
    await ui.calculate({ ph: "abc", paco2: 40, hco3: 24 });
    assert.equal(ui.get("form-error").hidden, false);
    assert.equal(ui.get("ph").getAttribute("aria-invalid"), "true");
    assert.equal(ui.get("resultado-gasometria").hidden, true);
    assert.equal(ui.get("resultado-details").children.length, 0);
    checks += 1;
    await ui.calculate(normal);
    await ui.get("gasometria-form").reset();
    ui.flush();
    assert.equal(ui.get("resultado-title").textContent, "");
    assert.equal(ui.get("resultado-status").textContent, "");
    assert.equal(ui.get("resultado-details").children.length, 0);
    assert.equal(ui.get("ph").value, "");
    assert.equal(ui.get("ph").getAttribute("aria-invalid"), undefined);
    assert.equal(ui.get("main-content").scrollTop, 0);
    checks += 1;

    const fit = harness({ height: 1400 });
    await fit.ready();
    assert.equal(fit.height(), 664);
    assert.equal(fit.get("calculator-shell").getBoundingClientRect().top, 0);
    checks += 1;
    await fit.calculate(normal);
    assert.equal(fit.height(), 1084);
    assert.equal(fit.get("calculator-shell").getBoundingClientRect().top, 0);
    assert.equal(fit.get("main-content").scrollTop, 0);
    checks += 1;
    await fit.get("btnAltura").emit("click");
    assert.equal(fit.height(), 542);
    assert.equal(fit.get("btnAltura").getAttribute("aria-pressed"), "true");
    assert.equal(fit.get("altura-label").textContent, "Altura completa");
    assert.equal(fit.get("ph").value, "7.4");
    assert.equal(fit.get("resultado-details").children.length, 6);
    checks += 1;
    await fit.get("btnAltura").emit("click");
    assert.equal(fit.height(), 1084);
    assert.equal(fit.get("btnAltura").getAttribute("aria-pressed"), "false");
    checks += 1;
    fit.window.innerHeight = 600; fit.window.events.get("resize")(); fit.flush();
    assert.equal(fit.height(), 600);
    assert.equal(fit.get("calculator-shell").getBoundingClientRect().top, 0);
    assert.equal(fit.get("ph").value, "7.4");
    checks += 1;
    fit.window.innerHeight = 310; fit.window.events.get("resize")(); fit.flush();
    assert.equal(fit.get("altura-label").textContent, "Compactar");
    await fit.get("btnAltura").emit("click");
    assert.equal(fit.height(), 240);
    checks += 1;
    const limited = harness();
    await limited.ready();
    await limited.calculate(normal);
    assert.equal(limited.height(), 760);
    assert.ok(limited.get("main-content").scrollTop > 0);
    assert.equal(limited.get("calculator-shell").getBoundingClientRect().top, 0);
    checks += 1;
    await fit.get("gasometria-form").reset(); fit.flush();
    assert.equal(fit.get("resultado-gasometria").hidden, true);
    fit.window.innerHeight = 1400; fit.window.events.get("resize")(); fit.flush();
    await fit.get("btnAltura").emit("click");
    assert.equal(fit.height(), 664);
    checks += 1;
    await fit.get("btnReferencias").emit("click");
    assert.equal(fit.get("referencias").hidden, false);
    assert.equal(fit.get("btnReferencias").getAttribute("aria-expanded"), "true");
    assert.ok(fit.height() > 664);
    const referencesSummary = fit.get("references-summary");
    fit.get("referencias").append(referencesSummary);
    referencesSummary.focus();
    fit.get("referencias").open = false;
    await fit.get("referencias").emit("toggle"); fit.flush();
    assert.equal(fit.get("btnReferencias").getAttribute("aria-expanded"), "false");
    assert.equal(fit.document.activeElement, fit.get("btnReferencias"));
    await fit.get("btnReferencias").emit("click");
    assert.equal(fit.get("referencias").open, true);
    checks += 1;
    const native = harness();
    await native.ready(); await native.calculate(normal);
    native.message({ type: "gasometria:panel-closed", windowId: 41 }, { id: "other" });
    assert.equal(native.get("ph").value, "7.4");
    native.message({ type: "gasometria:panel-closed", windowId: 42 });
    assert.equal(native.get("ph").value, "7.4");
    checks += 1;
    assert.deepEqual(native.message({ type: "gasometria:panel-closed", windowId: 41 }), { ok: true });
    assert.equal(native.get("ph").value, "");
    assert.equal(native.get("resultado-gasometria").hidden, true);
    assert.equal(native.get("ph").disabled, true);
    assert.equal(native.get("btnCalcular").disabled, true);
    assert.equal(native.get("calculator-shell").getAttribute("data-access"), "locked");
    assert.equal(native.height(), 664);
    checks += 1;

    native.setPremium(false);
    native.window.events.get("focus")();
    await native.ready();
    assert.equal(native.get("ph").disabled, true);
    assert.equal(native.get("calculator-shell").getAttribute("data-access"), "locked");
    assert.ok(native.get("premium-access-status").textContent.includes("Free"));
    checks += 1;
    await native.calculate(normal);
    await native.get("btnFechar").emit("click"); native.flush();
    assert.deepEqual(native.closes.at(-1), { windowId: 41 });
    assert.equal(native.get("ph").value, "");
    checks += 1;
    native.document.events.get("keydown")({ key: "Escape", preventDefault() {} });
    await native.ready();
    assert.equal(native.closes.length, 2);
    checks += 1;
    const rejected = harness({ rejectClose: true });
    await rejected.get("btnFechar").emit("click");
    assert.equal(rejected.get("view-feedback").hidden, false);
    assert.ok(rejected.get("view-feedback").textContent.includes("Chrome"));
    checks += 1;
    const left = harness({ side: "left" }); await left.ready();
    assert.equal(left.get("panel-position-help").hidden, false);
    checks += 1;
    fit.observers[0].callback();
    fit.window.events.get("pagehide")();
    assert.equal(fit.frames.size, 0);
    assert.equal(fit.listeners.size, 0);
    assert.equal(fit.window.events.has("resize"), false);
    assert.equal(fit.window.events.has("focus"), false);
    assert.equal(fit.document.events.has("visibilitychange"), false);
    assert.ok(fit.observers.every(observer => observer.disconnected));
    checks += 1;

    const free = harness({ premium: false });
    await free.ready();
    assert.equal(free.get("ph").disabled, true);
    assert.equal(free.get("btnCalcular").disabled, true);
    assert.equal(free.get("btnLimpar").disabled, true);
    assert.equal(free.get("calculator-shell").getAttribute("data-access"), "locked");
    assert.ok(free.get("premium-access-status").textContent.includes("Free"));
    await free.calculate(normal);
    assert.equal(free.get("resultado-gasometria").hidden, true);
    checks += 1;

    function luminance(hex) {
        const channels = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
            .map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
        return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    }
    for (const tone of ["reference", "acid", "alkaline", "attention", "neutral"]) {
        const rule = css.match(new RegExp('\\[data-tone="' + tone + '"\\] \\{([^}]+)\\}'))[1];
        const background = luminance(rule.match(/--tone-bg:\s*(#[a-f0-9]{6})/i)[1]);
        const text = luminance(rule.match(/--tone-text:\s*(#[a-f0-9]{6})/i)[1]);
        assert.ok((Math.max(background, text) + 0.05) / (Math.min(background, text) + 0.05) >= 4.5, tone);
        checks += 1;
    }
    return checks;
};
