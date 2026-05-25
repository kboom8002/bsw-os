import * as fs from 'fs';
import * as path from 'path';

export interface DailyCostRecord {
  date: string;
  accumulatedCostUsd: number;
}

export class CostTracker {
  private trackerFilePath: string;
  private dailyLimitUsd = 50.00; // Default daily budget cap: $50 USD

  constructor() {
    // Keep temporary tracking file inside workspace directory to be resilient
    this.trackerFilePath = path.join(process.cwd(), 'scratch', 'crawler-cost-tracker.json');
  }

  /**
   * Reads the current daily cost.
   */
  public async getDailyCost(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];

    try {
      if (!fs.existsSync(this.trackerFilePath)) {
        return 0;
      }

      const raw = fs.readFileSync(this.trackerFilePath, 'utf-8');
      const data: DailyCostRecord = JSON.parse(raw);

      if (data.date === today) {
        return data.accumulatedCostUsd;
      }
    } catch (err) {
      console.warn('Cost tracker read error, resetting cost:', err);
    }

    return 0;
  }

  /**
   * Tracks an API call cost.
   */
  public async trackCost(costUsd: number): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const current = await this.getDailyCost();
    const updated = parseFloat((current + costUsd).toFixed(6));

    try {
      const dirPath = path.dirname(this.trackerFilePath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      const record: DailyCostRecord = {
        date: today,
        accumulatedCostUsd: updated
      };

      fs.writeFileSync(this.trackerFilePath, JSON.stringify(record, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save tracked cost:', err);
    }

    return updated;
  }

  /**
   * Checks if daily cost budget has been exceeded.
   */
  public async isBudgetExceeded(): Promise<boolean> {
    const current = await this.getDailyCost();
    return current >= this.dailyLimitUsd;
  }

  /**
   * Resets the budget for test cleanup.
   */
  public async resetCostTracker(): Promise<void> {
    if (fs.existsSync(this.trackerFilePath)) {
      try {
        fs.unlinkSync(this.trackerFilePath);
      } catch (err) {}
    }
  }

  /**
   * Sets custom daily limit.
   */
  public setDailyLimit(limit: number): void {
    this.dailyLimitUsd = limit;
  }
}
