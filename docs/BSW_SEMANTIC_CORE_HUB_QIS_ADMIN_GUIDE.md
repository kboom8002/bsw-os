# BSW 시맨틱 코어 × Hub QIS 질문 자산 관리 — 관리자 가이드

> **문서 버전**: v1.0  
> **최종 수정일**: 2026-06-28  
> **대상 시스템**: BSW (Brand Search Warehouse) + aihompyhub (K-Wedding Hub)  
> **대상 독자**: 시스템 관리자, Hub 어드민 운영자

---

## 목차

1. [시스템 개요](#1-시스템-개요)
2. [아키텍처 및 데이터 흐름](#2-아키텍처-및-데이터-흐름)
3. [BSW 시맨틱 코어 운영 가이드](#3-bsw-시맨틱-코어-운영-가이드)
4. [Hub QIS 질문 자산 관리 운영 가이드](#4-hub-qis-질문-자산-관리-운영-가이드)
5. [양방향 연동 파이프라인 관리](#5-양방향-연동-파이프라인-관리)
6. [3축 라우팅 시스템](#6-3축-라우팅-시스템)
7. [예측 정확도 피드백 루프](#7-예측-정확도-피드백-루프)
8. [환경 변수 및 인증](#8-환경-변수-및-인증)
9. [일상 운영 체크리스트](#9-일상-운영-체크리스트)
10. [장애 대응 가이드](#10-장애-대응-가이드)
11. [모니터링 SQL 쿼리](#11-모니터링-sql-쿼리)

---

## 1. 시스템 개요

### 1.1. 두 시스템의 역할

| 시스템 | 프로젝트 | 핵심 역할 |
|--------|----------|----------|
| **BSW** (Brand Search Warehouse) | `\bsw` | 질문 발굴 엔진 — S-OGDE v2.0 파이프라인으로 AI 예측 질문을 생성·분석·공급 |
| **Hub** (aihompyhub) | `\aihompyhub` | 1차 데이터 소스 + 예측 질문 수신·활용·피드백 |

### 1.2. 핵심 산출물

| 산출물 | 생성 주체 | 활용 주체 |
|--------|----------|----------|
| 예측 질문 (Predicted Questions) | BSW | Hub |
| 5-Tier Expected Layer | BSW | Hub (답변 가드레일) |
| QVS 종합 점수 | BSW | Hub (우선순위 결정) |
| 출현 피드백 (Emergence Feedback) | Hub | BSW (정확도 자가 보정) |
| 1차 시그널 (Raw Signals) | Hub | BSW (발굴 원료) |

### 1.3. 연계 방식

**BSW 주도 Pull/Push 하이브리드** — BSW가 데이터 수집(Pull)과 결과 공급(Push)을 모두 주도하며, Hub는 피드백 전송과 예측 조회만 BSW에 요청합니다.

---

## 2. 아키텍처 및 데이터 흐름

### 2.1. 전체 양방향 데이터 흐름

```
┌──────────────────── BSW (질문 발굴 엔진) ────────────────────┐
│                                                               │
│  [시맨틱 코어 UI]                                             │
│    ├─ 시그널 레지스트리     → question_signals 테이블          │
│    ├─ 질문 자본 (Capital)   → question_capital_nodes 테이블    │
│    ├─ 정규 질문 (CQ)        → canonical_questions 테이블       │
│    ├─ QIS 씬               → qis_scenes 테이블               │
│    ├─ TCO 개념 사전         → tco_concepts 테이블             │
│    ├─ 지식 그래프 (KG)      → brand_ontology_nodes/edges      │
│    └─ 클레임 계보 게이트    → claim_nodes + lineage_records    │
│                                                               │
│  [S-OGDE v2.0 파이프라인]   9개 모듈, LLM 기반               │
│    SignalOrchestrator → MetaQuestionEngine → ExploratoryChain │
│    → RecursiveDeepener → SemanticDedup → SignalEvaluator      │
│                                                               │
│  [QIS 연동 엔진]                                              │
│    ├─ QuestionPredictor    → predicted_questions               │
│    ├─ PredictionAccuracyTracker → 자가 보정                   │
│    ├─ TriAxisRouter        → 3축 분류 (Industry/Place/Vortex) │
│    └─ QisHubClient         → Hub API 호출                     │
│                                                               │
│  [자동화 Cron]  매일 03:00 UTC (한국 12:00)                   │
│    /api/cron/qis-sync                                         │
│    ├─ Pull: Hub 시그널 + 메트릭 + 기대층 수집                 │
│    └─ Push: 예측 질문 → Hub에 3축 분류 전송                   │
│                                                               │
│  [BSW 인바운드 API]  Hub가 호출                               │
│    GET  /api/v1/qis/predictions  → 예측 질문 목록 제공        │
│    POST /api/v1/qis/feedback     → 출현 피드백 수신           │
│    POST /api/v1/qis/signals/ingest → 시그널 수신              │
│                                                               │
└───────────────────────┬────────────────┬──────────────────────┘
                        │  HTTPS          │  HTTPS
                        │  X-QIS-Api-Key  │  X-QIS-Api-Key
                        ▼                 ▼
┌──────────────── Hub (aihompyhub) ────────────────────────────┐
│                                                               │
│  [Hub QIS 어드민 UI]  /factory/qis                           │
│    ├─ Raw Inbox (원시 질문 접수)                               │
│    ├─ AI 클러스터링 (Gemini) → QC 패밀리 분류                 │
│    ├─ Finalize 모달 → 표준 정규 질문으로 확정                 │
│    ├─ Global Pool (업종별 검증된 질문 풀)                     │
│    └─ Dead-End Clusters (보류/거절 질문)                      │
│                                                               │
│  [테넌트 스튜디오]  /tenant/[id]/studio/foundation/           │
│    ├─ qis/           → QIS 질문 자산 관리 (테넌트별)          │
│    ├─ qis-gap/       → QIS 갭 분석 (미답변 질문 탐지)        │
│    ├─ qis-registry/  → QIS 등록 관리 (30K 줄, 핵심 UI)      │
│    └─ qis-performance/ → QIS 성과 모니터링                   │
│                                                               │
│  [Hub QIS API]  BSW가 호출                                   │
│    POST /api/v1/qis/signals    → 시그널 제공                 │
│    GET  /api/v1/qis/metrics    → 메트릭 제공                 │
│    GET  /api/v1/qis/layers     → 기대층 제공                 │
│    POST /api/v1/qis/questions  → 예측 질문 수신              │
│                                                               │
│  [Hub BSW 클라이언트]  lib/qis/bsw-client.ts                 │
│    pullBswPredictions()  → BSW에서 예측 질문 Pull             │
│    sendSignalToBsw()     → BSW에 시그널 Push                 │
│    sendFeedbackToBsw()   → BSW에 출현 피드백 전송            │
│                                                               │
│  [Hub 피드백 Cron]  매일 21:00 KST                           │
│    /api/cron/qis-feedback                                     │
│    └─ hub_canonical_questions에서 출현 여부 판단              │
│       + vortex_content_missions 3축 미션 완료 피드백          │
│       → sendFeedbackToBsw() 호출                             │
│                                                               │
│  [Hub QIS 라이브러리]  lib/qis/                              │
│    ├─ canonicalizer.ts    → 질문 정규화                       │
│    ├─ dedupPipeline.ts    → 중복 제거 파이프라인              │
│    ├─ goldenSetManager.ts → 골든셋 관리                      │
│    ├─ miner.ts            → 질문 마이닝                      │
│    └─ missionCreator.ts   → 미션 생성                        │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 2.2. API 연동 맵 요약

| 방향 | 엔드포인트 | 메서드 | BSW 파일 | Hub 파일 |
|------|-----------|--------|----------|----------|
| BSW → Hub | `/api/v1/qis/questions` | POST | `lib/qis/hub-client.ts` | (수신) |
| BSW → Hub | `/api/v1/qis/signals` | POST | `lib/prediction/signal-collectors/kweddinghub-collector.ts` | (수신) |
| BSW ← Hub | `/api/v1/qis/metrics` | GET | `lib/qis/hub-client.ts` | (제공) |
| BSW ← Hub | `/api/v1/qis/layers` | GET | `lib/qis/hub-client.ts` | (제공) |
| Hub → BSW | `/api/v1/qis/predictions` | GET | `app/api/v1/qis/predictions/route.ts` | `lib/qis/bsw-client.ts` |
| Hub → BSW | `/api/v1/qis/feedback` | POST | `app/api/v1/qis/feedback/route.ts` | `lib/qis/bsw-client.ts` |
| Hub → BSW | `/api/v1/qis/signals/ingest` | POST | `app/api/v1/qis/signals/ingest/route.ts` | `lib/qis/bsw-client.ts` |

---

## 3. BSW 시맨틱 코어 운영 가이드

### 3.1. 시맨틱 코어 접속

1. BSW에 로그인
2. 사이드바 → **"시맨틱 분석"** 그룹 → **"시맨틱 코어"** 클릭
3. 메인 대시보드에서 각 모듈의 **실시간 데이터 카운트** 확인

### 3.2. 시그널 레지스트리 (Signal Registry)

**경로**: 시맨틱 코어 → 시그널 레지스트리

**기능**:
- 질문 시그널의 수집·관리·프로모션
- S-OGDE v2.0 파이프라인 실행 (시그널 발굴 실행)
- 시그널 상태 관리: `mined` → `promoted` 또는 `ignored`
- 프로모션된 시그널 → 자동으로 질문 자본(Capital) 노드 생성

**운영 절차**:
1. "시그널 발굴 실행" 버튼 클릭 → 키워드/브랜드명 입력
2. S-OGDE 파이프라인 자동 실행 (메타질문 → 탐색 → 심화 → 중복제거 → 평가)
3. 발굴된 시그널 검토 → 유효한 것을 `promoted`로 변경
4. 선택된 시그널을 CQ(정규 질문)로 프로모션

**주의**: S-OGDE 파이프라인은 LLM API를 호출합니다. 대량 실행 시 API 비용 발생.

### 3.3. 질문 자본 (Question Capital)

**경로**: 시맨틱 코어 → 질문 자본

**기능**:
- 질문 영역(Territory)의 계층적 관리
- 전략적 가중치(Strategic Weight) 설정
- 부모-자식 계층 구조로 질문 영토 정의

**운영 절차**:
1. 시그널 프로모션 또는 직접 생성으로 노드 추가
2. 전략적 가중치(0~100) 설정 → QIS에서 우선순위 판단에 활용
3. 부모 노드 지정으로 계층 구조 구성

### 3.4. 정규 질문 (Canonical Questions)

**경로**: 시맨틱 코어 → 정규 질문

**기능**:
- 중복 제거된 표준 질문 관리
- SHA-256 시그니처 기반 자동 중복 탐지
- 중복 질문 병합(Merge) 기능
- Question Lifecycle Pipeline 시각화

**운영 절차**:
1. 시그널 프로모션 또는 직접 추가로 CQ 생성
2. 시그니처 중복 시 자동 경고 → 병합 또는 무시 결정
3. CQ → QIS Scene으로 연결하여 시나리오 생성

### 3.5. QIS 씬 (Query-Intent-Scenario)

**경로**: 시맨틱 코어 → QIS

**기능**:
- 정규 질문별 검색 시나리오 정의
- 의도 모델(Intent Model) 설정
- 위험도(Risk Level) 평가: low/medium/high/critical
- AI 에이전트를 통한 자동 씬 생성

**운영 절차**:
1. CQ 선택 → QIS Scene 생성
2. 쿼리 템플릿, 시나리오 컨텍스트, 의도 모델 입력
3. 위험도 설정 (YMYL 관련 질문은 high/critical)
4. "AI 자동 생성" 버튼으로 벌크 씬 생성 가능

### 3.6. QIS 3축 허브 동기화

**경로**: 시맨틱 코어 → QIS 3축 관리

**기능**:
- Hub와의 Pull/Push 수동 실행
- 3축(Industry/Place/Vortex) 분류 결과 확인
- 동기화 로그 실시간 모니터링

**운영 절차**:
1. Phase 선택: Pull / Push / All
2. "동기화 실행" 클릭
3. 실행 로그 및 결과 카드 확인

### 3.7. TCO 개념 사전, 지식 그래프, 클레임 계보

| 모듈 | 테이블 | 핵심 기능 |
|------|--------|----------|
| TCO 개념 사전 | `tco_concepts` | 브랜드 전문 용어 정의 |
| 지식 그래프 | `brand_ontology_nodes/edges` | 개념-질문-근거 간 관계망 시각화 |
| 클레임 계보 게이트 | `claim_nodes` + `lineage_records` | 클레임의 진실-증거-경계 3중 검증, SHA-256 봉인 |

---

## 4. Hub QIS 질문 자산 관리 운영 가이드

### 4.1. Hub 어드민 QIS 콘솔 접속

**경로**: Hub → Factory → QIS (`/factory/qis`)

### 4.2. 워크벤치 (Workbench)

Hub 어드민의 핵심 작업 공간입니다.

**업종 탭** (5개):
| 업종 | ID | 설명 |
|------|-----|------|
| 뷰티/스킨케어 | `skincare` | 스킨케어, K-뷰티 관련 |
| 클리닉/개원의 | `clinic` | 의료, 비수술 시술 |
| 부동산 중개 | `real_estate` | 부동산, 매물 관련 |
| 전문가/컨설팅 | `consulting` | 전문가 서비스 |
| 웨딩 스/드/메 | `wedding_sdm` | 웨딩 스드메 관련 |

**작업 흐름**:
1. 업종 탭 선택
2. **Raw Inbox** 확인 — 수집된 원시 질문 목록
3. 질문 선택 → **"AI 클러스터링"** 실행 (Gemini 기반)
4. AI 제안 결과 검토 → **Finalize 모달**에서 확정

### 4.3. Finalize 모달 — QC 패밀리 분류

AI 클러스터링 결과를 최종 확정하는 모달입니다.

**설정 항목**:

| 항목 | 옵션 | 설명 |
|------|------|------|
| QC 패밀리 | QC-01~QC-10 | 질문 의도 유형 (구매, 가격, 성분, 시술 등) |
| 지식 계층 | Layer A/B/C | 일반/전문/고위험 |
| Object 타입 | Answer/Proof/Boundary/Action | 답변 유형 |
| 위험도 | Low/Medium/High | 안전 등급 |

**QC 패밀리 10종**:
| ID | 명칭 | 설명 |
|----|------|------|
| QC-01 | 구매 의도 | 구매·결정·전환 관련 |
| QC-02 | 가격/비용 | 구체적 가격·비용·패키지 |
| QC-03 | 성분/원료 | 원료·성분·배합 정보 |
| QC-04 | 시술/과정 | 시술·서비스 프로세스 |
| QC-05 | 부작용/리스크 | 안전·부작용·리스크 |
| QC-06 | 사후관리 | A/S·관리 방법 |
| QC-07 | 브랜드 비교 | 경쟁 비교 |
| QC-08 | 자격/신뢰 | 자격증·경력 (BoundaryObject 필수) |
| QC-09 | 환불/보상 | 환불·취소·보상 |
| QC-10 | 일정/예약 | 예약·대기 관련 |

### 4.4. Global Pool — 업종별 검증된 질문 풀

Finalize 완료된 질문이 Global Pool에 등록됩니다.
- 업종별 필터링
- 테넌트에 배포(Push) 가능
- 각 질문에 QC 패밀리, Layer, Object 타입, 위험도 매핑

### 4.5. Dead-End Clusters — 보류/거절 질문

클러스터링 후 거절된 질문을 관리합니다.
- 재활용 가능 여부 검토
- 향후 트렌드 변화 시 재활성화

### 4.6. 테넌트 스튜디오 QIS 페이지

**경로**: Hub → 테넌트 → 스튜디오 → Foundation

| 페이지 | 파일 크기 | 기능 |
|--------|----------|------|
| QIS 질문 자산 | 15KB | 테넌트별 QIS 질문 관리 |
| QIS 갭 분석 | 14KB + 2KB | 미답변 질문 탐지·경고 |
| QIS 레지스트리 | 30KB | 핵심 질문 등록·관리 (가장 큰 UI) |
| QIS 성과 모니터링 | 17KB | 예측 정확도·출현율 시각화 |

---

## 5. 양방향 연동 파이프라인 관리

### 5.1. 자동화 스케줄

| 시간 (KST) | 시스템 | Cron | 기능 |
|------------|--------|------|------|
| 11:00 | BSW | `/api/cron/benchmark` | AI 검색 노출 정기 측정 |
| **12:00** | **BSW** | **`/api/cron/qis-sync`** | **Hub 연동 Pull/Push 전체 사이클** |
| **21:00** | **Hub** | **`/api/cron/qis-feedback`** | **출현 피드백 BSW 전송** |

### 5.2. BSW Cron 사이클 (매일 12:00 KST)

```
Phase 1 — Pull (Hub → BSW):
  KWeddingHubCollector.collect()     → bsw_received_signals
  QisHubClient.pullMetrics()         → bsw_received_metrics
  QisHubClient.pullExpectedLayers()  → bsw_expected_layers

Phase 2 — Push (BSW → Hub):
  predicted_questions 조회 (industry=wedding, confidence≥0.7)
  → bsw_predicted_questions UPSERT
  → enrichPredictionWithAxis() 3축 분류
  → buildTriAxisPayload() 그룹핑
  → QisHubClient.pushPredictedQuestions() 축별 전송
```

### 5.3. Hub 피드백 Cron 사이클 (매일 21:00 KST)

```
1. hub_canonical_questions에서 source='bsw_prediction' 조회
2. 출현 여부 판단: answer_count > 0 또는 status = 'verified'
3. vortex_content_missions에서 3축 미션 완료 피드백 수집
4. sendFeedbackToBsw() → BSW /api/v1/qis/feedback 호출
5. 전송 성공 시 feedback_sent 마킹
```

### 5.4. 수동 동기화 방법

**BSW 측 수동 실행** (UI):
1. 시맨틱 코어 → QIS 3축 관리 페이지
2. Phase 선택 (Pull/Push/All)
3. "동기화 실행" 클릭

**BSW 측 수동 실행** (CLI):
```bash
# 전체 사이클
curl "https://bsw-os.vercel.app/api/cron/qis-sync?secret=YOUR_CRON_SECRET"

# Pull만
curl "https://bsw-os.vercel.app/api/cron/qis-sync?secret=YOUR_CRON_SECRET&phase=pull"

# Push만
curl "https://bsw-os.vercel.app/api/cron/qis-sync?secret=YOUR_CRON_SECRET&phase=push"
```

---

## 6. 3축 라우팅 시스템

### 6.1. 3축 정의

| 축 | ID | 설명 | 예시 |
|----|-----|------|------|
| Industry | `industry` | 업종 기반 기본 라우팅 | wedding, beauty, hanbang |
| Place | `place` | 지역/장소 기반 라우팅 | 강남, 제주, 부산 |
| Vortex | `vortex` | 테마/버티컬 DAO 라우팅 | k-wedding, k-beauty, k-cafe |
| Cross-Axis | `cross_axis` | Place + Vortex 동시 감지 | "제주 웨딩" |

### 6.2. 자동 분류 우선순위

1. 시그널에 명시적 `hub_axis` → 그대로 사용
2. `place_slug` 또는 `geo_context` 존재 → `place`
3. `vortex_slug` 존재 → `vortex`
4. 원문 텍스트 키워드 탐지:
   - 22개 지역 키워드 (제주, 강남, 서울, 부산...)
   - 28개 테마 키워드 (웨딩, 뷰티, 카페, 한방...)
5. Place + Vortex 동시 감지 → `cross_axis`
6. 시그널 타입 폴백 (place_review → place, vortex_mission → vortex)
7. 기본값 → `industry`

### 6.3. 축별 추천 콘텐츠 포맷

| 축 | 추천 포맷 |
|----|----------|
| Industry | expert_column, how_to, data_brief |
| Place | case_study, comparison, answer |
| Vortex | answer, expert_column, data_brief |
| Cross-Axis | answer, case_study, expert_column |

---

## 7. 예측 정확도 피드백 루프

### 7.1. 전체 흐름

```
BSW 예측 질문 생성
  ↓
Hub에 전송 (Push)
  ↓
Hub에서 실제 콘텐츠 생성 / 질문 출현 관측
  ↓
Hub 피드백 Cron (21:00 KST) → BSW에 출현 피드백 전송
  ↓
BSW PredictionAccuracyTracker.verifyPrediction()
  ↓
피드백 3건 이상 누적 시 → recalibrateSignalWeights() 자동 실행
  ↓
시그널 소스별 가중치 재보정 → 차기 예측 품질 향상
```

### 7.2. 출현 판단 기준 (Hub 측)

| 조건 | 판정 |
|------|------|
| `answer_count > 0` | 출현 (콘텐츠 생성됨) |
| `status = 'verified'` | 출현 (검증 완료) |
| Vortex 미션 완료 (`completed`/`review`) | 출현 (3축 미션 완료) |

### 7.3. 정확도 재보정

`PredictionAccuracyTracker`가 시그널 소스별 예측 정확도를 추적합니다:

| 소스 타입 | 설명 |
|----------|------|
| `news` | 뉴스 시그널 |
| `regulation` | 규제 변경 |
| `search_trend` | 검색 트렌드 |
| `community` | 커뮤니티 질문 |
| `seasonal` | 계절 패턴 |
| `internal` | 내부 시그널 |

각 소스의 평균 정확도를 산출하고, 가중치를 `1.0 + (평균 - 0.5)`로 재보정합니다.

---

## 8. 환경 변수 및 인증

### 8.1. BSW 측 환경 변수

| 변수명 | 필수 | 설명 |
|--------|------|------|
| `HUB_API_URL` | ✅ | Hub 서버 URL (예: `https://aihompy.vercel.app`) |
| `HUB_API_KEY` | ✅ | BSW→Hub 호출 시 API 키 |
| `QIS_API_KEY_HASH` | ✅ | Hub→BSW 호출 시 검증 해시 (SHA-256) |
| `BSW_WORKSPACE_ID` | 권장 | BSW 워크스페이스 UUID |
| `CRON_SECRET` | ✅ | Cron API 보안 토큰 |

### 8.2. Hub 측 환경 변수

| 변수명 | 필수 | 설명 |
|--------|------|------|
| `BSW_API_URL` | ✅ | BSW 서버 URL (예: `https://bsw-os.vercel.app`) |
| `QIS_API_KEY` | ✅ | Hub→BSW 호출 시 API 키 (BSW의 QIS_API_KEY_HASH와 매칭) |
| `CRON_SECRET` | ✅ | Hub Cron API 보안 토큰 |

### 8.3. API 키 매칭 관계

```
Hub QIS_API_KEY = "my-shared-secret-key"
  ↓ SHA-256
BSW QIS_API_KEY_HASH = "a1b2c3d4e5f6..."  (echo -n "my-shared-secret-key" | sha256sum)

BSW HUB_API_KEY = "my-shared-secret-key"
  → Hub에서 X-QIS-Api-Key 헤더로 검증
```

### 8.4. 인증 보안

| 보안 요소 | 구현 |
|-----------|------|
| 해시 비교 | `crypto.timingSafeEqual()` — 타이밍 공격 방지 |
| 키 저장 | 환경변수에 해시값만 저장 (원문 미저장) |
| 전송 보안 | HTTPS 필수 |
| Cron 인증 | Bearer 토큰 / URL 시크릿 / X-Manual-Trigger 헤더 |

---

## 9. 일상 운영 체크리스트

### 9.1. 매일 확인 (관리자)

| 시간 | 점검 항목 | 확인 방법 |
|------|----------|----------|
| 12:30 KST | BSW QIS Cron 실행 여부 | Vercel Dashboard → Cron Jobs |
| 12:30 KST | Pull/Push 성공 여부 | Cron 응답 로그 확인 |
| 21:30 KST | Hub 피드백 Cron 실행 | Hub Vercel Dashboard → Cron |
| 수시 | 시그널 수집량 | BSW Supabase → `bsw_received_signals` |
| 수시 | 예측 질문 누적 | BSW Supabase → `bsw_predicted_questions` |

### 9.2. 주간 확인 (관리자)

| 점검 항목 | 확인 방법 |
|----------|----------|
| 예측 출현율(Emergence Rate) | 모니터링 SQL 쿼리 실행 |
| 시그널 소스별 정확도 | `accuracy-tracker` 리포트 |
| Global Pool 신규 질문 | Hub Factory → QIS → Global Pool |
| 테넌트별 QIS 갭 현황 | Hub → 테넌트 → QIS Gap |

### 9.3. BSW 시맨틱 코어 주간 작업

1. **시그널 발굴**: 신규 키워드로 S-OGDE 파이프라인 1회 이상 실행
2. **시그널 검토**: mined 상태 시그널 → promoted 또는 ignored 결정
3. **CQ 정리**: 중복 시그니처 CQ 병합
4. **KG 연결**: 신규 개념-질문-근거 관계 추가
5. **클레임 게이트**: 미검증 클레임 → 계보 완성 → 봉인

---

## 10. 장애 대응 가이드

### 10.1. Cron 실행 실패

| 증상 | 원인 | 조치 |
|------|------|------|
| Cron 미실행 | Vercel Cron 비활성화 | Vercel Dashboard → Cron Jobs 확인 |
| Pull 실패 (`fetch failed`) | Hub 서버 다운 | Hub 팀에 확인, 다음 Cron에서 자동 재시도 |
| Push 실패 (`push_failed`) | Hub API 오류 | Hub 응답 로그 확인, BSW 데이터는 이미 저장됨 |
| 401 Unauthorized | API 키 불일치 | 양측 X-QIS-Api-Key 값 확인 |

### 10.2. 데이터 동기화 이슈

| 증상 | 원인 | 조치 |
|------|------|------|
| `bsw_predicted_questions` 비어있음 | `predicted_questions`에 해당 업종 데이터 없음 | S-OGDE 파이프라인 해당 업종으로 실행 |
| 피드백 미반영 | `bsw_question_id` 미존재 | Hub가 올바른 BSW ID 사용하는지 확인 |
| Hub Pool에 BSW 질문 미표시 | `/api/v1/qis/questions` POST 실패 | BSW Cron 로그에서 Push 응답 확인 |

### 10.3. UI 관련 이슈

| 증상 | 원인 | 조치 |
|------|------|------|
| 시맨틱 코어 페이지 빈 화면 | DB 연결 문제 또는 workspace_id 미매칭 | Supabase 연결 상태 확인 |
| Hub Factory QIS AI 클러스터링 실패 | Gemini API 키 문제 | Hub 환경변수 GOOGLE_AI_KEY 확인 |
| 3축 관리 동기화 오류 | CRON_SECRET 불일치 | BSW 환경변수 확인 |

### 10.4. 긴급 비활성화

**BSW QIS Cron 중지**:
- Vercel Dashboard → Settings → Cron Jobs → Disable
- 또는 `vercel.json`에서 `qis-sync` 주석 처리 후 재배포

**Hub 피드백 Cron 중지**:
- Hub Vercel Dashboard → Settings → Cron Jobs → Disable

---

## 11. 모니터링 SQL 쿼리

### 11.1. BSW 측 모니터링

```sql
-- 최근 7일간 수집된 시그널 현황
SELECT signal_type, COUNT(*) as cnt, DATE(created_at) as date
FROM bsw_received_signals
WHERE created_at > now() - interval '7 days'
GROUP BY signal_type, DATE(created_at)
ORDER BY date DESC, cnt DESC;

-- 예측 질문 출현율
SELECT
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE emerged = true) as emerged,
  ROUND(
    COUNT(*) FILTER (WHERE emerged = true)::numeric / NULLIF(COUNT(*), 0) * 100, 1
  ) as emergence_rate_pct
FROM bsw_predicted_questions;

-- 시맨틱 코어 모듈별 데이터 현황
SELECT 'question_signals' as module, COUNT(*) as cnt FROM question_signals
UNION ALL SELECT 'question_capital_nodes', COUNT(*) FROM question_capital_nodes
UNION ALL SELECT 'canonical_questions', COUNT(*) FROM canonical_questions
UNION ALL SELECT 'qis_scenes', COUNT(*) FROM qis_scenes
UNION ALL SELECT 'tco_concepts', COUNT(*) FROM tco_concepts
UNION ALL SELECT 'brand_ontology_nodes', COUNT(*) FROM brand_ontology_nodes
UNION ALL SELECT 'claim_nodes', COUNT(*) FROM claim_nodes;

-- 3축별 예측 질문 분포
SELECT
  COALESCE(target_axis, 'industry') as axis,
  COUNT(*) as cnt,
  ROUND(AVG(confidence), 2) as avg_confidence
FROM bsw_predicted_questions
GROUP BY target_axis;
```

### 11.2. Hub 측 모니터링

```sql
-- BSW 예측 질문 수신 현황
SELECT COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'verified') as verified,
  COUNT(*) FILTER (WHERE status = 'pending') as pending
FROM hub_canonical_questions
WHERE source = 'bsw_prediction';

-- 피드백 전송 현황
SELECT
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE (metadata->>'feedback_sent')::boolean = true) as sent,
  COUNT(*) FILTER (WHERE answer_count > 0) as has_answers
FROM hub_canonical_questions
WHERE source = 'bsw_prediction';

-- QIS Global Pool 업종별 현황
SELECT industry_type, COUNT(*) as cnt,
  COUNT(*) FILTER (WHERE status = 'approved') as approved
FROM question_clusters
WHERE is_global = true
GROUP BY industry_type;
```

---

## 부록: DB 테이블 전체 맵

### BSW 측 테이블

| 테이블 | 용도 | 연동 방향 |
|--------|------|----------|
| `question_signals` | 시그널 레지스트리 | BSW 내부 |
| `question_capital_nodes` | 질문 자본 | BSW 내부 |
| `canonical_questions` | 정규 질문 | BSW 내부 |
| `qis_scenes` | QIS 씬 | BSW 내부 |
| `tco_concepts` | TCO 개념 | BSW 내부 |
| `brand_ontology_nodes/edges` | 지식 그래프 | BSW 내부 |
| `claim_nodes` + `lineage_records` | 클레임 계보 | BSW 내부 |
| `predicted_questions` | 예측 질문 (원본) | BSW 내부 |
| `bsw_predicted_questions` | 예측 질문 (연동용) | BSW ↔ Hub |
| `bsw_received_signals` | 수신 시그널 | Hub → BSW |
| `bsw_received_metrics` | 수신 메트릭 | Hub → BSW |
| `bsw_expected_layers` | 수신 기대층 | Hub → BSW |

### Hub 측 테이블

| 테이블 | 용도 | 연동 방향 |
|--------|------|----------|
| `hub_canonical_questions` | 정규 질문 (BSW 예측 포함) | BSW → Hub |
| `question_clusters` | 질문 클러스터 (Global Pool) | Hub 내부 |
| `qis_signal_events` | 로컬 시그널 버퍼 | Hub → BSW |
| `qis_predicted_questions_cache` | BSW 예측 캐시 | BSW → Hub |
| `qis_real_metrics` | 실측 메트릭 스냅샷 | Hub → BSW |
| `qis_workspace_mapping` | BSW ↔ Hub 워크스페이스 매핑 | 양방향 |
| `qis_content_links` | 질문→콘텐츠 브릿지 (answer_card/uca/topic) | Hub 내부 |
| `hub_qis_config` | Hub별 QIS 설정 | Hub 내부 |
| `hub_probe_panels` | 20-질문 벤치마크 패널 (7 Hub × 20 = 140) | Hub 내부 |
| `hub_qis_benchmarks` | BAIR/AAS/OCR/BSF 벤치마크 스냅샷 | Hub 내부 |
| `signal_config` | 테넌트별 모듈 실행 설정 | Hub 내부 |
| `signal_cost_log` | AI 토큰 예산 추적 | Hub 내부 |
| `entity_probe_panels` | 엔티티(업체)별 QIS 패널 | Hub 내부 |
| `entity_bair_snapshots` | 엔티티별 벤치마크 스냅샷 | Hub 내부 |
| `vortex_content_missions` | 3축 콘텐츠 미션 | Hub → BSW (피드백) |

---

## 부록 B: Hub 어드민 BSW 예측 검토 페이지

### 접속 경로

Hub → Hub 관리 → `[hubId]` → BSW 예측 검토 (`/hub/[hubId]/bsw-forecast`)

### 기능

- BSW에서 전송된 예측 질문을 **긴급도·검색량·신뢰도** 기준으로 검토
- 예측 질문별 **미션 상태** 확인 (미배정/진행중/완료)
- 예측 질문을 테넌트에 배포하거나 콘텐츠 미션 생성 가능
- Hub의 `hub_canonical_questions` 테이블에서 `source = 'bsw_prediction'` 필터

### Hub QIS 라이브러리 모듈 (`lib/qis/`)

| 모듈 | 기능 |
|------|------|
| `canonicalizer.ts` | 질문 정규화 (자연어 → 표준 형태) |
| `dedupPipeline.ts` | 중복 제거 파이프라인 |
| `goldenSetManager.ts` | 골든 질문 셋 관리 |
| `miner.ts` | 콘텐츠에서 질문 마이닝 |
| `missionCreator.ts` | 예측 질문 → 콘텐츠 미션 자동 생성 |

---

## 부록 C: 업종 확장 가이드

현재 QIS 시스템은 `wedding` 업종에 대해 가장 완전하게 구현되어 있습니다. 스킨케어 등 다른 업종으로 확장하려면:

### BSW 측 확장 작업

1. **업종 예측 템플릿 추가**: `lib/prediction/industry-prediction-templates.ts`에 해당 업종 템플릿 추가 (현재 25개 업종 등록됨)
2. **시그널 수집기 추가**: `lib/prediction/signal-collectors/`에 해당 Hub 수집기 추가
3. **Cron 업종 필터 조정**: `qis-sync` Cron에서 `industry` 필터를 해당 업종으로 확장

### Hub 측 확장 작업

1. **Factory QIS 업종 탭 추가**: `INDUSTRIES` 배열에 새 업종 추가 (현재 5개: skincare, clinic, real_estate, consulting, wedding_sdm)
2. **Probe Panel 시딩**: `hub_probe_panels` 테이블에 해당 업종 20개 질문 시딩
3. **테넌트 스튜디오 업종 매핑**: 해당 업종의 테넌트가 QIS 페이지에 접근 가능하도록 설정

