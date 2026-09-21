CREATE TABLE IF NOT EXISTS public.cofen_legislacao (
  id text PRIMARY KEY,
  doc_type text,
  number text,
  year integer,
  pub_date date,
  title text,
  subtitle text,
  summary text,
  url text,
  body_html text,
  body_text text,
  pdf_links jsonb DEFAULT '[]'::jsonb,
  source jsonb,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cofen_legislacao_type_idx ON public.cofen_legislacao (doc_type);
CREATE INDEX IF NOT EXISTS cofen_legislacao_year_idx ON public.cofen_legislacao (year);
CREATE INDEX IF NOT EXISTS cofen_legislacao_title_idx ON public.cofen_legislacao USING gin (to_tsvector('portuguese', coalesce(title,'') || ' ' || coalesce(summary,'')));

ALTER TABLE public.cofen_legislacao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cofen_legislacao_select_public ON public.cofen_legislacao;
CREATE POLICY cofen_legislacao_select_public
  ON public.cofen_legislacao
  FOR SELECT
  TO anon, authenticated
  USING (true);

