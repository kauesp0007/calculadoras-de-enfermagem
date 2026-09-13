# Status da auditoria do Premium Júnior — 13/09/2026

## Confirmado no Asaas

- Conta em produção sem novas entradas financeiras segundo verificação do proprietário.
- Webhook atual estava ativo, v3, sequencial, com fila ativa.
- O histórico de entregas apresentava respostas HTTP 500.
- A configuração antiga usava links públicos de pagamento e dependia do e-mail para descobrir o usuário.

## Confirmado no Stripe

- Preços USD 5/mês e EUR 5/mês existem e estavam sem assinaturas ativas.
- Foi observado erro de criação de Checkout Session: `No valid payment method types for this Checkout Session`.
- A função antiga informava manualmente `payment_method_types=card`.

## Correções aplicadas nesta branch

1. Removido o paid gate global que enviava usuários gratuitos para a página de assinatura.
2. Removido o diretório legado `js/subscriptions/*`.
3. Removida documentação legada do antigo desenho de pagamentos.
4. Canonicalizado o plano pago para `junior` e o preço brasileiro para R$10,00.
5. `assinatura.html` agora carrega explicitamente `auth-user-profile.js` e dependências.
6. Asaas ganhou checkout individualizado e autenticado por Firebase ID token.
7. O vínculo pagamento → usuário usa `externalReference` do pedido, e não busca por e-mail.
8. O webhook Asaas foi refeito com idempotência por evento e processamento assíncrono após aceitação.
9. As chamadas de escrita REST do Firestore usam update masks para preservar campos não relacionados.
10. Regras do Firestore passaram a bloquear toda alteração client-side dos campos que determinam premium.
11. Stripe Checkout deixou de fixar `payment_method_types`; o Dashboard controla métodos elegíveis.
12. Stripe webhook recebeu proteção contra substituição acidental do documento do usuário via update masks.
13. `supabase/config.toml` foi criado para alinhar a verificação de JWT às funções que validam Firebase tokens ou recebem webhooks externos.

## Pendências de publicação

- Deploy das quatro Edge Functions.
- Configuração dos eventos do novo Checkout no webhook Asaas.
- Desativação dos dois links públicos antigos do Asaas após o teste do novo Checkout.
- Rotação do segredo do webhook Stripe que foi exposto fora do ambiente seguro.
- Regeneração de `sw.js` com `node gerar-sw.js` para remover arquivos que já não existem.
- Teste real controlado no ambiente de produção após conferência das Secrets.
