# BSW-OS 브랜드 종합 활용 가이드 — Part 1: 시스템 아키텍처 총론

> **문서 버전:** v3.0 | **최종 갱신:** 2026-06-26
> **대상 독자:** BSW-OS를 활용하는 브랜드 운영자, 컨설턴트, 개발자
> **관련 문서:** [Part 2: 업종 벤치마크 & 역설계](BSW_OS_BRAND_GUIDE_PART2_BENCHMARK_REVERSE_ENGINEERING.md) · [Part 3: QIS & 콘텐츠 전략](BSW_OS_BRAND_GUIDE_PART3_QIS_CONTENT_STRATEGY.md)

---

## 1. BSW-OS란 무엇인가

**BSW-OS(Brand Search Warfare Operating System)**는 AI 검색 시대에 브랜드의 온라인 가시성을 측정·진단·최적화하는 통합 운영 시스템입니다.

### 1.1 핵심 미션

> **"AI가 당신의 브랜드를 얼마나 정확하게 이해하고 추천하는가?"**

기존 SEO가 구글 SERP 순위를 추적했다면, BSW-OS는 **ChatGPT, Gemini, Perplexity 등 AI 검색 엔진이 브랜드를 어떻게 반영(Reflect)하는지** 정량적으로 측정합니다.

### 1.2 시스템이 해결하는 문제

| 기존 문제 | BSW-OS 해결책 |
|----------|--------------|
| AI가 내 브랜드를 잘못 설명함 | Entity Reflection 측정 → 왜곡 패턴 식별 → 교정 처방 |
| 경쟁사가 AI 답변에서 먼저 추천됨 | 경쟁 포지셔닝 분석 → CWR(경쟁 승률) 추적 |
| 업종 전체의 AI 대응 수준을 모름 | 업종 벤치마크 → AEPI 순위 + 분포 인포그래픽 |
| 어떤 콘텐츠를 만들어야 할지 모름 | QIS 예측 → QVS×AEPI 전략 매트릭스 → First Mover 타임라인 |
| 웹사이트 기술 수준이 AI에 적합한지 모름 | L1/L2/L3 3차원 기술 감사 → 자동 처방 |

---

## 2. 시스템 아키텍처 전체 맵

```
┌─────────────────────────────────────────────────────────────────┐
│                     BSW-OS Architecture V3                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──── 입력층 (Input) ────────────────────────────────────┐    │
│  │  브랜드 웹사이트 URL → Crawler → Page Data             │    │
│  │  Hub 시그널 (QIS) → Signal Ingest → 예측 엔진          │    │
│  │  업종 레퍼런스 사이트 → Batch Audit Runner              │    │
│  └────────────────────────────────────────────────────────┘    │
│           ↓                    ↓                    ↓          │
│  ┌──── 분석층 (Analysis) ─────────────────────────────────┐    │
│  │                                                         │    │
│  │  ┌─── Surface ──┐  ┌─ Benchmark ─┐  ┌──── QIS ────┐  │    │
│  │  │ Tech Infra   │  │ AEPI Calc   │  │ Signal Rx   │  │    │
│  │  │ Schema Audit │  │ Gap Analyze │  │ Q Predictor │  │    │
│  │  │ Content Sem. │  │ Per-Layer   │  │ QVS Score   │  │    │
│  │  │ Persona Rev. │  │ Opportunity │  │ Cross-Map   │  │    │
│  │  │ KG Builder   │  │ Temporal    │  │ Tri-Axis    │  │    │
│  │  └──────────────┘  └─────────────┘  └─────────────┘  │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│           ↓                    ↓                    ↓          │
│  ┌──── 진단층 (Diagnosis) ────────────────────────────────┐    │
│  │  Deep Dive 5-Dimension Diagnostic                       │    │
│  │  ├─ D-MRI (Digital MRI)                                 │    │
│  │  ├─ Benchmark Snapshot (AAS/OCR/BSF/BAIR/BDR/CWR)     │    │
│  │  ├─ Opportunity Report (Gap/Volatile/Weak/Dominance)   │    │
│  │  ├─ Truth Audit (Claims/Evidence/Boundaries)           │    │
│  │  └─ Semantic Audit (CQ/QIS/Ontology)                   │    │
│  └─────────────────────────────────────────────────────────┘    │
│           ↓                    ↓                    ↓          │
│  ┌──── 처방층 (Prescription) ─────────────────────────────┐    │
│  │  Content Blueprint → Schema Suggestions → Fix-It Auto  │    │
│  │  QVS×AEPI Strategy Matrix → First Mover Timeline       │    │
│  │  Gap Quadrant Prescriptions → AEPI Impact Simulation   │    │
│  └─────────────────────────────────────────────────────────┘    │
│           ↓                                                     │
│  ┌──── 실행층 (Execution) ────────────────────────────────┐    │
│  │  GENESIS (AIHOMPYHUB) ← Blueprint Handoff               │    │
│  │  → 5분 내 A-급 웹사이트 자동 생성                       │    │
│  │  → TAAW 콘텐츠 자동 생산 파이프라인                     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. 핵심 모듈 상세

### 3.1 Surface Layer — 브랜드 웹사이트 역설계 엔진

브랜드 웹사이트를 크롤링하여 AI 검색 최적화 관점에서 3차원 감사를 수행합니다.

| 차원 | 모듈 | 측정 대상 | 핵심 메트릭 |
|------|------|----------|-------------|
| **L1 기술 인프라** | `tech-infra-auditor.ts` | AI 봇 접근성, SSL, TTFB, 사이트맵, Canonical, 렌더링 | `techInfraScore` (0-100) |
| **L2 스키마 품질** | `schema-quality-auditor.ts` | 구조화 데이터 완성도, 커버리지, OG 메타, Schema 유형 | `schemaQualityScore` (0-100) |
| **L3 콘텐츠 시맨틱** | `content-semantic-analyzer.ts` | E-E-A-T 4축, Answer-First, 신선도, 독창성, 인용 품질 | `contentSemanticScore` (0-100) |

**L1 Tech Infra 상세 가중치:**

```
techInfraScore = 0.30 × aiCrawlerAccess
              + 0.15 × SSL
              + 0.15 × TTFB
              + 0.15 × sitemap
              + 0.15 × canonical
              + 0.10 × rendering
