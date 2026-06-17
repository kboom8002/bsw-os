import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../../lib/supabase';
import { TargetQisEngine } from '../../../../lib/deep-dive/target-qis-engine';

export async function POST(req: Request) {
  try {
    const { session_id, workspace_id, brand_slug } = await req.json();
    
    // In reality, we'd run QisCrossMapper here to get mappings.
    // For demo, we just pass an empty array to our mock TargetQisEngine.
    const candidates = await TargetQisEngine.discoverTargets(workspace_id, brand_slug, []);
    
    const supabase = getSupabaseAdminClient();
    
    const inserts = candidates.map(c => ({
      session_id,
      question_text: c.question_text,
      sources: c.sources,
      composite_priority: c.composite_priority,
      eeat_dimension: c.eeat_dimension,
      current_ai_coverage: c.current_ai_coverage,
      competitors_owning: c.competitors_owning,
      estimated_aepi_impact: c.estimated_aepi_impact,
      estimated_bdr_delta: c.estimated_bdr_delta,
      first_mover_window_days: c.first_mover_window_days,
      admin_approval_status: 'pending', // 2차 승인 대기 상태
      user_decision: 'pending'
    }));

    const { error: insertError } = await supabase
      .from('deep_dive_target_questions')
      .insert(inserts);

    if (insertError) throw insertError;

    await supabase.from('deep_dive_sessions').update({ status: 'discovered' }).eq('id', session_id);

    return NextResponse.json({ candidates });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
