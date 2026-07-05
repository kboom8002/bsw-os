# QIS Full Pipeline — 완전 관리자 가이드

> **Version:** 3.0 | 2026-07-03  
> **프로덕션 URL:** `https://answerhub.kr`  
> **대상 독자:** BSW-OS 시스템 관리자, DevOps, QIS 운영 담당자  
> **상태:** S-OGDE v3.0 엔진 적용 완료, Hub 연동 인터페이스 구현 완료

---

## 목차

1. [시스템 개요](#1-시스템-개요)
2. [아키텍처 및 데이터 흐름](#2-아키텍처-및-데이터-흐름)
3. [7단계 파이프라인 상세](#3-7단계-파이프라인-상세)
4. [시그널 수집 시스템](#4-시그널-수집-시스템)
5. [질문 예측 엔진 (QuestionPredictor)](#5-질문-예측-엔진-questionpredictor)
6. [3축 라우팅 및 Hub 동기화](#6-3축-라우팅-및-hub-동기화)
7. [QIS Cross Mapper](#7-qis-cross-mapper)
8. [프로브 질의 생성기 (ProbeGenerator)](#8-프로브-질의-생성기-probegenerator)
9. [API 엔드포인트 레퍼런스](#9-api-엔드포인트-레퍼런스)
10. [데이터베이스 테이블 레퍼런스](#10-데이터베이스-테이블-레퍼런스)
11. [Zod 스키마 레퍼런스](#11-zod-스키마-레퍼런스)
12. [UI 페이지 가이드](#12-ui-페이지-가이드)
13. [환경 변수 레퍼런스](#13-환경-변수-레퍼런스)
14. [일상 운영 워크플로우](#14-일상-운영-워크플로우)
15. [보안 및 인증](#15-보안-및-인증)
16. [트러블슈팅 가이드](#16-트러블슈팅-가이드)
17. [Hub 연동 현황 및 로드맵](#17-hub-연동-현황-및-로드맵)

---

## 1. 시스템 개요

### 1.1 QIS란?

**QIS (Question Intelligence System)**는 AI 검색 시대에 소비자가 AI에게 물어볼 질문을 **사전 발굴 → 평가 → 관리 → 최적화**하는 End-to-End 질문 자산 운영 시스템입니다.

핵심 엔진은 **S-OGDE (Signal-Organic Growth Discovery Engine) v3.0**이며, 7개 단계(Phase 0 ~ Phase E)의 파이프라인으로 구성됩니다.

### 1.2 핵심 가치 제안

```
① 업종별 소비자 질문을 5개 심리 렌즈로 체계적 발굴
② 실제 AI 검색 기반으로 질문을 검증·심화
③ 8차원 QVS 점수로 비즈니스 가치를 정량 평가
④ Hub 실시간 시그널 연동으로 예측 질문을 자동 생성
⑤ 피드백 루프로 예측 정확도를 자체 학습·개선
```

### 1.3 파이프라인 핵심 흐름

```
Signal Collection → Question Prediction → QVS Scoring → Content Blueprint → Hub Sync
       ↑                                                                        ↓
       └────────────── Accuracy Feedback Loop ──────────────────────────────────┘
```

---

## 2. 아키텍처 및 데이터 흐름

### 2.1 전체 시스템 아키텍처

```
┌─────────────────────────── BSW-OS (answerhub.kr) ───────────────────────────┐
│                                                                               │
│  ┌──────────────────────┐    ┌───────────────────────┐                       │
│  │ Signal Collectors    │    │ S-OGDE Pipeline        │                       │
│  │ (8종 수집기)          │    │ (7-Phase Full Pipeline) │                      │
│  │                      │    │                        │                       │
│  │ • Community          │    │ Phase 0: TCO Bootstrap  │                      │
│  │ • Search Trend       │    │ Phase G: 5-Lens Meta-Q  │                      │
│  │ • News               │    │ Phase D1: Search Chain  │                      │
│  │ • Regulation         │    │ Phase D2: Multi-Persona │                      │
│  │ • Seasonal           │    │ Phase R: Reverse Q Eng  │                      │
│  │ • SBS Broadcast      │    │ Phase DD: Semantic Dedup│                      │
│  │ • Internal           │    │ Phase E: QVS 8D + Gate  │                      │
│  │ • KWeddingHub        │    └───────────┬────────────┘                       │
│  └──────────┬───────────┘                │                                    │
│             │                            │                                    │
│             ▼                            ▼                                    │
│  ┌──────────────────────────────────────────────────────┐                    │
│  │ Question Predictor                                    │                    │
│  │ • Signal → 3 Predictions (Base + YMYL + Comparison)   │                    │
│  │ • 5-tier Expected Layer Auto-injection                │                    │
│  │ • Industry Template Registry                          │                    │
│  │ • YMYL Regulatory Reference Integration               │                    │
│  └──────────┬───────────────────────────────────────────┘                    │
│             │                                                                 │
│             ▼                                                                 │
│  ┌──────────────────────────────────────────────────────┐                    │
│  │ QIS Cross Mapper                                      │                    │
│  │ • Jaccard(0.4) + Cosine(0.6) 하이브리드 유사도       │                    │
│  │ • Goldilocks Threshold ≥ 0.35                        │                    │
│  │ • both / industry_only / site_only 분류              │                    │
│  └──────────┬───────────────────────────────────────────┘                    │
│             │                                                                 │
│             ▼                                                                 │
│  ┌──────────────────────────────────────────────────────┐                    │
│  │ Hub Client (3축 라우팅 Push/Pull)                      │                    │
│  │ • pushPredictedQuestions → Hub                        │                    │
│  │ • pullSignals ← Hub                                  │                    │
│  │ • Accuracy Tracker (Elo 학습)                        │                    │
│  └──────────────────────────────────────────────────────┘                    │
│                                                                               │
│  ── External APIs ──                                                          │
│  GET  /api/v1/qis/predictions      Hub → BSW 예측 조회                       │
│  POST /api/v1/qis/feedback         Hub → BSW 피드백 수신                     │
│  POST /api/v1/qis/signals/ingest   Hub → BSW 시그널 수신                     │
│  POST /api/v1/qis/signals/generate 내부 S-OGDE 파이프라인 가동                │
│  POST /api/v1/qis/signals/score    개별 질문 QVS 평가                        │
│  POST /api/v1/qis/signals/deduplicate  시맨틱 중복 제거                      │
│  GET  /api/cron/qis-sync           일일 자동 동기화 (03:00 KST)              │
└───────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 데이터 흐름 다이어그램

```
[Daily 03:00 KST — BSW Cron]
  PULL: Hub → BSW
    KWeddingHubCollector → bsw_received_signals
    pullMetrics()        → bsw_received_metrics
    pullExpectedLayers() → bsw_expected_layers
  
  PROCESS:
    QuestionPredictor: signal → 3 predictions (base + YMYL + comparison)
    → predicted_questions 테이블 저장
  
  PUSH: BSW → Hub
    predicted_questions (confidence ≥ 0.7) → bsw_predicted_questions (upsert)
    → enrichPredictionWithAxis() (3축 라우팅)
    → buildTriAxisPayload() (industry/place/vortex/cross_axis 별 그룹화)
    → QisHubClient.pushPredictedQuestions() (축별 전송)

[Daily 21:00 KST — Hub Cron]
  Hub → BSW: POST /api/v1/qis/feedback
    → PredictionAccuracyTracker.verifyPrediction()
    → recalibrateSignalWeights() (≥3건 피드백 축적 시 자동 실행)

[Standalone/E2E Mode]
  SignalOrchestrator.runFullPipeline()
    → Phase 0 (TCO/KG bootstrap)
    → Phase G (5-Lens, 25 seeds)
    → Phase D1 (search-grounded chain)
    → Phase D2 (multi-persona recursion)
    → Phase R (reverse question engineering)
    → Phase DD (semantic dedup, cosine ≥ 0.85)
    → Phase E (QVS 8D + CPS + Gate)
    → Promoted signals → Capital → CQ → QIS Scene
```

---

## 3. 7단계 파이프라인 상세

### 3.1 Phase 0: TCO/KG Bootstrap

| 항목 | 상세 |
|------|------|
| **목적** | 업종별 기초 개념(TCO)과 지식 그래프(KG)가 없으면 자동 생성 |
| **트리거** | `tco_concepts` 또는 `brand_ontology_nodes` 테이블이 비어있을 때 |
| **산출물** | 업종 기본 개념 세트 + KG 노드 |
| **건너뛰기 조건** | 해당 테이블에 데이터가 이미 존재할 때 |

### 3.2 Phase G: 5-Lens Meta-Question Generation

| 항목 | 상세 |
|------|------|
| **목적** | 5개 심리 렌즈를 통해 업종 시드 질문 25개를 체계적으로 발굴 |
| **엔진** | `meta-question-engine.ts` |
| **렌즈 5종** | Pattern(패턴), Motivation(동기), Journey Stage(여정단계), Fear/Desire(공포/욕구), Counter(역발상) |
| **산출물** | 렌즈당 5개 × 5렌즈 = 25개 구조화된 메타 질문 |

**5-Lens 프레임워크 상세:**

| 렌즈 | 질문 유형 | 예시 (스킨케어 업종) |
|------|----------|---------------------|
| **Pattern** | 반복 패턴 / 계절성 / 트렌드 | "겨울 건조함 시작 시기에 맞춰 보습 루틴을 어떻게 바꿔야 하나요?" |
| **Motivation** | 구매 동기 / 가치관 / 목표 | "민감성 피부인데 자극 없는 선크림 찾는 기준이 뭔가요?" |
| **Journey Stage** | 인지→검토→결정→사용 단계별 | "성분 비교 후 최종 선택할 때 어떤 기준으로 결정하나요?" |
| **Fear/Desire** | 불안 / 기대 / FOMO | "유기농 표시가 실제로 안전하다는 보장이 있나요?" |
| **Counter** | 통념 반박 / 역질문 / 극단 시나리오 | "비싼 화장품이 정말 싼 것보다 효과가 좋나요?" |

### 3.3 Phase D1: Search-Grounded Chain (정보 격차 탐색)

| 항목 | 상세 |
|------|------|
| **목적** | 실제 AI 검색 결과를 기반으로 후속 질문을 연쇄 발굴 (깊이 3) |
| **엔진** | `exploratory-chain.ts` |
| **이론 기반** | Information Gap Theory (Loewenstein, 1994) |
| **프로세스** | Seed Question → LLM Answer → Info Gap 추출 → Follow-up Question → 반복 (최대 깊이 3) |
| **AI 연동** | Gemini 검색 기반 응답 생성 (Search Grounding) |

### 3.4 Phase D2: Multi-Persona Recursive Deepening

| 항목 | 상세 |
|------|------|
| **목적** | 3개 페르소나 관점에서 트리 구조로 질문을 재귀적 심화 |
| **엔진** | `recursive-deepener.ts` |
| **이론 기반** | Information Foraging Theory (Pirolli & Card, 1999) |
| **페르소나 3종** | Skeptic(회의론자), Pragmatist(실용주의자), Novice(초보자) |
| **트리 파라미터** | branch_factor=2~3, max_depth=3, max_total=15~20 |
| **수렴 조건** | 정확 중복 감지, 도메인 이탈 감지, 깊이 한계 도달 |

### 3.5 Phase R: Reverse Question Engineering

| 항목 | 상세 |
|------|------|
| **목적** | 브랜드 USP(Unique Selling Point)에서 역방향으로 소비자 질문을 역산출 |
| **프로세스** | USP → 3단계 소비자 질문 경로 역설계 × 5 경로 |
| **산출물** | USP 기반 전략적 질문 세트 (5개 경로 × 3단계 = 15개) |

### 3.6 Phase DD: Semantic Deduplication

| 항목 | 상세 |
|------|------|
| **목적** | 의미적으로 동일한 질문을 제거하여 중복 없는 순수 질문 세트 확보 |
| **엔진** | `SemanticDedup` 클래스 |
| **임베딩** | Gemini text-embedding-004 (768차원) |
| **알고리즘** | 코사인 유사도 ≥ 0.85 → 동일 클러스터 (응집적 클러스터링) |
| **API** | `POST /api/v1/qis/signals/deduplicate` |

### 3.7 Phase E: QVS 8D Evaluation + CPS + Gate

| 항목 | 상세 |
|------|------|
| **목적** | 각 질문의 비즈니스 가치를 8차원 + 복합 점수로 정량 평가, Go/Watch/No-Go 판정 |
| **엔진** | `signal-evaluator.ts` |
| **QVS 8차원** | 아래 표 참조 |
| **CPS 공식** | `0.30×P(QVS) + 0.25×P(Vol) + 0.20×(TCO_match/10) + 0.15×(KG_cov/10) + 0.10×W_YMYL` |
| **N-Repeat** | LLM을 N회 반복 호출하여 σ(표준편차) 기반 신뢰도 산출 |

**QVS 8차원 상세 (AHP 가중치, CR=0.04):**

| 차원 | 가중치 | 범위 | 평가 기준 |
|------|--------|------|----------|
| Relevance (관련성) | 0.18 | 0-100 | 브랜드/업종과의 직접 관련도 |
| Conversion (전환성) | 0.18 | 0-100 | 구매 결정 기여도 |
| Snippet Fitness (스니펫 적합성) | 0.15 | 0-100 | AI 답변 카드 적합도 |
| Opportunity (기회도) | 0.12 | 0-100 | 경쟁 공백 + 선점 기회 |
| Specificity (구체성) | 0.10 | 0-100 | 질문의 명확도·구체성 |
| Entity Clarity (엔티티 명확성) | 0.10 | 0-100 | 대상 엔티티 식별 용이성 |
| Multi-Engine Consistency (멀티엔진) | 0.10 | 0-100 | 여러 AI 엔진 간 응답 일관성 |
| Urgency (긴급성) | 0.07 | 0-100 | 시의성·긴급 대응 필요도 |

**Gate 판정 기준:**

| Gate | 조건 | 액션 |
|------|------|------|
| 🟢 **Go** | QVS ≥ 68 AND brand_fit != 'unfit' | 즉시 콘텐츠 생산 착수 |
| 🟡 **Watch** | 42 ≤ QVS < 68 | 모니터링 후 재평가 |
| 🔴 **No-Go** | QVS < 42 OR brand_fit == 'unfit' | 보류 (리소스 미투입) |

**신뢰도 (Confidence):**

| σ (표준편차) | 신뢰도 | 의미 |
|-------------|--------|------|
| σ < 5.0 | High | LLM 반복 평가 결과 안정적 |
| 5.0 ≤ σ < 10.0 | Medium | 약간의 변동 있음 |
| σ ≥ 10.0 | Low | 불안정 — 재평가 권장 |

---

## 4. 시그널 수집 시스템

### 4.1 수집기 목록 (8종)

모든 수집기는 `SignalCollector` 인터페이스를 구현합니다:

```typescript
interface SignalCollector {
  collect(workspaceId?: string, industry?: string): Promise<EmergenceSignal[]>;
}
```

| 수집기 | 소스 타입 | 데이터 원천 | 구현 상태 | 파일 |
|--------|----------|-----------|----------|------|
| **Community** | `community` | 화해, 파우더룸, 네이버 지식iN (CollectionStorage 경유) | ✅ 하이브리드 | `community-collector.ts` |
| **Search Trend** | `search_trend` | 네이버 DataLab (CollectionStorage 경유) | ✅ 하이브리드 | `search-trend-collector.ts` |
| **KWeddingHub** | `kweddinghub` | Hub API (`/api/v1/qis/signals`) 실시간 호출 | ✅ 실제 API | `kweddinghub-collector.ts` |
| **News** | `news` | 업종별 정적 Mock 데이터 | ⚠️ Mock | `news-collector.ts` |
| **Regulation** | `regulation` | 식약처, 공정위, 보건복지부 정적 Mock | ⚠️ Mock | `regulation-collector.ts` |
| **Seasonal** | `seasonal` | 계절/이벤트 패턴 정적 Mock | ⚠️ Mock | `seasonal-collector.ts` |
| **SBS Broadcast** | `broadcast` | SBS TV 편성표 Mock (24h 선행 시그널) | ⚠️ Mock | `sbs-broadcast-collector.ts` |
| **Internal** | `internal` | BSW-OS 내부 관찰 정적 Mock | ⚠️ Mock | `internal-collector.ts` |

### 4.2 외부 수집 엔진 (ExternalCollectors)

**파일:** `lib/signal-collection/external-collectors.ts`

4개의 실제 외부 데이터 수집 메서드:

#### (1) `collectNaverNews(sources, keywords?)`

```
네이버 Open API 뉴스 검색 → ExternalSignal[] 저장
- 환경변수: NAVER_CLIENT_ID, NAVER_CLIENT_SECRET
- 기본 키워드: ["스킨케어 트렌드", "화장품 성분", "뷰티 신제품"]
- 키워드당 최대 10건 × 3 키워드 = 최대 30건
- 타임아웃: 8초
- 중복 제거: URL 기반
```

#### (2) `collectNaverDatalab(sources, keywords?)`

```
네이버 DataLab 검색 트렌드 API → SearchTrend[] 저장
- 환경변수: NAVER_CLIENT_ID, NAVER_CLIENT_SECRET
- 조회 기간: 최근 14일
- 최대 5개 키워드 그룹
- 산출물: 키워드별 상대 검색량 (0-100)
```

#### (3) `collectRss(sources)`

```
RSS/Atom 피드 XML 파싱 → ExternalSignal[] 저장
- 정규식 기반 XML 파싱 (cheerio 미사용)
- CDATA 섹션 지원
- 최대 15개 항목/피드
- 실패 시: 합성 트렌드 시그널 자동 생성 (분석 중단 방지)
```

#### (4) `collectCommunity(sources, keywords?)`

```
HTML 크롤러 + 키워드 앵커 텍스트 매칭 → ExternalSignal[] 저장
- 대상: 화해, 파우더룸, 네이버 지식iN 등
- 키워드 포함 앵커 텍스트 추출
- 최대 15건/사이트
- 수집량 < 3건 시: 도메인 맞춤 합성 시그널 자동 보강
```

### 4.3 하이브리드 저장소 (CollectionStorage)

**파일:** `lib/signal-collection/collection-storage.ts`

| 저장 대상 | Supabase 테이블 | 로컬 JSON 파일 | 최대 건수 |
|----------|----------------|---------------|----------|
| 수집 소스 설정 | `collection_sources` | `db/seed/external_data/collection_sources.json` | - |
| 외부 시그널 | `external_signals` | `db/seed/external_data/external_signals.json` | 200건 |
| 검색 트렌드 | `search_trends` | `db/seed/external_data/search_trends.json` | 500건 |

**폴백 조건:**
- `DEMO_MODE=true` 환경변수 설정 시
- Supabase에 해당 테이블이 존재하지 않을 때
- DB 연결 실패 시

**중복 제거 로직:**
- 외부 시그널: URL 기반 + content 앞 100자 비교
- 검색 트렌드: keyword + period_start + source 복합 키

### 4.4 기본 등록 수집원 (7종)

| # | 수집원 | 식별코드 | 수집 방식 | 대상 URL |
|---|--------|---------|----------|---------|
| 1 | 화해 커뮤니티 | `hwahae` | community | `https://www.hwahae.co.kr/community` |
| 2 | 파우더룸 | `powderroom` | community | `https://www.powderroom.co.kr` |
| 3 | 네이버 지식iN | `naver_kin` | community | `https://kin.naver.com` |
| 4 | 네이버 뉴스 API | `naver_news` | api | Naver Open API |
| 5 | 네이버 DataLab | `naver_datalab` | api | Naver DataLab API |
| 6 | Cosmetics Design Asia | `cosmetics_design_rss` | rss | RSS Feed |
| 7 | 대한피부과학회 | `derma_rss` | rss | RSS Feed |

---

## 5. 질문 예측 엔진 (QuestionPredictor)

**파일:** `lib/prediction/question-predictor.ts`

### 5.1 핵심 메서드

#### `predictQuestionsFromSignal(signal: EmergenceSignal)`

메인 예측 파이프라인. 시그널 1건으로부터 3종의 예측 질문을 자동 생성합니다.

**처리 흐름:**

```
1. signal.predicted_impact로부터 confidence 산출
2. industry별 PREDICTION_TEMPLATE_REGISTRY에서 템플릿 조회
3. 템플릿 없으면 genericFallback() 사용
4. 기본 예측 질문 생성
5. YMYL 안전 파생 질문 생성 (confidence × 0.9)
6. 비교 분석 파생 질문 생성 (confidence × 0.85)
7. DB ymyl_regulatory_references에서 YMYL 규제 참조 동적 주입
8. 5-tier Expected Layer 자동 부여
9. predicted_questions 테이블에 INSERT
```

#### `checkAICoverage(questionText, workspaceId?)`

질문의 현재 AI 커버리지 상태를 판정합니다.

| 반환값 | 의미 | 판정 기준 |
|--------|------|----------|
| `none` | AI 응답 미존재 | DB 프로브에 매칭 없음 + YMYL 패턴 |
| `sparse` | 희소 응답 | 비교 키워드 패턴 매칭 |
| `moderate` | 보통 커버리지 | 정보성 키워드 매칭 |
| `saturated` | 포화 | DB 프로브 매칭률 ≥ 30% |

**2단계 판정:**
1. **DB 기반** — `probe_runs.raw_response_text`에서 키워드 매칭 (30% 임계값)
2. **휴리스틱 폴백** — 키워드 패턴 기반 추정

#### `estimateFirstMoverWindow(signal)`

| predicted_impact | confidence | First-Mover Window |
|-----------------|-----------|-------------------|
| critical | 0.95 | 14일 |
| high | 0.85 | 30일 |
| medium | 0.70 | 60일 |
| low | 0.50 | 90일 |

> ⚠️ **confidence < 0.7인 예측은 Hub Push 대상에서 자동 제외됩니다.**

### 5.2 질문 파생 규칙

시그널 1건 수신 시 자동으로 3종의 예측 질문이 생성됩니다:

| 종류 | 설명 | confidence 배율 | Intent |
|------|------|----------------|--------|
| 기본 질문 | 원본 시그널 기반 업종 템플릿 매칭 | × 1.00 | 원본 유지 |
| YMYL 안전 | 법적/안전/규제 관점 파생 | × 0.90 | `legal_compliance` |
| 비교 분석 | 브랜드별 장단점 비교 파생 | × 0.85 | `value_comparison` |

### 5.3 5-Tier Expected Layer

예측 질문에 자동으로 콘텐츠 가이드라인이 첨부됩니다:

| Tier | 의미 | 예시 |
|------|------|------|
| `auto_must_include` | 반드시 포함 (브랜드 진실) | "식약처 인증 번호", "임상 시험 결과" |
| `auto_strongly_recommended` | 강력 권장 (신뢰 보강) | "EEAT 전문가 인용", "출처 URL" |
| `auto_should_include` | 포함 권장 (보충 정보) | "사용 후기", "비교 데이터" |
| `auto_caution` | 주의 사항 | "개인차 언급", "알레르기 경고" |
| `auto_must_not_do` | 금지 사항 (YMYL 경계) | "치료 효과 단정", "경쟁사 비방" |

### 5.4 정확도 추적 (AccuracyTracker)

**파일:** `lib/prediction/accuracy-tracker.ts`

| 메서드 | 기능 |
|--------|------|
| `verifyPrediction(predictionId)` | 예측 vs 실제 AI 커버리지 비교, 정확도 산출 |
| `recalibrateSignalWeights(workspaceId?)` | 베이지안 가중치 재캘리브레이션 (`weight = 1.0 + (avg_accuracy - 0.5)`) |
| `getSectorAccuracyReport(workspaceId)` | 업종별 정확도 + 편향(bias) 리포트 |

**기본 소스 가중치:**

| 소스 | 기본 가중치 | 재캘리브레이션 공식 |
|------|-----------|------------------|
| news | 1.0 | `1.0 + (해당 소스 평균 정확도 - 0.5)` |
| regulation | 1.0 | 동일 |
| search_trend | 1.0 | 동일 |
| community | 1.0 | 동일 |
| seasonal | 1.0 | 동일 |
| internal | 1.0 | 동일 |

---

## 6. 3축 라우팅 및 Hub 동기화

### 6.1 3축 체계

| 축 | 설명 | 식별 키워드 예시 |
|----|------|-----------------|
| **Industry** | 업종 일반 (기본값) | 업종별 표준 시그널 |
| **Place** | 지역 기반 | 서울, 강남, 제주 등 22개 지역 키워드 |
| **Vortex** | 테마 DAO | 웨딩, K-뷰티 등 28개 테마 키워드 |
| **Cross-Axis** | 지역+테마 교차 | 지역 + 테마 동시 매칭 시 |

### 6.2 축 판정 로직 (`enrichPredictionWithAxis`)

```
1. 질문 텍스트에서 geo_keywords(22개)와 vortex_keywords(28개) 매칭
2. geo + vortex 동시 매칭 → cross_axis
3. geo만 매칭 → place
4. vortex만 매칭 → vortex
5. 둘 다 미매칭 → industry (기본값)
```

### 6.3 Hub Client (`lib/qis/hub-client.ts`)

**환경변수:**
- `HUB_API_URL` (또는 `AIHOMPY_HUB_URL`): Hub 서버 URL
- `HUB_API_KEY` (또는 `AIHOMPY_HUB_API_KEY`): BSW → Hub 인증 키

| 메서드 | 방향 | 엔드포인트 | 현재 상태 |
|--------|------|-----------|----------|
| `pushPredictedQuestions()` | BSW→Hub | POST `/api/v1/qis/predictions` | ✅ 실제 호출 |
| `pushQuestionAssets()` | BSW→Hub | POST `/api/v1/qis/assets` | ✅ 실제 호출 |
| `pullSignals()` | Hub→BSW | GET `/api/v1/qis/signals` | ✅ 실제 호출 (폴백 Mock) |
| `pullMetrics()` | Hub→BSW | GET `/api/v1/qis/metrics` | ⚠️ Stub (Mock 10건) |
| `pullExpectedLayers()` | Hub→BSW | GET `/api/v1/qis/layers` | ⚠️ Stub (Mock 5건) |

> **Error Handling:** 모든 Hub 호출은 try-catch로 래핑되어, 실패 시 Mock 데이터로 graceful fallback합니다. 데모 환경 안정성이 보장됩니다.

### 6.4 동기화 Cron 일정

```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/qis-sync?secret=CRON_SECRET",
    "schedule": "0 18 * * *"
  }]
}
```

> `0 18 * * *` UTC = **KST 매일 03:00** (새벽 3시)

---

## 7. QIS Cross Mapper

**파일:** `lib/surface/qis-cross-mapper.ts`

### 7.1 알고리즘

업종 QIS 패널 질문과 사이트 프로브 질문의 교차 매핑을 수행합니다.

```
유사도 = Jaccard(0.4) + CosineSimilarity(0.6) + KeywordBonus(0.25)
매칭 임계값: Goldilocks Threshold ≥ 0.35
```

### 7.2 출력 분류

| 분류 | 의미 | 전략적 해석 |
|------|------|-----------|
| `both` | 업종 QIS ∩ 사이트 프로브 | 기존 커버리지 — 유지 강화 |
| `industry_only` | 업종 QIS에만 존재 | 🔴 RED 갭 — 콘텐츠 신규 생성 필요 |
| `site_only` | 사이트에만 존재 | 🟢 GREEN — 고유 강점 |

### 7.3 임베딩 모델

- **Provider:** Gemini `text-embedding-004`
- **차원:** 768-dim
- **Fallback:** Jaccard-only (임베딩 실패 시)

---

## 8. 프로브 질의 생성기 (ProbeGenerator)

**파일:** `lib/surface/probe-generator.ts`

### 8.1 생성 방식

| 방식 | 산출물 | 조건 |
|------|--------|------|
| **Rule-based** | 트리거 쿼리 기반 프로브, 비교 변형 ("X vs Y"), 상황별 변형 ("여름 사용법") | 항상 실행 |
| **AI-based** | LLM 구조화 JSON 출력 — 3종(comparison, deep_dive, situational) | `AI_PROVIDER_MODE != 'mock'` |

### 8.2 프로브 3종

| 유형 | 설명 | 예시 |
|------|------|------|
| `comparison` | 경쟁 브랜드 비교 질문 | "라네즈 vs 이니스프리 수분크림 비교" |
| `deep_dive` | 심층 전문 질문 | "나이아신아마이드 10% 농도 자극 위험성" |
| `situational` | 상황별 맥락 질문 | "여행 중 간편한 스킨케어 루틴" |

---

## 9. API 엔드포인트 레퍼런스

### 9.1 Cron 동기화 API

#### `GET /api/cron/qis-sync`

| 항목 | 상세 |
|------|------|
| **인증** | 3가지 모드: Vercel Cron Bearer 토큰, URL `?secret=`, UI `X-Manual-Trigger` 헤더 |
| **timeout** | 120초 |
| **파라미터** | `phase`: pull / push / all / standalone / feedback |

**Phase별 동작:**

| Phase | 동작 |
|-------|------|
| `pull` | Hub → BSW 시그널/메트릭/레이어 수집만 |
| `push` | BSW → Hub 예측 질문 전송만 |
| `all` | Pull + Push 전체 사이클 |
| `standalone` | S-OGDE Full Pipeline + 벤치마크 기회 피딩 |
| `feedback` | `SignalPerformanceTracker.learnWeights()` OLS 학습 |

**응답 예시 (성공):**
```json
{
  "ok": true,
  "phase": "all",
  "pull": { "signals": 15, "metrics": 3, "layers": 8 },
  "push": { "total": 15, "byAxis": { "industry": 12, "place": 2, "vortex": 1, "cross_axis": 0 } }
}
```

---

### 9.2 예측 조회 API

#### `GET /api/v1/qis/predictions`

```
인증: X-QIS-Api-Key 헤더 (SHA-256 timing-safe 비교)
파라미터:
  - limit (기본 50)
  - min_confidence (기본 0.7)
응답: { ok: true, data: PredictedQuestion[] }
```

---

### 9.3 피드백 수신 API

#### `POST /api/v1/qis/feedback`

```
인증: X-QIS-Api-Key 헤더
Body: { feedbacks: [{ bsw_question_id, emerged, emerged_at?, emergence_source?, actual_frequency? }] }
동작:
  1. bsw_predicted_questions 업데이트
  2. AccuracyTracker.verifyPrediction() 실행
  3. 처리건수 ≥ 3 → recalibrateSignalWeights() 자동 실행
```

---

### 9.4 시그널 수신 API

#### `POST /api/v1/qis/signals/ingest`

```
인증: X-QIS-Api-Key 헤더
timeout: 60초
Body: qisSignalBatchSchema (signals[])
동작:
  1. bsw_received_signals 저장 (3축 컨텍스트 포함)
  2. QuestionPredictor.predictQuestionsFromSignal() 자동 실행
응답: { ok, received, stored, predictions_generated, errors[] }
```

---

### 9.5 수동 수집 API

#### `POST /api/v1/qis/signals/collect`

```
timeout: 60초
Body: questionSignalSchema (raw_question, volume?, intent?)
동작: question_signals 테이블 저장 (raw_question → query 매핑)
```

---

### 9.6 S-OGDE Full Pipeline API

#### `POST /api/v1/qis/signals/generate`

```
timeout: 300초 (5분)
Body: {
  workspace_id, domain_name, brand_name,
  options?: { brandUSP?, repeatEval?, industryKey?, enableMMR? }
}
동작: SignalOrchestrator.runFullPipeline() 전체 7단계 실행
```

---

### 9.7 개별 QVS 평가 API

#### `POST /api/v1/qis/signals/score`

```
timeout: 60초
Body: { question, workspace_id?, brand_name?, industry? }
동작:
  1. KG 노드 로드 (brand_ontology_nodes)
  2. SignalEvaluator.evaluateWithConfidence()
  3. VolumeEstimator.estimateVolume()
  4. CPS 복합 점수 산출
응답: { question, volume, intent, is_ymyl, qvs_total, qvs_dimensions, cps_score, gate_status, confidence }
```

---

### 9.8 시맨틱 중복 제거 API

#### `POST /api/v1/qis/signals/deduplicate`

```
timeout: 120초
Body: { candidates: string[], threshold?: number (기본 0.85) }
동작: SemanticDedup 코사인 유사도 클러스터링
```

---

### 9.9 QIS Scene 빌드 API

#### `POST /api/v1/qis/canonical-questions/build-scene`

```
timeout: 120초
Body: { canonical_question_id, workspace_id }
동작: SceneBuilder로 QIS Scene 생성 → qis_scenes 저장
산출물: context_tensor, evidence_requirements, risk/answer/cta_policy, must_do/must_not_do, output_targets, readiness_score
```

---

## 10. 데이터베이스 테이블 레퍼런스

### 10.1 시맨틱 코어 테이블 (Migration 0003)

| 테이블 | 역할 | 주요 컬럼 |
|--------|------|----------|
| `question_signals` | 원시 질문 시그널 | workspace_id, query, volume, intent, status(mined/promoted/ignored) |
| `question_capital_nodes` | 질문 자산 계층 구조 | title, slug, strategic_weight, parent_id(FK self) |
| `canonical_questions` | 정규화 질문 마스터 | normalized_question, slug, signature(SHA-256), question_capital_node_id(FK) |
| `qis_scenes` | 질문-의도-시나리오 | canonical_question_id(FK), scene_name, query_template, intent_model, risk_level |
| `tco_concepts` | 주제 개념 온톨로지 | concept_name, slug, definition, is_strategic |
| `brand_ontology_nodes` | KG 노드 | node_name, node_type(concept/claim/evidence/boundary) |
| `brand_ontology_edges` | KG 엣지 | source_node_id, target_node_id, relation_type |
| `claim_nodes` | 클레임 계보 | operational_truth_id(FK), claim_summary |
| `lineage_records` | 증거 체인 | claim_node_id, evidence_item_id, verification_signature(SHA-256) |

### 10.2 예측 엔진 테이블 (Migration 0017)

| 테이블 | 역할 | 주요 컬럼 |
|--------|------|----------|
| `emergence_signals` | 원시 시그널 | source_type, industry, raw_text, ai_analysis(JSONB), predicted_impact, status |
| `predicted_questions` | AI 예측 질문 | question_text, question_variants, predicted_intent, industry, predicted_volume, current_ai_coverage, first_mover_window_days, confidence, auto_must_include[], auto_should_include[], auto_must_not_do[], actually_emerged, prediction_accuracy |

### 10.3 QIS 고급 테이블 (Migration 0033)

| 테이블/변경 | 역할 | 추가 컬럼 |
|------------|------|----------|
| `question_signals` 확장 | QVS 8D 평가 결과 | qvs_total, qvs_dimensions(JSONB), cps_score, is_ymyl, gate_status, eval_confidence, matched_tco_concepts[], matched_kg_nodes[], panel_layer, source |
| `signal_performance_tracking` (신규) | 피드백 루프 | impressions_30d, clicks_30d, ctr_30d, avg_position_30d, ai_mention_rate, actual_conversion, realized_value, realized_qvs_score |

### 10.4 Hub 동기화 테이블

| 테이블 | 역할 | 주요 컬럼 |
|--------|------|----------|
| `bsw_received_signals` | Hub에서 수신한 시그널 | source_platform, signal_type, industry, hub_axis, raw_text |
| `bsw_predicted_questions` | Hub에 Push한 예측 | bsw_question_id, emerged, emerged_at, target_axis |
| `bsw_expected_layers` | Hub에서 수신한 기대 레이어 | question_reference, tier, content, confidence |
| `bsw_received_metrics` | Hub에서 수신한 메트릭 | metric_type, value, sample_size |

---

## 11. Zod 스키마 레퍼런스

**파일:** `lib/qis-shared-schemas.ts`

### 11.1 Hub ↔ BSW 교환 스키마 (6종)

| 스키마 | 방향 | 용도 |
|--------|------|------|
| `qisSignalPayloadSchema` | Hub→BSW | 개별 시그널 페이로드 (23종 signal_type) |
| `qisSignalBatchSchema` | Hub→BSW | 시그널 배치 래퍼 |
| `qisPredictedQuestionSchema` | BSW→Hub | 예측 질문 (QVS + 3축 정보 포함) |
| `qisRealMetricsSchema` | Hub→BSW | 실측 메트릭 (8종 metric_type) |
| `qisExpectedLayerDataSchema` | Hub→BSW | 기대 레이어 (5-tier) |
| `qisFeedbackPayloadSchema` | Hub→BSW | 예측 피드백 (출현 여부 + 실제 빈도) |

### 11.2 Signal Types (23종)

```
community_question, verified_review, price_report, stress_pattern,
deal_room_contract, deal_room_price, style_dna_trend, event_intent,
newlywed_lifecycle, family_conflict, sentiment_pattern, deal_contract,
deal_price, trend_signal, intent_signal, lifecycle_event,
conflict_pattern, entity_created, entity_reviewed, comparison_requested,
place_review, place_inquiry, vortex_mission_signal
```

### 11.3 Metric Types (8종)

```
question_frequency, conversion_rate, average_transaction,
stress_seasonal, question_emergence, ai_visibility_score,
probe_citation_rate, sentiment_seasonal
```

---

## 12. UI 페이지 가이드

### 12.1 시맨틱 코어 > QIS Scene 관리

**경로:** `/{locale}/{workspace_slug}/semantic-core/qis`

| 기능 | 설명 |
|------|------|
| QIS Scene CRUD | 시나리오 생성, 수정, 삭제 |
| AI 자동 생성 | CQ로부터 QIS Scene 자동 빌드 |
| Risk Level 관리 | low / medium / high / critical 리스크 등급 설정 |
| Expected Layer 편집 | must_do / must_not_do / 정책 세부 설정 |

### 12.2 시맨틱 코어 > QIS 3축 Hub 동기화

**경로:** `/{locale}/{workspace_slug}/semantic-core/qis-triaxis`

| 기능 | 설명 |
|------|------|
| 실행 모드 선택 | Pull / Push / All 드롭다운 |
| 수동 트리거 | "지금 실행" 버튼 (X-Manual-Trigger 헤더) |
| 실행 로그 | 실시간 수집/전송 로그 표시 |
| 3축 결과 카드 | Industry / Place / Vortex / Cross-Axis 별 전송 건수 |

### 12.3 시맨틱 코어 > 시그널 레지스트리

**경로:** `/{locale}/{workspace_slug}/semantic-core/signals`

| 기능 | 설명 |
|------|------|
| **시그널 분석 & 승격 탭** | S-OGDE 파이프라인 트리거, QVS/Gate 표시, 배치 승격 |
| **원천 수집원 관리 탭** | 수집 소스 추가/삭제/토글, 일괄 동기화, 수집 피드 확인 |

### 12.4 시맨틱 코어 > Canonical Question

**경로:** `/{locale}/{workspace_slug}/semantic-core/canonical-questions`

| 기능 | 설명 |
|------|------|
| CQ 관리 | SHA-256 기반 중복 방지, 정규화 질문 CRUD |
| 병합 | 유사 CQ를 하나로 병합 |
| 파이프라인 시각화 | Signal → Capital → CQ → Scene 흐름 표시 |

### 12.5 시맨틱 코어 > Question Capital

**경로:** `/{locale}/{workspace_slug}/semantic-core/question-capital`

| 기능 | 설명 |
|------|------|
| 계층 구조 관리 | 질문 자산 트리 (부모-자식 관계) |
| 전략적 가중치 | 노드별 strategic_weight 설정 |
| CQ 연결 | 하위 CQ 목록 관리 |

---

## 13. 환경 변수 레퍼런스

### 13.1 필수 환경 변수

| 변수명 | 용도 | 사용 위치 |
|--------|------|----------|
| `CRON_SECRET` | Cron API 인증 토큰 | `qis-sync/route.ts` |
| `HUB_API_URL` | Hub 서버 URL | `hub-client.ts`, `kweddinghub-collector.ts` |
| `HUB_API_KEY` | BSW→Hub 인증 키 | `hub-client.ts` |
| `QIS_API_KEY_HASH` | Hub→BSW 인증 해시 (SHA-256) | `qis-auth.ts` |

### 13.2 네이버 API 인증

| 변수명 | 용도 |
|--------|------|
| `NAVER_CLIENT_ID` | 네이버 Open API Client ID |
| `NAVER_CLIENT_SECRET` | 네이버 Open API Client Secret |

### 13.3 AI 엔진 인증

| 변수명 | 용도 |
|--------|------|
| `GEMINI_API_KEY` | Gemini LLM + 임베딩 |
| `ANTHROPIC_API_KEY` | Claude AI Provider |
| `OPENAI_API_KEY` | OpenAI Provider |
| `AI_PROVIDER_MODE` | AI 모드 (`gemini`/`claude`/`openai`/`mock`) |

### 13.4 운영 모드

| 변수명 | 용도 | 기본값 |
|--------|------|--------|
| `DEMO_MODE` | 로컬 파일 저장소 강제 사용 | 미설정 |
| `STANDALONE_MODE` | 독립형 파이프라인 활성화 | 미설정 |
| `BSW_WORKSPACE_ID` | 기본 워크스페이스 UUID | - |
| `BSW_BRAND_NAME` | 독립형 모드 브랜드명 | - |
| `BSW_DOMAIN_NAME` | 독립형 모드 도메인명 | - |

---

## 14. 일상 운영 워크플로우

### 14.1 매일 (자동)

```
[03:00 KST] Vercel Cron → /api/cron/qis-sync?phase=all
  1. Hub에서 최신 시그널 Pull
  2. QuestionPredictor로 예측 질문 자동 생성
  3. confidence ≥ 0.7인 예측을 3축 라우팅 후 Hub Push
  4. 로그 확인: Vercel Dashboard → Logs → /api/cron/qis-sync
```

### 14.2 수동 (필요 시)

#### 즉시 수집 트리거

```
1. UI: 시맨틱 코어 > 시그널 > 원천 수집원 관리 탭
2. "전체 수집 동기화 실행 (자동)" 클릭
3. 또는 개별 수집원의 "즉시 수집" 버튼 클릭
```

#### S-OGDE Full Pipeline 가동

```
1. UI: 시맨틱 코어 > 시그널 > 시그널 분석 & 승격 탭
2. "시그널 수집 파이프라인 가동" 클릭
3. 또는 API: POST /api/v1/qis/signals/generate
```

#### Hub Pull/Push 수동 실행

```bash
# Pull만
curl "https://answerhub.kr/api/cron/qis-sync?secret=YOUR_CRON_SECRET&phase=pull"

# Push만
curl "https://answerhub.kr/api/cron/qis-sync?secret=YOUR_CRON_SECRET&phase=push"

# 전체 사이클
curl "https://answerhub.kr/api/cron/qis-sync?secret=YOUR_CRON_SECRET&phase=all"
```

### 14.3 매주 (검증)

```
1. AccuracyTracker 리포트 확인
   → getSectorAccuracyReport() 실행
   → 업종별 emergence_rate, timing_accuracy 검토
2. predicted_questions 테이블에서 actually_emerged 비율 점검
3. prediction_accuracy < 0.5인 소스 가중치 재검토
```

### 14.4 매월 (최적화)

```
1. 수집원 유효성 점검 (URL 변경, 차단 여부)
2. 업종 템플릿 레지스트리 업데이트 필요성 검토
3. QVS Gate 임계값 조정 필요성 검토 (Go ≥ 68, Watch ≥ 42)
4. YMYL 규제 참조 DB 최신 법규 반영
```

---

## 15. 보안 및 인증

### 15.1 인증 체계

| 호출 방식 | 인증 방법 |
|----------|----------|
| Vercel Cron | `Authorization: Bearer {CRON_SECRET}` (자동) |
| URL 직접 호출 | `?secret={CRON_SECRET}` 쿼리 파라미터 |
| UI 수동 트리거 | `X-Manual-Trigger: true` 헤더 (자동 적용) |
| Hub → BSW API | `X-QIS-Api-Key: {API_KEY}` 헤더 |

### 15.2 API 키 검증 로직

```typescript
// SHA-256 해시 + timing-safe 비교
const receivedHash = crypto.createHash('sha256').update(receivedKey).digest();
const expectedHash = Buffer.from(process.env.QIS_API_KEY_HASH, 'hex');
const isValid = crypto.timingSafeEqual(receivedHash, expectedHash);
```

### 15.3 보안 체크리스트

| 항목 | 구현 |
|------|------|
| 타이밍 공격 방지 | `crypto.timingSafeEqual()` 사용 |
| 키 저장 | 환경변수에 해시값만 저장 (원문 미저장) |
| 전송 보안 | HTTPS 필수 |
| Cron 인증 | Bearer 토큰 / URL 시크릿 / X-Manual-Trigger 3중 지원 |

---

## 16. 트러블슈팅 가이드

### 16.1 Pull 시그널 0건

| 원인 | 해결 |
|------|------|
| Hub API 미오픈 | Hub 팀에 `/api/v1/qis/signals` 엔드포인트 오픈 요청 |
| X-QIS-Api-Key 불일치 | BSW의 `HUB_API_KEY`와 Hub의 인증 키 매칭 확인 |
| Hub URL 오류 | `HUB_API_URL` 환경변수 확인 (`https://admin.aihompy.kr`) |

```bash
# 연결 테스트
curl -X POST https://admin.aihompy.kr/api/v1/qis/signals \
  -H "X-QIS-Api-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d "{}"
```

### 16.2 Push 0건 (no_new_predictions)

```
1. Pull을 먼저 실행하여 시그널 수집
2. predicted_questions 테이블 확인:
   SELECT COUNT(*) FROM predicted_questions WHERE industry='wedding' AND confidence >= 0.7;
3. 0이면 bsw_received_signals도 확인:
   SELECT COUNT(*) FROM bsw_received_signals WHERE industry='wedding';
```

### 16.3 S-OGDE 파이프라인 실패

| 단계 | 가능 원인 | 해결 |
|------|---------|------|
| Phase G | AI API 키 미설정 | `GEMINI_API_KEY` 환경변수 확인 |
| Phase D1 | Search Grounding 실패 | 네트워크 연결 확인, Gemini API 쿼터 점검 |
| Phase DD | 임베딩 실패 | 임베딩 모델 사용 가능 여부 확인 |
| Phase E | QVS 평가 타임아웃 | `repeatEval` 횟수 줄이기 (기본 3 → 1) |

### 16.4 QVS 점수 0 또는 비정상

```
1. brand_ontology_nodes 테이블에 데이터 존재 확인
2. tco_concepts 테이블에 업종 데이터 확인
3. AI_PROVIDER_MODE가 'mock'이 아닌지 확인
4. Phase 0 (TCO/KG Bootstrap)이 정상 실행되었는지 확인
```

### 16.5 수집원 데이터 미수집

```
1. 네이버 API 인증 확인: NAVER_CLIENT_ID, NAVER_CLIENT_SECRET
2. RSS 피드 URL 접근 가능 여부 확인 (방화벽, geo-block)
3. 커뮤니티 사이트 구조 변경 여부 확인 (셀렉터 업데이트 필요)
4. DEMO_MODE=true 여부 확인 (로컬 파일만 사용 중일 수 있음)
```

---

## 17. Hub 연동 현황 및 로드맵

### 17.1 현재 연동 상태

| 구간 | 상태 | 상세 |
|------|------|------|
| **BSW 내부** | ✅ ~100% | 6개 스키마, 23종 시그널, 예측기, 트래커, 크로스맵퍼 구현 완료 |
| **BSW → Hub Push** | ⚠️ 50% | `pushPredictedQuestions()` 실제 호출됨, Hub 수신 API 미확인 |
| **Hub → BSW Pull** | ⚠️ 30% | `pullSignals()` 실제 호출, `pullMetrics()`/`pullExpectedLayers()` Stub |
| **Hub → BSW Feedback** | ✅ 100% | BSW 수신 API 완료, Hub 전송 로직 미구현 |

### 17.2 Hub 측 미구현 API (Hub 팀 작업 필요)

| 엔드포인트 | 방향 | 우선순위 |
|----------|------|---------|
| `POST /api/v1/qis/signals` | Hub→BSW 시그널 제공 | P0 필수 |
| `POST /api/v1/qis/questions` | BSW→Hub 예측 질문 수신 | P1 중요 |
| `GET /api/v1/qis/metrics` | Hub→BSW 실측 메트릭 제공 | P2 권장 |
| `GET /api/v1/qis/layers` | Hub→BSW 기대 레이어 제공 | P3 선택 |

### 17.3 연동 완성 작업 목록

| # | 작업 | 예상 시간 |
|---|------|----------|
| 1 | Hub `pullBswPredictions()` 함수 구현 | 1h |
| 2 | Hub 4개 수신 API 구현 | 3h |
| 3 | `sendSignalToBsw()` 엔드포인트 URL 수정 | 0.5h |
| 4 | Auth 헤더 통일 (Hub Bearer → X-QIS-Api-Key) | 0.5h |
| 5 | `pullMetrics()` Stub → 실제 API 연동 | 1h |
| 6 | `pullExpectedLayers()` Stub → 실제 API 연동 | 1h |
| **합계** | | **~7h** |

---

> **이 문서는 BSW-OS QIS Full Pipeline v3.0 기준으로 작성되었습니다.**  
> **프로덕션 URL:** `https://answerhub.kr`  
> **최종 업데이트:** 2026-07-03
