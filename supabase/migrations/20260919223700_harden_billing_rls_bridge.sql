drop policy if exists "users read own entitlement" on public.user_entitlements;
drop policy if exists "users read own subscriptions" on public.billing_subscriptions;
revoke all on public.user_entitlements from anon, authenticated;
revoke all on public.billing_subscriptions from anon, authenticated;
create index if not exists user_entitlements_plan_expiry_idx on public.user_entitlements(plan,premium_expires_at);
create index if not exists billing_subscriptions_identity_status_idx on public.billing_subscriptions(user_id,status);

