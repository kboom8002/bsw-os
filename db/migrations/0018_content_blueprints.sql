-- Migration 0018_content_blueprints.sql
-- Module: Pre-emptive Content Factory (PCF)

-- 1. Create content_blueprints table
CREATE TABLE IF NOT EXISTS content_blueprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  predicted_question_id UUID REFERENCES predicted_questions(id) ON DELETE CASCADE NOT NULL,
  
  -- Recommended formats & guidelines
  recommended_structure VARCHAR(50) NOT NULL, -- qna, blog, guide, comparison
  recommended_schema JSONB DEFAULT '[]'::jsonb NOT NULL,
  recommended_length JSONB DEFAULT '{"min": 300, "max": 800, "optimal": 500}'::jsonb NOT NULL,
  required_eeat_level VARCHAR(30) DEFAULT 'basic' NOT NULL,
  
  -- Vibe constraints
  target_vpa DECIMAL(5,2) DEFAULT 75.00 NOT NULL,
  tone_guidelines TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  forbidden_expressions TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  brand_voice_keywords TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  
  -- Draft output
  draft_content TEXT,
  draft_vpa_score DECIMAL(5,2),
  
  -- Status tracking
  status VARCHAR(30) DEFAULT 'draft' NOT NULL, -- draft, verified, queued, published
  tenant_bridge_id UUID REFERENCES tenant_workspace_bridge(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Enable RLS
ALTER TABLE content_blueprints ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
CREATE POLICY blueprints_read ON content_blueprints
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY blueprints_write ON content_blueprints
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist']));

-- 4. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_blueprints_predicted ON content_blueprints(predicted_question_id);
CREATE INDEX IF NOT EXISTS idx_blueprints_status ON content_blueprints(status);
