# BSW-OS 서피스/브랜드 역설계 및 업종 벤치마크 시스템 정밀 감사 보고서

> 감사 일시: 2026-06-26 | 대상: BSW-OS (`c:\Users\User\bsw`)

---

## 1. 시스템 아키텍처 개요

```
┌────────────────────────────────────────────────────────────────────┐
│                    BSW-OS 서피스 역설계 엔진                         │
├──────────────┬───────────────┬───────────────┬────────────────────┤
│  Crawling    │   Analysis    │   Benchmark   │   Industry         │
│  Layer       │   Layer       │   Layer       │   Layer            │
├──────────────┼───────────────┼───────────────┼────────────────────┤
│ website-     │ quick-site-   │ entity-       │ industry-          │
│ crawler.ts   │ analyzer.ts   │ reflection-   │ taxonomy.ts        │
│ (27KB)       │ (27KB)        │ runner.ts     │                    │
│              │               │ (14KB)        │ reference-sites-   │
│              │ llm-entity-   │               │ registry.ts        │
│              │ extractor.ts  │ gap-          │                    │
│              │ (16KB)        │ analyzer.ts   │ batch-audit-       │
│              │               │ (10KB)        │ runner.ts (15KB)   │
│              │ answer-card-  │               │                    │
│              │ reverser.ts   │ aepi-         │ benchmark-         │
│              │ (10KB)        │ calculator.ts │ aggregator.ts      │
│              │               │ (4KB)         │ (21KB)             │
│              │ persona-      │               │                    │
│              │ reverse-      │ temporal-     │ relative-          │
│              │ engineer.ts   │ tracker.ts    │ positioner.ts      │
│              │ (15KB)        │ (2KB)         │ (9KB)              │
│              │               │               │                    │
│              │ tech-infra-   │ opportunity-  │ strategy-          │
│              │ auditor.ts    │ analyzer.ts   │ generator.ts       │
│              │ (12KB)        │ (11KB)        │ (9KB)              │
│              │               │               │                    │
│              │ schema-       │ qvs-          │                    │
│              │ quality-      │ portfolio-    │                    │
│              │ auditor.ts    │ manager.ts    │                    │
│              │ (16KB)        │               │                    │
│              │               │               │                    │
│              │ content-      │ fair-probe-   │                    │
│              │ semantic-     │ templates.ts  │                    │
│              │ analyzer.ts   │ (26KB)        │                    │
│              │ (25KB)        │               │                    │
│              │               │               │                    │
│              │ probe-        │               │                    │
│              │ generator.ts  │               │                    │
│              │ (7KB)         │               │                    │
│              │               │               │                    │
│              │ knowledge-    │               │                    │
│              │ graph-        │               │                    │
│              │ builder.ts    │               │                    │
│              │ (8KB)         │               │                    │
│              │               │               │                    │
│              │ qis-cross-    │               │                    │
│              │ mapper.ts     │               │                    │
│              │ (6KB)         │               │                    │
└──────────────┴───────────────┴───────────────┴────────────────────┘
```

**코드 총량:** ~348KB (lib/surface 12파일, lib/benchmark 15파일, lib/industry 6파일)

---

## 2. 서피스/브랜드 역설계 파이프라인

### 2.1 Full Site Audit 11-Step Pipeline

`app/actions/site-audit.ts` → `runFullSiteAuditBackground()`

| Step | 모듈 | 기능 | 출력 |
|------|------|------|------|
| 1 | `WebsiteCrawler` | 대상 사이트 크롤링 (Jina Reader API + Sitemap + Robots.txt) | `CrawledPage[]` |
| 2 | `QuickSiteAnalyzer` | 빠른 엔티티 추출 + EEAT 신호 감지 + AEO 점수 계산 | `QuickAuditResult` |
| 3 | `LlmEntityExtractor` | LLM 기반 심층 엔티티 추출 (10개 카테고리) | `SurfaceEntity[]` |
| 4 | `KnowledgeGraphBuilder` | 엔티티 관계 그래프 구축 | `KnowledgeGraph` |
| 5 | `AnswerCardReverser` | AI 답변 카드 역설계 (7가지 유형) | `ReversedAnswerCard[]` |
| 6 | `PersonaReverseEngineer` | AI 페르소나 역설계 (6차원) | `ObservedParametricPersona` |
| 7 | `TechInfraAuditor` | 기술 인프라 감사 (PWA, CDN, Core Web Vitals 등) | `TechInfraAuditResult` |
| 8 | `SchemaQualityAuditor` | Schema.org 구조화 데이터 품질 감사 | `SchemaQualityAuditResult` |
| 9 | `ContentSemanticAnalyzer` | 콘텐츠 시맨틱 분석 (토픽 클러스터, 읽기 수준, FAQ 추출) | `ContentSemanticResult` |
| 10 | `EntityReflectionRunner` | AI 검색 엔진 반영도 검증 (Gemini/OpenAI 프로빙) | `EntityReflectionSnapshot` |
| 11 | `GapAnalyzer` | 4분면 갭 분석 + 처방전 생성 | `SurfaceGapAnalysis` |

