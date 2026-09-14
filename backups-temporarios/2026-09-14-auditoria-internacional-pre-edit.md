# Backup manifest — auditoria internacional 2026-09-14

Branch: `audit/billing-ads-hardening-20260914`
Head auditado: `6b0f395567425f40475872235d5cc47cc809f788`

Arquivos protegidos antes da implementação por SHA atual:
- `conta/assinatura.html` — `bb88afb981adf3d5fa90431e60e0c8a5b615f8ca`
- `conta/perfil.html` — `217d6facf8362ac5388746f03780126f6428357f`
- `conta/configuracoes.html` — `8fc579a5d6bc0000212a8e9ddb360a740750ef56`
- `conta/favoritos.html` — `37991850f039b94f0e086988aa4a7f66f5799cc5`
- `conta/historico.html` — `8f2f7c3686d4058e18f9f8e36d6aa743c80891fc`
- `conta/login.html` — `cd01aa539fc9d51e0086b7f21c56570d6807b8dc`
- `global-scripts.js` — `60fcd6f37ae15826d3ecf96c0f545dc7cda2e21c` (conteúdo completo preservado no histórico do branch)
- `lang-selector.js` — `9ccc34eac73a3cd4a6d8fb4692cdc3986a26fd81`
- `js/conta-i18n.js` — `turn223`/blob do branch auditado
- `js/auth/firestore-user.js` — `8b2347fe9e3d2ec68ed11b6c75c04c483afb5d41`
- `supabase/config.toml` — `001d67b80ecff5eec07e3b8e0650c59a8148ffce`
- `supabase/functions/stripe-checkout/index.ts` — `7c2a3f1c58597d0422856094788c5156244b3ca9`
- `supabase/functions/asaas-checkout/index.ts` — `9318577d769d1892e8ce4df26056f8fc95e65633`

Regra de rollback: nenhum histórico financeiro deve ser apagado; qualquer reversão deve restaurar o conteúdo a partir dos SHAs acima/commit pai correspondente.

Observação: este manifesto é uma âncora de backup/rollback antes das alterações desta fase; os blobs existentes permanecem imutáveis no Git.
