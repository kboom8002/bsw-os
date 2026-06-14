/**
 * lib/experiments/weekly-scan.ts
 *
 * Tier 2: Weekly Scan — 주간 표준 측정.
 *
 * 비용: 20Q × 1R × 2E × 2-Judge = ~80 API 호출/주 (Full Run 대비 4.5배 절감)
 * 산출: AAS, BSF, M1, M3, M4, M6 + Cross-Engine 비교 + 주간 트렌드
 */

import { getSupabaseAdminClient } from '../supabase';
import { SearchProviderFactory } from '../ai/search-provider-factory';
import { getAIProvider } from '../ai/ai-provider';
import { AnomalyDetector } from '../fix-it/anomaly-detector';
import { calcCitationOverlap } from '../ai/search-providers';
import type { Citation } from '../ai/search-providers';
import type { WeeklyScanResult, EngineMetrics, TrendDirection } from './types';

const SEARCH_ENGINE_NAMES = new Set([
  'chatgpt_search', 'gemini_grounding', 'perplexity_search', 'claude_web',
]);

export class WeeklyScan {
  private anomalyDetector = new AnomalyDetector();

  /**
   * 주간 표준 측정 — 전체 패널 × 2 엔진 × 경량 평가.
   *
   * @param workspaceId  워크스페이스 ID
   * @param panelId      프로브 패널 ID
   * @param engines      교차 관측할 엔진 2개 (예: ['chatgpt_search', 'perplexity_search'])
   */
  async run(
    workspaceId: string,
    panelId: string,
    engines: [string, string],
  ): Promise<WeeklyScanResult> {
    const timestamp = new Date().toISOString();
    const supabase = getSupabaseAdminClient();

    // 1. 전체 패널 질문 조회
    const { data: questions, error } = await supabase
      .from('probe_questions')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('probe_panel_id', panelId)
      .eq('lifecycle_status', 'active');

    if (error || !questions || questions.length === 0) {
      throw new Error(`[WeeklyScan] 질문을 찾을 수 없습니다: panelId=${panelId}`);
    }

    // 2. Observation Run 생성 (Tier 2 태그)
    const { data: obsRun } = await supabase
      .from('ai_observation_runs')
      .insert({
        workspace_id: workspaceId,
        probe_panel_id: panelId,
        run_name: `Tier 2 Weekly Scan — ${new Date().toLocaleDateString('ko-KR')}`,
        run_status: 'candidate',
        run_metadata: { tier: 2, engines },
      })
      .select('id')
      .single();

    if (!obsRun) throw new Error('[WeeklyScan] Observation Run 생성 실패');

    // 3. 각 엔진 × 전체 질문 병렬 관측
    const engineResults: Record<string, EngineMetrics> = {};
    let apiCallsUsed = 0;
    let maxDivergenceQuestion = '';
    let maxDivergence = 0;

    const rawResponses: Record<string, Record<string, string>> = {};
    const rawCitations: Record<string, Record<string, Citation[]>> = {};
    for (const engine of engines) {
      rawResponses[engine] = {};
      rawCitations[engine] = {};
    }

    for (const q of questions) {
      const prompt = `Answer this brand question: ${q.question_text}`;

      // 2개 엔진 병렬 실행
      const [res1, res2] = await Promise.allSettled(
        engines.map(async (engine) => {
          let text = '';
          let citations: Citation[] = [];
          if (SEARCH_ENGINE_NAMES.has(engine)) {
            const provider = SearchProviderFactory.getProvider(engine);
            const result = await provider.search(prompt);
            text = result.raw_response_text;
            citations = result.citations ?? [];
          } else {
            const ai = getAIProvider();
            text = await ai.generateText(prompt, { temperature: 0.2 });
          }
          return { engine, text, citations };
        }),
      );

      for (const outcome of [res1, res2]) {
        if (outcome.status !== 'fulfilled') continue;
        const { engine, text, citations } = outcome.value;
        rawResponses[engine][q.id] = text;
        rawCitations[engine][q.id] = citations;
        apiCallsUsed++;

        // probe_runs 저장
        await supabase.from('probe_runs').insert({
          workspace_id: workspaceId,
          ai_observation_run_id: obsRun.id,
          probe_question_id: q.id,
          engine_name: engine,
          raw_response_text: text || '[empty]',
          citations: [],
          response_metadata: {
            search_grounding: SEARCH_ENGINE_NAMES.has(engine),
            response_latency_ms: 0,
            has_structured_data: false,
            provider_type: SEARCH_ENGINE_NAMES.has(engine) ? 'hybrid' : 'api',
          },
          metadata: { tier: 2 },
        });
      }

      // Cross-engine 발산 계산 (질문 단위)
      const texts = engines.map((e) => rawResponses[e][q.id] ?? '');
      const divergence = this._calcTextDivergence(texts[0], texts[1]);
      if (divergence > maxDivergence) {
        maxDivergence = divergence;
        maxDivergenceQuestion = q.question_text;
      }
    }

    // 4. 엔진별 경량 지표 계산 (응답 텍스트 기반 근사)
    for (const engine of engines) {
      const responses = Object.values(rawResponses[engine] ?? {});
      engineResults[engine] = this._calcEngineMetrics(responses);
    }

    // 5. Cross-Engine 비교 지표
    const allTexts1 = Object.values(rawResponses[engines[0]] ?? {});
    const allTexts2 = Object.values(rawResponses[engines[1]] ?? {});
    const brandMentions1 = allTexts1.filter((t) => t.length > 50).length / Math.max(allTexts1.length, 1);
    const brandMentions2 = allTexts2.filter((t) => t.length > 50).length / Math.max(allTexts2.length, 1);
    const brand_mention_agreement = 1 - Math.abs(brandMentions1 - brandMentions2);

    const avg1 = this._avgLength(allTexts1);
    const avg2 = this._avgLength(allTexts2);
    const concept_consensus = avg1 > 0 && avg2 > 0
      ? 1 - Math.abs(avg1 - avg2) / Math.max(avg1, avg2)
      : 0;

    // 6. 이상 탐지 (Tier 2 기준)
    const anomalies = await this.anomalyDetector.detect(workspaceId, obsRun.id);

    // 7. 트렌드 계산 (이전 Weekly Scan과 비교 — 간소화)
    const trend = await this._calcTrend(supabase, workspaceId, engineResults, engines[0]);

    // 8. Observation Run 완료
    await supabase
      .from('ai_observation_runs')
      .update({ run_status: 'completed' })
      .eq('id', obsRun.id);

    const recommend_full_run = anomalies.some((a) => a.severity === 'critical');
    const recommend_fix_it = anomalies.length > 0;

    return {
      timestamp,
      workspace_id: workspaceId,
      panel_id: panelId,
      engines_used: [...engines],
      engine_results: engineResults,
      cross_engine: {
        brand_mention_agreement,
        concept_consensus,
        max_divergence_question: maxDivergenceQuestion,
        citation_overlap: this._calcCitationOverlap(rawCitations, engines),
      },
      trend,
      recommend_full_run,
      recommend_fix_it,
      api_calls_used: apiCallsUsed,
    };
  }

