# Near-Zero 콜드스타트 → A- 웹사이트 즉시 개설 전략

> **Version:** 1.0 (2026-06-24)
> **핵심 명제:** 소상공인이 브랜드명 + 3문장만 입력하면, BSW-OS 업종 지능 × GENESIS 팩토리가 융합하여 업종 Top 25% 수준(A-) 웹사이트를 수 분 내 자동 개설
> **대상:** 웹사이트·콘텐츠 자산이 전무한(Near-Zero) 소상공인 / 자영업자 / 중소기업

---

## 1. 문제 정의: Near-Zero Scarcity

### 1.1 소상공인의 현실

| 차원 | 현재 상태 | 필요 상태 (A-) |
|------|---------|-------------|
| 웹사이트 | ❌ 없음 (또는 네이버 블로그만) | SSR 독립 사이트 + llms.txt + sitemap |
| 콘텐츠 | ❌ 0건 | 30건+ 구조화 콘텐츠 (FAQ, How-to, Product 등) |
| Schema.org | ❌ 없음 | Organization + FAQPage + Product + HowTo 등 8종 |
| AI 봇 접근 | ❌ 설정 없음 | GPTBot, PerplexityBot 등 7종 허용 |
| QIS 질문 자산 | ❌ 0건 | 20건+ 업종 핵심 질문 + 답변 |
| EEAT 시그널 | ❌ 없음 | 전문가 프로필 + 자격 + 후기 + 출처 |
| 디자인 시스템 | ❌ 없음 | 업종 최적화 VTDS 디자인 토큰 |
| GNB/IA | ❌ 없음 | 업종별 최적 네비게이션 구조 |

### 1.2 핵심 딜레마

> **"역설계할 기존 사이트가 없다"**

BSW-OS의 서피스 역설계는 기존 웹사이트를 진단합니다. 그러나 콜드스타트 고객은 진단할 사이트 자체가 없습니다.

### 1.3 패러다임 전환: 자사 진단 → 업종 지능

**해법:** 자사 사이트 대신 **업종 자체를 역설계**합니다.

```
기존 고객 (사이트 있음):
  BSW-OS → "당신 사이트는 C등급, 이렇게 고치세요" → GENESIS 개선

콜드스타트 고객 (사이트 없음):
  BSW-OS → "당신 업종의 A등급은 이런 모습, 이것을 만들어드립니다" → GENESIS 생성
```

BSW-OS의 가치가 **진단 도구 → 설계 지능**으로 전환됩니다.

---

## 2. A- 등급 정의: 22개 메트릭 목표치

BSW-OS 업종 벤치마크의 P75(상위 25%) 이상을 A- 등급으로 정의합니다.

### 2.1 L1 기술 인프라 목표

| 메트릭 | A- 목표 | 달성 방법 |
|--------|---------|---------|
| techInfraScore | ≥ 75 | GENESIS SSR 기본 제공 |
| HTTPS | ✅ 필수 | Vercel 자동 HTTPS |
| TTFB | ≤ 800ms | Next.js Edge Runtime |
| AI 봇 접근 | 7/7 허용 | GENESIS robots.txt 자동 생성 |
| 사이트맵 | 존재 + 신선 | GENESIS 4-segment sitemap 자동 |
| llms.txt | 존재 | GENESIS 3-tier llms.txt 자동 |
| Canonical 일관성 | 100% | GENESIS 자동 canonical |
| 렌더링 모드 | SSR | Next.js SSR 기본 |

**달성 난이도: 자동** — GENESIS 플랫폼이 기본 제공하므로 L1은 자동 A등급

### 2.2 L2 구조화 시맨틱 목표

| 메트릭 | A- 목표 | 달성 방법 |
|--------|---------|---------|
| schemaQualityScore | ≥ 70 | JSON-LD 30+ 타입 자동 생성 |
| Organization | ✅ 완전 | MSI brand_name + credentials → 자동 |
| FAQPage | ✅ 존재 | QIS 시드 질문 → FAQ 마크업 |
| Product/Service | ✅ 존재 | MSI services[] → Product 스키마 |
| HowTo | 존재 권장 | Archetype contentSeedTitles → HowTo |
| BreadcrumbList | ✅ 자동 | GENESIS 라우팅 기반 자동 |
| OG 완성도 | 100% | GENESIS 자동 OG 생성 |
| 메타 태그 | 100% | Polish Engine fill_meta 자동 |

**달성 난이도: 자동** — GENESIS JSON-LD 엔진이 콘텐츠 기반 자동 생성

