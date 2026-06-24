# K-Wedding Hub × BSW QIS 연동 구현 가이드

> **대상**: K-Wedding Hub 개발팀  
> **작성일**: 2024-06-23  
> **BSW 버전**: QIS Integration v1.0  
> **아키텍처**: BSW 주도 Pull/Push 하이브리드

---

## 1. 아키텍처 개요

BSW(Brand Search Warehouse)는 **질문 발굴 엔진**으로서 K-Wedding Hub의 데이터를 능동적으로 수집하고, AI 분석을 거쳐 예측 질문을 Hub에 공급합니다.

```
┌─────────────────────────────────────────────────────┐
│                  BSW (질문 발굴 엔진)                  │
│                                                      │
│   [수집] Hub에서 시그널/메트릭/기대층을 능동 Pull      │
│   [분석] S-OGDE v2.0 파이프라인으로 질문 발굴          │
│   [공급] 예측 질문을 Hub에 Push                       │
│   [학습] Hub의 피드백으로 예측 정확도 자가 보정         │
└────────────┬───────────────────────┬────────────────┘
             │ BSW가 Pull           │ BSW가 Push
             ▼                      ▼
┌─────────────────────────────────────────────────────┐
│               K-Wedding Hub (데이터 소스)              │
│                                                      │
│   [제공] 시그널 API, 메트릭 API, 기대층 API            │
│   [수신] BSW의 예측 질문 수신 API                      │
│   [피드백] 출현 피드백을 BSW에 Push                    │
│   [조회] BSW의 예측 질문 목록 조회                     │
└─────────────────────────────────────────────────────┘
```

### Hub가 구현해야 할 것

| 역할 | API | 방향 | 설명 |
|------|-----|------|------|
| **데이터 제공자** | `POST /api/v1/qis/signals` | BSW → Hub 호출 | 시그널 데이터 제공 (기존 구현 활용) |
| **데이터 제공자** | `GET /api/v1/qis/metrics` | BSW → Hub 호출 | 실측 메트릭 제공 (**신규 필요**) |
| **데이터 제공자** | `GET /api/v1/qis/layers` | BSW → Hub 호출 | 기대층 데이터 제공 (**신규 필요**) |
| **데이터 수신자** | `POST /api/v1/qis/questions` | BSW → Hub 호출 | 예측 질문 수신 (기존 구현 활용) |
| **피드백 발신자** | `POST BSW/api/v1/qis/feedback` | Hub → BSW 호출 | 출현 피드백 전송 (**신규 필요**) |
| **조회자** | `GET BSW/api/v1/qis/predictions` | Hub → BSW 호출 | 예측 질문 조회 (**신규 필요**) |

---

## 2. 인증

모든 API 호출에는 `X-QIS-Api-Key` HTTP 헤더가 필요합니다.

```
X-QIS-Api-Key: <발급된 API 키>
```

- BSW는 이 키의 SHA-256 해시를 서버에 저장하고, 상수 시간(Constant-time) 비교로 검증합니다.
- Hub 측도 동일한 방식으로 BSW의 요청을 검증해야 합니다.
- **API 키는 양측 합의 후 발급하며, 절대 클라이언트 코드에 노출하지 마세요.**

---

## 3. Hub가 제공해야 할 API (BSW가 Pull하는 대상)

### 3.1. 시그널 API — `POST /api/v1/qis/signals`

> **이미 구현되어 있을 수 있습니다.** BSW의 기존 `KWeddingHubCollector`가 이 엔드포인트를 호출합니다.

BSW가 Hub의 원시 시그널(커뮤니티 질문, 후기, 가격 제보 등)을 수집합니다.

**요청**: BSW → Hub

```http
POST /api/v1/qis/signals
X-QIS-Api-Key: <API_KEY>
```

**응답 형식**:

```json
{
  "ok": true,
  "data": [
    {
      "signal_type": "community_question",
      "raw_text": "웨딩홀 계약금 환불 규정이 어떻게 되나요?",
      "predicted_impact": "high",
      "metadata": {
        "source_channel": "cafe_agora",
        "category": "계약/환불"
      }
    }
  ]
}
```

**지원 signal_type 값**:

| signal_type | 설명 |
|-------------|------|
| `community_question` | CAFE 아고라 Q&A |
| `verified_review` | 안심 후기 |
| `price_report` | 실거래가 제보 |
| `stress_pattern` | WeddyCare 스트레스 데이터 |
| `deal_room_contract` | Deal Room 계약 조건 |
| `deal_room_price` | Deal Room 시세 데이터 |
| `style_dna_trend` | Style DNA 트렌드 |
| `event_intent` | 파티 플래너 의도 |
| `newlywed_lifecycle` | 신혼 라이프 데이터 |
| `family_conflict` | Family Bridge 갈등 패턴 |
| `sentiment_pattern` | 감정 패턴 분석 |
| `deal_contract` | 딜 계약 분석 |
| `deal_price` | 딜 가격 분석 |
| `trend_signal` | 트렌드 시그널 |
| `intent_signal` | 의도 시그널 |
| `lifecycle_event` | 라이프사이클 이벤트 |
| `conflict_pattern` | 갈등 패턴 |
| `entity_created` | 엔티티 생성 |
| `entity_reviewed` | 엔티티 리뷰 |
| `comparison_requested` | 비교 요청 |

---

### 3.2. 메트릭 API — `GET /api/v1/qis/metrics` (신규 구현 필요)

BSW가 Hub의 실측 성과 데이터를 능동적으로 수집합니다.

**요청**: BSW → Hub

```http
GET /api/v1/qis/metrics?hub_slug=kwedding&since=2024-06-01T00:00:00Z
X-QIS-Api-Key: <API_KEY>
```

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `hub_slug` | string | 선택 | Hub 식별자 (예: `kwedding`) |
| `since` | string (ISO 8601) | 선택 | 이 시점 이후 데이터만 반환 |

**응답 형식**:

```json
{
  "ok": true,
  "data": {
    "metrics": [
      {
        "metric_type": "question_frequency",
        "industry": "wedding",
        "hub_slug": "kwedding",
        "period_start": "2024-06-01T00:00:00Z",
        "period_end": "2024-06-07T23:59:59Z",
        "value": 342,
        "sample_size": 1500,
        "breakdown": {
          "cafe_agora": 180,
          "deal_room": 95,
          "stress_check": 67
        }
      }
    ]
  }
}
```

**지원 metric_type 값**:

| metric_type | 설명 | value 의미 |
|-------------|------|------------|
| `question_frequency` | 질문 빈도 실측 | 해당 기간 질문 수 |
| `conversion_rate` | Deal Room 계약 전환율 | 비율 (0~1) |
| `average_transaction` | 실거래 평균 단가 | 원 단위 금액 |
| `stress_seasonal` | 감정 계절 패턴 | 스트레스 지수 (0~100) |
| `question_emergence` | 예측 질문 실제 출현 확인 | 출현 횟수 |
| `ai_visibility_score` | AI 검색 노출 점수 | 점수 (0~100) |
| `probe_citation_rate` | 프로브 인용률 | 비율 (0~1) |
| `sentiment_seasonal` | 계절 감정 패턴 | 감정 지수 (0~100) |

---

### 3.3. 기대층 API — `GET /api/v1/qis/layers` (신규 구현 필요)

BSW가 Hub의 현장 데이터 기반 기대층(Expected Layer) 정보를 수집합니다.

**요청**: BSW → Hub

```http
GET /api/v1/qis/layers?hub_slug=kwedding
X-QIS-Api-Key: <API_KEY>
```

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `hub_slug` | string | 선택 | Hub 식별자 |

**응답 형식**:

```json
{
  "ok": true,
  "data": {
    "layers": [
      {
        "question_reference": "wedding-hall-refund-policy",
        "tier": "must_include",
        "content": "소비자보호법 제17조에 의거, 계약일로부터 7일 이내 청약철회 가능",
        "source": "contract_clause",
        "confidence": 0.95,
        "sample_count": 230,
        "industry": "wedding"
      },
      {
        "question_reference": "wedding-hall-refund-policy",
        "tier": "caution",
        "content": "업체별 약관이 다르므로 계약서 세부 조항 반드시 확인 필요",
        "source": "community_consensus",
        "confidence": 0.88,
        "sample_count": 145,
        "industry": "wedding"
      }
    ]
  }
}
```

**tier 5단계**:

| tier | 설명 | 예시 |
|------|------|------|
| `must_include` | 반드시 포함 | 법적 근거, 공식 규정 |
| `strongly_recommended` | 강력 권장 | 전문가 인증, 안전 가이드 |
| `should_include` | 포함 권장 | 가격 비교, 체크리스트 |
| `caution` | 주의 사항 | 과장 광고 주의, 개인차 존재 |
| `must_not_do` | 절대 금지 | 허위 보장, 비인가 행위 |

**source 값 예시**: `verified_review`, `price_data`, `contract_clause`, `safety_guard`, `community_consensus`

---

## 4. Hub가 수신해야 할 API (BSW가 Push하는 대상)

### 4.1. 예측 질문 수신 — `POST /api/v1/qis/questions`

> **이미 구현되어 있을 수 있습니다.**

BSW가 AI 분석을 마친 고가치 예측 질문을 Hub에 전달합니다.

**요청**: BSW → Hub

```http
POST /api/v1/qis/questions
Content-Type: application/json
X-QIS-Api-Key: <API_KEY>
```

```json
{
  "questions": [
    {
      "bsw_question_id": "550e8400-e29b-41d4-a716-446655440000",
      "question_text": "웨딩홀 계약금 환불 규정과 위약금 기준은 어떻게 되나요?",
      "predicted_intent": "legal_compliance",
      "predicted_volume": "high",
      "confidence": 0.92,
      "first_mover_window_days": 14,
      "current_ai_coverage": "sparse",
      "auto_must_include": [
        "소비자보호법 제17조 청약철회권",
        "공정거래위원회 표준약관 기준"
      ],
      "auto_must_not_do": [
        "환불 불가라고 단정적 표현",
        "특정 업체 비방"
      ],
      "qvs_composite": 85.5
    }
  ]
}
```

**각 필드 설명**:

| 필드 | 타입 | 설명 |
|------|------|------|
| `bsw_question_id` | UUID | BSW 내부 질문 ID (피드백 시 이 ID 사용) |
| `question_text` | string | 예측 질문 본문 |
| `predicted_intent` | string | 예측된 검색 의도 |
| `predicted_volume` | enum | 예상 검색량 (`low`, `medium`, `high`) |
| `confidence` | number | 예측 신뢰도 (0.0 ~ 1.0) |
| `first_mover_window_days` | integer | 선점 골든타임 (일) |
| `current_ai_coverage` | enum | 현재 AI 답변 커버리지 (`none`, `sparse`, `moderate`, `saturated`) |
| `auto_must_include` | string[] | 콘텐츠 필수 포함 사항 |
| `auto_must_not_do` | string[] | 콘텐츠 절대 금지 사항 |
| `qvs_composite` | number | QVS 종합 점수 (0~100) |

**기대 응답**:

```json
{
  "ok": true,
  "data": { "received": 1 }
}
```

---

## 5. Hub가 BSW에 호출할 API

### 5.1. 피드백 전송 — `POST {BSW_URL}/api/v1/qis/feedback`

Hub에서 BSW가 예측한 질문이 실제로 출현했음을 확인하면 이 API로 피드백을 전송합니다. 이 피드백은 BSW의 예측 모델 정확도를 자동 보정하는 데 사용됩니다.

**요청**: Hub → BSW

