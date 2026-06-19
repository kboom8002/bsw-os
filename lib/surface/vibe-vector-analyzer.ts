import { getAIProvider } from '../ai/ai-provider';

export interface VibeVector10D {
  // Emotion (감정 축)
  valance: number;     // -1.0 ~ 1.0 (부정적 ~ 긍정적)
  arousal: number;     // 0.0 ~ 1.0 (차분함 ~ 흥분/활력)
  
  // Motivation (동기 축)
  hedonic: number;     // 0.0 ~ 1.0 (실용적 ~ 쾌락적/즐거움)
  utilitarian: number; // 0.0 ~ 1.0 (감성적 ~ 기능적/유용함)
  
  // Social Evaluation (사회평가 축)
  warmth: number;      // 0.0 ~ 1.0 (차가움/사무적 ~ 따뜻함/인간적)
  competence: number;  // 0.0 ~ 1.0 (아마추어 ~ 전문성/유능함)
  
  // Regulatory Focus (규제초점 축)
  promotion: number;   // 0.0 ~ 1.0 (성취/성장 지향성)
  prevention: number;  // 0.0 ~ 1.0 (안전/위험회피 지향성)

  // Brand Personality (추가 2축)
  sincerity: number;   // 0.0 ~ 1.0 (진정성, 투명함)
  sophistication: number; // 0.0 ~ 1.0 (세련됨, 럭셔리)
}

/**
 * Vibe-Vector 10D 분석기 (S-17)
 * AI가 생성한 텍스트 또는 브랜드 웹사이트 카피를 기반으로 10개의 심리/감성적 축(Vibe Vector)을 측정
 */
export class VibeVectorAnalyzer {
  
  /**
   * 텍스트 묶음을 기반으로 Vibe Vector 10차원 값을 추출합니다.
   */
  async analyze(brandName: string, texts: string[]): Promise<VibeVector10D> {
    const provider = getAIProvider();
    
    const combinedTexts = texts.join('\n\n').substring(0, 8000);
    
    const prompt = `당신은 심리학 및 소비자 행동론 기반의 브랜드 커뮤니케이션 분석 전문가입니다.
브랜드 "${brandName}"과 관련된 텍스트 데이터를 바탕으로, 이 브랜드가 발산하는 고유의 "분위기(Vibe)"를 10차원 벡터(Vibe-Vector 10D)로 수치화해주세요.

각 차원은 다음과 같습니다. (Valance를 제외한 모든 값은 0.0에서 1.0 사이의 실수로 평가합니다.)

[감정 축 Emotion]
1. valance: 브랜드에 대한 텍스트의 감성 극성 (-1.0: 매우 부정/비판적 ~ +1.0: 매우 긍정/호의적)
2. arousal: 차분함/평온함(0.0) vs 활력/흥분/에너지(1.0)

[동기 축 Motivation]
3. hedonic: 실용적(0.0) vs 쾌락적/즐거움 지향적(1.0)
4. utilitarian: 감성적(0.0) vs 기능적/유용함 지향적(1.0)

[사회평가 축 Social Evaluation]
5. warmth: 차가움/사무적(0.0) vs 따뜻함/인간적(1.0)
6. competence: 아마추어/불안정(0.0) vs 고도의 전문성/유능함(1.0)

[규제초점 축 Regulatory Focus]
7. promotion: 성취, 성장, 혜택 획득 지향성 (0.0 ~ 1.0)
8. prevention: 안전, 위험 회피, 예방 지향성 (0.0 ~ 1.0)

[브랜드 성격 축 Brand Personality]
9. sincerity: 진정성, 정직함, 투명함 (0.0 ~ 1.0)
10. sophistication: 세련됨, 고급스러움, 럭셔리 (0.0 ~ 1.0)

분석 대상 텍스트:
"""
${combinedTexts}
"""

반드시 아래 JSON 스키마를 준수하여 수치를 반환해주세요.`;

    const jsonSchema = {
      type: 'object',
      properties: {
        valance: { type: 'number' },
        arousal: { type: 'number' },
        hedonic: { type: 'number' },
        utilitarian: { type: 'number' },
        warmth: { type: 'number' },
        competence: { type: 'number' },
        promotion: { type: 'number' },
        prevention: { type: 'number' },
        sincerity: { type: 'number' },
        sophistication: { type: 'number' }
      },
      required: [
        'valance', 'arousal', 'hedonic', 'utilitarian', 'warmth',
        'competence', 'promotion', 'prevention', 'sincerity', 'sophistication'
      ]
    };

    try {
      const result = await provider.generateStructuredOutput<VibeVector10D>(prompt, jsonSchema);
      return {
        valance: Math.max(-1, Math.min(1, result.valance)),
        arousal: Math.max(0, Math.min(1, result.arousal)),
        hedonic: Math.max(0, Math.min(1, result.hedonic)),
        utilitarian: Math.max(0, Math.min(1, result.utilitarian)),
        warmth: Math.max(0, Math.min(1, result.warmth)),
        competence: Math.max(0, Math.min(1, result.competence)),
        promotion: Math.max(0, Math.min(1, result.promotion)),
        prevention: Math.max(0, Math.min(1, result.prevention)),
        sincerity: Math.max(0, Math.min(1, result.sincerity)),
        sophistication: Math.max(0, Math.min(1, result.sophistication))
      };
    } catch (e: any) {
      console.error(`[VibeVectorAnalyzer] Analysis failed: ${e.message}`);
      
      // Fallback
      return {
        valance: 0.5, arousal: 0.4, hedonic: 0.3, utilitarian: 0.8,
        warmth: 0.5, competence: 0.7, promotion: 0.6, prevention: 0.4,
        sincerity: 0.6, sophistication: 0.4
      };
    }
  }
}
