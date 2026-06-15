-- Migration: 0028_benchmark_advanced_metrics.sql
-- Add Advanced Per-Layer Metrics to industry_benchmark_snapshots

ALTER TABLE industry_benchmark_snapshots
ADD COLUMN bdr NUMERIC(5,2) DEFAULT NULL, -- Brand Defense Rate (L7)
ADD COLUMN cwr NUMERIC(5,2) DEFAULT NULL, -- Competitive Win Rate (L2)
ADD COLUMN iri NUMERIC(5,2) DEFAULT NULL, -- Industry Readiness Index (Generic)
ADD COLUMN opp NUMERIC(5,2) DEFAULT NULL; -- Opportunity Score (Generic)

-- Comments for documentation
COMMENT ON COLUMN industry_benchmark_snapshots.bdr IS 'Brand Defense Rate: 자사 L7 질문에서 성공적으로 자사 브랜드가 방어된 비율 (0-100)';
COMMENT ON COLUMN industry_benchmark_snapshots.cwr IS 'Competitive Win Rate: 자사 L2 경쟁사 비교 질문에서 자사 브랜드가 노출된 비율 (0-100)';
COMMENT ON COLUMN industry_benchmark_snapshots.iri IS 'Industry Readiness Index: 제네릭 질문 중 패널 내 1개 이상 브랜드가 노출된 비율 (0-100)';
COMMENT ON COLUMN industry_benchmark_snapshots.opp IS 'Opportunity Score: 제네릭 질문 중 어떤 브랜드도 노출되지 않은 비율 (0-100)';
