# BSW-OS × GENESIS AI홈피 — 통합 시너지 전략 및 가치 창출 프레임워크 v2.0

> **Version:** 2.0 (2026-06-24) — QIS 양방향 연동 + Hub Platform + Archetype 시스템 통합
> **Scope:** BSW-OS 역설계/QIS/벤치마크 × GENESIS 테넌트 온보딩/Growth Orchestrator/Hub Platform
> **핵심 명제:** AEO 진단 → QIS 질문 자산 연동 → 즉시 고품질 웹사이트 개설 → 자동 성장의 완전한 폐루프

---

## Executive Summary

BSW-OS의 **서피스/브랜드 역설계 + QIS(Question Intelligence System)**는 브랜드의 AEO 현황을 진단하고, 질문 자산을 발굴·예측·가치화합니다. GENESIS AI홈피의 **업종 허브 플랫폼 + Growth Orchestrator + Archetype 시스템**은 허브에서 수집된 1차 데이터(커뮤니티 Q&A, 검증 리뷰, 실거래가)를 기반으로 테넌트 웹사이트를 구축하고 자동으로 성장시킵니다.

v1.0 대비 v2.0의 핵심 차별점:
- **QIS 양방향 연동:** BSW가 Hub에서 신호/메트릭/기대레이어를 Pull → 예측 질문을 Push → Hub가 피드백
- **Hub Content Pool:** 업종 허브의 큐레이션된 콘텐츠가 테넌트에 자동 공급 (direct/custom/draft)
- **Archetype 매칭:** BSW 진단 결과 → 11개 아키타입 중 최적 매칭 → Vec7D + 디자인 + GNB 일괄 결정
- **Predicted Content Pipeline:** QIS 예측 질문 → CMOS 자동 드래프트 → 24시간 리뷰 마감 → 자동 비활성화
- **S2P Growth Bridge:** 프로젝트 완료 → Gap Report 10영역 → TF8 블록 초기화 → Growth 자동 점화
- **Mixture Hub:** 크로스 허브 콘텐츠 자동 조합 (POI/Theme/Editorial)

---

## 1. MECE 시너지 프레임워크: 7개 가치 축 (v2.0)

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                BSW-OS × GENESIS 통합 시너지 가치 창출 프레임워크 v2.0              │
├──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬───────────────┤
│ Axis 1   │ Axis 2   │ Axis 3   │ Axis 4   │ Axis 5   │ Axis 6   │ Axis 7       │
│ 진단→설계│ 설계→구축 │ 구축→운영│ 운영→재진│ QIS 양방향│ Hub→     │ 데이터       │
│ Intel.   │ Fabric.  │ Growth   │ Feedback │ Question │ Tenant   │ Flywheel     │
│ Bridge   │ Bridge   │ Bridge   │ Loop     │ Bridge   │ Supply   │              │
│          │          │          │          │ ★NEW     │ Bridge   │              │
│          │          │          │          │          │ ★NEW     │              │
├──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼───────────────┤
│Blueprint │Template  │Gap→Mis-  │GEO↔AEPI │BSW Pull  │Hub Pool  │Industry      │
│→Archetype│→Website  │sion Auto │Score     │Signals   │→Tenant   │Benchmark     │
│Matching  │Build     │Bridge    │Sync      │from Hub  │Auto-Pull │Flywheel      │
│★ENHANCED │         │          │          │★NEW      │★NEW      │              │
├──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼───────────────┤
│Gap→QIS   │Design    │Polish    │Temporal  │BSW Push  │Expected  │Cross-Tenant  │
│Predicted │Token via │Scorer    │Trend     │Predictions│Layer    │& Cross-Hub   │
│Content   │Archetype │←L3 Feed  │←Growth   │to Hub    │Auto-Build│Learning      │
│★ENHANCED │★ENHANCED │          │          │★NEW      │★NEW      │★ENHANCED     │
├──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼───────────────┤
│Schema    │GNB/IA    │Predicted │Persona   │Hub→BSW   │Mixture   │Reference     │
│Blueprint │Auto via  │Content   │Drift     │Feedback  │Cross-Hub │Site Pool     │
│→JSON-LD  │Section   │Pipeline  │Alert     │Loop      │Content   │Auto-Expand   │
│          │Registry  │←QIS+Gap  │          │★NEW      │★NEW      │              │
│          │★ENHANCED │★ENHANCED │          │          │          │              │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴───────────────┘
```

---

## 2. Axis 1: Intelligence Bridge (진단 → 설계) — ENHANCED

### 2.1 Blueprint → Archetype 자동 매칭 ★NEW

v1.0에서는 Blueprint → Template Profile 직접 매핑이었으나, v2.0에서는 **GENESIS의 4계층 아키타입 시스템**을 활용하여 훨씬 정밀한 매칭이 가능합니다.

```
BSW-OS AuditResult + IndustryBlueprint
  │
  ├── L1 techInfraScore → Archetype qualityRiskProfile 매칭
  ├── L2 schemaQualityScore → Archetype requiredContentAssets 매칭  
  ├── L3 contentSemanticScore → Archetype contentSeedTitles 매칭
  ├── EEAT scores → Archetype msiDefaults 매칭
  └── designPatterns → Archetype lookAndFeel.targetVec7d 코사인 유사도
        │
        ▼
  GENESIS 4-Layer Taxonomy Resolution
  ┌─────────────────────────────────────────────────────────────┐
  │ Layer 1: Industry → detectIndustry() 결과 매핑              │
  │ Layer 2: Industry Profile → 29개 세부 업종 중 최적 매칭     │
  │ Layer 3: Archetype → 11개 아키타입 중 Vec7D 코사인 최대 매칭│
  │ Layer 4: Surface Preset → 9-layer 디자인 토큰 번들 자동 적용│
  └─────────────────────────────────────────────────────────────┘
