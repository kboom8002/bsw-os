-- Migration 0024: Concept Fidelity Aggregates
-- Created at 2026-05-28

-- 1. concept_fidelity_snapshots: 관측 실행 단위 복합 지표 스냅샷
CREATE TABLE concept_fidelity_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  ai_observation_run_id UUID REFERENCES ai_observation_runs(id) ON DELETE CASCADE NOT NULL,
  condition VARCHAR(50) DEFAULT 'baseline' NOT NULL, -- baseline | intervention
  concept_transfer_rate NUMERIC(5,4),
  citation_backed_rate NUMERIC(5,4),
  brand_concept_fidelity NUMERIC(5,4),
  concept_distortion_rate NUMERIC(5,4),
  missing_concept_gap_count INTEGER DEFAULT 0,
  hallucinated_concept_rate NUMERIC(5,4),
  attractor_stability NUMERIC(5,4),
  drift_score NUMERIC(5,4),
  floor_risk NUMERIC(5,4),
  policy_alignment NUMERIC(5,4),
  consensus_score NUMERIC(5,4),
  variance_score NUMERIC(5,4),
  aeo_geo_readiness NUMERIC(5,4),
  grade CHAR(1) CHECK (grade IN ('A','B','C','D','F')),
  qbs_size INTEGER,
  runs_total INTEGER,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. missing_concept_gaps: M5 상세 기록
CREATE TABLE missing_concept_gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  snapshot_id UUID REFERENCES concept_fidelity_snapshots(id) ON DELETE CASCADE,
  concept_id TEXT NOT NULL,
  concept_label TEXT NOT NULL,
  recall_rate NUMERIC(5,4) NOT NULL,
  threshold NUMERIC(5,4) NOT NULL,
  importance VARCHAR(20) NOT NULL, -- critical | important | optional
  gap_severity VARCHAR(20) NOT NULL, -- critical_gap | moderate_gap | minor_gap
  suggested_action TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. experiment_runs: Baseline vs Intervention 실험 관리
CREATE TABLE experiment_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  experiment_name VARCHAR(255) NOT NULL,
  baseline_run_id UUID REFERENCES ai_observation_runs(id),
  intervention_run_id UUID REFERENCES ai_observation_runs(id),
  intervention_type VARCHAR(100), -- ssot_only | ssot_plus_cards | ssot_cards_policies
  status VARCHAR(50) DEFAULT 'draft', -- draft | running | completed | failed
  comparison_results JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- RLS + Indexes
ALTER TABLE concept_fidelity_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE missing_concept_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiment_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY cfs_rls ON concept_fidelity_snapshots
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY mcg_rls ON missing_concept_gaps
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY er_rls ON experiment_runs
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

CREATE INDEX idx_cfs_obs_run ON concept_fidelity_snapshots(ai_observation_run_id);
CREATE INDEX idx_cfs_condition ON concept_fidelity_snapshots(condition);
CREATE INDEX idx_mcg_snapshot ON missing_concept_gaps(snapshot_id);
CREATE INDEX idx_er_workspace ON experiment_runs(workspace_id);
