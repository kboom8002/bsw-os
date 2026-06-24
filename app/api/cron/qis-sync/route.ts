import { NextRequest, NextResponse } from 'next/server';
import { QisHubClient } from '@/lib/qis/hub-client';
import { QuestionPredictor } from '@/lib/prediction/question-predictor';
import { KWeddingHubCollector } from '@/lib/prediction/signal-collectors/kweddinghub-collector';
import { getSupabaseAdminClient } from '@/lib/supabase';
import { QisPredictedQuestion } from '@/lib/qis-shared-schemas';

export const maxDuration = 120;

/**
 * GET /api/cron/qis-sync
 *
 * QIS 연동 Cron API.
 * BSW가 Hub에서 시그널/메트릭/기대층을 능동 수집(Pull)하고,
 * 분석 결과인 예측 질문을 Hub에 공급(Push)합니다.
 *
 * Vercel cron 설정 (vercel.json):
 * {
 *   "crons": [
 *     {
 *       "path": "/api/cron/qis-sync?secret=CRON_SECRET",
 *       "schedule": "0 3 * * *"
 *     }
 *   ]
 * }
 *
 * Query params:
 *   - secret: CRON_SECRET 토큰 (보안용)
 *   - phase: 'pull' | 'push' | 'all' (default: 'all')
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && secret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const phase = searchParams.get('phase') ?? 'all';
  const workspaceId = process.env.BSW_WORKSPACE_ID ?? process.env.DEFAULT_WORKSPACE_ID ?? 'demo-workspace-id';

  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    phase,
    pull: {},
    push: {}
  };

  const hubClient = new QisHubClient();

  // ═══ Phase 1: Pull — Hub에서 데이터 수집 ═══
  if (phase === 'pull' || phase === 'all') {
    try {
      // 1a. 시그널 수집 (기존 KWeddingHubCollector 활용)
      const collector = new KWeddingHubCollector();
      const signals = await collector.collect(workspaceId, 'wedding');
      results.pull.signals = { count: signals.length, status: 'ok' };

      // 시그널을 bsw_received_signals에도 기록
      if (signals.length > 0) {
        const supabase = getSupabaseAdminClient();
        const insertData = signals.map(sig => ({
          source_platform: 'kweddinghub',
          signal_type: (sig.ai_analysis as any)?.source_channel || 'community_question',
          industry: sig.industry,
          raw_text: sig.raw_text,
          metadata: sig.ai_analysis || {},
          predicted_impact: sig.predicted_impact,
          detected_at: new Date().toISOString()
        }));

        await supabase.from('bsw_received_signals').insert(insertData);
      }
    } catch (err: any) {
      results.pull.signals = { count: 0, status: 'error', message: err.message };
    }

    try {
      // 1b. 메트릭 수집
      const metricsCount = await hubClient.pullMetrics('kwedding');
      results.pull.metrics = { count: metricsCount, status: 'ok' };
    } catch (err: any) {
      results.pull.metrics = { count: 0, status: 'error', message: err.message };
    }

    try {
      // 1c. 기대층 수집
      const layersCount = await hubClient.pullExpectedLayers('kwedding');
      results.pull.layers = { count: layersCount, status: 'ok' };
    } catch (err: any) {
      results.pull.layers = { count: 0, status: 'error', message: err.message };
    }
  }

  // ═══ Phase 2: Push — 예측 질문을 Hub에 공급 ═══
  if (phase === 'push' || phase === 'all') {
    try {
      const supabase = getSupabaseAdminClient();

      // 아직 Hub에 전송하지 않은 최신 예측 질문 조회
      // predicted_questions 테이블에서 가져와 bsw_predicted_questions에 동기화
      const { data: newPredictions } = await supabase
        .from('predicted_questions')
        .select('*')
        .eq('industry', 'wedding')
        .gte('confidence', 0.7)
        .order('created_at', { ascending: false })
        .limit(50);

      if (newPredictions && newPredictions.length > 0) {
        const questions: QisPredictedQuestion[] = newPredictions.map(pred => ({
          bsw_question_id: pred.id,
          question_text: pred.question_text,
          predicted_intent: pred.predicted_intent,
          predicted_volume: pred.predicted_volume as 'low' | 'medium' | 'high',
          confidence: Number(pred.confidence),
          first_mover_window_days: pred.first_mover_window_days,
          current_ai_coverage: pred.current_ai_coverage as 'none' | 'sparse' | 'moderate' | 'saturated',
          auto_must_include: pred.auto_must_include || [],
          auto_must_not_do: pred.auto_must_not_do || [],
          qvs_composite: undefined
        }));

        // bsw_predicted_questions 테이블에 동기화 (upsert)
        for (const q of questions) {
          await supabase
            .from('bsw_predicted_questions')
            .upsert({
              bsw_question_id: q.bsw_question_id,
              question_text: q.question_text,
              predicted_intent: q.predicted_intent,
              predicted_volume: q.predicted_volume,
              confidence: q.confidence,
              first_mover_window_days: q.first_mover_window_days,
              current_ai_coverage: q.current_ai_coverage,
              auto_must_include: q.auto_must_include,
              auto_must_not_do: q.auto_must_not_do
            }, { onConflict: 'bsw_question_id' });
        }

        // Hub에 Push
        const pushSuccess = await hubClient.pushPredictedQuestions(questions);

        results.push = {
          count: questions.length,
          pushed: pushSuccess,
          status: pushSuccess ? 'ok' : 'push_failed'
        };
      } else {
        results.push = { count: 0, status: 'no_new_predictions' };
      }
    } catch (err: any) {
      results.push = { count: 0, status: 'error', message: err.message };
    }
  }

  return NextResponse.json({ ok: true, data: results });
}
