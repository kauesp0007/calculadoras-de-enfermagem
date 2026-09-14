# Auditoria interna — Contas, Assinaturas, Anúncios e Financeiro

Data: 2026-09-13
Status: Em acompanhamento

## Escopo

1. Firebase Authentication e criação/persistência de `users/{uid}`.
2. Consistência de `plan`, `planExpiresAt`, `lifetime` e subcoleção de assinaturas.
3. Asaas: checkout, cobrança recorrente, Pix, webhook e idempotência.
4. Stripe: checkout internacional, webhook, renovação e falhas.
5. Política de anúncios: free recebe anúncios; Júnior válido não recebe anúncios.
6. Resíduos de Mercado Pago e possíveis caminhos financeiros concorrentes.
7. Integridade, capacidade e desempenho do armazenamento.
8. Revisão de endpoints com `verify_jwt=false` e autenticação própria.

## Evidências iniciais

- Supabase production está `ACTIVE_HEALTHY`.
- Edge Functions financeiras estão ativas.
- Firestore é descrito no projeto como fonte da verdade para o plano.
- Fluxo antigo confirmado: checkout Asaas direto na página; webhook atualiza plano.
- `asaas-webhook` atual utiliza `premiumOrders`, `asaasCustomers`, `asaasSubscribers`, `asaasEvents` e `users/{uid}/subscriptions/{subscriptionId}`.
- Existe tabela Supabase `public.payments` com campos legados `mp_payment_id` e `mp_preference_id`; deve ser rastreada antes de qualquer remoção.
- Security Advisor: `public.translations` tem RLS sem política.
- Performance Advisor: há 7 alertas de RLS initplan, 17 casos de múltiplas políticas permissivas, 1 FK sem índice e índices não utilizados. Esses alertas são tratados separadamente do fluxo financeiro quando não houver relação comprovada.
- `auth-core.js` está em fail-closed para anúncios enquanto o perfil do usuário autenticado não foi resolvido.

## Critérios de aprovação

### Conta
- Login cria/recupera exatamente um `users/{uid}`.
- Cadastro permanece após logout/login.
- Google e e-mail usam o mesmo UID e a mesma fonte de perfil.
- Falha de leitura do perfil não transforma usuário em premium nem libera anúncios indevidamente.

### Assinatura
- Júnior válido = conteúdo liberado + zero anúncios.
- Free = conteúdo gratuito + anúncios permitidos.
- Expirado = retorno a free/anúncios.
- Cancelamento/inativação = revogação consistente.
- Não existe renovação duplicada para um mesmo evento.

### Financeiro
- Um pagamento inicial ativa uma vez.
- Uma renovação estende o prazo uma vez.
- Evento webhook repetido é idempotente.
- Eventos antigos não reativam assinatura indevidamente.
- Valores e gateway permanecem coerentes com o checkout escolhido.
- Segredos nunca aparecem no frontend.

### Anúncios
- Visitante/free: Auto Ads e Multiplex podem operar normalmente, conforme consentimento/decisão do AdSense.
- Júnior: nenhum bloco `adsbygoogle`, Auto Ads ou Multiplex fica visível.
- Não há corrida de carregamento que exponha anúncios antes da resolução do plano.

## Próximas verificações

- Rastrear todas as referências a `public.payments`.
- Rastrear referências a `asaas-checkout` após a reversão do checkout brasileiro direto.
- Auditar Stripe checkout/webhook e seus critérios de renovação/revogação.
- Verificar logs das funções financeiras e erros recentes.
- Revisar regras Firestore do perfil e objetos operacionais.
- Criar testes automatizados de invariantes para plano/expiração/idempotência quando a infraestrutura de testes disponível no repositório permitir.

## Regra de correção

Não remover, migrar ou alterar dados financeiros de produção sem evidência de uso e compatibilidade. Correções de código devem ser isoladas, revisáveis e acompanhadas de verificação posterior.
