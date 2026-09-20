// Endpoint de sandbox legado, intencionalmente desativado em 2026-09-20.
// A arquitetura canonica (SISTEMA_DE_LOGIN_DO_SITE/CATALOGO_SISTEMA_CONTAS_PAGAMENTOS.md)
// nao inclui fluxos de teste em producao. Mantido apenas como stub 410 para
// preservar o slug e evitar 404 em integracoes antigas. Implementacao legada
// removida; consulte o historico do git caso seja necessario recupera-la.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
Deno.serve(async (_req: Request) => new Response(JSON.stringify({error:"legacy_endpoint_disabled"}), {
  status: 410,
  headers: {"Content-Type":"application/json","Cache-Control":"no-store"}
}));