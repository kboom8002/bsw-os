-- supabase/migrations/0021_tco_concepts_extensions.sql

ALTER TABLE public.tco_concepts ADD COLUMN IF NOT EXISTS concept_type VARCHAR(100) DEFAULT 'tco_domain_entity';
ALTER TABLE public.tco_concepts ADD COLUMN IF NOT EXISTS operational_fields JSONB DEFAULT '{}'::JSONB;
