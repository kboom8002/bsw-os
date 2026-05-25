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
