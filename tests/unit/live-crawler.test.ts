import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DualCrawlerManager } from '../../lib/observatory/crawlers/crawler-manager';
import { CostTracker } from '../../lib/observatory/crawlers/cost-tracker';
import { RateLimiter } from '../../lib/observatory/crawlers/rate-limiter';

describe('Live AI Search Crawler Stabilization Test Suite (Phase 1C)', () => {
  const workspaceId = '00000000-0000-4000-a000-000000000001';
  const questionId = '33333333-3333-4333-a333-333333333333';

  beforeEach(async () => {
    vi.clearAllMocks();
    delete process.env.OPENAI_API_KEY;
    delete process.env.GOOGLE_AI_API_KEY;
    const tracker = new CostTracker();
    await tracker.resetCostTracker();
  });

  afterEach(async () => {
    const tracker = new CostTracker();
    await tracker.resetCostTracker();
  });

  it('should successfully run dual crawler observation (ChatGPT + Google)', async () => {
    const manager = new DualCrawlerManager();

    const result = await manager.executeDualObservation(
      workspaceId,
      questionId,
      'System prompt pack',
      'What are the key ingredients of PureBarrier recovery cream?'
    );

    expect(result.chatgpt).toBeDefined();
    expect(result.chatgpt.normalized.status).toBe('SUCCESS');
    expect(result.google).toBeDefined();
    expect(result.google.normalized.status).toBe('SUCCESS');
    expect(result.cumulativeCostUsd).toBeGreaterThan(0);
  });

  it('should enforce daily budget cost cap and block observations when exceeded', async () => {
    const tracker = new CostTracker();
    tracker.setDailyLimit(0.01); // Set a very low limit of $0.01 USD

    // First track a $0.05 cost, exceeding the $0.01 limit
    await tracker.trackCost(0.05);

    const manager = new DualCrawlerManager();
    // Inject our low-limit cost tracker into the manager
    (manager as any).costTracker = tracker;

    await expect(
      manager.executeDualObservation(
        workspaceId,
        questionId,
        'System prompt pack',
        'Will this trigger budget protection?'
      )
    ).rejects.toThrow('BudgetLimitExceeded');
  });

  it('should verify rate limiter retries failed requests with backoff and succeeds', async () => {
    const limiter = new RateLimiter(10); // High request limit for fast test execution
    let attempts = 0;

    const mockOperation = async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Temporary API Rate Limit Error');
      }
      return 'SuccessResponse';
    };

    const result = await limiter.withRetry(mockOperation, 3, 10);

    expect(result).toBe('SuccessResponse');
    expect(attempts).toBe(3);
  });
});
