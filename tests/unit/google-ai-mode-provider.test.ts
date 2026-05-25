import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoogleAIModeProvider } from '../../lib/observatory/providers/google-ai-mode-provider';
import { EvalTraceContext } from '../../lib/observatory/providers/types';

describe('Google AI Mode Crawler Provider Evaluation (Stream 2)', () => {
  const mockTraceContext: EvalTraceContext = {
    runId: 'run-test-google',
    workspaceId: 'workspace-test-google',
    probeQuestionId: 'question-test-google',
    lane: 'official',
    mode: 'cb_strict'
  };

  beforeEach(() => {
    delete process.env.GOOGLE_AI_API_KEY;
  });

  it('should fallback to mock response with search grounding when GOOGLE_AI_API_KEY is missing', async () => {
    const provider = new GoogleAIModeProvider();
    const result = await provider.executeStrictRun(
      'Search grounding guidelines',
      'Tell me about BSW Skincare products',
      mockTraceContext
    );

    expect(result.raw.providerName).toBe('google_ai_mode');
    expect(result.normalized.status).toBe('SUCCESS');
    expect(result.normalized.answerText).toContain('PureBarrier');
    expect(result.normalized.citations).toBeDefined();
    expect(result.normalized.citations?.length).toBeGreaterThan(0);
    expect(result.normalized.serpFeatures?.hasAiOverview).toBe(true);
  });
});
