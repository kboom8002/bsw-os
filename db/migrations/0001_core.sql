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
