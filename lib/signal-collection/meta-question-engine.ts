/**
 * lib/signal-collection/meta-question-engine.ts
 *
 * S-OGDE v2.0 — 5-Lens Meta-Question Engine.
 */

import { getAIProvider } from '../ai/ai-provider';
import type { VOCChunk } from './types';

export type MetaQuestionType = 'pattern' | 'motivation' | 'journey_stage' | 'fear_desire' | 'counter';

export interface MetaQuestionResult {
  meta_type: MetaQuestionType;
  analysis_insight: string;
  generated_queries: string[];
}

export class MetaQuestionEngine {
  /**
   * Generates consumer question patterns based on meta-level analysis.
   *
   * @param domainName - 업종명
   * @param brandName - 브랜드명 (선택)
   * @param contextChunks - VOC 데이터 청크 (선택)
   * @param tcoSeeds - TCO 핵심 전략 개념 시드 (선택)
   */
  static async analyzeAndGenerate(
    domainName: string,
    brandName?: string,
    contextChunks?: VOCChunk[],
    tcoSeeds?: Array<{ concept_name: string; definition: string }>
  ): Promise<MetaQuestionResult[]> {
    const ai = getAIProvider();

    // 컨텍스트 블록 생성 (VOC 데이터가 있으면 삽입)
    const contextBlock = MetaQuestionEngine.buildContextBlock(contextChunks);

    // TCO 개념 시드 블록 생성 (TCO가 존재하면 프롬프트 가이드 추가)
    const tcoBlock = tcoSeeds && tcoSeeds.length > 0
      ? `\n\n[TCO 전략 개념 가이드]\n아래의 핵심 운영 개념들을 기반으로 하여 질문자산의 도메인 깊이를 확장하세요:\n${tcoSeeds.map(c => `- ${c.concept_name}: ${c.definition}`).join('\n')}\n(위 개념에 부합하거나 개념을 파고드는 소비자 질문을 전략적으로 우선 도출하세요.)`
      : '';

    // TF8 8-Block Framework (Level 5) 프롬프트 구성
    const systemPrompt = [
      // [T] Task & Goal — 최상단 배치
      `[T] TASK & GOAL
과업: "${domainName}" 업종${brandName ? ` (브랜드: ${brandName})` : ''}의 소비자가 AI 검색 엔진에 실제로 입력할 리얼 검색 질의를 도출하라.
5가지 메타 관점(pattern, motivation, journey_stage, fear_desire, counter)별로 각 5개씩, 총 25개.
산출물: JSON { results: [{ meta_type, analysis_insight, generated_queries: string[5] }] }`,

      // [K] Knowledge & Input — 중반부 (Attention 집중)
      `[K] KNOWLEDGE & INPUT
<<<${contextBlock}${tcoBlock}
>>>
⚠️ 위 데이터에 등장하는 소비자의 실제 어휘, 은어, 불만 뉘앙스를 그대로 살릴 것.
⚠️ 데이터 밖의 가상 시나리오 기반 질문 생성 금지.`,

      // [W] Warnings & Constraints — 하단부
      `[W] WARNINGS & CONSTRAINTS
1. "~란 무엇인가", "~의 장단점" 같은 교과서적 패턴 질문 금지
2. 동일 의도의 어순만 바꾼 변형 질문 금지 (의미적 중복 제거)
3. 각 질문은 검색창에 실제 입력 가능한 자연어 (논문체·학술체 금지)
4. counter 관점: 아무도 묻지 않지만 물어야 할 질문을 도출할 것
5. 특정 브랜드명을 질문에 직접 포함하는 것은 5개 중 최대 2개까지만`,

      // [O] Output Contract
      `[O] OUTPUT CONTRACT
형식: JSON { "results": [...] } — 정확히 5개 관점
각 항목:
- meta_type: 'pattern' | 'motivation' | 'journey_stage' | 'fear_desire' | 'counter'
- analysis_insight: 해당 관점의 핵심 인사이트 1문장 (한국어)
- generated_queries: 정확히 5개, 한국어, 검색창에 직접 입력할 수 있는 자연어 수준`,

      // [F] Flow & Control
      `[F] FLOW & CONTROL
분석 순서:
1. pattern → 소비자 질문의 구조적 반복 패턴 (비교, 안전성, 추천 등) 식별
2. motivation → 검색 뒤에 숨겨진 실제 동기 분석
3. journey_stage → 인지→고려→구매→재방문 단계별 질문 도출
4. fear_desire → 소비자의 두려움과 욕구가 만드는 질문 도출
5. counter → 질문 공간의 맹점 (아무도 묻지 않지만 반드시 물어야 할 것) 도출`
    ].filter(Boolean).join('\n\n');

    const userPrompt = `Generate the meta-analysis and queries for domain: ${domainName}${brandName ? `, brand: ${brandName}` : ''}`;

    try {
      const response = await ai.generateStructuredOutput<any>(
        `System:\n${systemPrompt}\n\nUser:\n${userPrompt}`,
        {
          type: 'object',
          properties: {
            results: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  meta_type: { type: 'string', enum: ['pattern', 'motivation', 'journey_stage', 'fear_desire', 'counter'] },
                  analysis_insight: { type: 'string' },
                  generated_queries: { type: 'array', items: { type: 'string' } }
                },
                required: ['meta_type', 'analysis_insight', 'generated_queries']
              }
            }
          },
          required: ['results']
        },
        { temperature: 0.7 } // 생성 태스크는 다양성을 확보
      );

      return response.results || [];
    } catch (error) {
      console.warn("MetaQuestionEngine LLM call failed, returning fallback", error);
      return [
        {
          meta_type: 'pattern',
          analysis_insight: 'Fallback pattern insight due to LLM error.',
          generated_queries: [`${brandName || domainName} 리뷰`, `${brandName || domainName} 부작용`, `${brandName || domainName} 비교`]
        }
      ];
    }
  }

  /**
   * VOC 청크들을 프롬프트에 삽입할 <context> 블록으로 변환합니다.
   * 총 토큰이 과다해지지 않도록 2000자로 제한합니다.
   */
  private static buildContextBlock(chunks?: VOCChunk[]): string {
    if (!chunks || chunks.length === 0) return '';

    const MAX_CONTEXT_CHARS = 2000;
    let accumulated = '';

    for (const chunk of chunks) {
      if (accumulated.length + chunk.text.length > MAX_CONTEXT_CHARS) {
        accumulated += chunk.text.slice(0, MAX_CONTEXT_CHARS - accumulated.length);
        break;
      }
      accumulated += chunk.text + '\n---\n';
    }

    return `\n\n아래는 실제 고객 리뷰/VOC 데이터입니다. 이 데이터에 기반하여 분석하세요:
<context>
${accumulated.trim()}
</context>`;
  }
}
