// Asaas webhook do Premium Júnior.
// A relação pagamento -> usuário usa a referência interna do checkout;
// nunca depende de procurar UID por e-mail.
//
// Critérios de confiabilidade:
// - autenticação por asaas-access-token;
// - processamento síncrono: só responde 200 após concluir o efeito financeiro;
// - event.id é idempotente;
// - payment.id também é idempotente para evitar dupla extensão entre
//   PAYMENT_CONFIRMED/PAYMENT_RECEIVED;
// - falhas retornam 500 para permitir nova entrega pelo gateway.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const FIREBASE_PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID") ?? "calculadoras-enfermagem";
const FIREBASE_SERVICE_ACCOUNT = Deno.env.get("FIREBASE_SERVICE_ACCOUNT") ?? "";
const ASAAS_API_TOKEN = Deno.env.get("ASAAS_API_TOKEN") ?? "";
const ASAAS_WEBHOOK_TOKEN = Deno.env.get("ASAAS_WEBHOOK_TOKEN") ?? "";
const ASAAS_API_BASE = "https://api.asaas.com/v3";
const PREMIUM_DAYS = 30;
const INITIAL_PAYMENT_GRACE_MS = 48 * 60 * 60 * 1000;

function responseHeaders() { return { "Content-Type": "application/json; charset=utf-8" }; }

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem.replace(/-----BEGIN PRIVATE KEY-----/, "").replace(/-----END PRIVATE KEY-----/, "").replace(/\s+/g, "");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}

