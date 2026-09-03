// =====================================================================
// Edge Function: mercadopago-webhook
// Recebe notificações de pagamento do Mercado Pago, valida o pagamento e,
// quando aprovado, ATUALIZA O PLANO DO USUÁRIO no Firestore (fonte única).
//
// IMPORTANTE: deploy com --no-verify-jwt (o Mercado Pago chama sem JWT).
//
// Fluxo:
//   MP -> POST /mercadopago-webhook { type: "payment", data: { id } }
//     -> GET /v1/payments/{id}
//     -> se approved: atualiza users/{uid}.plan no Firestore + cria o
//        documento de assinatura ativa.
//     -> marca public.payments como aprovado.
//
// SEGURANÇA:
//   - FIREBASE_SERVICE_ACCOUNT (JSON) e MERCADO_PAGO_ACCESS_TOKEN ficam em
//     secrets do Supabase. Nunca são expostos no frontend.
// =====================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FIREBASE_PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID") ?? "calculadoras-enfermagem";
const FIREBASE_SERVICE_ACCOUNT = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");

const MP_API = "https://api.mercadopago.com";

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
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    throw new Error(`Firestore PATCH ${path} -> ${res.status}: ${await res.text()}`);
  }
}

async function firestoreCreate(path: string, fields: Record<string, unknown>, token: string) {
  const res = await fetch(firestoreUrl(path), {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    throw new Error(`Firestore POST ${path} -> ${res.status}: ${await res.text()}`);
  }
}

// ---------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("method_not_allowed", { status: 405 });
  }
  if (!ACCESS_TOKEN || !FIREBASE_SERVICE_ACCOUNT) {
    return new Response("not_configured", { status: 500 });
  }

  try {
    const payload = await req.json();
    const type = payload?.type;
    const paymentId = payload?.data?.id;

    if (type !== "payment" || !paymentId) {
      // Tópico irrelevante (ex.: merchant_order) — responde ok para o MP parar de reenviar.
      return new Response("ok", { status: 200 });
    }

    // Busca detalhes do pagamento no MP.
    const payRes = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
    });
    const payment = await payRes.json();
    if (!payRes.ok) {
      console.error("Falha ao buscar pagamento no MP", payment);
      return new Response("mp_error", { status: 502 });
    }

    const checkoutId = payment.external_reference;
    const status = payment.status; // approved | pending | rejected | cancelled | ...

    if (checkoutId) {
      const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      // Recupera user_id/plan_id do ledger.
      const { data: row } = await sb
        .from("payments")
        .select("user_id, plan_id")
        .eq("id", checkoutId)
        .maybeSingle();

      if (row?.user_id && row?.plan_id) {
        // Atualiza o ledger com o status atual (idempotente).
        await sb.from("payments")
          .update({ status, mp_payment_id: paymentId, updated_at: new Date().toISOString() })
          .eq("id", checkoutId);

        if (status === "approved") {
          await grantPlan(row.user_id, row.plan_id, paymentId);
        }
      }
    }

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("Erro no webhook", err);
    return new Response("error", { status: 500 });
  }
});

// Atualiza o plano do usuário no Firestore (server-authoritative).
async function grantPlan(uid: string, planId: string, paymentId: number | string) {
  const sa = JSON.parse(FIREBASE_SERVICE_ACCOUNT!);
  const token = await firestoreAccessToken(sa);

  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // +30 dias

  // 1) Atualiza o perfil do usuário (campo usado por Authorization.getPlan()).
  await firestorePatch(
    `users/${uid}`,
    {
      plan: stringValue(planId),
      planUpdatedAt: timestampValue(now),
      planExpiresAt: timestampValue(expiresAt),
    },
    token,
  );

  // 2) Cria o documento de assinatura ativa (histórico/status).
  try {
    await firestoreCreate(
      `users/${uid}/subscriptions/${paymentId}`,
      {
        planId: stringValue(planId),
        status: stringValue("active"),
        userId: stringValue(uid),
        provider: stringValue("mercadopago"),
        providerSubscriptionId: stringValue(String(paymentId)),
        createdAt: timestampValue(now),
        activatedAt: timestampValue(now),
        expiresAt: timestampValue(expiresAt),
      },
      token,
    );
  } catch (err) {
    // Se o documento já existir (reenvio do webhook), ignora — o plano já foi
    // garantido no passo 1.
    console.warn("Falha ao criar subscription doc (pode já existir)", err);
  }
}
