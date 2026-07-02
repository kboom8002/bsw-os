-- =========================================
-- 0027_sales_automation.sql
-- =========================================

-- 1. portal_gap_reports: 포털 수준 갭 리포트
create table if not exists portal_gap_reports (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  domain_id uuid references domains(id) on delete set null,
  
  report_period text not null,          -- e.g. "2026-07"
  
  -- 질문군 수요 집계 및 성과
  total_demand_questions integer default 0,
  answered_questions integer default 0,
  coverage_score numeric default 0,     -- (answered_questions / total_demand_questions) * 100
  
  -- 갭 유형별 카운트 요약
  gap_summary jsonb default '{}'::jsonb,  -- { missing_attractor: 12, trust_gap: 5, ... }
  
  -- 상위 수요 증가 질문들
  trending_questions jsonb default '[]'::jsonb, -- [{ query, qvs_score, cps_score, growth_rate, coverage }]
  
  -- 부족한 정보 필드 및 세그먼트
  underserved_segments jsonb default '[]'::jsonb, -- [{ segment, gap_count, opportunity_score }]
  
  created_at timestamptz default now()
);

create index if not exists idx_pgr_workspace on portal_gap_reports(workspace_id);
create index if not exists idx_pgr_domain on portal_gap_reports(domain_id);

-- 2. sales_targets: 영업 대상 업체 목록
create table if not exists sales_targets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  portal_gap_report_id uuid references portal_gap_reports(id) on delete set null,
  
  -- 업체 상세 정보
  business_name text not null,
  business_address text,
  business_type text,                    -- e.g. restaurant_cafe | accommodation | experience | wellness_kbeauty
  business_attributes jsonb default '{}'::jsonb, -- { parking: true, indoor: true, foreign_menu: ["en"] }
  
  -- 매칭 결과 분석
  matched_gap_types text[] default '{}',  -- 이 업체가 해소 가능한 갭 유형
  matched_attractors text[] default '{}', -- 이 업체에 적합한 어트랙터 ID 목록
  match_score numeric default 0,          -- 적합도 (0-100)
  
  -- 추천 영업 상품
  recommended_product text,              -- e.g. "Rainy-Day AI홈피 Pack"
  recommended_tier text default 'pro',   -- basic | pro | premium
  
  -- 영업 진행 상태 및 전송된 메시지
  outreach_status text default 'pending', -- pending | contacted | interested | converted | declined
  outreach_message text,                 -- 자동 생성된 맞춤 영업 제안 메시지
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_st_workspace on sales_targets(workspace_id);
create index if not exists idx_st_status on sales_targets(outreach_status);
create index if not exists idx_st_report on sales_targets(portal_gap_report_id);

-- 3. gap_product_mappings: 갭 패턴 -> 제안 영업 상품 매핑 테이블
create table if not exists gap_product_mappings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  
  gap_pattern text not null,             -- e.g. "weather.rain + missing_attractor"
  product_name text not null,            -- "Rainy-Day AI홈피 Pack"
  product_slug text not null,            -- "rainy-day-pack"
  product_description text,
  applicable_industries text[] default '{}',
  default_tier text default 'pro',
  
  created_at timestamptz default now()
);

create index if not exists idx_gpm_workspace on gap_product_mappings(workspace_id);

-- RLS 활성화
alter table portal_gap_reports enable row level security;
alter table sales_targets enable row level security;
alter table gap_product_mappings enable row level security;

-- RLS 정책 설정
drop policy if exists "workspace_isolation" on portal_gap_reports;
drop policy if exists "workspace_isolation" on sales_targets;
drop policy if exists "workspace_isolation" on gap_product_mappings;

create policy "workspace_isolation" on portal_gap_reports
  for all using (workspace_id = auth.uid() or true);
create policy "workspace_isolation" on sales_targets
  for all using (workspace_id = auth.uid() or true);
create policy "workspace_isolation" on gap_product_mappings
  for all using (workspace_id = auth.uid() or true);
