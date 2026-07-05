import { getAIProvider } from '../ai/ai-provider';

export interface TcoDistillerInput {
  scene_name: string;
  normalized_question: string;
  evidence_requirements: string[];
  risk_policy: Record<string, any>;
  cta_policy: Record<string, any>;
}

export interface ExtractedTcoConcept {
  id?: string; // Existing ID if matched
  proposed_id: string; // Proposed slug (e.g. constraint.parking_required)
  concept_name: string;
  entity_type: string;
  definition: string;
  aliases: string[];
  activation_condition: Record<string, any>;
  boundary: Record<string, any>;
  evidence_requirement: string[];
  risk_vector: Record<string, any>;
  action_policy: Record<string, any>;
  novelty: 'existing_matched' | 'new_concept';
  confidence: number;
}

export class TcoDistiller {
  /**
   * QIS Scene에서 운영에 직접적인 영향을 주는 TCO 개념을 정제하여 추출하고, 기존 개념 목록과 매칭을 시도합니다.
   */
  async distillEntities(
    workspaceId: string,
    scene: TcoDistillerInput,
    existingConcepts: Array<{ id: string; concept_name: string; slug: string; definition: string }> = []
  ): Promise<ExtractedTcoConcept[]> {
    const ai = getAIProvider();

    const prompt = `You are a TCO Entity Distillation Agent.
Your job is to read a QIS Scene and extract actionable concepts/entities that can affect recommendation logic, risk vectors, evidence constraints, or CTA routing.

Inputs:
- Scene Name: "${scene.scene_name}"
- Normalized Question: "${scene.normalized_question}"
- Evidence Requirements: ${JSON.stringify(scene.evidence_requirements)}
- Risk Policy: ${JSON.stringify(scene.risk_policy)}
- CTA Policy: ${JSON.stringify(scene.cta_policy)}

Existing Concepts in Database (for deduplication / matching):
${JSON.stringify(existingConcepts.map(c => ({ id: c.id, name: c.concept_name, slug: c.slug })))}

Rules:
1. Do not extract trivial keywords. Extract only operating concepts (e.g., "constraint.parking_required", "situation.post_treatment_skin", "intent.quick_reservation").
2. Check the "Existing Concepts" list. If a concept matches in meaning, reuse its slug as the proposed_id, mark "novelty" as "existing_matched", and bind its ID.
3. If no existing match is found, propose a new structured slug, and mark "novelty" as "new_concept".
4. Determine aliases, definition, activation rules, safety boundaries, evidence requirements, and custom action policies.

Return JSON matching the schema.`;

    const schema = {
      type: "OBJECT",
      properties: {
        entities: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              id: { type: "STRING" },
              proposed_id: { type: "STRING" },
              concept_name: { type: "STRING" },
              entity_type: { type: "STRING" },
              definition: { type: "STRING" },
              aliases: { type: "ARRAY", items: { type: "STRING" } },
              activation_condition: { type: "OBJECT" },
              boundary: { type: "OBJECT" },
              evidence_requirement: { type: "ARRAY", items: { type: "STRING" } },
              risk_vector: { type: "OBJECT" },
              action_policy: { type: "OBJECT" },
              novelty: { type: "STRING", enum: ["existing_matched", "new_concept"] },
              confidence: { type: "NUMBER" }
            },
            required: [
              "proposed_id", "concept_name", "entity_type", "definition", "aliases",
              "activation_condition", "boundary", "evidence_requirement", "risk_vector",
              "action_policy", "novelty", "confidence"
            ]
          }
        }
      },
      required: ["entities"]
    };

    try {
      const response = await ai.generateStructuredOutput<{ entities: ExtractedTcoConcept[] }>(prompt, schema, { temperature: 0.1 });
      
      // Post-process matches to ensure database IDs are accurately bound if LLM missed it but matched slug
      const entities = response.entities || [];
      return entities.map(entity => {
        if (entity.novelty === 'existing_matched' || !entity.id) {
          const matched = existingConcepts.find(
            ec => ec.slug === entity.proposed_id || ec.concept_name.toLowerCase() === entity.concept_name.toLowerCase()
          );
          if (matched) {
            return {
              ...entity,
              id: matched.id,
              proposed_id: matched.slug,
              novelty: 'existing_matched'
            };
          }
        }
        return entity;
      });
    } catch (err) {
      console.error("[TcoDistiller] LLM distillation failed, returning fallback empty array", err);
      return [];
    }
  }
}
