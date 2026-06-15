-- BSW-OS Master Schema Bundle (Migrations 0001 - 0027)
-- Generated at 2026-06-03T11:44:21.528Z


-- =========================================================================
-- START: 0001_core.sql
-- =========================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. workspaces (tenant boundary)
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. workspace_memberships (RBAC / Membership)
CREATE TABLE workspace_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- 3. domains (K-Beauty, Wedding, Convenience Retail)
CREATE TABLE domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, slug)
);

-- 4. domain_packs
CREATE TABLE domain_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  config JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. brand_entities
CREATE TABLE brand_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  domain_id UUID REFERENCES domains(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, slug)
);

-- 6. source_snapshots
CREATE TABLE source_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  brand_entity_id UUID REFERENCES brand_entities(id) ON DELETE SET NULL,
  source_type VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. audit_events (audit trail for security events)
CREATE TABLE audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  action VARCHAR(255) NOT NULL,
  target_type VARCHAR(100) NOT NULL,
  target_id UUID NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. agent_runs (AI agent execution traceability)
CREATE TABLE agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  agent_name VARCHAR(255) NOT NULL,
  input_payload JSONB NOT NULL,
  output_payload JSONB,
  status VARCHAR(50) DEFAULT 'candidate' NOT NULL,
  error_summary TEXT,
  raw_output_ref VARCHAR(1024),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. action_policies (governable policy configurations)
CREATE TABLE action_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  role VARCHAR(100) NOT NULL,
  action VARCHAR(255) NOT NULL,
  is_allowed BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. release_gate_results (quality control evaluations)
CREATE TABLE release_gate_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  gate_type VARCHAR(100) NOT NULL,
  target_type VARCHAR(100) NOT NULL,
  target_id UUID NOT NULL,
  status VARCHAR(50) NOT NULL,
  blocking_reasons TEXT[] DEFAULT '{}'::text[] NOT NULL,
  warnings TEXT[] DEFAULT '{}'::text[] NOT NULL,
  required_fixes TEXT[] DEFAULT '{}'::text[] NOT NULL,
  evaluated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE release_gate_results ENABLE ROW LEVEL SECURITY;

-- Setup RLS Helper Functions
CREATE OR REPLACE FUNCTION is_workspace_member(target_workspace_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM workspace_memberships
    WHERE workspace_id = target_workspace_id 
      AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_workspace_role(target_workspace_id UUID, allowed_roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM workspace_memberships
    WHERE workspace_id = target_workspace_id 
      AND user_id = auth.uid() 
      AND role = ANY(allowed_roles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Establish RLS Policies
-- Workspaces Policy: a user can perform operations on a workspace if they are a member of it.
CREATE POLICY workspaces_member_policy ON workspaces
  FOR ALL USING (is_workspace_member(id));

-- Workspace Memberships Policy (Members can read, admins/owners can mutate)
CREATE POLICY memberships_read_policy ON workspace_memberships
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY memberships_mutation_policy ON workspace_memberships
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin']));

-- Domain Policies
CREATE POLICY domains_read_policy ON domains
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY domains_mutation_policy ON domains
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'semantic_architect']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'semantic_architect']));

-- Domain Packs Policies
CREATE POLICY packs_read_policy ON domain_packs
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY packs_mutation_policy ON domain_packs
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'semantic_architect']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'semantic_architect']));

-- Brand Entities Policies
CREATE POLICY brand_read_policy ON brand_entities
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY brand_mutation_policy ON brand_entities
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist', 'content_editor']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist', 'content_editor']));

-- Source Snapshots Policies
CREATE POLICY snapshot_read_policy ON source_snapshots
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY snapshot_mutation_policy ON source_snapshots
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist', 'content_editor']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist', 'content_editor']));

-- Audit Events Policies (Members can read/insert to preserve security trails, no updates/deletion allowed)
CREATE POLICY audit_read_policy ON audit_events
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY audit_insert_policy ON audit_events
  FOR INSERT WITH CHECK (is_workspace_member(workspace_id));

-- Agent Runs Policies
CREATE POLICY agent_read_policy ON agent_runs
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY agent_mutation_policy ON agent_runs
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

-- Action Policies Policies
CREATE POLICY action_policy_read ON action_policies
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY action_policy_mutation ON action_policies
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin']));

-- Release Gate Results Policies
CREATE POLICY gate_read_policy ON release_gate_results
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY gate_mutation_policy ON release_gate_results
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'evidence_reviewer']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'evidence_reviewer']));

-- Create indexes for tenant lookup performance and FK integrity
CREATE INDEX idx_memberships_user ON workspace_memberships(user_id);
CREATE INDEX idx_memberships_workspace ON workspace_memberships(workspace_id);
CREATE INDEX idx_domains_workspace ON domains(workspace_id);
CREATE INDEX idx_brand_entities_workspace ON brand_entities(workspace_id);
CREATE INDEX idx_source_snapshots_brand ON source_snapshots(brand_entity_id);
CREATE INDEX idx_agent_runs_workspace ON agent_runs(workspace_id);
CREATE INDEX idx_release_gate_target ON release_gate_results(target_type, target_id);


-- =========================================================================
-- END: 0001_core.sql
-- =========================================================================


-- =========================================================================
-- START: 0002_brand_truth.sql
-- =========================================================================

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


-- =========================================================================
-- END: 0002_brand_truth.sql
-- =========================================================================


-- =========================================================================
-- START: 0003_semantic_core.sql
-- =========================================================================

-- Migration 0003_semantic_core.sql
-- Module: Semantic Core MVP

-- 1. question_signals
CREATE TABLE question_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  query TEXT NOT NULL,
  volume INTEGER DEFAULT 0 NOT NULL,
  intent VARCHAR(100) DEFAULT 'informational' NOT NULL, -- informational, transactional, commercial, local
  status VARCHAR(50) DEFAULT 'mined' NOT NULL, -- mined, ignored, promoted
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. question_capital_nodes (Strategic Question Territory node)
CREATE TABLE question_capital_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  strategic_weight DECIMAL(5,2) DEFAULT 1.00 NOT NULL,
  parent_id UUID REFERENCES question_capital_nodes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, slug)
);

-- 3. canonical_questions (Stable normalized question identity)
CREATE TABLE canonical_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  question_capital_node_id UUID REFERENCES question_capital_nodes(id) ON DELETE SET NULL,
  normalized_question TEXT NOT NULL,
  slug VARCHAR(255) NOT NULL,
  signature VARCHAR(64) NOT NULL, -- unique hash representation (sha256/md5) for deduplication
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, slug),
  UNIQUE(workspace_id, signature)
);

-- 4. qis_scenes (Query-Intent-Scenario runtime scene)
CREATE TABLE qis_scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  canonical_question_id UUID REFERENCES canonical_questions(id) ON DELETE CASCADE NOT NULL,
  scene_name VARCHAR(255) NOT NULL,
  query_template TEXT NOT NULL,
  intent_model VARCHAR(100) NOT NULL,
  scenario_context TEXT NOT NULL,
  risk_level VARCHAR(50) DEFAULT 'medium' NOT NULL, -- low, medium, high, critical
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. tco_concepts (Operational concept dictionary entity, not a tag)
CREATE TABLE tco_concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  concept_name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  definition TEXT NOT NULL,
  is_strategic BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, slug)
);

-- 6. brand_ontology_nodes (Graphic KG representation)
CREATE TABLE brand_ontology_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  node_name VARCHAR(255) NOT NULL,
  node_type VARCHAR(100) DEFAULT 'concept' NOT NULL, -- concept, claim, evidence, boundary
  reference_id UUID, -- links dynamically to entities (tco_concepts.id, brand_operational_truths.id, etc.)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. brand_ontology_edges
CREATE TABLE brand_ontology_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  source_node_id UUID REFERENCES brand_ontology_nodes(id) ON DELETE CASCADE NOT NULL,
  target_node_id UUID REFERENCES brand_ontology_nodes(id) ON DELETE CASCADE NOT NULL,
  relation_type VARCHAR(100) DEFAULT 'associated_with' NOT NULL, -- defines_concept, validates_claim, outlines_boundary
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. concept_relations (relational connections between concepts)
CREATE TABLE concept_relations (
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  source_concept_id UUID REFERENCES tco_concepts(id) ON DELETE CASCADE NOT NULL,
  target_concept_id UUID REFERENCES tco_concepts(id) ON DELETE CASCADE NOT NULL,
  relation_name VARCHAR(100) NOT NULL, -- is_part_of, relies_on, triggers
  PRIMARY KEY (source_concept_id, target_concept_id, relation_name)
);

-- 9. concept_operators (logical conditions for concept matching)
CREATE TABLE concept_operators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  concept_id UUID REFERENCES tco_concepts(id) ON DELETE CASCADE NOT NULL,
  operator_name VARCHAR(100) NOT NULL, -- requires_evidence, suppress_comp, etc.
  logic_rules JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. claim_nodes
CREATE TABLE claim_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  operational_truth_id UUID REFERENCES brand_operational_truths(id) ON DELETE CASCADE NOT NULL,
  claim_summary TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. lineage_records (Claim-Evidence-Boundary lineage log)
CREATE TABLE lineage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  claim_node_id UUID REFERENCES claim_nodes(id) ON DELETE CASCADE NOT NULL,
  evidence_item_id UUID REFERENCES evidence_items(id) ON DELETE SET NULL,
  boundary_rule_id UUID REFERENCES boundary_rules(id) ON DELETE SET NULL,
  is_publishable BOOLEAN DEFAULT FALSE NOT NULL,
  verification_signature VARCHAR(255), -- SHA256 cryptographic trace seal
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE question_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_capital_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE canonical_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE qis_scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tco_concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_ontology_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_ontology_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE concept_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE concept_operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineage_records ENABLE ROW LEVEL SECURITY;

-- Establish RLS Policies
-- question_signals Policies
CREATE POLICY signals_read_policy ON question_signals
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY signals_mutation_policy ON question_signals
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']));

-- question_capital_nodes Policies
CREATE POLICY capital_read_policy ON question_capital_nodes
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY capital_mutation_policy ON question_capital_nodes
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist', 'semantic_architect']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist', 'semantic_architect']));

-- canonical_questions Policies
CREATE POLICY cq_read_policy ON canonical_questions
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY cq_mutation_policy ON canonical_questions
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'semantic_architect']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'semantic_architect']));

-- qis_scenes Policies
CREATE POLICY qis_read_policy ON qis_scenes
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY qis_mutation_policy ON qis_scenes
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'semantic_architect']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'semantic_architect']));

-- tco_concepts Policies
CREATE POLICY concepts_read_policy ON tco_concepts
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY concepts_mutation_policy ON tco_concepts
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'semantic_architect']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'semantic_architect']));

-- brand_ontology_nodes Policies
CREATE POLICY ontology_node_read ON brand_ontology_nodes
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY ontology_node_all ON brand_ontology_nodes
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'semantic_architect']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'semantic_architect']));

