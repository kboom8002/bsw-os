-- supabase/migrations/0024_deep_dive_tables.sql

CREATE TABLE IF NOT EXISTS public.deep_dive_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  brand_slug TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'diagnosing', 'discovered', 'blueprinted', 'simulated', 'completed')),
  diagnostic_snapshot JSONB,
  subscription_tier TEXT DEFAULT 'pro_monthly',
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.deep_dive_target_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.deep_dive_sessions(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  sources JSONB NOT NULL,
  composite_priority NUMERIC(5,1) NOT NULL,
  eeat_dimension TEXT NOT NULL,
  current_ai_coverage TEXT NOT NULL,
  competitors_owning TEXT[] DEFAULT '{}',
  estimated_aepi_impact NUMERIC(5,1),
  estimated_bdr_delta NUMERIC(5,1),
  first_mover_window_days INT,
  admin_approval_status TEXT DEFAULT 'pending' 
    CHECK (admin_approval_status IN ('pending', 'approved', 'rejected')),
  admin_approved_by UUID,
  admin_approved_at TIMESTAMPTZ,
  registered_cq_id UUID REFERENCES public.canonical_questions(id),
  registered_qis_scene_ids UUID[] DEFAULT '{}',
  user_decision TEXT DEFAULT 'pending'
    CHECK (user_decision IN ('pending', 'accepted', 'rejected', 'deferred')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.deep_dive_content_blueprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.deep_dive_sessions(id) ON DELETE CASCADE,
  target_question_id UUID NOT NULL REFERENCES public.deep_dive_target_questions(id) ON DELETE CASCADE,
  target_cq_id UUID REFERENCES public.canonical_questions(id),
  content_type TEXT NOT NULL,
  title_suggestion_ko TEXT NOT NULL,
  heading_structure JSONB NOT NULL,
  expected_layer JSONB NOT NULL,
  schema_suggestions JSONB DEFAULT '[]',
  linked_evidence_ids UUID[] DEFAULT '{}',
  linked_claim_ids UUID[] DEFAULT '{}',
  linked_boundary_ids UUID[] DEFAULT '{}',
  prescription_source JSONB,
  estimated_aepi_impact NUMERIC(5,1),
  estimated_bdr_delta NUMERIC(5,1),
  priority_rank INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.deep_dive_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.deep_dive_sessions(id) ON DELETE CASCADE,
  current_snapshot JSONB NOT NULL,
  projected_snapshot JSONB NOT NULL,
  per_blueprint_contribution JSONB NOT NULL,
  scenarios JSONB NOT NULL,
  simulated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.deep_dive_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deep_dive_target_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deep_dive_content_blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deep_dive_simulations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow workspace members to read deep_dive_sessions" ON public.deep_dive_sessions;
CREATE POLICY "Allow workspace members to read deep_dive_sessions" ON public.deep_dive_sessions
  FOR SELECT USING (is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Allow workspace members to write deep_dive_sessions" ON public.deep_dive_sessions;
CREATE POLICY "Allow workspace members to write deep_dive_sessions" ON public.deep_dive_sessions
  FOR ALL USING (is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Allow workspace members to read deep_dive_target_questions" ON public.deep_dive_target_questions;
CREATE POLICY "Allow workspace members to read deep_dive_target_questions" ON public.deep_dive_target_questions
  FOR SELECT USING (session_id IN (SELECT id FROM public.deep_dive_sessions WHERE is_workspace_member(workspace_id)));

DROP POLICY IF EXISTS "Allow workspace members to write deep_dive_target_questions" ON public.deep_dive_target_questions;
CREATE POLICY "Allow workspace members to write deep_dive_target_questions" ON public.deep_dive_target_questions
  FOR ALL USING (session_id IN (SELECT id FROM public.deep_dive_sessions WHERE is_workspace_member(workspace_id)));

DROP POLICY IF EXISTS "Allow workspace members to read deep_dive_content_blueprints" ON public.deep_dive_content_blueprints;
CREATE POLICY "Allow workspace members to read deep_dive_content_blueprints" ON public.deep_dive_content_blueprints
  FOR SELECT USING (session_id IN (SELECT id FROM public.deep_dive_sessions WHERE is_workspace_member(workspace_id)));

DROP POLICY IF EXISTS "Allow workspace members to write deep_dive_content_blueprints" ON public.deep_dive_content_blueprints;
CREATE POLICY "Allow workspace members to write deep_dive_content_blueprints" ON public.deep_dive_content_blueprints
  FOR ALL USING (session_id IN (SELECT id FROM public.deep_dive_sessions WHERE is_workspace_member(workspace_id)));

DROP POLICY IF EXISTS "Allow workspace members to read deep_dive_simulations" ON public.deep_dive_simulations;
CREATE POLICY "Allow workspace members to read deep_dive_simulations" ON public.deep_dive_simulations
  FOR SELECT USING (session_id IN (SELECT id FROM public.deep_dive_sessions WHERE is_workspace_member(workspace_id)));

DROP POLICY IF EXISTS "Allow workspace members to write deep_dive_simulations" ON public.deep_dive_simulations;
CREATE POLICY "Allow workspace members to write deep_dive_simulations" ON public.deep_dive_simulations
  FOR ALL USING (session_id IN (SELECT id FROM public.deep_dive_sessions WHERE is_workspace_member(workspace_id)));