```

**매칭 알고리즘 (신규):**

| BSW-OS 진단 지표 | Archetype 속성 | 매칭 로직 |
|-----------------|---------------|---------|
| `designPatterns.trustPriority='high'` | `lookAndFeel.targetVec7d.heritage` | heritage ≥ 0.6인 아키타입 우선 |
| `designPatterns.conversionFocus='comparison'` | `lookAndFeel.homepageSectionPriority` | `compare_block` 포함 아키타입 우선 |
| `eeat.overall ≥ 70` | `lookAndFeel.motionLevel` | 'subtle' 이상 허용 (신뢰 기반) |
| `contentSemanticScore ≤ 40` | `requiredContentAssets` | 필수 자산 수 최소화 아키타입 (진입장벽 ↓) |
| `schemaQualityScore ≥ 70` | `qualityRiskProfile.safetyGateLevel` | 'standard' 충분 (이미 양호) |

**예시 (스킨케어 업종):**
```
BSW-OS 진단: techInfra=45, schema=30, content=55, eeat=65
designPatterns: trustPriority=high, conversionFocus=routine
  → Layer 1: skincare
  → Layer 2: skincare_indie_brand (schema 낮음 = 신생 브랜드)
  → Layer 3: skincare_natural (Vec7D: calm=0.7, warm=0.6 → 루틴 중심)
  → Layer 4: skincare_natural_preset (earthy tones, serif, minimal motion)
  → 디자인 토큰 + GNB + 콘텐츠 시드 + QIS 질문 일괄 결정
```

### 2.2 Gap → QIS Predicted Content 교차 주입 ★ENHANCED

v1.0에서는 Gap → Content Seed 단순 주입이었으나, v2.0에서는 **QIS Predicted Content Pipeline**과 교차하여 더 정밀한 콘텐츠를 생성합니다.

```
BSW-OS SurfaceGapAnalysis[]
  ├── RED 갭 (콘텐츠 부재)
  │     ↓
  │   QIS Cross-Mapper 교차 검증
  │     ├── industry_only (업종에만 있고 사이트에 없는 질문)
  │     │     → 이미 QIS가 예측한 질문과 교차?
  │     │       YES → confidence 부스트 (+0.15) → 우선 생성
  │     │       NO  → 신규 질문으로 QIS에 등록 + 콘텐츠 생성
  │     └── 검증된 예측 질문
  │           → Predicted Content Pipeline
  │             → CMOS 자동 드래프트 (Expected Layer 준수)
  │             → 24h 리뷰 마감 → Growth Mission Card
  │
  └── WHITE 갭 (블루오션)
        → QIS Question Emergence Predictor에 시드 주입
        → first_mover_window_days 계산
        → 조기 선점 콘텐츠 전략
