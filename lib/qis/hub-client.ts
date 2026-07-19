/**
 * lib/qis/hub-client.ts
 *
 * QIS Hub Client — AIHompyHub API 연동 구현체
 */
import type { QuestionAsset } from '../benchmark/benchmark-asset-extractor';

// ── AiHompyHub integration interfaces ──────────────────────────

export interface BSWQuestion {
  id: string;
  text: string;
  industry_type: string;
  tco_entities?: Record<string, string>;
  at_context?: Record<string, string>;
  search_volume_trend?: string;
  source: string;
  // Extended fields
  cps_score?: number;
  primary_intent?: string;
  risk_level?: string;
  brand_slug?: string;
  competitors_count?: number;
  qis_scene_name?: string;
}

export interface BSWScene {
  id: string;
  scene_name: string;
  risk_level: string;
  readiness_score: number;
  must_do: string[];
  must_not_do: string[];
  domain_key: string;
}

export interface AiHubPushResult {
  ok: boolean;
  ingested: number;
  arenaCreated: number;
  errors: string[];
}

export interface HubFeedbackPayload {
  version: string;
  region: string;
  hub_domain_id: string;
  date: string;
  search_patterns: any[];
  top_cqs: any[];
  arena_top_answers: any[];
  diagnosis_summary?: any;
}

export class QisHubClient {
  private readonly hubUrl: string;
  private readonly apiKey: string;

  constructor() {
    this.hubUrl = process.env.HUB_API_URL || process.env.AIHOMPY_HUB_URL || '';
    this.apiKey = process.env.HUB_API_KEY || process.env.AIHOMPY_HUB_API_KEY || '';
  }

  // ── Existing methods ─────────────────────────────────────────

