// =====================================================================
// Edge Function: grant-access
// Administração de acesso (somente administradores).
//
// Actions:
//   inspect -> { adminEmail, targetEmail }
//      Retorna o doc users/{uid} do usuário (email, plan, planExpiresAt,
//      lifetime) e a lista de cobranças registradas em asaasSubscribers.
//
//   grant   -> { adminEmail, targetEmail, planId? }
//      Concede o plano (padrão "senior") de forma VITALÍCIA
//      (lifetime=true, planExpiresAt distante). Se o usuário não tiver
//      conta ainda, retorna "user_not_found" (é preciso criar a conta
//      no site com este e-mail antes).
//
// Deploy com --no-verify-jwt (o front/CLI chama com a anon key).
// =====================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const FIREBASE_PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID") ?? "calculadoras-enfermagem";
const FIREBASE_SERVICE_ACCOUNT = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");

const ADMIN_EMAILS = [
  Deno.env.get("ADMIN_EMAIL") ?? "kauepg18@gmail.com",
  Deno.env.get("ADMIN_EMAIL_2") ?? "kauesp07@hotmail.com",
].filter(Boolean).map((e) => e.toLowerCase());

const LIFETIME_EXPIRES_AT = "2099-12-31T23:59:59.000Z";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, apikey, Content-Type",
  };
}

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
function booleanValue(v: boolean) {
  return { booleanValue: v };
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

function fieldString(fields: any, key: string): string {
  const v = fields && fields[key];
  if (!v) return "";
  if (v.stringValue !== undefined) return v.stringValue;
  if (v.booleanValue !== undefined) return String(v.booleanValue);
  return "";
}

// Localiza o UID do usuário pelo email (campo "email" no doc users/{uid}).
// Usa LISTAGEM da coleção (não runQuery) para evitar a quota de
// consultas estruturadas do plano gratuito do Firestore.
async function findUidByEmail(email: string, token: string): Promise<string> {
  const target = email.toLowerCase();
  let pageToken = "";
  for (;;) {
    const url =
      `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/users?pageSize=300` +
      (pageToken ? "&pageToken=" + encodeURIComponent(pageToken) : "");
    const res = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw new Error(`Firestore list users -> ${res.status}: ${await res.text()}`);
    }
    const data = await res.json();
    const docs = (data.documents || []) as Array<any>;
    for (const d of docs) {
      const em = fieldString(d.fields, "email").toLowerCase();
      if (em === target) {
        const parts = String(d.name).split("/");
        return parts[parts.length - 1];
      }
    }
    if (!data.nextPageToken) break;
    pageToken = data.nextPageToken;
  }
  return "";
}

// Obtém o UID pelo email via Firebase Auth (Identity Toolkit Admin API),
// que NÃO depende da quota do Firestore (datastore).
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

// Lista cobranças registradas (asaasSubscribers) com o email alvo.
async function listSubscriberEvents(email: string, token: string): Promise<Array<Record<string, string>>> {
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/asaasSubscribers`,
    { method: "GET", headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) return [];
  const data = await res.json();
  const docs = (data.documents || []) as Array<any>;
  const out: Array<Record<string, string>> = [];
  for (const d of docs) {
    const em = fieldString(d.fields, "email").toLowerCase();
    if (em === email.toLowerCase()) {
      out.push({
        name: fieldString(d.fields, "name"),
        email: em,
        planId: fieldString(d.fields, "planId"),
        createdAt: fieldString(d.fields, "createdAt"),
      });
    }
  }
  out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return out;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (req.method !== "POST") {
    return new Response("method_not_allowed", { status: 405, headers: corsHeaders() });
  }
  if (!FIREBASE_SERVICE_ACCOUNT) {
    return new Response(JSON.stringify({ error: "not_configured" }), { status: 500, headers: corsHeaders() });
  }

  try {
    const body = await req.json();
    const adminEmail = String(body?.adminEmail || "").toLowerCase();
    if (ADMIN_EMAILS.indexOf(adminEmail) === -1) {
      return new Response(
        JSON.stringify({ error: "unauthorized" }),
        { status: 403, headers: { ...corsHeaders(), "Content-Type": "application/json" } },
      );
    }

    const targetEmail = String(body?.targetEmail || "").trim().toLowerCase();
    if (!targetEmail) {
      return new Response(JSON.stringify({ error: "targetEmail_required" }), { status: 400, headers: corsHeaders() });
    }

    const sa = JSON.parse(FIREBASE_SERVICE_ACCOUNT);
    const token = await firestoreAccessToken(sa);

    // Obtém o UID via Firebase Auth (não depende da quota do Firestore),
    // com fallback para a listagem do Firestore.
    let uid = "";
    try {
      uid = await getUidByEmailAuth(targetEmail);
    } catch (e) {
      console.warn("Auth lookup falhou, tentando Firestore list", e);
    }
    if (!uid) {
      uid = await findUidByEmail(targetEmail, token);
    }

    const action = String(body?.action || "inspect");

    if (action === "grant") {
      if (!uid) {
        return new Response(
          JSON.stringify({
            ok: false,
            error: "user_not_found",
            message: "Usuário sem conta no site. É preciso criar/login com este e-mail antes de conceder o plano.",
          }),
          { status: 404, headers: corsHeaders() },
        );
      }
      const planId = String(body?.planId || "senior");
      const now = new Date().toISOString();
      await firestorePatch(
        `users/${uid}`,
        {
          plan: stringValue(planId),
          planExpiresAt: timestampValue(LIFETIME_EXPIRES_AT),
          planUpdatedAt: timestampValue(now),
          lifetime: booleanValue(true),
        },
        token,
      );
      return new Response(
        JSON.stringify({ ok: true, uid, email: targetEmail, planId, lifetime: true }),
        { status: 200, headers: { ...corsHeaders(), "Content-Type": "application/json" } },
      );
    }

    // inspect (padrão)
    let userDoc: Record<string, unknown> | null = null;
    if (uid) {
      userDoc = await firestoreGet(`users/${uid}`, token);
    }
    const fields = (userDoc && (userDoc as any).fields) || {};
    const events = await listSubscriberEvents(targetEmail, token);

    return new Response(
      JSON.stringify({
        ok: true,
        found: !!uid,
        uid: uid || "",
        email: targetEmail,
        plan: fieldString(fields, "plan"),
        planExpiresAt: fieldString(fields, "planExpiresAt"),
        lifetime: fieldString(fields, "lifetime"),
        createdAt: fieldString(fields, "createdAt"),
        chargeCount: events.length,
        charges: events,
      }),
      { status: 200, headers: { ...corsHeaders(), "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Erro no grant-access", err);
    return new Response(
      JSON.stringify({ error: String((err && (err as Error).message) || err) }),
      { status: 500, headers: { ...corsHeaders(), "Content-Type": "application/json" } },
    );
  }
});
