import { getAIProvider } from '../ai/ai-provider';
import type { EvalStep1Result, QVS8DResult, EvaluationWithConfidence } from './types';
import { getSupabaseAdminClient } from '../supabase';

// AHP 쌍비교 매트릭스 유도 가중치 (합계 = 1.0)
const AHP_WEIGHTS = {
  relevance: 0.18,           // 관련성
  specificity: 0.10,         // 구체성
  urgency: 0.07,             // 긴급성
  opportunity: 0.12,         // 기회도 (= 10 - 경쟁도)
  conversion: 0.18,          // 전환 잠재력
  snippet_fitness: 0.15,     // AEO: 직접 답변 적합도
  entity_clarity: 0.10,      // GEO: 엔티티 명확도
  multi_engine_consistency: 0.10, // GEO: 멀티엔진 일관성
};

export class SignalEvaluator {
  /**
   * Step 1: 분류 평가 (temperature = 0, 결정적 분류)
   */
  static async classifySignal(question: string, brandName?: string): Promise<EvalStep1Result> {
    const ai = getAIProvider();

    const prompt = `You are a search intent classifier.
Analyze the consumer search query: "${question}"
${brandName ? `For the brand: "${brandName}"` : 'Running in Hub Mode (no specific brand context)'}

Classify into exactly one intent, brand fit, and YMYL flag:
1. intent: informational, navigational, transactional, local, comparison, or risk.
2. brand_fit: 'fit' (highly relevant/exclusive to brand or industry domain), 'partial' (generic but relevant), 'unfit' (completely irrelevant/competitor exclusive). Note: If running in Hub Mode, classify industry-relevant queries as 'fit' or 'partial'.
3. is_ymyl: true if it touches Your Money or Your Life topics (health, finance, legal, safety, side effects).

Return JSON.`;

    try {
      const response = await ai.generateStructuredOutput<any>(
        `System:\n${prompt}\n\nUser:\nClassify this query.`,
        {
          type: 'object',
          properties: {
            intent: { type: 'string', enum: ['informational', 'navigational', 'transactional', 'local', 'comparison', 'risk'] },
            brand_fit: { type: 'string', enum: ['fit', 'partial', 'unfit'] },
            is_ymyl: { type: 'boolean' }
          },
          required: ['intent', 'brand_fit', 'is_ymyl']
        },
        { temperature: 0 }
      );

      return {
        intent: response.intent || 'informational',
        brand_fit: response.brand_fit || 'partial',
        is_ymyl: response.is_ymyl || false
      };
    } catch (err) {
      console.warn('[SignalEvaluator] Classification failed, using fallback:', err);
      return {
        intent: 'informational',
        brand_fit: 'partial',
        is_ymyl: false
      };
    }
  }

  /**
   * Step 2: QVS 8차원 상세 점수 분석 (앵커링 보정 및 CoT 포함)
   */
  static async scoreQVS8D(
    question: string, 
    brandName?: string, 
    kgNodes?: string[], 
    panelLayer?: string
  ): Promise<QVS8DResult> {
    const ai = getAIProvider();

    const kgContext = kgNodes && kgNodes.length > 0
      ? `\n브랜드 지식 그래프 핵심 엔티티 노드 목록:\n[${kgNodes.join(', ')}]`
      : '';
    const layerContext = panelLayer ? `\n이 질문의 업종 패널 계층: ${panelLayer}` : '';

    const systemPrompt = `당신은 SEO/AEO/GEO 검색 성과 예측 엔진입니다.
질문: "${question}"
${brandName ? `브랜드: "${brandName}"` : '실행 모드: 허브 포털 모드 (브랜드 미지정)'}${kgContext}${layerContext}

QVS (Quality-Volume Score)를 위해 아래의 8개 차원을 각각 0~10점 척도로 평가하세요:
1. relevance: 브랜드 또는 업종 핵심 영역과의 부합도 (10점 예시: '${brandName || '스킨케어'} 이용 요금/추천', 1점 예시: '오늘 서울 날씨')
2. specificity: 검색 의도의 구체성 (long-tail 구체적 질문일수록 고득점)
3. urgency: 고통 포인트나 긴급도
4. opportunity: 검색 노출 기회도 (경쟁이 낮을수록 고득점, 10점: 블루오션, 1점: 과열 레드오션)
5. conversion: 상업적 전환 잠재력 (10점: 구매 전환 의도가 뚜렷함)
6. snippet_fitness (AEO): AI 답변 추천(Featured Snippet)으로 직접 채택되기 좋은 구조인가 여부 (10점: 명확한 질문 구조)
7. entity_clarity (GEO): 지식 그래프 개체(Entity)로써 AI가 혼동 없이 명확히 식별할 수 있는 수준 (10점: 고유 명사 또는 명확한 단일 엔티티 포함)
8. multi_engine_consistency (GEO): 다양한 AI 검색 엔진들(ChatGPT, Gemini 등)이 일관된 구조로 답변을 구성하기 쉬운 정도

**채점 전, 먼저 각 차원별 채점 논리적 근거(CoT)를 reasoning 필드에 기술하세요.**`;

    try {
      const response = await ai.generateStructuredOutput<any>(
        `System:\n${systemPrompt}\n\nUser:\n채점 결과를 반환하세요.`,
        {
          type: 'object',
          properties: {
            relevance: { type: 'number' },
            specificity: { type: 'number' },
            urgency: { type: 'number' },
            opportunity: { type: 'number' },
            conversion: { type: 'number' },
            snippet_fitness: { type: 'number' },
            entity_clarity: { type: 'number' },
            multi_engine_consistency: { type: 'number' },
            reasoning: { type: 'string' }
          },
          required: [
            'relevance', 'specificity', 'urgency', 'opportunity', 
            'conversion', 'snippet_fitness', 'entity_clarity', 'multi_engine_consistency', 'reasoning'
          ]
        },
        { temperature: 0 }
      );

      return {
        relevance: response.relevance ?? 5,
        specificity: response.specificity ?? 5,
        urgency: response.urgency ?? 5,
        opportunity: response.opportunity ?? 5,
        conversion: response.conversion ?? 5,
        snippet_fitness: response.snippet_fitness ?? 5,
        entity_clarity: response.entity_clarity ?? 5,
        multi_engine_consistency: response.multi_engine_consistency ?? 5,
        reasoning: response.reasoning || ''
      };
    } catch (err) {
      console.warn('[SignalEvaluator] QVS8D scoring failed, returning fallback:', err);
      return {
        relevance: 5, specificity: 5, urgency: 5, opportunity: 5, conversion: 5,
        snippet_fitness: 5, entity_clarity: 5, multi_engine_consistency: 5,
        reasoning: 'Fallback due to LLM error.'
      };
    }
  }

