-- Migration 0008_fixit_factory.sql
-- Module: Fix-It & Factory MVP

-- 1. rca_cases
CREATE TABLE rca_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  source_metric_snapshot_id UUID, -- Optional soft link to metrics
  metric_name VARCHAR(100) NOT NULL,
  metric_value NUMERIC(5,2) NOT NULL,
  cause_hypothesis TEXT NOT NULL, -- Structured cause hypothesis (mandatory)
  status VARCHAR(50) DEFAULT 'candidate' NOT NULL, -- candidate, approved, rejected
  justification_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. patch_tickets
CREATE TABLE patch_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  rca_case_id UUID REFERENCES rca_cases(id) ON DELETE CASCADE NOT NULL,
  patch_name VARCHAR(255) NOT NULL,
  patch_hypothesis TEXT NOT NULL, -- Patch hypothesis (mandatory)
  status VARCHAR(50) DEFAULT 'candidate' NOT NULL, -- candidate, approved, applied, completed, rejected
  approver_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. patch_artifact_changes
CREATE TABLE patch_artifact_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  patch_ticket_id UUID REFERENCES patch_tickets(id) ON DELETE CASCADE NOT NULL,
  target_artifact_type VARCHAR(100) NOT NULL, -- e.g. representation_object, surface_contract, semantic_page
  target_artifact_id UUID NOT NULL,
  original_payload JSONB,
  modified_payload JSONB,
  status VARCHAR(50) DEFAULT 'candidate' NOT NULL, -- candidate, applied, rolled_back
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. retest_plans
CREATE TABLE retest_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  patch_ticket_id UUID REFERENCES patch_tickets(id) ON DELETE CASCADE NOT NULL,
  probe_panel_id UUID NOT NULL,
  baseline_run_id UUID NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. retest_runs
CREATE TABLE retest_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  retest_plan_id UUID REFERENCES retest_plans(id) ON DELETE CASCADE NOT NULL,
  retest_observation_run_id UUID, -- Observation run executed post-patch
  status VARCHAR(50) DEFAULT 'pending' NOT NULL, -- pending, running, completed, failed
  retest_scores JSONB, -- The scores computed post-patch
  retest_verdict VARCHAR(50), -- pass, fail
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- 6. post_patch_lift_snapshots
CREATE TABLE post_patch_lift_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  retest_run_id UUID REFERENCES retest_runs(id) ON DELETE CASCADE NOT NULL,
  baseline_scores JSONB NOT NULL,
  retest_scores JSONB NOT NULL,
  lift_values JSONB NOT NULL,
  is_guardrail_regressed BOOLEAN DEFAULT FALSE NOT NULL,
  regression_details JSONB,
  final_verdict VARCHAR(50) NOT NULL, -- pass, fail
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. factory_reuse_candidates
CREATE TABLE factory_reuse_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  patch_ticket_id UUID REFERENCES patch_tickets(id) ON DELETE CASCADE NOT NULL,
  post_patch_lift_snapshot_id UUID REFERENCES post_patch_lift_snapshots(id) ON DELETE CASCADE NOT NULL,
  candidate_name VARCHAR(255) NOT NULL,
  artifact_type VARCHAR(100) NOT NULL, -- e.g. representation_object, surface_contract
  artifact_payload JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'candidate' NOT NULL, -- candidate, promoted, rejected
  promoted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. fixit_playbook_rules
CREATE TABLE fixit_playbook_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  rule_name VARCHAR(255) NOT NULL,
  trigger_metric VARCHAR(100) NOT NULL,
  threshold_operator VARCHAR(10) NOT NULL, -- <, <=
  threshold_value NUMERIC(5,2) NOT NULL,
  recommended_action TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row-Level Security
ALTER TABLE rca_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE patch_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE patch_artifact_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE retest_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE retest_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_patch_lift_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE factory_reuse_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixit_playbook_rules ENABLE ROW LEVEL SECURITY;

-- Establish RLS Policies
-- 1. rca_cases
CREATE POLICY rca_read ON rca_cases FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY rca_write ON rca_cases FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']));

-- 2. patch_tickets
CREATE POLICY patch_read ON patch_tickets FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY patch_write ON patch_tickets FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']));

-- 3. patch_artifact_changes
CREATE POLICY change_read ON patch_artifact_changes FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY change_write ON patch_artifact_changes FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']));

-- 4. retest_plans
CREATE POLICY rplan_read ON retest_plans FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY rplan_write ON retest_plans FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']));

-- 5. retest_runs
CREATE POLICY rrun_read ON retest_runs FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY rrun_write ON retest_runs FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']));

-- 6. post_patch_lift_snapshots
CREATE POLICY lift_read ON post_patch_lift_snapshots FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY lift_write ON post_patch_lift_snapshots FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']));

-- 7. factory_reuse_candidates
CREATE POLICY factory_read ON factory_reuse_candidates FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY factory_write ON factory_reuse_candidates FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']));

-- 8. fixit_playbook_rules
CREATE POLICY playbook_read ON fixit_playbook_rules FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY playbook_write ON fixit_playbook_rules FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']));

-- Relational indexes
CREATE INDEX idx_rca_workspace ON rca_cases(workspace_id);
CREATE INDEX idx_patch_rca ON patch_tickets(rca_case_id);
CREATE INDEX idx_change_patch ON patch_artifact_changes(patch_ticket_id);
CREATE INDEX idx_rplan_patch ON retest_plans(patch_ticket_id);
CREATE INDEX idx_rrun_plan ON retest_runs(retest_plan_id);
CREATE INDEX idx_lift_run ON post_patch_lift_snapshots(retest_run_id);
CREATE INDEX idx_factory_patch ON factory_reuse_candidates(patch_ticket_id);
CREATE INDEX idx_playbook_workspace ON fixit_playbook_rules(workspace_id);
