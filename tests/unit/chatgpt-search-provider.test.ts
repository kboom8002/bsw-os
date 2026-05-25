import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatGPTSearchProvider } from '../../lib/observatory/providers/chatgpt-search-provider';
import { EvalTraceContext } from '../../lib/observatory/providers/types';

describe('ChatGPT Search Crawler Provider Evaluation (Stream 2)', () => {
  const mockTraceContext: EvalTraceContext = {
    runId: 'run-test-chatgpt',
    workspaceId: 'workspace-test-chatgpt',
    probeQuestionId: 'question-test-chatgpt',
    lane: 'official',
    mode: 'cb_strict'
  };

  beforeEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  it('should fallback to mock response with citations when OPENAI_API_KEY is missing', async () => {
    const provider = new ChatGPTSearchProvider();
    const result = await provider.executeStrictRun(
      'Search judge guidelines',
      'What is PureBarrier cream?',
      mockTraceContext
    );

    expect(result.raw.providerName).toBe('chatgpt_search');
    expect(result.normalized.status).toBe('SUCCESS');
    expect(result.normalized.answerText).toContain('PureBarrier');
    expect(result.normalized.citations).toBeDefined();
    expect(result.normalized.citations?.length).toBeGreaterThan(0);
    expect(result.normalized.serpFeatures?.hasAiOverview).toBe(false);
  });
});
