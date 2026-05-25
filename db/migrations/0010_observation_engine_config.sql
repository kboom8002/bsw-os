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
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = observation_engine_configs.workspace_id
        AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can modify observation engine configs inside their workspace"
  ON observation_engine_configs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = observation_engine_configs.workspace_id
        AND workspace_members.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = observation_engine_configs.workspace_id
        AND workspace_members.user_id = auth.uid()
    )
  );
