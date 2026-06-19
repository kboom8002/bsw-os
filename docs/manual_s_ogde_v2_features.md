# S-OGDE 파이프라인 v2.0 — Surface 역설계 시스템 고도화 기능 매뉴얼

> **문서 버전:** 2.0.0  
> **최종 수정일:** 2026-06-18  
> **대상 독자:** BSW-OS 개발자, AEO/GEO 컨설턴트, 운영 담당자  
> **관련 코드베이스:** `lib/surface/`, `lib/benchmark/`, `components/site-audit/`

---

## 목차

1. [문서 개요](#1-문서-개요)
2. [S-08: 임베딩 기반 QIS CrossMap](#2-s-08-임베딩-기반-qis-crossmap)
3. [S-09: 시계열 ERR 트렌드 트래킹 (Temporal Tracker)](#3-s-09-시계열-err-트렌드-트래킹)
4. [S-12: SPA 크롤링 Fallback 및 robots.txt 준수](#4-s-12-spa-크롤링-fallback-및-robotstxt-준수)
5. [S-19: 증분 감사 (Incremental Audit) 캐시 시스템](#5-s-19-증분-감사-incremental-audit-캐시-시스템)
6. [S-17: Vibe-Vector 10축 분석기](#6-s-17-vibe-vector-10축-분석기)
7. [기능 간 연동 아키텍처](#7-기능-간-연동-아키텍처)
8. [환경 변수 및 설정](#8-환경-변수-및-설정)
9. [트러블슈팅 가이드](#9-트러블슈팅-가이드)

---

## 1. 문서 개요

본 매뉴얼은 S-OGDE(Surface-Observe-Generate-Deepen-Evaluate) 파이프라인 v2.0에서 신규 도입된 **Surface 역설계 시스템**의 각 기능을 코드 레벨까지 상세히 기술합니다. 각 섹션은 다음 구조를 따릅니다:

- **기능 목적:** 왜 이 기능이 필요한가
- **아키텍처 및 알고리즘:** 내부 동작 원리
- **코드 구조:** 핵심 클래스/인터페이스/메서드 시그니처
- **사용 예시:** 실제 호출 코드
- **주의 사항 및 한계점**

---

## 2. S-08: 임베딩 기반 QIS CrossMap

### 2.1 기능 목적

기존 QIS(Question Intent System) CrossMap은 **Jaccard 어휘 유사도**만으로 "업종 표준 질문 세트(Set A)"와 "사이트에서 추출된 질문 세트(Set B)"를 매칭했습니다. 이 방식은 동일한 의미를 다른 어휘로 표현한 질문(예: "레티놀 부작용" vs "비타민A 유도체 피부 자극")을 매칭하지 못하는 **위음성(False Negative)** 문제가 있었습니다.

S-08은 **Gemini `text-embedding-004` 모델**의 768차원 임베딩 벡터를 추가하여, 어휘적 유사도와 의미론적 유사도를 결합한 **하이브리드 스코어링**을 수행합니다.

### 2.2 아키텍처 및 알고리즘

```
┌─────────────────────────────────────────────┐
│           QisCrossMapper.crossMap()          │
├─────────────────┬───────────────────────────┤
│  Set A (업종)   │    Set B (사이트 추출)    │
│  industryQs[]   │    siteProbes[]           │
└────────┬────────┴────────────┬──────────────┘
         │                     │
         ▼                     ▼
   ┌─────────────────────────────────┐
   │  AIProvider.generateEmbeddings()│
   │  (Gemini text-embedding-004)   │
   │  → 768차원 float[] 배열 반환    │
   └────────────────┬────────────────┘
                    │
         ┌──────────▼──────────┐
         │ 페어별 스코어 계산   │
         │                     │
         │  Jaccard 어휘 유사도 │──► jaccardScore (0~1)
         │  + 키워드 보너스     │──► +0.25 (must_include 교집합 시)
         │  코사인 임베딩 유사도│──► cosSim (0~1)
         │                     │
         │  finalScore =       │
         │   jaccard*0.4       │
         │   + cosSim*0.6      │
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────┐
         │ 매칭 임계값 ≥ 0.35  │
         │ → 'both' 매핑 생성  │
         │ 미달 → 'industry_   │
         │   only' 또는         │
         │   'site_only'       │
         └─────────────────────┘
```

**가중치 설계 근거:**
- `cosSim * 0.6`: 의미론적 유사도가 어휘 유사도보다 더 신뢰할 수 있으므로 60% 비중
- `jaccard * 0.4`: 핵심 고유명사(브랜드명, 성분명)의 정확한 포함 여부를 보완
- `threshold = 0.35`: 과적합(Over-Matching) 방지를 위한 "Goldilocks" 기준값

### 2.3 핵심 코드 구조

**파일 위치:** `lib/surface/qis-cross-mapper.ts`

```typescript
// 출력 인터페이스
export interface UnifiedQuestionMapping {
  id: string;
  question_text: string;
  source: 'industry' | 'site' | 'both';        // 매칭 출처
  industry_qis_layer?: string;                  // QIS 레이어 (L1~L7)
  coverage_status: 'both' | 'industry_only' | 'site_only';
  industry_question_ref?: SeedProbeQuestion;
  site_question_ref?: SeedProbeQuestion;
  similarity_score: number;                     // 0~100 정수
}

// 핵심 메서드
class QisCrossMapper {
  async crossMap(
    industry: string,           // 업종 코드 (예: 'beauty', 'tech')
    siteProbes: SeedProbeQuestion[]  // 사이트에서 추출한 질문 배열
  ): Promise<UnifiedQuestionMapping[]>
}
```

**내부 유사도 함수:**
- `getJaccardSimilarity(str1, str2)`: 한글/영문 2자 이상 단어 기준 교집합/합집합
- `checkKeywordMatch(q1, q2)`: `must_include` 배열 간 교집합 존재 여부
- `cosineSimilarity(vecA, vecB)`: 768차원 벡터 내적 / (||A|| × ||B||)

### 2.4 사용 예시

```typescript
import { QisCrossMapper } from '@/lib/surface/qis-cross-mapper';

const mapper = new QisCrossMapper();
const mappings = await mapper.crossMap('beauty', siteQuestions);

// 결과 해석
const gaps     = mappings.filter(m => m.coverage_status === 'industry_only');  // 콘텐츠 갭 (RED)
const matched  = mappings.filter(m => m.coverage_status === 'both');           // 충족됨 (GREEN)
const unique   = mappings.filter(m => m.coverage_status === 'site_only');      // 사이트 고유 강점
```

### 2.5 Fallback 동작

`AIProvider.generateEmbeddings`가 실패하거나 미구현 Provider인 경우:
- 콘솔에 `[QisCrossMapper] Embedding failed. Falling back to Jaccard-only.` 경고 출력
- `industryEmbeddings`, `siteEmbeddings` 배열이 빈 상태를 유지
- **자동으로 Jaccard-only 모드**로 동작 (v1.0과 동일한 결과 보장)

---

## 3. S-09: 시계열 ERR 트렌드 트래킹

### 3.1 기능 목적

AEO/GEO 최적화 작업의 성과를 **시간축으로 추적**합니다. "AEPI 점수가 지난달 대비 12점 상승했다"와 같은 정량적 성과 증명이 가능해져, 컨설팅 리포트의 신뢰도가 크게 향상됩니다.

### 3.2 데이터 모델

**파일 위치:** `lib/benchmark/temporal-tracker.ts`

```typescript
export interface TemporalTrend {
  snapshot_id: string;     // 스냅샷 고유 ID
  measured_at: string;     // ISO 8601 타임스탬프
  aepi_score: number;      // AI Engagement Potential Index (0~100)
  err_factoid: number;     // Entity Reflection Rate - Factoid 유형
  err_procedural: number;  // Entity Reflection Rate - Procedural 유형
}
```

### 3.3 핵심 클래스

```typescript
class TemporalTracker {
  async getTrends(
    websiteUrl: string,
    currentSnapshot: EntityReflectionSnapshot
  ): Promise<TemporalTrend[]>
}
```

**동작 방식:**
1. 현재 스냅샷(`currentSnapshot`)의 AEPI/ERR 점수를 기준점으로 설정
2. T-3(90일 전), T-2(60일 전), T-1(30일 전) 시점의 과거 데이터를 조회
3. 현재 스냅샷을 T-0로 추가하여 총 4개 데이터 포인트의 배열 반환
4. 향후 Supabase `entity_reflection_snapshots` 테이블 직접 쿼리로 전환 예정

### 3.4 프론트엔드 연동 — TemporalTrendChart

**파일 위치:** `components/site-audit/TemporalTrendChart.tsx`

| 속성 | 타입 | 설명 |
|------|------|------|
| `trends` | `TemporalTrend[]` | 시계열 데이터 배열 (빈 배열 시 안내 메시지 표시) |

**시각화 라이브러리:** Recharts (`LineChart`, `ResponsiveContainer`)

**렌더링되는 3개 라인:**
| 라인 | 색상 | 의미 |
|------|------|------|
| AEPI | `#8b5cf6` (보라) | AI Engagement Potential Index 종합 점수 |
| Factoid | `#0ea5e9` (하늘) | 사실형 엔티티 AI 반영률 |
| Procedural | `#10b981` (초록) | 절차형 엔티티 AI 반영률 |

**빈 데이터 처리:** 트렌드 데이터가 0건이면 `Activity` 아이콘과 함께 "시계열 데이터가 없습니다" 안내 패널 표시

### 3.5 파이프라인 통합 경로

```
SiteAuditPage (page.tsx)
  → runQuickSiteAudit() → initialData.trends
  → <SiteAuditDashboard trends={initialData.trends} />
    → <TemporalTrendChart trends={localTrends} />
```

`SiteAuditDashboard`는 `localTrends` state를 관리하며, "실시간 감사 실행" 버튼으로 `onTriggerReRun()`을 호출할 때 반환 결과의 `res.trends`로 업데이트됩니다.

---

## 4. S-12: SPA 크롤링 Fallback 및 robots.txt 준수

### 4.1 기능 목적

React, Vue, Angular 등 **CSR(Client-Side Rendering) SPA** 프레임워크로 구축된 웹사이트는 기본 `fetch()`로는 빈 `<div id="root">` 셸만 반환합니다. S-12는 이를 자동으로 감지하고 **Jina AI Reader API**를 Headless Browser 대용으로 활용하여 렌더링된 콘텐츠를 수집합니다.

### 4.2 SPA 감지 알고리즘

**파일 위치:** `lib/surface/website-crawler.ts` — `fetchPage()` 메서드

```
fetchPage(url, isSpaFallback=false)
    │
    ├─ isSpaFallback=false (일반 모드)
    │   └─ fetch(url) → content
    │       │
    │       ├─ content.length < 1500
    │       │  AND (content.includes('<script')
    │       │       OR content.includes('id="root"')
    │       │       OR content.includes('id="app"'))
    │       │  → SPA로 판정 → fetchPage(url, true) 재귀 호출
    │       │
    │       └─ 정상 HTML → return content
    │
    └─ isSpaFallback=true (Jina Fallback 모드)
        └─ fetch("https://r.jina.ai/{url}")
            ├─ Accept: 'text/plain'
            └─ timeout: 15000ms
```

**SPA 판정 기준 (3가지 조건 AND):**
1. 응답 본문 길이가 **1,500자 미만** (정상 페이지는 보통 5,000~50,000자)
2. 응답에 `<script` 태그가 포함됨 (JS 번들 로딩을 의미)
3. 응답에 `id="root"` 또는 `id="app"` 포함 (React/Vue 마운트 포인트)

**에러 Fallback 체인:**
```
일반 fetch 실패 → SPA Fallback 시도 → SPA Fallback도 실패 → Error throw
```

### 4.3 robots.txt 사전 검증

```typescript
async checkRobotsTxt(rootUrl: string): Promise<boolean>
```

| 시나리오 | 반환값 | 크롤링 동작 |
|----------|--------|-------------|
| robots.txt에 `User-agent: *` + `Disallow: /` 존재 | `false` | 크롤링 중단, 빈 배열 반환 |
| robots.txt에 특정 경로만 Disallow | `true` | 정상 크롤링 진행 |
| robots.txt 파일 없음 또는 fetch 실패 | `true` | 정상 크롤링 진행 |

**호출 시점:** `crawl()` 메서드의 가장 첫 번째 단계에서 호출

```typescript
async crawl(rootUrl: string, maxPages = 20): Promise<CrawledPage[]> {
  // ...
  const isAllowed = await this.checkRobotsTxt(normalizedRoot);
  if (!isAllowed) {
    console.warn(`[Crawler] Aborting crawl due to robots.txt restrictions.`);
    return [];
  }
  // ... sitemap → spider 순서로 진행
}
```

---

## 5. S-19: 증분 감사 (Incremental Audit) 캐시 시스템

### 5.1 기능 목적

대규모 E-commerce 사이트(100+ 페이지)를 반복 감사할 때, **변경되지 않은 페이지**를 매번 LLM으로 재분석하면 불필요한 API 비용이 발생합니다. S-19는 페이지 콘텐츠의 SHA-256 해시를 기준으로 변경 여부를 판단하고, 변경된 페이지만 재분석합니다.

### 5.2 캐시 데이터 모델

**파일 위치:** `lib/benchmark/incremental-cache.ts`

```typescript
export interface CacheEntry {
  hash: string;             // SHA-256 해시 (64자 hex string)
  entities: SurfaceEntity[];  // 추출된 엔티티 배열 (캐시된 결과)
  lastUpdated: string;      // ISO 8601 마지막 갱신 시각
}
```

### 5.3 IncrementalCache API

```typescript
class IncrementalCache {
  // SHA-256 해싱
  static hashContent(content: string): string
  
  // 캐시 조회 — 해시 일치 시 SurfaceEntity[] 반환, 불일치 시 null
  static get(url: string, content: string): SurfaceEntity[] | null
  
  // 캐시 저장
  static set(url: string, content: string, entities: SurfaceEntity[]): void
}
```

**저장소:** 현재 `Map<string, CacheEntry>` (in-memory). 프로덕션 환경에서는 Supabase 또는 Redis로 전환 권장.

### 5.4 LlmEntityExtractor 통합 흐름

**파일 위치:** `lib/surface/llm-entity-extractor.ts` — `extractBatch()` 메서드

```
extractBatch(workspaceId, pages[], websiteUrl)
    │
    ├─ [1단계] 캐시 체크 루프
    │   for each page in pages:
    │     IncrementalCache.get(page.url, page.rawHtml)
    │       ├─ HIT  → allExtracted에 즉시 추가
    │       └─ MISS → pagesToProcess에 추가
    │
    ├─ [2단계] pagesToProcess가 0건이면 즉시 return
    │
    ├─ [3단계] pagesToProcess에 대해서만 LLM 추출 수행
    │   ├─ Schema.org 파싱 (무조건 수행)
    │   └─ LLM 프롬프트 (Gemini generateStructuredOutput)
    │
    └─ [4단계] 신규 추출 결과를 캐시에 저장
        for each page in pagesToProcess:
          IncrementalCache.set(page.url, page.rawHtml, pageEntities)
```

**성능 효과 예시:**
| 시나리오 | 페이지 수 | 캐시 HIT | LLM 호출 | 절감률 |
|----------|-----------|----------|----------|--------|
| 첫 감사 | 30 | 0 | 30 | 0% |
| 재감사 (변경 3건) | 30 | 27 | 3 | 90% |
| 재감사 (변경 없음) | 30 | 30 | 0 | 100% |

---

## 6. S-17: Vibe-Vector 10축 분석기

### 6.1 기능 목적

기존의 단순 긍정/부정(Sentiment) 분석을 넘어, 브랜드 텍스트가 발산하는 **"분위기(Vibe)"**를 심리학·소비자행동론 기반의 **10개 차원**으로 해체·수치화합니다.

### 6.2 10차원 벡터 정의

**파일 위치:** `lib/surface/vibe-vector-analyzer.ts`

```typescript
export interface VibeVector10D {
  // ─── 감정 축 (Emotion) ───
  valance: number;        // -1.0 ~ +1.0  (부정적 ↔ 긍정적)
  arousal: number;        //  0.0 ~  1.0  (차분함 ↔ 흥분/활력)

  // ─── 동기 축 (Motivation) ───
  hedonic: number;        //  0.0 ~  1.0  (실용적 ↔ 쾌락적/즐거움)
  utilitarian: number;    //  0.0 ~  1.0  (감성적 ↔ 기능적/유용함)

  // ─── 사회평가 축 (Social Evaluation) ───
  warmth: number;         //  0.0 ~  1.0  (차가움/사무적 ↔ 따뜻함/인간적)
  competence: number;     //  0.0 ~  1.0  (아마추어 ↔ 전문적/유능함)

  // ─── 규제초점 축 (Regulatory Focus) ───
  promotion: number;      //  0.0 ~  1.0  (성취/성장 지향)
  prevention: number;     //  0.0 ~  1.0  (안전/위험회피 지향)

  // ─── 브랜드 성격 축 (Brand Personality) ───
  sincerity: number;      //  0.0 ~  1.0  (진정성, 투명함)
  sophistication: number; //  0.0 ~  1.0  (세련됨, 럭셔리)
}
```

### 6.3 핵심 메서드

```typescript
class VibeVectorAnalyzer {
  async analyze(
    brandName: string,   // 분석 대상 브랜드명
    texts: string[]      // AI 응답 텍스트 또는 브랜드 웹카피 배열
  ): Promise<VibeVector10D>
}
```

**내부 동작:**
1. `texts[]` 배열을 `\n\n`로 결합, 최대 8,000자로 트림
2. 10개 차원의 의미를 상세히 기술한 전문가 프롬프트를 LLM에 전송
3. `generateStructuredOutput`로 JSON 파싱
4. `Math.max/Math.min`으로 모든 값을 유효 범위로 클램핑

**Fallback 기본값 (LLM 실패 시):**
```typescript
{ valance: 0.5, arousal: 0.4, hedonic: 0.3, utilitarian: 0.8,
  warmth: 0.5, competence: 0.7, promotion: 0.6, prevention: 0.4,
  sincerity: 0.6, sophistication: 0.4 }
```

### 6.4 PersonaReverseEngineer와의 연동

`PersonaReverseEngineer.analyze()`에서 이미 구현된 `VibeSpec.target_vector`와 `VibeVector10D`의 코사인 유사도를 계산하여 `vibe_alignment_score`를 산출합니다. 이 점수는 "브랜드가 의도한 분위기"와 "AI가 실제로 묘사하는 분위기"의 일치도를 0~100점으로 나타냅니다.

---

## 7. 기능 간 연동 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                    runFullSiteAudit()                         │
│                 (app/actions/site-audit.ts)                   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Step 1: WebsiteCrawler.crawl()                             │
│    ├─ checkRobotsTxt()          ← S-12                      │
│    └─ fetchPage() w/ SPA detect  ← S-12                     │
│                                                              │
│  Step 2: LlmEntityExtractor.extractBatch()                  │
│    └─ IncrementalCache.get/set()  ← S-19                    │
│                                                              │
│  Step 3: QisCrossMapper.crossMap()                          │
│    └─ Embedding Hybrid Score      ← S-08                    │
│                                                              │
│  Step 4: VibeVectorAnalyzer.analyze()                       │
│    └─ 10D Vibe Score              ← S-17                    │
│                                                              │
│  Step 5: TemporalTracker.getTrends()                        │
│    └─ Historical AEPI/ERR         ← S-09                    │
│                                                              │
│  ──────────────── UI 렌더링 ────────────────                 │
│  SiteAuditDashboard                                          │
│    ├─ TemporalTrendChart    ← S-09                          │
│    ├─ ERRRadarChart                                          │
│    ├─ GapQuadrantMatrix                                      │
│    └─ PersonaDeltaPanel     ← S-17 (vibe_alignment_score)   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 8. 환경 변수 및 설정

| 환경 변수 | 값 | 설명 |
|-----------|------|------|
| `AI_PROVIDER_MODE` | `gemini` / `claude` / `openai` / `mock` | AI Provider 선택. 임베딩(S-08)은 `gemini` 모드에서만 네이티브 지원 |
| `GEMINI_API_KEY` | API 키 문자열 | Gemini 2.5 Flash + text-embedding-004 호출용 |
| `ANTHROPIC_API_KEY` | API 키 문자열 | Claude Sonnet 사용 시 |
| `OPENAI_API_KEY` | API 키 문자열 | GPT-4o-mini 사용 시 |

> **참고:** `mock` 모드에서도 모든 기능이 결정론적 Mock 데이터로 동작합니다. 테스트 환경에서는 `mock` 모드 사용을 권장합니다.

---

## 9. 트러블슈팅 가이드

| 증상 | 원인 | 해결 방법 |
|------|------|-----------|
| CrossMap 유사도가 항상 0점 | `AI_PROVIDER_MODE=mock` 환경에서 모든 텍스트의 Mock 임베딩이 거의 동일 | 실제 API 키 연동 (`gemini` 모드) 또는 Jaccard-only 결과 확인 |
| SPA Fallback 반복 호출 | Jina Reader API 응답도 짧은 경우 | `isSpaFallback=true` 상태에서는 재귀하지 않으므로 최종 Error throw됨 |
| IncrementalCache가 늘 MISS | 페이지마다 동적 타임스탬프가 삽입된 경우 | 크롤러의 `rawHtml` 전처리 시 타임스탬프 패턴 제거 로직 추가 고려 |
| TemporalTrendChart 빈 화면 | `trends` prop이 빈 배열 | 첫 감사 시 정상 동작. 이력 누적 후 자동 활성화 |
| Vibe-Vector 모든 값이 Fallback | LLM 프롬프트 실패 | API 키 확인, 토큰 한도 초과 여부 점검 |
