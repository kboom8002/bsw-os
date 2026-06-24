import { NextRequest, NextResponse } from 'next/server';
import { verifyQisRequest } from '@/lib/qis/qis-auth';
import { qisFeedbackBatchSchema } from '@/lib/qis-shared-schemas';
import { getSupabaseAdminClient } from '@/lib/supabase';
import { PredictionAccuracyTracker } from '@/lib/prediction/accuracy-tracker';

export async function POST(req: NextRequest) {
  // 1. 인증
  if (!verifyQisRequest(req)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = qisFeedbackBatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Invalid payload', details: parsed.error.issues }, { status: 400 });
    }

    const { feedbacks } = parsed.data;
    const tracker = new PredictionAccuracyTracker();
    const supabase = getSupabaseAdminClient();
    let processedCount = 0;

    for (const fb of feedbacks) {
      // 2. 피드백 기록 업데이트
      await supabase
        .from('bsw_predicted_questions')
        .update({
          emerged: fb.emerged,
          emerged_at: fb.emerged_at || (fb.emerged ? new Date().toISOString() : null),
          emergence_source: fb.emergence_source,
          actual_frequency: fb.actual_frequency
        })
        .eq('bsw_question_id', fb.bsw_question_id);

      // 3. 내부 accuracy tracker 호출하여 예측 정확도 재계산
      try {
        await tracker.verifyPrediction(fb.bsw_question_id);
      } catch (err) {
        console.warn(`[QIS Feedback] Failed to run prediction accuracy tracker for ${fb.bsw_question_id}`, err);
        // Continue processing others
      }
      
      processedCount++;
    }

    // 4. (선택적) 모델 가중치 재보정 (P2)
    // await tracker.recalibrateSignalWeights(workspaceId);

    return NextResponse.json({
      ok: true,
      data: { processed: processedCount }
    });

  } catch (error) {
    console.error('[QIS Feedback API] Error:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
