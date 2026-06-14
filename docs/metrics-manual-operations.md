# BSW-OS 지표 체계 매뉴얼 Vol.3 — 측정 실행 매뉴얼

> **문서 버전**: 3.0  
> **최종 갱신**: 2026-06-01  
> **대상 독자**: Brand Strategist, Observatory Analyst, 개발자  
> **선행 문서**: Vol.1 (지표 정의), Vol.2 (아키텍처)

---

## 목차

1. [환경 설정](#1-환경-설정)
2. [AI Provider 모드별 동작 차이](#2-ai-provider-모드별-동작-차이)
3. [관측 파이프라인 실행](#3-관측-파이프라인-실행)
4. [반복 관측 (Repeated Runner)](#4-반복-관측-repeated-runner)
5. [K-Culture 평가 실행](#5-k-culture-평가-실행)
6. [드리프트 측정 (Baseline vs Intervention)](#6-드리프트-측정-baseline-vs-intervention)
7. [테스트 실행 가이드](#7-테스트-실행-가이드)
8. [비용 및 할당량 관리](#8-비용-및-할당량-관리)

---

## 1. 환경 설정

### 1.1 AI Provider 모드 개요

BSW-OS는 세 가지 AI Provider 모드를 지원합니다. 모드에 따라 텍스트 생성, 임베딩, 관측 크롤링, 시그널 마이닝의 백엔드가 전환됩니다.

| 모드 | 용도 | API 호출 | 비용 |
|------|------|----------|------|
| `mock` | 로컬 개발/테스트 | 없음 | $0 |
| `gemini` | Google Gemini 기반 실측 | Gemini API | 종량제 |
| `openai` | OpenAI 기반 실측 | OpenAI API | 종량제 |

### 1.2 환경변수 목록

| 환경변수 | 설명 | 필수 여부 | 예시 값 |
|----------|------|-----------|---------|
| `AI_PROVIDER_MODE` | AI 제공자 모드 선택 | 선택 (기본값: `mock`) | `mock` \| `gemini` \| `openai` |
| `OPENAI_API_KEY` | OpenAI API 키 | `openai` 모드 시 필수 | `sk-proj-xxxx...` |
| `GEMINI_API_KEY` | Google Gemini API 키 | `gemini` 모드 시 필수 | `AIza...` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | 필수 | `https://xxxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 서비스 역할 키 | 필수 | `eyJhbGciOiJIUzI1NiIs...` |

> **참고**: `GOOGLE_AI_API_KEY` 환경변수도 `GEMINI_API_KEY`의 대체 이름으로 사용 가능합니다.

### 1.3 `.env.local` 설정 예시

프로젝트 루트에 `.env.local` 파일을 생성합니다:

```bash
# === AI Provider 모드 ===
# mock: 로컬 테스트 (API 호출 없음)
# gemini: Google Gemini API 사용
# openai: OpenAI API 사용
AI_PROVIDER_MODE=mock

# === OpenAI (openai 모드 시) ===
OPENAI_API_KEY=sk-proj-your-api-key-here

# === Google Gemini (gemini 모드 시) ===
GEMINI_API_KEY=AIzaSy-your-api-key-here

# === Supabase (필수) ===
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 1.4 모드 전환 시 주의사항

- 모드를 전환할 때는 Next.js 개발 서버를 **반드시 재시작**해야 합니다.
- `mock` → `gemini`/`openai` 전환 시 유효한 API 키가 설정되어 있는지 확인하세요.
- API 키가 미설정된 상태로 `gemini`/`openai` 모드를 사용하면, Provider는 콘솔에 경고를 출력하고 일부 Provider는 자동으로 Mock 응답으로 폴백합니다.

---

## 2. AI Provider 모드별 동작 차이

### 2.1 Mock 모드 (`AI_PROVIDER_MODE=mock`)

**용도**: 로컬 개발 및 테스트 전용

- API 호출 **없음** — 네트워크 의존성 제로
- **결정적(deterministic) 응답** — 동일 입력에 항상 동일 출력 보장
- 임베딩: 해시 기반 768차원 결정적 벡터 생성 (단위 벡터로 정규화)
- 테스트 재현성 100% 보장

```typescript
// MockProvider는 프롬프트 키워드 기반으로 하드코딩된 응답 반환
// 예: 'retinol' + 'insight' → 고정된 ARS/OCR 관련 응답
// 예: '편의점' + 'cu' → CU 도시락 관련 한국어 고정 응답
```

### 2.2 Gemini 모드 (`AI_PROVIDER_MODE=gemini`)

**용도**: Google Gemini API 기반 실제 AI 측정

| 기능 | 모델/설정 |
|------|-----------|
| 텍스트 생성 | `gemini-2.5-flash` (temperature: 0.2) |
| 구조화 출력 | `gemini-2.5-flash` + `responseMimeType: 'application/json'` |
| SGE 관측 | `gemini-2.5-flash` + Google Search Grounding (`tools: [{ googleSearch: {} }]`) |
| ChatGPT 시뮬레이션 | `gemini-2.5-flash` (conversational AI assistant 프롬프트) |
| 임베딩 | `text-embedding-004` (768차원) |
| 시그널 마이닝 | GSC 시뮬레이션 Provider |

- SGE 관측 시 **Google Search Grounding** 기능으로 실시간 검색 결과를 시뮬레이션합니다.
- ChatGPT 엔진 관측 시 Gemini 모델에 대화형 AI 어시스턴트 역할 프롬프트를 주입하여 시뮬레이션합니다.

### 2.3 OpenAI 모드 (`AI_PROVIDER_MODE=openai`)

**용도**: OpenAI API 기반 실제 AI 측정

| 기능 | 모델/설정 |
|------|-----------|
| 텍스트 생성 | `gpt-4o-mini` (temperature: 0.2) |
| 구조화 출력 | `gpt-4o-mini` + `response_format: { type: 'json_object' }` |
| 관측 (ChatGPT) | `gpt-4o-mini` (temperature: 0.3) |
| 임베딩 | `text-embedding-3-small` (1536차원) |
| 시그널 마이닝 | `gpt-4o-mini` 기반 검색 의도 분석 |

- OpenAI 관측 Provider는 API 키 미설정 시 자동으로 Mock Provider로 폴백합니다.
- 시그널 마이닝은 AI에게 브랜드/도메인에 대한 현실적인 검색 쿼리 5개를 생성하도록 요청합니다.

### 2.4 Provider Factory 파일 위치 및 인터페이스

각 Provider는 Factory 패턴으로 구현되며, `AI_PROVIDER_MODE` 환경변수에 따라 적절한 구현체를 반환합니다.

#### Core AI Provider — `lib/ai/ai-provider.ts`

```typescript
export interface AIProvider {
  generateText(prompt: string, options?: AIProviderOptions): Promise<string>;
  generateStructuredOutput<T>(prompt: string, schema: any, options?: AIProviderOptions): Promise<T>;
}

// Factory
export function getAIProvider(): AIProvider;
```

#### Observation Provider — `lib/ai/observation-provider.ts`

```typescript
export interface ObservationProvider {
  queryEngine(question: string, engineName: string): Promise<ObservationResult>;
}

export interface ObservationResult {
  rawResponseText: string;
  engineName: string;
  latencyMs: number;
}

// Factory — engineName에 따라 SGE/ChatGPT Provider 분기
export function getObservationProvider(engineName: string): ObservationProvider;
```

#### Embedding Provider — `lib/ai/embedding-provider.ts`

```typescript
export interface EmbeddingProvider {
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}

// Factory
export function getEmbeddingProvider(): EmbeddingProvider;
```

#### Signal Mining Provider — `lib/ai/signal-mining-provider.ts`

```typescript
export interface SignalMiningProvider {
  mineSignals(domain: string): Promise<MinedSignal[]>;
}

export interface MinedSignal {
  query: string;
  volume: number;
  intent: 'informational' | 'navigational' | 'transactional' | 'local';
}

// Factory
export function getSignalMiningProvider(): SignalMiningProvider;
```

### 2.5 Provider 선택 흐름도

```
AI_PROVIDER_MODE 환경변수 확인
  ├── 'gemini'  → GeminiProvider / GeminiSgeProvider / GeminiEmbeddingProvider / GSCProvider
  ├── 'openai'  → OpenAIProvider / OpenAIChatGPTProvider / OpenAIEmbeddingProvider / OpenAISignalProvider
  └── (기본값)   → MockProvider / MockObservationProvider / MockEmbeddingProvider / MockSignalProvider
```

> **주의**: Gemini 모드에서 Observation Provider는 `engineName` 파라미터에 따라 추가 분기됩니다:
> - `'sge'` / `'google'` 포함 → `GeminiSgeProvider` (Search Grounding 활성)
> - `'chat'` / `'openai'` / `'gpt'` 포함 → `ChatGPTProvider` (대화형 시뮬레이션)

---

## 3. 관측 파이프라인 실행

전체 관측 파이프라인은 7단계로 구성됩니다. 각 단계는 순차적으로 실행해야 합니다.

### Step 1: Probe Panel 생성 및 질문 등록

Probe Panel은 측정 대상 질문들을 묶는 버전 관리 단위입니다.

```typescript
import {
  createProbePanel,
  createProbeQuestion,
  lockProbePanelVersion
} from '@/app/actions/observatory';

// 1-1. 패널 생성
const panel = await createProbePanel(workspaceId, {
  panel_name: "스킨케어 AEO 패널 v1",
  slug: "skincare-aeo-panel-v1",
  description: "레티놀/스쿠알란 관련 AI 관측 질문 세트",
  version: "1.0",
  is_locked: false
});

// 1-2. 질문 등록
await createProbeQuestion(workspaceId, {
  probe_panel_id: panel.id,
  question_text: "민감성 피부에 적합한 레티놀 제품은 무엇인가요?",
  intent_context: "informational",
  target_keyword: "레티놀 스킨케어"
});

await createProbeQuestion(workspaceId, {
  probe_panel_id: panel.id,
  question_text: "스쿠알란 세럼의 효능은 무엇인가요?",
  intent_context: "informational",
  target_keyword: "스쿠알란 세럼"
});

// 1-3. 패널 잠금 (잠금 후 질문 수정 불가!)
await lockProbePanelVersion(workspaceId, panel.id);
```

> **⚠️ 중요**: 패널을 잠그지 않으면 관측 실행(Step 2)이 불가능합니다. 잠금은 통계적 재현성을 보장하기 위한 필수 절차입니다.

### Step 2: AI Observation Run 생성

```typescript
import { startObservationRun } from '@/app/actions/observatory';

const observationRun = await startObservationRun(
  workspaceId,
  panel.id,
  "Baseline Observation Run - 2026-06-01"
);
// observationRun.run_status === 'candidate'
```

### Step 3: 관측 실행 (ObservationProvider로 AI 응답 수집)

```typescript
import { getObservationProvider } from '@/lib/ai/observation-provider';

const sgeProvider = getObservationProvider('google-sge');
const chatProvider = getObservationProvider('chatgpt');

// 각 질문에 대해 엔진별 관측 수행
for (const question of questions) {
  const sgeResult = await sgeProvider.queryEngine(
    question.question_text,
    'google-sge'
  );
  // sgeResult.rawResponseText: AI 응답 원문
  // sgeResult.latencyMs: 응답 지연 시간 (ms)

  const chatResult = await chatProvider.queryEngine(
    question.question_text,
    'chatgpt'
  );

  // 결과를 probe_runs 테이블에 저장
  // (실제 구현은 createMockProbeRunResult 또는 직접 Supabase insert)
}
```

### Step 4: Judge Pipeline 실행 (6-Judge 평가)

Judge Pipeline은 6개의 독립 평가 Judge로 구성됩니다:

```typescript
import { JudgePipeline } from '@/lib/judges/judge-pipeline';

const pipeline = new JudgePipeline();

// 개별 probe run에 대해 실행
const result = await pipeline.runForProbeRun(workspaceId, probeRunId);

// 또는 observation run 전체에 대해 일괄 실행
await pipeline.runForObservationRun(
  workspaceId,
  observationRun.id,
  (completed, total) => {
    console.log(`진행률: ${completed}/${total}`);
  }
);
```

**6-Judge 파이프라인 순서:**

| # | Judge | 역할 | 의존성 |
|---|-------|------|--------|
| 1 | ConceptExtractorJudge | AI 응답에서 핵심 개념 추출 | 없음 (최상위) |
| 2 | FidelityJudge | 브랜드 SSoT 충실도 평가 | #1 결과 필요 |
| 3 | DistortionJudge | 의미 왜곡 탐지 | #1 결과 필요 |
| 4 | HallucinationJudge | 환각(hallucination) 탐지 | #1 결과 필요 |
| 5 | RiskJudge | 다크 패턴/위험 표현 탐지 | 독립 |
| 6 | PolicyJudge | 정책 준수 여부 판정 | 독립 |

> **구현 위치**: `lib/judges/judge-pipeline.ts`  
> **주의**: ConceptExtractorJudge(#1)가 실패하면 #2~#4 Judge는 실행 불가합니다. #5, #6은 독립 실행 가능합니다.

### Step 5: computeMetricSnapshot (Layer 1 지표 산출)

Observation Run 완료 후 Layer 1 개별 지표를 산출합니다.

```typescript
import { computeMetricSnapshot } from '@/app/actions/observatory';

const snapshots = await computeMetricSnapshot(workspaceId, observationRun.id);
// 반환: AAS, OCR, BSF, QTC, GCTR, ARS 6개 지표 스냅샷 배열
```

**산출되는 지표:**

| 지표 | 전체 이름 | 산출 공식 |
|------|-----------|-----------|
| AAS | AI Answer Share | `(브랜드 언급 응답 수 / 전체 응답 수) × 100` |
| OCR | Official Citation Rate | `(공식 인용 포함 응답 수 / 전체 응답 수) × 100` |
| BSF | Brand Semantic Fidelity | `Σ(fidelity_score) / 판정 건수` |
| QTC | Question Territory Coverage | `(영역 커버 응답 수 / 전체 응답 수) × 100` |
| GCTR | GEO Concept Transfer Rate | `(개념 전이 응답 수 / 전체 응답 수) × 100` |
| ARS | AEO Readiness Score | `AAS×0.2 + OCR×0.2 + BSF×0.3 + QTC×0.1 + GCTR×0.2` |

> **참고**: `completeObservationRun()` 호출 시 `computeMetricSnapshot()`이 자동 실행됩니다.

### Step 6: computeDomainIndexSnapshot (Layer 2 MRI 산출)

Layer 1 지표를 기반으로 도메인별 MRI(Metric Readiness Index) 복합 지표를 산출합니다.

```typescript
import { computeDomainIndexSnapshot } from '@/app/actions/observatory';

const mriSnapshot = await computeDomainIndexSnapshot(
  workspaceId,
  definitionId,  // null 전달 시 기본 MRI Definition 자동 생성
  observationRun.id
);

// 반환 결과의 details 객체 구조:
// {
//   OPS_MRI: number,       // Operations MRI (Truth Delta + Vibe 기반)
//   B_MRI: number,         // Brand MRI (경쟁사 AAS 대비)
//   D_MRI: number,         // Distribution MRI
//   P_MRI: number,         // Persona MRI
//   V_MRI: number,         // Vibe MRI
//   TCO_GEO: number,       // GEO Concept Transfer
//   S_MRI: number,         // Strategy MRI = ARS×0.4 + BSF×0.3 + QTC×0.3
//   confidence: number,    // 신뢰 수준 (60 or 95)
//   volatility: number,    // 변동성 (5개 이상 스냅샷 필요)
// }
```

> **주의**: 변동성(volatility) 계산은 **최소 5개 이상의 metric snapshot**이 필요합니다. 부족 시 경고 메시지가 포함됩니다.

### Step 7: BAIR/AITI/AIPR/KAIVI 산출 (Layer 5)

Layer 5 최상위 전략 지수는 Layer 1~4 지표를 종합하여 산출됩니다.

| 지수 | 전체 이름 | 설명 |
|------|-----------|------|
| BAIR | Brand AI Readiness Index | 브랜드 AI 준비도 종합 지수 |
| AITI | AI Trust Index | AI 신뢰도 지수 |
| AIPR | AI Performance Rating | AI 성과 평가 |
| KAIVI | K-Culture AI Value Index | K-Culture AI 가치 지수 |

이 지수들은 하위 Layer의 MRI 및 개별 지표가 모두 산출된 후에 계산 가능합니다. 전체 파이프라인 실행 순서:

```
Layer 1 (개별 지표) → Layer 2 (MRI) → Layer 3 (카테고리) → Layer 4 (도메인) → Layer 5 (전략 지수)
```

---

## 4. 반복 관측 (Repeated Runner)

### 4.1 목적

반복 관측은 다음 지표를 측정하기 위해 동일 질문을 여러 차례 관측합니다:

| 지표 | 코드 | 설명 |
|------|------|------|
| Attractor Stability | M7 | AI 응답의 수렴 안정성 |
| Consensus | M11 | 반복 응답 간 합의도 |
| Variance | M12 | 응답 변동폭 |

### 4.2 사용법

```typescript
import { RepeatedRunner } from '@/lib/experiments/repeated-runner';

const runner = new RepeatedRunner();

const result = await runner.run(
  workspaceId,    // 워크스페이스 ID
  panelId,        // Probe Panel ID (잠금 상태여야 함)
  repetitions,    // 반복 횟수 (권장: 5~10)
  condition       // 'baseline' | 'intervention'
);

// result.observationRunId: 생성된 관측 실행 ID
// result.totalRuns: 실행된 총 probe run 수 (질문 수 × 반복 횟수)
```

### 4.3 내부 동작 흐름

```
1. probe_questions 조회 (panelId 기준)
2. ai_observation_runs 생성 (condition, repetitions 메타데이터 포함)
3. 반복 루프:
   for rep = 1..repetitions:
     for question in questions:
       a. AI 텍스트 생성 (getAIProvider().generateText)
       b. probe_runs 레코드 삽입 (repetition_index 메타데이터 포함)
       c. JudgePipeline.runForProbeRun() 실행
4. ai_observation_runs 상태 → 'completed'
```

### 4.4 구현 위치

`lib/experiments/repeated-runner.ts`

### 4.5 권장 설정

| 파라미터 | 권장 값 | 비고 |
|----------|---------|------|
| `repetitions` | **5~10회** | 5회 미만: 통계적 유의성 부족, 10회 초과: 비용 급증 |
| `condition` | `baseline` 먼저, 이후 `intervention` | 드리프트 측정 시 양쪽 모두 실행 |

### 4.6 Mock vs 실제 모드 차이

- **Mock 모드**: 약간의 변동이 포함된 결정적 응답 (3개 변형 문장 중 순환 선택)
- **Gemini/OpenAI 모드**: 실제 API 호출로 자연스러운 응답 변동 관측

```typescript
// Mock 모드의 변동 시뮬레이션 로직
const varianceIndicators = [
  'PureBarrier retinol serum restores skin barrier health safely.',
  'Our clinically tested formula is designed for sensitive skin.',
  'Consult a dermatologist for optimal squalane usage.',
];
const varianceText = varianceIndicators[
  (rep + question.question_text.length) % varianceIndicators.length
];
```

---

## 5. K-Culture 평가 실행

### 5.1 목적

K-Culture 평가는 한국 문화 콘텐츠의 AI 표현 품질을 측정합니다. 주요 평가 지표:

| 지표 | 코드 | 설명 |
|------|------|------|
| Cross-Cultural Resonance | M14 | 문화 간 공명도 |
| Commercial Transferability | M15 | 상업적 전이 가능성 |

### 5.2 사용법

```typescript
import { runKCultureEvaluation } from '@/app/actions/kculture-eval';

const snapshot = await runKCultureEvaluation(
  workspaceId,     // 워크스페이스 ID
  domainPackId,    // Domain Pack ID (예: K-beauty, K-food)
  condition        // 'baseline' | 'intervention'
);
```

### 5.3 실행 흐름 상세

```
1. Domain Pack 조회 → default_qbs_templates 추출
2. QBS 질문 시딩 (probe_questions 테이블에 없으면 자동 생성)
3. AI Observation Run 생성 (상태: 'running')
4. 질문별 루프:
   a. AI 응답 생성:
      - baseline: 일반 AI 어시스턴트 프롬프트
      - intervention: K-Culture SSoT 지침 준수 프롬프트
   b. probe_runs 저장
   c. Cultural SSoT Context 빌드
   d. Cultural 6-Judge 파이프라인 실행:
      (1) ConceptExtractor → (2) Fidelity → (3) Distortion
      → (4) Hallucination → (5) Risk → (6) Policy
5. CulturalMetricsAggregator로 M1~M10, M14, M15 집계
6. Observation Run 상태 → 'completed'
7. OpportunityEngine으로 자동 기회 발굴 및 cultural_opportunities 저장
```

### 5.4 Cultural Judge Pipeline

K-Culture 평가는 전용 Cultural Judge Provider를 사용합니다:

```typescript
// Cultural 6-Judge 호출 순서
await CulturalJudgeProvider.runConceptExtractor(workspaceId, probeRunId, context, responseText);
await CulturalJudgeProvider.runFidelity(workspaceId, probeRunId, extractionId, context, concepts, responseText);
await CulturalJudgeProvider.runDistortion(workspaceId, probeRunId, extractionId, context, responseText);
await CulturalJudgeProvider.runHallucination(workspaceId, probeRunId, extractionId, context, responseText);
await CulturalJudgeProvider.runRisk(workspaceId, probeRunId, context, responseText);
await CulturalJudgeProvider.runPolicy(workspaceId, probeRunId, context, responseText);
```

### 5.5 Baseline vs Intervention 프롬프트 차이

**Baseline** (SSoT 미적용):
```
다음 질문에 대해 일반적인 AI 어시스턴트로서 한국어로 답변하세요: {질문}
```

**Intervention** (SSoT 적용):
```
다음 질문에 대해 K-Culture SSoT 공식 지침을 준수하여 한국어로 정확하게 답변하세요.
과장된 신비주의 표현을 지양하고, 과학적 근거와 전통 발효 기법의 영양학적 근거를
포함하세요: {질문}
```

### 5.6 구현 위치

- 메인 함수: `app/actions/kculture-eval.ts`
- Cultural Judge: `lib/judges/cultural-judge-provider.ts`
- Context Builder: `lib/judges/cultural-ssot-context-builder.ts`
- Metrics Aggregator: `lib/metrics/cultural-metrics-aggregator.ts`
- Opportunity Engine: `lib/kculture/opportunity-engine.ts`

---

## 6. 드리프트 측정 (Baseline vs Intervention)

### 6.1 개념

드리프트 측정은 SSoT(Single Source of Truth) 적용 **전후**의 AI 응답 품질 변화를 정량적으로 측정합니다.

| 조건 | 설명 |
|------|------|
| `baseline` | SSoT 적용 **전** AI 응답 (일반 모드) |
| `intervention` | SSoT 적용 **후** AI 응답 (브랜드 가이드라인 주입) |

### 6.2 M8 (Drift Score) 측정 절차

```
1. 동일 Probe Panel 사용 (same-panel 필수!)
2. Baseline 관측 실행 → ARS 산출
3. Intervention 관측 실행 → ARS 산출
4. SWEL (Semantic Website Experience Lift) 계산:
   Drift Score = intervention_ARS - baseline_ARS
```

### 6.3 Semantic Website Lift Snapshot 생성

```typescript
import { createSemanticWebsiteLiftSnapshot } from '@/app/actions/observatory';

const lift = await createSemanticWebsiteLiftSnapshot(
  workspaceId,
  baselineRunId,      // baseline observation run ID
  interventionRunId   // intervention observation run ID
);

// lift.lift_metrics = {
//   base_ars: 45.20,      // baseline ARS
//   active_ars: 87.60,    // intervention ARS
//   swel_lift: 42.40      // 개선 효과 (delta)
// }
```

### 6.4 Same-Panel 제약 조건

> **⛔ NON-NEGOTIABLE**: Baseline과 Intervention 관측은 반드시 **동일한 Probe Panel** 을 사용해야 합니다. 다른 패널을 사용하면 `createSemanticWebsiteLiftSnapshot`이 에러를 발생시킵니다:
>
> ```
> "Semantic Lift Snapshot Blocked: Base and active observation runs must utilize
> the exact same panel version to maintain statistical integrity."
> ```

### 6.5 드리프트 측정 전체 워크플로우

```bash
# Step 1: Baseline 관측 (mock 테스트)
AI_PROVIDER_MODE=mock

# Step 2: Intervention 관측 (SSoT 적용)
AI_PROVIDER_MODE=mock  # 또는 gemini/openai

# Step 3: 양쪽 모두 computeMetricSnapshot 실행
# Step 4: createSemanticWebsiteLiftSnapshot으로 비교
```

---

## 7. 테스트 실행 가이드

### 7.1 E2E 전체 스택 테스트

Layer 1~5 전체 파이프라인을 검증하는 통합 테스트입니다.

```powershell
# OpenAI 모드로 실제 API 호출 테스트
$env:AI_PROVIDER_MODE="openai"
npx vitest run tests/integration/ai-metrics/layer-full-stack-e2e.test.ts
```

```bash
# Linux/macOS
AI_PROVIDER_MODE=openai npx vitest run tests/integration/ai-metrics/layer-full-stack-e2e.test.ts
```

> **주의**: E2E 테스트는 실제 API 호출을 수행하므로 비용이 발생합니다. 프로덕션 API 키 사용 시 주의하세요.

### 7.2 라이브 프로브 회귀 테스트

실시간 프로브 관측 파이프라인의 회귀 테스트입니다.

```powershell
# 회귀 테스트 실행
npx vitest run tests/integration/ai-metrics/t7-live-probe-e2e.test.ts
```

```bash
# Linux/macOS
npx vitest run tests/integration/ai-metrics/t7-live-probe-e2e.test.ts
```

### 7.3 Mock 모드 전체 테스트

API 비용 없이 전체 테스트 스위트를 실행합니다.

```powershell
# Mock 모드 (기본값)
$env:AI_PROVIDER_MODE="mock"
npx vitest run
```

```bash
# Linux/macOS
AI_PROVIDER_MODE=mock npx vitest run
```

### 7.4 개별 단위 테스트

```powershell
# 비즈니스 메트릭 테스트
npx vitest run tests/unit/business-metrics.test.ts

# MRI 메트릭 테스트
npx vitest run tests/unit/mri-metrics.test.ts

# Observatory 전체 테스트
npx vitest run tests/unit/observatory.test.ts

# Confidence/Volatility 테스트
npx vitest run tests/unit/confidence-volatility.test.ts

# ARS 측정 테스트
npx vitest run tests/integration/ai-metrics/t2-ars-measurement.test.ts
```

### 7.5 테스트 환경변수 설정 (PowerShell)

```powershell
# 환경변수 설정 후 테스트 실행 (한 세션 내)
$env:AI_PROVIDER_MODE="openai"
$env:OPENAI_API_KEY="sk-proj-your-key"
$env:NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

npx vitest run
```

### 7.6 테스트 모드 선택 가이드

| 상황 | 권장 모드 | 명령어 |
|------|-----------|--------|
| 일상 개발/PR 검증 | `mock` | `npx vitest run` |
| API 통합 검증 | `openai` 또는 `gemini` | `$env:AI_PROVIDER_MODE="openai"; npx vitest run` |
| CI/CD 파이프라인 | `mock` | 환경변수 없이 기본 실행 |
| 비용 추적 검증 | `openai` | 제한된 테스트 파일만 실행 |

---

## 8. 비용 및 할당량 관리

### 8.1 API 호출 비용 예상

#### OpenAI 가격 (2026년 기준 참고)

| 모델 | 용도 | 입력 가격 | 출력 가격 |
|------|------|-----------|-----------|
| `gpt-4o-mini` | 텍스트 생성, 관측, 시그널 마이닝 | ~$0.15 / 1M tokens | ~$0.60 / 1M tokens |
| `text-embedding-3-small` | 임베딩 (1536d) | ~$0.02 / 1M tokens | — |

#### 비용 시나리오 예시

| 시나리오 | 예상 API 호출 수 | 예상 비용 |
|----------|-----------------|-----------|
| 10개 질문 × 1회 관측 + Judge | ~70 호출 | ~$0.05 |
| 10개 질문 × 10회 반복 관측 + Judge | ~700 호출 | ~$0.50 |
| K-Culture 평가 (20개 질문, baseline+intervention) | ~280 호출 | ~$0.20 |
| 일일 정기 관측 (50개 질문) | ~350 호출 | ~$0.25 |

#### Gemini 가격

Gemini API는 Google Cloud 요금 체계를 따르며, `gemini-2.5-flash` 및 `text-embedding-004`의 가격은 Google AI Studio에서 확인하세요.

### 8.2 Cost Tracker

일일 API 비용 한도를 추적하고 초과를 방지합니다.

**구현 위치**: `lib/observatory/crawlers/cost-tracker.ts`

```typescript
import { CostTracker } from '@/lib/observatory/crawlers/cost-tracker';

const tracker = new CostTracker();

// 현재 일일 누적 비용 조회
const dailyCost = await tracker.getDailyCost();

// API 호출 비용 기록
const updatedCost = await tracker.trackCost(0.003); // $0.003

// 예산 초과 여부 확인
const exceeded = await tracker.isBudgetExceeded();
if (exceeded) {
  console.warn('일일 API 예산 $50.00 초과!');
}

// 일일 한도 커스터마이즈
tracker.setDailyLimit(100.00); // $100로 변경

// 테스트 정리 시 리셋
await tracker.resetCostTracker();
```

**주요 설정:**

| 항목 | 기본값 | 설명 |
|------|--------|------|
| 일일 예산 한도 | `$50.00` | `setDailyLimit()`으로 조정 가능 |
| 추적 파일 경로 | `{cwd}/scratch/crawler-cost-tracker.json` | 일별 자동 리셋 |
| 비용 정밀도 | 소수점 6자리 | `parseFloat(toFixed(6))` |

### 8.3 Rate Limiter

API Rate Limit 초과를 방지하기 위한 요청 간격 제어 및 자동 재시도 유틸리티입니다.

**구현 위치**: `lib/observatory/crawlers/rate-limiter.ts`

```typescript
import { RateLimiter } from '@/lib/observatory/crawlers/rate-limiter';

// 초당 5회 요청 제한 (기본값)
const limiter = new RateLimiter(5);

// 수동 대기 (최소 간격 보장)
await limiter.wait();

// 자동 재시도 + 지수 백오프
const result = await limiter.withRetry(
  async () => {
    // API 호출 로직
    return await fetchFromAPI();
  },
  3,      // 최대 재시도 횟수 (기본값: 3)
  500     // 초기 지연 시간 ms (기본값: 500)
);
```

**지수 백오프 스케줄:**

| 시도 | 지연 시간 |
|------|-----------|
| 1차 재시도 | 500ms |
| 2차 재시도 | 1,000ms |
| 3차 재시도 | 2,000ms |

### 8.4 비용 절감 전략

1. **개발 시 `mock` 모드 사용**: 일상 개발과 단위 테스트에서는 API 호출을 완전히 차단합니다.
2. **반복 횟수 최적화**: `RepeatedRunner`의 반복 횟수를 5~10회 내로 유지합니다.
3. **Rate Limiter 활용**: 모든 실제 API 호출에 `RateLimiter.withRetry()`를 적용하여 429 에러로 인한 낭비를 방지합니다.
4. **Cost Tracker 모니터링**: 일일 예산 한도를 프로젝트 예산에 맞게 설정하고, `isBudgetExceeded()` 체크를 파이프라인 진입점에 삽입합니다.
5. **점진적 모드 전환**: `mock` → `gemini` → `openai` 순서로 검증 범위를 점진적으로 확대합니다.

---

## 부록: Quick Reference 명령어 모음

```powershell
# ===== 환경 설정 =====
$env:AI_PROVIDER_MODE="mock"            # Mock 모드
$env:AI_PROVIDER_MODE="gemini"          # Gemini 모드
$env:AI_PROVIDER_MODE="openai"          # OpenAI 모드

# ===== 테스트 실행 =====
npx vitest run                                                              # 전체 테스트 (mock)
npx vitest run tests/unit/observatory.test.ts                               # Observatory 단위 테스트
npx vitest run tests/unit/mri-metrics.test.ts                               # MRI 메트릭 테스트
npx vitest run tests/unit/business-metrics.test.ts                          # 비즈니스 메트릭 테스트
npx vitest run tests/unit/confidence-volatility.test.ts                     # 신뢰도/변동성 테스트
npx vitest run tests/integration/ai-metrics/t2-ars-measurement.test.ts      # ARS 측정 테스트
npx vitest run tests/integration/ai-metrics/t7-live-probe-e2e.test.ts       # 라이브 프로브 회귀
npx vitest run tests/integration/ai-metrics/layer-full-stack-e2e.test.ts    # 전체 스택 E2E
npx vitest run tests/integration/trace-loop.test.ts                         # Trace Loop 테스트

# ===== 개발 서버 =====
npm run dev                             # Next.js 개발 서버 시작
```

---

> **면책 조항**: 본 문서에 포함된 모든 AI 관측 지표는 패널 기반 프록시이며, 실제 시장 점유율이나 AI 선호도를 나타내지 않습니다. 모든 보고서에는 방법론 공시(Methodology Disclosure)와 프록시 경고문(Proxy Caveat)이 반드시 포함되어야 합니다.
