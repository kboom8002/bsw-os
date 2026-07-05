# BSW-OS QIS/CQ 수집·분석 시스템 체계 정리 및 GENESIS 연계 현황

> **Version:** 1.0 | 2026-06-26
> **목적:** BSW-OS의 QIS(Question Intelligence System)/CQ(Canonical Question) 수집 기능을 체계적으로 정리하고, aihompyhub 연계 현황 및 마무리 작업을 식별

---

## 1. BSW-OS QIS/CQ 시스템 아키텍처

```
┌─────────────────────────── BSW-OS ───────────────────────────┐
│                                                               │
│  ┌─────────────────┐    ┌──────────────────┐                 │
│  │ Signal Collector │    │ Surface Reverse  │                 │
│  │ (Hub Pull)       │    │ Engineering      │                 │
│  │                  │    │                  │                 │
│  │ • KWeddingHub    │    │ • EntityExtract  │                 │
│  │   Collector      │    │ • AnswerCard     │                 │
│  │ • QisHubClient   │    │   Reverser       │                 │
│  │   (범용)         │    │ • ProbeGenerator │                 │
│  └────────┬─────────┘    └────────┬─────────┘                 │
│           │                       │                           │
│           ▼                       ▼                           │
│  ┌─────────────────────────────────────────┐                 │
│  │ Question Predictor (S-OGDE v2.0)        │                 │
│  │ • Signal → PredictedQuestion 변환       │                 │
│  │ • YMYL Safety 파생 질문 생성            │                 │
│  │ • Comparison 파생 질문 생성             │                 │
│  │ • 5-tier Expected Layer 자동 부여       │                 │
│  │ • AI Coverage 판정                      │                 │
│  │ • First-Mover Window 산출               │                 │
│  └────────┬────────────────────────────────┘                 │
│           │                                                   │
│           ▼                                                   │
│  ┌─────────────────────────────────────────┐                 │
│  │ QIS Cross Mapper                         │                 │
│  │ • Jaccard(0.4) + Cosine(0.6) 하이브리드  │                 │
│  │ • Goldilocks Threshold ≥ 0.35           │                 │
│  │ • both / industry_only / site_only 분류  │                 │
│  └────────┬────────────────────────────────┘                 │
│           │                                                   │
│           ▼                                                   │
│  ┌─────────────────────────────────────────┐                 │
│  │ QIS Hub Client (Push)                    │                 │
│  │ • pushPredictedQuestions → Hub           │                 │
│  │ • Accuracy Tracker (Elo 학습)            │                 │
│  └─────────────────────────────────────────┘                 │
│                                                               │
│  ── External APIs ──                                          │
│  GET  /api/v1/qis/predictions   (Hub → BSW 예측 조회)        │
│  POST /api/v1/qis/feedback      (Hub → BSW 피드백 수신)      │
│  GET  /api/cron/qis-sync        (일일 3AM 자동 동기화)        │
└───────────────────────────────────────────────────────────────┘
```

---

## 2. BSW-OS 모듈별 상세 정리

### 2.1 데이터 수집 모듈 (Pull)

