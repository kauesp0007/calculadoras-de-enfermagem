// Legacy billing admin endpoint intentionally disabled.
// Canonical administration uses billing-admin backed by the Supabase billing ledger.
import "jsr:@supabase/supabase-js@2";

Deno.serve(async (_req: Request) => new Response(JSON.stringify({error:"legacy_endpoint_disabled"}), {
  status: 410,
  headers: {"Content-Type":"application/json","Cache-Control":"no-store"}
}));
