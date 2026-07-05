-- supabase/migrations/0036_pipeline_state.sql
-- 파이프라인 중지/계속/리셋 지원을 위한 상태 관리 컬럼 추가

-- ─────────────────────────────────────────────────────────────
-- 1. pipeline_runs 테이블 컬럼 확장
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.pipeline_runs
  ADD COLUMN IF NOT EXISTS current_phase TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS phase_results JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS resume_from TEXT,
  ADD COLUMN IF NOT EXISTS pause_requested BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- status 컬럼에 paused, cancelled 상태 추가 (기존 CHECK 제약 제거 후 재생성)
DO $$
BEGIN
  -- 기존 CHECK 제약이 있으면 제거
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'pipeline_runs'
      AND constraint_type = 'CHECK'
      AND constraint_name LIKE '%pipeline_runs_status%'
  ) THEN
    ALTER TABLE public.pipeline_runs
      DROP CONSTRAINT IF EXISTS pipeline_runs_status_check;
  END IF;
END
$$;

-- 새 상태 포함하여 CHECK 제약 재생성
ALTER TABLE public.pipeline_runs
  ADD CONSTRAINT pipeline_runs_status_check
    CHECK (status IN ('pending', 'running', 'completed', 'failed', 'stale', 'paused', 'cancelled'));

-- ─────────────────────────────────────────────────────────────
-- 2. 인덱스 추가
-- ─────────────────────────────────────────────────────────────

-- pause_requested 플래그 빠른 조회용
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_pause_flag
  ON public.pipeline_runs(id, pause_requested)
  WHERE pause_requested = true;

-- 도메인 + 상태 복합 인덱스 (이력 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_domain_status
  ON public.pipeline_runs(workspace_id, domain_key, status, started_at DESC);

-- ─────────────────────────────────────────────────────────────
-- 3. 코멘트
-- ─────────────────────────────────────────────────────────────

COMMENT ON COLUMN public.pipeline_runs.current_phase IS
  '현재 실행 중인 Phase 이름 (예: phase1_signals, phase3_promotions)';

COMMENT ON COLUMN public.pipeline_runs.phase_results IS
  '각 Phase별 실행 결과를 저장하는 JSONB. 체크포인트 역할.
   예: {"phase0_bootstrap": {"status":"completed","tcoConcepts":12,"completed_at":"..."}, ...}';

COMMENT ON COLUMN public.pipeline_runs.resume_from IS
  '재개 시 이 Phase부터 실행. null이면 처음부터 실행.
   이전 Phase 결과는 phase_results에서 로드됨.';

COMMENT ON COLUMN public.pipeline_runs.pause_requested IS
  'true이면 다음 Phase 시작 전에 파이프라인이 중지됨 (DB 플래그 방식).
   중지 후 false로 초기화됨.';

COMMENT ON COLUMN public.pipeline_runs.cancelled_at IS
  '파이프라인이 취소된 시각. null이면 취소되지 않음.';
