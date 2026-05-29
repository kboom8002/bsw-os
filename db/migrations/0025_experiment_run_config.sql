-- Migration 0025: Experiment Run Config
-- Created at 2026-05-28

-- probe_panels에 반복 실행 설정 컬럼 추가
ALTER TABLE probe_panels
  ADD COLUMN IF NOT EXISTS repetitions_per_query INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS generation_temperature NUMERIC(3,2) DEFAULT 0.2,
  ADD COLUMN IF NOT EXISTS judge_temperature NUMERIC(3,2) DEFAULT 0.0;

-- ai_observation_runs에 실험 조건 컬럼 추가
ALTER TABLE ai_observation_runs
  ADD COLUMN IF NOT EXISTS condition VARCHAR(50) DEFAULT 'baseline',
  ADD COLUMN IF NOT EXISTS experiment_id UUID REFERENCES experiment_runs(id),
  ADD COLUMN IF NOT EXISTS repetition_index INTEGER DEFAULT 1;

-- benchmark_reports에 리포트 타입 추가
ALTER TABLE benchmark_reports
  ADD COLUMN IF NOT EXISTS report_type VARCHAR(50) DEFAULT 'benchmark';
