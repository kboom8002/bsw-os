import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../../lib/supabase';
import { DiagnosticEngine } from '../../../../lib/deep-dive/diagnostic-engine';

export async function POST(req: Request) {
  try {
    const { workspace_id, brand_slug, domain_slug } = await req.json();
    
    if (!workspace_id || !brand_slug || !domain_slug) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    
    // Resolve slug to UUID if not a valid UUID format
    let resolvedWorkspaceId = workspace_id;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(workspace_id);
    
    if (!isUuid) {
      const { data: wsBySlug } = await supabase
        .from('workspaces')
        .select('id')
        .eq('slug', workspace_id)
        .single();
      
      if (wsBySlug) {
        resolvedWorkspaceId = wsBySlug.id;
      } else {
        // Fallback to the first workspace in the DB
        const { data: firstWs } = await supabase
          .from('workspaces')
          .select('id')
          .limit(1)
          .single();
        if (firstWs) {
          resolvedWorkspaceId = firstWs.id;
        }
      }
    }

    const diagnostic = await DiagnosticEngine.runDiagnostic(resolvedWorkspaceId, brand_slug, domain_slug);
    
    let insertData;
    let insertError;

    // Try with domain_slug first
    const res1 = await supabase
      .from('deep_dive_sessions')
      .insert({
        workspace_id: resolvedWorkspaceId,
        brand_slug,
        brand_name: brand_slug,
        domain_slug,
        status: 'diagnosing',
        diagnostic_snapshot: diagnostic,
        subscription_tier: 'pro_monthly'
      })
      .select('id')
      .single();
      
    insertData = res1.data;
    insertError = res1.error;

    // Fallback if domain_slug column doesn't exist
    if (insertError && insertError.message?.includes('domain_slug')) {
      const res2 = await supabase
        .from('deep_dive_sessions')
        .insert({
          workspace_id: resolvedWorkspaceId,
          brand_slug,
          brand_name: brand_slug,
          status: 'diagnosing',
          diagnostic_snapshot: diagnostic,
          subscription_tier: 'pro_monthly'
        })
        .select('id')
        .single();
      
      insertData = res2.data;
      insertError = res2.error;
    }

    if (insertError || !insertData) throw insertError || new Error("Insert failed");

    return NextResponse.json({ session_id: insertData.id, diagnostic });
  } catch (error: any) {
    console.error('[deep-dive] Diagnose API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