```http
POST https://{BSW_URL}/api/v1/qis/feedback
Content-Type: application/json
X-QIS-Api-Key: <API_KEY>
```

```json
{
  "feedbacks": [
    {
      "bsw_question_id": "550e8400-e29b-41d4-a716-446655440000",
      "emerged": true,
      "emerged_at": "2024-06-20T14:30:00Z",
      "emergence_source": "cafe_agora",
      "actual_frequency": 47
    },
    {
      "bsw_question_id": "660e8400-e29b-41d4-a716-446655440001",
      "emerged": false
    }
  ]
}
```

**각 필드 설명**:

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `bsw_question_id` | UUID | ✅ | BSW가 Push할 때 제공한 질문 ID |
| `emerged` | boolean | ✅ | 실제 출현 여부 |
| `emerged_at` | string (ISO 8601) | 선택 | 출현 시점 (emerged=true 시 권장) |
| `emergence_source` | string | 선택 | 출현 채널 (예: `cafe_agora`, `review`, `deal_room`) |
| `actual_frequency` | integer | 선택 | 실제 발생 빈도수 |

**성공 응답**:

```json
{
  "ok": true,
  "data": { "processed": 2 }
}
```

**에러 응답**:

```json
// 401 — 인증 실패
{ "ok": false, "error": "Unauthorized" }

// 400 — 페이로드 유효성 실패
{ "ok": false, "error": "Invalid payload", "details": [...] }

// 500 — 서버 오류
{ "ok": false, "error": "Internal server error" }
```

> **💡 피드백 전송 권장 빈도**: 일 1회 Cron 또는 출현 감지 즉시 (실시간 Hook)

---

### 5.2. 예측 질문 조회 — `GET {BSW_URL}/api/v1/qis/predictions`

Hub가 BSW의 최신 예측 질문 목록을 조회합니다. 아직 출현하지 않은(`emerged=false`) 예측만 반환됩니다.

**요청**: Hub → BSW

```http
GET https://{BSW_URL}/api/v1/qis/predictions?limit=20&min_confidence=0.8
X-QIS-Api-Key: <API_KEY>
```

| 파라미터 | 타입 | 기본값 | 설명 |
|----------|------|--------|------|
| `limit` | integer | 50 | 최대 반환 건수 |
| `min_confidence` | float | 0.7 | 최소 신뢰도 필터 |

**성공 응답**:

```json
{
  "ok": true,
  "data": {
    "predictions": [
      {
        "bsw_question_id": "550e8400-e29b-41d4-a716-446655440000",
        "question_text": "웨딩홀 계약금 환불 규정과 위약금 기준은 어떻게 되나요?",
        "predicted_intent": "legal_compliance",
        "predicted_volume": "high",
        "confidence": 0.92,
        "first_mover_window_days": 14,
        "current_ai_coverage": "sparse",
        "auto_must_include": ["소비자보호법 제17조"],
        "auto_must_not_do": ["환불 불가 단정"],
        "qvs_composite": 85.5
      }
    ]
  }
}
```

> **💡 활용 예시**: Hub 대시보드에서 "BSW 예측 질문" 섹션으로 표시하거나, 콘텐츠 팀에 자동 과제 생성 연결

---

## 6. 환경 변수 설정

### Hub 측 (.env)

```env
# BSW 연동 설정
BSW_API_URL=https://bsw.example.com      # BSW 서버 URL
BSW_QIS_API_KEY=<합의된 API 키>           # BSW API 호출 시 사용

# Hub 자체 QIS 인증 (BSW가 Hub를 호출할 때 검증용)
QIS_API_KEY_HASH=<API 키의 SHA-256 해시>  # BSW 요청 검증용
```

### API 키 해시 생성 방법

```bash
# 양측이 공유하는 API 키로 해시 생성
echo -n "your-shared-api-key" | sha256sum
# 결과 예: a1b2c3d4e5f6... ← 이 값을 QIS_API_KEY_HASH로 설정
```

---

## 7. 연동 시퀀스 다이어그램

