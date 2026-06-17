import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../../lib/supabase';
import { ImpactSimulator } from '../../../../lib/deep-dive/impact-simulator';

export async function POST(req: Request) {
  try {
    const { session_id } = await req.json();
    
    const supabase = getSupabaseAdminClient();
    
    // Fetch session and blueprints
    const { data: session } = await supabase.from('deep_dive_sessions').select('*').eq('id', session_id).single();
    if (!session) throw new Error('Session not found');

    const { data: blueprints } = await supabase.from('deep_dive_content_blueprints').select('*').eq('session_id', session_id);
    if (!blueprints || blueprints.length === 0) throw new Error('No blueprints found');

    const simulation = ImpactSimulator.simulate(session.diagnostic_snapshot, blueprints);
    
    const { error: insertError } = await supabase
      .from('deep_dive_simulations')
      .insert({
        session_id,
        current_snapshot: simulation.current,
        projected_snapshot: simulation.projected,
        per_blueprint_contribution: simulation.per_blueprint_contribution,
        scenarios: simulation.scenarios
      });

    if (insertError) throw insertError;

    await supabase.from('deep_dive_sessions').update({ status: 'simulated' }).eq('id', session_id);

    return NextResponse.json({ simulation });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
