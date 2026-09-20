#!/usr/bin/env node
const fs = require("node:fs");

function fail(message) {
  console.error("\n[PremiumSimulados] FAIL:", message);
  process.exit(1);
}
function read(path) {
  try { return fs.readFileSync(path, "utf8"); }
  catch (e) { fail("arquivo ausente: " + path); }
}

const menu = read("menu-global.html");
const global = read("global-scripts.js");
const accessRouter = read("js/access/access-router.js");
const routeGuard = read("js/auth/route-guard.js");
const loader = read("js/access/premium-content-loader.js");

const simuladoMenu = menu.match(
  /<ul[^>]+id=["']submenu-simulados-mobile["'][\s\S]*?<\/ul>/i
);
if (!simuladoMenu) fail("submenu de Simulados não encontrado no menu-global.html");

const links = [...simuladoMenu[0].matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi)]
  .map(m => m[1]);

if (!links.length) fail("nenhum link de simulado encontrado no menu");
const badMenuLinks = links.filter(href => /conta\/assinatura\.html/i.test(href));
if (badMenuLinks.length) fail("menu de Simulados contém link para assinatura: " + badMenuLinks.join(", "));

if (!global.includes('if (!window.__IS_PREMIUM_ROUTE) {\n        bindAuthorization();\n        bindAccess();\n      }')) {
  fail("global-scripts.js ainda pode inicializar o access-router em rota Premium");
}

const setupAccessIndex = global.indexOf("function _setupAccess()");
const setupAccessBody = setupAccessIndex >= 0
  ? global.slice(setupAccessIndex, setupAccessIndex + 1200)
  : "";
if (!setupAccessBody.includes("if (window.__IS_PREMIUM_ROUTE)")) {
  fail("_setupAccess() não possui isolamento explícito para rotas Premium");
}
if (setupAccessBody.indexOf("if (window.__IS_PREMIUM_ROUTE)") >
    setupAccessBody.indexOf("window.Access.guard")) {
  fail("guard genérico aparece antes do bloqueio de rota Premium em _setupAccess()");
}

if (!accessRouter.includes('if (window.__IS_PREMIUM_ROUTE === true) return true;')) {
  fail("access-router.js não possui defesa contra redirecionamento em rota Premium");
}
if (!routeGuard.includes('if (window.__IS_PREMIUM_ROUTE === true) return true;')) {
  fail("route-guard.js não possui defesa contra redirecionamento em rota Premium");
}
if (!loader.includes('if(billing&&billing.resolved&&billing.plan==="premium")')) {
  fail("premium-content-loader.js não confirma explicitamente Premium antes de tratar 403");
}
if (!loader.includes('function subscription(){')) {
  fail("premium-content-loader.js não possui fluxo de bloqueio Free");
}

const expectedCore = [
  "simulado-de-enfermagem.html",
  "simulado-de-enfermagem2.html",
  "simulado-de-enfermagem3.html",
  "simulado-de-enfermagem4.html",
  "simulado-de-enfermagem-nucleo-de-seguranca-do-paciente.html",
  "simulado-de-enfermagem-doencas-de-notificacao-compulsoria.html",
  "simulado_vacinacao.html",
  "simulado_pcr.html",
  "simulado_ibam_guarulhos_enfermeiro_esf_2024.html",
  "simulado_ibam_japaratuba_sergipe_enfermeiro_2014.html",
  "simulado_lei_organica_do_sus_8080-90.html",
  "simulado_participacao_da_comunidade.html",
  "simulado_humaniza_sus.html",
  "simulado_codigo_de_etica_enfermagem.html"
];
const missingCore = expectedCore.filter(name => !links.some(h => h.endsWith(name)));
if (missingCore.length) {
  console.warn("[PremiumSimulados] aviso: links de simulados não encontrados no submenu:", missingCore.join(", "));
}

console.log(JSON.stringify({
  ok: true,
  simulatedMenuLinks: links.length,
  menuSignatureRedirects: badMenuLinks.length,
  protectedFlow: "premium-content-loader"
}, null, 2));
