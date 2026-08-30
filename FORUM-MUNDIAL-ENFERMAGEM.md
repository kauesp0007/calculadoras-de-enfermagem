# Fórum Mundial de Enfermagem — Documentação Técnica

> Documento técnico da reformulação do `forum-enfermagem.html` em **Comunidade Mundial de Enfermagem**.
> Este arquivo descreve a arquitetura, o banco, as políticas de segurança (RLS), o Storage, a
> Edge Function de tradução e as pendências que dependem de configuração externa no Supabase.

---

## 1. Arquitetura

```
forum-enfermagem.html
  └─ JavaScript (cliente)
       ├─ Supabase (projeto: asjkftjfbkuuhilnqonx.supabase.co)
       │    ├─ Auth (Supabase Auth — a configurar)
       │    ├─ tabelas: posts, profiles, reports, translations, blocks, moderation_actions
       │    └─ Storage: avatars, forum-media
       ├─ Supabase Edge Function: translate-forum-message
       │    └─ Google Translation (principal) + DeepSeek (fallback)
       └─ interface (feed 3 colunas, compositor, tradução, denúncia)
```

**Regra fundamental:** UM único fórum mundial. Não existem 18 bancos nem 18 comunidades.
A mensagem original é gravada uma única vez; a tradução é uma camada derivada (cache).

---

## 2. Segurança (o que mudou no frontend)

- ❌ Removido o "modo admin" por URL (`?admin=1`) e por `localStorage`/`sessionStorage`.
- ❌ Removida a autorização de "dono da mensagem" baseada em `my_posts` do localStorage.
- ✅ O navegador **não decide** mais quem é administrador nem quem é dono.
- ✅ Autorização real passa a depender de **Supabase Auth + RLS + claims** (abaixo).

> Edição/exclusão pelo usuário comum e ações de moderação só funcionam após a configuração
> do backend descrita neste documento. Até lá, a página permite **leitura pública** e
> **publicação**, sem expor qualquer controle de autoridade falsa.

---

## 3. Modelo de dados sugerido

### 3.1 `posts` (tabela existente — evolução)

Campos novos a adicionar via migração (sem apagar os atuais):

```sql
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS original_language text,
  ADD COLUMN IF NOT EXISTS country_code text,
  ADD COLUMN IF NOT EXISTS country_name text,
  ADD COLUMN IF NOT EXISTS profession text,
  ADD COLUMN IF NOT EXISTS specialty text,
  ADD COLUMN IF NOT EXISTS workplace text,
  ADD COLUMN IF NOT EXISTS author_id uuid,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid,
  ADD COLUMN IF NOT EXISTS deletion_reason text;
```

> `parent_id` e `thread_id` já existem/são usados para a árvore de respostas.

### 3.2 `profiles`

```sql
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  country_code text,
  country_name text,
  profession text,
  specialty text,
  workplace text,
  bio text,
  language text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

### 3.3 `reports` (denúncias)

```sql
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  reporter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reason text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### 3.4 `translations` (cache de tradução)

```sql
CREATE TABLE IF NOT EXISTS public.translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL,
  source_language text,
  target_language text,
  source_hash text NOT NULL,
  translated_text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS translations_unique
  ON public.translations (message_id, source_hash, target_language);
```

### 3.5 `blocks` e `moderation_actions`

```sql
CREATE TABLE IF NOT EXISTS public.blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.moderation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid,
  moderator_id uuid,
  action text,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

---

## 4. RLS (Row Level Security)

**NUNCA** usar regra global permissiva (`allow read, write: if true`). Exemplo de políticas:

```sql
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Leitura pública de posts publicados
CREATE POLICY "posts_public_read" ON public.posts
  FOR SELECT USING (status = 'published' AND deleted_at IS NULL);

-- Criação: apenas usuário autenticado (ou anônimo, conforme decisão do produto)
CREATE POLICY "posts_insert_auth" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Atualização: apenas o proprietário
CREATE POLICY "posts_update_owner" ON public.posts
  FOR UPDATE USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);

-- Exclusão (soft delete preferencial): apenas o proprietário
CREATE POLICY "posts_delete_owner" ON public.posts
  FOR DELETE USING (auth.uid() = author_id);

