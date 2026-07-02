-- supabase/migrations/0023_pipeline_orchestration.sql

CREATE TABLE IF NOT EXISTS public.pipeline_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  pipeline_type VARCHAR(50) NOT NULL, -- 'benchmark', 'golden_reference', 'site_audit', 'deep_dive', 'e2e_qis', 'tco_bootstrap', 'ontology_bootstrap'
  domain_key VARCHAR(100),
  brand_slug VARCHAR(100),
  status VARCHAR(30) DEFAULT 'running' NOT NULL, -- 'running', 'completed', 'failed', 'cancelled'
  phase_detail JSONB DEFAULT '{}'::JSONB, -- { current_phase: 'Phase 2', phases_completed: ['Phase 0', 'Phase 1'], progress_pct: 45 }
  result_summary JSONB DEFAULT '{}'::JSONB, -- { signals_collected: 42, cqs_promoted: 8, ... }
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER
);

ALTER TABLE public.pipeline_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow workspace members to read pipeline runs" ON public.pipeline_runs
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY "Allow workspace members to write pipeline runs" ON public.pipeline_runs
  FOR ALL USING (is_workspace_member(workspace_id));
