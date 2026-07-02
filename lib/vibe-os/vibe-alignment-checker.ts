import { VibeSignature, VibeAssessmentResult } from '../pattern-attractor/types';

export class VibeAlignmentChecker {
  // Checks target signature against actual vibe assessment
  async checkAlignment(
    targetSignature: VibeSignature,
    actualAssessment: VibeAssessmentResult
  ): Promise<{
    alignment_score: number;
    misaligned_layers: string[];
    avoid_vibe_violations: string[];
    recommendations: string[];
  }> {
    const misaligned_layers: string[] = [];
    const recommendations: string[] = [];

    // Extract any violations
    const avoid_vibe_violations = actualAssessment.avoid_vibe_violations || [];

    // Group misaligned dimensions by layer
    const misaligned_dims = actualAssessment.misaligned_dimensions || [];
    misaligned_dims.forEach((dim) => {
      const scoreObj = actualAssessment.layer_scores.find((s) => s.dimension === dim);
      if (scoreObj && !misaligned_layers.includes(scoreObj.layer)) {
        misaligned_layers.push(scoreObj.layer);
      }
      recommendations.push(
        `[${dim}] dimension drifts. Observed evidence: "${scoreObj?.observed_evidence || 'N/A'}"`
      );
    });

    if (avoid_vibe_violations.length > 0) {
      recommendations.push(`CRITICAL VIBE DRIFT: avoid_vibe violations found: ${avoid_vibe_violations.join(', ')}`);
    }

    // Alignment penalty for each violation/mismatch
    let score = actualAssessment.overall_alignment;
    if (avoid_vibe_violations.length > 0) {
      score = Math.max(0, score - 0.2 * avoid_vibe_violations.length);
    }

    return {
      alignment_score: parseFloat(score.toFixed(2)),
      misaligned_layers,
      avoid_vibe_violations,
      recommendations
    };
  }
}
