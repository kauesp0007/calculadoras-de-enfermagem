create table if not exists public.billing_webhook_claims (
  provider text not null,
  event_id text not null,
  status text not null default 'received',
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  last_error text,
  primary key (provider, event_id)
);

alter table public.billing_webhook_claims enable row level security;

create index if not exists billing_webhook_claims_status_idx
  on public.billing_webhook_claims(status);

create or replace function public.claim_billing_webhook(p_provider text, p_event_id text)
returns boolean
language plpgsql
set search_path to 'public'
as $function$
begin
  if p_provider is null or btrim(p_provider) = '' then
    raise exception 'provider_required';
  end if;
  if p_event_id is null or btrim(p_event_id) = '' then
    raise exception 'event_id_required';
  end if;

  insert into public.billing_webhook_claims(provider, event_id, status)
  values (p_provider, p_event_id, 'processing')
  on conflict (provider, event_id) do nothing;

  return found;
end;
$function$;

revoke all on function public.claim_billing_webhook(text, text) from public, anon, authenticated;
grant execute on function public.claim_billing_webhook(text, text) to service_role;