-- brand_ontology_edges Policies
CREATE POLICY ontology_edge_read ON brand_ontology_edges
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY ontology_edge_all ON brand_ontology_edges
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'semantic_architect']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'semantic_architect']));

-- concept_relations Policies
CREATE POLICY relations_read_policy ON concept_relations
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY relations_mutation_policy ON concept_relations
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'semantic_architect']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'semantic_architect']));

-- concept_operators Policies
CREATE POLICY operators_read_policy ON concept_operators
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY operators_mutation_policy ON concept_operators
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'semantic_architect']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'semantic_architect']));

-- claim_nodes Policies
CREATE POLICY claim_node_read ON claim_nodes
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY claim_node_all ON claim_nodes
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist', 'content_editor']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist', 'content_editor']));

-- lineage_records Policies
CREATE POLICY lineage_read_policy ON lineage_records
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY lineage_mutation_policy ON lineage_records
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist', 'evidence_reviewer']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist', 'evidence_reviewer']));

-- Relational indexes for speed and FK traversals
CREATE INDEX idx_signals_workspace ON question_signals(workspace_id);
CREATE INDEX idx_capital_workspace ON question_capital_nodes(workspace_id);
CREATE INDEX idx_cq_workspace ON canonical_questions(workspace_id);
CREATE INDEX idx_cq_capital ON canonical_questions(question_capital_node_id);
CREATE INDEX idx_qis_workspace ON qis_scenes(workspace_id);
CREATE INDEX idx_qis_cq ON qis_scenes(canonical_question_id);
CREATE INDEX idx_concepts_workspace ON tco_concepts(workspace_id);
CREATE INDEX idx_ont_nodes_ref ON brand_ontology_nodes(reference_id);
CREATE INDEX idx_ont_edges_src ON brand_ontology_edges(source_node_id);
CREATE INDEX idx_ont_edges_tgt ON brand_ontology_edges(target_node_id);
CREATE INDEX idx_operators_concept ON concept_operators(concept_id);
CREATE INDEX idx_claims_truth ON claim_nodes(operational_truth_id);
CREATE INDEX idx_lineage_claim ON lineage_records(claim_node_id);


-- =========================================================================
-- END: 0003_semantic_core.sql
-- =========================================================================


-- =========================================================================
-- START: 0004_representation_surface.sql
-- =========================================================================

-- Migration 0004_representation_surface.sql
-- Module: Representation, Surface & Website MVP

-- 1. representation_objects
CREATE TABLE representation_objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  object_name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  object_type VARCHAR(50) DEFAULT 'ingredient' NOT NULL, -- ingredient, product_spec, service_spec, company_profile
  qis_refs UUID[] DEFAULT '{}'::uuid[] NOT NULL,
  claim_refs UUID[] DEFAULT '{}'::uuid[] NOT NULL,
  concept_refs UUID[] DEFAULT '{}'::uuid[] NOT NULL,
  evidence_refs UUID[] DEFAULT '{}'::uuid[] NOT NULL,
  boundary_refs UUID[] DEFAULT '{}'::uuid[] NOT NULL,
  raw_properties JSONB DEFAULT '{}'::jsonb NOT NULL,
  readiness_status VARCHAR(50) DEFAULT 'draft' NOT NULL, -- draft, ready, failed_safety
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, slug)
);

-- 2. surface_contracts
CREATE TABLE surface_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  contract_name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  allowed_objects UUID[] DEFAULT '{}'::uuid[] NOT NULL,
  qis_refs UUID[] DEFAULT '{}'::uuid[] NOT NULL,
  required_blocks VARCHAR[] DEFAULT '{}'::varchar[] NOT NULL, -- e.g. ['clinical_evidence', 'safety_boundary']
  is_valid BOOLEAN DEFAULT FALSE NOT NULL,
  validation_details JSONB DEFAULT '{}'::jsonb NOT NULL, -- details on safety blocks failures
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, slug)
);

-- 3. semantic_pages
CREATE TABLE semantic_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  surface_contract_id UUID REFERENCES surface_contracts(id) ON DELETE RESTRICT NOT NULL,
  page_title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  meta_description VARCHAR(500),
  visible_content TEXT NOT NULL,
  source_content TEXT NOT NULL,
  object_refs UUID[] DEFAULT '{}'::uuid[] NOT NULL,
  qis_refs UUID[] DEFAULT '{}'::uuid[] NOT NULL,
  claim_refs UUID[] DEFAULT '{}'::uuid[] NOT NULL,
  concept_refs UUID[] DEFAULT '{}'::uuid[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, slug)
);

-- 4. page_sections
CREATE TABLE page_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  semantic_page_id UUID REFERENCES semantic_pages(id) ON DELETE CASCADE NOT NULL,
  section_title VARCHAR(255) NOT NULL,
  section_type VARCHAR(50) DEFAULT 'clinical_facts' NOT NULL, -- header, clinical_facts, safety_boundary, footer
  content_body TEXT NOT NULL,
  source_artifact_refs JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. seo_aeo_geo_exports
CREATE TABLE seo_aeo_geo_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  semantic_page_id UUID REFERENCES semantic_pages(id) ON DELETE CASCADE NOT NULL,
  export_type VARCHAR(50) NOT NULL, -- SEO, AEO_LLM, GEO_AI
  rendered_payload TEXT NOT NULL,
  traceability_carrier JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. schema_mappings
CREATE TABLE schema_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  semantic_page_id UUID REFERENCES semantic_pages(id) ON DELETE CASCADE NOT NULL,
  schema_type VARCHAR(50) DEFAULT 'Product' NOT NULL,
  jsonld_mapping JSONB DEFAULT '{}'::jsonb NOT NULL,
  is_valid BOOLEAN DEFAULT TRUE NOT NULL,
  validation_logs VARCHAR[] DEFAULT '{}'::varchar[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. internal_link_rules
CREATE TABLE internal_link_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  rule_name VARCHAR(255) NOT NULL,
  source_concept_id UUID REFERENCES tco_concepts(id) ON DELETE SET NULL,
  target_page_id UUID REFERENCES semantic_pages(id) ON DELETE CASCADE NOT NULL,
  anchor_text VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. website_generation_runs
CREATE TABLE website_generation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  run_status VARCHAR(50) DEFAULT 'candidate' NOT NULL, -- candidate, draft, completed, failed
  generated_pages_count INTEGER DEFAULT 0 NOT NULL,
  details JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row-Level Security
ALTER TABLE representation_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE surface_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE semantic_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_aeo_geo_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE schema_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_link_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_generation_runs ENABLE ROW LEVEL SECURITY;

-- Establish RLS Policies
-- 1. representation_objects
CREATE POLICY representation_read ON representation_objects
  FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY representation_write ON representation_objects
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist', 'semantic_architect']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist', 'semantic_architect']));

-- 2. surface_contracts
CREATE POLICY surface_read ON surface_contracts
  FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY surface_write ON surface_contracts
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'semantic_architect']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'semantic_architect']));

-- 3. semantic_pages
CREATE POLICY page_read ON semantic_pages
  FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY page_write ON semantic_pages
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'semantic_architect', 'content_editor']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'semantic_architect', 'content_editor']));

-- 4. page_sections
CREATE POLICY section_read ON page_sections
  FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY section_write ON page_sections
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'semantic_architect', 'content_editor']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'semantic_architect', 'content_editor']));

-- 5. seo_aeo_geo_exports
CREATE POLICY export_read ON seo_aeo_geo_exports
  FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY export_write ON seo_aeo_geo_exports
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'semantic_architect', 'content_editor']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'semantic_architect', 'content_editor']));

-- 6. schema_mappings
CREATE POLICY mapping_read ON schema_mappings
  FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY mapping_write ON schema_mappings
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'semantic_architect']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'semantic_architect']));

-- 7. internal_link_rules
CREATE POLICY link_read ON internal_link_rules
  FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY link_write ON internal_link_rules
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'semantic_architect', 'content_editor']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'semantic_architect', 'content_editor']));

-- 8. website_generation_runs
CREATE POLICY webrun_read ON website_generation_runs
  FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY webrun_write ON website_generation_runs
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'semantic_architect']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'semantic_architect']));

-- Relational indexes
CREATE INDEX idx_objects_workspace ON representation_objects(workspace_id);
CREATE INDEX idx_surfaces_workspace ON surface_contracts(workspace_id);
CREATE INDEX idx_pages_workspace ON semantic_pages(workspace_id);
CREATE INDEX idx_pages_contract ON semantic_pages(surface_contract_id);
CREATE INDEX idx_sections_page ON page_sections(semantic_page_id);
CREATE INDEX idx_exports_page ON seo_aeo_geo_exports(semantic_page_id);
CREATE INDEX idx_mappings_page ON schema_mappings(semantic_page_id);
CREATE INDEX idx_links_target ON internal_link_rules(target_page_id);
CREATE INDEX idx_links_concept ON internal_link_rules(source_concept_id);
CREATE INDEX idx_webruns_workspace ON website_generation_runs(workspace_id);


-- =========================================================================
-- END: 0004_representation_surface.sql
-- =========================================================================


-- =========================================================================
-- START: 0005_persona_vibe.sql
-- =========================================================================

-- Migration 0005_persona_vibe.sql
-- Module: Persona Specs & Vibe OS MVP

-- 1. persona_specs
CREATE TABLE persona_specs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  persona_name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  governance_layer JSONB DEFAULT '{}'::jsonb NOT NULL,
  authority_scope VARCHAR[] DEFAULT '{}'::varchar[] NOT NULL,
  legal_guardrails VARCHAR[] DEFAULT '{}'::varchar[] NOT NULL,
  allowed_modes VARCHAR[] DEFAULT '{"standard"}'::varchar[] NOT NULL,
  current_mode VARCHAR(50) DEFAULT 'standard' NOT NULL, -- standard, advisory, crisis
  prompt_text TEXT NOT NULL,
  version INTEGER DEFAULT 1 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, slug)
);

-- 2. persona_assignments
CREATE TABLE persona_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  persona_spec_id UUID REFERENCES persona_specs(id) ON DELETE CASCADE NOT NULL,
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, domain_id)
);

-- 3. persona_eval_runs
CREATE TABLE persona_eval_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  persona_spec_id UUID REFERENCES persona_specs(id) ON DELETE CASCADE NOT NULL,
  run_status VARCHAR(50) DEFAULT 'candidate' NOT NULL, -- candidate, draft, completed, failed
  evaluation_metrics JSONB DEFAULT '{}'::jsonb NOT NULL, -- { pmri: 45.2 }
  details JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. persona_observatory_snapshots
CREATE TABLE persona_observatory_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  snapshot_name VARCHAR(255) NOT NULL,
  metrics JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. persona_patches
