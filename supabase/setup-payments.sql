-- =====================================================================
-- Mercado Pago — Ledger de pagamentos (Supabase)
-- Tabela usada pelas Edge Functions para registrar cobranças e status.
--
-- Como aplicar:
--   Supabase Dashboard -> SQL Editor -> colar e executar.
-- =====================================================================

create table if not exists public.payments (
  id uuid primary key,
  user_id text not null,
  plan_id text not null,
  status text not null default 'pending',
  mp_payment_id bigint,
  mp_preference_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS: somente leitura para anon (o frontend consulta o status por id).
-- Escrita (insert/update/delete) só via service_role (Edge Functions),
-- que ignora RLS.
alter table public.payments enable row level security;

create policy "anon_read_payments"
  on public.payments for select
  using (true);

create index if not exists payments_status_idx on public.payments(status);
create index if not exists payments_user_idx on public.payments(user_id);
