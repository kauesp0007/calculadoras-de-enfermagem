# Billing v2 migration

Applied to Supabase project `asjkftjfbkuuhilnqonx` on 2026-09-19.

## Canonical model
- `free`: free content + ads.
- `premium`: free content + premium content + ads.
- No commercial Junior/Senior/Pleno/lifetime tiers.

## Identity bridge
Firebase Auth remains the login authority during the controlled migration so existing accounts are not broken. Billing does not trust Firebase/Firestore plan fields. Obsolete public billing RPCs were removed after the bridge was implemented.

Supabase now stores:
- `billing_identities`: stable internal billing identity, currently mapped from Firebase UID; future field `supabase_user_id` permits controlled migration.
- `user_entitlements`: canonical access state.
- `billing_subscriptions`: provider subscription ledger.

The billing Edge Functions validate the Firebase ID token server-side, resolve the internal billing identity, and read/write the Supabase billing ledger with the service role.

## Security
- Billing tables are RLS-enabled and not directly writable/readable by browser roles.
- SECURITY DEFINER billing helper functions are not executable by anon/authenticated roles.
- Financial confirmation comes from verified provider webhooks only.
- `public.payments` remains untouched as historical audit data.
- No callback URL, localStorage, cookie or user-editable metadata grants Premium.

## Providers
- Brazil / pt-BR: Asaas.
- International languages: Stripe.

## Production gate
Do not deploy/activate the new checkout until provider secrets, webhook URLs, Stripe Prices/currencies, Asaas webhook events, and end-to-end tests are validated.