### 2.3 L3 콘텐츠 시맨틱 목표

| 메트릭 | A- 목표 | 달성 방법 |
|--------|---------|---------|
| contentSemanticScore | ≥ 65 | 아래 항목들의 합산 |
| EEAT overall | ≥ 60 | MSI credentials + founder_story → EEAT 시그널 |
| Answer-First 문체 | ≥ 60 | Archetype contentSeedTitles이 질문형 |
| 콘텐츠 신선도 | 100% | 모든 콘텐츠가 신규 생성 (0일) |
| 내부 링크 | ≥ 3/page | GENESIS 자동 내부 링크 |
| 멀티모달 | ≥ 30 | 최소 사진 10장 필요 (HITL 요청) |
| 인용/출처 | ≥ 20 | Expected Layer must_include 준수 |

**달성 난이도: 중간** — 콘텐츠 품질이 MSI 입력 품질에 의존

---

## 3. 최소 입력 설계: "3문장 + 사진"

### 3.1 진정한 최소 입력 (True Minimum Input)

GENESIS Archetype 시스템이 MSI 7개 필드 중 4개를 자동 채우므로, 고객이 실제로 제공해야 하는 것:

```
┌─────────────────────────────────────────────────┐
│  🎯 고객이 입력하는 것 (30초)                      │
│                                                  │
│  1. 브랜드명: "미소 피부과"                        │
│  2. 창업 스토리 (1문장):                           │
│     "10년간 대학병원 피부과에서 여드름/색소 전문"    │
│  3. 베스트 후기 (1문장):                           │
│     "시술 후 흉터 없이 깨끗해졌어요"                │
│  4. 업종 선택: [스킨케어/클리닉] 드롭다운            │
│  5. 사진 업로드: 3장 이상 (원장님, 시술실, 외관)     │
│                                                  │
│  ⏱ 소요 시간: 30초 (타이핑) + 1분 (사진 선택)      │
└─────────────────────────────────────────────────┘
```

### 3.2 Archetype이 자동 채우는 것 (msiDefaults)

```
입력된 업종: clinic (피부과)
매칭된 Archetype: esthetic_premium_care

자동 채워지는 MSI:
  tagline: "당신의 피부, 과학으로 완성합니다"
  services: ["여드름 치료", "색소 치료", "레이저 시술"]
  top_customer_question: "여드름 흉터 치료 기간이 얼마나 걸리나요?"
  credentials: "피부과 전문의"
```

### 3.3 "잘 인출된 욕구/요구사항" 설계

최소 입력만으로는 A-에 도달하기 어려울 수 있습니다. **핵심 욕구를 정밀하게 인출**하면 콘텐츠 품질이 비약적으로 상승합니다.

**Vibe DNA 5문항 (30초):**
```
Q1: 끌리는 공간? 🕯️ 은은한 카페 ← → ⚡ 페스티벌
Q2: 매력적인 것? 💎 세련된 디자인 ← → 🌱 솔직한 감성
Q3: 마음 방향?   🏛️ 전통의 깊이 ← → 🚀 미래 가능성
Q4: 기본 톤?     🎪 유쾌한 위트 ← → 🎯 진중한 깊이
Q5: 주고 싶은 느낌? 🫂 따뜻하고 포근 ← → ✨ 새롭고 자극적
```

**욕구 인출 3문항 (30초):** ★NEW 제안
```
Q6: 고객이 가장 걱정하는 것은?
    [가격] [효과/결과] [부작용/위험] [시간/기간] [신뢰/자격]
Q7: 경쟁사 대비 가장 자신 있는 것은?
    [전문성] [가격] [서비스] [경력] [시설/장비] [후기/실적]
Q8: 웹사이트로 가장 하고 싶은 것은?
    [신규 고객 유치] [기존 고객 관리] [브랜드 이미지] [AI 검색 노출] [예약/전환]
```

**총 입력: 8문항 객관식(1분) + 3문장 주관(30초) + 사진(1분) = 약 2분 30초**

### 3.4 입력 → 시스템 활용 매핑

| 입력 | BSW-OS 활용 | GENESIS 활용 |
|------|-----------|-------------|
| brand_name | 업종 자동 감지 키워드 | 브랜드 프로필 |
| founder_story | EEAT Experience 시그널 | about_brand 콘텐츠 핵심 |
| best_review | EEAT Trust 시그널 | evidence/trust_card 콘텐츠 |
| industry_type | 업종 벤치마크 로드 | Industry Ignition + Archetype |
| Vibe DNA 5문항 | — | Vec7D → VTI → 디자인 토큰 |
| Q6 고객 걱정 | QIS 질문 우선순위 보정 | 콘텐츠 Answer-First 초점 |
| Q7 경쟁 우위 | 포지셔닝 힌트 | 브랜드 차별화 콘텐츠 |
| Q8 목적 | 전략 방향 결정 | 전환 퍼널 + CTA 설계 |
| 사진 3장+ | — | 갤러리 + OG 이미지 + 히어로 |

