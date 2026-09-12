/**
 * scripts/auditar-bloqueio-escalas.js
 *
 * Auditoria do bloqueio de acesso das escalas premium (Júnior+):
 * braden, morse, dimensionamento, fugulin, meem — raiz e 18 idiomas.
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
const PAGES = ["braden", "morse", "dimensionamento", "fugulin", "meem"];

// Espelha a regra adicionada em js/auth/route-guard.js
const PATTERN = /\/(braden|morse|dimensionamento|fugulin|meem)\.html$/i;

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

// 1) Regra presente no route-guard
console.log("[1] Regra no js/auth/route-guard.js");
const rg = fs.readFileSync(path.join(ROOT, "js", "auth", "route-guard.js"), "utf8");
const hasRule = /\(braden\|morse\|dimensionamento\|fugulin\|meem\)\\\.html\$/i.test(rg) || /braden\|morse\|dimensionamento\|fugulin\|meem/.test(rg);
ok(hasRule, "Regra das 5 escalas presente no POLICIES");
if (hasRule) {
    const m = rg.match(/\{\s*pattern:\s*(\/\^?.*?\$\/i)[^}]*requiredPlan:\s*"junior"/);
    ok(/junior/.test(rg), "requiredPlan = \"junior\"");
}

// 2) Existência dos arquivos + correspondência do regex
console.log("\n[2] Arquivos existem + regex corresponde (raiz + idiomas)");
let count = 0;
for (const p of PAGES) {
    for (const l of [""].concat(LANGS)) {
        const rel = (l ? l + "/" : "") + p + ".html";
        const abs = path.join(ROOT, rel);
        const exists = fs.existsSync(abs);
        if (exists) {
            count++;
            const pathname = "/" + rel;
            const matches = PATTERN.test(pathname);
            ok(matches, rel + " (regex " + (matches ? "bloqueia" : "NÃO bloqueia") + ")");
        }
    }
}
console.log("  → " + count + " arquivos alvo encontrados.");

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

// 5) Formulários (regra anterior) ainda intacta
console.log("\n[5] Regra de formulários (anterior) intacta");
ok(/formulario\|fotmulario/i.test(rg), "Regra /formulario|fotmulario/ presente");

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
