// =====================================================================
// Edge Function: forum-moderation
// Permite que o ADMINISTRADOR (os dois e-mails) edite ou exclua QUALQUER
// comentário do fórum, ignorando a RLS (usando a service role).
//
// Fluxo:
//   Front (forum-enfermagem.html) -> POST /forum-moderation
//     { action: "update"|"delete", post_id, content?, adminEmail }
//   -> verifica se adminEmail é administrador
//   -> executa update/delete na tabela posts com service_role
//
// Deploy com --no-verify-jwt (o front chama com a anon key).
// =====================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (req.method !== "POST") {
    return new Response("method_not_allowed", { status: 405, headers: corsHeaders() });
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

    const action = String(body?.action || "");
    const post_id = Number(body?.post_id);
    if (!Number.isSafeInteger(post_id) || post_id <= 0) {
      return new Response(
        JSON.stringify({ error: "invalid_post_id" }),
        { status: 400, headers: { ...corsHeaders(), "Content-Type": "application/json" } },
      );
    }

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (action === "update") {
      const content = String(body?.content || "").trim();
      if (!content) {
        return new Response(
          JSON.stringify({ error: "invalid_content" }),
          { status: 400, headers: { ...corsHeaders(), "Content-Type": "application/json" } },
        );
      }
      const { error } = await sb.from("posts").update({ conteudo: content }).eq("id", post_id);
      if (error) throw error;
      return new Response(
        JSON.stringify({ ok: true }),
        { status: 200, headers: { ...corsHeaders(), "Content-Type": "application/json" } },
      );
    }

    if (action === "delete") {
      const { error } = await sb.from("posts").delete().eq("id", post_id);
      if (error) throw error;
      return new Response(
        JSON.stringify({ ok: true }),
        { status: 200, headers: { ...corsHeaders(), "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ error: "invalid_action" }),
      { status: 400, headers: { ...corsHeaders(), "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Erro no forum-moderation", err);
    return new Response(
      JSON.stringify({ error: String((err && (err as Error).message) || err) }),
      { status: 500, headers: { ...corsHeaders(), "Content-Type": "application/json" } },
    );
  }
});
