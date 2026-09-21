create index if not exists billing_webhook_claims_status_idx on public.billing_webhook_claims(status);
create or replace function public.claim_billing_webhook(p_provider text, p_event_id text)
returns boolean
language sql
set search_path to 'public'
as $function$
  insert into public.billing_webhook_claims(provider,event_id,status,created_at)
  values (p_provider,p_event_id,'claimed',now())
  on conflict (provider,event_id) do nothing
  returning true;
$function$;
revoke all on function public.claim_billing_webhook(text,text) from public, anon, authenticated;
grant execute on function public.claim_billing_webhook(text,text) to service_role;