CREATE TABLE persona_patches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  persona_spec_id UUID REFERENCES persona_specs(id) ON DELETE CASCADE NOT NULL,
  proposed_patch_text TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'candidate' NOT NULL, -- candidate, draft, approved, rejected
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. vibe_specs
CREATE TABLE vibe_specs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  vibe_name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  target_vector JSONB DEFAULT '{"clinical": 50, "warm": 30, "luxury": 20}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, slug)
);

-- 7. vibe_assignments
CREATE TABLE vibe_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  vibe_spec_id UUID REFERENCES vibe_specs(id) ON DELETE CASCADE NOT NULL,
  target_id UUID NOT NULL, -- page_id, surface_id, domain_id
  target_type VARCHAR(50) DEFAULT 'page' NOT NULL, -- page, surface, domain
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, target_id, target_type)
);

-- 8. vibe_rating_events
CREATE TABLE vibe_rating_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  vibe_spec_id UUID REFERENCES vibe_specs(id) ON DELETE CASCADE NOT NULL,
  target_id UUID NOT NULL,
  target_type VARCHAR(50) DEFAULT 'page' NOT NULL,
  rating_scores JSONB DEFAULT '{"clinical": 0, "warm": 0, "luxury": 0}'::jsonb NOT NULL,
  evidence_item_id UUID REFERENCES evidence_items(id) ON DELETE RESTRICT NOT NULL, -- strictly required: "No evidence, no vibe score"
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. vibe_profiles
CREATE TABLE vibe_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  target_id UUID NOT NULL,
  target_type VARCHAR(50) DEFAULT 'page' NOT NULL,
  aggregated_vector JSONB DEFAULT '{"clinical": 0, "warm": 0, "luxury": 0}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, target_id, target_type)
);

-- 10. vibe_alignment_snapshots
CREATE TABLE vibe_alignment_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  vibe_spec_id UUID REFERENCES vibe_specs(id) ON DELETE CASCADE NOT NULL,
  vpa DECIMAL(5,2) DEFAULT 0.00 NOT NULL, -- Vibe-to-Page Alignment index
  vcs DECIMAL(5,2) DEFAULT 0.00 NOT NULL, -- Vibe Consistency Score
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. vibe_diagnoses
CREATE TABLE vibe_diagnoses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  vibe_spec_id UUID REFERENCES vibe_specs(id) ON DELETE CASCADE NOT NULL,
  msa DECIMAL(5,2) DEFAULT 0.00 NOT NULL, -- Mismatch Severity Index
  findings TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. vibe_interventions
CREATE TABLE vibe_interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  vibe_diagnosis_id UUID REFERENCES vibe_diagnoses(id) ON DELETE CASCADE NOT NULL,
  proposed_adjustments JSONB DEFAULT '{}'::jsonb NOT NULL,
  is_applied BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. vibe_validation_runs
CREATE TABLE vibe_validation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  vibe_spec_id UUID REFERENCES vibe_specs(id) ON DELETE CASCADE NOT NULL,
  vmri DECIMAL(5,2) DEFAULT 0.00 NOT NULL, -- Vibe Mismatch Risk Index
  status VARCHAR(50) DEFAULT 'candidate' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 14. dark_pattern_rules
CREATE TABLE dark_pattern_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  rule_name VARCHAR(255) NOT NULL,
  forbidden_linguistic_triggers VARCHAR[] DEFAULT '{}'::varchar[] NOT NULL, -- e.g. ['buy now or lose forever', 'hurry only 2 left']
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row-Level Security
ALTER TABLE persona_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE persona_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE persona_eval_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE persona_observatory_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE persona_patches ENABLE ROW LEVEL SECURITY;
ALTER TABLE vibe_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vibe_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vibe_rating_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE vibe_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vibe_alignment_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE vibe_diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE vibe_interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vibe_validation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dark_pattern_rules ENABLE ROW LEVEL SECURITY;

-- Establish RLS Policies
-- 1. persona_specs
CREATE POLICY persona_read ON persona_specs
  FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY persona_write ON persona_specs
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']));

-- 2. persona_assignments
CREATE POLICY assign_read ON persona_assignments
  FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY assign_write ON persona_assignments
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']));

-- 3. persona_eval_runs
CREATE POLICY peval_read ON persona_eval_runs
  FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY peval_write ON persona_eval_runs
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']));

-- 4. persona_observatory_snapshots
CREATE POLICY pobs_read ON persona_observatory_snapshots
  FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY pobs_write ON persona_observatory_snapshots
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']));

-- 5. persona_patches
CREATE POLICY ppatch_read ON persona_patches
  FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY ppatch_write ON persona_patches
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']));

-- 6. vibe_specs
CREATE POLICY vibe_read ON vibe_specs
  FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY vibe_write ON vibe_specs
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']));

-- 7. vibe_assignments
CREATE POLICY vassign_read ON vibe_assignments
  FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY vassign_write ON vibe_assignments
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']));

-- 8. vibe_rating_events
CREATE POLICY vrating_read ON vibe_rating_events
  FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY vrating_write ON vibe_rating_events
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']));

-- 9. vibe_profiles
CREATE POLICY vprofile_read ON vibe_profiles
  FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY vprofile_write ON vibe_profiles
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']));

-- 10. vibe_alignment_snapshots
CREATE POLICY valign_read ON vibe_alignment_snapshots
  FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY valign_write ON vibe_alignment_snapshots
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']));

-- 11. vibe_diagnoses
CREATE POLICY vdiag_read ON vibe_diagnoses
  FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY vdiag_write ON vibe_diagnoses
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']));

-- 12. vibe_interventions
CREATE POLICY vinter_read ON vibe_interventions
  FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY vinter_write ON vibe_interventions
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']));

-- 13. vibe_validation_runs
CREATE POLICY vval_read ON vibe_validation_runs
  FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY vval_write ON vibe_validation_runs
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']));

-- 14. dark_pattern_rules
CREATE POLICY dark_read ON dark_pattern_rules
  FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY dark_write ON dark_pattern_rules
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']));

-- Relational indexes
CREATE INDEX idx_persona_specs_workspace ON persona_specs(workspace_id);
CREATE INDEX idx_persona_assign_workspace ON persona_assignments(workspace_id);
CREATE INDEX idx_persona_assign_spec ON persona_assignments(persona_spec_id);
CREATE INDEX idx_persona_assign_domain ON persona_assignments(domain_id);
CREATE INDEX idx_persona_eval_workspace ON persona_eval_runs(workspace_id);
CREATE INDEX idx_persona_eval_spec ON persona_eval_runs(persona_spec_id);
CREATE INDEX idx_persona_patch_spec ON persona_patches(persona_spec_id);
CREATE INDEX idx_vibe_specs_workspace ON vibe_specs(workspace_id);
CREATE INDEX idx_vibe_assign_vibe ON vibe_assignments(vibe_spec_id);
CREATE INDEX idx_vibe_assign_target ON vibe_assignments(target_id);
CREATE INDEX idx_vibe_rating_vibe ON vibe_rating_events(vibe_spec_id);
CREATE INDEX idx_vibe_rating_target ON vibe_rating_events(target_id);
CREATE INDEX idx_vibe_rating_evidence ON vibe_rating_events(evidence_item_id);
CREATE INDEX idx_vibe_profiles_target ON vibe_profiles(target_id);
CREATE INDEX idx_vibe_align_vibe ON vibe_alignment_snapshots(vibe_spec_id);
CREATE INDEX idx_vibe_diag_vibe ON vibe_diagnoses(vibe_spec_id);
CREATE INDEX idx_vibe_inter_diag ON vibe_interventions(vibe_diagnosis_id);
CREATE INDEX idx_vibe_val_vibe ON vibe_validation_runs(vibe_spec_id);
CREATE INDEX idx_dark_workspace ON dark_pattern_rules(workspace_id);


-- =========================================================================
-- END: 0005_persona_vibe.sql
-- =========================================================================


-- =========================================================================
-- START: 0006_observatory_metrics.sql
-- =========================================================================

-- Migration 0006_observatory_metrics.sql
-- Module: AI Search Observatory & Metrics Engine MVP

-- 1. probe_panels
CREATE TABLE probe_panels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  panel_name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  version INTEGER DEFAULT 1 NOT NULL,
  is_locked BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, slug, version)
);

-- 2. probe_questions
CREATE TABLE probe_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  probe_panel_id UUID REFERENCES probe_panels(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  intent_context VARCHAR(255) NOT NULL, -- e.g. informational, commercial
  target_keyword VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. ai_observation_runs
CREATE TABLE ai_observation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  run_name VARCHAR(255) NOT NULL,
  probe_panel_id UUID REFERENCES probe_panels(id) ON DELETE CASCADE NOT NULL,
  run_status VARCHAR(50) DEFAULT 'candidate' NOT NULL, -- candidate, draft, completed, failed
  run_metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. probe_runs
CREATE TABLE probe_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  ai_observation_run_id UUID REFERENCES ai_observation_runs(id) ON DELETE CASCADE NOT NULL,
  probe_question_id UUID REFERENCES probe_questions(id) ON DELETE CASCADE NOT NULL,
  engine_name VARCHAR(100) DEFAULT 'mock_provider' NOT NULL,
  raw_response_text TEXT NOT NULL, -- "Raw probe responses must be stored"
  metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. response_judgments
CREATE TABLE response_judgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  probe_run_id UUID REFERENCES probe_runs(id) ON DELETE CASCADE NOT NULL,
  is_citation_found BOOLEAN DEFAULT FALSE NOT NULL,
  brand_semantic_fidelity_score DECIMAL(5,2) DEFAULT 0.00 NOT NULL,
  question_territory_covered BOOLEAN DEFAULT FALSE NOT NULL,
  geo_concept_transferred BOOLEAN DEFAULT FALSE NOT NULL,
  reviewer_notes TEXT,
  review_status VARCHAR(50) DEFAULT 'candidate' NOT NULL, -- candidate, draft, approved, rejected
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, probe_run_id)
);

-- 6. metric_snapshots
CREATE TABLE metric_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  ai_observation_run_id UUID REFERENCES ai_observation_runs(id) ON DELETE CASCADE NOT NULL,
  metric_name VARCHAR(100) NOT NULL, -- AAS, OCR, BSF, QTC, GCTR, ARS
  metric_value DECIMAL(5,2) DEFAULT 0.00 NOT NULL,
  details JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. domain_index_definitions
CREATE TABLE domain_index_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  index_name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  configured_weights JSONB DEFAULT '{"AAS": 0.2, "OCR": 0.2, "BSF": 0.3, "QTC": 0.1, "GCTR": 0.2}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, slug)
);

-- 8. domain_index_snapshots
CREATE TABLE domain_index_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  domain_index_definition_id UUID REFERENCES domain_index_definitions(id) ON DELETE CASCADE NOT NULL,
  ai_observation_run_id UUID REFERENCES ai_observation_runs(id) ON DELETE CASCADE NOT NULL,
  computed_value DECIMAL(5,2) DEFAULT 0.00 NOT NULL,
  details JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. benchmark_reports