```

- **AI 크롤러 접근성 (30%)**: 100점에서 시작, 차단된 봇 1개당 -20점 (OAI-SearchBot, GPTBot, Google-Extended, PerplexityBot, Anthropic-AI)
- **TTFB (15%)**: <800ms=100 / <3000ms=60 / ≥3000ms=20
- **렌더링 (10%)**: SSR=100 / Hybrid=80 / CSR=40 / llms.txt 존재 시 +10 보너스

**L2 Schema Quality 상세 가중치:**

```
schemaQualityScore = 0.40 × avgSchemaCompleteness
                   + 0.20 × schemaCoverage
                   + 0.25 × ogCompleteness
                   + 0.15 × metaScore
```

- 검사 스키마 유형: Organization, LocalBusiness, FAQPage, HowTo, Product, Article, BreadcrumbList, AggregateRating
- 각 스키마 완성도 = `발견된 필드 수 / 전체 필드 수 × 100`

**L3 Content Semantic 상세 가중치:**

```
contentSemanticScore = 0.35 × eeatOverall
                     + 0.20 × answerFirst
                     + 0.15 × freshness
                     + 0.10 × topology
                     + 0.10 × multimedia
                     + 0.10 × originality
```

**E-E-A-T 4축 채점 (15개 시그널):**

| 축 | 시그널 | 비중 |
|----|--------|------|
| **Experience** | 리뷰 키워드(25), AggregateRating 스키마(25), 1인칭 서술(30), 제품 이미지+alt(20) | 25% |
| **Expertise** | 저자 메타(25), 저자 프로필 링크(25), 자격/학위 키워드(25), Article 스키마(25) | 25% |
| **Authoritativeness** | Org sameAs 프로필(40), Gov/Edu/Wikipedia 인용(30), 수상/인증 키워드(30) | 25% |
| **Trustworthiness** | HTTPS(30), 개인정보/약관 링크(25), 연락처 정보(25), 환불/보증 정책(20) | 25% |

### 3.2 추가 Surface 모듈

| 모듈 | 파일 | 기능 |
|------|------|------|
| **페르소나 역설계** | `persona-reverse-engineer.ts` | AI가 브랜드를 어떤 톤·어조·성격으로 묘사하는지 5차원 분석 (warmth, formality, confidence, expertise, empathy) |
| **엔티티 추출** | `llm-entity-extractor.ts` | 웹페이지에서 핵심 엔티티(팩토이드, 절차, 비교, 권위 등) AI 기반 추출 |
| **지식그래프 빌더** | `knowledge-graph-builder.ts` | 추출된 엔티티 간 관계 추론 → 브랜드 온톨로지 그래프 자동 구축 |
| **프로브 생성기** | `probe-generator.ts` | 브랜드 사이트에서 AI 검색 검증용 질문 자동 생성 |
| **답변카드 역설계** | `answer-card-reverser.ts` | AI 검색 답변의 구조(제목, 본문, 인용) 역분석 |
| **바이브 벡터** | `vibe-vector-analyzer.ts` | 브랜드의 감성·정서적 DNA 벡터 분석 |
| **QIS 교차 매퍼** | `qis-cross-mapper.ts` | 업종 필수 질문 vs 사이트 커버리지 갭 분석 → RED/GREEN/WHITE 매핑 |

---

### 3.3 AEPI (AEO Entity Performance Index) — 통합 성능 지수

**BSW-OS의 핵심 KPI**로, 브랜드의 AI 검색 성능을 단일 점수로 표현합니다.

**공식:**
```
AEPI = baseScore × techModifier × eeatModifier × macroMultiplier
```

| 구성요소 | 계산 | 범위 |
|---------|------|------|
| **baseScore** | 7개 ERR 차원 × 세부업종별 가중치 합산 | 0-100 |
| **techModifier** | `0.8 + 0.2 × (techScore/100)` | 0.8-1.0 |
| **eeatModifier** | `0.8 + 0.2 × (eeatScore/100)` | 0.8-1.0 |
| **macroMultiplier** | `1.0 + clamp(macroAdj/100, -0.10, +0.10)` | 0.90-1.10 |

**7개 ERR(Entity Reflection Rate) 차원:**

| 차원 | 측정 대상 |
|------|----------|
| `err_factoid` | 사실 정보 (주소, 영업시간, 가격 등) 반영률 |
| `err_procedural` | 이용 절차, 예약 방법 등 반영률 |
| `err_comparative` | 경쟁 비교 질문에서의 반영률 |
| `err_authority` | 전문성/권위 정보 반영률 |
| `err_schema` | 구조화 데이터 기반 정보 반영률 |
| `err_topical` | 주제 클러스터 내 반영률 |
| `err_geo` | 지역 기반 검색에서의 반영률 |

**반영 품질(ReflectionQuality) 가중치:**

| 품질 | 가중치 | 의미 |
|------|--------|------|
| `exact` | 1.0 | 정확한 반영 |
| `partial` | 0.6 | 부분 반영 |
| `distorted` | 0.2 | 왜곡된 반영 |
| `absent` | 0.0 | 미반영 |
| `competitor_substituted` | 0.0 | 경쟁사로 대체됨 |

**Layer 1 — BM 매크로 카테고리별 5-Area 가중치:**

| 카테고리 | Entity(e) | Content(c) | Tech(t) | Schema(s) | E-E-A-T(r) |
|---------|-----------|-----------|---------|-----------|------------|
| 이커머스/D2C | 0.20 | 0.20 | 0.25 | 0.25 | 0.10 |
| 로컬 서비스 | 0.15 | 0.15 | 0.20 | 0.20 | **0.30** |
| YMYL 전문직 | 0.25 | 0.15 | 0.15 | 0.15 | **0.30** |
| B2B SaaS | 0.20 | **0.35** | 0.20 | 0.15 | 0.10 |
| 미디어/콘텐츠 | 0.25 | **0.30** | 0.10 | 0.15 | 0.20 |

> **핵심 인사이트:** 로컬 서비스와 YMYL 전문직은 E-E-A-T 비중이 30%로 가장 높습니다. 이커머스는 기술+스키마가 50%를 차지합니다.

---

### 3.4 업종 분류 체계 (Industry Taxonomy V3)

BSW-OS는 비즈니스 모델(BM) 기반 3-Tier 분류 체계를 사용합니다.

**Tier 1 — 5대 BM 매크로 카테고리:**

| # | 카테고리 | 아이콘 | 특성 |
|---|---------|--------|------|
| 1 | 이커머스/D2C 제품형 | 🛒 | 상품 판매 중심, 스키마 중시 |
| 2 | 지역 기반 오프라인 서비스형 | 📍 | 로컬 SEO, E-E-A-T 핵심 |
| 3 | 고신뢰 전문직 YMYL | 🛡️ | 규제 준수, 전문성 필수 |
| 4 | B2B 테크/SaaS | 💻 | 콘텐츠 마케팅 중심 |
| 5 | 미디어/콘텐츠 허브 | 🎬 | 엔티티 밀도, 콘텐츠 양 |

**Tier 2 — 28개 세부 업종:**

| 매크로 | 세부 업종 |
|--------|----------|
| 이커머스/D2C | skincare, fashion, food_product, home_living |
| 로컬 서비스 | hair_nail, restaurant_cafe, fitness, wedding, hotel, academy, auto_service, pet_care |
| YMYL 전문직 | medical_clinic, hanbang, senior_care, legal, finance_accounting, real_estate |
| B2B SaaS | it_saas, consulting, online_education, startup |
| 미디어/콘텐츠 | photography, entertainment, k_culture_content, expert_professional, place_brand, travel_tourism |

**Tier 3 — 48+ AIHOMPY 변환 키:**

BSW-OS 28개 키 ↔ AIHOMPY 48+ 세분화 키 양방향 매핑 지원. 예: `wedding`(BSW) ↔ `wedding_hall`, `wedding_studio`, `wedding_planner` 등 12개 변환.

---

### 3.5 Entity Reflection Runner — AI 반영도 측정 엔진

**작동 방식:**

1. 브랜드 사이트에서 엔티티 추출 (LLM Entity Extractor)
2. 프로브 질문 생성 (Probe Generator)
3. AI 검색 엔진에 프로브 질문 전송 (ChatGPT Search, Gemini Grounding)
4. AI 응답에서 브랜드 엔티티가 얼마나 정확하게 반영되는지 측정
5. 왜곡 패턴 분류: `exact` / `partial` / `distorted` / `absent` / `competitor_substituted`
6. 7개 ERR 차원별 점수 산출 → AEPI 계산

**판별 로직:**
```
keyword overlap ≥ 0.8 AND name match → exact
keyword overlap ≥ 0.4 AND name match → partial
keyword overlap ≥ 0.6                → partial
keyword overlap ≥ 0.2                → distorted
brand domain cited with overlap > 0  → partial
else                                 → absent
```

---

### 3.6 Zero-AI-Judge 경량 메트릭 (Lightweight Metric Runner)

AI 판정 없이 실시간 측정 가능한 4대 핵심 메트릭:

| 메트릭 | 이름 | 계산 | 의미 |
|--------|------|------|------|
| **AAS** | Brand Answer Share | AI 응답 중 브랜드 키워드 언급 비율 | "AI가 우리를 얼마나 자주 언급하는가" |
| **OCR** | Observed Citation Rate | AI 응답 인용 중 브랜드 도메인 비율 | "AI가 우리를 출처로 인용하는가" |
| **BSF** | Brand Semantic Fidelity | must_include 키워드 발견 비율 | "AI가 우리를 정확하게 설명하는가" |
| **BAIR** | Brand AI Response Index | `AAS × (BSF/100)` | "종합 AI 응답 지수" |

---

### 3.7 Deep Dive — 5차원 심층 진단

Deep Dive는 브랜드의 AI 검색 상태를 5가지 차원으로 정밀 진단합니다:

| 차원 | 이름 | 측정 내용 |
|------|------|----------|
| **D-MRI** | Digital MRI | 브랜드 디지털 건강 종합 지수 |
| **Benchmark** | 벤치마크 스냅샷 | AAS, OCR, BSF, BAIR, BDR, CWR, IRI, OPP, 랭크, 언급 품질 |
| **Opportunity** | 기회 보고서 | Gap, Volatile, Weak Mention, Dominance, Blind Spot |
| **Truth** | 진실 감사 | 전략적 진실 존재 여부, 운영 클레임, 증거 커버리지, 경계 커버리지 |
| **Semantic** | 시맨틱 감사 | 질문 자본 노드, CQ, QIS Scene, 연결률, 온톨로지 노드 |

---

## 4. 데이터 흐름: 브랜드 진단에서 처방까지

```
[1단계: 입력]
  브랜드 URL 입력
     ↓