function b64url(input: string | ArrayBuffer): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  let bin = "";
  bytes.forEach((b) => bin += String.fromCharCode(b));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function firestoreAccessToken(): Promise<string> {
  if (!FIREBASE_SERVICE_ACCOUNT) throw new Error("FIREBASE_SERVICE_ACCOUNT_not_configured");
  const sa = JSON.parse(FIREBASE_SERVICE_ACCOUNT);
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

function firestoreUrl(path: string, updateFields?: string[]): string {
  let url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${path}`;
  if (updateFields?.length) url += "?" + updateFields.map((f) => `updateMask.fieldPaths=${encodeURIComponent(f)}`).join("&");
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

async function asaasGet(path: string): Promise<any> {
  if (!ASAAS_API_TOKEN) throw new Error("ASAAS_API_TOKEN_not_configured");
  const response = await fetch(`${ASAAS_API_BASE}${path}`, { headers: { access_token: ASAAS_API_TOKEN } });
  const data = await response.json();
  if (!response.ok) throw new Error(`ASAAS_GET_${response.status}:${JSON.stringify(data)}`);
  return data;
}

function extractOrderId(reference: string): string {
  const value = String(reference || "");
  return value.indexOf("premium_junior_") === 0 ? value.slice("premium_junior_".length) : "";
}

async function saveEvent(eventId: string, event: string, status: string, token: string, errorMessage?: string): Promise<void> {
  const now = new Date().toISOString();
  const fields: Record<string, unknown> = { event: stringValue(event), status: stringValue(status), updatedAt: timestampValue(now) };
  if (status === "received") fields.receivedAt = timestampValue(now);
  if (status === "processed") fields.processedAt = timestampValue(now);
  if (status === "error") fields.error = stringValue(String(errorMessage || "unknown_error"));
  await firestorePatch(`asaasEvents/${eventId}`, fields, token);
}

async function markPaymentProcessed(paymentId: string, uid: string, subscriptionId: string, event: string, token: string): Promise<void> {
  if (!paymentId) return;
  const now = new Date().toISOString();
  await firestorePatch(`asaasPayments/${paymentId}`, {
    paymentId: stringValue(paymentId), uid: stringValue(uid), subscriptionId: stringValue(subscriptionId || ""),
    event: stringValue(event), status: stringValue("processed"), processedAt: timestampValue(now), updatedAt: timestampValue(now),
  }, token);
}

async function setPlan(token: string, uid: string, plan: "free" | "junior", subscriptionId: string, extend: boolean): Promise<void> {
  const existing = await firestoreGet(`users/${uid}`, token);
  if (plan === "free") {
    if (existing?.lifetime === true) return;
    const now = new Date().toISOString();
    await firestorePatch(`users/${uid}`, { plan: stringValue("free"), planUpdatedAt: timestampValue(now), planExpiresAt: timestampValue(now) }, token);
    if (subscriptionId) {
      await firestorePatch(`users/${uid}/subscriptions/${subscriptionId}`, { planId: stringValue("free"), status: stringValue("cancelled"), provider: stringValue("asaas"), providerSubscriptionId: stringValue(subscriptionId), updatedAt: timestampValue(now) }, token);
    }
    return;
  }

  if (existing?.lifetime === true) return;
  const currentExpiry = existing?.planExpiresAt ? new Date(existing.planExpiresAt) : null;
  const validExpiry = currentExpiry && !Number.isNaN(currentExpiry.getTime()) && currentExpiry.getTime() > Date.now();
  const base = extend && validExpiry ? currentExpiry.getTime() : Date.now();
  const expiresAt = new Date(base + PREMIUM_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();
  await firestorePatch(`users/${uid}`, {
    plan: stringValue("junior"), planUpdatedAt: timestampValue(now), planExpiresAt: timestampValue(expiresAt),
    lastAsaasActivationAt: timestampValue(now), lastAsaasSubscriptionId: stringValue(subscriptionId || ""),
  }, token);
  if (subscriptionId) {
    await firestorePatch(`users/${uid}/subscriptions/${subscriptionId}`, {
      planId: stringValue("junior"), status: stringValue("active"), userId: stringValue(uid), provider: stringValue("asaas"), providerSubscriptionId: stringValue(subscriptionId), updatedAt: timestampValue(now),
    }, token);
  }
}

async function processCheckout(event: string, checkout: any, token: string): Promise<void> {
  const checkoutId = String(checkout?.id || "");
  const reference = String(checkout?.externalReference || "");
  const orderId = extractOrderId(reference);
  if (!checkoutId || !orderId) throw new Error("CHECKOUT_REFERENCE_MISSING");
  const order = await firestoreGet(`premiumOrders/${orderId}`, token);
  if (!order) throw new Error("ORDER_NOT_FOUND");
  const uid = String(order.uid || "");
  if (!uid) throw new Error("ORDER_UID_MISSING");

  const now = new Date().toISOString();
  await firestorePatch(`premiumOrders/${orderId}`, {
    status: stringValue(event === "CHECKOUT_PAID" ? "paid" : event === "CHECKOUT_CANCELED" ? "canceled" : "expired"),
    checkoutStatus: stringValue(String(checkout.status || "")), checkoutId: stringValue(checkoutId),
    customerId: stringValue(String(checkout.customer || "")), updatedAt: timestampValue(now),
  }, token);

  const customerId = String(checkout.customer || "");
  if (customerId) {
    await firestorePatch(`asaasCustomers/${customerId}`, {
      customerId: stringValue(customerId), uid: stringValue(uid), email: stringValue(String(order.email || "")), name: stringValue(String(order.name || "")), updatedAt: timestampValue(now),
    }, token);
  }

  if (event === "CHECKOUT_PAID") {
    const subscriptionId = String(order.kind || "") === "monthly_card" ? String(checkout.subscription || "") : "";
    await setPlan(token, uid, "junior", subscriptionId, false);
    await firestorePatch(`asaasSubscribers/${orderId}`, {
      name: stringValue(String(order.name || "")), email: stringValue(String(order.email || "")), planId: stringValue("junior"), provider: stringValue("asaas"),
      orderId: stringValue(orderId), checkoutId: stringValue(checkoutId), providerSubscriptionId: stringValue(subscriptionId), createdAt: timestampValue(now),
    }, token);
  }
}

async function processSubscriptionCreated(subscription: any, token: string): Promise<void> {
  const subId = String(subscription?.id || "");
  const orderId = extractOrderId(String(subscription?.externalReference || ""));
  if (!subId || !orderId) return;
  const order = await firestoreGet(`premiumOrders/${orderId}`, token);
  if (!order) return;
  const uid = String(order.uid || "");
  if (!uid) return;
  const customerId = String(subscription.customer || "");
  const now = new Date().toISOString();
  if (customerId) {
    await firestorePatch(`asaasCustomers/${customerId}`, { customerId: stringValue(customerId), uid: stringValue(uid), email: stringValue(String(order.email || "")), name: stringValue(String(order.name || "")), updatedAt: timestampValue(now) }, token);
  }
  await firestorePatch(`users/${uid}/subscriptions/${subId}`, { planId: stringValue("junior"), status: stringValue(String(subscription.status || "active")), userId: stringValue(uid), provider: stringValue("asaas"), providerSubscriptionId: stringValue(subId), updatedAt: timestampValue(now) }, token);
}

async function processPayment(event: string, paymentId: string, payload: any, token: string): Promise<void> {
  if (!paymentId) throw new Error("PAYMENT_ID_MISSING");
  const previous = await firestoreGet(`asaasPayments/${paymentId}`, token);
  if (previous?.status === "processed") return;

  const payment = await asaasGet(`/payments/${paymentId}`);
  const subscriptionId = String(payment.subscription || payload?.payment?.subscription || "");
  if (!subscriptionId) return;
  const subscription = await asaasGet(`/subscriptions/${subscriptionId}`);
  const orderId = extractOrderId(String(payment.externalReference || subscription.externalReference || ""));
  if (!orderId) throw new Error("PAYMENT_REFERENCE_MISSING");
  const order = await firestoreGet(`premiumOrders/${orderId}`, token);
  if (!order) throw new Error("ORDER_NOT_FOUND");
  const uid = String(order.uid || "");
  if (!uid) throw new Error("ORDER_UID_MISSING");

  const existing = await firestoreGet(`users/${uid}`, token);
  const lastActivation = existing?.lastAsaasActivationAt ? new Date(existing.lastAsaasActivationAt).getTime() : 0;
  const isInitial = lastActivation > 0 && Date.now() - lastActivation < INITIAL_PAYMENT_GRACE_MS;

  if (!isInitial && (event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED")) {
    await setPlan(token, uid, "junior", subscriptionId, true);
  }
  await markPaymentProcessed(paymentId, uid, subscriptionId, event, token);
}

async function processSubscriptionCancel(subscriptionId: string, payload: any, token: string): Promise<void> {
  if (!subscriptionId) return;
  const subscription = payload?.subscription || await asaasGet(`/subscriptions/${subscriptionId}`);
  const orderId = extractOrderId(String(subscription?.externalReference || ""));
  let uid = "";
  if (orderId) {
    const order = await firestoreGet(`premiumOrders/${orderId}`, token);
    uid = String(order?.uid || "");
  }
  if (!uid && subscription?.customer) {
    const mapping = await firestoreGet(`asaasCustomers/${String(subscription.customer)}`, token);
    uid = String(mapping?.uid || "");
  }
  if (uid) await setPlan(token, uid, "free", subscriptionId, false);
}

async function processEvent(event: string, payload: any, token: string): Promise<void> {
  if (["CHECKOUT_CREATED", "CHECKOUT_PAID", "CHECKOUT_CANCELED", "CHECKOUT_EXPIRED"].includes(event)) return processCheckout(event, payload.checkout || {}, token);
  if (event === "SUBSCRIPTION_CREATED") return processSubscriptionCreated(payload.subscription || {}, token);
  if (["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"].includes(event)) return processPayment(event, String(payload?.payment?.id || ""), payload, token);
  if (["SUBSCRIPTION_DELETED", "SUBSCRIPTION_INACTIVATED"].includes(event)) return processSubscriptionCancel(String(payload?.subscription?.id || ""), payload, token);
}

serve(async (req) => {
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405, headers: responseHeaders() });
  if (!FIREBASE_SERVICE_ACCOUNT || !ASAAS_API_TOKEN || !ASAAS_WEBHOOK_TOKEN) return new Response(JSON.stringify({ error: "not_configured" }), { status: 500, headers: responseHeaders() });

  const provided = req.headers.get("asaas-access-token") || "";
  if (provided !== ASAAS_WEBHOOK_TOKEN) return new Response(JSON.stringify({ error: "invalid_token" }), { status: 401, headers: responseHeaders() });

  let eventId = "";
  let event = "";
  let token = "";
  try {
    const payload = await req.json();
    eventId = String(payload?.id || "");
    event = String(payload?.event || "");
    if (!eventId || !event) return new Response(JSON.stringify({ error: "invalid_event" }), { status: 400, headers: responseHeaders() });

    token = await firestoreAccessToken();
    const existing = await firestoreGet(`asaasEvents/${eventId}`, token);
    if (existing?.status === "processed") return new Response(JSON.stringify({ ok: true, duplicate: true }), { status: 200, headers: responseHeaders() });

    await saveEvent(eventId, event, "received", token);
    await processEvent(event, payload, token);
    await saveEvent(eventId, event, "processed", token);

    return new Response(JSON.stringify({ ok: true, processed: true }), { status: 200, headers: responseHeaders() });
  } catch (error) {
    console.error("[asaas-webhook]", error);
    if (token && eventId) {
      try { await saveEvent(eventId, event, "error", token, String(error?.message || error)); } catch (saveError) { console.error("[asaas-webhook] event-error", saveError); }
    }
    return new Response(JSON.stringify({ error: "processing_failed" }), { status: 500, headers: responseHeaders() });
  }
});
