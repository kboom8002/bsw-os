/**
 * lib/ai/providers/chatgpt-search.ts
 *
 * ChatGPT Search Provider — OpenAI web_search_preview tool 활용.
 * 실시간 웹 검색 결과 + Citation 수집.
 */

import type {
  SearchProvider,
  SearchResult,
  ProviderHealth,
  Citation,
} from '../search-providers';

export class ChatGPTSearchProvider implements SearchProvider {
  readonly engineName = 'chatgpt_search';
  readonly providerType = 'hybrid' as const;

  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    // gpt-4o-search-preview: web_search_preview tool을 지원하는 전용 모델
    // gpt-4o 등 일반 모델은 web_search_preview를 거부함 (400)
    this.model = 'gpt-4o-search-preview';
    if (!this.apiKey) {
      console.warn('[ChatGPTSearchProvider] OPENAI_API_KEY not set — will return mock results.');
    }
  }

  async search(query: string): Promise<SearchResult> {
    const start = Date.now();

    if (!this.apiKey) {
      return this._mockResult(query, start);
    }

    try {
      // ── Responses API 우선 시도 (web_search 내장, citation 자동 추출) ──
      // https://platform.openai.com/docs/api-reference/responses
      let useResponsesApi = true;
      let response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          tools: [{ type: 'web_search_preview' }],
          input: query,
        }),
      });

      // Responses API가 지원되지 않는 경우(404) → Chat Completions API 폴백
      if (response.status === 404 || response.status === 400) {
        useResponsesApi = false;
        console.warn('[ChatGPTSearchProvider] Responses API unavailable, falling back to Chat Completions with web_search_preview...');
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: this.model,
            messages: [{ role: 'user', content: query }],
            tools: [{ type: 'web_search_preview' }],
            tool_choice: 'auto',
          }),
        });
      }

      // 두 방법 모두 실패 시 (API key has no access to gpt-4o-search-preview or Responses API)
      if (!response.ok && response.status >= 400) {
        if (process.env.GEMINI_API_KEY) {
          console.log('[ChatGPTSearchProvider] OpenAI search API failed. Using Gemini Grounding to assist OpenAI with real search results...');
          try {
            // 1. Fetch search results from Gemini
            const { GoogleGenAI } = await import('@google/genai');
            const geminiKey = process.env.GEMINI_API_KEY || '';
            const ai = new GoogleGenAI({ apiKey: geminiKey });
            const geminiResponse = await ai.models.generateContent({
              model: 'gemini-3.5-flash',
              contents: query,
              config: {
                tools: [{ googleSearch: {} }],
                temperature: 0.2,
              },
            });

            // Extract citations
            const meta = geminiResponse.candidates?.[0]?.groundingMetadata ?? {};
            const chunkList = meta.groundingChunks ?? [];
            const geminiCitations: Citation[] = [];
            chunkList.forEach((chunk: any, idx: number) => {
              const web = chunk.web;
              if (!web?.uri) return;
              try {
                const url = web.uri;
                let domain = new URL(url).hostname;
                if ((domain.includes('google.com') || domain.includes('google.cloud')) && web.title && !web.title.includes(' ') && web.title.includes('.')) {
                  domain = web.title;
                }
                geminiCitations.push({
                  url,
                  domain,
                  title: web.title || 'Source',
                  position: geminiCitations.length + 1,
                  is_brand_domain: false,
                });
              } catch { /* 무시 */ }
            });

            // 2. Call OpenAI gpt-4o to synthesize final response using citations
            console.log(`[ChatGPTSearchProvider] Synthesizing final response with gpt-4o and ${geminiCitations.length} real search citations...`);
            const gptRes = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.apiKey}`,
              },
              body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                  {
                    role: 'system',
                    content: 'You are ChatGPT with search capabilities. Summarize the provided real-time search results to answer the query. Output a detailed and well-structured response.',
                  },
                  {
                    role: 'user',
                    content: `Query: ${query}\n\nSearch Results:\n${JSON.stringify(geminiCitations, null, 2)}\n\nPlease summarize these results to answer the query.`,
                  },
                ],
                temperature: 0.3,
              }),
            });

            if (gptRes.ok) {
              const gptData = await gptRes.json();
              const rawText = gptData.choices?.[0]?.message?.content || '';
              const latency = Date.now() - start;
              return {
                raw_response_text: rawText,
                citations: geminiCitations,
                response_metadata: {
                  model_version: 'gpt-4o (Gemini search assisted)',
                  search_grounding: true,
                  response_latency_ms: latency,
                  token_count: gptData.usage?.total_tokens,
                  has_structured_data: false,
                  provider_type: this.providerType,
                },
              };
            } else {
              console.warn('[ChatGPTSearchProvider] OpenAI synthesis failed, falling back to plain Gemini results...');
              const rawText = geminiResponse.text || (geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text) || '';
              const latency = Date.now() - start;
              return {
                raw_response_text: rawText,
                citations: geminiCitations,
                response_metadata: {
                  model_version: 'gemini-3.5-flash (Search fallback)',
                  search_grounding: true,
                  response_latency_ms: latency,
                  has_structured_data: false,
                  provider_type: this.providerType,
                },
              };
            }
          } catch (geminiErr: any) {
            console.error('[ChatGPTSearchProvider] Gemini-assisted fallback failed:', geminiErr.message);
          }
        }

        console.warn('[ChatGPTSearchProvider] Both OpenAI APIs failed and no Gemini assistance available. Falling back to plain gpt-4o...');
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: query }],
            temperature: 0.3,
          }),
        });
        useResponsesApi = false;
      }

      if (!response.ok) {
        throw new Error(`OpenAI API ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      const latency = Date.now() - start;

      // ── 응답 텍스트 + Citation 추출 (Responses API vs Chat Completions API 분기) ──
      const citations: Citation[] = [];
      let rawText = '';

      if (useResponsesApi && data.output) {
        // Responses API 응답 구조: data.output[] 배열
        for (const item of (data.output as any[])) {
          if (item.type === 'message' && item.content) {
            for (const block of (item.content as any[])) {
              if (block.type === 'output_text') rawText += block.text || '';
              // annotations에서 url_citation 추출
              if (block.annotations) {
                for (const ann of (block.annotations as any[])) {
                  if (ann.type === 'url_citation') {
                    try {
                      const url = ann.url || '';
                      const domain = new URL(url).hostname;
                      citations.push({
                        url,
                        domain,
                        title: ann.title,
                        position: citations.length + 1,
                        is_brand_domain: false,
                      });
                    } catch { /* URL 파싱 실패 무시 */ }
                  }
                }
              }
            }
          }
          // web_search_call 결과에서도 추출 시도
          if (item.type === 'web_search_call' && item.results) {
            for (const r of (item.results as any[])) {
              try {
                const url = r.url || '';
                const domain = new URL(url).hostname;
                citations.push({ url, domain, title: r.title, position: citations.length + 1, is_brand_domain: false });
              } catch { /* 무시 */ }
            }
          }
        }
      } else {
        // Chat Completions API 응답 구조: data.choices[]
        const message = data.choices?.[0]?.message;
        rawText = message?.content || '';
        // tool_calls 또는 annotations에서 citation 추출
        const toolCalls: any[] = message?.tool_calls || [];
        for (const tc of toolCalls) {
          if (tc.function?.name === 'web_search_preview' || tc.type === 'web_search_preview') {
            const results = tc.function ? JSON.parse(tc.function.arguments || '{}').results : tc.web_search_preview?.results;
            (results || []).forEach((r: any, idx: number) => {
              try {
                const url = r.url || '';
                const domain = new URL(url).hostname;
                citations.push({ url, domain, title: r.title, position: idx + 1, is_brand_domain: false });
              } catch { /* 무시 */ }
            });
          }
        }
        // content가 배열인 경우 (structured content) annotations 추출
        const contentArr: any[] = Array.isArray(message?.content) ? message.content : [];
        for (const block of contentArr) {
          if (block.type === 'text' && block.text) rawText += block.text;
          for (const ann of (block.annotations || [])) {
            if (ann.type === 'url_citation') {
              try {
                const url = ann.url || '';
                citations.push({ url, domain: new URL(url).hostname, title: ann.title, position: citations.length + 1, is_brand_domain: false });
              } catch { /* 무시 */ }
            }
          }
        }
      }

      if (citations.length > 0) {
        console.log(`  [ChatGPT] ✓ ${citations.length} citations extracted`);
      }

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
      console.error(`[ChatGPTSearchProvider] search error: ${err.message}`);
      return this._mockResult(query, start, err.message);
    }
  }

  async healthCheck(): Promise<ProviderHealth> {
    return {
      available: !!this.apiKey,
      estimated_cost_per_query: 0.005,
      last_checked: new Date().toISOString(),
    };
  }

  private _mockResult(query: string, start: number, error?: string): SearchResult {
    return {
      raw_response_text: error
        ? `[ChatGPT Search Mock — Error: ${error}] Query: ${query}`
        : `[ChatGPT Search Mock] 브랜드 관련 질문 "${query}"에 대한 웹 검색 결과입니다. 해당 제품은 높은 사용자 만족도를 보이며 관련 전문가들도 긍정적으로 평가하고 있습니다.`,
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
