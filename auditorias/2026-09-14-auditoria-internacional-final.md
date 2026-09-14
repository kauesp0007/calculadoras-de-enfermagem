# Auditoria internacional final — contas, assinatura, Stripe e Asaas

**Data:** 2026-09-14  
**Repositório:** `kauesp0007/calculadoras-de-enfermagem`  
**Branch audit:** `audit/billing-ads-hardening-20260914`  
**PR:** #17  
**Escopo:** contas, localização em 19 idiomas, roteamento de PSP, Stripe, Asaas, autorização administrativa, histórico financeiro, proteção de anúncios e controles de duplicidade.

## Estado final da implementação

A arquitetura mantém uma única área física `/conta/` e usa `?lang=` para as versões internacionais. O seletor de idioma e os roteadores de conta preservam essa convenção.

A regra canônica de cobrança é:

- `pt` / `pt-BR` → Asaas.
- `en`, `es`, `fr`, `de`, `it`, `hi`, `zh`, `ja`, `ru`, `ko`, `tr`, `nl`, `pl`, `sv`, `id`, `vi`, `uk`, `ar` → Stripe.
- Pix → somente Brasil / Asaas.

O checkout Stripe valida o Firebase ID token, restringe o conjunto de idiomas, usa lock transacional por usuário/provedor, verifica no Stripe se já existe uma assinatura ativa ou em andamento e conclui o lock após a criação bem-sucedida da Checkout Session. Isso reduz o risco de múltiplas assinaturas decorrentes de concorrência ou repetição imediata da ação.

O checkout Asaas backend permanece restrito a `pt`, com lock próprio e criação de `premiumOrders`. O fluxo público brasileiro já validado com o Asaas foi preservado para não interromper o checkout histórico existente.

## Segurança de conta e administração

As regras do Firestore mantêm `uid`, `email` e `provider` imutáveis após criação, protegem os campos financeiros e de acesso e bloqueiam exclusão direta do perfil pelo cliente.

A autorização administrativa de billing exige Firebase ID token válido no backend, com validação de assinatura, emissor, audiência e validade temporal. O e-mail enviado no corpo deixou de ser uma credencial de autorização.

O arquivo JavaScript administrativo incompleto que havia sido criado durante a auditoria foi removido do branch.

## Evidências atuais de produção no Supabase

- Projeto: `asjkftjfbkuuhilnqonx`.
- Estado: **ACTIVE_HEALTHY**.
- PostgreSQL: **17.6.1.063**.
- `stripe-checkout`: **ACTIVE v20**.
- `stripe-webhook`: **ACTIVE v19**.
- `asaas-checkout`: **ACTIVE v18**.
- `asaas-webhook`: **ACTIVE v20**.
- `asaas-admin`: **ACTIVE v15**.
- `grant-access`: **ACTIVE v13**.
- `forum-moderation`: **ACTIVE v11**.

A infraestrutura de idempotência usa `billing_webhook_claims` com chave única `(provider,event_id)` e `billing_checkout_claims` com chave `(provider,user_id)`, evitando processamento financeiro concorrente para a mesma operação.

Na verificação pós-hardening, `billing_checkout_claims`, `billing_subscription_guards` e `billing_webhook_claims` estavam vazias, demonstrando que não havia lock órfão ativo no instante da consulta. `public.payments` mantinha 13 registros e `public.stripe_events` estava vazia no instante da consulta. Nenhuma exclusão destrutiva de registros financeiros foi executada.

## Internacionalização da conta

O catálogo `AccountI18n`, `conta-menu-localizer.js`, `account-extra-localizer.js` e o roteador de conta são utilizados para manter menu e telas centrais coerentes com o idioma selecionado. O `lang-selector.js` carrega os complementos de localização depois da montagem dos componentes dinâmicos.

## Anúncios e acesso Premium

A resolução da assinatura permanece fail-closed. Durante a resolução do perfil, o estado de anúncios fica pendente/oculto; para Júnior elegível, os espaços de anúncios permanecem ocultos. O tratamento preserva registros históricos de assinaturas e acessos legados sem apagá-los.

## Validação operacional

Não é tecnicamente correto declarar uma compra real Stripe end-to-end neste ambiente porque não houve uma sessão real de navegador com um Firebase ID token de um usuário internacional e confirmação de pagamento Stripe observada ponta a ponta.

Também não foi executada uma operação administrativa real com um Firebase ID token neste ambiente.

Essas duas limitações são de **validação operacional**, não de ausência de implementação no código/deploy. O ambiente de ferramentas disponível não fornece um navegador autenticado nem uma forma segura de fabricar um ID token real para uma compra.

## Critérios de fechamento técnico

1. Roteamento de PSP separado por idioma: **atendido**.
2. Backend rejeita combinações inválidas de idioma/PSP: **atendido**.
3. Retornos Stripe preservam o idioma: **atendido**.
4. Menu e telas centrais de conta possuem mecanismo de localização: **atendido estruturalmente**.
5. Autorização administrativa baseada em identidade autenticada: **atendido em fonte e deploy**.
6. Idempotência de webhook: **atendido**.
7. Proteção contra checkout concorrente/dobrado no Stripe: **atendido no backend**.
8. Histórico financeiro preservado: **atendido**.
9. Estado do Supabase em produção: **saudável**.
10. Compra real Stripe E2E: **pendente de validação manual em navegador**.

**Conclusão:** a implementação de produção está tecnicamente fechada para o escopo de código, banco e Edge Functions. A única evidência ainda não obtida é a validação manual de pagamento Stripe real em navegador. O PR permanece sujeito à revisão/merge no GitHub.