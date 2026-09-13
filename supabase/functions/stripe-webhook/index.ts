// =====================================================================
// Edge Function: stripe-webhook
// Recebe webhooks do Stripe e ATUALIZA O PLANO DO USUÁRIO no Firestore.
//
// Fluxo:
//   Stripe -> POST /stripe-webhook (header "stripe-signature")
//     -> checkout.session.completed: users/{uid}.plan = "junior" (+30 dias)
//     -> customer.subscription.deleted: users/{uid}.plan = "free"
//
// MAPEAMENTO de usuário: o uid é enviado como client_reference_id no
// checkout e também em subscription_data.metadata.uid.
//
// SEGURANÇA: valida a assinatura HMAC-SHA256 (stripe-signature) com o
// STRIPE_WEBHOOK_SECRET (webhook signing secret).
// =====================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const FIREBASE_PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID") ?? "calculadoras-enfermagem";
const FIREBASE_SERVICE_ACCOUNT = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const STRIPE_API = "https://api.stripe.com/v1";

// ───────────────────────── Firestore (REST) ─────────────────────────

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

function b64url(input: string | ArrayBuffer): string {
  const bytes = typeof input === "string"
    ? new TextEncoder().encode(input)
    : new Uint8Array(input);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function firestoreAccessToken(sa: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/datastore",
    aud: sa.token_uri,
    iat: now,
    exp: now + 3600,
  };
  const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(claims))}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(sa.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signingInput),
  );
  const jwt = `${signingInput}.${b64url(sig)}`;
  const res = await fetch(sa.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const data = await res.json();
  if (!data.access_token) {
    throw new Error("Falha ao obter token do Firestore: " + JSON.stringify(data));
  }
  return data.access_token;
}

function firestoreUrl(path: string): string {
  return `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${path}`;
}

function stringValue(v: string) {
  return { stringValue: v };
}
function timestampValue(iso: string) {
  return { timestampValue: iso };
}

