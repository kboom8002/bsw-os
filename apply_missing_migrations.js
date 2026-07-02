const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://qmsmllmapqeynleqeznd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtc21sbG1hcHFleW5sZXFlem5kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTUzMzY4MCwiZXhwIjoyMDk1MTA5NjgwfQ._2SZf-YvY_QDC3gcQTp7mb3ru69RfAXciDaIakoI2qU'
);

async function applyMigrations() {
  console.log('=== Applying missing tables via Supabase REST API ===\n');

  // Test: try inserting into pipeline_runs to force table creation won't work
  // We need to use raw SQL. Supabase client can't create tables.
  // Use the Management API or SQL Editor.

  // Alternative: Use fetch to Supabase SQL endpoint
  const SUPABASE_URL = 'https://qmsmllmapqeynleqeznd.supabase.co';
  const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtc21sbG1hcHFleW5sZXFlem5kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTUzMzY4MCwiZXhwIjoyMDk1MTA5NjgwfQ._2SZf-YvY_QDC3gcQTp7mb3ru69RfAXciDaIakoI2qU';

  const sql = `
    -- pipeline_runs
    CREATE TABLE IF NOT EXISTS public.pipeline_runs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
      pipeline_type VARCHAR(50) NOT NULL,
      domain_key VARCHAR(100),
      brand_slug VARCHAR(100),
      status VARCHAR(30) DEFAULT 'running' NOT NULL,
      phase_detail JSONB DEFAULT '{}'::JSONB,
      result_summary JSONB DEFAULT '{}'::JSONB,
      error_message TEXT,
      started_at TIMESTAMPTZ DEFAULT now(),
      completed_at TIMESTAMPTZ,
      duration_ms INTEGER
    );

    -- golden_visual_snapshots
    CREATE TABLE IF NOT EXISTS public.golden_visual_snapshots (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
      sub_industry VARCHAR(100),
      source_url TEXT,
      page_title TEXT,
      screenshot_url TEXT,
      metadata JSONB DEFAULT '{}'::JSONB,
      analyzed_at TIMESTAMPTZ DEFAULT now(),
      created_at TIMESTAMPTZ DEFAULT now()
    );

    -- golden_reference_outputs
    CREATE TABLE IF NOT EXISTS public.golden_reference_outputs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
      sub_industry VARCHAR(100),
      output_type VARCHAR(50) DEFAULT 'design_token',
      output_data JSONB DEFAULT '{}'::JSONB,
      generated_at TIMESTAMPTZ DEFAULT now(),
      created_at TIMESTAMPTZ DEFAULT now()
    );

    -- unified_question_mappings
    CREATE TABLE IF NOT EXISTS public.unified_question_mappings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
      question_text TEXT NOT NULL,
      source_type VARCHAR(50),
      mapping_data JSONB DEFAULT '{}'::JSONB,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    -- opportunity_reports
    CREATE TABLE IF NOT EXISTS public.opportunity_reports (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
      opportunities JSONB DEFAULT '[]'::JSONB,
      eeat_summary JSONB DEFAULT '{}'::JSONB,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    -- PAF domain packs
    CREATE TABLE IF NOT EXISTS public.paf_domain_packs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
      domain_key VARCHAR(100) NOT NULL,
      pack_config JSONB DEFAULT '{}'::JSONB,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );

    -- PAF attractor templates
    CREATE TABLE IF NOT EXISTS public.paf_attractor_templates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
      domain_key VARCHAR(100),
      attractor_name TEXT NOT NULL,
      trigger_patterns JSONB DEFAULT '[]'::JSONB,
      semantic_field JSONB DEFAULT '{}'::JSONB,
      content_template JSONB DEFAULT '{}'::JSONB,
      fit_threshold NUMERIC(4,2) DEFAULT 0.7,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    -- PAF run receipts
    CREATE TABLE IF NOT EXISTS public.paf_run_receipts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
      attractor_id UUID,
      brand_id UUID,
      context_tensor JSONB DEFAULT '{}'::JSONB,
      fit_score NUMERIC(4,2),
      action VARCHAR(20),
      channels JSONB DEFAULT '[]'::JSONB,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    -- PAF soliton outputs
    CREATE TABLE IF NOT EXISTS public.paf_soliton_outputs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      receipt_id UUID,
      workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
      channel VARCHAR(50),
      content_data JSONB DEFAULT '{}'::JSONB,
      quality_score NUMERIC(4,2),
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `;

  // Use Supabase SQL API endpoint
  const resp = await fetch(SUPABASE_URL + '/rest/v1/rpc/pg_query', {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': 'Bearer ' + SERVICE_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });

  if (!resp.ok) {
    console.log('Direct RPC failed. Status:', resp.status);
    console.log('Response:', await resp.text());
    console.log('\n=== Please run SQL manually in Supabase Dashboard ===');
    console.log('URL: https://supabase.com/dashboard/project/qmsmllmapqeynleqeznd/sql');
    console.log('\nSQL to run:');
    console.log(sql);
  } else {
    console.log('Migrations applied successfully!');
  }
}

applyMigrations().catch(e => console.error('Fatal:', e.message));
