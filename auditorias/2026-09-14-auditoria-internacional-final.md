# Auditoria internacional final — contas, assinatura e Stripe

**Data:** 2026-09-14  
**Repositório:** `kauesp0007/calculadoras-de-enfermagem`  
**Branch audit:** `audit/billing-ads-hardening-20260914`  
**PR:** #17  
**Escopo:** contas, localização em 19 idiomas, roteamento de PSP, Stripe, Asaas, autorização administrativa, histórico financeiro e proteção de anúncios.

## Resultado

A arquitetura auditada mantém uma única área física `/conta/` e usa `?lang=` para as versões internacionais. O seletor de idioma preserva essa convenção e as rotas internas de conta são geradas pelo roteador de contas, evitando cópias de dezenas de páginas equivalentes.

A regra de PSP implementada é: **pt/pt-BR -> Asaas** e **18 idiomas internacionais -> Stripe**. O checkout Asaas rejeita `lang` diferente de `pt`; o checkout Stripe rejeita qualquer idioma fora do conjunto internacional. Pix permanece restrito ao Brasil.

A criação de perfil do usuário é defensiva: consulta primeiro, usa `create` em vez de sobrescrever e trata a corrida `ALREADY_EXISTS` relendo o documento vencedor. As regras do Firestore mantêm `uid`, `email` e `provider` imutáveis, bloqueiam alterações client-side dos campos de plano/acesso e bloqueiam exclusão direta do perfil.

O menu de autenticação dinâmico recebeu carregamento site-wide do localizador de conta. As páginas de perfil, configurações, favoritos e histórico receberam localização complementar e preservação de rotas. O catálogo existente `AccountI18n` permanece a fonte canônica para as traduções da área de conta.

## Segurança administrativa

Foi identificada e corrigida uma falha relevante em `asaas-admin` e `grant-access`: anteriormente, a autorização administrativa dependia de um `adminEmail` enviado no corpo da requisição. O fluxo agora exige um **Firebase ID token válido**, valida assinatura, emissor, audiência e validade temporal, e obtém a identidade administrativa diretamente do JWT. O e-mail enviado no corpo deixou de ser credencial de autorização.

As duas funções foram redeployadas em produção e permanecem com `verify_jwt=false` porque implementam autenticação customizada com o JWT do Firebase no próprio handler.

## Evidências de produção no Supabase

- `asaas-admin`: **ACTIVE v15**.
- `grant-access`: **ACTIVE v13**.
- `asaas-checkout`: **ACTIVE v17**.
- `asaas-webhook`: **ACTIVE v20**.
- `stripe-checkout`: **ACTIVE v17**.
- `stripe-webhook`: **ACTIVE v19**.
- `public.payments`: **13 registros**, **2 usuários distintos**, **1 aprovado**.
- `public.stripe_events`: **0 registros**.
- `public.billing_webhook_claims`: **0 registros** no momento da consulta.
- As funções SQL `claim_billing_webhook`, `complete_billing_webhook` e `fail_billing_webhook` não têm EXECUTE para `public`, `anon` ou `authenticated`; o acesso é restrito ao `service_role`.
- RLS permanece habilitado em `payments`, `stripe_events` e `billing_webhook_claims`.
- Nenhum registro financeiro foi apagado durante esta auditoria.

## Idempotência de webhook

A tabela `billing_webhook_claims` e o índice único `(provider,event_id)` permanecem como camada de concorrência. O ciclo claim -> complete/fail impede que duas entregas concorrentes do mesmo evento estendam ou concedam acesso duas vezes.

## Anúncios e assinatura

A política de anúncios utiliza estado fail-closed durante a resolução da assinatura e oculta os nós de anúncios para assinantes elegíveis. A camada canônica reconhece o plano Júnior e preserva comportamento legado para registros históricos de planos antigos/lifetime, evitando apagar ou degradar automaticamente assinaturas históricas sem prova.

## Achados remanescentes fora deste fechamento

Os advisories de segurança/performance do Supabase ainda incluem alertas preexistentes de RLS sem policy em algumas tabelas servidor-only, além de avisos de `auth_rls_initplan`, índices não utilizados e múltiplas policies permissivas em objetos fora do escopo desta auditoria. Esses achados não foram alterados neste fechamento para evitar regressões em superfícies não relacionadas a billing/account.

A verificação de fonte e versão implantada das Edge Functions, das regras do Firestore e do estado dos dados foi realizada. Não foi executada uma compra real Stripe nem um POST administrativo com um Firebase ID token real neste ambiente; portanto, não há alegação de teste end-to-end dessas duas operações.

## Critérios de fechamento

1. Roteamento de PSP separado por idioma: **atendido**.
2. URLs de retorno preservam idioma: **atendido**.
3. Contas/perfil/configurações/favoritos/histórico internacionalizados: **atendido estruturalmente**.
4. Rotas/guards preservam idioma: **atendido**.
5. Autorização administrativa fail-closed: **atendido em fonte e deploy**.
6. Histórico financeiro preservado: **atendido**.
7. Idempotência de webhook preservada: **atendido**.

**Status desta auditoria:** tecnicamente fechada para o escopo definido. A PR permanece aberta/draft para revisão humana final antes de qualquer merge.