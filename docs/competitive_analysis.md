# BSW-OS vs 업계 현황 — 경쟁 우위 & Unfair Advantage 분석

> **Version:** v1.0  
> **Date:** 2026-07-03  
> **Scope:** BSW-OS 지표 체계 × 업계 AI Visibility 현황 비교 분석  
> **분석 프레임:** Competitive Advantage → Unfair Advantage → Differentiation Strategy

---

## Executive Summary

BSW-OS는 업계 표준 지표(Answer Share, Citation Rate, Sentiment)를 **모두 포괄하면서도**, 업계 어디에도 없는 **3가지 Unfair Advantage**를 보유하고 있습니다:

1. **엔티티 레벨 측정 (AEPI)** — 키워드가 아닌 "브랜드의 핵심 정보가 AI에 얼마나 정확히 반영되는가"를 7차원 × 28업종으로 측정
2. **질문 레이어별 전략 분해 (Per-Layer)** — IRI/BDR/CWR/OPP로 "어디서 이기고 어디서 지는지"를 즉시 식별
3. **의미론적 폐쇄 루프 (Semantic Closed Loop)** — 측정 → 진단 → 처방 → 실행 → 재측정이 하나의 OS 내에서 완결

반면, **전환 지표(Conversion Metrics)**와 **Earned/Community 소스 분석**은 업계 대비 보완이 필요합니다.

---

## 1. 지표별 정밀 비교 — BSW-OS vs 업계 표준

### 1.1 기본 노출 지표

| 업계 표준 지표 | 대표 도구 | BSW-OS 대응 | 대응 수준 | BSW-OS 차별점 |
|:---|:---|:---|:---:|:---|
| **Brand Mention Rate** | Profound, AthenaHQ | **BSF** (BAIR 35% 컴포넌트) | ✅ 완전 대응 | 3단계 가중 감성 분류 포함 (binary 아님) |
| **Citation Rate** | Profound, Otterly | **OCR** (BAIR 20% 컴포넌트) | ✅ 완전 대응 | inline/footer 인용 위치 구분 |
| **Recommendation Inclusion Rate** | — | **IRI + BSF** 복합 | ✅ 대응 | 레이어별 분리 측정 (추천 질문 vs 일반 질문) |
| **Top-N Presence** | — | **CWR** (비교 질문 1위 판정) | ⚠️ 부분 대응 | 1위 여부만 측정, Top-3/Top-5 분해는 미구현 |
| **Share of AI Voice** | Profound | **BSF** = Answer Share | ✅ 완전 대응 | 경쟁사 동시 측정으로 상대 점유율 자동 산출 |

> [!TIP]
> **Top-N Presence** 확장이 필요합니다. 현재 CWR은 "1위 언급"만 판정하는데, 응답 텍스트에서 등장 순서를 파싱하여 Top-3/Top-5 포지션도 산출하면 업계 표준과 완전 일치합니다.

---

### 1.2 품질 지표

| 업계 표준 지표 | BSW-OS 대응 | 대응 수준 | BSW-OS 차별점 |
|:---|:---|:---:|:---|
| **Entity Accuracy** | **AEPI** (7차원 반영도) | ✅✅ **초과 대응** | 업계 유일 — 4단계 분류(Exact/Partial/Distorted/Absent) × 7차원 × 28업종 |
| **Positioning Accuracy** | **AEPI Authority 차원** + **Truth Studio** | ✅ 대응 | 브랜드 포지셔닝을 "운영 진실(Operational Truth)"로 등록 후 AI 반영 여부 검증 |
| **Sentiment / Tone** | **AAS_w** (80자 컨텍스트 윈도우) | ✅ 대응 | 문맥 기반 3단계 (Strong/Neutral/Negative) — 단순 감성 binary보다 정밀 |
| **Claim Fidelity** | **Truth Studio** (Evidence Gate) | ✅✅ **초과 대응** | AI 응답 주장 vs 등록된 검증 클레임 대조 — 자동 Drift 감지 |
| **Freshness** | ⚠️ 부분 대응 | ⚠️ | cron 기반 주기 측정은 있으나, 최신 정보 반영도를 독립 지표로 분리 측정하지는 않음 |

