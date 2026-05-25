# Brand Semantic Website OS — Question Intelligence System (QIS) 기술 문서

> **문서 버전**: 1.0  
> **최종 업데이트**: 2026-05-25  
> **대상 독자**: 제품 전략가, 개발팀, 사업 파트너, 투자자

---

## 목차

1. [Brand Semantic Website OS 소개](#1-brand-semantic-website-os-소개)
2. [Question이란 무엇인가](#2-question이란-무엇인가)
3. [Canonical Question: 정규화의 개념과 필요성](#3-canonical-question-정규화의-개념과-필요성)
4. [QIS: Question Intelligence System](#4-qis-question-intelligence-system)
5. [BSW-OS에서 QIS의 필요성과 역할](#5-bsw-os에서-qis의-필요성과-역할)
6. [질문 수집 방법론과 시스템](#6-질문-수집-방법론과-시스템)
7. [질문 정제 방법론과 시스템](#7-질문-정제-방법론과-시스템)
8. [질문 예측 방법론과 시스템](#8-질문-예측-방법론과-시스템)
9. [질문 측정 방법론과 시스템](#9-질문-측정-방법론과-시스템)
10. [SBS 공동 지표와 QIS의 연결](#10-sbs-공동-지표와-qis의-연결)
11. [기술 아키텍처 참조](#11-기술-아키텍처-참조)
12. [부록: 용어 사전](#12-부록-용어-사전)

---

## 1. Brand Semantic Website OS 소개

### 1.1 BSW-OS란 무엇인가

**Brand Semantic Website OS (BSW-OS)**는 브랜드의 의미(Meaning)를 체계적으로 정의하고, 그 의미가 AI 검색 엔진의 응답에 어떻게 반영되는지를 과학적으로 **측정·예측·개선**하는 SaaS 플랫폼입니다.

기존의 웹사이트 빌더나 SEO 도구와 근본적으로 다른 점은, BSW-OS가 **"질문(Question)"**을 시스템의 중심축으로 삼는다는 것입니다.

```
기존 방식:
  브랜드 → 웹사이트 제작 → SEO 키워드 최적화 → 결과 관찰

BSW-OS 방식:
  브랜드 진실(Truth) 정의
    → 소비자 질문 수집·정규화
    → 질문별 AI 응답 관측
    → 메트릭 산출·진단
    → 콘텐츠 패치·재검증
    → 미래 질문 예측·선점
    → 폐쇄 루프 자동화
```

### 1.2 4대 운영 기둥

BSW-OS는 4개의 운영 기둥(Pillar)으로 구성됩니다:

| # | 기둥 | 영문 | 핵심 역할 |
|---|------|------|-----------|
| 1 | **브랜드 의미 운영** | Brand MeaningOps | 브랜드 진실(Truth) 정의·증명·관찰 |
| 2 | **시맨틱 웹사이트 공장** | Semantic Website Factory | 질문 기반 콘텐츠 생성·구조화 |
| 3 | **AI 응답 관측소** | AI Answer Observatory | AI 검색 응답 관측·메트릭 산출 |
| 4 | **개선 운영 체계** | Fix-It OS | 진단·패치·재검증 폐쇄 루프 |

### 1.3 기술 스택

| 계층 | 기술 | 역할 |
|------|------|------|
| 프레임워크 | Next.js 16.2.6 (App Router) | 서버 사이드 렌더링 + 서버 액션 |
| 데이터베이스 | Supabase PostgreSQL + RLS | 멀티 테넌트 격리 |
| 유효성 검증 | Zod 4 | 런타임 스키마 검증 |
| 임베딩 엔진 | 3072-dim 코사인 유사도 | 시맨틱 정합성 측정 |
| 테스트 | Vitest 4.1.7 | 377+ 유닛/통합 테스트 |
| 언어 | TypeScript 5 (strict mode) | 타입 안전성 |

### 1.4 멀티 테넌트 구조

모든 데이터는 `workspace_id`로 격리됩니다. Row-Level Security(RLS)가 데이터베이스 수준에서 테넌트 간 접근을 원천 차단합니다.

```
Workspace A (PureBarrier 스킨케어)
  ├── Domain: K-Beauty
  ├── Probe Panel: SBS-AIPR-Beauty-v1
  ├── 20개 Probe Questions
  └── 관측 데이터, 메트릭, 보고서...

Workspace B (Lumiere Hall 웨딩)    ← 완전히 격리됨
  ├── Domain: Wedding
  ├── Probe Panel: SBS-AIPR-Wedding-v1
  └── ...
```

---

## 2. Question이란 무엇인가

### 2.1 BSW-OS에서 Question의 정의

BSW-OS에서 **Question(질문)**은 단순한 텍스트 문자열이 아닙니다. **8개 속성을 갖는 다차원 구조체**로서, 시스템의 모든 의사결정의 근간이 됩니다.

```typescript
// 질문의 데이터 구조
interface ProbeQuestion {
  text: string;                       // 질문 원문
  intent: string;                     // 의도 분류 (12유형)
  keyword: string;                    // 핵심 키워드
  risk: 'high' | 'medium' | 'low';   // YMYL 위험도
  stage: string;                      // 결정 단계
  type: string;                       // 질문 유형
  weight: number;                     // 비즈니스 가중치 (0.3~2.0)
  variants: string[];                 // 검색 변형어 (3~5개)
}
```

### 2.2 Question의 12가지 의도(Intent) 유형

| # | Intent | 설명 | 예시 |
|---|--------|------|------|
| 1 | `recommendation` | 추천/비교 요청 | "민감성 피부에 좋은 보습크림 추천" |
| 2 | `informational` | 정보 탐색 | "겨울철 건조 피부 관리법" |
| 3 | `risk_boundary` | 위험·주의사항 확인 | "레티놀 처음 쓰는 사람 주의사항" |
| 4 | `comparison` | A vs B 비교 | "세라마이드 vs 히알루론산 뭐가 나아?" |
| 5 | `trust_verification` | 신뢰성 검증 | "피부과에서 추천하는 보습제 뭐야?" |
| 6 | `source_seeking` | 출처·근거 탐색 | "화장품 성분 독성 확인 방법" |
| 7 | `contract_check` | 계약·약관 확인 | "웨딩홀 계약 시 꼭 확인할 조건" |
| 8 | `price_package` | 가격·패키지 확인 | "스드메 가격 얼마나 들어?" |
| 9 | `action_seeking` | 행동 지침 요청 | "전입신고 확정일자 방법" |
| 10 | `routine_guidance` | 루틴·절차 안내 | "여드름 피부 스킨케어 순서" |
| 11 | `product_fit` | 적합성 판단 | "10대 청소년 스킨케어 추천" |
| 12 | `local_intent` | 지역 기반 탐색 | "강남 피부과 레이저 토닝 추천" |

### 2.3 Question의 3가지 존재 형태

BSW-OS에서 질문은 시스템 내에서 3가지 존재 형태(Ontological State)를 가집니다:

| 형태 | 정의 | 생성 주체 | 생명주기 |
|------|------|-----------|----------|
| **Probe Question** | 이미 존재하는 관측 대상 질문 | 표준 데이터셋 + 패널 팩토리 | `draft` → `active` → `archived` |
| **Predicted Question** | 아직 출현하지 않은 예측 질문 | QuestionPredictor 엔진 | `predicted` → `emerged` / `false_positive` |
| **Canonical Question** | 정규화·가치평가 완료된 표준 질문 | Semantic Core 모듈 | QVS 스코어 기반 자동 관리 |

```
🌊 Raw Signal (원시 신호)
    │
    ▼
🔮 Predicted Question (예측된 미래 질문)
    │  QuestionPredictor가 신호로부터 생성
    │
    ▼
📐 Canonical Question (정규화된 표준 질문)
    │  QVS 가치 평가 + 중복 제거 + 변형어 확장
    │
    ▼
🎯 Probe Question (관측 패널에 등록된 질문)
    │  Panel Factory가 패널에 등록
    │
    ▼
🔭 Observed Question (AI 응답 관측 완료)
    │  Observatory가 AI 응답 수집 + 메트릭 산출
    │
    ▼
📊 Measured Question (지표에 기여하는 질문)
       BAIR/AIPR/KAIVI 지표 산출에 사용
```

### 2.4 Question 데이터셋 현황

현재 BSW-OS는 **25개 업종 × 20문항 = 500개** 표준 질문을 보유합니다:

| # | 업종 | 문항수 | YMYL 비율 | 주요 의도 |
|---|------|--------|-----------|-----------|
| 1 | 뷰티/스킨케어 | 20 | 부분 | recommendation, risk_boundary |
| 2 | 웨딩 | 20 | 계약 | contract_check, price_package |
| 3 | 클리닉/피부과 | 20 | 의료 | risk_boundary, comparison |
| 4 | 맛집/외식 | 20 | — | local_intent, recommendation |
| 5 | 부동산 중개 | 20 | 금융 | contract_check, risk_boundary |
| 6 | 법률/변호사 | 20 | 법률 | action_seeking, informational |
| 7 | 교육/학원 | 20 | 부분 | recommendation, comparison |
| 8 | 여행/숙박 | 20 | — | recommendation, comparison |
| 9 | 반려동물/수의 | 20 | 의료 | risk_boundary, routine_guidance |
| 10 | 자동차/정비 | 20 | — | comparison, action_seeking |
| 11~25 | 금융, 보험, IT, 건설 등 15개 신규 업종 | 각 20 | 다양 | 업종별 특화 |

---

## 3. Canonical Question: 정규화의 개념과 필요성

### 3.1 정규화(Canonicalization)란 무엇인가

**Canonicalization(정규화)**이란, 동일한 소비자 의도를 표현하는 다양한 형태의 질문들을 **하나의 표준 형식(Canonical Form)**으로 통합하는 과정입니다.

```
같은 의도, 다른 표현:

  "레티놀 처음 쓰는 사람 주의사항 알려줘"
  "레티놀 초보 부작용 뭐가 있어?"
  "retinol beginner caution sensitive skin"
  "레티놀 입문자 가이드"
  "민감성 피부 레티놀 사용법 알려줘"

  → 이 5개는 모두 동일한 소비자 의도
  → 정규화하지 않으면 5개의 별도 질문으로 관리
  → 관측 리소스 5배 낭비 + 메트릭 파편화
```

### 3.2 Canonical Question의 구성 요소

Semantic Core 모듈에서 정의되는 Canonical Question은 다음 필드를 가집니다:

| 필드 | 설명 | 예시 |
|------|------|------|
| `normalized_question` | 정규화된 질문 텍스트 | "민감성 피부에 좋은 레티놀 사용법" |
| `slug` | URL-safe 식별자 | `sensitive-skin-retinol-usage` |
| `signature` | 안정적 해시 서명 | `a1b2c3d4...` (최대 64자) |
| `question_variants` | 검색 변형어 배열 | ["레티놀 초보 가이드", "retinol beginner"] |

### 3.3 정규화가 해결하는 5대 문제

| # | 문제 | 정규화 없이 | 정규화 후 |
|---|------|------------|----------|
| 1 | **질문 중복** | 500문항 중 10~15% 의미 중복 | 3072-dim 임베딩 기반 자동 탐지·통합 |
| 2 | **검색 변형 미커버** | AI 엔진별 질의 패턴 차이로 관측 누락 | 질문당 5개 변형어 자동 생성 |
| 3 | **가치 불명** | 모든 질문에 동일 리소스 투입 | QVS 기반 자원 우선순위 자동 결정 |
| 4 | **업종 간 중복** | 동일 의도 질문이 업종별로 분리 관리 | Cross-industry 유사도 탐지 |
| 5 | **시의성 관리** | "올해 트렌드" 류 질문이 영구 잔존 | TTL 메타데이터 + 자동 만료 |

### 3.4 정규화 3단계 프로세스

#### Stage 1: 형태 통합 (Morphological Unification)

`QueryExpander` 클래스가 기준 질문으로부터 5개의 검색 변형어를 생성합니다:

```
입력: "민감성 피부에 좋은 보습크림 추천해줘"

출력:
  1. 원본 → "민감성 피부에 좋은 보습크림 추천해줘"
  2. 조사 제거 → "민감성 피부 좋은 보습크림 추천"
  3. 브랜드+핵심어 → "PureBarrier 추천"
  4. 후기 의도 → "PureBarrier 솔직 후기 추천"
  5. 영문 패턴 → "Best PureBarrier comparison"
```

#### Stage 2: 의미 중복 제거 (Semantic Deduplication)

`CrossIndustryDeduplicator`가 3072차원 임베딩 벡터의 코사인 유사도를 계산하여 중복을 식별합니다:

| 유사도 범위 | 판정 | 액션 |
|---|---|---|
| 0.85 ~ 1.00 | **중복** | 통합 후 하나만 유지 |
| 0.70 ~ 0.85 | **유사** | 변형어로 편입 |
| < 0.70 | **독립** | 별도 질문으로 관리 |

#### Stage 3: 가치 정량화 (Value Quantification)

`Question Value Scorer (QVS)`가 비즈니스 가치를 정량 평가합니다:

```
QVS = Volume × Conversion × ARPU × FirstMover × (1 - Competition)

예시: 뷰티 업종 "레티놀 부작용 가이드"

  Volume      = 85    (월 검색량 정규화)
  Conversion  = 0.15  (recommendation 의도의 전환율)
  ARPU        = 45K   (스킨케어 평균 객단가)
  FirstMover  = 3.5   (AI 커버리지 낮음 → 선점 프리미엄 높음)
  Competition = 0.2   (경쟁 콘텐츠 적음)

  QVS = 85 × 0.15 × 45,000 × 3.5 × 0.8 = ₩1,606,500/월
```

---

## 4. QIS: Question Intelligence System

### 4.1 QIS의 정의

**QIS (Question Intelligence System)**은 정규화된 질문 자산(Question Asset) 위에 구축되는 **지능 레이어**입니다.

단순한 질문 저장소가 아니라, 질문의 **가치 평가 → 미래 예측 → 콘텐츠 설계 → 관측 검증 → 정확도 학습**을 자동화하는 **폐쇄 루프 인텔리전스 시스템**입니다.

```
┌─────────────────────────────────────────────────────────┐
│          QIS — Question Intelligence System             │
│                                                         │
│   ┌──────────┐  ┌─────────────┐  ┌──────────┐          │
│   │ Engine 1 │  │  Engine 2   │  │ Engine 3 │          │
│   │ Question │→ │Vibe-Balanced│→ │Pre-empt  │          │
│   │Emergence │  │   Super-    │  │ Content  │          │
│   │Predictor │  │ Forecaster  │  │ Factory  │          │
│   └────┬─────┘  └──────┬──────┘  └────┬─────┘          │
│        │               │              │                 │
│   ┌────▼───┐     ┌─────▼────┐    ┌────▼──────┐         │
│   │Engine 4│     │ Engine 5 │    │ Engine 6  │         │
│   │Question│     │Prediction│    │  Funnel   │         │
│   │ Value  │     │ Accuracy │    │  Tracker  │         │
│   │ Scorer │     │ Tracker  │    │           │         │
│   └────────┘     └──────────┘    └───────────┘         │
│                                                         │
│   ← 폐쇄 루프: 측정 → 보정 → 재예측 →                    │
└─────────────────────────────────────────────────────────┘
```

### 4.2 QIS의 5대 구성 엔진

#### Engine 1: Question Emergence Predictor (QEP)

> "아직 대중이 묻지 않았지만 곧 물을 질문을 찾는 엔진"

- **입력**: 7종 신호 수집기에서 포착한 EmergenceSignal
- **처리**: 25개 업종 전용 예측 템플릿 기반 질문 생성 + 1→3 Fan-out
- **출력**: PredictedQuestion 배열 (신뢰도, 선점 기간, AI 커버리지 포함)

#### Engine 2: Vibe-Balanced Super-Forecaster (VBSF)

> "예측된 질문에 대한 콘텐츠가 브랜드 바이브를 유지하면서 AI 인용에 최적화되도록 설계하는 엔진"

- **입력**: PredictedQuestion + 브랜드 Vibe Spec + Brand Truth
- **처리**: 톤 가이드라인 생성 + EEAT 수준 결정 + Schema.org 유형 추천
- **출력**: ContentBlueprint (콘텐츠 설계도)

#### Engine 3: Pre-emptive Content Factory (PCF)

> "설계도를 바탕으로 실제 콘텐츠를 생성하고 4단계 검증 게이트를 통과시키는 엔진"

- **4단계 파이프라인**: 초안 생성 → VPA 검증 → Safety Gate → 테넌트 큐 배포
- **5-Tier Expected Layer**: Must Include / Strongly Recommended / Should Include / Caution / Must Not Do

#### Engine 4: Question Value Scorer (QVS)

> "모든 질문의 비즈니스 가치를 원화 기준으로 정량화하는 엔진"

- **공식**: `QVS = Vol × Conv × ARPU × FM × (1 - Comp)`
- **부가 기능**: 선점 기회 발굴 (`getPreemptionOpportunities`)

#### Engine 5: Prediction Accuracy Tracker

> "예측이 맞았는지 자가 검증하고, 신호 가중치를 자동 보정하는 학습 루프"

- **슈퍼포캐스팅**: 예측 정확도 = `1.0 - |실제출현 - 예측신뢰도|`
- **업종별 편향 감지**: Bias > 0 = 과잉 예측, Bias < 0 = 과소 예측

### 4.3 QIS Scene의 역할

QIS Scene은 Canonical Question에서 파생된 **실행 가능한 검색 장면(Actionable Search Scene)**입니다.

```json
{
  "scene_name": "레티놀 루틴 추천 장면",
  "query_template": "민감성 피부 레티놀 루틴 추천해줘",
  "intent_model": "informational_routine",
  "scenario_context": "사용자가 민감성 피부에 적합한 레티놀 사용 순서를 찾는 상황",
  "risk_level": "high"
}
```

QIS Scene이 중요한 이유는 **동일한 Canonical Question도 소비자의 맥락(Context)에 따라 다른 AI 응답을 유발**하기 때문입니다. QIS Scene은 이 맥락을 구조화합니다.

---

## 5. BSW-OS에서 QIS의 필요성과 역할

### 5.1 왜 QIS가 필요한가: AEO 시간 프레임워크

AEO(Answer Engine Optimization)의 승패는 "AI가 지금 뭐라 답하는가"가 아니라, **"다음 달 AI에게 쏟아질 고부가치 질문을 오늘 선점하는 것"**에 달려 있습니다.

```
              콘텐츠 가치
                 │
                 │         ┌──── 질문 폭발 시점
                 │         │
                 │    ╭────╯
                 │   ╱
            ★  │  ╱  ← 선점 구간 (여기서 콘텐츠를 제공해야 함)
       선점자 │ ╱     AI가 학습하고 인용할 "유일한 출처"가 됨
       독점  │╱
             ├─────────────────────────────────────── 시간
             │         ▲             ▲
             │    질문 태동기     질문 폭발기
```

| 단계 | 시기 | BSW-OS 기능 | QIS 역할 |
|------|------|-------------|----------|
| ① 잠재기 | 질문 발생 전 | Signal Collector | **예측** — 신호 분석 |
| ② 태동기 | 소수 얼리어답터 질문 | QuestionPredictor | **선점** — 콘텐츠 선제 생산 |
| ③ 성장기 | 질문 빈도 급증 | Content Factory | **품질 강화** — VPA 검증 |
| ④ 포화기 | 다수 출처 경쟁 | Observatory | **차별화** — 관측·진단 |
| ⑤ 안정기 | 질문 표준화 | Fix-It OS | **방어** — 패치·재검증 |

### 5.2 QIS의 6대 전략적 역할

| # | 역할 | 설명 | 핵심 모듈 |
|---|------|------|-----------|
| 1 | **질문 자산화** | 500개 표준 질문 + Expected Layer = 산업 표준 | `questions-data.ts` |
| 2 | **가치 우선순위** | 모든 질문에 원화 기준 비즈니스 가치 부여 | `qvs.ts` |
| 3 | **미래 예측** | 7종 신호 → 25업종 전용 예측 → 선점 기회 도출 | `question-predictor.ts` |
| 4 | **품질 보증** | 5-Tier Safety Gate + VPA 정합성 검증 | `content-factory.ts` |
| 5 | **측정 독점** | Probe Panel이 SBS 공동 지표의 유일한 측정 엔진 | `probe-panel-factory.ts` |
| 6 | **자가 학습** | 예측 정확도 자동 검증 + 신호 가중치 재보정 | `accuracy-tracker.ts` |

### 5.3 BSW-OS 4대 기둥과 QIS의 연결

```
┌──────────────────────────────────────────────────────────┐
│                     BSW-OS 4대 기둥                       │
│                                                           │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │Brand        │  │Semantic      │  │AI Answer       │  │
│  │MeaningOps   │  │Website       │  │Observatory     │  │
│  │             │  │Factory       │  │                │  │
│  │ Truth 정의  │  │콘텐츠 생산   │  │AI 응답 관측    │  │
│  └──────┬──────┘  └──────┬───────┘  └────────┬───────┘  │
│         │                │                    │          │
│         └────────────────┼────────────────────┘          │
│                          │                               │
│                    ┌─────▼─────┐                         │
│                    │   Q I S   │ ← 4대 기둥을 관통하는    │
│                    │ Question  │   중심축                 │
│                    │Intelligence│                         │
│                    │  System   │                         │
│                    └─────┬─────┘                         │
│                          │                               │
│                    ┌─────▼─────┐                         │
│                    │ Fix-It OS │                         │
│                    │ 개선 루프  │                         │
│                    └───────────┘                         │
└──────────────────────────────────────────────────────────┘
```

- **Brand MeaningOps → QIS**: Brand Truth의 클레임이 Expected Layer의 `must_include`에 매핑됩니다.
- **QIS → Semantic Website Factory**: 예측된 질문이 ContentBlueprint → Representation Object → Semantic Page로 전환됩니다.
- **QIS → Observatory**: Probe Panel에 등록된 질문이 AI 응답 관측의 입력이 됩니다.
- **Observatory → QIS**: 관측 결과가 가중치 재보정과 예측 정확도 피드백으로 QIS에 복귀합니다.

---

## 6. 질문 수집 방법론과 시스템

### 6.1 수집의 정의

질문 수집이란 **"아직 체계화되지 않은 원시 신호(Raw Signal)로부터 잠재적 소비자 질문의 맹아를 포착하는 행위"**입니다.

### 6.2 7종 신호 수집기 (Signal Collectors)

BSW-OS는 7개의 전용 신호 수집기를 구현하고 있습니다:

| # | 수집기 | 신호 유형 | 수집 예시 |
|---|--------|-----------|-----------|
| 1 | **뉴스 수집기** | 언론 보도 키워드 급등 | "식약처 레티놀 신규정 발표" |
| 2 | **규제 수집기** | 법령·고시 변경 | "의료법 개정안 국회 통과" |
| 3 | **검색트렌드 수집기** | 검색량 급상승 패턴 | "여름 민감성 피부" 200% 증가 |
| 4 | **커뮤니티 수집기** | 포럼·SNS 버즈 | 네이버 카페 "레티놀 부작용" 급증 |
| 5 | **계절/이벤트 수집기** | 시즌·이벤트 주기 | 가을 웨딩 시즌 → 계약 질문 급증 |
| 6 | **내부 데이터 수집기** | 테넌트 데이터 패턴 | 신규 온보딩 시 수집 질문 |
| 7 | **SBS 방송 수집기** | 방송 편성·보도 예정 | SBS 뉴스 "AI 마케팅 특집" 예정 |

### 6.3 수집 신호의 데이터 구조

```typescript
interface EmergenceSignal {
  id: string;
  workspace_id: string;
  source_type: 'news' | 'regulation' | 'search_trend' |
               'community' | 'seasonal' | 'internal' | 'sbs_broadcast';
  industry: string;          // 관련 업종
  raw_text: string;          // 원시 신호 텍스트
  source_url?: string;       // 출처 URL
  predicted_impact: 'critical' | 'high' | 'medium' | 'low';
  detected_at: Date;
  expires_at?: Date;         // 신호 유효 기한
  status: 'new' | 'analyzed' | 'actionable' | 'expired' | 'false_positive';
}
```

### 6.4 신호 대 잡음 필터링

수집된 신호 중 실제 유효한 것은 30~40%에 불과합니다. BSW-OS는 `computeConfidence()` 메서드를 통해 자동 필터링합니다:

| Impact 레벨 | 신뢰도(Confidence) | 선점 시간(Window) |
|---|---|---|
| `critical` | 0.95 | 14일 |
| `high` | 0.85 | 30일 |
| `medium` | 0.70 | 60일 |
| `low` | 0.50 | 90일 |

---

## 7. 질문 정제 방법론과 시스템

### 7.1 정제(Refinement)의 정의

질문 정제란 수집된 원시 질문을 **관측·측정에 적합한 표준 형식으로 변환**하는 과정입니다. 정규화(Canonicalization), 중복 제거(Deduplication), 가치 평가(Valuation), 라이프사이클 관리(Lifecycle Management)를 포함합니다.

### 7.2 Expected Layer: 5단계 판정 기준

모든 Probe Question에는 **5-Tier Expected Layer**가 부착됩니다. 이것은 "이 질문에 대한 AI의 이상적 응답이 무엇인가"를 정의하는 핵심 기준입니다:

| Tier | 이름 | 의미 | 예시 |
|------|------|------|------|
| **Tier 1** | Must Include | 반드시 포함해야 할 사실 | "식약처 승인 저자극 테스트 완료 명시" |
| **Tier 2** | Strongly Recommended | E-E-A-T 신뢰도 강화 자료 | "전문 연구소 안전성 증명" |
| **Tier 3** | Should Include | 포함 권장 보조 정보 | "천연 보습 유기농 포뮬러 함유 정보" |
| **Tier 4** | Caution | 사용 시 주의해야 할 표현 | "근거 없는 효능 보장 단어 배제" |
| **Tier 5** | Must Not Do | 절대 포함 금지 사항 | "고농도 레티놀 매일 도포 권장" |

### 7.3 질문 라이프사이클 상태 머신

`QuestionLifecycleManager` 클래스가 질문의 전체 생명주기를 관리합니다:

```
               ┌───── archived (터미널)
               │          ▲
               │          │
  [생성] → draft → review → active → deprecated
                    │  ▲        │          │
                    │  │        │          │
                    └──┘        └──────────┘
                  (반려)         (재활성)
```

**유효 전환 규칙**:

| From | To (허용) |
|------|-----------|
| `draft` | `review`, `archived` |
| `review` | `active`, `draft`, `archived` |
| `active` | `deprecated`, `archived` |
| `deprecated` | `active`, `archived` |
| `archived` | — (터미널 상태) |

### 7.4 시의성 자동 만료 (TTL)

시의성이 있는 질문(예: "올해 트렌드 스킨케어 성분")에는 TTL(Time-To-Live) 메타데이터가 부착됩니다:

```
조건: lifecycle_status = "active"
  AND is_time_sensitive = true
  AND ttl_expires_at < now()

결과: lifecycle_status → "deprecated" (자동 전환)
```

### 7.5 가중치 동적 재보정

`WeightCalibrator` 클래스가 관측 결과를 기반으로 질문의 가중치를 자동으로 조정합니다:

```
calibrated_weight = base_weight × observation_boost × recency_decay

  observation_boost:
    brand_mention_rate > 0.5 → 1.15 (관련성 높은 질문 부스트)
    brand_mention_rate < 0.2 → 0.85 (관련성 낮은 질문 감산)

  recency_decay:
    30일 이상 관측 미실행 → 0.90
    90일 이상 관측 미실행 → 0.75

  결과 범위: [0.3, 2.0] (clamped)
```

---

## 8. 질문 예측 방법론과 시스템

### 8.1 예측 엔진 아키텍처

QuestionPredictor는 **업종별 전용 템플릿 + 1:3 Fan-out + YMYL 규제 자동 매핑**의 3단계 구조로 작동합니다.

### 8.2 25개 업종 전용 예측 템플릿

각 업종은 도메인 전문지식이 내장된 전용 예측 템플릿을 보유합니다:

```typescript
// 예시: 뷰티 업종 템플릿
const beautyTemplate = {
  industry: "beauty",
  predict(signal, confidence, windowDays) {
    return [{
      question_text: "민감성 피부를 위한 저자극 레티놀 사용법 및 부작용 대처법",
      predicted_intent: "informational_safety",
      predicted_volume: "high",
      current_ai_coverage: "sparse",
      auto_must_include: [
        "식약처 승인 저자극 테스트 완료 명시",
        "초기 적응기 주 2회 이내 사용 주기 권장",
        "장벽 보호 세라마이드 성분 크림 병행 도포 안내"
      ],
      auto_must_not_do: [
        "고농도 레티놀 1.0% 이상 매일 도포 권장",
        "필링제(AHA/BHA)와 레티놀 동시 사용 추천"
      ],
    }];
  },
};
```

### 8.3 Fan-out 메커니즘 (1 → 3 파생)

하나의 기본 예측에서 YMYL 안전 질문과 비교 질문이 자동 파생됩니다:

```
EmergenceSignal (식약처 레티놀 규정 강화)
    │
    ├─ 🔵 Base Prediction
    │   "민감성 피부를 위한 저자극 레티놀 사용법"
    │   intent: informational_safety
    │   confidence: 0.85
    │
    ├─ 🟡 YMYL Safety Derivative
    │   "~ 관련 YMYL 안전 규제 준수 및 소비자 보호 기준 가이드"
    │   intent: legal_compliance
    │   confidence: 0.85 × 0.9 = 0.765
    │
    └─ 🟢 Comparison Derivative
        "~ 주요 브랜드별 장단점 및 비용 혜택 비교 분석"
        intent: value_comparison
        confidence: 0.85 × 0.85 = 0.7225
```

### 8.4 YMYL 규제 DB 자동 연동

예측된 질문은 `ymyl_regulatory_references` 테이블의 규제 참조와 자동 조인됩니다:

| 업종 | 매핑 규제 기관 | 자동 주입 가이드라인 |
|------|---------------|---------------------|
| beauty, clinic, healthcare | 식약처, 보건복지부 | 안전 기준 고지 의무 |
| finance, insurance | 금융위원회 | 금융소비자 보호 고지 |
| construction, real_estate, legal | 공정거래위원회 | 표준약관 준수 명기 |

### 8.5 AI 커버리지 2단계 판정

`checkAICoverage()` 메서드는 2단계로 현재 AI의 질문 커버리지를 판정합니다:

| 단계 | 방법 | 데이터 소스 |
|------|------|-------------|
| 1단계 | DB 관측 기반 | `probe_runs` 테이블의 기존 크롤링 결과 |
| 2단계 | 키워드 휴리스틱 | YMYL 키워드, 비교 키워드, 정보 키워드 패턴 매칭 |

판정 결과:

| 결과 | 의미 | 선점 가치 |
|------|------|-----------|
| `none` | AI가 해당 질문을 전혀 다루지 않음 | ⭐⭐⭐⭐⭐ |
| `sparse` | 부분적·불완전한 커버리지 | ⭐⭐⭐⭐ |
| `moderate` | 중간 수준 커버리지 | ⭐⭐ |
| `saturated` | 충분한 커버리지 존재 | ⭐ |

### 8.6 예측 정확도 자가 학습 루프

```
예측 시점 (T=0)                     검증 시점 (T+14일)
  │                                    │
  │  신뢰도: 0.85                      │  실제 출현: ✅
  │  선점 기간: 14일                   │  출현 시점: T+11일
  │                                    │
  └──────────────────┬─────────────────┘
                     │
              정확도 = 1.0 - |1.0 - 0.85| = 0.85
                     │
              ┌──────▼──────┐
              │ 가중치 재보정 │
              │ 규제 신호    │
              │ weight +0.05│
              └─────────────┘
```

**업종별 편향 리포트**:

```
beauty:  { 평균 정확도: 0.82, 편향: +0.03, 예측 수: 45 }
clinic:  { 평균 정확도: 0.78, 편향: -0.05, 예측 수: 32 }
wedding: { 평균 정확도: 0.85, 편향: +0.01, 예측 수: 28 }

  편향 > 0: 과잉 예측 (실제보다 더 많이 출현할 것으로 예측)
  편향 < 0: 과소 예측 (실제 출현을 놓침)
```

---

## 9. 질문 측정 방법론과 시스템

### 9.1 측정 아키텍처: Probe Panel → Observatory → SBS Index

```
Probe Panel (관측 패널)
    │  25업종 × 20문항 = 500개 질문
    │
    ▼
AI Observation Run (관측 실행)
    │  ChatGPT, Google AI 등에 질문 전송
    │
    ▼
Probe Run (개별 실행)
    │  원시 응답(raw_response_text) 저장
    │
    ▼
Response Judgment (응답 판정)
    │  Expected Layer 기준 판정
    │
    ▼
Metric Snapshot (메트릭 스냅샷)
    │  AAS, OCR, BSF, ARS 등 산출
    │
    ▼
SBS Index (SBS 공동 지표)
       BAIR, AIPR, KAIVI 산출
```

### 9.2 핵심 메트릭 체계

#### 기본 관측 메트릭

| 메트릭 | 전체 이름 | 설명 | 산출 방법 |
|--------|-----------|------|-----------|
| **AAS** | AI Answer Share | AI 응답에서 브랜드 언급 비율 | 브랜드 키워드 매칭 |
| **OCR** | Official Citation Rate | 공식 출처 인용 비율 | URL/출처 참조 감지 |
| **BSF** | Brand Semantic Fidelity | 브랜드 의미 충실도 | Expected Layer 준수율 |
| **ARS** | AEO Readiness Score | AEO 준비도 종합 점수 | 가중 합산 |

#### SBS 공동 지표

| 지표 | 전체 이름 | 산출 공식 | 용도 |
|------|-----------|-----------|------|
| **BAIR** | Brand AI Recognition Index | `0.4×AAS + 0.3×OCR + 0.3×BSF` | 브랜드별 AI 인지도 |
| **AIPR** | AI Power Ranking | `rank(BAIR) per industry` | 업종 내 순위 |
| **AITI** | AI Trust Index | `1 - violation_rate` | AI 응답 신뢰도 |
| **KAIVI** | Korea AI Visibility Index | `Σ(ARS_i × GDP_w_i) / N` | 국가 수준 AI 가시성 |

### 9.3 Probe Panel Factory

`createIndustryStandardPanel()` 서버 액션이 업종별 표준 패널을 자동 배포합니다:

```
입력: workspaceId, industry, brandKeyword, competitorKeywords
    │
    ▼
1. 업종 데이터셋 조회 (questions-data.ts)
2. 패널 슬러그/이름 생성 ([BrandKeyword] SBS-AIPR-Industry-v1)
3. 멱등성 체크 (기존 패널 존재 시 스킵)
4. 20개 질문 + Expected Layer 시딩
5. TTL 자동 감지 (시의성 질문에 ttl_expires_at 설정)
    │
    ▼
출력: { panelId, questionCount: 20 }
```

### 9.4 패널 버전 관리

```
v1.0 (초기 배포) → v1.1 (질문 추가/수정) → v2.0 (대규모 개편)

  diffPanels(v1, v2): 두 버전 간 차이 비교
  rollbackPanel(panelId, targetVersion): 이전 버전으로 롤백
```

### 9.5 퍼널 전환율 추적

`FunnelTracker` 클래스가 질문의 6단계 파이프라인 전환율을 추적합니다:

```
  intake ──→ analyzed ──→ observed ──→ predicted ──→ content_created ──→ measured

  각 전환 지점에서:
    - question_funnel_events 테이블에 이벤트 기록
    - 전환율(%) 산출
    - 병목(bottleneck) 자동 식별

  예시:
    intake           200 (100%)
    analyzed         160 (80%)
    observed         120 (60%)    ← 병목: observed→predicted (33.3%)
    predicted         80 (40%)
    content_created   40 (20%)
    measured          20 (10%)
```

### 9.6 시맨틱 커버리지 스코어 (SCS)

`CoverageAnalyzer` 클래스가 "질문 우주" 대비 현재 패널의 커버율을 산출합니다:

```
SCS = (Σᵢ max_j(CosineSim(ActiveQ_i, MasterQ_j)) / N) × 100

  ActiveQ: 현재 패널에 등록된 활성 질문
  MasterQ: 업종별 "질문 우주" (이상적 전체 질문 집합)

  SCS = 75% → 질문 우주의 75%를 현재 패널이 커버
```

---

## 10. SBS 공동 지표와 QIS의 연결

### 10.1 측정 독점 구조

```
SBS AI 지표 = Probe Panel + AI 관측 엔진 + 판정 알고리즘 + Expected Layer
──────────────────────────────────────────────────────────────────────────
→ Probe Panel을 설계·운영하는 AI홈피허브만 지표를 산출할 수 있음
→ 기업은 이 지표 없이 AI 마케팅 성과를 증명할 수 없음
→ Expected Layer가 "무엇이 좋은 AI 응답인가"의 기준을 정의
```

### 10.2 모든 SBS 지표가 소비하는 Probe 데이터

| SBS 지표 | 필요한 Probe 데이터 | QIS 연결점 |
|----------|-------------------|------------|
| **BAIR** | AAS + OCR + BSF per brand | Probe Panel의 질문별 판정 결과 |
| **AIPR** | 업종 내 전체 브랜드의 BAIR | 업종별 표준 패널 데이터 |
| **AITI** | must_not_do 위반률 + EEAT 충족률 | Expected Layer의 5단계 판정 |
| **KAIVI** | 전 업종 ARS의 GDP 가중평균 | 25개 업종 전체의 관측 데이터 |

### 10.3 SBS Index Runner의 동적 업종 탐색

`SbsIndexRunner`는 DB에서 활성 패널을 동적으로 탐색하여 전 업종 지표를 산출합니다:

```
1. probe_panels 테이블에서 업종 목록 수집
2. 업종별 브랜드 키워드 추출 (패널명에서 [BrandKeyword] 파싱)
3. 업종별 AIPR 산출 (브랜드 + 경쟁사 3개)
4. BAIR, AIPR, AITI, KAIVI 종합 리포트 생성
```

### 10.4 플라이휠 구조

```
① SBS가 "AI 파워랭킹" 보도
    ↓
② 기업 CMO가 "우리 브랜드 점수가 몇 점이지?" 인지
    ↓
③ BAIR 진단 신청 → AI홈피허브 리드 획득
    ↓
④ 진단 결과: "AI 가시성 낮음" → AI홈피 구축
    ↓
⑤ 다음 분기 측정 → 점수 상승 → 성공 사례
    ↓
⑥ SBS 보도: "이 브랜드, 20위에서 3위로 급등"
    ↓
⑦ 더 많은 기업이 진단 신청 → ①로 복귀

🔄 자기 강화 플라이휠 (Self-Reinforcing Flywheel)
```

---

## 11. 기술 아키텍처 참조

### 11.1 핵심 소스 파일 맵

| 모듈 | 파일 경로 | 핵심 역할 |
|------|-----------|-----------|
| 질문 데이터셋 | `db/seed/industry-panels/questions-data.ts` | 25업종 × 20Q 표준 데이터 |
| 패널 팩토리 | `app/actions/probe-panel-factory.ts` | 패널 배포 + 버전 관리 |
| 질문 예측기 | `lib/prediction/question-predictor.ts` | 예측 + Fan-out + YMYL 매핑 |
| 업종 템플릿 | `lib/prediction/industry-prediction-templates.ts` | 25업종 전용 예측 로직 |
| 가치 평가 | `app/actions/qvs.ts` | QVS 비즈니스 가치 정량화 |
| 변형어 확장 | `lib/prediction/query-expander.ts` | 5개 검색 변형어 생성 |
| 블루프린트 | `lib/prediction/vibe-forecaster.ts` | 바이브 밸런스드 콘텐츠 설계 |
| 콘텐츠 팩토리 | `lib/prediction/content-factory.ts` | Safety Gate + VPA 검증 |
| 정확도 추적 | `lib/prediction/accuracy-tracker.ts` | 슈퍼포캐스팅 자가학습 |
| 라이프사이클 | `lib/governance/question-lifecycle-manager.ts` | 상태 머신 + TTL 만료 |
| 가중치 보정 | `lib/governance/weight-calibrator.ts` | 관측 기반 자동 재보정 |
| 퍼널 추적 | `lib/analytics/funnel-tracker.ts` | 6단계 전환율 추적 |
| 중복 탐지 | `lib/analytics/cross-industry-deduplicator.ts` | 3072-dim 임베딩 중복 탐지 |
| 커버리지 | `lib/analytics/coverage-score.ts` | 시맨틱 커버리지 스코어 |
| 임베딩 엔진 | `lib/embeddings/cosine-engine.ts` | 3072-dim VPA 산출 |
| SBS 지표 | `lib/sbs-index/index-runner.ts` | BAIR/AIPR/KAIVI 종합 산출 |
| 신호 수집기 | `lib/prediction/signal-collectors/` (7파일) | 7종 신호 수집기 |

### 11.2 데이터베이스 테이블 구조

| 테이블 | 역할 | 마이그레이션 |
|--------|------|-------------|
| `probe_panels` | 관측 패널 | `0014_probe_panel_extension.sql` |
| `probe_questions` | 관측 질문 + Expected Layer | `0014` |
| `emergence_signals` | 수집된 원시 신호 | `0017_prediction_engine.sql` |
| `predicted_questions` | 예측된 미래 질문 | `0017` |
| `question_value_scores` | QVS 가치 점수 | `0016_question_value_scores.sql` |
| `content_blueprints` | 콘텐츠 블루프린트 | `0018_content_blueprints.sql` |
| `question_funnel_events` | 퍼널 전환 이벤트 | `0019_p0_enhancements.sql` |
| `ymyl_regulatory_references` | YMYL 규제 참조 DB | `0022_p2_regulatory_data_and_audit.sql` |
| `audit_events` | 감사 로그 (Delta 포함) | `0022` |

### 11.3 폐쇄 루프 데이터 흐름

```
 신호 수집 (7종 Collector)
     │
     ▼
 질문 예측 (QuestionPredictor + 25 Templates + Fan-out)
     │
     ▼
 가치 평가 (QVS = Vol × Conv × ARPU × FM × (1-Comp))
     │
     ▼
 블루프린트 설계 (VBSF: Vibe Spec + Brand Truth + 5-Tier Layer)
     │
     ▼
 콘텐츠 생성·검증 (PCF: Draft → VPA → Safety Gate → Queue)
     │
     ▼
 패널 등록 (Panel Factory: PredictedQ → ProbeQ 승격)
     │
     ▼
 AI 관측 (Observatory: 크롤링 → 원시 응답 저장 → 판정)
     │
     ▼
 메트릭 산출 (AAS, OCR, BSF → BAIR → AIPR → KAIVI)
     │
     ▼
 정확도 피드백 (AccuracyTracker: 예측 검증 → 가중치 재보정)
     │
     ▼
 가중치 재보정 (WeightCalibrator: 관측 결과 기반 질문 가중치 조정)
     │
     └──→ 다음 주기 신호 수집으로 복귀 (폐쇄 루프)
```

---

## 12. 부록: 용어 사전

| 용어 | 영문 | 정의 |
|------|------|------|
| **AEO** | Answer Engine Optimization | AI 답변 엔진 최적화 |
| **BAIR** | Brand AI Recognition Index | 브랜드 AI 인지도 지수 |
| **AIPR** | AI Power Ranking | 업종 내 AI 파워랭킹 |
| **AITI** | AI Trust Index | AI 응답 신뢰도 지수 |
| **KAIVI** | Korea AI Visibility Index | 국가 AI 가시성 지수 |
| **QVS** | Question Value Score | 질문 비즈니스 가치 점수 |
| **VPA** | Vibe Proximity Alignment | 바이브 정합성 점수 |
| **QIS** | Question Intelligence System | 질문 지능 시스템 |
| **QEP** | Question Emergence Predictor | 질문 출현 예측기 |
| **VBSF** | Vibe-Balanced Super-Forecaster | 바이브 밸런스드 슈퍼예측기 |
| **PCF** | Pre-emptive Content Factory | 선제 콘텐츠 팩토리 |
| **Expected Layer** | — | AI 응답의 이상적 기준 정의 (5단계) |
| **Fan-out** | — | 1개 예측에서 N개 파생 질문 생성 |
| **Canonical Question** | 정규 질문 | 동일 의도 질문의 표준 대표형 |
| **Probe Panel** | 관측 패널 | 관측 질문의 버전 관리 세트 |
| **Emergence Signal** | 출현 신호 | 질문 맹아를 나타내는 원시 신호 |
| **YMYL** | Your Money or Your Life | 건강·금융 등 고위험 콘텐츠 분류 |
| **RLS** | Row-Level Security | 데이터베이스 행 단위 보안 정책 |
| **TTL** | Time-To-Live | 시의성 질문의 유효 기한 |
| **SCS** | Semantic Coverage Score | 시맨틱 커버리지 스코어 |

---

> **관련 문서**:
> - 시스템 아키텍처: [`user_guide_architecture.md`](./user_guide_architecture.md)
> - 주요 개념과 용어: [`user_guide_concepts.md`](./user_guide_concepts.md)
> - 기능별 활용법: [`user_guide_usage.md`](./user_guide_usage.md)
> - AEO 예측 엔진 상세: [`aeo_prediction_engine.md`](./aeo_prediction_engine.md)
> - QIS Probe 질문세트 가이드: [`QIS_PROBE_QUESTION_SET_GUIDE.md`](./QIS_PROBE_QUESTION_SET_GUIDE.md)
