-- supabase/migrations/0032_pipeline_management.sql
-- 시맨틱 코어 파이프라인 관리 테이블 생성

-- ─────────────────────────────────────────────────────────────
-- 1. 외부 시그널 수집 테이블
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.collection_sources (
  id TEXT PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT,
  source_type TEXT NOT NULL CHECK (source_type IN ('rss','community_board','api','crawl')),
  identifier TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  industry TEXT NOT NULL DEFAULT 'generic',
  last_fetched_at TIMESTAMPTZ,
  last_fetch_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.external_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  source_id TEXT REFERENCES public.collection_sources(id) ON DELETE SET NULL,
  source_type TEXT NOT NULL,
  content TEXT NOT NULL,
  url TEXT,
  published_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  collected_at TIMESTAMPTZ DEFAULT now(),
  is_converted BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.search_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  relative_volume NUMERIC DEFAULT 0,
  source TEXT DEFAULT 'naver_datalab',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, keyword, period_start, source)
);

-- ─────────────────────────────────────────────────────────────
-- 2. 파이프라인 단계별 설정 테이블
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.pipeline_stage_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  domain_key TEXT NOT NULL,
  stage_key TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  is_enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, domain_key, stage_key)
);

-- ─────────────────────────────────────────────────────────────
-- 3. 질문 자산 공급 패키지 테이블
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.question_supply_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  domain_key TEXT NOT NULL,
  brand_slug TEXT,
  package_data JSONB NOT NULL DEFAULT '{}',
  cq_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'ready' CHECK (status IN ('ready','delivered','archived')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- 4. 인덱스
-- ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_external_signals_workspace
  ON public.external_signals(workspace_id, source_type);

CREATE INDEX IF NOT EXISTS idx_external_signals_converted
  ON public.external_signals(workspace_id, is_converted) WHERE NOT is_converted;

CREATE INDEX IF NOT EXISTS idx_collection_sources_industry
  ON public.collection_sources(industry, enabled);

CREATE INDEX IF NOT EXISTS idx_pipeline_stage_configs_domain
  ON public.pipeline_stage_configs(workspace_id, domain_key);

CREATE INDEX IF NOT EXISTS idx_question_supply_packages_domain
  ON public.question_supply_packages(workspace_id, domain_key, status);

-- ─────────────────────────────────────────────────────────────
-- 5. RLS 정책
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.collection_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_stage_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_supply_packages ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성 (중복 에러 방지를 위해 DO 블록 사용)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'collection_sources_member_access') THEN
    CREATE POLICY collection_sources_member_access ON public.collection_sources FOR ALL
      USING (
        workspace_id IS NULL OR
        EXISTS (
          SELECT 1 FROM public.workspace_memberships wm
          WHERE wm.workspace_id = collection_sources.workspace_id
            AND wm.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'external_signals_member_access') THEN
    CREATE POLICY external_signals_member_access ON public.external_signals FOR ALL
      USING (
        workspace_id IS NULL OR
        EXISTS (
          SELECT 1 FROM public.workspace_memberships wm
          WHERE wm.workspace_id = external_signals.workspace_id
            AND wm.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'search_trends_member_access') THEN
    CREATE POLICY search_trends_member_access ON public.search_trends FOR ALL
      USING (
        workspace_id IS NULL OR
        EXISTS (
          SELECT 1 FROM public.workspace_memberships wm
          WHERE wm.workspace_id = search_trends.workspace_id
            AND wm.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pipeline_stage_configs_member_access') THEN
    CREATE POLICY pipeline_stage_configs_member_access ON public.pipeline_stage_configs FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.workspace_memberships wm
          WHERE wm.workspace_id = pipeline_stage_configs.workspace_id
            AND wm.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'question_supply_packages_member_access') THEN
    CREATE POLICY question_supply_packages_member_access ON public.question_supply_packages FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.workspace_memberships wm
          WHERE wm.workspace_id = question_supply_packages.workspace_id
            AND wm.user_id = auth.uid()
        )
      );
  END IF;
END
$$;