> [!IMPORTANT]
> **Claim Fidelity는 BSW-OS의 가장 강력한 차별점 중 하나입니다.** 업계의 다른 도구들은 "AI가 브랜드를 언급했는가"만 측정하지만, BSW-OS는 Truth Studio에서 **"AI가 말한 내용이 브랜드의 공식 입장과 일치하는가"**까지 검증합니다. 이는 업계 보고서가 지적한 "AI 인용의 11% 부정확" 문제를 직접 해결합니다.

---

### 1.3 전환 지표

| 업계 표준 지표 | BSW-OS 대응 | 대응 수준 | 비고 |
|:---|:---|:---:|:---|
| **AI-referred Visits** | ❌ 미구현 | ❌ | 외부 애널리틱스(GA4 등) 연동 필요 |
| **Branded Search Lift** | ❌ 미구현 | ❌ | Search Console API 연동 필요 |
| **CTA Clicks** | ❌ 미구현 | ❌ | 웹사이트 이벤트 추적 필요 |
| **Lead / Purchase Attribution** | ❌ 미구현 | ❌ | CRM/전환 추적 연동 필요 |

> [!WARNING]
> **전환 지표는 현재 BSW-OS의 최대 Gap입니다.** 다만 이것은 의도된 설계입니다 — BSW-OS는 "AI가 브랜드를 어떻게 말하는가"(Visibility Layer)에 집중하며, 전환 추적은 GA4/CRM 등 기존 도구의 영역입니다. 그러나 Google이 2026년 6월 Search Console에 AI 기능 전용 리포트를 도입한 만큼, **Search Console API 연동**을 우선 검토할 필요가 있습니다.

---

## 2. 경쟁 우위 (Competitive Advantage) — 업계보다 잘하는 것

### 2.1 다차원 복합 지표 체계

```
업계 일반:                      BSW-OS:
                                
┌─────────────┐                ┌──────────────────────────────────┐
│ Answer Share │                │           KAIVI (종합)           │
│ Citation Rate│                │  ┌────┬────┬────────┬────┐      │
│ Sentiment   │                │  │BAIR│AEPI│PerLayer│MRI │      │
│ (단일 레벨) │                │  │5컴포│7차원│IRI/BDR │12서│      │
└─────────────┘                │  │넌트 │×28  │CWR/OPP│브  │      │
                               │  └────┴────┴────────┴────┘      │
                               └──────────────────────────────────┘
```

| 비교 항목 | 업계 일반 | BSW-OS |
|:---|:---|:---|
| 지표 계층 | 1층 (플랫 리스트) | **3층** (기반-전략-종합) |
| 지표 수 | 3~5개 | **15개 이상** (KAIVI/BAIR/AEPI/BSF/AAS/OCR/SWEL/MQ/IRI/BDR/CWR/OPP/S-MRI/VPA 등) |
| 분해 가능성 | 없음 (단일 점수) | **항상 breakdown 제공** — KAIVI → BAIR → BSF/AAS/OCR/SWEL/MQ |
| 업종 특화 | 없거나 수동 설정 | **28업종 × 7차원 자동 가중치** |
| 투명성 | 점수만 제공 | **isEstimated 플래그 + Proxy Caveat** |

---

### 2.2 측정 방법론의 과학성

