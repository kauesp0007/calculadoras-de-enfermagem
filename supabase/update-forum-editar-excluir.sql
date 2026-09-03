-- =====================================================================
-- Fórum — Editar / Excluir publicações
-- Adiciona a coluna de autoria (author_key) e as políticas de
-- UPDATE e DELETE da tabela posts.
--
-- Como aplicar:
--   Supabase Dashboard -> SQL Editor -> New query -> colar e executar.
-- =====================================================================

-- Identifica o autor do comentário (token aleatório gerado no navegador).
alter table public.posts add column if not exists author_key text;

-- Permite atualizar (editar) publicações. Sem Auth hoje, é permissiva;
-- a restrição "só o autor ou o desenvolvedor" é feita no frontend (botões).
drop policy if exists "posts_public_update" on public.posts;
create policy "posts_public_update" on public.posts
  for update using (true) with check (true);

-- Permite excluir publicações.
drop policy if exists "posts_public_delete" on public.posts;
create policy "posts_public_delete" on public.posts
  for delete using (true);