---

## 4. 융합 파이프라인: "Industry Intelligence First" 프로토콜

### 4.1 전체 흐름 (약 5분)

```
Phase 0: 입력 수집 (2분 30초)
━━━━━━━━━━━━━━━━━━━━━━━━━━
고객: brand_name + 3문장 + Vibe DNA 5문항 + 욕구 3문항 + 사진

Phase 1: BSW-OS 업종 지능 로딩 (1초, 사전 계산)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ├── IndustryBenchmarkProfile 로드 (P25/P50/P75 분포)
  ├── IndustryBlueprint 로드 (기술/스키마/콘텐츠/디자인 표준)
  ├── QIS Seed Questions 로드 (업종 핵심 질문 20개)
  ├── Expected Layer 로드 (5-tier 콘텐츠 기준)
  └── 우수 사이트 패턴 로드 (벤치마크 excellent_patterns)

Phase 2: Archetype 매칭 + 풀스택 설계 (1초)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ├── Vibe DNA → Vec7D 계산
  ├── Vec7D + 업종 → 11개 아키타입 중 코사인 최대 매칭
  ├── Blueprint designPatterns → Vec7D 보정
  ├── Archetype 패키지 일괄 적용:
  │   ├── VTDS 디자인 토큰 (테마 + 컬러 + 폰트 + 모션)
  │   ├── GNB/IA (업종 프리셋 + Blueprint 갭 보정)
  │   ├── Section 배치 (60+ 중 Psychology Layer 기반 선택)
  │   ├── 필수 콘텐츠 매트릭스 (about_brand, answer, solution 등)
  │   ├── msiDefaults 자동 채움
  │   └── Expected Layer + Safety Gate 설정
  └── Q6/Q7/Q8 욕구 → 콘텐츠 우선순위 + CTA 전략 보정

Phase 3: 콘텐츠 자동 생성 (60-90초)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ├── [Hub Pool] Hub Content Pool 매칭 → 즉시 공급
  │   ├── direct: 15개 → 즉시 active (업종 공통 가이드)
  │   ├── custom_template: 10개 → AI 브랜드 반영 → active
  │   └── draft: 5개 → 리뷰 대기
  │
  ├── [AI 생성] Launch Orchestrator 14개 핵심 자산
  │   ├── 1× about_brand (founder_story + credentials)
  │   ├── 5× answer (QIS 시드 질문 기반, Answer-First)
  │   ├── 3× program/product (MSI services[] 기반)
  │   ├── 2× solution (Q6 고객 걱정 기반)
  │   ├── 1× process_step (시술/서비스 프로세스)
  │   ├── 1× person (원장/대표 전문가 프로필)
  │   └── 1× contact_info (위치/연락처)
  │
  ├── [QIS 추가] 업종 질문 → answer 자동 생성
  │   ├── BSW-OS QIS 시드 5개 (업종 표준 질문)
  │   ├── Archetype questionCapitalSeed 3개
  │   └── Q6 고객 걱정 기반 추가 3개
  │
  └── 합계: Hub 30 + AI 14 + QIS 11 = 55건 콘텐츠

Phase 4: 품질 보장 + 기술 설정 (10초)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ├── Expected Layer 준수 검증 (must_include/must_not_do)
  ├── CMOS Quality Gate (5 mandatory + 4 dimension)
  ├── [TUNE_HERE] 마커 스캔 → HITL Card 생성
  ├── Schema.org 자동 생성 (8종 + 30+ JSON-LD)
  ├── robots.txt (7 AI 봇 허용)
  ├── llms.txt (3-tier)
  ├── sitemap.xml (4-segment)
  ├── OG 태그 (사진 기반 자동)
  └── canonical 태그 (100% 자동)

Phase 5: GEO Probe + 런칭 (5초)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ├── GEO 25-item 프로브 → 목표: ≥ 60점
  ├── HITL Card 확인:
  │   ├── block 없음 → 즉시 런칭 ✅
  │   └── block 있음 → 미션 카드로 전환
  └── 런칭 완료 → Growth Orchestrator 자동 점화
```

### 4.2 A- 도달 예상 점수

