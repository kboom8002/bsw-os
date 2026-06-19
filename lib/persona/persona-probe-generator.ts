import { getAIProvider } from '../ai/ai-provider';

export type BusinessModel = 'B2B' | 'B2C';

export interface PersonaProbe {
  id: string;
  question_text: string;
  category: 'QBS' | 'RECALL' | 'VIBE';
  business_model: BusinessModel;
  expected_output_schema: 'structured' | 'freeform';
}

export class PersonaProbeGenerator {
  /**
   * Generates a standard set of 24 probing questions dynamically based on industry and business model.
   */
  async generate(
    brandName: string,
    industry: string,
    businessModel: BusinessModel
  ): Promise<PersonaProbe[]> {
    const provider = getAIProvider();

    const prompt = `당신은 AEO/GEO 브랜드 인지 분석 전문가입니다.
브랜드 "${brandName}" (업종: ${industry})에 대해, ${businessModel} 관점에서
AI 검색엔진이 이 브랜드를 어떻게 인지하고 있는지 역설계하기 위한
"표준적이고 전형적인" 프로빙 질문 세트 총 24개를 생성해주세요.

[QBS 프로브 10개 — 정체성·충실도 측정]
목적: LLM이 이 브랜드의 핵심 정체성, 가치, 특징을 얼마나 정확히 알고 있는지 확인
${businessModel === 'B2C' ? 'B2C: 일반 소비자가 구매 전 브랜드에 대해 물어볼 법한 질문' : 'B2B: 기업 바이어/파트너가 벤더 평가 시 물어볼 법한 질문'}

[RECALL 프로브 8개 — 자동 연상 구조 탐사]
목적: "○○ 하면 떠오르는 것"을 통해 LLM의 연상 네트워크를 역설계
${businessModel === 'B2C' ? 'B2C: "○○ 하면 떠오르는 키워드 5개는?" 같은 질문' : 'B2B: "○○과 경쟁하는 기업 3곳과 차이점은?" 같은 질문'}

[VIBE 프로브 6개 — 정동·톤·사회적 인상 측정]
목적: AI가 이 브랜드를 묘사할 때 사용하는 톤과 감정적 뉘앙스를 포착
${businessModel === 'B2C' ? 'B2C: "○○ 브랜드를 사람에 비유하면 어떤 성격?"' : 'B2B: "○○과 비즈니스를 한다면 어떤 파트너 느낌?"'}

생성 결과는 아래의 JSON 배열 구조로 반환해 주세요.
각 항목은 "question_text"와 "category"("QBS", "RECALL", "VIBE" 중 하나)를 포함해야 합니다.`;

    const jsonSchema = {
      type: 'object',
      properties: {
        probes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question_text: { type: 'string' },
              category: { type: 'string', enum: ['QBS', 'RECALL', 'VIBE'] }
            },
            required: ['question_text', 'category']
          }
        }
      },
      required: ['probes']
    };

    try {
      const response = await provider.generateStructuredOutput<{ probes: { question_text: string; category: string }[] }>(
        prompt,
        jsonSchema
      );

      // Validate counts and map to PersonaProbe interface
      let qbsCount = 0;
      let recallCount = 0;
      let vibeCount = 0;

      const probes: PersonaProbe[] = response.probes.map((p, index) => {
        if (p.category === 'QBS') qbsCount++;
        if (p.category === 'RECALL') recallCount++;
        if (p.category === 'VIBE') vibeCount++;

        return {
          id: `probe_${businessModel}_${p.category}_${index}`,
          question_text: p.question_text,
          category: p.category as 'QBS' | 'RECALL' | 'VIBE',
          business_model: businessModel,
          expected_output_schema: p.category === 'RECALL' ? 'structured' : 'freeform'
        };
      });

      console.log(`[PersonaProbeGenerator] Generated ${probes.length} probes for ${brandName} (${businessModel}): QBS=${qbsCount}, RECALL=${recallCount}, VIBE=${vibeCount}`);
      return probes;

    } catch (e: any) {
      console.warn(`[PersonaProbeGenerator] Failed to generate probes: ${e.message}. Using fallback probes.`);
      return this.getFallbackProbes(brandName, businessModel);
    }
  }

  private getFallbackProbes(brandName: string, businessModel: BusinessModel): PersonaProbe[] {
    const probes: PersonaProbe[] = [];
    let idCounter = 0;

    const addProbe = (category: 'QBS' | 'RECALL' | 'VIBE', text: string) => {
      probes.push({
        id: `probe_fallback_${businessModel}_${category}_${idCounter++}`,
        question_text: text,
        category,
        business_model: businessModel,
        expected_output_schema: category === 'RECALL' ? 'structured' : 'freeform'
      });
    };

    if (businessModel === 'B2C') {
      // QBS Fallbacks (10)
      for (let i = 0; i < 10; i++) addProbe('QBS', `${brandName}의 제품은 어떤 특징이 있나요?`);
      // RECALL Fallbacks (8)
      for (let i = 0; i < 8; i++) addProbe('RECALL', `${brandName} 하면 떠오르는 핵심 키워드 5개는 무엇인가요?`);
      // VIBE Fallbacks (6)
      for (let i = 0; i < 6; i++) addProbe('VIBE', `${brandName} 브랜드의 이미지를 형용사 3개로 표현해주세요.`);
    } else {
      // B2B Fallbacks (10)
      for (let i = 0; i < 10; i++) addProbe('QBS', `${brandName}의 B2B 솔루션 핵심 경쟁력은 무엇인가요?`);
      // RECALL Fallbacks (8)
      for (let i = 0; i < 8; i++) addProbe('RECALL', `${brandName}과 자주 비교되는 경쟁 기업 3곳은 어디인가요?`);
      // VIBE Fallbacks (6)
      for (let i = 0; i < 6; i++) addProbe('VIBE', `${brandName}과 비즈니스 파트너십을 맺을 때 기대할 수 있는 업무 스타일은 어떤가요?`);
    }

    return probes;
  }
}
