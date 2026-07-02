-- supabase/migrations/0019_industry_report_system.sql
-- 업종별 AEO/GEO 경쟁 리포트 시스템
-- Component 1: DB 스키마 — 신규 테이블 2개 + 기존 테이블 컬럼 확장

-- ─────────────────────────────────────────────────────────────
-- 1. industry_report_snapshots — 리포트 발행 메타데이터
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.industry_report_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,

  -- 리포트 기본 정보
  report_title TEXT NOT NULL,
  sub_industry_key TEXT NOT NULL,       -- "skincare" | "wedding"
  macro_category_key TEXT NOT NULL,     -- "ecommerce_d2c" | "local_services"
  report_period TEXT NOT NULL,          -- "2026-Q3" | "2026-07"

  -- 업종 레벨 집계 지표
  industry_iri NUMERIC,                 -- 업종 평균 IRI (0~100)
  industry_opp NUMERIC,                 -- 업종 평균 OPP (0~100)
  industry_avg_bair NUMERIC,            -- 업종 평균 BAIR (0~100)
  industry_avg_aepi NUMERIC,            -- 업종 평균 AEPI (0~100)

  -- 측정 메타데이터
  total_brands INTEGER NOT NULL DEFAULT 0,
  total_probes INTEGER NOT NULL DEFAULT 0,
  total_responses INTEGER NOT NULL DEFAULT 0,
  engines_used TEXT[] NOT NULL DEFAULT '{}',
  probe_set_hash TEXT,                  -- SHA-256 (재현성 보장)

  -- 전분기 비교
  prev_report_id UUID REFERENCES public.industry_report_snapshots(id) ON DELETE SET NULL,

  -- 상태 관리
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 2. industry_report_brand_rankings — 리포트 내 브랜드별 랭킹
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.industry_report_brand_rankings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES public.industry_report_snapshots(id) ON DELETE CASCADE,

  -- 브랜드 정보
  brand_name TEXT NOT NULL,
  brand_slug TEXT NOT NULL,
  rank_position INTEGER NOT NULL,

  -- 핵심 지표 (0~100)
  bair_score NUMERIC NOT NULL DEFAULT 0,
  aepi_score NUMERIC,
  bsf NUMERIC NOT NULL DEFAULT 0,       -- Brand Share of Voice
  aas_w NUMERIC NOT NULL DEFAULT 0,     -- Weighted Answer Sentiment
  ocr NUMERIC NOT NULL DEFAULT 0,       -- Observed Citation Rate
  mention_quality NUMERIC,              -- Strong mention ratio (0~100)

  -- Per-Layer 지표
  iri NUMERIC,
  bdr NUMERIC,
  cwr NUMERIC,
  opp NUMERIC,

  -- AEPI 7차원 breakdown
  aepi_dimensions JSONB DEFAULT '{}',   -- {"factoid":80,"procedural":65,...}

  -- 전분기 비교
  prev_rank_position INTEGER,
  rank_change INTEGER DEFAULT 0,        -- +2, -1, 0
  bair_change NUMERIC DEFAULT 0,

  -- 4사분면 포지셔닝
  quadrant TEXT CHECK (quadrant IN ('ai_leader', 'competitive_warrior', 'steady_defender', 'vulnerable')),

  -- 메타데이터
  is_estimated BOOLEAN DEFAULT false,
  sample_size INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 3. industry_benchmark_snapshots — 기존 테이블 컬럼 확장
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'industry_benchmark_snapshots' AND column_name = 'iri') THEN
    ALTER TABLE public.industry_benchmark_snapshots ADD COLUMN iri NUMERIC;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'industry_benchmark_snapshots' AND column_name = 'bdr') THEN
    ALTER TABLE public.industry_benchmark_snapshots ADD COLUMN bdr NUMERIC;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'industry_benchmark_snapshots' AND column_name = 'cwr') THEN
    ALTER TABLE public.industry_benchmark_snapshots ADD COLUMN cwr NUMERIC;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'industry_benchmark_snapshots' AND column_name = 'opp') THEN
    ALTER TABLE public.industry_benchmark_snapshots ADD COLUMN opp NUMERIC;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'industry_benchmark_snapshots' AND column_name = 'aepi_score') THEN
    ALTER TABLE public.industry_benchmark_snapshots ADD COLUMN aepi_score NUMERIC;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'industry_benchmark_snapshots' AND column_name = 'mention_quality') THEN
    ALTER TABLE public.industry_benchmark_snapshots ADD COLUMN mention_quality NUMERIC;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'industry_benchmark_snapshots' AND column_name = 'is_estimated') THEN
    ALTER TABLE public.industry_benchmark_snapshots ADD COLUMN is_estimated BOOLEAN DEFAULT false;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- RLS 정책
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.industry_report_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.industry_report_brand_rankings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_access_report_snapshots"
  ON public.industry_report_snapshots FOR ALL
  USING (workspace_id IS NULL OR auth.uid() IS NOT NULL);

CREATE POLICY "workspace_access_report_rankings"
  ON public.industry_report_brand_rankings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.industry_report_snapshots s
      WHERE s.id = report_id
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 인덱스
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_industry_report_snapshots_workspace
  ON public.industry_report_snapshots(workspace_id);
CREATE INDEX IF NOT EXISTS idx_industry_report_snapshots_industry
  ON public.industry_report_snapshots(sub_industry_key, report_period DESC);
CREATE INDEX IF NOT EXISTS idx_industry_report_snapshots_status
  ON public.industry_report_snapshots(status, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_industry_report_rankings_report
  ON public.industry_report_brand_rankings(report_id, rank_position);
CREATE INDEX IF NOT EXISTS idx_industry_report_rankings_brand
  ON public.industry_report_brand_rankings(brand_slug, report_id);
