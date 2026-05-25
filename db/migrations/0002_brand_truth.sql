-- Migration 0002_brand_truth.sql
-- Module: Brand Truth MVP

-- 1. brand_strategic_truths
CREATE TABLE brand_strategic_truths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  statement TEXT NOT NULL,
  vision TEXT,
  core_pillars TEXT[] DEFAULT '{}'::text[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. brand_operational_truths
CREATE TABLE brand_operational_truths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  claim TEXT NOT NULL,
  description TEXT,
  risk_level VARCHAR(50) DEFAULT 'medium' NOT NULL, -- low, medium, high, critical
  confidence_score DECIMAL(5,2) DEFAULT 0.00 NOT NULL,
  review_status VARCHAR(50) DEFAULT 'draft' NOT NULL, -- draft, in_review, approved, rejected
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. brand_observed_truths
CREATE TABLE brand_observed_truths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  observed_claim TEXT NOT NULL,
  source_domain VARCHAR(255) NOT NULL,
  observed_at TIMESTAMPTZ DEFAULT now(),
  confidence_score DECIMAL(5,2),
  is_aligned_with_operational BOOLEAN DEFAULT TRUE,
  raw_payload JSONB DEFAULT '{}'::jsonb NOT NULL
);

-- 4. evidence_items
CREATE TABLE evidence_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  url VARCHAR(1024),
  evidence_type VARCHAR(100) DEFAULT 'clinical_trial' NOT NULL, -- clinical_trial, lab_report, certificate, manual_verify
  is_verified BOOLEAN DEFAULT FALSE NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. boundary_rules
CREATE TABLE boundary_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  rule_name VARCHAR(255) NOT NULL,
  forbidden_terms TEXT[] DEFAULT '{}'::text[] NOT NULL,
  required_disclosures TEXT[] DEFAULT '{}'::text[] NOT NULL,
  risk_level VARCHAR(50) DEFAULT 'medium' NOT NULL, -- low, medium, high, critical
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. brand_operational_truth_evidence (Join Table)
CREATE TABLE brand_operational_truth_evidence (
  operational_truth_id UUID REFERENCES brand_operational_truths(id) ON DELETE CASCADE NOT NULL,
  evidence_item_id UUID REFERENCES evidence_items(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (operational_truth_id, evidence_item_id)
);

-- 7. brand_operational_truth_boundaries (Join Table)
CREATE TABLE brand_operational_truth_boundaries (
  operational_truth_id UUID REFERENCES brand_operational_truths(id) ON DELETE CASCADE NOT NULL,
  boundary_rule_id UUID REFERENCES boundary_rules(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (operational_truth_id, boundary_rule_id)
);

-- 8. truth_delta_snapshots
CREATE TABLE truth_delta_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  source_observed_truth_id UUID REFERENCES brand_observed_truths(id) ON DELETE CASCADE NOT NULL,
  target_operational_truth_id UUID REFERENCES brand_operational_truths(id) ON DELETE SET NULL,
  delta_summary TEXT NOT NULL,
  severity VARCHAR(50) DEFAULT 'low' NOT NULL, -- low, medium, high
  is_resolved BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. truth_lock_evaluations
CREATE TABLE truth_lock_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  gate_level VARCHAR(50) DEFAULT 'L0' NOT NULL, -- L0, L1, L2, L3, L4
  is_passed BOOLEAN DEFAULT FALSE NOT NULL,
  blocking_reasons TEXT[] DEFAULT '{}'::text[] NOT NULL,
  warnings TEXT[] DEFAULT '{}'::text[] NOT NULL,
  evaluated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE brand_strategic_truths ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_operational_truths ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_observed_truths ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE boundary_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_operational_truth_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_operational_truth_boundaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE truth_delta_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE truth_lock_evaluations ENABLE ROW LEVEL SECURITY;

-- Establish RLS Policies (re-using helper functions defined in 0001_core.sql)
-- brand_strategic_truths Policies
CREATE POLICY strategic_read_policy ON brand_strategic_truths
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY strategic_mutation_policy ON brand_strategic_truths
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']));

-- brand_operational_truths Policies
CREATE POLICY operational_read_policy ON brand_operational_truths
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY operational_mutation_policy ON brand_operational_truths
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist', 'content_editor']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist', 'content_editor']));

-- brand_observed_truths Policies (Strategists, analysts, and system agents can mutate)
CREATE POLICY observed_read_policy ON brand_observed_truths
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY observed_mutation_policy ON brand_observed_truths
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

-- evidence_items Policies
CREATE POLICY evidence_read_policy ON evidence_items
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY evidence_mutation_policy ON evidence_items
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist', 'evidence_reviewer', 'content_editor']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist', 'evidence_reviewer', 'content_editor']));

-- boundary_rules Policies
CREATE POLICY boundary_read_policy ON boundary_rules
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY boundary_mutation_policy ON boundary_rules
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist', 'semantic_architect']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist', 'semantic_architect']));

-- Join table RLS policies
CREATE POLICY opt_evidence_read ON brand_operational_truth_evidence
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM brand_operational_truths
      WHERE id = operational_truth_id AND is_workspace_member(workspace_id)
    )
  );

CREATE POLICY opt_evidence_all ON brand_operational_truth_evidence
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM brand_operational_truths
      WHERE id = operational_truth_id AND has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist', 'content_editor'])
    )
  );

CREATE POLICY opt_boundaries_read ON brand_operational_truth_boundaries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM brand_operational_truths
      WHERE id = operational_truth_id AND is_workspace_member(workspace_id)
    )
  );

CREATE POLICY opt_boundaries_all ON brand_operational_truth_boundaries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM brand_operational_truths
      WHERE id = operational_truth_id AND has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist', 'content_editor'])
    )
  );

-- truth_delta_snapshots Policies
CREATE POLICY delta_read_policy ON truth_delta_snapshots
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY delta_mutation_policy ON truth_delta_snapshots
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist', 'observatory_analyst']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist', 'observatory_analyst']));

-- truth_lock_evaluations Policies
CREATE POLICY lock_read_policy ON truth_lock_evaluations
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY lock_mutation_policy ON truth_lock_evaluations
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

-- Relational indexes for performance and traceability traversal
CREATE INDEX idx_strat_truth_workspace ON brand_strategic_truths(workspace_id);
CREATE INDEX idx_oper_truth_workspace ON brand_operational_truths(workspace_id);
CREATE INDEX idx_obse_truth_workspace ON brand_observed_truths(workspace_id);
CREATE INDEX idx_evidence_workspace ON evidence_items(workspace_id);
CREATE INDEX idx_boundary_workspace ON boundary_rules(workspace_id);
CREATE INDEX idx_deltas_workspace ON truth_delta_snapshots(workspace_id);
CREATE INDEX idx_locks_workspace ON truth_lock_evaluations(workspace_id);
