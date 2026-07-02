import { NextRequest, NextResponse } from 'next/server';
import { QisHubClient } from '@/lib/qis/hub-client';
import { KWeddingHubCollector } from '@/lib/prediction/signal-collectors/kweddinghub-collector';
import { getSupabaseAdminClient } from '@/lib/supabase';
import { QisPredictedQuestion } from '@/lib/qis-shared-schemas';
import { enrichPredictionWithAxis, buildTriAxisPayload } from '@/lib/qis/tri-axis-router';
import { SignalOrchestrator } from '@/lib/signal-collection/orchestrator';

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
 *   - phase: 'pull' | 'push' | 'standalone' | 'all' (default: 'all')
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const cronSecret = process.env.CRON_SECRET;

  // 1) Vercel Cron 자동 실행 — Authorization 헤더
  const authHeader = request.headers.get('authorization');
  const isVercelCron = cronSecret && authHeader === `Bearer ${cronSecret}`;

  // 2) 수동 URL 트리거 — ?secret= 파라미터
  const isSecretParam = cronSecret && secret === cronSecret;

  // 3) 내부 UI 수동 트리거 — X-Manual-Trigger 헤더 (same-origin만 허용)
  const isManualUiTrigger = request.headers.get('X-Manual-Trigger') === 'true';

  if (cronSecret && !isVercelCron && !isSecretParam && !isManualUiTrigger) {
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
        // 예측 질문 기본 구조 생성
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
          qvs_composite: undefined,
          // 3축 기본값 (enrichPredictionWithAxis에서 실제 값으로 대체됨)
          target_axis: 'industry' as const,
          geo_keywords: [],
          recommended_formats: [],
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

        // ═══ 3축 라우팅: 예측 질문의 원본 신호에서 축 컨텍스트 추출 ═══
        // 최근 수신 신호를 조회하여 예측 질문과 매칭
        const { data: recentSignals } = await supabase
          .from('bsw_received_signals')
          .select('raw_text, industry, hub_axis, place_slug, vortex_slug, geo_context, predicted_impact')
          .order('created_at', { ascending: false })
          .limit(100);

        // raw_text 기반으로 가장 가까운 신호 매칭
        const enrichedQuestions = questions.map(q => {
          const matchingSignal = (recentSignals || []).find(
            s => s.raw_text && q.question_text.includes(s.raw_text.slice(0, 20))
          );
          // 매칭된 신호가 있으면 축 정보로 강화, 없으면 question_text로 자동 감지
          const syntheticSignal = matchingSignal || {
            raw_text: q.question_text,
            industry: q.question_text,
            hub_axis: 'industry' as const,
            source_platform: 'aihompyhub' as const,
            signal_type: 'community_question' as const,
            predicted_impact: 'medium' as const,
            detected_at: new Date().toISOString(),
          };
          return enrichPredictionWithAxis(q, syntheticSignal as any);
        });

        // 3축 그룹별로 Hub에 Push
        const triAxis = buildTriAxisPayload(enrichedQuestions);
        const pushResults: Record<string, boolean> = {};

        // Industry (기존 경로)
        if (triAxis.industry.length > 0) {
          pushResults.industry = await hubClient.pushPredictedQuestions(triAxis.industry);
        }

        // Place
        if (triAxis.place.length > 0) {
          pushResults.place = await hubClient.pushPredictedQuestions(
            triAxis.place,
            { axis: 'place' }
          );
        }

        // Vortex
        if (triAxis.vortex.length > 0) {
          pushResults.vortex = await hubClient.pushPredictedQuestions(
            triAxis.vortex,
            { axis: 'vortex' }
          );
        }

        // Cross-Axis
        if (triAxis.crossAxis.length > 0) {
          pushResults.crossAxis = await hubClient.pushPredictedQuestions(
            triAxis.crossAxis,
            { axis: 'cross_axis' }
          );
        }

        const totalPushed = Object.values(pushResults).filter(Boolean).length;

        results.push = {
          count: enrichedQuestions.length,
          triAxisBreakdown: {
            industry: triAxis.industry.length,
            place: triAxis.place.length,
            vortex: triAxis.vortex.length,
            crossAxis: triAxis.crossAxis.length,
          },
          pushResults,
          status: totalPushed > 0 ? 'ok' : 'push_failed'
        };
      } else {
        results.push = { count: 0, status: 'no_new_predictions' };
      }
    } catch (err: any) {
      results.push = { count: 0, status: 'error', message: err.message };
    }
  }
  // ═══ Phase 3: Standalone — 독립 모드 (Hub 없이 자체 예측) ═══
  // Hub 연동 없이 자체적으로 S-OGDE 파이프라인 + 벤치마크 기회 피딩을 실행
  if (phase === 'standalone' || (phase === 'all' && process.env.STANDALONE_MODE === 'true')) {
    try {
      const brandName = process.env.BSW_BRAND_NAME ?? 'demo-brand';
      const domainName = process.env.BSW_DOMAIN_NAME ?? 'demo-domain';

      // 3a. S-OGDE 파이프라인 실행 → 시그널 수집
      const pipelineResult = await SignalOrchestrator.runFullPipeline(
        workspaceId,
        domainName,
        brandName
      );

      // 3b. 벤치마크 기회 → 시그널 자동 피딩
      let benchmarkFedCount = 0;
      try {
        const supabase = getSupabaseAdminClient();
        const { data: recentSnapshots } = await supabase
          .from('industry_benchmark_snapshots')
          .select('auto_generated_signals')
          .eq('workspace_id', workspaceId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (recentSnapshots) {
          const autoSignals: Array<{ query: string; intent: string; source: string }> = [];
          for (const snap of recentSnapshots) {
            if (snap.auto_generated_signals && Array.isArray(snap.auto_generated_signals)) {
              autoSignals.push(...(snap.auto_generated_signals as any[]));
            }
          }

          if (autoSignals.length > 0) {
            const { feedBenchmarkOpportunitiesToSignals } = await import('@/app/actions/qis-bridge');
            const feedResult = await feedBenchmarkOpportunitiesToSignals(workspaceId, autoSignals);
            benchmarkFedCount = feedResult.fedCount;
          }
        }
      } catch (bmErr: any) {
        console.warn('[QIS-Sync Standalone] Benchmark feed skipped:', bmErr.message);
      }

      results.standalone = {
        signalsGenerated: pipelineResult.savedSignals,
        benchmarkSignalsFed: benchmarkFedCount,
        mode: 'standalone',
        status: 'ok'
      };
    } catch (err: any) {
      results.standalone = {
        signalsGenerated: 0,
        benchmarkSignalsFed: 0,
        status: 'error',
        message: err.message
      };
    }
  }

  // ═══ Phase 4: Feedback Loop — 성과 기반 가중치 재학습 (P2-1) ═══
  if (phase === 'standalone' || phase === 'all' || phase === 'feedback') {
    try {
      const { SignalPerformanceTracker } = await import('@/lib/signal-collection/signal-performance-tracker');
      const weights = await SignalPerformanceTracker.learnWeights(workspaceId);
      results.feedback = { status: 'ok', updatedWeights: weights };
    } catch (err: any) {
      console.warn('[QIS-Sync Feedback] Feedback learn failed:', err.message);
      results.feedback = { status: 'error', message: err.message };
    }
  }

  return NextResponse.json({ ok: true, data: results });
}
