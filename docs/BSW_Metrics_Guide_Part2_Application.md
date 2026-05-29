# BSW Metric 통합 가이드북 — Part 2: Business Application & Optimization

> **Version:** v2.0  
> **System:** Brand Semantic Website OS (BSW-OS)  
> **Scope:** 비즈니스 응용, 실험 프레임워크, 최적화 워크플로우, 실제 사례 시나리오  
> **Last Updated:** 2026-05-28  
> **선행 문서:** [Part 1: Foundation & Definitions](./BSW_Metrics_Guide_Part1_Foundation.md)

---

## 목차

1. [비즈니스 응용 체계](#1-비즈니스-응용-체계)
2. [AI Brand MRI 리포트 체계](#2-ai-brand-mri-리포트-체계)
3. [Baseline vs Intervention 실험 프레임워크](#3-baseline-vs-intervention-실험-프레임워크)
4. [Closed-Loop 최적화 워크플로우](#4-closed-loop-최적화-워크플로우)
5. [도메인별 메트릭 적용 사례](#5-도메인별-메트릭-적용-사례)
6. [SBS Index 통합 대시보드 구성](#6-sbs-index-통합-대시보드-구성)
7. [메트릭 기반 의사결정 매트릭스](#7-메트릭-기반-의사결정-매트릭스)
8. [월간 MeaningOps 운영 모델](#8-월간-meaningops-운영-모델)
9. [비용 구조 및 ROI 분석](#9-비용-구조-및-roi-분석)
10. [메트릭 진단 체크리스트](#10-메트릭-진단-체크리스트)

---

## 1. 비즈니스 응용 체계

### 1.1 메트릭 → 비즈니스 가치 매핑

BSW-OS 메트릭은 세 가지 비즈니스 가치 축을 동시에 측정합니다.

```
┌──────────────────────────────────────────────────────────────┐
│                    비즈니스 가치 3축                           │
├──────────────┬──────────────────┬────────────────────────────┤
│   가시성      │    신뢰성        │     안전성                  │
│  (Visibility) │  (Credibility)   │    (Safety)                │
├──────────────┼──────────────────┼────────────────────────────┤
│ M1 개념전달   │ M2 인용검증      │ M4 왜곡률                   │
│ AAS 응답점유  │ M3 개념충실도    │ M6 환각률                   │
│ QTC 영역커버  │ M10 정책정합     │ M9 바닥리스크               │
│ BAIR 평판지수 │ AITI 신뢰지수    │ M7 끌개안정성               │
│ GCTR 전달률  │ M2 인용률        │ M8 드리프트                  │
│ M13 준비도   │                   │                             │
└──────────────┴──────────────────┴────────────────────────────┘
```

### 1.2 이해관계자별 핵심 메트릭

| 이해관계자 | 핵심 관심 메트릭 | 리포트 형태 |
|:---|:---|:---|
| **CEO / CMO** | M13 (준비도 등급), BAIR, KAIVI | Executive Dashboard |
| **브랜드 전략가** | M1, M3, M5 (갭 분석), M4 | AI Brand MRI Report |
| **콘텐츠 매니저** | M2, M5 (누락 개념), ARS | Answer Card 백로그 |
| **리스크 관리자** | M9, M6, M4, M10 | Risk & Compliance Report |
| **SEO/AEO 전문가** | M1, M7, M8, GCTR, SWEL | Baseline vs Intervention |
| **데이터 분석가** | M7, M8, M11, M12 | Statistical Stability Report |

### 1.3 산업별 메트릭 가중치 가이드

산업 특성에 따라 메트릭의 상대적 중요도가 달라집니다.

| 산업 분야 | 최우선 메트릭 | 이유 |
|:---|:---|:---|
| **의료/헬스케어** (YMYL) | M6, M9, M10 | 환각·리스크가 환자 안전에 직결 |
| **뷰티/화장품** | M3, M4, M1 | 성분 정보의 정확한 전달이 핵심 |
| **법률/금융** (YMYL) | M9, M10, M2 | 규제 준수와 근거 기반 정보 필수 |
| **이커머스/리테일** | M1, AAS, BAIR | 브랜드 가시성과 추천 비중이 매출 직결 |
| **웨딩/이벤트** | M3, M5, QTC | 패키지 비교의 정확성과 완전성 |
| **교육** | M2, M3, M6 | 학습 정보의 정확성과 출처 검증 |
| **여행/호스피탈리티** | M1, M4, AAS | 시설·서비스 정보의 과장/축소 방지 |

---

## 2. AI Brand MRI 리포트 체계

> **구현 위치**: `lib/reports/ai-brand-mri-generator.ts`  
> **트리거**: `app/actions/reports.ts` → `'ai_brand_mri'` 타입

### 2.1 리포트 구조

AI Brand MRI Report는 TCO-GEO 스냅샷을 기반으로 자동 생성되는 **브랜드 AI 건강 진단서**입니다.

```
┌─────────────────────────────────────────────┐
│           AI Brand MRI Report               │
├─────────────────────────────────────────────┤
│ 1. Executive Summary                        │
│    ├── AEO/GEO Readiness Score (M13)       │
│    ├── Brand Concept Fidelity (M3)         │
│    ├── Floor Risk (M9)                      │
│    └── Policy Alignment (M10)              │
│                                              │
│ 2. Concept Transfer Analysis (M1)           │
│    └── Citation-Backed Rate (M2)           │
│                                              │
│ 3. Brand Concept Fidelity Detail (M3)      │
│                                              │
│ 4. Concept Distortion Report (M4)           │
│    └── Top Detected Distortion Cases       │
│                                              │
│ 5. Hallucination Alert (M6)                 │
│    └── Critical Hallucinated Claims        │
│                                              │
│ 6. Missing Concept Gap (M5)                │
│    └── Gap Analysis Table                  │
│                                              │
│ 7. Floor Risk Analysis (M9)                │
│                                              │
│ 8. Policy Alignment (M10)                  │
│    └── Policy Violations Log               │
│                                              │
│ 9. Stability & Drift (M7, M8, M11, M12)   │
│                                              │
│ 10. Priority Improvement Roadmap           │
└─────────────────────────────────────────────┘
```

### 2.2 리포트 생성 프로세스

```
1. Observation Run 완료
       │
       ▼
2. 6-Judge Pipeline 실행 (전체 Probe Run 순차 처리)
       │
       ▼
3. ConceptFidelityAggregator.aggregate() → M1~M13 계산
       │
       ▼
4. concept_fidelity_snapshots 테이블에 스냅샷 저장
       │
       ▼
5. generateAIBrandMRIReport() → Markdown 리포트 생성
       │
       ▼
6. reports 테이블에 발행 (methodology_disclosure 필수 포함)
```

### 2.3 프록시 경고문 (Proxy Caveat) 의무 부착

모든 AI Brand MRI Report에는 다음 프록시 경고문이 **의무적으로** 포함되어야 합니다:

> **프록시 경고**: "All AI/search observation metrics are panel-based proxies under this specific methodology and measurement period. These observed AI/search-like responses and observed answer shares do not constitute true market share, definitive AI ranking, actual AI preference, or guaranteed visibility, and they do not prove consumer preference."

이 경고문은 `observatory.ts`의 `STANDARD_PROXY_CAVEAT` 상수로 관리되며, 리포트 발행 시 자동 포함됩니다.

---

## 3. Baseline vs Intervention 실험 프레임워크

> **구현 위치**: `lib/experiments/experiment-runner.ts` + `lib/experiments/repeated-runner.ts`

### 3.1 실험 설계

TCO-GEO의 핵심 가치는 **"SSoT/Answer Card 개입이 AI 응답 품질을 실제로 개선하는가?"**를 과학적으로 증명하는 것입니다.

```
                 ┌─────────────────┐
                 │  Experiment Run  │
                 └────────┬────────┘
                          │
            ┌─────────────┼─────────────┐
            ▼                           ▼
    ┌───────────────┐          ┌───────────────┐
    │   Baseline    │          │ Intervention  │
    │ Observation   │          │ Observation   │
    │ Run (A)       │          │ Run (B)       │
    └───────┬───────┘          └───────┬───────┘
            │                          │
            ▼                          ▼
    ┌───────────────┐          ┌───────────────┐
    │ 6-Judge       │          │ 6-Judge       │
    │ Pipeline (A)  │          │ Pipeline (B)  │
    └───────┬───────┘          └───────┬───────┘
            │                          │
            ▼                          ▼
    ┌───────────────┐          ┌───────────────┐
    │ Snapshot (A)  │          │ Snapshot (B)  │
    │ M1~M13        │          │ M1~M13        │
    └───────┬───────┘          └───────┬───────┘
            │                          │
            └──────────┬───────────────┘
                       ▼
              ┌─────────────────┐
              │  Comparison     │
              │  Results        │
              │  - Improvements │
              │  - Risk Δ       │
              │  - Drift (M8)   │
              └─────────────────┘
```

### 3.2 비교 결과 구조

`ExperimentRunner.run()` 출력:

| 필드 | 설명 |
|:---|:---|
| `improvements[]` | 각 메트릭별 baseline → intervention 변화 |
| `improvements[].absolute_improvement` | 절대 변화량 |
| `improvements[].relative_improvement` | 상대 변화율 |
| `risk_reduction` | M9 Floor Risk 감소량 |
| `summary` | 자연어 요약 문장 |

### 3.3 비교 분석 메트릭

실험 프레임워크가 추적하는 8개 핵심 메트릭:

| 메트릭 | 개선 방향 | 기대 효과 |
|:---|:---|:---|
| Concept Transfer Rate (M1) | ↑ | Answer Card가 개념 전달률 향상 |
| Citation-Backed Rate (M2) | ↑ | 공식 출처 인용 증가 |
| Brand Concept Fidelity (M3) | ↑ | 의미 충실도 향상 |
| Distortion Rate (M4) | ↓ | 왜곡 감소 |
| Hallucination Rate (M6) | ↓ | 환각 감소 |
| Floor Risk (M9) | ↓ | 최악 응답 리스크 감소 |
| Policy Alignment (M10) | ↑ | 정책 준수율 향상 |
| AEO/GEO Readiness (M13) | ↑ | 종합 준비도 향상 |

### 3.4 실험 해석 가이드

| 시나리오 | 패턴 | 해석 | 후속 조치 |
|:---|:---|:---|:---|
| **성공적 개입** | M1↑, M3↑, M4↓, M13↑ | SSoT/Answer Card 효과 입증 | 패치를 Factory 패턴으로 등록 |
| **부분 개선** | M1↑ but M4↑ | 개념은 전달되나 왜곡 발생 | Vibe Spec 정밀 조정 필요 |
| **역효과** | M1↓ or M9↑ | 개입이 오히려 악화 | 개입 내용 롤백, RCA 분석 |
| **무효과** | M8 ≈ 0 (neutral drift) | 개입의 영향이 없음 | 개입 전략 재설계 |
| **불안정 개선** | M3↑ but M12↑ | 평균은 개선되나 분산 증가 | 추가 반복 관측으로 안정화 확인 |

---

## 4. Closed-Loop 최적화 워크플로우

### 4.1 Fix-It → Measure → Verify 사이클

BSW-OS의 Closed-Loop 최적화는 **측정(Measure) → 진단(Diagnose) → 처방(Fix) → 재측정(Verify)** 사이클로 운영됩니다.

```
┌─────────────────────────────────────────────────────────┐
│                  Closed-Loop Optimization                │
│                                                          │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐          │
│   │ MEASURE  │ →  │ DIAGNOSE │ →  │   FIX    │          │
│   │ (M1~M13) │    │ (MRI)    │    │ (Patch)  │          │
│   └────┬─────┘    └──────────┘    └────┬─────┘          │
│        │                                │                │
│        │         ┌──────────┐          │                │
│        └──────── │  VERIFY  │ ◀────────┘                │
│                  │ (Retest) │                            │
│                  └──────────┘                            │
└─────────────────────────────────────────────────────────┘
```

### 4.2 각 단계별 메트릭 활용

#### Stage 1: MEASURE (측정)
| 활동 | 사용 메트릭 | 구현체 |
|:---|:---|:---|
| Probe Panel 실행 | 전체 (AAS~ARS, M1~M13) | `observatory.ts`, `concept-fidelity.ts` |
| 반복 관측 (N회) | M7, M11, M12 | `repeated-runner.ts` |
| 스냅샷 저장 | M1~M13 전체 | `concept-fidelity-aggregator.ts` |

#### Stage 2: DIAGNOSE (진단)
| 활동 | 사용 메트릭 | 출력 |
|:---|:---|:---|
| AI Brand MRI 생성 | M1~M13, 개별 Judge 결과 | Markdown Report |
| Missing Gap 분석 | M5 (갭 목록) | Answer Card 백로그 |
| Distortion 사례 분석 | M4 (왜곡 목록) | Vibe Spec 조정 제안 |
| Risk 사례 분석 | M9 (리스크 사례) | 긴급 대응 목록 |

#### Stage 3: FIX (처방)
| 활동 | 트리거 메트릭 | Fix-It 액션 |
|:---|:---|:---|
| Answer Card 배포 | M5 gap_severity = critical | 누락 개념에 대한 Answer Card 작성 |
| Vibe Spec 조정 | M4 > 0.10 | 톤/표현 경계 재설정 |
| Brand Truth 보강 | M2 < 0.70 | Evidence 바인딩 추가 |
| 금지 표현 업데이트 | M10 < 0.85 | Policy boundary 확장 |
| Schema JSON-LD 강화 | M1 < 0.70 | 구조화된 데이터 보강 |

#### Stage 4: VERIFY (검증)
| 활동 | 사용 메트릭 | 판정 기준 |
|:---|:---|:---|
| Retest 실행 | Baseline vs Intervention 전체 | M8 drift direction = positive |
| 개선 폭 측정 | absolute_improvement, relative_improvement | 목표 대비 달성률 |
| 회귀 감지 | M9, M4, M6 | 기존 안전 메트릭의 악화 여부 |
| Factory 등록 | M13 등급 변화 | 성공 패치의 재사용 패턴 등록 |

### 4.3 자동화된 메트릭 기반 액션 트리거

| 조건 | 자동 트리거 액션 |
|:---|:---|
| M5에 critical_gap 존재 | Answer Card 백로그에 자동 추가, Fix-It 패치 티켓 생성 |
| M9 > 0.30 | 긴급 리스크 알림 발송, 해당 Probe Run 격리 |
| M4 > 0.15 | Distortion Alert 발행, Vibe Spec 리뷰 요청 |
| M6 > 0.10 | Hallucination Alert 발행, Brand Truth 교차 검증 |
| M13 등급 하락 (예: B→C) | MeaningOps 긴급 회의 트리거 |
| M8 negative drift > 0.05 | 드리프트 알림, 원인 분석 태스크 생성 |

---

## 5. 도메인별 메트릭 적용 사례

### 5.1 K-Beauty 스킨케어: PureBarrier 사례

> **도메인**: 뷰티/화장품 (민감성 스킨케어)  
> **핵심 이슈**: 성분 정보의 정확한 전달 + 과장 광고 방지

**Probe Question 예시**:
- "민감성 피부에 좋은 레티놀 사용법은?"
- "스쿠알란 보습제 순위 추천"
- "피부 장벽 강화에 좋은 성분은?"

**메트릭 진단 시나리오**:

```
┌── 초기 측정 결과 ────────────────────────────────────────┐
│ M1 (Concept Transfer): 0.72 — 레티놀 농도, 사용 빈도는  │
│    전달되나 '민감성 테스트' 개념 누락                      │
│ M2 (Citation-Backed): 0.55 — 공식 임상 결과 인용 부족    │
│ M3 (Brand Fidelity): 0.68 — "일반 보습 브랜드"로 축소    │
│ M4 (Distortion): 0.12 — "세계 최초" 과장 표현 발견       │
│ M5 (Missing Gaps): 2건 — '민감성 테스트', '저자극 인증'  │
│ M6 (Hallucination): 0.08 — "FDA 승인" 미사실 주장        │
│ M9 (Floor Risk): 0.22 — YMYL 위반 응답 존재              │
│ M13 (Readiness): 0.63 — Grade C                          │
└───────────────────────────────────────────────────────────┘

┌── Fix-It 처방 ───────────────────────────────────────────┐
│ 1. Answer Card 추가: '민감성 테스트' + '저자극 인증'     │
│ 2. Brand Truth Evidence 보강: 임상 시험 결과 링크        │
│ 3. Vibe Spec 조정: '세계 최초' → '국내 최초' 경계 설정   │
│ 4. Policy 업데이트: FDA 관련 주장 금지 규칙 추가         │
└───────────────────────────────────────────────────────────┘

┌── Intervention 후 재측정 ────────────────────────────────┐
│ M1: 0.72 → 0.89 (+23.6%)  ✓                             │
│ M2: 0.55 → 0.82 (+49.1%)  ✓                             │
│ M3: 0.68 → 0.85 (+25.0%)  ✓                             │
│ M4: 0.12 → 0.04 (-66.7%)  ✓                             │
│ M5: 2건 → 0건             ✓                             │
│ M6: 0.08 → 0.02 (-75.0%)  ✓                             │
│ M9: 0.22 → 0.08 (-63.6%)  ✓                             │
│ M13: 0.63 → 0.84 (C → B)  ✓                             │
│ M8 Drift: 0.15 (positive) ✓                             │
└───────────────────────────────────────────────────────────┘
```

---

### 5.2 편의점 리테일: Quick25 사례

> **도메인**: 편의점/리테일 (실시간 재고·지역 정보)  
> **핵심 이슈**: 지역 정보 정확성 + 재고 가용성 신뢰

**핵심 메트릭 포커스**: M1 (상품 정보 전달), M4 (가격/재고 왜곡), QTC (지역 질문 커버리지)

**시나리오**:
| 단계 | 활동 | 측정 결과 |
|:---|:---|:---|
| Baseline | "근처 편의점 도시락 추천" 20문항 관측 | M1=0.65, QTC=55% |
| 진단 | LocalBusiness Schema 미적용, 재고 정보 누락 | M5: 3건 (가격대, 영양정보, 매장위치) |
| 처방 | LocalBusiness JSON-LD + Answer Card 배포 | — |
| 검증 | Intervention 관측 | M1=0.82, QTC=78%, M8=positive |

---

### 5.3 웨딩 서비스: Lumiere Hall 사례

> **도메인**: 웨딩/이벤트 (패키지 비교·계약 정보)  
> **핵심 이슈**: 패키지 조건의 정확한 비교 + 계약 관련 YMYL 안전성

**핵심 메트릭 포커스**: M3 (패키지 정보 충실도), M9 (계약 관련 리스크), M10 (비교 공정성 정책)

**시나리오**:
```
질문: "웨딩홀 패키지 계약 전 확인 조건"

Baseline 측정:
  M3 = 0.71 — 패키지 가격은 전달되나 위약금 조건 누락
  M4 = 0.09 — "전액 환불 가능" 과장 (실제: 위약금 존재)
  M9 = 0.18 — 계약 조건 오해 유발 응답 존재
  M10 = 0.82 — 비교 표현 중 편향적 추천 발견

Fix-It 처방:
  1. 위약금 조건 Answer Card 추가
  2. Vibe Spec: "전액 환불" 금지 표현 등록
  3. 비교 공정성 정책 강화

Intervention 후:
  M3 = 0.88, M4 = 0.03, M9 = 0.06, M10 = 0.95
  M13: C(0.68) → B(0.82) 등급 상승
```

---

## 6. SBS Index 통합 대시보드 구성

> **구현 위치**: `lib/sbs-index/index-runner.ts` → `SbsIndexRunner.generateReport()`

### 6.1 대시보드 레이아웃

```
┌────────────────────────────────────────────────────────────────┐
│                    SBS Index Dashboard                         │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │   KAIVI     │  │    AITI     │  │   M13       │           │
│  │   72.45     │  │    85.00    │  │  Grade: B   │           │
│  │  AI 가시성   │  │  AI 신뢰    │  │  AEO 준비도  │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
│                                                                │
│  ┌─────────────────────────────────────────────────┐          │
│  │         TCO-GEO Concept Fidelity Radar          │          │
│  │                                                  │          │
│  │              M1 (0.89)                           │          │
│  │         M10 /          \ M2                      │          │
│  │       (0.95)            (0.82)                   │          │
│  │        M9 |              | M3                    │          │
│  │      (0.08)              (0.85)                  │          │
│  │        M7 \              / M4                    │          │
│  │       (0.91)            (0.04)                   │          │
│  │              M6 (0.02)                           │          │
│  └─────────────────────────────────────────────────┘          │
│                                                                │
│  ┌─────────────────────────────────────────────────┐          │
│  │     Industry AI Power Ranking (AIPR)            │          │
│  │                                                  │          │
│  │  #1 PureBarrier    BAIR: 113.41  ████████████   │          │
│  │  #2 레티놀랩        BAIR:  89.22  █████████     │          │
│  │  #3 더마뷰티        BAIR:  76.55  ███████       │          │
│  │  #4 민감장벽        BAIR:  68.30  ██████        │          │
│  └─────────────────────────────────────────────────┘          │
│                                                                │
│  ┌─────────────────────────────────────────────────┐          │
│  │              MRI Sub-Index Summary               │          │
│  │                                                  │          │
│  │  OPS-MRI ████████░░  45.00                       │          │
│  │  B-MRI   ██████████  78.50                       │          │
│  │  D-MRI   ████████░░  65.20                       │          │
│  │  P-MRI   ██████░░░░  25.00                       │          │
│  │  V-MRI   █████████░  87.60                       │          │
│  │  S-MRI   ████████░░  52.30                       │          │
│  └─────────────────────────────────────────────────┘          │
└────────────────────────────────────────────────────────────────┘
```

### 6.2 SBS Index Report 데이터 구조

`SbsIndexReport` 인터페이스:

| 필드 | 타입 | 설명 |
|:---|:---|:---|
| `kaivi` | number | Korea AI Visibility Index (0~100) |
| `aiti` | number | AI Trust Index (0~100) |
| `industryRankings` | IndustryAiprResult[] | 산업별 AIPR 순위 |
| `conceptFidelity` | object \| undefined | 최신 TCO-GEO 스냅샷 (M1~M13) |
| `timestamp` | string | ISO 타임스탬프 |

---

## 7. 메트릭 기반 의사결정 매트릭스

### 7.1 긴급도-영향도 매트릭스

메트릭 이상 징후 발생 시, 다음 매트릭스에 따라 대응 우선순위를 결정합니다.

| | 높은 영향 (비즈니스 직결) | 낮은 영향 (품질 개선) |
|:---|:---|:---|
| **긴급** (즉시 대응) | M9 > 0.30 (리스크 위험)<br/>M6 > 0.10 (환각 경고)<br/>M13 등급 하락 | M4 > 0.15 (왜곡 증가)<br/>M10 < 0.80 (정책 위반) |
| **계획** (주간/월간) | M1 < 0.70 (전달률 부족)<br/>M3 < 0.75 (충실도 미달)<br/>BAIR 경쟁사 대비 하락 | M5 moderate_gap 발생<br/>M7 < 0.80 (안정성 저하)<br/>M12 > 0.20 (분산 증가) |

### 7.2 메트릭 조합별 진단 패턴

| 패턴 | 메트릭 조합 | 진단 | 처방 |
|:---|:---|:---|:---|
| **존재하나 왜곡** | M1↑ + M4↑ | 개념은 전달되나 변형됨 | Vibe Spec 경계 강화 |
| **정확하나 불안정** | M3↑ + M12↑ | 품질은 좋으나 일관성 부족 | 반복 관측 확대, Schema 보강 |
| **안전하나 미노출** | M9↓ + AAS↓ | 안전하지만 AI에서 보이지 않음 | Answer Card 배포 확대 |
| **노출되나 무근거** | AAS↑ + M2↓ | 언급되나 출처 미인용 | Evidence Binding 보강 |
| **전반적 악화** | M13↓ + M8 negative | 복수 차원 동시 하락 | 긴급 MeaningOps 리뷰 |
| **개입 역효과** | M8 positive but M9↑ | 개선되었으나 리스크 증가 | 안전성 우선 롤백 |

---

## 8. 월간 MeaningOps 운영 모델

### 8.1 월간 관측 사이클

```
┌─── Week 1: OBSERVE ──────────────────────────────────────┐
│ • Probe Panel 실행 (500 질문 × 5 AI 엔진)               │
│ • 6-Judge Pipeline 처리                                   │
│ • M1~M13 스냅샷 생성                                      │
│ • AI Brand MRI Report 자동 발행                           │
└──────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─── Week 2: ANALYZE ─────────────────────────────────────┐
│ • 전월 대비 M8 드리프트 분석                              │
│ • M5 Missing Gap 신규 발생 리뷰                          │
│ • M4/M6 왜곡·환각 사례 분류                              │
│ • AIPR 경쟁사 순위 변동 분석                             │
└──────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─── Week 3: FIX ─────────────────────────────────────────┐
│ • Answer Card 백로그 처리 (M5 기반)                      │
│ • Brand Truth Evidence 갱신 (M2 기반)                    │
│ • Vibe Spec 미세 조정 (M4 기반)                          │
│ • Policy Boundary 업데이트 (M10 기반)                    │
└──────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─── Week 4: VERIFY ──────────────────────────────────────┐
│ • Baseline vs Intervention 실험 실행                     │
│ • 개선 효과 정량 검증                                     │
│ • 성공 패치 → Factory 패턴 등록                          │
│ • 다음 월 관측 Probe Panel 업데이트                      │
└──────────────────────────────────────────────────────────┘
```

### 8.2 월간 KPI 대시보드 항목

| KPI | 목표 | 측정 주기 | 담당 |
|:---|:---|:---|:---|
| M13 AEO/GEO Readiness 등급 | B 이상 유지 | 월간 | 브랜드 전략가 |
| M9 Floor Risk | ≤ 0.10 | 월간 | 리스크 관리자 |
| M5 Critical Gap 건수 | 0건 | 월간 | 콘텐츠 매니저 |
| BAIR 산업 내 순위 | Top 2 | 월간 | CMO |
| M8 Drift Direction | Positive 또는 Neutral | 월간 | 데이터 분석가 |
| Fix-It 패치 성공률 | ≥ 80% | 월간 | AEO 전문가 |

---

## 9. 비용 구조 및 ROI 분석

### 9.1 측정 비용 구조

**1회 전체 측정 = 500 Probe × 5 Judge/Probe = 2,500 LLM 호출**

| 비용 항목 | 단가 (예상) | 500 Probe 기준 |
|:---|:---|:---|
| Judge 1 (ConceptExtractor) | ~$0.05/호출 | $25.00 |
| Judge 2 (Fidelity) | ~$0.03/호출 | $15.00 |
| Judge 3 (Distortion) | ~$0.03/호출 | $15.00 |
| Judge 4 (Hallucination) | ~$0.03/호출 | $15.00 |
| Judge 5 (Risk) | ~$0.02/호출 | $10.00 |
| Judge 6 (Policy) | ~$0.02/호출 | $10.00 |
| **1회 측정 총비용** | | **~$90.00** |
| 반복 관측 (3회) | ×3 | ~$270.00 |
| 월간 비용 (1회 측정 + 1회 실험) | ×2 | ~$180.00 |

### 9.2 ROI 분석 프레임워크

| ROI 차원 | 측정 방법 | 예상 효과 |
|:---|:---|:---|
| **AI 노출 증가** | SWEL × 기존 트래픽 × 전환율 | SWEL 1.12 = 12% 추가 노출 |
| **브랜드 리스크 감소** | M9 감소분 × 법적 비용 회피 | YMYL 분야 리스크 60% 감소 |
| **콘텐츠 효율화** | M5 갭 자동 식별 → 수동 분석 절감 | 월 20시간 분석 시간 절감 |
| **경쟁 우위** | AIPR 순위 변동 | 산업 내 AI 검색 1위 확보 |
| **의사결정 속도** | MRI 리포트 자동 생성 | 의사결정 사이클 50% 단축 |

---

## 10. 메트릭 진단 체크리스트

브랜드 AEO/GEO 건강 상태를 빠르게 진단하기 위한 체크리스트입니다.

### 10.1 기본 건강 체크

- [ ] **M13 ≥ 0.70** (B등급 이상)  
  → 미달 시: 아래 세부 진단 진행

- [ ] **M1 ≥ 0.80** (핵심 개념 80% 이상 전달)  
  → 미달 시: Answer Card 배포 우선

- [ ] **M2 ≥ 0.70** (인용 70% 이상 검증)  
  → 미달 시: Brand Truth Evidence 보강

- [ ] **M3 ≥ 0.80** (충실도 80% 이상)  
  → 미달 시: Vibe Spec + SSoT 재정비

### 10.2 안전성 체크

- [ ] **M4 ≤ 0.10** (왜곡률 10% 이하)  
  → 초과 시: Distortion 유형별 대응

- [ ] **M6 ≤ 0.05** (환각률 5% 이하)  
  → 초과 시: 즉시 Brand Truth 교차 검증

- [ ] **M9 ≤ 0.15** (바닥 리스크 15% 이하)  
  → 초과 시: YMYL 응답 격리 및 Fix-It 긴급 패치

- [ ] **M10 ≥ 0.85** (정책 준수 85% 이상)  
  → 미달 시: Policy Boundary 확장

### 10.3 안정성 체크

- [ ] **M7 ≥ 0.80** (끌개 안정성 80% 이상)  
  → 미달 시: 반복 관측 확대 (N=5 이상)

- [ ] **M11 ≥ 0.80** (합의 점수 80% 이상)  
  → 미달 시: 개념 구조 강화 (Schema JSON-LD)

- [ ] **M12 ≤ 0.20** (분산 0.20 이하)  
  → 초과 시: 불안정 개념 식별 및 Answer Card 보강

- [ ] **M8 direction ≠ negative** (드리프트 방향 비부정)  
  → negative 시: 원인 분석 및 긴급 대응

### 10.4 경쟁력 체크

- [ ] **BAIR > 산업 Top 3 평균**  
  → 미달 시: AIPR 경쟁사 분석, SSoT 차별화

- [ ] **KAIVI > 70**  
  → 미달 시: 전 산업 Brand Truth 완성도 제고

- [ ] **AAS > 50%**  
  → 미달 시: 기본적인 AI 존재감 확보 우선

---

## 부록: 메트릭 요약 일람표

| ID | 메트릭명 | 한국어명 | 범위 | 방향 | 계층 |
|:---|:---|:---|:---|:---|:---|
| AAS | AI Answer Share | AI 응답 점유율 | 0~100 | ↑ | Legacy |
| OCR | Official Citation Rate | 공식 인용률 | 0~100 | ↑ | Legacy |
| BSF | Brand Semantic Fidelity | 브랜드 의미 충실도 | 0~100 | ↑ | Legacy |
| QTC | Question Territory Coverage | 질문 영역 커버리지 | 0~100 | ↑ | Legacy |
| GCTR | GEO Concept Transfer Rate | GEO 개념 전달률 | 0~100 | ↑ | Legacy |
| ARS | AEO Readiness Score | AEO 준비 점수 | 0~100 | ↑ | Legacy |
| SWEL | Semantic Website Exposure Lift | 시맨틱 노출 증가율 | 0~∞ | ↑ | Legacy |
| M1 | Concept Transfer Rate | 개념 전달률 | 0~1.0 | ↑ | TCO-GEO |
| M2 | Citation-Backed Rate | 인용 검증률 | 0~1.0 | ↑ | TCO-GEO |
| M3 | Brand Concept Fidelity | 브랜드 개념 충실도 | 0~1.0 | ↑ | TCO-GEO |
| M4 | Concept Distortion Rate | 개념 왜곡률 | 0~1.0 | ↓ | TCO-GEO |
| M5 | Missing Concept Gap Count | 누락 개념 갭 수 | 0~N | ↓ | TCO-GEO |
| M6 | Hallucinated Concept Rate | 환각 개념률 | 0~1.0 | ↓ | TCO-GEO |
| M7 | Attractor Stability | 끌개 안정성 | 0~1.0 | ↑ | TCO-GEO |
| M8 | Drift Score | 드리프트 점수 | 0~1.0 | context | TCO-GEO |
| M9 | Floor Risk | 바닥 리스크 | 0~1.0 | ↓ | TCO-GEO |
| M10 | Policy Alignment | 정책 정합성 | 0~1.0 | ↑ | TCO-GEO |
| M11 | Consensus Score | 합의 점수 | 0~1.0 | ↑ | TCO-GEO |
| M12 | Variance Score | 분산 점수 | 0~∞ | ↓ | TCO-GEO |
| M13 | AEO/GEO Readiness | AEO/GEO 준비도 | 0~1.0 | ↑ | TCO-GEO |
| BAIR | Brand AI Reputation Index | 브랜드 AI 평판 지수 | 0~∞ | ↑ | Composite |
| AITI | AI Trust Index | AI 신뢰 지수 | 0~100 | ↑ | Composite |
| AIPR | AI Power Ranking | AI 파워 랭킹 | Rank | ↑ | Composite |
| KAIVI | Korea AI Visibility Index | 한국 AI 가시성 지수 | 0~100 | ↑ | Composite |

---

> **참고 문서**:
> - [Part 1: Foundation & Definitions](./BSW_Metrics_Guide_Part1_Foundation.md) — 메트릭 정의 및 측정 방법론
> - [TCO-GEO Metrics SOP](./tco_geo_metrics_sop_repo.md) — 원본 SOP 레퍼런스
> - [BSW-OS QIS System Guide](./BSW-OS_QIS_SYSTEM_GUIDE.md) — 질문 수집/정제/예측 시스템
> - [LLM Reference Guide](./LLM_REFERENCE_B_MRI_D_MRI_PROBE_OBSERVATORY.md) — B-MRI/D-MRI 상세
