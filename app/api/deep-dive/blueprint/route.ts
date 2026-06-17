import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../../lib/supabase';
import { ContentBlueprintGenerator } from '../../../../lib/deep-dive/content-blueprint-gen';

export async function POST(req: Request) {
  try {
    const { session_id, workspace_id, accepted_question_ids } = await req.json();
    
    const supabase = getSupabaseAdminClient();
    
    const { data: cands } = await supabase
      .from('deep_dive_target_questions')
      .select('*')
      .eq('session_id', session_id)
      .in('id', accepted_question_ids);
      
    if (!cands || cands.length === 0) {
      return NextResponse.json({ blueprints: [] });
    }

    const blueprints = await ContentBlueprintGenerator.generate(workspace_id, cands);
    
    const inserts = blueprints.map(b => ({
      session_id,
      target_question_id: b.target_question_id,
      target_cq_id: b.target_cq_id,
      content_type: b.content_type,
      title_suggestion_ko: b.title_suggestion_ko,
      heading_structure: b.heading_structure,
      expected_layer: b.expected_layer,
      schema_suggestions: b.schema_suggestions,
      linked_evidence_ids: b.linked_evidence_ids,
      linked_claim_ids: b.linked_claim_ids,
      linked_boundary_ids: b.linked_boundary_ids,
      prescription_source: b.prescription_source,
      estimated_aepi_impact: b.estimated_aepi_impact,
      estimated_bdr_delta: b.estimated_bdr_delta,
      priority_rank: b.priority_rank
    }));

    const { error: insertError } = await supabase
      .from('deep_dive_content_blueprints')
      .insert(inserts);

    if (insertError) throw insertError;

    await supabase.from('deep_dive_sessions').update({ status: 'blueprinted' }).eq('id', session_id);

    return NextResponse.json({ blueprints });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
