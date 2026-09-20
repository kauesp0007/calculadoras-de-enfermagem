create table if not exists public.account_profiles (
  firebase_uid text primary key,
  email text not null default '',
  display_name text not null default '',
  photo_url text not null default '',
  provider text not null default 'email',
  language text not null default 'pt',
  country text not null default 'BR',
  preferences jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  last_login_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.account_favorites (
  firebase_uid text not null,
  page_id text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(firebase_uid,page_id)
);
create table if not exists public.account_history (
  id uuid primary key default gen_random_uuid(),
  firebase_uid text not null,
  data jsonb not null default '{}'::jsonb,
  visited_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists account_history_uid_visited_idx on public.account_history(firebase_uid,visited_at desc);
alter table public.account_profiles enable row level security;
alter table public.account_favorites enable row level security;
alter table public.account_history enable row level security;
revoke all on public.account_profiles from anon,authenticated;
revoke all on public.account_favorites from anon,authenticated;
revoke all on public.account_history from anon,authenticated;
create or replace function public.account_profiles_touch_updated_at() returns trigger language plpgsql set search_path=public as $$ begin new.updated_at=now(); return new; end $$;
drop trigger if exists trg_account_profiles_updated_at on public.account_profiles;
create trigger trg_account_profiles_updated_at before update on public.account_profiles for each row execute function public.account_profiles_touch_updated_at();
create or replace function public.account_favorites_touch_updated_at() returns trigger language plpgsql set search_path=public as $$ begin new.updated_at=now(); return new; end $$;
drop trigger if exists trg_account_favorites_updated_at on public.account_favorites;
create trigger trg_account_favorites_updated_at before update on public.account_favorites for each row execute function public.account_favorites_touch_updated_at();