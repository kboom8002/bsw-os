# KWeddingHub × BSW QIS 통합 구현 계획

> **목표**: KWeddingHub 플랫폼에 QIS 데이터 파이프라인을 탑재하고, BSW 프로젝트와 API/MCP로 양방향 데이터를 교환하는 시스템을 구축합니다.

---

## 아키텍처 개요

```
┌──────────────────────────────────────────────────────────────────────┐
│                      KWeddingHub (aihompyhub)                         │
│                                                                       │
│  ┌───────────────┐  ┌──────────────┐  ┌──────────────────────┐       │
│  │ CAFE 아고라    │  │ WeddyCare    │  │ Deal Room            │       │
│  │ 안심 후기      │  │ 스트레스 체크 │  │ 실거래가/추가금       │       │
│  │ 실거래가 피드  │  │ Family Bridge│  │ 계약 조건             │       │
│  └──────┬────────┘  └──────┬───────┘  └──────────┬───────────┘       │
│         │                  │                      │                   │
│         ▼                  ▼                      ▼                   │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │              QIS Signal Emitter SDK (신규)                    │     │
│  │  lib/qis/signal-emitter.ts                                   │     │
│  │  lib/qis/question-harvester.ts                               │     │
│  │  lib/qis/expected-layer-builder.ts                           │     │
│  │  lib/qis/emotional-collector.ts                              │     │
│  └─────────────────────┬───────────────────────────────────────┘     │
│                        │                                              │
│  ┌─────────────────────▼───────────────────────────────────────┐     │
│  │              QIS Bridge API (신규)                             │     │
│  │  api/v1/qis/signals/route.ts      → POST: 신호 방출           │     │
│  │  api/v1/qis/questions/route.ts    → GET/POST: 질문 교환       │     │
│  │  api/v1/qis/expected-layer/route.ts → POST: EL 데이터 전송    │     │
│  │  api/v1/qis/feedback/route.ts     → POST: 예측 검증 결과      │     │
│  │  api/v1/qis/metrics/route.ts      → GET: 실측 메트릭 조회     │     │
│  └─────────────────────┬───────────────────────────────────────┘     │
│                        │ HTTPS + API Key                              │
└────────────────────────┼──────────────────────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          │   양방향 REST API / MCP      │
          │   + Shared Zod Schema        │
          └──────────────┼──────────────┘
                         │
┌────────────────────────┼──────────────────────────────────────────────┐
│                        │           BSW (bsw)                          │
│                        ▼                                              │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │              QIS Ingest Gateway (신규)                        │     │
│  │  lib/prediction/signal-collectors/kweddinghub-collector.ts   │     │
│  │  app/actions/kweddinghub-sync.ts                             │     │
│  └─────────────────────┬───────────────────────────────────────┘     │
│                        │                                              │
│         ┌──────────────┼──────────────┐                              │
│         ▼              ▼              ▼                              │
│  ┌───────────┐  ┌────────────┐  ┌──────────┐                        │
│  │ Question  │  │ Accuracy   │  │ QVS      │                        │
│  │ Predictor │  │ Tracker    │  │ Scorer   │                        │
│  └───────────┘  └────────────┘  └──────────┘                        │
│         │                                                             │
│         ▼                                                             │
│  ┌──────────────────────────┐                                        │
│  │ SBS Index Runner         │                                        │
│  │ BAIR / AIPR / KAIVI      │                                        │
│  └──────────────────────────┘                                        │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 구현 원칙

> [!IMPORTANT]
> **통신 프로토콜**: REST API(HTTPS) + 공유 Zod 스키마. MCP는 Phase 2에서 추가 레이어로 고려.
> **인증**: API Key(`X-QIS-Api-Key`) + `workspace_id` 기반. BSW workspace와 KWeddingHub tenant 간 매핑 테이블 사용.
> **데이터 방향**: KWeddingHub → BSW (신호·실측 데이터 방출), BSW → KWeddingHub (예측 질문·메트릭 피드백).

---

## Proposed Changes

---

### Component A: 공유 스키마 & DB 확장

> KWeddingHub와 BSW 간 데이터 교환의 계약(Contract) 역할을 하는 공유 Zod 스키마 및 DB 테이블.

#### [NEW] apps/storefront/lib/qis/schemas.ts

QIS 데이터 교환용 공유 Zod 스키마. BSW의 `EmergenceSignal`, `PredictedQuestion`, `QuestionValueScore` 스키마와 호환되는 교환 포맷을 정의합니다.

```typescript
// QIS 신호 방출 스키마 (KWeddingHub → BSW)
export const qisSignalPayloadSchema = z.object({
  source_platform: z.literal('kweddinghub'),
  signal_type: z.enum([
    'community_question',    // CAFE 아고라 Q&A
    'verified_review',       // 안심 후기
    'price_report',          // 실거래가 제보
    'stress_pattern',        // WeddyCare 스트레스 데이터
    'deal_room_contract',    // Deal Room 계약 조건
    'deal_room_price',       // Deal Room 시세 데이터
    'style_dna_trend',       // Style DNA 트렌드
    'event_intent',          // 파티 플래너 의도
    'newlywed_lifecycle',    // 신혼 라이프 데이터
    'family_conflict',       // Family Bridge 갈등 패턴
  ]),
  industry: z.literal('wedding'),
  tenant_id: z.string().uuid().optional(),
  raw_text: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).default({}),
  predicted_impact: z.enum(['critical','high','medium','low']),
  detected_at: z.string(),
  expires_at: z.string().optional(),
});

