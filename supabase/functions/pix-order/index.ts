// =====================================================================
// Edge Function: pix-order
// Registra um pedido de assinatura via Pix (link PicPay) no Firestore e
// notifica o administrador por email.
//
// Fluxo:
//   Front (assinatura.html) -> POST /pix-order { uid, email, name }
//     -> cria paymentRequests/{orderId} no Firestore (status "pending")
//     -> envia email ao admin (se RESEND_API_KEY + ADMIN_EMAIL configurados)
//
// Deploy com --no-verify-jwt (o front chama com a anon key).
// =====================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const FIREBASE_PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID") ?? "calculadoras-enfermagem";
const FIREBASE_SERVICE_ACCOUNT = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") ?? "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";

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

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("method_not_allowed", { status: 405 });
  }
  if (!FIREBASE_SERVICE_ACCOUNT) {
    return new Response("not_configured", { status: 500 });
  }

  try {
    const body = await req.json();
    const uid = body?.uid;
    const email = body?.email || "";
    const name = body?.name || "";
    if (!uid) {
      return new Response("missing_uid", { status: 400 });
    }

    const sa = JSON.parse(FIREBASE_SERVICE_ACCOUNT);
    const token = await firestoreAccessToken(sa);
    const now = new Date().toISOString();
    const orderId = "px_" + Date.now() + "_" + String(uid).slice(0, 8);

    await firestorePatch(
      `paymentRequests/${orderId}`,
      {
        uid: stringValue(uid),
        email: stringValue(email),
        name: stringValue(name),
        amount: stringValue("10.00"),
        planId: stringValue("junior"),
        status: stringValue("pending"),
        createdAt: timestampValue(now),
      },
      token,
    );

    // Envia email ao admin (opcional, via Resend).
    let emailSent = false;
    if (RESEND_API_KEY && ADMIN_EMAIL) {
      try {
        const r = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: "Bearer " + RESEND_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Calculadoras de Enfermagem <onboarding@resend.dev>",
            to: [ADMIN_EMAIL],
            subject: "Novo pagamento Pix aguardando liberação",
            html:
              "<p><strong>Novo pedido de assinatura (Plano Júnior)!</strong></p>" +
              "<p>Nome: " + (name || "-") + "</p>" +
              "<p>Email: " + (email || "-") + "</p>" +
              "<p>UID: " + uid + "</p>" +
              "<p>Valor: R$ 10,00</p>" +
              "<p>Acesse o painel admin para liberar o acesso.</p>",
          }),
        });
        emailSent = r.ok;
      } catch (e) {
        console.warn("Falha ao enviar email de notificação", e);
      }
    }

    return new Response(
      JSON.stringify({ ok: true, orderId, emailSent }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Erro no pix-order", err);
    return new Response(
      JSON.stringify({ error: String((err && (err as Error).message) || err) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
