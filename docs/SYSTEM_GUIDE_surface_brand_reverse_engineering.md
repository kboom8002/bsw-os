# BSW-OS 서피스/브랜드 역설계 시스템 — 기술 아키텍처 가이드

> **Version:** 2.0 (2026-06-24)
> **Scope:** Surface Reverse Engineering + Brand Persona Reverse Engineering + Industry Benchmarking + Relative Positioning

---

## 1. 시스템 개요

BSW-OS의 서피스/브랜드 역설계 시스템은 **AI 검색 엔진(ChatGPT, Gemini, Perplexity 등)이 브랜드 웹사이트를 어떻게 인식하고 표현하는지**를 역공학적으로 분석하는 AEO/GEO 플랫폼입니다.

### 1.1 핵심 기능

| 기능 | 설명 |
|------|------|
| **서피스 역설계** | 웹사이트를 크롤링하여 지식 엔티티, 앤서 카드, 지식 그래프를 추출하고 AI 반영도를 측정 |
| **브랜드 페르소나 역설계** | AI 엔진이 브랜드를 어떤 톤/어휘/포지셔닝으로 표현하는지 분석 |
| **3-Layer 진단** | L1 기술 인프라 → L2 구조화 시맨틱 → L3 콘텐츠 시맨틱 순차 감사 |
| **업종 벤치마크** | 동일 업종 우수/평균/미흡 사이트를 배치 감사하여 표준 설계안(Blueprint) 도출 |
| **상대 포지셔닝** | 업종 내 22개 지표에서 브랜드의 백분위 위치와 Gap-to-Best 분석 |
| **개선 전략 생성** | Blueprint 기반 우선순위 전략, Quick Wins, 장기 투자 처방전 생성 |

### 1.2 전체 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Next.js)                         │
│  SiteAuditDashboard (10 Tabs) ← Results Page ← Progress Page   │
│  Industry Benchmark Admin Page                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │ Server Actions
┌────────────────────────────▼────────────────────────────────────┐
│                     Server Actions Layer                        │
│  site-audit.ts (Quick/Full Audit)                               │
│  industry-benchmark.ts (Batch Audit / Profile / Blueprint)      │
└──────┬─────────────┬───────────────┬───────────────┬───────────┘
       │             │               │               │
┌──────▼──────┐ ┌────▼────┐ ┌───────▼───────┐ ┌─────▼─────┐
│  Analysis   │ │Benchmark│ │   Industry    │ │  Persona  │
│  Engine     │ │ Engine  │ │  Benchmark    │ │  Engine   │
│ (L1/L2/L3) │ │(ERR/Gap)│ │(Batch/Aggr)   │ │(v1/v2/v3) │
└──────┬──────┘ └────┬────┘ └───────┬───────┘ └─────┬─────┘
       │             │               │               │
┌──────▼─────────────▼───────────────▼───────────────▼───────────┐
│                     Supabase (PostgreSQL)                       │
│  audit_sessions │ surface_entities │ entity_reflection_snapshots│
│  tech_infra_snapshots │ schema_quality_snapshots                │
│  content_semantic_snapshots │ reference_sites                   │
│  benchmark_audit_results │ industry_benchmark_profiles          │
│  industry_blueprints                                            │
└────────────────────────────────────────────────────────────────┘
```

---

## 2. 데이터 흐름 파이프라인

### 2.1 Quick Audit (무료, ~5-10초)

```
URL 입력
  → WebsiteCrawler.crawl(maxPages=5)
    → TechInfraAuditor.audit()          [L1]
    → SchemaQualityAuditor.audit()      [L2]
    → ContentSemanticAnalyzer.analyze() [L3]
    → QuickSiteAnalyzer.extractEntitiesFromHtml()
    → QuickSiteAnalyzer.estimateSnapshot()
    → QuickSiteAnalyzer.generateCards()
    → QuickSiteAnalyzer.generateGaps()
    → detectIndustry()
    → RelativePositioner.position()      [벤치마크 프로필 존재 시]
    → StrategyGenerator.generate()       [벤치마크 프로필 존재 시]
  → DB 저장 (audit_sessions.result_data)
