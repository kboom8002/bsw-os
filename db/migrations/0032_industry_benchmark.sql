-- db/migrations/0032_industry_benchmark.sql
-- 업종별 벤치마크 역설계 시스템

-- 레퍼런스 사이트 레지스트리 (관리자가 큐레이션)
CREATE TABLE IF NOT EXISTS reference_sites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sub_industry_key TEXT NOT NULL,
  url TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('excellent', 'average', 'poor')),
  curator_notes TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 개별 사이트 감사 결과 스냅샷
CREATE TABLE IF NOT EXISTS benchmark_audit_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reference_site_id UUID REFERENCES reference_sites(id) ON DELETE SET NULL,
  sub_industry_key TEXT NOT NULL,
  metrics JSONB NOT NULL,
  audited_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 업종 벤치마크 프로필 (집계 통계)
CREATE TABLE IF NOT EXISTS industry_benchmark_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sub_industry_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  sample_count INTEGER NOT NULL DEFAULT 0,
  percentile_distributions JSONB NOT NULL DEFAULT '{}',
  tier_statistics JSONB NOT NULL DEFAULT '{}',
  excellent_patterns JSONB DEFAULT '[]',
  common_pitfalls JSONB DEFAULT '[]',
  generated_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 업종 표준 설계안 (Blueprint)
CREATE TABLE IF NOT EXISTS industry_blueprints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sub_industry_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  tech_infra_standard JSONB NOT NULL DEFAULT '{}',
  schema_standard JSONB NOT NULL DEFAULT '{}',
  content_strategy JSONB NOT NULL DEFAULT '{}',
  design_patterns JSONB NOT NULL DEFAULT '{}',
  target_scores JSONB NOT NULL DEFAULT '{}',
  sample_count INTEGER DEFAULT 0,
  generated_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- audit_sessions 확장: 업종 포지셔닝 결과 저장
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_sessions' AND column_name = 'relative_position') THEN
    ALTER TABLE audit_sessions ADD COLUMN relative_position JSONB;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_sessions' AND column_name = 'improvement_strategy') THEN
    ALTER TABLE audit_sessions ADD COLUMN improvement_strategy JSONB;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_sessions' AND column_name = 'industry_blueprint_sub_key') THEN
    ALTER TABLE audit_sessions ADD COLUMN industry_blueprint_sub_key TEXT;
  END IF;
END $$;

-- RLS
ALTER TABLE reference_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE benchmark_audit_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE industry_benchmark_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE industry_blueprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for reference_sites" ON reference_sites FOR ALL USING (true);
CREATE POLICY "Enable all for benchmark_audit_results" ON benchmark_audit_results FOR ALL USING (true);
CREATE POLICY "Enable all for industry_benchmark_profiles" ON industry_benchmark_profiles FOR ALL USING (true);
CREATE POLICY "Enable all for industry_blueprints" ON industry_blueprints FOR ALL USING (true);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_ref_sites_industry ON reference_sites(sub_industry_key);
CREATE INDEX IF NOT EXISTS idx_bench_audit_industry ON benchmark_audit_results(sub_industry_key);
CREATE INDEX IF NOT EXISTS idx_bench_audit_audited ON benchmark_audit_results(audited_at DESC);
