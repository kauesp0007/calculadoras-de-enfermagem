# Auditoria — Área de Assinaturas Internacionais

Data: 2026-09-14
Escopo: `/conta/assinatura.html?lang=...`, roteamento de pagamento internacional, validação Firebase no `stripe-checkout`, rodapé localizado e integridade dos 18 idiomas internacionais.

## Achado crítico corrigido

A função de produção `stripe-checkout` validava o ID Token do Firebase buscando certificados X.509 e tentando importá-los com `crypto.subtle.importKey("spki", ...)`. Certificado X.509 não é uma chave pública SPKI importável nesse formato. Isso podia derrubar a autenticação antes da criação da Checkout Session e produzir no frontend a mensagem genérica de falha do checkout.

Correção aplicada: uso do endpoint JWK do serviço de contas do Secure Token, seleção por `kid`, importação com `format: "jwk"`, cache temporário das chaves e atualização forçada quando o `kid` não estiver no cache.

## Roteamento verificado

- `pt` / `pt-BR` → Asaas.
- `en`, `es`, `fr`, `de`, `it`, `hi`, `zh`, `ja`, `ru`, `ko`, `tr`, `nl`, `pl`, `sv`, `id`, `vi`, `uk`, `ar` → Stripe.
- 18 idiomas internacionais cobertos.
- 10 idiomas EUR: `fr`, `es`, `de`, `it`, `tr`, `nl`, `pl`, `ru`, `uk`, `sv`.
- 8 idiomas USD: `en`, `hi`, `zh`, `ja`, `ar`, `ko`, `id`, `vi`.
- Idioma desconhecido retorna provider nulo.

## Rodapé

`js/billing/payment-router.js` passou a garantir o rodapé da área `/conta/`, usando o `footer.html` da pasta do idioma para os 18 idiomas internacionais e o `footer.html` da raiz para `pt`. Links relativos do rodapé localizado são normalizados para a pasta do idioma.

Foram confirmados os arquivos localizados de rodapé para os 18 idiomas: `ar`, `de`, `en`, `es`, `fr`, `hi`, `id`, `it`, `ja`, `ko`, `nl`, `pl`, `ru`, `sv`, `tr`, `uk`, `vi`, `zh`.

## Sandbox

`stripe-checkout-test` recebeu a mesma correção de validação JWK, mantendo a separação entre ambiente de teste e produção.

## Verificações executadas

1. Matriz determinística do `PaymentRouter`: PASS.
2. Contagem de idiomas internacionais: 18 — PASS.
3. Distribuição de moeda: 10 EUR + 8 USD — PASS.
4. `pt` roteia para Asaas — PASS.
5. Idioma desconhecido falha fechado — PASS.
6. `stripe-checkout` produção: versão 24, status ACTIVE após deploy — PASS.
7. `stripe-checkout-test`: versão 2, status ACTIVE após deploy — PASS.
8. `stripe-webhook`: permanece ACTIVE, versão 34 — PASS.
9. Diff da correção isolado em três arquivos de código: `js/billing/payment-router.js`, `supabase/functions/stripe-checkout/index.ts`, `supabase/functions/stripe-checkout-test/index.ts`.
10. `global-scripts.js` não foi alterado — PASS.

## Limitação de contra-prova

Não foi possível executar neste ambiente um clique real no botão Stripe com um token Firebase de usuário real e acompanhar a Checkout Session no navegador. Portanto, a auditoria estrutural, de código, deploy e roteamento está positiva, mas a contra-prova E2E de navegador/pagamento real permanece dependente de uma sessão autenticada real.
