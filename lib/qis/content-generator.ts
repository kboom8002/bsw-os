import { getAIProvider } from '../ai/ai-provider';

export interface AnswerCardParams {
  query: string;
  intentModel: string;
  scenarioContext: string;
  mustInclude: string[];
  mustNotDo: string[];
  claims: string[];
  riskLevel: string;
}

export class QisContentGenerator {
  /**
   * Generates a high-quality AEO/GEO optimized Answer Card draft.
   */
  static async generateAnswerCard(params: AnswerCardParams): Promise<{
    answerText: string;
    confidence: number;
    reasoning: string;
  }> {
    const ai = getAIProvider();

    const {
      query,
      intentModel,
      scenarioContext,
      mustInclude,
      mustNotDo,
      claims,
      riskLevel,
    } = params;

    const mustIncludeStr = mustInclude.length > 0
      ? mustInclude.map((p, idx) => `${idx + 1}. "${p}"`).join('\n')
      : 'None (no specific constraints)';

    const mustNotDoStr = mustNotDo.length > 0
      ? mustNotDo.map((p, idx) => `${idx + 1}. "${p}"`).join('\n')
      : 'None (no specific restrictions)';

    const claimsStr = claims.length > 0
      ? claims.map((c, idx) => `- ${c}`).join('\n')
      : 'None (general context)';

    const systemPrompt = `당신은 세계 최고의 Answer Engine Optimization (AEO) 및 Generative Engine Optimization (GEO) 전문 콘텐츠 크리에이터입니다.
소비자의 질문에 부합하고 AI 검색 엔진(Perplexity, ChatGPT, Gemini 등)에서 최상위 답변(Featured Snippet)으로 채택되기 좋은 구조의 답변 카드 초안을 작성하세요.

질문: "${query}"
인텐트 유형: "${intentModel}"
컨텍스트 및 상황 맥락: "${scenarioContext}"
위험 수준 (YMYL): "${riskLevel}"

[답변 작성 가이드라인]
1. **AEO (Answer Engine Optimization) 필수 규칙**:
   - 답변의 **가장 첫 1~2문장**은 소비자의 핵심 질문에 대한 **직관적이고 명확한 직접 답변(Direct Answer)**으로 시작해야 합니다.
   - 불필요한 미사여구나 서론 없이 결론부터 명확히 전달하세요.

2. **GEO (Generative Engine Optimization) 필수 규칙**:
   - 아래 제공되는 [실측 주장 및 사실 근거]를 자연스럽게 문맥에 녹여내어 신뢰성을 높이세요.
   - 정보 출처나 개체(Entity) 관계를 명확히 서술하세요.

3. **필수 포함 요소 (MUST INCLUDE)**:
   - 다음 어구/키워드/주장 패턴을 반드시 본문에 자연스럽게 포함해야 합니다:
${mustIncludeStr}

4. **절대 금지 사항 (MUST NOT DO)**:
   - 다음 어구/키워드/주장은 절대 본문에 포함하거나 암시하면 안 됩니다:
${mustNotDoStr}

[실측 주장 및 사실 근거]
${claimsStr}

[작성 포맷]
- 최종 출력은 사용자에게 유용한 마크다운(Markdown) 형식으로 작성하세요.
- 답변은 정중하고 신뢰할 수 있는 전문적인 톤앤매너를 유지하세요.`;

    try {
      const response = await ai.generateStructuredOutput<any>(
        `System:\n${systemPrompt}\n\nUser:\n답변 카드 본문과 작성 논리, 그리고 평가 확신도를 생성하세요.`,
        {
          type: 'object',
          properties: {
            answer_text: { type: 'string', description: '마크다운 형식의 답변 카드 본문 텍스트 (AEO/GEO 규칙 충족)' },
            confidence_score: { type: 'number', description: '생성 결과물의 완성도 점수 (0.00 ~ 1.00)' },
            reasoning: { type: 'string', description: 'AEO/GEO 작성 논리 및 필수 포함/금지 조항 충족 여부 검토 의견' }
          },
          required: ['answer_text', 'confidence_score', 'reasoning']
        },
        { temperature: 0.2 }
      );

      // Post-generation guard: check must_not_do programmatically and prune if LLM leaked them
      let answerText = response.answer_text || '';
      for (const forbidden of mustNotDo) {
        // Escape regex special characters to prevent injection
        const escapedForbidden = forbidden.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedForbidden, 'gi');
        if (regex.test(answerText)) {
          console.warn(`[QisContentGenerator] Safety Violation: Must not do phrase "${forbidden}" was generated. Removing/Sanitizing.`);
          answerText = answerText.replace(regex, '');
        }
      }

      return {
        answerText: answerText,
        confidence: response.confidence_score ?? 0.85,
        reasoning: response.reasoning || 'Successfully generated.',
      };
    } catch (err: any) {
      console.error('[QisContentGenerator] LLM Generation failed:', err);
      // Fallback response
      return {
        answerText: `<p><strong>직접 답변:</strong> ${query}에 대한 실측 데이터 기반 핵심 가이드라인입니다.</p>\n\n<ul>` +
          mustInclude.map(i => `<li>${i} 관련 설명</li>`).join('\n') + `</ul>`,
        confidence: 0.5,
        reasoning: `Fallback due to LLM error: ${err.message}`,
      };
    }
  }

  /**
   * Generates multi-channel assets from a Pattern Attractor Spec
   */
  static async generateFromAttractor(
    attractor: any,
    channels: string[]
  ): Promise<any[]> {
    const { MediaSolitonGenerator } = await import('../pattern-attractor/media-soliton-generator');
    const generator = new MediaSolitonGenerator();
    const assets = [];

    for (const channel of channels) {
      try {
        const asset = await generator.generateForChannel(attractor, channel as any);
        assets.push(asset);
      } catch (err) {
        console.error(`generateFromAttractor failed for channel ${channel}:`, err);
      }
    }

    return assets;
  }
}
