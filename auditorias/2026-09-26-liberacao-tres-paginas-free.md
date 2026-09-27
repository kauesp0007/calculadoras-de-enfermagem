# Auditoria — liberação FREE de Braden, Fugulin e dimensionamento (26/09/2026)

## Escopo
Somente `/braden.html`, `/fugulin.html` e `/dimensionamento.html` na raiz. Versões traduzidas continuam Premium até decisão explícita de extensão.

## Arquitetura inspecionada
- `premium-content-manifest.json`: classifica rotas Premium para scripts de migração e shellificação.
- `scripts/shellify-premium-public-pages.mjs`: transforma rotas Premium em shell com loader.
- `js/access/premium-content-loader.js`: busca conteúdo protegido pela Edge Function.
- `supabase/functions/premium-content/index.ts`: verifica token Firebase e entitlement em `user_entitlements`, entrega `premium_content_pages`.
- `js/access/content-policy.js`: não mantém lista de rotas Premium duplicada.

## Alterações na branch
1. Removidas três entradas do manifesto canônico, preservando todos os outros bloqueios.
2. Restaurado o HTML integral das três rotas raiz a partir de `premium_content_pages`, sem loader nem placeholder.
3. Ajustado teste legado para ler o manifesto em vez de uma lista Premium duplicada.
4. Adicionado teste de regressão `node scripts/test-tres-paginas-free.mjs`.

## Segurança e rollback
Os três originais no Supabase permanecem como backup histórico; não excluir registros sem política de retenção. A mudança só entra em produção após merge/deploy. Não modificar regras de pagamento ou entitlements. Testar manualmente as três páginas como visitante anônimo, usuário FREE autenticado e PREMIUM, incluindo cálculo e impressão.

## Comandos de validação
```bash
node scripts/test-tres-paginas-free.mjs
node scripts/auditar-premium-triplo.mjs
node scripts/test-premium-content-access.js
node scripts/test-premium-simulados-access.js
```
