# Migração do sistema de pagamentos — produção

Esta branch remove a arquitetura antiga de assinaturas do frontend e prepara o fluxo individualizado Asaas/Stripe.

## Antes de publicar

### Supabase

Atualize os Secrets existentes sem colocar valores no Git:

- `ASAAS_API_TOKEN`
- `ASAAS_WEBHOOK_TOKEN`
- `FIREBASE_SERVICE_ACCOUNT`
- `FIREBASE_PROJECT_ID`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_USD`
- `STRIPE_PRICE_EUR`

Faça deploy das funções:

```text
supabase functions deploy asaas-checkout --project-ref asjkftjfbkuuhilnqonx
supabase functions deploy asaas-webhook --project-ref asjkftjfbkuuhilnqonx
supabase functions deploy stripe-checkout --project-ref asjkftjfbkuuhilnqonx
supabase functions deploy stripe-webhook --project-ref asjkftjfbkuuhilnqonx
```

O `supabase/config.toml` desativa a verificação JWT da plataforma nas funções que validam Firebase ID tokens ou recebem webhooks externos.

### Asaas

Mantenha o webhook ativo, v3, sequencial e com fila habilitada. O token configurado no Asaas deve ser exatamente o mesmo Secret `ASAAS_WEBHOOK_TOKEN` do Supabase.

Adicione aos eventos:

- `CHECKOUT_CREATED`
- `CHECKOUT_PAID`
- `CHECKOUT_CANCELED`
- `CHECKOUT_EXPIRED`
- `SUBSCRIPTION_CREATED`
- `SUBSCRIPTION_DELETED`
- `SUBSCRIPTION_INACTIVATED`
- `PAYMENT_CONFIRMED`
- `PAYMENT_RECEIVED`

Depois de testar o checkout novo, desative os links públicos antigos `vcnk68nigacrape5` e `z89jgzlk57nb354p`. Eles não carregam o UID autenticado e não devem continuar em produção após a migração.

O Checkout novo usa R$ 10,00 como preço oficial no Brasil. A documentação atual do Asaas Checkout aceita `CREDIT_CARD` e `PIX`; boleto não é anunciado pelo novo Checkout. Para boleto recorrente, implementar uma integração específica de assinatura via API posteriormente.

### Stripe

A função `stripe-checkout` não envia mais `payment_method_types=card`; o Dashboard do Stripe controla os métodos elegíveis.

O Stripe continua responsável pelas 18 localizações internacionais e pelos preços USD 5/EUR 5.

### Rotação de credenciais

O segredo do webhook Stripe que foi exposto fora do ambiente de secrets deve ser revogado e substituído antes do próximo deploy em produção.

## Teste de aceitação

1. Criar uma conta Firebase de teste.
2. Abrir `/conta/assinatura.html` autenticado.
3. Confirmar que o preço brasileiro exibido é R$10,00.
4. Clicar em cartão e verificar criação de `premiumOrders/{orderId}`.
5. Confirmar redirecionamento para `asaas.com/checkoutSession/show?id=...`.
6. Fazer pagamento de teste no ambiente apropriado.
7. Confirmar `CHECKOUT_PAID` no Asaas.
8. Confirmar `asaasEvents/{eventId}` e `premiumOrders/{orderId}`.
9. Confirmar `users/{uid}.plan=junior` e `planExpiresAt` válido.
10. Confirmar desaparecimento dos anúncios.
11. Confirmar que conteúdo premium é liberado.
12. Repetir com Pix e confirmar validade de 30 dias.
13. Cancelar uma assinatura e confirmar que o acesso não é removido antes do vencimento do período já pago.
14. Testar Stripe em pelo menos um idioma USD e um idioma EUR.
15. Depois da validação, regenerar `sw.js` com `node gerar-sw.js` para eliminar referências a arquivos excluídos do precache.
