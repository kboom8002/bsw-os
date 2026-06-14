/**
 * lib/experiments/repeated-runner.ts  (Tier 3 — Full Observation Runner)
 *
 * 전체 패널 × N 반복 × 다중 엔진 × 6-Judge 완전 평가.
 * - 기존 AIProvider 단일 모드 유지 (하위 호환)
 * - SearchProvider 통합으로 실제 웹 검색 엔진 응답 수집 지원
 * - Multi-Engine 모드: engines 배열에 복수 엔진 지정 시 병렬 관측
 */

import { getSupabaseAdminClient } from '../supabase';
import { JudgePipeline } from '../judges/judge-pipeline';
import { getAIProvider } from '../ai/ai-provider';
import { SearchProviderFactory } from '../ai/search-provider-factory';
import type { Citation } from '../ai/search-providers';

export interface RepeatedRunnerOptions {
  /**
   * 관측에 사용할 엔진 목록.
   * - 기존 AIProvider 엔진: 'mock_provider', 'gemini-2.5-flash', 'gpt-4o-mini', 'claude-sonnet-4-5'
   * - SearchProvider 엔진:  'chatgpt_search', 'gemini_grounding', 'perplexity_search', 'claude_web'
   * 비어 있으면 AI_PROVIDER_MODE 환경변수 기반 단일 엔진으로 동작합니다.
   */
  engines?: string[];
  /** 브랜드 도메인 목록 (OCR 계산용) */
  brandDomains?: string[];
}

const SEARCH_ENGINES = new Set([
  'chatgpt_search',
  'gemini_grounding',
  'perplexity_search',
  'claude_web',
]);

export class RepeatedRunner {
  private pipeline = new JudgePipeline();

