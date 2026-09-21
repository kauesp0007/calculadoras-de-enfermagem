-- Legislation ingestion storage for DeepSeek CKO pipeline
CREATE TABLE IF NOT EXISTS public.legislation_ingestion_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id text NOT NULL UNIQUE,
  schema_version text NOT NULL DEFAULT '1.0.0',
  verified_at timestamptz,
  query jsonb NOT NULL DEFAULT '{}'::jsonb,
  tools_used text[] DEFAULT '{}',
  quality_summary jsonb,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending','running','completed','failed')),
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.legislation_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_uuid uuid NOT NULL REFERENCES public.legislation_ingestion_runs(id) ON DELETE CASCADE,
  cko_id text NOT NULL,
  document_type text,
  number_display text,
  number_normalized text,
  year integer,
  legal_act_date date,
  title_official text,
  ementa text,
  jurisdiction text,
  legal_status jsonb,
  canonical_source_id text,
  document jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (run_uuid, cko_id)
);

CREATE INDEX IF NOT EXISTS legislation_documents_cko_id_idx ON public.legislation_documents (cko_id);
CREATE INDEX IF NOT EXISTS legislation_documents_year_idx ON public.legislation_documents (year);
CREATE INDEX IF NOT EXISTS legislation_runs_created_at_idx ON public.legislation_ingestion_runs (created_at DESC);

ALTER TABLE public.legislation_ingestion_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legislation_documents ENABLE ROW LEVEL SECURITY;

-- Public read for site consumption; writes only via service role / edge function
DROP POLICY IF EXISTS legislation_runs_select_public ON public.legislation_ingestion_runs;
CREATE POLICY legislation_runs_select_public
  ON public.legislation_ingestion_runs
  FOR SELECT
  TO anon, authenticated
  USING (status = 'completed');

DROP POLICY IF EXISTS legislation_documents_select_public ON public.legislation_documents;
CREATE POLICY legislation_documents_select_public
  ON public.legislation_documents
  FOR SELECT
  TO anon, authenticated
  USING (true);

