-- 0029_client_deep_dive.sql
-- Client Deep Dive 모듈을 위한 스키마 확장 (월구독형, 2차 승인 프로세스 반영)

-- Deep Dive 세션 (고객이 요청한 심층 분석 단위)
CREATE TABLE IF NOT EXISTS deep_dive_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  brand_slug TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'diagnosing', 'discovered', 'blueprinted', 'simulated', 'completed')),
  diagnostic_snapshot JSONB,      -- Phase 1 결과
  subscription_tier TEXT DEFAULT 'pro_monthly', -- 월구독형 등급 표기
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- 타겟 QIS 후보 (Phase 2 산출물)
CREATE TABLE IF NOT EXISTS deep_dive_target_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES deep_dive_sessions(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  sources JSONB NOT NULL,           -- TargetQuestionCandidate.sources
  composite_priority NUMERIC(5,1) NOT NULL,
  eeat_dimension TEXT NOT NULL,
  current_ai_coverage TEXT NOT NULL,
  competitors_owning TEXT[] DEFAULT '{}',
  estimated_aepi_impact NUMERIC(5,1),
  estimated_bdr_delta NUMERIC(5,1),
  first_mover_window_days INT,
  
  -- 2차 승인 프로세스 (Admin Approval)
  admin_approval_status TEXT DEFAULT 'pending' 
    CHECK (admin_approval_status IN ('pending', 'approved', 'rejected')),
  admin_approved_by UUID, -- 관리자 ID
  admin_approved_at TIMESTAMPTZ,
  
  -- 실제 등록 후 참조
  registered_cq_id UUID REFERENCES canonical_questions(id),
  registered_qis_scene_ids UUID[] DEFAULT '{}',
  
  -- 사용자 결정
  user_decision TEXT DEFAULT 'pending'
    CHECK (user_decision IN ('pending', 'accepted', 'rejected', 'deferred')),
    
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 콘텐츠 블루프린트 (Phase 3 산출물)
CREATE TABLE IF NOT EXISTS deep_dive_content_blueprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES deep_dive_sessions(id) ON DELETE CASCADE,
  target_question_id UUID NOT NULL REFERENCES deep_dive_target_questions(id),
  target_cq_id UUID REFERENCES canonical_questions(id),
  content_type TEXT NOT NULL,
  title_suggestion_ko TEXT NOT NULL,
  heading_structure JSONB NOT NULL,
  expected_layer JSONB NOT NULL,
  schema_suggestions JSONB DEFAULT '[]',
  linked_evidence_ids UUID[] DEFAULT '{}',
  linked_claim_ids UUID[] DEFAULT '{}',
  linked_boundary_ids UUID[] DEFAULT '{}',
  prescription_source JSONB,
  estimated_aepi_impact NUMERIC(5,1),
  estimated_bdr_delta NUMERIC(5,1),
  priority_rank INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 효과 예측 시뮬레이션 (Phase 4 산출물)
CREATE TABLE IF NOT EXISTS deep_dive_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES deep_dive_sessions(id) ON DELETE CASCADE,
  current_snapshot JSONB NOT NULL,
  projected_snapshot JSONB NOT NULL,
  per_blueprint_contribution JSONB NOT NULL,
  scenarios JSONB NOT NULL,
  simulated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 정책 추가
ALTER TABLE deep_dive_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE deep_dive_target_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE deep_dive_content_blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE deep_dive_simulations ENABLE ROW LEVEL SECURITY;

-- Workspace 격리 정책
CREATE POLICY "Users can view their workspace deep dive sessions"
ON deep_dive_sessions FOR SELECT
USING (workspace_id IN (SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their workspace target questions"
ON deep_dive_target_questions FOR SELECT
USING (session_id IN (SELECT id FROM deep_dive_sessions WHERE workspace_id IN (SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid())));

CREATE POLICY "Users can view their workspace content blueprints"
ON deep_dive_content_blueprints FOR SELECT
USING (session_id IN (SELECT id FROM deep_dive_sessions WHERE workspace_id IN (SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid())));

CREATE POLICY "Users can view their workspace simulations"
ON deep_dive_simulations FOR SELECT
USING (session_id IN (SELECT id FROM deep_dive_sessions WHERE workspace_id IN (SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid())));
