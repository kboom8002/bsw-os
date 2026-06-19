import { TargetQuestionCandidate, DeepDiveDiagnostic } from './types';
import { LlmAnalyst } from './llm-analyst';

export class ImpactSimulator {
  /**
   * Simulate impact of ranking for target questions
   */
  static async simulate(
    targets: TargetQuestionCandidate[],
    currentDiagnostic: DeepDiveDiagnostic,
    brandName: string
  ) {
    // 1. Calculate projected BDR delta
    const sumDelta = targets.slice(0, 3).reduce((acc, t) => acc + t.estimated_bdr_delta, 0);
    const newBdr = (currentDiagnostic.benchmarkSnapshot.bdr || 0) + sumDelta;
    
    // 2. Format Scenarios
    const scenarios = targets.slice(0, 3).map(t => ({
      name: `Q: ${t.question_text.slice(0, 20)}...`,
      predicted_bdr: (currentDiagnostic.benchmarkSnapshot.bdr || 0) + t.estimated_bdr_delta,
      required_effort: t.composite_priority > 80 ? 'Low' : 'Medium'
    }));

    const projected = {
      bdr: Math.min(newBdr, 100),
      cwr: Math.min((currentDiagnostic.benchmarkSnapshot.cwr || 0) + (sumDelta * 0.5), 100)
    };

    // 3. Generate Executive Summary via LLM
    const executiveSummary = await LlmAnalyst.generateExecutiveSummary(
      currentDiagnostic,
      projected,
      scenarios,
      brandName
    );

    return {
      projected,
      executiveSummary,
      scenarios
    };
  }
}