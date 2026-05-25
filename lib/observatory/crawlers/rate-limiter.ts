/**
 * Rate Limiter & Exponential Backoff Retry Utility
 */

export class RateLimiter {
  private lastRequestTime = 0;
  private minIntervalMs: number;

  constructor(requestsPerSecond = 5) {
    this.minIntervalMs = 1000 / requestsPerSecond;
  }

  /**
   * Enforces a minimum interval between requests to prevent API rate limits.
   */
  public async wait(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    const remaining = this.minIntervalMs - elapsed;

    if (remaining > 0) {
      await new Promise(resolve => setTimeout(resolve, remaining));
    }
    this.lastRequestTime = Date.now();
  }

  /**
   * Runs an operation with automatic retry using exponential backoff.
   */
  public async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    initialDelayMs = 500
  ): Promise<T> {
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        await this.wait();
        return await operation();
      } catch (err) {
        attempt++;
        if (attempt > maxRetries) {
          throw err;
        }
        const delay = initialDelayMs * Math.pow(2, attempt - 1);
        console.warn(`Operation failed, retrying attempt ${attempt}/${maxRetries} after ${delay}ms delay...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error('Unreachable: operation retry failed without throwing.');
  }
}
