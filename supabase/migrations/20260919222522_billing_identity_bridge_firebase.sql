create table if not exists public.billing_identities (
 id uuid primary key default gen_random_uuid(),
 provider text not null check (provider in ('firebase','supabase')),
 external_subject text not null,
 email text null,
 supabase_user_id uuid null references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(provider, external_subject)
);
alter table public.billing_identities enable row level security;
revoke all on public.billing_identities from anon, authenticated;
grant all on public.billing_identities to service_role;

alter table public.user_entitlements drop constraint if exists user_entitlements_user_id_fkey;
alter table public.billing_subscriptions drop constraint if exists billing_subscriptions_user_id_fkey;
alter table public.user_entitlements add constraint user_entitlements_identity_fkey foreign key (user_id) references public.billing_identities(id) on delete cascade;
alter table public.billing_subscriptions add constraint billing_subscriptions_identity_fkey foreign key (user_id) references public.billing_identities(id) on delete cascade;

drop trigger if exists on_auth_user_created_entitlement on auth.users;
revoke all on function public.ensure_user_entitlement() from public, anon, authenticated;
grant execute on function public.ensure_user_entitlement() to service_role;

create index if not exists billing_identities_supabase_user_idx on public.billing_identities(supabase_user_id);
