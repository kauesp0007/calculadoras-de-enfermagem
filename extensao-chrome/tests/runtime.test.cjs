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
            tabs: { async sendMessage(tab, message, options) { forwarded.push({ tab, message, options }); return { ok: true }; } }
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
        assert.equal(h.windows[0].width, 414);
        assert.equal(h.windows[0].height, 800);
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
    for (const mode of [undefined, "large", "compact<script>"]) {
        assert.equal(h.listener({ type: "gasometria:view", session: token, mode }, goodSender, () => {}), false);
        checks += 1;
    }
    for (const mode of ["compact", "full"]) {
        assert.equal(h.listener({ type: "gasometria:view", session: token, mode, ph: 7.4 }, goodSender, () => {}), true);
        await Promise.resolve(); await Promise.resolve();
        assert.deepEqual(h.forwarded.at(-1).message, { type: "gasometria:view", session: token, mode });
        checks += 1;
    }
    const fallbackMessage = { type: "gasometria:fallback", session: token };
    const fallbackSender = { id, tab: { id: 9 }, frameId: 0, url: "https://example.com/" };
    for (const invalidSender of [
        { ...fallbackSender, id: "other" }, { ...fallbackSender, tab: undefined },
        { ...fallbackSender, frameId: 1 }, { ...fallbackSender, url: "chrome://extensions/" },
        { ...fallbackSender, url: goodSender.url }
    ]) {
        assert.equal(h.listener(fallbackMessage, invalidSender, () => {}), false);
        checks += 1;
    }
    assert.equal(h.listener({ ...fallbackMessage, session: "wrong" }, fallbackSender, () => {}), false);
    assert.equal(h.windows.length, 0);
    checks += 1;
    assert.equal(h.listener(fallbackMessage, fallbackSender, () => {}), true);
    await Promise.resolve(); await Promise.resolve();
    assert.equal(h.windows.length, 1);
    checks += 1;

    // DOM mínimo: verifica ciclo de vida, não substitui renderização real no Chrome.
    function contentHarness(options = {}) {
        const root = {};
        const hosts = [];
        const listeners = new Set();
        const events = new Map();
        const timers = new Map();
        const frames = new Map();
        const observers = [];
        const messages = [];
        const bars = new Map(Object.entries(options.bars || {}));
        let restored = 0, nextTimer = 0;
        const previous = { isConnected: true, focus() { restored += 1; } };
        function element() {
            const styles = new Map();
            return {
                style: { setProperty(name, value) { styles.set(name, value); }, getPropertyValue(name) { return styles.get(name); } },
                setAttribute() {}, title: "", src: "",
                attachShadow() { return { appendChild(child) { this.child = child; } }; },
                focus() {}, remove() { const index = hosts.indexOf(this); if (index >= 0) hosts.splice(index, 1); }
            };
        }
        const document = {
            activeElement: previous, getElementById(id) { return bars.get(id); }, createElement: element,
            body: { appendChild(el) { hosts.push(el); } }
        };
        const window = {
            innerWidth: options.width || 1280, innerHeight: options.height || 720,
            addEventListener(name, fn) { events.set(name, fn); },
            removeEventListener(name, fn) { if (events.get(name) === fn) events.delete(name); }
        };
        const chrome = {
            runtime: { id, getURL(file) { return "chrome-extension://" + id + "/" + file; },
                async sendMessage(message) { messages.push(message); return { ok: true }; },
                onMessage: { addListener(fn) { listeners.add(fn); }, removeListener(fn) { listeners.delete(fn); } } }
        };
        class Observer {
            constructor(callback) { this.callback = callback; this.targets = new Set(); observers.push(this); }
            observe(target) { this.targets.add(target); }
            unobserve(target) { this.targets.delete(target); }
            disconnect() { this.targets.clear(); this.disconnected = true; }
        }
        const args = [
            root, document, window, chrome, { randomUUID() { return token; } },
            (fn) => { const key = ++nextTimer; frames.set(key, fn); return key; },
            (key) => frames.delete(key), (fn) => { const key = ++nextTimer; timers.set(key, fn); return key; },
            (key) => timers.delete(key), Observer, Observer
        ];
        const execute = new Function("globalThis", "document", "window", "chrome", "crypto",
            "requestAnimationFrame", "cancelAnimationFrame", "setTimeout", "clearTimeout", "ResizeObserver", "MutationObserver",
            "return (\n" + content.replace(/;\s*$/, "") + "\n);");
        return { hosts, listeners, events, timers, run: () => execute(...args),
            restored: () => restored, root, window, bars, observers, frames, messages,
            flush() { const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn()); },
            send(message, sender = { id }) {
                let response;
                [...listeners][0]({ session: token, ...message }, sender, value => { response = value; });
                return response;
            }
        };
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
        assert.equal(ch.frames.size, 0);
        assert.ok(ch.observers.every(observer => observer.disconnected && observer.targets.size === 0));
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

    const geometry = contentHarness({ height: 1000, bars: {
        barraAcessibilidade: { getBoundingClientRect: () => ({ top: 0, bottom: 40, width: 1280, height: 40 }) },
        "global-header-container": { getBoundingClientRect: () => ({ top: 40, bottom: 120, width: 1280, height: 80 }) }
    }});
    const opened = geometry.run();
    const style = geometry.hosts[0].style;
    geometry.send({ type: "gasometria:ready" });
    assert.deepEqual(await opened, { status: "ready" });
    assert.equal(style.getPropertyValue("position"), "fixed");
    assert.equal(style.getPropertyValue("right"), "12px");
    assert.equal(style.getPropertyValue("width"), "390px");
    assert.equal(style.getPropertyValue("top"), "132px");
    assert.equal(style.getPropertyValue("height"), "856px");
    checks += 1;
    assert.equal(geometry.events.has("scroll"), false);
    assert.equal(geometry.send({ type: "gasometria:view", mode: "compact" }).ok, true);
    assert.equal(style.getPropertyValue("height"), "428px");
    assert.equal(style.getPropertyValue("top"), "132px");
    checks += 1;
    for (const invalid of [
        { message: { type: "gasometria:view", mode: "full", session: "wrong" } },
        { message: { type: "gasometria:view", mode: "full" }, sender: { id: "other" } },
        { message: { type: "gasometria:view", mode: "unsupported" } }
    ]) {
        assert.equal(geometry.send(invalid.message, invalid.sender), undefined);
        assert.equal(style.getPropertyValue("height"), "428px");
        checks += 1;
    }
    geometry.send({ type: "gasometria:view", mode: "full" });
    assert.equal(style.getPropertyValue("height"), "856px");
    checks += 1;
    geometry.window.innerWidth = 320;
    geometry.window.innerHeight = 480;
    geometry.events.get("resize")(); geometry.flush();
    assert.equal(style.getPropertyValue("width"), "296px");
    assert.equal(style.getPropertyValue("height"), "336px");
    assert.equal(style.getPropertyValue("top"), "132px");
    geometry.send({ type: "gasometria:view", mode: "compact" });
    assert.equal(style.getPropertyValue("height"), "240px");
    checks += 1;
    geometry.bars.set("language-selector-placeholder", { getBoundingClientRect: () => ({ top: 120, bottom: 150, width: 320, height: 30 }) });
    geometry.observers[1].callback(); geometry.flush();
    assert.equal(style.getPropertyValue("top"), "162px");
    assert.equal(geometry.observers[0].targets.size, 3);
    checks += 1;
    geometry.bars.get("global-header-container").getBoundingClientRect = () => ({ top: 40, bottom: 180, width: 320, height: 140 });
    geometry.observers[0].callback(); geometry.flush();
    assert.equal(style.getPropertyValue("top"), "192px");
    checks += 1;
    geometry.window.innerHeight = 360;
    geometry.events.get("resize")(); geometry.flush();
    assert.equal(geometry.hosts.length, 0);
    assert.deepEqual(geometry.messages, [fallbackMessage]);
    assert.equal(geometry.events.size, 0);
    checks += 1;
    geometry.observers[0].callback();
    assert.equal(geometry.frames.size, 0);
    assert.ok(geometry.observers.every(observer => observer.disconnected));
    assert.equal(geometry.messages.length, 1);
    checks += 1;
    const tooShort = contentHarness({ height: 200 });
    assert.deepEqual(await tooShort.run(), { status: "fallback" });
    assert.equal(tooShort.hosts.length, 0);
    assert.equal(tooShort.listeners.size, 0);
    assert.equal(tooShort.events.size, 0);
    assert.equal(tooShort.timers.size, 0);
    assert.equal(tooShort.messages.length, 0);
    assert.ok(tooShort.observers.every(observer => observer.disconnected));
    checks += 1;
    return checks;
};
