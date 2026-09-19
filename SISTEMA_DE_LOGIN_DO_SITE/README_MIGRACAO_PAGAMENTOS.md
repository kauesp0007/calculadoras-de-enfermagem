# Migração FREE/PREMIUM — Checklist de Produção

Atualizado em 2026-09-19.

## Estado atual

A arquitetura canônica já está definida e o backend de leitura comercial está implantado. A autenticação continua temporariamente no Firebase; o estado comercial está no Supabase.

Não fazer merge enquanto os gates deste documento não estiverem comprovados.

## Configuração obrigatória

Secrets necessários no Supabase, sem valores no Git:

- `ASAAS_API_TOKEN`
- `ASAAS_WEBHOOK_TOKEN`
- `FIREBASE_PROJECT_ID`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_USD`
- `STRIPE_PRICE_EUR`

A presença dos secrets precisa ser verificada no ambiente de execução; os valores nunca devem aparecer em logs, commits ou respostas.

## Preços

- Brasil: R$ 10,00, Asaas.
- Internacional: USD 5/mês ou EUR 5/mês, Stripe.
- O frontend não escolhe preço.

Os Price IDs documentados são:

- USD: `price_1UEeJeAE0EBt2lxCFI56AWCx`
- EUR: `price_1UEf7uAE0EBt2lxCmfLGGmNH`

Antes da ativação, conferir no Stripe que ambos estão ativos e são recorrentes mensais.

## Asaas

A documentação atual do Asaas Checkout confirma `CREDIT_CARD` + `RECURRENT` para assinatura e `PIX` + `DETACHED` para cobrança avulsa. A confirmação financeira deve ocorrer por Webhook, não pelo callback.

Configurar o webhook para receber os eventos necessários de Checkout, assinatura e cobrança, com `authToken` próprio e header `asaas-access-token`.

O processamento deve ser idempotente pelo `event.id`.

## Stripe

A sessão deve usar `mode=subscription` e Price recorrente. Metadata da sessão e da assinatura deve conter o identificador interno do usuário.

O webhook deve validar a assinatura usando o corpo bruto e `STRIPE_WEBHOOK_SECRET`.

Para `invoice.paid`, a integração consulta a assinatura quando necessário para obter metadata e `current_period_end`. Isso evita depender de metadata que não esteja presente no objeto Invoice.

## Testes obrigatórios

### Autenticação

- Sem Authorization → rejeitar.
- Firebase ID token inválido → rejeitar.
- Firebase ID token válido → permitir apenas a própria identidade.
- UID enviado pelo cliente não pode substituir o UID do token.

### Autorização

- Conta Free → somente conteúdo Free.
- Conta Premium ativa → conteúdo Premium.
- Premium expirado → Free.
- Falha no endpoint de billing → fail-closed para Free.
- Query string, callback, localStorage e cookie adulterados → não concedem Premium.
- Premium não remove anúncios.

### Asaas

- Checkout cartão mensal.
- Checkout Pix 30 dias.
- `CHECKOUT_PAID`.
- `CHECKOUT_CANCELED`.
- `CHECKOUT_EXPIRED`.
- `SUBSCRIPTION_CREATED`.
- `SUBSCRIPTION_UPDATED`.
- `SUBSCRIPTION_INACTIVATED`.
- `SUBSCRIPTION_DELETED`.
- `PAYMENT_CONFIRMED`.
- `PAYMENT_RECEIVED`.
- `PAYMENT_REFUNDED`.
- chargeback.
- evento duplicado.
- webhook com token inválido.
- tentativa de criar checkout duplicado.

### Stripe

- Checkout USD.
- Checkout EUR.
- `checkout.session.completed`.
- `invoice.paid`.
- `invoice.payment_failed`.
- `customer.subscription.updated`.
- `customer.subscription.deleted`.
- assinatura duplicada.
- evento duplicado.
- assinatura Stripe sem metadata esperada.
- assinatura com status não elegível.
- assinatura cancelada.
- replay de webhook com timestamp fora da tolerância.

## Critério de aprovação

O fluxo só pode ser considerado pronto quando:

- nenhum teste obrigatório falhar;
- nenhum secret for exposto;
- nenhum endpoint legado conceder Premium;
- os quatro novos fluxos estiverem validados no ambiente apropriado;
- o Supabase registrar corretamente identidade, assinatura e entitlement;
- a autorização do frontend depender exclusivamente do estado retornado pelo backend;
- a varredura final não encontrar concessão por Junior/Senior/Pleno/lifetime ou ad-free.

Depois disso, o PR #29 pode ser revisado para merge.