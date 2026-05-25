-- Migration 0013: Crawler Providers Expansion
-- Author: Antigravity AI
-- Date: 2026-05-24

-- Add columns to probe_runs to store live search crawler data and source citations
ALTER TABLE probe_runs
  ADD COLUMN IF NOT EXISTS source_provider TEXT DEFAULT 'mock',
  ADD COLUMN IF NOT EXISTS citations JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS grounding_metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS raw_serp_data JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS crawler_latency_ms INTEGER DEFAULT 0;
