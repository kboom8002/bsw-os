-- Migration 0014_probe_panel_extension.sql
-- Module: Probe Panel & Question Metadata Extensions

-- 1. Extend probe_questions
ALTER TABLE probe_questions ADD COLUMN IF NOT EXISTS
  risk_level VARCHAR(20) DEFAULT 'low' NOT NULL;
ALTER TABLE probe_questions ADD COLUMN IF NOT EXISTS
  decision_stage VARCHAR(50); -- awareness, consideration, decision
ALTER TABLE probe_questions ADD COLUMN IF NOT EXISTS
  question_type VARCHAR(50); -- informational, comparison, recommendation...
ALTER TABLE probe_questions ADD COLUMN IF NOT EXISTS
  weight DECIMAL(3,2) DEFAULT 1.00 NOT NULL;
ALTER TABLE probe_questions ADD COLUMN IF NOT EXISTS
  query_variants TEXT[] DEFAULT '{}'::TEXT[] NOT NULL;

-- 2. Extend probe_panels
ALTER TABLE probe_panels ADD COLUMN IF NOT EXISTS
  industry VARCHAR(100); -- industry tag (e.g. beauty, wedding, clinic...)
ALTER TABLE probe_panels ADD COLUMN IF NOT EXISTS
  panel_type VARCHAR(50) DEFAULT 'standard' NOT NULL; -- standard, brand_specific, competitor_benchmark, retest, sbs_index
ALTER TABLE probe_panels ADD COLUMN IF NOT EXISTS
  sbs_index_target VARCHAR(50); -- 'AIPR', 'BAIR', 'AITI', 'KAIVI' etc.

-- 3. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_panel_industry ON probe_panels(industry);
CREATE INDEX IF NOT EXISTS idx_question_risk ON probe_questions(risk_level);
