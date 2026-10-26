-- Adiciona escolha de avatar no fórum sem afetar posts antigos.
alter table public.posts add column if not exists avatar_id smallint;
comment on column public.posts.avatar_id is 'Avatar 1 a 5; NULL em mensagens antigas recebe avatar visual por ID.';
do $$
begin
  if not exists (select 1 from pg_constraint where conname='posts_avatar_id_range' and conrelid='public.posts'::regclass) then
    alter table public.posts add constraint posts_avatar_id_range check (avatar_id between 1 and 5);
  end if;
end $$;
