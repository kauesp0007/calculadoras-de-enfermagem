// =====================================================================
// Edge Function: asaas-admin
// Painel de administração (somente leitura): lista os assinantes.
//
// Fluxo:
//   Front (admin-pagamentos.html) -> POST /asaas-admin { adminEmail }
//     -> verifica se adminEmail é administrador
//     -> lista asaasSubscribers/{paymentId} em ordem cronológica (mais recente)
//
// Deploy com --no-verify-jwt (o front chama com a anon key).
// =====================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const FIREBASE_PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID") ?? "calculadoras-enfermagem";
const FIREBASE_SERVICE_ACCOUNT = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");

const ADMIN_EMAILS = [
  Deno.env.get("ADMIN_EMAIL") ?? "kauepg18@gmail.com",
  Deno.env.get("ADMIN_EMAIL_2") ?? "kauesp07@hotmail.com",
].filter(Boolean).map((e) => e.toLowerCase());

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

function fieldString(fields: any, key: string): string {
  const v = fields && fields[key];
  if (!v) return "";
  return v.stringValue ?? "";
}

// Lista todos os assinantes (coleção asaasSubscribers).
async function listSubscribers(): Promise<Array<Record<string, string>>> {
  const sa = JSON.parse(FIREBASE_SERVICE_ACCOUNT || "");
  const token = await firestoreAccessToken(sa);

  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/asaasSubscribers`,
    { method: "GET", headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) {
    throw new Error(`Firestore list -> ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  const docs = (data.documents || []) as Array<any>;

  const out = docs.map((d) => ({
    name: fieldString(d.fields, "name"),
    email: fieldString(d.fields, "email"),
    planId: fieldString(d.fields, "planId"),
    createdAt: fieldString(d.fields, "createdAt"),
  }));

  // Ordena do mais recente para o mais antigo (createdAt ISO, ordem cronológica).
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
    return new Response("not_configured", { status: 500, headers: corsHeaders() });
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

    const subscribers = await listSubscribers();
    return new Response(
      JSON.stringify({ ok: true, subscribers }),
      { status: 200, headers: { ...corsHeaders(), "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Erro no asaas-admin", err);
    return new Response(
      JSON.stringify({ error: String((err && (err as Error).message) || err) }),
      { status: 500, headers: { ...corsHeaders(), "Content-Type": "application/json" } },
    );
  }
});
