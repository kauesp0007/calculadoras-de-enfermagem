// Legacy billing endpoint intentionally disabled.
// Canonical access changes only through verified Asaas/Stripe webhooks.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
Deno.serve(async (_req: Request) => new Response(JSON.stringify({error:"legacy_endpoint_disabled"}), {
  status: 410,
  headers: {"Content-Type":"application/json","Cache-Control":"no-store"}
}));