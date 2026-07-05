import { type NextRequest, NextResponse } from 'next/server';
import { SignalEvaluator } from '@/lib/signal-collection/signal-evaluator';
import { VolumeEstimator } from '@/lib/signal-collection/volume-estimator';
import { getSupabaseAdminClient } from '@/lib/supabase';

export const maxDuration = 60;

/**
 * POST /api/v1/qis/signals/score
 * 개별 질문 평가 및 QVS/CPS 산출
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, brand_name, repeats, industry_key, workspace_id } = body;

    if (!question) {
      return NextResponse.json({ error: 'Missing required field: question' }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    // 1. 지식 그래프 노드 및 TCO 개념 로드 (있다면)
    let kgNodeNames: string[] = [];
    if (workspace_id) {
      const { data: nodes } = await supabase
        .from('brand_ontology_nodes')
        .select('node_name')
        .eq('workspace_id', workspace_id);
      if (nodes) kgNodeNames = nodes.map(n => n.node_name);
    }

    // 2. QVS 8D 및 Gate 판정 실행
    const evalResult = await SignalEvaluator.evaluateWithConfidence(
      question,
      brand_name,
      repeats || 1,
      kgNodeNames,
      undefined,
      workspace_id
    );

    // 3. 검색량 추정
    const volume = await VolumeEstimator.estimateVolume(question);

    // 4. CPS (Composite Promotion Score) 가중 계산
    // 실측 KG Coverage와 TCO 개념 매칭은 테스트용/개별 평가를 위해 fallback 적용
    const qvsNorm = evalResult.qvs_total / 100;
    const volNorm = Math.min(1.0, volume / 10000);
    const ymylWeight = evalResult.step1.is_ymyl ? 1.0 : 0.5;

    const cpsScore = parseFloat((
      (0.3 * qvsNorm) + 
      (0.25 * volNorm) + 
      (0.2 * 0.5) + // tco match fallback
      (0.15 * 0.4) + // kg coverage fallback
      (0.10 * ymylWeight)
    ).toFixed(4));

    return NextResponse.json({
      ok: true,
      data: {
        question,
        volume,
        intent: evalResult.step1.intent,
        is_ymyl: evalResult.step1.is_ymyl,
        qvs_total: evalResult.qvs_total,
        qvs_dimensions: evalResult.qvs,
        cps_score: cpsScore,
        gate_status: evalResult.gate_status,
        confidence: evalResult.confidence
      }
    });
  } catch (err: any) {
    console.error('[QIS Signals Score] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}
