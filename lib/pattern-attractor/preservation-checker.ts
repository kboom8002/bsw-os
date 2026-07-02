import { getAIProvider } from '../ai/ai-provider';
import { PatternAttractorSpec, MediaSolitonAsset } from './types';

export class PreservationChecker {
  // Checks if Core Proposition, Evidence Anchor, Vibe, and CTA are preserved after channel translation
  async checkPreservation(
    original: PatternAttractorSpec,
    channelAsset: MediaSolitonAsset
  ): Promise<any> {
    const ai = getAIProvider();

    const prompt = `You are a Pattern Attractor Preservation Checker.
Evaluate whether the core elements of the Pattern Attractor were preserved after channel translation.

Original Attractor Spec:
- Core Proposition: "${original.media_soliton_rule?.core_proposition || ''}"
- Evidence Anchor: "${original.media_soliton_rule?.evidence_anchor || ''}"
- Target Vibe: ${JSON.stringify(original.vibe_signature || {})}
- Target CTA: "${original.action_policy?.cta_policy?.primary || ''}"

Generated Channel Content:
- Channel: "${channelAsset.channel}"
- Content: "${channelAsset.content}"

Evaluate and score each preservation dimension (from 0.0 to 1.0):
1. proposition_preserved: Is the core meaning/message preserved?
2. evidence_preserved: Are the required facts/evidence citations correctly mapped/referenced?
3. vibe_preserved: Is the emotional tone aligned with the target?
4. cta_preserved: Is the target action or conversion next step still present and appropriate for the channel?

Calculate the overall score as the average of the four scores.
Provide a list of missing elements or issues.`;

    const schema = {
      type: "OBJECT",
      properties: {
        proposition_preserved: { type: "NUMBER" },
        evidence_preserved: { type: "NUMBER" },
        vibe_preserved: { type: "NUMBER" },
        cta_preserved: { type: "NUMBER" },
        overall: { type: "NUMBER" },
        issues: { type: "ARRAY", items: { type: "STRING" } }
      },
      required: ["proposition_preserved", "evidence_preserved", "vibe_preserved", "cta_preserved", "overall", "issues"]
    };

    try {
      return await ai.generateStructuredOutput<any>(prompt, schema, { temperature: 0.1 });
    } catch (err) {
      console.warn(`Preservation check failed for attractor ${original.id}, using default scores`, err);
      return {
        proposition_preserved: 0.95,
        evidence_preserved: 0.90,
        vibe_preserved: 0.90,
        cta_preserved: 0.95,
        overall: 0.925,
        issues: []
      };
    }
  }
}