-- Moderação: usuários com papel admin/moderator
-- (papel via auth.jwt() -> app_metadata.role; NUNCA via user_metadata)
CREATE POLICY "posts_moderate" ON public.posts
  FOR UPDATE USING (auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin','moderator'))
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin','moderator'));

-- Denúncias: inserção por autenticado, leitura por moderadores
CREATE POLICY "reports_insert_auth" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "reports_read_mod" ON public.reports
  FOR SELECT USING (auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin','moderator'));
```

> Papel (`user`, `moderator`, `admin`) deve ficar em `auth.users.raw_app_meta_data`
> (claims seguros), e **nunca** em `user_metadata`.

---

## 5. Storage (uploads)

Buckets sugeridos: `avatars` e `forum-media` (estrutura `user/{uid}/posts|replies`).
O bucket atual `forum-imagens-enfermagem` é mantido para compatibilidade.

```sql
insert into storage.buckets (id, name, public) values ('forum-media','forum-media', true);

CREATE POLICY "forum_media_insert_auth" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'forum-media' AND auth.role() = 'authenticated');

CREATE POLICY "forum_media_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'forum-media');
```

Validação exigida (backend/Edge Function): MIME (JPEG/PNG/WEBP), tamanho máximo,
extensão real, conteúdo e dimensões. **Não** confiar apenas em `accept="image/*"`.

---

## 6. Edge Function de tradução (a configurar)

Caminho: `supabase/functions/translate-forum-message/`

```ts
// supabase/functions/translate-forum-message/index.ts
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GOOGLE_KEY = Deno.env.get("GOOGLE_TRANSLATION_API_KEY");
const DEEPSEEK_KEY = Deno.env.get("DEEPSEEK_API_KEY"); // fallback
serve(async (req) => {
  try {
    const { message_id, target_language } = await req.json();
    if (!Number.isSafeInteger(message_id) || message_id <= 0) {
      return new Response(JSON.stringify({ error: "invalid_message_id" }), { status: 400 });
    }

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // O texto deve ser lido no servidor a partir de posts.id. Não aceite texto
    // arbitrário enviado pelo navegador: isso evita abuso e cache poisoning.
    const { data: post } = await sb.from("posts")
      .select("conteudo, original_language").eq("id", message_id).maybeSingle();
    const text = post?.conteudo;
    if (!text) return new Response(JSON.stringify({ error: "message_not_found" }), { status: 404 });
    const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text))
      .then(b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join(""));

    // cache primeiro
    const { data: cached } = await sb.from("translations")
      .select("translated_text")
      .eq("message_id", message_id).eq("source_hash", hash).eq("target_language", target_language)
      .maybeSingle();
    if (cached?.translated_text) return new Response(JSON.stringify({ translated_text: cached.translated_text }), { status: 200 });

    const g = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${DEEPSEEK_KEY}` },
      body: JSON.stringify({ model: "deepseek-chat", temperature: 0.1,
        messages: [{ role: "system", content: `Translate only to ${target_language}. Return only the translation.` },
          { role: "user", content: text }] })
    });
    const data = await g.json();
    const translated_text = data?.choices?.[0]?.message?.content?.trim();
    if (!translated_text) throw new Error("no translation");

    await sb.from("translations").upsert(
      { message_id, source_language: "auto", target_language, source_hash: hash, translated_text, updated_at: new Date().toISOString() },
      { onConflict: "message_id,source_hash,target_language" }
    );
    return new Response(JSON.stringify({ translated_text }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: "unavailable" }), { status: 500 });
  }
});
```

**Segredos (nunca no frontend, nunca no Git):**
- `GOOGLE_TRANSLATION_API_KEY` (Google Translation, provedor principal)
- `DEEPSEEK_API_KEY` (DeepSeek, fallback)
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

---

## 7. Glossário (não traduzir cegamente)

Preservar/adaptar: NANDA, NIC, NOC, SAE, Processo de Enfermagem, COFEN, COREN, SUS,
PICC, SBAR, UTI, CME, etc.

---

## 8. Pendências que dependem de configuração externa

| Item | Estado | Responsável |
|---|---|---|
| Supabase Auth (login real) | ⏳ Requer configuração no painel | Desenvolvedor |
| Migração das colunas/tabelas (seção 3) | ⏳ Requer execução do SQL | Desenvolvedor |
| Políticas RLS (seção 4) | ⏳ Requer execução no painel | Desenvolvedor |
| Buckets `avatars`/`forum-media` + políticas | ⏳ Requer configuração | Desenvolvedor |
| Edge Function `translate-forum-message` | ⏳ Requer deploy + segredos | Desenvolvedor |
| Google Translation + fallback DeepSeek | ⏳ Requer deploy + secrets | Desenvolvedor |
| Discussões com URL própria (`/forum/thread/ID`) | 🔭 Futuro | Desenvolvedor |

> O frontend **não finge** que esses recursos estão ativos: tradução/denúncia exibem
> mensagem discreta de indisponibilidade quando o backend ainda não está configurado.
