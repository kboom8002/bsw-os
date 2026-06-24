import { env } from '../env';
import { getSupabaseAdminClient } from '../supabase';
import { 
  QisPredictedQuestion, 
  QisRealMetricsBatch, 
  QisExpectedLayerBatch 
} from '../qis-shared-schemas';

export class QisHubClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor() {
    this.baseUrl = env.HUB_API_URL;
    this.apiKey = env.HUB_API_KEY || '';
  }

  private get headers() {
    return {
      'Content-Type': 'application/json',
      'X-QIS-Api-Key': this.apiKey,
    };
  }

  /**
   * BSW에서 생성된 예측 질문들을 Hub에 Push (전달)합니다.
   */
  async pushPredictedQuestions(questions: QisPredictedQuestion[]): Promise<boolean> {
    if (questions.length === 0) return true;

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/qis/questions`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ questions })
      });

      if (!response.ok) {
        const text = await response.text();
        console.error(`[QIS HubClient] Failed to push questions. Status: ${response.status}, Body: ${text}`);
        return false;
      }

      return true;
    } catch (error) {
      console.error(`[QIS HubClient] Exception while pushing questions:`, error);
      return false;
    }
  }

  /**
   * Hub로부터 실측 메트릭을 Pull (수집)하여 DB에 저장합니다.
   */
  async pullMetrics(hubSlug?: string, since?: string): Promise<number> {
    try {
      const url = new URL(`${this.baseUrl}/api/v1/qis/metrics`);
      if (hubSlug) url.searchParams.append('hub_slug', hubSlug);
      if (since) url.searchParams.append('since', since);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`Hub metrics API failed: ${response.statusText}`);
      }

      const resData = await response.json();
      if (!resData.ok) {
         throw new Error(`Hub returned error: ${resData.error}`);
      }
      
      const { metrics } = resData.data as QisRealMetricsBatch;
      if (!metrics || metrics.length === 0) return 0;

      const supabase = getSupabaseAdminClient();
      const insertData = metrics.map(m => ({
        metric_type: m.metric_type,
        industry: m.industry,
        hub_slug: m.hub_slug || hubSlug,
        period_start: m.period_start,
        period_end: m.period_end,
        value: m.value,
        sample_size: m.sample_size,
        breakdown: m.breakdown
      }));

      const { error } = await supabase.from('bsw_received_metrics').insert(insertData);
      if (error) throw error;

      return metrics.length;
    } catch (error) {
      console.error(`[QIS HubClient] Exception while pulling metrics:`, error);
      return 0;
    }
  }

  /**
   * Hub로부터 기대층(Expected Layers) 데이터를 Pull (수집)하여 DB에 저장합니다.
   */
  async pullExpectedLayers(hubSlug?: string): Promise<number> {
    try {
      const url = new URL(`${this.baseUrl}/api/v1/qis/layers`);
      if (hubSlug) url.searchParams.append('hub_slug', hubSlug);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`Hub layers API failed: ${response.statusText}`);
      }

      const resData = await response.json();
      if (!resData.ok) {
         throw new Error(`Hub returned error: ${resData.error}`);
      }

      const { layers } = resData.data as QisExpectedLayerBatch;
      if (!layers || layers.length === 0) return 0;

      const supabase = getSupabaseAdminClient();
      const insertData = layers.map(l => ({
        question_reference: l.question_reference,
        tier: l.tier,
        content: l.content,
        source: l.source,
        confidence: l.confidence,
        sample_count: l.sample_count,
        industry: l.industry
      }));

      const { error } = await supabase.from('bsw_expected_layers').insert(insertData);
      if (error) throw error;

      return layers.length;
    } catch (error) {
      console.error(`[QIS HubClient] Exception while pulling expected layers:`, error);
      return 0;
    }
  }
}
