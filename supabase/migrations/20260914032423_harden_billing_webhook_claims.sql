alter table public.billing_webhook_claims enable row level security;

create unique index if not exists billing_webhook_claims_provider_event_uidx
  on public.billing_webhook_claims(provider, event_id);

create or replace function public.claim_billing_webhook(p_provider text, p_event_id text)
returns boolean
language sql
security invoker
set search_path = public
as $$
  insert into public.billing_webhook_claims(provider, event_id, status)
  values (p_provider, p_event_id, 'claimed')
  on conflict (provider, event_id) do nothing
  returning true;
$$;

grant execute on function public.claim_billing_webhook(text, text) to service_role;
revoke execute on function public.claim_billing_webhook(text, text) from anon, authenticated;

