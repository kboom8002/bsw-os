-- Migration 0033_qis_advanced_columns.sql
-- Module: QIS Pipeline Advanced Columns & Performance Tracking
-- 목적:
--   1. question_signals 테이블에 QVS 8차원 평가, CPS, 게이트 상태, YMYL 플래그 컬럼 추가
--   2. signal_performance_tracking 테이블 신규 생성 (피드백 루프용)
-- 적용: Supabase SQL Editor 또는 CLI에서 실행
-- 주의: IF NOT EXISTS / IF EXISTS 구문 사용으로 재실행 안전 (idempotent)

-- ═══════════════════════════════════════════════════════════
-- Part 1: question_signals 확장 컬럼
-- ═══════════════════════════════════════════════════════════

-- 1-1. QVS 합산 점수 (8차원 가중합, 0~10 범위)
ALTER TABLE question_signals
  ADD COLUMN IF NOT EXISTS qvs_total NUMERIC(5,3) DEFAULT NULL;

COMMENT ON COLUMN question_signals.qvs_total IS
  'QVS 8차원 가중합 총점 (0~10). AHP 교정 가중치 기반. NULL = 미평가.';

-- 1-2. QVS 차원별 세부 점수 (JSON: {search_vol, comp_gap, intent_fit, snippet_fitness, entity_clarity, multi_engine, kg_coverage, ymyl_risk})
ALTER TABLE question_signals
  ADD COLUMN IF NOT EXISTS qvs_dimensions JSONB DEFAULT NULL;

COMMENT ON COLUMN question_signals.qvs_dimensions IS
  'QVS 8개 세부 차원 점수 JSON. signal-evaluator.ts의 QVS8DResult 타입과 대응.';

-- 1-3. CPS 복합 적합도 점수 (Content Positioning Score, 0~1)
ALTER TABLE question_signals
  ADD COLUMN IF NOT EXISTS cps_score NUMERIC(4,3) DEFAULT NULL;

COMMENT ON COLUMN question_signals.cps_score IS
  'Content Positioning Score. 검색볼륨×경쟁도역수×업종관련도 복합 지표 (0~1).';

-- 1-4. YMYL 플래그 (의료·법률·금융·안전 관련 콘텐츠)
ALTER TABLE question_signals
  ADD COLUMN IF NOT EXISTS is_ymyl BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN question_signals.is_ymyl IS
  'YMYL(Your Money Your Life) 해당 여부. TRUE이면 검수 임계값 상향 적용.';

-- 1-5. 게이트 판정 결과 (Go / Watch / No-Go)
ALTER TABLE question_signals
  ADD COLUMN IF NOT EXISTS gate_status VARCHAR(20) DEFAULT 'Watch';

COMMENT ON COLUMN question_signals.gate_status IS
  '적응적 게이트 판정 결과: Go(QVS≥7.0) | Watch(기본) | No-Go(QVS<3.0).';

-- 1-6. 평가 반복 신뢰도 (LLM 3회 평가의 표준편차 기반 신뢰 등급)
ALTER TABLE question_signals
  ADD COLUMN IF NOT EXISTS eval_confidence VARCHAR(20) DEFAULT NULL;

COMMENT ON COLUMN question_signals.eval_confidence IS
  '평가 신뢰도 등급: high(σ<0.5) | medium(σ<1.0) | low(σ≥1.0). NULL = 미평가.';

-- 1-7. 매칭된 TCO 개념 목록 (텍스트 배열)
ALTER TABLE question_signals
  ADD COLUMN IF NOT EXISTS matched_tco_concepts TEXT[] DEFAULT '{}';

COMMENT ON COLUMN question_signals.matched_tco_concepts IS
  '시그널 쿼리와 매칭된 TCO 개념 이름 목록. KG 커버리지 계산에 사용.';

-- 1-8. 매칭된 KG 노드 목록
ALTER TABLE question_signals
  ADD COLUMN IF NOT EXISTS matched_kg_nodes TEXT[] DEFAULT '{}';

COMMENT ON COLUMN question_signals.matched_kg_nodes IS
  '시그널 쿼리와 매칭된 온톨로지 KG 노드 이름 목록.';

-- 1-9. 패널 질문 레이어 (실측 질문 출처)
ALTER TABLE question_signals
  ADD COLUMN IF NOT EXISTS panel_layer VARCHAR(50) DEFAULT NULL;

COMMENT ON COLUMN question_signals.panel_layer IS
  '실측 패널 질문 레이어: L1_direct | L2_comparison | L3_experience | L4_expert | L5_ymyl. NULL = 오가닉 채굴.';

-- 1-10. 소스 정보 (채굴 경로)
ALTER TABLE question_signals
  ADD COLUMN IF NOT EXISTS source VARCHAR(100) DEFAULT NULL;