// QIS 예측 질문 수신 스키마 (BSW → KWeddingHub)
export const qisPredictedQuestionSchema = z.object({
  bsw_question_id: z.string().uuid(),
  question_text: z.string().min(5),
  predicted_intent: z.string(),
  predicted_volume: z.enum(['very_high','high','medium','low']),
  confidence: z.number().min(0).max(1),
  first_mover_window_days: z.number().int().positive(),
  current_ai_coverage: z.enum(['none','sparse','moderate','saturated']),
  auto_must_include: z.array(z.string()).default([]),
  auto_must_not_do: z.array(z.string()).default([]),
  qvs_composite: z.number().optional(),
});

// QIS 실측 데이터 스키마 (KWeddingHub → BSW)
export const qisRealMetricsSchema = z.object({
  metric_type: z.enum([
    'question_frequency',    // 질문 빈도 실측
    'conversion_rate',       // Deal Room 계약 전환율
    'average_transaction',   // 실거래 평균 단가
    'stress_seasonal',       // 감정 계절 패턴
    'question_emergence',    // 예측 질문 실제 출현 확인
  ]),
  industry: z.literal('wedding'),
  period_start: z.string(),
  period_end: z.string(),
  value: z.number(),
  sample_size: z.number().int().positive(),
  breakdown: z.record(z.string(), z.unknown()).default({}),
});

// QIS Expected Layer 데이터 (KWeddingHub → BSW)
export const qisExpectedLayerDataSchema = z.object({
  question_reference: z.string(), // slug 또는 ID
  tier: z.enum(['must_include','strongly_recommended','should_include','caution','must_not_do']),
  content: z.string().min(1),
  source: z.enum(['verified_review','price_data','contract_clause','safety_guard','community_consensus']),
  confidence: z.number().min(0).max(1),
  sample_count: z.number().int(),
});
```

#### [NEW] supabase/migrations/20260526_qis_bridge.sql

KWeddingHub Supabase에 QIS 데이터 파이프라인용 테이블 추가.

```sql
-- QIS 신호 이벤트 로그 (방출 전 로컬 버퍼)
CREATE TABLE qis_signal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_type TEXT NOT NULL,
  tenant_id UUID REFERENCES tenants(id),
  raw_text TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  predicted_impact TEXT DEFAULT 'medium',
  detected_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending',  -- pending | synced | failed
  synced_at TIMESTAMPTZ,
  bsw_signal_id UUID,  -- BSW에서 반환된 ID
  created_at TIMESTAMPTZ DEFAULT now()
);

