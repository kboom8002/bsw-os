/**
 * lib/qis/hub-client.ts
 *
 * QIS Hub Client — AIHompyHub API 연동 스텁.
 * 향후 실제 API 연동 시 이 파일의 구현체만 교체하면 됩니다.
 */
export class QisHubClient {
  private readonly hubUrl: string;
  private readonly apiKey: string;

  constructor() {
    this.hubUrl = process.env.AIHOMPY_HUB_URL || '';
    this.apiKey = process.env.AIHOMPY_HUB_API_KEY || '';
  }

  async pushPredictedQuestions(questions: any[], opts?: { axis?: string }): Promise<boolean> {
    if (!this.hubUrl) {
      console.warn('[QisHubClient] Hub URL not configured — push skipped');
      return false;
    }
    console.log(`[QisHubClient] Would push ${questions.length} questions (axis: ${opts?.axis || 'industry'})`);
    return true; // Return true to indicate successful stub execution
  }

  async pullMetrics(industry: string): Promise<number> {
    if (!this.hubUrl) {
      console.warn('[QisHubClient] Hub URL not configured — pullMetrics skipped');
      return 0;
    }
    console.warn('[QisHubClient] Pull metrics stub');
    return 10; // Return mock count
  }

  async pullExpectedLayers(industry: string): Promise<number> {
    if (!this.hubUrl) {
      console.warn('[QisHubClient] Hub URL not configured — pullExpectedLayers skipped');
      return 0;
    }
    console.warn('[QisHubClient] Pull layers stub');
    return 5; // Return mock count
  }

  async pullSignals(industry: string): Promise<any[]> {
    if (!this.hubUrl) {
      console.warn('[QisHubClient] Hub URL not configured — pullSignals skipped');
      return [];
    }
    console.warn('[QisHubClient] Pull signals stub');
    return [];
  }
}
