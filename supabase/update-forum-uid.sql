-- =====================================================================
-- Fórum — Vincular autoria ao login (uid do Firebase)
-- Adiciona a coluna `uid` à tabela posts. O frontend salva o UID do
-- usuário logado (Firebase) ao criar post/resposta e usa esse valor
-- para exibir os botões Editar/Excluir ao autor, além do author_key
-- (token do navegador). Assim o autor logado mantém o controle do
-- próprio comentário mesmo trocando de navegador ou limpando o cache.
--
-- Idempotente: pode rodar quantas vezes quiser.
--
-- Como aplicar:
--   Supabase Dashboard -> SQL Editor -> New query -> colar e executar.
-- =====================================================================

-- UID do usuário logado (Firebase). Opcional (null quando anônimo).
alter table public.posts add column if not exists uid text;

-- Índice para buscas por uid (opcional, melhora performance).
create index if not exists posts_uid_idx on public.posts (uid);

-- =====================================================================
-- Nota sobre RLS: as políticas de edição/exclusão continuam usando
-- author_key (header x-author-key), já definidas no setup-forum.sql.
-- O fluxo SEGURO do autor logado passa pela Edge Function forum-author
-- (service_role), que valida o Firebase ID token e confere post.uid.
-- Por isso NÃO é preciso recriar as políticas RLS por uid aqui.
-- =====================================================================