  /**
   * 가중 합산 계산
   */
  static calculateWeightedScore(qvs: QVS8DResult): number {
    const raw = 
      (qvs.relevance * AHP_WEIGHTS.relevance) +
      (qvs.specificity * AHP_WEIGHTS.specificity) +
      (qvs.urgency * AHP_WEIGHTS.urgency) +
      (qvs.opportunity * AHP_WEIGHTS.opportunity) +
      (qvs.conversion * AHP_WEIGHTS.conversion) +
      (qvs.snippet_fitness * AHP_WEIGHTS.snippet_fitness) +
      (qvs.entity_clarity * AHP_WEIGHTS.entity_clarity) +
      (qvs.multi_engine_consistency * AHP_WEIGHTS.multi_engine_consistency);
    
    // 0-10 단위를 0-100 단위로 스케일업
    return parseFloat((raw * 10).toFixed(2));
  }

  /**
   * 불확실성 극복을 위한 N회 반복 평가 및 통계적 의사결정 (Gate)
   */
  static async evaluateWithConfidence(
    question: string,
    brandName?: string,
    repeats: number = 3,
    kgNodes?: string[],
    panelLayer?: string,
    workspaceId?: string
  ): Promise<EvaluationWithConfidence> {
    // 1단계 분류는 1회만 수행 (temperature = 0이므로 항상 동일 결과 기대)
    const step1 = await this.classifySignal(question, brandName);

    // 2단계 QVS 8차원 평가를 N회 반복
    const qvsRuns: QVS8DResult[] = [];
    for (let i = 0; i < repeats; i++) {
      const qvs = await this.scoreQVS8D(question, brandName, kgNodes, panelLayer);
      qvsRuns.push(qvs);
      if (i < repeats - 1) {
        await new Promise(r => setTimeout(r, 50)); // rate limit 방지 미세 딜레이
      }
    }

    const totals = qvsRuns.map(r => this.calculateWeightedScore(r));
    const mean = totals.reduce((s, v) => s + v, 0) / totals.length;
    
    let std = 0;
    if (totals.length > 1) {
      const variance = totals.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / (totals.length - 1);
      std = Math.sqrt(variance);
    }

    const confidence = std < 5 ? 'high' : std < 10 ? 'medium' : 'low';

    // 적응적 Gate 판정
    let gate_status: 'Go' | 'Watch' | 'No-Go' = 'Watch';
    if (brandName && step1.brand_fit === 'unfit') {
      gate_status = 'No-Go';
    } else {
      // 적응적 임계값
      const goThreshold = 68;
      const noGoThreshold = 42;

      if (mean >= goThreshold && (!brandName || step1.brand_fit === 'fit' || step1.brand_fit === 'partial')) {
        gate_status = 'Go';
      } else if (mean < noGoThreshold) {
        gate_status = 'No-Go';
      }
    }

    return {
      step1,
      qvs: qvsRuns[0], // 첫 번째 결과를 대표값으로 사용
      qvs_total: parseFloat(mean.toFixed(2)),
      qvs_std: parseFloat(std.toFixed(2)),
      confidence,
      gate_status
    };
  }
}