| 파일 | 구현 상태 | 역할 |
|------|---------|------|
| [kweddinghub-collector.ts](file:///c:/Users/User/bsw/lib/prediction/signal-collectors/kweddinghub-collector.ts) | ✅ 완료 | Hub `/api/v1/qis/signals`에서 신호 수집 → `EmergenceSignal[]` 변환 |
| [hub-client.ts](file:///c:/Users/User/bsw/lib/qis/hub-client.ts) | ✅ 완료 | 범용 Hub 클라이언트 — `pullMetrics()`, `pullExpectedLayers()`, `pushPredictedQuestions()` |
| [qis-sync/route.ts](file:///c:/Users/User/bsw/app/api/cron/qis-sync/route.ts) | ✅ 완료 | 일일 Cron (3AM) — Pull 신호+메트릭+레이어 → Push 예측 |

**수집하는 데이터 (19종 신호 유형):**
```
community_question, verified_review, price_report, stress_pattern,
deal_room_contract, deal_room_price, style_dna_trend, event_intent,
newlywed_lifecycle, family_conflict, sentiment_pattern, deal_contract,
deal_price, trend_signal, intent_signal, lifecycle_event,
conflict_pattern, entity_created, entity_reviewed, comparison_requested
```

**수집하는 메트릭 (8종):**
```
question_frequency, conversion_rate, average_transaction,
stress_seasonal, question_emergence, ai_visibility_score,
probe_citation_rate, sentiment_seasonal
```

### 2.2 질문 예측 모듈

| 파일 | 구현 상태 | 역할 |
|------|---------|------|
| [question-predictor.ts](file:///c:/Users/User/bsw/lib/prediction/question-predictor.ts) | ✅ 완료 | Signal → PredictedQuestion 변환, YMYL/비교 파생, AI Coverage 체크 |
| [accuracy-tracker.ts](file:///c:/Users/User/bsw/lib/prediction/accuracy-tracker.ts) | ✅ 완료 | 예측 정확도 추적, 베이지안 가중치 재캘리브레이션, 부문별 리포트 |
| [qis-shared-schemas.ts](file:///c:/Users/User/bsw/lib/qis-shared-schemas.ts) | ✅ 완료 | 6개 Zod 스키마 (Signal, Batch, Prediction, Metrics, ExpectedLayer, Feedback) |

**질문 예측 프로세스:**
```
Signal (impact: critical/high/medium/low)
  → confidence 산출: critical=0.95, high=0.85, medium=0.70, low=0.50
  → 기본 예측 질문 생성 (업종 템플릿 레지스트리)
  → YMYL 안전 파생 질문 (confidence × 0.9)
  → 비교 파생 질문 (confidence × 0.85)
  → 5-tier Expected Layer 자동 부여
  → AI Coverage 판정 (DB probe + 키워드 휴리스틱)
  → First-Mover Window 산출 (14/30/60/90일)
  → predicted_questions 테이블 저장
```

### 2.3 교차 매핑 모듈

| 파일 | 구현 상태 | 역할 |
|------|---------|------|
| [qis-cross-mapper.ts](file:///c:/Users/User/bsw/lib/surface/qis-cross-mapper.ts) | ✅ 완료 | 업종 QIS 패널 × 사이트 프로브 교차 매핑 |
| [probe-generator.ts](file:///c:/Users/User/bsw/lib/surface/probe-generator.ts) | ✅ 완료 | Answer Card → 프로브 질문 생성 (Rule-based + AI) |

**교차 매핑 알고리즘:**
```
유사도 = Jaccard(0.4) + CosineSimilarity(0.6) + KeywordBonus(0.25)
매칭 임계값: ≥ 0.35 (Goldilocks Threshold)

결과 분류:
  both          = 업종 QIS ∩ 사이트 프로브 → 기존 커버리지
  industry_only = 업종 QIS에만 존재 → RED 콘텐츠 갭
  site_only     = 사이트에만 존재 → GREEN 고유 강점
```

### 2.4 Canonical Question (CQ) 모듈

| 파일 | 구현 상태 | 역할 |
|------|---------|------|
| [schema.ts](file:///c:/Users/User/bsw/lib/schema.ts) (L297-323) | ✅ 완료 | `canonicalQuestionSchema` + `qisSceneSchema` Zod 정의 |
| [semantic.ts](file:///c:/Users/User/bsw/app/actions/semantic.ts) | ✅ 완료 | `createCanonicalQuestion`, `mergeCanonicalQuestions`, `createQisScene`, `updateQisScene` |
| [0003_semantic_core.sql](file:///c:/Users/User/bsw/db/migrations/0003_semantic_core.sql) | ✅ 완료 | `canonical_questions` + `qis_scenes` 테이블 |

**CQ 데이터 구조:**
```typescript
CanonicalQuestion {
  id: UUID
  workspace_id: UUID
  normalized_question: string     // 정규화된 질문 텍스트
  slug: string                    // URL-safe 슬러그
  signature: string (SHA-256)     // 중복 방지 해시
  question_capital_node_id?: UUID // QC 노드 연결
}

QisScene {
  id: UUID
  workspace_id: UUID
  canonical_question_id: UUID     // FK → CQ
  scene_name: string              // 시나리오명
  query_template: string          // 검색 쿼리 패턴
  intent_model: string            // 의도 모델
  scenario_context: string        // 시나리오 맥락
  risk_level: low|medium|high|critical
}
```

**CQ 연결 지점:**
- `ReversedAnswerCard.linked_canonical_question_id` → CQ FK
- `ReversedAnswerCard.linked_qis_scene_ids` → QIS Scene UUID[]
- `SurfaceGapAnalysis.industry_qis_layer` → L1~L7 계층
- `deep_dive_target_questions.registered_cq_id` → CQ FK
- `deep_dive_content_blueprints.target_cq_id` → CQ FK

### 2.5 외부 API 모듈

| 엔드포인트 | 방향 | 구현 상태 | 역할 |
|----------|------|---------|------|
| `GET /api/v1/qis/predictions` | Hub→BSW | ✅ 완료 | Hub가 예측 질문 조회 (min_confidence, limit) |
| `POST /api/v1/qis/feedback` | Hub→BSW | ✅ 완료 | Hub가 출현 피드백 전송 (emerged, emerged_at, actual_frequency) |
| `GET /api/cron/qis-sync` | BSW 내부 | ✅ 완료 | 일일 자동 Pull+Push |

### 2.6 DB 테이블 (QIS 전용)

| 테이블 | 마이그레이션 | 역할 |
|--------|-----------|------|
| `canonical_questions` | 0003 | CQ 마스터 |
| `qis_scenes` | 0003 | CQ별 검색 시나리오 |
| `emergence_signals` | 0017 | 수신 신호 원본 |
| `predicted_questions` | 0017 | 예측 질문 + 정확도 + Expected Layer |
| `question_value_scores` | 0017 | QVS 점수 |
| `bsw_received_signals` | 0010 | Hub에서 수신한 신호 |
| `bsw_predicted_questions` | 0010 | Hub에 Push한 예측 질문 |
| `bsw_expected_layers` | 0010 | Hub에서 수신한 기대 레이어 |
| `bsw_received_metrics` | 0010 | Hub에서 수신한 실제 메트릭 |

---

## 3. aihompyhub 연계 현황

### 3.1 aihompyhub QIS 모듈 목록

| 파일 | 역할 | BSW 연계 |
|------|------|---------|
| [bsw-client.ts](file:///c:/Users/User/aihompyhub/apps/web/lib/qis/bsw-client.ts) | BSW 신호 전송 클라이언트 | ⚠️ **`sendSignalToBsw` 만 구현, `pullBswPredictions` 미구현** |
| [canonicalizer.ts](file:///c:/Users/User/aihompyhub/apps/web/lib/qis/canonicalizer.ts) | 커뮤니티 질문 → CQ 클러스터링 (Gemini) | 간접 (CQ 생성 후 BSW에 신호 전송 가능) |
| [miner.ts](file:///c:/Users/User/aihompyhub/apps/web/lib/qis/miner.ts) | 레거시 텍스트 → Q&A 역산출 (Gemini) | 간접 (마이닝 결과가 콘텐츠 자산으로) |
| [dedupPipeline.ts](file:///c:/Users/User/aihompyhub/apps/web/lib/qis/dedupPipeline.ts) | 마이닝 결과 중복 검사 (Jaccard) | 없음 (내부) |
| [missionCreator.ts](file:///c:/Users/User/aihompyhub/apps/web/lib/qis/missionCreator.ts) | 마이닝 결과 → Mission Board 미션 생성 | 없음 (내부) |
| [goldenSetManager.ts](file:///c:/Users/User/aihompyhub/apps/web/lib/qis/goldenSetManager.ts) | Golden Set (VQS 85+ 우수 답변) 관리 | 없음 (내부) |

### 3.2 aihompyhub QIS API 엔드포인트

| 엔드포인트 | 역할 | BSW 연계 |
|----------|------|---------|
| `POST /api/v1/qis/canonicalize` | CQ 배치 클러스터링 | 없음 (내부 Cron) |
| `GET /api/v1/qis/golden-sets` | 우수 답변 세트 조회 | 없음 (내부) |
| `POST /api/v1/qis/mine-legacy` | 레거시 텍스트 마이닝 | 없음 (내부) |
| `GET /api/v1/tenant/qis/gap-matrix` | QIS 갭 매트릭스 (Intent×Stage) | 간접 (BSW 역설계 갭과 동기 가능) |
| `POST /api/v1/tenant/qis/link-content` | 콘텐츠↔QIS 클러스터 연결 | 없음 (내부) |
| `POST /api/v1/factory/qis-probe` | Gemini로 AI 인용 여부 프로빙 | **직접 대응 — BSW ProbeGenerator 결과와 동기 가능** |
| `POST /api/v1/factory/qis-provision` | QIS 클러스터 초기 프로비저닝 | 간접 |
| `POST /api/v1/factory/qis-rebalance` | QIS 우선순위 리밸런싱 | 간접 |
| `GET /api/hub-qis` | Hub CQ 목록 + 통계 조회 | 간접 |

### 3.3 aihompyhub의 BSW 연동 포인트

| 연동 포인트 | 위치 | 현재 상태 | 상세 |
|-----------|------|---------|------|
| **`pullBswPredictions()`** | growth-orchestrator.ts L21, L892 | ❌ **함수 미구현** | import되지만 bsw-client.ts에 정의 없음 |
| **`sendSignalToBsw()`** | bsw-client.ts L15 | ⚠️ **구현됨, 엔드포인트 불일치** | `/api/v1/signals/ingest`로 호출하지만 BSW에 해당 API 없음 |
| **`seedBswIfScheduled()`** | growth-orchestrator.ts L842 | ⚠️ **로직 완료, 의존 함수 미구현** | `pullBswPredictions` 미구현으로 실제 동작 불가 |
| **PredictedContentPipeline** | predictedContentPipeline.ts | ✅ 완료 | BSW 예측 → CMOS 초안 + 24h 자동 비활성화 |
| **Hub Probe (qis-probe)** | factory/qis-probe/route.ts | ✅ 완료 | Gemini로 AI 인용 프로빙 (BSW와 독립 구현) |
| **QIS Gap Matrix** | tenant/qis/gap-matrix/route.ts | ✅ 완료 | Intent×Stage 갭 매트릭스 (BSW 갭과 동기 가능) |

---

## 4. 양쪽 API 계약 불일치 분석

### 4.1 BSW-OS가 Hub에 기대하는 API (KWEDDING 가이드 기준)

| BSW가 호출할 Hub API | BSW 소스 | Hub 구현 상태 |
|---|---|---|
| `POST /api/v1/qis/signals` | KWeddingHubCollector | ❌ **미구현** — Hub에 해당 route 없음 |
| `GET /api/v1/qis/metrics` | QisHubClient.pullMetrics() | ❌ **미구현** — Hub에 해당 route 없음 |
| `GET /api/v1/qis/layers` | QisHubClient.pullExpectedLayers() | ❌ **미구현** — Hub에 해당 route 없음 |
| `POST /api/v1/qis/questions` | KWeddingHub sync push | ❌ **미구현** — Hub에 해당 route 없음 |

### 4.2 Hub가 BSW에 호출할 API

| Hub가 호출할 BSW API | Hub 소스 | BSW 구현 상태 |
|---|---|---|
| `GET /api/v1/qis/predictions` | pullBswPredictions() | ✅ BSW 구현 완료, **Hub 클라이언트 미구현** |
| `POST /api/v1/qis/feedback` | (미구현) | ✅ BSW 구현 완료, **Hub 피드백 전송 미구현** |
| `POST /api/v1/signals/ingest` | sendSignalToBsw() | ❌ **BSW에 해당 API 없음** (URL 불일치) |

### 4.3 불일치 요약 매트릭스

```
BSW → Hub 방향: 4개 API 모두 Hub 미구현 ❌
Hub → BSW 방향: 2개 API BSW 구현됨 ✅, Hub 클라이언트 미구현 ❌
URL 불일치: sendSignalToBsw()가 잘못된 BSW 엔드포인트 호출 ❌
```

---

## 5. API 연계 마무리 작업 목록

### ━━━ Priority 1: 양방향 연결 핵심 (즉시 작업) ━━━

#### Task 1: aihompyhub `pullBswPredictions` 함수 구현 ⭐

**위치:** `apps/web/lib/qis/bsw-client.ts`
**현황:** import만 있고 함수 정의 없음
**필요 내용:**
```typescript
export async function pullBswPredictions(
  tenantId: string,
  tenantSlug: string
): Promise<{ ok: boolean; data: BswPrediction[]; error?: string }> {
  const bswApiUrl = process.env.BSW_API_URL;
  if (!bswApiUrl) return { ok: false, data: [], error: 'BSW_API_URL not set' };
  
  const res = await fetch(
    `${bswApiUrl}/api/v1/qis/predictions?limit=50&min_confidence=0.7`,
    {
      headers: {
        'X-QIS-Api-Key': process.env.QIS_API_KEY || '',
      },
    }
  );
  // ... parse response
}
```

---

#### Task 2: aihompyhub에 Hub 수신 API 4개 구현 ⭐

BSW-OS의 `QisHubClient`와 `KWeddingHubCollector`가 호출할 엔드포인트:

| 엔드포인트 | 역할 | 수신 데이터 |
|----------|------|---------|
| `POST /api/v1/qis/signals` | 신호 수신 | `qisSignalBatchSchema` → `qis_signal_events` 저장 |
| `GET /api/v1/qis/metrics` | 메트릭 제공 | `question_clusters` 기반 통계 → `qisRealMetricsSchema` |
| `GET /api/v1/qis/layers` | Expected Layer 제공 | Hub CQ + 업종 기준 → `qisExpectedLayerDataSchema` |
| `POST /api/v1/qis/questions` | 예측 질문 수신 | `qisPredictedQuestionSchema[]` → `hub_canonical_questions` 저장 |

---

#### Task 3: `sendSignalToBsw()` 엔드포인트 URL 수정

**현재 (잘못됨):** `/api/v1/signals/ingest`
**수정 필요:** BSW-OS에 Signal 수신 API를 신설하거나, 기존 `/api/v1/qis/feedback` 확장

**선택지:**
- A) BSW-OS에 `POST /api/v1/qis/signals/ingest` 신규 생성
- B) aihompyhub의 URL을 BSW-OS 기존 API 구조에 맞춤

---

### ━━━ Priority 2: 피드백 루프 완성 ━━━

#### Task 4: aihompyhub → BSW 피드백 전송 구현

**위치:** aihompyhub 신규 Cron 또는 Growth Orchestrator 확장
**역할:** Hub에서 관측된 예측 질문 출현 여부를 BSW에 피드백
**호출:** `POST BSW/api/v1/qis/feedback` (BSW 측 이미 구현 완료)

```typescript
// 매일 저녁 실행
async function sendFeedbackToBsw() {
  // 1. hub_canonical_questions에서 BSW 예측 → 출현 확인된 것 조회
  // 2. qisFeedbackPayloadSchema 형식으로 변환
  // 3. POST BSW/api/v1/qis/feedback
}
```

---

#### Task 5: BSW-OS Signal Weight Recalibration 활성화

**위치:** `app/api/v1/qis/feedback/route.ts` L46-47
**현황:** `tracker.recalibrateSignalWeights(workspaceId)` — **주석 처리됨 (P2 planned)**
**작업:** 주석 해제 + 테스트

---

### ━━━ Priority 3: 환경 변수 + 인증 ━━━

#### Task 6: 환경 변수 설정

**BSW-OS (.env):**
```
HUB_API_URL=https://aihompyhub.vercel.app
HUB_API_KEY=<hub-api-key>
QIS_API_KEY_HASH=<sha256-of-api-key>
```

**aihompyhub (.env):**
```
BSW_API_URL=https://answerhub.kr
BSW_API_KEY=<bsw-api-key>
QIS_API_KEY=<same-key-as-bsw-hash-source>
```

---

#### Task 7: 인증 체계 통일

| 시스템 | 현재 인증 | 필요 작업 |
|--------|---------|---------|
| BSW-OS QIS API | `X-QIS-Api-Key` SHA-256 timing-safe | ✅ 완료 |
| aihompyhub bsw-client | `Authorization: Bearer` | ⚠️ BSW는 `X-QIS-Api-Key` 기대 — 헤더 불일치 |
| aihompyhub Hub QIS API | 없음 (미구현) | `X-QIS-Api-Key` 검증 추가 필요 |

---

### ━━━ Priority 4: 데이터 동기화 ━━━

#### Task 8: Cron 스케줄 양쪽 설정

| Cron | 시간 | 시스템 | 작업 |
|------|------|--------|------|
| BSW QIS Sync | 매일 03:00 | BSW-OS | Pull signals/metrics/layers → Push predictions |
| Hub Feedback | 매일 21:00 | aihompyhub | Query emerged questions → POST BSW feedback |
| Hub Deadline | 매 시간 | aihompyhub | enforceReviewDeadline() (24h 자동 비활성화) |

---

## 6. 작업 우선순위 매트릭스

| # | 작업 | 시스템 | 난이도 | 영향도 | 소요 |
|---|------|--------|-------|--------|------|
| **1** | `pullBswPredictions()` 구현 | aihompyhub | ⭐ 낮음 | ★★★★★ | 30분 |
| **2** | Hub QIS 수신 API 4개 구현 | aihompyhub | ⭐⭐ 중간 | ★★★★★ | 2-3시간 |
| **3** | `sendSignalToBsw()` URL 수정 | 양쪽 | ⭐ 낮음 | ★★★★ | 30분 |
| **4** | Hub → BSW 피드백 Cron 구현 | aihompyhub | ⭐⭐ 중간 | ★★★★ | 1시간 |
| **5** | Recalibration 주석 해제 | BSW-OS | ⭐ 낮음 | ★★★ | 15분 |
| **6** | 환경 변수 설정 | 양쪽 | ⭐ 낮음 | ★★★★★ | 15분 |
| **7** | 인증 헤더 통일 | aihompyhub | ⭐ 낮음 | ★★★★ | 30분 |
| **8** | Cron 스케줄 배포 | 양쪽 | ⭐ 낮음 | ★★★ | 15분 |

**총 예상 소요: 5-7시간**

---

## 7. 완성 후 데이터 흐름도

```
[매일 03:00 BSW Cron]
  │
  ├── PULL: Hub → BSW
  │   ├── /api/v1/qis/signals → bsw_received_signals
  │   ├── /api/v1/qis/metrics → bsw_received_metrics
  │   └── /api/v1/qis/layers  → bsw_expected_layers
  │
  ├── PROCESS: BSW 내부
  │   ├── SignalCollector → EmergenceSignal[]
  │   ├── QuestionPredictor → PredictedQuestion[]
  │   ├── QisCrossMapper → UnifiedQuestionMapping[]
  │   └── AccuracyTracker → 정확도 갱신
  │
  └── PUSH: BSW → Hub
      └── /api/v1/qis/questions → hub_canonical_questions

[매일 21:00 Hub Cron]
  │
  ├── PULL: BSW → Hub
  │   └── BSW /api/v1/qis/predictions → topics 시딩
  │
  └── PUSH: Hub → BSW
      └── BSW /api/v1/qis/feedback → predicted_questions.emerged 갱신

[Growth Orchestrator 주간]
  │
  ├── Day 7: seedBswIfScheduled()
  │   └── pullBswPredictions() → topics 최대 20건 시딩
  │
  ├── PredictedContentPipeline
  │   ├── 필터: confidence ≥ 0.70, coverage = none/sparse
  │   ├── QVS 상위 5건 → CMOS 초안 자동 생성
  │   └── 24h 미검토 → 자동 비활성화
  │
  └── Gap Matrix (Intent × Stage)
      └── BSW 역설계 갭과 동기 → 교차 부스팅
```

---

## 8. 결론

### 구현 완료도

| 영역 | BSW-OS | aihompyhub | 연계 |
|------|--------|-----------|------|
| Signal 수집 | ✅ 100% (6 스키마, 19 신호 유형) | ✅ 80% (canonicalizer, miner) | ❌ 0% (API 미연결) |
| 질문 예측 | ✅ 100% (Predictor + Tracker) | ✅ 100% (PredictedContentPipeline) | ❌ 0% (`pullBswPredictions` 미구현) |
| 교차 매핑 | ✅ 100% (Jaccard+Cosine) | ✅ 100% (gap-matrix) | ❌ 0% (동기 미구현) |
| CQ 관리 | ✅ 100% (CRUD + merge) | ✅ 80% (hub_canonical_questions) | ❌ 0% (매핑 미연결) |
| 외부 API | ✅ 100% (predictions + feedback) | ❌ 0% (Hub 수신 API 4개 미구현) | ❌ 0% |
| 피드백 루프 | ✅ 80% (recalibration 주석처리) | ❌ 0% (피드백 전송 미구현) | ❌ 0% |

### 핵심: "양쪽 모두 내부 로직은 완성, 연결 다리만 미구축"

BSW-OS 내부의 QIS 수집·예측·교차매핑과 aihompyhub 내부의 CQ·마이닝·프로브·PredictedContentPipeline은 **각각 완성도 80-100%** 입니다. 그러나 양쪽을 연결하는 **API 엔드포인트 + 클라이언트 함수가 구현되지 않아** 실제 데이터 교환이 0%입니다.

**마무리 8개 Task를 완료하면 양방향 QIS 폐루프가 즉시 활성화됩니다.**
