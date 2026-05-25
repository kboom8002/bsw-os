import { ChatGPTSearchProvider } from '../providers/chatgpt-search-provider';
import { GoogleAIModeProvider } from '../providers/google-ai-mode-provider';
import { CostTracker } from './cost-tracker';
import { RateLimiter } from './rate-limiter';
import { EvalTraceContext, RawProviderOutput, NormalizedRunnerOutput } from '../providers/types';

export interface DualObservationResult {
  chatgpt: { raw: RawProviderOutput; normalized: NormalizedRunnerOutput };
  google: { raw: RawProviderOutput; normalized: NormalizedRunnerOutput };
  cumulativeCostUsd: number;
}

export class DualCrawlerManager {
  private chatgptProvider: ChatGPTSearchProvider;
  private googleProvider: GoogleAIModeProvider;
  private costTracker: CostTracker;
  private rateLimiter: RateLimiter;

  constructor() {
    this.chatgptProvider = new ChatGPTSearchProvider();
    this.googleProvider = new GoogleAIModeProvider();
    this.costTracker = new CostTracker();
    // Default rate limit of 3 requests per second to avoid rate limits
    this.rateLimiter = new RateLimiter(3);
  }

  /**
   * Estimates cost of an API execution based on token usage.
   * Model costs:
   *  - Prompt: $0.005 / 1k tokens
   *  - Completion: $0.015 / 1k tokens
   */
  private calculateExecutionCost(rawOutput: RawProviderOutput): number {
    const promptCost = (rawOutput.tokenUsage.prompt / 1000) * 0.005;
    const completionCost = (rawOutput.tokenUsage.completion / 1000) * 0.015;
    return parseFloat((promptCost + completionCost).toFixed(6));
  }

  /**
   * Executes dual-crawling observations (ChatGPT Search + Google AI Search Grounding)
   * under strict rate limiting and cost budget constraints.
   */
  public async executeDualObservation(
    workspaceId: string,
    probeQuestionId: string,
    promptPack: string,
    questionText: string,
    lane: 'official' | 'manual_calibration' = 'official'
  ): Promise<DualObservationResult> {
    // 1. Budget Protection Gate
    const isOverBudget = await this.costTracker.isBudgetExceeded();
    if (isOverBudget) {
      throw new Error(`BudgetLimitExceeded: Daily crawler cost limit reached. Observation blocked.`);
    }

    const traceContext: EvalTraceContext = {
      runId: `run-${Date.now()}`,
      workspaceId,
      probeQuestionId,
      lane,
      mode: 'cb_strict'
    };

    // 2. Parallel Dual Observation with Robust Retry
    const [chatgptRes, googleRes] = await Promise.all([
      this.rateLimiter.withRetry(
        () => this.chatgptProvider.executeStrictRun(promptPack, questionText, traceContext),
        3, // max retries
        500 // initial delay
      ),
      this.rateLimiter.withRetry(
        () => this.googleProvider.executeStrictRun(promptPack, questionText, traceContext),
        3,
        500
      )
    ]);

    // 3. Cost Accounting
    const gptCost = this.calculateExecutionCost(chatgptRes.raw);
    const googleCost = this.calculateExecutionCost(googleRes.raw);
    const totalCost = parseFloat((gptCost + googleCost).toFixed(6));

    const cumulative = await this.costTracker.trackCost(totalCost);

    return {
      chatgpt: chatgptRes,
      google: googleRes,
      cumulativeCostUsd: cumulative
    };
  }
}
