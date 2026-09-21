create table if not exists public.stripe_events (
  event_id text primary key,
  event_type text not null,
  status text not null default 'received',
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.stripe_events enable row level security;

drop policy if exists stripe_events_no_access on public.stripe_events;
create policy stripe_events_no_access on public.stripe_events
  for all using (false) with check (false);

create index if not exists stripe_events_status_idx on public.stripe_events(status);
create index if not exists stripe_events_created_at_idx on public.stripe_events(created_at desc);

