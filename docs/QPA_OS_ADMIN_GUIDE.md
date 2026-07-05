# QPA-OS (Question Prediction & Analysis Operating System) — 완전 관리자 가이드

> **Version:** 2.0 | 2026-07-03  
> **프로덕션 URL:** `https://answerhub.kr`  
> **대상 독자:** BSW-OS 시스템 관리자, 전략 담당자, 콘텐츠 운영팀  
> **상태:** S-OGDE v3.0 엔진, QVS 8D 스코어링, 콘텐츠 팩토리 적용 완료

---

## 목차

1. [시스템 개요](#1-시스템-개요)
2. [4-Layer 질문 데이터 모델](#2-4-layer-질문-데이터-모델)
3. [QVS 스코어링 시스템](#3-qvs-스코어링-시스템)
4. [S-OGDE 엔진 (Signal-Organic Growth Discovery Engine)](#4-s-ogde-엔진)
5. [Expected Layer 시스템](#5-expected-layer-시스템)
6. [콘텐츠 팩토리 (Content Factory)](#6-콘텐츠-팩토리-content-factory)
7. [정확도 추적 및 피드백 루프](#7-정확도-추적-및-피드백-루프)
8. [업종별 산업 적용 현황](#8-업종별-산업-적용-현황)
9. [원천 시그널 수집 파이프라인](#9-원천-시그널-수집-파이프라인)
10. [NanoJob J1-J3 멀티페르소나 질문 생성](#10-nanojob-j1-j3-멀티페르소나-질문-생성)
11. [QVS 포트폴리오 관리](#11-qvs-포트폴리오-관리)
12. [RLAF 업종별 가중치 캘리브레이션](#12-rlaf-업종별-가중치-캘리브레이션)
13. [Semantic Core UI 운영 가이드](#13-semantic-core-ui-운영-가이드)
14. [Deep Dive 분석 시스템](#14-deep-dive-분석-시스템)
15. [AEPI 점수 체계](#15-aepi-점수-체계)
16. [시계열 추적 (Temporal Tracker)](#16-시계열-추적-temporal-tracker)
17. [질문 펀넬 생애주기 관리](#17-질문-펀넬-생애주기-관리)
18. [운영 KPI 및 성과 지표](#18-운영-kpi-및-성과-지표)
19. [트러블슈팅 가이드](#19-트러블슈팅-가이드)
20. [아키텍처 코드 맵](#20-아키텍처-코드-맵)

---

## 1. 시스템 개요

### 1.1 QPA-OS란?

**QPA-OS (Question Prediction & Analysis Operating System)**는 AI 검색 시대의 소비자 질문을 **예측 → 선점 → 관찰 → 최적화**하는 운영 체제입니다.

BSW-OS의 기존 **"Observe → Diagnose → Fix"** 패러다임을 보완하여, 질문이 발생하기 **전에** 선제적으로 콘텐츠를 준비하는 **"Predict → Pre-empt → Observe → Optimize"** 워크플로우를 구현합니다.

### 1.2 핵심 구성 요소 (5계층)

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 5: Accuracy Tracking (자체 학습 피드백 루프)           │
│   PredictionAccuracyTracker, SignalPerformanceTracker       │
├─────────────────────────────────────────────────────────────┤
│ Layer 4: Content Factory (선점 콘텐츠 생산)                 │
│   VibeBalancedForecaster → PreemptiveContentFactory         │
├─────────────────────────────────────────────────────────────┤
│ Layer 3: QVS Scoring (비즈니스 가치 정량화)                 │
│   QVS 8D + CPS + Gate + NanoJob J1-J3 + RLAF               │
├─────────────────────────────────────────────────────────────┤
│ Layer 2: Prediction Engine (질문 예측 엔진)                 │
│   QuestionPredictor + Industry Template Registry             │
├─────────────────────────────────────────────────────────────┤
│ Layer 1: Signal Collection (시그널 수집)                    │
│   8종 수집기 + ExternalCollectors + CollectionStorage        │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 운영 패러다임

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Predict  │ →  │ Pre-empt │ →  │ Observe  │ →  │ Optimize │
│ 질문 예측 │    │ 콘텐츠   │    │ 실측 및   │    │ 가중치   │
│          │    │ 선점 생산 │    │ 출현 확인 │    │ 재캘리브 │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
      ↑                                              │
      └──────────── Feedback Loop ───────────────────┘
```

---

## 2. 4-Layer 질문 데이터 모델

### 2.1 질문 계층 구조

QPA-OS는 질문을 4개 계층으로 구조화합니다:

```
Question Signal (원시 질문)
    ↓ promote
Question Capital Node (전략적 질문 영역 트리)
    ↓ 1:N
Canonical Question (정규화·중복 제거된 표준 질문)
    ↓ 1:N
QIS Scene (페르소나 × 결정 단계 × 서피스 타겟)
    ↓ convert
Probe Question (측정 질문 + Expected Layer)
```

### 2.2 병렬 예측 계층

예측 파이프라인은 위 계층과 병렬로 작동합니다:

```
Emergence Signal → Predicted Question → Content Blueprint + QVS Score
                                    ↓ (출현 확인 시)
                              Canonical Question (승격)
```

### 2.3 각 계층 상세

| 계층 | DB 테이블 | 핵심 속성 | 역할 |
|------|----------|----------|------|
| **Question Signal** | `question_signals` | query, volume, intent, status, qvs_total, gate_status | 원시 질문 시그널 저장, QVS 평가 |
| **Question Capital Node** | `question_capital_nodes` | title, slug, strategic_weight, parent_id | 전략적 질문 영역 트리 (계층 구조) |
| **Canonical Question** | `canonical_questions` | normalized_question, signature(SHA-256), qvs_summary, cps_score, status | 정규화된 표준 질문 (중복 방지) |
| **QIS Scene** | `qis_scenes` | scene_name, query_template, intent_model, risk_level, context_tensor, readiness_score | 검색 시나리오 + 정책 + Expected Layer |
| **Predicted Question** | `predicted_questions` | question_text, confidence, first_mover_window_days, auto_must_include[], actually_emerged | AI 예측 질문 + 5-tier 가이드라인 |

### 2.4 핵심 식별자

| 식별자 | 용도 | 생성 규칙 |
|--------|------|----------|
| `id` (UUID) | 모든 테이블 PK | `gen_random_uuid()` |
| `slug` | URL-safe 식별자 | 질문 텍스트 기반 자동 생성 |
| `signature` (SHA-256) | 중복 방지 해시 | `SHA-256(normalized_question)` |
| `bsw_question_id` | Hub 동기화 식별자 | BSW 내부 UUID → Hub 전송 |

---

## 3. QVS 스코어링 시스템

### 3.1 QVS 개요

**QVS (Question Value Score)**는 질문의 비즈니스 가치를 다차원으로 정량화하는 점수 체계입니다.

### 3.2 QVS 8D (8차원 평가)

**파일:** `lib/signal-collection/signal-evaluator.ts`

| 차원 | 가중치 | 범위 | 평가 기준 |
|------|--------|------|----------|
| **Relevance** (관련성) | 0.18 | 0-100 | 브랜드/업종과의 직접적 관련도 |
| **Conversion** (전환성) | 0.18 | 0-100 | 구매 결정에 기여하는 정도 |
| **Snippet Fitness** (스니펫 적합성) | 0.15 | 0-100 | AI 답변 카드에 적합한 정도 |
| **Opportunity** (기회도) | 0.12 | 0-100 | 경쟁 공백 크기 + 선점 기회 |
| **Specificity** (구체성) | 0.10 | 0-100 | 질문의 명확도와 구체성 |
| **Entity Clarity** (엔티티 명확성) | 0.10 | 0-100 | 대상 엔티티의 식별 용이성 |
| **Multi-Engine** (멀티엔진 일관성) | 0.10 | 0-100 | 여러 AI 엔진 간 응답 일관성 |
| **Urgency** (긴급성) | 0.07 | 0-100 | 시의성 및 긴급 대응 필요도 |

> **가중치 산출 방법:** AHP (Analytic Hierarchy Process), 일관성 비율 CR = 0.04 (< 0.10 기준 충족)

### 3.3 QVS Composite (5차원 복합 점수)

**파일:** `app/actions/qvs.ts`

기존 5차원 복합 점수 체계 (QVS 8D와 병행 운영):

```
QVS Composite = Volume × Conversion × ARPU × FirstMover × (1 / Competition)
```

| 차원 | 범위 | 의미 |
|------|------|------|
| `volume_score` | 0-100 | 월간 예상 검색량 |
| `conversion_score` | 0-100 | 구매 전환 확률 |
| `arpu_score` | 0-100 | 전환당 평균 매출 |
| `first_mover_score` | 0.1-5.0 | AI 커버리지 갭 × 긴급도 배수 |
| `competition_score` | 0-100 | 경쟁 포화도 |

### 3.4 First-Mover Score 산출 공식

```
first_mover_score = coverage_gap_multiplier × urgency_multiplier
```

| AI 커버리지 | coverage_gap_multiplier |
|-----------|----------------------|
| none | 5.0 |
| sparse | 3.0 |
| moderate | 1.5 |
| saturated | 0.5 |

| 기간 | urgency_multiplier |
|------|-------------------|
| ≤ 7일 | 3.0 |
| 8-14일 | 2.0 |
| 15-30일 | 1.5 |
| 31-60일 | 1.2 |
| > 60일 | 1.0 |

### 3.5 CPS (Composite Priority Score)

```
CPS = 0.30 × P(QVS) + 0.25 × P(Vol) + 0.20 × (TCO_match/10) + 0.15 × (KG_cov/10) + 0.10 × W_YMYL
```

| 항목 | 가중치 | 설명 |
|------|--------|------|
| P(QVS) | 0.30 | QVS 총점의 백분위 순위 |
| P(Vol) | 0.25 | 검색량의 백분위 순위 |
| TCO_match/10 | 0.20 | 매칭된 TCO 개념 수 (최대 10) |
| KG_cov/10 | 0.15 | 매칭된 KG 노드 수 (최대 10) |
| W_YMYL | 0.10 | YMYL 여부 (true=1.0, false=0.0) |

### 3.6 Gate 판정

| Gate | 조건 | 액션 | 타임라인 |
|------|------|------|---------|
| 🏆 **Go** | QVS ≥ 68 AND brand_fit != 'unfit' | 즉시 콘텐츠 생산 착수 | 48시간 이내 |
| 🟡 **Watch** | 42 ≤ QVS < 68 | 모니터링 후 재평가 | 다음 사이클 |
| 🔴 **No-Go** | QVS < 42 OR brand_fit == 'unfit' | 보류 | 리소스 미투입 |

### 3.7 QVS Grade (등급 체계)

| 등급 | Composite 점수 | 전략적 액션 |
|------|--------------|-----------|
| 🏆 **S** | ≥ 90 | 즉각 선점 — 48시간 이내 배포 |
| 🟢 **A** | 70-89 | 우선 대응 — 1주 내 |
| 🔵 **B** | 50-69 | 계획 포함 — 분기 로드맵 |
| 🟡 **C** | 30-49 | 모니터링 유지 |
| 🔴 **D** | < 30 | 보류 (리소스 미투입) |

---

## 4. S-OGDE 엔진

### 4.1 엔진 개요

**S-OGDE (Signal-Organic Growth Discovery Engine) v3.0**은 7단계 파이프라인으로 구성된 질문 발굴 엔진입니다.

**파일:** `lib/signal-collection/orchestrator.ts`

### 4.2 Phase별 상세

#### Phase G: 5-Lens Meta-Question Generation

**파일:** `lib/signal-collection/meta-question-engine.ts`

```
5개 심리 렌즈 × 5개 질문/렌즈 = 25개 시드 질문
```

| 렌즈 | 심리 이론 | 발굴 방향 |
|------|----------|----------|
| **Pattern** | 행동 패턴 인식 | 반복적 소비 패턴, 계절성, 트렌드 |
| **Motivation** | 동기 부여 이론 | 구매 동기, 가치관, 목표 달성 |
| **Journey Stage** | 고객 여정 이론 | 인지 → 검토 → 결정 → 사용 각 단계별 질문 |
| **Fear/Desire** | 감정 심리학 | 불안, 기대, FOMO, 후회 회피 |
| **Counter** | 역발상 / 통념 반박 | 상식 반대, 극단 시나리오, 역질문 |

#### Phase D1: Search-Grounded Chain

**파일:** `lib/signal-collection/exploratory-chain.ts`

```
이론: Information Gap Theory (Loewenstein, 1994)
프로세스: Seed → LLM Answer → Info Gap 추출 → Follow-up → 반복
최대 깊이: 3단계
AI 연동: Gemini Search Grounding (실제 검색 결과 기반)
```

#### Phase D2: Multi-Persona Recursive Deepening

**파일:** `lib/signal-collection/recursive-deepener.ts`

```
이론: Information Foraging Theory (Pirolli & Card, 1999)
페르소나: Skeptic(회의론자) / Pragmatist(실용주의자) / Novice(초보자)
트리 구조: branch_factor=2-3, max_depth=3, max_total=15-20
수렴 조건: 정확 중복 감지, 도메인 이탈 감지, 깊이 한계
```

#### Phase R: Reverse Question Engineering

```
USP(고유 판매 제안) → 3단계 역산출 × 5 경로 = 15개 전략 질문
방향: "이 답변을 얻기 위해 소비자가 물어봤을 질문은 무엇인가?"
```

#### Phase DD: Semantic Deduplication

**파일:** `lib/signal-collection/semantic-dedup.ts`

```
임베딩: Gemini text-embedding-004 (768차원)
알고리즘: 코사인 유사도 ≥ 0.85 → 동일 클러스터
방법: 응집적 클러스터링 (Agglomerative Clustering)
```

#### Phase E: QVS 8D Evaluation + CPS + Gate

**파일:** `lib/signal-collection/signal-evaluator.ts`

```
1. N-Repeat LLM 평가 (기본 3회)
2. σ(표준편차) 기반 신뢰도 산출
3. 8차원 QVS 점수 산출
4. CPS 복합 우선순위 점수 산출
5. Go / Watch / No-Go 게이트 판정
```

**신뢰도 분류:**

| σ (표준편차) | 신뢰도 | 의미 |
|-------------|--------|------|
| σ < 5.0 | **High** | LLM 반복 평가 안정적 |
| 5.0 ≤ σ < 10.0 | **Medium** | 약간의 변동 |
| σ ≥ 10.0 | **Low** | 불안정 — 재평가 권장 |

### 4.3 파이프라인 오케스트레이션

```
SignalOrchestrator.runFullPipeline()
  ├─ Phase 0: TCO/KG Bootstrap (조건부)
  ├─ Phase G: 5-Lens (25 seeds)
  ├─ Phase D1: Search Chain (depth 3)
  ├─ Phase D2: Multi-Persona (3 personas × tree)
  ├─ Phase R: Reverse Engineering (5 paths × 3 steps)
  ├─ Phase DD: Semantic Dedup (cosine ≥ 0.85)
  ├─ Phase E: QVS 8D + CPS + Gate
  ├─ 결과 저장: question_signals 테이블
  └─ brand_fit='unfit' 필터링 → 최종 결과 반환
```

---

## 5. Expected Layer 시스템

### 5.1 3-Tier (관찰 기반 — Probe Questions)

프로브 질문에 첨부되는 기존 3단계 콘텐츠 가이드라인:

| Tier | 의미 | 위반 패널티 |
|------|------|-----------|
| `must_include` | 반드시 포함 (Brand Truth) | 15% 감점/항목 |
| `should_include` | 포함 권장 (TCO/EEAT 보너스) | - |
| `must_not_do` | 금지 사항 (YMYL 경계선) | 15% 감점/항목 |

**복합 점수 공식:**
```
compositeScore = (must_score × 0.6 + should_score × 0.3) - violations × 0.15
```

### 5.2 5-Tier (예측 기반 — Predicted Questions)

예측 질문에 자동 부여되는 확장된 5단계 가이드라인:

| Tier | 의미 | 예시 |
|------|------|------|
| `auto_must_include` | 반드시 포함 | "식약처 인증 번호", "임상 데이터" |
| `auto_strongly_recommended` | 강력 권장 | "EEAT 전문가 인용", "출처 링크" |
| `auto_should_include` | 포함 권장 | "사용 후기", "비교 데이터" |
| `auto_caution` | 주의 사항 | "개인차 언급", "알레르기 경고" |
| `auto_must_not_do` | 금지 사항 | "치료 효과 단정", "경쟁사 비방" |

### 5.3 YMYL 규제 참조 동적 주입

QuestionPredictor는 DB의 `ymyl_regulatory_references` 테이블에서 업종별 최신 규제 정보를 동적으로 조회하여 Expected Layer에 자동 주입합니다.

```
예: 스킨케어 업종
  auto_must_include: ["식약처 기능성 화장품 고시 제2026-XX호 준수"]
  auto_must_not_do: ["의약품적 효능 표현 금지 (화장품법 제13조)"]
```

---

## 6. 콘텐츠 팩토리 (Content Factory)

### 6.1 개요

콘텐츠 팩토리는 예측 질문에 대한 **선점 콘텐츠**를 자동 생성하는 파이프라인입니다.

```
Predicted Question → Vibe Blueprint → Draft Generation → VPA Check → Safety Gate → Queue
```

### 6.2 Vibe-Balanced Forecaster

**파일:** `lib/prediction/vibe-forecaster.ts`

| 항목 | 상세 |
|------|------|
| **역할** | 예측 질문 + 브랜드 Vibe Spec → 톤 균형 잡힌 콘텐츠 블루프린트 생성 |
| **입력** | predictedQuestionId, vibeSpecs, brandOperationalTruths |
| **산출물** | ContentBlueprint (target_vpa, tone_guidelines, structure_type, expected_layers) |
| **기본 VPA** | 75.00 (최소 합격 기준) |
| **구조 유형** | `guide` (가이드형) 또는 `qna` (Q&A형) |

**톤 가이드라인 생성 로직:**

```
1. Vibe Spec의 warmth/professionalism 비율 분석
2. warmth > 0.6 → "따뜻하고 공감적인 톤" 지시
3. professionalism > 0.7 → "전문적이고 데이터 기반의 톤" 지시
4. 5-tier Expected Layer 중 strongly_recommended, caution 항목 반영
5. 브랜드 운영 진실(Operational Truth) 기반 팩트 주입
```

### 6.3 Preemptive Content Factory

**파일:** `lib/prediction/content-factory.ts`

#### 메서드 1: `generateDraft(blueprintId)`

| 항목 | 상세 |
|------|------|
| **역할** | 블루프린트 기반 콘텐츠 초안 생성 |
| **구조 분기** | `guide` → 서론/본론/결론 구조, `qna` → 질문/답변 구조 |
| **현재 구현** | 템플릿 기반 (LLM 생성 미적용) |

#### 메서드 2: `vibeCheck(draftText, workspaceId, blueprintId?)`

| 항목 | 상세 |
|------|------|
| **역할** | VPA (Vibe-Persona Alignment) 점수 산출 (0-100) |
| **보너스** | 따뜻함 정렬 +15, 전문성 정렬 +10 |
| **패널티** | 금지 표현 -30/건, strongly_recommended 누락 -10/건, caution 키워드 발견 -5/건 |

#### 메서드 3: `adjustTone(draftText, targetVPA)`

| 항목 | 상세 |
|------|------|
| **역할** | VPA 미달 시 톤 자동 조정 |
| **동작** | 금지 표현 → 안전 대안으로 교체, targetVPA ≥ 80 → EEAT 요소 자동 추가 |

#### 메서드 4: `safetyGate(draftText, blueprintId)`

| 항목 | 상세 |
|------|------|
| **역할** | must_include 존재 확인 + must_not_do 부재 확인 |
| **반환** | `{ passed: boolean, reason?: string }` |
| **실패 시** | 콘텐츠 큐잉 차단 |

#### 메서드 5: `sendToTenantQueue(blueprintId)`

```
전체 파이프라인:
  1. Safety Gate 검증
  2. VPA 점수 확인
  3. 통과 시 status → "queued"
  4. 실패 시 사유 반환
```

---

## 7. 정확도 추적 및 피드백 루프

### 7.1 예측 정확도 검증 공식

```
prediction_accuracy = weighted_avg(
  emergence_accuracy × 0.4,   // 이진값: 출현 여부
  timing_accuracy × 0.3,      // 1 - |예측일수 - 실제일수| / 예측일수
  volume_accuracy × 0.3       // 1 - |예측량 - 실제량| / max(양쪽)
)
```

### 7.2 KPI 타겟

| KPI | 목표 | 임계값 |
|-----|------|--------|
| Emergence Rate (출현율) | ≥ 60% | 예측 질문 중 실제 출현 비율 |
| Timing Accuracy (시기 정확도) | ≥ 0.7 | First-Mover Window 대비 실제 출현 시점 |
| Volume Accuracy (검색량 정확도) | ≥ 0.5 | 예측 검색량 대비 실제 검색량 |
| Overall Accuracy (종합 정확도) | ≥ 0.6 | 가중 평균 |

### 7.3 검증 사이클

| 주기 | 활동 | 담당 |
|------|------|------|
| **주간** | 질문 매칭 — Hub 피드백으로 출현 여부 확인 | 자동 (Cron) |
| **월간** | 정확도 리포트 — `getSectorAccuracyReport()` | 관리자 |
| **분기** | 모델 재캘리브레이션 — 가중치 재조정 | 관리자 |

### 7.4 자체 학습 메커니즘

#### PredictionAccuracyTracker

**파일:** `lib/prediction/accuracy-tracker.ts`

| 메서드 | 기능 |
|--------|------|
| `verifyPrediction(id)` | 예측 vs 실제 AI 커버리지 비교 → 정확도 산출 |
| `recalibrateSignalWeights(wsId)` | 소스별 가중치 베이지안 재캘리브 |
| `getSectorAccuracyReport(wsId)` | 업종별 정확도 + 편향(bias) 보고 |

**가중치 재캘리브레이션 공식:**
```
weight = 1.0 + (소스별_평균_정확도 - 0.5)
```

예: 커뮤니티 소스의 평균 정확도가 0.72이면 → weight = 1.0 + (0.72 - 0.5) = **1.22**

#### SignalPerformanceTracker (OLS 학습)

**Cron phase=feedback 시 실행:**
- 최소 10개 샘플 축적 후 OLS(Ordinary Least Squares) 회귀로 가중치 자동 학습
- 공분산 기반 가중치 재캘리브레이션

---

## 8. 업종별 산업 적용 현황

### 8.1 업종 Readiness 매트릭스

| 업종 | 패널 질문 수 | 적정 수준 | Readiness |
|------|------------|----------|-----------|
| **Skincare (스킨케어)** | 155 | Goldilocks ✅ | 🟢 Ready |
| **Wedding Studio (웨딩)** | 80 | Goldilocks ✅ | 🟢 Ready |
| Seoul Districts KO | ~80 | Goldilocks ⚠️ | 🟡 Partial |
| Seoul Districts EN | ~80 | Goldilocks ⚠️ | 🟡 Partial |
| K-pop Idol KO | 18 | 부족 | 🟡 Partial |
| K-pop Idol EN | 18 | 부족 | 🟡 Partial |
| 기타 21개 업종 | ≤ 20 (auto-pad) | 부족 | 🔴 Not Ready |

### 8.2 업종별 Goldilocks 기준

| 등급 | 패널 질문 수 | 상태 |
|------|-----------|------|
| **Goldilocks** | 50-200 | 최적 — 분석 신뢰도 높음 |
| **Underweight** | < 50 | 부족 — 패딩으로 보완 |
| **Overweight** | > 200 | 과다 — 중복 제거 필요 |

### 8.3 업종 독립적 엔진 (8개)

QPA-OS의 핵심 엔진 8개는 **업종 불문(industry-agnostic)**으로 동작합니다:

| # | 엔진 | 업종 의존성 |
|---|------|-----------|
| 1 | QuestionPredictor | 업종별 템플릿 레지스트리 (폴백 있음) |
| 2 | SignalEvaluator (QVS 8D) | 없음 |
| 3 | MetaQuestionEngine (5-Lens) | 없음 |
| 4 | ExploratoryChain (D1) | 없음 |
| 5 | RecursiveDeepener (D2) | 없음 |
| 6 | SemanticDedup (DD) | 없음 |
| 7 | VibeBalancedForecaster | Vibe Spec 의존 (업종 독립) |
| 8 | PredictionAccuracyTracker | 없음 |

### 8.4 신규 업종 온보딩 절차

```
1. 업종 키(industryKey) 등록 (예: 'dental_clinic')
2. PREDICTION_TEMPLATE_REGISTRY에 업종 템플릿 추가 (선택)
3. 업종별 TCO 개념 시드 데이터 투입 (Phase 0 자동 생성 가능)
4. 패널 질문 50개 이상 확보 (S-OGDE 파이프라인 가동)
5. 레퍼런스 사이트 등록 (벤치마크용)
6. Naver DataLab 키워드 추가 (수집원 설정)
```

---

## 9. 원천 시그널 수집 파이프라인

### 9.1 아키텍처

```
┌─────────────────────────────────────────┐
│ ExternalCollectors (4종 실제 수집)        │
│  ├─ collectNaverNews()                   │
│  ├─ collectNaverDatalab()                │
│  ├─ collectRss()                         │
│  └─ collectCommunity()                   │
└──────────┬──────────────────────────────┘
           ↓
┌──────────────────────────────────────────┐
│ CollectionStorage (하이브리드 저장소)       │
│  ├─ Supabase DB (primary)                │
│  └─ Local JSON (fallback)                │
└──────────┬──────────────────────────────┘
           ↓
┌──────────────────────────────────────────┐
│ Signal Collectors (8종)                   │
│  ├─ CommunityCollector ← 외부 시그널      │
│  ├─ SearchTrendCollector ← 검색 트렌드    │
│  ├─ KWeddingHubCollector ← Hub API       │
│  ├─ NewsCollector (mock)                 │
│  ├─ RegulationCollector (mock)           │
│  ├─ SeasonalCollector (mock)             │
│  ├─ SBSBroadcastCollector (mock)         │
│  └─ InternalCollector (mock)             │
└──────────┬──────────────────────────────┘
           ↓
┌──────────────────────────────────────────┐
│ QuestionPredictor                         │
│  → Predicted Questions (3종/시그널)        │
└──────────────────────────────────────────┘
```

### 9.2 센티멘트 분석 (Community Collector)

커뮤니티 수집기는 수집된 텍스트에서 자동으로 감정 분석을 수행합니다:

| 키워드 패턴 | 감정 | Impact |
|-----------|------|--------|
| 부작용, 붉어, 따갑, 화끈 | `negative_anxious` | `high` |
| 추천, 좋아요, 효과 | `positive` | `medium` |
| 비교, 차이, vs | `comparison` | `medium` |

### 9.3 검색 트렌드 Impact 매핑

| 상대 검색량 | Impact |
|-----------|--------|
| > 80 | `critical` |
| > 50 | `high` |
| > 20 | `medium` |
| ≤ 20 | `low` |

---

## 10. NanoJob J1-J3 멀티페르소나 질문 생성

**파일:** `lib/benchmark/qvs-question-generator.ts`

### 10.1 3페르소나 체계

| 페르소나 | 역할 | 질문 유형 | 생성 수 |
|---------|------|----------|--------|
| **J1 Consumer** | 일반 소비자 | 구매/문제 해결 질문 | 3개 |
| **J2 Competitor** | 비교 쇼퍼 | 브랜드 비교/전환 질문 | 3개 |
| **J3 Expert** | 전문가/검증자 | 기술/EEAT 검증 질문 | 3개 |

### 10.2 실행 결과

```
페르소나당 3개 × 3 페르소나 = 총 9개 질문/실행
LLM 실패 시: 페르소나별 폴백 질문 자동 생성
```

### 10.3 LLM 호출 프롬프트 구조

```
"당신은 {persona_type}입니다.
 {brand_name}의 {industry} 분야에서
 실제로 AI 검색엔진에 물어볼 법한 질문 3개를 생성하세요.
 각 질문은 구체적이고 자연스러워야 합니다."
```

---

## 11. QVS 포트폴리오 관리

**파일:** `lib/benchmark/qvs-portfolio-manager.ts`

### 11.1 포트폴리오 건강 점수 (A-F)

| 등급 | 점수 | 의미 |
|------|------|------|
| **A** | ≥ 85 | 우수 — 포트폴리오 균형 최적 |
| **B** | 70-84 | 양호 — 소수 개선 필요 |
| **C** | 55-69 | 보통 — 체계적 개선 필요 |
| **D** | 40-54 | 미흡 — 긴급 조치 필요 |
| **F** | < 40 | 심각 — 포트폴리오 재구성 필요 |

### 11.2 주요 분석 기능

| 기능 | 설명 |
|------|------|
| **Drift Detection** | QVS 점수 변동폭 추적 → 급격한 하락 경보 |
| **Competitor Takeover Alert** | 경쟁사의 AI 커버리지 침투 감지 → 방어 필요 질문 식별 |
| **Coverage Gap** | 업종 필수 질문 중 미커버 영역 식별 |
| **Health Scoring** | 다차원 포트폴리오 건강도 종합 평가 |

### 11.3 계획: `qvs_snapshots` 테이블

시계열 포트폴리오 추적을 위해 별도 테이블 계획:

```sql
CREATE TABLE qvs_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  snapshot_date DATE NOT NULL,
  total_questions INT,
  avg_qvs DECIMAL,
  grade CHAR(1),
  go_count INT,
  watch_count INT,
  nogo_count INT,
  health_details JSONB
);
```

---

## 12. RLAF 업종별 가중치 캘리브레이션

**파일:** `lib/benchmark/rlaf-tuner.ts`

### 12.1 업종별 가중치 프리셋

| 업종 | volumeWeight | conversionWeight | arpuWeight | firstMoverWeight | competitionWeight |
|------|-------------|-----------------|-----------|-----------------|------------------|
| **beauty** | 0.8 | 1.3 | 1.0 | 1.0 | 1.0 |
| **tech** | 1.0 | 1.0 | 1.0 | 1.5 | 1.0 |
| **finance** | 1.0 | 1.0 | 1.4 | 1.0 | 1.0 |
| **기타** | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 |

### 12.2 캘리브레이션 원리

```
뷰티 업종: 검색량보다 전환율이 핵심 → conversion × 1.3, volume × 0.8
테크 업종: 선점이 핵심 → firstMover × 1.5
금융 업종: 객단가가 핵심 → arpu × 1.4
```

> RLAF(Reinforcement Learning from Actual Feedback): 실제 피드백 데이터가 축적되면 자동으로 가중치를 재학습하는 메커니즘입니다.

---

## 13. Semantic Core UI 운영 가이드

### 13.1 전체 네비게이션 맵

```
시맨틱 코어
├── 시그널 레지스트리 (/semantic-core/signals)
│   ├── 시그널 분석 & 승격 탭
│   └── 원천 수집원 관리 (Admin) 탭
├── QIS Scene 관리 (/semantic-core/qis)
├── QIS 3축 Hub 동기화 (/semantic-core/qis-triaxis)
├── Canonical Questions (/semantic-core/canonical-questions)
├── Question Capital (/semantic-core/question-capital)
├── 오케스트레이션 (/semantic-core/orchestration)
├── 전략 (/semantic-core/strategy)
└── 성과 (/semantic-core/performance)
```

### 13.2 시그널 레지스트리 운영

#### 시그널 분석 & 승격 탭

| 기능 | 설명 | 액션 |
|------|------|------|
| 파이프라인 가동 | S-OGDE 7단계 전체 실행 | "시그널 수집 파이프라인 가동" 버튼 |
| QVS 점수 표시 | 각 질문의 8D 점수 + 등급 | 자동 표시 |
| Gate 필터링 | Go / Watch / No-Go 별 필터 | 드롭다운 선택 |
| 배치 승격 | Go 질문을 CQ로 일괄 승격 | 선택 후 "승격" 버튼 |

#### 원천 수집원 관리 (Admin) 탭

| 기능 | 설명 | 액션 |
|------|------|------|
| 소스 추가 | 새 수집원 등록 (이름, 코드, 방식, URL) | 양식 작성 후 "추가" |
| 활성화 토글 | 수집원 on/off | 토글 스위치 |
| 즉시 수집 | 개별 수집원 즉시 트리거 | 수집원별 "즉시 수집" 버튼 |
| 일괄 동기화 | 활성 수집원 전체 동시 수집 | "전체 수집 동기화 실행" 버튼 |
| 소스 삭제 | 수집원 제거 | "삭제" 버튼 |
| 수집 피드 | 최근 수집 데이터 실시간 목록 | 하단 영역 자동 렌더링 |

### 13.3 QIS 3축 Hub 동기화 UI

| 기능 | 설명 |
|------|------|
| 실행 모드 드롭다운 | Pull / Push / All 선택 |
| URL 미리보기 | 호출될 API URL 표시 |
| "지금 실행" 버튼 | 선택된 모드로 수동 트리거 |
| 실행 로그 | 수집/전송 결과 실시간 스트리밍 |
| 3축 결과 카드 | Industry / Place / Vortex / Cross-Axis 별 건수 |

### 13.4 오케스트레이션 페이지

| 기능 | 설명 |
|------|------|
| 파이프라인 상태 | 각 Phase (0~E) 진행 상태 |
| 실행 이력 | 최근 파이프라인 실행 로그 |
| 성과 메트릭 | 질문 발굴 수, QVS 평균, Go 비율 |

### 13.5 전략 페이지

| 기능 | 설명 |
|------|------|
| Question Capital 트리 | 전략적 질문 영역 계층 시각화 |
| CQ 매핑 현황 | 영역별 CQ 분포 |
| 커버리지 갭 | 미커버 전략 영역 식별 |

---

## 14. Deep Dive 분석 시스템

### 14.1 개요

Deep Dive는 특정 질문이나 토픽에 대해 **심층 분석 → 진단 → 블루프린트 생성** 을 수행하는 확장 시스템입니다.

### 14.2 API 엔드포인트

| 엔드포인트 | 역할 |
|----------|------|
| `POST /api/deep-dive/diagnose` | 질문/토픽에 대한 심층 진단 |
| `POST /api/deep-dive/blueprint` | 진단 결과 기반 콘텐츠 블루프린트 생성 |
| `POST /api/deep-dive/discover` | 연관 질문 발굴 |
| `POST /api/deep-dive/measure` | AI 가시성 실측 |
| `POST /api/deep-dive/simulate` | 개선 시뮬레이션 |
| `POST /api/deep-dive/approve` | 블루프린트 승인 |
| `GET /api/deep-dive/sessions` | 세션 목록 조회 |
| `GET /api/deep-dive/settings` | 설정 조회 |

### 14.3 UI 경로

```
/{locale}/{workspace_slug}/deep-dive
```

---

## 15. AEPI 점수 체계

**파일:** `lib/benchmark/aepi-calculator.ts`

### 15.1 AEPI란?

**AEPI (AI Engagement Potential Index)**는 웹사이트의 AI 검색 엔진 가시성을 0-100 점수로 정량화하는 복합 지표입니다.

### 15.2 산출 공식

```
AEPI = techModifier × eeatModifier × weightedLayerScore
```

| 구성 요소 | 설명 |
|----------|------|
| `techModifier` | L1 기술 인프라 점수 기반 보정계수 |
| `eeatModifier` | E-E-A-T 4축 점수 기반 보정계수 |
| `weightedLayerScore` | L1(기술) + L2(스키마) + L3(콘텐츠) 가중 평균 |

### 15.3 AEPI와 QPA-OS의 관계

```
QPA-OS 예측 질문 → 콘텐츠 생산 → AEPI 점수 향상
                                      ↓
                              Temporal Tracker로 추적
```

---

## 16. 시계열 추적 (Temporal Tracker)

**파일:** `lib/benchmark/temporal-tracker.ts`

### 16.1 추적 시점

| 시점 | 오프셋 | 의미 |
|------|--------|------|
| T-3 | 90일 전 | 장기 추세 기준점 |
| T-2 | 60일 전 | 중기 변화 감지 |
| T-1 | 30일 전 | 단기 변화 감지 |
| T-0 | 현재 | 최신 상태 |

### 16.2 추적 지표

| 지표 | 설명 |
|------|------|
| **AEPI** | AI 가시성 종합 점수 추이 |
| **ERR** | 7차원 엔티티 반영률 추이 |
| **QVS 평균** | 포트폴리오 QVS 평균 변화 |
| **Go 비율** | Gate 통과(Go) 비율 변화 |

### 16.3 시각화

```
Recharts LineChart로 4시점 추이 그래프 렌더링
X축: T-3 → T-2 → T-1 → T-0
Y축: 점수 (0-100)
```

---

## 17. 질문 펀넬 생애주기 관리

### 17.1 상태 흐름

```
intake → triage → active → monitoring → deprecated → archived
```

| 상태 | 의미 | 전환 조건 |
|------|------|----------|
| `intake` | 신규 유입 (미검토) | 파이프라인 산출물 자동 |
| `triage` | 분류 중 (QVS 평가 완료) | Gate 판정 완료 시 |
| `active` | 활성 관리 대상 | Go 판정 또는 수동 승격 |
| `monitoring` | 모니터링 중 | 콘텐츠 생산 완료 후 |
| `deprecated` | 폐기 예정 | 6개월 이상 미출현 |
| `archived` | 보관 (비활성) | 수동 조치 |

### 17.2 건강한 전환율 기준

| 전환 | 목표 비율 |
|------|----------|
| intake → triage | ≥ 60% |
| triage → active | ≥ 40% |
| active → monitoring | ≥ 80% |
| intake 평균 체류 | ≤ 7일 |

### 17.3 전환율 모니터링

```sql
-- 상태별 질문 수 확인
SELECT status, COUNT(*) as count
FROM question_signals
WHERE workspace_id = '{ws_id}'
GROUP BY status;

-- intake 체류 시간 확인
SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400) as avg_days
FROM question_signals
WHERE status = 'intake' AND workspace_id = '{ws_id}';
```

---

## 18. 운영 KPI 및 성과 지표

### 18.1 수집 계층 KPI

| KPI | 목표 | 측정 방법 |
|-----|------|----------|
| 일일 시그널 수집량 | ≥ 10건/일 | `external_signals` 테이블 일별 COUNT |
| 수집원 가동률 | ≥ 85% | 활성 수집원 중 정상 응답 비율 |
| 데이터 신선도 | ≤ 24h | 최신 시그널의 수집 시각 |

### 18.2 예측 계층 KPI

| KPI | 목표 | 측정 방법 |
|-----|------|----------|
| 예측 출현율 | ≥ 60% | `actually_emerged = true` 비율 |
| 시기 정확도 | ≥ 0.7 | 예측 Window 대비 실제 출현일 비교 |
| 예측 생산량 | ≥ 30건/주 | `predicted_questions` 주별 COUNT |
| confidence ≥ 0.7 비율 | ≥ 70% | 고신뢰 예측 비율 |

### 18.3 품질 계층 KPI

| KPI | 목표 | 측정 방법 |
|-----|------|----------|
| 평균 QVS | ≥ 55 | 활성 질문 QVS 평균 |
| Go 비율 | ≥ 30% | Gate Go 판정 비율 |
| VPA 합격률 | ≥ 80% | VPA ≥ 75 비율 |
| Safety Gate 통과율 | ≥ 95% | Safety Gate passed 비율 |

### 18.4 비즈니스 계층 KPI

| KPI | 목표 | 측정 방법 |
|-----|------|----------|
| AEPI 향상률 | ≥ +5pt/분기 | Temporal Tracker T-3 vs T-0 |
| 선점 콘텐츠 배포 | ≥ 10건/월 | Content Factory queued 건수 |
| 포트폴리오 등급 | ≥ B | QVS Portfolio Health Grade |

---

## 19. 트러블슈팅 가이드

### 19.1 S-OGDE 파이프라인 실패

| 증상 | 원인 | 해결 |
|------|------|------|
| Phase G 0건 | AI API 키 미설정 | `GEMINI_API_KEY` 확인 |
| Phase D1 타임아웃 | Search Grounding 과부하 | `repeatEval` 줄이기 (3→1) |
| Phase DD 실패 | 임베딩 API 쿼터 초과 | Gemini API 쿼터 확인 |
| Phase E QVS=0 | KG/TCO 데이터 없음 | Phase 0 수동 실행 |

### 19.2 QVS 점수 이상

```
1. brand_ontology_nodes 데이터 확인
2. tco_concepts 업종 데이터 확인
3. AI_PROVIDER_MODE ≠ 'mock' 확인
4. N-Repeat σ 확인 (σ ≥ 10 → 재평가 필요)
```

### 19.3 콘텐츠 팩토리 실패

| 증상 | 원인 | 해결 |
|------|------|------|
| VPA < 75 | 톤 불일치 | `adjustTone()` 수동 실행 |
| Safety Gate 실패 | must_not_do 위반 | 금지 표현 제거 후 재시도 |
| Blueprint 생성 실패 | Vibe Spec 미설정 | 워크스페이스 Vibe Spec 등록 |

### 19.4 정확도 하락

```
1. getSectorAccuracyReport() 실행 → 편향(bias) 확인
2. bias > 0: 과대 예측 → confidence 임계값 상향 (0.7 → 0.8)
3. bias < 0: 과소 예측 → 시그널 수집원 추가
4. 특정 소스 정확도 < 0.3 → 해당 소스 비활성화 검토
```

### 19.5 데이터 수집 장애

| 증상 | 원인 | 해결 |
|------|------|------|
| 네이버 API 401 | 인증 만료 | `NAVER_CLIENT_ID/SECRET` 재발급 |
| RSS 0건 | 피드 URL 변경 | Admin UI에서 URL 업데이트 |
| 커뮤니티 0건 | 사이트 구조 변경 | 크롤러 셀렉터 업데이트 |
| 전체 0건 | `DEMO_MODE=true` | 환경변수 확인/제거 |

---

## 20. 아키텍처 코드 맵

### 20.1 핵심 모듈 위치

```
lib/
├── prediction/
│   ├── question-predictor.ts          # 질문 예측 엔진
│   ├── accuracy-tracker.ts            # 정확도 추적
│   ├── vibe-forecaster.ts             # Vibe 밸런스 블루프린트
│   ├── content-factory.ts             # 콘텐츠 생산 팩토리
│   ├── query-expander.ts              # 쿼리 확장
│   ├── industry-prediction-templates.ts # 업종별 예측 템플릿
│   ├── types.ts                       # EmergenceSignal, SignalCollector 인터페이스
│   └── signal-collectors/             # 8종 수집기
│       ├── community-collector.ts
│       ├── search-trend-collector.ts
│       ├── kweddinghub-collector.ts
│       ├── news-collector.ts
│       ├── regulation-collector.ts
│       ├── seasonal-collector.ts
│       ├── sbs-broadcast-collector.ts
│       └── internal-collector.ts
├── signal-collection/
│   ├── orchestrator.ts                # S-OGDE 오케스트레이터
│   ├── meta-question-engine.ts        # Phase G: 5-Lens
│   ├── exploratory-chain.ts           # Phase D1: Search Chain
│   ├── recursive-deepener.ts          # Phase D2: Multi-Persona
│   ├── semantic-dedup.ts              # Phase DD: Dedup
│   ├── signal-evaluator.ts            # Phase E: QVS 8D
│   ├── collection-storage.ts          # 하이브리드 저장소
│   ├── external-collectors.ts         # 외부 수집 엔진
│   └── volume-estimator.ts            # 검색량 추정
├── qis/
│   └── hub-client.ts                  # Hub 동기화 클라이언트
├── qis-shared-schemas.ts             # Zod 스키마 (6종)
├── benchmark/
│   ├── qvs-question-generator.ts      # NanoJob J1-J3
│   ├── qvs-portfolio-manager.ts       # 포트폴리오 관리
│   ├── rlaf-tuner.ts                  # RLAF 가중치 캘리브
│   ├── aepi-calculator.ts             # AEPI 점수 산출
│   └── temporal-tracker.ts            # 시계열 추적
├── surface/
│   ├── qis-cross-mapper.ts            # QIS 교차 매핑
│   └── probe-generator.ts            # 프로브 질의 생성
└── schema.ts                          # Zod 스키마 (CQ, QIS Scene)
```

### 20.2 API 라우트 맵

```
app/api/
├── cron/
│   └── qis-sync/route.ts             # 일일 자동 동기화
├── v1/qis/
│   ├── predictions/route.ts           # Hub 예측 조회
│   ├── feedback/route.ts              # Hub 피드백 수신
│   ├── signals/
│   │   ├── ingest/route.ts            # Hub 시그널 수신
│   │   ├── collect/route.ts           # 수동 질문 수집
│   │   ├── generate/route.ts          # S-OGDE Full Pipeline
│   │   ├── score/route.ts             # 개별 QVS 평가
│   │   └── deduplicate/route.ts       # 시맨틱 중복 제거
│   └── canonical-questions/
│       └── build-scene/route.ts       # QIS Scene 빌드
├── deep-dive/
│   ├── diagnose/route.ts              # 심층 진단
│   ├── blueprint/route.ts             # 블루프린트 생성
│   ├── discover/route.ts              # 연관 질문 발굴
│   ├── measure/route.ts               # AI 가시성 실측
│   ├── simulate/route.ts              # 개선 시뮬레이션
│   ├── approve/route.ts               # 블루프린트 승인
│   ├── sessions/route.ts              # 세션 관리
│   └── settings/route.ts              # 설정
└── pipeline/
    └── e2e/route.ts                   # E2E 파이프라인
```

### 20.3 UI 페이지 맵

```
app/[locale]/(workspace)/[workspace_slug]/
├── semantic-core/
│   ├── signals/page.tsx               # 시그널 레지스트리
│   ├── qis/page.tsx                   # QIS Scene 관리
│   ├── qis-triaxis/page.tsx           # 3축 Hub 동기화
│   ├── canonical-questions/page.tsx   # CQ 관리
│   ├── question-capital/page.tsx      # Question Capital
│   ├── orchestration/page.tsx         # 오케스트레이션
│   ├── strategy/page.tsx              # 전략
│   ├── performance/page.tsx           # 성과
│   ├── concepts/page.tsx              # TCO 개념
│   ├── claims/page.tsx                # 클레임
│   ├── kg/page.tsx                    # 지식 그래프
│   ├── attractors/page.tsx            # 어트랙터
│   ├── attractor-gap/page.tsx         # 어트랙터 갭
│   └── domain-packs/page.tsx          # 도메인 팩
├── deep-dive/page.tsx                 # Deep Dive
└── observatory/                        # 관측소
    ├── page.tsx
    ├── metrics/page.tsx
    ├── panels/page.tsx
    ├── runs/page.tsx
    ├── indices/page.tsx
    ├── judgments/page.tsx
    └── methodology/page.tsx
```

### 20.4 DB 마이그레이션 맵

```
db/migrations/
├── 0003_semantic_core.sql             # CQ, QIS Scene, TCO, KG 테이블
├── 0010_qis_hub_sync.sql             # Hub 동기화 테이블
├── 0017_signal_prediction_tables.sql  # 예측 엔진 테이블
└── 0033_qis_advanced.sql             # QVS 8D, CPS, Gate, Performance 추적
```

---

> **이 문서는 BSW-OS QPA-OS v2.0 기준으로 작성되었습니다.**  
> **프로덕션 URL:** `https://answerhub.kr`  
> **최종 업데이트:** 2026-07-03