### 2.2 핵심 분석 모듈 상세

#### 2.2.1 WebsiteCrawler (`lib/surface/website-crawler.ts`, 27KB)

```typescript
interface CrawledPage {
  url: string;
  title: string;
  description: string;
  h1: string;
  headings: { level: number; text: string }[];
  bodyText: string;
  links: { href: string; text: string; isExternal: boolean }[];
  images: { src: string; alt: string }[];
  schemaMarkup: object[];
  openGraphTags: Record<string, string>;
  technicalSignals: {
    hasCanonical: boolean;
    hasHreflang: boolean;
    hasSitemap: boolean;
    hasRobots: boolean;
    httpsOnly: boolean;
    responseTime: number;
  };
  rawHtml: string;
  crawledAt: string;
}
```

- **Jina Reader API**: `r.jina.ai/{url}` 통해 JavaScript 렌더링된 콘텐츠 수집
- **Sitemap 파싱**: XML Sitemap에서 전체 URL 목록 수집
- **Robots.txt**: 크롤링 허용/차단 규칙 존중
- **최대 크롤링**: 기본 10페이지, 풀 모드 50페이지

#### 2.2.2 QuickSiteAnalyzer (`lib/surface/quick-site-analyzer.ts`, 27KB)

**AEO 점수 계산 공식:**
```
AEPI = (entityScore × 0.3) + (contentScore × 0.25) + (technicalScore × 0.2)
     + (schemaScore × 0.15) + (eatScore × 0.1)
```

**엔티티 10개 카테고리:**
1. `brand_entity` — 브랜드명, 로고, 슬로건
2. `product_entity` — 상품/서비스
3. `person_entity` — 전문가, 대표
4. `location_entity` — 주소, 지역
5. `organization_entity` — 회사, 기관
6. `event_entity` — 이벤트, 세미나
7. `certification_entity` — 자격증, 인증
8. `award_entity` — 수상 이력
9. `publication_entity` — 출판물, 논문
10. `partnership_entity` — 파트너십

**EEAT 신호 감지:**
- Experience: 사례 연구, 후기, 체험 콘텐츠
- Expertise: 자격증, 전문 용어, 데이터 인용
- Authoritativeness: 외부 링크, 미디어 언급, 수상
- Trustworthiness: HTTPS, 개인정보 정책, 연락처 정보

#### 2.2.3 AnswerCardReverser (`lib/surface/answer-card-reverser.ts`, 10KB)

**7가지 답변 카드 유형:**
1. `direct_answer` — "~는 ~입니다" 직접 답변
2. `how_to_steps` — 단계별 가이드
3. `comparison_table` — 비교표
4. `faq_accordion` — FAQ 목록
5. `pros_cons` — 장단점 분석
6. `definition_box` — 용어 정의
7. `data_snippet` — 데이터/통계 스니펫

**트리거 질문 자동 생성:** 각 카드에 대해 "~란?", "~하는 방법", "~ vs ~" 패턴의 예상 검색 질문 생성

#### 2.2.4 PersonaReverseEngineer (`lib/surface/persona-reverse-engineer.ts`, 15KB)

**6차원 페르소나 프로파일링:**

| 차원 | 설명 | 측정 방법 |
|------|------|---------|
| `tone` | 어조 (formal ↔ casual) | 콘텐츠 어조 분석 |
| `depth` | 깊이 (surface ↔ expert) | 전문 용어 밀도 |
| `style` | 스타일 (data-driven ↔ narrative) | 데이터 인용 비율 |
| `audience` | 대상 (beginner ↔ professional) | 가독성 수준 |
| `focus` | 초점 (broad ↔ niche) | 토픽 집중도 |
| `personality` | 개성 (neutral ↔ opinionated) | 주관적 표현 빈도 |

