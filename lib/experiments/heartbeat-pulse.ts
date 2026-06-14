/**
 * lib/experiments/heartbeat-pulse.ts
 *
 * Tier 1: Heartbeat Pulse — 일간 경량 측정.
 *
 * 비용: 5Q × 1R × 2-Judge = 10 API 호출/일 (Full Run 대비 36배 절감)
 * 산출: AAS-lite, BSF-lite, risk_flag, competitor_shift, change_severity
 */

import { getSupabaseAdminClient } from '../supabase';
import { SearchProviderFactory } from '../ai/search-provider-factory';
import { getAIProvider } from '../ai/ai-provider';
import { SentinelSelector } from './sentinel-selector';
import type { HeartbeatResult, SentinelResult, ChangeSeverity } from './types';

// 변동 탐지 임계값
const THRESHOLDS = {
  AAS_CRITICAL: 20,   // |ΔAAS| ≥ 20 → critical
  AAS_SIGNIFICANT: 10, // |ΔAAS| ≥ 10 → significant
  AAS_MINOR: 5,       // |ΔAAS| ≥ 5  → minor
  BSF_CRITICAL: 15,   // ΔBSF < -15 → critical
  BSF_SIGNIFICANT: 8, // ΔBSF < -8  → significant
};

// 브랜드 언급을 탐지하는 간단한 키워드 체크 (실제로는 Judge를 사용)
function detectBrandMention(text: string, brandKeywords: string[]): boolean {
  const lower = text.toLowerCase();
  return brandKeywords.some((kw) => lower.includes(kw.toLowerCase()));
}

function detectRisk(text: string): boolean {
  const riskKeywords = ['위험', '부작용', '금기', '경고', 'dangerous', 'warning', 'contraindicated'];
  const lower = text.toLowerCase();
  return riskKeywords.some((kw) => lower.includes(kw));
}

function detectCompetitorShift(text: string, competitorKeywords: string[]): boolean {
  const lower = text.toLowerCase();
  return competitorKeywords.some((kw) => lower.includes(kw.toLowerCase()));
}

/**
 * 개념 전이 판정 — 브랜드 키워드 + 질문 핵심어 기반 경량 M1 대리 지표.
 * text.length > 50만으로 판정하는 것이 아니라,
 * (1) 텍스트 존재 (2) 브랜드 언급 (3) 질문 핵심어 1개 이상 매칭을 확인합니다.
 */
