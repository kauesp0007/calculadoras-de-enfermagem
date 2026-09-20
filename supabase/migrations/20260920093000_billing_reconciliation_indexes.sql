-- Billing reconciliation indexes.
-- A Checkout ID and an Asaas subscription ID must identify at most one
-- local billing subscription. Both values are persisted in metadata because
-- billing_subscriptions intentionally has no provider-specific columns.

create unique index if not exists billing_subscriptions_asaas_checkout_id_key
  on public.billing_subscriptions ((metadata->>'checkout_id'))
  where provider='asaas' and metadata->>'checkout_id' is not null;

create unique index if not exists billing_subscriptions_asaas_provider_subscription_id_key
  on public.billing_subscriptions ((metadata->>'provider_subscription_id'))
  where provider='asaas' and metadata->>'provider_subscription_id' is not null;
