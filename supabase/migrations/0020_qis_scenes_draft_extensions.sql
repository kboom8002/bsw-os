-- supabase/migrations/0020_qis_scenes_draft_extensions.sql
-- Extension columns for QIS Scene draft answers and guidelines

ALTER TABLE public.qis_scenes ADD COLUMN IF NOT EXISTS scene_type VARCHAR(100) DEFAULT 'factoid';
ALTER TABLE public.qis_scenes ADD COLUMN IF NOT EXISTS answer_text TEXT;
ALTER TABLE public.qis_scenes ADD COLUMN IF NOT EXISTS must_include TEXT[] DEFAULT '{}'::TEXT[];
ALTER TABLE public.qis_scenes ADD COLUMN IF NOT EXISTS must_not_do TEXT[] DEFAULT '{}'::TEXT[];
ALTER TABLE public.qis_scenes ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2) DEFAULT 0.50;
