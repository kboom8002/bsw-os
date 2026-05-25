-- Migration 0017_prediction_engine.sql
-- Module: Question Emergence Predictor (QEP)

-- 1. Create emergence_signals
CREATE TABLE emergence_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE, -- NULL = global/industry level signal
  source_type VARCHAR(50) NOT NULL, -- news, regulation, search_trend, community, seasonal, internal, broadcast
  industry VARCHAR(100) NOT NULL,
  raw_text TEXT NOT NULL,
  source_url TEXT,
  
  -- AI analysis
  ai_analysis JSONB DEFAULT '{}'::jsonb NOT NULL,
  predicted_impact VARCHAR(20) DEFAULT 'medium' NOT NULL, -- low, medium, high, critical
  
  detected_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  expires_at TIMESTAMPTZ,
  status VARCHAR(30) DEFAULT 'new' NOT NULL -- new, analyzed, archived
);

-- 2. Create predicted_questions
CREATE TABLE predicted_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE, -- NULL = global/industry level prediction
  signal_id UUID REFERENCES emergence_signals(id) ON DELETE SET NULL,
  
  question_text TEXT NOT NULL,
  question_variants TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  predicted_intent VARCHAR(100) NOT NULL,
  industry VARCHAR(100) NOT NULL,
  
  -- Prediction metadata
  predicted_volume VARCHAR(20) DEFAULT 'medium' NOT NULL, -- low, medium, high
  current_ai_coverage VARCHAR(20) DEFAULT 'none' NOT NULL, -- none, sparse, moderate, saturated
  first_mover_window_days INTEGER DEFAULT 30 NOT NULL,
  preemption_urgency VARCHAR(20) DEFAULT 'medium' NOT NULL, -- low, medium, high, critical
  confidence DECIMAL(3,2) DEFAULT 0.50 NOT NULL,
  
  -- Auto-generated Expected Layer
  auto_must_include TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  auto_should_include TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  auto_must_not_do TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  
  -- Post-verification (super-forecasting accuracy)
  actually_emerged BOOLEAN,
  emerged_at TIMESTAMPTZ,
  prediction_accuracy DECIMAL(3,2),
  
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Link Predicted Questions back to QVS
ALTER TABLE question_value_scores 
  ADD CONSTRAINT fk_qvs_predicted 
  FOREIGN KEY (predicted_question_id) 
  REFERENCES predicted_questions(id) ON DELETE CASCADE;

-- 4. Enable RLS
ALTER TABLE emergence_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE predicted_questions ENABLE ROW LEVEL SECURITY;

-- 5. Establish RLS Policies
CREATE POLICY signals_read ON emergence_signals
  FOR SELECT USING (workspace_id IS NULL OR is_workspace_member(workspace_id));

CREATE POLICY signals_write ON emergence_signals
  FOR ALL USING (workspace_id IS NOT NULL AND has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']))
  WITH CHECK (workspace_id IS NOT NULL AND has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']));

CREATE POLICY predictions_read ON predicted_questions
  FOR SELECT USING (workspace_id IS NULL OR is_workspace_member(workspace_id));

CREATE POLICY predictions_write ON predicted_questions
  FOR ALL USING (workspace_id IS NOT NULL AND has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']))
  WITH CHECK (workspace_id IS NOT NULL AND has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']));

-- 6. Indexes
CREATE INDEX idx_signals_industry ON emergence_signals(industry);
CREATE INDEX idx_signals_type ON emergence_signals(source_type);
CREATE INDEX idx_predictions_industry ON predicted_questions(industry);
CREATE INDEX idx_predictions_signal ON predicted_questions(signal_id);
