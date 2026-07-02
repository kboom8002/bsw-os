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
// 6. Pipeline Configuration
// ─────────────────────────────────────────

/** S-OGDE 파이프라인 실행 옵션. */
export interface PipelineOptions {
  /** 브랜드 USP — Phase R(Reverse Chaining) 활성화에 필요 */
  brandUSP?: string;
  /** VOC 데이터 — Phase G의 Micro-RAG 컨텍스트 주입에 사용 */
  contextChunks?: VOCChunk[];
  /** 진행 상황 콜백 */
  onProgress?: (msg: string) => void;
}

/** 2단계 분리 평가 결과 */
export interface EvalStep1Result {
  intent: 'informational' | 'navigational' | 'transactional' | 'local' | 'comparison' | 'risk';
  brand_fit: 'fit' | 'partial' | 'unfit';
  is_ymyl: boolean;
}

/** QVS 8차원 확장 */
export interface QVS8DResult {
  relevance: number;      // V_rel (0-10)
  specificity: number;    // V_spec (0-10)
  urgency: number;        // V_urg (0-10)
  opportunity: number;    // V_opp = 10 - V_comp (경쟁 역수)
  conversion: number;     // V_conv (0-10)
  // AEO/GEO 신규 3차원
  snippet_fitness: number;    // 직접 답변 박스 적합도 (0-10)
  entity_clarity: number;     // 엔티티 구분 명확도 (0-10)
  multi_engine_consistency: number; // 멀티엔진 일관 답변 유도 가능성 (0-10)
  reasoning: string;      // CoT 근거
}

/** 신뢰도 포함 평가 결과 */
export interface EvaluationWithConfidence {
  step1: EvalStep1Result;
  qvs: QVS8DResult;
  qvs_total: number;
  confidence: 'high' | 'medium' | 'low';
  qvs_std?: number;       // 3회 반복 시 표준편차
  gate_status: 'Go' | 'Watch' | 'No-Go';
}

/** 시그널 시간 가치 */
export interface TemporalSignalValue {
  base_qvs: number;
  decay_factor: number;   // exp(-λ × Δt)
  trend_multiplier: number;
  effective_value: number; // base × decay × trend
}

/** PipelineOptions 확장 */
export interface PipelineOptionsV3 extends PipelineOptions {
  workspaceId?: string;       // TCO 시드 주입용
  industryKey?: string;       // 패널 데이터 참조용
  kgNodes?: Array<{ id: string; node_name: string; node_type: string }>;
  tcoConceptSeeds?: Array<{ concept_name: string; definition: string }>;
  enableMMR?: boolean;        // MMR 다양성 승격
  repeatEval?: number;        // 불확실성 정량화 반복 횟수
}

// ─────────────────────────────────────────
// 7. Pipeline Result (확장)
// ─────────────────────────────────────────

export interface PipelineResultV2 {
  totalGenerated: number;
  afterDedup: number;
  savedSignals: number;
  sources: Record<string, number>;
  clusters: SignalCluster[];
  reverseSignals?: number;
  /** Phase E에서 Gate로 제거된 시그널 수 */
  filteredOut?: number;
  /** Phase E에서 에러로 실패한 시그널 수 */
  evalErrors?: number;
  /** 전체 파이프라인 실행 시간 (ms) */
  durationMs?: number;
}