| 방법론 요소 | Profound/AthenaHQ 등 | BSW-OS |
|:---|:---|:---|
| **프로브 설계** | 단순 키워드 프롬프트 | **7-Layer 의도 분류** (L1 Universal ~ L7 Brand) |
| **편향 방지** | 미공개 | **Fair Probe Set Builder** — 브랜드별 동일 횟수 보장 |
| **Goldilocks Sampling** | 없음 | **L1/L3/L5/L6(50%) + L2(25%) + L7(25%)** 균형 배분 |
| **다국어 처리** | 기본적 | **한국어 substring + 영어 word boundary 이중 매칭** |
| **감성 분류** | Binary (pos/neg) | **3단계 가중 (Strong 1.0 / Neutral 0.3 / Negative 0.0)** |
| **통계 보장** | 미명시 | **Confidence Penalty + Volatility Penalty + 이동 평균** |
| **학술 기반** | 미인용 | **Robertson(1977), Jaccard(1912), Fuhr(2008)** 명시 인용 |

> [!TIP]
> **학술 인용과 이론적 기반 명시**는 투자자 IR 및 B2B 엔터프라이즈 세일즈에서 매우 강력한 차별점입니다. Profound, Otterly 등의 경쟁사들은 "자체 알고리즘"이라고만 표기하지, 정보 검색 이론과의 정합성을 공개하지 않습니다.

---

### 2.3 업종 특화 (Industry-Adaptive)

```
                업계 일반              BSW-OS
               ┌──────┐         ┌───────────────────┐
               │ 범용  │         │ 5 매크로 카테고리  │
               │ 설정  │         │  × 28 세부업종    │
               │      │         │  × 7 차원 가중치   │
               └──────┘         │  = 980 가중치 셀   │
                                └───────────────────┘
```

| 업종 | 핵심 차원 (BSW-OS 가중치 예시) | 업계 일반 도구 |
|:---|:---|:---|
| 스킨케어(D2C) | Comparative **25%** > Factoid 20% | 차별화 없음 |
| 웨딩(지역) | Local/Geo **30%** > Procedural 20% | 차별화 없음 |
| 법률(YMYL) | Authority **30%** > E-E-A-T 30% | 차별화 없음 |
| IT/SaaS(B2B) | Content **35%** > Comparative 20% | 차별화 없음 |

> 이것은 Lantern이 "이커머스 특화"로 피벗한 것과 같은 방향이지만, BSW-OS는 **28개 업종을 동시에 커버하는 프레임워크**를 이미 보유하고 있습니다.

---

## 3. Unfair Advantage — 업계에 아예 없는 것

### 🏆 Unfair Advantage #1: AEPI (AI Entity Presence Index)

> **"AI가 당신의 브랜드 핵심 정보를 얼마나 정확하게 알고 있는가"**

| 차별화 요소 | 설명 |
|:---|:---|
| **측정 대상** | 키워드 언급이 아닌, **브랜드의 핵심 엔티티**(제품·서비스·전문성·위치)가 AI에 반영되는 정도 |
| **4단계 반영도** | Exact(1.0) / Partial(0.6) / Distorted(0.2) / Absent(0.0) — 업계는 Binary(언급 여부)만 측정 |
| **2단계 동적 가중치** | Layer 1(5매크로) × Layer 2(28업종×7차원) — **980개 가중치 셀** |
| **Input-side 관점** | 업계는 Output(AI가 뭐라고 했나)만 측정 → BSW-OS는 Input(AI가 뭘 알고 있나)까지 측정 |

**왜 이것이 Unfair Advantage인가:**
- Profound, AthenaHQ, Otterly 모두 "브랜드가 언급되었는가(Mention)"를 측정합니다
- BSW-OS는 "브랜드의 **어떤 정보가** 어떤 **정확도로** 반영되었는가"를 측정합니다
- 이는 "브랜드가 언급되었지만 핵심 차별점은 왜곡되었다"는 시나리오를 잡아내는 유일한 방법입니다
- 업계 보고서가 지적한 **"11% 부정확 인용"** 문제의 직접적 해법입니다

---

### 🏆 Unfair Advantage #2: Per-Layer Strategic Decomposition

> **"어디서 이기고 어디서 지는지를 즉시 식별"**

