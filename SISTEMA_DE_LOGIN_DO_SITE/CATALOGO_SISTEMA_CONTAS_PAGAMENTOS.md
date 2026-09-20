# Sistema de Contas e Pagamentos — Arquitetura Canônica

Data: 2026-09-19

## 1. Modelo comercial

Existem somente dois estados comerciais:

- `free`: conteúdo gratuito; anúncios permanecem ativos.
- `premium`: conteúdo premium liberado; anúncios permanecem ativos.

Não existem mais Junior, Senior, Pleno, lifetime ou benefícios de remoção de anúncios como parte do modelo canônico. Registros históricos antigos permanecem somente para auditoria/migração e não podem conceder acesso.

## 2. Autoridade

- Firebase Authentication permanece temporariamente como autoridade de identidade, para preservar as contas existentes.
- Supabase é a autoridade comercial: `billing_identities`, `billing_subscriptions` e `user_entitlements`.
- O cliente nunca grava entitlement diretamente.
- Callbacks, query strings, localStorage e cookies nunca concedem Premium.
- Somente eventos autenticados dos provedores podem alterar o entitlement.

Fluxo:

1. Firebase autentica.
2. Edge Function valida o Firebase ID token.
3. O backend resolve `billing_identities`.
4. O backend lê/escreve o estado comercial no Supabase.
5. Webhooks do provedor confirmam pagamento, renovação, cancelamento ou estorno.
6. `billing-access` devolve somente o estado comercial necessário ao frontend.

## 3. Brasil — Asaas

- Idioma: `pt` / pt-BR.
- Preço operacional: definido exclusivamente por configuração segura do backend; não é hard-coded no código.
- Cartão: assinatura recorrente mensal.
- Pix: cobrança avulsa com acesso Premium por 30 dias.

A criação usa `POST /v3/checkouts`. O backend grava uma intenção em `billing_subscriptions` antes da chamada ao provedor e reconcilia por `externalReference`.

O Checkout não confirma pagamento. A confirmação é feita por Webhook.

Eventos relevantes:

- `CHECKOUT_CREATED`
- `CHECKOUT_PAID`
- `CHECKOUT_CANCELED`
- `CHECKOUT_EXPIRED`
- `SUBSCRIPTION_CREATED`
- `SUBSCRIPTION_UPDATED`
- `SUBSCRIPTION_INACTIVATED`
- `SUBSCRIPTION_DELETED`
- `PAYMENT_CONFIRMED`
- `PAYMENT_RECEIVED`
- `PAYMENT_REFUNDED`
- eventos de chargeback relevantes

O webhook valida `asaas-access-token` e usa idempotência pelo `event.id`.

## 4. Internacional — Stripe

Os 18 idiomas internacionais utilizam Stripe:

`en, es, fr, de, it, hi, zh, ja, ru, ko, tr, nl, pl, sv, id, vi, uk, ar`.

Preços configurados no projeto/documentação:

- USD 5/mês: `price_1UEeJeAE0EBt2lxCFI56AWCx`
- EUR 5/mês: `price_1UEf7uAE0EBt2lxCmfLGGmNH`

A Edge Function seleciona o Price pelo idioma e o servidor envia o Price ID ao Stripe. O frontend não define preço ou moeda.

A sessão usa `mode=subscription`, `client_reference_id` e metadata na sessão e na assinatura. O webhook usa o corpo bruto para validar `Stripe-Signature`, idempotência por event ID e consulta a assinatura no Stripe quando necessário para obter metadata e `current_period_end`.

Eventos principais:

- `checkout.session.completed`
- `invoice.paid`
- `invoice.payment_failed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Falha de pagamento não concede nem estende acesso. O acesso já pago não é revogado antecipadamente apenas por `invoice.payment_failed`; a decisão final de encerramento ocorre pelo estado da assinatura/evento de término.

## 5. Banco de dados

`billing_identities` vincula Firebase UID à identidade comercial.

`billing_subscriptions` guarda uma linha operacional por assinatura/checkout, com provedor, referência externa, status, períodos e metadata.

`user_entitlements` guarda o estado efetivo:

- `free`
- `premium`

RLS está habilitado nas tabelas comerciais e o acesso direto de cliente é bloqueado; o backend utiliza service role. Índices únicos parciais impedem dois fluxos abertos simultâneos para o mesmo usuário e provedor.

`payments` e dados históricos legados não são apagados nesta etapa.

## 6. Segurança

Nunca colocar em Git ou frontend:

- `ASAAS_API_TOKEN`
- `ASAAS_WEBHOOK_TOKEN`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`
- credenciais de service account do Firebase

O webhook Stripe valida assinatura e timestamp. O webhook Asaas valida o token próprio do webhook. A autenticação de checkout valida o Firebase ID token no servidor.

## 7. Estado de produção nesta etapa

Já implantado:

- `billing-access` (v2)
- `billing-admin` (v2)
- `grant-access` legado desativado com HTTP 410
- `asaas-admin` legado desativado com HTTP 410
- endpoints experimentais `stripe-checkout-test` e `stripe-webhook-test` desativados com HTTP 410

Ainda não implantado:

- novo `asaas-checkout`
- novo `asaas-webhook`
- novo `stripe-checkout`
- novo `stripe-webhook`

Essas quatro funções permanecem como código de branch até que secrets, preços, endpoints de webhook e testes E2E sejam comprovados.

## 8. Gate de produção

Antes do deploy dos quatro fluxos:

1. Confirmar secrets no ambiente Supabase sem expor valores.
2. Confirmar Price IDs e moeda/recorrência no Stripe.
3. Confirmar webhook Asaas v3, token próprio, envio sequencial e eventos necessários.
4. Validar compilação/sintaxe das quatro Edge Functions.
5. Testar autenticação sem token, token inválido e token válido.
6. Testar Free e Premium.
7. Testar duplicidade de checkout e webhook.
8. Testar Asaas cartão, Pix, renovação, cancelamento, expiração, reembolso e chargeback.
9. Testar Stripe em pelo menos um idioma USD e um idioma EUR, incluindo renovação, falha de pagamento e cancelamento.
10. Confirmar que callback nunca concede acesso.
11. Confirmar que adulteração de localStorage/cookie/query string não concede acesso.
12. Confirmar que anúncios permanecem ativos em Free e Premium.
13. Somente depois ativar os novos webhooks/checkout em produção.
14. Executar varredura final de referências legadas.
15. Somente então avaliar aprovação e merge do PR #29.
