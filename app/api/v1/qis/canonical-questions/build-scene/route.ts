import { type NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase';
import { SceneBuilder } from '@/lib/qis/scene-builder';

export const maxDuration = 120;

/**
 * POST /api/v1/qis/canonical-questions/build-scene
 * 대표 질문(CQ)에 대한 QIS Scene 구축 및 저장
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { canonical_question_id, workspace_id, domain_id } = body;

    if (!canonical_question_id || !workspace_id || !domain_id) {
      return NextResponse.json({ error: 'Missing required fields: canonical_question_id, workspace_id, domain_id' }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    // 1. canonical_questions 테이블에서 CQ 조회
    const { data: cq, error: cqErr } = await supabase
      .from('canonical_questions')
      .select('*')
      .eq('id', canonical_question_id)
      .single();

    if (cqErr || !cq) {
      return NextResponse.json({ error: `Canonical Question not found: ${cqErr?.message}` }, { status: 404 });
    }

    // 2. SceneBuilder 구동
    const builder = new SceneBuilder();
    const sceneResult = await builder.buildScene(workspace_id, domain_id, {
      id: cq.id,
      normalized_question: cq.normalized_question,
      primary_intent: cq.primary_intent || 'informational',
      risk_level: cq.risk_level || 'medium',
      constraints: cq.constraints || [],
      evidence_need: cq.evidence_need || []
    });

    // 3. qis_scenes 테이블에 Scene 적재 (확장 컬럼 포함)
    const scenePayload = {
      workspace_id,
      canonical_question_id,
      scene_name: sceneResult.scene_name,
      query_template: cq.normalized_question, // 질문 원본 템플릿화
      intent_model: sceneResult.intent_model.primary_intent,
      scenario_context: sceneResult.answer_policy.short_answer_rule,
      risk_level: sceneResult.risk_policy.risk_level,
      
      // QPA-OS 확장 컬럼들
      domain_id,
      context_tensor: sceneResult.context_tensor,
      evidence_requirements: sceneResult.evidence_requirements,
      risk_policy: sceneResult.risk_policy,
      answer_policy: sceneResult.answer_policy,
      cta_policy: sceneResult.cta_policy,
      must_do: sceneResult.must_do,
      must_not_do: sceneResult.must_not_do,
      output_targets: sceneResult.output_targets,
      readiness_score: sceneResult.readiness_score
    };

    const { data: storedScene, error: insertErr } = await supabase
      .from('qis_scenes')
      .insert(scenePayload)
      .select('*')
      .single();

    if (insertErr) {
      return NextResponse.json({ error: `Failed to save QIS Scene: ${insertErr.message}` }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      data: storedScene
    });
  } catch (err: any) {
    console.error('[QIS Scene Build] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}