```
업계 일반:                       BSW-OS:
                                
  Answer Share: 72%              IRI: 85% (업종 일반 ✅)
  (하나의 숫자)                  BDR: 45% (브랜드 방어 ⚠️)
                                 CWR: 72% (경쟁 승리 ✅)
                                 OPP: 15% (기회 공간 📍)
                                 
  → "좋아졌다"                   → "브랜드 방어가 약하다.
                                    AI에 자사 이름을 물어봐도
                                    절반에서 못 답한다."
```

| 지표 | 즉각 전략 액션 |
|:---|:---|
| IRI 높음 + OPP 낮음 | Red Ocean — CWR 향상에 집중 |
| IRI 낮음 + OPP 높음 | Blue Ocean — 선점 콘텐츠 투자 |
| BDR 낮음 | AI가 자사 브랜드를 모름 — L7 콘텐츠 집중 |
| CWR 낮음 | 비교에서 밀림 — 비교 콘텐츠 강화 |

**왜 이것이 Unfair Advantage인가:**
- 업계 도구들은 "Share of Voice가 올라갔다/내려갔다"만 알려줌
- BSW-OS는 "일반 질문에서는 잘 나오지만, **자사 브랜드를 직접 물어보면 방어가 안 된다**"처럼 **즉각적 전략 액션으로 연결**되는 진단을 제공
- 이것은 IRI + OPP = 100% (MECE 완전 분해)라는 수학적 속성으로 보장

---

### 🏆 Unfair Advantage #3: Semantic Closed Loop (의미론적 폐쇄 루프)

> **"측정 → 진단 → 처방 → 실행 → 재측정이 하나의 OS에서 완결"**

```
    ┌──────────────────────────────────────────────┐
    │              BSW-OS Closed Loop               │
    │                                              │
    │   1. 측정     Observatory / Benchmark        │
    │      ↓        (BAIR, AEPI, Per-Layer)         │
    │   2. 진단     Industry Report / Deep Dive     │
    │      ↓        (4사분면, 레이더, 시계열)        │
    │   3. 처방     Fix-It Studio                  │
    │      ↓        (RCA → 패치 → 리테스트)         │
    │   4. 실행     Surface Contracts + Website     │
    │      ↓        (Answer Surface 자동 생성)      │
    │   5. 검증     Release Gate + Truth Studio     │
    │      ↓        (Claim Fidelity 검증)           │
    │   6. 재측정   ─── 1번으로 ──────────────→      │
    └──────────────────────────────────────────────┘
```

**업계 비교:**

| 기능 | Profound | AthenaHQ | Lantern | BSW-OS |
|:---|:---:|:---:|:---:|:---:|
| 모니터링 | ✅ | ✅ | ✅ | ✅ |
| 경쟁 분석 | ✅ | ✅ | ⚠️ | ✅ |
| 콘텐츠 추천 | ✅ | ⚠️ | ✅ | ✅ |
| **콘텐츠 생성** | ❌ | ❌ | ❌ | ✅ (Website Factory) |
| **구조화 데이터 생성** | ❌ | ❌ | ❌ | ✅ (Surface Contracts) |
| **클레임 검증** | ❌ | ❌ | ❌ | ✅ (Truth Studio) |
| **Fix-It 루프** | ❌ | ❌ | ❌ | ✅ (RCA → Patch → Retest) |
| **Release Gate** | ❌ | ❌ | ❌ | ✅ (Proxy Caveat 통제) |

**왜 이것이 Unfair Advantage인가:**
- 경쟁사들은 **"측정 → 리포트"**에서 멈춤 — "개선해야 할 콘텐츠 추천"까지가 한계
- BSW-OS는 **"측정 → 진단 → 처방 → 실행(콘텐츠·스키마 생성) → 검증 → 재측정"**이 하나의 플랫폼에서 완결
- 고객 입장에서 "어디가 문제인지 아는 것"과 "문제를 고치는 것"의 차이 — BSW-OS는 후자까지 커버

---

