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

  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
    .map(m => m[1])
    .filter(s => s.trim());

  for (let i = 0; i < scripts.length; i++) {
    const source = scripts[i];
    if (/type\s*=\s*["']application\/ld\+json["']/i.test(source)) continue;
    try {
      new vm.Script(source, { filename: `conta/${file}#inline-${i}` });
    } catch (error) {
      fail(`${file}: JavaScript inline inválido no bloco ${i}: ${error.message}`);
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

console.log("ACCOUNT PAGES TEST: PASS — estrutura, referências, scripts e persistência verificados.");
