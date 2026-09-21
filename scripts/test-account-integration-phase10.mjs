#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const ACCOUNT_FILES = [
  "login.html",
  "perfil.html",
  "configuracoes.html",
  "favoritos.html",
  "historico.html",
  "assinatura.html"
];

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    console.error("[AccountIntegration10] FAIL:", message);
    process.exitCode = 1;
  }
}

function extractInlineScripts(html) {
  return [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
    .filter((m) => !/<script\b[^>]*type=["'](?:application\/ld\+json|application\/json)["']/i.test(m[0]))
    .map((m) => m[1]);
}

const auth = read("js/auth/auth-core.js");
const routing = read("js/account-routing.js");
const global = read("global-scripts.js");
const authUi = read("js/auth/auth-ui.js");
const premiumLoader = read("js/access/premium-content-loader.js");
const welcome = read("boas_vindas_assinante.html");
const billingAccess = read("supabase/functions/billing-access/index.ts");
const premiumContent = read("supabase/functions/premium-content/index.ts");

assert(auth.includes("function whenReady()"), "auth-core precisa expor Auth.whenReady().");
assert(auth.includes("var _hydrationGeneration=0"), "auth-core precisa controlar gerações de hidratação.");
assert(auth.includes("_hydrationPromise=_hydrateUser(user,generation)"), "auth-core precisa aguardar a hidratação comercial corrente.");

assert(routing.includes("MutationObserver"), "account-routing precisa observar links inseridos dinamicamente.");
assert(routing.includes('url.searchParams.set("lang", current)'), "account-routing precisa normalizar o lang dos links da conta.");

assert(global.includes("if (isLoggedIn && billing && !billing.resolved)"), "menu não pode mostrar CTA Premium durante verifying.");
assert(global.includes("if (billing && billing.unavailable)"), "menu não pode transformar indisponibilidade de billing em Free aparente.");
assert(global.includes("window.__ENSURE_AUTH"), "global-scripts deve usar o bootstrap canônico de Auth.");

assert(authUi.includes('var isSubscriptionRoute = /^\/conta\/assinatura\.html$/i.test(normalizedReturn)'),
  "login precisa reconhecer a assinatura como retorno permitido.");
assert(!authUi.includes("window.__PREMIUM_PATHS"), "login não deve depender de catálogo Premium legado inexistente.");

assert(premiumLoader.includes('var res=await request(token,currentKey);'),
  "loader Premium precisa consultar diretamente a entrega protegida.");
assert(!premiumLoader.includes("waitForBillingResolution(auth)"),
  "loader Premium não deve bloquear a entrega esperando uma segunda consulta de billing.");

assert(welcome.includes("window.Auth.whenReady"),
  "boas-vindas precisa sincronizar com Auth.whenReady().");

assert(billingAccess.includes('ent.plan==="premium"'),
  "billing-access deve resolver Premium pelo entitlement.");
assert(premiumContent.includes('ent.plan==="premium"'),
  "premium-content deve validar novamente o entitlement.");
assert(
  billingAccess.includes("securetoken.google.com") &&
  billingAccess.includes("FIREBASE_PROJECT_ID") &&
  premiumContent.includes("securetoken.google.com") &&
  premiumContent.includes("FIREBASE_PROJECT_ID"),
  "billing-access e premium-content precisam validar o Firebase ID token pelo projeto correto."
);

for (const file of ACCOUNT_FILES) {
  const rel = path.join("conta", file);
  const html = read(rel);
  assert(html.includes("/js/account-routing.js"), rel + " precisa carregar account-routing.");
  assert(html.includes("/global-scripts.js"), rel + " precisa carregar global-scripts.");
  if (file !== "login.html") {
    assert(
      html.includes("Auth.whenReady?window.Auth.whenReady():window.Auth.init()") ||
      html.includes("window.Auth.whenReady?window.Auth.whenReady():window.Auth.init()"),
      rel + " precisa aguardar o estado comercial antes de carregar os dados da conta."
    );
  }
  for (const script of extractInlineScripts(html)) {
    try {
      new Function(script);
    } catch (error) {
      assert(false, rel + " possui JavaScript inline inválido: " + error.message);
    }
  }
}

console.log(JSON.stringify({
  ok: process.exitCode !== 1,
  accountPagesAudited: ACCOUNT_FILES.length,
  checks: [
    "Auth.whenReady/hydration",
    "account routing + dynamic links",
    "menu verifying guard",
    "login subscription return",
    "Premium protected delivery contract",
    "welcome synchronization",
    "inline JavaScript parsing"
  ]
}, null, 2));

if (process.exitCode === 1) process.exit(1);
