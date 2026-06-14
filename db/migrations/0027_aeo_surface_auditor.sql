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