CREATE TABLE benchmark_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  report_name VARCHAR(255) NOT NULL,
  panel_version INTEGER DEFAULT 1 NOT NULL,
  scores JSONB DEFAULT '{}'::jsonb NOT NULL,
  methodology_disclosure_id UUID, -- Optional soft reference
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. methodology_disclosures
CREATE TABLE methodology_disclosures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  disclosure_name VARCHAR(255) NOT NULL,
  methodology_description TEXT NOT NULL,
  proxy_caveat_text TEXT NOT NULL, -- Proxy caveat is mandatory
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 11. semantic_website_lift_snapshots
CREATE TABLE semantic_website_lift_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  base_observation_run_id UUID REFERENCES ai_observation_runs(id) ON DELETE CASCADE NOT NULL,
  active_observation_run_id UUID REFERENCES ai_observation_runs(id) ON DELETE CASCADE NOT NULL,
  lift_metrics JSONB DEFAULT '{}'::jsonb NOT NULL, -- Delta lift calculations
  proxy_caveat_text TEXT NOT NULL, -- Proxy caveat is mandatory
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row-Level Security
ALTER TABLE probe_panels ENABLE ROW LEVEL SECURITY;
ALTER TABLE probe_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_observation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE probe_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE response_judgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_index_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_index_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE benchmark_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE methodology_disclosures ENABLE ROW LEVEL SECURITY;
ALTER TABLE semantic_website_lift_snapshots ENABLE ROW LEVEL SECURITY;

-- Establish RLS Policies
-- 1. probe_panels
CREATE POLICY panel_read ON probe_panels
  FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY panel_write ON probe_panels
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']));

-- 2. probe_questions
CREATE POLICY question_read ON probe_questions
  FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY question_write ON probe_questions
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']));

-- 3. ai_observation_runs
CREATE POLICY run_read ON ai_observation_runs
  FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY run_write ON ai_observation_runs
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']));

-- 4. probe_runs
CREATE POLICY prun_read ON probe_runs
  FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY prun_write ON probe_runs
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']));

-- 5. response_judgments
CREATE POLICY judg_read ON response_judgments
  FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY judg_write ON response_judgments
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']));

-- 6. metric_snapshots
CREATE POLICY ms_read ON metric_snapshots
  FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY ms_write ON metric_snapshots
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']));

-- 7. domain_index_definitions
CREATE POLICY did_read ON domain_index_definitions
  FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY did_write ON domain_index_definitions
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']));

-- 8. domain_index_snapshots
CREATE POLICY dis_read ON domain_index_snapshots
  FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY dis_write ON domain_index_snapshots
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']));

-- 9. benchmark_reports
CREATE POLICY bench_read ON benchmark_reports
  FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY bench_write ON benchmark_reports
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']));

-- 10. methodology_disclosures
CREATE POLICY meth_read ON methodology_disclosures
  FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY meth_write ON methodology_disclosures
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']));

-- 11. semantic_website_lift_snapshots
CREATE POLICY lift_read ON semantic_website_lift_snapshots
  FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY lift_write ON semantic_website_lift_snapshots
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']));

-- Relational indexes
CREATE INDEX idx_panel_workspace ON probe_panels(workspace_id);
CREATE INDEX idx_question_panel ON probe_questions(probe_panel_id);
CREATE INDEX idx_obs_run_panel ON ai_observation_runs(probe_panel_id);
CREATE INDEX idx_probe_run_obs ON probe_runs(ai_observation_run_id);
CREATE INDEX idx_probe_run_quest ON probe_runs(probe_question_id);
CREATE INDEX idx_judgment_prun ON response_judgments(probe_run_id);
CREATE INDEX idx_metric_obs ON metric_snapshots(ai_observation_run_id);
CREATE INDEX idx_index_definition ON domain_index_snapshots(domain_index_definition_id);
CREATE INDEX idx_index_obs_run ON domain_index_snapshots(ai_observation_run_id);
CREATE INDEX idx_lift_base_run ON semantic_website_lift_snapshots(base_observation_run_id);
CREATE INDEX idx_lift_active_run ON semantic_website_lift_snapshots(active_observation_run_id);


-- =========================================================================
-- END: 0006_observatory_metrics.sql
-- =========================================================================


-- =========================================================================
-- START: 0007_report_publisher_patch.sql
-- =========================================================================

-- Migration 0007_report_publisher_patch.sql
-- Module: Benchmark Report Publisher MVP

-- 1. report_sections
CREATE TABLE report_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  benchmark_report_id UUID REFERENCES benchmark_reports(id) ON DELETE CASCADE NOT NULL,
  section_title VARCHAR(255) NOT NULL,
  section_body TEXT NOT NULL,
  section_type VARCHAR(50) DEFAULT 'executive_summary' NOT NULL, -- executive_summary, metrics_analysis, competitive_landscape, methodology_appendix
  status VARCHAR(50) DEFAULT 'candidate' NOT NULL, -- candidate, draft, completed
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. report_exports
CREATE TABLE report_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  benchmark_report_id UUID REFERENCES benchmark_reports(id) ON DELETE CASCADE NOT NULL,
  export_format VARCHAR(50) DEFAULT 'markdown' NOT NULL, -- markdown, html
  exported_payload TEXT NOT NULL,
  is_published BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. report_reviews
CREATE TABLE report_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  benchmark_report_id UUID REFERENCES benchmark_reports(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID NOT NULL,
  decision VARCHAR(50) NOT NULL, -- approved, rejected
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. report_gate_results
CREATE TABLE report_gate_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  benchmark_report_id UUID REFERENCES benchmark_reports(id) ON DELETE CASCADE NOT NULL,
  status VARCHAR(50) NOT NULL, -- pass, fail
  blocking_reasons VARCHAR[] DEFAULT '{}'::varchar[] NOT NULL,
  warnings VARCHAR[] DEFAULT '{}'::varchar[] NOT NULL,
  required_fixes VARCHAR[] DEFAULT '{}'::varchar[] NOT NULL,
  evaluated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. unsafe_wording_findings
CREATE TABLE unsafe_wording_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  benchmark_report_id UUID REFERENCES benchmark_reports(id) ON DELETE CASCADE NOT NULL,
  finding_type VARCHAR(100) NOT NULL, -- e.g. market_share, preference, hidden_preference, ranking
  offending_text TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT FALSE NOT NULL,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row-Level Security
ALTER TABLE report_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_gate_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE unsafe_wording_findings ENABLE ROW LEVEL SECURITY;

-- Establish RLS Policies
-- 1. report_sections
CREATE POLICY section_read ON report_sections
  FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY section_write ON report_sections
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']));

-- 2. report_exports
CREATE POLICY export_read ON report_exports
  FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY export_write ON report_exports
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']));

-- 3. report_reviews
CREATE POLICY review_read ON report_reviews
  FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY review_write ON report_reviews
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']));

-- 4. report_gate_results
CREATE POLICY rgate_read ON report_gate_results
  FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY rgate_write ON report_gate_results
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']));

-- 5. unsafe_wording_findings
CREATE POLICY uwf_read ON unsafe_wording_findings
  FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY uwf_write ON unsafe_wording_findings
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']));

-- Relational indexes
CREATE INDEX idx_section_report ON report_sections(benchmark_report_id);
CREATE INDEX idx_export_report ON report_exports(benchmark_report_id);
CREATE INDEX idx_review_report ON report_reviews(benchmark_report_id);
CREATE INDEX idx_rgate_report ON report_gate_results(benchmark_report_id);
CREATE INDEX idx_uwf_report ON unsafe_wording_findings(benchmark_report_id);


-- =========================================================================
-- END: 0007_report_publisher_patch.sql
-- =========================================================================


-- =========================================================================
-- START: 0008_fixit_factory.sql
-- =========================================================================

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


-- =========================================================================
-- END: 0008_fixit_factory.sql
-- =========================================================================


-- =========================================================================
-- START: 0009_embedding_cache.sql
-- =========================================================================

-- Migration 0009: Embedding Cache Layer
-- Author: Antigravity AI
-- Date: 2026-05-23

CREATE TABLE IF NOT EXISTS embedding_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  content_hash TEXT NOT NULL,
  embedding_vector JSONB NOT NULL,
  model_name TEXT NOT NULL DEFAULT 'text-embedding-004',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexing for high-performance lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_embedding_cache_hash 
  ON embedding_cache(workspace_id, content_hash, model_name);

-- Enable Row Level Security
ALTER TABLE embedding_cache ENABLE ROW LEVEL SECURITY;

-- Workspace access isolation RLS policies
CREATE POLICY "Members can view embedding cache inside their workspace"
  ON embedding_cache
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_memberships
      WHERE workspace_memberships.workspace_id = embedding_cache.workspace_id
        AND workspace_memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can insert embedding cache inside their workspace"
  ON embedding_cache
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_memberships
      WHERE workspace_memberships.workspace_id = embedding_cache.workspace_id
        AND workspace_memberships.user_id = auth.uid()
    )
  );


-- =========================================================================
-- END: 0009_embedding_cache.sql
-- =========================================================================


-- =========================================================================
-- START: 0010_observation_engine_config.sql
-- =========================================================================

-- Migration 0010: Observation Engine Config Layer
-- Author: Antigravity AI
-- Date: 2026-05-23

CREATE TABLE IF NOT EXISTS observation_engine_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  engine_name TEXT NOT NULL,
  provider_type TEXT NOT NULL DEFAULT 'mock', -- 'mock' | 'gemini_sge' | 'chatgpt'
  api_key_ref TEXT,
  proxy_config JSONB DEFAULT '{}',
  rate_limit_rpm INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Unique index to prevent duplicate engine configs per workspace
CREATE UNIQUE INDEX IF NOT EXISTS idx_obs_engine_config_uniq
  ON observation_engine_configs(workspace_id, engine_name);

-- Enable Row Level Security
ALTER TABLE observation_engine_configs ENABLE ROW LEVEL SECURITY;

-- Workspace access isolation RLS policies
CREATE POLICY "Members can view observation engine configs inside their workspace"
  ON observation_engine_configs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_memberships
      WHERE workspace_memberships.workspace_id = observation_engine_configs.workspace_id
        AND workspace_memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can modify observation engine configs inside their workspace"
  ON observation_engine_configs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workspace_memberships
      WHERE workspace_memberships.workspace_id = observation_engine_configs.workspace_id
        AND workspace_memberships.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_memberships
      WHERE workspace_memberships.workspace_id = observation_engine_configs.workspace_id
        AND workspace_memberships.user_id = auth.uid()
    )
  );


-- =========================================================================
-- END: 0010_observation_engine_config.sql
-- =========================================================================


-- =========================================================================
-- START: 0011_expected_layers.sql
-- =========================================================================

-- Migration 0011_expected_layers.sql
-- Module: Expected Layers for Probe Questions

CREATE TABLE IF NOT EXISTS expected_layers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  probe_question_id UUID REFERENCES probe_questions(id) ON DELETE CASCADE NOT NULL,
  must_include TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  should_include TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  must_not_do TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  expected_layer_version INTEGER DEFAULT 1 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, probe_question_id)
);