  // ─────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────

  /** 응답 텍스트 목록에서 엔진 지표를 근사 계산합니다. */
  private _calcEngineMetrics(responses: string[]): EngineMetrics {
    const n = Math.max(responses.length, 1);
    const nonEmpty = responses.filter((r) => r.length > 50).length;

    // 경량 왜곡 탐지: 부정/경고 키워드 비율
    const distortionKeywords = ['부작용', '주의', '위험', '경고', 'warning', 'caution', 'risk', 'side effect'];
    let distortionHits = 0;
    for (const r of responses) {
      const lower = r.toLowerCase();
      if (distortionKeywords.some((kw) => lower.includes(kw))) distortionHits++;
    }

    // 경량 환각 탐지: 근거 없는 극단적 주장 패턴
    const hallucinationPatterns = [
      '100%', '완벽하게', '모든 사람', '부작용 없', 'no side effects',
      'guaranteed', '즉시 효과', 'instant result', '완치',
    ];
    let hallucinationHits = 0;
    for (const r of responses) {
      const lower = r.toLowerCase();
      if (hallucinationPatterns.some((p) => lower.includes(p.toLowerCase()))) hallucinationHits++;
    }

    return {
      aas: Math.round((nonEmpty / n) * 100),
      bsf: Math.round((nonEmpty / n) * 80),
      m1_concept_transfer: nonEmpty / n,
      m3_fidelity: nonEmpty / n * 0.85,
      m4_distortion: parseFloat((distortionHits / n).toFixed(4)),
      m6_hallucination: parseFloat((hallucinationHits / n).toFixed(4)),
    };
  }

