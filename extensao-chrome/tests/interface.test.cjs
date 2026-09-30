"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Gasometria = require("../gasometria-core.js");

module.exports = async function testInterface() {
    const code = fs.readFileSync(path.join(__dirname, "../calculator.js"), "utf8");
    const css = fs.readFileSync(path.join(__dirname, "../calculator.css"), "utf8");
    let checks = 0;
    const token = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

    // DOM simulado: exerce os handlers da interface real, sem reproduzir os cálculos.
    function harness(options = {}) {
        class Element {
            constructor() {
                this.children = []; this.attributes = new Map(); this.events = new Map();
                this.value = ""; this.hidden = false; this._text = ""; this.scrollTop = 0;
                const classes = new Set();
                this.classList = {
                    toggle(name, enabled) { if (enabled) classes.add(name); else classes.delete(name); },
                    contains(name) { return classes.has(name); }
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
            focus() { this.focused = true; }
            scrollIntoView() { this.scrolled = true; }
            async emit(name) { await this.events.get(name)?.({ preventDefault() {} }); }
        }
        const elements = new Map();
        const get = (id) => {
            if (!elements.has(id)) elements.set(id, new Element());
            return elements.get(id);
        };
        const messages = [], updates = [];
        const window = {
            innerHeight: options.height || 760, outerHeight: 800, screen: { availHeight: 1000 },
            events: new Map(), addEventListener(name, fn) { this.events.set(name, fn); }, close() {}
        };
        const current = { id: 41, type: options.windowType || "popup", height: 800 };
        const chrome = {
            runtime: { id: "own-extension", async sendMessage(message) {
                messages.push(message);
                return { ok: !options.rejectView || message.type !== "gasometria:view" };
            }},
            windows: {
                async getCurrent() { return { ...current }; },
                async update(id, update) {
                    updates.push({ id, ...update }); current.height = update.height;
                    window.innerHeight = update.height - 40;
                }
            }
        };
        const document = { getElementById: get, createElement: () => new Element(), body: new Element(), addEventListener() {} };
        get("gasometria-form").reset = async () => {
            Gasometria.FIELDS.forEach(field => { get(field.id).value = ""; });
            await get("gasometria-form").emit("reset");
        };
        new Function("document", "location", "window", "chrome", "Gasometria", "requestAnimationFrame", code)(
            document, { hash: options.embedded ? "#embedded" : "", search: "?session=" + token },
            window, chrome, Gasometria, fn => fn()
        );
        return { get, document, window, messages, updates,
            async calculate(values) {
                Gasometria.FIELDS.forEach(field => { get(field.id).value = values[field.id] === undefined ? "" : String(values[field.id]); });
                await get("gasometria-form").emit("submit");
            },
            row(id) { return get("resultado-details").children.find(row => row.getAttribute("data-parameter") === id); }
        };
    }

    const ui = harness();
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
    assert.equal(ui.get("resultado-title").textContent, "");
    assert.equal(ui.get("resultado-status").textContent, "");
    assert.equal(ui.get("resultado-details").children.length, 0);
    assert.equal(ui.get("ph").value, "");
    assert.equal(ui.get("ph").getAttribute("aria-invalid"), undefined);
    assert.equal(ui.get("main-content").scrollTop, 0);
    checks += 1;

    const embedded = harness({ embedded: true });
    await embedded.calculate(normal);
    assert.deepEqual(embedded.messages[0], { type: "gasometria:ready", session: token });
    await embedded.get("btnAltura").emit("click");
    assert.deepEqual(embedded.messages.at(-1), { type: "gasometria:view", session: token, mode: "compact" });
    assert.equal(embedded.get("btnAltura").getAttribute("aria-pressed"), "true");
    assert.equal(embedded.get("altura-label").textContent, "Altura completa");
    assert.equal(embedded.get("ph").value, "7.4");
    assert.equal(embedded.get("resultado-details").children.length, 6);
    checks += 1;
    await embedded.get("btnAltura").emit("click");
    assert.equal(embedded.messages.at(-1).mode, "full");
    assert.equal(embedded.get("btnAltura").getAttribute("aria-pressed"), "false");
    assert.ok(embedded.messages.every(message => Object.keys(message).every(key => ["type", "session", "mode"].includes(key))));
    checks += 1;
    embedded.window.innerHeight = 310; embedded.window.events.get("resize")();
    assert.equal(embedded.get("altura-label").textContent, "Compactar");
    assert.ok(embedded.get("btnAltura").title.includes("240"));
    checks += 1;
    const denied = harness({ embedded: true, rejectView: true });
    await denied.get("btnAltura").emit("click");
    assert.equal(denied.get("btnAltura").getAttribute("aria-pressed"), "false");
    assert.equal(denied.get("btnAltura").disabled, false);
    assert.equal(denied.get("view-feedback").hidden, false);
    checks += 1;
    await ui.calculate(normal);
    await ui.get("btnAltura").emit("click");
    assert.deepEqual(ui.updates.at(-1), { id: 41, height: 420 });
    assert.equal(ui.get("ph").value, "7.4");
    assert.equal(ui.get("resultado-gasometria").hidden, false);
    await ui.get("btnAltura").emit("click");
    assert.deepEqual(ui.updates.at(-1), { id: 41, height: 800 });
    checks += 1;
    const ordinaryWindow = harness({ windowType: "normal" });
    await ordinaryWindow.get("btnAltura").emit("click");
    assert.equal(ordinaryWindow.updates.length, 0);
    assert.equal(ordinaryWindow.document.body.classList.contains("page-compact"), true);
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
