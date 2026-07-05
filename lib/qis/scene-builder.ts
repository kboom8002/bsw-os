import { getAIProvider } from '../ai/ai-provider';
import { ContextTensorBuilder } from '../pattern-attractor/context-tensor-builder';

export interface SceneBuilderInput {
  id: string;
  normalized_question: string;
  primary_intent?: string;
  risk_level?: string;
  constraints?: string[];
  evidence_need?: string[];
}

export interface QisSceneResult {
  scene_name: string;
  intent_model: {
    primary_intent: string;
    secondary_intents: string[];
  };
  context_tensor: Record<string, any>;
  evidence_requirements: string[];
  risk_policy: {
    risk_level: 'low' | 'medium' | 'high' | 'critical';
    blocked_claims: string[];
    required_disclaimers: string[];
    verification_required: string[];
  };
  answer_policy: {
    short_answer_rule: string;
    detail_structure: string[];
    comparison_required: boolean;
    safe_phrasing: string[];
  };
  cta_policy: {
    primary: string;
    secondary: string[];
    blocked: string[];
  };
  must_do: string[];
  must_not_do: string[];
  output_targets: string[];
  readiness_score: number;
}

export class SceneBuilder {
  /**
   * 대표 질문(CQ)을 바탕으로 실행 가능한 QIS Scene 정책 명세를 구축합니다.
   */
  async buildScene(
    workspaceId: string,
    domainId: string,
    cq: SceneBuilderInput
  ): Promise<QisSceneResult> {
    const ai = getAIProvider();

    // 1. 기존 ContextTensorBuilder를 활용하여 7축 텐서 기초 빌드
    const basicTensor = await ContextTensorBuilder.buildFromQuery(
      cq.normalized_question,
      domainId, // domainId를 domain_slug 용도로 전달
      'answer_card'
    );

    const prompt = `You are a QIS Scene Builder Agent.
Your job is to translate a Canonical Question (CQ) into a structured QIS Scene specification.
A QIS Scene is a control specification that governs answer generation, evidence matching, risk policies, and CTA routing.

Canonical Question Details:
- Question: "${cq.normalized_question}"
- Primary Intent: "${cq.primary_intent || 'unknown'}"
- Initial Risk Level: "${cq.risk_level || 'medium'}"
- Constraints: ${JSON.stringify(cq.constraints || [])}
- Required Evidence Hints: ${JSON.stringify(cq.evidence_need || [])}
- Base Context Tensor: ${JSON.stringify(basicTensor)}

Formulate Scene policies:
- intent_model: Define primary and secondary intent paths.
- evidence_requirements: List specific facts/documentation needed to answer safely.
- risk_policy: Block unsupported claims, require disclaimers if risk is high/critical.
- answer_policy: Outline response structure and safety constraints.
- cta_policy: Specify map/call/reservation links that are recommended or forbidden.
- readiness_score: Calculate scene readiness (0 to 100) based on availability of rules.

Return JSON matching the schema.`;

    const schema = {
      type: "OBJECT",
      properties: {
        scene_name: { type: "STRING" },
        intent_model: {
          type: "OBJECT",
          properties: {
            primary_intent: { type: "STRING" },
            secondary_intents: { type: "ARRAY", items: { type: "STRING" } }
          },
          required: ["primary_intent", "secondary_intents"]
        },
        evidence_requirements: { type: "ARRAY", items: { type: "STRING" } },
        risk_policy: {
          type: "OBJECT",
          properties: {
            risk_level: { type: "STRING", enum: ["low", "medium", "high", "critical"] },
            blocked_claims: { type: "ARRAY", items: { type: "STRING" } },
            required_disclaimers: { type: "ARRAY", items: { type: "STRING" } },
            verification_required: { type: "ARRAY", items: { type: "STRING" } }
          },
          required: ["risk_level", "blocked_claims", "required_disclaimers", "verification_required"]
        },
        answer_policy: {
          type: "OBJECT",
          properties: {
            short_answer_rule: { type: "STRING" },
            detail_structure: { type: "ARRAY", items: { type: "STRING" } },
            comparison_required: { type: "BOOLEAN" },
            safe_phrasing: { type: "ARRAY", items: { type: "STRING" } }
          },
          required: ["short_answer_rule", "detail_structure", "comparison_required", "safe_phrasing"]
        },
        cta_policy: {
          type: "OBJECT",
          properties: {
            primary: { type: "STRING" },
            secondary: { type: "ARRAY", items: { type: "STRING" } },
            blocked: { type: "ARRAY", items: { type: "STRING" } }
          },
          required: ["primary", "secondary", "blocked"]
        },
        must_do: { type: "ARRAY", items: { type: "STRING" } },
        must_not_do: { type: "ARRAY", items: { type: "STRING" } },
        output_targets: { type: "ARRAY", items: { type: "STRING" } },
        readiness_score: { type: "INTEGER" }
      },
      required: [
        "scene_name", "intent_model", "evidence_requirements", "risk_policy",
        "answer_policy", "cta_policy", "must_do", "must_not_do", "output_targets", "readiness_score"
      ]
    };

    try {
      const result = await ai.generateStructuredOutput<Omit<QisSceneResult, 'context_tensor'>>(prompt, schema, { temperature: 0.1 });
      return {
        ...result,
        context_tensor: basicTensor
      } as QisSceneResult;
    } catch (err) {
      console.error("[SceneBuilder] LLM execution failed, using fallback", err);
      // Fallback
      return {
        scene_name: `${cq.normalized_question.slice(0, 30)} Scene`,
        intent_model: { primary_intent: cq.primary_intent || 'informational', secondary_intents: [] },
        context_tensor: basicTensor,
        evidence_requirements: cq.evidence_need || [],
        risk_policy: {
          risk_level: (cq.risk_level as any) || 'medium',
          blocked_claims: [],
          required_disclaimers: [],
          verification_required: []
        },
        answer_policy: {
          short_answer_rule: 'Provide direct answer to user query.',
          detail_structure: ['Direct answer', 'Supporting details'],
          comparison_required: false,
          safe_phrasing: []
        },
        cta_policy: {
          primary: 'open_map',
          secondary: [],
          blocked: []
        },
        must_do: [],
        must_not_do: [],
        output_targets: ['answer_card'],
        readiness_score: 60
      };
    }
  }
}