## 4. BSW-OS 고유 기능 — 업계에 대응물이 없는 것

### 4.1 개념적 프레임워크

| BSW-OS 고유 기능 | 설명 | 업계 대응물 |
|:---|:---|:---|
| **Truth Studio** | 브랜드의 "운영 진실"을 등록하고, AI 응답과의 Delta(괴리)를 자동 감지 | **없음** |
| **Semantic Core** (QIS 3축) | 질문 자산(Question Inventory)을 주제·의도·단계별로 3축 관리 | **없음** — 업계는 "프롬프트 목록"만 관리 |
| **Surface Contracts** | AI가 인용하기 좋은 Answer Surface의 구조를 계약(Contract)으로 정의 | **없음** — 업계 방법론에서 "Answer Surface를 만든다"고 권장하지만 시스템화한 도구는 없음 |
| **Golden Reference** | 업종별 "AI가 이상적으로 답해야 하는 참조 응답"을 정의 | **없음** |
| **Persona Spec** | AI 검색 사용자 페르소나를 파라메트릭하게 정의하고 프로브에 반영 | **없음** |
| **K-Culture Intelligence** | 한국 문화 어트랙터 맵 — 한류·K-뷰티 등 문화 컨텍스트 활용 | **없음** |
| **KAIVI** | 국가 수준 AI 가시성 종합 지수 (4원 복합) | **없음** — 업계의 "AI Visibility Score"는 단일 원천 |
| **S-MRI / OPS-MRI** | 시맨틱 건전성 / 운영 진단 지수 — 데이터 자산 성숙도 | **없음** |

---

### 4.2 방법론적 혁신

| 혁신 요소 | 설명 | 업계 대비 의미 |
|:---|:---|:---|
| **Fair Probe Set Builder** | 모든 브랜드에 동일 횟수의 L2/L7 질문을 보장하는 알고리즘 | 업계 도구들의 측정 편향 문제를 구조적으로 해결 |
| **7-Layer 질문 분류** | L1(Universal)~L7(Brand)로 의도를 체계 분류 | 업계의 "프롬프트 포트폴리오"를 시스템화 |
| **2단계 동적 가중치** | 매크로 BM 가중치 × 세부업종 서피스 가중치 | 하나의 모델로 28개 업종 커버 |
| **Proxy Caveat Gate** | 모든 공개 발표에 프록시 측정 고지를 강제 | 업계 보고서가 경고한 "AI 1위 보장" 과장 방지를 시스템화 |

---

## 5. Gap 분석 — 업계 대비 보완이 필요한 영역

### 5.1 Critical Gap

| Gap | 업계 현황 | BSW-OS 현황 | 영향도 | 개선 방향 |
|:---|:---|:---|:---:|:---|
| **전환 지표** | GA4 AI 리포트, Search Console AI 전용 뷰 | 미구현 | 🔴 높음 | Search Console API 연동 → AI-referred visits 자동 추적 |
| **Freshness 지표** | 최신 정보 반영도 측정 | 주기 측정은 있으나 독립 지표 부재 | 🟡 중간 | 이전 스냅샷 대비 정보 변경 감지 → Freshness Score 분리 |
| **Top-N 포지션** | Top-3/Top-5 분석 | CWR(1위 여부)만 측정 | 🟡 중간 | 응답 내 등장 순서 파싱 → Top-3/Top-5 포지션 지표 추가 |

### 5.2 Strategic Gap

| Gap | 업계 현황 | BSW-OS 현황 | 영향도 | 개선 방향 |
|:---|:---|:---|:---:|:---|
| **Earned/Community 소스** | Reddit, YouTube, 블로그, 포럼 언급 추적 | Owned Media 중심 | 🟡 중간 | 향후 로드맵 — 외부 소스 모니터링 모듈 |
| **Platform 데이터** | GBP, Merchant Center, 지도/예약 | 미연동 | 🟡 중간 | 로컬 비즈니스 업종에서 GBP 연동 검토 |
| **실시간 모니터링** | 일부 도구가 지원 | cron 기반 배치 | 🟢 낮음 | 현재 배치 방식이 과학적으로 더 신뢰성 높음 (분포 측정 원칙에 부합) |