| 메트릭 | 자동 달성 점수 | A- 목표 | 갭 |
|--------|-------------|---------|------|
| L1 techInfraScore | **90+** | 75 | ✅ 초과 달성 |
| L2 schemaQualityScore | **75+** | 70 | ✅ 초과 달성 |
| L3 contentSemanticScore | **60-70** | 65 | ⚠️ 경계선 |
| EEAT overall | **55-65** | 60 | ⚠️ 경계선 |
| AEPI | **65-75** | 70 | ⚠️ 경계선 |

**L1/L2는 플랫폼이 자동 보장. L3/EEAT/AEPI가 A- 달성의 관건.**

### 4.3 L3/EEAT A- 달성 전략: "Blueprint-Guided Generation"

콜드스타트에서 L3 점수를 높이는 핵심은 **업종 Blueprint가 콘텐츠 생성을 직접 가이드**하는 것입니다.

```
BSW-OS IndustryBlueprint.contentStrategy
  ├── "Answer-First 문체 필수" → AI 프롬프트에 "첫 문장에 핵심 답변" 강제
  ├── "EEAT 권위 시그널" → founder_story + credentials → about_brand에 필수 삽입
  ├── "FAQ 구조화" → QIS 질문 → FAQPage 스키마 자동 래핑
  ├── "내부 링크 ≥ 3/page" → 콘텐츠 간 자동 크로스 링크 삽입
  └── "출처/근거 인용" → Expected Layer must_include → 본문에 자동 삽입

BSW-OS IndustryBenchmarkProfile.excellentPatterns
  ├── "우수 사이트 평균 FAQ 15개" → 목표 FAQ 수 설정
  ├── "우수 사이트 평균 프로세스 스텝 5개" → process_step 수 설정
  └── "우수 사이트 Schema 8종 평균" → 최소 스키마 타입 수 설정
```

---

## 5. BSW-OS의 콜드스타트 전용 역할: "Industry Proxy Audit"

### 5.1 개념: 자사 사이트 대신 업종을 감사

```
┌─────────────────────────────────────────┐
│  Industry Proxy Audit (업종 대리 감사)    │
│                                         │
│  입력: industry_type (단 1개)             │
│                                         │
│  출력:                                   │
│  ├── "이 업종의 A등급 사이트는 이런 모습"  │
│  ├── "이 업종에서 반드시 있어야 할 콘텐츠" │
│  ├── "이 업종 고객이 가장 많이 묻는 질문"  │
│  ├── "이 업종에서 절대 하면 안 되는 것"    │
│  └── "이 업종의 기술 인프라 표준"          │
│                                         │
│  = 사이트 없이도 A- 설계가 가능           │
└─────────────────────────────────────────┘
```

### 5.2 BSW-OS가 콜드스타트에 제공하는 6가지 지능

| # | 지능 | BSW-OS 소스 | 콜드스타트 활용 |
|---|------|-----------|-------------|
| 1 | **업종 표준 설계안** | IndustryBlueprint | 기술/스키마/콘텐츠/디자인 표준 → GENESIS 빌드 입력 |
| 2 | **우수 사이트 패턴** | BenchmarkProfile.excellentPatterns | 콘텐츠 수량/구조/스키마 목표 설정 |
| 3 | **공통 함정** | BenchmarkProfile.commonPitfalls | 생성 시 회피해야 할 패턴 → AI 프롬프트 네거티브 |
| 4 | **업종 질문 자산** | QIS Seed + Hub Probe Panel | 초기 FAQ/Answer 콘텐츠의 토픽 결정 |
| 5 | **기대 레이어** | Hub Expected Layer | must_include/must_not_do → 품질 보장 |
| 6 | **P75 목표 점수** | BenchmarkProfile.percentileDistributions | 각 메트릭의 구체적 목표 수치 |

### 5.3 콜드스타트 전용 Handoff: "Genesis Ignition Package"

기존 `SynergyHandoffPackageV2`에서 **자사 진단 데이터 없이** 업종 지능만으로 구성된 경량 패키지:

```typescript
interface GenesisIgnitionPackage {
  version: '1.0';
  mode: 'cold_start';  // 콜드스타트 전용
  
  // ── 브랜드 최소 입력 ──
  brand: {
    name: string;
    founderStory: string;
    bestReview: string;
    industryType: string;
    photos: string[];         // 업로드된 사진 URL
  };
  
  // ── 인출된 욕구 ──
  desires: {
    vibeDna: Vec7D;           // 5문항 결과
    customerWorry: string;    // Q6
    competitiveEdge: string;  // Q7
    websiteGoal: string;      // Q8
  };
  
  // ── BSW-OS 업종 지능 (사전 계산) ──
  industryIntelligence: {
    blueprint: IndustryBlueprint;
    benchmarkProfile: IndustryBenchmarkProfile;
    qisSeedQuestions: QisPredictedQuestion[];
    expectedLayer: ExpectedLayerConfig;
    excellentPatterns: string[];
    commonPitfalls: string[];
    targetScores: {
      techInfra: number;     // P75 목표
      schemaQuality: number;
      contentSemantic: number;
      aepi: number;
    };
  };
  
  // ── Archetype 매칭 결과 ──
  archetypeMatch: {
    archetypeId: string;
    profileId: string;
    confidence: number;
    msiDefaults: Partial<MsiAnswers>;
    contentSeedTitles: Record<string, string[]>;
    requiredContentAssets: ContentAssetsMatrix;
    designConfig: {
      baseTheme: string;
      vec7d: Vec7D;
      sectionPriority: string[];
    };
  };
  
  // ── Hub Content Pool 매칭 ──
  hubContent: {
    hubSlug: string;
    directAssets: number;
    customAssets: number;
    draftAssets: number;
  };
}
```

---

## 6. 콘텐츠 자동 생성 전략: "3-Source Fusion"

### 6.1 3개 콘텐츠 소스 융합

콜드스타트에서 55건+ 콘텐츠를 생성하는 3-소스 전략:

```
Source 1: Hub Content Pool (업종 공통, 즉시 활성화)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  K-Wedding Hub 예시:
  ├── [direct] 웨딩 스드메 준비 가이드 → 즉시 active
  ├── [direct] 웨딩 예산 비교표 → 즉시 active
  ├── [direct] 드레스 피팅 체크리스트 → 즉시 active
  ├── [custom] "{{브랜드명}} 촬영 스타일 안내" → AI 반영 → active
  └── [draft] "우리 스튜디오만의 특별한 점" → 테넌트 리뷰 대기
  
  수량: 15 direct + 10 custom + 5 draft = 30건
  소요 시간: direct 즉시 / custom 10초 / draft 대기
  품질: Hub 큐레이터가 사전 검증 → A등급 보장

Source 2: AI 생성 (브랜드 맞춤, Archetype + Blueprint 가이드)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Launch Orchestrator 14건:
  ├── about_brand: founder_story + credentials → EEAT 강화
  ├── answer ×5: QIS 시드 질문 → Answer-First 문체
  ├── program ×3: MSI services[] 기반
  ├── solution ×2: Q6 고객 걱정 기반 솔루션
  ├── process_step ×1: 서비스 프로세스
  ├── person ×1: 전문가 프로필 (EEAT Authority)
  └── contact_info ×1: 위치/연락처
  
  AI 프롬프트 보강 포인트:
  ├── Blueprint contentStrategy → Answer-First 강제
  ├── excellentPatterns → 우수 사이트 구조 참조
  ├── commonPitfalls → 네거티브 프롬프트
  ├── Expected Layer → must_include 본문 삽입
  └── Q7 경쟁 우위 → 차별화 포인트 강조

Source 3: QIS 질문 기반 (업종 핵심 질문 답변)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  BSW-OS QIS 시드 5건:
  ├── "여드름 흉터 치료 기간은?" → answer + FAQPage 스키마
  ├── "레이저 시술 부작용은?" → answer + HowTo 스키마
  ├── "시술 비용은 얼마인가요?" → answer (Expected Layer caution 적용)
  ├── "피부과 vs 피부관리실?" → answer + comparison Article
  └── "보톡스 부작용 기간은?" → answer + FAQPage
  
  Archetype questionCapitalSeed 3건:
  └── 아키타입별 세부 질문 (e.g., "필링 후 관리법")
  
  Q6 고객 걱정 기반 3건:
  └── 선택된 걱정에 대한 전문 답변
  
  수량: 11건
  특징: 모든 답변에 Schema.org 자동 래핑
```

### 6.2 콘텐츠 품질 부스터: Blueprint-Guided AI Prompting

**핵심 혁신:** BSW-OS Blueprint가 AI 콘텐츠 생성 프롬프트를 직접 가이드합니다.