```

**교차 검증의 가치:**
- BSW-OS RED 갭과 QIS 예측 질문이 **동시에 가리키는 토픽**은 가장 높은 우선순위
- BSW-OS에서만 발견된 갭은 QIS에 새 신호로 등록 → 예측 정확도 향상
- QIS에서만 예측된 질문은 BSW-OS 진단에서 놓친 미래 기회

### 2.3 Schema Blueprint → Archetype requiredContentAssets 매핑 ★ENHANCED

BSW-OS의 스키마 감사 결과가 GENESIS Archetype의 `requiredContentAssets` 매트릭스와 직접 매핑됩니다.

| BSW-OS 누락 스키마 | Archetype 필수 자산 | 자동 생성 |
|-------------------|-------------------|---------|
| `Organization` | `about_brand` (critical) | AI 브랜드 소개 드래프트 |
| `FAQPage` | `faq` (major) | QIS 시드 질문 기반 FAQ |
| `Product` | `product` (critical) | 제품 카탈로그 구조화 |
| `HowTo` | `routine` / `process_step` (major) | 루틴/프로세스 가이드 |
| `AggregateRating` | `evidence` (major) | 리뷰 집계 근거 |
| `Person` | `person` (critical for clinic/consulting) | 전문가 프로필 |
| `ClaimReview` | `claim` + `evidence_source` (YMYL) | 의료/금융 주장 검증 |

---

## 3. Axis 2: Fabrication Bridge (설계 → 구축) — ENHANCED

### 3.1 Archetype 기반 풀스택 자동 구축 ★ENHANCED

v1.0에서는 Blueprint → Template + Design Token이었으나, v2.0에서는 **아키타입 하나로 디자인+GNB+콘텐츠+QIS+Expected Layer 전부 결정**됩니다.

```
BSW-OS AuditResult
  → Archetype 자동 매칭 (Axis 1.1)
    → Archetype 패키지 일괄 적용:
      ┌─────────────────────────────────────────────────────┐
      │  1. lookAndFeel.targetVec7d → VTDS 디자인 토큰      │
      │  2. lookAndFeel.baseTheme → 44개 YAML 테마 선택      │
      │  3. lookAndFeel.homepageSectionPriority              │
      │     → Section Registry 60+ 중 선택                  │
      │     → Industry Home Template 자동 결정               │
      │  4. requiredContentAssets → 초기 콘텐츠 매트릭스      │
      │  5. contentSeedTitles → AI 드래프트 제목/구조        │
      │  6. questionCapitalSeed → QIS 초기 질문 자산         │
      │  7. msiDefaults → MSI 온보딩 기본값                  │
      │  8. qualityRiskProfile → Expected Layer 등급 결정    │
      │  9. benchmarkBaseline → KPI 기준선 설정              │
      └─────────────────────────────────────────────────────┘
```

### 3.2 GNB/IA 자동 구축 — Section Registry 통합 ★ENHANCED

BSW-OS 진단 데이터가 GENESIS의 **60+ Section 타입** 중 최적 조합을 자동 결정합니다.

| BSW-OS 진단 결과 | Section 자동 추가 | psychology_layer |
|-----------------|------------------|-----------------|
| EEAT.trustworthiness < 50 | `trust_strip` + `stats_band` | 'trust' |
| 비교 콘텐츠 RED 갭 | `compare_block` | 'value' |
| FAQ 스키마 누락 | `faq_accordion` | 'trust' |
| 루틴 콘텐츠 부재 | `routine_steps` | 'value' |
| 제품 스키마 누락 | `catalog_grid` + `product_grid` | 'action' |
| 전문가 프로필 없음 | `doctor_profile` or `agent_showcase` | 'proof' |
| 포트폴리오 부재 | `portfolio_preview` + `masonry_gallery` | 'attention' |
| 지역 SEO 약함 | `map_embed` | 'action' |

**5-Layer Psychology 프레임워크 적용:**
```
Attention (주목) → Trust (신뢰) → Value (가치) → Proof (증거) → Action (전환)

BSW-OS L3 eeat.trustworthiness < 50 → Trust Layer 강화
BSW-OS L3 answerFirstScore < 40    → Value Layer 강화  
BSW-OS L2 orgSchemaPresent = false → Proof Layer 강화
BSW-OS L1 techInfraScore > 70      → Action Layer에 집중 가능
```

### 3.3 Hub Content Pool 즉시 공급 ★NEW

Turnkey Onboarding 시, 해당 업종 허브의 `hub_content_pool`에서 콘텐츠를 즉시 공급합니다.

```
BSW-OS 진단 → 업종 감지: wedding_sdm
  → K-Wedding Hub hub_content_pool 조회
    ├── 15개 direct 콘텐츠 → 즉시 active 발행
    │   (웨딩 가이드, 예산 비교, 스타일 트렌드, 법적 절차 등)
    ├── 10개 custom_template → [TUNE_HERE] 필드 AI 브랜드 반영
    │   (Q&A, 브랜드 맞춤 답변 등)
    └── 5개 draft → 테넌트 리뷰 대기
        (업체별 고유 콘텐츠)

결과: 온보딩 직후 최소 15개 고품질 콘텐츠 즉시 활성화
      + 10개 AI 커스터마이징 → 1시간 내 25개 활성화
      + 5개 테넌트 리뷰 → 24시간 내 30개 완성
```

---

## 4. Axis 3: Growth Bridge (구축 → 운영) — ENHANCED

### 4.1 S2P Growth Bridge × BSW-OS 갭 매핑 ★ENHANCED

BSW-OS의 Gap Report 10영역이 GENESIS의 **S2P → TF8 Block 매핑**과 직접 연결됩니다.

```
BSW-OS SurfaceGapAnalysis + ImprovementStrategy
  ↓