> [!NOTE]
> **실시간 모니터링이 낮은 우선순위인 이유:** 업계 연구도 "AI 검색 가시성은 한 번의 관측으로 판단하면 안 되며, **반복 측정을 통해 분포로 평가**해야 한다"고 지적합니다. BSW-OS의 cron 기반 배치 + 이동 평균 방식은 이 원칙에 정확히 부합합니다.

---

## 6. 차별화 전략 — 경쟁 포지셔닝

### 6.1 시장 포지셔닝 맵

```
                    측정 깊이 (Metric Depth)
                    ↑
                    │
         BSW-OS ●───┤  ← 가장 깊은 측정 + 실행까지 커버
                    │     (AEPI 7×28, Per-Layer, Closed Loop)
                    │
    Profound  ●─────┤  ← 넓은 측정, 실행 없음
    AthenaHQ  ●─────┤
                    │
    Lantern   ●─────┤  ← 이커머스 특화, 얕은 측정
                    │
    ────────────────┼──────────────────→ 실행 커버리지
                    │                    (Execution Coverage)
                    │
```

### 6.2 차별화 메시지 프레임워크

**경쟁사 대비 포지셔닝:**

| 경쟁사 유형 | 그들의 포지션 | BSW-OS의 차별화 |
|:---|:---|:---|
| **Profound/AthenaHQ** | "AI에서 브랜드가 보이는지 추적합니다" | **"AI가 브랜드를 얼마나 정확히 아는지 측정하고, 부정확하면 고칩니다"** |
| **Lantern** | "이커머스 제품이 AI에서 추천되는지 확인합니다" | **"28개 업종별로 최적화된 가중치로 측정하고, 콘텐츠까지 자동 생성합니다"** |
| **범용 SEO 도구** | "AI Overviews에서의 노출을 추적합니다" | **"질문 레이어별로 어디서 이기고 지는지 진단하고, Fix-It 루프로 해결합니다"** |

### 6.3 핵심 차별화 3문장

1. **"모니터링이 아닌 오퍼레이팅"** — 업계 도구가 "대시보드"에서 멈출 때, BSW-OS는 "측정 → 진단 → 처방 → 실행 → 재측정"의 폐쇄 루프를 운영합니다.

2. **"Answer Share를 넘어 Entity Accuracy까지"** — "AI가 우리를 언급했는가"를 넘어, "AI가 우리의 핵심 정보를 정확히 알고 있는가"를 7차원으로 측정합니다.

3. **"한국 시장 네이티브, 28업종 적응"** — 글로벌 도구의 영어 중심 접근과 달리, 한국어 형태소 매칭 + K-Culture 어트랙터 + 한국 업종 특화 가중치를 내장합니다.

---

## 7. Unfair Advantage 활용 전략

### 7.1 대외 발표용 핵심 스토리

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  "업계 도구들은 AI가 우리 브랜드를 '말했는지'를 봅니다.     │
│   BSW-OS는 AI가 우리 브랜드를 '정확히 아는지'를 봅니다."    │
│                                                             │
│   → Entity Accuracy (AEPI)가 그 차이입니다.                 │
│   → 11%의 AI 답변이 부정확한 시대,                          │
│     '언급됐다'와 '정확히 언급됐다'는 완전히 다릅니다.        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 업종별 Unfair Advantage 활용

