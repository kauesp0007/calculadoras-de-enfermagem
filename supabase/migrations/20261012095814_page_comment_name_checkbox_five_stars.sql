-- The comment form no longer collects contact email addresses. The private
-- contact table is empty at rollout; abort if any rows appear before removal.
do $$
begin
  if exists (select 1 from public.page_comment_contacts limit 1) then
    raise exception 'page_comment_contacts has rows; review before dropping';
  end if;
end $$;

drop table public.page_comment_contacts;

alter table public.page_comments
  drop constraint if exists page_comments_rating_chk;
alter table public.page_comments
  add constraint page_comments_rating_chk
  check (rating is null or rating between 1 and 5);

comment on column public.page_comments.rating is
  'Optional 1-5 site rating: 1=pessimo, 2=ruim, 3=bom, 4=otimo, 5=excelente.';
comment on column public.page_comments.is_anonymous is
  'True when the visitor explicitly publishes without a name.';
