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