-- Enable RLS
ALTER TABLE expected_layers ENABLE ROW LEVEL SECURITY;

-- Establish RLS Policies
CREATE POLICY exlayer_read ON expected_layers
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY exlayer_write ON expected_layers
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist', 'semantic_architect']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist', 'semantic_architect']));

-- Relational Index
CREATE INDEX IF NOT EXISTS idx_exlayer_question ON expected_layers(probe_question_id);


-- =========================================================================
-- END: 0011_expected_layers.sql
-- =========================================================================


-- =========================================================================
-- START: 0012_embedding_model_upgrade.sql
-- =========================================================================

-- Migration 0012: Embedding Model Upgrade
-- Author: Antigravity AI
-- Date: 2026-05-24

-- Alter the default model_name to text-embedding-3-large
ALTER TABLE embedding_cache 
  ALTER COLUMN model_name SET DEFAULT 'text-embedding-3-large';

-- Add dimensions and content_type columns to embedding_cache
ALTER TABLE embedding_cache
  ADD COLUMN IF NOT EXISTS dimensions INTEGER DEFAULT 3072,
  ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'page_body';

-- Indexing for composite lookup by workspace, content_type, and model_name
CREATE INDEX IF NOT EXISTS idx_embedding_cache_composite
  ON embedding_cache(workspace_id, content_type, model_name);

-- Add brand_guide_text column to vibe_specs to store unstructured brand vibe guidelines for real-time cosine similarity
ALTER TABLE vibe_specs
  ADD COLUMN IF NOT EXISTS brand_guide_text TEXT;


-- =========================================================================
-- END: 0012_embedding_model_upgrade.sql
-- =========================================================================


-- =========================================================================
-- START: 0013_crawler_providers.sql
-- =========================================================================

-- Migration 0013: Crawler Providers Expansion
-- Author: Antigravity AI
-- Date: 2026-05-24

-- Add columns to probe_runs to store live search crawler data and source citations
ALTER TABLE probe_runs
  ADD COLUMN IF NOT EXISTS source_provider TEXT DEFAULT 'mock',
  ADD COLUMN IF NOT EXISTS citations JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS grounding_metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS raw_serp_data JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS crawler_latency_ms INTEGER DEFAULT 0;


-- =========================================================================
-- END: 0013_crawler_providers.sql
-- =========================================================================


-- =========================================================================
-- START: 0014_probe_panel_extension.sql
-- =========================================================================

-- Migration 0014_probe_panel_extension.sql
-- Module: Probe Panel & Question Metadata Extensions

-- 1. Extend probe_questions
ALTER TABLE probe_questions ADD COLUMN IF NOT EXISTS
  risk_level VARCHAR(20) DEFAULT 'low' NOT NULL;
ALTER TABLE probe_questions ADD COLUMN IF NOT EXISTS
  decision_stage VARCHAR(50); -- awareness, consideration, decision
ALTER TABLE probe_questions ADD COLUMN IF NOT EXISTS
  question_type VARCHAR(50); -- informational, comparison, recommendation...
ALTER TABLE probe_questions ADD COLUMN IF NOT EXISTS
  weight DECIMAL(3,2) DEFAULT 1.00 NOT NULL;
ALTER TABLE probe_questions ADD COLUMN IF NOT EXISTS
  query_variants TEXT[] DEFAULT '{}'::TEXT[] NOT NULL;

-- 2. Extend probe_panels
ALTER TABLE probe_panels ADD COLUMN IF NOT EXISTS
  industry VARCHAR(100); -- industry tag (e.g. beauty, wedding, clinic...)
ALTER TABLE probe_panels ADD COLUMN IF NOT EXISTS
  panel_type VARCHAR(50) DEFAULT 'standard' NOT NULL; -- standard, brand_specific, competitor_benchmark, retest, sbs_index
ALTER TABLE probe_panels ADD COLUMN IF NOT EXISTS
  sbs_index_target VARCHAR(50); -- 'AIPR', 'BAIR', 'AITI', 'KAIVI' etc.

-- 3. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_panel_industry ON probe_panels(industry);
CREATE INDEX IF NOT EXISTS idx_question_risk ON probe_questions(risk_level);


-- =========================================================================
-- END: 0014_probe_panel_extension.sql
-- =========================================================================


-- =========================================================================
-- START: 0015_tenant_workspace_bridge.sql
-- =========================================================================

-- Migration 0015_tenant_workspace_bridge.sql
-- Module: Tenant-Workspace Bridge for Multi-Tenant SaaS Integration

-- 1. Create Bridge Table
CREATE TABLE tenant_workspace_bridge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- AIHompyHub Tenant Entity (Soft Reference, no physical foreign key to cross-schema/cross-db table)
  aihompy_tenant_id UUID NOT NULL,
  aihompy_tenant_slug VARCHAR(100),
  aihompy_industry VARCHAR(100) NOT NULL, -- beauty, wedding, clinic...
  
  -- BSW-OS Workspace Entity (Physical Reference)
  bsw_workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  
  -- Sync state management
  sync_status VARCHAR(30) DEFAULT 'pending' NOT NULL, -- pending, active, paused, error
  last_synced_at TIMESTAMPTZ,
  sync_config JSONB DEFAULT '{}'::jsonb NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(aihompy_tenant_id),
  UNIQUE(bsw_workspace_id)
);

-- 2. Enable Row-Level Security
ALTER TABLE tenant_workspace_bridge ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
CREATE POLICY bridge_read ON tenant_workspace_bridge
  FOR SELECT USING (is_workspace_member(bsw_workspace_id));

CREATE POLICY bridge_write ON tenant_workspace_bridge
  FOR ALL USING (has_workspace_role(bsw_workspace_id, ARRAY['owner', 'admin', 'brand_strategist']))
  WITH CHECK (has_workspace_role(bsw_workspace_id, ARRAY['owner', 'admin', 'brand_strategist']));

-- 4. Create indexes
CREATE INDEX idx_bridge_tenant ON tenant_workspace_bridge(aihompy_tenant_id);
CREATE INDEX idx_bridge_workspace ON tenant_workspace_bridge(bsw_workspace_id);


-- =========================================================================
-- END: 0015_tenant_workspace_bridge.sql
-- =========================================================================


-- =========================================================================
-- START: 0016_question_value_scores.sql
-- =========================================================================

-- Migration 0016_question_value_scores.sql
-- Module: Question Value Scorer (QVS)

-- 1. Create Table
CREATE TABLE question_value_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  
  -- References (both optional since one of them is linked)
  probe_question_id UUID REFERENCES probe_questions(id) ON DELETE CASCADE,
  predicted_question_id UUID, -- Will link to predicted_questions in migration 0017
  
  -- Value indicators
  volume_score DECIMAL(5,2) DEFAULT 0.00 NOT NULL,
  conversion_score DECIMAL(5,2) DEFAULT 0.00 NOT NULL,
  arpu_score DECIMAL(5,2) DEFAULT 0.00 NOT NULL,
  first_mover_score DECIMAL(5,2) DEFAULT 1.00 NOT NULL,
  competition_score DECIMAL(5,2) DEFAULT 0.00 NOT NULL,
  
  -- Composite arithmetic scores
  qvs_composite DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
  estimated_monthly_value DECIMAL(12,2) DEFAULT 0.00 NOT NULL, -- in KRW
  preemption_deadline TIMESTAMPTZ,
  
  -- Meta
  industry VARCHAR(100) NOT NULL,
  scoring_method VARCHAR(50) DEFAULT 'auto' NOT NULL, -- auto, manual
  scored_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Enable RLS
ALTER TABLE question_value_scores ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
CREATE POLICY qvs_read ON question_value_scores
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY qvs_write ON question_value_scores
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']));

-- 4. Create Performance Indexes
CREATE INDEX idx_qvs_industry ON question_value_scores(industry);
CREATE INDEX idx_qvs_composite ON question_value_scores(qvs_composite DESC);
CREATE INDEX idx_qvs_probe ON question_value_scores(probe_question_id);


-- =========================================================================
-- END: 0016_question_value_scores.sql
-- =========================================================================


-- =========================================================================
-- START: 0017_prediction_engine.sql
-- =========================================================================

-- Migration 0017_prediction_engine.sql
-- Module: Question Emergence Predictor (QEP)

-- 1. Create emergence_signals
CREATE TABLE emergence_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE, -- NULL = global/industry level signal
  source_type VARCHAR(50) NOT NULL, -- news, regulation, search_trend, community, seasonal, internal, broadcast
  industry VARCHAR(100) NOT NULL,
  raw_text TEXT NOT NULL,
  source_url TEXT,
  
  -- AI analysis
  ai_analysis JSONB DEFAULT '{}'::jsonb NOT NULL,
  predicted_impact VARCHAR(20) DEFAULT 'medium' NOT NULL, -- low, medium, high, critical
  
  detected_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  expires_at TIMESTAMPTZ,
  status VARCHAR(30) DEFAULT 'new' NOT NULL -- new, analyzed, archived
);

-- 2. Create predicted_questions
CREATE TABLE predicted_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE, -- NULL = global/industry level prediction
  signal_id UUID REFERENCES emergence_signals(id) ON DELETE SET NULL,
  
  question_text TEXT NOT NULL,
  question_variants TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  predicted_intent VARCHAR(100) NOT NULL,
  industry VARCHAR(100) NOT NULL,
  
  -- Prediction metadata
  predicted_volume VARCHAR(20) DEFAULT 'medium' NOT NULL, -- low, medium, high
  current_ai_coverage VARCHAR(20) DEFAULT 'none' NOT NULL, -- none, sparse, moderate, saturated
  first_mover_window_days INTEGER DEFAULT 30 NOT NULL,
  preemption_urgency VARCHAR(20) DEFAULT 'medium' NOT NULL, -- low, medium, high, critical
  confidence DECIMAL(3,2) DEFAULT 0.50 NOT NULL,
  
  -- Auto-generated Expected Layer
  auto_must_include TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  auto_should_include TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  auto_must_not_do TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  
  -- Post-verification (super-forecasting accuracy)
  actually_emerged BOOLEAN,
  emerged_at TIMESTAMPTZ,
  prediction_accuracy DECIMAL(3,2),
  
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Link Predicted Questions back to QVS
ALTER TABLE question_value_scores 
  ADD CONSTRAINT fk_qvs_predicted 
  FOREIGN KEY (predicted_question_id) 
  REFERENCES predicted_questions(id) ON DELETE CASCADE;

-- 4. Enable RLS
ALTER TABLE emergence_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE predicted_questions ENABLE ROW LEVEL SECURITY;

-- 5. Establish RLS Policies
CREATE POLICY signals_read ON emergence_signals
  FOR SELECT USING (workspace_id IS NULL OR is_workspace_member(workspace_id));