S2P Gap Report 10영역으로 변환:
  ├── gnb_ia (F 블록)      ← BSW-OS gnbCorrections.missingNodes
  ├── question_answer (K)   ← BSW-OS contentGaps.red (answer 타입)
  ├── offer_clarity (T)     ← BSW-OS contentGaps.red (product/service 타입)
  ├── trust_evidence (W)    ← BSW-OS eeat.trustworthiness + evidence 갭
  ├── visual_explanation (O) ← BSW-OS L3 multimediaScore
  ├── policy_safety (W)     ← BSW-OS L2 schemaQualityScore
  ├── conversion (A)        ← BSW-OS designPatterns.conversionFocus
  ├── seo_aeo_geo (S)       ← BSW-OS aepiScore + techInfraScore
  ├── mobile_ux (F)         ← BSW-OS L1 renderingMode
  └── operations (T)        ← BSW-OS L1 sitemapScore
  ↓
TF8 Block 초기 점수 설정
  → Growth Orchestrator Week 1 자동 점화
  → Adaptive Coach: 가장 낮은 TF8 블록 우선 코칭
  → 5개 Welcome Mission Cards 자동 생성
```

### 4.2 Predicted Content Pipeline × BSW-OS QIS 교차 ★ENHANCED

BSW-OS QIS 예측 질문이 GENESIS Predicted Content Pipeline에 직접 투입됩니다.

```
BSW-OS QIS Predictions (confidence ≥ 0.70)
  ↓
GENESIS predictedContentPipeline.ts
  ├── confidence 필터 (≥ 0.70)
  ├── coverage 필터 (none | sparse만)
  ├── QVS 점수 정렬 (상위 5개)
  ├── Expected Layer 준수 확인
  │   ├── must_include[] → 드래프트에 반드시 포함
  │   └── must_not_do[] → 드래프트에서 반드시 배제
  ├── CMOS 자동 드래프트 생성
  │   ├── type='answer', category='qis_predicted'
  │   ├── Schema.org 자동 매핑:
  │   │   recommendation → FAQPage
  │   │   comparison → Article
  │   │   action_seeking → HowTo
  │   │   local_intent → LocalBusiness
  │   └── review_deadline: 24시간
  └── Growth Mission Card (🟡 Yellow) 자동 생성
      → 테넌트 리뷰 → 발행 or 24h 후 자동 비활성화
```

### 4.3 Growth Orchestrator 확장 — BSW 소스 3중 통합 ★ENHANCED

Growth Orchestrator의 `findOpportunities()` Step 5에 3개 BSW-OS 소스가 통합됩니다.

| 소스 | 타입 | 가중치 | 미션 색상 |
|------|------|--------|---------|
| GEO 실패 항목 | `geo_gap` | ×2 | 🟡 Yellow |
| QIS 예측 질문 | `qis_question` | ×1 (QVS 기반) | 🟡 Yellow |
| **BSW-OS RED 갭** | `bsw_content_gap` | **×3** (최우선) | 🟡 Yellow |
| **BSW-OS YELLOW 갭** | `bsw_reflection_gap` | **×2** | 🟡 Yellow (Polish) |
| **BSW-OS WHITE 갭** | `bsw_blue_ocean` | **×1.5** | 🟡 Yellow (예측) |

**Mission Card 우선순위 캐스케이드 (v2.0):**
1. Adaptive Coach missions (TF8 블록 코칭)
2. **BSW-OS RED Gap missions** ★NEW (AEO 진단 기반)
3. Content Boost missions (아키타입 콜드스타트)
4. **BSW-OS QIS Predicted Content** ★NEW (예측 질문 기반)
5. Growth Hub missions (GEO + QIS 표준)
6. **BSW-OS WHITE Opportunity missions** ★NEW (블루오션)

---

## 5. Axis 4: Feedback Loop (운영 → 재진단) — 기존 유지 + 보강

### 5.1 GEO Score ↔ AEPI Score 교차 검증

(v1.0과 동일, 추가 보강:)

**BAIR Score 통합 ★NEW:**
Hub QIS Benchmark 시스템의 **BAIR(Brand AI Readiness) Score**가 추가 교차 검증 지표로 활용됩니다.

```
BAIR = 0.4 × AAS (AI Answer Share)
     + 0.3 × OCR (Official Citation Rate)  
     + 0.3 × BSF (Brand Semantic Fidelity)

BSW-OS AEPI ↔ GENESIS GEO ↔ Hub BAIR
  → 3중 교차 검증
  → 가장 정확한 AI 가시성 지표 도출
