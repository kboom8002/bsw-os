/**
 * lib/ai/providers/perplexity-search.ts
 *
 * Perplexity Search Provider — Perplexity Sonar API (pplx-api).
 * 공식 API로 citations[] 필드를 직접 반환합니다.
 */

import type {
  SearchProvider,
  SearchResult,
  ProviderHealth,
  Citation,
} from '../search-providers';

const PPLX_API_URL = 'https://api.perplexity.ai/chat/completions';

export class PerplexitySearchProvider implements SearchProvider {
  readonly engineName = 'perplexity_search';
  readonly providerType = 'search' as const;

  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.PERPLEXITY_API_KEY || '';
    this.model = 'sonar';
    if (!this.apiKey) {
      console.warn('[PerplexitySearchProvider] PERPLEXITY_API_KEY not set — will return mock results.');
    }
  }

  async search(query: string): Promise<SearchResult> {
    const start = Date.now();

    if (!this.apiKey) {
      return this._mockResult(query, start);
    }

    try {
      const response = await fetch(PPLX_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content:
                'You are a helpful AI assistant. Provide accurate, well-sourced information.',
            },
            { role: 'user', content: query },
          ],
          return_citations: true,
          return_related_questions: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Perplexity API ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      const latency = Date.now() - start;

      const rawText: string = data.choices?.[0]?.message?.content || '';

      // Perplexity는 citations[]를 직접 제공
      const rawCitations: string[] = data.citations || [];
      const citations: Citation[] = rawCitations.map((url: string, idx: number) => {
        let domain = url;
        try {
          domain = new URL(url).hostname;
        } catch {
          // ignore
        }
        return {
          url,
          domain,
          position: idx + 1,
          is_brand_domain: false,
        };
      });

      return {
        raw_response_text: rawText,
        citations,
        response_metadata: {
          model_version: this.model,
          search_grounding: true,
          response_latency_ms: latency,
          token_count: data.usage?.total_tokens,
          has_structured_data: false,
          provider_type: this.providerType,
        },
      };
    } catch (err: any) {
      console.error(`[PerplexitySearchProvider] search error: ${err.message}`);
      return this._mockResult(query, start, err.message);
    }
  }

  async healthCheck(): Promise<ProviderHealth> {
    return {
      available: !!this.apiKey,
      estimated_cost_per_query: 0.002,
      last_checked: new Date().toISOString(),
    };
  }

  private _mockResult(query: string, start: number, error?: string): SearchResult {
    return {
      raw_response_text: error
        ? `[Perplexity Mock — Error: ${error}] Query: ${query}`
        : `[Perplexity Mock] "${query}"에 대한 Sonar 검색 결과입니다. 관련 출처에 따르면 해당 제품 카테고리에서 브랜드 신뢰도가 높게 나타나고 있습니다.`,
      citations: [],
      response_metadata: {
        model_version: this.model,
        search_grounding: false,
        response_latency_ms: Date.now() - start,
        has_structured_data: false,
        provider_type: this.providerType,
      },
    };
  }
}
