/**
 * lib/signal-collection/reverse-question-engine.ts
 *
 * S-OGDE v2.0 — Reverse-Engineered Question Discovery.
 *
 * 정보 탐색을 넘어 마케팅 전환에 직결되는 세일즈 시그널을 발굴합니다.
 * 
 * 기존 OGDE: 질문 → 답변 → 후속 질문 (순방향)
 * Reverse:   타겟 답변(USP) → "이 답변에 도달하려면 어떤 질문을 해야 하는가?" (역방향)
 *
 * 브랜드의 USP/핵심 메시지를 입력하면, 소비자가 AI 검색에서
 * 그 결론에 자연스럽게 도달하기 위한 최초 질문 경로를 역추적합니다.
 */

import { getAIProvider } from '../ai/ai-provider';

export interface ReverseQuestionPath {
  target_answer: string;       // 입력된 브랜드 USP/타겟 답변
  entry_questions: string[];   // 최초 검색 질문 후보 3~5개
  reasoning_paths: Array<{
    step1_question: string;    // 최초 질문
    step2_question: string;    // 중간 후속 질문
    step3_question: string;    // 최종 도달 질문
    rationale: string;         // 왜 이 경로가 타겟 답변에 도달하는지
  }>;
}

export class ReverseQuestionEngine {
  /**
   * 브랜드의 타겟 답변(USP)을 입력받아, 소비자가 AI 검색에서
   * 해당 결론에 도달하기 위한 질문 경로를 역추적합니다.
   *
   * @param targetAnswer - 브랜드의 USP 또는 원하는 AI 응답 문구
   * @param brandName - 브랜드명
   * @param domainName - 업종명
   * @returns 역추적된 질문 경로들
   */
  static async reverseEngineer(
    targetAnswer: string,
    brandName: string,
    domainName: string
  ): Promise<ReverseQuestionPath> {
    const ai = getAIProvider();

    const systemPrompt = `당신은 AI 검색 행동 분석 전문가입니다.

아래는 "${brandName}" 브랜드가 AI 검색 결과에서 최종적으로 노출되기를 원하는 **타겟 답변(USP)**입니다:

<target_answer>
${targetAnswer}
</target_answer>

업종: ${domainName}

소비자가 AI 검색엔진(ChatGPT, Gemini, Perplexity 등)에서 이 타겟 답변을 최종적으로 도출해내려면:

1. **entry_questions**: 최초 검색창에 입력할 수 있는 자연스러운 질문 5개를 생성하세요.
2. **reasoning_paths**: 위 질문 중 가장 전략적인 3개에 대해, 3단계 선행 대화 경로를 역추적하세요.
   - step1_question: 소비자가 처음 검색하는 질문
   - step2_question: step1의 답변을 보고 자연스럽게 이어지는 후속 질문
   - step3_question: step2의 답변을 보고 타겟 답변에 도달하게 되는 최종 질문
   - rationale: 이 경로가 타겟 답변에 자연스럽게 도달하는 논리적 이유

규칙:
- 실제 소비자가 검색할 법한 자연스러운 한국어 질문이어야 합니다.
- 브랜드명을 직접 포함하지 않는 generic 질문도 포함해야 합니다.
- 질문은 informational → comparative → decision 순으로 점진적이어야 합니다.`;

    try {
      const response = await ai.generateStructuredOutput<any>(
        `System:\n${systemPrompt}\n\nUser:\n타겟 답변에 도달하는 질문 경로를 역추적하세요.`,
        {
          type: 'object',
          properties: {
            entry_questions: { type: 'array', items: { type: 'string' } },
            reasoning_paths: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  step1_question: { type: 'string' },
                  step2_question: { type: 'string' },
                  step3_question: { type: 'string' },
                  rationale: { type: 'string' }
                },
                required: ['step1_question', 'step2_question', 'step3_question', 'rationale']
              }
            }
          },
          required: ['entry_questions', 'reasoning_paths']
        }
      );

      return {
        target_answer: targetAnswer,
        entry_questions: response.entry_questions || [],
        reasoning_paths: response.reasoning_paths || []
      };
    } catch (error) {
      console.warn('[ReverseQuestionEngine] LLM call failed', error);
      return {
        target_answer: targetAnswer,
        entry_questions: [
          `${domainName} 추천`,
          `${domainName} 비교`,
          `${domainName} 선택 기준`
        ],
        reasoning_paths: []
      };
    }
  }

  /**
   * 역추적된 경로에서 모든 고유 질문을 추출합니다.
   * Orchestrator에서 allCandidates에 합류시킬 때 사용합니다.
   */
  static extractAllQuestions(result: ReverseQuestionPath): string[] {
    const questions = new Set<string>();

    for (const q of result.entry_questions) {
      questions.add(q);
    }

    for (const path of result.reasoning_paths) {
      questions.add(path.step1_question);
      questions.add(path.step2_question);
      questions.add(path.step3_question);
    }

    return Array.from(questions);
  }
}
