# Fechamento consolidado — Contas, Billing e Premium

Data: 2026-09-21

## Resultado

A arquitetura de autenticação, conta, billing e entrega Premium foi consolidada nesta branch. O fluxo brasileiro via Asaas já foi validado em teste real pelo proprietário do sistema e não foi repetido nesta rodada.

## Premium

- `premium_content_pages`: 272 registros.
- Não existem caminhos Premium duplicados.
- Não existe rota com mais de 19 entradas de idioma.
- As 16 rotas explícitas do manifesto estão cadastradas; as rotas que possuem somente a versão portuguesa usam fallback canônico na Edge Function.
- Existem 18 rotas de simulados relacionadas ao catálogo Premium.
- Os 18 shells de simulados auditados possuem `premium-content-loader.js` e `premium-content-placeholder`.
- O catálogo de simulados é entregue pela mesma autoridade protegida `premium-content`.

## Conta

- `Auth.whenReady()` aguarda a hidratação comercial.
- O ciclo de hidratação é protegido por geração para impedir resultados obsoletos.
- Perfil, Configurações, Favoritos, Histórico e Assinatura usam o estado resolvido da conta.
- Configurações passa a preservar o novo idioma na URL.
- O login preserva o destino solicitado dentro da área da conta, exceto o próprio login.
- Favoritos e Histórico continuam isolados por `firebase_uid` no backend.

## Menu e simulados

Os arquivos `menu-global.html` e suas versões traduzidas permanecem protegidos e não foram alterados.

O `global-scripts.js` agora completa dinamicamente os links de:
- `simulado_bloco-operatorio.html`
- `simulado-de-enfermagem4.html`

Isso elimina a lacuna de descoberta sem modificar os arquivos protegidos.

## Billing e Edge Functions

As funções críticas em produção foram comparadas com a branch e estão com o mesmo código-fonte nas versões verificadas:

- billing-access: v143
- premium-content: v140
- account-data: v150
- stripe-checkout: v180
- stripe-webhook: v247
- asaas-checkout: v251
- asaas-webhook: v248
- billing-admin: v148

Os endpoints de teste legados `stripe-checkout-test` e `stripe-webhook-test` estão desativados e retornam HTTP 410. O antigo `grant-access` e o antigo `asaas-admin` também estão desativados com HTTP 410.

## Segurança Supabase

Foi corrigida em produção a função `public.premium_content_pages_touch_updated_at()`, fixando `search_path = pg_catalog`.

O advisor de segurança deixou apenas os achados intencionais de RLS habilitado sem políticas públicas nas tabelas internas de billing/conteúdo protegido; elas são acessadas pelas Edge Functions com service role e não devem receber políticas abertas.

Os avisos de performance restantes estão concentrados em tabelas de fórum/álbum e outros subsistemas fora deste fechamento; não foram alterados para evitar impacto de escopo.

## Service Worker

O Service Worker usa Network First para HTML e JS, limpa caches antigos na ativação e não intercepta requisições autenticadas nem origens externas. Não foi necessária alteração da estratégia.

## Testes

- Parsing do `global-scripts.js`: OK.
- Parsing dos scripts executáveis de Configurações e Login: OK.
- Testes estruturais anteriores de autenticação/entitlement: OK.
- 18 shells de simulados: OK.
- Contratos `billing-access -> premium-content`: OK.

## Limitação objetiva

Ainda não existe evidência de uma transação real Stripe internacional neste projeto: a tabela de assinaturas Stripe está sem registros e a tabela de eventos Stripe está sem eventos. Portanto, o código e o deployment internacional estão auditados, mas o pagamento internacional real e seu webhook não podem ser declarados como testados sem uma transação efetiva.

Essa é a única validação externa de produção que permanece fora do que o ambiente atual consegue executar automaticamente.

