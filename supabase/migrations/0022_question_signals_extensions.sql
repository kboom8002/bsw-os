-- supabase/migrations/0022_question_signals_extensions.sql

-- Part 1: question_signals 확장 컬럼
ALTER TABLE public.question_signals ADD COLUMN IF NOT EXISTS qvs_total NUMERIC(5,2);
ALTER TABLE public.question_signals ADD COLUMN IF NOT EXISTS qvs_dimensions JSONB DEFAULT '{}'::JSONB;
ALTER TABLE public.question_signals ADD COLUMN IF NOT EXISTS cps_score NUMERIC(5,2);
ALTER TABLE public.question_signals ADD COLUMN IF NOT EXISTS is_ymyl BOOLEAN DEFAULT false;
ALTER TABLE public.question_signals ADD COLUMN IF NOT EXISTS gate_status VARCHAR(20) DEFAULT 'Watch';
ALTER TABLE public.question_signals ADD COLUMN IF NOT EXISTS eval_confidence VARCHAR(20) DEFAULT 'medium';
ALTER TABLE public.question_signals ADD COLUMN IF NOT EXISTS panel_layer VARCHAR(20);
ALTER TABLE public.question_signals ADD COLUMN IF NOT EXISTS matched_tco_concepts TEXT[] DEFAULT '{}'::TEXT[];
ALTER TABLE public.question_signals ADD COLUMN IF NOT EXISTS matched_kg_nodes TEXT[] DEFAULT '{}'::TEXT[];

-- Part 2: signal_performance_tracking 테이블 신규 생성
CREATE TABLE IF NOT EXISTS public.signal_performance_tracking (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id            UUID REFERENCES public.question_signals(id) ON DELETE CASCADE NOT NULL,
  workspace_id         UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  promoted_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  impressions_30d      INTEGER DEFAULT 0,
  clicks_30d           INTEGER DEFAULT 0,
  ctr_30d              NUMERIC(5,4) DEFAULT 0,
  avg_position_30d     NUMERIC(5,2) DEFAULT NULL,
  ai_mention_rate      NUMERIC(5,4) DEFAULT 0,
  ai_mention_sources   TEXT[] DEFAULT '{}',
  actual_conversion    NUMERIC(5,4) DEFAULT 0,
  realized_value       NUMERIC(10,2) DEFAULT 0,
  realized_qvs_score   NUMERIC(5,3) DEFAULT NULL,
  measurement_period   VARCHAR(20) DEFAULT '30d',
  last_synced_at       TIMESTAMPTZ DEFAULT NULL,
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now(),
  UNIQUE(signal_id, measurement_period)
);

-- 인덱스 및 RLS
CREATE INDEX IF NOT EXISTS idx_signal_perf_ws ON public.signal_performance_tracking(workspace_id, promoted_at DESC);
CREATE INDEX IF NOT EXISTS idx_signal_perf_realized ON public.signal_performance_tracking(workspace_id, realized_qvs_score DESC NULLS LAST) WHERE realized_qvs_score IS NOT NULL;

ALTER TABLE public.signal_performance_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workspace_members_can_read_performance" ON public.signal_performance_tracking;
CREATE POLICY "workspace_members_can_read_performance" ON public.signal_performance_tracking
  FOR SELECT USING (is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "workspace_members_can_insert_performance" ON public.signal_performance_tracking;
CREATE POLICY "workspace_members_can_insert_performance" ON public.signal_performance_tracking
  FOR INSERT WITH CHECK (is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "workspace_members_can_update_performance" ON public.signal_performance_tracking;
CREATE POLICY "workspace_members_can_update_performance" ON public.signal_performance_tracking
  FOR UPDATE USING (is_workspace_member(workspace_id));

-- Trigger
CREATE OR REPLACE FUNCTION update_signal_performance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_signal_performance_updated_at ON public.signal_performance_tracking;
CREATE TRIGGER trg_signal_performance_updated_at
  BEFORE UPDATE ON public.signal_performance_tracking
  FOR EACH ROW EXECUTE FUNCTION update_signal_performance_updated_at();
