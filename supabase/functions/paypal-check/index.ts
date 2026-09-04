import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID")!;
const CLIENT_SECRET = Deno.env.get("PAYPAL_CLIENT_SECRET")!;
const ENV = Deno.env.get("PAYPAL_ENV") ?? "sandbox";
const BASE = ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

async function getToken() {
  const res = await fetch(BASE + "/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa(CLIENT_ID + ":" + CLIENT_SECRET),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  return await res.json();
}

serve(async () => {
  const t = await getToken();
  if (!t.access_token) {
    return new Response(JSON.stringify({ error: "sem token", t }), { status: 500 });
  }
  const headers = { Authorization: "Bearer " + t.access_token, "Content-Type": "application/json" };
  const [whRes, planRes] = await Promise.all([
    fetch(BASE + "/v1/notifications/webhooks", { headers }),
    fetch(BASE + "/v1/billing/plans/P-5HK236923V929921LNKNGXWI", { headers }),
  ]);
  const wh = await whRes.json();
  const plan = await planRes.json();
  return new Response(JSON.stringify({
    env: ENV,
    webhooks: wh,
    planStatus: plan.status,
    planName: plan.name,
    planId: plan.id,
  }, null, 2), { status: 200, headers: { "Content-Type": "application/json" } });
});
