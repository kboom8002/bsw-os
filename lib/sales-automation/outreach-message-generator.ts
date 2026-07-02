/**
 * lib/sales-automation/outreach-message-generator.ts
 *
 * 매칭 갭과 업체 정보를 기반으로 맞춤형 영업 설득 메시지를 생성하는 생성기
 */

import { getAIProvider } from '../ai/ai-provider';
import type { BusinessAttributes, BusinessMatchResult } from './types';

export class OutreachMessageGenerator {
  /**
   * AI를 활용해 갭 패턴과 매칭 스코어를 융합한 세이즈 제안 메시지를 한글로 빌드합니다.
   */
  public static async generate(
    businessName: string,
    businessType: string,
    attributes: BusinessAttributes,
    matchResult: BusinessMatchResult,
    trendingQuestions: any[]
  ): Promise<string> {
    const ai = getAIProvider();

    // 상위 대표 갭 질문 추출
    const targetQuestion = trendingQuestions[0]?.query || '비 오는 날 갈 만한 카페';
    
    const prompt = `You are a premium B2B Sales & Proposal Writer.
Write a highly persuasive, customized outreach message (Korean) to a local business owner.

Business Profile:
- Name: ${businessName}
- Type: ${businessType}
- Attributes: ${JSON.stringify(attributes)}

Gap Analysis:
- Rising search demand question on local portal: "${targetQuestion}"
- Current status: Lack of search results for this condition. The portal has a HUGE GAP of answers.
- Target Business Fit: The business has matching features (${matchResult.matched_gap_types.join(', ')}) making it an ideal answer.

Product Offered:
- Product Name: ${matchResult.recommended_product}
- Product Tier: ${matchResult.recommended_tier}

Writing Guidelines:
1. NEVER start with a generic "Buy advertising" pitch.
2. Put the value proposition first: "Customers don't just search Jeju Cafe anymore. They search 'Cafes with easy parking for elderly parents on rainy days'. Currently, there are not enough cafes answering this demand, and your shop fits perfectly."
3. Keep the tone professional, respectful, warm, and zero-pressure. Emphasize that "we have the demand (search traffic), but we lack the answer (cozy structured content), and you can be that answer."
4. Format with paragraphs and clear spacing.
5. Return a JSON object with key: "outreach_message".`;

    try {
      const response = await ai.generateStructuredOutput<any>(
        `System:\n${prompt}\n\nUser:\nWrite the customized proposal message.`,
        {
          type: 'object',
          properties: {
            outreach_message: { type: 'string' }
          },
          required: ['outreach_message']
        },
        { temperature: 0.3 }
      );

      return response.outreach_message || this.generateFallback(businessName, targetQuestion, matchResult);
    } catch (err) {
      console.warn('[OutreachMessageGenerator] Failed to generate message using AI, using fallback:', err);
      return this.generateFallback(businessName, targetQuestion, matchResult);
    }
  }

  private static generateFallback(
    businessName: string,
    targetQuestion: string,
    matchResult: BusinessMatchResult
  ): string {
    return `안녕하세요, ${businessName} 대표님.

최근 지역 포털에서 "${targetQuestion}" 관련 검색 질문이 눈에 띄게 급증하고 있으나, 안타깝게도 해당 조건을 만족하는 정량화된 정보 카드를 가진 매장이 턱없이 부족하여 고객들이 기회를 놓치고 있습니다.

대표님의 매장은 편리한 조건들을 이미 갖추고 계셔 본 질문의 가장 완벽한 해답이 될 수 있습니다. 

저희가 새로 제공해 드리는 [${matchResult.recommended_product}]을 도입하시면 해당 질문에 대응되는 맞춤 상황형 카드뉴스와 llm.txt AI 색인 텍스트가 자동 조립되어 상단 추천 로직에 우선 매칭되도록 도와드립니다. 

부담 없이 가볍게 연락해 주시면 맞춤 견적과 무료 미리보기 분석 리포트를 보내드리겠습니다. 감사합니다.`;
  }
}
