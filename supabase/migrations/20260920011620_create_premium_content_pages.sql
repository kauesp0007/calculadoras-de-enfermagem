create table if not exists public.premium_content_pages (
    path text primary key,
    content text not null,
    source_sha text not null,
    updated_at timestamptz not null default now()
  );
  alter table public.premium_content_pages enable row level security;
  revoke all on public.premium_content_pages from anon, authenticated;
  revoke all on public.premium_content_pages from public;
