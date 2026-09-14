# Auditoria final — Contas, Assinaturas, Anúncios e Financeiro

Data: 2026-09-14
Status: Em fechamento técnico

## Escopo verificado

- Firebase Auth + Firestore `users/{uid}`.
- Persistência e concorrência de cadastro/login.
- Planos `free` e `junior`.
- Expiração, cancelamento e falha de pagamento.
- Asaas checkout, webhook, idempotência por evento e por pagamento.
- Stripe checkout/webhook e idempotência por evento.
- Bloqueio de AdSense/Auto Ads/Multiplex para Júnior.
- Preservação do histórico financeiro legado.
- Integridade e capacidade do Supabase.

## Evidências

1. Projeto Supabase está `ACTIVE_HEALTHY`.
2. `asaas-webhook` está ativo e foi atualizado para processamento síncrono com retorno de erro em falha.
3. `stripe-webhook` está ativo com registro de eventos idempotentes.
4. Regras do Firestore impedem mutação client-side de campos de assinatura, papel e auditoria financeira.
5. Exclusão direta de `users/{uid}` pelo cliente está bloqueada.
6. Registros de Stripe foram separados de `asaasSubscribers`.
7. O histórico `public.payments` não foi removido.
8. O controle de anúncios usa estado de espera/fail-closed enquanto a identidade e o perfil são resolvidos.

## Bloqueio encontrado e corrigido antes do fechamento

Durante a revisão final da PR 17, foi detectado que o diff continha uma versão vazia de `global-scripts.js`. Esse estado não foi aceito para produção. A branch final de auditoria foi criada a partir de `main` e o runtime global foi preservado nessa linha de revisão.

## Pendência de evidência externa

A auditoria de código e infraestrutura não substitui um teste real de renovação/cancelamento executado pelo gateway. O pagamento real de R$10 já informado pelo proprietário do projeto é tratado como caso real de referência; uma renovação real permanece evidência operacional futura, não uma suposição.

## Regra de preservação

Nenhum assinante histórico e nenhum registro financeiro histórico deve ser excluído durante esta auditoria sem prova independente de que o registro é órfão e sem registro da decisão.
