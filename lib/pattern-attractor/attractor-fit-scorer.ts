import { getAIProvider } from '../ai/ai-provider';
import { PatternAttractorSpec, ContextTensor, AttractorFitResult } from './types';

export class AttractorFitScorer {
  // LLM-based Attractor Fit Scorer
  async scoreAttractorFit(
    attractor: PatternAttractorSpec,
    query: string,
    tensor: ContextTensor,
    availableEvidence: string[]
  ): Promise<AttractorFitResult> {
    const ai = getAIProvider();

    const prompt = `You are a Pattern Attractor Fit Scorer.
Your job is to evaluate how well a candidate Pattern Attractor fits a given user query and context tensor.

Inputs:
- Query: "${query}"
- Context Tensor (7-axis):
  - User State: "${tensor.user_state}"
  - Risk State: "${tensor.risk_state}"
  - Intent State: "${tensor.intent_state}"
  - Evidence State: "${tensor.evidence_state}"
  - Time State: "${tensor.time_state}"
  - Channel State: "${tensor.channel_state}"
- Available Evidence Anchors: ${JSON.stringify(availableEvidence)}

Candidate Pattern Attractor Spec:
- ID: "${attractor.id}"
- Natural Definition: "${attractor.natural_definition}"
- Trigger State (Patterns/Requirements): ${JSON.stringify(attractor.trigger_state)}
- Concept State (Required/Allowed/Forbidden): ${JSON.stringify(attractor.concept_state)}
- Evidence Anchor (Required Sources/Limit): ${JSON.stringify(attractor.evidence_anchor)}
- Action Policy: ${JSON.stringify(attractor.action_policy)}

Score the fit according to these dimensions:
1. concept_match (0 to 20): How well the required concepts match the query's concepts.
2. context_fit (0 to 15): How well the query and context tensor align with trigger_state.context_requirements.
3. intent_fit (0 to 15): How well the user intent aligns with attractor trigger_state.intent_state.
4. risk_policy_fit (0 to 15): How well the risk level in context tensor aligns with the attractor's safety policies.
5. evidence_availability (0 to 15): If required evidence sources are available or can be matched.
6. vibe_requirement_fit (0 to 20): How well the target vibe signature aligns with the context.
7. forbidden_condition_penalty (0 to 30, specified as positive integer representing deduction): Deduction if forbidden concepts (e.g. unconditional purchase permission) are detected or triggered by the query.

Calculate total_score = concept_match + context_fit + intent_fit + risk_policy_fit + evidence_availability + vibe_requirement_fit - forbidden_condition_penalty.
Clamp total_score between 0 and 100.

Determine the gate value:
- "activate": total_score >= 70
- "conditional": total_score >= 40 and < 70
- "skip": total_score < 40

Return the result matching the requested schema.`;

    const schema = {
      type: "OBJECT",
      properties: {
        attractor_id: { type: "STRING" },
        total_score: { type: "INTEGER" },
        breakdown: {
          type: "OBJECT",
          properties: {
            concept_match: { type: "INTEGER" },
            context_fit: { type: "INTEGER" },
            intent_fit: { type: "INTEGER" },
            risk_policy_fit: { type: "INTEGER" },
            evidence_availability: { type: "INTEGER" },
            vibe_requirement_fit: { type: "INTEGER" },
            forbidden_condition_penalty: { type: "INTEGER" }
          },
          required: [
            "concept_match",
            "context_fit",
            "intent_fit",
            "risk_policy_fit",
            "evidence_availability",
            "vibe_requirement_fit",
            "forbidden_condition_penalty"
          ]
        },
        gate: { type: "STRING", enum: ["activate", "conditional", "skip"] }
      },
      required: ["attractor_id", "total_score", "breakdown", "gate"]
    };

    try {
      const result = await ai.generateStructuredOutput<any>(prompt, schema, { temperature: 0.1 });
      const bd = result.breakdown || {};
      const clampedTotal = Math.max(0, Math.min(100, result.total_score || 0));
      
      // Recompute gate from clamped total_score instead of trusting LLM
      const validGates = ['activate', 'conditional', 'skip'] as const;
      let gate: 'activate' | 'conditional' | 'skip';
      if (clampedTotal >= 70) gate = 'activate';
      else if (clampedTotal >= 40) gate = 'conditional';
      else gate = 'skip';
      
      return {
        attractor_id: attractor.id,
        total_score: clampedTotal,
        breakdown: {
          concept_match: Math.max(0, Math.min(20, bd.concept_match || 0)),
          context_fit: Math.max(0, Math.min(15, bd.context_fit || 0)),
          intent_fit: Math.max(0, Math.min(15, bd.intent_fit || 0)),
          risk_policy_fit: Math.max(0, Math.min(15, bd.risk_policy_fit || 0)),
          evidence_availability: Math.max(0, Math.min(15, bd.evidence_availability || 0)),
          vibe_requirement_fit: Math.max(0, Math.min(20, bd.vibe_requirement_fit || 0)),
          forbidden_condition_penalty: Math.max(0, Math.min(30, bd.forbidden_condition_penalty || 0))
        },
        gate
      };
    } catch (err) {
      console.warn(`LLM fit scoring failed for attractor ${attractor.id}, using fallback`, err);
      // Fallback
      return {
        attractor_id: attractor.id,
        total_score: 50,
        breakdown: {
          concept_match: 10,
          context_fit: 8,
          intent_fit: 8,
          risk_policy_fit: 8,
          evidence_availability: 8,
          vibe_requirement_fit: 10,
          forbidden_condition_penalty: 2
        },
        gate: 'conditional'
      };
    }
  }

  // Batch score candidates
  async batchScore(
    candidates: PatternAttractorSpec[],
    query: string,
    tensor: ContextTensor
  ): Promise<AttractorFitResult[]> {
    return Promise.all(candidates.map((c) => this.scoreAttractorFit(c, query, tensor, [])));
  }
}