```

> **특징:** AI API 호출 없음. HTML 파싱만으로 3-Layer 진단 + 엔티티 추출 + 갭 분석 수행. `auditMode = 'estimated'`.

### 2.2 Full Audit (유료, ~3-8분, 14단계)

```
Step 0:  Quick audit baseline (안전 폴백용)
Step 1:  WebsiteCrawler.crawl(maxPages=20)
Step 2:  TechInfraAuditor.audit()                [L1 기술 인프라]
Step 3:  SchemaQualityAuditor.audit()            [L2 구조화 시맨틱]
Step 4:  LlmEntityExtractor.extractBatch()       [AI 엔티티 추출]
Step 5:  KnowledgeGraphBuilder.build()           [지식 그래프 구축]
Step 6:  AnswerCardReverser.reverse()            [앤서 카드 역설계]
Step 7:  ProbeGenerator.generateProbes()         [프로브 질의 생성]
Step 8:  QisCrossMapper.mapUnified()             [QIS 교차 매핑]
Step 9:  ContentSemanticAnalyzer.analyze()       [L3 콘텐츠 시맨틱]
Step 10: EntityReflectionRunner.measureAll()     [AI 엔진 반영도 실측]
Step 11: AepiCalculator.calculate()              [AEPI 복합 점수]
Step 12: PersonaReverseEngineer.analyze()        [AI 페르소나 분석]
Step 13: GapAnalyzer.analyze()                   [4-사분면 갭 분석]
Step 14: TemporalTracker.track()                 [시계열 추적]
```

> **특징:** 각 단계별 `try/catch`로 개별 실패 시 Quick Audit 데이터로 graceful fallback. 진행률이 DB에 실시간 업데이트.

### 2.3 Industry Batch Audit (관리자, ~1-3분)

```
업종 선택 (e.g. skincare)
  → getReferenceSitesBySubIndustry()
  → BatchAuditRunner.runBatch(sites, mode='quick'|'full')
    → 각 사이트: QuickSiteAnalyzer.analyze() → SiteAuditSnapshot(22 metrics)
  → BenchmarkAggregator.aggregate(snapshots)
    → IndustryBenchmarkProfile (백분위 분포, 우수 패턴, 공통 함정)
    → IndustryBlueprint (표준 설계안, 4개 섹션)
  → DB 저장 (upsert on sub_industry_key)
```

---

## 3. 모듈 상세 명세

### 3.1 WebsiteCrawler

**파일:** `lib/surface/website-crawler.ts` (768줄)

| 기능 | 설명 |
|------|------|
| HTML 페칭 | 정적 HTML fetch → SPA 감지 시 Jina Reader (`r.jina.ai`) 헤드리스 폴백 |
| robots.txt 분석 | 7개 AI 봇 파싱: `OAI-SearchBot`, `GPTBot`, `Google-Extended`, `PerplexityBot`, `Anthropic-AI`, `Bingbot`, `*` |
| 사이트맵 크롤링 | 3개 후보 경로 시도: `/sitemap.xml`, `/sitemap_index.xml`, `/sitemap-pages.xml` |
| llms.txt 탐지 | `/llms.txt` 파일 존재 여부 및 내용 확인 |
| SSL/HTTPS 감사 | 인증서 만료일, HTTPS 상태 확인 |
| HTML 파싱 | 순수 정규식 기반: 메타 태그, OG, 스키마, 헤딩, 이미지, 비디오, 테이블, 링크 등 추출 |

#### CrawlResult 인터페이스

```typescript
interface CrawlResult {
  pages: CrawledPage[];                    // 크롤링된 페이지 배열
  sitemapUrls: string[];                   // 사이트맵 URL 목록
  robotsTxtRaw?: string;                   // robots.txt 원문
  robotsTxtBotPolicies?: RobotsBotPolicy[];// AI 봇별 정책
  llmsTxt?: string | null;                 // llms.txt 내용
  sitemapLastmods?: { url; lastmod }[];    // 사이트맵 최종 수정일
  httpsStatus?: boolean;                   // HTTPS 활성 여부
  sslCertExpiry?: string;                  // SSL 인증서 만료일
  ttfbMs?: number;                         // Time to First Byte (ms)
  redirectChain?: { url; status }[];       // 리다이렉트 체인
  httpStatusCodes?: { url; status }[];     // HTTP 상태 코드
}
```

#### CrawledPage — 페이지별 추출 시그널

```typescript
interface CrawledPage {
  // 기본 메타데이터
  url, title, metaDescription, ogMetadata, headings[], schemas[], bodyText, rawHtml,
  // L1 시그널
  canonical, metaRobots, metaAuthor, hreflangTags[], viewport, contentLanguage,
  // L2 시그널
  twitterCard, datePublished, dateModified, favicon,
  // L3 시그널
  images[], videos[], tables[], lists[], outboundLinks[], internalLinks[], wordCount
}
```

---

### 3.2 3-Layer 진단 엔진

#### Layer 1: TechInfraAuditor

**파일:** `lib/surface/tech-infra-auditor.ts` (321줄)

**점수 산출 공식:**
```
techInfraScore =
  aiCrawlerAccessScore × 0.30 +    // AI 봇 접근성 (5개 봇 중 차단 시 -20pt/봇)
  sslScore            × 0.15 +    // HTTPS + SSL 인증서 유효성
  ttfbScore           × 0.15 +    // TTFB (<800ms=100, <3s=60, else=20)
  sitemapScore         × 0.15 +    // 사이트맵 존재 + URL 수 + 90일 신선도
  canonicalConsistency × 0.15 +    // canonical 태그 일관성
  renderingScore       × 0.10      // SSR=100, Hybrid=70, CSR=30
