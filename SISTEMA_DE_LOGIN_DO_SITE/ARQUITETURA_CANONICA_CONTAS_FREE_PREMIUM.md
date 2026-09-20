# Arquitetura canônica de contas, acesso e pagamentos

Atualizado em 2026-09-19.

## Modelo comercial
- `free`: conteúdo gratuito; anúncios permanecem ativos.
- `premium`: conteúdo premium liberado; anúncios permanecem ativos.

## Provedores
- Brasil / pt-BR: Asaas.
- 18 idiomas internacionais: Stripe.

## Autoridade
O login permanece temporariamente no Firebase para preservar as contas existentes. O Firebase/Firestore não é autoridade comercial. O Supabase é a fonte de verdade para identidade de billing, assinaturas e entitlement.

O fluxo é:
1. Firebase autentica o usuário.
2. O backend valida o Firebase ID token.
3. O backend resolve `billing_identities`.
4. O backend lê o entitlement no Supabase.
5. Somente webhooks confirmados pelos PSPs alteram o estado Premium.

## Regras
- Exatamente dois estados comerciais: Free e Premium.
- Premium nunca remove anúncios.
- Nenhum frontend/callback/localStorage/cookie pode conceder Premium.
- Dados históricos não são apagados sem plano de retenção/auditoria.
- Firebase/Firestore legado só será removido após migração dos módulos dependentes.

## Produção
As Edge Functions novas permanecem fora de produção até validação final de segredos, preços, webhooks e testes de integração.