```
기존 AI 생성 (Blueprint 없이):
  "미소 피부과의 여드름 치료에 대한 답변을 작성하세요."
  → 일반적인 답변, EEAT 약함, Answer-First 미흡

Blueprint-Guided AI 생성:
  "미소 피부과의 여드름 치료에 대한 답변을 작성하세요.
  
  [Blueprint 지시]
  - 첫 문장에 핵심 답변을 제시하세요 (Answer-First, 업종 상위 25% 패턴)
  - 다음을 반드시 포함하세요: {{expected_layer.must_include}}
  - 다음을 절대 하지 마세요: {{expected_layer.must_not_do}}
  - 전문의 자격 ({{credentials}})을 2회 이상 언급하세요 (EEAT Authority)
  - H2/H3 구조를 사용하세요 (업종 우수 사이트 공통 패턴)
  - 관련 FAQ 2개를 본문 하단에 포함하세요 (FAQPage 스키마 대비)
  - '개인차가 있을 수 있습니다' 면책 문구를 포함하세요 (의료 안전 게이트)
  
  [차별화 포인트]
  - 경쟁 우위: {{Q7_competitive_edge}}
  - 고객 걱정: {{Q6_customer_worry}}에 대한 안심 메시지 포함
  
  [참조 데이터]
  - 창업자 스토리: {{founder_story}}
  - 베스트 후기: {{best_review}}"
  
  → EEAT 강화, Answer-First, 구조화, 차별화된 고품질 답변
```

---

## 7. 디자인·구조 자동 결정: Archetype × Blueprint 융합

### 7.1 자동 결정 매트릭스

| 설계 요소 | 결정 소스 | 결정 로직 |
|---------|---------|---------|
| 컬러 팔레트 | Vibe DNA Vec7D → VTI | 코사인 유사도 → 7 아키타입 중 매칭 → 테마 색상 |
| 폰트 페어링 | VTI + 업종 | 20개 프리셋 중 VTI × industry 교차 매칭 |
| 모션 레벨 | Archetype.motionLevel | minimal/subtle/expressive |
| 히어로 섹션 | Blueprint trustPriority | high → hero_authority_proof / medium → hero_qa_focus |
| GNB 구조 | 업종 프리셋 + Blueprint 보정 | INDUSTRY_GNB_NODES + RED 갭 노드 추가 |
| 페이지 수 | Archetype requiredContentAssets | 자산 수 기반 자동 결정 (보통 8-15페이지) |
| Section 배치 | Psychology Layer 가중치 | 약한 영역 Layer 강화 (trust약→trust_strip 추가) |
| CTA 전략 | Q8 웹사이트 목적 | 예약 중심/문의 중심/이미지 중심 |

### 7.2 Section 배치 예시 (피부과, esthetic_premium_care)

```
BSW-OS Blueprint: trustPriority=high, conversionFocus=expertise
Archetype: motionLevel=subtle, homepageSectionPriority 참조
Q6: 고객 걱정 = "부작용/위험"  → Trust Layer 강화
Q8: 목적 = "신규 고객 유치"    → Action Layer 강화

자동 결정된 Home Section 배치:
┌──────────────────────────────────────────┐
│ 1. hero_authority_proof   [attention]    │ ← trustPriority=high
│    → 원장 사진 + "10년 대학병원 경력"     │
├──────────────────────────────────────────┤
│ 2. trust_strip            [trust]       │ ← Q6 부작용 걱정
│    → 전문의 자격 + 시술 건수 + 만족도     │
├──────────────────────────────────────────┤
│ 3. service_grid           [value]       │ ← MSI services[]
│    → 여드름/색소/레이저 카드              │
├──────────────────────────────────────────┤
│ 4. faq_accordion          [trust]       │ ← QIS 시드 질문
│    → "부작용은?" "기간은?" "비용은?"      │
├──────────────────────────────────────────┤
│ 5. doctor_profile         [proof]       │ ← Archetype person 필수
│    → 원장 프로필 + 경력 + 자격           │
├──────────────────────────────────────────┤
│ 6. testimonial            [proof]       │ ← MSI best_review
│    → 베스트 후기 카드                    │
├──────────────────────────────────────────┤
│ 7. process_step           [value]       │ ← 시술 프로세스
│    → 상담→진단→시술→경과 4단계           │
├──────────────────────────────────────────┤
│ 8. cta_banner             [action]      │ ← Q8 신규 고객
│    → "지금 상담 예약하기"                │
├──────────────────────────────────────────┤
│ 9. map_embed              [action]      │ ← contact_info
│    → 위치 + 영업시간 + 전화번호          │
└──────────────────────────────────────────┘
```

---

## 8. 런칭 후 자동 성장: Week 1-4 로드맵

### 8.1 자동 성장 타임라인