```

**22개 진단 항목:** robots.txt 봇 매트릭스, AI 크롤러 접근 점수, HTTPS/SSL, TTFB, 리다이렉트 체인, 깨진 링크, 렌더링 모드(SSR/CSR/Hybrid), SPA 감지, 사이트맵 존재/URL 수/신선도, llms.txt 존재, canonical 일관성

#### Layer 2: SchemaQualityAuditor

**파일:** `lib/surface/schema-quality-auditor.ts` (444줄)

**점수 산출 공식:**
```
schemaQualityScore =
  avgSchemaCompleteness × 0.40 +   // 스키마 완성도 평균
  schemaCoverage        × 0.20 +   // 스키마 커버리지 (타입 수 비율)
  ogCompleteness        × 0.25 +   // OpenGraph 완성도
  metaScore             × 0.15     // 메타 태그 감사 점수
```

**감사 대상 스키마 타입 (8종):**

| 스키마 | 필수 필드 | 권장 필드 |
|--------|----------|----------|
| Organization | name, url | logo, sameAs, contactPoint, description |
| LocalBusiness | name, address | telephone, openingHours, geo, priceRange |
| FAQPage | mainEntity | — |
| HowTo | name, step | image, totalTime, estimatedCost |
| Product | name | brand, offers, aggregateRating, sku, image |
| Article | headline, author | datePublished, dateModified, publisher, image |
| BreadcrumbList | itemListElement | — |
| AggregateRating | ratingValue, bestRating, worstRating, ratingCount | — |

#### Layer 3: ContentSemanticAnalyzer

**파일:** `lib/surface/content-semantic-analyzer.ts` (618줄)

**점수 산출 공식:**
```
contentSemanticScore =
  eeatOverall      × 0.35 +   // E-E-A-T 4축 평균
  answerFirstAvg   × 0.20 +   // Answer-First 문체 점수
  freshnessScore   × 0.15 +   // 콘텐츠 신선도
  topologyScore    × 0.10 +   // 내부 링크 토폴로지
  multimediaScore  × 0.10 +   // 멀티모달 자산
  originalityScore × 0.10     // 독창성 점수
