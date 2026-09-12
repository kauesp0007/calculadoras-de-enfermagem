// =====================================================================
// Edge Function: asaas-webhook
// Recebe webhooks do Asaas e ATUALIZA O PLANO DO USUÁRIO no Firestore.
//
// Fluxo:
//   Asaas -> POST /asaas-webhook (JSON) com header "asaas-access-token"
//     -> PAYMENT_CONFIRMED (cartão) / PAYMENT_RECEIVED (pix/boleto):
//        users/{uid}.plan = "junior" (+30 dias)
//     -> SUBSCRIPTION_DELETED / SUBSCRIPTION_INACTIVATED:
//        users/{uid}.plan = "free"
//
// MAPEAMENTO de usuário: o pagamento é feito num link público, então o
// Asaas cria o cliente automaticamente (email/CPF informados no checkout).
// Nós buscamos a cobrança (payment) na API do Asaas, pegamos o cliente,
// lemos o email e localizamos o UID no Firestore (users/{email}).
//
// SEGURANÇA: valida o header "asaas-access-token" com o ASAAS_WEBHOOK_TOKEN
// (authToken configurado no webhook do Asaas).
// =====================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const FIREBASE_PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID") ?? "calculadoras-enfermagem";
const FIREBASE_SERVICE_ACCOUNT = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
const ASAAS_API_TOKEN = Deno.env.get("ASAAS_API_TOKEN") ?? "";
const ASAAS_WEBHOOK_TOKEN = Deno.env.get("ASAAS_WEBHOOK_TOKEN") ?? "";
const ASAAS_API_BASE = "https://api.asaas.com/v3";

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

