#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const PAGES = [
  "conta/perfil.html",
  "conta/configuracoes.html",
  "conta/favoritos.html",
  "conta/historico.html"
];

function fail(message) {
  console.error("[AccountPages] FAIL:", message);
  process.exitCode = 1;
}

for (const rel of PAGES) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) {
    fail(rel + ": arquivo ausente");
    continue;
  }

  const source = fs.readFileSync(file, "utf8");
  const firebaseTag = source.match(/<script\b[^>]*src=["'][^"']*firebase-init\.js[^"']*["'][^>]*><\/script>/i);
  const authTag = source.match(/<script\b[^>]*src=["'][^"']*auth-core\.js[^"']*["'][^>]*><\/script>/i);
  const inlineBoot = source.search(/<script>\s*\(function\(\)\{[\s\S]*?\b(?:boot|loadAccount|init)\b[\s\S]*?<\/script>/i);

  if (!firebaseTag || !authTag) {
    fail(rel + ": Firebase/Auth bootstrap ausente");
    continue;
  }

  if (/\bdefer\b/i.test(firebaseTag[0]) || /\bdefer\b/i.test(authTag[0])) {
    fail(rel + ": Firebase/Auth não pode usar defer antes do boot inline");
  }

  const firebasePos = source.indexOf(firebaseTag[0]);
  const authPos = source.indexOf(authTag[0]);
  if (authPos < firebasePos) {
    fail(rel + ": auth-core aparece antes do firebase-init");
  }

  if (inlineBoot >= 0 && inlineBoot < authPos) {
    fail(rel + ": boot inline aparece antes do auth-core");
  }

  if (!/account-data/.test(source) && rel !== "conta/perfil.html") {
    fail(rel + ": não referencia account-data");
  }
  if (rel === "conta/perfil.html") {
    const required = [
      "profile-greeting","profile-name","full-date","calendar-grid",
      "continue-list","favorite-list","perf-sim-count","collection-list",
      "plan-goal","achievement-list","personal-note","focus-timer",
      "professional-gender","btn-save-treatment","btn-save-name"
    ];
    for (const id of required) {
      if (!new RegExp("id=[\\\"']" + id + "[\\\"']", "i").test(source)) {
        fail(rel + ": recurso/controle ausente: " + id);
      }
    }
    if (/[😀-🫿]/u.test(source)) {
      fail(rel + ": emojis não são permitidos no painel do assinante");
    }
    if (!/billing-access/.test(source)) fail(rel + ": não verifica o estado Premium");
    if (!/professionalGender/.test(source)) fail(rel + ": tratamento enfermeiro/enfermeira não está persistido");
    if (!/toLocaleDateString\("pt-BR"/.test(source)) fail(rel + ": calendário/data não usa formatação pt-BR");
  }
}

if (process.exitCode === 1) process.exit(1);

console.log(JSON.stringify({
  ok: true,
  pagesAudited: PAGES.length,
  rule: "firebase-init -> auth-core -> account boot"
}, null, 2));