```

**E-E-A-T 채점 (15개 시그널):**

| 축 | 시그널 | 배점 |
|----|--------|------|
| **Experience** | 리뷰(25), AggregateRating 스키마(25), 1인칭 서술(30), 제품 이미지(20) | 100 |
| **Expertise** | 저자 메타(25), 저자 프로필 링크(25), 학위 키워드(25), Article 스키마(25) | 100 |
| **Authoritativeness** | sameAs 프로필(40), .gov/.edu 인용(30), 수상 키워드(30) | 100 |
| **Trustworthiness** | HTTPS(30), 개인정보/이용약관(25), 연락처(25), 교환/환불(20) | 100 |

**9개 하위 분석:**
1. E-E-A-T 4축 점수
2. Answer-First 문체 (첫 문장 길이, 정의 포함, 질문 제목)
3. 콘텐츠 신선도 (≤30일=100, ≤90일=85, ≤180일=65, else=40)
4. 주제 클러스터 (허브/스포크 내부링크 분석)
5. 정량 데이터 밀도
6. 멀티모달 감사 (이미지 alt 비율, 비디오 임베드)
7. 인용/출처망 (권위 도메인 비율, nofollow 비율)
8. 독창성 점수
9. 내부 링크 토폴로지 (고아 페이지, 허브 페이지)

---

### 3.3 엔티티 추출 & 지식 그래프

#### LlmEntityExtractor

**파일:** `lib/surface/llm-entity-extractor.ts` (380줄)

**12개 엔티티 카테고리:**

| 카테고리 | 설명 | 예시 |
|---------|------|------|
| factoid | 사실 정보 | "설립년도: 2005" |
| procedural | 절차/방법 | "사용법 3단계" |
| comparative | 비교 정보 | "A vs B 성분 비교" |
| authority | 권위 근거 | "FDA 승인", "특허" |
| schema_org | 구조화 데이터 엔티티 | JSON-LD Product |
| topical_cluster | 주제 클러스터 | "성분 가이드" |
| local_geo | 지역/위치 | "서울 강남구 매장" |
| brand_identity | 브랜드 아이덴티티 | "브랜드 미션" |
| product_catalog | 제품 카탈로그 | "세럼 제품 라인업" |
| person_expertise | 전문가 정보 | "피부과 전문의 김OO" |
| temporal_event | 시간 이벤트 | "2024 SS 컬렉션" |
| media_asset | 미디어 자산 | "제품 사용 영상" |

**추출 모드:**
- **Quick (HTML-only):** Schema.org JSON-LD 파싱 + 헤딩 텍스트 분류 + EEAT 시그널 감지
- **Full (AI):** Gemini Flash 모델 호출 → 구조화된 엔티티 JSON 생성

#### KnowledgeGraphBuilder

**파일:** `lib/surface/knowledge-graph-builder.ts` (201줄)

**구축 과정:**
1. 엔티티 중복 제거 (정규화 키 기반)
2. BrandOntologyNode 생성 (eeat > 60 → `is_strategic` 플래그)
3. 동일 페이지 출현 엔티티 간 Co-occurrence Edge 생성
4. AI 의미 관계 추론 (treats, contains, routine_step, compares_to, verifies, local_outlet)

---

### 3.4 반영도 측정 엔진

#### EntityReflectionRunner

**파일:** `lib/benchmark/entity-reflection-runner.ts` (391줄)

**반영 품질 분류:**

| 등급 | 가중치 | 조건 |
|------|--------|------|
| `exact` | 1.0 | 키워드 오버랩 ≥ 0.8 |
| `partial` | 0.6 | 키워드 오버랩 ≥ 0.4 또는 도메인 인용 |
| `distorted` | 0.2 | 키워드 오버랩 ≥ 0.2 |
| `absent` | 0.0 | 매칭 없음 |
| `outdated` | 0.0 | 오래된 정보 감지 |
| `competitor_substituted` | 0.0 | 경쟁사로 대체 |
| `hallucinated` | 0.0 | 허위 정보 감지 |

**L4 인용 분석:** 인라인 인용(마크다운 링크) + 푸터 인용(구조화 객체) 추출, 경쟁사 멘션 추적

#### AEPI (AI Engine Presence Index) Calculator

**파일:** `lib/benchmark/aepi-calculator.ts` (73줄)

**AEPI 공식:**
```
AEPI = Σ(ERR_dimension × industry_weight) × techModifier × eeatModifier