COMMENT ON COLUMN question_signals.source IS
  '시그널 소스: organic_mining | benchmark_gap | panel_nli | e2e_pipeline 등.';

-- ═══════════════════════════════════════════════════════════
-- Part 2: signal_performance_tracking 테이블 (피드백 루프)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS signal_performance_tracking (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id            UUID REFERENCES question_signals(id) ON DELETE CASCADE NOT NULL,
  workspace_id         UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  promoted_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- 검색 유입 성과 (30일 누적)
  impressions_30d      INTEGER DEFAULT 0,
  clicks_30d           INTEGER DEFAULT 0,
  ctr_30d              NUMERIC(5,4) DEFAULT 0,          -- clicks/impressions
  avg_position_30d     NUMERIC(5,2) DEFAULT NULL,       -- GSC 평균 순위
  -- AI 언급 성과
  ai_mention_rate      NUMERIC(5,4) DEFAULT 0,          -- AI 응답에서 언급 비율
  ai_mention_sources   TEXT[] DEFAULT '{}',             -- 언급된 AI 플랫폼 목록
  -- 전환 성과
  actual_conversion    NUMERIC(5,4) DEFAULT 0,          -- 검색→전환 비율
  realized_value       NUMERIC(10,2) DEFAULT 0,         -- 추정 가치 (원)
  -- QVS 가중치 역산용 점수 (학습 데이터)
  realized_qvs_score   NUMERIC(5,3) DEFAULT NULL,       -- 실제 성과로 역산된 QVS
  -- 메타
  measurement_period   VARCHAR(20) DEFAULT '30d',       -- 측정 기간
  last_synced_at       TIMESTAMPTZ DEFAULT NULL,        -- 마지막 외부 데이터 동기화 시각
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now(),
  -- 동일 시그널의 동일 측정 기간 중복 방지
  UNIQUE(signal_id, measurement_period)
);

COMMENT ON TABLE signal_performance_tracking IS
  '승격된 시그널의 실제 검색/AI 유입 성과 추적 테이블. '
  'QVS 가중치 OLS 역산 학습 데이터로 활용됨.';

-- 인덱스: workspace_id 기준 조회 성능
CREATE INDEX IF NOT EXISTS idx_signal_perf_ws
  ON signal_performance_tracking(workspace_id, promoted_at DESC);

-- 인덱스: 최신 데이터 역산 조회
CREATE INDEX IF NOT EXISTS idx_signal_perf_realized
  ON signal_performance_tracking(workspace_id, realized_qvs_score DESC NULLS LAST)
  WHERE realized_qvs_score IS NOT NULL;

-- ═══════════════════════════════════════════════════════════
-- Part 3: Row Level Security (RLS) 정책
-- ═══════════════════════════════════════════════════════════

-- signal_performance_tracking RLS
ALTER TABLE signal_performance_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workspace_members_can_read_performance" ON signal_performance_tracking;
CREATE POLICY "workspace_members_can_read_performance"
  ON signal_performance_tracking FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "workspace_members_can_insert_performance" ON signal_performance_tracking;
CREATE POLICY "workspace_members_can_insert_performance"
  ON signal_performance_tracking FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "workspace_members_can_update_performance" ON signal_performance_tracking;
CREATE POLICY "workspace_members_can_update_performance"
  ON signal_performance_tracking FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships
      WHERE user_id = auth.uid()
    )
  );

-- ═══════════════════════════════════════════════════════════
-- Part 4: question_signals 기존 RLS 정책에 새 컬럼 포함 확인
-- ═══════════════════════════════════════════════════════════
-- 기존 question_signals RLS는 컬럼 레벨이 아닌 ROW 레벨이므로
-- 새 컬럼은 자동으로 기존 정책 적용 범위에 포함됩니다.
-- 별도 정책 추가 불필요.

-- ═══════════════════════════════════════════════════════════
-- Part 5: updated_at 자동 갱신 트리거
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_signal_performance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_signal_performance_updated_at ON signal_performance_tracking;
CREATE TRIGGER trg_signal_performance_updated_at
  BEFORE UPDATE ON signal_performance_tracking
  FOR EACH ROW EXECUTE FUNCTION update_signal_performance_updated_at();

-- ═══════════════════════════════════════════════════════════
-- 완료 로그
-- ═══════════════════════════════════════════════════════════
-- Migration 0033 applied:
--   + question_signals: 10개 컬럼 추가 (qvs_total, qvs_dimensions, cps_score, is_ymyl, gate_status, eval_confidence, matched_tco_concepts, matched_kg_nodes, panel_layer, source)
--   + signal_performance_tracking: 신규 테이블 (15개 컬럼) + 2개 인덱스 + RLS 3개 정책