```

### 5.2 자동 재진단 트리거 (v2.0 확장)

| 트리거 조건 | 재진단 범위 | 주기 |
|-----------|-----------|------|
| Growth Orchestrator 4주차 완료 | Quick Audit (L1/L2/L3) | 월 1회 |
| GEO Score 20점 이상 하락 | Full Audit (14단계) | 이벤트 기반 |
| 콘텐츠 10건 이상 변경 누적 | Quick Audit + 포지셔닝 | 이벤트 기반 |
| 분기 리뷰 | Full Audit + 업종 벤치마크 재실행 | 분기 1회 |
| **QIS 예측 정확도 < 60%** ★NEW | **QIS 재캘리브레이션 + Quick Audit** | 이벤트 기반 |
| **BAIR Score 0.1 이상 하락** ★NEW | **Full Audit + Hub 벤치마크** | 이벤트 기반 |
| **Expected Layer 위반 감지** ★NEW | **Content Polish 강제 실행** | 이벤트 기반 |

---

## 6. Axis 5: QIS Question Bridge (양방향 질문 자산 교환) ★NEW

> **BSW-OS의 질문 예측 엔진과 GENESIS Hub의 1차 데이터가 양방향으로 질문 자산을 교환하는 새로운 축**

### 6.1 BSW → Hub: 예측 질문 Push

```
BSW-OS S-OGDE v2.0 Pipeline
  Meta-Q → Explore → Deepen → Dedup → Evaluate → Predict
  ↓
  예측 질문 (confidence ≥ 0.70)
  ↓
  POST /api/v1/qis/questions → GENESIS Hub
  ↓
  Hub 측:
  ├── qis_predicted_questions_cache 저장
  ├── QIS Insights Dashboard 표시
  ├── Growth Orchestrator findOpportunities()에 주입
  └── Predicted Content Pipeline → 자동 드래프트 생성
```

**BSW 예측 질문의 Hub 활용 경로:**

| Hub 모듈 | 활용 방식 |
|---------|---------|
| 아고라 Q&A | 예측 질문을 FAQ 시드로 게시 → 전문가 답변 유도 |
| 100문 100답 | canonical_question으로 등록 → 업종 표준 FAQ |
| Deal Room | 가격/비교 관련 예측 → 거래 인사이트 |
| Growth Orchestrator | 🟡 Yellow 미션 카드로 변환 |
| Content Pipeline | CMOS 자동 드래프트 → 24h 리뷰 |

### 6.2 Hub → BSW: 신호/메트릭/기대레이어 Pull

```
GENESIS Hub Feature Modules
  ├── CAFE 아고라 Q&A → community_question 신호
  ├── 영수증 안심 후기 → verified_review 신호
  ├── 실거래가 제보 → price_report 신호
  ├── WeddyCare 마음 케어 → stress_pattern 신호
  ├── Deal Room 비딩 → deal_room_contract 신호
  └── Style DNA 매칭 → preference_pattern 신호
  ↓
  BSW-OS Cron (매일 3AM)
  ├── KWeddingHubCollector.pullSignals() → bsw_received_signals
  ├── hubClient.pullMetrics() → QVS 재계산
  │   (question_frequency, conversion_rate, avg_transaction 등)
  └── hubClient.pullExpectedLayers() → 5-tier 기대 레이어
      (must_include → strongly_recommended → should_include → caution → must_not_do)
```

**QVS 정확도 개선 효과:**
```
QVS = Volume × Conversion × ARPU × First-Mover × (1 - Competition)

Hub 실데이터 반영 전: 추정 기반 → ±40% 오차
Hub 실데이터 반영 후: 실거래가 + 실전환율 → ±10% 오차

Volume      ← Hub question_frequency (실제 질문 빈도)
Conversion  ← Hub conversion_rate (실제 전환율)
ARPU        ← Hub average_transaction (실제 객단가)
```

### 6.3 Hub → BSW: 피드백 루프

```
Hub 운영 중 질문 출현 관측
  → POST BSW/api/v1/qis/feedback
    { bsw_question_id, emerged: true, emerged_at, actual_frequency }
  → BSW PredictionAccuracyTracker.verifyPrediction()
  → 신호 가중치 재캘리브레이션
  → 다음 예측 주기의 정확도 향상
```

**학습 주기 단축 효과:**
- Hub 연동 전: 7-14일 (외부 관측 기반)
- Hub 연동 후: **1일** (커뮤니티 직접 검증)

### 6.4 QIS × 역설계 교차 시너지

```
BSW-OS 역설계 (기존 사이트 분석)
  ├── 어떤 질문에 답하고 있는가? → site_only 질문
  ├── 어떤 질문에 답하지 못하는가? → RED 갭
  └── 어떤 질문이 업종에서 중요한가? → industry_only 질문

QIS 질문 예측 (미래 질문 발굴)
  ├── 어떤 질문이 떠오를 것인가? → predicted_question
  ├── 언제 떠오를 것인가? → first_mover_window_days
  └── 얼마나 가치 있는가? → QVS composite score

교차: 역설계 RED 갭 ∩ QIS 예측 질문
  = 현재 답하지 못하는 + 앞으로 중요해질 질문
  = 최우선 콘텐츠 생성 대상 (confidence boost + AEPI impact)
