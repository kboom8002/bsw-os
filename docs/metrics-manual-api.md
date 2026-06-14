# BSW-OS 지표 체계 매뉴얼 Vol.5 — API 및 함수 레퍼런스

> **Version:** v1.0  
> **System:** Brand Semantic Website OS (BSW-OS)  
> **대상 독자:** 개발자 · 시스템 통합자  
> **Last Updated:** 2026-06-01

---

## 목차

1. [Server Actions 레퍼런스](#1-server-actions-레퍼런스)
2. [AI Provider Factory API](#2-ai-provider-factory-api)
3. [Judge Pipeline API](#3-judge-pipeline-api)
4. [Metrics Calculator API](#4-metrics-calculator-api)
5. [SBS Index API](#5-sbs-index-api)
6. [Observatory Harness API](#6-observatory-harness-api)
7. [DB 테이블 스키마](#7-db-테이블-스키마)
8. [테스트 작성 가이드](#8-테스트-작성-가이드)

---

## 1. Server Actions 레퍼런스

### 1.1 Observatory Actions

> **파일:** `app/actions/observatory.ts` (1488 lines)

#### `computeMetricSnapshot`

Layer 1 관측 핵심 지표를 산출하여 DB에 저장합니다.

```typescript
async function computeMetricSnapshot(
  workspaceId: string,
  observationRunId: string
): Promise<MetricSnapshot>
```

| 파라미터 | 타입 | 설명 |
|:---|:---|:---|
| `workspaceId` | `string` | 워크스페이스 UUID |
| `observationRunId` | `string` | 관측 실행 UUID |

**반환값 (`MetricSnapshot`):**

| 필드 | 타입 | 설명 |
|:---|:---|:---|
| `aas` | `number` | AI Answer Share (0~100) |
| `ocr` | `number` | Official Citation Rate (0~100) |
| `bsf` | `number` | Brand Semantic Fidelity (0~100) |
| `qtc` | `number` | Question Territory Coverage (0~100) |
| `gctr` | `number` | GEO Concept Transfer Rate (0~100) |
| `ars` | `number` | AEO Readiness Score (0~100) |

**DB 저장:** `metric_snapshots` 테이블

---

#### `computeDomainIndexSnapshot`

Layer 2 MRI 도메인 인덱스를 산출하여 DB에 저장합니다.

```typescript
async function computeDomainIndexSnapshot(
  workspaceId: string
): Promise<DomainIndexSnapshot>
```

**반환값 (`DomainIndexSnapshot`):**

| 필드 | 타입 | 설명 |
|:---|:---|:---|
| `b_mri` | `number` | Brand MRI (0~100) |
| `d_mri` | `number` | Data MRI (0~100) |
| `ops_mri` | `number` | Operations MRI |
| `p_mri` | `number` | Persona MRI (0~100) |
| `v_mri` | `number` | Vibe MRI (0~100) |
| `s_mri` | `number` | Semantic MRI (0~100) |

**DB 저장:** `domain_index_snapshots` 테이블

---

### 1.2 K-Culture Evaluation

> **파일:** `app/actions/kculture-eval.ts` (258 lines)

#### `runKCultureEvaluation`

K-Culture 문화적 충실도 평가를 실행합니다.

```typescript
async function runKCultureEvaluation(
  workspaceId: string,
  domainPackId: string,
  condition: 'baseline' | 'intervention'
): Promise<CulturalSnapshot>
```

| 파라미터 | 타입 | 설명 |
|:---|:---|:---|
| `workspaceId` | `string` | 워크스페이스 UUID |
| `domainPackId` | `string` | 도메인 팩 ID (`kbeauty`, `kfood` 등) |
| `condition` | `'baseline' \| 'intervention'` | 실험 조건 |

**반환값 (`CulturalSnapshot`):**

| 필드 | 타입 | 설명 |
|:---|:---|:---|
| `concept_transfer_rate` (M1) | `number` | 0.0~1.0 |
| `citation_backed_rate` (M2) | `number` | 0.0~1.0 |
| `brand_concept_fidelity` (M3) | `number` | 0.0~1.0 |
| `concept_distortion_rate` (M4) | `number` | 0.0~1.0 |
| `hallucinated_concept_rate` (M6) | `number` | 0.0~1.0 |
| `floor_risk` (M9) | `number` | 0.0~1.0 |
| `policy_alignment` (M10) | `number` | 0.0~1.0 |
| `cross_cultural_resonance` (M14) | `number` | 0.0~1.0 |
| `commercial_transferability` (M15) | `number` | 0.0~1.0 |

**AI 모드별 동작:**
- `openai`: `getAIProvider()` → gpt-4o-mini로 실측 응답 생성
- `gemini`: `getAIProvider()` → gemini-2.5-flash로 실측 응답 생성
- `mock`: 하드코딩된 baseline/intervention 응답 사용

---

## 2. AI Provider Factory API

### 2.1 Core AI Provider

> **파일:** `lib/ai/ai-provider.ts`

```typescript
interface AIProviderOptions {
  temperature?: number;     // 0.0~2.0, 기본: 0.1
  maxOutputTokens?: number; // 최대 출력 토큰
}

interface AIProvider {
  generateText(
    prompt: string, 
    options?: AIProviderOptions
  ): Promise<string>;
  
  generateStructuredOutput<T>(
    prompt: string, 
    schema: any, 
    options?: AIProviderOptions
  ): Promise<T>;
}

function getAIProvider(): AIProvider;
```

**구현체:**

| 클래스 | 모드 | 모델 | 특성 |
|:---|:---|:---|:---|
| `MockProvider` | `mock` | — | 결정적 응답, API 미사용 |
| `GeminiProvider` | `gemini` | gemini-2.5-flash | Google AI Studio API |
| `OpenAIProvider` | `openai` | gpt-4o-mini | OpenAI Chat Completions API |

**환경 변수:**
- `AI_PROVIDER_MODE`: `mock` | `gemini` | `openai`
- `OPENAI_API_KEY`: OpenAI API 키
- `GEMINI_API_KEY` 또는 `GOOGLE_AI_API_KEY`: Gemini API 키

---

### 2.2 Observation Provider

> **파일:** `lib/ai/observation-provider.ts`

```typescript
interface ObservationResult {
  rawResponseText: string;  // AI 원시 응답 텍스트
  engineName: string;       // 엔진 식별자
  latencyMs: number;        // 응답 지연시간 (ms)
  citations?: string[];     // 인용 URL 목록 (있는 경우)
}

interface ObservationProvider {
  queryEngine(
    question: string, 
    engineName: string
  ): Promise<ObservationResult>;
}

function getObservationProvider(engineName: string): ObservationProvider;
```

**구현체:**

| 클래스 | 모드 | 엔진 | 설명 |
|:---|:---|:---|:---|
| `MockObservationProvider` | `mock` | — | 하드코딩 응답 |
| `GeminiSgeProvider` | `gemini` | `sge` | Gemini로 SGE 시뮬레이션 |
| `ChatGPTProvider` | `gemini` | `chatgpt` | Gemini로 ChatGPT 시뮬레이션 |
| `OpenAIChatGPTProvider` | `openai` | `chatgpt` | OpenAI API 직접 호출 |

---

### 2.3 Embedding Provider

> **파일:** `lib/ai/embedding-provider.ts`

```typescript
interface EmbeddingProvider {
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}

function getEmbeddingProvider(): EmbeddingProvider;
```

**구현체:**

| 클래스 | 모드 | 모델 | 차원 |
|:---|:---|:---|:---:|
| `MockEmbeddingProvider` | `mock` | — | 768 |
| `GeminiEmbeddingProvider` | `gemini` | text-embedding-004 | 768 |
| `OpenAIEmbeddingProvider` | `openai` | text-embedding-3-small | 1536 |

> [!IMPORTANT]
> OpenAI(1536d)와 Gemini(768d)는 벡터 차원이 다릅니다. Provider별로 **독립적인 Anchor 벡터**를 사용해야 합니다. 혼용 시 코사인 유사도 계산이 불가합니다.

---

### 2.4 Signal Mining Provider

> **파일:** `lib/ai/signal-mining-provider.ts`

```typescript
interface MinedSignal {
  query: string;          // 검색 쿼리
  volume: number;         // 추정 검색량
  intent: 'informational' | 'navigational' | 'transactional' | 'local';
  category?: string;      // 쿼리 카테고리
}

interface SignalMiningProvider {
  mineSignals(domain: string): Promise<MinedSignal[]>;
}

function getSignalMiningProvider(): SignalMiningProvider;
```

**구현체:**

| 클래스 | 모드 | 설명 |
|:---|:---|:---|
| `MockSignalProvider` | `mock` | 하드코딩 시그널 |
| `GSCProvider` | `gemini` | Gemini로 검색 쿼리 추론 |
| `OpenAISignalProvider` | `openai` | OpenAI로 검색 쿼리 추론 |

---

## 3. Judge Pipeline API

### 3.1 JudgePipeline

> **파일:** `lib/judges/judge-pipeline.ts`

```typescript
class JudgePipeline {
  /**
   * 단일 Probe Run에 대해 6-Judge 파이프라인 실행
   */
  async runForProbeRun(
    workspaceId: string, 
    probeRunId: string
  ): Promise<void>;
  
  /**
   * Observation Run 내 모든 Probe에 대해 순차 실행
   */
  async runForObservationRun(
    workspaceId: string, 
    runId: string, 
    onProgress?: (progress: JudgeProgress) => void
  ): Promise<void>;
}
```

### 3.2 Individual Judges

모든 Judge는 `lib/judges/` 디렉토리에 위치합니다.

#### Judge 1: ConceptExtractorJudge

```typescript
class ConceptExtractorJudge {
  async runExtraction(
    workspaceId: string,
    probeRunId: string,
    ssotContext: SSoTContext,
    responseText: string
  ): Promise<ExtractionResult>;
}
```

**출력 (`ExtractionResult`):**

| 필드 | 타입 | 설명 |
|:---|:---|:---|
| `extracted_concepts[]` | `Concept[]` | 추출된 개념 목록 |
| `extracted_relations[]` | `Relation[]` | 추출된 개념 간 관계 |

각 `Concept`:

| 필드 | 타입 | 설명 |
|:---|:---|:---|
| `concept_id` | `string` | 개념 ID |
| `present` | `boolean` | SSoT 대비 존재 여부 |
| `accuracy` | `number` | 정확도 (0.0~1.0) |
| `rank` | `number` | 응답 내 순서 |
| `evidence_bound` | `boolean` | 공식 근거 바인딩 여부 |

**연관 메트릭:** M1, M2, M5, M7, M8

---

#### Judge 2: FidelityJudge

```typescript
class FidelityJudge {
  async runFidelity(
    workspaceId: string,
    probeRunId: string,
    extractionId: string,
    context: SSoTContext,
    concepts: Concept[],
    responseText: string
  ): Promise<FidelityJudgment>;
}
```

**출력:** `brand_concept_fidelity: number` (0.0~1.0)  
**DB 저장:** `fidelity_judgments`  
**연관 메트릭:** M3

---

#### Judge 3: DistortionJudge

```typescript
class DistortionJudge {
  async runDistortion(
    workspaceId: string,
    probeRunId: string,
    extractionId: string,
    context: SSoTContext,
    responseText: string
  ): Promise<DistortionJudgment>;
}
```

**출력:**

| 필드 | 타입 | 설명 |
|:---|:---|:---|
| `concept_distortion_rate` | `number` | 0.0~1.0 |
| `distortions[]` | `Distortion[]` | 왜곡 목록 (type, severity, concept_id) |

**왜곡 유형:** `exaggeration`, `minimization`, `misclassification`, `competitor_merge`  
**DB 저장:** `distortion_judgments`  
**연관 메트릭:** M4

---

#### Judge 4: HallucinationJudge

```typescript
class HallucinationJudge {
  async runHallucination(
    workspaceId: string,
    probeRunId: string,
    extractionId: string,
    context: SSoTContext,
    responseText: string
  ): Promise<HallucinationJudgment>;
}
```

**출력:**

| 필드 | 타입 | 설명 |
|:---|:---|:---|
| `hallucinated_concept_rate` | `number` | 0.0~1.0 |
| `claims[]` | `Claim[]` | 환각 주장 목록 (type, risk_level) |

**환각 유형:** `unsupported_claim`, `fabricated_feature`, `false_association`, `outdated_info`  
**DB 저장:** `hallucination_judgments`  
**연관 메트릭:** M6

---

#### Judge 5: RiskJudge

```typescript
class RiskJudge {
  async runRisk(
    workspaceId: string,
    probeRunId: string,
    context: SSoTContext,
    responseText: string
  ): Promise<RiskJudgment>;
}
```

**출력:** `risk_score: number` (0.0~1.0)  
**DB 저장:** `risk_judgments`  
**연관 메트릭:** M9

---

#### Judge 6: PolicyJudge

```typescript
class PolicyJudge {
  async runPolicy(
    workspaceId: string,
    probeRunId: string,
    context: SSoTContext,
    responseText: string
  ): Promise<PolicyJudgment>;
}
```

**출력:**

| 필드 | 타입 | 설명 |
|:---|:---|:---|
| `policy_alignment` | `number` | 0.0~1.0 |
| `violations[]` | `Violation[]` | 위반 목록 (type, severity) |

**위반 유형:** `tone_mismatch`, `unauthorized_cta`, `safety_violation`, `boundary_breach`  
**DB 저장:** `policy_judgments`  
**연관 메트릭:** M10

---

## 4. Metrics Calculator API

### 4.1 B-MRI Calculator

> **파일:** `lib/metrics/b-mri.ts` (66 lines)

```typescript
interface BMriResult {
  value: number;             // B-MRI 점수 (0~100)
  components: {
    AAS: number;
    OCR: number;
    BSF: number;
    QTC: number;
    GCTR: number;
    ARS: number;
    competitivePositionScore: number;
  };
}

function computeBMRI(
  AAS: number,               // AI Answer Share (0~100)
  OCR: number,               // Official Citation Rate (0~100)
  BSF: number,               // Brand Semantic Fidelity (0~100)
  QTC: number,               // Question Territory Coverage (0~100)
  GCTR: number,              // GEO Concept Transfer Rate (0~100)
  ARS: number,               // AEO Readiness Score (0~100)
  competitorAas: number,     // 경쟁사 평균 AAS
  confPenalty: number,       // 신뢰도 패널티 (0~1)
  volPenalty: number          // 볼륨 패널티 (0~1)
): BMriResult;
```

**수식:**
```
B-MRI = 0.20×AAS + 0.15×OCR + 0.20×BSF + 0.15×QTC 
      + 0.15×GCTR + 0.10×ARS + 0.05×CPS 
      − confPenalty×100 − volPenalty×100
```

---

### 4.2 D-MRI Calculator

> **파일:** `lib/metrics/d-mri.ts` (299 lines)

```typescript
interface DMriResult {
  value: number;                   // D-MRI 점수 (0~100)
  components: Record<string, number>;  // 12개 서브-컴포넌트 점수
}

async function computeDMRI(
  workspaceId: string
): Promise<DMriResult>;
```

**12개 서브-컴포넌트 (가중치):**

| 컴포넌트 | 가중치 | 데이터 소스 |
|:---|:---:|:---|
| Truth Readiness | 0.10 | `brand_strategic_truths`, `brand_operational_truths` |
| Evidence Readiness | 0.10 | `brand_truth_evidence` |
| Boundary Coverage | 0.10 | `boundary_rules` |
| Question System | 0.10 | `canonical_questions`, `probe_questions` |
| Concept Knowledge Graph | 0.10 | `brand_ontology_nodes`, `brand_ontology_edges` |
| Claim Lineage | 0.10 | `claim_lineage` |
| Object Completeness | 0.10 | `brand_objects` |
| Surface/Page Coverage | 0.10 | `semantic_pages` |
| Export Readiness | 0.05 | `export_snapshots` |
| Persona/Vibe Coverage | 0.05 | `persona_eval_runs`, `vibe_spec` |
| Observatory Coverage | 0.05 | `probe_panels`, `ai_observation_runs` |
| Fix-It Traceability | 0.05 | `fix_it_cases` |

---

### 4.3 Concept Fidelity Aggregator

> **파일:** `lib/metrics/concept-fidelity-aggregator.ts`

```typescript
class ConceptFidelityAggregator {
  async aggregate(
    workspaceId: string,
    observationRunId: string,
    condition: 'baseline' | 'intervention'
  ): Promise<ConceptFidelitySnapshot>;
}
```

**`ConceptFidelitySnapshot` 필드:**

| 필드 | 메트릭 | 설명 |
|:---|:---:|:---|
| `concept_transfer_rate` | M1 | 개념 전달률 |
| `citation_backed_rate` | M2 | 인용 검증률 |
| `brand_concept_fidelity` | M3 | 브랜드 개념 충실도 |
| `concept_distortion_rate` | M4 | 개념 왜곡률 |
| `missing_concept_gap_count` | M5 | 누락 개념 수 |
| `hallucinated_concept_rate` | M6 | 환각 개념률 |
| `attractor_stability` | M7 | 끌개 안정성 |
| `drift_score` | M8 | 드리프트 점수 |
| `floor_risk` | M9 | 바닥 리스크 |
| `policy_alignment` | M10 | 정책 정합성 |
| `consensus_score` | M11 | 합의 점수 |
| `variance_score` | M12 | 분산 점수 |
| `aeo_geo_readiness` | M13 | AEO/GEO 준비도 |

**DB 저장:** `concept_fidelity_snapshots`

---

### 4.4 Cultural Metrics Aggregator

> **파일:** `lib/metrics/cultural-metrics-aggregator.ts`

```typescript
class CulturalMetricsAggregator {
  async aggregate(
    workspaceId: string,
    observationRunId: string,
    condition: 'baseline' | 'intervention'
  ): Promise<CulturalSnapshot>;
}
```

**추가 필드:**

| 필드 | 메트릭 | 수식 |
|:---|:---:|:---|
| `cross_cultural_resonance` | M14 | `0.4×M3 + 0.3×(1−M4) + 0.3×(1−M9)` |
| `commercial_transferability` | M15 | `0.5×M1 + 0.3×M2 + 0.2×M10` |

---

### 4.5 Attractor Stability Calculator

> **파일:** `lib/metrics/attractor-stability-calculator.ts`

```typescript
interface StabilityMetrics {
  attractor_stability: number;  // M7 (0.0~1.0)
  consensus_score: number;      // M11 (0.0~1.0)
  variance_score: number;       // M12 (0.0~∞)
}

class AttractorStabilityCalculator {
  static computeMetrics(
    runs: ObservationRunData[]
  ): StabilityMetrics;
}
```

**`ObservationRunData` 구조:**

```typescript
interface ObservationRunData {
  concepts: Array<{
    concept_id: string;
    present: boolean;
    rank: number;
    evidence_bound: boolean;
  }>;
  relations: Array<{
    source_id: string;
    target_id: string;
    type: string;
    present: boolean;
  }>;
}
```

**내부 계산:**
- **M7** = 0.40×RecallConsistency + 0.20×RankStability + 0.20×RelationStability + 0.20×BoundarySuppression
- **M11** = avg(Jaccard(run_i, run_j)) for all pairs
- **M12** = Σ(p_c × (1 − p_c)) for each concept c

---

### 4.6 Drift Calculator

> **파일:** `lib/metrics/drift-calculator.ts`

```typescript
interface DriftResult {
  drift_score: number;                        // M8 (0.0~1.0)
  direction: 'positive' | 'negative' | 'neutral';
}

class DriftCalculator {
  static computeDrift(
    distA: Record<string, number>,  // baseline recall 분포
    distB: Record<string, number>,  // current recall 분포
    method?: 'cosine' | 'l1'       // 기본: 'cosine'
  ): DriftResult;
}
```

**Cosine Distance 계산:**
```
drift = 1 − (A·B) / (|A| × |B|)
direction = sum(B) − sum(A) > 0.02 ? 'positive' : (< −0.02 ? 'negative' : 'neutral')
```

---

## 5. SBS Index API

### 5.1 BAIR Engine

> **파일:** `lib/sbs-index/bair.ts`

```typescript
interface BairResult {
  bairScore: number;     // BAIR 점수
  components: {
    bsf: number;         // BSF 또는 BCF (M3×100)
    aas: number;         // AAS
    ocr: number;         // OCR 또는 M2
    swel: number;        // SWEL
  };
  upgradedToTCO: boolean; // TCO-GEO 자동 업그레이드 여부
}

class BairEngine {
  static async computeBAIR(
    workspaceId: string, 
    brandKeyword: string
  ): Promise<BairResult>;
  
  static async computeAITI(
    workspaceId: string
  ): Promise<number>;
}
```

**BAIR 수식:**
```
BAIR = BSF × AAS × (1 + OCR) × SWEL
```

**TCO-GEO 자동 업그레이드:**
- `concept_fidelity_snapshots` 존재 시: BSF → M3×100, OCR → M2

**AITI 수식:**
```
AITI = (Evidence Match Rate × 100) − (Unsafe Wording Count × 5)
```

---

### 5.2 AIPR Engine

> **파일:** `lib/sbs-index/aipr.ts`

```typescript
interface AiprEntry {
  rank: number;
  brand: string;
  bairScore: number;
  details: BairResult;
}

class AiprEngine {
  static async computeAIPR(
    workspaceId: string,
    industry: string,
    brand: string,
    competitors: string[]
  ): Promise<AiprEntry[]>;
}
```

---

### 5.3 KAIVI Engine

> **파일:** `lib/sbs-index/kaivi.ts`

```typescript
class KaiviEngine {
  static async computeKAIVI(
    workspaceId: string
  ): Promise<number>;
}
```

**수식:**
```
KAIVI = avg(산업별 Top BAIR) × avg(MRI)
```

---

## 6. Observatory Harness API

### 6.1 Eval Harness (차세대)

> **파일:** `lib/observatory/harness/eval-harness.ts`

DI(Dependency Injection) 기반 평가 하네스로, RunnerAdapter와 JudgeAdapter를 주입받아 유연한 파이프라인을 구성합니다.

```typescript
class EvalHarness {
  constructor(
    runnerAdapter: RunnerAdapter,
    judgeAdapter: JudgeAdapter
  );
  
  async run(config: EvalConfig): Promise<EvalResult>;
}
```

### 6.2 Observatory Providers

> **디렉토리:** `lib/observatory/providers/`

| Provider | 설명 | 엔진 |
|:---|:---|:---|
| `OpenAIResponsesProvider` | OpenAI Responses API | openai-responses |
| `ChatGPTSearchProvider` | ChatGPT Search API | chatgpt-search |
| `GoogleAIModeProvider` | Google AI Mode | google-ai-mode |
| `GeminiProvider` | Gemini 직접 호출 | gemini |
| `MockProvider` | 테스트용 Mock | mock |

### 6.3 Judgment System

> **파일:** `lib/observatory/judgment/judge-response.ts`

```typescript
async function judgeProbeRunWithLLM(
  workspaceId: string,
  probeRunId: string,
  providerType: 'mock' | 'openai' | 'gemini'
): Promise<void>;
```

3-way dispatch로 mock/openai/gemini 중 적절한 LLM Judge를 호출합니다.

### 6.4 Crawler Manager

> **파일:** `lib/observatory/crawlers/crawler-manager.ts`

```typescript
class DualCrawlerManager {
  async crawl(
    questions: string[],
    engines: string[]
  ): Promise<CrawlResult[]>;
}
```

ChatGPTSearch + GoogleAIMode를 동시에 사용하여 듀얼 엔진 관측을 수행합니다.

---

## 7. DB 테이블 스키마

### 7.1 관측 시스템

| 테이블 | 설명 | 주요 필드 |
|:---|:---|:---|
| `probe_panels` | Probe 패널 | id, workspace_id, name, status |
| `probe_questions` | 패널 내 질문 | id, panel_id, question_text, category |
| `ai_observation_runs` | AI 관측 실행 | id, workspace_id, status, ai_engine, run_condition |
| `probe_runs` | 개별 질문 실행 결과 | id, observation_run_id, question_id, raw_response_text |

### 7.2 Judge 결과

| 테이블 | Judge | 주요 필드 |
|:---|:---|:---|
| `response_judgments` | Legacy | brand_semantic_fidelity_score, is_citation_found, question_territory_covered, geo_concept_transferred |
| `concept_extraction_results` | Judge 1 | extracted_concepts (JSONB), extracted_relations (JSONB) |
| `fidelity_judgments` | Judge 2 | brand_concept_fidelity |
| `distortion_judgments` | Judge 3 | concept_distortion_rate, distortions (JSONB) |
| `hallucination_judgments` | Judge 4 | hallucinated_concept_rate, claims (JSONB) |
| `risk_judgments` | Judge 5 | risk_score |
| `policy_judgments` | Judge 6 | policy_alignment, violations (JSONB) |

### 7.3 스냅샷

| 테이블 | Layer | 주요 필드 |
|:---|:---:|:---|
| `metric_snapshots` | L1 | aas, ocr, bsf, qtc, gctr, ars |
| `domain_index_snapshots` | L2 | b_mri, d_mri, ops_mri, p_mri, v_mri, s_mri |
| `concept_fidelity_snapshots` | L3 | M1~M13 모든 메트릭 필드 |
| `missing_concept_gaps` | L3 | concept_id, recall_rate, gap_severity |

### 7.4 Brand SSoT

| 테이블 | 설명 | 주요 필드 |
|:---|:---|:---|
| `brand_strategic_truths` | 전략적 진실 | id, category, content, status |
| `brand_operational_truths` | 운영적 진실 | id, truth_type, content |
| `brand_truth_evidence` | 진실 근거 | id, truth_id, evidence_type, verification_status |
| `boundary_rules` | 경계 규칙 | id, rule_type, forbidden_expression |
| `brand_ontology_nodes` | 온톨로지 노드 | id, concept_label, concept_type |
| `brand_ontology_edges` | 온톨로지 엣지 | id, source_id, target_id, relation_type |
| `canonical_questions` | 표준 질문 | id, question_text, category |

### 7.5 진단/평가

| 테이블 | 설명 |
|:---|:---|
| `truth_delta_snapshots` | Truth 변경 이력 |
| `vibe_diagnoses` | Vibe 진단 결과 |
| `vibe_alignment_snapshots` | Vibe 정렬 스냅샷 |
| `persona_eval_runs` | 페르소나 평가 실행 |

---

## 8. 테스트 작성 가이드

### 8.1 디렉토리 구조

```
tests/
└── integration/
    └── ai-metrics/
        ├── layer-full-stack-e2e.test.ts   # 전체 Layer E2E (14 tests)
        └── t7-live-probe-e2e.test.ts      # T7 실측 E2E (6 tests)
```

### 8.2 Vitest 4 스타일 가이드

**timeout 시그니처 (Vitest 4):**

```typescript
// ✅ 올바른 방법 (Vitest 4)
test('long running test', { timeout: 15000 }, async () => {
  // ...
});

// ❌ 잘못된 방법 (Vitest 3, 제거됨)
test('long running test', async () => {
  // ...
}, 15000);
```

**조건부 Skip 패턴:**

```typescript
// ✅ 올바른 방법
const describeIf = process.env.AI_PROVIDER_MODE === 'openai' 
  ? describe 
  : describe.skip;

describeIf('OpenAI live tests', () => {
  // ...
});

// ❌ 잘못된 방법 (Vitest 4에서 제거됨)
describe.skipIf(!condition)('tests', () => { ... });
```

### 8.3 Mock vs Live 테스트 분리

```typescript
// 항상 실행되는 단위 테스트
describe('Pure math tests', () => {
  test('computeBMRI', () => {
    const result = computeBMRI(75, 60, 80, 70, 65, 72, 30, 0.005, 0.002);
    expect(result.value).toBeGreaterThanOrEqual(0);
    expect(result.value).toBeLessThanOrEqual(100);
  });
});

// OpenAI 키가 있을 때만 실행되는 Live 테스트
const runLive = process.env.AI_PROVIDER_MODE === 'openai' 
  && !!process.env.OPENAI_API_KEY;
const describeIf = runLive ? describe : describe.skip;

describeIf('OpenAI live tests', () => {
  test('generates live response', { timeout: 15000 }, async () => {
    const ai = getAIProvider();
    const text = await ai.generateText('Hello', { temperature: 0.1 });
    expect(text).toBeTruthy();
  });
});
```

### 8.4 테스트 실행 명령어

```powershell
# E2E 테스트 (OpenAI 실측)
$env:AI_PROVIDER_MODE='openai'
$env:OPENAI_API_KEY='sk-proj-...'
npx vitest run tests/integration/ai-metrics/layer-full-stack-e2e.test.ts --reporter=verbose

# 회귀 테스트
npx vitest run tests/integration/ai-metrics/t7-live-probe-e2e.test.ts --reporter=verbose

# Mock 모드 전체 테스트
$env:AI_PROVIDER_MODE='mock'
npx vitest run

# 특정 테스트만 실행
npx vitest run -t "computeBMRI"
```

---

> **관련 문서:**
> - [Vol.1 — 아키텍처 총론](./metrics-manual-architecture.md)
> - [Vol.2 — 지표 레퍼런스 사전](./metrics-manual-reference.md)
> - [Vol.3 — 측정 실행 매뉴얼](./metrics-manual-operations.md)
> - [Vol.4 — 결과 해석 및 활용 가이드](./metrics-manual-interpretation.md)