[2단계: 크롤링 & 분석]
  Website Crawler → Page Data (HTML, Meta, Schema)
     ↓
  ┌─────────────┬─────────────┬─────────────┐
  │ L1 Tech     │ L2 Schema   │ L3 Content  │
  │ Infra Audit │ Quality     │ Semantic    │
  └─────┬───────┴──────┬──────┴─────┬───────┘
        ↓              ↓            ↓
[3단계: 엔티티 추출 & AI 프로빙]
  LLM Entity Extractor → Surface Entities
  Probe Generator → Probe Questions
  AI Engines (ChatGPT, Gemini) → AI Responses
     ↓
[4단계: 반영도 측정]
  Entity Reflection Runner
  → 7-Dimension ERR Scores
  → Distortion Pattern Classification
     ↓
[5단계: 종합 점수 계산]
  AEPI Calculator
  → baseScore × techMod × eeatMod × macroMult
  → AEPI Score (0-100)
     ↓
[6단계: 갭 분석 & 처방]
  Gap Analyzer → 4-Quadrant (GREEN/YELLOW/RED/WHITE)
  Opportunity Analyzer → 5-Type Opportunities
  Per-Layer Metrics → IRI/BDR/CWR/OPP
     ↓
[7단계: 콘텐츠 처방]
  Content Blueprint Generator
  → 제목 구조, 스키마 제안, 증거 연결
  → 예상 AEPI 임팩트 시뮬레이션
     ↓
