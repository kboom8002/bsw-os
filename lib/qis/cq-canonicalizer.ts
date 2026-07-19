/**
 * lib/qis/cq-canonicalizer.ts
 * 
 * 하이브리드 CQ Canonicalizer (정규화 및 대표 선정 엔진).
 * 클러스터 질문 데이터에서 형태소 및 의미적 정보를 결합해 대표 질문(CQ)을 도출하고
 * 각 차원별 결정론적 공식에 따른 CPS(Canonical Priority Score)를 산출합니다.
 */

import { getAIProvider } from '../ai/ai-provider';

// Kiwi 형태소 분석기 동적 로드 시도 (SOTA)
let kiwi: any = null;
try {
  kiwi = require('kiwi-nlp');
} catch (e) {
  // kiwi-nlp 패키지가 없는 경우 fallback 모드
}

export interface ClusterInput {
  representative_question: string;
  variants: string[];
  dominant_intents?: string[];
  dominant_entities?: string[];
}

export interface CanonicalQuestionResult {
  canonical_question: string;
  variants: string[];
  primary_intent: string;
  user_context: {
    persona_hints: string[];
    journey_stage: string;
  };
  constraints: string[];
  evidence_need: string[];
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  preferred_answer_type: string[];
  linked_tco_entities: string[];
  cps_score: number;
  cps_breakdown: {
    demand: number;
    specificity: number;
    urgency: number;
    opportunity: number;
    conversion: number;
    snippet_fitness: number;
    entity_clarity: number;
    multi_engine_consistency: number;
  };
}

export class CQCanonicalizer {

  /**
   * 형태소 분석 기반 단어/어근 정규화
   */
  private normalizeKorean(text: string): { tokens: string[]; cleanText: string } {
    let cleanText = text.replace(/\[Fallback\]/gi, '').replace(/\s+/g, ' ').trim();
    const tokens: string[] = [];

    if (kiwi) {
      try {
        const result = kiwi.analyze(cleanText);
        // NNG(일반 명사), NNP(고유 명사), VV(동사 어근), VA(형용사 어근), SL(외국어) 선별
        for (const token of result[0] || []) {
          if (['NNG', 'NNP', 'VV', 'VA', 'SL'].includes(token.tag)) {
            tokens.push(token.form);
          }
        }
        if (tokens.length > 0) {
          return { tokens, cleanText };
        }
      } catch (err) {
        console.warn('[CQCanonicalizer] Kiwi analyze error, using regex regex fallback:', (err as Error).message);
      }
    }

    // Fallback: 정규식 형태소 분리 (공백 및 조사 제거 단어로 토큰화)
    const words = cleanText.split(/\s+/);
    const stopWords = /^(은|는|이|가|을|를|에|의|로|으로|와|과|한|하고|하며|하여|했다)$/;
    for (const w of words) {
      const cleanedWord = w.replace(stopWords, '');
      if (cleanedWord.length > 1) {
        tokens.push(cleanedWord);
      }
    }

    return { tokens, cleanText };
  }

  /**
   * 클러스터링된 질문 묶음으로부터 정본화된 대표 질문(CQ) 명세를 생성합니다.
   * [v2.0] 알고리즘 정규화 + 결정론적 CPS 산출 + LLM 다듬기 하이브리드 엔진 적용.
   */
  async canonicalizeCluster(
    workspaceId: string,
    domainId: string,
    cluster: ClusterInput,
    externalMetrics?: any
  ): Promise<CanonicalQuestionResult> {
    
    // Stage 1: 결정론적 정규화 및 대표 후보 선정
    const normalizedRep = this.normalizeKorean(cluster.representative_question);
    const variantsNormalized = cluster.variants.map(v => this.normalizeKorean(v));

    // Stage 2: AI Provider를 통한 대표 질문 명세 다듬기 (LLM)
    const ai = getAIProvider();

    const prompt = `당신은 대표 질문(Canonical Question)을 최종 정제하는 전문가입니다.
입력된 질문 클러스터 정보를 바탕으로, 소비자가 물어볼 법한 가장 자연스럽고 간결한 한국어 대표 질문을 최종 정제하십시오.

입력 정보:
- 대표 질문 후보: "${normalizedRep.cleanText}"
- 유사 변형 질문들: ${JSON.stringify(variantsNormalized.map(v => v.cleanText))}
- 탐지된 의도: ${JSON.stringify(cluster.dominant_intents || ['informational'])}
- 탐지된 엔티티: ${JSON.stringify(cluster.dominant_entities || [])}

가이드라인:
1. 마케팅성 문구나 홍보성 수식어는 배제하고, 실제 소비자가 검색창이나 챗봇에 입력할 자연스러운 어투를 사용하십시오.
2. 질문의 핵심 제약 사항(예: 특정 성분, 시술 직후 상황)이 포함되도록 조절하십시오.
3. 위험도(risk_level: low, medium, high, critical)와 필요한 실측 근거(evidence_need)를 판정하십시오.

다음 JSON 스키마를 엄격히 준수하여 응답하십시오.`;

    const schema = {
      type: "OBJECT",
      properties: {
        canonical_question: { type: "STRING" },
        primary_intent: { type: "STRING" },
        user_context: {
          type: "OBJECT",
          properties: {
            persona_hints: { type: "ARRAY", items: { type: "STRING" } },
            journey_stage: { type: "STRING" }
          },
          required: ["persona_hints", "journey_stage"]
        },
        constraints: { type: "ARRAY", items: { type: "STRING" } },
        evidence_need: { type: "ARRAY", items: { type: "STRING" } },
        risk_level: { type: "STRING", enum: ["low", "medium", "high", "critical"] },
        preferred_answer_type: { type: "ARRAY", items: { type: "STRING" } }
      },
      required: [
        "canonical_question", "primary_intent", "user_context",
        "constraints", "evidence_need", "risk_level", "preferred_answer_type"
      ]
    };

    let llmResult: any;
    try {
      llmResult = await ai.generateStructuredOutput<any>(prompt, schema, { temperature: 0.1 });
    } catch (err) {
      console.error("[CQCanonicalizer] LLM structured output failed, using deterministic fallback", err);
      llmResult = {
        canonical_question: normalizedRep.cleanText,
        primary_intent: cluster.dominant_intents?.[0] || 'informational',
        user_context: { persona_hints: ['general'], journey_stage: 'discovery' },
        constraints: [],
        evidence_need: [],
        risk_level: 'low',
        preferred_answer_type: ['direct_answer']
      };
    }

    // Stage 3: 결정론적 CPS(Canonical Priority Score) 가중치 산출
    const breakdown = this.calculateDeterministicCPS(cluster, normalizedRep.cleanText, llmResult, externalMetrics);
    
    // 최종 가중합산 점수 산출
    const cpsScore = Math.round(
      breakdown.demand * 0.20 +
      breakdown.specificity * 0.15 +
      breakdown.urgency * 0.15 +
      breakdown.opportunity * 0.15 +
      breakdown.conversion * 0.15 +
      breakdown.snippet_fitness * 0.05 +
      breakdown.entity_clarity * 0.10 +
      breakdown.multi_engine_consistency * 0.05
    );

    return {
      canonical_question: llmResult.canonical_question,
      variants: cluster.variants,
      primary_intent: llmResult.primary_intent,
      user_context: llmResult.user_context,
      constraints: llmResult.constraints,
      evidence_need: llmResult.evidence_need,
      risk_level: llmResult.risk_level,
      preferred_answer_type: llmResult.preferred_answer_type,
      linked_tco_entities: cluster.dominant_entities || [],
      cps_score: cpsScore,
      cps_breakdown: breakdown
    };
  }

