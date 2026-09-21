# Stripe Sandbox — sem cobrança

Este branch contém um caminho de teste isolado para validar o Stripe Test Mode sem alterar o ledger Premium de produção.

## Variáveis TEST

Configure somente no ambiente da Edge Function de teste:

- `STRIPE_SECRET_KEY_TEST`: chave TEST do Stripe, obrigatoriamente começando por `sk_test_`.
- `STRIPE_PRICE_TEST_USD`: Price recorrente criado no Stripe Test Mode.
- `STRIPE_PRICE_TEST_EUR`: Price recorrente criado no Stripe Test Mode.
- `STRIPE_WEBHOOK_SECRET_TEST`: signing secret do webhook TEST, começando por `whsec_`.
- `FIREBASE_PROJECT_ID`: projeto Firebase usado pelo login.

## Segurança

As funções `stripe-checkout-test` e `stripe-webhook-test` não escrevem em `billing_subscriptions` nem em `user_entitlements`. Portanto, o teste não concede Premium real.

O checkout TEST rejeita qualquer chave que não comece por `sk_test_`.

## Cartão

No Stripe Test Mode use:

`4242 4242 4242 4242`

Use validade futura e CVC de teste.

## O que este sandbox valida

1. autenticação Firebase;
2. criação de Checkout Session TEST;
3. Price TEST USD/EUR;
4. retorno do Checkout;
5. assinatura do webhook;
6. recebimento e identificação dos eventos TEST.

A concessão real de Premium continua exclusivamente no fluxo LIVE.
