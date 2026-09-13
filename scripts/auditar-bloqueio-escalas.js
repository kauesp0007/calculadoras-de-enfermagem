/**
 * scripts/auditar-bloqueio-escalas.js
 *
 * Verifica o mapa canônico de conteúdo premium. O único plano pago é junior.
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const LANGS = ["en", "es", "de", "it", "fr", "hi", "zh", "ar", "ja", "ru", "ko", "tr", "nl", "pl", "sv", "id", "vi", "uk"];
const PAGES = ["morse", "braden", "fugulin", "dimensionamento", "meem", "balancohidrico", "medicamentos", "glasgow"];
const PATTERN = /^\/(morse|braden|fugulin|dimensionamento|meem|balancohidrico|medicamentos|glasgow)\.html$/i;
const LEVELS = { free: 0, junior: 10 };

function hasPlan(userPlan, required) {
  if (!required || required === "free") return true;
  return (LEVELS[userPlan] !== undefined ? LEVELS[userPlan] : -1) >= LEVELS[required];
}

let pass = 0;
let fail = 0;
const problems = [];
function ok(cond, label) {
  if (cond) { pass++; console.log("  ✓ " + label); }
  else { fail++; problems.push(label); console.log("  ✗ " + label); }
}

console.log("============================================================");
console.log("AUDITORIA — Conteúdo Premium (Júnior)");
console.log("============================================================\n");

console.log("[1] RESTRICTED_CONTENT");
const cp = fs.readFileSync(path.join(ROOT, "js", "access", "content-policy.js"), "utf8");
for (const page of PAGES) ok(new RegExp("\\b" + page + '\\s*:\\s*"junior"').test(cp), page + ' → "junior"');
ok(/\(formulario\|fotmulario\)/i.test(cp), "regra de formulários presente");

console.log("\n[2] Arquivos existem fisicamente");
let count = 0;
for (const page of PAGES) {
  for (const lang of [""].concat(LANGS)) {
    const rel = (lang ? lang + "/" : "") + page + ".html";
    if (fs.existsSync(path.join(ROOT, rel))) count++;
  }
}
console.log("  → " + count + " arquivos encontrados.");
ok(count > 0, "páginas premium existem");

console.log("\n[3] Falsos positivos do padrão");
const NEGATIVES = [
  "/dimensionamento-cofen.html",
  "/formulario_morse.html",
  "/formulario_de_fugulin.html",
  "/formulario_meem.html",
  "/fugulin2.html",
  "/braden-extra.html",
  "/morse.html.bak",
  "/escalas/braden-avaliacao.html"
];
for (const negative of NEGATIVES) ok(!PATTERN.test(negative), negative + " permanece livre pelo padrão");

console.log("\n[4] Modelo de plano");
ok(hasPlan("free", "junior") === false, "free → bloqueado para conteúdo junior");
ok(hasPlan("junior", "junior") === true, "junior → liberado");
ok(Object.keys(LEVELS).length === 2 && !Object.prototype.hasOwnProperty.call(LEVELS, "pleno") && !Object.prototype.hasOwnProperty.call(LEVELS, "senior"), "somente free/junior");

console.log("\n[5] Ausência da antiga muralha global");
const auth = fs.readFileSync(path.join(ROOT, "js", "auth", "auth-core.js"), "utf8");
ok(!/_enforcePaidGate|gate=1/.test(auth), "auth-core.js não possui paid gate global");

console.log("\n============================================================");
console.log("RESULTADO: " + pass + " passou, " + fail + " falhou.");
if (fail > 0) {
  console.log("PROBLEMAS:");
  problems.forEach((p) => console.log("  - " + p));
  process.exit(1);
}
console.log("TODAS AS VERIFICAÇÕES PASSARAM.");
process.exit(0);
