import { type NextRequest, NextResponse } from 'next/server';
import { verifyQisRequest } from '@/lib/qis/qis-auth';
import { getSupabaseAdminClient } from '@/lib/supabase';
import { qisSignalBatchSchema } from '@/lib/qis-shared-schemas';
import { QuestionPredictor } from '@/lib/prediction/question-predictor';

export const maxDuration = 60;

/**
 * POST /api/v1/qis/signals/ingest
 * Hub 플랫폼에서 전송한 QIS 신호를 수신하여 저장하고,
 * 자동으로 예측 질문을 생성합니다.
 */
export async function POST(request: NextRequest) {
  // 인증 검증
  if (!verifyQisRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // 단일 신호도 배치로 처리
    const signals = body.signals || [body];
    const parsed = qisSignalBatchSchema.safeParse({ signals });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();
    const results = {
      received: 0,
      stored: 0,
      predictions_generated: 0,
      errors: [] as string[],
    };

    const predictor = new QuestionPredictor();

    for (const signal of parsed.data.signals) {
      results.received++;

      // 1. bsw_received_signals 테이블에 저장 (3축 컨텍스트 포함)
      const { error: insertError } = await supabase
        .from('bsw_received_signals')
        .insert({
          source_platform: signal.source_platform,
          signal_type: signal.signal_type,
          industry: signal.industry,
          hub_slug: signal.hub_slug,
          // ── 3축 컨텍스트 ──
          hub_axis: signal.hub_axis || 'industry',
          place_slug: signal.place_slug || null,
          vortex_slug: signal.vortex_slug || null,
          geo_context: signal.geo_context || null,
          // ── 기존 필드 ──
          tenant_id: signal.tenant_id || null,
          raw_text: signal.raw_text,
          metadata: signal.metadata || {},
          predicted_impact: signal.predicted_impact,
          detected_at: signal.detected_at || new Date().toISOString(),
        });

      if (insertError) {
        results.errors.push(`Store failed: ${insertError.message}`);
        continue;
      }
      results.stored++;

      // 2. EmergenceSignal로 변환하여 예측 질문 생성
      try {
        const emergenceSignal = {
          id: crypto.randomUUID(),
          source_type: signal.source_platform || 'community',
          industry: signal.industry,
          raw_text: signal.raw_text,
          predicted_impact: signal.predicted_impact as 'low' | 'medium' | 'high' | 'critical',
          detected_at: signal.detected_at || new Date().toISOString(),
          ai_analysis: (signal.metadata || {}) as Record<string, unknown>,
          status: 'new' as const,
        };

        const predictions = await predictor.predictQuestionsFromSignal(emergenceSignal);
        results.predictions_generated += predictions.length;
      } catch (predError) {
        // 예측 실패해도 신호 저장은 유지
        const msg = predError instanceof Error ? predError.message : String(predError);
        results.errors.push(`Prediction failed for signal: ${msg}`);
      }
    }

    return NextResponse.json({
      ok: true,
      ...results,
    });
  } catch (error) {
    console.error('[QIS Signals Ingest] Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
