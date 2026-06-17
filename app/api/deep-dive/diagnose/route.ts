import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../../lib/supabase';
import { DiagnosticEngine } from '../../../../lib/deep-dive/diagnostic-engine';

export async function POST(req: Request) {
  try {
    const { workspace_id, brand_slug, domain_slug } = await req.json();
    
    if (!workspace_id || !brand_slug || !domain_slug) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const diagnostic = await DiagnosticEngine.runDiagnostic(workspace_id, brand_slug, domain_slug);
    
    const supabase = getSupabaseAdminClient();
    
    const { data, error } = await supabase
      .from('deep_dive_sessions')
      .insert({
        workspace_id,
        brand_slug,
        brand_name: brand_slug, // Simplified
        status: 'diagnosing',
        diagnostic_snapshot: diagnostic,
        subscription_tier: 'pro_monthly' // Applied monthly subscription answer
      })
      .select('id')
      .single();

    if (error) throw error;

    return NextResponse.json({ session_id: data.id, diagnostic });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
