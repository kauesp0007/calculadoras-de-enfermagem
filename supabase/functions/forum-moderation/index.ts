// =====================================================================
// Edge Function: forum-moderation
// Permite que o ADMINISTRADOR edite ou exclua comentários do fórum,
// usando service role somente após validação do Firebase ID token.
// =====================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createRemoteJWKSet, jwtVerify } from "npm:jose@5.10.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FIREBASE_PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID") ?? "calculadoras-enfermagem";
const FIREBASE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"));
const ADMIN_EMAILS = [
  Deno.env.get("ADMIN_EMAIL") ?? "kauepg18@gmail.com",
  Deno.env.get("ADMIN_EMAIL_2") ?? "kauesp07@hotmail.com",
].filter(Boolean).map((e) => e.trim().toLowerCase());

function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Authorization, apikey, Content-Type", "Content-Type": "application/json; charset=utf-8" }; }
async function verifyFirebaseAdmin(req: Request) {
  const h = req.headers.get("Authorization") || "";
  if (!h.startsWith("Bearer ")) throw new Error("unauthorized");
  const token = h.slice(7).trim();
  if (!token) throw new Error("unauthorized");
  const { payload } = await jwtVerify(token, FIREBASE_JWKS, { algorithms: ["RS256"], issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`, audience: FIREBASE_PROJECT_ID });
  const uid = String(payload.sub || "").trim();
  const email = String(payload.email || "").trim().toLowerCase();
  if (!uid || !email || !ADMIN_EMAILS.includes(email)) throw new Error("unauthorized");
  return { uid, email };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders() });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405, headers: corsHeaders() });
  try {
    const admin = await verifyFirebaseAdmin(req);
    const body = await req.json();
    const action = String(body?.action || "");
    const post_id = Number(body?.post_id);
    if (!Number.isSafeInteger(post_id) || post_id <= 0) return new Response(JSON.stringify({ error: "invalid_post_id" }), { status: 400, headers: corsHeaders() });
    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    if (action === "update") {
      const content = String(body?.content || "").trim();
      if (!content) return new Response(JSON.stringify({ error: "invalid_content" }), { status: 400, headers: corsHeaders() });
      const { error } = await sb.from("posts").update({ conteudo: content }).eq("id", post_id);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true, adminUid: admin.uid }), { status: 200, headers: corsHeaders() });
    }
    if (action === "delete") {
      const { error } = await sb.from("posts").delete().eq("id", post_id);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true, adminUid: admin.uid }), { status: 200, headers: corsHeaders() });
    }
    return new Response(JSON.stringify({ error: "invalid_action" }), { status: 400, headers: corsHeaders() });
  } catch (err) {
    const msg = String((err as Error)?.message || err);
    console.error("Erro no forum-moderation", err);
    const status = msg === "unauthorized" ? 403 : 500;
    return new Response(JSON.stringify({ error: status === 403 ? "unauthorized" : msg }), { status, headers: corsHeaders() });
  }
});