/**
 * lib/signal-collection/recursive-deepener.ts
 *
 * S-OGDE v2.0 — Multi-Persona Recursive Deepener.
 *
 * v1.0에서는 단일 프롬프트로 분기했으나,
 * v2.0에서는 각 분기에 서로 다른 소비자 페르소나(Skeptic, Pragmatist, Novice)를
 * 할당하여 질문 지형도의 폭(Breadth)을 극대화합니다.
 *
 * 페르소나 수 = branchFactor이므로 추가 LLM 호출은 없습니다.
 */

import { getAIProvider } from '../ai/ai-provider';
import { DEFAULT_PERSONAS, type Persona, type PersonaType } from './types';

export interface RecursiveNode {
  question: string;
  depth: number;
  persona?: PersonaType;  // v2.0: 이 노드를 생성한 페르소나
  children: RecursiveNode[];
}

export interface RecursiveConfig {
  maxDepth: number;
  branchFactor: number;     // v2.0: 페르소나 수와 동기화됨
  maxTotalQuestions: number;
  usePersonas?: boolean;    // v2.0: 멀티 페르소나 활성화 (기본 true)
}

export class RecursiveDeepener {
  private totalQuestionsGenerated = 0;
  private seenQuestions = new Set<string>();

  /**
   * Explores follow-up questions recursively in a tree structure.
   *
   * v2.0: branchFactor가 페르소나 수와 동기화됩니다.
   * 각 분기마다 서로 다른 소비자 페르소나가 질문을 생성합니다.
   */
  async expandTree(
    seedQuestion: string,
    brandName?: string,
    config: RecursiveConfig = { maxDepth: 3, branchFactor: 3, maxTotalQuestions: 20, usePersonas: true }
  ): Promise<RecursiveNode> {
    this.totalQuestionsGenerated = 0;
    this.seenQuestions.clear();
    this.seenQuestions.add(seedQuestion.toLowerCase());

    return await this.exploreNode(seedQuestion, brandName, 1, config);
  }

  private async exploreNode(
    currentQuestion: string,
    brandName: string | undefined,
    currentDepth: number,
    config: RecursiveConfig
  ): Promise<RecursiveNode> {
    const node: RecursiveNode = {
      question: currentQuestion,
      depth: currentDepth,
      children: []
    };

    if (currentDepth >= config.maxDepth || this.totalQuestionsGenerated >= config.maxTotalQuestions) {
      return node;
    }

    const ai = getAIProvider();
    const usePersonas = config.usePersonas !== false;
    const personas = usePersonas ? DEFAULT_PERSONAS : [];

    if (usePersonas) {
      // v2.0: 페르소나별 병렬 분기
      const personaTasks = personas.map(persona =>
        this.generateWithPersona(ai, currentQuestion, brandName, persona, config)
      );

      const results = await Promise.allSettled(personaTasks);

      const allFailed = results.every((r) => r.status === 'rejected');
      if (allFailed && results.length > 0) {
        const reasons = results
          .map((r: any) => r.reason?.message || String(r.reason))
          .join(', ');
        throw new Error(`All personas failed to generate recursive follow-up questions: [${reasons}]`);
      }

      for (let i = 0; i < results.length; i++) {
        if (results[i].status === 'fulfilled') {
          const followUps = (results[i] as PromiseFulfilledResult<string[]>).value;
          for (const fq of followUps) {
            if (this.totalQuestionsGenerated >= config.maxTotalQuestions) break;

            const normalized = fq.toLowerCase().trim();
            if (!this.seenQuestions.has(normalized)) {
              this.seenQuestions.add(normalized);
              this.totalQuestionsGenerated++;

              const childNode = await this.exploreNode(fq, brandName, currentDepth + 1, config);
              childNode.persona = personas[i].type;
              node.children.push(childNode);
            }
          }
        } else {
          console.warn(`[RecursiveDeepener] Persona ${personas[i]?.type} failed`, (results[i] as PromiseRejectedResult).reason);
        }
      }
    } else {
      // v1.0 호환: 단일 프롬프트 분기
      const followUps = await this.generateGeneric(ai, currentQuestion, brandName, config.branchFactor);

      for (const fq of followUps) {
        if (this.totalQuestionsGenerated >= config.maxTotalQuestions) break;

        const normalized = fq.toLowerCase().trim();
        if (!this.seenQuestions.has(normalized)) {
          this.seenQuestions.add(normalized);
          this.totalQuestionsGenerated++;

          const childNode = await this.exploreNode(fq, brandName, currentDepth + 1, config);
          node.children.push(childNode);
        }
      }
    }

    return node;
  }

  /**
   * v2.0: 특정 페르소나 관점에서 후속 질문을 생성합니다.
   * 각 페르소나는 1개의 핵심 질문만 생성합니다 (branchFactor = personas.length).
   */
  private async generateWithPersona(
    ai: ReturnType<typeof getAIProvider>,
    currentQuestion: string,
    brandName: string | undefined,
    persona: Persona,
    config: RecursiveConfig
  ): Promise<string[]> {
    const filledPrompt = persona.system_prompt_template
      .replace('{question}', currentQuestion)
      .replace('{brand}', brandName || "이 분야의 주요 브랜드들");

    const response = await ai.generateStructuredOutput<any>(
      `System:\n${filledPrompt}\n\nUser:\n가장 핵심적인 후속 질문 1개를 생성하세요.`,
      {
        type: 'object',
        properties: {
          follow_ups: { type: 'array', items: { type: 'string' } }
        },
        required: ['follow_ups']
      }
    );

    // 각 페르소나는 1개만 반환 (3 페르소나 = 3 분기)
    return (response.follow_ups || []).slice(0, 1);
  }

  /**
   * v1.0 호환: 단일 프롬프트로 여러 후속 질문 생성.
   */
  private async generateGeneric(
    ai: ReturnType<typeof getAIProvider>,
    currentQuestion: string,
    brandName: string | undefined,
    branchFactor: number
  ): Promise<string[]> {
    const systemPrompt = `You are an AI simulating how consumer curiosity deepens.
The user previously asked: "${currentQuestion}"
Considering the ${brandName ? `brand "${brandName}"` : 'brands in this space'}, generate ${branchFactor} highly specific, distinct follow-up questions that dive deeper into sub-topics (e.g. side effects, comparisons, specific use cases).
Ensure they are not just rephrasings of the original question.`;

    try {
      const response = await ai.generateStructuredOutput<any>(
        `System:\n${systemPrompt}\n\nUser:\nGenerate distinct follow-up questions.`,
        {
          type: 'object',
          properties: {
            follow_ups: { type: 'array', items: { type: 'string' } }
          },
          required: ['follow_ups']
        }
      );

      return response.follow_ups || [];
    } catch (error) {
      console.warn(`RecursiveDeepener failed`, error);
      return [];
    }
  }
}

