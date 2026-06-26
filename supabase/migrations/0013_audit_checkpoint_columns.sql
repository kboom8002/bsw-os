-- 0013_audit_checkpoint_columns.sql
-- 단계별 감사 실행에 필요한 audit_sessions 컬럼 추가

DO $$
BEGIN
  -- checkpoint_data: 각 step의 중간 결과를 저장 (run-step API에서 사용)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_sessions' AND column_name = 'checkpoint_data') THEN
    ALTER TABLE public.audit_sessions ADD COLUMN checkpoint_data JSONB DEFAULT '{}'::jsonb;
  END IF;

  -- competitors: 경쟁사 URL 목록
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_sessions' AND column_name = 'competitors') THEN
    ALTER TABLE public.audit_sessions ADD COLUMN competitors JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- last_checkpoint_step: 마지막으로 완료된 step 번호 (이어하기 시 사용)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_sessions' AND column_name = 'last_checkpoint_step') THEN
    ALTER TABLE public.audit_sessions ADD COLUMN last_checkpoint_step INTEGER DEFAULT 0;
  END IF;
END $$;
