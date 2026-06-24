-- supabase/migrations/0010_qis_integration.sql

CREATE TABLE IF NOT EXISTS public.bsw_received_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_platform text NOT NULL,
  signal_type text NOT NULL,
  industry text NOT NULL,
  hub_slug text,
  tenant_id uuid,
  raw_text text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  predicted_impact text DEFAULT 'medium',
  detected_at timestamptz NOT NULL,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bsw_predicted_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bsw_question_id uuid NOT NULL UNIQUE,
  question_text text NOT NULL,
  predicted_intent text NOT NULL,
  predicted_volume text DEFAULT 'medium',
  confidence numeric(3,2) NOT NULL,
  first_mover_window_days integer NOT NULL,
  current_ai_coverage text NOT NULL,
  auto_must_include jsonb DEFAULT '[]'::jsonb,
  auto_must_not_do jsonb DEFAULT '[]'::jsonb,
  qvs_composite numeric(5,2),
  emerged boolean DEFAULT false,
  emerged_at timestamptz,
  emergence_source text,
  actual_frequency integer,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bsw_expected_layers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_reference text NOT NULL,
  tier text NOT NULL,
  content text NOT NULL,
  source text NOT NULL,
  confidence numeric(3,2) NOT NULL,
  sample_count integer NOT NULL,
  industry text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bsw_received_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type text NOT NULL,
  industry text NOT NULL,
  hub_slug text,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  value numeric NOT NULL,
  sample_size integer NOT NULL,
  breakdown jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.bsw_received_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bsw_predicted_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bsw_expected_layers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bsw_received_metrics ENABLE ROW LEVEL SECURITY;

-- Simple policies for Service Role access
CREATE POLICY "Allow service role full access to bsw_received_signals" ON public.bsw_received_signals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role full access to bsw_predicted_questions" ON public.bsw_predicted_questions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role full access to bsw_expected_layers" ON public.bsw_expected_layers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role full access to bsw_received_metrics" ON public.bsw_received_metrics FOR ALL USING (true) WITH CHECK (true);
