-- Migration 0015_tenant_workspace_bridge.sql
-- Module: Tenant-Workspace Bridge for Multi-Tenant SaaS Integration

-- 1. Create Bridge Table
CREATE TABLE tenant_workspace_bridge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- AIHompyHub Tenant Entity (Soft Reference, no physical foreign key to cross-schema/cross-db table)
  aihompy_tenant_id UUID NOT NULL,
  aihompy_tenant_slug VARCHAR(100),
  aihompy_industry VARCHAR(100) NOT NULL, -- beauty, wedding, clinic...
  
  -- BSW-OS Workspace Entity (Physical Reference)
  bsw_workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  
  -- Sync state management
  sync_status VARCHAR(30) DEFAULT 'pending' NOT NULL, -- pending, active, paused, error
  last_synced_at TIMESTAMPTZ,
  sync_config JSONB DEFAULT '{}'::jsonb NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(aihompy_tenant_id),
  UNIQUE(bsw_workspace_id)
);

-- 2. Enable Row-Level Security
ALTER TABLE tenant_workspace_bridge ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
CREATE POLICY bridge_read ON tenant_workspace_bridge
  FOR SELECT USING (is_workspace_member(bsw_workspace_id));

CREATE POLICY bridge_write ON tenant_workspace_bridge
  FOR ALL USING (has_workspace_role(bsw_workspace_id, ARRAY['owner', 'admin', 'brand_strategist']))
  WITH CHECK (has_workspace_role(bsw_workspace_id, ARRAY['owner', 'admin', 'brand_strategist']));

-- 4. Create indexes
CREATE INDEX idx_bridge_tenant ON tenant_workspace_bridge(aihompy_tenant_id);
CREATE INDEX idx_bridge_workspace ON tenant_workspace_bridge(bsw_workspace_id);