[8단계: 실행]
  GENESIS (AIHOMPYHUB) → A-급 웹사이트 자동 생성
  TAAW → 콘텐츠 자동 생산 파이프라인
```

---

## 5. 연관 시스템 연동 맵

### 5.1 BSW-OS ↔ AIHOMPYHUB 연동

| 연동 포인트 | 방향 | 데이터 |
|------------|------|--------|
| 업종 분류 체계 | BSW → HUB | 28개 BSW 키 → 48+ AIHOMPY 키 양방향 매핑 |
| QIS 시그널 | HUB → BSW | 커뮤니티 질문, 리뷰, 가격 데이터 등 22종 시그널 |
| 예측 질문 | BSW → HUB | QVS 포함 예측 질문 배치 전송 |
| 피드백 | HUB → BSW | 예측 질문 출현 여부 + 정확도 피드백 |
| GENESIS 핸드오프 | BSW → HUB | GenesisIgnitionPackage (블루프린트, 가중치, 스키마 템플릿) |

### 5.2 BSW-OS ↔ GENESIS 연동

```
BSW Diagnosis → IndustryBlueprint → GenesisIgnitionPackage
                                          ↓
                                    GENESIS 5-Stage Pipeline
                                    ├─ Multi-Modal Intake
                                    ├─ Intelligence
                                    ├─ Synthesis
                                    ├─ Content Forge
                                    └─ Quality Gate → Deploy
