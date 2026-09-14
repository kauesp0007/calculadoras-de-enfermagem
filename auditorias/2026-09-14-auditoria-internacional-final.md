# Auditoria internacional final — contas, assinatura e Stripe

**Data:** 2026-09-14  
**Repositório:** `kauesp0007/calculadoras-de-enfermagem`  
**Branch audit:** `audit/billing-ads-hardening-20260914`  
**PR:** #17  
**Escopo:** contas, localização em 19 idiomas, roteamento de PSP, Stripe, Asaas, autorização administrativa, histórico financeiro e proteção de anúncios.

## Resultado

A arquitetura auditada mantém uma única área física `/conta/` e usa `?lang=` para as versões internacionais. O seletor de idioma preserva essa convenção e as rotas internas de conta são geradas pelo roteador de contas.

A regra canônica de PSP é **pt/pt-BR -> Asaas** e **18 idiomas internacionais -> Stripe**. O checkout Asaas rejeita idioma diferente de `pt`; o checkout Stripe rejeita qualquer idioma fora do conjunto internacional. Pix permanece restrito ao Brasil.

A criação de perfil do usuário é defensiva e preserva o documento vencedor em condições de corrida. As regras do Firestore mantêm `uid`, `email` e `provider` imutáveis e bloqueiam alterações client-side de campos de plano/acesso, além de bloquear exclusão direta do perfil.

## Segurança administrativa

A autorização administrativa exige Firebase ID token válido no backend. O e-mail enviado no corpo não é credencial de autorização. As funções administrativas correspondentes foram redeployadas em produção.

## Evidências de produção no Supabase

- Projeto: **ACTIVE_HEALTHY**.
- `asaas-admin`: **ACTIVE v15**.
- `grant-access`: **ACTIVE v13**.
- `asaas-checkout`: **ACTIVE v18**.
- `asaas-webhook`: **ACTIVE v20**.
- `stripe-checkout`: **ACTIVE v19**.
- `stripe-webhook`: **ACTIVE v19**.
- `forum-moderation`: **ACTIVE v11**.
- `public.payments`: **13 registros preservados**; nenhum registro financeiro foi apagado durante o fechamento.
- `public.stripe_events`: **0 registros** na consulta desta auditoria.
- `billing_webhook_claims` e `billing_checkout_claims` existem, com RLS habilitado.
- `billing_subscription_guards` foi criada como estrutura privada adicional para futuras amarrações server-side.

## Idempotência e duplicidade

Os webhooks usam claim transacional por `(provider,event_id)`. O checkout Stripe agora usa lock por usuário, consulta a Stripe para detectar assinatura existente em estados ativos/em andamento e conclui o lock com `complete_billing_checkout` após a criação bem-sucedida da sessão; em erro, libera o lock.

O checkout Asaas permanece restrito a `pt`, com lock server-side e pedido individualizado. O fluxo brasileiro público com links diretos Asaas foi preservado para não romper o checkout brasileiro já utilizado; portanto, esse fluxo direto não recebe a mesma proteção de concorrência server-side do `asaas-checkout`.

## Anúncios e assinatura

A resolução do estado de anúncios permanece fail-closed durante autenticação/perfil e remove anúncios para usuários Júnior elegíveis. Assinaturas históricas/lifetime não são removidas ou degradadas sem prova.

## Internacionalização

A área de conta é centralizada em `/conta/` com `?lang=`. Os 18 idiomas internacionais direcionam para Stripe e o português para Asaas. Retornos Stripe preservam o idioma.

## Limites de validação

Não foi executada uma compra real Stripe nem um POST administrativo com Firebase ID token real neste ambiente de ferramentas. Portanto, não há alegação de E2E real dessas operações. A disponibilidade, versão e fonte das Edge Functions foram verificadas.

O projeto ainda usa as chaves Supabase legadas de backend; não foi feita migração para `sb_publishable_`/`sb_secret_`. A documentação atual do Supabase mantém essas chaves legadas compatíveis durante 2026, mas recomenda a migração futura.

## Status

**Código e backend endurecidos para a etapa final de publicação.** A confirmação definitiva de produção ainda depende do teste funcional em navegador com uma conta internacional real e da conferência final do fluxo brasileiro público. A PR #17 permanece aberta até essa confirmação.