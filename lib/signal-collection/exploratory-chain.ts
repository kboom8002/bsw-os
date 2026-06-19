/**
 * lib/signal-collection/exploratory-chain.ts
 *
 * S-OGDE v2.0 — Search-Grounded Exploratory Chain.
 *
 * v1.0에서는 LLM이 가상의 답변을 "상상"하고 그 위에서 후속 질문을 파생시켰습니다.
 * v2.0에서는 실제 AI 검색 엔진(Gemini Grounding)의 응답을 기반으로 
 * 정보 갭(Information Gap)을 파악하여 후속 질문을 추출합니다.
 *
 * 할루시네이션 제거 → 실제 소비자 경험 시뮬레이션 정확도 향상.
 */

import { getAIProvider } from '../ai/ai-provider';
import { SearchProviderFactory } from '../ai/search-provider-factory';
import type { GroundedAnswer } from './types';

export interface ExploratoryStep {
  question: string;
  answer_summary: string;
  follow_up_questions: string[];
  depth: number;
  grounded: boolean;           // 실제 검색 결과 기반 여부
  citations?: Array<{ url: string; domain: string; title: string }>;
}

/** Rate limit 간격 (ms). Gemini Grounding은 분당 제한이 있음. */
const SEARCH_DELAY_MS = 500;

export class ExploratoryChain {
  /**
   * Runs a search-grounded exploratory chain.
   *
   * v2.0: 각 단계에서 실제 AI 검색 엔진을 호출하여 답변을 확보하고,
   *        LLM은 그 실제 답변에서 후속 질문만 추출합니다.
   *
   * Fallback: 검색 API 실패 시 v1.0 방식(LLM 내부 답변)으로 자동 전환.
   *
   * @param seedQuestion - 시작 질문
   * @param brandName - 브랜드명
   * @param maxDepth - 최대 탐색 깊이 (기본 3)
   * @param searchEngine - 사용할 검색 엔진 (기본 'gemini_grounding')
   */
  static async runChain(
    seedQuestion: string,
    brandName: string,
    maxDepth: number = 3,
    searchEngine: string = 'gemini_grounding'
  ): Promise<ExploratoryStep[]> {
    const ai = getAIProvider();
    const chain: ExploratoryStep[] = [];
    let currentQuestion = seedQuestion;

    for (let depth = 1; depth <= maxDepth; depth++) {
      try {
        // 1. 실제 AI 검색 엔진에서 답변 확보
        const grounded = await ExploratoryChain.fetchGroundedAnswer(
          currentQuestion, searchEngine
        );

        // 2. LLM에게 실제 답변을 읽고 후속 질문만 추출하도록 지시
        const followUps = await ExploratoryChain.extractFollowUps(
          ai, currentQuestion, grounded.answer_text, brandName
        );

        chain.push({
          question: currentQuestion,
          answer_summary: grounded.answer_text.slice(0, 500), // 요약은 첫 500자
          follow_up_questions: followUps,
          depth,
          grounded: true,
          citations: grounded.citations
        });

        // 다음 단계의 질문 선택
        if (followUps.length > 0) {
          currentQuestion = followUps[0];
        } else {
          break;
        }

        // Rate limit 간격
        if (depth < maxDepth) {
          await delay(SEARCH_DELAY_MS);
        }
      } catch (error) {
        // Fallback: v1.0 방식 (LLM 내부 답변 생성)
        console.warn(`[ExploratoryChain] Search grounding failed at depth ${depth}, falling back to LLM-native mode`, error);

        try {
          const fallbackResult = await ExploratoryChain.runFallbackStep(
            ai, currentQuestion, brandName, depth
          );
          chain.push(fallbackResult);

          if (fallbackResult.follow_up_questions.length > 0) {
            currentQuestion = fallbackResult.follow_up_questions[0];
          } else {
            break;
          }
        } catch (fallbackError) {
          console.warn(`[ExploratoryChain] Fallback also failed at depth ${depth}`, fallbackError);
          break;
        }
      }
    }

    return chain;
  }

  /**
   * 실제 AI 검색 엔진을 호출하여 그라운딩된 답변을 확보합니다.
   */
  private static async fetchGroundedAnswer(
    query: string,
    engineName: string
  ): Promise<GroundedAnswer> {
    const provider = SearchProviderFactory.getProvider(engineName);
    const result = await provider.search(query);

    return {
      query,
      answer_text: result.raw_response_text,
      citations: result.citations.map(c => ({
        url: c.url,
        domain: c.domain,
        title: c.title || ''
      })),
      engine: engineName
    };
  }

  /**
   * LLM에게 실제 AI 검색 결과를 읽고 후속 질문을 추출하도록 지시합니다.
   * 핵심: LLM은 답변을 "생성"하지 않고, 실제 답변에서 "정보 갭을 파악"만 합니다.
   */
  private static async extractFollowUps(
    ai: ReturnType<typeof getAIProvider>,
    question: string,
    realAnswer: string,
    brandName: string
  ): Promise<string[]> {
    const systemPrompt = `당신은 소비자 호기심 분석가입니다.

아래는 소비자가 "${question}"이라고 AI에 질문했을 때 받은 **실제 AI 검색 결과**입니다:

<search_result>
${realAnswer.slice(0, 2000)}
</search_result>

이 답변을 읽은 소비자가 추가로 느낄 **정보 갭(Information Gap)**을 파악하세요.
브랜드 "${brandName}" 맥락을 고려하되, 답변에서 충분히 다루지 않은 측면을 중심으로
자연스러운 후속 질문 3개를 생성하세요.

규칙:
- 원래 질문의 단순 재표현이 아닌, 답변에서 파생되는 새로운 궁금증이어야 합니다.
- 실제 소비자가 검색창에 입력할 법한 자연스러운 한국어 질문이어야 합니다.`;

    const response = await ai.generateStructuredOutput<any>(
      `System:\n${systemPrompt}\n\nUser:\n후속 질문 3개를 추출하세요.`,
      {
        type: 'object',
        properties: {
          follow_up_questions: { type: 'array', items: { type: 'string' } }
        },
        required: ['follow_up_questions']
      }
    );

    return response.follow_up_questions || [];
  }

  /**
   * Fallback: v1.0 방식 — LLM이 답변을 생성하고 후속 질문도 추출.
   * 검색 API 실패 시에만 사용됩니다.
   */
  private static async runFallbackStep(
    ai: ReturnType<typeof getAIProvider>,
    currentQuestion: string,
    brandName: string,
    depth: number
  ): Promise<ExploratoryStep> {
    const systemPrompt = `You are an AI Search Engine simulating a conversation with a consumer.
The consumer asked: "${currentQuestion}"
The brand context is: "${brandName}"

Provide:
1. answer_summary: A concise, helpful summary of the answer you would give.
2. follow_up_questions: Generate 3 natural follow-up questions the consumer would likely ask after reading your answer.`;

    const response = await ai.generateStructuredOutput<any>(
      `System:\n${systemPrompt}\n\nUser:\nAnswer the question and provide follow-ups.`,
      {
        type: 'object',
        properties: {
          answer_summary: { type: 'string' },
          follow_up_questions: { type: 'array', items: { type: 'string' } }
        },
        required: ['answer_summary', 'follow_up_questions']
      }
    );

    return {
      question: currentQuestion,
      answer_summary: response.answer_summary,
      follow_up_questions: response.follow_up_questions || [],
      depth,
      grounded: false  // LLM-native fallback
    };
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
