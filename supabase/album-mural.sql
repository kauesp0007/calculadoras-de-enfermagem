-- Atualização aditiva: nenhuma foto, descrição, comentário ou curtida legado é reescrito.
alter table public.album_fotos add column if not exists author_name text;
alter table public.album_fotos add column if not exists author_avatar text;
alter table public.album_fotos add column if not exists anonymous boolean not null default false;
create table if not exists public.album_photo_owners (
  photo_id integer primary key references public.album_fotos(id) on delete cascade,
  firebase_uid text not null,
  consent_at timestamptz not null default now(),
  consent_version text not null default 'album-lgpd-2026-09-30'
);
alter table public.album_photo_owners enable row level security;
revoke all on public.album_photo_owners from public, anon, authenticated;
grant all on public.album_photo_owners to service_role;
create index if not exists album_photo_owners_uid on public.album_photo_owners(firebase_uid);
-- UID e consentimento só são lidos pelo backend após verificar o Firebase token.
create or replace function public.album_publish_photo(p_uid text,p_photo jsonb)
returns jsonb language plpgsql security invoker set search_path = public, pg_temp as $$
declare new_photo public.album_fotos;
begin
  if p_uid is null or length(p_uid) < 1 then raise exception 'invalid_owner'; end if;
  insert into public.album_fotos(titulo,descricao,ano,instituicao,localizacao,imagem_url,anonymous,author_name,author_avatar)
  values(p_photo->>'titulo',p_photo->>'descricao',(p_photo->>'ano')::integer,p_photo->>'instituicao',
    p_photo->>'localizacao',p_photo->>'imagem_url',(p_photo->>'anonymous')::boolean,p_photo->>'author_name',p_photo->>'author_avatar')
  returning * into new_photo;
  insert into public.album_photo_owners(photo_id,firebase_uid) values(new_photo.id,p_uid);
  return to_jsonb(new_photo);
end $$;
revoke all on function public.album_publish_photo(text,jsonb) from public,anon,authenticated;
grant execute on function public.album_publish_photo(text,jsonb) to service_role;
-- Remove a antiga permissão UPDATE irrestrita. Escritas nas fotos agora passam pelo backend.
drop policy if exists "Allow update likes" on public.album_fotos;
drop policy if exists "Public Insert Access" on public.album_fotos;
drop policy if exists "album_fotos_public_insert" on public.album_fotos;
revoke insert,update,delete on public.album_fotos from anon,authenticated;
grant select on public.album_fotos to anon,authenticated;
