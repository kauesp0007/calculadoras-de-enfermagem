#!/usr/bin/env node
"use strict";

/**
 * Validação de estado real do benefício Premium sem anúncios.
 *
 * Este teste usa a MESMA autoridade comercial da aplicação:
 * public.user_entitlements via Supabase service role, somente leitura.
 *
 * Não cria conta, não cria cobrança, não altera entitlement e não expõe IDs
 * de usuários nos logs. A finalidade é comprovar que estados persistidos reais
 * são interpretados pela política do global-scripts.js sem autoridade paralela.
 */

import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const ROOT = path.resolve(new URL(".", import.meta.url).pathname, "..");
const GLOBAL = path.join(ROOT, "global-scripts.js");
const source = fs.readFileSync(GLOBAL, "utf8");

function extractEvaluator() {
  const match = source.match(
    /function evaluatePremiumAdState\(billing, authenticated\) \{([\s\S]*?)\n\}\n\nfunction withPremiumAdTimeout/
  );
  assert.ok(match, "Política evaluatePremiumAdState() não encontrada.");
  return new Function("billing", "authenticated", match[1]);
}

function nowIso() {
  return new Date().toISOString();
}

async function getEntitlements() {
  const base = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const key = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "");
  assert.ok(base && key, "SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY ausentes.");

  const url =
    base +
    "/rest/v1/user_entitlements?select=plan,premium_expires_at&limit=100";

  const response = await fetch(url, {
    headers: {
      apikey: key,
      Authorization: "Bearer " + key,
      Accept: "application/json"
    }
  });

  assert.equal(response.ok, true, "Supabase retornou HTTP " + response.status);
  const rows = await response.json();
  assert.ok(Array.isArray(rows), "Resposta do catálogo de entitlement não é uma lista.");
  return rows;
}

const evaluate = extractEvaluator();
const rows = await getEntitlements();

assert.ok(rows.length > 0, "Não foi encontrado nenhum entitlement persistido para validar.");

const premiumRows = rows.filter((row) => row && row.plan === "premium");
const freeRows = rows.filter((row) => row && row.plan === "free");

assert.ok(premiumRows.length > 0, "Nenhum entitlement Premium persistido foi encontrado.");

for (const row of premiumRows) {
  assert.ok(row.premium_expires_at, "Entitlement Premium sem premium_expires_at.");
  const expiry = new Date(row.premium_expires_at);
  assert.equal(Number.isFinite(expiry.getTime()), true, "premium_expires_at inválido.");
}

const futurePremium = premiumRows.filter((row) => {
  const expiry = new Date(row.premium_expires_at);
  return expiry.getTime() > Date.now();
});

assert.ok(
  futurePremium.length > 0,
  "Nenhum entitlement Premium com expiração futura foi encontrado."
);

const realPremiumState = evaluate(
  {
    resolved: true,
    plan: "premium",
    premium_expires_at: futurePremium[0].premium_expires_at
  },
  true
);

assert.equal(realPremiumState.resolved, true, "Premium real deveria estar resolvido.");
assert.equal(realPremiumState.premium, true, "Premium real deveria ser reconhecido como Premium.");
assert.equal(realPremiumState.allowAds, false, "Premium real não pode permitir AdSense.");

if (freeRows.length > 0) {
  const realFreeState = evaluate(
    {
      resolved: true,
      plan: "free",
      premium_expires_at: null
    },
    true
  );

  assert.equal(realFreeState.resolved, true, "Free real deveria estar resolvido.");
  assert.equal(realFreeState.premium, false, "Free real não pode ser reconhecido como Premium.");
  assert.equal(realFreeState.allowAds, true, "Free real deve continuar elegível para anúncios.");
}

const expiredPremium = premiumRows.find((row) => {
  const expiry = new Date(row.premium_expires_at);
  return expiry.getTime() <= Date.now();
});

if (expiredPremium) {
  const expiredState = evaluate(
    {
      resolved: true,
      plan: "premium",
      premium_expires_at: expiredPremium.premium_expires_at
    },
    true
  );

  assert.equal(expiredState.premium, false, "Premium expirado não pode bloquear anúncios como Premium.");
  assert.equal(expiredState.allowAds, true, "Premium expirado deve voltar a ser elegível para anúncios.");
}

const unavailableState = evaluate(
  {
    resolved: false,
    plan: "verifying",
    billingUnavailable: true
  },
  true
);

assert.equal(unavailableState.resolved, false, "Billing indisponível deve permanecer não resolvido.");
assert.equal(unavailableState.premium, false, "Billing indisponível não pode conceder Premium.");
assert.equal(unavailableState.allowAds, false, "Billing indisponível deve manter AdSense desligado até resolver.");

const visitorState = evaluate(null, false);
assert.equal(visitorState.resolved, true, "Visitante deve estar resolvido como não autenticado.");
assert.equal(visitorState.premium, false, "Visitante não pode ser Premium.");
assert.equal(visitorState.allowAds, true, "Visitante deve continuar elegível para anúncios.");

console.log("✅ Simulação com estado REAL do Supabase aprovada.");
console.log("   Premium persistido/futuro → AdSense bloqueado.");
console.log("   Free persistido (quando disponível) → AdSense elegível.");
console.log("   Premium expirado (quando disponível) → AdSense elegível.");
console.log("   Billing indisponível → AdSense permanece desligado até resolver.");
console.log("   Visitante → AdSense elegível, sujeito ao consentimento.");
console.log("   Timestamp da verificação: " + nowIso());