```

---

## 7. Axis 6: Hub → Tenant Supply Bridge ★NEW

> **업종 허브의 큐레이션된 콘텐츠, 기대 레이어, 아키타입이 테넌트에 자동 공급되는 새로운 축**

### 7.1 Hub Content Pool 3-모드 자동 공급

| 공급 모드 | 설명 | BSW-OS 연계 | 예시 |
|---------|------|-----------|------|
| `direct` | 즉시 active 발행 | RED 갭에 해당하는 Hub 콘텐츠 우선 공급 | 웨딩 예산 가이드 |
| `custom_template` | `[TUNE_HERE]` → AI 브랜드 반영 | BSW BrandContext + 갭 데이터로 커스터마이징 | 브랜드 맞춤 Q&A |
| `draft` | 테넌트 리뷰 대기 | Growth Orchestrator 🟡 미션으로 전달 | 업체별 고유 콘텐츠 |

**BSW-OS 갭 기반 지능형 공급:**
```
BSW-OS contentGaps.red
  → Hub Content Pool 매칭 쿼리
    WHERE industry_type = detected_industry
    AND asset_type IN (gap.suggestedUcaType)
    AND is_active = true
  → 매칭된 Hub 콘텐츠 → direct/custom 모드로 즉시 공급
  → 매칭 안 된 갭 → AI 드래프트 생성 (기존 로직)
```

### 7.2 Expected Layer 자동 적용

Hub에서 수집된 **5-tier Expected Layer**가 테넌트 콘텐츠 생성/폴리싱에 자동 적용됩니다.

```
Hub Expected Layer (from reviews/prices/contracts)
  ├── must_include: "촬영 시간 2시간 기준 명시"
  ├── strongly_recommended: "보정본 전달 기간 명시"
  ├── should_include: "추가 촬영 비용 안내"
  ├── caution: "타 업체 비교 시 객관적 데이터 사용"
  └── must_not_do: "근거 없는 '최저가' 주장 금지"
  ↓
  GENESIS Content Polishing Engine
  ├── polish-executor.ts: must_include → 콘텐츠에 삽입
  ├── polish-executor.ts: must_not_do → ComplianceSanitizer 규칙
  └── Growth Mission: caution 위반 시 🔴 Red Card 발행
```

### 7.3 Mixture Cross-Hub 콘텐츠 ★NEW

여러 허브의 콘텐츠를 자동 조합하여 크로스 도메인 콘텐츠를 생성합니다.

```
BSW-OS 진단: "스킨케어 + 한방" 혼합 업종 감지
  → K-Beauty Hub + K-Hanbang Hub 크로스 매칭
    → Mixture Config: type='theme', auto_compose_rule
      → 통합 Q&A: "한방 성분 스킨케어 루틴" 자동 생성
      → 비교표: "서양 vs 한방 성분 비교" 자동 생성
      → unified_qa: 양쪽 Hub의 canonical_question 통합
```

---

## 8. Axis 7: Data Flywheel — ENHANCED

### 8.1 3중 플라이휠 (v2.0)

```
┌──────────────────────────────────────────────────────┐
│  Flywheel 1: 벤치마크 정확도 향상                       │
│  테넌트 ↑ → 벤치마크 데이터 ↑ → Blueprint 정확도 ↑      │
│  → 신규 사이트 품질 ↑ → 테넌트 ↑ (반복)                │
├──────────────────────────────────────────────────────┤
│  Flywheel 2: QIS 예측 정확도 향상 ★NEW                 │
│  Hub 신호 ↑ → QVS 정확도 ↑ → 콘텐츠 ROI ↑             │
│  → 테넌트 성장 ↑ → Hub 활동 ↑ → Hub 신호 ↑ (반복)     │
├──────────────────────────────────────────────────────┤
│  Flywheel 3: Cross-Hub 네트워크 효과 ★NEW              │
│  Hub A 데이터 → Hub B 인사이트 → Mixture 콘텐츠 ↑       │
│  → 크로스 도메인 가시성 ↑ → 양쪽 Hub 가치 ↑ (반복)     │
└──────────────────────────────────────────────────────┘
```

### 8.2 Hub Probe Panel ↔ BSW-OS Probe Generator 교차 학습

```
Hub Probe Panel (20개 표준 질문/허브)
  ├── BAIR Score 측정용 (AAS + OCR + BSF)
  └── 업종별 AI 가시성 벤치마크

BSW-OS Probe Generator (사이트별 동적 질문)
  ├── 엔티티 기반 프로브 생성
  └── 비교/심층/상황별 변형

교차 학습:
  Hub Probe 결과 → BSW-OS 프로브 품질 개선
  BSW-OS 엔티티 프로브 → Hub Probe Panel 확장
  → 점점 더 정밀한 AI 가시성 측정
```

---

## 9. End-to-End 고객 여정 v2.0

### To-Be (완전 연계 시스템)

```
Step 1: AEO 진단 (5초)
━━━━━━━━━━━━━━━━━━━━
고객: "우리 웹사이트 AEO 봐주세요"
  → BSW-OS Quick Audit
    → 3-Layer 진단 + 업종 포지셔닝 + 갭 분석
    → QIS Cross-Mapper: 업종 vs 사이트 질문 교차 매핑
    → "현재 C등급 (40%ile). 23개 콘텐츠 갭, 8개 QIS 기회 발견."

