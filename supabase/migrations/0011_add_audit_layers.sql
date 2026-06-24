-- supabase/migrations/0011_add_audit_layers.sql

-- L1: 기술 인프라 스냅샷
CREATE TABLE IF NOT EXISTS public.tech_infra_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL, -- references workspaces(id)
  website_url TEXT NOT NULL,
  audit_session_id UUID, -- references audit_sessions(id)
  robots_bot_matrix JSONB DEFAULT '[]'::jsonb,
  ai_crawler_access_score NUMERIC DEFAULT 0,
  https_enabled BOOLEAN DEFAULT false,
  ttfb_ms NUMERIC DEFAULT 0,
  ttfb_grade TEXT DEFAULT 'slow',
  sitemap_url_count INTEGER DEFAULT 0,
  sitemap_freshness_score NUMERIC DEFAULT 0,
  llms_txt_exists BOOLEAN DEFAULT false,
  canonical_consistency NUMERIC DEFAULT 0,
  rendering_mode TEXT DEFAULT 'ssr',
  tech_infra_score NUMERIC DEFAULT 0,
  issues JSONB DEFAULT '[]'::jsonb,
  measured_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- L2: 스키마 품질 스냅샷
CREATE TABLE IF NOT EXISTS public.schema_quality_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL, -- references workspaces(id)
  website_url TEXT NOT NULL,
  audit_session_id UUID, -- references audit_sessions(id)
  schema_quality_score NUMERIC DEFAULT 0,
  schema_type_count INTEGER DEFAULT 0,
  schema_coverage NUMERIC DEFAULT 0,
  org_schema_present BOOLEAN DEFAULT false,
  org_same_as_count INTEGER DEFAULT 0,
  faq_schema_count INTEGER DEFAULT 0,
  howto_schema_count INTEGER DEFAULT 0,
  product_schema_count INTEGER DEFAULT 0,
  article_schema_count INTEGER DEFAULT 0,
  og_completeness_score NUMERIC DEFAULT 0,
  author_coverage NUMERIC DEFAULT 0,
  issues JSONB DEFAULT '[]'::jsonb,
  measured_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- L3: 콘텐츠 시맨틱 스냅샷
CREATE TABLE IF NOT EXISTS public.content_semantic_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL, -- references workspaces(id)
  website_url TEXT NOT NULL,
  audit_session_id UUID, -- references audit_sessions(id)
  eeat_experience NUMERIC DEFAULT 0,
  eeat_expertise NUMERIC DEFAULT 0,
  eeat_authoritativeness NUMERIC DEFAULT 0,
  eeat_trustworthiness NUMERIC DEFAULT 0,
  eeat_overall NUMERIC DEFAULT 0,
  answer_first_avg_score NUMERIC DEFAULT 0,
  freshness_score NUMERIC DEFAULT 0,
  freshness_avg_age_days NUMERIC DEFAULT 0,
  topic_cluster_count INTEGER DEFAULT 0,
  multimedia_score NUMERIC DEFAULT 0,
  citation_quality_score NUMERIC DEFAULT 0,
  internal_link_topology_score NUMERIC DEFAULT 0,
  originality_score NUMERIC DEFAULT 0,
  content_semantic_score NUMERIC DEFAULT 0,
  issues JSONB DEFAULT '[]'::jsonb,
  measured_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- audit_sessions에 L1/L2/L3 결과 ID 추가
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_sessions' AND column_name = 'tech_infra_snapshot_id') THEN
    ALTER TABLE audit_sessions ADD COLUMN tech_infra_snapshot_id UUID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_sessions' AND column_name = 'schema_quality_snapshot_id') THEN
    ALTER TABLE audit_sessions ADD COLUMN schema_quality_snapshot_id UUID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_sessions' AND column_name = 'content_semantic_snapshot_id') THEN
    ALTER TABLE audit_sessions ADD COLUMN content_semantic_snapshot_id UUID;
  END IF;
END $$;

-- EntityReflectionSnapshot 확장 컬럼
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'entity_reflection_snapshots' AND column_name = 'citation_rate') THEN
    ALTER TABLE entity_reflection_snapshots ADD COLUMN citation_rate NUMERIC DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'entity_reflection_snapshots' AND column_name = 'citation_positions') THEN
    ALTER TABLE entity_reflection_snapshots ADD COLUMN citation_positions JSONB DEFAULT '{}'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'entity_reflection_snapshots' AND column_name = 'competitor_mention_rate') THEN
    ALTER TABLE entity_reflection_snapshots ADD COLUMN competitor_mention_rate NUMERIC DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'entity_reflection_snapshots' AND column_name = 'competitor_details') THEN
    ALTER TABLE entity_reflection_snapshots ADD COLUMN competitor_details JSONB DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'entity_reflection_snapshots' AND column_name = 'distortion_patterns') THEN
    ALTER TABLE entity_reflection_snapshots ADD COLUMN distortion_patterns JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- RLS 활성화 및 권한 설정
ALTER TABLE public.tech_infra_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schema_quality_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_semantic_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for tech_infra_snapshots" ON public.tech_infra_snapshots FOR ALL USING (true);
CREATE POLICY "Enable all for schema_quality_snapshots" ON public.schema_quality_snapshots FOR ALL USING (true);
CREATE POLICY "Enable all for content_semantic_snapshots" ON public.content_semantic_snapshots FOR ALL USING (true);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_tech_infra_workspace ON public.tech_infra_snapshots(workspace_id);
CREATE INDEX IF NOT EXISTS idx_schema_quality_workspace ON public.schema_quality_snapshots(workspace_id);
CREATE INDEX IF NOT EXISTS idx_content_semantic_workspace ON public.content_semantic_snapshots(workspace_id);