  /**
   * 결정론적 CPS 구성점수 계산 공식 (AHP 기반 가중치 정합성 탑재)
   */
  private calculateDeterministicCPS(
    cluster: ClusterInput,
    cleanQuery: string,
    llmResult: any,
    externalMetrics?: any
  ) {
    // 1. Demand (검색 볼륨 수치) - 최대 100
    const totalVolume = externalMetrics?.volume || 0;
    const demand = totalVolume > 0 
      ? Math.min(100, Math.round(Math.log10(totalVolume + 1) * 25))
      : Math.min(100, (cluster.variants.length * 15) + 20);

    // 2. Specificity (구체성) - 질문 내 명사/어휘 개수 및 글자 수 비례
    const tokens = this.normalizeKorean(cleanQuery).tokens;
    const specificity = Math.min(100, (tokens.length * 12) + (cleanQuery.length * 1.5));

    // 3. Urgency (긴급성) - 위험 키워드 포함 또는 리스크 단계별 가산
    const urgentKeywords = /(붉은|붉어|따갑|화끈|부작용|환불|취소|위약금|급해|급히|즉시|빨리|통증|염증|상처|진물)/gi;
    let urgency = urgentKeywords.test(cleanQuery) ? 90 : 50;
    if (llmResult.risk_level === 'critical') urgency = 100;
    else if (llmResult.risk_level === 'high') urgency = 90;
    else if (llmResult.risk_level === 'medium') urgency = 70;

    // 4. Opportunity (기회도/블라인드스팟) - 경쟁 사이트의 답변 포화도 역수 계산
    let opportunity = 80; // 기본값
    if (externalMetrics?.aiCoverage) {
      if (externalMetrics.aiCoverage === 'none') opportunity = 100;
      else if (externalMetrics.aiCoverage === 'sparse') opportunity = 85;
      else if (externalMetrics.aiCoverage === 'moderate') opportunity = 60;
      else if (externalMetrics.aiCoverage === 'saturated') opportunity = 30;
    }

    // 5. Conversion (전환 잠재력) - 구매 의도, 상품 문의 키워드 포함 비율
    const commercialKeywords = /(가격|비교|추천|예약|위치|주차|코스|일정|후기|성능|구매|할인)/gi;
    const conversion = commercialKeywords.test(cleanQuery) ? 90 : 60;

    // 6. Snippet Fitness (스니펫 정합성) - 질문형 문장 종결 상태
    const hasQuestionEnding = /(가요|나요|ㄹ까요\?|줘|알려|어때|방법)/gi.test(cleanQuery);
    const snippet_fitness = hasQuestionEnding ? 90 : 60;

    // 7. Entity Clarity (엔티티 명확성) - TCO 지명/브랜드 매칭 수치
    const entityCount = cluster.dominant_entities?.length || 0;
    const entity_clarity = entityCount >= 2 ? 95 : (entityCount === 1 ? 75 : 50);

    // 8. Multi-Engine Consistency (엔진 일관성)
    const multi_engine_consistency = externalMetrics?.consistencyScore || 70;

    return {
      demand,
      specificity,
      urgency,
      opportunity,
      conversion,
      snippet_fitness,
      entity_clarity,
      multi_engine_consistency
    };
  }
}
