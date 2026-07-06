-- Migration: 0030_benchmark_measurement_runs.sql
-- Tracks named measurement run sessions for history browsing

CREATE TABLE IF NOT EXISTS benchmark_measurement_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  domain_slug text NOT NULL,
  run_label text,                          -- optional user-defined label
  measured_at timestamptz NOT NULL DEFAULT now(),
  brand_count int NOT NULL DEFAULT 0,
  question_count int NOT NULL DEFAULT 0,
  engine text NOT NULL DEFAULT 'gemini_grounding',
  status text NOT NULL DEFAULT 'completed', -- 'completed' | 'partial' | 'failed'
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast history queries per domain
CREATE INDEX IF NOT EXISTS idx_benchmark_runs_domain_at
  ON benchmark_measurement_runs (domain_slug, measured_at DESC);

CREATE INDEX IF NOT EXISTS idx_benchmark_runs_workspace_domain
  ON benchmark_measurement_runs (workspace_id, domain_slug, measured_at DESC);

-- RLS
ALTER TABLE benchmark_measurement_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workspace members can read benchmark runs" ON benchmark_measurement_runs;
CREATE POLICY "workspace members can read benchmark runs"
  ON benchmark_measurement_runs FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "workspace owners and admins can insert benchmark runs" ON benchmark_measurement_runs;
CREATE POLICY "workspace owners and admins can insert benchmark runs"
  ON benchmark_measurement_runs FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "workspace owners and admins can update benchmark runs" ON benchmark_measurement_runs;
CREATE POLICY "workspace owners and admins can update benchmark runs"
  ON benchmark_measurement_runs FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );
