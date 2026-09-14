// =====================================================================
// Edge Function: grant-access
// Administração de acesso (somente administradores).
//
// Autenticação: o chamador deve apresentar um ID token válido do Firebase.
// A identidade administrativa vem do JWT e não do corpo da requisição.
// =====================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createRemoteJWKSet, jwtVerify } from "npm:jose@5.10.0";

const FIREBASE_PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID") ?? "calculadoras-enfermagem";
const FIREBASE_SERVICE_ACCOUNT = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
const FIREBASE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"));
const ADMIN_EMAILS = [
  Deno.env.get("ADMIN_EMAIL") ?? "kauepg18@gmail.com",
  Deno.env.get("ADMIN_EMAIL_2") ?? "kauesp07@hotmail.com",
].filter(Boolean).map((e) => e.trim().toLowerCase());
const LIFETIME_EXPIRES_AT = "2099-12-31T23:59:59.000Z";

function corsHeaders() {
  return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Authorization, apikey, Content-Type", "Content-Type": "application/json; charset=utf-8" };
}

async function verifyFirebaseAdmin(req: Request): Promise<{ uid: string; email: string }> {
  const header = req.headers.get("Authorization") || "";
  if (!header.startsWith("Bearer ")) throw new Error("unauthorized");
  const token = header.slice(7).trim();
  if (!token) throw new Error("unauthorized");
  const { payload } = await jwtVerify(token, FIREBASE_JWKS, {
    algorithms: ["RS256"],
    issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
    audience: FIREBASE_PROJECT_ID,
  });
  const uid = String(payload.sub || "").trim();
  const email = String(payload.email || "").trim().toLowerCase();
  if (!uid || !email || !ADMIN_EMAILS.includes(email)) throw new Error("unauthorized");
  return { uid, email };
}

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
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function firestoreAccessToken(sa: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claims = { iss: sa.client_email, scope: "https://www.googleapis.com/auth/datastore", aud: sa.token_uri, iat: now, exp: now + 3600 };
  const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(claims))}`;
  const key = await crypto.subtle.importKey("pkcs8", pemToArrayBuffer(sa.private_key), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(signingInput));
  const jwt = `${signingInput}.${b64url(sig)}`;
  const res = await fetch(sa.token_uri, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) throw new Error("Falha ao obter token do Firestore");
  return data.access_token;
}
function firestoreUrl(path: string): string { return `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${path}`; }
function stringValue(v: string) { return { stringValue: v }; }
function booleanValue(v: boolean) { return { booleanValue: v }; }
function timestampValue(iso: string) { return { timestampValue: iso }; }
async function firestorePatch(path: string, fields: Record<string, unknown>, token: string) {
  const res = await fetch(firestoreUrl(path), { method: "PATCH", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ fields }) });
  if (!res.ok) throw new Error(`Firestore PATCH ${path} -> ${res.status}`);
}
async function firestoreGet(path: string, token: string): Promise<Record<string, unknown> | null> {
  const res = await fetch(firestoreUrl(path), { method: "GET", headers: { Authorization: `Bearer ${token}` } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Firestore GET ${path} -> ${res.status}`);
  return await res.json();
}
function fieldString(fields: any, key: string): string {
  const v = fields && fields[key];
  if (!v) return "";
  if (v.stringValue !== undefined) return v.stringValue;
  if (v.booleanValue !== undefined) return String(v.booleanValue);
  return "";
}
async function findUidByEmail(email: string, token: string): Promise<string> {
  const target = email.toLowerCase();
  let pageToken = "";
  for (;;) {
    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/users?pageSize=300${pageToken ? "&pageToken=" + encodeURIComponent(pageToken) : ""}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Firestore list users -> ${res.status}`);
    const data = await res.json();
    for (const d of (data.documents || []) as Array<any>) {
      if (fieldString(d.fields, "email").toLowerCase() === target) return String(d.name).split("/").pop() || "";
    }
    if (!data.nextPageToken) break;
    pageToken = data.nextPageToken;
  }
  return "";
}
async function getUidByEmailAuth(email: string): Promise<string> {
  const sa = JSON.parse(FIREBASE_SERVICE_ACCOUNT || "");
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claims = { iss: sa.client_email, scope: "https://www.googleapis.com/auth/identitytoolkit", aud: sa.token_uri, iat: now, exp: now + 3600 };
  const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(claims))}`;
  const key = await crypto.subtle.importKey("pkcs8", pemToArrayBuffer(sa.private_key), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(signingInput));
  const jwt = `${signingInput}.${b64url(sig)}`;
  const tokenRes = await fetch(sa.token_uri, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }) });
  const tokenData = await tokenRes.json().catch(() => ({}));
  if (!tokenRes.ok || !tokenData.access_token) throw new Error("Falha ao obter token do Identity Toolkit");
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/accounts:lookup`, { method: "POST", headers: { Authorization: `Bearer ${tokenData.access_token}`, "Content-Type": "application/json" }, body: JSON.stringify({ email: [email] }) });
  if (!res.ok) throw new Error(`Identity Toolkit lookup -> ${res.status}`);
  const data = await res.json();
  return String(data.users?.[0]?.localId || "");
}
async function listSubscriberEvents(email: string, token: string): Promise<Array<Record<string, string>>> {
  const res = await fetch(`https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/asaasSubscribers`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return [];
  const data = await res.json();
  const out: Array<Record<string, string>> = [];
  for (const d of (data.documents || []) as Array<any>) {
    if (fieldString(d.fields, "email").toLowerCase() === email.toLowerCase()) out.push({ name: fieldString(d.fields, "name"), email: email.toLowerCase(), planId: fieldString(d.fields, "planId"), createdAt: fieldString(d.fields, "createdAt") });
  }
  out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return out;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders() });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405, headers: corsHeaders() });
  if (!FIREBASE_SERVICE_ACCOUNT) return new Response(JSON.stringify({ error: "not_configured" }), { status: 500, headers: corsHeaders() });
  try {
    const admin = await verifyFirebaseAdmin(req);
    const body = await req.json();
    const targetEmail = String(body?.targetEmail || "").trim().toLowerCase();
    if (!targetEmail) return new Response(JSON.stringify({ error: "targetEmail_required" }), { status: 400, headers: corsHeaders() });
    const sa = JSON.parse(FIREBASE_SERVICE_ACCOUNT);
    const token = await firestoreAccessToken(sa);
    let uid = "";
    try { uid = await getUidByEmailAuth(targetEmail); } catch (_) { uid = await findUidByEmail(targetEmail, token); }
    const action = String(body?.action || "inspect");
    if (action === "grant") {
      if (!uid) return new Response(JSON.stringify({ ok: false, error: "user_not_found", message: "Usuário sem conta no site." }), { status: 404, headers: corsHeaders() });
      const planId = String(body?.planId || "junior");
      const now = new Date().toISOString();
      await firestorePatch(`users/${uid}`, { plan: stringValue(planId), planExpiresAt: timestampValue(LIFETIME_EXPIRES_AT), planUpdatedAt: timestampValue(now), lifetime: booleanValue(true) }, token);
      return new Response(JSON.stringify({ ok: true, uid, email: targetEmail, planId, lifetime: true, adminUid: admin.uid }), { status: 200, headers: corsHeaders() });
    }
    let userDoc: Record<string, unknown> | null = null;
    if (uid) userDoc = await firestoreGet(`users/${uid}`, token);
    const fields = (userDoc && (userDoc as any).fields) || {};
    const events = await listSubscriberEvents(targetEmail, token);
    return new Response(JSON.stringify({ ok: true, found: !!uid, uid: uid || "", email: targetEmail, plan: fieldString(fields, "plan"), planExpiresAt: fieldString(fields, "planExpiresAt"), lifetime: fieldString(fields, "lifetime"), createdAt: fieldString(fields, "createdAt"), chargeCount: events.length, charges: events }), { status: 200, headers: corsHeaders() });
  } catch (err) {
    const msg = String((err as Error)?.message || err);
    console.error("Erro no grant-access", err);
    const status = msg === "unauthorized" ? 403 : 500;
    return new Response(JSON.stringify({ error: status === 403 ? "unauthorized" : msg }), { status, headers: corsHeaders() });
  }
});