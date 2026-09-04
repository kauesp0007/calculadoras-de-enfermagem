// =====================================================================
// Edge Function: paypal-webhook
// Recebe notificações do PayPal Subscriptions e, quando a assinatura é
// ativada, ATUALIZA O PLANO DO USUÁRIO no Firestore (fonte única da verdade).
//
// IMPORTANTE: deploy com --no-verify-jwt (o PayPal chama sem JWT).
//
// Fluxo:
//   PayPal -> POST /paypal-webhook { event_type, resource: { id, custom_id } }
//     -> BILLING.SUBSCRIPTION.ACTIVATED: users/{uid}.plan = "junior"
//     -> BILLING.SUBSCRIPTION.CANCELLED/SUSPENDED/EXPIRED: users/{uid}.plan = "free"
//
// SEGURANÇA:
//   - FIREBASE_SERVICE_ACCOUNT (JSON) fica em secret do Supabase. Nunca no front.
//   - custom_id é o UID do Firebase, enviado no createSubscription (botão).
// =====================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const FIREBASE_PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID") ?? "calculadoras-enfermagem";
const FIREBASE_SERVICE_ACCOUNT = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");

// ---------------------------------------------------------------------
// Firestore (REST) — helpers usando service account (sem SDK gRPC).
// ---------------------------------------------------------------------

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

async function firestoreCreate(path: string, fields: Record<string, unknown>, token: string) {
  const res = await fetch(firestoreUrl(path), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    throw new Error(`Firestore POST ${path} -> ${res.status}: ${await res.text()}`);
  }
}

// ---------------------------------------------------------------------
// Atualiza o plano do usuário no Firestore (server-authoritative).
// ---------------------------------------------------------------------
async function setPlan(uid: string, planId: string, subscriptionId: string) {
  const sa = JSON.parse(FIREBASE_SERVICE_ACCOUNT || "");
  const token = await firestoreAccessToken(sa);

  const now = new Date().toISOString();
  const isPremium = planId !== "free";
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // +30 dias

  // 1) Perfil do usuário (campo lido por Authorization.getPlan()).
  await firestorePatch(
    `users/${uid}`,
    {
      plan: stringValue(planId),
      planUpdatedAt: timestampValue(now),
      planExpiresAt: timestampValue(isPremium ? expiresAt : now),
    },
    token,
  );

  // 2) Documento de assinatura (histórico/status).
  try {
    await firestoreCreate(
      `users/${uid}/subscriptions/${subscriptionId}`,
      {
        planId: stringValue(planId),
        status: stringValue(isPremium ? "active" : "cancelled"),
        userId: stringValue(uid),
        provider: stringValue("paypal"),
        providerSubscriptionId: stringValue(subscriptionId),
        createdAt: timestampValue(now),
        activatedAt: timestampValue(isPremium ? now : ""),
        expiresAt: timestampValue(isPremium ? expiresAt : now),
      },
      token,
    );
  } catch (err) {
    // Se o documento já existir (reenvio do webhook), ignora — o plano já foi
    // garantido no passo 1.
    console.warn("Falha ao criar subscription doc (pode já existir)", err);
  }
}

// ---------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------
serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("method_not_allowed", { status: 405 });
  }
  if (!FIREBASE_SERVICE_ACCOUNT) {
    return new Response("not_configured", { status: 500 });
  }

  try {
    const payload = await req.json();
    const eventType = payload?.event_type;
    const resource = payload?.resource;
    const subscriptionId = resource?.id;
    const uid = resource?.custom_id;

    // Evento sem assinatura/custom_id -> responde ok (evita reenvio).
    if (!subscriptionId || !uid) {
      return new Response("ok", { status: 200 });
    }

    if (eventType === "BILLING.SUBSCRIPTION.ACTIVATED") {
      await setPlan(uid, "junior", subscriptionId);
    } else if (
      eventType === "BILLING.SUBSCRIPTION.CANCELLED" ||
      eventType === "BILLING.SUBSCRIPTION.SUSPENDED" ||
      eventType === "BILLING.SUBSCRIPTION.EXPIRED"
    ) {
      await setPlan(uid, "free", subscriptionId);
    }

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("Erro no webhook PayPal", err);
    return new Response(
      JSON.stringify({ error: String((err && err.message) || err) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
