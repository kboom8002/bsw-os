# BSW-OS QIS 3축 허브 연동 시스템 정밀 감사 보고서

> 감사 일시: 2026-06-26 | 대상: BSW-OS QIS + aihompyhub 연동

---

## 1. QIS (Question Intelligence System) 아키텍처

```
┌──────────────────────────────────────────────────────────────────────┐
│                      BSW-OS QIS 엔진                                 │
│                                                                      │
│  ┌─────────────────┐     ┌──────────────────┐    ┌────────────────┐ │
│  │ Signal Ingest    │────▶│ Question         │───▶│ Tri-Axis       │ │
│  │ /api/v1/qis/    │     │ Predictor        │    │ Router         │ │
│  │ signals/ingest   │     │ (S-OGDE 알고리즘)  │    │ 3축 분기 엔진   │ │
│  └─────────────────┘     └──────────────────┘    └───────┬────────┘ │
│           ▲                       ▲                      │          │
│           │                       │                      ▼          │
│  ┌────────┴────────┐     ┌────────┴─────────┐   ┌──────────────┐   │
│  │ Hub Client       │     │ Accuracy Tracker  │   │ Hub Client   │   │
│  │ (Pull 모드)      │     │ + Recalibration   │   │ (Push 모드)  │   │
│  │ pullMetrics()    │     │ sendFeedbackToBsw │   │ pushPredicted│   │
│  │ pullExpLayers()  │     │                   │   │ Questions()  │   │
│  └────────┬────────┘     └───────────────────┘   └──────┬───────┘   │
│           │                                             │           │
└───────────┼─────────────────────────────────────────────┼───────────┘
            │                                             │
            ▼                                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     aihompyhub (Hub 플랫폼)                          │
│                                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────────┐  │
│  │ 🏢 업종   │  │ 📍 지역   │  │ 🎯 테마   │  │ Feedback Cron     │  │
│  │ Hub      │  │ Hub      │  │ Vortex   │  │ (매일 KST 21:00)   │  │
│  │ (domain_ │  │ (domain_ │  │ DAO      │  │                    │  │
│  │  hubs)   │  │  vortex_ │  │ (domain_ │  │ ● hub 출현 피드백   │  │
│  │          │  │  entities│  │  vortex_ │  │ ● 미션 완료 피드백   │  │
│  │          │  │  regional│  │  entities│  │                    │  │
│  │          │  │  )       │  │  vertical│  │                    │  │
│  └──────────┘  └──────────┘  │  )       │  └────────────────────┘  │
│                              └──────────┘                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ issueTriAxisContentMission() → 3축 동시 미션 발행             │   │
│  │ autoMatchAxes() → 콘텐츠 3축 자동 매칭                        │   │
│  │ answer-proliferation → 축별 포맷 추천                         │   │
│  └─────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2. QIS 공유 스키마 (`lib/qis-shared-schemas.ts`)

### 2.1 Signal Payload Schema

```typescript
qisSignalPayloadSchema = z.object({
  source_platform: z.enum(['kweddinghub', 'aihompyhub', 'jehuhub', 'other']),
  signal_type: z.enum([
    // 기존 14종
    'community_question', 'verified_review', 'price_report',
    'stress_pattern', 'deal_room_contract', 'deal_room_price',
    'style_dna_trend', 'event_intent', 'newlywed_lifecycle',
    'family_conflict', 'sentiment_pattern', 'deal_contract',
    'deal_price', 'trend_signal', 'intent_signal', 'lifecycle_event',
    'conflict_pattern', 'entity_created', 'entity_reviewed',
    'comparison_requested',
    // 3축 확장 4종
    'place_review', 'place_inquiry',
    'vortex_mission_signal', 'cross_axis_trend',
  ]),
  industry: z.string(),  // 유연한 문자열 (기존 enum → 확장)
  hub_slug: z.string().optional(),
  // ── 3축 컨텍스트 ──
  hub_axis: z.enum(['industry', 'place', 'vortex']).default('industry'),
  place_slug: z.string().optional(),
  vortex_slug: z.string().optional(),
  geo_context: z.object({
    region: z.string(),
    city: z.string().optional(),
    district: z.string().optional(),
  }).optional(),
  // ── 공통 ──
  tenant_id: z.string().uuid().optional(),
  raw_text: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()),
  predicted_impact: z.enum(['low', 'medium', 'high', 'critical']),
  detected_at: z.string(),
  expires_at: z.string().optional(),
});
```

### 2.2 Predicted Question Schema

```typescript
qisPredictedQuestionSchema = z.object({
  bsw_question_id: z.string().uuid(),
  question_text: z.string().min(5),
  predicted_intent: z.string().min(2),
  predicted_volume: z.enum(['low', 'medium', 'high']),
  confidence: z.number().min(0).max(1),
  first_mover_window_days: z.number().int().positive(),
  current_ai_coverage: z.enum(['none', 'sparse', 'moderate', 'saturated']),
  auto_must_include: z.array(z.string()),
  auto_must_not_do: z.array(z.string()),
  qvs_composite: z.number().optional(),
  // ── 3축 타겟 ──
  target_axis: z.enum(['industry', 'place', 'vortex', 'cross_axis']),
  place_slug: z.string().optional(),
  vortex_slug: z.string().optional(),
  geo_keywords: z.array(z.string()),
  recommended_formats: z.array(z.string()),
});
```

### 2.3 기타 스키마

| 스키마 | 용도 | 핵심 필드 |
|--------|------|---------|
| `qisRealMetricsSchema` | 실측 메트릭 (Hub → BSW) | metric_type(8종), industry, value, sample_size |
| `qisExpectedLayerDataSchema` | 기대층 데이터 (Hub → BSW) | tier(5단계), content, source, confidence |
| `qisFeedbackPayloadSchema` | 예측 피드백 (Hub → BSW) | bsw_question_id, emerged, emerged_at, actual_frequency |

---

## 3. 3축 라우팅 엔진 (`lib/qis/tri-axis-router.ts`)

### 3.1 지역 키워드 매핑 (25개)

```typescript
const REGION_KEYWORDS = {
  '제주': 'jeju', '제주도': 'jeju', '서귀포': 'jeju', '한라산': 'jeju',
  '성수': 'seongsu', '성수동': 'seongsu',
  '강남': 'gangnam', '강남구': 'gangnam',
  '홍대': 'hongdae', '홍대입구': 'hongdae',
  '이태원': 'itaewon', '해운대': 'haeundae',
  '부산': 'busan', '경주': 'gyeongju', '전주': 'jeonju',
  '여수': 'yeosu', '속초': 'sokcho', '강릉': 'gangneung',
  '대구': 'daegu', '대전': 'daejeon', '인천': 'incheon',
  '광주': 'gwangju', '울산': 'ulsan', '춘천': 'chuncheon', '서울': 'seoul',
};
```

### 3.2 테마 키워드 매핑 (17개)

```typescript
const THEME_KEYWORDS = {
  '웨딩': 'k-wedding', '결혼': 'k-wedding',
  '뷰티': 'k-beauty', '스킨케어': 'k-beauty', '피부관리': 'k-beauty',
  '한방': 'hanbang', '한의원': 'hanbang',
  '부동산': 'real-estate', '매물': 'real-estate',
  '맛집': 'k-food', '음식': 'k-food',
  '카페': 'k-cafe',
  '사진': 'k-photo', '촬영': 'k-photo',
  '숙소': 'k-stay', '호텔': 'k-stay', '펜션': 'k-stay',
};
```

### 3.3 축별 추천 콘텐츠 포맷

| 축 | 추천 포맷 |
|---|---------|
| `industry` | expert_column, how_to, data_brief |
| `place` | case_study, comparison, answer |
| `vortex` | answer, expert_column, data_brief |
| `cross_axis` | answer, case_study, expert_column |

### 3.4 분류 알고리즘 (`classifySignalAxis`)

```
1. 명시적 hub_axis 지정? → 그대로 사용
2. place_slug || geo_context 존재? → 'place'
3. vortex_slug 존재? → 'vortex'
4. raw_text에서 지역 키워드 감지? → 'place'
5. raw_text에서 테마 키워드 감지? → 'vortex'
6. place + vortex 동시 해당? → 'cross_axis'
7. signal_type 기반 (place_review/place_inquiry → 'place')
8. 기본 → 'industry'
```

### 3.5 예측 강화 (`enrichPredictionWithAxis`)

원본 예측 질문에 다음을 자동 부여:
- `target_axis`: 분류된 축
- `place_slug`: 감지/명시된 지역 slug
- `vortex_slug`: 감지/명시된 테마 slug
- `geo_keywords`: 텍스트에서 추출된 모든 지역 키워드
- `recommended_formats`: 축별 추천 포맷

---

## 4. API 엔드포인트 매핑

### 4.1 BSW-OS API 라우트

| 메서드 | 경로 | 기능 | 방향 |
|--------|------|------|------|
| GET | `/api/cron/qis-sync` | 일일 동기화 Cron (Pull+Push+3축) | BSW → Hub |
| POST | `/api/v1/qis/signals/ingest` | Hub 신호 수신 (3축 컨텍스트 저장) | Hub → BSW |
| GET | `/api/v1/qis/predictions` | 예측 질문 조회 | Hub ← BSW |
| POST | `/api/v1/qis/feedback` | 예측 출현 피드백 수신 + 재보정 | Hub → BSW |
| GET | `/api/cron/benchmark` | 벤치마크 Cron (업종별 배치 감사) | 내부 |

### 4.2 aihompyhub API 라우트

| 메서드 | 경로 | 기능 | 방향 |
|--------|------|------|------|
| POST | `/api/v1/qis/signals` | BSW가 Hub 신호를 Pull (pending→synced) | BSW ← Hub |
| GET | `/api/v1/qis/metrics` | BSW가 실측 메트릭 Pull | BSW ← Hub |
| GET | `/api/v1/qis/layers` | BSW가 기대층 Pull (Place/Vortex EL 포함) | BSW ← Hub |
| POST | `/api/v1/qis/questions` | BSW가 예측 질문 Push (3축 미션 발행) | BSW → Hub |
| POST | `/api/cron/qis-feedback` | 일일 피드백 Cron (hub+미션 완료) | Hub → BSW |

### 4.3 인증 메커니즘

```
Header: X-QIS-Api-Key: <raw_key>
Verification: SHA-256(raw_key) === QIS_API_KEY_HASH
Method: crypto.timingSafeEqual (timing-safe comparison)
```

| 환경변수 | BSW-OS | aihompyhub |
|---------|--------|------------|
| `QIS_API_KEY` | (발신용) `HUB_API_KEY` | `QIS_API_KEY` |
| `QIS_API_KEY_HASH` | 수신 검증용 | 수신 검증용 |
| `CRON_SECRET` | Cron 인증 | Cron 인증 |

---

## 5. Cron 스케줄

| 프로젝트 | 경로 | 스케줄 | KST | 기능 |
|---------|------|--------|-----|------|
| BSW-OS | `/api/cron/benchmark` | `0 2 * * *` | 11:00 | 업종 배치 벤치마크 |
| BSW-OS | `/api/cron/qis-sync` | `0 3 * * *` | 12:00 | QIS 데이터 수집 + 3축 Push |
| aihompyhub | `/api/cron/signal-flush` | `0 */6 * * *` | 매 6시간 | 신호 플러시 |
| aihompyhub | `/api/cron/qis-feedback` | `0 12 * * *` | 21:00 | 예측 피드백 → BSW |

---

## 6. 3축 미션 발행 흐름

### 6.1 단축 미션 (Place 또는 Vortex)

```
BSW Push: {axis: 'place', predictions: [{place_slug: 'jeju', ...}]}
  ↓
