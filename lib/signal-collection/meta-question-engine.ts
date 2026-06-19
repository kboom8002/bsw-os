/**
 * lib/signal-collection/meta-question-engine.ts
 *
 * S-OGDE v2.0 — 5-Lens Meta-Question Engine.
 *
 * v2.0 변경사항:
 * - contextChunks 파라미터 추가: VOC 데이터가 주입되면
 *   소비자의 실제 어휘와 뉘앙스를 살려 메타질문을 생성합니다.
 * - 컨텍스트 없이도 v1.0 방식으로 정상 작동합니다 (하위 호환).
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
   * @param contextChunks - VOC 데이터 청크 (Phase S에서 주입, 선택)
   */
  static async analyzeAndGenerate(
    domainName: string,
    brandName?: string,
    contextChunks?: VOCChunk[]
  ): Promise<MetaQuestionResult[]> {
    const ai = getAIProvider();

    // 컨텍스트 블록 생성 (VOC 데이터가 있으면 삽입)
    const contextBlock = MetaQuestionEngine.buildContextBlock(contextChunks);

    const systemPrompt = `You are a consumer psychology analyst specializing in search intent.
Your task is to analyze the "${domainName}" industry and identify what consumers are REALLY asking, specifically considering the brand "${brandName || 'brands in this space'}".
${contextBlock}
Analyze using these 5 meta-perspectives:
1. pattern: The structural patterns of recurring questions (e.g. comparison, safety, recommendation).
2. motivation: The hidden motivations behind searches.
3. journey_stage: Questions asked at different stages of the buyer journey (awareness, consideration, purchase, retention).
4. fear_desire: Questions driven by consumer fears or strong desires.
5. counter: The "blind spot" questions that no one is asking but they should be.

For EACH perspective, provide a brief insight and generate exactly 5 realistic search queries that consumers would type into an AI search engine.${contextBlock ? '\n\n중요: <context> 태그 안의 실제 고객 데이터에 등장하는 소비자의 실제 어휘, 은어, 불만 뉘앙스를 그대로 살려서 질문을 도출하세요.' : ''}`;

    const userPrompt = `Generate the meta-analysis and queries for domain: ${domainName}${brandName ? `, brand: ${brandName}` : ''}`;

    try {
      const response = await ai.generateStructuredOutput<any>(`System:\n${systemPrompt}\n\nUser:\n${userPrompt}`, {
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
      });

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

