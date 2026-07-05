-- Migration 0034_qpa_os_schema_expansion.sql
-- Module: QPA-OS Database Schema Expansion

-- 1. question_signals 테이블 확장
ALTER TABLE question_signals
  ADD COLUMN IF NOT EXISTS domain_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS source_type VARCHAR(100) DEFAULT 'manual_input',
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS raw_question TEXT,
  ADD COLUMN IF NOT EXISTS normalized_question TEXT,
  ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'ko',
  ADD COLUMN IF NOT EXISTS locale VARCHAR(10),
  ADD COLUMN IF NOT EXISTS persona VARCHAR(100),
  ADD COLUMN IF NOT EXISTS journey_stage VARCHAR(100),
  ADD COLUMN IF NOT EXISTS source_payload JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS extracted_entities JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS qvs_scores JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS cps_score DECIMAL(5,4),
  ADD COLUMN IF NOT EXISTS gate_status VARCHAR(50) DEFAULT 'unscored',
  ADD COLUMN IF NOT EXISTS duplicate_cluster_id UUID,
  ADD COLUMN IF NOT EXISTS scored_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS promoted_at TIMESTAMPTZ;

-- 2. question_clusters 테이블 생성
CREATE TABLE IF NOT EXISTS question_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  domain_id VARCHAR(100),
  cluster_label TEXT,
  representative_question TEXT,
  signal_count INTEGER DEFAULT 0,
  embedding VECTOR(768),
  dominant_intents JSONB DEFAULT '[]'::jsonb,
  dominant_entities JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. tco_concepts 테이블 확장 (tco_entities 개념 통합)
ALTER TABLE tco_concepts
  ADD COLUMN IF NOT EXISTS aliases JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS activation_condition JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS boundary JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS operator JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS risk_vector JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS action_policy JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 4. canonical_questions 테이블 확장
ALTER TABLE canonical_questions
  ADD COLUMN IF NOT EXISTS domain_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS primary_intent VARCHAR(100),
  ADD COLUMN IF NOT EXISTS user_context JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS constraints JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS evidence_need JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS risk_level VARCHAR(50) DEFAULT 'low',
  ADD COLUMN IF NOT EXISTS preferred_answer_type JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS linked_tco_entities JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS qvs_summary JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS cps_score DECIMAL(5,4),
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 5. qis_scenes 테이블 확장
ALTER TABLE qis_scenes
  ADD COLUMN IF NOT EXISTS domain_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS context_tensor JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS evidence_requirements JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS risk_policy JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS answer_policy JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS cta_policy JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS must_do JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS must_not_do JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS output_targets JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS readiness_score DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- RLS 정책 설정
ALTER TABLE question_clusters ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (안전성 확보)
DROP POLICY IF EXISTS clusters_read_policy ON question_clusters;
DROP POLICY IF EXISTS clusters_mutation_policy ON question_clusters;

CREATE POLICY clusters_read_policy ON question_clusters
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY clusters_mutation_policy ON question_clusters
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist', 'semantic_architect']))
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist', 'semantic_architect']));

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_signals_cluster ON question_signals(duplicate_cluster_id);
CREATE INDEX IF NOT EXISTS idx_clusters_workspace ON question_clusters(workspace_id);
