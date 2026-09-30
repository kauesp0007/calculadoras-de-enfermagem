"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

module.exports = async function testRuntime() {
    const worker = fs.readFileSync(path.join(__dirname, "../service-worker.js"), "utf8");
    const content = fs.readFileSync(path.join(__dirname, "../content-script.js"), "utf8");
    let checks = 0;
    const id = "abcdefghijklmnopabcdefghijklmnop";
    const token = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

    function workerHarness(outcome = "ready") {
        let click, listener;
        const injected = [], windows = [], forwarded = [];
        const chrome = {
            action: {
                onClicked: { addListener(fn) { click = fn; } },
                async setBadgeText() {}, async setTitle() {}
            },
            scripting: { async executeScript(args) {
                injected.push(args);
                if (outcome === "error") throw new Error("restricted");
                return [{ result: { status: outcome } }];
            }},
            windows: { async create(args) { windows.push(args); } },
            runtime: { id, getURL(file) { return "chrome-extension://" + id + "/" + file; }, onMessage: { addListener(fn) { listener = fn; } } },
            tabs: { async sendMessage(tab, message, options) { forwarded.push({ tab, message, options }); } }
        };
        new Function("chrome", worker)(chrome);
        return { click, listener, injected, windows, forwarded };
    }
    for (const [outcome, windowCount] of [["ready", 0], ["closed", 0], ["fallback", 1], ["error", 1]]) {
        const h = workerHarness(outcome);
        await h.click({ id: 1, url: "https://example.com/" });
        assert.equal(h.windows.length, windowCount);
        assert.equal(h.injected.length, 1);
        assert.deepEqual(h.injected[0].target.frameIds, [0]);
        checks += 1;
    }
    for (const url of ["chrome://extensions/", "file:///example.pdf", "about:blank", ""]) {
        const h = workerHarness();
        await h.click({ id: 1, url });
        assert.equal(h.injected.length, 0);
        assert.equal(h.windows.length, 1);
        assert.ok(h.windows[0].url.endsWith("/calculator.html"));
        checks += 1;
    }
    const h = workerHarness();
    const goodSender = {
        id, tab: { id: 9 }, frameId: 3,
        url: "chrome-extension://" + id + "/calculator.html?session=" + token + "#embedded"
    };
    const message = { type: "gasometria:close", session: token };
    for (const sender of [
        { ...goodSender, id: "other" },
        { ...goodSender, frameId: 0 },
        { ...goodSender, tab: undefined },
        { ...goodSender, url: "https://example.com/calculator.html?session=" + token + "#embedded" },
        { ...goodSender, url: "chrome-extension://other/calculator.html?session=" + token + "#embedded" },
        { ...goodSender, url: "chrome-extension://" + id + "/other.html?session=" + token + "#embedded" },
        { ...goodSender, url: "chrome-extension://" + id + "/calculator.html?session=wrong#embedded" }
    ]) {
        assert.equal(h.listener(message, sender, () => {}), false);
        checks += 1;
    }
    assert.equal(h.forwarded.length, 0);
    let reply;
    assert.equal(h.listener(message, goodSender, value => { reply = value; }), true);
    await Promise.resolve(); await Promise.resolve();
    assert.equal(h.forwarded.length, 1);
    assert.deepEqual(h.forwarded[0], { tab: 9, message, options: { frameId: 0 } });
    assert.deepEqual(reply, { ok: true });
    checks += 1;
    assert.equal(h.listener({ type: "arbitrary", session: token }, goodSender, () => {}), false);
    checks += 1;

    // DOM mínimo: verifica ciclo de vida, não substitui renderização real no Chrome.
    function contentHarness() {
        const root = {};
        const hosts = [];
        const listeners = new Set();
        const events = new Map();
        const timers = new Map();
        let restored = 0, nextTimer = 0;
        const previous = { isConnected: true, focus() { restored += 1; } };
        function element() {
            return {
                style: { setProperty() {} }, setAttribute() {}, title: "", src: "",
                attachShadow() { return { appendChild(child) { this.child = child; } }; },
                focus() {}, remove() { const index = hosts.indexOf(this); if (index >= 0) hosts.splice(index, 1); }
            };
        }
        const document = {
            activeElement: previous, getElementById() { return null; }, createElement: element,
            body: { appendChild(el) { hosts.push(el); } }
        };
        const window = {
            innerWidth: 1280, innerHeight: 720,
            addEventListener(name, fn) { events.set(name, fn); },
            removeEventListener(name, fn) { if (events.get(name) === fn) events.delete(name); }
        };
        const chrome = {
            runtime: { id, getURL(file) { return "chrome-extension://" + id + "/" + file; },
                onMessage: { addListener(fn) { listeners.add(fn); }, removeListener(fn) { listeners.delete(fn); } } }
        };
        const args = [
            root, document, window, chrome, { randomUUID() { return token; } },
            () => 1, () => {}, (fn) => { const key = ++nextTimer; timers.set(key, fn); return key; },
            (key) => timers.delete(key)
        ];
        const execute = new Function("globalThis", "document", "window", "chrome", "crypto",
            "requestAnimationFrame", "cancelAnimationFrame", "setTimeout", "clearTimeout", "return (\n" + content.replace(/;\s*$/, "") + "\n);");
        return { hosts, listeners, events, timers, run: () => execute(...args),
            restored: () => restored, root };
    }
    const ch = contentHarness();
    for (let index = 0; index < 20; index += 1) {
        const opening = ch.run();
        assert.equal(ch.hosts.length, 1);
        const ready = [...ch.listeners][0];
        ready({ type: "gasometria:ready", session: token }, { id }, () => {});
        assert.deepEqual(await opening, { status: "ready" });
        assert.deepEqual(ch.run(), { status: "closed" });
        assert.equal(ch.hosts.length, 0);
        assert.equal(ch.listeners.size, 0);
        assert.equal(ch.events.size, 0);
        assert.equal(ch.timers.size, 0);
        checks += 1;
    }
    assert.equal(ch.restored(), 20);
    const timeoutHarness = contentHarness();
    const opening = timeoutHarness.run();
    [...timeoutHarness.timers.values()][0]();
    assert.deepEqual(await opening, { status: "fallback" });
    assert.equal(timeoutHarness.hosts.length, 0);
    assert.equal(timeoutHarness.listeners.size, 0);
    checks += 1;
    return checks;
};
