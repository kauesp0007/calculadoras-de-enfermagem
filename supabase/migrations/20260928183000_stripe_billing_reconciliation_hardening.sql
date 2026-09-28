-- Stripe billing reconciliation hardening.
-- Makes webhook delivery retryable after recoverable processing failures,
-- gives Stripe subscription/session identifiers deterministic unique lookup,
-- and canonicalizes active Stripe rows to the provider subscription id.

create unique index if not exists billing_subscriptions_stripe_checkout_session_id_key
  on public.billing_subscriptions ((metadata->>'checkout_session_id'))
  where provider='stripe' and metadata->>'checkout_session_id' is not null;

create unique index if not exists billing_subscriptions_stripe_provider_subscription_id_key
  on public.billing_subscriptions ((metadata->>'provider_subscription_id'))
  where provider='stripe' and metadata->>'provider_subscription_id' is not null;

update public.billing_subscriptions
   set external_id = metadata->>'provider_subscription_id'
 where provider='stripe'
   and status in ('active','past_due')
   and metadata->>'provider_subscription_id' is not null
   and external_id <> metadata->>'provider_subscription_id';

create or replace function public.claim_billing_webhook(
  p_provider text,
  p_event_id text,
  p_lease_seconds integer default 300
)
returns boolean
language plpgsql
set search_path to 'public'
as $function$
declare
  v_now timestamptz := now();
  v_lease_seconds integer := least(greatest(coalesce(p_lease_seconds,300),30),3600);
begin
  if p_provider is null or btrim(p_provider)='' then
    raise exception 'provider_required';
  end if;
  if p_event_id is null or btrim(p_event_id)='' then
    raise exception 'event_id_required';
  end if;

  insert into public.billing_webhook_claims(provider,event_id,status,updated_at)
  values(p_provider,p_event_id,'processing',v_now)
  on conflict(provider,event_id) do update
    set status='processing',
        updated_at=v_now,
        processed_at=null,
        last_error=null
    where public.billing_webhook_claims.status='error'
       or (
         public.billing_webhook_claims.status='processing'
         and public.billing_webhook_claims.updated_at < v_now-make_interval(secs=>v_lease_seconds)
       );

  return found;
end;
$function$;

revoke all on function public.claim_billing_webhook(text,text,integer) from public,anon,authenticated;
grant execute on function public.claim_billing_webhook(text,text,integer) to service_role;
