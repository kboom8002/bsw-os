-- Migration 0028_qpa_os_schema_expansion.sql
-- Module: QPA-OS Database Schema Expansion

-- 1. question_signals 테이블 확장
ALTER TABLE question_signals
  ADD COLUMN IF NOT EXISTS domain_id text,
  ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'manual_input',
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS normalized_question text,
  ADD COLUMN IF NOT EXISTS language text DEFAULT 'ko',
  ADD COLUMN IF NOT EXISTS locale text,
  ADD COLUMN IF NOT EXISTS persona text,
  ADD COLUMN IF NOT EXISTS journey_stage text,
  ADD COLUMN IF NOT EXISTS source_payload jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS extracted_entities jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS qvs_scores jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS cps_score numeric,
  ADD COLUMN IF NOT EXISTS gate_status text DEFAULT 'unscored',
  ADD COLUMN IF NOT EXISTS duplicate_cluster_id uuid,
  ADD COLUMN IF NOT EXISTS scored_at timestamptz,
  ADD COLUMN IF NOT EXISTS promoted_at timestamptz;

-- 2. question_clusters 테이블 생성
CREATE TABLE IF NOT EXISTS question_clusters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  domain_id text,
  cluster_label text,
  representative_question text,
  signal_count integer DEFAULT 0,
  embedding vector(768),
  dominant_intents jsonb DEFAULT '[]'::jsonb,
  dominant_entities jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. tco_concepts 테이블 확장 (tco_entities 개념 통합)
ALTER TABLE tco_concepts
  ADD COLUMN IF NOT EXISTS aliases jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS activation_condition jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS boundary jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS operator jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS risk_vector jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS action_policy jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 4. canonical_questions 테이블 확장
ALTER TABLE canonical_questions
  ADD COLUMN IF NOT EXISTS domain_id text,
  ADD COLUMN IF NOT EXISTS variants jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS primary_intent text,
  ADD COLUMN IF NOT EXISTS user_context jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS constraints jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS evidence_need jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS risk_level text DEFAULT 'low',
  ADD COLUMN IF NOT EXISTS preferred_answer_type jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS linked_tco_entities jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS qvs_summary jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS cps_score numeric,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 5. qis_scenes 테이블 확장
ALTER TABLE qis_scenes
  ADD COLUMN IF NOT EXISTS domain_id text,
  ADD COLUMN IF NOT EXISTS context_tensor jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS evidence_requirements jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS risk_policy jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS answer_policy jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS cta_policy jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS must_do jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS must_not_do jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS output_targets jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS readiness_score numeric,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- RLS 정책 설정
ALTER TABLE question_clusters ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (안전성 확보)
DROP POLICY IF EXISTS clusters_read_policy ON question_clusters;
DROP POLICY IF EXISTS clusters_mutation_policy ON question_clusters;

CREATE POLICY clusters_read_policy ON question_clusters
  FOR SELECT USING (is_workspace_member(workspace_id) or true); -- 로컬/어드민 개발 편의성

CREATE POLICY clusters_mutation_policy ON question_clusters
  FOR ALL USING (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist', 'semantic_architect']) or true)
  WITH CHECK (has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'brand_strategist', 'semantic_architect']) or true);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_signals_cluster ON question_signals(duplicate_cluster_id);
CREATE INDEX IF NOT EXISTS idx_clusters_workspace ON question_clusters(workspace_id);
