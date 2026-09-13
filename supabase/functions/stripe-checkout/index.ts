// Stripe Checkout do Premium Júnior (internacional).
// O usuário é autenticado pelo Firebase; o UID é carregado na sessão e nos metadados.
// Métodos de pagamento são gerenciados dinamicamente pelo Dashboard do Stripe.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const STRIPE_API = "https://api.stripe.com/v1";
const SITE_URL = "https://www.calculadorasdeenfermagem.com.br";
const FIREBASE_PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID") ?? "calculadoras-enfermagem";
const JWKS_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";
const EUR_LANGS = ["tr", "nl", "pl", "ru", "fr", "es", "de", "it", "uk", "sv"];
const USD_PRICE_ID = Deno.env.get("STRIPE_PRICE_USD") ?? "price_1UEeJeAE0EBt2lxCFI56AWCx";
const EUR_PRICE_ID = Deno.env.get("STRIPE_PRICE_EUR") ?? "price_1UEf7uAE0EBt2lxCmfLGGmNH";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, apikey, Content-Type",
    "Content-Type": "application/json; charset=utf-8",
  };
}

function b64urlDecode(input: string): Uint8Array {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function pemCertToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem.replace(/-----BEGIN CERTIFICATE-----/, "").replace(/-----END CERTIFICATE-----/, "").replace(/\s+/g, "");
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

async function verifyFirebaseToken(idToken: string): Promise<{ uid: string; email: string; name: string }> {
  const parts = idToken.split(".");
  if (parts.length !== 3) throw new Error("invalid_token");
  const [h, p, s] = parts;
  let header: any, payload: any;
  try {
    header = JSON.parse(new TextDecoder().decode(b64urlDecode(h)));
    payload = JSON.parse(new TextDecoder().decode(b64urlDecode(p)));
  } catch {
    throw new Error("invalid_token");
  }
  if (header.alg !== "RS256" || !header.kid) throw new Error("invalid_token");
  if (Number(payload.exp || 0) * 1000 < Date.now()) throw new Error("token_expired");
  if (payload.aud !== FIREBASE_PROJECT_ID) throw new Error("invalid_audience");
  if (payload.iss !== `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`) throw new Error("invalid_issuer");

  const certsRes = await fetch(JWKS_URL);
  if (!certsRes.ok) throw new Error("google_keys_unavailable");
  const certs = await certsRes.json();
  const cert = certs[header.kid];
  if (!cert) throw new Error("unknown_key_id");

  const key = await crypto.subtle.importKey("spki", pemCertToArrayBuffer(cert), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const valid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64urlDecode(s), new TextEncoder().encode(`${h}.${p}`));
  if (!valid) throw new Error("invalid_signature");

  const uid = String(payload.sub || "");
  const email = String(payload.email || "").trim().toLowerCase();
  const name = String(payload.name || "").trim();
  if (!uid || !email) throw new Error("user_email_missing");
  return { uid, email, name };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("", { status: 204, headers: corsHeaders() });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405, headers: corsHeaders() });
  if (!STRIPE_SECRET_KEY) return new Response(JSON.stringify({ error: "not_configured" }), { status: 500, headers: corsHeaders() });

  try {
    const body = await req.json();
    const uid = String(body?.uid || "");
    const lang = String(body?.lang || "en").toLowerCase();
    if (!uid) return new Response(JSON.stringify({ error: "missing_uid" }), { status: 400, headers: corsHeaders() });

    const authHeader = req.headers.get("Authorization") || "";
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    const user = idToken ? await verifyFirebaseToken(idToken) : null;
    if (!user || user.uid !== uid) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: corsHeaders() });

    const priceId = EUR_LANGS.includes(lang) ? EUR_PRICE_ID : USD_PRICE_ID;
    const form = new URLSearchParams({
      mode: "subscription",
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      client_reference_id: uid,
      "subscription_data[metadata][uid]": uid,
      customer_email: user.email,
      success_url: `${SITE_URL}/conta/assinatura.html?stripe=success`,
      cancel_url: `${SITE_URL}/conta/assinatura.html?stripe=cancel`,
    });

    const res = await fetch(`${STRIPE_API}/checkout/sessions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });
    const session = await res.json();
    if (!res.ok || !session.url) {
      return new Response(JSON.stringify({ error: session?.error?.message || "checkout_creation_failed" }), { status: 500, headers: corsHeaders() });
    }

    return new Response(JSON.stringify({ url: session.url }), { status: 200, headers: corsHeaders() });
  } catch (err) {
    console.error("[stripe-checkout]", err);
    return new Response(JSON.stringify({ error: String((err as Error)?.message || err) }), { status: 500, headers: corsHeaders() });
  }
});
