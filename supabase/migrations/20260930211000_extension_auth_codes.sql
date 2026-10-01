-- One-time authorization codes used only to bridge an authenticated website
-- session into the Chrome extension without exposing the Firebase ID token.
create table if not exists public.extension_auth_codes (
  code_hash text primary key,
  firebase_uid text not null,
  email text,
  extension_id text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint extension_auth_codes_extension_id_format
    check (extension_id ~ '^[a-p]{32}$')
);

comment on table public.extension_auth_codes is
  'Short-lived, single-use codes for Chrome extension entitlement checks. No clinical data is stored.';

alter table public.extension_auth_codes enable row level security;

create index if not exists extension_auth_codes_expires_at_idx
  on public.extension_auth_codes (expires_at);