function detectConceptTransfer(
  text: string,
  brandKeywords: string[],
  questionText: string,
): boolean {
  if (!text || text.length < 30) return false;

  const lower = text.toLowerCase();

  // 1. 브랜드 키워드 언급 필수
  const brandMentioned = brandKeywords.length === 0 ||
    brandKeywords.some((kw) => lower.includes(kw.toLowerCase()));
  if (!brandMentioned) return false;

  // 2. 질문 핵심어 추출 및 매칭 (2글자 이상 명사/키워드 기준)
  const stopwords = new Set([
    'is', 'the', 'a', 'an', 'for', 'and', 'or', 'of', 'to', 'in', 'on', 'at',
    'what', 'how', 'which', 'does', 'do', 'are', 'this', 'that', 'with', 'from',
    '은', '는', '이', '가', '을', '를', '의', '에', '와', '과', '로', '으로',
    '에서', '까지', '부터', '도', '만', '하는', '하다', '있는', '없는',
  ]);
  const questionTokens = questionText
    .toLowerCase()
    .replace(/[?.,!;:()\[\]{}'`~@#$%^&*+=<>/\\|]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 2 && !stopwords.has(t));

  if (questionTokens.length === 0) return text.length > 50;

  const conceptMatched = questionTokens.some((token) => lower.includes(token));
  return conceptMatched;
}

export class HeartbeatPulse {
  private sentinelSelector = new SentinelSelector();

  /**
   * 일간 경량 측정 — Sentinel 5개 질문으로 변동을 탐지합니다.
   *
   * @param workspaceId       워크스페이스 ID
   * @param panelId           프로브 패널 ID
   * @param engineName        사용할 엔진 (기본: 환경변수 기반 AIProvider)
   * @param brandKeywords     브랜드 언급 탐지 키워드
   * @param competitorKeywords 경쟁사 키워드
   * @param previousAasLite   이전 Heartbeat의 AAS-lite (변동 탐지용)
   * @param previousBsfLite   이전 Heartbeat의 BSF-lite (변동 탐지용)
   */
  async run(
    workspaceId: string,
    panelId: string,
    engineName?: string,
    brandKeywords: string[] = [],
    competitorKeywords: string[] = [],
    previousAasLite?: number,
    previousBsfLite?: number,
  ): Promise<HeartbeatResult> {
    const timestamp = new Date().toISOString();
    const supabase = getSupabaseAdminClient();

    // 1. Sentinel 질문 선정
    const sentinels = await this.sentinelSelector.select(workspaceId, panelId);
    if (sentinels.length === 0) {
      throw new Error(`[HeartbeatPulse] Sentinel 질문을 찾을 수 없습니다: panelId=${panelId}`);
    }

    // 2. 엔진 결정
    const useSearchProvider = engineName &&
      ['chatgpt_search', 'gemini_grounding', 'perplexity_search', 'claude_web'].includes(engineName);
    const resolvedEngine = engineName ??
      (process.env.AI_PROVIDER_MODE === 'gemini' ? 'gemini-2.5-flash' :
       process.env.AI_PROVIDER_MODE === 'openai' ? 'gpt-4o-mini' : 'mock_provider');

    // 3. 각 Sentinel에 대해 AI 응답 수집 (2-Judge 경량 평가)
    const sentinelResults: SentinelResult[] = [];
    let apiCallsUsed = 0;

    for (const sentinel of sentinels) {
      const prompt = `Answer this brand question concisely: ${sentinel.question_text}`;
      const start = Date.now();
      let rawText = '';

      try {
        if (useSearchProvider && engineName) {
          const provider = SearchProviderFactory.getProvider(engineName);
          const result = await provider.search(prompt);
          rawText = result.raw_response_text;
        } else {
          const ai = getAIProvider();
          rawText = await ai.generateText(prompt, { temperature: 0.2 });
        }
        apiCallsUsed++;
      } catch (err: any) {
        console.error(`[HeartbeatPulse] sentinel "${sentinel.id}" error: ${err.message}`);
        rawText = '';
      }

      const latency = Date.now() - start;

      sentinelResults.push({
        question_id: sentinel.id,
        question_text: sentinel.question_text,
        engine_name: resolvedEngine,
        concept_transferred: detectConceptTransfer(rawText, brandKeywords, sentinel.question_text),
        risk_detected: detectRisk(rawText),
        brand_mentioned: detectBrandMention(rawText, brandKeywords),
        raw_response_text: rawText,
        latency_ms: latency,
      });
    }

    // 4. 경량 지표 계산
    const brandMentionCount = sentinelResults.filter((s) => s.brand_mentioned).length;
    const conceptTransferCount = sentinelResults.filter((s) => s.concept_transferred).length;

    const aas_lite = sentinels.length > 0
      ? Math.round((brandMentionCount / sentinelResults.length) * 100)
      : 0;
    const bsf_lite = sentinels.length > 0
      ? Math.round((conceptTransferCount / sentinelResults.length) * 100)
      : 0;

    const risk_flag = sentinelResults.some((s) => s.risk_detected);
    const competitor_shift = sentinelResults.some((s) =>
      detectCompetitorShift(s.raw_response_text, competitorKeywords),
    );
    const preemption_alert = competitor_shift; // 간소화

    // 5. 변동 탐지
    const { change_detected, change_severity, change_details } = this._detectChange(
      aas_lite, bsf_lite, risk_flag,
      previousAasLite, previousBsfLite,
    );

    // 6. 에스컬레이션 권고
    const recommend_full_run = change_severity === 'critical' || risk_flag;
    const recommend_weekly_scan = change_severity === 'significant' || competitor_shift;

    // 7. probe_runs에 Heartbeat 결과 저장 (요약)
    await this._persistResults(supabase, workspaceId, panelId, sentinelResults, resolvedEngine);

    return {
      timestamp,
      workspace_id: workspaceId,
      panel_id: panelId,
      engine_used: resolvedEngine,
      sentinels: sentinelResults,
      aas_lite,
      bsf_lite,
      risk_flag,
      competitor_shift,
      preemption_alert,
      change_detected,
      change_severity,
      change_details,
      recommend_weekly_scan,
      recommend_full_run,
      api_calls_used: apiCallsUsed,
    };
  }

  // ─────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────

  private _detectChange(
    currentAas: number,
    currentBsf: number,
    riskFlag: boolean,
    previousAas?: number,
    previousBsf?: number,
  ): { change_detected: boolean; change_severity: ChangeSeverity; change_details?: string } {
    if (riskFlag) {
      return {
        change_detected: true,
        change_severity: 'critical',
        change_details: 'YMYL 질문에서 위험 신호가 탐지되었습니다.',
      };
    }

    if (previousAas === undefined && previousBsf === undefined) {
      return { change_detected: false, change_severity: 'none' };
    }

    const deltaAas = previousAas !== undefined ? Math.abs(currentAas - previousAas) : 0;
    const deltaBsf = previousBsf !== undefined ? currentBsf - previousBsf : 0;

    // BSF critical drop
    if (deltaBsf < -THRESHOLDS.BSF_CRITICAL) {
      return {
        change_detected: true,
        change_severity: 'critical',
        change_details: `BSF-lite 급락: ${previousBsf?.toFixed(1)} → ${currentBsf.toFixed(1)} (Δ${deltaBsf.toFixed(1)})`,
      };
    }

    // AAS critical
    if (deltaAas >= THRESHOLDS.AAS_CRITICAL) {
      return {
        change_detected: true,
        change_severity: 'critical',
        change_details: `AAS-lite 급변: |Δ${deltaAas.toFixed(1)}|`,
      };
    }

    // BSF significant drop
    if (deltaBsf < -THRESHOLDS.BSF_SIGNIFICANT) {
      return {
        change_detected: true,
        change_severity: 'significant',
        change_details: `BSF-lite 하락: Δ${deltaBsf.toFixed(1)}`,
      };
    }

    // AAS significant
    if (deltaAas >= THRESHOLDS.AAS_SIGNIFICANT) {
      return {
        change_detected: true,
        change_severity: 'significant',
        change_details: `AAS-lite 변동: |Δ${deltaAas.toFixed(1)}|`,
      };
    }

    // AAS minor
    if (deltaAas >= THRESHOLDS.AAS_MINOR) {
      return {
        change_detected: true,
        change_severity: 'minor',
        change_details: `AAS-lite 소변동: |Δ${deltaAas.toFixed(1)}|`,
      };
    }

    return { change_detected: false, change_severity: 'none' };
  }

  private async _persistResults(
    supabase: any,
    workspaceId: string,
    panelId: string,
    results: SentinelResult[],
    engineName: string,
  ): Promise<void> {
    try {
      // Observation Run 생성 (Tier 1 태그)
      const { data: obsRun } = await supabase
        .from('ai_observation_runs')
        .insert({
          workspace_id: workspaceId,
          probe_panel_id: panelId,
          run_name: `Tier 1 Heartbeat — ${new Date().toLocaleDateString('ko-KR')}`,
          run_status: 'completed',
          run_metadata: { tier: 1, engine: engineName },
        })
        .select('id')
        .single();

      if (!obsRun) return;

      // probe_runs 저장
      for (const s of results) {
        await supabase.from('probe_runs').insert({
          workspace_id: workspaceId,
          ai_observation_run_id: obsRun.id,
          probe_question_id: s.question_id,
          engine_name: engineName,
          raw_response_text: s.raw_response_text || '[empty]',
          citations: [],
          response_metadata: {
            search_grounding: false,
            response_latency_ms: s.latency_ms,
            has_structured_data: false,
            provider_type: 'api',
          },
          metadata: { tier: 1, sentinel: true },
        });
      }
    } catch (err: any) {
      console.warn(`[HeartbeatPulse] persist error (non-fatal): ${err.message}`);
    }
  }
}
