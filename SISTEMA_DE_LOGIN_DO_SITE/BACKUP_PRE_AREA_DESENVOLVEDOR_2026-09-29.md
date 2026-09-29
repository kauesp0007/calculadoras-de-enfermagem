# Backup Pre Area Desenvolvedor - 2026-09-29

Este arquivo registra o ponto anterior a criacao da Area do Desenvolvedor do sistema Premium.

## Ponto de restauracao

- Branch local de trabalho: `codex/admin-developer-premium`
- Commit base antes das alteracoes: `d8a3abe4089cd76025e21525124135e4a11dc607`
- Escopo original preservado: sistema Free/Premium vigente com `billing-access`, `premium-content`, `asaas-checkout`, `stripe-checkout`, `billing-admin`, `premium_content_pages`, `billing_identities` e `user_entitlements`.

## Como reverter esta entrega, se necessario

1. Reverter o PR/commit que introduzir a Area do Desenvolvedor.
2. Reverter a migracao `20260929210000_developer_premium_admin_controls.sql` somente se as tabelas administrativas ainda nao tiverem sido usadas em producao.
3. Caso as tabelas ja tenham dados reais de auditoria, preferir desativar os interruptores pelo painel ou por SQL controlado, preservando o log.

## Arquivos novos previstos

- `conta/desenvolvedor.html`
- `supabase/functions/developer-admin/index.ts`
- `supabase/migrations/20260929210000_developer_premium_admin_controls.sql`
- `scripts/test-developer-admin.js`
- `SISTEMA_DE_LOGIN_DO_SITE/MANUAL_AREA_DESENVOLVEDOR_PREMIUM.md`

## Principio de seguranca

A nova area nao substitui o sistema Premium. Ela grava atalhos administrativos em tabelas privadas e aciona as mesmas Edge Functions e tabelas canonicas usadas pelo sistema vigente.