-- QIS 예측 질문 수신 캐시
CREATE TABLE qis_predicted_questions_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bsw_question_id UUID NOT NULL UNIQUE,
  question_text TEXT NOT NULL,
  predicted_intent TEXT NOT NULL,
  predicted_volume TEXT DEFAULT 'medium',
  confidence NUMERIC(4,3) DEFAULT 0.5,
  first_mover_window_days INT DEFAULT 30,
  current_ai_coverage TEXT DEFAULT 'sparse',
  auto_must_include TEXT[] DEFAULT '{}',
  auto_must_not_do TEXT[] DEFAULT '{}',
  qvs_composite NUMERIC(12,2),
  is_actioned BOOLEAN DEFAULT false,  -- 콘텐츠 생성 여부
  received_at TIMESTAMPTZ DEFAULT now(),
  actioned_at TIMESTAMPTZ
);

-- QIS 실측 메트릭 스냅샷
CREATE TABLE qis_real_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  value NUMERIC(12,4) NOT NULL,
  sample_size INT NOT NULL,
  breakdown JSONB DEFAULT '{}',
  synced_to_bsw BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- BSW workspace ↔ KWeddingHub tenant 매핑
CREATE TABLE qis_workspace_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bsw_workspace_id UUID NOT NULL,
  tenant_id UUID REFERENCES tenants(id),
  api_key_hash TEXT NOT NULL,  -- HMAC-SHA256 해시
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_qis_signal_events_sync ON qis_signal_events(sync_status);
CREATE INDEX idx_qis_signal_events_type ON qis_signal_events(signal_type);
CREATE INDEX idx_qis_predicted_cache_actioned ON qis_predicted_questions_cache(is_actioned);
CREATE INDEX idx_qis_real_metrics_type ON qis_real_metrics(metric_type, period_start);
```

---

### Component B: QIS Signal Emitter SDK (KWeddingHub 백엔드)

> KWeddingHub의 각 기능 모듈에서 QIS 신호를 수집·정규화·로컬 버퍼링하는 백엔드 SDK.

#### [NEW] apps/storefront/lib/qis/signal-emitter.ts

QIS 신호 방출의 중앙 허브. 모든 기능 모듈이 이 함수를 호출하여 신호를 발생시킵니다.

- `emitSignal(payload)` — 신호를 `qis_signal_events` 테이블에 버퍼링
- `flushSignals()` — 대기 중인 신호를 BSW API로 일괄 전송
- Rate Limiting: 동일 `raw_text` 해시 기준 5분 내 중복 방지

#### [NEW] apps/storefront/lib/qis/question-harvester.ts

CAFE 아고라 Q&A 스레드에서 질문을 자동 수확하는 엔진.

- `harvestFromAgora(tenantId)` — `universal_content_assets`에서 `type='agora_question'` 에셋 조회
- `clusterByIntent(questions)` — 질문 의도별 그룹핑 (12가지 Intent 기반)
- `computeFrequency(cluster)` — 클러스터별 빈도 → `qis_real_metrics` 저장
- `emitHighFrequencySignals(threshold)` — 빈도 임계값 초과 시 자동 신호 방출

#### [NEW] apps/storefront/lib/qis/expected-layer-builder.ts

Deal Room 계약 조건, 안심 후기, 실거래가, SafetyGuard 데이터에서 Expected Layer를 자동 구성.

- `buildFromReviews(tenantId)` — 안심 후기에서 가장 빈번한 긍정/부정 포인트 추출 → Tier 2/3
- `buildFromPriceData()` — 실거래가 통계 → Tier 1 (Must Include: "서울 스튜디오 평균 150~250만원")
- `buildFromContractClauses()` — Deal Room 위기 조항 → Tier 4 (Caution)
- `buildFromSafetyGuard()` — SafetyGuard 금지 패턴 → Tier 5 (Must Not Do)

#### [NEW] apps/storefront/lib/qis/emotional-collector.ts

WeddyCare 감정 데이터를 QIS의 8번째 신호 수집기 형태로 변환.

- `collectStressPatterns(period)` — `weddycare_stress_checkins`에서 기간별 스트레스 유형 집계
- `detectSeasonalSpikes()` — 월별 스트레스 유형 변동 감지
- `correlateToQuestions(stressType)` — 스트레스 유형 → 예상 질문 매핑 테이블

#### [NEW] apps/storefront/lib/qis/deal-metrics-collector.ts

Deal Room 거래 데이터에서 QVS 실측 변수를 추출.

- `computeConversionRate(period)` — Deal Room 계약 전환율 실측
- `computeAverageTransactionValue(period)` — 평균 거래액 실측
- `computeAddonDisclosureRate()` — 추가금 공시 비율
- `emitMetrics()` — 실측 메트릭을 `qis_real_metrics`에 저장 + BSW 전송 대기

---

### Component C: QIS Bridge API (KWeddingHub REST 엔드포인트)

> BSW 프로젝트가 호출하는 API 엔드포인트 + KWeddingHub가 BSW를 호출하는 클라이언트.

#### [NEW] apps/storefront/app/api/v1/qis/signals/route.ts

**POST** `/api/v1/qis/signals` — BSW가 KWeddingHub의 신호를 pull하거나, KWeddingHub가 자발적으로 push.

```
요청: { api_key, workspace_id, since?: ISO8601 }
응답: { ok: true, data: QisSignalPayload[], total: number }

