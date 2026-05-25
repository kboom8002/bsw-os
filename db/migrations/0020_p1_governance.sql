-- P1 Governance Migration: Version Control & Explicit YMYL References
-- Depends on: 0019_p0_enhancements.sql

-- 1. Create YMYL Regulatory References Table
CREATE TABLE IF NOT EXISTS ymyl_regulatory_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency TEXT NOT NULL,
  article_code TEXT NOT NULL,
  safety_guideline TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ymyl_regulatory_references ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read for YMYL rules"
  ON ymyl_regulatory_references FOR SELECT
  USING (true);

-- 2. Alter probe_questions to include explicit YMYL tracking
ALTER TABLE probe_questions
  ADD COLUMN IF NOT EXISTS is_ymyl BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS regulatory_ref_id UUID REFERENCES ymyl_regulatory_references(id);

-- 3. Alter probe_panels to support version history self-references
ALTER TABLE probe_panels
  ADD COLUMN IF NOT EXISTS parent_panel_id UUID REFERENCES probe_panels(id),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 4. Create Indexes
CREATE INDEX IF NOT EXISTS idx_probe_questions_ymyl
  ON probe_questions(workspace_id, is_ymyl)
  WHERE is_ymyl = TRUE;

CREATE INDEX IF NOT EXISTS idx_probe_panels_parent
  ON probe_panels(parent_panel_id)
  WHERE parent_panel_id IS NOT NULL;
