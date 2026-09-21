create table if not exists public.premium_content_pages (
  path text primary key,
  content text not null,
  source_sha text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.premium_content_pages enable row level security;

revoke all on table public.premium_content_pages from anon, authenticated;

grant usage on schema public to service_role;

grant select on table public.premium_content_pages to service_role;

create or replace function public.premium_content_pages_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at=now();
  return new;
end;
$$;

drop trigger if exists premium_content_pages_touch on public.premium_content_pages;

create trigger premium_content_pages_touch
before update on public.premium_content_pages
for each row execute function public.premium_content_pages_touch_updated_at();
