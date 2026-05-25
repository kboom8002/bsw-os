import { describe, it, expect } from 'vitest';
import { checkGuardrailRegression } from '../../app/actions/fixit';

describe('TDD-09: Guardrail Regression Override Safeguards', () => {
  it('should trigger regression when Brand Semantic Fidelity (BSF) drops by more than 5%', () => {
    const baselineScores = { BSF: 80.00, dark_patterns_count: 0 };
    const retestScores = { BSF: 74.00, dark_patterns_count: 0 }; // Dropped by 6.00% (> 5.00%)

    const result = checkGuardrailRegression(baselineScores, retestScores);
    expect(result.isRegressed).toBe(true);
    expect(result.details[0]).toContain('Critical BSF Regression');
  });

  it('should NOT trigger regression when BSF drop is exactly 3%', () => {
    const baselineScores = { BSF: 80.00, dark_patterns_count: 0 };
    const retestScores = { BSF: 77.00, dark_patterns_count: 0 }; // Dropped by 3.00% (< 5.00%)

    const result = checkGuardrailRegression(baselineScores, retestScores);
    expect(result.isRegressed).toBe(false);
  });

  it('should trigger regression when new scarcity/urgency dark patterns are introduced', () => {
    const baselineScores = { BSF: 80.00, dark_patterns_count: 1 };
    const retestScores = { BSF: 82.00, dark_patterns_count: 3 }; // BSF lifted, but 2 dark patterns added!

    const result = checkGuardrailRegression(baselineScores, retestScores);
    expect(result.isRegressed).toBe(true);
    expect(result.details[0]).toContain('Dark Pattern Guardrail');
  });
});
