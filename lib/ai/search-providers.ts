/**
 * lib/ai/search-providers.ts
 *
 * 관측 전용 Provider — 실제 AI 검색 엔진의 응답을 수집하기 위한
 * 통합 인터페이스 및 타입 정의.
 *
 * 기존 AIProvider(generateText)와 달리, SearchProvider는
 * 응답 원문 + 인용(Citations) + 메타데이터를 함께 수집합니다.
 */

export type ProviderType = 'api' | 'scraper' | 'hybrid' | 'search';

// ─────────────────────────────────────────
// Citation — 인용 URL 정보
// ─────────────────────────────────────────
export interface Citation {
  url: string;
  domain: string;
  title?: string;
  /** 인용 순서 (1-indexed) */
  position: number;
  /** 자사 도메인 여부 (OCR 산출용) */
  is_brand_domain: boolean;
}

// ─────────────────────────────────────────
// SearchResult — 검색 결과 + 메타데이터
// ─────────────────────────────────────────
export interface SearchResult {
  /** AI 원시 응답 전문 */
  raw_response_text: string;
  /** 인용 URL 목록 */
  citations: Citation[];
  response_metadata: {
    model_version?: string;
    /** 웹 검색 기반 여부 */
    search_grounding: boolean;
    /** 응답 지연 시간 (ms) */
    response_latency_ms: number;
    token_count?: number;
    /** 검색 의도 및 추출된 실제 쿼리 (Gemini webSearchQueries 등) */
    search_queries?: string[];
    has_structured_data: boolean;
    provider_type: ProviderType;
  };
}

// ─────────────────────────────────────────
// ProviderHealth — 상태 확인
// ─────────────────────────────────────────
export interface ProviderHealth {
  available: boolean;
  rate_limit_remaining?: number;
  estimated_cost_per_query?: number;
  last_checked: string;
}

// ─────────────────────────────────────────
// SearchProvider — 핵심 인터페이스
// ─────────────────────────────────────────
export interface SearchProvider {
  readonly engineName: string;
  readonly providerType: ProviderType;

  /** 검색 질의를 보내고 원시 응답 + 메타데이터 수집 */
  search(query: string): Promise<SearchResult>;

  /** 상태 확인 (rate limit, 접근성) */
  healthCheck(): Promise<ProviderHealth>;
}

// ─────────────────────────────────────────
// ProxyConfidenceBand — Gemini Grounding 프록시 신뢰범위
// ─────────────────────────────────────────
export interface ProxyConfidenceBand {
  engine: 'gemini_grounding';
  proxy_for: 'google_ai_mode';
  /** 관측값 */
  point_estimate: number;
  /** 하한 (80% CI) */
  confidence_lower: number;
  /** 상한 (80% CI) */
  confidence_upper: number;
  confidence_level: 0.80;
  /** Gemini Grounding ↔ Google AI Mode 상관계수 */
  proxy_correlation: number;
  last_calibrated: string;
  calibration_sample_size: number;
}

export type ProxyCorrelationGrade = 'high' | 'moderate' | 'low' | 'unreliable';

/**
 * 상관계수(Pearson r)로 프록시 신뢰 등급 판정.
 */
export function getProxyCorrelationGrade(r: number): ProxyCorrelationGrade {
  if (r >= 0.90) return 'high';
  if (r >= 0.80) return 'moderate';
  if (r >= 0.70) return 'low';
  return 'unreliable';
}

// ─────────────────────────────────────────
// MultiEngineResult — 다중 엔진 비교 결과
// ─────────────────────────────────────────
export interface MultiEngineResult {
  results: Record<string, SearchResult>;
  divergence: {
    /** 브랜드 언급 일치율 (0~1) */
    brand_mention_agreement: number;
    /** 인용 URL 겹침률 (Jaccard) */
    citation_overlap: number;
    /** 개념 합의도 */
    concept_consensus: number;
    /** 감성 분산 */
    sentiment_variance: number;
  };
}

/**
 * Citation 목록에서 자사 도메인 인용 비율(OCR) 계산.
 */
export function calcOfficialCitationRate(citations: Citation[]): number {
  if (citations.length === 0) return 0;
  const brandCount = citations.filter((c) => c.is_brand_domain).length;
  return brandCount / citations.length;
}

/**
 * 두 Citation 배열의 URL 기반 Jaccard 유사도 계산.
 */
export function calcCitationOverlap(a: Citation[], b: Citation[]): number {
  const setA = new Set(a.map((c) => c.url));
  const setB = new Set(b.map((c) => c.url));
  const intersection = [...setA].filter((u) => setB.has(u)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}
