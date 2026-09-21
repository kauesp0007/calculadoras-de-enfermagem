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

revoke all on table public.billing_webhook_claims from anon, authenticated;

comment on table public.billing_webhook_claims is 'Private idempotency ledger for billing webhooks; one claim per provider/event_id.';
