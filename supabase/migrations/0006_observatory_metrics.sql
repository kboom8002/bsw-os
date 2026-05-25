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
