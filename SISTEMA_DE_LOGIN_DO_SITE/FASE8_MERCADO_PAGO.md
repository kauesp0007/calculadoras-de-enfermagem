# Fase 8 — Integração Mercado Pago (Payment Engine)

Integração de pagamento com **Mercado Pago** usando as **Edge Functions do Supabase**
(projeto `asjkftjfbkuuhilnqonx`) como backend seguro. A fonte de verdade dos planos
continua no **Firestore** (`users/{uid}.plan`).

## Arquitetura

```
cobranca.html
  -> invoke('mercadopago-create-preference')  [Supabase Edge Function]
        -> grava public.payments (pending)
        -> cria preferência no Mercado Pago
        <- devolve initPoint (link de checkout)
  -> redireciona o usuário para o checkout do MP (PIX/cartão)

Mercado Pago (após pagamento)
  -> POST /functions/v1/mercadopago-webhook   [Supabase Edge Function]
        -> consulta /v1/payments/{id}
        -> se approved: atualiza Firestore (users/{uid}.plan) + cria assinatura
        -> marca public.payments como approved

cobranca.html (retorno)
  -> consulta public.payments por checkoutId (polling)
  -> se approved: mostra sucesso e atualiza o perfil
```

O cliente **não** ativa o plano sozinho — a liberação é feita pelo webhook
(server-authoritative). Isso impede que alguém ative premium sem pagar.

## Arquivos

| Arquivo | Função |
|---|---|
| `supabase/functions/mercadopago-create-preference/index.ts` | Cria a cobrança (Checkout Pro) |
| `supabase/functions/mercadopago-webhook/index.ts` | Confirma pagamento e libera o plano no Firestore |
| `supabase/setup-payments.sql` | Tabela `payments` + RLS (ledger) |
| `conta/cobranca.html` | Tela de cobrança (frontend) |

## Pré-requisitos

1. **Conta Mercado Pago** (gratuita): https://www.mercadopago.com.br
   - Em **Suas integrações → Suas credenciais**, copie o **Access Token**.
   - Comece com as **credenciais de teste** para validar sem dinheiro real.

2. **Chave de serviço do Firebase** (para o webhook atualizar o Firestore):
   - Firebase Console → Project settings → **Service accounts** → *Generate new private key*.
   - Isso gera um JSON (client_email, private_key, token_uri).

3. **Supabase CLI** instalado: https://supabase.com/docs/guides/cli

## Deploy (passo a passo)

```bash
# 1. Conectar ao projeto
supabase login
supabase link --project-ref asjkftjfbkuuhilnqonx

# 2. Configurar os segredos (você roda isso — a chave NUNCA passa pelo chat)
supabase secrets set MERCADO_PAGO_ACCESS_TOKEN="APP_USR-..." 
supabase secrets set FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"calculadoras-enfermagem","private_key":"...","client_email":"...","token_uri":"https://oauth2.googleapis.com/token"}'

# 3. Criar a tabela (SQL Editor do painel) — cole setup-payments.sql
#    ou use psql. Executar no painel é o mais simples.

# 4. Fazer o deploy das funções
supabase functions deploy mercadopago-create-preference
supabase functions deploy mercadopago-webhook --no-verify-jwt
```

> ⚠️ `mercadopago-webhook` DEVE ser deployada com `--no-verify-jwt`,
> porque o Mercado Pago chama essa URL sem autenticação do Supabase.

## Credenciais de teste do Mercado Pago

No modo sandbox (teste), use:
- **Cartão**: use os cartões de teste do MP (ex.: Visa `5031 7557 3453 0604`, CVV `123`, vencimento futuro).
- **PIX**: o fluxo de teste simula a aprovação.

Para produção, é necessário **validar a conta** (identidade) no Mercado Pago.

## Observações importantes

1. **Pagamento único, não recorrente**: o fluxo atual é de **pagamento único**
   (Checkout Pro). Assinatura recorrente automática (cobrança mensal) usa a API de
   **preapproval** do Mercado Pago — pode ser uma próxima etapa.

2. **Expiração**: o webhook grava `planExpiresAt` = +30 dias. Para renovação manual,
   o usuário simplesmente paga de novo (gera novo checkout).

3. **Preços**: `junior` R$ 5,00 · `pleno` R$ 7,00 · `senior` R$ 10,00. Os preços estão
   hardcoded em `mercadopago-create-preference` (manter sincronizado com
   `js/auth/plan-service.js`).

4. **Rastreio**: o campo `external_reference` da preferência = `checkoutId` (uuid),
   que liga o pagamento ao registro em `public.payments` e ao `user_id`.
