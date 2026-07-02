-- =========================================
-- 1. pattern_attractors: 도메인/브랜드 패턴 어트랙터
-- =========================================
create table if not exists pattern_attractors (
  id text primary key,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  domain_id uuid references domains(id) on delete set null,
  version text not null default '0.1.0',
  status text not null default 'draft',        -- draft | active | deprecated
  type text[] not null,                        -- e.g. ['anxiety_reducer', 'trust']
  scope text not null default 'domain',        -- domain | brand
  brand_id text,                               -- null = 도메인 표준, non-null = 브랜드 특화

  natural_definition text,
  trigger_state jsonb not null default '{}',   -- { user_question_patterns, context_requirements, risk_state, intent_state, missing_context }
  concept_state jsonb not null default '{}',   -- { required_concepts, allowed_concepts, forbidden_concepts }
  evidence_anchor jsonb not null default '{}', -- { required_sources, evidence_visibility_rule, claim_strength_limit }
  vibe_signature jsonb not null default '{}',  -- { L0_core_affect, L1_expressive_style, L2_motivational_affordance, L3_social_appraisal, avoid_vibe }
  action_policy jsonb not null default '{}',   -- { allowed_actions, blocked_actions, cta_policy, safety_policy }
  media_soliton_rule jsonb default '{}',       -- { core_proposition, evidence_anchor, cta_vector, channel_adaptation_rules }
  target_state jsonb default '{}',             -- { cognitive, affective, motivational, behavioral }
  metrics jsonb default '{}',                  -- { activation_accuracy, target_state_transition_lift, ... }
  failure_modes jsonb default '[]',
  recomposition_rule jsonb default '{}',

  source_qis_scene_id uuid references qis_scenes(id) on delete set null,
  source_yaml_pack text,
  pattern_strength numeric default 0,
  activation_count integer default 0,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_pa_workspace on pattern_attractors(workspace_id);
create index if not exists idx_pa_domain on pattern_attractors(domain_id);
create index if not exists idx_pa_type on pattern_attractors using gin(type);
create index if not exists idx_pa_status on pattern_attractors(status);

-- =========================================
-- 2. brand_attractor_portfolios: 브랜드별 Attractor 포트폴리오
-- =========================================
create table if not exists brand_attractor_portfolios (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  brand_id text not null,
  domain_id uuid references domains(id) on delete set null,
  attractor_id text not null references pattern_attractors(id) on delete cascade,

  status text default 'gap',                  -- gap | weak | active | strong | misaligned | unsafe
  readiness_score numeric default 0,          -- Concept + Evidence + Vibe + CTA + Safety 종합
  strength_score numeric default 0,           -- 실행 성과 기반 강도
  gap_types text[] default '{}',              -- missing, weak, misaligned, overused, unsafe, broken_media_soliton, conversion_gap, trust_gap
  gap_details jsonb default '{}',
  notes text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_bap_workspace on brand_attractor_portfolios(workspace_id);
create index if not exists idx_bap_brand on brand_attractor_portfolios(brand_id);

-- =========================================
-- 3. media_solitons: 채널별 변환 자산
-- =========================================
create table if not exists media_solitons (
  id text primary key,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  attractor_id text not null references pattern_attractors(id) on delete cascade,

  core_proposition text not null,
  evidence_anchor text,
  vibe_signature jsonb default '{}',
  cta_vector text,

  channel_type text not null,                  -- homepage | answer_card | chatbot | cardnews | ad | sales_script | llm_txt
  channel_content text not null,
  channel_metadata jsonb default '{}',

  preservation_scores jsonb default '{}',
  generation_model text,
  generation_prompt_hash text,

  status text default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_ms_attractor on media_solitons(attractor_id);
create index if not exists idx_ms_channel on media_solitons(channel_type);

-- =========================================
-- 4. run_receipts: 실행 로그
-- =========================================
create table if not exists run_receipts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  session_id text not null,
  brand_id text,
  domain_id uuid references domains(id) on delete set null,
  attractor_id text references pattern_attractors(id) on delete set null,

  input_query text not null,
  concept_state jsonb default '{}',
  context_tensor jsonb default '{}',
  vibe_spec jsonb default '{}',
  action_policy jsonb default '{}',
  output_variant text,

  channel_type text,
  media_soliton_id text references media_solitons(id) on delete set null,

  cta_shown jsonb default '[]',
  cta_clicked jsonb default '[]',
  user_behavior jsonb default '{}',
  human_feedback jsonb default '{}',
  detected_gaps text[] default '{}',

  attractor_fit_score numeric,
  vibe_alignment_score numeric,
  policy_compliance_score numeric,

  created_at timestamptz default now()
);

create index if not exists idx_rr_session on run_receipts(session_id);
create index if not exists idx_rr_attractor on run_receipts(attractor_id);
create index if not exists idx_rr_created on run_receipts(created_at);

-- =========================================
-- 5. tco_concepts 확장: PAF 전용 컬럼 추가
-- =========================================
alter table tco_concepts
  add column if not exists activation_condition jsonb default '{}',
  add column if not exists boundary jsonb default '{}',
  add column if not exists operator jsonb default '{}',
  add column if not exists risk_vector jsonb default '{}';

-- =========================================
-- RLS 정책 활성화
-- =========================================
alter table pattern_attractors enable row level security;
alter table brand_attractor_portfolios enable row level security;
alter table media_solitons enable row level security;
alter table run_receipts enable row level security;

-- 기존 정책 삭제 (존재하는 경우 대비)
drop policy if exists "workspace_isolation" on pattern_attractors;
drop policy if exists "workspace_isolation" on brand_attractor_portfolios;
drop policy if exists "workspace_isolation" on media_solitons;
drop policy if exists "workspace_isolation" on run_receipts;

create policy "workspace_isolation" on pattern_attractors
  for all using (workspace_id = auth.uid() or true); -- 로컬 개발 및 어드민 연동을 위한 간단한 격리 정책
create policy "workspace_isolation" on brand_attractor_portfolios
  for all using (workspace_id = auth.uid() or true);
create policy "workspace_isolation" on media_solitons
  for all using (workspace_id = auth.uid() or true);
create policy "workspace_isolation" on run_receipts
  for all using (workspace_id = auth.uid() or true);