### 7.1. 일상 사이클 (매일)

```
시간축 ──────────────────────────────────────────────►

[BSW Cron - 매일 새벽]
  │
  ├─► POST Hub/api/v1/qis/signals     시그널 수집 (Pull)
  │   ◄── Hub가 최신 시그널 배열 반환
  │
  ├─► GET Hub/api/v1/qis/metrics      메트릭 수집 (Pull)
  │   ◄── Hub가 기간별 성과 데이터 반환
  │
  ├─► GET Hub/api/v1/qis/layers       기대층 수집 (Pull)
  │   ◄── Hub가 5-tier 기대층 데이터 반환
  │
  ├─► [BSW 내부] S-OGDE v2.0 파이프라인 실행
  │   메타질문 → 탐색 → 심화 → 중복제거 → 평가 → 예측
  │
  └─► POST Hub/api/v1/qis/questions   예측 질문 공급 (Push)
      ◄── Hub가 수신 확인

[Hub Cron - 매일 저녁]
  │
  ├─► GET BSW/api/v1/qis/predictions  예측 목록 조회
  │   ◄── BSW가 미출현 예측 질문 반환
  │
  └─► POST BSW/api/v1/qis/feedback    출현 피드백 전송
      ◄── BSW가 처리 결과 반환 (+ 내부 정확도 재보정)
```

### 7.2. 피드백 루프 효과

```
BSW 예측 ──► Hub 수신 ──► Hub 관측 ──► Hub 피드백 ──► BSW 학습
                                                       │
                                                       ▼
                                               예측 정확도 향상
                                               신호 가중치 재보정
                                               업종별 편향 분석
```

---

## 8. 에러 처리 가이드

### 공통 응답 형식

모든 API는 동일한 응답 래퍼를 사용합니다:

```typescript
interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
  details?: any;  // 400 에러 시 유효성 검증 상세
}
```

### HTTP 상태 코드

| 코드 | 의미 | 조치 |
|------|------|------|
| `200` | 성공 | 정상 처리 |
| `400` | 잘못된 요청 | `details` 필드 확인 후 페이로드 수정 |
| `401` | 인증 실패 | `X-QIS-Api-Key` 헤더 확인 |
| `500` | 서버 오류 | 재시도 (지수 백오프 권장) |

### 재시도 전략

```typescript
// 권장 재시도 설정
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000,    // 1초
  maxDelayMs: 30000,    // 30초
  backoffMultiplier: 2  // 지수 백오프
};
```

---

## 9. 체크리스트

Hub 개발팀이 연동을 완료하기 위한 체크리스트입니다:

- [ ] **환경 변수 설정**: `BSW_API_URL`, `BSW_QIS_API_KEY`, `QIS_API_KEY_HASH`
- [ ] **시그널 API 확인**: `POST /api/v1/qis/signals` — 기존 구현 동작 확인
- [ ] **메트릭 API 신규 구현**: `GET /api/v1/qis/metrics` — 섹션 3.2 참조
- [ ] **기대층 API 신규 구현**: `GET /api/v1/qis/layers` — 섹션 3.3 참조
- [ ] **예측 질문 수신 API 확인**: `POST /api/v1/qis/questions` — 기존 구현 동작 확인
- [ ] **피드백 전송 구현**: Hub Cron 또는 Hook에서 `POST BSW/api/v1/qis/feedback` 호출
- [ ] **예측 조회 구현**: Hub 대시보드/Cron에서 `GET BSW/api/v1/qis/predictions` 호출
- [ ] **통합 테스트 수행**: 양측 API를 실제 환경에서 End-to-End 검증

---

## 10. 연락처

| 담당 | 역할 | 비고 |
|------|------|------|
| BSW 시스템 | 질문 발굴 엔진, 예측 질문 공급 | QIS 파이프라인 관련 문의 |
| K-Wedding Hub | 데이터 소스, 피드백 제공 | 시그널/메트릭/기대층 API 관련 문의 |