techModifier = 0.8 + 0.2 × (tech_mod_score / 100)
eeatModifier = 0.8 + 0.2 × (eeat_mod_score / 100)
```

**ERR 7개 차원:** factoid, procedural, comparative, authority, schema_org, topical_cluster, local_geo

**업종별 가중치 (예시):**

| 업종 | factoid | procedural | comparative | authority | schema | topical | geo |
|------|---------|-----------|-------------|-----------|--------|---------|-----|
| skincare | 0.20 | 0.15 | 0.25 | 0.15 | 0.10 | 0.10 | 0.05 |
| wedding_studio | 0.10 | 0.10 | 0.15 | 0.10 | 0.10 | 0.15 | 0.30 |
| medical | 0.25 | 0.20 | 0.10 | 0.25 | 0.10 | 0.05 | 0.05 |
| real_estate | 0.15 | 0.10 | 0.15 | 0.15 | 0.10 | 0.05 | 0.30 |

> 13개 업종별 맞춤 가중치 사전 정의 (k_beauty, food_bev, education, pet_care, legal, finance, travel 등)

---

### 3.5 갭 분석 & 처방전

#### GapAnalyzer

**파일:** `lib/benchmark/gap-analyzer.ts` (255줄)

**4-사분면 모델:**

| 사분면 | 의미 | 액션 |
|--------|------|------|
| 🟢 GREEN | AI 응답에 반영됨 (exact/partial/distorted) | 유지 & 모니터링 |
| 🟡 YELLOW | 사이트에 존재하나 AI 미반영 (absent) | AEO 개선 필요 |
| 🔴 RED | 업종 QIS에 있으나 사이트에 없음 + L1/L2/L3 치명적 이슈 | 콘텐츠 생성 필요 |
| ⚪ WHITE | 사이트만의 고유 주제 (L6_trend) | 블루오션 기회 |

**14개 처방 유형:**
`add_schema`, `improve_heading`, `add_eeat_signal`, `create_content`, `improve_internal_linking`, `add_faq_markup`, `improve_meta`, `opportunity_content`, `fix_robots_txt`, `add_canonical`, `update_content`, `add_author_markup`, `add_llms_txt`, `fix_https`

**우선순위 산출:**
```
priority = base_score + (estimated_aepi_impact × 4.0)
// 경쟁사 멘션 시 +25 (URGENT 플래그)
```

---

### 3.6 업종 벤치마크 시스템

#### 업종 분류 체계 (IndustryTaxonomy)

**파일:** `lib/industry/industry-taxonomy.ts` (158줄)

**2단계 계층 구조:** 11개 상위 카테고리 × ~20개 세부 업종

| 상위 카테고리 | 세부 업종 |
|-------------|---------|
| 뷰티/화장품 | 스킨케어, 뷰티 |
| 웨딩/행사 | 웨딩 스튜디오, 웨딩 |
| 의료/건강 | 클리닉, 헬스케어 |
| 요식/식음 | 레스토랑, 식품음료, 편의점/리테일 |
| 전문 서비스 | 법률, 금융, 보험, 컨설팅/B2B |
| IT/소프트웨어 | IT/소프트웨어 |
| 라이프스타일 | 여행, 반려동물, 패션/이커머스 |
| 부동산/건설 | 부동산, 건설 |
| 교육 | 교육 |
| 자동차 | 자동차 |
| 엔터테인먼트 | 엔터테인먼트 |

#### 레퍼런스 사이트 레지스트리

**파일:** `lib/industry/reference-sites-registry.ts` (125줄)

**3-Tier 분류:**
- **Excellent (우수):** 업종 최상위 AEO/GEO 사이트
- **Average (평균):** 업종 평균 수준 사이트
- **Poor (미흡):** AEO/GEO가 부족한 사이트

**초기 시드 (스킨케어 9개):**
- 우수: LANEIGE, Dr.Jart+, Innisfree
- 평균: 라운드랩, CNP Laboratory, Goodal
- 미흡: COSRX, ANUA, MIXSOON

#### BatchAuditRunner

**파일:** `lib/industry/batch-audit-runner.ts` (329줄)

**SiteAuditSnapshot — 22개 벤치마크 메트릭:**

| Layer | 메트릭 | 가중치 |
|-------|--------|--------|
| L1 | techInfraScore | 10 |
| L1 | aiCrawlerAccessScore | 8 |
| L1 | ttfbMs | 5 |
| L1 | sitemapFreshnessScore | 4 |
| L1 | canonicalConsistency | 3 |
| L2 | schemaQualityScore | 10 |
| L2 | schemaCoverage | 5 |
| L2 | ogCompleteness | 5 |
| L2 | schemaTypeCount | 3 |
| L3 | contentSemanticScore | 10 |
| L3 | eeatOverall | 8 |
| L3 | answerFirstAvgScore | 5 |
| L3 | freshnessScore | 4 |
| L3 | multimediaScore | 3 |
| L3 | citationQualityScore | 3 |
| L3 | internalLinkTopologyScore | 3 |
| L3 | originalityScore | 3 |
| L3 | quantitativeDataDensity | 3 |
| 구조 | totalPages | 2 |
| 구조 | topicClusterCount | 2 |
| 구조 | totalImages | 1 |
| 구조 | authorityDomainRatio | 1 |

#### BenchmarkAggregator

**파일:** `lib/industry/benchmark-aggregator.ts` (539줄)

**출력 산출물:**

1. **IndustryBenchmarkProfile:**
   - 메트릭별 백분위 분포 (P10, P25, P50, P75, P90, min, max, mean)
   - 티어별 통계 (우수/평균/미흡 각 평균값)
   - 우수 사이트 공통 패턴 (ExcellentPattern[])
   - 미흡 사이트 공통 함정 (CommonPitfall[])

2. **IndustryBlueprint (표준 설계안):**
   - 4개 섹션: 기술 인프라 표준, 스키마 표준, 콘텐츠 전략, 디자인/구조 패턴
   - 각 섹션: targetScore(P75), currentIndustryAvg, BlueprintRecommendation[]

#### RelativePositioner

**파일:** `lib/industry/relative-positioner.ts` (268줄)

**등급 체계:**

| 백분위 | 등급 | 라벨 |
|--------|------|------|
| ≥ 90 | S | Top 10% |
| ≥ 75 | A | Top 25% |
| ≥ 60 | B | 상위권 |
| ≥ 40 | C | 평균 |
| ≥ 25 | D | 하위권 |
| < 25 | F | Bottom 25% |

**백분위 보간법:** [0→min, 10→P10, 25→P25, 50→P50, 75→P75, 90→P90, 100→max] 선형 보간
**전체 백분위:** 개별 메트릭 백분위의 가중 평균 (METRIC_META.weight 기준)

#### StrategyGenerator

**파일:** `lib/industry/strategy-generator.ts` (245줄)

**전략 분류:**
- **Quick Wins:** effort=easy + impact=high/medium (최대 5개)
- **장기 투자:** effort=hard + impact=high (최대 3개)

**우선순위 산출:**
```
impactScore = blueprintPriority × (1 - currentPercentileRank / 100)
```

---

## 4. 데이터베이스 스키마

### 4.1 핵심 테이블

```sql
-- 진단 세션 관리
audit_sessions (
  id UUID PK, workspace_id, brand_name, website_url,
  industry, tier, status, progress JSONB,
  result_data JSONB,          -- 전체 AuditResult 저장
  relative_position JSONB,    -- RelativePosition
  improvement_strategy JSONB, -- ImprovementStrategy
  industry_blueprint_sub_key TEXT,
  email, payment_id, created_at, completed_at
)