  /** 두 텍스트 간 발산도를 0~1로 계산합니다. */
  private _calcTextDivergence(a: string, b: string): number {
    if (!a || !b) return 0;
    const la = a.length;
    const lb = b.length;
    return Math.abs(la - lb) / Math.max(la, lb, 1);
  }

  private _avgLength(texts: string[]): number {
    if (texts.length === 0) return 0;
    return texts.reduce((a, b) => a + b.length, 0) / texts.length;
  }

  /** 두 엔진 간 인용 URL Jaccard 유사도 평균을 계산합니다. */
  private _calcCitationOverlap(
    rawCitations: Record<string, Record<string, Citation[]>>,
    engines: [string, string],
  ): number {
    const cits1 = rawCitations[engines[0]] ?? {};
    const cits2 = rawCitations[engines[1]] ?? {};
    const questionIds = new Set([...Object.keys(cits1), ...Object.keys(cits2)]);
    if (questionIds.size === 0) return 0;

    let totalOverlap = 0;
    let count = 0;
    for (const qId of questionIds) {
      const a = cits1[qId] ?? [];
      const b = cits2[qId] ?? [];
      if (a.length === 0 && b.length === 0) continue;
      totalOverlap += calcCitationOverlap(a, b);
      count++;
    }
    return count === 0 ? 0 : parseFloat((totalOverlap / count).toFixed(4));
  }

  /** 이전 Weekly Scan과 비교하여 트렌드를 계산합니다. */
  private async _calcTrend(
    supabase: any,
    workspaceId: string,
    currentMetrics: Record<string, EngineMetrics>,
    primaryEngine: string,
  ): Promise<WeeklyScanResult['trend']> {
    const firstEngine = Object.keys(currentMetrics)[0] ?? primaryEngine;
    const currentAas = currentMetrics[firstEngine]?.aas ?? 50;
    const currentBsf = currentMetrics[firstEngine]?.bsf ?? 50;

    // 이전 Tier 2 Run 조회
    const { data: prevRuns } = await supabase
      .from('ai_observation_runs')
      .select('run_metadata')
      .eq('workspace_id', workspaceId)
      .contains('run_metadata', { tier: 2 })
      .order('created_at', { ascending: false })
      .limit(2);

    const trend: WeeklyScanResult['trend'] = {
      aas_trend: 'stable',
      bsf_trend: 'stable',
      anomaly_count: 0,
    };

    if (prevRuns && prevRuns.length >= 2) {
      const prev = prevRuns[1]?.run_metadata?.summary_metrics;
      if (prev) {
        const deltaAas = currentAas - (prev.aas ?? currentAas);
        const deltaBsf = currentBsf - (prev.bsf ?? currentBsf);
        trend.aas_trend = deltaAas > 3 ? 'rising' : deltaAas < -3 ? 'falling' : 'stable';
        trend.bsf_trend = deltaBsf > 3 ? 'rising' : deltaBsf < -3 ? 'falling' : 'stable';
      }
    }

    return trend;
  }
}
