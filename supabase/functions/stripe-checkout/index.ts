// =====================================================================
// Edge Function: stripe-checkout
// Cria uma Checkout Session do Stripe (assinatura mensal) e devolve a URL.
//
// Fluxo:
//   Front -> POST /stripe-checkout { uid, lang }
//     -> escolhe o price (USD ou EUR) conforme o idioma
//     -> cria a Checkout Session (mode=subscription, client_reference_id=uid)
//     -> devolve { url } para o front redirecionar o usuário.
//
// Deploy com --no-verify-jwt (o front chama com a anon key).
// =====================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const STRIPE_API = "https://api.stripe.com/v1";
const SITE_URL = "https://www.calculadorasdeenfermagem.com.br";

// Idiomas do site -> price ID do Stripe.
const EUR_LANGS = ["tr", "nl", "pl", "ru", "fr", "es", "de", "it", "uk", "sv"];

// USD $5/mês e EUR €5/mês (ambos criados).
const USD_PRICE_ID = Deno.env.get("STRIPE_PRICE_USD") ?? "price_1UEeJeAE0EBt2lxCFI56AWCx";
const EUR_PRICE_ID = Deno.env.get("STRIPE_PRICE_EUR") ?? "price_1UEf7uAE0EBt2lxCmfLGGmNH";

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
  if (!STRIPE_SECRET_KEY) {
    return new Response(
      JSON.stringify({ error: "not_configured" }),
      { status: 500, headers: { ...corsHeaders(), "Content-Type": "application/json" } },
    );
  }

  try {
    const body = await req.json();
    const uid = String(body?.uid || "");
    const lang = String(body?.lang || "en");
    if (!uid) {
      return new Response(
        JSON.stringify({ error: "missing_uid" }),
        { status: 400, headers: { ...corsHeaders(), "Content-Type": "application/json" } },
      );
    }

    const priceId = EUR_LANGS.indexOf(lang) !== -1 ? EUR_PRICE_ID : USD_PRICE_ID;

    const form = new URLSearchParams({
      mode: "subscription",
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      "payment_method_types[0]": "card",
      client_reference_id: uid,
      "subscription_data[metadata][uid]": uid,
      success_url: `${SITE_URL}/conta/assinatura.html?stripe=success`,
      cancel_url: `${SITE_URL}/conta/assinatura.html?stripe=cancel`,
    });

    const res = await fetch(`${STRIPE_API}/checkout/sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form,
    });
    const session = await res.json();
    if (!res.ok || !session.url) {
      return new Response(
        JSON.stringify({ error: session?.error?.message || "erro ao criar checkout" }),
        { status: 500, headers: { ...corsHeaders(), "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { ...corsHeaders(), "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Erro no stripe-checkout", err);
    return new Response(
      JSON.stringify({ error: String((err as Error).message || err) }),
      { status: 500, headers: { ...corsHeaders(), "Content-Type": "application/json" } },
    );
  }
});
