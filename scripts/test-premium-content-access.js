#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const LANGS = new Set([
  "en","es","fr","it","de","hi","zh","ja","ru","ko","tr","nl",
  "pl","sv","id","vi","uk","ar"
]);

const EXACT_PREMIUM = new Set([
  "braden.html","fugulin.html","dimensionamento.html","perroca.html",
  "medicacao.html","medicamentos.html","meem.html","moca.html",
  "zarit.html","morse.html","elpo.html","glasgow.html",
  "balancohidrico.html","biblioteca-provas.html",
  "formularios-em-branco-de-escalas.html",
  "formularios_de_escalas_assistenciais.html"
]);

const LOCALIZED_CORE = [
  "balancohidrico.html","braden.html","elpo.html","formulario-saep-enfermagem.html",
  "fugulin.html","glasgow.html","medicamentos.html","meem.html","moca.html","morse.html",
  "perroca.html","zarit.html"
];

function isPremiumFile(rel) {
  const normalized = rel.split(path.sep).join("/");
  const parts = normalized.split("/");
  if (!(parts.length === 1 || (parts.length === 2 && LANGS.has(parts[0])))) return false;

  const file = parts.at(-1).toLowerCase();
  if (EXACT_PREMIUM.has(file)) return true;
  return /^(simulado(?:[-_].*)?|flashcards_quiz|formulario(?:[-_].*)?|fotmulario_.*)\.html$/i.test(file);
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
      out.push(path.relative(ROOT, abs));
    }
  }
  return out;
}

function fail(msg) {
  console.error("[PremiumContent] FAIL:", msg);
  process.exitCode = 1;
}

const globalScripts = fs.readFileSync(path.join(ROOT, "global-scripts.js"), "utf8");
const loader = fs.readFileSync(path.join(ROOT, "js/access/premium-content-loader.js"), "utf8");
const accessRouter = fs.readFileSync(path.join(ROOT, "js/access/access-router.js"), "utf8");
const routeGuard = fs.readFileSync(path.join(ROOT, "js/auth/route-guard.js"), "utf8");
const policy = fs.readFileSync(path.join(ROOT, "js/access/content-policy.js"), "utf8");
const menu = fs.readFileSync(path.join(ROOT, "menu-global.html"), "utf8");

const menuBlocks = [
  ...menu.matchAll(/<ul[^>]+id=["']submenu-simulados-mobile["'][\s\S]*?<\/ul>/gi),
  ...menu.matchAll(/<ul[^>]+id=["']submenu-biblioteca-enfermagem["'][\s\S]*?<\/ul>/gi)
].map(m => m[0]);

const menuLinks = menuBlocks.flatMap(block =>
  [...block.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)].map(m => m[1])
);
if (menuLinks.some(href => /conta\/assinatura\.html/i.test(href))) {
  fail("menu contém link direto de assinatura em área Premium");
}

if (!globalScripts.includes('if (!window.__IS_PREMIUM_ROUTE) {\n        bindAuthorization();\n        bindAccess();\n      }')) {
  fail("global-scripts pode inicializar autorização legada em rota Premium");
}
if (!globalScripts.includes('if (window.__IS_PREMIUM_ROUTE) {\n      return;\n    }')) {
  fail("global-scripts._setupAccess não possui isolamento Premium");
}
if (!accessRouter.includes('if (window.__IS_PREMIUM_ROUTE === true) return true;')) {
  fail("access-router permite decisão legada em rota Premium");
}
if (!routeGuard.includes('if (window.__IS_PREMIUM_ROUTE === true) return true;')) {
  fail("route-guard permite decisão legada em rota Premium");
}
if (!loader.includes('billing&&billing.resolved&&billing.plan==="premium"')) {
  fail("loader não protege Premium contra falso 403");
}
if (!loader.includes('function canonicalPathKey()')) {
  fail("loader não possui fallback canônico de idioma");
}
if (!loader.includes('res.status===404&&canonicalKey&&canonicalKey!==currentKey')) {
  fail("loader não possui fallback de conteúdo localizado para raiz");
}

// O gate global pode informar estado, mas nunca navegar para assinatura.
const gateStart = globalScripts.indexOf("function canEnter(forceCheck)");
const gateEnd = globalScripts.indexOf("window.__PREMIUM_PATHS", gateStart);
const gate = gateStart >= 0 && gateEnd > gateStart
  ? globalScripts.slice(gateStart, gateEnd)
  : "";
if (/location\.(?:href|replace|assign)\s*=?.*assinatura\.html/i.test(gate)) {
  fail("gate global ainda navega para assinatura");
}

// Todo arquivo Premium que existe fisicamente deve ser um shell protegido.
const premiumFiles = walk(ROOT).filter(isPremiumFile).sort();
let shellFailures = 0;
for (const rel of premiumFiles) {
  const html = fs.readFileSync(path.join(ROOT, rel), "utf8");
  const hasLoader = /<script[^>]+src=["'][^"']*premium-content-loader\.js[^"']*["'][^>]*>/i.test(html);
  const hasPlaceholder = /id=["']premium-content-placeholder["']/i.test(html);
  const directSubscription = /(?:location\.(?:href|replace|assign)|window\.open|href\s*=)[^\n]{0,180}conta\/assinatura\.html/i.test(html);

  if (!hasLoader || !hasPlaceholder || directSubscription) {
    shellFailures++;
    console.error("  ✗", rel, JSON.stringify({ hasLoader, hasPlaceholder, directSubscription }));
  }
}
if (shellFailures) fail(shellFailures + " arquivos Premium não estão protegidos de forma consistente");

// Regra de consistência internacional: as 12 rotas Premium traduzidas
// devem existir como shell em todas as 18 pastas de idioma. O conteúdo final
// é entregue pelo backend e pode usar fallback para a raiz somente quando a
// linha traduzida não existir no catálogo privado.
const localizedMissing = [];
for (const lang of LANGS) {
  for (const file of LOCALIZED_CORE) {
    const rel = path.join(lang, file);
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) {
      localizedMissing.push(rel);
      continue;
    }
    const html = fs.readFileSync(abs, "utf8");
    if (!/<script[^>]+src=["'][^"']*premium-content-loader\.js[^"']*["'][^>]*>/i.test(html) ||
        !/id=["']premium-content-placeholder["']/i.test(html)) {
      localizedMissing.push(rel + ":shell");
    }
  }
}
if (localizedMissing.length) {
  fail("rotas Premium traduzidas ausentes/inconsistentes (" + localizedMissing.length + "): " + localizedMissing.slice(0, 20).join(", "));
}

console.log(JSON.stringify({
  ok: process.exitCode !== 1,
  premiumHtmlFilesAudited: premiumFiles.length,
  menuPremiumLinksAudited: menuLinks.length,
  shellFailures,
  protectedFlow: "premium-content-loader -> billing-access -> premium-content"
}, null, 2));

if (process.exitCode === 1) process.exit(1);
