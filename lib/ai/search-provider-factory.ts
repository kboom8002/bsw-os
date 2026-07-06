/**
 * lib/ai/search-provider-factory.ts
 *
 * SearchProvider 팩토리 + Multi-Engine 비교 모드.
 *
 * 단일 엔진 관측:      SearchProviderFactory.getProvider('perplexity_search')
 * 다중 엔진 비교:      SearchProviderFactory.runMultiEngine(query, [...engines])
 * 브랜드 도메인 설정:  SearchProviderFactory.setBrandDomains([...])
 */

import { ChatGPTSearchProvider } from './providers/chatgpt-search';
import { GeminiGroundingProvider } from './providers/gemini-grounding';
import { PerplexitySearchProvider } from './providers/perplexity-search';
import { ClaudeWebSearchProvider } from './providers/claude-web-search';
import type {
  SearchProvider,
  SearchResult,
  MultiEngineResult,
  Citation,
} from './search-providers';
import { calcCitationOverlap } from './search-providers';

// 지원 엔진 목록
const SUPPORTED_ENGINES = [
  'chatgpt_search',
  'gemini_grounding',
  'perplexity_search',
  'claude_web',
] as const;

export type SupportedSearchEngine = (typeof SUPPORTED_ENGINES)[number];

// 브랜드 도메인 목록 (OCR 계산용) — 런타임에 설정
let brandDomains: Set<string> = new Set();

export class SearchProviderFactory {
  /**
   * 브랜드 도메인 목록을 설정합니다.
   * Citation의 is_brand_domain 플래그 계산에 사용됩니다.
   */
  static setBrandDomains(domains: string[]): void {
    brandDomains = new Set(domains.map((d) => d.toLowerCase().replace(/^www\./, '')));
  }

  /**
   * 단일 SearchProvider 인스턴스를 반환합니다.
   */
  static getProvider(engineName: string): SearchProvider {
    switch (engineName) {
      case 'chatgpt_search':
        return new ChatGPTSearchProvider();
      case 'gemini_grounding':
        return new GeminiGroundingProvider();
      case 'perplexity_search':
        return new PerplexitySearchProvider();
      case 'claude_web':
        return new ClaudeWebSearchProvider();
      default:
        throw new Error(
          `[SearchProviderFactory] Unknown engine: "${engineName}". Supported: ${SUPPORTED_ENGINES.join(', ')}`,
        );
    }
  }

  /**
   * 다중 엔진 동시 관측 — 모델 간 발산(Divergence) 측정.
   */
  static async runMultiEngine(
    query: string,
    engines: string[],
  ): Promise<MultiEngineResult> {
    if (engines.length === 0) {
      throw new Error('[SearchProviderFactory] engines 배열이 비어 있습니다.');
    }

    // 병렬로 모든 엔진 관측
    const settled = await Promise.allSettled(
      engines.map(async (engineName) => {
        const provider = SearchProviderFactory.getProvider(engineName);
        const result = await provider.search(query);
        // 브랜드 도메인 플래그 후처리
        result.citations = SearchProviderFactory._tagBrandDomains(result.citations);
        return { engineName, result };
      }),
    );

    const results: Record<string, SearchResult> = {};
    for (const outcome of settled) {
      if (outcome.status === 'fulfilled') {
        results[outcome.value.engineName] = outcome.value.result;
      } else {
        console.error(`[SearchProviderFactory] engine error:`, outcome.reason);
      }
    }

    if (Object.keys(results).length === 0) {
      const errorSummaries = settled
        .filter((o) => o.status === 'rejected')
        .map((o: any) => o.reason?.message || String(o.reason))
        .join(', ');
      throw new Error(`[SearchProviderFactory] All search engines failed to execute: [${errorSummaries}]`);
    }

    const divergence = SearchProviderFactory._calcDivergence(results);
    return { results, divergence };
  }

  /**
   * 라운드로빈으로 단일 엔진을 선택합니다 (비용 분산용).
   */
  static pickRoundRobin(
    engines: string[],
    callIndex: number,
  ): string {
    return engines[callIndex % engines.length];
  }

  // ─────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────

  private static _tagBrandDomains(citations: Citation[]): Citation[] {
    return citations.map((c) => ({
      ...c,
      is_brand_domain: brandDomains.has(c.domain.replace(/^www\./, '')),
    }));
  }

  /**
   * 다중 엔진 결과에서 발산 지표를 계산합니다.
   */
  private static _calcDivergence(
    results: Record<string, SearchResult>,
  ): MultiEngineResult['divergence'] {
    const engineNames = Object.keys(results);
    if (engineNames.length === 0) {
      return {
        brand_mention_agreement: 0,
        citation_overlap: 0,
        concept_consensus: 0,
        sentiment_variance: 0,
      };
    }

    // 브랜드 언급 일치율: 각 응답에서 브랜드 도메인이 언급된 비율의 평균
    const brandMentions = engineNames.map((e) => {
      const cits = results[e].citations;
      if (cits.length === 0) return 0;
      return cits.filter((c) => c.is_brand_domain).length / cits.length;
    });
    const brand_mention_agreement =
      brandMentions.reduce((a, b) => a + b, 0) / brandMentions.length;

    // Citation Jaccard 겹침 (첫 두 엔진만 비교, 다중은 평균)
    let citationOverlapSum = 0;
    let citationOverlapCount = 0;
    for (let i = 0; i < engineNames.length; i++) {
      for (let j = i + 1; j < engineNames.length; j++) {
        citationOverlapSum += calcCitationOverlap(
          results[engineNames[i]].citations,
          results[engineNames[j]].citations,
        );
        citationOverlapCount++;
      }
    }
    const citation_overlap =
      citationOverlapCount > 0 ? citationOverlapSum / citationOverlapCount : 0;

    // 개념 합의도: 응답 텍스트 길이 분산의 역수 (단순 근사)
    const lengths = engineNames.map((e) => results[e].raw_response_text.length);
    const avgLen = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance =
      lengths.reduce((a, b) => a + Math.pow(b - avgLen, 2), 0) / lengths.length;
    const concept_consensus = avgLen > 0 ? Math.max(0, 1 - variance / (avgLen * avgLen)) : 0;

    // 감성 분산: 현재는 placeholder (향후 Judge 파이프라인과 연동)
    const sentiment_variance = 0;

    return {
      brand_mention_agreement,
      citation_overlap,
      concept_consensus,
      sentiment_variance,
    };
  }
}