  /**
   * 예측된 질문을 3축 인프라에 전송합니다.
   * @returns true if push succeeded, false if failed (no longer swallows errors)
   */
  async pushPredictedQuestions(
    questions: any[],
    opts?: { axis?: string; retryCount?: number; maxRetries?: number }
  ): Promise<boolean> {
    if (!this.hubUrl) {
      console.warn('[QisHubClient] Hub URL not configured — pushPredictedQuestions skipped');
      return false;
    }
    
    const maxRetries = opts?.maxRetries ?? 2;
    const currentRetry = opts?.retryCount ?? 0;

    try {
      const response = await fetch(`${this.hubUrl}/api/v1/qis/predictions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          axis: opts?.axis || 'industry',
          questions,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Hub API responded with status ${response.status}`);
      }

      console.log(`[QisHubClient] Successfully pushed ${questions.length} questions to Hub (axis: ${opts?.axis || 'industry'})`);
      return true;
    } catch (e: any) {
      console.error(`[QisHubClient] Push failed (attempt ${currentRetry + 1}/${maxRetries + 1}): ${e.message}`);

      // Retry with exponential backoff if retries remaining
      if (currentRetry < maxRetries) {
        const delayMs = Math.min(1000 * Math.pow(2, currentRetry), 8000);
        console.log(`[QisHubClient] Retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return this.pushPredictedQuestions(questions, {
          ...opts,
          retryCount: currentRetry + 1,
          maxRetries
        });
      }

      // All retries exhausted — propagate failure honestly
      console.error(`[QisHubClient] pushPredictedQuestions permanently failed after ${maxRetries + 1} attempts for ${questions.length} questions`);
      return false;
    }
  }

  /**
   * 실측 결과로 얻은 4종 질문 자산을 Hub에 전송합니다 (Phase 4).
   */
  async pushQuestionAssets(
    assets: QuestionAsset[],
    targetAxis: 'industry' | 'place' | 'vortex'
  ): Promise<{ pushed: number; errors: string[] }> {
    if (!this.hubUrl) {
      console.warn('[QisHubClient] Hub URL not configured — pushQuestionAssets skipped');
      return { pushed: 0, errors: ['Hub URL not configured'] };
    }

    try {
      const response = await fetch(`${this.hubUrl}/api/v1/qis/assets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          axis: targetAxis,
          assets,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Hub API responded with status ${response.status}`);
      }

      console.log(`[QisHubClient] Successfully pushed ${assets.length} assets to Hub (axis: ${targetAxis})`);
      return { pushed: assets.length, errors: [] };
    } catch (e: any) {
      console.warn(`[QisHubClient] Push assets failed: ${e.message}`);
      return { pushed: 0, errors: [e.message] };
    }
  }

  async pullMetrics(industry: string): Promise<number> {
    if (!this.hubUrl) {
      if (process.env.NODE_ENV === 'production') {
        console.error('[QisHubClient] PRODUCTION WARNING: Hub URL not configured — pullMetrics returning fallback. Set HUB_URL env variable.');
      } else {
        console.warn('[QisHubClient] Hub URL not configured — pullMetrics skipped');
      }
      return 10;
    }
    try {
      const response = await fetch(`${this.hubUrl}/api/v1/qis/metrics?industry=${encodeURIComponent(industry)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      if (response.ok) {
        const json = await response.json();
        const val = json.metrics ?? json.count ?? json.metricsCount;
        if (typeof val === 'number') return val;
        if (typeof json === 'number') return json;
      }
      throw new Error(`Status ${response.status}`);
    } catch (e: any) {
      console.warn(`[QisHubClient] Pull metrics failed: ${e.message}. Falling back to default.`);
      return 10;
    }
  }

  async pullExpectedLayers(industry: string): Promise<number> {
    if (!this.hubUrl) {
      if (process.env.NODE_ENV === 'production') {
        console.error('[QisHubClient] PRODUCTION WARNING: Hub URL not configured — pullExpectedLayers returning fallback. Set HUB_URL env variable.');
      } else {
        console.warn('[QisHubClient] Hub URL not configured — pullExpectedLayers skipped');
      }
      return 5;
    }
    try {
      const response = await fetch(`${this.hubUrl}/api/v1/qis/layers?industry=${encodeURIComponent(industry)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      if (response.ok) {
        const json = await response.json();
        const val = json.layers ?? json.count ?? json.layersCount;
        if (typeof val === 'number') return val;
        if (typeof json === 'number') return json;
      }
      throw new Error(`Status ${response.status}`);
    } catch (e: any) {
      console.warn(`[QisHubClient] Pull layers failed: ${e.message}. Falling back to default.`);
      return 5;
    }
  }

  /**
   * Hub에서 등록된 사용자 수요 질문 시그널을 가져옵니다.
   */
  async pullSignals(industry: string): Promise<any[]> {
    if (!this.hubUrl) {
      console.warn('[QisHubClient] Hub URL not configured — pullSignals skipped (using mock signals)');
      return this.getMockDemandSignals(industry);
    }

    try {
      const response = await fetch(`${this.hubUrl}/api/v1/qis/signals?industry=${encodeURIComponent(industry)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (response.ok) {
        const json = await response.json();
        return json.signals || [];
      }
      throw new Error(`Status ${response.status}`);
    } catch (e: any) {
      console.warn(`[QisHubClient] Pull signals failed: ${e.message} — using mock fallback`);
      return this.getMockDemandSignals(industry);
    }
  }

  // ── AiHompyHub integration methods ───────────────────────────

  /**
   * CQ + QIS Scene을 AiHompyHub의 인제스트 API로 전송합니다.
   * Endpoint: POST /api/v1/ai-hub/bsw/ingest
   * Auth: x-bsw-secret header
   */
  async pushToAiHub(
    region: string,
    questions: BSWQuestion[],
    scenes?: BSWScene[]
  ): Promise<AiHubPushResult> {
    if (!this.hubUrl) {
      console.warn('[QisHubClient] Hub URL not configured — pushToAiHub skipped');
      return { ok: false, ingested: 0, arenaCreated: 0, errors: ['Hub URL not configured'] };
    }

    try {
      const secret = process.env.BSW_HUB_INGEST_SECRET || this.apiKey;

      const response = await fetch(`${this.hubUrl}/api/v1/ai-hub/bsw/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-bsw-secret': secret,
        },
        body: JSON.stringify({
          region,
          questions,
          scenes,
          version: '2.0',
          source: 'bsw_pipeline_v3',
          pushed_at: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Hub API responded with status ${response.status}: ${errorText}`);
      }

      const json = await response.json();

      const result: AiHubPushResult = {
        ok: true,
        ingested: json.ingested ?? questions.length,
        arenaCreated: json.arenaCreated ?? 0,
        errors: json.errors ?? [],
      };

      console.log(
        `[QisHubClient] pushToAiHub success — region=${region}, ingested=${result.ingested}, arenaCreated=${result.arenaCreated}`
      );

      return result;
    } catch (e: any) {
      console.error(`[QisHubClient] pushToAiHub failed: ${e.message}`);
      return { ok: false, ingested: 0, arenaCreated: 0, errors: [e.message] };
    }
  }

  /**
   * AiHompyHub에서 현재 인제스트 상태를 조회합니다.
   * Endpoint: GET /api/v1/ai-hub/bsw/ingest?region={region}
   */
  async getIngestStatus(
    region: string
  ): Promise<{ totalQuestions: number; bswSourced: number; lastIngestedAt: string | null } | null> {
    if (!this.hubUrl) {
      console.warn('[QisHubClient] Hub URL not configured — getIngestStatus skipped');
      return null;
    }

    try {
      const secret = process.env.BSW_HUB_INGEST_SECRET || this.apiKey;

      const response = await fetch(
        `${this.hubUrl}/api/v1/ai-hub/bsw/ingest?region=${encodeURIComponent(region)}`,
        {
          method: 'GET',
          headers: {
            'x-bsw-secret': secret,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Hub API responded with status ${response.status}`);
      }

      const json = await response.json();

      return {
        totalQuestions: json.totalQuestions ?? 0,
        bswSourced: json.bswSourced ?? 0,
        lastIngestedAt: json.lastIngestedAt ?? null,
      };
    } catch (e: any) {
      console.warn(`[QisHubClient] getIngestStatus failed: ${e.message}`);
      return null;
    }
  }

  /**
   * AI Hub로부터 역방향 피드백을 수집합니다 (Pull).
   * GET /api/v1/ai-hub/bsw/feedback?region={region}&since={date}
   */
  async pullFeedback(
    region: string,
    since?: string
  ): Promise<HubFeedbackPayload | null> {
    if (!this.hubUrl) {
      console.warn('[QisHubClient] Hub URL not configured — pullFeedback skipped');
      return null;
    }

    try {
      const secret = process.env.BSW_HUB_INGEST_SECRET || this.apiKey;
      const url = new URL(`${this.hubUrl}/api/v1/ai-hub/bsw/feedback`);
      url.searchParams.set('region', region);
      if (since) {
        url.searchParams.set('since', since);
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'x-bsw-secret': secret,
        },
      });

      if (!response.ok) {
        throw new Error(`Hub API responded with status ${response.status}`);
      }

      const json = await response.json();
      return json.data || json;
    } catch (e: any) {
      console.warn(`[QisHubClient] pullFeedback failed: ${e.message} — returning mock feedback for demo`);
      // 데모의 안정적 수행을 위해 로컬 mock 피드백 반환
      return this.getMockFeedback(region);
    }
  }

  /**
   * 로컬 대체용 모의 피드백 생성
   */
  private getMockFeedback(region: string): HubFeedbackPayload {
    return {
      version: '1.0',
      region,
      hub_domain_id: 'mock-hub-domain-uuid',
      date: new Date().toISOString().split('T')[0],
      search_patterns: [
        {
          query: '제주 해녀의부엌 예약 방법',
          tco: { context: '예약', objective: '해녀의부엌' },
          at_ctx: {},
          matched_count: 3,
          resolved: false
        },
        {
          query: '비 오는 날 제주 카페 주차',
          tco: { context: '비 오는 날', objective: '카페' },
          at_ctx: { weather: '비' },
          matched_count: 2,
          resolved: false
        }
      ],
      top_cqs: [
        {
          bsw_question_id: 'cq-001', // mock or valid id
          question_text: '제주 카페 주차 넓은 곳 추천',
          view_count_24h: 35,
          arena_thread_reply_count: 2
        }
      ],
      arena_top_answers: [
        {
          thread_title: '제주 카페 주차 넓은 곳 추천',
          best_layer: 'merchant_official',
          elo_score: 1200,
          helpful_ratio: 0.95
        }
      ],
      diagnosis_summary: {
        avg_readiness: 65,
        merchants_diagnosed: 12,
        top_deficit_axis: 'proofVisibility'
      }
    };
  }

  // ── Static mapping helpers ───────────────────────────────────

  /**
   * CQ 배열을 BSWQuestion 형식으로 매핑합니다.
   */
  static mapCQsToBSWQuestions(
    cqs: Array<{
      id: string;
      normalized_question: string;
      primary_intent?: string;
      risk_level?: string;
      cps_score?: number;
      metadata?: any;
    }>,
    domainKey: string,
    brandSlug?: string
  ): BSWQuestion[] {
    return cqs.map((cq) => ({
      id: cq.id,
      text: cq.normalized_question,
      industry_type: domainKey,
      primary_intent: cq.primary_intent,
      risk_level: cq.risk_level,
      cps_score: cq.cps_score,
      tco_entities: cq.metadata?.tco_entities,
      at_context: cq.metadata?.at_context,
      search_volume_trend: cq.metadata?.search_volume_trend,
      brand_slug: brandSlug,
      source: 'bsw_auto',
    }));
  }

  /**
   * QIS Scene 배열을 BSWScene 형식으로 매핑합니다.
   */
  static mapQISScenesToBSWScenes(
    scenes: Array<{
      id: string;
      scene_name: string;
      risk_level: string;
      readiness_score: number;
      must_do?: string[];
      must_not_do?: string[];
    }>,
    domainKey: string
  ): BSWScene[] {
    return scenes.map((scene) => ({
      id: scene.id,
      scene_name: scene.scene_name,
      risk_level: scene.risk_level,
      readiness_score: scene.readiness_score,
      must_do: scene.must_do || [],
      must_not_do: scene.must_not_do || [],
      domain_key: domainKey,
    }));
  }

  // ── Private helpers ──────────────────────────────────────────

  /**
   * 로컬 대체용 데모 수요 시그널 생성 (네트워크 실패시 복원용)
   */
  private getMockDemandSignals(industry: string): any[] {
    if (industry.includes('wedding')) {
      return [
        { query: '청담동 한옥 컨셉 웨딩 스튜디오 추천해줘', weight: 2.5, urgency: 'high' },
        { query: '이포토에세이 가성비 웨딩 패키지 가격대', weight: 1.8, urgency: 'medium' }
      ];
    }
    if (industry.includes('beauty') || industry.includes('skincare')) {
      return [
        { query: '민감성 피부용 에스트라 아토베리어 크림 후기', weight: 3.0, urgency: 'high' },
        { query: '닥터지 레드 블레미쉬 시카 수딩 크림 성분', weight: 2.2, urgency: 'medium' }
      ];
    }
    return [
      { query: '제주 흑돼지 맛집 돈사돈 예약 방법', weight: 2.8, urgency: 'high' },
      { query: '제주 해녀의부엌 주차 가능 여부', weight: 1.5, urgency: 'low' }
    ];
  }
}
