# Inventário inicial — reconstrução FREE/PREMIUM

Data: 2026-09-19

## Estado confirmado

O repositório contém referências legadas ao modelo comercial anterior em:
- `js/auth/plan-service.js`
- `js/auth/authorization.js`
- `js/auth/auth-permissions.js`
- `js/auth/permission-service.js`
- `js/access/content-policy.js`
- `js/access/benefit-engine.js`
- `js/access/premium-widgets.js`
- `js/access/premium-banner-manager.js`
- `js/billing/payment-router.js`
- `conta/assinatura.html`
- `conta/perfil.html`
- `conta/admin-pagamentos.html`
- funções Asaas/Stripe no Supabase
- páginas traduzidas, incluindo lógica de fórum
- carregamento de anúncios
- service worker e documentação histórica

## Resíduos comerciais confirmados

Encontrados usos de:
- `junior` / Júnior
- `senior`
- `pleno`
- `premium_junior_`
- lógica de remoção de anúncios para premium
- `lifetime`
- `planExpiresAt`
- Firebase/Firestore como fonte de plano
- coleções Firestore de assinantes/pedidos

## Supabase

Projeto: `asjkftjfbkuuhilnqonx`

PostgreSQL: 17.6.1.

Tabelas de billing presentes:
- `billing_checkout_claims`
- `billing_subscription_guards`
- `billing_webhook_claims`
- `payments`
- `stripe_events`

Funções públicas relacionadas a billing:
- `claim_billing_checkout`
- `claim_billing_webhook`
- `complete_billing_checkout`
- `complete_billing_webhook`
- `fail_billing_webhook`
- `release_billing_checkout`

Edge Functions atualmente ativas:
- `asaas-webhook`
- `asaas-admin`
- `asaas-checkout`
- `stripe-checkout`
- `stripe-webhook`
- `grant-access`
- `stripe-checkout-test`
- `stripe-webhook-test`
- outras não relacionadas ao billing

## Dados que NÃO devem ser apagados nesta fase

A tabela `public.payments` possui histórico real, incluindo registros antigos com `plan_id=junior` e `plan_id=pleno`, além de um pagamento aprovado. Esses registros serão preservados como histórico até existir uma estratégia explícita de retenção/migração.

## Classificação inicial

### MANTER / REESTRUTURAR
- Supabase Auth
- identidade das contas
- Asaas como PSP nacional
- Stripe como PSP internacional
- mecanismo seguro de webhook/idempotência, após revisão
- dados históricos financeiros
- módulos de autenticação que forem independentes do modelo comercial

### SUBSTITUIR
- plan-service
- authorization
- permission-service / auth-permissions
- content-policy
- payment-router
- página de assinatura
- webhooks que gravam plano no Firestore
- administração de assinantes

### REMOVER DA LÓGICA ATIVA
- Júnior
- Senior
- Pleno
- preços antigos
- benefício sem anúncios
- Firebase/Firestore como autoridade comercial
- concessão por callback/frontend/localStorage
- funções de teste de billing na superfície produtiva

### PRESERVAR TEMPORARIAMENTE
- `public.payments`
- histórico/documentação para auditoria
- infraestrutura de idempotência enquanto sua sucessora não estiver pronta

## Modelo novo

FREE:
- conteúdo gratuito
- anúncios

PREMIUM:
- conteúdo gratuito + conteúdo premium
- anúncios

Brasil:
- pt-BR -> Asaas

Internacional:
- en, es, fr, de, it, hi, zh, ja, ru, ko, tr, nl, pl, sv, id, vi, uk, ar -> Stripe