인증: X-QIS-Api-Key 헤더 → qis_workspace_mapping 테이블에서 검증
Rate Limit: slidingWindow(60, '60 s')
```

#### [NEW] apps/storefront/app/api/v1/qis/questions/route.ts

**GET** — BSW에서 예측된 질문 조회 (캐시 반환).
**POST** — BSW가 예측 질문을 KWeddingHub에 push.

```
POST 요청: { api_key, workspace_id, predictions: QisPredictedQuestion[] }
POST 응답: { ok: true, received: number }

GET 요청: ?workspace_id=xxx&actioned=false
GET 응답: { ok: true, data: QisPredictedQuestion[], total: number }
```

#### [NEW] apps/storefront/app/api/v1/qis/expected-layer/route.ts

**POST** — KWeddingHub가 축적한 Expected Layer 데이터를 BSW에 전송.

```
요청: { api_key, workspace_id, layers: QisExpectedLayerData[] }
응답: { ok: true, synced: number }
```

#### [NEW] apps/storefront/app/api/v1/qis/feedback/route.ts

**POST** — 예측 질문의 실제 출현 여부를 BSW AccuracyTracker에 피드백.

```
요청: {
  api_key, workspace_id,
  feedbacks: [{
    bsw_question_id: UUID,
    emerged: boolean,
    emerged_at?: ISO8601,
    emergence_source: 'cafe_agora' | 'review' | 'deal_room' | 'stress_check',
    actual_frequency?: number
  }]
}
응답: { ok: true, processed: number }
```

#### [NEW] apps/storefront/app/api/v1/qis/metrics/route.ts

**GET** — BSW가 KWeddingHub의 실측 메트릭(전환율, 거래액, 질문빈도)을 조회.

```
GET ?workspace_id=xxx&metric_type=conversion_rate&period=2026-05
응답: { ok: true, data: QisRealMetrics[] }
```

#### [NEW] apps/storefront/lib/qis/bsw-client.ts

KWeddingHub에서 BSW API를 호출하는 HTTP 클라이언트.

- `pushSignals(signals)` — BSW의 `/api/v1/qis/ingest` 엔드포인트로 신호 전송
- `pullPredictions(workspaceId)` — BSW에서 최신 예측 질문 가져오기
- `pushFeedback(feedbacks)` — 예측 검증 결과 전송
- `pushExpectedLayers(layers)` — Expected Layer 데이터 전송
- `pushRealMetrics(metrics)` — 실측 메트릭 전송

환경변수: `BSW_API_URL`, `BSW_API_KEY`

---

### Component D: BSW 측 수신 게이트웨이 (bsw 프로젝트)

> BSW 프로젝트에서 KWeddingHub 데이터를 수신·가공하는 모듈.

#### [NEW] bsw/lib/prediction/signal-collectors/kweddinghub-collector.ts

기존 7종 수집기와 동일 인터페이스의 8번째 수집기.

```typescript
export class KWeddingHubCollector implements SignalCollector {
  async collect(workspaceId?: string, industry?: string): Promise<EmergenceSignal[]> {
    // KWeddingHub QIS Bridge API에서 신호 pull
    const response = await fetch(`${KWEDDINGHUB_API_URL}/api/v1/qis/signals`, {
      method: 'POST',
      headers: { 'X-QIS-Api-Key': KWEDDINGHUB_API_KEY },
      body: JSON.stringify({ workspace_id: workspaceId, since: lastSyncTimestamp }),
    });
    // EmergenceSignal 형태로 변환하여 반환
  }
}
```

#### [MODIFY] bsw/lib/prediction/question-predictor.ts

기존 `QuestionPredictor`의 `collectSignals()` 메서드에 `KWeddingHubCollector`를 8번째 수집기로 등록.

#### [NEW] bsw/app/actions/kweddinghub-sync.ts

BSW에서 KWeddingHub로 예측 결과와 메트릭을 push하는 Server Action.

- `pushPredictionsToKWeddingHub(workspaceId, predictions)` — 예측 질문 전송
- `pullRealMetricsFromKWeddingHub(workspaceId, period)` — 실측 데이터 수신
- `pullFeedbackFromKWeddingHub(workspaceId)` — 예측 검증 결과 수신
- `updateQVSWithRealData(workspaceId)` — 실측 데이터로 QVS 재산출

#### [MODIFY] bsw/app/actions/qvs.ts

`scoreQuestionValue()` 함수에 KWeddingHub 실측 데이터 주입 로직 추가:
- `volume_score` ← KWeddingHub `question_frequency` 메트릭
- `conversion_score` ← KWeddingHub `conversion_rate` 메트릭
- `arpu_score` ← KWeddingHub `average_transaction` 메트릭

---

### Component E: QIS 기능 모듈 연동 (KWeddingHub 프론트엔드/백엔드)

> 각 기능 모듈에 QIS 신호 방출 훅을 삽입하고, 예측 질문을 UI에 노출.

#### [MODIFY] apps/storefront/app/actions/community-actions.ts

기존 커뮤니티 Server Action에 QIS 신호 방출 훅 추가:
- `submitAgoraQuestion()` → `emitSignal({ signal_type: 'community_question', ... })` 삽입
- `submitVerifiedReview()` → `emitSignal({ signal_type: 'verified_review', ... })` 삽입
- `submitPriceReport()` → `emitSignal({ signal_type: 'price_report', ... })` 삽입

#### [MODIFY] apps/storefront/lib/community/stressCounselorEngine.ts

스트레스 체크인 완료 시 감정 신호 방출:
- `processStressCheckin()` → `emitSignal({ signal_type: 'stress_pattern', ... })` 삽입

#### [MODIFY] apps/storefront/lib/dealRoom/dealRoomEngine.ts

딜룸 단계 변경 시 거래 데이터 신호 방출:
- `acceptQuote()` → `emitSignal({ signal_type: 'deal_room_contract', ... })` 삽입
- 가격 데이터 변경 시 → `emitSignal({ signal_type: 'deal_room_price', ... })`

#### [NEW] apps/storefront/app/api/v1/qis/cron/route.ts

Cron 기반 배치 작업:
- **매 1시간**: `flushSignals()` — 버퍼링된 신호를 BSW로 일괄 전송
- **매일 02:00**: `harvestFromAgora()` — 아고라 질문 수확 + 빈도 분석
- **매일 03:00**: `computeRealMetrics()` — Deal Room 실측 메트릭 산출
- **매일 04:00**: `buildExpectedLayers()` — Expected Layer 자동 구성
- **매주 월 05:00**: `pullPredictions()` — BSW에서 최신 예측 질문 수신
- **매주 월 06:00**: `pushFeedback()` — 예측 검증 결과 BSW로 전송

#### [NEW] apps/storefront/app/[locale]/hub/[hubSlug]/qis-insights/page.tsx

웨딩 업종 QIS 인사이트 대시보드 UI (관리자/파트너 전용):
- **선점 기회 카드**: BSW에서 수신한 예측 질문 중 QVS 상위 5개 표시
- **질문 트렌드 차트**: CAFE 아고라 질문 빈도 시계열 그래프
- **감정 트렌드 맵**: WeddyCare 스트레스 유형별 월간 변동
- **실측 vs 예측 비교**: 예측 정확도 시각화

---

## 실행 순서 (6단계)

### Phase 1: 기반 인프라 (Day 1-2)
- `[ ]` DB 마이그레이션 SQL 작성 및 실행
- `[ ]` 공유 Zod 스키마 (`lib/qis/schemas.ts`) 생성
- `[ ]` QIS Signal Emitter 핵심 모듈 구현
- `[ ]` BSW workspace ↔ tenant 매핑 테이블 시딩
- `[ ]` 유닛 테스트: 스키마 검증 + 신호 방출

### Phase 2: 수집 파이프라인 (Day 3-4)
- `[ ]` Question Harvester (아고라 질문 수확)
- `[ ]` Emotional Collector (WeddyCare 감정 수집)
- `[ ]` Deal Metrics Collector (거래 실측 데이터)
- `[ ]` Expected Layer Builder (자동 EL 구성)
- `[ ]` 유닛 테스트: 각 수집기 Happy + Edge 케이스

### Phase 3: Bridge API 엔드포인트 (Day 5-6)
- `[ ]` `/api/v1/qis/signals` POST 엔드포인트
- `[ ]` `/api/v1/qis/questions` GET/POST 엔드포인트
- `[ ]` `/api/v1/qis/expected-layer` POST 엔드포인트
- `[ ]` `/api/v1/qis/feedback` POST 엔드포인트
- `[ ]` `/api/v1/qis/metrics` GET 엔드포인트
- `[ ]` BSW HTTP 클라이언트 (`bsw-client.ts`)
- `[ ]` API Key 인증 미들웨어
- `[ ]` Rate Limiting 적용 (Upstash)
- `[ ]` 통합 테스트: 양방향 데이터 교환

### Phase 4: BSW 수신 게이트웨이 (Day 7-8)
- `[ ]` KWeddingHubCollector (8번째 신호 수집기)
- `[ ]` QuestionPredictor에 수집기 등록
- `[ ]` kweddinghub-sync.ts Server Action
- `[ ]` QVS 실측 데이터 주입 로직
- `[ ]` 유닛 테스트: BSW 측 수신·가공

### Phase 5: 기능 모듈 연동 (Day 9-10)
- `[ ]` community-actions.ts에 신호 방출 훅 삽입
- `[ ]` stressCounselorEngine.ts 감정 신호 연동
- `[ ]` dealRoomEngine.ts 거래 신호 연동
- `[ ]` Cron 배치 작업 설정
- `[ ]` 회귀 테스트: 기존 714 테스트 통과 확인

### Phase 6: UI & 검증 (Day 11-12)
- `[ ]` QIS Insights 대시보드 UI 구축
- `[ ]` TypeScript 검증: `npx tsc --noEmit` 양쪽 프로젝트
- `[ ]` 프로덕션 빌드 검증: `npm run build`
- `[ ]` E2E 데이터 흐름 검증: KWeddingHub → BSW → KWeddingHub

---

## 파일 목록 요약 (27개)

### KWeddingHub (aihompyhub) — 20개 파일

| 유형 | 경로 | 역할 |
|---|---|---|
| [NEW] | `apps/storefront/lib/qis/schemas.ts` | 공유 Zod 스키마 |
| [NEW] | `apps/storefront/lib/qis/signal-emitter.ts` | 신호 방출 중앙 허브 |
| [NEW] | `apps/storefront/lib/qis/question-harvester.ts` | 아고라 질문 수확기 |
| [NEW] | `apps/storefront/lib/qis/expected-layer-builder.ts` | Expected Layer 자동 구성 |
| [NEW] | `apps/storefront/lib/qis/emotional-collector.ts` | WeddyCare 감정 수집기 |
| [NEW] | `apps/storefront/lib/qis/deal-metrics-collector.ts` | Deal Room 실측 수집기 |
| [NEW] | `apps/storefront/lib/qis/bsw-client.ts` | BSW API HTTP 클라이언트 |
| [NEW] | `apps/storefront/app/api/v1/qis/signals/route.ts` | 신호 교환 API |
| [NEW] | `apps/storefront/app/api/v1/qis/questions/route.ts` | 예측 질문 교환 API |
| [NEW] | `apps/storefront/app/api/v1/qis/expected-layer/route.ts` | EL 전송 API |
| [NEW] | `apps/storefront/app/api/v1/qis/feedback/route.ts` | 예측 검증 API |
| [NEW] | `apps/storefront/app/api/v1/qis/metrics/route.ts` | 실측 메트릭 API |
| [NEW] | `apps/storefront/app/api/v1/qis/cron/route.ts` | 배치 동기화 Cron |
| [NEW] | `apps/storefront/app/[locale]/hub/[hubSlug]/qis-insights/page.tsx` | QIS 인사이트 대시보드 UI |
| [NEW] | `supabase/migrations/20260526_qis_bridge.sql` | DB 스키마 확장 |
| [MODIFY] | `apps/storefront/app/actions/community-actions.ts` | 신호 방출 훅 삽입 |
| [MODIFY] | `apps/storefront/lib/community/stressCounselorEngine.ts` | 감정 신호 연동 |
| [MODIFY] | `apps/storefront/lib/dealRoom/dealRoomEngine.ts` | 거래 신호 연동 |
| [NEW] | `apps/storefront/__tests__/lib/qis/signal-emitter.test.ts` | 유닛 테스트 |
| [NEW] | `apps/storefront/__tests__/api/qis-signals.test.ts` | API 통합 테스트 |

### BSW (bsw) — 7개 파일

| 유형 | 경로 | 역할 |
|---|---|---|
| [NEW] | `bsw/lib/prediction/signal-collectors/kweddinghub-collector.ts` | 8번째 신호 수집기 |
| [NEW] | `bsw/app/actions/kweddinghub-sync.ts` | 동기화 Server Action |
| [MODIFY] | `bsw/lib/prediction/question-predictor.ts` | 수집기 등록 |
| [MODIFY] | `bsw/app/actions/qvs.ts` | 실측 데이터 주입 |
| [NEW] | `bsw/tests/kweddinghub-collector.test.ts` | 수집기 테스트 |
| [NEW] | `bsw/tests/kweddinghub-sync.test.ts` | 동기화 테스트 |
| [NEW] | `bsw/lib/qis-shared-schemas.ts` | 공유 스키마 복제 |

---

## Verification Plan

### Automated Tests
```bash
# KWeddingHub 측
cd apps/storefront && npx vitest run --reporter=verbose
# 기존 714 테스트 + 신규 QIS 테스트 전체 통과

