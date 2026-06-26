import { NextRequest, NextResponse } from 'next/server';
import { verifyQisRequest } from '@/lib/qis/qis-auth';
import { getSupabaseAdminClient } from '@/lib/supabase';
import { QisPredictedQuestion } from '@/lib/qis-shared-schemas';

export async function GET(req: NextRequest) {
  // 1. 인증
  if (!verifyQisRequest(req)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const minConfidence = parseFloat(url.searchParams.get('min_confidence') || '0.7');

    const supabase = getSupabaseAdminClient();

    // 2. 예측 데이터 조회
    const { data, error } = await supabase
      .from('bsw_predicted_questions')
      .select('*')
      .gte('confidence', minConfidence)
      .eq('emerged', false) // 아직 출현하지 않은 예측만
      .order('confidence', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    // 3. 스키마에 맞게 매핑
    const predictions: QisPredictedQuestion[] = (data || []).map(row => ({
      bsw_question_id: row.bsw_question_id,
      question_text: row.question_text,
      predicted_intent: row.predicted_intent,
      predicted_volume: row.predicted_volume as 'low' | 'medium' | 'high',
      confidence: Number(row.confidence),
      first_mover_window_days: row.first_mover_window_days,
      current_ai_coverage: row.current_ai_coverage as 'none' | 'sparse' | 'moderate' | 'saturated',
      auto_must_include: row.auto_must_include || [],
      auto_must_not_do: row.auto_must_not_do || [],
      qvs_composite: row.qvs_composite ? Number(row.qvs_composite) : undefined,
      // 3축 기본값
      target_axis: (row as any).target_axis || 'industry',
      geo_keywords: (row as any).geo_keywords || [],
      recommended_formats: (row as any).recommended_formats || [],
    }));

    return NextResponse.json({
      ok: true,
      data: { predictions }
    });

  } catch (error) {
    console.error('[QIS Predictions API] Error:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