  /**
   * Runs N repetitions of observations for all questions in a probe panel.
   *
   * @param workspaceId  워크스페이스 ID
   * @param panelId      프로브 패널 ID
   * @param repetitions  반복 횟수
   * @param condition    실험 조건
   * @param options      엔진 목록, 브랜드 도메인 등 옵션
   */
  public async run(
    workspaceId: string,
    panelId: string,
    repetitions: number,
    condition: 'baseline' | 'intervention' = 'baseline',
    options: RepeatedRunnerOptions = {},
  ): Promise<{ observationRunId: string; totalRuns: number }> {
    const supabase = getSupabaseAdminClient();
    const mode = process.env.AI_PROVIDER_MODE || 'mock';

    // 브랜드 도메인 설정
    if (options.brandDomains?.length) {
      SearchProviderFactory.setBrandDomains(options.brandDomains);
    }

    // 사용할 엔진 결정
    const engines = options.engines ?? [];
    const useSearchProviders = engines.some((e) => SEARCH_ENGINES.has(e));

    // 1. 패널의 질문 목록 조회
    const { data: questions, error: qErr } = await supabase
      .from('probe_questions')
      .select('*')
      .eq('probe_panel_id', panelId);

    if (qErr || !questions || questions.length === 0) {
      throw new Error(`Failed to fetch probe questions: ${qErr?.message || 'No questions found'}`);
    }

    // 엔진 표시명 결정
    const engineLabel = engines.length > 0
      ? engines.join('+')
      : (mode === 'gemini' ? 'gemini-2.5-flash' : mode === 'openai' ? 'gpt-4o-mini' : mode === 'claude' ? 'claude-sonnet-4-5' : 'mock_provider');

    // 2. AI Observation Run 생성
    const { data: obsRun, error: obsErr } = await supabase
      .from('ai_observation_runs')
      .insert({
        workspace_id: workspaceId,
        probe_panel_id: panelId,
        run_name: `Tier 3 Full Run (${condition.toUpperCase()}) — ${new Date().toLocaleDateString('ko-KR')}`,
        run_status: 'candidate',
        condition,
        run_metadata: {
          repetitions,
          engines: engines.length > 0 ? engines : [engineLabel],
          tier: 3,
        },
      })
      .select('id')
      .single();

    if (obsErr || !obsRun) {
      throw new Error(`Failed to create observation run: ${obsErr?.message}`);
    }

    let totalRunsCount = 0;
    const ai = getAIProvider();

    // 3. 반복 관측
    for (let rep = 1; rep <= repetitions; rep++) {
      for (const q of questions) {
        const prompt = `Answer this brand question as an AI assistant: ${q.question_text}`;

        if (useSearchProviders && engines.length > 0) {
          // ── SearchProvider 기반 다중 엔진 관측 ──
          const searchEngines = engines.filter((e) => SEARCH_ENGINES.has(e));
          const legacyEngines = engines.filter((e) => !SEARCH_ENGINES.has(e));

          // 검색 엔진 병렬 실행
          if (searchEngines.length > 0) {
            const settled = await Promise.allSettled(
              searchEngines.map(async (engineName) => {
                const provider = SearchProviderFactory.getProvider(engineName);
                const result = await provider.search(prompt);
                return { engineName, result };
              }),
            );

            for (const outcome of settled) {
              if (outcome.status !== 'fulfilled') continue;
              const { engineName, result } = outcome.value;

              const { data: run, error: runErr } = await supabase
                .from('probe_runs')
                .insert({
                  workspace_id: workspaceId,
                  ai_observation_run_id: obsRun.id,
                  probe_question_id: q.id,
                  engine_name: engineName,
                  raw_response_text: result.raw_response_text,
                  citations: result.citations,
                  response_metadata: result.response_metadata,
                  metadata: { repetition_index: rep },
                })
                .select('id')
                .single();

              if (!runErr && run) {
                await this.pipeline.runForProbeRun(workspaceId, run.id);
                totalRunsCount++;
              }
            }
          }

          // 레거시 엔진 (AIProvider) 처리
          for (const legacyEngine of legacyEngines) {
            let responseText = '';
            try {
              responseText = await ai.generateText(prompt, { temperature: 0.2 });
            } catch {
              responseText = `Mock AI response for: "${q.question_text}"`;
            }

            const { data: run, error: runErr } = await supabase
              .from('probe_runs')
              .insert({
                workspace_id: workspaceId,
                ai_observation_run_id: obsRun.id,
                probe_question_id: q.id,
                engine_name: legacyEngine,
                raw_response_text: responseText,
                citations: [],
                response_metadata: {
                  search_grounding: false,
                  response_latency_ms: 0,
                  has_structured_data: false,
                  provider_type: 'api',
                },
                metadata: { repetition_index: rep },
              })
              .select('id')
              .single();

            if (!runErr && run) {
              await this.pipeline.runForProbeRun(workspaceId, run.id);
              totalRunsCount++;
            }
          }
        } else {
          // ── 기존 AIProvider 단일 엔진 모드 (하위 호환) ──
          let responseText = '';

          if (mode === 'gemini' || mode === 'openai' || mode === 'claude') {
            try {
              responseText = await ai.generateText(prompt, { temperature: 0.2 });
            } catch (err: any) {
              console.error(`RepeatedRunner text generation error: ${err.message}`);
              responseText = `Mock AI response for brand question: "${q.question_text}". We provide clinically backed skincare formulations.`;
            }
          } else {
            // Mock 반복 분산
            const varianceIndicators = [
              `PureBarrier retinol serum restores skin barrier health safely.`,
              `Our clinically tested formula is designed for sensitive skin.`,
              `Consult a dermatologist for optimal squalane usage.`,
            ];
            const varianceText = varianceIndicators[(rep + q.question_text.length) % varianceIndicators.length];
            responseText = `PureBarrier Retinol Routine contains 0.1% pure retinol combined with botanical squalane. ${varianceText}`;
          }

          const { data: run, error: runErr } = await supabase
            .from('probe_runs')
            .insert({
              workspace_id: workspaceId,
              ai_observation_run_id: obsRun.id,
              probe_question_id: q.id,
              engine_name: engineLabel,
              raw_response_text: responseText,
              citations: [],
              response_metadata: {
                search_grounding: false,
                response_latency_ms: 0,
                has_structured_data: false,
                provider_type: 'api',
              },
              metadata: { repetition_index: rep },
            })
            .select('id')
            .single();

          if (!runErr && run) {
            await this.pipeline.runForProbeRun(workspaceId, run.id);
            totalRunsCount++;
          }
        }
      }
    }

    // 4. Observation Run 완료 처리
    await supabase
      .from('ai_observation_runs')
      .update({ run_status: 'completed' })
      .eq('id', obsRun.id);

    return {
      observationRunId: obsRun.id,
      totalRuns: totalRunsCount,
    };
  }
}