#### 2.2.5 TechInfraAuditor (`lib/surface/tech-infra-auditor.ts`, 12KB)

**기술 인프라 22항목 감사:**
- HTTPS 적용, SSL 인증서 유효성
- Mobile-First 반응형, PWA 지원
- CDN 사용 (Cloudflare, Vercel, AWS)
- Core Web Vitals (LCP, FID, CLS)
- 이미지 최적화 (WebP, lazy loading)
- JavaScript 번들 크기
- 캐싱 전략 (Cache-Control, ETag)
- Accessibility (ARIA, alt text)
- Security Headers (CSP, HSTS, X-Frame-Options)

#### 2.2.6 SchemaQualityAuditor (`lib/surface/schema-quality-auditor.ts`, 16KB)

**Schema.org 감사 영역:**
- `Organization` / `LocalBusiness` 존재 여부
- `Product` / `Offer` 구조화
- `Article` / `BlogPosting` 마크업
- `BreadcrumbList` 내비게이션
- `FAQPage` / `HowTo` 리치 결과
- `Review` / `AggregateRating` 평점
- `Person` (저자) 마크업
- `WebSite` + `SearchAction` (사이트링크 검색)

#### 2.2.7 ContentSemanticAnalyzer (`lib/surface/content-semantic-analyzer.ts`, 25KB)

**시맨틱 분석 출력:**
- **토픽 클러스터링**: 주제별 콘텐츠 그룹화
- **키워드 밀도 분석**: TF-IDF 기반 핵심 키워드
- **읽기 수준**: Flesch-Kincaid 한국어 적용 변형
- **콘텐츠 신선도**: 날짜 패턴 감지, 업데이트 주기
- **내부 링크 그래프**: 허브-스포크 구조 분석
- **FAQ 자동 추출**: 질문-답변 패턴 감지

### 2.3 벤치마크 레이어

#### 2.3.1 EntityReflectionRunner (`lib/benchmark/entity-reflection-runner.ts`, 14KB)

**AI 검색 반영도 3단계 분류:**
1. `reflected` — AI가 엔티티를 정확히 인용
2. `partial` — 관련 정보 언급하나 불완전
3. `missed` — 전혀 반영되지 않음

**프로빙 방법:** Gemini/OpenAI API로 엔티티 관련 질문 전송 → 응답에서 브랜드 언급 여부 분석

#### 2.3.2 AEPI Calculator (`lib/benchmark/aepi-calculator.ts`, 4KB)

**AEPI (AEO Engine Presence Index) 공식:**
```
AEPI = (reflected_count / total_entities) × 100

등급: A+(90↑) | A(80↑) | B+(70↑) | B(60↑) | C+(50↑) | C(40↑) | D(40↓)
```

#### 2.3.3 GapAnalyzer (`lib/benchmark/gap-analyzer.ts`, 10KB)

**4분면 갭 매트릭스:**

| | 높은 중요도 | 낮은 중요도 |
|---|---|---|
| **낮은 반영도** | 🔴 Critical Gap | 🟡 Opportunity |
| **높은 반영도** | 🟢 Strength | ⚪ Maintain |

**처방전 유형:** `quick_win`, `content_gap`, `schema_fix`, `technical_debt`, `strategic_investment`

---

## 3. 업종 벤치마크 시스템

### 3.1 업종 분류 체계 (`lib/industry/industry-taxonomy.ts`)

```
📁 health_beauty (건강/뷰티)
  ├── skincare (스킨케어/피부관리)
  ├── hair_salon (헤어살롱)
  ├── nail_art (네일아트)
  ├── spa_massage (스파/마사지)
  └── fitness (피트니스/PT)
📁 food_beverage (식음료)
  ├── restaurant (레스토랑)
  ├── cafe (카페)
  ├── bakery (베이커리)
  └── bar (바/펍)
📁 professional_services (전문 서비스)
  ├── law_firm (법률사무소)
  ├── accounting (회계/세무)
  ├── clinic (의원/병원)
  └── consulting (컨설팅)
📁 retail (소매/유통)
  ├── fashion (패션/의류)
  ├── electronics (전자제품)
  └── home_living (홈/리빙)
📁 education (교육)
  ├── academy (학원/교습소)
  ├── online_course (온라인 강의)
  └── tutoring (과외/튜터링)
```

