# Sistema de Contas e Pagamentos — Arquitetura Atual

Data: 2026-09-13

## 1. Princípios

O site usa GitHub Pages para o frontend estático, Firebase Authentication para identidade, Firestore como fonte de verdade do plano e Supabase Edge Functions como backend de pagamentos.

Existem somente dois planos efetivos:

- `free` — acesso ao conteúdo gratuito, com anúncios.
- `junior` — acesso aos conteúdos premium e navegação sem anúncios enquanto a licença estiver válida.

Não existe mais uma muralha global que envie todo usuário gratuito para a página de assinatura. O bloqueio é por conteúdo/página conforme `js/access/content-policy.js` e `js/access/access-router.js`.

## 2. Fonte de verdade

`users/{uid}` é a fonte de verdade para o estado de acesso. O cliente não pode alterar `plan`, `role`, `permissions` ou `status` pelas regras do Firestore.

Os registros operacionais de pagamento são privados:

- `premiumOrders/{orderId}` — pedido criado antes do checkout.
- `asaasCustomers/{customerId}` — associação estável Asaas customer ↔ Firebase UID.
- `asaasSubscribers/{orderId}` — registro administrativo do assinante.
- `asaasEvents/{eventId}` — idempotência e estado do processamento do webhook.
- `users/{uid}/subscriptions/{subscriptionId}` — histórico controlado pelo backend.

## 3. Brasil — Asaas

Preço oficial: **R$ 10,00**.

### Cartão de crédito

É uma assinatura recorrente mensal.

Fluxo:

1. Usuário autenticado abre `/conta/assinatura.html`.
2. Frontend obtém o Firebase ID token.
3. `POST /asaas-checkout` recebe `kind=monthly_card`.
4. A Edge Function valida o token, obtém `uid`, e-mail e nome e cria `premiumOrders/{orderId}`.
5. A Edge Function cria `POST /v3/checkouts` no Asaas com `billingTypes=[CREDIT_CARD]`, `chargeTypes=[RECURRENT]`, valor R$10,00 e `externalReference=premium_junior_{orderId}`.
6. O frontend redireciona para o checkout individual retornado pelo Asaas.
7. O Asaas envia Webhooks.
8. O backend reconcilia pelo `externalReference`; nunca depende de pesquisa de UID por e-mail.

### Pix

Pagamento único com validade de 30 dias.

Fluxo igual ao anterior, mas `kind=pix_30d`, `billingTypes=[PIX]` e `chargeTypes=[DETACHED]`.

O Checkout oficial do Asaas aceita `CREDIT_CARD` e `PIX`; não deve ser anunciado como um único Checkout de cartão + boleto. Consulte a configuração vigente do produto antes de anunciar boleto.

## 4. Eventos Asaas

O webhook deve estar ativo em produção e autenticado pelo header `asaas-access-token`.

Eventos usados pelo backend:

- `CHECKOUT_CREATED`
- `CHECKOUT_PAID`
- `CHECKOUT_CANCELED`
- `CHECKOUT_EXPIRED`
- `SUBSCRIPTION_CREATED`
- `SUBSCRIPTION_DELETED`
- `SUBSCRIPTION_INACTIVATED`
- `PAYMENT_CONFIRMED`
- `PAYMENT_RECEIVED`

O evento é persistido por seu `id` para idempotência. O processamento ocorre após a aceitação do evento; falhas são registradas como `error` em `asaasEvents`.

## 5. Internacional — Stripe

Preços ativos:

- USD 5/mês: `price_1UEeJeAE0EBt2lxCFI56AWCx`
- EUR 5/mês: `price_1UEf7uAE0EBt2lxCmfLGGmNH`

O frontend mantém as 18 localizações do site. A Edge Function `stripe-checkout` escolhe USD/EUR pelo idioma, valida o Firebase ID token e envia `client_reference_id=uid` e `subscription_data.metadata.uid=uid`.

A criação do Checkout não lista manualmente `payment_method_types`; o Stripe Dashboard gerencia os métodos dinâmicos elegíveis. Isso evita o erro observado de `No valid payment method types for this Checkout Session`.

## 6. Edge Functions

- `asaas-checkout` — cria checkout individual autenticado para o Brasil.
- `asaas-webhook` — recebe, persiste e processa eventos Asaas.
- `asaas-admin` — leitura administrativa de `asaasSubscribers`.
- `stripe-checkout` — cria Checkout Session internacional autenticada.
- `stripe-webhook` — ativa/renova/revoga o plano a partir dos eventos Stripe.

Os segredos ficam somente no ambiente do Supabase.

## 7. Acesso premium

`js/auth/auth-core.js` administra autenticação e perfil, mas não redireciona automaticamente usuários gratuitos para a assinatura.

`js/auth/authorization.js` considera `lifetime=true` ou um `junior` ainda dentro de `planExpiresAt` como acesso premium efetivo.

`js/access/content-policy.js` define quais conteúdos exigem `junior`.

`global-scripts.js` usa `Authorization.hasPlan("premium")` para remover anúncios do assinante.

## 8. Página de assinatura

`conta/assinatura.html` carrega explicitamente `auth-user-profile.js` e seus módulos necessários. Não utiliza mais a antiga cadeia `js/subscriptions/*`.

A página registra eventos de funil em GA4:

- `subscription_view`
- `subscription_checkout_click`
- `subscription_checkout_created`
- `subscription_checkout_error`

## 9. Regras de segurança

- Nunca coloque `ASAAS_API_TOKEN`, `ASAAS_WEBHOOK_TOKEN`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` ou service account no frontend.
- O frontend envia somente o Firebase ID token e a anon key pública do Supabase.
- O plano não é concedido por escrita direta do cliente no Firestore.
- Webhooks são a autoridade para confirmação financeira; callbacks do navegador não concedem acesso.

## 10. Operação

Antes de ativar uma mudança de pagamento em produção:

1. Faça o deploy das Edge Functions.
2. Atualize os Secrets do Supabase.
3. Configure no Asaas os eventos de Checkout, assinatura e cobrança usados pelo backend.
4. Faça um pagamento de teste controlado.
5. Confirme a cadeia `premiumOrders → webhook → users/{uid}.plan → acesso premium`.
6. Só depois desative os links públicos antigos do Asaas e remova referências administrativas antigas.
