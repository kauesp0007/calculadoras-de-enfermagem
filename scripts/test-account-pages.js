"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const PAGES = [
  "perfil.html",
  "configuracoes.html",
  "favoritos.html",
  "historico.html",
  "assinatura.html",
  "login.html",
  "admin-pagamentos.html"
];

function fail(message) {
  console.error("ACCOUNT PAGES TEST: FAIL");
  console.error(message);
  process.exit(1);
}

for (const file of PAGES) {
  const full = path.join(ROOT, "conta", file);
  if (!fs.existsSync(full)) fail(`${file}: arquivo ausente`);
  const html = fs.readFileSync(full, "utf8");

  for (const required of [
    'id="global-header-container"',
    'id="language-selector-placeholder"',
    'id="footer-placeholder"',
    'src="/global-scripts.js"',
    'src="/lang-selector.js"',
    '/public/output.css',
    '"/global-styles.css"'
  ]) {
    if (!html.includes(required)) fail(`${file}: componente canônico ausente: ${required}`);
  }

  const ids = new Set();
  for (const m of html.matchAll(/\bid=["']([^"']+)["']/g)) ids.add(m[1]);

  const missingRefs = new Set();
  for (const m of html.matchAll(/\$\(["']([^"']+)["']\)/g)) {
    if (!ids.has(m[1])) missingRefs.add(m[1]);
  }
  if (missingRefs.size) {
    fail(`${file}: referências JS sem elemento HTML: ${[...missingRefs].join(", ")}`);
  }

  const scripts = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)]
    .map((m, i) => ({ attrs: m[1], source: m[2], index: i }))
    .filter(x => x.source.trim());

  for (const item of scripts) {
    if (/type\s*=\s*["']application\/ld\+json["']/i.test(item.attrs)) continue;
    try {
      new vm.Script(item.source, { filename: `conta/${file}#inline-${item.index}` });
    } catch (error) {
      fail(`${file}: JavaScript inline inválido no bloco ${item.index}: ${error.message}`);
    }
  }
}

const config = fs.readFileSync(path.join(ROOT, "conta", "configuracoes.html"), "utf8");
for (const required of [
  'id="btn-save-professional"',
  'id="btn-save-settings"',
  'id="btn-save-all"',
  "function scheduleAutosave",
  "function saveLocalDraft",
  "function restoreLocalDraft",
  'req("PATCH",{metadata:metadata,preferences:preferences})'
]) {
  if (!config.includes(required)) fail(`configuracoes.html: persistência obrigatória ausente: ${required}`);
}

const profile = fs.readFileSync(path.join(ROOT, "conta", "perfil.html"), "utf8");
for (const required of [
  "function professionalData",
  "institution:String(m.institution",
  "course:String(m.course",
  "city:String(m.city",
  "state:String(m.state",
  "function setText(id,value)"
]) {
  if (!profile.includes(required)) fail(`perfil.html: sincronização profissional ausente: ${required}`);
}

const banner = fs.readFileSync(path.join(ROOT, "js", "access", "premium-banner-manager.js"), "utf8");
for (const required of [
  "var DISPLAY_MS = 5000;",
  "var INTERVAL_MS = 20 * 60 * 1000;",
  "mountSubscriptionPromo();",
  'href="/conta/assinatura.html"',
  'data-premium-promo-close'
]) {
  if (!banner.includes(required)) fail(`premium-banner-manager.js: regra do banner ausente: ${required}`);
}
const mountStart = banner.indexOf("function mount(opts)");
const mountEnd = banner.indexOf("function unmount()", mountStart);
if (mountStart < 0 || mountEnd < 0) fail("premium-banner-manager.js: função mount ausente.");
const mountBody = banner.slice(mountStart, mountEnd);
if (mountBody.includes("root.innerHTML") || mountBody.includes("premiumCard(")) {
  fail("premium-banner-manager.js: o mount ainda injeta o antigo card global.");
}

console.log("ACCOUNT PAGES TEST: PASS — estrutura, referências, scripts, persistência e banner verificados.");
