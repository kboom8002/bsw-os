/**
 * lib/signal-collection/tco-concept-enricher.ts
 *
 * S-OGDE v3.0 — TCO Concept Enricher (Phase T).
 * 수집된 시그널 중 기존 TCO에 매핑되지 않은 것들을 클러스터링하여 새 TCO 개념을 자동 추출.
 * TF8 8-Block Framework 기반 프롬프트 적용.
 */

import { getAIProvider } from '../ai/ai-provider';

export interface EnrichedConcept {
  concept_name: string;
  definition: string;
  is_strategic: boolean;
  importance_weight: number;
  source_signal_indices: number[];
}

export class TcoConceptEnricher {
  /**
   * 미매칭 시그널들을 LLM으로 클러스터링하여 새 TCO 개념 후보를 추출.
   * TF8 Level 5 프롬프트 적용.
   */
  static async extractFromSignals(
    unmatchedSignals: string[],
    existingTco: Array<{ concept_name: string; definition: string }>,
    domainName: string,
    brandName?: string
  ): Promise<EnrichedConcept[]> {
    if (unmatchedSignals.length < 3) return [];

    const ai = getAIProvider();

    const prompt = TcoConceptEnricher.buildTF8Prompt(
      unmatchedSignals, existingTco, domainName, brandName
    );

    try {
      const result = await ai.generateStructuredOutput<{ new_concepts: EnrichedConcept[] }>(
        prompt,
        {
          type: 'object',
          properties: {
            new_concepts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  concept_name: { type: 'string' },
                  definition: { type: 'string' },
                  is_strategic: { type: 'boolean' },
                  importance_weight: { type: 'number' },
                  source_signal_indices: { type: 'array', items: { type: 'number' } }
                },
                required: ['concept_name', 'definition', 'is_strategic', 'importance_weight', 'source_signal_indices']
              }
            }
          },
          required: ['new_concepts']
        },
        { temperature: 0.3 }
      );

      return (result.new_concepts || []).filter(c =>
        c.concept_name && c.definition && c.source_signal_indices.length >= 2
      );
    } catch (err) {
      console.warn('[TcoConceptEnricher] LLM call failed:', err);
      return [];
    }
  }

  /**
   * TF8 8-Block Framework 기반 프롬프트 빌드.
   * Block 순서: T → K → W → O → F (Level 5)
   */
  private static buildTF8Prompt(
    unmatchedSignals: string[],
    existingTco: Array<{ concept_name: string; definition: string }>,
    domainName: string,
    brandName?: string
  ): string {
    return [
      // [T] Task & Goal — 최상단
      `[T] TASK & GOAL
과업: "${domainName}" 업종${brandName ? ` (브랜드: ${brandName})` : ''}의 TCO(Tensor Concept Ontology) 보캐뷸러리를 보강하라.
아래 "미매칭 시그널"은 기존 TCO 보캐뷸러리로 매핑되지 않은 소비자 질문들이다.
이 질문들을 의미적으로 클러스터링하여, 각 클러스터를 대표하는 새로운 TCO 개념을 도출하라.
산출물: JSON { "new_concepts": [...] }`,

      // [K] Knowledge & Input — 중반부 (Attention 집중)
      `[K] KNOWLEDGE & INPUT
<<<
## 미매칭 시그널 (기존 TCO에 매핑되지 않은 소비자 질문들)
${unmatchedSignals.map((s, i) => `${i + 1}. ${s}`).join('\n')}

## 기존 TCO 보캐뷸러리 (중복 금지 대상)
${existingTco.length > 0
        ? existingTco.map(t => `- ${t.concept_name}: ${t.definition}`).join('\n')
        : '(기존 TCO 없음)'}
>>>
⚠️ 기존 TCO와 의미적으로 70% 이상 겹치는 개념 생성 절대 금지.
⚠️ 위 데이터 밖의 추측 기반 개념 생성 금지.`,

      // [W] Warnings & Constraints — 하단부
      `[W] WARNINGS & CONSTRAINTS
1. 최소 2개 이상의 시그널이 속하는 클러스터만 개념화 (1개는 노이즈)
2. 기존 TCO의 단순 하위 개념이 아닌, 새로운 의미 영역의 개념만 생성
3. 최대 15개까지만 생성 (과도한 세분화 방지)
4. "~추천", "~맛집" 등 너무 일반적인 상위 개념 금지
5. importance_weight: 0.3-0.9 범위 (0.7+ = 전략적 가치 높음)`,

      // [O] Output Contract
      `[O] OUTPUT CONTRACT
형식: JSON { "new_concepts": [...] }
각 항목 필수 필드:
- concept_name: 한국어 2-6어절 (소비자 어휘 기반)
- definition: 이 개념이 필요한 이유 + 어떤 시그널들을 커버하는지 (1-2문장)
- is_strategic: boolean (고영향 차별화 개념이면 true)
- importance_weight: 0.3-0.9 (전략적 중요도)
- source_signal_indices: 이 개념에 속하는 시그널 번호 배열 (1-indexed)`,

      // [F] Flow & Control
      `[F] FLOW & CONTROL
1단계: 미매칭 시그널들을 의미적 주제 클러스터로 그루핑
2단계: 각 클러스터가 기존 TCO와 겹치는지 검사 → 겹치면 제외
3단계: 남은 클러스터를 새 TCO 개념으로 명명 및 정의
4단계: importance_weight 산정 (클러스터 크기 × 전략 가치)`
    ].join('\n\n');
  }
}