### 3.2 레퍼런스 사이트 레지스트리 (`lib/industry/reference-sites-registry.ts`)

```typescript
interface ReferenceSite {
  url: string;
  brandName: string;
  tier: 'excellent' | 'average' | 'poor';
  subIndustryKey: string;
  curatorNotes?: string;
}
```

**스킨케어 시드 데이터 (6개):**
- Excellent: 아모레퍼시픽, 닥터지
- Average: 라운드랩, 클리오
- Poor: (벤치마크 하한)

### 3.3 배치 감사 러너 (`lib/industry/batch-audit-runner.ts`, 15KB)

```typescript
interface SiteAuditSnapshot {
  url: string;
  brandName: string;
  tier: 'excellent' | 'average' | 'poor';
  auditedAt: string;
  // ── 22개 정량 메트릭 ──
  aepiScore: number;           // AEPI 종합 점수
  entityCount: number;         // 추출 엔티티 수
  reflectedEntityCount: number; // AI 반영 엔티티 수
  schemaTypeCount: number;     // Schema.org 유형 수
  schemaCompleteness: number;  // 스키마 완성도 (0-1)
  techScore: number;           // 기술 인프라 점수
  contentSemanticScore: number; // 콘텐츠 시맨틱 점수
  topicClusterCount: number;   // 토픽 클러스터 수
  faqCount: number;            // FAQ 항목 수
  answerCardCount: number;     // 답변 카드 수
  eeatScore: number;           // E-E-A-T 점수
  mobileScore: number;         // 모바일 점수
  pageSpeedScore: number;      // 페이지 속도 점수
  httpsScore: number;          // HTTPS 점수
  accessibilityScore: number;  // 접근성 점수
  internalLinkScore: number;   // 내부 링크 점수
  readabilityScore: number;    // 가독성 점수
  freshnessScore: number;      // 신선도 점수
  socialProofScore: number;    // 소셜 증명 점수
  localSeoScore: number;       // 로컬 SEO 점수
  imageOptScore: number;       // 이미지 최적화 점수
  structuredDataScore: number; // 구조화 데이터 점수
}
```

### 3.4 벤치마크 집계기 (`lib/industry/benchmark-aggregator.ts`, 21KB)

**출력 1: IndustryBenchmarkProfile**
```typescript
interface IndustryBenchmarkProfile {
  subIndustryKey: string;
  displayName: string;
  sampleCount: number;
  generatedAt: string;
  percentileDistributions: {  // 각 22개 메트릭별
    [metricKey: string]: {
      p10: number;
      p25: number;
      p50: number;  // 중앙값
      p75: number;
      p90: number;
      mean: number;
      stdDev: number;
    }
  };
  tierStatistics: {
    excellent: { average: Record<string, number>; count: number };
    average: { average: Record<string, number>; count: number };
    poor: { average: Record<string, number>; count: number };
  };
  excellentPatterns: string[];  // 상위 사이트의 공통 패턴
  commonPitfalls: string[];     // 하위 사이트의 공통 문제
}
```

**출력 2: IndustryBlueprint (업종 표준 설계안)**
```typescript
interface IndustryBlueprint {
  subIndustryKey: string;
  displayName: string;
  techInfraStandard: { ... };    // 기술 인프라 표준
  schemaStandard: { ... };       // 스키마 표준
  contentStrategy: { ... };      // 콘텐츠 전략
  designPatterns: { ... };       // 디자인 패턴
  targetScores: Record<string, number>; // 목표 점수
}
```

### 3.5 상대적 포지셔닝 (`lib/industry/relative-positioner.ts`, 9KB)

```typescript
interface RelativePosition {
  overall: { percentile: number; grade: string; label: string };
  byMetric: Record<string, {
    value: number;
    percentile: number;
    grade: string;
    industryMedian: number;
    industryP90: number;
    gap: number;
  }>;
  strengths: string[];    // 상위 25% 진입 메트릭
  weaknesses: string[];   // 하위 25% 메트릭
  peerComparison: {       // 동일 tier 내 비교
    rank: number;
    totalInTier: number;
  };
}
```

