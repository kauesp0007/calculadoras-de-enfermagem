create table if not exists public.developer_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_by text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.developer_settings enable row level security;
revoke all on public.developer_settings from anon, authenticated;
grant all on public.developer_settings to service_role;

insert into public.developer_settings(key,value)
values
  ('free_global_lockdown','{"enabled":false}'::jsonb),
  ('asaas_portal_enabled','{"enabled":true}'::jsonb),
  ('stripe_portal_enabled','{"enabled":true}'::jsonb)
on conflict (key) do nothing;

create table if not exists public.developer_premium_route_rules (
  path text primary key,
  title text,
  category text,
  premium_required boolean not null default false,
  enforcement text not null default 'client_guard',
  source text not null default 'developer_panel',
  notes text,
  updated_by text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint developer_premium_route_rules_path_check check (
    path = lower(path)
    and path not like '/%'
    and path not like '%..%'
    and path like '%.html'
  ),
  constraint developer_premium_route_rules_enforcement_check check (
    enforcement in ('protected_content','client_guard','catalog_only')
  )
);

alter table public.developer_premium_route_rules enable row level security;
revoke all on public.developer_premium_route_rules from anon, authenticated;
grant all on public.developer_premium_route_rules to service_role;

create index if not exists developer_premium_route_rules_required_idx
  on public.developer_premium_route_rules(premium_required);

insert into public.developer_premium_route_rules(path,title,category,premium_required,enforcement,source,notes)
select
  lower(path),
  lower(path),
  'Catálogo Premium vigente',
  true,
  'protected_content',
  'premium_content_pages',
  'Seed automático a partir do catálogo privado existente.'
from public.premium_content_pages
where path like '%.html'
on conflict (path) do nothing;

create table if not exists public.developer_premium_email_grants (
  email text primary key,
  active boolean not null default true,
  reason text,
  created_by text,
  revoked_by text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  revoked_at timestamp with time zone,
  constraint developer_premium_email_grants_email_check check (
    email = lower(email)
    and email ~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$'
  )
);

alter table public.developer_premium_email_grants enable row level security;
revoke all on public.developer_premium_email_grants from anon, authenticated;
grant all on public.developer_premium_email_grants to service_role;

create index if not exists developer_premium_email_grants_active_idx
  on public.developer_premium_email_grants(active);

create table if not exists public.developer_admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_email text not null,
  action text not null,
  target_type text not null,
  target_key text not null,
  before_state jsonb,
  after_state jsonb,
  created_at timestamp with time zone not null default now()
);

alter table public.developer_admin_audit_log enable row level security;
revoke all on public.developer_admin_audit_log from anon, authenticated;
grant all on public.developer_admin_audit_log to service_role;

create index if not exists developer_admin_audit_log_target_idx
  on public.developer_admin_audit_log(target_type,target_key,created_at desc);

comment on table public.developer_settings is
  'Admin-only runtime switches for the existing Premium/account system. Accessed only through service-role Edge Functions.';
comment on table public.developer_premium_route_rules is
  'Admin-only route catalog for Premium/free toggles. protected_content is strong enforcement; client_guard is browser-level enforcement for static public pages.';
comment on table public.developer_premium_email_grants is
  'Admin-only manual Premium exceptions by normalized email. Does not replace paid subscription entitlements.';
comment on table public.developer_admin_audit_log is
  'Admin-only audit trail for developer panel actions.';
