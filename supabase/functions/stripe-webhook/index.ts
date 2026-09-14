// Stripe webhook do Premium Júnior.
// A assinatura do Stripe é validada antes do processamento.
// Eventos são processados de forma idempotente por event.id no Firestore.
// O Firestore é atualizado com máscaras de campo para preservar o perfil.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const FIREBASE_PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID") ?? "calculadoras-enfermagem";
const FIREBASE_SERVICE_ACCOUNT = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const STRIPE_API = "https://api.stripe.com/v1";

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem.replace(/-----BEGIN PRIVATE KEY-----/, "").replace(/-----END PRIVATE KEY-----/, "").replace(/\s+/g, "");
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

function b64url(input: string | ArrayBuffer): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  let bin = "";
  bytes.forEach((b) => bin += String.fromCharCode(b));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function firestoreAccessToken(sa: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const claims = { iss: sa.client_email, scope: "https://www.googleapis.com/auth/datastore", aud: sa.token_uri, iat: now, exp: now + 3600 };
  const input = `${b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${b64url(JSON.stringify(claims))}`;
  const key = await crypto.subtle.importKey("pkcs8", pemToArrayBuffer(sa.private_key), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(input));
  const response = await fetch(sa.token_uri, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${input}.${b64url(sig)}` }) });
  const data = await response.json();
  if (!response.ok || !data.access_token) throw new Error("FIREBASE_TOKEN_ERROR");
  return data.access_token;
}

function firestoreUrl(path: string, fields?: string[]): string {
  let url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${path}`;
  if (fields?.length) url += "?" + fields.map((f) => `updateMask.fieldPaths=${encodeURIComponent(f)}`).join("&");
  return url;
}

function stringValue(v: string) { return { stringValue: v }; }
function timestampValue(v: string) { return { timestampValue: v }; }
function decodeField(field: any): any {
  if (!field) return null;
  if (field.stringValue !== undefined) return field.stringValue;
  if (field.timestampValue !== undefined) return field.timestampValue;
  if (field.booleanValue !== undefined) return field.booleanValue;
  if (field.doubleValue !== undefined) return Number(field.doubleValue);
  if (field.integerValue !== undefined) return Number(field.integerValue);
  return null;
}
function decodeDocument(doc: any): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [key, value] of Object.entries(doc?.fields || {})) out[key] = decodeField(value);
  return out;
}

async function firestoreGet(path: string, token: string): Promise<Record<string, any> | null> {
  const response = await fetch(firestoreUrl(path), { headers: { Authorization: `Bearer ${token}` } });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`FIRESTORE_GET_${response.status}`);
  return decodeDocument(await response.json());
}

async function firestorePatch(path: string, fields: Record<string, unknown>, token: string): Promise<void> {
  const response = await fetch(firestoreUrl(path, Object.keys(fields)), { method: "PATCH", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ fields }) });
  if (!response.ok) throw new Error(`FIRESTORE_PATCH_${response.status}:${await response.text()}`);
}

async function verifyStripeSignature(rawBody: string, signature: string, secret: string): Promise<boolean> {
  let timestamp = "";
  const signatures: string[] = [];
  for (const item of signature.split(",")) {
    if (item.startsWith("t=")) timestamp = item.slice(2);
    else if (item.startsWith("v1=")) signatures.push(item.slice(3));
  }
  if (!timestamp || !signatures.length) return false;
  const signedPayload = `${timestamp}.${rawBody}`;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, enc.encode(signedPayload));
  const expected = Array.from(new Uint8Array(mac)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return signatures.includes(expected);
}

async function setPlan(uid: string, planId: "free" | "junior", subId: string, expiresAt?: string) {
  const sa = JSON.parse(FIREBASE_SERVICE_ACCOUNT || "");
  const token = await firestoreAccessToken(sa);
  const now = new Date().toISOString();
  const isPremium = planId === "junior";
  const effectiveExpiry = expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await firestorePatch(`users/${uid}`, {
    plan: stringValue(planId),
    planUpdatedAt: timestampValue(now),
    planExpiresAt: timestampValue(isPremium ? effectiveExpiry : now),
  }, token);
  if (subId) {
    await firestorePatch(`users/${uid}/subscriptions/${subId}`, {
      planId: stringValue(planId),
      status: stringValue(isPremium ? "active" : "cancelled"),
      userId: stringValue(uid),
      provider: stringValue("stripe"),
      providerSubscriptionId: stringValue(subId),
      updatedAt: timestampValue(now),
    }, token);
  }
}