async function firestorePatch(path: string, fields: Record<string, unknown>, token: string) {
  const res = await fetch(firestoreUrl(path), {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    throw new Error(`Firestore PATCH ${path} -> ${res.status}: ${await res.text()}`);
  }
}

// ───────────────────────── Assinatura do Stripe ─────────────────────

async function verifyStripeSignature(rawBody: string, signature: string, secret: string): Promise<boolean> {
  // Formato do header: t=1700000000,v1=<hex>
  let timestamp = "";
  let sig = "";
  for (const p of signature.split(",")) {
    if (p.startsWith("t=")) timestamp = p.slice(2);
    else if (p.startsWith("v1=")) sig = p.slice(3);
  }
  if (!timestamp || !sig) return false;

  const signedPayload = `${timestamp}.${rawBody}`;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, enc.encode(signedPayload));
  const hex = Array.from(new Uint8Array(mac)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return hex === sig;
}

// ───────────────────────── Ativação / desativação ───────────────────

async function setPlan(uid: string, planId: string, subId: string, expiresAt?: string) {
  const sa = JSON.parse(FIREBASE_SERVICE_ACCOUNT || "");
  const token = await firestoreAccessToken(sa);
  const now = new Date().toISOString();
  const isPremium = planId !== "free";
  const effectiveExpiresAt = expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  await firestorePatch(
    `users/${uid}`,
    {
      plan: stringValue(planId),
      planUpdatedAt: timestampValue(now),
      planExpiresAt: timestampValue(isPremium ? effectiveExpiresAt : now),
    },
    token,
  );

  try {
    await firestorePatch(
      `users/${uid}/subscriptions/${subId || "stripe_" + Date.now()}`,
      {
        planId: stringValue(planId),
        status: stringValue(isPremium ? "active" : "cancelled"),
        userId: stringValue(uid),
        provider: stringValue("stripe"),
        providerSubscriptionId: stringValue(subId || ""),
        updatedAt: timestampValue(now),
      },
      token,
    );
  } catch (err) {
    console.warn("Falha ao gravar subscription doc", err);
  }
}

async function logSubscriber(id: string, name: string, email: string, planId: string) {
  const sa = JSON.parse(FIREBASE_SERVICE_ACCOUNT || "");
  const token = await firestoreAccessToken(sa);
  await firestorePatch(
    `asaasSubscribers/${id}`,
    {
      name: stringValue(name),
      email: stringValue(email),
      planId: stringValue(planId),
      provider: stringValue("stripe"),
      createdAt: timestampValue(new Date().toISOString()),
    },
    token,
  );
}

// ───────────────────────── Handlers ─────────────────────────────────

async function handleCheckoutCompleted(session: any) {
  const uid = String(session?.client_reference_id || "");
  if (!uid) return;

  const name = String(session?.customer_details?.name || "").trim();
  const email = String(session?.customer_details?.email || "").trim().toLowerCase();
  const subId = String(session?.subscription || "");

  await setPlan(uid, "junior", subId);
  await logSubscriber("stripe_" + (session?.id || Date.now()), name, email, "junior");
}

async function handleSubscriptionDeleted(sub: any) {
  const uid = String(sub?.metadata?.uid || "");
  if (!uid) return;
  await setPlan(uid, "free", String(sub?.id || ""));
}

/**
 * Busca o UID e o fim do período da assinatura no Stripe (para renovação).
 */
async function getSubscriptionMeta(subId: string): Promise<{ uid: string; periodEnd?: string }> {
  if (!subId || !STRIPE_SECRET_KEY) return { uid: "" };
  const res = await fetch(`${STRIPE_API}/subscriptions/${subId}`, {
    headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
  });
  if (!res.ok) return { uid: "" };
  const sub = await res.json();
  const uid = String(sub?.metadata?.uid || "");
  const periodEnd = sub?.current_period_end
    ? new Date(Number(sub.current_period_end) * 1000).toISOString()
    : undefined;
  return { uid, periodEnd };
}

// Renovação mensal bem-sucedida -> estende o premium até o fim do novo período.
async function handleInvoicePaid(invoice: any) {
  const subId = String(invoice?.subscription || "");
  const meta = await getSubscriptionMeta(subId);
  if (!meta.uid) return;
  await setPlan(meta.uid, "junior", subId, meta.periodEnd);
}

// Falha de pagamento -> revoga o acesso (usuário volta a free).
async function handleInvoicePaymentFailed(invoice: any) {
  const subId = String(invoice?.subscription || "");
  const meta = await getSubscriptionMeta(subId);
  if (!meta.uid) return;
  await setPlan(meta.uid, "free", subId);
}

// ───────────────────────── Serve ────────────────────────────────────

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("method_not_allowed", { status: 405 });
  }
  if (!FIREBASE_SERVICE_ACCOUNT) {
    return new Response("not_configured", { status: 500 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature") || "";

  // Webhook secret é obrigatório em produção: sem ele, NÃO processamos nada.
  if (!STRIPE_WEBHOOK_SECRET) {
    return new Response("webhook_secret_not_configured", { status: 500 });
  }
  const ok = await verifyStripeSignature(rawBody, signature, STRIPE_WEBHOOK_SECRET);
  if (!ok) {
    return new Response("invalid_signature", { status: 400 });
  }

  try {
    const event = JSON.parse(rawBody);
    if (event?.type === "checkout.session.completed") {
      await handleCheckoutCompleted(event?.data?.object || {});
    } else if (event?.type === "customer.subscription.deleted") {
      await handleSubscriptionDeleted(event?.data?.object || {});
    } else if (event?.type === "invoice.paid") {
      await handleInvoicePaid(event?.data?.object || {});
    } else if (event?.type === "invoice.payment_failed") {
      await handleInvoicePaymentFailed(event?.data?.object || {});
    }
    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("Erro no stripe-webhook", err);
    return new Response("error", { status: 500 });
  }
});