Step 2: Archetype 매칭 + 즉시 구축 (수 분)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[구축 버튼 클릭]
  → 핸드오프 패키지 생성 (Blueprint + Gap + QIS + Schema)
  → GENESIS Archetype 자동 매칭: skincare_natural
  → 풀스택 자동 구축:
    ├── VTDS 디자인 토큰: earthy tones, serif, calm motion
    ├── GNB/IA: solutions, routines, faq, experts, compare
    ├── Section: hero_qa_focus, faq_accordion, routine_steps, trust_strip
    ├── Hub Content Pool: 15개 direct + 10개 custom → 25개 즉시 활성화
    ├── AI 드래프트: RED 갭 8개 → 8개 answer/faq/evidence 생성
    ├── Schema.org: Organization, FAQPage, Product, HowTo 자동 포함
    └── QIS 시드: 5개 업종 표준 질문 + 8개 BSW 예측 질문 등록

Step 3: 자동 성장 (매주)
━━━━━━━━━━━━━━━━━━━━
Growth Orchestrator 자동 실행 (매주 월요일)
  → BSW-OS 갭 기반 미션: 🟡 "FAQ 스키마 콘텐츠 생성" (2분)
  → QIS 예측 기반 미션: 🟡 "레티놀 부작용 답변 생성" (2분)
  → Hub 자동 공급: 🟢 "성분 비교 가이드" 자동 활성화
  → Polish Engine: 기존 콘텐츠 5건 자동 보강
  → Expected Layer 준수 확인: must_include 검증 통과

Step 4: QIS 양방향 연동 (매일)
━━━━━━━━━━━━━━━━━━━━━━━━━━━
BSW Cron (3AM):
  → Hub 커뮤니티 Q&A → 신규 신호 수집 → QVS 재계산
  → 예측 질문 2건 Push → Hub Growth 미션에 주입
  → Hub 피드백: "레티놀 부작용" 실제 출현 확인 → 정확도 ↑

Step 5: 효과 측정 (월간)
━━━━━━━━━━━━━━━━━━━━━
BSW-OS 자동 재진단 (4주 후):
  → AEPI δ: +18pt (C→B 상승)
  → 업종 포지셔닝: 40%ile → 68%ile
  → GEO Score: 120 → 185 (D→B)
  → BAIR Score: 0.35 → 0.62
  → "4주 만에 업종 상위권 진입. A등급까지 Quick Win 3개 남음."
```

---

## 10. 추가 고도화 아이디어 (다이아몬드 사고)

### 10.1 💎 Archetype Elo 캘리브레이션 × BSW-OS 실측

GENESIS의 `archetypeEloCalibrator.ts`가 BSW-OS 재진단 AEPI δ를 Elo 점수에 반영합니다.

```
Archetype A (skincare_natural) 적용 → 4주 후 BSW-OS AEPI +18pt
Archetype B (skincare_clinical) 적용 → 4주 후 BSW-OS AEPI +12pt
  → Archetype A의 Elo Rating ↑, Archetype B ↓
  → 다음 매칭 시 Archetype A 우선 추천
  → 업종별 "가장 효과적인 아키타입" 자동 학습
```

### 10.2 💎 Hub Probe Panel → BSW-OS 벤치마크 자동 생성

Hub QIS Benchmark의 20개 Probe Panel이 BSW-OS의 업종 벤치마크에 자동 피드됩니다.

```
Hub hub_probe_panels (20 questions/hub)
  + Hub hub_qis_benchmarks (BAIR snapshots)
  → BSW-OS reference_sites에 Hub 테넌트 자동 등록
  → BSW-OS 업종 벤치마크 자동 갱신
  → 별도의 관리자 배치 감사 없이 벤치마크 정확도 유지
```

### 10.3 💎 Expected Layer ↔ BSW-OS L3 콘텐츠 시맨틱 교차 검증

```
Hub Expected Layer (데이터 기반, 실제 고객 기대)
  × BSW-OS L3 Content Semantic (사이트 콘텐츠 실측)
  = "고객이 기대하는 정보 vs 사이트가 제공하는 정보" 매트릭스
  → 가장 치명적인 정보 공백 식별
  → 우선 생성 콘텐츠 정밀 타겟팅
```

### 10.4 💎 Vortex DAO × BSW-OS 품질 거버넌스

GENESIS의 Vortex DAO 시스템이 BSW-OS 진단 결과를 거버넌스 지표로 활용합니다.

```
BSW-OS AEPI ≥ 70 & GEO Grade ≥ B
  → Vortex DAO 자격 조건 충족
  → 품질 높은 테넌트만 DAO 참여 가능
  → DAO 참여 테넌트의 콘텐츠가 Hub에 기여
  → Hub 품질 ↑ → 전체 플랫폼 품질 ↑
