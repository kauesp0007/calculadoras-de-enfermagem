alter table public.page_comments
  add column if not exists is_anonymous boolean not null default false,
  add column if not exists rating smallint;

do $$
begin
  if not exists (select 1 from pg_constraint where conname='page_comments_comment_length_chk') then
    alter table public.page_comments
      add constraint page_comments_comment_length_chk
      check (length(btrim(comment)) between 1 and 200);
  end if;
  if not exists (select 1 from pg_constraint where conname='page_comments_name_length_chk') then
    alter table public.page_comments
      add constraint page_comments_name_length_chk
      check (name is null or length(name) <= 80);
  end if;
  if not exists (select 1 from pg_constraint where conname='page_comments_path_length_chk') then
    alter table public.page_comments
      add constraint page_comments_path_length_chk
      check (length(page_path) between 2 and 255);
  end if;
  if not exists (select 1 from pg_constraint where conname='page_comments_rating_chk') then
    alter table public.page_comments
      add constraint page_comments_rating_chk
      check (rating is null or rating between 1 and 4);
  end if;
end $$;

create index if not exists page_comments_page_lang_created_idx
  on public.page_comments(page_path, lang, created_at desc)
  where is_approved = true;

create table if not exists public.page_comment_contacts (
  comment_id uuid primary key references public.page_comments(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  constraint page_comment_contacts_email_length_chk check (length(email) between 3 and 254),
  constraint page_comment_contacts_email_format_chk check (email ~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$')
);

alter table public.page_comment_contacts enable row level security;
revoke all on table public.page_comment_contacts from anon, authenticated;
grant select, insert, update, delete on table public.page_comment_contacts to service_role;

comment on table public.page_comment_contacts is
  'Private optional email addresses submitted with public page comments. Service-role only; never returned by the public comments API.';
comment on column public.page_comments.rating is
  'Optional 1-4 page rating: 1=pessimo, 2=ruim, 3=bom, 4=otimo.';
comment on column public.page_comments.is_anonymous is
  'True when the visitor explicitly publishes without name or email.';
