// =====================================================================
// Edge Function: forum-author
// Permite que o AUTOR de um comentário (dono identificado pelo uid do
// Firebase) edite ou exclua o próprio post, usando service role somente
// após validar o Firebase ID token e confirmar que post.uid === uid.
// =====================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createRemoteJWKSet, jwtVerify } from "npm:jose@5.10.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FIREBASE_PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID") ?? "calculadoras-enfermagem";
const FIREBASE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"));

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, apikey, Content-Type",
    "Content-Type": "application/json; charset=utf-8",
  };
}

async function verifyFirebaseUid(req: Request): Promise<string> {
  const h = req.headers.get("Authorization") || "";
  if (!h.startsWith("Bearer ")) throw new Error("unauthorized");
  const token = h.slice(7).trim();
  if (!token) throw new Error("unauthorized");
  const { payload } = await jwtVerify(token, FIREBASE_JWKS, {
    algorithms: ["RS256"],
    issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
    audience: FIREBASE_PROJECT_ID,
  });
  const uid = String(payload.sub || "").trim();
  if (!uid) throw new Error("unauthorized");
  return uid;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders() });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405, headers: corsHeaders() });
  try {
    const uid = await verifyFirebaseUid(req);
    const body = await req.json();
    const action = String(body?.action || "");
    const post_id = Number(body?.post_id);
    if (!Number.isSafeInteger(post_id) || post_id <= 0) return new Response(JSON.stringify({ error: "invalid_post_id" }), { status: 400, headers: corsHeaders() });

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: post } = await sb.from("posts").select("uid").eq("id", post_id).maybeSingle();
    if (!post) return new Response(JSON.stringify({ error: "post_not_found" }), { status: 404, headers: corsHeaders() });
    if (!post.uid || String(post.uid) !== uid) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: corsHeaders() });

    if (action === "update") {
      const content = String(body?.content || "").trim();
      if (!content) return new Response(JSON.stringify({ error: "invalid_content" }), { status: 400, headers: corsHeaders() });
      const { error } = await sb.from("posts").update({ conteudo: content }).eq("id", post_id);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders() });
    }
    if (action === "delete") {
      const { error } = await sb.from("posts").delete().eq("id", post_id);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders() });
    }
    return new Response(JSON.stringify({ error: "invalid_action" }), { status: 400, headers: corsHeaders() });
  } catch (err) {
    const msg = String((err as Error)?.message || err);
    console.error("Erro no forum-author", err);
    const status = msg === "unauthorized" ? 403 : msg === "forbidden" ? 403 : 500;
    return new Response(JSON.stringify({ error: msg === "unauthorized" ? "unauthorized" : msg }), { status, headers: corsHeaders() });
  }
});