CREATE POLICY signals_write ON emergence_signals
  FOR ALL USING (workspace_id IS NOT NULL AND has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']))
  WITH CHECK (workspace_id IS NOT NULL AND has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']));

CREATE POLICY predictions_read ON predicted_questions
  FOR SELECT USING (workspace_id IS NULL OR is_workspace_member(workspace_id));

CREATE POLICY predictions_write ON predicted_questions
  FOR ALL USING (workspace_id IS NOT NULL AND has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']))
  WITH CHECK (workspace_id IS NOT NULL AND has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']));

-- 6. Indexes
CREATE INDEX idx_signals_industry ON emergence_signals(industry);
CREATE INDEX idx_signals_type ON emergence_signals(source_type);
CREATE INDEX idx_predictions_industry ON predicted_questions(industry);
CREATE INDEX idx_predictions_signal ON predicted_questions(signal_id);


-- =========================================================================
-- END: 0017_prediction_engine.sql
-- =========================================================================


-- =========================================================================
-- START: 0018_content_blueprints.sql
-- =========================================================================

-- Migration 0018_content_blueprints.sql
-- Module: Pre-emptive Content Factory (PCF)

-- 1. Create content_blueprints table
CREATE TABLE IF NOT EXISTS content_blueprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  predicted_question_id UUID REFERENCES predicted_questions(id) ON DELETE CASCADE NOT NULL,
  
  -- Recommended formats & guidelines
  recommended_structure VARCHAR(50) NOT NULL, -- qna, blog, guide, comparison
  recommended_schema JSONB DEFAULT '[]'::jsonb NOT NULL,
  recommended_length JSONB DEFAULT '{"min": 300, "max": 800, "optimal": 500}'::jsonb NOT NULL,
  required_eeat_level VARCHAR(30) DEFAULT 'basic' NOT NULL,
  
  -- Vibe constraints
  target_vpa DECIMAL(5,2) DEFAULT 75.00 NOT NULL,
  tone_guidelines TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  forbidden_expressions TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  brand_voice_keywords TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  
  -- Draft output
  draft_content TEXT,
  draft_vpa_score DECIMAL(5,2),
  
  -- Status tracking
  status VARCHAR(30) DEFAULT 'draft' NOT NULL, -- draft, verified, queued, published
  tenant_bridge_id UUID REFERENCES tenant_workspace_bridge(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Enable RLS
ALTER TABLE content_blueprints ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
CREATE POLICY blueprints_read ON content_blueprints
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY blueprints_write ON content_blueprints
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']));

-- 4. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_blueprints_predicted ON content_blueprints(predicted_question_id);
CREATE INDEX IF NOT EXISTS idx_blueprints_status ON content_blueprints(status);


-- =========================================================================
-- END: 0018_content_blueprints.sql
-- =========================================================================


-- =========================================================================
-- START: 0019_p0_enhancements.sql
-- =========================================================================

-- P0 Enhancement Migration: Question Lifecycle, TTL, Weight Calibration, Funnel Tracking
-- Depends on: 0014_probe_panel_extension.sql

-- 1. Question Lifecycle Status
DO $$ BEGIN
  CREATE TYPE question_lifecycle_status AS ENUM (
    'draft', 'review', 'active', 'deprecated', 'archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE probe_questions
  ADD COLUMN IF NOT EXISTS lifecycle_status question_lifecycle_status DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS lifecycle_changed_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS lifecycle_changed_by UUID,
  ADD COLUMN IF NOT EXISTS ttl_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_time_sensitive BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS base_weight NUMERIC(5,2) DEFAULT 1.00,
  ADD COLUMN IF NOT EXISTS calibrated_weight NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS last_calibrated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS funnel_stage TEXT DEFAULT 'intake';

-- 2. Question Funnel Tracking Table
CREATE TABLE IF NOT EXISTS question_funnel_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  probe_question_id UUID REFERENCES probe_questions(id),
  predicted_question_id UUID REFERENCES predicted_questions(id),
  from_stage TEXT NOT NULL,
  to_stage TEXT NOT NULL,
  event_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE question_funnel_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace isolation for funnel events"
  ON question_funnel_events FOR ALL
  USING (workspace_id = current_setting('app.workspace_id', true)::uuid);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_probe_questions_lifecycle
  ON probe_questions(workspace_id, lifecycle_status);

CREATE INDEX IF NOT EXISTS idx_probe_questions_ttl
  ON probe_questions(ttl_expires_at)
  WHERE ttl_expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_funnel_events_workspace
  ON question_funnel_events(workspace_id, created_at DESC);


-- =========================================================================
-- END: 0019_p0_enhancements.sql
-- =========================================================================


-- =========================================================================
-- START: 0020_p1_governance.sql
-- =========================================================================

-- P1 Governance Migration: Version Control & Explicit YMYL References
-- Depends on: 0019_p0_enhancements.sql

-- 1. Create YMYL Regulatory References Table
CREATE TABLE IF NOT EXISTS ymyl_regulatory_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency TEXT NOT NULL,
  article_code TEXT NOT NULL,
  safety_guideline TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ymyl_regulatory_references ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read for YMYL rules"
  ON ymyl_regulatory_references FOR SELECT
  USING (true);

-- 2. Alter probe_questions to include explicit YMYL tracking
ALTER TABLE probe_questions
  ADD COLUMN IF NOT EXISTS is_ymyl BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS regulatory_ref_id UUID REFERENCES ymyl_regulatory_references(id);

-- 3. Alter probe_panels to support version history self-references
ALTER TABLE probe_panels
  ADD COLUMN IF NOT EXISTS parent_panel_id UUID REFERENCES probe_panels(id),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 4. Create Indexes
CREATE INDEX IF NOT EXISTS idx_probe_questions_ymyl
  ON probe_questions(workspace_id, is_ymyl)
  WHERE is_ymyl = TRUE;

CREATE INDEX IF NOT EXISTS idx_probe_panels_parent
  ON probe_panels(parent_panel_id)
  WHERE parent_panel_id IS NOT NULL;


-- =========================================================================
-- END: 0020_p1_governance.sql
-- =========================================================================


-- =========================================================================
-- START: 0021_p2_expected_layers_5_tiers.sql
-- =========================================================================

-- Migration: 0021_p2_expected_layers_5_tiers
-- Description: Upgrade Expected Layers to 5-tier classification by adding strongly_recommended and caution tiers.

-- 1. Alter expected_layers table
ALTER TABLE expected_layers ADD COLUMN IF NOT EXISTS strongly_recommended text[] DEFAULT '{}';
ALTER TABLE expected_layers ADD COLUMN IF NOT EXISTS caution text[] DEFAULT '{}';

-- 2. Alter predicted_questions table
ALTER TABLE predicted_questions ADD COLUMN IF NOT EXISTS auto_strongly_recommended text[] DEFAULT '{}';
ALTER TABLE predicted_questions ADD COLUMN IF NOT EXISTS auto_caution text[] DEFAULT '{}';


-- =========================================================================
-- END: 0021_p2_expected_layers_5_tiers.sql
-- =========================================================================


-- =========================================================================
-- START: 0022_p2_regulatory_data_and_audit.sql
-- =========================================================================

-- Migration: 0022_p2_regulatory_data_and_audit
-- Description: Seed YMYL regulatory references and add forbidden_keywords column to ymyl_regulatory_references.

-- 1. Add forbidden_keywords column if not exists
ALTER TABLE ymyl_regulatory_references ADD COLUMN IF NOT EXISTS forbidden_keywords text[] DEFAULT '{}';

-- 2. Insert stable YMYL regulatory references
INSERT INTO ymyl_regulatory_references (id, agency, article_code, safety_guideline, forbidden_keywords)
VALUES 
  (
    '11111111-1111-1111-a111-111111111111', 
    '식약처', 
    '화장품 표시광고 가이드라인', 
    '화장품 표시광고 가이드라인: 의학적 효능 오인 유발 표현 금지 및 저자극 테스트 완료 증빙 명시 필요.', 
    ARRAY['아토피 치료', '습진 완치', '피부 재생 보장']
  ),
  (
    '22222222-2222-2222-a222-222222222222', 
    '보건복지부', 
    '의료법 제56조', 
    '의료법 제56조 의료광고 가이드라인: 전문의 자격 여부 명확 표기 및 시술 전 동의서 및 부작용 가능성 명시 의무.', 
    ARRAY['부작용 없다고 단정', '부작용 전혀 없음', '완벽한 해결책']
  ),
  (
    '33333333-3333-3333-a333-333333333333', 
    '금융위원회', 
    '금융소비자보호법 제19조', 
    '금융소비자보호법 제19조: 연금저축펀드 가입 시 원금 손실 가능성 및 중도해지 시 과세 조건 명시 의무.', 
    ARRAY['원금보장 오도', '확정수익 보장', '100% 보장']
  ),
  (
    '44444444-4444-4444-a444-444444444444', 
    '공정거래위원회', 
    '표시광고법 제3조', 
    '공정거래위원회 표시광고법 제3조: 인테리어 지체상금 및 하자보증이행보험 가입 조건에 대한 명확한 계약 기준 명시.', 
    ARRAY['임의 계약 해제 불가 조항', '추가 자재비 자동 청구']
  )
ON CONFLICT (id) DO UPDATE SET
  agency = EXCLUDED.agency,
  article_code = EXCLUDED.article_code,
  safety_guideline = EXCLUDED.safety_guideline,
  forbidden_keywords = EXCLUDED.forbidden_keywords;


-- =========================================================================
-- END: 0022_p2_regulatory_data_and_audit.sql
-- =========================================================================


-- =========================================================================
-- START: 0023_concept_fidelity_judges.sql
-- =========================================================================

-- Migration 0023: Concept Fidelity Judges
-- Created at 2026-05-28

-- 1. concept_extraction_results: ConceptExtractor Judge 결과
CREATE TABLE concept_extraction_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  probe_run_id UUID REFERENCES probe_runs(id) ON DELETE CASCADE NOT NULL,
  extracted_concepts JSONB NOT NULL,
  extracted_relations JSONB DEFAULT '[]'::jsonb,
  extracted_claims JSONB DEFAULT '[]'::jsonb,
  judge_model VARCHAR(100) DEFAULT 'gemini-2.5-flash',
  judge_temperature NUMERIC(3,2) DEFAULT 0.0,
  raw_judge_output TEXT,  -- 감사용 원시 LLM 출력 보관
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. fidelity_judgments: Brand Concept Fidelity Judge 결과
CREATE TABLE fidelity_judgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  probe_run_id UUID REFERENCES probe_runs(id) ON DELETE CASCADE NOT NULL,
  concept_extraction_id UUID REFERENCES concept_extraction_results(id),
  brand_concept_fidelity NUMERIC(5,4) NOT NULL,
  concept_transfer NUMERIC(5,4),
  relation_accuracy NUMERIC(5,4),
  differentiation_preservation NUMERIC(5,4),
  evidence_binding NUMERIC(5,4),
  forbidden_suppression NUMERIC(5,4),
  policy_alignment NUMERIC(5,4),
  main_issue TEXT,
  grade CHAR(1) NOT NULL CHECK (grade IN ('A','B','C','D','F')),
  raw_judge_output TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. distortion_judgments: Concept Distortion Judge 결과
CREATE TABLE distortion_judgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  probe_run_id UUID REFERENCES probe_runs(id) ON DELETE CASCADE NOT NULL,
  concept_extraction_id UUID REFERENCES concept_extraction_results(id),
  distortions JSONB NOT NULL DEFAULT '[]'::jsonb,
  concept_distortion_rate NUMERIC(5,4) NOT NULL DEFAULT 0,
  severity_weighted_rate NUMERIC(5,4) DEFAULT 0,
  raw_judge_output TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. hallucination_judgments: Hallucination Judge 결과
CREATE TABLE hallucination_judgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  probe_run_id UUID REFERENCES probe_runs(id) ON DELETE CASCADE NOT NULL,
  concept_extraction_id UUID REFERENCES concept_extraction_results(id),
  claims JSONB NOT NULL DEFAULT '[]'::jsonb,
  hallucinated_concept_rate NUMERIC(5,4) NOT NULL DEFAULT 0,
  critical_count INTEGER DEFAULT 0,
  raw_judge_output TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. risk_judgments: Floor Risk Judge 결과
CREATE TABLE risk_judgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  probe_run_id UUID REFERENCES probe_runs(id) ON DELETE CASCADE NOT NULL,
  risk_score NUMERIC(5,4) NOT NULL DEFAULT 0,
  hallucination_risk NUMERIC(5,4) DEFAULT 0,
  brand_distortion_risk NUMERIC(5,4) DEFAULT 0,
  critical_missing_risk NUMERIC(5,4) DEFAULT 0,
  unsafe_cta_risk NUMERIC(5,4) DEFAULT 0,
  evidence_omission_risk NUMERIC(5,4) DEFAULT 0,
  regulated_claim_risk NUMERIC(5,4) DEFAULT 0,
  trust_damage_risk NUMERIC(5,4) DEFAULT 0,
  floor_reason TEXT,
  raw_judge_output TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. policy_judgments: Policy Alignment Judge 결과
CREATE TABLE policy_judgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  probe_run_id UUID REFERENCES probe_runs(id) ON DELETE CASCADE NOT NULL,
  policy_alignment NUMERIC(5,4) NOT NULL DEFAULT 0,
  answer_policy NUMERIC(5,4) DEFAULT 0,
  cta_policy NUMERIC(5,4) DEFAULT 0,
  evidence_policy NUMERIC(5,4) DEFAULT 0,
  safety_policy NUMERIC(5,4) DEFAULT 0,
  brand_tone NUMERIC(5,4) DEFAULT 0,
  violations JSONB DEFAULT '[]'::jsonb,
  raw_judge_output TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE concept_extraction_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE fidelity_judgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE distortion_judgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE hallucination_judgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_judgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_judgments ENABLE ROW LEVEL SECURITY;

-- RLS Policies (workspace 격리)
CREATE POLICY cer_rls ON concept_extraction_results
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY fj_rls ON fidelity_judgments
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY dj_rls ON distortion_judgments
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY hj_rls ON hallucination_judgments
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY rj_rls ON risk_judgments
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY pj_rls ON policy_judgments
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

-- Indexes
CREATE INDEX idx_cer_probe_run ON concept_extraction_results(probe_run_id);
CREATE INDEX idx_cer_workspace ON concept_extraction_results(workspace_id);
CREATE INDEX idx_fj_probe_run ON fidelity_judgments(probe_run_id);
CREATE INDEX idx_dj_probe_run ON distortion_judgments(probe_run_id);
CREATE INDEX idx_hj_probe_run ON hallucination_judgments(probe_run_id);
CREATE INDEX idx_rj_probe_run ON risk_judgments(probe_run_id);
CREATE INDEX idx_pj_probe_run ON policy_judgments(probe_run_id);


-- =========================================================================
-- END: 0023_concept_fidelity_judges.sql
-- =========================================================================


-- =========================================================================
-- START: 0024_concept_fidelity_aggregates.sql
-- =========================================================================

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


-- =========================================================================
-- END: 0024_concept_fidelity_aggregates.sql
-- =========================================================================


-- =========================================================================
-- START: 0025_experiment_run_config.sql
-- =========================================================================

-- Migration 0025: Experiment Run Config
-- Created at 2026-05-28

-- probe_panels에 반복 실행 설정 컬럼 추가
ALTER TABLE probe_panels
  ADD COLUMN IF NOT EXISTS repetitions_per_query INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS generation_temperature NUMERIC(3,2) DEFAULT 0.2,
  ADD COLUMN IF NOT EXISTS judge_temperature NUMERIC(3,2) DEFAULT 0.0;

-- ai_observation_runs에 실험 조건 컬럼 추가
ALTER TABLE ai_observation_runs
  ADD COLUMN IF NOT EXISTS condition VARCHAR(50) DEFAULT 'baseline',
  ADD COLUMN IF NOT EXISTS experiment_id UUID REFERENCES experiment_runs(id),
  ADD COLUMN IF NOT EXISTS repetition_index INTEGER DEFAULT 1;

-- benchmark_reports에 리포트 타입 추가
ALTER TABLE benchmark_reports
  ADD COLUMN IF NOT EXISTS report_type VARCHAR(50) DEFAULT 'benchmark';


-- =========================================================================
-- END: 0025_experiment_run_config.sql
-- =========================================================================


-- =========================================================================
-- START: 0026_kculture_module.sql
-- =========================================================================

-- Migration 0026: K-Culture Intelligence OS Hybrid Module Integration
-- Created at 2026-05-29

-- 1. Organizations & Organization Memberships (Scalability Layer)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organization_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- 2. Alter workspaces to support organization structure and module_type
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS module_type VARCHAR(50) DEFAULT 'brand' CHECK (module_type IN ('brand', 'kculture', 'hybrid'));

-- 3. Extend existing domain_packs table with K-Culture specific schema fields
ALTER TABLE domain_packs ADD COLUMN IF NOT EXISTS slug VARCHAR(100);
ALTER TABLE domain_packs ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE domain_packs ADD COLUMN IF NOT EXISTS version VARCHAR(50) DEFAULT '0.1' NOT NULL;
ALTER TABLE domain_packs ADD COLUMN IF NOT EXISTS supported_languages VARCHAR(50)[] DEFAULT '{ko,en}'::VARCHAR(50)[];
ALTER TABLE domain_packs ADD COLUMN IF NOT EXISTS concept_types JSONB DEFAULT '[]'::jsonb;
ALTER TABLE domain_packs ADD COLUMN IF NOT EXISTS rating_axes JSONB DEFAULT '[]'::jsonb;
ALTER TABLE domain_packs ADD COLUMN IF NOT EXISTS forbidden_patterns JSONB DEFAULT '[]'::jsonb;
ALTER TABLE domain_packs ADD COLUMN IF NOT EXISTS risk_policies JSONB DEFAULT '{}'::jsonb;
ALTER TABLE domain_packs ADD COLUMN IF NOT EXISTS default_qbs_templates JSONB DEFAULT '[]'::jsonb;
ALTER TABLE domain_packs ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft','active','archived'));

-- 4. Create cultural_concepts table
CREATE TABLE IF NOT EXISTS cultural_concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  domain_pack_id UUID REFERENCES domain_packs(id) ON DELETE CASCADE NOT NULL,
  concept_id VARCHAR(100) NOT NULL,
  version VARCHAR(50) DEFAULT '0.1',
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft','expert_review','active','deprecated')),
  preferred_label JSONB NOT NULL,       -- {ko: "...", en: "..."}
  aliases JSONB DEFAULT '{}'::jsonb,
  concept_type VARCHAR(100) NOT NULL,
  definition TEXT,
  defining_attributes JSONB DEFAULT '[]'::jsonb,
  boundary_conditions JSONB DEFAULT '{}'::jsonb,
  parent_concepts VARCHAR(100)[] DEFAULT '{}'::VARCHAR(100)[],
  relation_edges JSONB DEFAULT '[]'::jsonb,
  affective_vector JSONB DEFAULT '{}'::jsonb,
  risk_vector JSONB DEFAULT '{}'::jsonb,
  commerce_vector JSONB DEFAULT '{}'::jsonb,
  identity_vector JSONB DEFAULT '{}'::jsonb,
  evidence_sources JSONB DEFAULT '[]'::jsonb,
  action_policies JSONB DEFAULT '{}'::jsonb,
  created_by VARCHAR(255),
  reviewed_by VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, domain_pack_id, concept_id, version)
);

-- 5. Create cultural_opportunities table
CREATE TABLE IF NOT EXISTS cultural_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  domain_pack_id UUID REFERENCES domain_packs(id) ON DELETE SET NULL,
  opportunity_type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  target_market VARCHAR(100),
  target_microgroup VARCHAR(100),
  linked_concepts VARCHAR(100)[] DEFAULT '{}'::VARCHAR(100)[],
  resonance_score NUMERIC(5,4),
  commercial_transferability NUMERIC(5,4),
  risk_score NUMERIC(5,4),
  recommended_actions JSONB DEFAULT '[]'::jsonb,
  source_evidence JSONB DEFAULT '{}'::jsonb,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft','reviewed','approved','archived')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Create human_reviews table
CREATE TABLE IF NOT EXISTS human_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  object_type VARCHAR(100) NOT NULL,
  object_id UUID NOT NULL,
  reviewer_id VARCHAR(255),
  review_status VARCHAR(50) NOT NULL CHECK (review_status IN ('approved','corrected','rejected','needs_discussion')),
  comments TEXT,
  correction_payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. RLS configuration
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE cultural_concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cultural_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE human_reviews ENABLE ROW LEVEL SECURITY;

-- Helper for organization membership RLS checking
CREATE OR REPLACE FUNCTION is_org_member(target_org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_memberships
    WHERE organization_id = target_org_id 
      AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Organization tables RLS policies
CREATE POLICY orgs_member_policy ON organizations
  FOR ALL USING (is_org_member(id));

CREATE POLICY org_memberships_read_policy ON organization_memberships
  FOR SELECT USING (is_org_member(organization_id));

-- Workspace-bound tables RLS policies
CREATE POLICY cultural_concepts_rls ON cultural_concepts
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY cultural_opps_rls ON cultural_opportunities
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY human_reviews_rls ON human_reviews
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

-- 8. Alter existing tables for K-Culture requirements
ALTER TABLE probe_questions ADD COLUMN IF NOT EXISTS target_market VARCHAR(100);
ALTER TABLE probe_questions ADD COLUMN IF NOT EXISTS target_microgroup VARCHAR(100);
ALTER TABLE probe_questions ADD COLUMN IF NOT EXISTS required_concepts VARCHAR(100)[] DEFAULT '{}'::VARCHAR(100)[];
ALTER TABLE probe_questions ADD COLUMN IF NOT EXISTS forbidden_concepts VARCHAR(100)[] DEFAULT '{}'::VARCHAR(100)[];
ALTER TABLE probe_questions ADD COLUMN IF NOT EXISTS domain_pack_id UUID REFERENCES domain_packs(id) ON DELETE SET NULL;

ALTER TABLE concept_fidelity_snapshots ADD COLUMN IF NOT EXISTS cross_cultural_resonance NUMERIC(5,4);
ALTER TABLE concept_fidelity_snapshots ADD COLUMN IF NOT EXISTS commercial_transferability NUMERIC(5,4);

-- 9. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cultural_concepts_workspace ON cultural_concepts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_cultural_concepts_domain_pack ON cultural_concepts(domain_pack_id);
CREATE INDEX IF NOT EXISTS idx_cultural_opps_workspace ON cultural_opportunities(workspace_id);
CREATE INDEX IF NOT EXISTS idx_human_reviews_workspace ON human_reviews(workspace_id);


-- =========================================================================
-- END: 0026_kculture_module.sql
-- =========================================================================


-- =========================================================================
-- START: 0027_aeo_surface_auditor.sql
-- =========================================================================

-- Migration 0027: AEO/GEO Surface Auditor Table Integration
-- Created at 2026-06-03

-- 1. Create industry_benchmark_snapshots
CREATE TABLE IF NOT EXISTS industry_benchmark_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  domain_slug VARCHAR(100) NOT NULL,
  brand_slug VARCHAR(100) NOT NULL,
  brand_name VARCHAR(200) NOT NULL,
  engine_name VARCHAR(100) NOT NULL,
  aas NUMERIC(5,2) DEFAULT 0.0 NOT NULL,
  ocr NUMERIC(5,2) DEFAULT 0.0 NOT NULL,
  bsf NUMERIC(5,2) DEFAULT NULL,
  ars NUMERIC(5,2) DEFAULT NULL,
  bair NUMERIC(5,2) DEFAULT NULL,
  bdr NUMERIC(5,2) DEFAULT NULL,
  cwr NUMERIC(5,2) DEFAULT NULL,
  iri NUMERIC(5,2) DEFAULT NULL,
  opp NUMERIC(5,2) DEFAULT NULL,
  mention_count INTEGER DEFAULT 0 NOT NULL,
  citation_count INTEGER DEFAULT 0 NOT NULL,
  sample_size INTEGER DEFAULT 0 NOT NULL,
  measurement_type VARCHAR(50) NOT NULL CHECK (measurement_type IN ('daily_light', 'weekly_full', 'monthly_deep')),
  measured_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create surface_entities
CREATE TABLE IF NOT EXISTS surface_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  website_url TEXT NOT NULL,
  source_page_url TEXT NOT NULL,
  surface_type VARCHAR(50) NOT NULL CHECK (surface_type IN ('factoid', 'procedural', 'comparative', 'authority', 'schema_org', 'topical_cluster', 'local_geo')),
  entity_name VARCHAR(500) NOT NULL,
  entity_content JSONB DEFAULT '{}'::jsonb NOT NULL,
  linked_claim_node_id UUID REFERENCES claim_nodes(id) ON DELETE SET NULL,
  linked_rep_object_id UUID REFERENCES representation_objects(id) ON DELETE SET NULL,
  linked_tco_concept_id UUID REFERENCES tco_concepts(id) ON DELETE SET NULL,
  linked_evidence_item_id UUID REFERENCES evidence_items(id) ON DELETE SET NULL,
  linked_schema_mapping_id UUID REFERENCES schema_mappings(id) ON DELETE SET NULL,
  completeness_score NUMERIC(5,2) DEFAULT 0.0 NOT NULL,
  eeat_strength NUMERIC(5,2) DEFAULT 0.0 NOT NULL,
  has_schema_support BOOLEAN DEFAULT false NOT NULL,
  extraction_model VARCHAR(100) DEFAULT 'gemini-flash' NOT NULL,
  extraction_confidence NUMERIC(5,2) DEFAULT 0.0 NOT NULL,
  extracted_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create reversed_answer_cards
CREATE TABLE IF NOT EXISTS reversed_answer_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  website_url TEXT NOT NULL,
  card_type VARCHAR(50) NOT NULL CHECK (card_type IN ('direct_answer', 'how_to', 'comparison', 'list', 'faq', 'product', 'local')),
  headline VARCHAR(500) NOT NULL,
  trigger_queries TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  body_entity_ids UUID[] DEFAULT '{}'::UUID[] NOT NULL,
  source_page_urls TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  linked_canonical_question_id UUID REFERENCES canonical_questions(id) ON DELETE SET NULL,
  linked_qis_scene_ids UUID[] DEFAULT '{}'::UUID[] NOT NULL,
  completeness_score NUMERIC(5,2) DEFAULT 0.0 NOT NULL,
  eeat_strength NUMERIC(5,2) DEFAULT 0.0 NOT NULL,
  schema_support_level VARCHAR(50) DEFAULT 'none' CHECK (schema_support_level IN ('full', 'partial', 'none')) NOT NULL,
  optimization_status VARCHAR(50) DEFAULT 'raw' CHECK (optimization_status IN ('optimized', 'partial', 'raw', 'missing')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create entity_reflection_snapshots
CREATE TABLE IF NOT EXISTS entity_reflection_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  website_url TEXT NOT NULL,
  engine_name VARCHAR(100) NOT NULL,
  err_factoid NUMERIC(5,2) DEFAULT 0.0 NOT NULL,
  err_procedural NUMERIC(5,2) DEFAULT 0.0 NOT NULL,
  err_comparative NUMERIC(5,2) DEFAULT 0.0 NOT NULL,
  err_authority NUMERIC(5,2) DEFAULT 0.0 NOT NULL,
  err_schema NUMERIC(5,2) DEFAULT 0.0 NOT NULL,
  err_topical NUMERIC(5,2) DEFAULT 0.0 NOT NULL,
  err_geo NUMERIC(5,2) DEFAULT 0.0 NOT NULL,
  aepi_score NUMERIC(5,2) DEFAULT 0.0 NOT NULL,
  tech_mod_score NUMERIC(5,2) DEFAULT 0.0 NOT NULL,
  eeat_mod_score NUMERIC(5,2) DEFAULT 0.0 NOT NULL,
  tech_audit JSONB DEFAULT '{}'::jsonb NOT NULL,
  eeat_audit JSONB DEFAULT '{}'::jsonb NOT NULL,
  total_entities_checked INTEGER DEFAULT 0 NOT NULL,
  total_entities_reflected INTEGER DEFAULT 0 NOT NULL,
  measured_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Create observed_parametric_personas
CREATE TABLE IF NOT EXISTS observed_parametric_personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  website_url TEXT NOT NULL,
  engine_name VARCHAR(100) NOT NULL,
  linked_persona_spec_id UUID REFERENCES persona_specs(id) ON DELETE SET NULL,
  linked_vibe_spec_id UUID REFERENCES vibe_specs(id) ON DELETE SET NULL,
  tone_warmth NUMERIC(3,2) DEFAULT 0.5 NOT NULL,
  tone_formality NUMERIC(3,2) DEFAULT 0.5 NOT NULL,
  tone_confidence NUMERIC(3,2) DEFAULT 0.5 NOT NULL,
  tone_expertise NUMERIC(3,2) DEFAULT 0.5 NOT NULL,
  tone_empathy NUMERIC(3,2) DEFAULT 0.5 NOT NULL,
  brand_term_usage NUMERIC(5,2) DEFAULT 0.0 NOT NULL,
  technical_term_ratio NUMERIC(5,2) DEFAULT 0.0 NOT NULL,
  hedging_ratio NUMERIC(5,2) DEFAULT 0.0 NOT NULL,
  category_placement VARCHAR(255) DEFAULT '' NOT NULL,
  competitive_frame VARCHAR(255)[] DEFAULT '{}'::VARCHAR(255)[] NOT NULL,
  sentiment_valence NUMERIC(3,2) DEFAULT 0.0 NOT NULL,
  recommendation_strength NUMERIC(5,2) DEFAULT 0.0 NOT NULL,
  persona_alignment_score NUMERIC(5,2) DEFAULT NULL,
  vibe_alignment_score NUMERIC(5,2) DEFAULT NULL,
  analysis_details JSONB DEFAULT '{}'::jsonb NOT NULL,
  sample_size INTEGER DEFAULT 0 NOT NULL,
  measured_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Create surface_gap_analyses
CREATE TABLE IF NOT EXISTS surface_gap_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  website_url TEXT NOT NULL,
  entity_name VARCHAR(500) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  quadrant VARCHAR(50) NOT NULL CHECK (quadrant IN ('green', 'yellow', 'red', 'white')),
  industry_qis_layer VARCHAR(50) DEFAULT NULL,
  linked_canonical_question_id UUID REFERENCES canonical_questions(id) ON DELETE SET NULL,
  linked_surface_entity_id UUID REFERENCES surface_entities(id) ON DELETE SET NULL,
  prescription_type VARCHAR(100) DEFAULT NULL CHECK (prescription_type IN ('add_schema', 'improve_heading', 'add_eeat_signal', 'create_content', 'improve_internal_linking', 'add_faq_markup', 'improve_meta', 'opportunity_content')),
  prescription_detail TEXT DEFAULT NULL,
  estimated_aepi_impact NUMERIC(5,2) DEFAULT 0.0 NOT NULL,
  priority_score NUMERIC(5,2) DEFAULT 0.0 NOT NULL,
  analyzed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Enable RLS
ALTER TABLE industry_benchmark_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE surface_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE reversed_answer_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_reflection_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE observed_parametric_personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE surface_gap_analyses ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies
CREATE POLICY benchmark_snapshots_rls ON industry_benchmark_snapshots
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY surface_entities_rls ON surface_entities
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY reversed_cards_rls ON reversed_answer_cards
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY reflection_snapshots_rls ON entity_reflection_snapshots
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY observed_personas_rls ON observed_parametric_personas
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY gap_analyses_rls ON surface_gap_analyses
  FOR ALL USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

-- 9. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_benchmark_snapshots_workspace ON industry_benchmark_snapshots(workspace_id);
CREATE INDEX IF NOT EXISTS idx_benchmark_snapshots_domain ON industry_benchmark_snapshots(domain_slug);
CREATE INDEX IF NOT EXISTS idx_surface_entities_workspace ON surface_entities(workspace_id);
CREATE INDEX IF NOT EXISTS idx_reversed_cards_workspace ON reversed_answer_cards(workspace_id);
CREATE INDEX IF NOT EXISTS idx_reflection_snapshots_workspace ON entity_reflection_snapshots(workspace_id);
CREATE INDEX IF NOT EXISTS idx_observed_personas_workspace ON observed_parametric_personas(workspace_id);
CREATE INDEX IF NOT EXISTS idx_gap_analyses_workspace ON surface_gap_analyses(workspace_id);


-- =========================================================================
-- END: 0027_aeo_surface_auditor.sql
-- =========================================================================

