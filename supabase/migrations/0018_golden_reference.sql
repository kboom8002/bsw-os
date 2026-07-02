-- supabase/migrations/0018_golden_reference.sql
-- 골든 레퍼런스 시스템: 비주얼 분석 스냅샷 + 업종별 합의 산출물

-- ─────────────────────────────────────────────────────────────
-- 1. 사이트별 비주얼 분석 스냅샷
--    golden_visual_snapshots 테이블은 업종별 레퍼런스 사이트 각각에 대해
--    디자인 토큰, 레이아웃 구조, 섹션 배치, 콘텐츠 템플릿, 이미지 참조,
--    Vibe-Vector를 JSON으로 저장합니다.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.golden_visual_snapshots (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  sub_industry_key TEXT        NOT NULL,
  url              TEXT        NOT NULL,
  brand_name       TEXT        NOT NULL,
  positioning      TEXT        NOT NULL DEFAULT 'standard'
                               CHECK (positioning IN ('luxury', 'premium', 'standard', 'poor')),
  -- 디자인 토큰 스냅샷 (colors / typography / shape / motion)
  design_tokens    JSONB,
  -- GNB / shell / footer / hero 레이아웃 구조
  layout_structure JSONB,
  -- 홈페이지 섹션 순서 및 서브페이지 정보
  section_sequence JSONB,
  -- 히어로 카피 패턴, FAQ 패턴, 신뢰 요소
  content_templates JSONB,
  -- 히어로/상품 이미지 참조 및 안티패턴
  image_references JSONB,
  -- Vibe-Vector 10D 스냅샷
  vibe_vector      JSONB,
  analyzed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  analysis_version TEXT        NOT NULL DEFAULT 'v1.0',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (sub_industry_key, url)
);

COMMENT ON TABLE  public.golden_visual_snapshots                  IS '업종별 레퍼런스 사이트 비주얼 분석 스냅샷. 각 사이트의 디자인/레이아웃/섹션/콘텐츠/이미지 패턴을 JSONB로 저장.';
COMMENT ON COLUMN public.golden_visual_snapshots.sub_industry_key IS 'BSW V3 세부 업종 키 (예: skincare, wedding, medical_clinic)';
COMMENT ON COLUMN public.golden_visual_snapshots.positioning      IS '사이트 포지셔닝 등급: luxury | premium | standard | poor';
COMMENT ON COLUMN public.golden_visual_snapshots.design_tokens    IS 'DesignTokenSnapshot: {colors, typography, shape, motion}';
COMMENT ON COLUMN public.golden_visual_snapshots.layout_structure IS 'LayoutStructureSnapshot: {gnb, shell, footer, hero}';
COMMENT ON COLUMN public.golden_visual_snapshots.section_sequence IS 'SectionSequenceSnapshot: {homepageSections[], subPages{}}';
COMMENT ON COLUMN public.golden_visual_snapshots.content_templates IS 'ContentTemplateSnapshot: {heroCopy, faqPatterns[], trustElements[]}';
COMMENT ON COLUMN public.golden_visual_snapshots.image_references  IS 'ImageReferenceSnapshot: {heroImages[], productImages[], antiPatterns[]}';
COMMENT ON COLUMN public.golden_visual_snapshots.vibe_vector       IS 'VibeVector10D 스냅샷';

-- ─────────────────────────────────────────────────────────────
-- 2. 업종별 합의 산출물 (6종 JSON)
--    골든 레퍼런스 배치 분석이 완료되면 6가지 deliverable JSON을
--    deliverable_type 별로 upsert합니다.
--
--    deliverable_type enum:
--      'tokens'   — GoldenTokensOutput
--      'layouts'  — GoldenLayoutsOutput
--      'sections' — GoldenSectionsOutput
--      'content'  — GoldenContentOutput
--      'images'   — GoldenImagesOutput
--      'quality'  — GoldenQualityOutput
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.golden_reference_outputs (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  sub_industry_key TEXT        NOT NULL,
  deliverable_type TEXT        NOT NULL
                               CHECK (deliverable_type IN (
                                 'tokens', 'layouts', 'sections',
                                 'content', 'images', 'quality'
                               )),
  output_data      JSONB       NOT NULL,
  sample_count     INTEGER     NOT NULL DEFAULT 0,
  generated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (sub_industry_key, deliverable_type)
);

COMMENT ON TABLE  public.golden_reference_outputs                  IS '업종별 골든 레퍼런스 합의 산출물 6종 (tokens/layouts/sections/content/images/quality). 배치 분석 후 upsert.';
COMMENT ON COLUMN public.golden_reference_outputs.sub_industry_key IS 'BSW V3 세부 업종 키';
COMMENT ON COLUMN public.golden_reference_outputs.deliverable_type IS '산출물 유형: tokens | layouts | sections | content | images | quality';
COMMENT ON COLUMN public.golden_reference_outputs.output_data      IS 'GoldenReferenceOutput 해당 deliverable의 전체 JSON';
COMMENT ON COLUMN public.golden_reference_outputs.sample_count     IS '합의 산출에 사용된 스냅샷 수';

-- ─────────────────────────────────────────────────────────────
-- RLS (Row Level Security)
-- 기존 마이그레이션 패턴 준수: 우선 전체 허용으로 설정
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.golden_visual_snapshots   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.golden_reference_outputs  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for golden_visual_snapshots"
  ON public.golden_visual_snapshots FOR ALL USING (true);

CREATE POLICY "Enable all for golden_reference_outputs"
  ON public.golden_reference_outputs FOR ALL USING (true);

-- ─────────────────────────────────────────────────────────────
-- 인덱스
-- ─────────────────────────────────────────────────────────────

-- 업종 키로 스냅샷 조회 (배치 집계 시 빈번히 사용)
CREATE INDEX IF NOT EXISTS idx_gvs_industry
  ON public.golden_visual_snapshots (sub_industry_key);

-- URL 중복 확인 및 단건 조회
CREATE INDEX IF NOT EXISTS idx_gvs_url
  ON public.golden_visual_snapshots (url);

-- 분석 버전별 필터링 지원
CREATE INDEX IF NOT EXISTS idx_gvs_version
  ON public.golden_visual_snapshots (analysis_version);

-- 포지셔닝 등급별 필터링 지원 (luxury/premium 우선 집계 시 사용)
CREATE INDEX IF NOT EXISTS idx_gvs_positioning
  ON public.golden_visual_snapshots (sub_industry_key, positioning);

-- 업종별 산출물 전체 조회
CREATE INDEX IF NOT EXISTS idx_gro_industry
  ON public.golden_reference_outputs (sub_industry_key);

-- 특정 deliverable_type 전체 목록 조회 (대시보드 등)
CREATE INDEX IF NOT EXISTS idx_gro_deliverable_type
  ON public.golden_reference_outputs (deliverable_type);