```

### 10.5 💎 AI Core ProvenanceLedger × BSW-OS 출처 추적

GENESIS `ai-core` 패키지의 `ProvenanceLedger`가 BSW-OS 진단 기반으로 생성된 콘텐츠의 출처를 완전 추적합니다.

```
ProvenanceLedger Entry:
  promptId: 'bsw_gap_content_v1'
  promptVersion: '2.0'
  modelUsed: 'gemini-2.5-flash'
  ragAssetsUsed: ['bsw_audit_session_xxx', 'hub_content_pool_yyy']
  bswGapId: 'gap_123'
  bswPrescriptionType: 'create_content'
  bswAepiImpact: 8.5
  → 콘텐츠 효과를 원래 진단 갭까지 역추적 가능
```

### 10.6 💎 S2P 자동 견적 × BSW-OS 갭 수량화

BSW-OS의 갭 개수와 심각도가 GENESIS S2P의 자동 견적에 직접 반영됩니다.

```
BSW-OS 진단 결과:
  RED 갭 15개, YELLOW 갭 8개, WHITE 기회 5개
  Schema 누락 4종, Expected Layer 위반 3건
  ↓
S2P Pricing Engine:
  base_package: 'standard' (₩1.5M)
  + additional_qa: 15 × ₩50K = ₩750K (RED 갭 콘텐츠)
  + schema_setup: 4 × ₩100K = ₩400K (스키마 구축)
  + expected_layer_compliance: ₩200K (YMYL 준수)
  = 총 견적: ₩2.85M (자동 산출, 근거 명확)
```

### 10.7 💎 멀티 허브 통합 벤치마크

```
K-Wedding Hub + K-Beauty Hub + K-Hanbang Hub
  → 3개 허브의 BAIR Score 통합 분석
  → BSW-OS에서 "뷰티 도메인" 통합 벤치마크 생성
  → 크로스 도메인 인사이트: "스킨케어 브랜드가 한방 콘텐츠를 추가하면 AEPI +5pt"
```

### 10.8 💎 UGS(Unified Growth Score) × AEPI 통합 지표

```
GENESIS UGS (0-1000, 5개 축)
  ├── tf-studio learning (200pt)
  ├── Onboarding readiness (200pt)
  ├── GEO search visibility (300pt)  ← BSW-OS AEPI 교차 검증
  ├── BSA brand authority (200pt)
  └── Factbox activity (100pt)

통합 지표: UGSA (Unified Growth-AEPI Score)
  = UGS × 0.6 + (AEPI × 10) × 0.4
  → 성장 + AEO 가시성 통합 측정
  → 티어 업그레이드 판단에 AEPI 반영
```

---

## 11. 비즈니스 가치 매트릭스 v2.0

### 고객 가치

| 가치 | v1.0 | v2.0 (Hub+QIS 통합) |
|------|------|-------------------|
| Time-to-Value | 90일 → 1일 | 90일 → **수 시간** (Hub 콘텐츠 즉시 공급) |
| 초기 콘텐츠 수 | 0 → 30개 (AI 생성) | 0 → **45개+** (Hub 25 + AI 20) |
| QIS 질문 자산 | 0 → 5개 (시드) | 0 → **25+** (시드 5 + 예측 8 + Hub 표준 12) |
| 콘텐츠 품질 | AI 추정 | **Expected Layer 데이터 검증** |
| QVS 정확도 | ±40% | **±10%** (실거래 데이터) |
| 학습 주기 | 7-14일 | **1일** (Hub 피드백) |

### 플랫폼 가치

| 가치 | v1.0 | v2.0 |
|------|------|------|
| 네트워크 효과 | 테넌트 간 | 테넌트 × **Hub × Cross-Hub** |
| 데이터 모트 | 업종 벤치마크 | 벤치마크 + **QIS 신호 + Hub 실데이터** |
| 업셀 경로 | Free→Tier3 | Free→Tier3 + **Hub 참여 + DAO** |
| 크로스셀 | 없음 | **크로스 허브 Mixture 콘텐츠** |

---

> **결론 (v2.0):** QIS 양방향 연동과 Hub Platform 통합으로, BSW-OS × GENESIS 시너지는 단순한 "진단→구축" 파이프라인을 넘어 **"질문 발굴 → 가치 측정 → 콘텐츠 자동 생성 → 실측 피드백 → 자기 강화"의 7-Axis 자기 진화 생태계**로 확장됩니다. Hub의 1차 데이터(커뮤니티 Q&A, 실거래가, 검증 리뷰)가 QIS 예측 정확도를 4배 향상시키고, 이것이 다시 테넌트 콘텐츠 품질을 높이는 **3중 플라이휠**이 작동합니다.