```

**Cold Start A- 전략:** 브랜드명 + 3문장 소개 + Vibe 5문답 + 사진 3장 → BSW 업종 지능 주입 → GENESIS가 5분 내 A-급 사이트 자동 생성

---

## 6. 기술 스택 & 배포

| 항목 | 기술 |
|------|------|
| 프레임워크 | Next.js (App Router) |
| 언어 | TypeScript |
| 데이터베이스 | Supabase (PostgreSQL) |
| AI 엔진 | OpenAI GPT-4o, Google Gemini |
| 차트 | Recharts |
| 호스팅 | Vercel |
| Cron | Vercel Cron (요일별 업종 자동 감사) |

---

## 7. 핵심 용어 사전

| 용어 | 영문 | 의미 |
|------|------|------|
| AEPI | AEO Entity Performance Index | AI 검색 엔티티 성능 종합 지수 (0-100) |
| AEO | AI Engine Optimization | AI 검색 엔진 최적화 |
| ERR | Entity Reflection Rate | 엔티티 반영률 (AI가 브랜드 정보를 얼마나 정확히 반영하는지) |
| QIS | Query Intelligence System | 질문 지능 시스템 (시그널 수집 → 질문 예측) |
| QVS | Query Value Score | 질문 가치 점수 (볼륨 × 전환율 × 객단가) |
| BDR | Brand Defense Rate | 브랜드 방어율 (브랜드 관련 질문에서의 언급률) |
| CWR | Competitive Win Rate | 경쟁 승률 (경쟁 비교 질문에서 선순위 언급률) |
| IRI | Industry Readiness Index | 업종 준비도 (업종 내 브랜드 언급률) |
| OPP | Opportunity Score | 기회 점수 (미언급 영역의 블루오션 기회) |
| AAS | Brand Answer Share | AI 답변 중 브랜드 언급 비율 |
| OCR | Observed Citation Rate | AI 인용 중 브랜드 도메인 비율 |
| BSF | Brand Semantic Fidelity | 브랜드 시맨틱 충실도 |
| D-MRI | Digital MRI | 디지털 건강 종합 지수 |
| E-E-A-T | Experience, Expertise, Authoritativeness, Trustworthiness | 경험·전문성·권위·신뢰 |
| TAAW | Tenant-Aware Authoring Workflow | 테넌트 인식 콘텐츠 제작 워크플로 |

---

> **다음 문서:** [Part 2: 업종 벤치마크 & 브랜드 역설계 활용 가이드](BSW_OS_BRAND_GUIDE_PART2_BENCHMARK_REVERSE_ENGINEERING.md)
