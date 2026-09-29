alter table public.developer_premium_route_rules
  add constraint developer_premium_requires_private_enforcement
  check (not premium_required or enforcement = 'protected_content');

create table public.developer_premium_activation_requests (
  path text primary key,
  request_id uuid not null default gen_random_uuid(),
  status text not null default 'pending' check (status in ('pending', 'completed', 'cancelled')),
  title text not null,
  category text not null,
  requested_by text not null,
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint developer_premium_activation_path_check check (
    path = lower(path) and path not like '/%' and path not like '%..%' and path like '%.html'
  )
);

alter table public.developer_premium_activation_requests enable row level security;
revoke all on public.developer_premium_activation_requests from anon, authenticated;
grant all on public.developer_premium_activation_requests to service_role;
create index developer_premium_activation_status_idx
  on public.developer_premium_activation_requests(status);

create function public.activate_developer_premium_route(p_path text, p_request_id uuid)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  pending public.developer_premium_activation_requests%rowtype;
  previous public.developer_premium_route_rules%rowtype;
  activated public.developer_premium_route_rules%rowtype;
begin
  select * into pending from public.developer_premium_activation_requests
    where path = p_path and request_id = p_request_id and status = 'pending' for update;
  if not found then return false; end if;
  if not exists (select 1 from public.premium_content_pages where path = p_path) then
    raise exception 'private_content_missing: %', p_path;
  end if;

  select * into previous from public.developer_premium_route_rules where path = p_path;
  insert into public.developer_premium_route_rules
    (path,title,category,premium_required,enforcement,source,notes,updated_by,updated_at)
  values
    (p_path,pending.title,pending.category,true,'protected_content','premium_content_pages',
     'Conteúdo privado e shell público publicados.',pending.requested_by,now())
  on conflict (path) do update set
    title = excluded.title, category = excluded.category, premium_required = true,
    enforcement = 'protected_content', source = 'premium_content_pages',
    notes = excluded.notes, updated_by = excluded.updated_by, updated_at = excluded.updated_at
  returning * into activated;

  update public.developer_premium_activation_requests
    set status = 'completed', completed_at = now() where path = p_path;
  insert into public.developer_admin_audit_log
    (actor_email,action,target_type,target_key,before_state,after_state)
  values
    (pending.requested_by,'activate_route_after_deploy','route',p_path,
     to_jsonb(previous),to_jsonb(activated));
  return true;
end;
$$;

revoke all on function public.activate_developer_premium_route(text,uuid) from public, anon, authenticated;
grant execute on function public.activate_developer_premium_route(text,uuid) to service_role;

comment on table public.developer_premium_activation_requests is
  'Admin-only queue for pages that must enter the private catalog and be published as shells before Premium activation.';
comment on table public.developer_premium_route_rules is
  'Admin-only Premium route rules. A Premium rule is permitted only with private content enforcement.';
