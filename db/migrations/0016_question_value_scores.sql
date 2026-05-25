-- Migration 0016_question_value_scores.sql
-- Module: Question Value Scorer (QVS)

-- 1. Create Table
CREATE TABLE question_value_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  
  -- References (both optional since one of them is linked)
  probe_question_id UUID REFERENCES probe_questions(id) ON DELETE CASCADE,
  predicted_question_id UUID, -- Will link to predicted_questions in migration 0017
  
  -- Value indicators
  volume_score DECIMAL(5,2) DEFAULT 0.00 NOT NULL,
  conversion_score DECIMAL(5,2) DEFAULT 0.00 NOT NULL,
  arpu_score DECIMAL(5,2) DEFAULT 0.00 NOT NULL,
  first_mover_score DECIMAL(5,2) DEFAULT 1.00 NOT NULL,
  competition_score DECIMAL(5,2) DEFAULT 0.00 NOT NULL,
  
  -- Composite arithmetic scores
  qvs_composite DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
  estimated_monthly_value DECIMAL(12,2) DEFAULT 0.00 NOT NULL, -- in KRW
  preemption_deadline TIMESTAMPTZ,
  
  -- Meta
  industry VARCHAR(100) NOT NULL,
  scoring_method VARCHAR(50) DEFAULT 'auto' NOT NULL, -- auto, manual
  scored_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Enable RLS
ALTER TABLE question_value_scores ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
CREATE POLICY qvs_read ON question_value_scores
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY qvs_write ON question_value_scores
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']));

-- 4. Create Performance Indexes
CREATE INDEX idx_qvs_industry ON question_value_scores(industry);
CREATE INDEX idx_qvs_composite ON question_value_scores(qvs_composite DESC);
CREATE INDEX idx_qvs_probe ON question_value_scores(probe_question_id);
