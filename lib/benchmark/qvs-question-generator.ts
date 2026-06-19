import { getAIProvider } from '../ai/ai-provider';

export interface QvsPredictedQuestion {
  question: string;
  intent: string;
  category: 'consumer' | 'competitor' | 'expert';
  qvs_score_estimated: number;
}

/**
 * NanoJob J1-J3 다단계 질문 도출 시스템 (S-13)
 * - J1: Consumer (소비자 관점 - 혜택, 부작용, 사용법 등)
 * - J2: Competitor (경쟁사 비교 관점 - 대체재, 차이점 등)
 * - J3: Expert (전문가 관점 - 성분, 기술, 임상 등)
 */
export class QvsQuestionGenerator {
  
  async generateMultistageQuestions(brandName: string, industry: string, keywords: string[]): Promise<QvsPredictedQuestion[]> {
    const provider = getAIProvider();
    
    const prompt = `당신은 AEO/GEO 질문 예측(QVS) 및 사용자 의도 분석 전문가입니다.
브랜드 "${brandName}" (산업군: ${industry}, 핵심 키워드: ${keywords.join(', ')})에 대해 AI 검색엔진 사용자(ChatGPT, Gemini 등)가 질문할 가능성이 높은 High-Value 질문을 NanoJob 다단계(J1-J3)로 도출해주세요.

[J1: Consumer 관점 (소비자 혜택/문제해결)]
- 일반 소비자가 구매 전/후 겪는 문제나 궁금증
- 사용법, 효과, 부작용, 가성비 등

[J2: Competitor 관점 (대체재/경쟁비교)]
- 다른 유명 브랜드나 대체재와의 객관적 비교
- 특정 상황에서 어떤 브랜드가 더 나은지에 대한 질문

[J3: Expert 관점 (기술/성분/신뢰도)]
- 기술 스펙, 핵심 성분, 임상 데이터, 부작용 기전 등 깊이 있는 질문
- EEAT(전문성/권위)를 검증하려는 질문

반드시 아래 JSON 스키마를 준수하여, 각 관점별로 3개씩 총 9개의 질문을 생성해주세요.
각 질문마다 예상되는 QVS(Question Value Score, 0~100)를 측정해주세요. (QVS = 볼륨 * 전환율 * 객단가 추정치)`;

    const jsonSchema = {
      type: 'object',
      properties: {
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              intent: { type: 'string' },
              category: { type: 'string', enum: ['consumer', 'competitor', 'expert'] },
              qvs_score_estimated: { type: 'number' }
            },
            required: ['question', 'intent', 'category', 'qvs_score_estimated']
          }
        }
      },
      required: ['questions']
    };

    try {
      const result = await provider.generateStructuredOutput<{ questions: QvsPredictedQuestion[] }>(prompt, jsonSchema);
      return result.questions || [];
    } catch (e: any) {
      console.error(`[QVS Generator] Failed to generate NanoJob questions: ${e.message}`);
      
      // Fallback
      return [
        { question: `${brandName} 제품의 가장 큰 효과와 부작용은 무엇인가요?`, intent: 'information', category: 'consumer', qvs_score_estimated: 85 },
        { question: `${brandName}와 가장 유사한 경쟁 제품의 차이점은 무엇인가요?`, intent: 'comparison', category: 'competitor', qvs_score_estimated: 92 },
        { question: `${brandName} 핵심 성분의 임상 데이터와 안전성은 검증되었나요?`, intent: 'verification', category: 'expert', qvs_score_estimated: 78 },
      ];
    }
  }
}