aihompyhub questions/route.ts:
  1. hub_canonical_questions upsert (기존)
  2. resolveAxisDaoId('place', 'jeju')
     → domain_vortex_entities WHERE domain_type='regional' AND slug='jeju'
  3. issueContentMission({
       vortexId: jejuDaoId,
       question: pred,
       rewardPoints: 120,
       targetFormats: ['case_study']
     })
  4. → vortex_content_missions INSERT
  5. → 제주 DAO 테넌트들에게 미션 노출
```

### 6.2 크로스축 미션 (3축 동시)

```
BSW Push: {axis: 'cross_axis', predictions: [{place_slug: 'jeju', vortex_slug: 'k-food', ...}]}
  ↓
aihompyhub questions/route.ts:
  1. resolveAxisDaoId('place', 'jeju') + resolveAxisDaoId('vortex', 'k-food')
     + resolveIndustryHubId('food')
  2. issueTriAxisContentMission({
       industryHubId, placeId: jejuId, vortexId: kFoodId,
       question, baseRewardPoints: 100
     })
  3. → 3개 미션 동시 INSERT:
     - Industry: expert_column (150pt)
     - Place: case_study (120pt)
     - Vortex: answer_card (100pt)
```

### 6.3 피드백 루프

```
aihompyhub qis-feedback Cron (KST 21:00):
  1. hub_canonical_questions에서 출현 데이터 수집
  2. vortex_content_missions에서 완료된 BSW 기반 미션 수집
  3. 중복 제거 (동일 bsw_question_id 스킵)
  4. BSW /api/v1/qis/feedback POST
     → PredictionAccuracyTracker.recordEmergence()
     → 모델 가중치 재보정