# BSW 측
cd ~/bsw && npx vitest run
# 기존 377+ 테스트 + 신규 수집기/동기화 테스트 전체 통과
```

### 빌드 검증
```bash
# KWeddingHub 모노레포
cd ~/aihompyhub && npm run build

# BSW
cd ~/bsw && npm run build
```

### E2E 데이터 흐름 검증
1. KWeddingHub CAFE에 테스트 질문 생성 → `qis_signal_events` 저장 확인
2. Cron flush → BSW `/api/v1/qis/ingest` 전송 확인
3. BSW `QuestionPredictor` 실행 → 예측 질문 생성 확인
4. BSW → KWeddingHub `qis_predicted_questions_cache` 수신 확인
5. KWeddingHub QIS Insights 대시보드에 예측 질문 표시 확인

## Open Questions & Resolution Summary

> [!NOTE]
> **Q1 (Supabase Instance)**: BSW와 KWeddingHub는 **별도의 Supabase 인스턴스**를 사용합니다. 따라서 cross-DB 조인 대신 **REST API 기반 연동**을 확정하여 연동합니다.
> **Q2 (BSW Production Auth)**: BSW에는 아직 실서버 인증이 구축되지 않았습니다. 사용자의 요청에 따라 아래 **BSW 프로덕션 인증 전환 권고안(Migration Blueprint)**을 계획에 추가하고 준수합니다.
> **Q3 (Protocol Phase)**: **REST API 우선 구축** 후 2단계에서 MCP를 레이어로 추가하는 것에 동의하셨습니다.
> **Q4 (Sync Real-time)**: 실시간 동기화는 불필요하며, **배치(1시간/일 단위) 동기화**로 성능과 비용을 최적화합니다.

---

## BSW 프로덕션 인증 및 권한 전환 권고안 (Production Auth Blueprint)

BSW 프로젝트의 모의 인증(`SIMULATED_USER_ID`)에서 안전하고 확장 가능한 **프로덕션 급 Supabase Auth & RLS(Row-Level Security) 시스템**으로 전환하기 위한 설계 권고안입니다.

### 1. 인증 프레임워크 표준화: Supabase SSR (`@supabase/ssr`)
Next.js App Router 환경에서의 세션 관리 및 인증 쿠키 동기화를 위해 `@supabase/ssr` 패키지를 도입합니다.

*   **구현 절차**:
    1. `npm install @supabase/ssr @supabase/supabase-js` 설치
    2. 서버 컴포넌트용 client (`lib/supabase/server.ts`), 클라이언트 컴포넌트용 client (`lib/supabase/client.ts`), 미들웨어용 client (`lib/supabase/middleware.ts`) 유틸리티 작성
    3. `middleware.ts`에서 각 요청마다 Supabase 세션을 리프레시하여 만료된 토큰을 자동 갱신하고, 미인증 사용자를 `/login`으로 리디렉션 처리

### 2. Supabase DB 스키마 RLS 정책 설계
기존에 `supabaseAdmin` (service_role)을 사용하여 전체 권한을 얻는 구조에서 벗어나, 로그인된 사용자의 context (`auth.uid()`)에 기반한 RLS 정책을 선언합니다.

```sql
-- 1. 테이블 RLS 활성화
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_value_scores ENABLE ROW LEVEL SECURITY;

