# QIS Probe 질문세트 — 정의, 활용, 도출 가이드

> **문서 유형**: 시스템 설계 레퍼런스 + 운영 가이드  
> **대상 독자**: Brand Strategist, Semantic Architect, Observatory Operator, 허브 관리자  
> **제품**: Brand Semantic Website OS (BSW-OS)  
> **버전**: v1.0 (2026-05-24)  
> **선행 문서**: [LLM_REFERENCE_B_MRI_D_MRI_PROBE_OBSERVATORY.md](./LLM_REFERENCE_B_MRI_D_MRI_PROBE_OBSERVATORY.md)

---

## 목차

1. [정의: QIS Probe 질문세트란?](#1-정의-qis-probe-질문세트란)
2. [왜 중요한가? — AEO/GEO 시대의 측정 패러다임](#2-왜-중요한가--aeogeo-시대의-측정-패러다임)
3. [시스템 아키텍처](#3-시스템-아키텍처)
4. [질문세트 도출 방법론 (6단계)](#4-질문세트-도출-방법론-6단계)
5. [질문 유형 분류 체계](#5-질문-유형-분류-체계)
6. [Expected Layer 설계 가이드](#6-expected-layer-설계-가이드)
7. [업종별 표준 질문세트](#7-업종별-표준-질문세트)
8. [패널 버전 관리 및 운영 규칙](#8-패널-버전-관리-및-운영-규칙)
9. [측정 지표와의 연결](#9-측정-지표와의-연결)
10. [활용 시나리오](#10-활용-시나리오)
11. [부록: 데이터 모델 레퍼런스](#11-부록-데이터-모델-레퍼런스)

---

## 1. 정의: QIS Probe 질문세트란?

### 1.1 한 문장 정의

> **QIS Probe 질문세트**란, 특정 업종·브랜드의 AEO/GEO 퍼포먼스를 정량 측정하기 위해 설계된 **표준화된 관측 질문 패널**로서, AI 검색엔진(ChatGPT Search, Google AI Mode 등)에 주기적으로 전송하여 응답 내 브랜드 인용·정합성·개념 전이율을 평가하는 데 사용됩니다.

### 1.2 구성 요소

```
QIS Probe 질문세트
━━━━━━━━━━━━━━━━━

┌─────────────────────────────────────────────────────┐
│  Probe Panel (패널)                                  │
│  └─ 업종·브랜드별 관측 질문의 버전 관리 단위          │
│                                                      │
│  ├── Probe Question 1 (개별 질문)                    │
│  │   ├── question_text:   질문 원문                  │
│  │   ├── intent_context:  질문 의도 유형              │
│  │   ├── target_keyword:  측정 대상 브랜드 키워드     │
│  │   ├── query_variants:  표현 변형 목록              │
│  │   └── Expected Layer:  기대 응답 계층 제약         │
│  │       ├── must_include:    반드시 포함             │
│  │       ├── should_include:  포함 권장               │
│  │       └── must_not_do:     절대 금지               │
│  │                                                    │
│  ├── Probe Question 2                                │
│  ├── ...                                             │
│  └── Probe Question N                                │
│                                                      │
│  메타데이터:                                          │
│  ├── version:     패널 버전 번호                      │
│  ├── is_locked:   잠금 여부 (잠긴 패널만 측정 가능)    │
│  └── panel_type:  standard / brand_specific /         │
│                   competitor_benchmark / retest        │
└─────────────────────────────────────────────────────┘
```

### 1.3 핵심 원칙

이 시스템은 다음 12가지 원칙을 절대적으로 준수합니다:

| # | 원칙 | 설명 |
|---|------|------|
| 1 | **관측 프록시** | AI 관측은 근사 측정이지 절대적 진실이 아님 |
| 2 | **원시 저장** | 모든 Probe 응답 원문(raw response)을 보존 |
| 3 | **패널 버전 관리** | Probe Panel은 반드시 버전 잠금(freeze) 후 측정 |
| 4 | **출처 연결** | 메트릭은 반드시 소스 Observation Run에 연결 |
| 5 | **동일 버전 비교** | 전후 비교 시 반드시 동일 패널 버전 사용 |
| 6 | **방법론 공개** | 리포트/메트릭에 측정 방법론 공개 필수 |
| 7 | **프록시 면책** | AI 기반 관측 메트릭에 프록시 면책 문구 필수 |
| 8 | **B-MRI ≠ D-MRI** | 관측 성과(B-MRI)와 내부 준비도(D-MRI) 분리 |
| 9 | **가설로서의 패치** | 모든 Fix-It 패치는 가설임 |
| 10 | **리테스트 없이 성공 없음** | 패치 성공은 리테스트로만 확인 |
| 11 | **반복 관측** | AI 응답의 변동성 → 반복 관측(repeat) 필수 |
| 12 | **다변형 질의** | 의미 동등 질문 변형(variant)으로 편향 감소 |

---

## 2. 왜 중요한가? — AEO/GEO 시대의 측정 패러다임

### 2.1 패러다임 전환

```
SEO 시대                          AEO/GEO 시대
━━━━━━━━━                         ━━━━━━━━━━━━━

측정 대상:                         측정 대상:
  검색 순위 (1-10위)                 AI 응답 내 인용 여부
  클릭률 (CTR)                       브랜드 중심성(Centeredness)
  키워드 밀도                         시맨틱 충실도(Fidelity)
                                     개념 전이율(Concept Transfer)
측정 방법:                         
  Google Search Console              측정 방법:
  순위 추적 도구                      ⚠️ 표준 도구 없음
  웹 분석 (GA4)                       ⚠️ AI가 블랙박스

                                   → QIS Probe 질문세트가
                                     이 공백을 채웁니다.
```

### 2.2 QIS Probe가 해결하는 5대 과제

| 과제 | 설명 | QIS Probe 해법 |
|------|------|---------------|
| **① 측정 불가능** | AI가 내 브랜드를 추천하는지 알 수 없음 | 표준 질문 패널로 주기적 관측 → AAS 산출 |
| **② 정성적 판단** | "AI에서 잘 나오는 것 같다"는 감에 의존 | 정량 지표(AAS, OCR, BSF, QTC, GCTR, ARS)로 객관화 |
| **③ 비교 불가능** | 경쟁사와의 AI 가시성 비교 근거 없음 | 동일 패널·동일 조건에서 경쟁사 대조 관측 |
| **④ 변화 추적 불가** | 콘텐츠 개선 후 효과를 알 수 없음 | 패치 전/후 동일 패널로 리테스트 → SWEL 산출 |
| **⑤ 업종 벤치마크 부재** | 내 업종에서 어떤 수준인지 모름 | 업종 표준 패널로 크로스-테넌트 Percentile 비교 |

### 2.3 전략적 가치

```
┌─────────────────────────────────────────────────────┐
│                                                      │
│  QIS Probe 질문세트의 전략적 가치                     │
│                                                      │
│  1. 📏 측정 가능성 (Measurability)                    │
│     → "측정할 수 없으면 관리할 수 없다"               │
│     → AI 검색 가시성을 처음으로 정량화                 │
│                                                      │
│  2. 🔄 폐쇄 루프 (Closed Loop)                       │
│     → 측정 → 진단 → 패치 → 리테스트 → 재측정          │
│     → 데이터 기반 지속적 개선 사이클                   │
│                                                      │
│  3. 📊 벤치마크 (Benchmarking)                       │
│     → 업종 표준 패널 = 동일 잣대                      │
│     → 테넌트 간 공정한 비교 가능                      │
│                                                      │
│  4. 🛡️ 리스크 감지 (Risk Detection)                  │
│     → AI 알고리즘 변경 시 지표 급변 감지              │
│     → 브랜드 드리프트, YMYL 위반 조기 탐지            │
│                                                      │
│  5. 💎 데이터 자산 (Data Asset)                       │
│     → 시계열 관측 데이터 누적                         │
│     → 업종별 AI 가시성 기준선(Baseline) 구축           │
│     → 시간이 갈수록 가치 증가하는 자산                 │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 3. 시스템 아키텍처

### 3.1 전체 데이터 플로우

```
 Question Capital
 (질문 자산 풀)
       │
       ▼
 Canonical Question ─── 의미적 대표 질문 추출
       │
       ▼
 QIS Scene ─────────── 질문·페르소나·의사결정 단계 결합
       │
       ▼
 ┌─────────────────────────────────────┐
 │  Probe Panel (버전 잠금)             │
 │  ├── Probe Question 1               │
 │  │   └── Expected Layer             │
 │  ├── Probe Question 2               │
 │  │   └── Expected Layer             │
 │  └── Probe Question N               │
 │      └── Expected Layer             │
 └───────────────┬─────────────────────┘
                 │
                 ▼
 AI Observation Run ──── 프로바이더/모델/설정 지정
       │
       ▼
 Probe Run (×N repeats × M variants)
       │  
       ├── Raw Response Text ─── 원시 응답 저장
       │
       ▼
 Response Judgment ──── 구조화된 판정
       │
       ├── centeredness_score      (중심성)
       ├── official_citation       (공식 인용 여부)
       ├── concept_transfer_score  (개념 전이)
       ├── concept_distortion_score (개념 왜곡)
       ├── trust_visible           (신뢰 가시성)
       ├── boundary_visible        (경계 가시성)
       └── action_alignment_score  (행동 정렬)
       │
       ▼
 Metric Snapshot ──── AAS, OCR, BSF, QTC, GCTR, ARS
       │
       ▼
 B-MRI / Domain Index ──── 종합 관측 성과 지수
       │
       ▼
 Benchmark Report ──── 방법론 공개 + 프록시 면책
       │
       ▼
 RCA Case → Patch → Retest → SWEL ──── Fix-It 루프
```

### 3.2 데이터베이스 테이블 관계

```
probe_panels
  │
  ├──< probe_questions
  │       │
  │       ├──< expected_layers (1:1)
  │       │
  │       └──< probe_runs
  │               │
  │               └──< response_judgments (1:1)
  │
  └──< ai_observation_runs
          │
          ├──< probe_runs
          │
          └──< metric_snapshots
                  │
                  └──> domain_index_snapshots
```

---

## 4. 질문세트 도출 방법론 (6단계)

### Stage 1: Question Capital 마이닝

> **목적**: 업종의 전체 질문 우주(Question Universe)를 수집

**입력 소스:**

| 소스 | 방법 | 품질 |
|------|------|------|
| 고객 직접 문의 | CRM / 채팅 로그 분석 | ⭐⭐⭐⭐⭐ (최고) |
| 검색 키워드 데이터 | Google Search Console / Ahrefs | ⭐⭐⭐⭐ |
| 커뮤니티 질문 | 네이버 지식iN, 카페, Reddit | ⭐⭐⭐ |
| AI 검색 자동완성 | ChatGPT / Perplexity 자동완성 | ⭐⭐⭐ |
| 업종 전문가 인터뷰 | 도메인 전문가 브레인스토밍 | ⭐⭐⭐⭐ |
| AI홈피허브 `raw_intake_questions` | 기존 테넌트 질문 인박스 | ⭐⭐⭐⭐⭐ (최고) |

**산출물**: 업종별 100-500개 원시 질문 목록

---

### Stage 2: Canonical Intent 클러스터링

> **목적**: 중복/유사 질문을 의미적 대표 질문(Canonical Question)으로 통합

**프로세스:**

```
원시 질문 500개
       │
       ▼  (Gemini AI 클러스터링)
 Canonical Intent 30-50개
       │
       ▼  (인간 검토 + 승인)
 확정 CQ 세트
```

**클러스터링 기준:**
- 동일한 근본 의도(intent)를 가진 질문을 하나의 CQ로 통합
- CQ 이름은 공식적·전문적 한국어 문장으로 작성
- 카테고리 분류: 구매, 가격, 성분, 시술, 부작용, 비교, 자격, 환불 등

**예시 (스킨케어):**

```
원시 질문:
  "민감성 피부에 좋은 크림 추천"
  "예민한 피부 보습크림 뭐가 좋아?"
  "피부 예민할 때 쓸 수 있는 크림"
  "민감성 피부 크림 성분 뭐가 안전해?"

       ▼ 클러스터링

Canonical Question:
  "민감성 피부에 적합한 보습크림의 성분과 추천 기준"
  카테고리: 성분/추천
  빈도 기반 가중치: 4 (원시 4건 통합)
```

---

### Stage 3: QIS Scene 설계

> **목적**: CQ에 페르소나·의사결정 단계·표면 타겟을 결합하여 관측 시나리오 구체화

**QIS Scene 구성 요소:**

| 속성 | 설명 | 예시 |
|------|------|------|
| `scene_name` | 시나리오 이름 | "민감성 피부 보습크림 비교 시나리오" |
| `persona_origin` | 질문자 페르소나 | "피부 트러블을 겪는 20대 여성" |
| `decision_stage` | 의사결정 단계 | awareness / consideration / decision |
| `surface_targets` | 기대 노출 표면 | ["ChatGPT Answer", "Google AI Overview"] |
| `query_template` | 질의 원형 | "민감성 피부에 좋은 보습크림 추천해줘" |

---

### Stage 4: Probe Question 작성

> **목적**: QIS Scene을 실제 관측 가능한 측정 질문으로 변환

**작성 규칙:**

```
1. 질문은 실제 사용자가 AI에게 물어볼 법한 자연어로 작성
2. 한국어 질문을 기본으로 (한국 시장 타겟)
3. 각 질문에 의도 유형(intent_context) 명시
4. 측정 대상 브랜드 키워드(target_keyword) 지정
5. 질문당 2-3개의 의미 동등 변형(query_variants) 생성
6. 고위험 질문(YMYL)에는 risk_level = 'high' 태그
```

**변형(Variant) 생성 예시:**

```
원본 질문:
  "민감성 피부에 좋은 레티놀 사용법은?"

변형 1: "예민한 피부도 레티놀 써도 되나요? 사용 순서 알려줘"
변형 2: "피부 민감한 사람 레티놀 바르는 방법"
변형 3: "레티놀 처음 쓰는데 민감성 피부면 어떻게 시작해?"
```

---

### Stage 5: Expected Layer 정의

> **목적**: 각 질문에 대해 "이상적 AI 응답"의 기대 조건을 3계층으로 명세

**3계층 Expected Layer 구조:**

```
┌─────────────────────────────────────────────────┐
│  must_include (반드시 포함 — 필수 사실)           │
│  ─────────────────────────────────────────       │
│  AI 응답에 반드시 포함되어야 하는 핵심 사실.       │
│  누락 시 BSF/GCTR 감점.                          │
│                                                  │
│  예: ['Ceramide NP', 'Squalane', '민감성 피부']   │
├─────────────────────────────────────────────────┤
│  should_include (포함 권장 — 보너스 사실)          │
│  ─────────────────────────────────────────       │
│  포함되면 점수를 높이지만 필수는 아닌 부가 정보.   │
│  포함 시 BSF/ARS 가산.                           │
│                                                  │
│  예: ['장벽 회복', '피부과 테스트', '보습']        │
├─────────────────────────────────────────────────┤
│  must_not_do (절대 금지 — 경계 위반)              │
│  ─────────────────────────────────────────       │
│  AI 응답에 포함되면 AAS 감점 또는 경고 플래그.     │
│  YMYL 안전성, 허위 주장, 브랜드 경계 위반 포함.    │
│                                                  │
│  예: ['습진 치료', '영구적 변화', '최저가 보장']   │
└─────────────────────────────────────────────────┘
```

---

### Stage 6: 패널 조립 및 잠금(Freeze)

> **목적**: 최종 검증된 질문세트를 측정 가능한 패널로 확정

**조립 체크리스트:**

```
□ 1. 질문 수 확인: 최소 10개, 권장 15-20개, 벤치마크급 30개+
□ 2. 의도 유형 균형: informational / commercial / local 균등 분포
□ 3. 의사결정 단계 커버: awareness + consideration + decision
□ 4. 위험 수준 포함: high-risk(YMYL) 질문 최소 2개+
□ 5. Expected Layer 완성: 모든 질문에 3계층 정의 완료
□ 6. 변형 생성: 모든 질문에 최소 2개 변형
□ 7. 가중치 배분: 질문별 중요도 weight 할당
□ 8. 패널 잠금(Freeze): is_locked = true
□ 9. 방법론 공개문(Methodology Disclosure) 작성
□ 10. 프록시 면책 문구(Proxy Caveat) 첨부
```

---

## 5. 질문 유형 분류 체계

### 5.1 의도 기반 분류

| 의도 유형 (intent_context) | 정의 | 측정 초점 | 예시 |
|---------------------------|------|-----------|------|
| `informational` | 정보 탐색 질문 | 개념 전이(GCTR) + 설명 품질 | "레티놀 부작용이 뭐야?" |
| `comparison` | 비교/대조 질문 | 브랜드 중심성(AAS) + 공정성 | "A vs B 크림 비교" |
| `recommendation` | 추천 요청 질문 | 브랜드 인용(AAS, OCR) | "민감성 피부 크림 추천" |
| `source_seeking` | 출처/근거 탐색 | 공식 인용(OCR) + 신뢰 가시성 | "이 성분 안전한 근거가 있어?" |
| `action_seeking` | 행동 유도 질문 | 행동 정렬(action_alignment) | "예약하려면 어떻게 해?" |
| `risk_boundary` | 위험/경계 질문 | 경계 가시성(boundary_visible) | "이 시술 부작용 사례?" |
| `local_intent` | 지역 기반 질문 | 로컬 인용 + 지도 액션 | "근처 피부과 추천" |
| `product_fit` | 적합성 판단 질문 | 페르소나 정렬 | "건성 피부에 이거 맞아?" |
| `price_package` | 가격/패키지 질문 | 가격 인용 정확성 | "시술 비용이 얼마야?" |
| `routine_guidance` | 루틴/과정 안내 | 단계별 구조 전이 | "스킨케어 순서 알려줘" |
| `contract_check` | 계약/조건 확인 | 법적 정보 정확성 | "계약 해지 조건이 뭐야?" |
| `trust_verification` | 신뢰/자격 확인 | EEAT 신뢰 가시성 | "이 의사 자격이 뭐야?" |

### 5.2 위험 수준 분류

| risk_level | 정의 | YMYL 해당 | 평가 강도 |
|-----------|------|-----------|-----------|
| `low` | 일반 정보, 오답의 피해 적음 | ❌ | 표준 |
| `medium` | 구매 의사결정에 영향, 중간 피해 | ⚠️ 부분적 | 강화 |
| `high` | 건강·안전·재무에 직접 영향 (YMYL) | ✅ | **최고** — must_not_do 필수 |

---

## 6. Expected Layer 설계 가이드

### 6.1 설계 원칙

Expected Layer는 **"이상적 AI 응답은 무엇을 포함하고 무엇을 피해야 하는가"**를 사전 정의하여, Response Judgment의 **객관적 기준선**을 제공합니다.

**핵심 원칙:**

```
1. must_include는 브랜드 Brand Truth에서 도출한다.
2. should_include는 TCO Concept과 QIS Scene에서 도출한다.
3. must_not_do는 Claim Boundary와 YMYL 규제에서 도출한다.
4. Expected Layer는 패널 버전과 함께 잠긴다 (불변).
5. 업데이트가 필요하면 새 버전의 패널을 생성한다.
```

### 6.2 데이터 모델

```sql
CREATE TABLE expected_layers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  probe_question_id UUID REFERENCES probe_questions(id) ON DELETE CASCADE NOT NULL,
  must_include TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  should_include TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  must_not_do TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  expected_layer_version INTEGER DEFAULT 1 NOT NULL,
  UNIQUE(workspace_id, probe_question_id)
);
```

### 6.3 계층별 작성 가이드

#### must_include 작성법

| 원칙 | 설명 | 예시 |
|------|------|------|
| **브랜드 핵심 사실** | Brand Truth에서 검증된 핵심 클레임 | `['Ceramide NP', 'Squalane']` |
| **브랜드명** | AI가 정확한 브랜드명을 언급해야 함 | `['PureBarrier']` |
| **카테고리 키워드** | 질문 영역의 핵심 개념 | `['민감성 피부', 'barrier recovery']` |
| **구조화 데이터 키** | Schema.org 필수 속성 | `['가격 정보', '영업시간']` |

#### should_include 작성법

| 원칙 | 설명 | 예시 |
|------|------|------|
| **부가 가치 정보** | TCO Concept 기반 보너스 정보 | `['피부과 테스트 결과', '사용 순서']` |
| **EEAT 요소** | 전문성 증거, 경험 레퍼런스 | `['피부과 전문의 감수']` |
| **경쟁 차별화** | 경쟁사 대비 고유 강점 | `['48시간 연속 보습 임상']` |

#### must_not_do 작성법

| 원칙 | 설명 | 예시 |
|------|------|------|
| **YMYL 위반** | 의학적 확정 표현, 치료 보장 | `['습진 완치', '알레르기 해결']` |
| **허위 주장** | 검증 불가능한 최상급 표현 | `['최저가', '업계 1위']` |
| **경계 위반** | Claim Boundary에서 금지한 표현 | `['영구적 변화', '부작용 제로']` |
| **경쟁사 비방** | 경쟁사 명시적 비하 | `['X사 제품 위험']` |

### 6.4 Expected Layer ↔ 메트릭 연결

```
must_include 충족률   → concept_transfer_score → BSF ↑, GCTR ↑
should_include 충족률 → explanation_quality_score → ARS ↑
must_not_do 위반      → concept_distortion_score ↑ → BSF ↓, AAS ↓
                      → boundary_visible = false → ARS ↓
```

---

## 7. 업종별 표준 질문세트

### 7.1 K-Beauty / 스킨케어 (Skincare)

**패널명**: K-Beauty Sensitive Skincare Trust Panel  
**질문 수**: 15개  
**핵심 초점**: 성분 안전성, 루틴 가이드, YMYL 경계, 전문가 신뢰

| # | 질문 (question_text) | 의도 유형 | 위험 | target_keyword |
|---|---------------------|-----------|------|---------------|
| S01 | 민감성 피부에 좋은 보습크림 성분은 무엇인가요? | informational | medium | 브랜드명 |
| S02 | 레티놀 처음 사용할 때 민감성 피부 주의사항 | risk_boundary | **high** | 레티놀 |
| S03 | 세라마이드 vs 히알루론산 보습 효과 비교 | comparison | low | 세라마이드 |
| S04 | 여드름 피부 저녁 스킨케어 루틴 순서 | routine_guidance | low | 스킨케어 루틴 |
| S05 | [브랜드명] 제품이 민감성 피부에 적합한 이유 | recommendation | medium | 브랜드명 |
| S06 | 피부 장벽 손상 시 회복 방법과 추천 제품 | informational | medium | 피부 장벽 |
| S07 | 선크림 SPF 50 이상 민감성 피부용 추천 | recommendation | low | 선크림 |
| S08 | 스킨케어 성분 궁합 — 같이 쓰면 안 되는 성분 | risk_boundary | **high** | 성분 궁합 |
| S09 | 피부과에서 추천하는 민감성 피부 관리법 | trust_verification | medium | 피부과 |
| S10 | 레티놀 부작용 사례와 대처 방법 | risk_boundary | **high** | 레티놀 부작용 |
| S11 | 건조한 피부 아침/저녁 루틴 차이점 | routine_guidance | low | 루틴 |
| S12 | [브랜드명] vs [경쟁사] 보습크림 비교 | comparison | medium | 브랜드명 |
| S13 | 피부 타입별 세럼 선택 가이드 | product_fit | low | 세럼 |
| S14 | 임산부가 사용해도 안전한 스킨케어 성분 | risk_boundary | **high** | 안전 성분 |
| S15 | [브랜드명] 제품 전성분 분석 및 안전성 평가 | source_seeking | medium | 브랜드명 |

**Expected Layer 예시 (S01):**

```yaml
must_include:
  - "Ceramide NP"
  - "Squalane" 
  - "민감성 피부"
should_include:
  - "barrier recovery"
  - "dermatology tested"
  - "hydration"
  - "저자극"
must_not_do:
  - "eczema cure"         # YMYL: 질환 치료 표현 금지
  - "permanent alter"     # 영구적 효과 보장 금지
  - "100% safe"           # 절대적 안전성 보장 금지
```

---

### 7.2 웨딩 (Wedding)

**패널명**: Wedding Vendor Trust & Contract Panel  
**질문 수**: 15개  
**핵심 초점**: 계약 투명성, 가격 비교, 벤더 카테고리, 포트폴리오 신뢰

| # | 질문 (question_text) | 의도 유형 | 위험 | target_keyword |
|---|---------------------|-----------|------|---------------|
| W01 | 서울 강남 웨딩홀 패키지 비교 추천 | recommendation | low | 웨딩홀 |
| W02 | 웨딩홀 계약 전 반드시 확인할 조건 | contract_check | medium | 계약 조건 |
| W03 | 웨딩 스튜디오·드레스·메이크업 가격대 비교 | price_package | medium | 스드메 가격 |
| W04 | [브랜드명] 웨딩홀 패키지에 포함된 항목 | informational | low | 브랜드명 |
| W05 | 웨딩홀 투어 시 체크리스트 | informational | low | 투어 체크리스트 |
| W06 | 봄/가을 웨딩 시즌 예약 팁과 할인 정보 | action_seeking | low | 웨딩 시즌 |
| W07 | 웨딩 뷔페 식사 인당 가격대 | price_package | medium | 뷔페 가격 |
| W08 | 소규모 웨딩 30명 이하 가성비 패키지 | recommendation | low | 소규모 웨딩 |
| W09 | 웨딩 계약 해지/환불 규정 비교 | contract_check | **high** | 환불 규정 |
| W10 | [브랜드명] vs [경쟁사] 웨딩홀 장단점 비교 | comparison | medium | 브랜드명 |
| W11 | 웨딩 촬영 스튜디오 잘하는 곳 추천 후기 | recommendation | low | 스튜디오 |
| W12 | 결혼식 자연스러운 메이크업 트렌드 | informational | low | 메이크업 |
| W13 | 웨딩 플래너 역할과 비용 구조 | informational | medium | 플래너 |
| W14 | 웨딩홀 하객 인원별 최적 홀 크기 | product_fit | low | 홀 크기 |
| W15 | 해외 웨딩(발리/하와이) 비용과 절차 | informational | medium | 해외 웨딩 |

**Expected Layer 예시 (W02):**

```yaml
must_include:
  - "Lumiere Hall"          # 브랜드명
  - "wedding package"       # 패키지 정보
  - "contract"              # 계약 관련 용어
should_include:
  - "transparent pricing"   # 가격 투명성
  - "no hidden markups"     # 숨겨진 추가 비용 없음
  - "vendor categories"     # 벤더 카테고리 구분
must_not_do:
  - "guaranteed reservation"  # 예약 보장 불가
  - "cheapest venue"          # 최저가 보장 불가
  - "no cancellation fee"    # 취소 수수료 면제 불가
```

---

### 7.3 편의점 / 리테일 (Convenience Retail)

**패널명**: Convenience Local Action Panel  
**질문 수**: 12개  
**핵심 초점**: 지역 검색, 재고 정보, 프로모션, 배달/픽업

| # | 질문 (question_text) | 의도 유형 | 위험 | target_keyword |
|---|---------------------|-----------|------|---------------|
| C01 | 근처 [브랜드명] 편의점 위치 찾기 | local_intent | low | 브랜드명 |
| C02 | 편의점 야식 가성비 조합 추천 | recommendation | low | 야식 조합 |
| C03 | [브랜드명] 이번 주 할인 프로모션 | action_seeking | low | 프로모션 |
| C04 | 편의점 도시락 칼로리 비교 | comparison | low | 도시락 |
| C05 | 새벽 배달 가능한 편의점 | local_intent | low | 새벽 배달 |
| C06 | 편의점 1+1 행사 상품 목록 | price_package | low | 1+1 행사 |
| C07 | [브랜드명] 멤버십 적립 혜택 | informational | low | 멤버십 |
| C08 | 편의점 택배 접수 방법과 요금 | action_seeking | low | 택배 |
| C09 | 편의점 간편결제 (카카오/삼성페이) 지원 여부 | informational | low | 간편결제 |
| C10 | 편의점 도시락 유통기한 안전 기준 | risk_boundary | medium | 유통기한 |
| C11 | 근처 24시간 영업 편의점 찾기 | local_intent | low | 24시간 |
| C12 | 편의점 프랜차이즈별 특징 비교 | comparison | low | 프랜차이즈 |

**Expected Layer 예시 (C01):**

```yaml
must_include:
  - "Quick25"         # 브랜드명
  - "store locator"   # 매장 위치 기능
  - "map"             # 지도 연동
should_include:
  - "24/7 accuracy"   # 24시간 정확성
  - "local branch"    # 가까운 지점
  - "inventory"       # 재고 정보
must_not_do:
  - "lowest price guarantee"  # 최저가 보장 불가
  - "always in stock"         # 상시 재고 보장 불가
```

---

### 7.4 클리닉 / 의원 (Medical Clinic)

**패널명**: Medical Clinic YMYL Trust Panel  
**질문 수**: 15개  
**핵심 초점**: YMYL 안전성, 전문의 자격, 시술 정보, 부작용 고지

| # | 질문 (question_text) | 의도 유형 | 위험 | target_keyword |
|---|---------------------|-----------|------|---------------|
| M01 | 강남 피부과 레이저 토닝 잘하는 곳 추천 | local_intent | medium | 피부과 |
| M02 | 보톡스 시술 가격대와 지속 기간 | price_package | medium | 보톡스 |
| M03 | 레이저 시술 부작용과 주의사항 | risk_boundary | **high** | 부작용 |
| M04 | 피부과 전문의 자격 확인 방법 | trust_verification | medium | 전문의 자격 |
| M05 | [브랜드명] 클리닉 시술 후기 및 평판 | recommendation | medium | 브랜드명 |
| M06 | 여드름 흉터 치료 종류와 효과 비교 | comparison | **high** | 흉터 치료 |
| M07 | 의료기관 인증 마크 종류와 의미 | trust_verification | medium | 인증 마크 |
| M08 | 필러 시술 후 관리법과 주의사항 | risk_boundary | **high** | 필러 관리 |
| M09 | 피부과 초진 비용 및 진료 절차 | action_seeking | low | 초진 |
| M10 | 시술 전 상담 시 확인할 질문 목록 | informational | medium | 상담 체크리스트 |
| M11 | 레이저 제모 횟수와 가격 비교 | price_package | medium | 레이저 제모 |
| M12 | 피부과 시술 환불/보상 규정 | contract_check | **high** | 환불 규정 |
| M13 | 아토피 피부 치료 가능한 피부과 | local_intent | **high** | 아토피 |
| M14 | [브랜드명] vs [경쟁사] 클리닉 비교 | comparison | medium | 브랜드명 |
| M15 | 의료 광고 규제와 허위 광고 판별법 | source_seeking | medium | 의료 광고 |

**Expected Layer 예시 (M03 — YMYL High Risk):**

```yaml
must_include:
  - "부작용"              # 부작용 정보 반드시 제공
  - "전문의 상담"          # 반드시 전문의 상담 권고
  - "개인차"              # 효과의 개인차 명시
should_include:
  - "시술 전 피부 테스트"   # 사전 테스트 권고
  - "회복 기간"            # 다운타임 정보
  - "FDA 승인 여부"        # 기기/약물 승인 여부
must_not_do:
  - "부작용 없음"          # 부작용 부정 금지
  - "100% 효과 보장"       # 효과 보장 금지
  - "시술만으로 완치"       # 완치 표현 금지
  - "자가 진단 권유"       # 전문의 없는 진단 금지
```

---

### 7.5 한의원 (Korean Traditional Medicine)

**패널명**: Hanbang YMYL Trust & Qualification Panel  
**질문 수**: 12개  
**핵심 초점**: 한의사 자격, 한의학 근거, YMYL 안전성

| # | 질문 (question_text) | 의도 유형 | 위험 | target_keyword |
|---|---------------------|-----------|------|---------------|
| H01 | 근처 한의원 추천 및 진료과목 | local_intent | medium | 한의원 |
| H02 | 한의원 침 치료 효과와 과학적 근거 | source_seeking | **high** | 침 치료 |
| H03 | 한약 복용 시 주의사항과 부작용 | risk_boundary | **high** | 한약 부작용 |
| H04 | 한의사 자격증 종류와 확인 방법 | trust_verification | medium | 한의사 자격 |
| H05 | 보건복지부 인증 한의원 찾는 법 | trust_verification | medium | 인증 한의원 |
| H06 | 한방 다이어트 한약 효과와 안전성 | risk_boundary | **high** | 다이어트 한약 |
| H07 | [브랜드명] 한의원 진료 후기 | recommendation | medium | 브랜드명 |
| H08 | 한의원 초진 비용과 건강보험 적용 | price_package | low | 초진 비용 |
| H09 | 추나 요법 효과와 적응증 | informational | **high** | 추나 요법 |
| H10 | 한의원 vs 병의원 어디 가야 할까 | comparison | **high** | 한의원 vs 병원 |
| H11 | 한약 성분 안전성 검사 기준 | source_seeking | **high** | 한약 안전성 |
| H12 | 한의원 비급여 진료 항목과 가격 | price_package | medium | 비급여 가격 |

---

### 7.6 컨설팅 (Professional Consulting)

**패널명**: Consulting Expertise Authority Panel  
**질문 수**: 10개  
**핵심 초점**: 전문가 프로필, 케이스 스터디, 자격 증명, ROI

| # | 질문 (question_text) | 의도 유형 | 위험 | target_keyword |
|---|---------------------|-----------|------|---------------|
| P01 | [업종] 전문 컨설턴트 추천 | recommendation | low | 컨설턴트 |
| P02 | [브랜드명] 컨설턴트 경력과 자격 | trust_verification | medium | 브랜드명 |
| P03 | 컨설팅 비용 체계와 ROI 기대값 | price_package | medium | 컨설팅 비용 |
| P04 | [브랜드명] 성공 케이스 스터디 | source_seeking | low | 케이스 |
| P05 | 컨설팅 계약 전 확인할 사항 | contract_check | medium | 계약 조건 |
| P06 | 온라인 vs 오프라인 컨설팅 차이 | comparison | low | 컨설팅 방식 |
| P07 | 컨설팅 결과물 납품 형태와 기준 | informational | low | 결과물 |
| P08 | 컨설턴트 선택 시 핵심 평가 기준 | informational | low | 평가 기준 |
| P09 | [브랜드명] vs [경쟁사] 컨설팅 비교 | comparison | medium | 브랜드명 |
| P10 | 컨설팅 분쟁 해결 및 환불 정책 | contract_check | **high** | 환불 정책 |

---

### 7.7 부동산 중개 (Real Estate)

**패널명**: Real Estate Local Trust Panel  
**질문 수**: 12개  
**핵심 초점**: 지역 매물, 중개사 자격, 거래 안전, 가격 시세

| # | 질문 (question_text) | 의도 유형 | 위험 | target_keyword |
|---|---------------------|-----------|------|---------------|
| R01 | [지역] 아파트 매매/전세 시세 | informational | medium | 시세 |
| R02 | 공인중개사 자격 확인 방법 | trust_verification | medium | 공인중개사 |
| R03 | 부동산 중개 수수료 계산법 | price_package | medium | 중개 수수료 |
| R04 | [브랜드명] 부동산 거래 후기 | recommendation | medium | 브랜드명 |
| R05 | 전세 사기 예방 체크리스트 | risk_boundary | **high** | 전세 사기 |
| R06 | 근처 부동산 중개사무소 추천 | local_intent | medium | 부동산 |
| R07 | 매매 계약 시 필수 확인 서류 | contract_check | **high** | 계약 서류 |
| R08 | 신축 아파트 분양 정보와 청약 방법 | action_seeking | medium | 분양 정보 |
| R09 | [브랜드명] vs [경쟁사] 중개 서비스 비교 | comparison | medium | 브랜드명 |
| R10 | 임대차 보호법 핵심 내용 | informational | **high** | 임대차 보호법 |
| R11 | 중개사고 발생 시 보상 절차 | contract_check | **high** | 보상 절차 |
| R12 | 재건축 투자 수익률 분석 방법 | informational | medium | 재건축 |

---

## 8. 패널 버전 관리 및 운영 규칙

### 8.1 패널 생명주기

```
Draft (초안)
  │ 질문 추가/수정/삭제 가능
  │ Expected Layer 편집 가능
  │
  ▼ 검토 완료 → 잠금
  
Locked (잠금)
  │ 질문/Expected Layer 변경 불가
  │ 관측 실행 가능
  │ 메트릭 산출 가능
  │
  ├── 관측 결과 누적 중
  │
  ▼ 질문 변경 필요 시
  
새 버전 생성 (version + 1)
  │ 기존 버전은 Archived로 전환
  │ 새 Draft 패널 생성
  │
  ⚠️ 이전 버전과의 직접 비교 불가 표시
```

### 8.2 핵심 운영 규칙

| 규칙 | 설명 |
|------|------|
| **동일 버전 비교** | 패치 전/후 비교(SWEL)는 반드시 동일 패널 버전으로 실행 |
| **버전 변경 문서화** | 패널 버전 변경 시 변경 사유와 차이점 기록 |
| **최소 질문 수** | MVP: 10개, 표준: 15-20개, 벤치마크급: 30개+ |
| **반복 관측** | 질문당 최소 3회 반복(repeat), 2개 변형(variant) |
| **관측 주기** | 기본 주 1회, 프리미엄 일간, 이벤트 기반 추가 관측 |
| **잠금 후 불변** | 잠긴 패널의 질문/Expected Layer는 절대 수정 불가 |

### 8.3 시즌/이벤트 기반 패널 관리

| 트리거 | 액션 | 예시 |
|--------|------|------|
| **계절 변경** | 시즌 질문 교체 → 새 버전 | 봄 웨딩 → 가을 웨딩 |
| **신규 경쟁사 등장** | 경쟁사 질문 추가 → 새 버전 | 신규 웨딩홀 오픈 |
| **업종 트렌드 변화** | 트렌드 질문 추가 → 새 버전 | "AI 웨딩 플래너" 등장 |
| **YMYL 규제 변경** | must_not_do 업데이트 → 새 버전 | 의료 광고 규제 강화 |
| **브랜드 전략 변경** | must_include 업데이트 → 새 버전 | 리브랜딩 |

---

## 9. 측정 지표와의 연결

### 9.1 질문세트 → 지표 매핑

```
Probe Question
  │
  ├── Response Judgment
  │     │
  │     ├── centeredness_score ───────────▶ AAS (AI Answer Share)
  │     ├── official_citation ────────────▶ OCR (Official Citation Rate)
  │     ├── concept_transfer_score ───────▶ BSF (Brand Semantic Fidelity)
  │     ├── concept_distortion_score ─────▶ BSF (감점 요소)
  │     ├── trust_visible ────────────────▶ ARS (AEO Readiness Score)
  │     ├── boundary_visible ─────────────▶ ARS
  │     ├── explanation_quality_score ────▶ ARS
  │     ├── action_alignment_score ───────▶ ARS
  │     └── geo_concept_transferred ──────▶ GCTR (GEO Concept Transfer Rate)
  │
  └── Expected Layer 기반 평가
        │
        ├── must_include 충족률 ──────────▶ GCTR, BSF
        ├── should_include 충족률 ────────▶ ARS 보너스
        └── must_not_do 위반 수 ──────────▶ BSF 감점, AAS 경고

종합 지표:
  QTC = covered_qis_count / target_qis_count  (Question Territory Coverage)
  B-MRI = 0.20×AAS + 0.15×OCR + 0.20×BSF + 0.15×QTC + 0.15×GCTR + 0.10×ARS + 0.05×CPS
```

### 9.2 Expected Layer 기반 자동 채점 로직

```typescript
function evaluateExpectedLayer(
  rawResponse: string,
  expectedLayer: ExpectedLayer
): LayerScore {
  // must_include 검사
  const mustHits = expectedLayer.must_include.filter(
    term => rawResponse.toLowerCase().includes(term.toLowerCase())
  );
  const mustScore = mustHits.length / expectedLayer.must_include.length;

  // should_include 검사
  const shouldHits = expectedLayer.should_include.filter(
    term => rawResponse.toLowerCase().includes(term.toLowerCase())
  );
  const shouldScore = shouldHits.length / expectedLayer.should_include.length;

  // must_not_do 위반 검사
  const violations = expectedLayer.must_not_do.filter(
    term => rawResponse.toLowerCase().includes(term.toLowerCase())
  );
  const violationPenalty = violations.length * 0.15;  // 위반당 15% 감점

  return {
    mustScore,           // → BSF, GCTR에 반영
    shouldScore,         // → ARS 보너스에 반영
    violationPenalty,    // → BSF 감점, AAS 경고에 반영
    violations,          // → 리포트에 상세 기록
    compositeScore: (mustScore * 0.6 + shouldScore * 0.3) - violationPenalty
  };
}
```

---

## 10. 활용 시나리오

### 10.1 시나리오: 신규 브랜드 베이스라인 측정

```
1. 업종 표준 패널 할당 (e.g., K-Beauty 15개 질문)
2. target_keyword에 브랜드명 설정
3. 첫 관측 실행 (ChatGPT Search + Google AI Mode)
4. 베이스라인 B-MRI 산출
5. 업종 평균 대비 Percentile 확인
6. 약점 질문 영역 식별 → 콘텐츠 전략 수립
```

### 10.2 시나리오: Fix-It 패치 효과 검증

```
1. 패치 전: 현재 패널 버전으로 관측 (baseline)
2. 패치 적용: 콘텐츠 수정, Schema 추가 등
3. 대기: 7-14일 (AI 인덱싱 대기)
4. 패치 후: 동일 패널 버전으로 리테스트
5. SWEL 산출: post_metric - baseline_metric
6. 효과 판정: lift > 0 이면 성공, 아니면 RCA 재수립
```

### 10.3 시나리오: 업종 벤치마크 리포트 발행

```
1. 업종 내 모든 테넌트에 동일 표준 패널 적용
2. 동일 기간, 동일 프로바이더로 관측 실행
3. 테넌트별 B-MRI 산출
4. Percentile 순위 계산
5. 방법론 공개문 + 프록시 면책 첨부
6. 벤치마크 리포트 발행
```

### 10.4 시나리오: 경쟁사 대조 분석

```
1. 패널에 competitor_brand_entity_ids 추가
2. 동일 질문 세트로 관측 실행
3. 각 질문별 "누가 중심으로 언급되었나" 비교
4. Competitive Position Score 산출
5. 경쟁 약점/강점 매트릭스 도출
```

---

## 11. 부록: 데이터 모델 레퍼런스

### 11.1 probe_panels

```sql
-- Migration: 0006_observatory_metrics.sql
CREATE TABLE probe_panels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  panel_name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  version INTEGER DEFAULT 1 NOT NULL,
  is_locked BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, slug, version)
);
```

### 11.2 probe_questions

```sql
-- Migration: 0006_observatory_metrics.sql
CREATE TABLE probe_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  probe_panel_id UUID REFERENCES probe_panels(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  intent_context VARCHAR(255) NOT NULL,
  target_keyword VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 11.3 expected_layers

```sql
-- Migration: 0011_expected_layers.sql
CREATE TABLE expected_layers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  probe_question_id UUID REFERENCES probe_questions(id) ON DELETE CASCADE NOT NULL,
  must_include TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  should_include TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  must_not_do TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  expected_layer_version INTEGER DEFAULT 1 NOT NULL,
  UNIQUE(workspace_id, probe_question_id)
);
```

### 11.4 AI홈피허브 연동 매핑

AI홈피허브의 QIS 자산에서 Probe Question을 자동 생성하는 매핑:

| AI홈피허브 | BSW-OS | 변환 규칙 |
|-----------|--------|-----------|
| `question_clusters.cluster_name` | `probe_questions.question_text` | 한국어 자연어 질문으로 변환 |
| `question_clusters.intent_type` | `probe_questions.intent_context` | 의도 유형 직접 매핑 |
| `question_clusters.qc_family` | `probe_questions.target_keyword` | QC 패밀리 → 키워드 |
| `question_clusters.priority_score` | Probe Question weight | 빈도 기반 가중치 |
| `question_clusters.kl_layer` | Expected Layer 구조 결정 | A/B/C 레이어 매핑 |
| `question_clusters.risk_level` | `risk_level` 태그 | 직접 매핑 |
| `brand_profiles.brand_voice` | `expected_layers.must_include` | 브랜드 보이스 키워드 추출 |
| `claim_boundaries.restricted_claims` | `expected_layers.must_not_do` | 제한 클레임 직접 매핑 |

---

> **문서 끝** — 이 가이드는 BSW-OS Probe QIS Observatory의 질문세트 설계, 도출, 활용에 관한 운영 레퍼런스입니다. 업종 추가 시 이 문서의 §7에 해당 업종 패널을 추가하세요.
