// =====================================================================
// Edge Function: lemon-webhook
// Recebe webhooks do Lemon Squeezy e ATUALIZA O PLANO DO USUÁRIO no Firestore.
//
// Fluxo:
//   Lemon Squeezy -> POST /lemon-webhook (JSON:API + X-Signature header)
//     -> order_created / subscription_created: users/{uid}.plan = "junior"
//     -> subscription_cancelled / subscription_expired: users/{uid}.plan = "free"
//
// Mapeamento: o uid do Firebase é passado no checkout como custom data
//   ?checkout[custom][uid]=UID  ->  meta.custom_data.uid no webhook.
//
// SEGURANÇA: valida a assinatura HMAC-SHA256 (X-Signature) com o
// LEMON_WEBHOOK_SECRET (signing secret do Lemon Squeezy).
// =====================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const FIREBASE_PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID") ?? "calculadoras-enfermagem";
const FIREBASE_SERVICE_ACCOUNT = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
const LEMON_WEBHOOK_SECRET = Deno.env.get("LEMON_WEBHOOK_SECRET") ?? "";

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

// Verifica a assinatura HMAC-SHA256 (hex) do Lemon Squeezy.
async function verifySignature(rawBody: string, signature: string, secret: string): Promise<boolean> {
  if (!secret) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(rawBody));
  const hex = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return hex === signature;
}

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

  // Histórico da assinatura.
  try {
    await firestorePatch(
      `users/${uid}/subscriptions/${subscriptionId}`,
      {
        planId: stringValue(planId),
        status: stringValue(isPremium ? "active" : "cancelled"),
        userId: stringValue(uid),
        provider: stringValue("lemonsqueezy"),
        providerSubscriptionId: stringValue(subscriptionId),
        updatedAt: timestampValue(now),
      },
      token,
    );
  } catch (err) {
    console.warn("Falha ao gravar subscription doc", err);
  }
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("method_not_allowed", { status: 405 });
  }
  if (!FIREBASE_SERVICE_ACCOUNT) {
    return new Response("not_configured", { status: 500 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("X-Signature") || "";

  // Valida a assinatura (se o secret estiver configurado).
  if (LEMON_WEBHOOK_SECRET) {
    const ok = await verifySignature(rawBody, signature, LEMON_WEBHOOK_SECRET);
    if (!ok) {
      return new Response("invalid_signature", { status: 401 });
    }
  }

  try {
    const payload = JSON.parse(rawBody);
    const eventName = payload?.meta?.event_name || "";
    const customData = payload?.meta?.custom_data || {};
    const uid = customData.uid || customData.user_id || "";
    const dataId = payload?.data?.id || "";
    const orderStatus = payload?.data?.attributes?.status || "";

    // Sem uid (custom data) -> não sabemos qual usuário liberar.
    if (!uid) {
      return new Response("ok", { status: 200 });
    }

    if (
      eventName === "order_created" ||
      eventName === "subscription_created" ||
      eventName === "subscription_updated"
    ) {
      // order_created sem status "paid" -> não ativa ainda.
      if (eventName === "order_created" && orderStatus && orderStatus !== "paid") {
        return new Response("ok", { status: 200 });
      }
      await setPlan(uid, "junior", dataId || "ls_" + Date.now());
    } else if (
      eventName === "subscription_cancelled" ||
      eventName === "subscription_expired"
    ) {
      await setPlan(uid, "free", dataId || "ls_" + Date.now());
    }

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("Erro no lemon-webhook", err);
    return new Response("error", { status: 500 });
  }
});
