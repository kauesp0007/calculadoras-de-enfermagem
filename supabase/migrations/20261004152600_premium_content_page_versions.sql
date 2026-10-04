create schema if not exists private;

revoke all on schema private from public, anon, authenticated;

create table if not exists private.premium_content_page_versions (
  id bigint generated always as identity primary key,
  path text not null,
  source_sha text not null,
  content text not null,
  content_md5 text not null,
  reason text not null,
  created_at timestamptz not null default now(),
  restored_at timestamptz null,
  unique (path, source_sha, content_md5)
);

alter table private.premium_content_page_versions enable row level security;

revoke all on table private.premium_content_page_versions
  from public, anon, authenticated;

revoke all on sequence private.premium_content_page_versions_id_seq
  from public, anon, authenticated;

create index if not exists premium_content_page_versions_path_created_idx
  on private.premium_content_page_versions(path, created_at desc);
