/**
 * lib/ai/providers/gemini-grounding.ts
 *
 * Gemini Grounding Provider — Google AI Mode 프록시.
 * Gemini API google_search grounding 활용 + ProxyConfidenceBand 산출.
 *
 * ⚠️  Gemini Grounding ≠ Google AI Mode 동일 결과.
 *     동일한 Google 인덱스를 참조하지만 응답 합성 방식이 달라
 *     모든 지표에 신뢰범위(±CI)를 함께 반환합니다.
 */

import { GoogleGenAI } from '@google/genai';
import type {
  SearchProvider,
  SearchResult,
  ProviderHealth,
  Citation,
  ProxyConfidenceBand,
} from '../search-providers';

// 초기 교정 전 기본값 (시스템 구축 초기)
const DEFAULT_PROXY_CORRELATION = 0.85;
const DEFAULT_MAE = 7; // ± 오차범위 (점수 단위)
const DEFAULT_CALIBRATION_SAMPLE = 0;

export class GeminiGroundingProvider implements SearchProvider {
  readonly engineName = 'gemini_grounding';
  readonly providerType = 'hybrid' as const;

  private ai: GoogleGenAI;
  private modelName: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      console.warn('[GeminiGroundingProvider] GEMINI_API_KEY not set — will return mock results.');
    }
    this.ai = new GoogleGenAI({ apiKey: apiKey || 'DUMMY_KEY' });
    this.modelName = 'gemini-3.5-flash';
  }

  async search(query: string): Promise<SearchResult> {
    const start = Date.now();

    if (!process.env.GEMINI_API_KEY) {
      return this._mockResult(query, start);
    }

    try {
      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: query,
        config: {
          tools: [{ googleSearch: {} }],
          temperature: 0.2,
        },
      });

      const latency = Date.now() - start;
      // SDK 버전에 따라 .text 또는 .candidates[0].content.parts[0].text
      const rawText: string =
        (response as any).text ??
        (response as any).candidates?.[0]?.content?.parts?.[0]?.text ??
        '';

      // groundingChunks에서 Citation 추출
      const citations: Citation[] = [];
      const meta =
        (response as any).candidates?.[0]?.groundingMetadata ??
        (response as any).groundingMetadata ?? {};
      const chunks: any[] = meta.groundingChunks ?? meta.webSearchQueries ?? [];
      // groundingSupports 또는 groundingChunks
      const chunkList: any[] = meta.groundingChunks ?? [];
      chunkList.forEach((chunk: any, idx: number) => {
        const web = chunk.web;
        if (!web?.uri) return;
        try {
          const url = web.uri;
          let domain = new URL(url).hostname;
          // Heuristic: If domain is a Google Search redirect URL, extract the underlying domain name from the title
          if ((domain.includes('google.com') || domain.includes('google.cloud')) && web.title && !web.title.includes(' ') && web.title.includes('.')) {
            domain = web.title;
          }
          citations.push({ url, domain, title: web.title, position: idx + 1, is_brand_domain: false });
        } catch { /* URL 파싱 실패 무시 */ }
      });

      if (citations.length > 0) {
        console.log(`  [Gemini] ✓ ${citations.length} citations extracted`);
      }

      return {
        raw_response_text: rawText,
        citations,
        response_metadata: {
          model_version: this.modelName,
          search_grounding: true,
          response_latency_ms: latency,
          has_structured_data: false,
          provider_type: this.providerType,
        },
      };
    } catch (err: any) {
      console.error(`[GeminiGroundingProvider] search error: ${err.message}`);
      return this._mockResult(query, start, err.message);
    }
  }

  /**
   * 점수에 ProxyConfidenceBand를 부착합니다.
   * @param pointEstimate 관측된 점수 (예: AAS = 72)
   * @param proxyCorrelation 현재 교정된 상관계수 (기본: 0.85)
   * @param mae 현재 교정된 평균 절대 오차 (기본: 7)
   */
  buildConfidenceBand(
    pointEstimate: number,
    proxyCorrelation = DEFAULT_PROXY_CORRELATION,
    mae = DEFAULT_MAE,
    calibrationSampleSize = DEFAULT_CALIBRATION_SAMPLE,
  ): ProxyConfidenceBand {
    return {
      engine: 'gemini_grounding',
      proxy_for: 'google_ai_mode',
      point_estimate: pointEstimate,
      confidence_lower: Math.max(0, pointEstimate - mae),
      confidence_upper: Math.min(100, pointEstimate + mae),
      confidence_level: 0.80,
      proxy_correlation: proxyCorrelation,
      last_calibrated: new Date().toISOString(),
      calibration_sample_size: calibrationSampleSize,
    };
  }

  async healthCheck(): Promise<ProviderHealth> {
    return {
      available: !!process.env.GEMINI_API_KEY,
      estimated_cost_per_query: 0.003,
      last_checked: new Date().toISOString(),
    };
  }

  private _mockResult(query: string, start: number, error?: string): SearchResult {
    return {
      raw_response_text: error
        ? `[Gemini Grounding Mock — Error: ${error}] Query: ${query}`
        : `[Gemini Grounding Mock — Google AI Mode 프록시] "${query}" 관련하여 Google 인덱스 기반 응답입니다. 해당 브랜드는 관련 카테고리에서 신뢰도 있는 정보 제공자로 인식되고 있습니다.`,
      citations: [],
      response_metadata: {
        model_version: this.modelName,
        search_grounding: false,
        response_latency_ms: Date.now() - start,
        has_structured_data: false,
        provider_type: this.providerType,
      },
    };
  }
}
