// =====================================================================
// Edge Function: paypal-create-plan
// Cria um Produto + Plano de assinatura no PayPal (Subscriptions API).
//
// Uso (setup único): invocar uma vez para criar o "Plano Júnior" (R$ 5,00/mês)
// e obter o plan_id para usar no botão.
//
// SEGURANÇA:
//   - PAYPAL_CLIENT_ID e PAYPAL_CLIENT_SECRET ficam em secrets do Supabase.
//   - PAYPAL_ENV = "sandbox" (padrão) ou "live".
// =====================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID");
const CLIENT_SECRET = Deno.env.get("PAYPAL_CLIENT_SECRET");
const ENV = Deno.env.get("PAYPAL_ENV") ?? "sandbox";
const API_BASE = ENV === "live"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

async function getToken(): Promise<string> {
  const res = await fetch(`${API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": "Basic " + btoa(`${CLIENT_ID}:${CLIENT_SECRET}`),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = await res.json();
  if (!data.access_token) {
    throw new Error("OAuth falhou: " + JSON.stringify(data));
  }
  return data.access_token;
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("method_not_allowed", { status: 405 });
  }
  if (!CLIENT_ID || !CLIENT_SECRET) {
    return new Response(JSON.stringify({ error: "not_configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const token = await getToken();

    // 1) Produto
    const prodRes = await fetch(`${API_BASE}/v1/catalogs/products`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Assinatura Premium — Calculadoras de Enfermagem",
        description:
          "Acesso premium, sem anúncios, para profissionais e estudantes de enfermagem.",
        type: "DIGITAL",
      }),
    });
    const prod = await prodRes.json();
    if (!prodRes.ok) {
      throw new Error("Falha ao criar produto: " + JSON.stringify(prod));
    }

    // 2) Plano (mensal, R$ 5,00, ciclos ilimitados)
    const planRes = await fetch(`${API_BASE}/v1/billing/plans`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product_id: prod.id,
        name: "Plano Júnior",
        description: "Plano Júnior mensal — R$ 5,00/mês (sem anúncios).",
        status: "ACTIVE",
        billing_cycles: [
          {
            frequency: { interval_unit: "MONTH", interval_count: 1 },
            tenure_type: "REGULAR",
            sequence: 1,
            total_cycles: 0, // 0 = ilimitado
            pricing_scheme: {
              fixed_price: { value: "5.00", currency_code: "BRL" },
            },
          },
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee_failure_action: "CONTINUE",
          payment_failure_threshold: 2,
        },
      }),
    });
    const plan = await planRes.json();
    if (!planRes.ok) {
      throw new Error("Falha ao criar plano: " + JSON.stringify(plan));
    }

    return new Response(
      JSON.stringify({
        env: ENV,
        productId: prod.id,
        planId: plan.id,
        planName: plan.name,
        status: plan.status,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Erro ao criar plano", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
