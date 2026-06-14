-- Migration 0009: Embedding Cache Layer
-- Author: Antigravity AI
-- Date: 2026-05-23

CREATE TABLE IF NOT EXISTS embedding_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  content_hash TEXT NOT NULL,
  embedding_vector JSONB NOT NULL,
  model_name TEXT NOT NULL DEFAULT 'text-embedding-004',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexing for high-performance lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_embedding_cache_hash 
  ON embedding_cache(workspace_id, content_hash, model_name);

-- Enable Row Level Security
ALTER TABLE embedding_cache ENABLE ROW LEVEL SECURITY;

-- Workspace access isolation RLS policies
CREATE POLICY "Members can view embedding cache inside their workspace"
  ON embedding_cache
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_memberships
      WHERE workspace_memberships.workspace_id = embedding_cache.workspace_id
        AND workspace_memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can insert embedding cache inside their workspace"
  ON embedding_cache
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_memberships
      WHERE workspace_memberships.workspace_id = embedding_cache.workspace_id
        AND workspace_memberships.user_id = auth.uid()
    )
  );
