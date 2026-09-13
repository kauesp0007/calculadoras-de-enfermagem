// =====================================================================
// Edge Function: stripe-checkout
// Cria uma Checkout Session do Stripe (assinatura mensal) e devolve a URL.
//
// Fluxo:
//   Front -> POST /stripe-checkout { uid, lang }
//     -> escolhe o price (USD ou EUR) conforme o idioma
//     -> cria a Checkout Session (mode=subscription, client_reference_id=uid)
//     -> devolve { url } para o front redirecionar o usuário.
//
// Deploy com --no-verify-jwt (o front chama com a anon key).
// =====================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const STRIPE_API = "https://api.stripe.com/v1";
const SITE_URL = "https://www.calculadorasdeenfermagem.com.br";
const FIREBASE_PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID") ?? "calculadoras-enfermagem";
const JWKS_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

// Idiomas do site -> price ID do Stripe.
const EUR_LANGS = ["tr", "nl", "pl", "ru", "fr", "es", "de", "it", "uk", "sv"];

// USD $5/mês e EUR €5/mês (ambos criados).
const USD_PRICE_ID = Deno.env.get("STRIPE_PRICE_USD") ?? "price_1UEeJeAE0EBt2lxCFI56AWCx";
const EUR_PRICE_ID = Deno.env.get("STRIPE_PRICE_EUR") ?? "price_1UEf7uAE0EBt2lxCmfLGGmNH";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, apikey, Content-Type",
  };
}

// ───────────── Verificação do token Firebase (validação do UID) ─────────────

function b64urlDecode(input: string): Uint8Array {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function pemCertToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN CERTIFICATE-----/, "")
    .replace(/-----END CERTIFICATE-----/, "")
    .replace(/\s+/g, "");
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

/**
 * Verifica um ID token do Firebase Auth e retorna o uid (sub) se válido.
 * Valida assinatura RS256 contra as chaves públicas do Google,
 * além de `aud`, `iss` e `exp`. Retorna "" se inválido.
 */
async function verifyFirebaseToken(idToken: string): Promise<string> {
  const parts = idToken.split(".");
  if (parts.length !== 3) return "";
  const [h, p, s] = parts;

  let header: any, payload: any;
  try {
    header = JSON.parse(new TextDecoder().decode(b64urlDecode(h)));
    payload = JSON.parse(new TextDecoder().decode(b64urlDecode(p)));
  } catch {
    return "";
  }

  if (header.alg !== "RS256" || !header.kid) return "";
  if ((payload.exp || 0) * 1000 < Date.now()) return "";
  if (payload.aud !== FIREBASE_PROJECT_ID) return "";
  if (payload.iss !== `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`) return "";

  const certsRes = await fetch(JWKS_URL);
  if (!certsRes.ok) return "";
  const certs = await certsRes.json();
  const cert = certs[header.kid];
  if (!cert) return "";

  const key = await crypto.subtle.importKey(
    "spki",
    pemCertToArrayBuffer(cert),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const valid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    b64urlDecode(s),
    new TextEncoder().encode(`${h}.${p}`),
  );
  if (!valid) return "";
  return String(payload.sub || "");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (req.method !== "POST") {
    return new Response("method_not_allowed", { status: 405, headers: corsHeaders() });
  }
  if (!STRIPE_SECRET_KEY) {
    return new Response(
      JSON.stringify({ error: "not_configured" }),
      { status: 500, headers: { ...corsHeaders(), "Content-Type": "application/json" } },
    );
  }

  try {
    const body = await req.json();
    const uid = String(body?.uid || "");
    const lang = String(body?.lang || "en");
    if (!uid) {
      return new Response(
        JSON.stringify({ error: "missing_uid" }),
        { status: 400, headers: { ...corsHeaders(), "Content-Type": "application/json" } },
      );
    }

    // Valida o token Firebase e garante que o uid pertence ao usuário autenticado.
    const authHeader = req.headers.get("Authorization") || "";
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    const authUid = idToken ? await verifyFirebaseToken(idToken) : "";
    if (!authUid || authUid !== uid) {
      return new Response(
        JSON.stringify({ error: "unauthorized" }),
        { status: 401, headers: { ...corsHeaders(), "Content-Type": "application/json" } },
      );
    }

    const priceId = EUR_LANGS.indexOf(lang) !== -1 ? EUR_PRICE_ID : USD_PRICE_ID;

    const form = new URLSearchParams({
      mode: "subscription",
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      "payment_method_types[0]": "card",
      client_reference_id: uid,
      "subscription_data[metadata][uid]": uid,
      success_url: `${SITE_URL}/conta/assinatura.html?stripe=success`,
      cancel_url: `${SITE_URL}/conta/assinatura.html?stripe=cancel`,
    });

    const res = await fetch(`${STRIPE_API}/checkout/sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form,
    });
    const session = await res.json();
    if (!res.ok || !session.url) {
      return new Response(
        JSON.stringify({ error: session?.error?.message || "erro ao criar checkout" }),
        { status: 500, headers: { ...corsHeaders(), "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { ...corsHeaders(), "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Erro no stripe-checkout", err);
    return new Response(
      JSON.stringify({ error: String((err as Error).message || err) }),
      { status: 500, headers: { ...corsHeaders(), "Content-Type": "application/json" } },
    );
  }
});
