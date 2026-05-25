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