-- 2. 멤버십 RLS 정책: 로그인한 본인의 멤버십 기록만 조회 가능
CREATE POLICY select_own_membership ON workspace_memberships
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 3. 워크스페이스 RLS 정책: 소속된 멤버십이 있는 워크스페이스만 조회 가능
CREATE POLICY select_authorized_workspaces ON workspaces
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT workspace_id 
      FROM workspace_memberships 
      WHERE user_id = auth.uid()
    )
  );

-- 4. QVS 데이터 RLS 정책: 워크스페이스 소속 사용자 중 쓰기/읽기 권한 체크
CREATE POLICY manage_qvs_in_workspace ON question_value_scores
  FOR ALL
  TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id 
      FROM workspace_memberships 
      WHERE user_id = auth.uid()
    )
  );
```

### 3. Server Actions 권한 및 인증 리팩토링
Server Action 상단에 하드코딩된 `SIMULATED_USER_ID` 상수를 제거하고, 실제 로그인한 사용자의 ID와 권한을 런타임에 동적으로 검증합니다.

```typescript
// ✅ 권장되는 BSW Server Action 보안 패턴
import { createClient } from "@/lib/supabase/server";
import { checkWorkspacePermission } from "../../lib/auth";

export async function scoreQuestionValue(
  workspaceId: string,
  params: { ... }
) {
  // 1. Supabase SSR 클라이언트 초기화 및 유저 획득
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error("UNAUTHENTICATED: 로그인이 필요합니다.");
  }

  // 2. DB RLS 정책 검증 및 추가 RBAC 로직 수행
  const isAuthorized = await checkWorkspacePermission(workspaceId, user.id, [
    "owner",
    "admin",
    "brand_strategist",
  ]);
  
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: 이 작업을 수행할 권한이 없습니다.");
  }
  
  // ... 안전한 비즈니스 로직 수행 (admin client 대신 RLS가 동작하는 일반 client 사용 권장)
}
```

### 4. KWeddingHub × BSW 연동을 위한 API Key 관리체계
브릿지 API와 같이 서버-대-서버(Server-to-Server) 통신 환경에서는 사용자 로그인 세션(쿠키)을 쓸 수 없으므로, **HMAC-SHA256 기반의 안전한 API Key 방식**을 사용하여 인증합니다.

1. BSW 데이터베이스에 `qis_api_keys` 테이블 생성:
   * `id` (UUID), `workspace_id` (UUID), `key_name` (TEXT), `key_hash` (TEXT - SHA256), `expires_at` (TIMESTAMPTZ)
2. KWeddingHub에는 `api_key` 원본 발급 (예: `bsw_qis_live_abc123...`). BSW DB에는 해당 키의 SHA-256 해시값만 저장.
3. API 호출 시 `X-QIS-Api-Key` 헤더로 원본 키를 전달받고, BSW 미들웨어 또는 API 라우트에서 해시값 일치 여부를 대조하여 매핑된 `workspace_id`를 판별.
