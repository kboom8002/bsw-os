# kwedding QIS 연동 — 시스템 가이드 & 프로덕션 UI 활용 튜토리얼

> **대상**: BSW-OS 운영자, Hub 연동 담당자
> **작성일**: 2026-06-27
> **프로덕션 URL**: https://answerhub.kr
> **버전**: QIS Integration v2.0 (3축 라우팅 적용)

---

## 목차

1. [시스템 개요](#1-시스템-개요)
2. [연동 아키텍처 & 데이터 흐름](#2-연동-아키텍처--데이터-흐름)
3. [올바른 작업 순서](#3-올바른-작업-순서)
4. [STEP-BY-STEP 프로덕션 UI 점검 튜토리얼](#4-step-by-step-프로덕션-ui-점검-튜토리얼)
5. [API 엔드포인트 레퍼런스](#5-api-엔드포인트-레퍼런스)
6. [환경변수 체크리스트](#6-환경변수-체크리스트)
7. [트러블슈팅 가이드](#7-트러블슈팅-가이드)
8. [운영 자동화 (Vercel Cron)](#8-운영-자동화-vercel-cron)

---

## 1. 시스템 개요

### BSW QIS란?

BSW(Brand Search Warehouse)는 **AI 검색 최적화 질문 예측 엔진**입니다.

```
Hub 커뮤니티 데이터 → BSW 분석 → 예측 질문 생성 → Hub에 공급
```

**핵심 가치**:
- Hub의 실제 웨딩 커뮤니티 시그널(Q&A, 후기, 계약 분쟁 등)을 BSW가 수집
- AI 분석으로 소비자가 AI에게 물어볼 질문을 사전 예측 (confidence >= 0.7)
- 예측 질문에 콘텐츠 가이드라인(must_include/must_not_do) 자동 첨부
- Hub 콘텐츠팀이 First Mover 기회를 선점 (예측 창: 14~90일)

### 3축 라우팅

모든 예측 질문은 3가지 축으로 분류됩니다:

| 축 | 설명 | 예시 signal_type |
|----|------|-----------------|
| **Industry** | 웨딩 업종 일반 (기본) | community_question, deal_room_contract |
| **Place** | 지역 기반 | place_review, place_inquiry |
| **Vortex** | 테마 DAO | vortex_mission_signal |
| **Cross-Axis** | 지역+테마 교차 | cross_axis_trend |

---

## 2. 연동 아키텍처 & 데이터 흐름

```
[Hub: admin.aihompy.kr]
  웨딩 커뮤니티  ->  hub_signals  ->  POST /api/v1/qis/signals
  실측 메트릭   ->  hub_metrics  ->  GET  /api/v1/qis/metrics
  기대층 레이어 ->  hub_layers   ->  GET  /api/v1/qis/layers
  <- POST /api/v1/qis/questions  <-  hub_canonical_questions

         | Pull (BSW가 호출)            | Push (BSW가 호출)

[BSW: answerhub.kr]
  [1] Pull Phase
      KWeddingHubCollector   -> bsw_received_signals
      QisHubClient.pullMetrics  -> bsw_received_metrics
      QisHubClient.pullExpectedLayers -> bsw_expected_layers

  [2] 예측 생성
      QuestionPredictor -> predicted_questions
      (기본 + YMYL 안전 + 비교 분석, 각 1개씩 x3종)

  [3] Push Phase
      3축 라우팅 -> QisHubClient.pushPredictedQuestions
      (industry / place / vortex / cross_axis 별 전송)
```

### DB 테이블 흐름

```
Hub 시그널 수신
  -> bsw_received_signals
       -> predicted_questions  (QuestionPredictor 자동 생성)
            -> bsw_predicted_questions  (upsert, Cron Push 전)
                 -> [Hub] hub_canonical_questions (source='bsw_prediction')
```

---

## 3. 올바른 작업 순서

> BSW Cron이 먼저가 아닙니다. Hub API가 먼저입니다.

### 선행 조건 (Hub 팀 담당)

Hub 팀이 아래 3개 API를 오픈해야 BSW의 Pull이 의미 있게 작동합니다.

```
① Hub: POST /api/v1/qis/signals  오픈 (P0 - 필수)
        -> 웨딩 시그널 반환 (community_question 등)

② Hub: GET  /api/v1/qis/metrics  오픈 (P2 - 권장)
        -> 실측 메트릭 반환

③ Hub: GET  /api/v1/qis/layers   오픈 (P3 - 선택)
        -> 기대층 레이어 반환
```

### 전체 실행 순서

```
[STEP 1] Hub API 오픈 확인         (Hub 팀)
    |
[STEP 2] BSW 환경변수 확인          (BSW 팀)
    |      HUB_API_URL=https://admin.aihompy.kr
    |      HUB_API_KEY=bsw-qis-2026-e27b85e867954582
    |
[STEP 3] phase=pull 수동 트리거    (BSW UI)
    |      Hub 시그널 수집 -> bsw_received_signals 저장
    |      QuestionPredictor 자동 실행 -> predicted_questions 생성
    |
[STEP 4] DB 데이터 확인             (Supabase 대시보드)
    |      predicted_questions 테이블에 wedding 예측 확인
    |
[STEP 5] phase=push 수동 트리거    (BSW UI)
    |      predicted_questions -> Hub 전송
    |      Hub hub_canonical_questions 저장 확인
    |
[STEP 6] 정상 운영 (Vercel Cron)    (자동)
           매일 03:00 KST phase=all 자동 실행
```

---

## 4. STEP-BY-STEP 프로덕션 UI 점검 튜토리얼

### 준비사항

- BSW-OS 계정으로 로그인 상태
- Hub API 오픈 여부 확인 완료

---

### STEP 1. QIS 3축 Hub 동기화 UI 접근

**경로**: 시맨틱 코어 -> QIS 3축 Hub 동기화

또는 직접 URL:
```
https://answerhub.kr/ko/{workspace_slug}/semantic-core/qis-triaxis
```

**화면 구성 확인**:
- 상단 헤더에 "QIS 3축 Hub 동기화" 제목
- "수동 트리거" 패널 (Terminal 아이콘)
- 실행 모드 드롭다운 (Push / Pull / All)
- 호출 URL 미리보기 바
- "지금 실행" 버튼

---

### STEP 2. Hub API 연결 상태 확인 (Pull 테스트)

**목적**: Hub의 /api/v1/qis/signals 가 응답하는지 확인

1. "실행 모드" 드롭다운 클릭
2. **Pull** 선택 (Hub -> 시그널·메트릭·레이어 수집만)
3. URL 미리보기 확인:
   ```
   GET /api/cron/qis-sync?phase=pull
   ```
4. **지금 실행** 버튼 클릭
5. 실행 로그 확인

**정상 응답 (Hub API 준비됨)**:
```
✅ QIS Sync 시작 — phase: PULL
📥 시그널 수집: 15개 — ok
📊 메트릭 수집: 3개 — ok
🧱 기대층 수집: 8개 — ok
✅ 동기화 완료
```

**Hub API 미준비 상태 (시그널 0개)**:
```
📥 시그널 수집: 0개 — ok
```
-> 하단 노란색 안내 박스 표시:
"Hub 팀의 POST /api/v1/qis/signals 엔드포인트가 아직 준비되지 않았거나 데이터가 없습니다."

---

### STEP 3. Supabase에서 시그널 수신 확인

**접속**: Supabase 대시보드 -> BSW 프로젝트 -> Table Editor

**확인할 테이블**:

| 테이블 | 확인 내용 |
|--------|----------|
| bsw_received_signals | Pull로 수집된 Hub 시그널 (industry='wedding') |
| predicted_questions | 자동 생성된 예측 질문 (confidence >= 0.7) |

**SQL 빠른 조회**:
```sql
-- 최근 수신 시그널 확인
SELECT source_platform, signal_type, industry, raw_text, predicted_impact, created_at
FROM bsw_received_signals
WHERE industry = 'wedding'
ORDER BY created_at DESC
LIMIT 20;

-- 생성된 예측 질문 확인
SELECT question_text, predicted_intent, confidence, first_mover_window_days, current_ai_coverage
FROM predicted_questions
WHERE industry = 'wedding'
ORDER BY created_at DESC
LIMIT 20;
```

**정상**: predicted_questions에 wedding 데이터가 생성됨
**이상**: 데이터 없음 -> STEP 2 재실행 또는 Hub API 점검

---

### STEP 4. 예측 질문 Hub 전송 (Push 테스트)

**목적**: BSW 예측 질문을 Hub의 hub_canonical_questions에 전송

1. "실행 모드" 드롭다운 클릭
2. **Push** 선택 (예측 질문 -> Hub 전송만)
3. URL 미리보기 확인:
   ```
   GET /api/cron/qis-sync?phase=push
   ```
4. **지금 실행** 버튼 클릭

**정상 응답**:
```
🚀 QIS Sync 시작 — phase: PUSH
📤 Hub Push: 15개 — ok
   ↳ Industry: 12 | Place: 2 | Vortex: 1 | Cross: 0
✅ 동기화 완료
```

화면 하단 **3축 결과 카드** 표시:
```
Industry  Place  Vortex  Cross-Axis
  12건     2건     1건      0건
```

**예측 질문 없음 상태**:
```
📤 Hub Push: 0개 — no_new_predictions
```
-> 파란색 안내 박스:
"먼저 Pull을 실행하여 Hub 시그널을 수집하면 예측 질문이 자동 생성됩니다."

---

### STEP 5. Hub에서 수신 데이터 확인 (Hub 팀 담당)

Hub 팀이 아래를 확인합니다:

```sql
-- Hub DB에서 BSW 전송 데이터 확인
SELECT bsw_question_id, question_text, predicted_intent, confidence, target_axis
FROM hub_canonical_questions
WHERE source = 'bsw_prediction'
ORDER BY created_at DESC
LIMIT 20;
```

**정상**: source='bsw_prediction' 데이터 수신 확인
-> Hub QIS 탭 BSW 패널 정상 상태로 전환

---

### STEP 6. 전체 사이클 통합 테스트 (All Phase)

Hub API + BSW Push 모두 준비된 상태에서 전체 사이클을 한 번에 검증합니다.

1. "실행 모드" -> **All (Pull + Push)** 선택
2. **지금 실행** 클릭
3. 정상 응답 확인:

```
🚀 QIS Sync 시작 — phase: ALL
📥 시그널 수집: 15개 — ok
📊 메트릭 수집: 3개 — ok
🧱 기대층 수집: 8개 — ok
📤 Hub Push: 15개 — ok
   ↳ Industry: 12 | Place: 2 | Vortex: 1 | Cross: 0
✅ 동기화 완료
```

또는 URL로 직접 호출 (수동 테스트):
```
GET https://answerhub.kr/api/cron/qis-sync?secret=cron-a6ebf58c5057414186a53bc3&phase=all
```

---

### STEP 7. 피드백 루프 활성화 (선택적)

Hub 팀이 예측 질문의 실제 출현 여부를 BSW에 피드백 전송:

```http
POST https://answerhub.kr/api/v1/qis/feedback
X-QIS-Api-Key: bsw-qis-2026-e27b85e867954582
Content-Type: application/json

{
  "feedbacks": [
    {
      "bsw_question_id": "uuid-...",
      "emerged": true,
      "emerged_at": "2026-06-27T09:00:00.000Z",
      "emergence_source": "cafe_agora",
      "actual_frequency": 347
    }
  ]
}
```

피드백이 쌓이면 BSW의 예측 정확도(prediction_accuracy)가 자동 보정됩니다.

---

## 5. API 엔드포인트 레퍼런스

### BSW 제공 API (Hub가 호출)

#### POST /api/v1/qis/signals/ingest
Hub가 실시간 시그널을 BSW에 직접 Push하는 엔드포인트입니다.

```
POST https://answerhub.kr/api/v1/qis/signals/ingest
X-QIS-Api-Key: bsw-qis-2026-e27b85e867954582
Content-Type: application/json

{
  "signals": [{
    "source_platform": "kweddinghub",
    "signal_type": "community_question",
    "industry": "wedding",
    "hub_axis": "industry",
    "raw_text": "웨딩홀 계약 위약금 환불 기준이 어떻게 되나요?",
    "metadata": {},
    "predicted_impact": "high",
    "detected_at": "2026-06-27T00:00:00.000Z"
  }]
}
```

성공 응답:
```json
{ "ok": true, "received": 1, "stored": 1, "predictions_generated": 3 }
```

#### GET /api/v1/qis/predictions
Hub가 BSW의 최신 예측 질문 목록을 조회하는 엔드포인트입니다.

```
GET https://answerhub.kr/api/v1/qis/predictions?limit=50&min_confidence=0.7
X-QIS-Api-Key: bsw-qis-2026-e27b85e867954582
```

#### POST /api/v1/qis/feedback
Hub가 예측 질문의 실제 출현 여부를 피드백하는 엔드포인트입니다.

```
POST https://answerhub.kr/api/v1/qis/feedback
X-QIS-Api-Key: bsw-qis-2026-e27b85e867954582
```

### BSW가 호출하는 Hub API (Hub 팀이 구현)

| 엔드포인트 | 방식 | 우선순위 | 설명 |
|-----------|------|---------|------|
| /api/v1/qis/signals | POST | P0 필수 | 웨딩 시그널 제공 |
| /api/v1/qis/questions | POST | P1 중요 | BSW 예측 질문 수신 |
| /api/v1/qis/metrics | GET | P2 권장 | 실측 메트릭 제공 |
| /api/v1/qis/layers | GET | P3 선택 | 기대층 레이어 제공 |

---

## 6. 환경변수 체크리스트

### BSW Vercel 환경변수 (설정 완료)

```
HUB_API_URL=https://admin.aihompy.kr
HUB_API_KEY=bsw-qis-2026-e27b85e867954582
KWEDDINGHUB_API_URL=https://admin.aihompy.kr
KWEDDINGHUB_API_KEY=bsw-qis-2026-e27b85e867954582
CRON_SECRET=cron-a6ebf58c5057414186a53bc3
```

확인 명령:
```bash
vercel env ls | Select-String "HUB|KWEDDING|CRON"
```

### .env.local (로컬 개발용)

```env
HUB_API_URL=https://admin.aihompy.kr
HUB_API_KEY=bsw-qis-2026-e27b85e867954582
KWEDDINGHUB_API_URL=https://admin.aihompy.kr
KWEDDINGHUB_API_KEY=bsw-qis-2026-e27b85e867954582
QIS_API_KEY_HASH=76cb038afc38e538311ae1d8c936d86b66ca5dd120fc9afbed728248b8185c0b
CRON_SECRET=cron-a6ebf58c5057414186a53bc3
```

> .env.local 은 절대 git에 커밋하지 마세요 (.gitignore에 포함됨)

---

## 7. 트러블슈팅 가이드

### 문제 1: Pull count가 계속 0

원인 진단:
```
1. Hub API가 아직 오픈되지 않음
2. X-QIS-Api-Key 값 불일치
3. Hub URL이 잘못됨
   (aihompy.vercel.app -> admin.aihompy.kr 확인)
```

확인 방법:
```bash
curl -X POST https://admin.aihompy.kr/api/v1/qis/signals \
  -H "X-QIS-Api-Key: bsw-qis-2026-e27b85e867954582" \
  -H "Content-Type: application/json" \
  -d "{}"
```

기대 응답: `{ "ok": true, "data": [...] }`

---

### 문제 2: Push count가 0 (no_new_predictions)

원인: predicted_questions 테이블이 비어있음

해결 순서:
1. Pull을 먼저 실행하여 시그널 수집
2. predicted_questions 테이블 직접 확인:
   ```sql
   SELECT COUNT(*) FROM predicted_questions WHERE industry='wedding';
   ```
3. 0이면 bsw_received_signals 도 확인:
   ```sql
   SELECT COUNT(*) FROM bsw_received_signals WHERE industry='wedding';
   ```

---

### 문제 3: 401 Unauthorized

BSW Cron API 호출 방식별 인증:

| 호출 방식 | 필요한 인증 |
|----------|-----------|
| URL 직접 | ?secret=cron-a6ebf58c5057414186a53bc3 |
| UI 버튼 | X-Manual-Trigger: true 헤더 (자동 적용) |
| Vercel Cron | Authorization: Bearer {CRON_SECRET} (자동) |
| Hub -> BSW | X-QIS-Api-Key: bsw-qis-2026-e27b85e867954582 |

---

### 문제 4: Hub push 결과가 push_failed

원인: Hub의 /api/v1/qis/questions 엔드포인트가 오류 반환

BSW가 Hub로 보내는 payload 구조:
```json
{
  "questions": [{
    "bsw_question_id": "uuid",
    "question_text": "string",
    "predicted_intent": "string",
    "predicted_volume": "low|medium|high",
    "confidence": 0.88,
    "first_mover_window_days": 30,
    "current_ai_coverage": "none|sparse|moderate|saturated",
    "auto_must_include": ["string"],
    "auto_must_not_do": ["string"],
    "target_axis": "industry|place|vortex|cross_axis",
    "geo_keywords": [],
    "recommended_formats": ["expert_column", "how_to", "data_brief"]
  }],
  "axis": "industry"
}
```

---

## 8. 운영 자동화 (Vercel Cron)

### 현재 설정 (vercel.json)

```json
{
  "crons": [
    {
      "path": "/api/cron/qis-sync?secret=CRON_SECRET",
      "schedule": "0 18 * * *"
    }
  ]
}
```

> 0 18 * * * = UTC 18:00 = KST 매일 03:00 (새벽 3시)

### Cron 실행 확인

Vercel 대시보드 -> BSW 프로젝트 -> Logs -> /api/cron/qis-sync 검색

### 수동 전체 사이클 실행 (긴급 시)

```bash
# URL 직접 호출
curl "https://answerhub.kr/api/cron/qis-sync?secret=cron-a6ebf58c5057414186a53bc3&phase=all"

# 또는 UI에서
# 시맨틱 코어 > QIS 3축 Hub 동기화 > All(Pull+Push) > 지금 실행
```

---

## 부록: 예측 질문 생성 로직

시그널 1개 수신 시 BSW가 자동으로 3종의 예측 질문을 생성합니다:

| 종류 | 설명 | confidence 배율 |
|------|------|----------------|
| 기본 질문 | 원본 시그널 기반 | x 1.00 |
| YMYL 안전 | 법적/안전 규제 관점 | x 0.90 |
| 비교 분석 | 브랜드별 장단점 비교 | x 0.85 |

predicted_impact -> confidence -> first_mover_window 매핑:

| predicted_impact | confidence | first_mover_window |
|-----------------|-----------|-------------------|
| critical | 0.95 | 14일 |
| high | 0.85 | 30일 |
| medium | 0.70 | 60일 |
| low | 0.50 | 90일 |

> confidence < 0.7 인 예측은 Push 대상에서 제외됩니다.

---

*이 문서는 BSW QIS v2.0 기준으로 작성되었습니다.*
*최신 API 스펙은 docs/KWEDDING_HUB_QIS_INTEGRATION_GUIDE.md 도 함께 참고하세요.*
