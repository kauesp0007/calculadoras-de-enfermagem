alter table public.billing_webhook_claims
  add column if not exists updated_at timestamptz not null default now();

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
  v_lease_seconds integer := least(greatest(coalesce(p_lease_seconds, 300), 30), 3600);
begin
  if p_provider is null or btrim(p_provider) = '' then
    raise exception 'provider_required';
  end if;
  if p_event_id is null or btrim(p_event_id) = '' then
    raise exception 'event_id_required';
  end if;

  insert into public.billing_webhook_claims(provider, event_id, status, updated_at)
  values (p_provider, p_event_id, 'processing', now())
  on conflict (provider, event_id) do update
    set status = 'processing',
        updated_at = now(),
        processed_at = null,
        last_error = null
    where public.billing_webhook_claims.status <> 'processed'
      and public.billing_webhook_claims.updated_at < now() - make_interval(secs => v_lease_seconds);

  return found;
end;
$function$;

create or replace function public.complete_billing_webhook(
  p_provider text,
  p_event_id text
)
returns boolean
language sql
set search_path to 'public'
as $function$
  update public.billing_webhook_claims
     set status = 'processed',
         processed_at = coalesce(processed_at, now()),
         updated_at = now(),
         last_error = null
   where provider = p_provider
     and event_id = p_event_id
     and status = 'processing'
  returning true;
$function$;

create or replace function public.fail_billing_webhook(
  p_provider text,
  p_event_id text,
  p_error text
)
returns boolean
language sql
set search_path to 'public'
as $function$
  update public.billing_webhook_claims
     set status = 'error',
         updated_at = now(),
         last_error = left(coalesce(p_error, 'unknown_error'), 2000)
   where provider = p_provider
     and event_id = p_event_id
     and status <> 'processed'
  returning true;
$function$;

revoke all on function public.claim_billing_webhook(text,text,integer) from public, anon, authenticated;
revoke all on function public.complete_billing_webhook(text,text) from public, anon, authenticated;
revoke all on function public.fail_billing_webhook(text,text,text) from public, anon, authenticated;
grant execute on function public.claim_billing_webhook(text,text,integer) to service_role;
grant execute on function public.complete_billing_webhook(text,text) to service_role;
grant execute on function public.fail_billing_webhook(text,text,text) to service_role;
