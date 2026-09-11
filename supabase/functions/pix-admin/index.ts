// =====================================================================
// Edge Function: pix-admin
// Painel de administração dos pedidos Pix (via link PicPay).
//
// Ações (via body JSON):
//   { adminUid, action: "list" }          -> lista pedidos (todos, do mais recente)
//   { adminUid, action: "release", uid, orderId } -> aprova (users/{uid}.plan = "junior")
//
// SEGURANÇA: verifica se adminUid tem role "administrator" no Firestore.
// Deploy com --no-verify-jwt (o front chama com a anon key).
// =====================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const FIREBASE_PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID") ?? "calculadoras-enfermagem";
const FIREBASE_SERVICE_ACCOUNT = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");

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

async function firestoreGet(path: string, token: string): Promise<any | null> {
  const res = await fetch(firestoreUrl(path), { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return null;
  return await res.json();
}

async function firestoreListCollection(path: string, token: string): Promise<any[]> {
  const res = await fetch(firestoreUrl(path), { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    throw new Error(`Firestore GET ${path} -> ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  return data.documents || [];
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
    const adminUid = body?.adminUid;
    const action = body?.action;
    if (!adminUid) {
      return new Response(JSON.stringify({ error: "missing_adminUid" }), { status: 400, headers: { ...corsHeaders(), "Content-Type": "application/json" } });
    }

    const sa = JSON.parse(FIREBASE_SERVICE_ACCOUNT);
    const token = await firestoreAccessToken(sa);

    // Verifica se o chamador é administrador.
    const adminDoc = await firestoreGet(`users/${adminUid}`, token);
    const role = adminDoc?.fields?.role?.stringValue;
    if (role !== "administrator" && role !== "admin") {
      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 403, headers: { ...corsHeaders(), "Content-Type": "application/json" } });
    }

    if (action === "list") {
      const docs = await firestoreListCollection("paymentRequests", token);
      const orders = docs.map((d) => {
        const f = d.fields || {};
        return {
          id: d.name.split("/").pop(),
          uid: f.uid?.stringValue || "",
          email: f.email?.stringValue || "",
          name: f.name?.stringValue || "",
          amount: f.amount?.stringValue || "",
          planId: f.planId?.stringValue || "junior",
          status: f.status?.stringValue || "pending",
          createdAt: f.createdAt?.timestampValue || "",
        };
      }).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      return new Response(JSON.stringify({ orders }), { status: 200, headers: { ...corsHeaders(), "Content-Type": "application/json" } });
    }

    if (action === "release") {
      const uid = body?.uid;
      const orderId = body?.orderId;
      if (!uid) {
        return new Response(JSON.stringify({ error: "missing_uid" }), { status: 400, headers: { "Content-Type": "application/json" } });
      }
      const now = new Date().toISOString();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // +30 dias (1 mês)
      await firestorePatch(
        `users/${uid}`,
        {
          plan: stringValue("junior"),
          planUpdatedAt: timestampValue(now),
          planExpiresAt: timestampValue(expiresAt),
        },
        token,
      );
      if (orderId) {
        await firestorePatch(
          `paymentRequests/${orderId}`,
          {
            status: stringValue("approved"),
            approvedAt: timestampValue(now),
            approvedBy: stringValue(adminUid),
          },
          token,
        );
      }
      return new Response(JSON.stringify({ ok: true, uid, plan: "junior" }), { status: 200, headers: { ...corsHeaders(), "Content-Type": "application/json" } });
    }

    if (action === "reject") {
      const orderId = body?.orderId;
      if (!orderId) {
        return new Response(JSON.stringify({ error: "missing_orderId" }), { status: 400, headers: { "Content-Type": "application/json" } });
      }
      await firestorePatch(
        `paymentRequests/${orderId}`,
        {
          status: stringValue("rejected"),
          rejectedAt: timestampValue(new Date().toISOString()),
          rejectedBy: stringValue(adminUid),
        },
        token,
      );
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...corsHeaders(), "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "unknown_action" }), { status: 400, headers: { ...corsHeaders(), "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Erro no pix-admin", err);
    return new Response(
      JSON.stringify({ error: String((err && (err as Error).message) || err) }),
      { status: 500, headers: { ...corsHeaders(), "Content-Type": "application/json" } },
    );
  }
});