**등급 체계:** A+(P90↑) | A(P75↑) | B+(P60↑) | B(P40↑) | C+(P25↑) | C(P25↓)

### 3.6 전략 생성기 (`lib/industry/strategy-generator.ts`, 9KB)

```typescript
interface ImprovementStrategy {
  quickWins: StrategyItem[];        // 1~2주 내 효과
  mediumTermInvestments: StrategyItem[]; // 1~3개월
  longTermTransformations: StrategyItem[]; // 3개월+
  prioritizedRoadmap: StrategyItem[];     // 우선순위 정렬
}

interface StrategyItem {
  title: string;
  description: string;
  expectedImpact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  affectedMetrics: string[];
  targetImprovement: string; // e.g., "+15 percentile points"
}
```

### 3.7 데이터베이스 스키마 (`db/migrations/0032_industry_benchmark.sql`)

| 테이블 | 목적 | 핵심 컬럼 |
|--------|------|---------|
| `reference_sites` | 레퍼런스 사이트 큐레이션 | sub_industry_key, url, brand_name, tier |
| `benchmark_audit_results` | 개별 감사 스냅샷 | sub_industry_key, metrics(JSONB), audited_at |
| `industry_benchmark_profiles` | 업종 집계 통계 | percentile_distributions, tier_statistics |
| `industry_blueprints` | 업종 표준 설계안 | tech_infra_standard, schema_standard, content_strategy |

### 3.8 UI 대시보드 (`components/site-audit/`)

**10개 탭 구성:**

| 탭 | 컴포넌트 | Tier | 기능 |
|----|---------|------|------|
| 개요 | `OverviewPanel` | Free | AEPI 점수, 요약 |
| 엔티티 맵 | `SurfaceMapPanel` | Free | 추출된 엔티티 시각화 |
| 답변 카드 | `AnswerCardList` | Free | 역설계된 답변 카드 |
| 기술 인프라 | `TechInfraPanel` | Basic | 기술 스택 감사 |
| 스키마 품질 | `SchemaQualityPanel` | Basic | Schema.org 감사 |
| 콘텐츠 분석 | `ContentSemanticPanel` | Pro | 시맨틱 분석 |
| 갭 분석 | `GapQuadrantMatrix` | Pro | 4분면 + 처방전 |
| 페르소나 | `ParametricPersonaPanel` | Pro | 6차원 페르소나 |
| 업종 벤치마크 | `RelativePositioningPanel` | Enterprise | 상대적 포지셔닝 |
| 전략 | `StrategyPanel` | Enterprise | 개선 전략 로드맵 |

---

## 4. Server Actions (`app/actions/`)

### 4.1 site-audit.ts
- `runQuickSiteAudit(url)` — 빠른 감사 (Step 1~2만)
- `startAuditSession(url, workspaceId)` — 세션 생성 + 풀 감사 시작
- `runFullSiteAuditBackground(sessionId)` — 비동기 11-step 파이프라인

### 4.2 industry-benchmark.ts
- `runBatchAudit(subIndustryKey, workspaceId, mode)` — 배치 감사 실행
- `getBenchmarkProfile(subIndustryKey)` — 업종 프로필 조회
- `getIndustryBlueprint(subIndustryKey)` — 설계안 조회
- `getBenchmarkAuditHistory(subIndustryKey)` — 감사 이력
- `addReferenceSite(site)` — 레퍼런스 사이트 추가
- `deleteReferenceSite(id)` — 레퍼런스 사이트 삭제

---

## 5. 정량적 역량 요약

| 카테고리 | 항목 수 |
|---------|--------|
| 서피스 분석 모듈 | 12개 (348KB) |
| 벤치마크 분석 모듈 | 15개 (116KB) |
| 업종 벤치마크 모듈 | 6개 (66KB) |
| 엔티티 카테고리 | 10종 |
| 답변 카드 유형 | 7종 |
| 페르소나 차원 | 6차원 |
| 정량 메트릭 | 22개 |
| 업종 분류 | 5대분류 × 15세부업종 |
| 기술 감사 항목 | 22항목 |
| Schema.org 감사 유형 | 8+종 |
| UI 대시보드 탭 | 10개 (4-tier 과금) |
| Server Actions | 9개 |
| DB 테이블 | 4개 (업종 벤치마크) |
