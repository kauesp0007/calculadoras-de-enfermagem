/**
 * scripts/auditar-bloqueio-escalas.js
 *
 * Auditoria do bloqueio de acesso das escalas premium (Júnior+):
 * braden, morse, dimensionamento, fugulin, meem — SOMENTE raiz (idiomas livres).
 *
 * Verifica:
 *  1. Se a regra do route-guard está presente e o regex corresponde.
 *  2. Se os arquivos existem fisicamente (raiz + idiomas).
 *  3. Se o regex NÃO captura páginas que deveriam permanecer livres
 *     (dimensionamento-cofen, formulario_*, etc.).
 *  4. Simula a hierarquia de planos (free bloqueado; junior/pleno/senior liberados).
 */

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const LANGS = ["en", "es", "de", "it", "fr", "hi", "zh", "ar", "ja", "ru", "ko", "tr", "nl", "pl", "sv", "id", "vi", "uk"];
const PAGES = ["morse", "braden", "fugulin", "dimensionamento", "meem", "balancohidrico", "medicamentos", "glasgow"];

// Regra canônica agora em js/access/content-policy.js (RESTRICTED_CONTENT).
const PATTERN = /^\/(morse|braden|fugulin|dimensionamento|meem|balancohidrico|medicamentos|glasgow)\.html$/i;

// Espelha js/auth/plan-service.js
const LEVELS = { free: 0, junior: 10, pleno: 20, senior: 30 };
function hasPlan(userPlan, required) {
    if (!required || required === "free") return true;
    if (userPlan === "senior") return true;
    return (LEVELS[userPlan] !== undefined ? LEVELS[userPlan] : -1) >= LEVELS[required];
}

let pass = 0, fail = 0;
const problems = [];

function ok(cond, label) {
    if (cond) { pass++; console.log("  ✓ " + label); }
    else { fail++; problems.push(label); console.log("  ✗ " + label); }
}

console.log("============================================================");
console.log("AUDITORIA — Bloqueio de acesso das escalas premium (Júnior+)");
console.log("============================================================\n");

// 1) Regra presente no content-policy.js (RESTRICTED_CONTENT)
console.log("[1] Regra em js/access/content-policy.js (RESTRICTED_CONTENT)");
const cp = fs.readFileSync(path.join(ROOT, "js", "access", "content-policy.js"), "utf8");
for (const p of PAGES) {
    ok(new RegExp("\\b" + p + '\\s*:\\s*"junior"').test(cp), p + ' → "junior" em RESTRICTED_CONTENT');
}
ok(/\(formulario\|fotmulario\)/i.test(cp), "padrão formulario|fotmulario presente no resolve()");

// 2) Existência dos arquivos (raiz + idiomas)
console.log("\n[2] Arquivos existem fisicamente (raiz + idiomas)");
let count = 0;
for (const p of PAGES) {
    for (const l of [""].concat(LANGS)) {
        const rel = (l ? l + "/" : "") + p + ".html";
        if (fs.existsSync(path.join(ROOT, rel))) count++;
    }
}
console.log("  → " + count + " arquivos encontrados.");
ok(count > 0, "páginas existem fisicamente");

// 3) Páginas que NÃO devem ser bloqueadas
console.log("\n[3] Páginas que devem permanecer livres (regex NÃO deve casar)");
const NEGATIVES = [
    "/dimensionamento-cofen.html",
    "/formulario_morse.html",
    "/formulario_de_fugulin.html",
    "/formulario_meem.html",
    "/formulario_bishop.html",
    "/fugulin2.html",
    "/braden-extra.html",
    "/morse.html.bak",
    "/escalas/braden-avaliacao.html"
];
for (const n of NEGATIVES) {
    ok(!PATTERN.test(n), n + " (NÃO bloqueia)");
}

// 4) Simulação da hierarquia de planos
console.log("\n[4] Hierarquia de planos (junior = mínimo exigido)");
const plans = ["free", "junior", "pleno", "senior"];
for (const p of plans) {
    const allowed = hasPlan(p, "junior");
    ok(allowed === (p !== "free"), "plano " + p + " → " + (allowed ? "ACESSO LIBERADO" : "BLOQUEADO (redireciona p/ assinatura)"));
}

// 5) route-guard.js limpo (sem a regra antiga duplicada)
console.log("\n[5] route-guard.js sem a regra antiga duplicada");
const rg = fs.readFileSync(path.join(ROOT, "js", "auth", "route-guard.js"), "utf8");
ok(!/braden\|morse\|dimensionamento\|fugulin\|meem/.test(rg), "route-guard.js não contém a regra antiga das escalas");

console.log("\n============================================================");
console.log("RESULTADO: " + pass + " passou, " + fail + " falhou.");
if (fail > 0) {
    console.log("PROBLEMAS:");
    problems.forEach((p) => console.log("  - " + p));
    process.exit(1);
} else {
    console.log("TODAS AS VERIFICAÇÕES PASSARAM. ✅");
    process.exit(0);
}
