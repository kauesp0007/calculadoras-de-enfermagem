// Checkout individualizado do Premium Júnior (Brasil).
// O ID token do Firebase é validado no backend via Google JWKS antes
// de qualquer criação de pedido ou chamada ao Asaas.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createRemoteJWKSet, jwtVerify } from "npm:jose@5.10.0";

const FIREBASE_PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID") ?? "calculadoras-enfermagem";
const FIREBASE_SERVICE_ACCOUNT = Deno.env.get("FIREBASE_SERVICE_ACCOUNT") ?? "";
const ASAAS_API_TOKEN = Deno.env.get("ASAAS_API_TOKEN") ?? "";
const ASAAS_API_BASE = "https://api.asaas.com/v3";
const SITE_URL = "https://www.calculadorasdeenfermagem.com.br";
const PRICE_BRL = 10.00;
const FIREBASE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"));

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, apikey, Content-Type",
    "Content-Type": "application/json; charset=utf-8",
  };
}

async function verifyFirebaseToken(token: string): Promise<{ uid: string; email: string; name: string }> {
  if (!token) throw new Error("nao_autenticado");
  const { payload } = await jwtVerify(token, FIREBASE_JWKS, {
    algorithms: ["RS256"],
    issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
    audience: FIREBASE_PROJECT_ID,
  });
  const uid = String(payload.sub || "");
  const email = String(payload.email || "").trim().toLowerCase();
  const name = String(payload.name || "").trim();
  if (!uid || !email) throw new Error("usuario_sem_email");
  return { uid, email, name };
}

async function firestoreToken(): Promise<string> {
  if (!FIREBASE_SERVICE_ACCOUNT) throw new Error("FIREBASE_SERVICE_ACCOUNT_nao_configurado");
  const sa = JSON.parse(FIREBASE_SERVICE_ACCOUNT);
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claims = { iss: sa.client_email, scope: "https://www.googleapis.com/auth/datastore", aud: sa.token_uri, iat: now, exp: now + 3600 };
  const b64url = (input: string | ArrayBuffer) => {
    const bytes = typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
    let bin = "";
    bytes.forEach((b) => bin += String.fromCharCode(b));
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  };
  const pem = sa.private_key.replace(/-----BEGIN PRIVATE KEY-----/, "").replace(/-----END PRIVATE KEY-----/, "").replace(/\s+/g, "");
  const bin = atob(pem);
  const keyBytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) keyBytes[i] = bin.charCodeAt(i);
  const key = await crypto.subtle.importKey("pkcs8", keyBytes.buffer, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const input = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(claims))}`;
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(input));
  const jwt = `${input}.${b64url(sig)}`;
  const res = await fetch(sa.token_uri, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) throw new Error("falha_token_firestore");
  return data.access_token;
}

function firestoreUrl(path: string, fields?: string[]): string {
  let url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${path}`;
  if (fields && fields.length) url += "?" + fields.map((f) => `updateMask.fieldPaths=${encodeURIComponent(f)}`).join("&");
  return url;
}

function stringValue(v: string) { return { stringValue: v }; }
function doubleValue(v: number) { return { doubleValue: v }; }
function timestampValue(v: string) { return { timestampValue: v }; }

async function firestorePatch(path: string, fields: Record<string, unknown>, token: string): Promise<void> {
  const names = Object.keys(fields);
  const res = await fetch(firestoreUrl(path, names), { method: "PATCH", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ fields }) });
  if (!res.ok) throw new Error(`Firestore PATCH ${path} -> ${res.status}: ${await res.text()}`);
}

async function asaasPost(path: string, body: Record<string, unknown>): Promise<any> {
  if (!ASAAS_API_TOKEN) throw new Error("ASAAS_API_TOKEN_nao_configurado");
  const res = await fetch(`${ASAAS_API_BASE}${path}`, { method: "POST", headers: { access_token: ASAAS_API_TOKEN, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Asaas POST ${path} -> ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("", { status: 204, headers: corsHeaders() });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405, headers: corsHeaders() });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    const user = await verifyFirebaseToken(idToken);
    const body = await req.json().catch(() => ({}));
    const kind = String(body?.kind || "");
    if (kind !== "monthly_card" && kind !== "pix_30d") throw new Error("tipo_checkout_invalido");

    const fsToken = await firestoreToken();
    const orderId = crypto.randomUUID();
    const now = new Date().toISOString();
    const externalReference = `premium_junior_${orderId}`;

    await firestorePatch(`premiumOrders/${orderId}`, {
      uid: stringValue(user.uid), email: stringValue(user.email), provider: stringValue("asaas"), kind: stringValue(kind),
      amount: doubleValue(PRICE_BRL), currency: stringValue("BRL"), externalReference: stringValue(externalReference),
      status: stringValue("creating"), createdAt: timestampValue(now),
    }, fsToken);

    const callbackBase = `${SITE_URL}/conta/assinatura.html`;
    const isRecurring = kind === "monthly_card";
    const checkoutPayload: Record<string, unknown> = {
      billingTypes: isRecurring ? ["CREDIT_CARD"] : ["PIX"],
      chargeTypes: isRecurring ? ["RECURRENT"] : ["DETACHED"],
      minutesToExpire: 60,
      externalReference,
      callback: { cancelUrl: `${callbackBase}?asaas=cancel`, expiredUrl: `${callbackBase}?asaas=expired`, successUrl: `${callbackBase}?asaas=success` },
      items: [{ name: "Plano Júnior Premium", description: isRecurring ? "Assinatura mensal sem anúncios" : "Acesso premium por 30 dias sem anúncios", quantity: 1, value: PRICE_BRL }],
      customerData: { name: user.name || user.email, email: user.email },
    };

    if (isRecurring) {
      const nextDue = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const pad = (n: number) => String(n).padStart(2, "0");
      checkoutPayload.subscription = {
        cycle: "MONTHLY",
        nextDueDate: `${nextDue.getFullYear()}-${pad(nextDue.getMonth() + 1)}-${pad(nextDue.getDate())} ${pad(nextDue.getHours())}:${pad(nextDue.getMinutes())}:${pad(nextDue.getSeconds())}`,
        externalReference,
      };
    }

    const checkout = await asaasPost("/checkouts", checkoutPayload);
    const checkoutId = String(checkout?.id || "");
    if (!checkoutId) throw new Error("checkout_id_ausente");

    const checkoutUrl = String(checkout?.link || `https://asaas.com/checkoutSession/show?id=${encodeURIComponent(checkoutId)}`);
    await firestorePatch(`premiumOrders/${orderId}`, {
      checkoutId: stringValue(checkoutId), checkoutUrl: stringValue(checkoutUrl), status: stringValue("created"),
      updatedAt: timestampValue(new Date().toISOString()),
    }, fsToken);

    return new Response(JSON.stringify({ orderId, checkoutId, url: checkoutUrl }), { status: 200, headers: corsHeaders() });
  } catch (error) {
    console.error("[asaas-checkout]", error);
    return new Response(JSON.stringify({ error: String((error as Error)?.message || error) }), { status: 400, headers: corsHeaders() });
  }
});
