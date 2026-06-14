import { getAIProvider } from '../ai/ai-provider';
import { ReversedAnswerCard } from '../schema';
import { SeedProbeQuestion } from '../../db/seed/industry-panels/questions-data';

export class ProbeGenerator {
  /**
   * Generate SeedProbeQuestions from ReversedAnswerCard list
   */
  async generateProbes(cards: ReversedAnswerCard[], brandName: string, competitorNames: string[] = []): Promise<SeedProbeQuestion[]> {
    const probes: SeedProbeQuestion[] = [];
    const provider = getAIProvider();
    
    // Competitors fallback
    const comps = competitorNames.length > 0 ? competitorNames : ['경쟁사', '다른 브랜드'];

    // Rule-based base generator (ensures robustness and zero cost for base cases)
    const baseProbes = this.generateRuleBasedProbes(cards, brandName, comps);
    probes.push(...baseProbes);

    // AI-based variant generation if enabled
    const mode = process.env.AI_PROVIDER_MODE || 'mock';
    if (mode !== 'mock' && cards.length > 0) {
      try {
        console.log(`[Probe Generator] Requesting AI derived probes for ${cards.length} cards...`);
        const cardHeaders = cards.map(c => `- Type[${c.card_type}]: "${c.headline}" (triggers: ${c.trigger_queries.slice(0, 2).join(', ')})`).join('\n');
        
        const prompt = `당신은 AI 검색용 소비자 질문 설계자입니다. 다음 역설계된 Answer Card들의 정보를 토대로, 소비자가 AI 검색엔진(ChatGPT, Gemini)에 입력할 수 있는 파생 질문 세트를 설계해주세요.
각 답변 카드마다 2개씩 다음 유형의 질문을 생성하세요:
1. 비교 질문 (경쟁 관계): 예) "${brandName} 제품 vs ${comps[0]} 제품 성능 차이"
2. 심화 질문 (원리/이유): 예) "왜 ${brandName} 제품은 다른 제품보다 자극이 적은가요?"
3. 상황/시기 질문: 예) "지성 피부가 여름에 쓰기에 ${brandName} 제품이 적합한가요?"

Answer Card 리스트:
${cardHeaders}

각 카드에 대한 파생 질문들을 아래 JSON 형식에 맞춰 반환하세요.`;

        const jsonSchema = {
          type: 'object',
          properties: {
            derived_questions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  card_headline: { type: 'string' },
                  question_text: { type: 'string' },
                  question_type: { type: 'string' }, // 'comparison' | 'deep_dive' | 'situational'
                  must_include: { type: 'array', items: { type: 'string' } }
                },
                required: ['card_headline', 'question_text', 'question_type', 'must_include']
              }
            }
          },
          required: ['derived_questions']
        };

        const aiRes = await provider.generateStructuredOutput<{
          derived_questions: Array<{
            card_headline: string;
            question_text: string;
            question_type: string;
            must_include: string[];
          }>;
        }>(prompt, jsonSchema);

        if (aiRes && aiRes.derived_questions) {
          aiRes.derived_questions.forEach((dq, idx) => {
            // Find corresponding card to copy context
            const card = cards.find(c => c.headline === dq.card_headline) || cards[0];
            
            probes.push({
              question_text: dq.question_text,
              intent_context: `AI derived ${dq.question_type} query targeting ${card.headline}`,
              target_keyword: brandName,
              risk_level: dq.question_type === 'comparison' ? 'medium' : 'low',
              decision_stage: dq.question_type === 'comparison' ? 'consideration' : 'awareness',
              question_type: dq.question_type,
              weight: 1.0,
              query_variants: [dq.question_text],
              must_include: Array.from(new Set([...dq.must_include, brandName])),
              should_include: [brandName],
              must_not_do: [],
              layer: dq.question_type === 'comparison' ? 'L2_competitive' : 'L4_journey'
            });
          });
        }
      } catch (e: any) {
        console.warn(`[Probe Generator] AI generation failed: ${e.message}. Using rule-based templates only.`);
      }
    }

    return probes;
  }

  /**
   * Template-based probe generation (fast, deterministic, fallback)
   */
  private generateRuleBasedProbes(cards: ReversedAnswerCard[], brandName: string, competitors: string[]): SeedProbeQuestion[] {
    const list: SeedProbeQuestion[] = [];
    
    cards.forEach((card, cIdx) => {
      // 1. Core trigger query as primary probe
      card.trigger_queries.forEach((q, qIdx) => {
        list.push({
          question_text: q,
          intent_context: `Core site-surface query for card: ${card.headline}`,
          target_keyword: brandName,
          risk_level: 'medium',
          decision_stage: 'consideration',
          question_type: card.card_type,
          weight: 1.2,
          query_variants: [q],
          must_include: [brandName],
          should_include: [],
          must_not_do: [],
          layer: card.card_type === 'comparison' ? 'L2_competitive' : 'L7_brand'
        });
      });

      // 2. Comparison derived question
      const compBrand = competitors[cIdx % competitors.length];
      const compQuestion = `${brandName} ${card.headline} vs ${compBrand} 차이점 비교`;
      list.push({
        question_text: compQuestion,
        intent_context: `Comparison query derived from card: ${card.headline}`,
        target_keyword: brandName,
        risk_level: 'medium',
        decision_stage: 'consideration',
        question_type: 'comparison',
        weight: 1.0,
        query_variants: [compQuestion],
        must_include: [brandName, compBrand],
        should_include: [],
        must_not_do: [],
        layer: 'L2_competitive'
      });

      // 3. Situational query
      const situationalQuestion = `여름에 ${brandName} ${card.headline} 사용하는 방법 및 주의사항`;
      list.push({
        question_text: situationalQuestion,
        intent_context: `Seasonal context query derived from card: ${card.headline}`,
        target_keyword: brandName,
        risk_level: 'low',
        decision_stage: 'awareness',
        question_type: 'situational',
        weight: 0.8,
        query_variants: [situationalQuestion],
        must_include: [brandName],
        should_include: [],
        must_not_do: [],
        layer: 'L6_trend'
      });
    });

    return list;
  }
}
