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
