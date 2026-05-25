-- P0 Enhancement Migration: Question Lifecycle, TTL, Weight Calibration, Funnel Tracking
-- Depends on: 0014_probe_panel_extension.sql

-- 1. Question Lifecycle Status
DO $$ BEGIN
  CREATE TYPE question_lifecycle_status AS ENUM (
    'draft', 'review', 'active', 'deprecated', 'archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE probe_questions
  ADD COLUMN IF NOT EXISTS lifecycle_status question_lifecycle_status DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS lifecycle_changed_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS lifecycle_changed_by UUID,
  ADD COLUMN IF NOT EXISTS ttl_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_time_sensitive BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS base_weight NUMERIC(5,2) DEFAULT 1.00,
  ADD COLUMN IF NOT EXISTS calibrated_weight NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS last_calibrated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS funnel_stage TEXT DEFAULT 'intake';

-- 2. Question Funnel Tracking Table
CREATE TABLE IF NOT EXISTS question_funnel_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  probe_question_id UUID REFERENCES probe_questions(id),
  predicted_question_id UUID REFERENCES predicted_questions(id),
  from_stage TEXT NOT NULL,
  to_stage TEXT NOT NULL,
  event_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE question_funnel_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace isolation for funnel events"
  ON question_funnel_events FOR ALL
  USING (workspace_id = current_setting('app.workspace_id', true)::uuid);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_probe_questions_lifecycle
  ON probe_questions(workspace_id, lifecycle_status);

CREATE INDEX IF NOT EXISTS idx_probe_questions_ttl
  ON probe_questions(ttl_expires_at)
  WHERE ttl_expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_funnel_events_workspace
  ON question_funnel_events(workspace_id, created_at DESC);