async function logSubscriber(id: string, name: string, email: string, token: string) {
  const now = new Date().toISOString();
  await firestorePatch(`stripeSubscribers/${id}`, {
    name: stringValue(name),
    email: stringValue(email),
    planId: stringValue("junior"),
    provider: stringValue("stripe"),
    createdAt: timestampValue(now),
  }, token);
}

async function getSubscriptionMeta(subId: string): Promise<{ uid: string; periodEnd?: string }> {
  if (!subId || !STRIPE_SECRET_KEY) return { uid: "" };
  const response = await fetch(`${STRIPE_API}/subscriptions/${subId}`, { headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` } });
  if (!response.ok) return { uid: "" };
  const sub = await response.json();
  const uid = String(sub?.metadata?.uid || "");
  const periodEnd = sub?.current_period_end ? new Date(Number(sub.current_period_end) * 1000).toISOString() : undefined;
  return { uid, periodEnd };
}

async function processOnce(eventId: string, type: string, object: any, token: string): Promise<void> {
  if (type === "checkout.session.completed") {
    const uid = String(object?.client_reference_id || "");
    if (!uid) throw new Error("checkout_uid_missing");
    const subId = String(object?.subscription || "");
    const name = String(object?.customer_details?.name || "");
    const email = String(object?.customer_details?.email || "").trim().toLowerCase();
    await setPlan(uid, "junior", subId);
    await logSubscriber(`stripe_${String(object?.id || eventId)}`, name, email, token);
    return;
  }
  if (type === "customer.subscription.deleted") {
    const uid = String(object?.metadata?.uid || "");
    if (uid) await setPlan(uid, "free", String(object?.id || ""));
    return;
  }
  if (type === "invoice.paid") {
    const subId = String(object?.subscription || "");
    const meta = await getSubscriptionMeta(subId);
    if (meta.uid) await setPlan(meta.uid, "junior", subId, meta.periodEnd);
    return;
  }
  if (type === "invoice.payment_failed") {
    const subId = String(object?.subscription || "");
    const meta = await getSubscriptionMeta(subId);
    if (meta.uid) await setPlan(meta.uid, "free", subId);
  }
}

serve(async (req) => {
  if (req.method !== "POST") return new Response("method_not_allowed", { status: 405 });
  if (!FIREBASE_SERVICE_ACCOUNT) return new Response("not_configured", { status: 500 });
  if (!STRIPE_WEBHOOK_SECRET) return new Response("webhook_secret_not_configured", { status: 500 });

  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature") || "";
  if (!(await verifyStripeSignature(rawBody, signature, STRIPE_WEBHOOK_SECRET))) return new Response("invalid_signature", { status: 400 });

  try {
    const event = JSON.parse(rawBody);
    const eventId = String(event?.id || "");
    const type = String(event?.type || "");
    const object = event?.data?.object || {};
    if (!eventId || !type) return new Response("invalid_event", { status: 400 });

    const token = await firestoreAccessToken(JSON.parse(FIREBASE_SERVICE_ACCOUNT));
    const existing = await firestoreGet(`stripeEvents/${eventId}`, token);
    if (existing?.status === "processed") return new Response(JSON.stringify({ ok: true, duplicate: true }), { status: 200 });

    await firestorePatch(`stripeEvents/${eventId}`, {
      eventId: stringValue(eventId), type: stringValue(type), status: stringValue("received"), receivedAt: timestampValue(new Date().toISOString()),
    }, token);

    await processOnce(eventId, type, object, token);
    await firestorePatch(`stripeEvents/${eventId}`, { status: stringValue("processed"), processedAt: timestampValue(new Date().toISOString()) }, token);

    return new Response("ok", { status: 200 });
  } catch (error) {
    console.error("[stripe-webhook]", error);
    try {
      const sa = JSON.parse(FIREBASE_SERVICE_ACCOUNT || "");
      const token = await firestoreAccessToken(sa);
      const rawError = String(error?.message || error);
      const eventId = (() => {
        try { return String(JSON.parse(rawBody)?.id || ""); } catch (_) { return ""; }
      })();
      if (eventId) {
        await firestorePatch(`stripeEvents/${eventId}`, { status: stringValue("error"), error: stringValue(rawError), updatedAt: timestampValue(new Date().toISOString()) }, token);
      }
    } catch (saveError) {
      console.error("[stripe-webhook] event-error", saveError);
    }
    return new Response("error", { status: 500 });
  }
});
