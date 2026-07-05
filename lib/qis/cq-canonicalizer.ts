import { getAIProvider } from '../ai/ai-provider';
import { CanonicalQuestion } from '../schema';

export interface ClusterInput {
  representative_question: string;
  variants: string[];
  dominant_intents?: string[];
  dominant_entities?: string[];
}

export interface CanonicalQuestionResult {
  canonical_question: string;
  variants: string[];
  primary_intent: string;
  user_context: Record<string, any>;
  constraints: string[];
  evidence_need: string[];
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  preferred_answer_type: string[];
  linked_tco_entities: string[];
  cps_score: number;
}

export class CQCanonicalizer {
  /**
   * 클러스터링된 질문 묶음으로부터 정본화된 대표 질문(CQ) 명세를 생성합니다.
   */
  async canonicalizeCluster(
    workspaceId: string,
    domainId: string,
    cluster: ClusterInput
  ): Promise<CanonicalQuestionResult> {
    const ai = getAIProvider();

    const prompt = `You are a Canonical Question (CQ) Canonicalization Agent.
Your job is to take a cluster of similar search queries and formulate a single, representative, natural-language Canonical Question.

Inputs:
- Representative Seed Question: "${cluster.representative_question}"
- Variants in Cluster: ${JSON.stringify(cluster.variants)}
- Dominant Intents: ${JSON.stringify(cluster.dominant_intents || [])}
- Dominant Entities: ${JSON.stringify(cluster.dominant_entities || [])}

Rules:
1. Do NOT make the canonical question sound like marketing copy. It must be a natural question a user would ask an AI.
2. Incorporate key constraints (region, situation, core intent) but keep it concise.
3. Determine constraints, user context, risk level (low, medium, high, critical), and required evidence types.

Return JSON matching the schema.`;

    const schema = {
      type: "OBJECT",
      properties: {
        canonical_question: { type: "STRING" },
        variants: { type: "ARRAY", items: { type: "STRING" } },
        primary_intent: { type: "STRING" },
        user_context: {
          type: "OBJECT",
          properties: {
            persona_hints: { type: "ARRAY", items: { type: "STRING" } },
            journey_stage: { type: "STRING" }
          },
          required: ["persona_hints", "journey_stage"]
        },
        constraints: { type: "ARRAY", items: { type: "STRING" } },
        evidence_need: { type: "ARRAY", items: { type: "STRING" } },
        risk_level: { type: "STRING", enum: ["low", "medium", "high", "critical"] },
        preferred_answer_type: { type: "ARRAY", items: { type: "STRING" } },
        linked_tco_entities: { type: "ARRAY", items: { type: "STRING" } },
        cps_score: { type: "NUMBER" }
      },
      required: [
        "canonical_question", "variants", "primary_intent", "user_context",
        "constraints", "evidence_need", "risk_level", "preferred_answer_type",
        "linked_tco_entities", "cps_score"
      ]
    };

    try {
      const result = await ai.generateStructuredOutput<CanonicalQuestionResult>(prompt, schema, { temperature: 0.1 });
      return result;
    } catch (err) {
      console.error("[CQCanonicalizer] LLM execution failed, using fallback", err);
      // Fallback
      return {
        canonical_question: cluster.representative_question,
        variants: cluster.variants,
        primary_intent: cluster.dominant_intents?.[0] || 'informational',
        user_context: { persona_hints: ['general'], journey_stage: 'discovery' },
        constraints: [],
        evidence_need: [],
        risk_level: 'low',
        preferred_answer_type: ['direct_answer'],
        linked_tco_entities: cluster.dominant_entities || [],
        cps_score: 50
      };
    }
  }
}