-- L1/L2/L3 스냅샷 (개별 저장)
tech_infra_snapshots     (workspace_id, ..., tech_infra_score, issues JSONB)
schema_quality_snapshots (workspace_id, ..., schema_quality_score, issues JSONB)
content_semantic_snapshots (workspace_id, ..., content_semantic_score, issues JSONB)
```

### 4.2 업종 벤치마크 테이블

```sql
-- 레퍼런스 사이트 레지스트리
reference_sites (
  id UUID PK, sub_industry_key, url, brand_name,
  tier CHECK ('excellent','average','poor'),
  curator_notes, active BOOLEAN, created_at
)

-- 개별 사이트 감사 결과
benchmark_audit_results (
  id UUID PK, reference_site_id FK,
  sub_industry_key, metrics JSONB, audited_at
)

-- 업종 통계 프로필 (UNIQUE on sub_industry_key)
industry_benchmark_profiles (
  id UUID PK, sub_industry_key UNIQUE, display_name,
  sample_count, percentile_distributions JSONB,
  tier_statistics JSONB, excellent_patterns JSONB,
  common_pitfalls JSONB, generated_at
)

-- 업종 표준 설계안 (UNIQUE on sub_industry_key)
industry_blueprints (
  id UUID PK, sub_industry_key UNIQUE, display_name,
  tech_infra_standard JSONB, schema_standard JSONB,
  content_strategy JSONB, design_patterns JSONB,
  target_scores JSONB, sample_count, generated_at
)
```

---

## 5. API 엔드포인트 & 서버 액션

### 5.1 Site Audit Server Actions (`app/actions/site-audit.ts`)

| 함수 | 용도 | 반환 |
|------|------|------|
| `runQuickSiteAudit(workspaceId, url, brand, industry?)` | 무료 Quick 감사 | `AuditResult` |
| `startAuditSession(workspaceId, url, brand, competitors, tier, industry?)` | Full 감사 세션 시작 | `sessionId` |
| `runFullSiteAuditBackground(sessionId, ...)` | 14단계 Full 감사 (비동기) | void (DB 업데이트) |

### 5.2 Industry Benchmark Server Actions (`app/actions/industry-benchmark.ts`)

| 함수 | 용도 | 반환 |
|------|------|------|
| `runBatchAudit(subIndustryKey, workspaceId, mode)` | 업종 배치 감사 + 집계 | `{ snapshots, profile, blueprint }` |
| `getBenchmarkProfile(subIndustryKey)` | 업종 프로필 조회 | `IndustryBenchmarkProfile \| null` |
| `getIndustryBlueprint(subIndustryKey)` | 표준 설계안 조회 | `IndustryBlueprint \| null` |
| `getBenchmarkAuditHistory(subIndustryKey)` | 감사 이력 조회 (최근 50건) | `SiteAuditSnapshot[]` |
| `addReferenceSite(site)` | 레퍼런스 사이트 추가 | `{ id }` |
| `deleteReferenceSite(id)` | 레퍼런스 사이트 삭제 | `boolean` |

### 5.3 REST API Routes

| 엔드포인트 | 용도 |
|-----------|------|
| `POST /api/audit/full-start` | Full 감사 시작 (프론트엔드 호출) |
| `GET /api/audit/status?sessionId=` | 감사 진행 상태 조회 (폴링) |

---

## 6. 티어 & 게이팅

| 티어 | 가격 | 분석 깊이 | 접근 가능 탭 |
|------|------|----------|------------|
| **Free** | ₩0 | Quick (HTML-only, ~5초) | 진단 개요, 기술 인프라 |
| **Tier 1 (Lite)** | ₩89,000 | Quick + 포지셔닝 (~3분) | + 구조화 시맨틱, 콘텐츠 시맨틱, 처방전, 지식 자산, 업종 포지셔닝, 개선 전략 |
| **Tier 1.5 (Pro)** | — | Full 14단계 (~8분) | + 위와 동일 |
| **Tier 2 (Pro Plus)** | — | Full + v2/v3 Persona | + AI 페르소나 |
| **Tier 3 (Enterprise)** | — | Full + 8D 시뮬레이션 | + 8D 시뮬레이션 |

---

## 7. 파일 구조 요약

```
lib/
├── surface/
│   ├── website-crawler.ts           # 768줄 — 웹 크롤러
│   ├── quick-site-analyzer.ts       # 675줄 — Quick 분석기
│   ├── llm-entity-extractor.ts      # 380줄 — AI 엔티티 추출
│   ├── knowledge-graph-builder.ts   # 201줄 — 지식 그래프 구축
│   ├── answer-card-reverser.ts      # 263줄 — 앤서 카드 역설계
│   ├── probe-generator.ts           # 160줄 — 프로브 질의 생성
│   ├── qis-cross-mapper.ts          # 172줄 — QIS 교차 매핑
│   ├── persona-reverse-engineer.ts  # 367줄 — 페르소나 역설계
│   ├── tech-infra-auditor.ts        # 321줄 — L1 기술 인프라 감사
│   ├── schema-quality-auditor.ts    # 444줄 — L2 스키마 품질 감사
│   └── content-semantic-analyzer.ts # 618줄 — L3 콘텐츠 시맨틱 분석
├── benchmark/
│   ├── entity-reflection-runner.ts  # 391줄 — AI 반영도 실측
│   ├── aepi-calculator.ts           # 73줄  — AEPI 복합 점수
│   ├── gap-analyzer.ts              # 255줄 — 4-사분면 갭 분석
│   └── temporal-tracker.ts          # 62줄  — 시계열 추적
├── industry/
│   ├── industry-taxonomy.ts         # 158줄 — 업종 분류 체계
│   ├── reference-sites-registry.ts  # 125줄 — 레퍼런스 사이트 시드
│   ├── batch-audit-runner.ts        # 329줄 — 배치 감사 엔진
│   ├── benchmark-aggregator.ts      # 539줄 — 통계 집계 + Blueprint
│   ├── relative-positioner.ts       # 268줄 — 상대 포지셔닝
│   └── strategy-generator.ts        # 245줄 — 개선 전략 생성
└── schema.ts                        # 타입 정의 (#92~#96)

