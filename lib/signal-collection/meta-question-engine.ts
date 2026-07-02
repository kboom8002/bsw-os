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

    const systemPrompt = `You are a consumer psychology analyst specializing in search intent.
Your task is to analyze the "${domainName}" industry and identify what consumers are REALLY asking, specifically considering the brand "${brandName || 'brands in this space'}".
${contextBlock}${tcoBlock}

Analyze using these 5 meta-perspectives:
1. pattern: The structural patterns of recurring questions (e.g. comparison, safety, recommendation).
2. motivation: The hidden motivations behind searches.
3. journey_stage: Questions asked at different stages of the buyer journey (awareness, consideration, purchase, retention).
4. fear_desire: Questions driven by consumer fears or strong desires.
5. counter: The "blind spot" questions that no one is asking but they should be.

For EACH perspective, provide a brief insight and generate exactly 5 realistic search queries that consumers would type into an AI search engine.${contextBlock ? '\n\n중요: <context> 태그 안의 실제 고객 데이터에 등장하는 소비자의 실제 어휘, 은어, 불만 뉘앙스를 그대로 살려서 질문을 도출하세요.' : ''}`;

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