```
Day 0: 런칭 ✅
  └── 55건 콘텐츠 active, GEO ≥ 60, 예상 AEPI: 65-70 (B+)

Day 1-6: Growth Orchestrator Week 1
  ├── 🟢 Hub direct 3건 자동 추가 (launch phase)
  ├── 🟡 [TUNE_HERE] 리뷰 미션 카드 3건
  └── 🔴 사진 추가 요청 (10장 미만 시)

Day 7: BSW Seeding
  └── pullBswPredictions() → topics 테이블에 20건 시드
      → 이후 주간 Growth에서 예측 콘텐츠 자동 생성

Week 2: Growth + Polish
  ├── 🟡 QIS 예측 질문 2건 → AI 답변 드래프트 (24h 리뷰)
  ├── 🟡 Polish Engine: 기존 콘텐츠 5건 → fill_meta + add_structure
  ├── GEO 프로브: 예상 δ +15pt (GEO C→B)
  └── 예상 AEPI: 70-75 (A-)  ← ★ A- 도달 시점

Week 3-4: 안정화 + 심화
  ├── 🟡 QIS 예측 질문 추가 2건/주
  ├── Polish Engine: enrich_body + strengthen_brand 전략
  ├── Hub custom_template 5건 리뷰 완료
  ├── Adaptive Coach: 가장 낮은 TF8 블록 코칭
  └── 예상 AEPI: 75-80 (A)

Month 2: BSW-OS 자동 재진단
  ├── Quick Audit → AEPI δ 측정
  ├── 업종 포지셔닝: 예상 65%ile+ (상위 35%)
  └── 추가 개선 전략 자동 생성
```

### 8.2 A- 도달 시점 예측

| 시나리오 | A- 도달 시점 | 조건 |
|---------|-----------|------|
| **최적** (사진 10장+, 리뷰 5건+) | **Day 0** (즉시) | 충분한 미디어 자산 |
| **표준** (사진 3-5장, 리뷰 1건) | **Week 2** (14일) | 2주간 Polish + 추가 콘텐츠 |
| **최소** (사진 3장, 리뷰 0건) | **Week 3-4** (21-28일) | Growth 자동 성장에 의존 |

**핵심 변수:** 사진 수와 실제 후기가 L3/EEAT 점수를 가장 크게 좌우합니다.

---

## 9. A- 품질 보증 메커니즘

### 9.1 4중 품질 게이트

```
Gate 1: Expected Layer (생성 시)
  → must_include 삽입 검증 (100% 통과 필수)
  → must_not_do 위반 검사 (0건 필수)
  → 의료/금융 Safety Gate 적용

Gate 2: CMOS Quality Gate (생성 직후)
  → 5 Mandatory: SSoT 일관 + [TUNE_HERE] 해소 + 권리 + 감시 목록
  → 4 Dimension: EEAT(30%) + AEO/GEO(30%) + 완성도(25%) + 출처(15%)
  → 통과 기준: score ≥ 60

Gate 3: Polish Scorer (Week 1-2)
  → 5차원 품질 점수: 풍부함(30%) + SEO(20%) + AEO(20%) + 브랜드(15%) + 구조(15%)
  → B등급 미만 자산 → 자동 Polish 전략 적용

Gate 4: GEO Probe (런칭 시 + 매주)
  → 25-item 프로브: 사이트 전체 AI 가시성 검증
  → 런칭 기준: ≥ 60점
  → 주간 추적: δ 양수 유지
```

### 9.2 HITL (Human-in-the-Loop) 최소화 전략

콜드스타트에서 HITL 카드를 최소화하여 "즉시 런칭" 경험을 극대화합니다.

| HITL 유형 | 콜드스타트 전략 | block 여부 |
|---------|-------------|----------|
| [TUNE_HERE] 마커 | Archetype msiDefaults로 자동 채움 → 마커 0개 목표 | warn (block 아님) |
| 가격 언급 (₩) | AI 프롬프트에 "구체적 가격 미언급" 지시 → 가격 없이 생성 | 제거 |
| 정책 리뷰 | Hub direct 정책 콘텐츠 사용 → 사전 검증 완료 | 제거 |
| 사진 부족 | 최소 3장으로 런칭 허용, Week 1에 🔴 추가 요청 | warn (block 아님) |

**결과:** block HITL 카드 0개 → **즉시 런칭 가능**

---

## 10. 업종별 콜드스타트 최적화

### 10.1 업종별 차별화 포인트

