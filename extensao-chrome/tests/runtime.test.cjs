"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

module.exports = async function testRuntime() {
    const worker = fs.readFileSync(path.join(__dirname, "../service-worker.js"), "utf8");
    let checks = 0;
    function harness(options = {}) {
        const behavior = [], titles = [], messages = [];
        let closed;
        const chrome = {
            sidePanel: {
                async setPanelBehavior(value) {
                    behavior.push(value);
                    if (options.rejectBehavior) throw new Error("unavailable");
                },
                onClosed: { addListener(fn) { closed = fn; } }
            },
            action: { async setTitle(value) { titles.push(value); } },
            runtime: { async sendMessage(value) {
                messages.push(value);
                if (options.noReceiver) throw new Error("no receiver");
            } }
        };
        new Function("chrome", worker)(chrome);
        return { behavior, titles, messages, close: id => closed({ windowId: id }) };
    }
    const h = harness();
    await Promise.resolve(); await Promise.resolve();
    assert.deepEqual(h.behavior, [{ openPanelOnActionClick: true }]);
    assert.equal(h.titles.length, 0);
    checks += 1;
    h.close(41);
    await Promise.resolve(); await Promise.resolve();
    assert.deepEqual(h.messages, [{ type: "gasometria:panel-closed", windowId: 41 }]);
    checks += 1;
    h.close(42);
    assert.deepEqual(h.messages.at(-1), { type: "gasometria:panel-closed", windowId: 42 });
    assert.ok(h.messages.every(value => Object.keys(value).every(key => ["type", "windowId"].includes(key))));
    checks += 1;
    const failed = harness({ rejectBehavior: true });
    await Promise.resolve(); await Promise.resolve();
    assert.equal(failed.titles.length, 1);
    assert.ok(failed.titles[0].title.includes("Recarregue"));
    checks += 1;
    const noReceiver = harness({ noReceiver: true });
    noReceiver.close(41);
    await Promise.resolve(); await Promise.resolve();
    assert.equal(noReceiver.messages.length, 1);
    checks += 1;
    return checks;
};
