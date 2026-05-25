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
