-- supabase/migrations/0025_missing_tables_and_columns.sql
-- Part 1. Create entity_reflection_snapshots table if not exists (migrated from db/migrations/0027)
CREATE TABLE IF NOT EXISTS public.entity_reflection_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
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
  citation_rate NUMERIC DEFAULT 0.0,
  citation_positions JSONB DEFAULT '{}'::jsonb,
  competitor_mention_rate NUMERIC DEFAULT 0.0,
  competitor_details JSONB DEFAULT '[]'::jsonb,
  distortion_patterns JSONB DEFAULT '{}'::jsonb,
  measured_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS and create policy for entity_reflection_snapshots
ALTER TABLE public.entity_reflection_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for entity_reflection_snapshots" ON public.entity_reflection_snapshots FOR ALL USING (true);
CREATE INDEX IF NOT EXISTS idx_reflection_snapshots_workspace ON public.entity_reflection_snapshots(workspace_id);

-- Part 2. Create kg_nodes and claim_lineages tables to prevent seeding failures
CREATE TABLE IF NOT EXISTS public.kg_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  concept_id UUID REFERENCES public.tco_concepts(id) ON DELETE SET NULL,
  node_label VARCHAR(255) NOT NULL,
  attributes JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.kg_nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for kg_nodes" ON public.kg_nodes FOR ALL USING (true);
CREATE INDEX IF NOT EXISTS idx_kg_nodes_workspace ON public.kg_nodes(workspace_id);

CREATE TABLE IF NOT EXISTS public.claim_lineages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  claim_node_id UUID REFERENCES public.claim_nodes(id) ON DELETE CASCADE NOT NULL,
  evidence_item_id UUID REFERENCES public.evidence_items(id) ON DELETE SET NULL,
  boundary_rule_id UUID REFERENCES public.boundary_rules(id) ON DELETE SET NULL,
  is_publishable BOOLEAN DEFAULT false NOT NULL,
  verification_signature VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.claim_lineages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for claim_lineages" ON public.claim_lineages FOR ALL USING (true);
CREATE INDEX IF NOT EXISTS idx_claim_lineages_workspace ON public.claim_lineages(workspace_id);

-- Part 3. Alter columns to match schema definitions and bridge requirements
-- Alter question_signals: add source
ALTER TABLE public.question_signals ADD COLUMN IF NOT EXISTS source VARCHAR(100);

-- Alter claim_nodes: add risk_level, is_publishable, verification_signature
ALTER TABLE public.claim_nodes ADD COLUMN IF NOT EXISTS risk_level VARCHAR(50) DEFAULT 'low';
ALTER TABLE public.claim_nodes ADD COLUMN IF NOT EXISTS is_publishable BOOLEAN DEFAULT false;
ALTER TABLE public.claim_nodes ADD COLUMN IF NOT EXISTS verification_signature TEXT;

-- Alter question_capital_nodes: add s_score, last_s_score_calculated_at
ALTER TABLE public.question_capital_nodes ADD COLUMN IF NOT EXISTS s_score NUMERIC DEFAULT 0.0;
ALTER TABLE public.question_capital_nodes ADD COLUMN IF NOT EXISTS last_s_score_calculated_at TIMESTAMPTZ;
