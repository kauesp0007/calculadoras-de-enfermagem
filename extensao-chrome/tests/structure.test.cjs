"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

module.exports = function testStructure() {
    const base = path.resolve(__dirname, "..");
    const read = (file) => fs.readFileSync(path.join(base, file), "utf8");
    const manifest = JSON.parse(read("manifest.json"));
    const html = read("calculator.html");
    let checks = 0;
    function check(fn) { fn(); checks += 1; }

    check(() => assert.equal(manifest.name, "calculadora de gasometria arterial"));
    check(() => assert.equal(manifest.manifest_version, 3));
    check(() => assert.deepEqual(manifest.permissions, ["activeTab", "scripting"]));
    check(() => assert.equal(manifest.action.default_popup, undefined));
    check(() => assert.equal(manifest.host_permissions, undefined));
    check(() => assert.deepEqual(manifest.web_accessible_resources[0].resources, ["calculator.html"]));
    check(() => assert.ok(manifest.content_security_policy.extension_pages.includes("connect-src 'none'")));
    check(() => assert.equal((html.match(/<input\b/g) || []).length, 6));
    check(() => assert.deepEqual([...html.matchAll(/<input\b[^>]*\bid="([^"]+)"/g)].map(m => m[1]), ["ph", "paco2", "hco3", "pao2", "be", "sato2"]));
    check(() => assert.ok(html.indexOf('id="btnLimpar"') < html.indexOf('id="resultado-gasometria"')));
    check(() => assert.ok(html.includes('href="https://www.calculadorasdeenfermagem.com.br/"')));
    check(() => assert.ok(!/\bon(?:click|load|submit|error)=/i.test(html)));
    check(() => assert.ok([...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].every(match => /\bsrc=/.test(match[1]) && match[2].trim() === "")));
    for (const file of ["gasometria-core.js", "calculator.js", "service-worker.js", "content-script.js"]) {
        check(() => { new Function(read(file)); });
    }
    check(() => assert.ok(!/\b(?:fetch|XMLHttpRequest|localStorage|sessionStorage|indexedDB)\b/.test(read("calculator.js") + read("gasometria-core.js"))));
    check(() => assert.ok(!/innerHTML|document\.write/.test(read("calculator.js"))));
    for (const size of [16, 32, 48, 128]) {
        check(() => {
            const png = fs.readFileSync(path.join(base, manifest.icons[String(size)]));
            assert.deepEqual([...png.subarray(0, 8)], [137,80,78,71,13,10,26,10]);
            assert.equal(png.readUInt32BE(16), size);
            assert.equal(png.readUInt32BE(20), size);
        });
    }
    for (const font of ["inter-regular.woff2", "inter-700.woff2", "inter-900.woff2", "nunito-900.woff2"]) {
        check(() => assert.equal(fs.readFileSync(path.join(base, "fonts", font)).subarray(0, 4).toString("ascii"), "wOF2"));
    }
    return checks;
};
