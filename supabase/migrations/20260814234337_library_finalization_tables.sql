-- Library finalization via DeepSeek+Supabase (HOLD / TEST_ONLY candidates)
CREATE TABLE IF NOT EXISTS public.library_finalization_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id text NOT NULL UNIQUE,
  schema_version text NOT NULL DEFAULT '1.0.0',
  domain text NOT NULL,
  source_packages jsonb NOT NULL DEFAULT '[]'::jsonb,
  query jsonb NOT NULL DEFAULT '{}'::jsonb,
  tools_used jsonb NOT NULL DEFAULT '[]'::jsonb,
  quality_summary jsonb,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'completed'
    CHECK (status IN ('pending','running','completed','failed','hold')),
  publication_status text NOT NULL DEFAULT 'hold'
    CHECK (publication_status IN ('hold','test_only','candidate','blocked','published')),
  canonical_eligible boolean NOT NULL DEFAULT false,
  production_eligible boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.library_finalization_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_uuid uuid NOT NULL REFERENCES public.library_finalization_runs(id) ON DELETE CASCADE,
  candidate_id text NOT NULL,
  library_id text,
  object_kind text,
  title text,
  publication_status text NOT NULL DEFAULT 'hold'
    CHECK (publication_status IN ('hold','test_only','candidate','blocked','published')),
  canonical_eligible boolean NOT NULL DEFAULT false,
  evidence_kind text,
  rights_status text,
  clinical_review_status text,
  candidate jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (run_uuid, candidate_id)
);

CREATE INDEX IF NOT EXISTS library_finalization_runs_domain_idx
  ON public.library_finalization_runs (domain);
CREATE INDEX IF NOT EXISTS library_finalization_candidates_library_idx
  ON public.library_finalization_candidates (library_id);

ALTER TABLE public.library_finalization_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_finalization_candidates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS library_finalization_runs_select_completed ON public.library_finalization_runs;
CREATE POLICY library_finalization_runs_select_completed
  ON public.library_finalization_runs
  FOR SELECT
  TO anon, authenticated
  USING (status IN ('completed','hold') AND publication_status IN ('hold','test_only','candidate','blocked'));

DROP POLICY IF EXISTS library_finalization_candidates_select_via_run ON public.library_finalization_candidates;
CREATE POLICY library_finalization_candidates_select_via_run
  ON public.library_finalization_candidates
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.library_finalization_runs r
      WHERE r.id = run_uuid
        AND r.status IN ('completed','hold')
    )
  );

COMMENT ON TABLE public.library_finalization_runs IS
  'DeepSeek library finalization runs. Default fail-closed: not production-eligible.';
COMMENT ON TABLE public.library_finalization_candidates IS
  'Proposed library objects/evidence mappings. Never auto-promoted to canonical public datasets.';

