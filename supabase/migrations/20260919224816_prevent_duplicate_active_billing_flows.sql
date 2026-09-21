
create unique index if not exists billing_subscriptions_one_open_asaas
on public.billing_subscriptions(user_id)
where provider='asaas' and status in ('checkout_pending','active','past_due');

create unique index if not exists billing_subscriptions_one_open_stripe
on public.billing_subscriptions(user_id)
where provider='stripe' and status in ('checkout_pending','active','past_due');

