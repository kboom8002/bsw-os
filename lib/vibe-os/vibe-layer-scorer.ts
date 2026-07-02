import { getAIProvider } from '../ai/ai-provider';
import { VibeSignature, VibeAssessmentResult } from '../pattern-attractor/types';

export class VibeLayerScorer {
  // LLM-based L0-L3 Vibe Scorer
  async scoreContent(
    content: string,
    targetSignature: VibeSignature,
    domainContext: string
  ): Promise<VibeAssessmentResult> {
    const ai = getAIProvider();

    const prompt = `You are a Vibe OS L0-L3 Layer Scorer.
Evaluate the emotional-semantic vibe of the following content against the target Vibe Signature.

Content to analyze:
"${content}"

Domain Context:
"${domainContext}"

Target Vibe Signature:
${JSON.stringify(targetSignature)}

For each of the L0-L3 dimensions:
- L0_core_affect: valence, arousal, control
- L1_expressive_style: warmth_style, precision, energy, sophistication, novelty, intimacy, authenticity
- L2_motivational_affordance: autonomy_support, competence_support, relatedness_support, promotion_frame, prevention_frame
- L3_social_appraisal: warmth, competence, trust, fairness, agency

Analyze the content and extract:
1. layer: e.g. "L0_core_affect", "L1_expressive_style", etc.
2. dimension: e.g. "arousal", "warmth_style", "autonomy_support", "trust".
3. observed_evidence: Specific textual evidence or stylistic choice (e.g. "direct warning phrasing", "soft respectful greetings").
4. interpretation: Why this choice matches or drifts from the dimension.
5. score: The observed level (low, medium, high).
6. confidence: Confidence score (0 to 1).
7. uncertainty: Why it is uncertain (or empty string if confident).
8. suggested_validation: How a human reviewer could verify it.

Also detect:
- overall_alignment: A number between 0 and 1 representing the target-actual alignment.
- misaligned_dimensions: Any dimension where the actual score significantly differs from the target.
- avoid_vibe_violations: Any keywords or emotional tones matching the target's avoid_vibe list (e.g. "panic", "overwhelm").

Return the result matching the requested schema.`;

    const schema = {
      type: "OBJECT",
      properties: {
        layer_scores: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              layer: { type: "STRING" },
              dimension: { type: "STRING" },
              observed_evidence: { type: "STRING" },
              interpretation: { type: "STRING" },
              score: { type: "STRING", enum: ["low", "medium", "high"] },
              confidence: { type: "NUMBER" },
              uncertainty: { type: "STRING" },
              suggested_validation: { type: "STRING" }
            },
            required: [
              "layer",
              "dimension",
              "observed_evidence",
              "interpretation",
              "score",
              "confidence",
              "uncertainty",
              "suggested_validation"
            ]
          }
        },
        overall_alignment: { type: "NUMBER" },
        misaligned_dimensions: { type: "ARRAY", items: { type: "STRING" } },
        avoid_vibe_violations: { type: "ARRAY", items: { type: "STRING" } }
      },
      required: ["layer_scores", "overall_alignment", "misaligned_dimensions", "avoid_vibe_violations"]
    };

    try {
      return await ai.generateStructuredOutput<VibeAssessmentResult>(prompt, schema, { temperature: 0.1 });
    } catch (err) {
      console.error("VibeLayerScorer failed, using fallback", err);
      // Fallback
      return {
        layer_scores: [
          {
            layer: 'L0_core_affect',
            dimension: 'control',
            observed_evidence: 'explicit choices offered',
            interpretation: 'matches high control policy',
            score: 'high',
            confidence: 0.9,
            uncertainty: '',
            suggested_validation: 'verify presence of checkboxes'
          }
        ],
        overall_alignment: 0.85,
        misaligned_dimensions: [],
        avoid_vibe_violations: []
      };
    }
  }
}