async function firestoreGet(path: string, token: string): Promise<Record<string, unknown> | null> {
  const res = await fetch(firestoreUrl(path), {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Firestore GET ${path} -> ${res.status}: ${await res.text()}`);
  }
  return await res.json();
}

// Localiza o UID do usuário pelo email. Usa o Firebase Auth (Identity
// Toolkit) em vez de runQuery no Firestore, para não depender da quota
// de consultas estruturadas do plano gratuito.
async function getUidByEmailAuth(email: string): Promise<string> {
  const sa = JSON.parse(FIREBASE_SERVICE_ACCOUNT || "");
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/identitytoolkit",
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
  const tokenRes = await fetch(sa.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    throw new Error("Falha ao obter token do Identity Toolkit: " + JSON.stringify(tokenData));
  }
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/accounts:lookup`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: [email] }),
    },
  );
  if (!res.ok) {
    throw new Error(`Identity Toolkit lookup -> ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  const users = (data.users || []) as Array<any>;
  if (!users.length) return "";
  return String(users[0].localId || "");
}

// Localiza o UID do usuário pelo email (campo "email" no doc users/{uid}).
async function findUidByEmail(email: string, token: string): Promise<string> {
  return await getUidByEmailAuth(email);
}

// ───────────────────────── Asaas (API) ──────────────────────────────

async function asaasGet(path: string): Promise<any> {
  if (!ASAAS_API_TOKEN) {
    throw new Error("ASAAS_API_TOKEN não configurado");
  }
  const res = await fetch(`${ASAAS_API_BASE}${path}`, {
    method: "GET",
    headers: { access_token: ASAAS_API_TOKEN },
  });
  if (!res.ok) {
    throw new Error(`Asaas GET ${path} -> ${res.status}: ${await res.text()}`);
  }
  return await res.json();
}

// ───────────────────────── Ativação / desativação ───────────────────

async function setPlan(uid: string, planId: string, subscriptionId: string) {
  const sa = JSON.parse(FIREBASE_SERVICE_ACCOUNT || "");
  const token = await firestoreAccessToken(sa);
  const now = new Date().toISOString();
  const isPremium = planId !== "free";
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  await firestorePatch(
    `users/${uid}`,
    {
      plan: stringValue(planId),
      planUpdatedAt: timestampValue(now),
      planExpiresAt: timestampValue(isPremium ? expiresAt : now),
    },
    token,
  );

  try {
    await firestorePatch(
      `users/${uid}/subscriptions/${subscriptionId || "asaas_" + Date.now()}`,
      {
        planId: stringValue(planId),
        status: stringValue(isPremium ? "active" : "cancelled"),
        userId: stringValue(uid),
        provider: stringValue("asaas"),
        providerSubscriptionId: stringValue(subscriptionId || ""),
        updatedAt: timestampValue(now),
      },
      token,
    );
  } catch (err) {
    console.warn("Falha ao gravar subscription doc", err);
  }
}

// Marca o pagamento como processado (idempotência — entrega "at least once").
async function markProcessed(paymentId: string) {
  const sa = JSON.parse(FIREBASE_SERVICE_ACCOUNT || "");
  const token = await firestoreAccessToken(sa);
  await firestorePatch(
    `asaasEvents/${paymentId}`,
    {
      processedAt: timestampValue(new Date().toISOString()),
    },
    token,
  );
}

async function alreadyProcessed(paymentId: string): Promise<boolean> {
  const sa = JSON.parse(FIREBASE_SERVICE_ACCOUNT || "");
  const token = await firestoreAccessToken(sa);
  const doc = await firestoreGet(`asaasEvents/${paymentId}`, token);
  return !!doc;
}

// Registra o assinante em um log dedicado (para o painel admin).
async function logSubscriber(paymentId: string, name: string, email: string, planId: string) {
  const sa = JSON.parse(FIREBASE_SERVICE_ACCOUNT || "");
  const token = await firestoreAccessToken(sa);
  await firestorePatch(
    `asaasSubscribers/${paymentId}`,
    {
      name: stringValue(name),
      email: stringValue(email),
      planId: stringValue(planId),
      createdAt: timestampValue(new Date().toISOString()),
    },
    token,
  );
}

// ───────────────────────── Handlers ─────────────────────────────────

// Ativa o plano quando o pagamento é confirmado/recebido.
async function handlePayment(event: string, paymentId: string) {
  if (!paymentId) return;
  // NOTA: a checagem de idempotência (alreadyProcessed) foi REMOVIDA para
  // não depender de LEITURA do Firestore (quota de leitura excedida, 429).
  // setPlan é idempotente (grava o mesmo valor), então reenvios do Asaas
  // são inofensivos.

  const payment = await asaasGet(`/payments/${paymentId}`);
  const billingType = String(payment.billingType || "");
  const status = String(payment.status || "");
  const customerId = payment.customer || "";
  const subscriptionId = payment.subscription || "";

  // Decide se ativa com base no tipo de pagamento e no evento:
  //   Cartão -> ativa em PAYMENT_CONFIRMED (fundos só chegam em 32 dias).
  //   Pix/Boleto -> ativa em PAYMENT_RECEIVED.
  const isCard = billingType === "CREDIT_CARD" || billingType === "DEBIT_CARD";
  const shouldActivate = isCard
    ? event === "PAYMENT_CONFIRMED"
    : event === "PAYMENT_RECEIVED";
  if (!shouldActivate) return;

  // Garante que o status confirma o pagamento.
  const paid = status === "CONFIRMED" || status === "RECEIVED";
  if (!paid) return;

  // Email e nome do cliente (para localizar o UID e registrar o log).
  // Normaliza o email para minúsculas (Firebase Auth guarda em minúsculas).
  let email = "";
  let name = "";
  if (customerId) {
    const customer = await asaasGet(`/customers/${customerId}`);
    email = String(customer?.email || "").trim().toLowerCase();
    name = String(customer?.name || "").trim();
  }
  if (!email) return;

  const sa = JSON.parse(FIREBASE_SERVICE_ACCOUNT || "");
  const token = await firestoreAccessToken(sa);
  const uid = await findUidByEmail(email, token);
  if (!uid) {
    console.warn("Usuário não encontrado pelo email: " + email);
    return;
  }

  await setPlan(uid, "junior", subscriptionId);
  await logSubscriber(paymentId, name, email, "junior");
  await markProcessed(paymentId);
}

// Desativa o plano quando a assinatura é cancelada.
async function handleSubscriptionCancel(subscriptionId: string) {
  if (!subscriptionId) return;

  const subscription = await asaasGet(`/subscriptions/${subscriptionId}`);
  const customerId = subscription?.customer || "";
  if (!customerId) return;

  const customer = await asaasGet(`/customers/${customerId}`);
  const email = String(customer?.email || "").trim().toLowerCase();
  if (!email) return;

  const sa = JSON.parse(FIREBASE_SERVICE_ACCOUNT || "");
  const token = await firestoreAccessToken(sa);
  const uid = await findUidByEmail(email, token);
  if (!uid) return;

  await setPlan(uid, "free", subscriptionId);
}

// ───────────────────────── Serve ────────────────────────────────────

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("method_not_allowed", { status: 405 });
  }
  if (!FIREBASE_SERVICE_ACCOUNT) {
    return new Response("not_configured", { status: 500 });
  }

  // Valida o token do webhook (header asaas-access-token).
  if (ASAAS_WEBHOOK_TOKEN) {
    const provided = req.headers.get("asaas-access-token") || "";
    if (provided !== ASAAS_WEBHOOK_TOKEN) {
      return new Response("invalid_token", { status: 401 });
    }
  }

  try {
    const payload = await req.json();
    const event = String(payload?.event || "");
    const paymentId = String(payload?.payment?.id || "");
    const subscriptionId = String(payload?.subscription?.id || "");

    if (event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED") {
      await handlePayment(event, paymentId);
    } else if (
      event === "SUBSCRIPTION_DELETED" ||
      event === "SUBSCRIPTION_INACTIVATED"
    ) {
      await handleSubscriptionCancel(subscriptionId);
    }

    return new Response("ok", { status: 200 });
  } catch (err) {
    // Responde 200 mesmo em erro para NÃO disparar retry do Asaas
    // (ex.: quota excedida no Firestore), evitando loop que esgota a quota.
    console.error("Erro no asaas-webhook", err);
    return new Response("ok", { status: 200 });
  }
});
