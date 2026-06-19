import { NextResponse } from 'next/server';
import { ImpactSimulator } from '../../../../lib/deep-dive/impact-simulator';
import { getDomainConfig } from '../../../../lib/benchmark/domain-config';

export const maxDuration = 120; // Vercel Pro

export async function POST(req: Request) {
  try {
    const { session_id, diagnostic, candidates, brand_slug, domain_slug } = await req.json();

    const domainConfig = getDomainConfig(domain_slug as any);
    const brand = domainConfig?.brands.find(b => b.slug === brand_slug);
    const brandName = brand?.name || brand_slug;

    if (!diagnostic || !candidates || candidates.length === 0) {
      return NextResponse.json({ success: false, message: 'Missing data for simulation' }, { status: 400 });
    }

    const simulation = await ImpactSimulator.simulate(candidates, diagnostic, brandName);

    // Save simulation to session
    if (session_id) {
      try {
        const { getSupabaseAdminClient } = await import('../../../../lib/supabase');
        const supabase = getSupabaseAdminClient();
        await supabase
          .from('deep_dive_sessions')
          .update({ simulation, status: 'simulated', completed_at: new Date().toISOString() })
          .eq('id', session_id);
      } catch (e) {
        console.warn('[deep-dive] Could not save simulation to session:', e);
      }
    }

    return NextResponse.json({ success: true, simulation });
  } catch (error: any) {
    console.error('[deep-dive] Simulation failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
