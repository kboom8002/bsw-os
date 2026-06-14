/**
 * lib/ai/providers/claude-web-search.ts
 *
 * Claude Web Search Provider — Anthropic API web_search_20250305 tool 활용.
 * 2025년 출시된 공식 웹 검색 기능. search_results 블록에서 Citation 추출.
 */

import type {
  SearchProvider,
  SearchResult,
  ProviderHealth,
  Citation,
} from '../search-providers';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

export class ClaudeWebSearchProvider implements SearchProvider {
  readonly engineName = 'claude_web';
  readonly providerType = 'hybrid' as const;

  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY || '';
    this.model = 'claude-sonnet-4-5';
    if (!this.apiKey) {
      console.warn('[ClaudeWebSearchProvider] ANTHROPIC_API_KEY not set — will return mock results.');
    }
  }

  async search(query: string): Promise<SearchResult> {
    const start = Date.now();

    if (!this.apiKey) {
      return this._mockResult(query, start);
    }

    try {
      const response = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'web-search-2025-03-05',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 2048,
          tools: [{ type: 'web_search_20250305', name: 'web_search' }],
          messages: [{ role: 'user', content: query }],
        }),
      });

      if (!response.ok) {
        throw new Error(`Anthropic API ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      const latency = Date.now() - start;

      // content 블록에서 텍스트 + 검색 결과 분리
      const contentBlocks: any[] = data.content || [];
      let rawText = '';
      const citations: Citation[] = [];
      let citationPos = 1;

      for (const block of contentBlocks) {
        if (block.type === 'text') {
          rawText += block.text;
        } else if (block.type === 'tool_result' || block.type === 'search_result') {
          // search_results 배열 처리
          const results: any[] = block.content || block.results || [];
          for (const r of results) {
            const url = r.url || '';
            if (!url) continue;
            try {
              const domain = new URL(url).hostname;
              citations.push({
                url,
                domain,
                title: r.title,
                position: citationPos++,
                is_brand_domain: false,
              });
            } catch {
              // URL 파싱 실패 무시
            }
          }
        }
      }

      return {
        raw_response_text: rawText,
        citations,
        response_metadata: {
          model_version: this.model,
          search_grounding: true,
          response_latency_ms: latency,
          token_count: data.usage?.input_tokens + (data.usage?.output_tokens || 0),
          has_structured_data: false,
          provider_type: this.providerType,
        },
      };
    } catch (err: any) {
      console.error(`[ClaudeWebSearchProvider] search error: ${err.message}`);
      return this._mockResult(query, start, err.message);
    }
  }

  async healthCheck(): Promise<ProviderHealth> {
    return {
      available: !!this.apiKey,
      estimated_cost_per_query: 0.008,
      last_checked: new Date().toISOString(),
    };
  }

  private _mockResult(query: string, start: number, error?: string): SearchResult {
    return {
      raw_response_text: error
        ? `[Claude Web Search Mock — Error: ${error}] Query: ${query}`
        : `[Claude Web Search Mock] "${query}"에 대한 웹 검색 결과입니다. Claude의 분석에 따르면 해당 브랜드는 관련 분야에서 전문성과 신뢰도를 갖추고 있습니다.`,
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