components/site-audit/
├── SiteAuditDashboard.tsx     # 583줄 — 10-탭 메인 대시보드
├── OverviewPanel.tsx          # 110줄 — 진단 개요 패널
├── TechInfraPanel.tsx         # 197줄 — L1 기술 인프라 패널
├── SchemaQualityPanel.tsx     # 264줄 — L2 스키마 품질 패널
├── ContentSemanticPanel.tsx   # 341줄 — L3 콘텐츠 시맨틱 패널
├── AEPIScoreCard.tsx          # 127줄 — AEPI 점수 카드
├── ERRRadarChart.tsx          # 193줄 — ERR 7축 레이더
├── GapQuadrantMatrix.tsx      # 152줄 — 4-사분면 갭 매트릭스
├── PrescriptionList.tsx       # 112줄 — 처방전 목록
├── SurfaceMapPanel.tsx        # 128줄 — 지식 자산 맵
├── AnswerCardList.tsx         # 106줄 — 앤서 카드 목록
├── PersonaDeltaPanel.tsx      # 151줄 — 페르소나 델타
├── ParametricPersonaPanel.tsx # 170줄 — 8D 파라메트릭 페르소나
├── PersonaFidelityPanel.tsx   # 227줄 — 페르소나 충실도
├── TemporalTrendChart.tsx     # 70줄  — 시계열 트렌드
├── LockedPanel.tsx            # 72줄  — 티어 잠금 오버레이
├── RelativePositioningPanel.tsx # 247줄 — 업종 포지셔닝 패널
├── StrategyPanel.tsx          # 275줄 — 개선 전략 패널
├── IndustryComparisonChart.tsx # 113줄 — 업종 레이더 차트
└── PercentileBar.tsx          # 101줄 — 백분위 바

app/
├── actions/
│   ├── site-audit.ts             # 604줄 — 감사 서버 액션
│   └── industry-benchmark.ts     # 288줄 — 벤치마크 서버 액션
├── [locale]/
│   ├── site-audit/
│   │   ├── page.tsx              # Quick 감사 입력/결과 페이지
│   │   ├── results/[sessionId]/  # Full 감사 결과 페이지
│   │   └── progress/[sessionId]/ # Full 감사 진행 상태 페이지
│   └── (workspace)/[workspace_slug]/
│       ├── layout.tsx            # 사이드바 (18개 메뉴)
│       └── site-audit/
│           └── industry-benchmark/page.tsx  # 업종 벤치마크 관리

db/migrations/
├── 0027_aeo_surface_auditor.sql  # 서피스 6개 테이블
└── 0032_industry_benchmark.sql   # 벤치마크 4개 테이블

supabase/migrations/
├── 0009_saas_audit_sessions.sql  # audit_sessions 테이블
├── 0011_add_audit_layers.sql     # L1/L2/L3 스냅샷 테이블
└── 0012_industry_benchmark.sql   # 벤치마크 테이블
```
