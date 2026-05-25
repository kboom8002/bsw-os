-- Migration 0012: Embedding Model Upgrade
-- Author: Antigravity AI
-- Date: 2026-05-24

-- Alter the default model_name to text-embedding-3-large
ALTER TABLE embedding_cache 
  ALTER COLUMN model_name SET DEFAULT 'text-embedding-3-large';

-- Add dimensions and content_type columns to embedding_cache
ALTER TABLE embedding_cache
  ADD COLUMN IF NOT EXISTS dimensions INTEGER DEFAULT 3072,
  ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'page_body';

-- Indexing for composite lookup by workspace, content_type, and model_name
CREATE INDEX IF NOT EXISTS idx_embedding_cache_composite
  ON embedding_cache(workspace_id, content_type, model_name);

-- Add brand_guide_text column to vibe_specs to store unstructured brand vibe guidelines for real-time cosine similarity
ALTER TABLE vibe_specs
  ADD COLUMN IF NOT EXISTS brand_guide_text TEXT;
