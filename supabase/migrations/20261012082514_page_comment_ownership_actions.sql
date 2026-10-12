-- Only the Edge Function may manage comments. Authenticated ownership is
-- tied to a Firebase UID; anonymous ownership uses a 256-bit bearer secret.
alter table public.page_comments
  add column if not exists edited_at timestamptz;

create table if not exists public.page_comment_ownership (
  comment_id uuid primary key references public.page_comments(id) on delete cascade,
  firebase_uid text,
  token_hash text,
  created_at timestamptz not null default now(),
  constraint page_comment_ownership_exactly_one_chk
    check ((firebase_uid is not null) <> (token_hash is not null)),
  constraint page_comment_ownership_uid_length_chk
    check (firebase_uid is null or length(firebase_uid) between 1 and 128),
  constraint page_comment_ownership_hash_format_chk
    check (token_hash is null or token_hash ~ '^[0-9a-f]{64}$')
);

create index if not exists page_comment_ownership_firebase_uid_idx
  on public.page_comment_ownership(firebase_uid, comment_id)
  where firebase_uid is not null;

alter table public.page_comment_ownership enable row level security;
revoke all on table public.page_comment_ownership from anon, authenticated;
grant select, insert, update, delete on table public.page_comment_ownership to service_role;

-- Prevent direct Data API writes that would bypass the ownership proof.
revoke insert, update, delete on table public.page_comments from anon, authenticated;
drop policy if exists "insert comments" on public.page_comments;

comment on table public.page_comment_ownership is
  'Private edit/delete proof for public page comments; Firebase UID or SHA-256 hash of an anonymous browser token. Service-role only.';
comment on column public.page_comments.edited_at is
  'Time of the last authorized text edit.';
