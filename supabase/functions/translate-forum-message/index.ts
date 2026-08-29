// =====================================================================
// Edge Function: translate-forum-message
// Traduz uma mensagem do Fórum Mundial de Enfermagem via Google Cloud
// Translation API, com cache na tabela `public.translations`.
//
// Contrato (chamado pelo frontend em forum-enfermagem.html):
//   sb.functions.invoke('translate-forum-message', {
//     body: { message_id, text, target_language }
//   })
// Resposta esperada: { translated_text } | { error }
// =====================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Segredo obrigatório: GOOGLE_TRANSLATION_API_KEY
const GOOGLE_KEY = Deno.env.get("GOOGLE_TRANSLATION_API_KEY");

// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são injetados automaticamente
// pelo runtime de Edge Functions do Supabase.
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    if (!GOOGLE_KEY) {
      return json({ error: "unavailable" }, 500);
    }

    const { message_id, text, target_language } = await req.json();

    if (!text || typeof text !== "string") {
      return json({ error: "empty" }, 400);
    }
    if (!target_language) {
      return json({ error: "missing_target" }, 400);
    }

    const source_hash = await sha256(text);

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1) Tenta o cache
    const cached = await sb
      .from("translations")
      .select("translated_text")
      .eq("message_id", message_id)
      .eq("source_hash", source_hash)
      .eq("target_language", target_language)
      .maybeSingle();

    if (cached.data?.translated_text) {
      return json({ translated_text: cached.data.translated_text });
    }

    // 2) Traduz no Google Cloud Translation
    const url = `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_KEY}`;
    const g = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: text, target: target_language, format: "text" }),
    });

    if (!g.ok) {
      console.error("Google Translation HTTP", g.status, await g.text());
      return json({ error: "unavailable" }, 502);
    }

    const gdata = await g.json();
    const translated_text = gdata?.data?.translations?.[0]?.translatedText;
    if (!translated_text) {
      return json({ error: "unavailable" }, 502);
    }

    // 3) Grava no cache (não-fatal: se a tabela ainda não existir, segue sem cache)
    try {
      await sb.from("translations").upsert(
        {
          message_id,
          source_language: "auto",
          target_language,
          source_hash,
          translated_text,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "message_id,source_hash,target_language" },
      );
    } catch (cacheErr) {
      console.warn("Cache indisponível (tabela translations ausente?)", cacheErr);
    }

    return json({ translated_text });
  } catch (err) {
    console.error("translate-forum-message:", err);
    return json({ error: "unavailable" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

async function sha256(text: string): Promise<string> {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  return [...new Uint8Array(bytes)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
