import { NextResponse } from 'next/server';
import { TargetQisEngine } from '../../../../lib/deep-dive/target-qis-engine';
import { getDomainConfig } from '../../../../lib/benchmark/domain-config';
import { getSupabaseAdminClient } from '../../../../lib/supabase';

export const maxDuration = 120; // Vercel Pro

export async function POST(req: Request) {
  try {
    const { session_id, workspace_id, brand_slug, domain_slug, mappings, opportunity_report } = await req.json();

    if (!workspace_id || !brand_slug || !domain_slug) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    const domainConfig = getDomainConfig(domain_slug as any);
    if (!domainConfig) {
      return NextResponse.json({ success: false, message: 'Invalid domain slug' }, { status: 400 });
    }

    // Call TargetQisEngine
    const candidates = await TargetQisEngine.discoverTargets(
      workspace_id,
      brand_slug,
      mappings || [],
      opportunity_report,
      domainConfig
    );

    // Save candidates to session
    if (session_id) {
      try {
        const supabase = getSupabaseAdminClient();
        await supabase
          .from('deep_dive_sessions')
          .update({ discovered_candidates: candidates, status: 'discovered' })
          .eq('id', session_id);
      } catch (e) {
        console.warn('[deep-dive] Could not save candidates to session:', e);
      }
    }

    return NextResponse.json({
      success: true,
      candidates
    });
  } catch (error: any) {
    console.error('[deep-dive] Discover failed:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
