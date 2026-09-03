// =====================================================================
// Edge Function: mercadopago-create-preference
// Cria uma cobrança (Checkout Pro) no Mercado Pago e devolve o link de
// pagamento (PIX/cartão) para o frontend redirecionar o usuário.
//
// Contrato (chamado pelo frontend em conta/cobranca.html):
//   sb.functions.invoke('mercadopago-create-preference', {
//     body: { planId, userId, email }
//   })
// Resposta: { checkoutId, preferenceId, initPoint } | { error }
//
// SEGURANÇA:
//   - A access token do Mercado Pago fica em secret (MERCADO_PAGO_ACCESS_TOKEN).
//   - Grava um registro "pending" na tabela public.payments (ledger), usado
//     pelo webhook para liberar o plano após a confirmação do pagamento.
// =====================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const MP_API = "https://api.mercadopago.com";
const SITE_URL = "https://www.calculadorasdeenfermagem.com.br";

// Preços em BRL — manter em sincronia com js/auth/plan-service.js
const PLANS: Record<string, { title: string; price: number }> = {
  junior: { title: "Plano Júnior — Calculadoras de Enfermagem", price: 5.0 },
  pleno: { title: "Plano Pleno — Calculadoras de Enfermagem", price: 7.0 },
  senior: { title: "Plano Sênior — Calculadoras de Enfermagem", price: 10.0 },
};

const ALLOWED_ORIGINS = new Set([
  "https://www.calculadorasdeenfermagem.com.br",
  "https://calculadorasdeenfermagem.com.br",
  "http://localhost:3000",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
]);

function cors(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const allow = ALLOWED_ORIGINS.has(origin)
    ? origin
    : "https://www.calculadorasdeenfermagem.com.br";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

serve(async (req) => {
  const corsHeaders = cors(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405, corsHeaders);
  }
  if (!ACCESS_TOKEN) {
    return json({ error: "mp_not_configured" }, 500, corsHeaders);
  }

  try {
    const body = await req.json();
    const { planId, userId } = body ?? {};
    const plan = PLANS[planId];
    if (!plan) {
      return json({ error: "invalid_plan" }, 400, corsHeaders);
    }
    if (!userId || typeof userId !== "string" || userId.length > 128) {
      return json({ error: "invalid_user" }, 400, corsHeaders);
    }

    const checkoutId = crypto.randomUUID();

    // 1) Ledger de pagamento (pending) — a confirmação vem via webhook.
    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { error: insertError } = await sb.from("payments").insert({
      id: checkoutId,
      user_id: userId,
      plan_id: planId,
      status: "pending",
    });
    if (insertError) {
      console.error("Falha ao gravar ledger", insertError);
      return json({ error: "ledger_error" }, 500, corsHeaders);
    }

    // 2) Cria a preferência de pagamento no Mercado Pago.
    const prefRes = await fetch(`${MP_API}/checkout/preferences`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [
          {
            id: planId,
            title: plan.title,
            quantity: 1,
            unit_price: plan.price,
            currency_id: "BRL",
          },
        ],
        external_reference: checkoutId,
        back_urls: {
          success: `${SITE_URL}/conta/cobranca.html`,
          failure: `${SITE_URL}/conta/cobranca.html`,
          pending: `${SITE_URL}/conta/cobranca.html`,
        },
        auto_return: "approved",
        notification_url: `${SUPABASE_URL}/functions/v1/mercadopago-webhook`,
      }),
    });

    const pref = await prefRes.json();
    if (!prefRes.ok) {
      console.error("Erro na preferência do MP", pref);
      return json({ error: "mp_error", detail: pref }, 502, corsHeaders);
    }

    await sb.from("payments")
      .update({ mp_preference_id: pref.id })
      .eq("id", checkoutId);

    return json(
      {
        checkoutId,
        preferenceId: pref.id,
        initPoint: pref.init_point || pref.sandbox_init_point,
        sandboxInitPoint: pref.sandbox_init_point,
      },
      200,
      corsHeaders,
    );
  } catch (err) {
    console.error("Erro interno", err);
    return json({ error: "internal_error" }, 500, corsHeaders);
  }
});
