-- 0031_top_n_freshness_metrics.sql
-- Top-N Presence (top3/top5) 및 Freshness Score 컬럼 추가
-- 기존 데이터 호환을 위해 nullable default 0 적용

-- ═══════════════════════════════════════════════════════════════
-- industry_report_brand_rankings 테이블 확장
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE industry_report_brand_rankings
  ADD COLUMN IF NOT EXISTS top3 NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS top5 NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS freshness NUMERIC DEFAULT 0;

COMMENT ON COLUMN industry_report_brand_rankings.top3 IS 'Top-3 Presence Rate (0-100): AI 경쟁 응답에서 상위 3위 내 언급된 비율';
COMMENT ON COLUMN industry_report_brand_rankings.top5 IS 'Top-5 Presence Rate (0-100): AI 경쟁 응답에서 상위 5위 내 언급된 비율';
COMMENT ON COLUMN industry_report_brand_rankings.freshness IS 'Freshness Score (0-100): AI 응답의 정보 최신성 점수';

-- ═══════════════════════════════════════════════════════════════
-- industry_benchmark_snapshots 테이블 확장
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE industry_benchmark_snapshots
  ADD COLUMN IF NOT EXISTS top3 NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS top5 NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS freshness NUMERIC DEFAULT 0;

COMMENT ON COLUMN industry_benchmark_snapshots.top3 IS 'Top-3 Presence Rate (0-100)';
COMMENT ON COLUMN industry_benchmark_snapshots.top5 IS 'Top-5 Presence Rate (0-100)';
COMMENT ON COLUMN industry_benchmark_snapshots.freshness IS 'Freshness Score (0-100)';