```

---

## 7. aihompyhub 기존 3축 인프라 연결 현황

| 모듈 | BSW 연결 | 상태 |
|------|---------|------|
| `issueTriAxisContentMission()` | questions/route.ts에서 cross_axis 수신 시 호출 | ✅ 연결 완료 |
| `issueContentMission()` | questions/route.ts에서 place/vortex 수신 시 호출 | ✅ 연결 완료 |
| `autoMatchAxes()` | 테넌트 콘텐츠 생성 시 내부 호출 (BSW 간접 연결) | ✅ 기존 완료 |
| `proliferateAtom()` | 미션 완료 시 축별 파생 콘텐츠 생성 | ✅ 기존 완료 |
| `syncMetricsToDao()` | layers/route.ts에서 메트릭 반환 시 간접 연결 | ⚠️ 간접 |
| `createProposalFromSignal()` | critical 신호 수신 시 자동 의제 상정 | ✅ 기존 완료 |
| `TriAxisAffiliation` → JSON-LD | 테넌트 SEO에 3축 소속 반영 | ✅ 기존 완료 |
| `AEPI 3축 보너스 (2.0×)` | 3축 등록 콘텐츠에 2배 점수 | ✅ 기존 완료 |

---

## 8. 정량적 역량 요약

| 카테고리 | 항목 수 |
|---------|--------|
| QIS 스키마 | 6종 (Signal, Prediction, Metrics, Layers, Feedback, Batch) |
| Signal 유형 | 24종 (기존 20 + 3축 확장 4) |
| 메트릭 유형 | 8종 |
| 기대층 Tier | 5단계 (must_include ~ must_not_do) |
| 3축 유형 | 4종 (industry, place, vortex, cross_axis) |
| 지역 키워드 | 25개 |
| 테마 키워드 | 17개 |
| BSW-OS API | 5개 엔드포인트 |
| aihompyhub API | 5개 엔드포인트 |
| Cron 스케줄 | 4개 (양쪽 합산) |
| 인증 방식 | SHA-256 HMAC + timingSafeEqual |