| 업종 | 핵심 콘텐츠 | Safety Gate | Expected Layer 핵심 |
|------|-----------|-----------|-------------------|
| **스킨케어** | 성분 비교, 루틴, 부작용 | medical | "개인차가 있을 수 있습니다" 면책 |
| **클리닉** | 시술 프로세스, 비용, 전후 | medical | "전문의 상담 권고" 필수 |
| **웨딩** | 포트폴리오, 비용 비교, 후기 | standard | "촬영 시간, 보정본 기간 명시" |
| **컨설팅** | 케이스 스터디, 방법론, 자격 | financial | "결과 보장 불가" 면책 |
| **한방** | 체질, 한약, 침 시술 | medical | "한의사 진단 후 처방" 필수 |
| **부동산** | 매물, 시세, 법적 절차 | financial | "투자 손실 가능성" 경고 |
| **음식점** | 메뉴, 예약, 위치, 분위기 | standard | "알레르기 안내" 권장 |
| **사진** | 포트폴리오, 스타일, 가격 | standard | "촬영 시간, 보정 범위 명시" |

### 10.2 Archetype별 콘텐츠 수량 기준

| Archetype | 필수 자산 수 | Hub 공급 | AI 생성 | QIS 질문 |
|-----------|-----------|---------|---------|---------|
| esthetic_premium_care | 35건 | 15 | 12 | 8 |
| kwedding_luxury | 38건 | 20 | 10 | 8 |
| consulting_authority | 32건 | 10 | 14 | 8 |
| skincare_natural | 30건 | 15 | 10 | 5 |
| indie_clean_beauty | 28건 | 12 | 10 | 6 |

---

## 11. 비즈니스 모델 연계

### 11.1 콜드스타트 → 유료 전환 퍼널

```
Step 1: BSW-OS Free 업종 진단 (무료)
  → "당신 업종에서 A등급 사이트는 이런 모습입니다"
  → "지금 바로 A- 수준 사이트를 개설할 수 있습니다"
  
Step 2: GENESIS 즉시 개설 (유료 — Starter ₩330K~)
  → 2분 30초 입력 → 5분 후 사이트 런칭
  → 55건 콘텐츠 + 풀 디자인 + Schema + AI 봇 최적화
  
Step 3: Growth Orchestrator (구독 — Monthly ₩99K~)
  → 주간 자동 콘텐츠 생성 + Polish + QIS
  → 월간 BSW-OS 재진단 + 업종 포지셔닝
  
Step 4: 업그레이드 (UGS 기반 자동 제안)
  → UGS 500+ → Vertical 티어 (더 많은 Hub 콘텐츠)
  → UGS 700+ → Enterprise 티어 (풀 BSW-OS Full Audit)
```

### 11.2 핵심 KPI

| KPI | 목표 | 측정 |
|-----|------|------|
| 입력-런칭 시간 | ≤ 5분 | Phase 0 시작 ~ Phase 5 완료 |
| 초기 콘텐츠 수 | ≥ 45건 | Hub + AI + QIS 합계 |
| 런칭 시 AEPI | ≥ 65 | BSW-OS Quick Audit |
| Week 2 AEPI | ≥ 70 (A-) | BSW-OS Quick Audit |
| block HITL 카드 | 0건 | 즉시 런칭 보장 |
| 유료 전환율 | ≥ 30% | Free 진단 → Starter 결제 |

---

## 12. 요약: Near-Zero → A- 핵심 공식

```
A- 웹사이트 = (업종 지능 × 아키타입) + (Hub 콘텐츠 + AI 생성 + QIS 질문) + 자동 성장

             BSW-OS 기여                GENESIS 기여              융합 기여
           ─────────────            ──────────────           ─────────────
           Blueprint (설계 표준)     Archetype (풀스택 결정)   Blueprint→AI 프롬프트
           Benchmark (목표 점수)     VTDS (디자인 자동 생성)   QIS→FAQ 콘텐츠
           QIS Seed (질문 자산)      Hub Pool (즉시 공급)     Expected Layer→품질
           Expected Layer (기준)     Launch Orch. (AI 생성)   벤치마크→GEO 목표
           Excellent Patterns       Growth Orch. (자동 성장)  Archetype Elo→학습
           Common Pitfalls          Polish Engine (자동 개선)  재진단→δ 측정
```

> **한 줄 요약:** 소상공인이 "브랜드명 + 3문장 + Vibe 5문항 + 사진 3장"만 제공하면, BSW-OS의 업종 지능이 GENESIS의 아키타입·Hub·AI 생성을 가이드하여, **2분 30초 입력 → 5분 후 업종 Top 25% 수준(A-) 웹사이트 자동 개설 → 매주 자동 콘텐츠 성장**이 실현됩니다.
