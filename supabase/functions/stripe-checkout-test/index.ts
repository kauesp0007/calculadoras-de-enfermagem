// Endpoint de sandbox legado, intencionalmente desativado.
// O fluxo comercial usa apenas supabase/functions/stripe-checkout e stripe-webhook.
// Mantido como stub 410 para impedir que testes paralelos sejam usados em produção.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
Deno.serve(async (_req: Request) => new Response(JSON.stringify({error:"legacy_endpoint_disabled"}), {
  status: 410,
  headers: {"Content-Type":"application/json","Cache-Control":"no-store"}
}));