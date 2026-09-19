# Billing v2 migration

Applied to Supabase project `asjkftjfbkuuhilnqonx` on 2026-09-19.

Created:
- `public.user_entitlements`
- `public.billing_subscriptions`
- `public.current_user_plan()`
- `public.ensure_user_entitlement()` + `auth.users` trigger

Rules:
- only `free` and `premium`
- Premium never disables ads
- users can read only their own entitlement/subscription rows
- service role/backend is responsible for writes
- legacy `public.payments` is preserved as historical data
- Firebase/Firestore is not the authority for the new billing state
