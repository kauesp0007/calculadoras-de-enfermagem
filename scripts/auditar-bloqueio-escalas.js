/**
 * Auditoria canônica de conteúdo FREE/PREMIUM.
 *
 * Verifica:
 * - catálogo Premium atual;
 * - páginas root + 18 idiomas;
 * - shells públicos;
 * - ausência de redirecionamento direto para assinatura;
 * - isolamento dos guards legados;
 * - proteção de simulados e formulários.
 */
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const LANGS = ["en","es","de","it","fr","hi","zh","ar","ja","ru","ko","tr","nl","pl","sv","id","vi","uk"];

const EXACT_PREMIUM = new Set([
  "braden.html","fugulin.html","dimensionamento.html","perroca.html",
  "medicacao.html","medicamentos.html","meem.html","moca.html",
  "zarit.html","morse.html","elpo.html","glasgow.html",
  "balancohidrico.html","biblioteca-provas.html",
  "formularios-em-branco-de-escalas.html",
  "formularios_de_escalas_assistenciais.html"
]);

const EXACT_EXPECTED_EXISTING = [
  "braden.html","fugulin.html","dimensionamento.html","perroca.html",
  "medicamentos.html","meem.html","moca.html","zarit.html",
  "morse.html","elpo.html","glasgow.html","balancohidrico.html"
];

const SIMULADO_RE = /^simulado(?:[-_].*)?\.html$/i;
const FORM_RE = /^(?:formulario(?:[-_].*)?|fotmulario_.*)\.html$/i;

function fail(label) {
  problems.push(label);
  console.log("  ✗ " + label);
}

function pass(label) {
  checks++;
  console.log("  ✓ " + label);
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if ([
      ".git","node_modules","downloads","biblioteca","blog","blog-templates",
      "locales","fonts","public","img","automacoes","assets","css","font",
      "js","admin","src","dist",".vscode","institucionais"
    ].includes(entry.name)) continue;

    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(abs, out);
    else if (entry.isFile() && entry.name.toLowerCase().endsWith(".html")) {
      out.push(path.relative(ROOT, abs).split(path.sep).join("/"));
    }
  }
  return out;
}

function isPremium(rel) {
  const parts = rel.split("/");
  if (!(parts.length === 1 || (parts.length === 2 && LANGS.includes(parts[0])))) return false;
  const file = parts.at(-1).toLowerCase();
  return EXACT_PREMIUM.has(file) || SIMULADO_RE.test(file) || FORM_RE.test(file);
}

let checks = 0;
const problems = [];

const globalScripts = fs.readFileSync(path.join(ROOT, "global-scripts.js"), "utf8");
const policy = fs.readFileSync(path.join(ROOT, "js/access/content-policy.js"), "utf8");
const accessRouter = fs.readFileSync(path.join(ROOT, "js/access/access-router.js"), "utf8");
const routeGuard = fs.readFileSync(path.join(ROOT, "js/auth/route-guard.js"), "utf8");
const loader = fs.readFileSync(path.join(ROOT, "js/access/premium-content-loader.js"), "utf8");

for (const file of EXACT_EXPECTED_EXISTING) {
  if (fs.existsSync(path.join(ROOT, file))) pass(file + " existe");
  else fail(file + " está classificado como Premium mas não existe");
}

if (policy.includes('"balancohidrico":1')) pass("balancohidrico está no content-policy");
else fail("balancohidrico ausente do content-policy");

if (globalScripts.includes('"/balancohidrico.html":1')) pass("balancohidrico está no gate central");
else fail("balancohidrico ausente do gate central");

if (loader.includes("function canonicalPathKey()")) pass("loader possui fallback canônico por idioma");
else fail("loader sem fallback canônico por idioma");

if (loader.includes('res.status===404&&canonicalKey&&canonicalKey!==currentKey')) pass("loader tenta conteúdo localizado e depois raiz");
else fail("loader sem fallback localizado → raiz");

if (globalScripts.includes('if (!window.__IS_PREMIUM_ROUTE) {\n        bindAuthorization();\n        bindAccess();\n      }')) pass("global-scripts isola rotas Premium do access-router legado");
else fail("global-scripts ainda pode inicializar access-router em rota Premium");

if (globalScripts.includes('if (window.__IS_PREMIUM_ROUTE) {\n      return;\n    }')) pass("_setupAccess isola Premium");
else fail("_setupAccess sem isolamento Premium");

if (accessRouter.includes('if (window.__IS_PREMIUM_ROUTE === true) return true;')) pass("access-router possui defesa Premium");
else fail("access-router sem defesa Premium");

if (routeGuard.includes('if (window.__IS_PREMIUM_ROUTE === true) return true;')) pass("route-guard possui defesa Premium");
else fail("route-guard sem defesa Premium");

const gateStart = globalScripts.indexOf("function canEnter(forceCheck)");
const gateEnd = globalScripts.indexOf("window.__PREMIUM_PATHS", gateStart);
const gate = gateStart >= 0 && gateEnd > gateStart ? globalScripts.slice(gateStart, gateEnd) : "";
if (!/location\.(?:href|replace|assign)/i.test(gate) || !/assinatura\.html/i.test(gate)) {
  pass("gate Premium global não navega para assinatura");
} else {
  fail("gate Premium global ainda contém navegação para assinatura");
}

const premiumFiles = walk(ROOT).filter(isPremium);
let shellFailures = 0;
let subscriptionRefs = 0;

for (const rel of premiumFiles) {
  const html = fs.readFileSync(path.join(ROOT, rel), "utf8");
  const hasLoader = /premium-content-loader\.js/i.test(html);
  const hasPlaceholder = /premium-content-placeholder/i.test(html);
  const directSubscription = /(?:location\.(?:href|replace|assign)|window\.open|href\s*=)[^\n]{0,240}conta\/assinatura\.html/i.test(html);

  if (!hasLoader || !hasPlaceholder || directSubscription) {
    shellFailures++;
    if (directSubscription) subscriptionRefs++;
    fail(rel + " → shell inconsistente (loader=" + hasLoader + ", placeholder=" + hasPlaceholder + ", assinatura=" + directSubscription + ")");
  }
}

if (!shellFailures) pass("todos os " + premiumFiles.length + " HTMLs Premium encontrados possuem shell protegido");

console.log("\n============================================================");
console.log("RESULTADO");
console.log("============================================================");
console.log(JSON.stringify({
  ok: problems.length === 0,
  checks,
  premiumHtmlAudited: premiumFiles.length,
  shellFailures,
  directSubscriptionReferences: subscriptionRefs,
  model: "FREE / PREMIUM"
}, null, 2));

if (problems.length) {
  console.log("\nPROBLEMAS:");
  problems.forEach(p => console.log("  - " + p));
  process.exit(1);
}