| 업종 | 핵심 Pain Point | BSW-OS Unfair Advantage |
|:---|:---|:---|
| **스킨케어 (YMYL)** | AI가 효능·성분을 왜곡할 위험 | **Truth Studio** — 클레임 검증 + Drift 감지 |
| **웨딩 (로컬)** | AI가 위치·가격·패키지 정보를 잘못 안내 | **AEPI Local/Geo** 차원 + **Surface Contracts** |
| **소상공인** | AI에서 존재감 자체가 없음 | **OPP(기회 점수)** — Blue Ocean 선점 전략 |
| **이커머스** | 비교 추천에서 경쟁사에 밀림 | **CWR(경쟁 승리율)** + 비교 콘텐츠 자동 생성 |

### 7.3 투자자/기업 고객 대상 차별화 요약

| 질문 | BSW-OS의 답 |
|:---|:---|
| "왜 Profound/AthenaHQ가 아닌 BSW-OS를 써야 하는가?" | 그들은 **대시보드**, 우리는 **운영 시스템**입니다. 측정에서 멈추지 않고 실행까지 완결합니다. |
| "왜 글로벌 도구가 아닌 한국 도구인가?" | 한국어 형태소 매칭, 28개 한국 업종 가중치, K-Culture 어트랙터는 글로벌 도구가 제공하지 못합니다. |
| "지표의 과학성은 신뢰할 수 있는가?" | Robertson(1977), Jaccard(1912), Fuhr(2008)의 정보 검색 이론에 기반하며, Fair Probe Builder로 측정 편향을 구조적으로 방지합니다. |
| "경쟁사가 따라잡을 수 있는가?" | AEPI의 2단계 동적 가중치(5매크로×28업종×7차원)와 Semantic Closed Loop(6단계 폐쇄 루프)는 단일 기능 카피로는 재현 불가합니다. |

---

## 8. 결론 및 우선순위 제안

### 8.1 현재 경쟁력 요약

| 영역 | 평가 | 세부 |
|:---|:---:|:---|
| **기본 노출 지표** | ✅ 완전 커버 | BSF, OCR, AAS_w = Answer Share, Citation Rate, Sentiment |
| **품질 지표** | ✅✅ 초과 커버 | AEPI + Truth Studio = Entity Accuracy + Claim Fidelity |
| **전략 분해** | ✅✅ 업계 유일 | Per-Layer (IRI/BDR/CWR/OPP) |
| **실행 루프** | ✅✅ 업계 유일 | Fix-It + Surface Contracts + Website Factory |
| **전환 지표** | ❌ 미구현 | Search Console API 연동 필요 |
| **외부 소스** | ⚠️ 제한적 | Earned/Community 모니터링 부재 |

### 8.2 보완 우선순위

| 순위 | 항목 | 이유 | 난이도 |
|:---:|:---|:---|:---:|
| 1 | **Top-N Presence** (Top-3/Top-5 포지션 분석) | CWR 확장 — 응답 텍스트 파싱만으로 구현 가능 | 🟢 낮음 |
| 2 | **Freshness Score** 독립 지표화 | 스냅샷 간 정보 변경 감지 로직 추가 | 🟢 낮음 |
| 3 | **Search Console API 연동** | Google AI 전용 리포트 활용 — 전환 지표 시작점 | 🟡 중간 |
| 4 | **Earned Media 기본 추적** | 주요 리뷰 플랫폼(네이버 블로그, YouTube) 언급 모니터링 | 🟡 중간 |
| 5 | **Platform Data 연동** (GBP) | 로컬 비즈니스 업종 대응 | 🔴 높음 |

---

> **최종 판단:** BSW-OS는 이미 업계 표준을 **모두 포괄**하면서도, **AEPI(엔티티 레벨 측정)**, **Per-Layer(전략 분해)**, **Semantic Closed Loop(실행 루프)**라는 3대 Unfair Advantage를 보유하고 있습니다. 이것은 기능 하나를 카피하는 것으로는 따라잡을 수 없는 **시스템 레벨의 구조적 우위**입니다.
>
> 단기 보완(Top-N, Freshness)만 추가하면, "AI Visibility 모니터링 도구"가 아닌 **"AI Visibility Operating System"**으로서의 포지션이 더욱 공고해집니다.
