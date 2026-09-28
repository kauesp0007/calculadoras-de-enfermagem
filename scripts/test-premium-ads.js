#!/usr/bin/env node
"use strict";

/**
 * Teste canônico do benefício "Premium sem anúncios".
 *
 * Este teste não cria uma segunda autoridade. Ele extrai e executa a mesma
 * política pura usada pelo global-scripts.js e valida os estados críticos.
 */

const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const ROOT = path.resolve(__dirname, "..");
const GLOBAL = path.join(ROOT, "global-scripts.js");
const source = fs.readFileSync(GLOBAL, "utf8");

const LANGUAGE_FOLDERS = [
  "en","es","fr","it","de","hi","zh","ja","ru","ko","tr","nl","pl","sv","id","vi","uk","ar"
];

const PROTECTED_HTML_NAMES = new Set([
  "footer.html",
  "menu-global.html",
  "global-body-elements.html",
  "downloads.html",
  "menu-lateral.html",
  "_language_selector.html",
  "googlefc0a17cdd552164b.html"
]);

function productionHtmlPaths() {
  const out = [];
  for (const entry of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (entry.isFile() && /\.html$/i.test(entry.name) && !PROTECTED_HTML_NAMES.has(entry.name)) {
      out.push(path.join(ROOT, entry.name));
    }
  }
  for (const lang of LANGUAGE_FOLDERS) {
    const dir = path.join(ROOT, lang);
    if (!fs.existsSync(dir)) continue;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isFile() && /\.html$/i.test(entry.name) && !PROTECTED_HTML_NAMES.has(entry.name)) {
        out.push(path.join(dir, entry.name));
      }
    }
  }
  return out;
}

const DIRECT_AD_LOADER = /<script\b[^>]*\bsrc=["'][^"']*pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js[^"']*["'][^>]*>\s*<\/script>/gi;
const residualDirectLoaders = [];
for (const file of productionHtmlPaths()) {
  const html = fs.readFileSync(file, "utf8");
  if (DIRECT_AD_LOADER.test(html)) residualDirectLoaders.push(path.relative(ROOT, file));
  DIRECT_AD_LOADER.lastIndex = 0;
}
assert.equal(
  residualDirectLoaders.length,
  0,
  "Ainda existem carregadores diretos do AdSense fora do global-scripts.js: " +
    residualDirectLoaders.slice(0, 10).join(", ")
);

function section(from, to) {
  const a = source.indexOf(from);
  const b = source.indexOf(to, a);
  assert.ok(a >= 0, "Âncora inicial não encontrada: " + from);
  assert.ok(b >= 0, "Âncora final não encontrada: " + to);
  return source.slice(a, b);
}

const adSection = section(
  "/* =========================\n   Controle canônico de anúncios Premium",
  "/* =========================\n   Injeção Dinâmica: Anúncio Multiplex"
);

assert.match(adSection, /billingStatus\s*\(/, "A decisão não consulta Auth.billingStatus().");
assert.match(adSection, /premium_expires_at/, "A decisão não valida a expiração do Premium.");
assert.match(adSection, /adsbygoogle\.js/, "O carregador do AdSense não está presente.");
assert.match(adSection, /resolvePremiumAdState\(false\)/, "O carregamento não aguarda a resolução do entitlement.");

assert.doesNotMatch(adSection, /premium-ads-guard/i, "Módulo legado premium-ads-guard foi reutilizado.");
assert.doesNotMatch(adSection, /premium-banner-manager/i, "Módulo legado premium-banner-manager foi reutilizado.");
assert.doesNotMatch(adSection, /localStorage\s*\.\s*getItem\s*\(\s*["'](?:plan|premium|ad-free)["']/i, "Storage foi usado como autoridade comercial.");
assert.doesNotMatch(adSection, /firestore/i, "Firestore apareceu na nova decisão de publicidade.");
assert.doesNotMatch(adSection, /hasPlan\s*\(\s*["']junior["']/i, "Plano legado Junior apareceu na nova decisão.");

const match = source.match(
  /function evaluatePremiumAdState\(billing, authenticated\) \{([\s\S]*?)\n\}\n\nfunction withPremiumAdTimeout/
);
assert.ok(match, "Não foi possível extrair a política de decisão do global-scripts.js.");

const evaluate = new Function("billing", "authenticated", match[1]);

const cases = [
  {
    name: "visitante",
    billing: null,
    authenticated: false,
    expect: { resolved: true, premium: false, allowAds: true, authenticated: false }
  },
  {
    name: "Free autenticado",
    billing: { resolved: true, plan: "free", premium_expires_at: null },
    authenticated: true,
    expect: { resolved: true, premium: false, allowAds: true, authenticated: true }
  },
  {
    name: "Premium válido",
    billing: { resolved: true, plan: "premium", premium_expires_at: null },
    authenticated: true,
    expect: { resolved: true, premium: true, allowAds: false, authenticated: true }
  },
  {
    name: "Premium com expiração futura",
    billing: { resolved: true, plan: "premium", premium_expires_at: "2999-12-31T23:59:59Z" },
    authenticated: true,
    expect: { resolved: true, premium: true, allowAds: false, authenticated: true }
  },
  {
    name: "Premium expirado",
    billing: { resolved: true, plan: "premium", premium_expires_at: "2000-01-01T00:00:00Z" },
    authenticated: true,
    expect: { resolved: true, premium: false, allowAds: true, authenticated: true }
  },
  {
    name: "Billing indisponível",
    billing: { resolved: true, plan: "verifying", billingUnavailable: true },
    authenticated: true,
    expect: { resolved: false, premium: false, allowAds: false, authenticated: true }
  },
  {
    name: "Billing ainda não resolvido",
    billing: { resolved: false, plan: "verifying" },
    authenticated: true,
    expect: { resolved: false, premium: false, allowAds: false, authenticated: true }
  }
];

for (const test of cases) {
  const result = evaluate(test.billing, test.authenticated);
  for (const [key, expected] of Object.entries(test.expect)) {
    assert.equal(result[key], expected, test.name + ": " + key);
  }
}

console.log("✅ Teste Premium sem anúncios: política e estados críticos aprovados.");
console.log("   Visitante/Free → anúncios elegíveis.");
console.log("   Premium válido → anúncios bloqueados.");
console.log("   Expirado/indisponível → comportamento seguro e derivado do billing.");
