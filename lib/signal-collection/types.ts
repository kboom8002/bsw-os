/**
 * lib/signal-collection/types.ts
 *
 * S-OGDE v2.0 공유 타입 정의.
 * 파이프라인 전체에서 사용되는 인터페이스를 중앙 관리합니다.
 */

// ─────────────────────────────────────────
// 1. Signal & Candidate
// ─────────────────────────────────────────

/** 파이프라인에서 수집된 원시 시그널 후보. */
export interface RawSignalCandidate {
  query: string;
  source: string;          // e.g. 'meta_pattern', 'exploratory_chain', 'recursive_tree', 'reverse_usp'
  volume: number;          // 추정 검색량 (합성 값)
  metadata?: Record<string, unknown>;
}

/** 임베딩이 부착된 시그널 (Dedup용). */
export interface EmbeddedSignal extends RawSignalCandidate {
  embedding: number[];     // 벡터 (768 or 1536 차원)
  clusterId?: string;      // 클러스터 할당 후 채워짐
}

// ─────────────────────────────────────────
// 2. Clustering & Dedup
// ─────────────────────────────────────────

/** 의미적으로 유사한 시그널들의 군집. */
export interface SignalCluster {
  id: string;
  representative: RawSignalCandidate;   // 대표 질문 (가장 간결한 것)
  variants: RawSignalCandidate[];       // 나머지 유사 질문들
  weight: number;                       // 군집 내 질문 수 (빈도 가중치)
  avgSimilarity: number;                // 군집 내 평균 코사인 유사도
}

export interface DedupResult {
  clusters: SignalCluster[];
  totalInput: number;
  totalOutput: number;      // = clusters.length
  duplicatesRemoved: number;
}

// ─────────────────────────────────────────
// 3. Persona (Multi-Persona Branching)
// ─────────────────────────────────────────

export type PersonaType = 'skeptic' | 'pragmatist' | 'novice';

export interface Persona {
  type: PersonaType;
  label_ko: string;
  system_prompt_template: string;
}

/** 기본 페르소나 세트. */
export const DEFAULT_PERSONAS: Persona[] = [
  {
    type: 'skeptic',
    label_ko: '팩트체커',
    system_prompt_template: `당신은 비판적 소비자(Skeptic)입니다. 
과학적 근거, 임상 데이터, 정확한 함량, 부작용, 단점을 따지는 관점에서 
"{question}" 이후에 추가로 궁금해할 질문을 생성하세요.
브랜드 "{brand}"를 고려하되, 맹목적으로 신뢰하지 마세요.`
  },
  {
    type: 'pragmatist',
    label_ko: '가성비파',
    system_prompt_template: `당신은 실용적 소비자(Pragmatist)입니다.
대체품, 가격 비교, 세일 정보, 용량 대비 효율, 구매 채널을 따지는 관점에서
"{question}" 이후에 추가로 궁금해할 질문을 생성하세요.
브랜드 "{brand}"를 고려하세요.`
  },
  {
    type: 'novice',
    label_ko: '초보자',
    system_prompt_template: `당신은 초보 소비자(Novice)입니다.
사용 순서, 안전성, 기초 용어, 금기 조합, 기본적 우려사항을 중심으로
"{question}" 이후에 추가로 궁금해할 질문을 생성하세요.
브랜드 "{brand}"를 고려하세요. 전문 용어는 최대한 피하세요.`
  }
];

// ─────────────────────────────────────────
// 4. Context / Micro-RAG (Phase S)
// ─────────────────────────────────────────

/** VOC(Voice of Customer) 데이터 청크. */
export interface VOCChunk {
  text: string;
  source: string;          // e.g. 'naver_review', 'coupang_review', 'manual_upload'
  timestamp?: string;
}

/** 실데이터 컨텍스트 수집기 인터페이스 (향후 확장용). */
export interface ContextFetcher {
  fetchVOC(domain: string, brand: string): Promise<VOCChunk[]>;
}

// ─────────────────────────────────────────
// 5. Search Grounding
// ─────────────────────────────────────────

/** 실제 AI 검색 결과를 기반으로 한 그라운딩 정보. */
export interface GroundedAnswer {
  query: string;
  answer_text: string;        // 실제 AI 검색 엔진의 응답 텍스트
  citations: Array<{
    url: string;
    domain: string;
    title: string;
  }>;
  engine: string;             // e.g. 'gemini_grounding'
}

// ─────────────────────────────────────────
// 6. Pipeline Result (확장)
// ─────────────────────────────────────────

export interface PipelineResultV2 {
  totalGenerated: number;
  afterDedup: number;
  savedSignals: number;
  sources: Record<string, number>;
  clusters: SignalCluster[];
  reverseSignals?: number;
}
