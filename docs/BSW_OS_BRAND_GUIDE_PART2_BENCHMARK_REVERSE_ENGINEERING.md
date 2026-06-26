# BSW-OS 브랜드 종합 활용 가이드 — Part 2: 업종 벤치마크 & 브랜드 역설계

> **문서 버전:** v3.0 | **최종 갱신:** 2026-06-26
> **대상 독자:** BSW-OS를 활용하는 브랜드 운영자, 컨설턴트, 개발자
> **관련 문서:** [Part 1: 시스템 아키텍처](BSW_OS_BRAND_GUIDE_PART1_SYSTEM_OVERVIEW.md) · [Part 3: QIS & 콘텐츠 전략](BSW_OS_BRAND_GUIDE_PART3_QIS_CONTENT_STRATEGY.md)

---

## 1. 업종 벤치마크 시스템

### 1.1 벤치마크의 목적

> **"내 브랜드가 업종 내에서 어디에 위치하는가?"**

업종 벤치마크는 **동일 업종 내 다수의 브랜드 웹사이트를 일괄 감사**하여 업종 평균·상위·하위를 도출하고, 내 브랜드의 상대적 위치를 정량화합니다.

### 1.2 레퍼런스 사이트 큐레이션

BSW-OS는 **4-Group 큐레이션** 방법론으로 업종별 레퍼런스 사이트를 선정합니다:

| 그룹 | 선정 기준 | 역할 |
|------|----------|------|
| **🏆 Traffic Giant** | 시밀러웹 트래픽 순위 상위 | 업종 리더 벤치마크 |
| **🤖 AEO Monster** | AI 오버뷰에 자주 인용되는 사이트 | AEO 최적화 모범 사례 |
| **🚀 Rising Star** | 스타트업/D2C 급성장 브랜드 | 혁신 트렌드 포착 |
| **⚓ Anchor Poor** | 의도적으로 포함된 저품질 사이트 | 하한선 기준점 설정 |

**현재 시딩된 6대 업종:**

| 업종 | 총 사이트 | Excellent | Average | Poor |
|------|----------|-----------|---------|------|
| 🧴 스킨케어 (skincare) | 25 | 12 | 7 | 4 |
| 💒 웨딩 (wedding) | 16 | 7 | 5 | 3 |
| 🏥 의료/클리닉 (medical_clinic) | 16 | 10 | 3 | 3 |
| ☕ 레스토랑/카페 (restaurant_cafe) | 14 | 7 | 4 | 2 |
| 🏨 호텔 (hotel) | 13 | 7 | 3 | 2 |
| 🏛️ 장소 브랜딩 (place_brand) | 14 | 7 | 4 | 2 |

각 사이트는 **2D 태깅** 시스템으로 분류됩니다:
- **Tier**: `excellent` / `average` / `poor`
- **Tags**: `traffic_giant`, `aeo_monster`, `rising_star`, `anchor_poor`, `d2c_pioneer`, `local_chain` 등

---

### 1.3 배치 감사 (Batch Audit Runner)

업종 내 모든 레퍼런스 사이트를 일괄 감사하여 `SiteAuditSnapshot`을 생성합니다.

**SiteAuditSnapshot — 40+ 필드, 5개 그룹:**

| 그룹 | 주요 필드 | 설명 |
|------|----------|------|
| **L1 기술 인프라** | techInfraScore, aiCrawlerAccessScore, ttfbMs, sitemapFreshnessScore, canonicalConsistency | AI 봇 접근성 + 기술 기반 |
| **L2 스키마 품질** | schemaQualityScore, schemaCoverage, ogCompleteness, faqSchemaCount, productSchemaCount | 구조화 데이터 품질 |
| **L3 콘텐츠 시맨틱** | contentSemanticScore, eeatOverall, answerFirstAvgScore, freshnessScore, originalityScore | 콘텐츠 품질 + E-E-A-T |
| **구조** | totalPages, topicClusterCount, totalImages, imagesWithAlt, totalOutboundLinks | 사이트 구조 메트릭 |
| **이슈** | criticalIssueCount, warningIssueCount | 발견된 문제 |

**22개 벤치마크 메트릭 가중치 (합계 100):**

```
L1 기술 (25점):
  techInfraScore(8) + aiCrawlerAccessScore(7) + ttfbMs(4) + sitemapFreshness(3) + canonical(3)

L2 스키마 (21점):
  schemaQualityScore(8) + schemaCoverage(5) + ogCompleteness(4) + schemaTypeCount(4)

L3 콘텐츠 (54점):
  contentSemantic(8) + eeatOverall(8) + eeat×4(16) + answerFirst(5) +
  freshness(5) + multimedia(4) + citationQuality(4) + internalLink(4) +
  originality(4) + quantitativeData(3)
```

> **인사이트:** 콘텐츠 시맨틱(L3)이 전체의 54%를 차지합니다. AI 검색 최적화의 핵심은 기술이 아니라 **콘텐츠 품질**입니다.

---

### 1.4 업종 벤치마크 프로필 (IndustryBenchmarkProfile)

배치 감사 결과를 집계하여 업종별 벤치마크 프로필을 생성합니다:

```
IndustryBenchmarkProfile {
  subIndustryKey: string;
  siteCount: number;
  
  // 22개 메트릭별 통계
  metricStats: {
    [key]: {
      mean: number;
      median: number;
      p25: number;    // 하위 25%
      p75: number;    // 상위 25%
      min: number;
      max: number;
      stdDev: number;
    }
  };
  
  // Tier별 분포
  tierDistribution: {
    excellent: number;
    average: number;
    poor: number;
  };
  
  // 종합 AEPI
  aepiStats: { mean, median, p25, p75, min, max };
}
```

### 1.5 업종 블루프린트 (IndustryBlueprint)

벤치마크 프로필에서 자동 생성되는 **업종 최적화 청사진**:

```
IndustryBlueprint {
  subIndustryKey: string;
  
  // L1/L2/L3 타겟 점수
  targetScores: {
    techInfra: number;        // 업종 P75 기준
    schemaQuality: number;
    contentSemantic: number;
  };
  
  // 필수 스키마 유형
  requiredSchemaTypes: string[];
  
  // 우선 개선 영역
  priorityAreas: {
    metric: string;
    currentAvg: number;
    targetP75: number;
    gap: number;
    priority: 'critical' | 'high' | 'medium';
  }[];
}
```

---

### 1.6 인포그래픽 대시보드 (3-탭 통합)

업종 벤치마크 페이지는 **3개 탭**으로 구성됩니다:

#### 탭 1: 📊 업종 현황

| 컴포넌트 | 기능 |
|---------|------|
| **KPI 카드 4종** | 총 분석 사이트 · 업종 AEPI 평균 · TOP AEPI · Excellent 비율 |
| **AEPI 리더보드** | 업종 내 전체 브랜드 AEPI 랭킹 (왕관/메달 아이콘) → 클릭 시 드릴다운 |
| **메트릭 분포 히스토그램** | 22개 메트릭 중 선택 → 5구간 분포 + 업종 평균선 + P25/P50/P75 요약 |

#### 탭 2: 🔮 AEO 콘텐츠 트렌드 (QIS 연동)
→ [Part 3](BSW_OS_BRAND_GUIDE_PART3_QIS_CONTENT_STRATEGY.md)에서 상세 설명

#### 탭 3: 🎯 QVS×AEPI 전략 (QIS 연동)
→ [Part 3](BSW_OS_BRAND_GUIDE_PART3_QIS_CONTENT_STRATEGY.md)에서 상세 설명

---

### 1.7 시계열 추적 & Diff (Temporal Tracker)

**벤치마크 스냅샷을 시계열로 축적하여 변화를 추적합니다.**

```
TemporalTracker {
  saveSnapshot(snapshot)    // 감사 결과 → DB 저장 + 이전 스냅샷과 자동 diff
  computeDiff(prev, curr)   // 22개 메트릭 변화량 + 한국어 자연어 요약
  getHistory(url, months?)  // URL별 시계열 이력 조회
  getLatestByIndustry(key)  // 업종 내 전체 브랜드 최신 스냅샷
  getIndustryTemporalStats  // 업종 평균 트렌드 집계
}
```

**SnapshotDiff 출력:**

```
{
  aepiDelta: +5.2,
  aepiDeltaPercent: +7.8%,
  metricsChanged: [
    { key: "eeatOverall", prev: 62, curr: 71, delta: +9, direction: "improved" },
    { key: "freshnessScore", prev: 78, curr: 65, delta: -13, direction: "degraded" },
    ...
  ],
  summary: "AEPI가 66.8에서 72.0으로 7.8% 상승했습니다. E-E-A-T 전체 점수가 ..."
}
```

### 1.8 Cron 자동 재감사

**요일별 업종 자동 분산 감사:**

| 요일 | 업종 |
|------|------|
| 월요일 | skincare |
| 화요일 | wedding |
| 수요일 | medical_clinic |
| 목요일 | restaurant_cafe |
| 금요일 | hotel |
| 토요일 | place_brand |

- Vercel Cron 기반, `CRON_SECRET` 인증
- 각 업종 최대 10개 사이트 배치 감사 (Vercel Pro 300s 제한 내)
- 감사 결과 자동 → `TemporalTracker.saveSnapshot()` → diff 축적

---

## 2. 브랜드 웹사이트 역설계 시스템

### 2.1 역설계의 목적

> **"AI가 경쟁사를 어떻게 이해하는지 역설계하여, 우리 브랜드의 전략적 우위를 도출한다"**

### 2.2 역설계 파이프라인

```
[1] URL 입력 → Website Crawler (최대 100페이지)
     ↓
[2] Quick Site Analyzer 오케스트레이션
     ├─ Tech Infra Audit → L1 점수
     ├─ Schema Quality Audit → L2 점수
     ├─ Content Semantic Analysis → L3 점수
     ├─ LLM Entity Extraction → 브랜드 엔티티 맵
     ├─ Probe Question Generation → AI 검증 질문
     └─ Knowledge Graph Builder → 브랜드 온톨로지
     ↓
[3] Entity Reflection Measurement
     ├─ ChatGPT Search에 프로브 전송
     ├─ Gemini Grounding에 프로브 전송
     └─ 응답에서 반영 품질 판별 (exact/partial/distorted/absent)
     ↓
[4] AEPI 계산 + Gap Analysis
     ├─ 7-Dimension ERR → AEPI Score
     ├─ 4-Quadrant Gap Analysis (GREEN/YELLOW/RED/WHITE)
     ├─ Opportunity Detection (5-Type)
     └─ Per-Layer Metrics (IRI/BDR/CWR/OPP)
     ↓
[5] 처방 & 블루프린트
     ├─ Prescription List (우선순위별 교정 항목)
     ├─ Content Blueprint (콘텐츠 생산 지침)
     └─ AEPI Impact Simulation (예상 점수 변화)
```

### 2.3 갭 분석 4-Quadrant

Gap Analyzer는 브랜드의 AI 반영 상태를 4사분면으로 분류합니다:

```
            Site에 존재
         YES           NO
   ┌──────────┬──────────┐
AI │  🟢      │  🔴      │
에 │  GREEN   │  RED     │
반 │          │          │
영 │ 사이트O  │ 업종 필수 │
   │ AI 반영O │ 콘텐츠 갭│
   ├──────────┼──────────┤
   │  🟡      │  ⚪      │
NO │  YELLOW  │  WHITE   │
   │          │          │
   │ 사이트O  │ 블루오션 │
   │ AI 미반영│ 기회     │
   └──────────┴──────────┘
```

| 사분면 | 의미 | 액션 |
|--------|------|------|
| **🟢 GREEN** | 사이트에 존재하고 AI도 반영함 | 유지·강화 — 정기 업데이트 |
| **🟡 YELLOW** | 사이트에 존재하지만 AI가 미반영 | 교정 — 스키마/E-E-A-T 보강 |
| **🔴 RED** | 업종 필수이지만 사이트에 없음 | 생성 — 신규 콘텐츠 제작 |
| **⚪ WHITE** | 아무도 다루지 않는 영역 | 선점 — 블루오션 기회 |

### 2.4 처방 유형 (Prescription Types)

Gap 분석 결과에서 자동 생성되는 12가지 처방:

| 처방 유형 | 설명 | 예상 AEPI 영향 |
|----------|------|---------------|
| `add_schema` | 스키마 마크업 추가 | L2 직접 영향 |
| `add_eeat_signal` | E-E-A-T 시그널 보강 | L3 + AEPI eeat modifier |
| `improve_heading` | 헤딩 구조 최적화 | L3 간접 영향 |
| `create_content` | 신규 콘텐츠 생성 (RED 갭) | AEPI 18.0pt 추정 |
| `fix_robots_txt` | robots.txt AI 봇 허용 | L1 직접 영향 |
| `improve_meta` | 메타 태그 최적화 | L2 간접 영향 |
| `fix_https` | HTTPS 전환 | L1 + L3 Trustworthiness |
| `add_canonical` | Canonical 태그 추가 | L1 직접 영향 |
| `add_author_markup` | 저자 마크업 추가 | L3 Expertise |
| `improve_internal_linking` | 내부 링크 강화 | L3 topology |
| `update_content` | 기존 콘텐츠 업데이트 | L3 freshness |
| `opportunity_content` | 기회 콘텐츠 제작 (WHITE) | 블루오션 선점 |

**우선순위 계산:**
- YELLOW: `(E-E-A-T < 50 ? 30 : 10) + (estimated_aepi_impact × 4.0)` + 경쟁사 대체 감지 시 +25
- RED: `(L1_universal ? 40 : 25) + (impact × 3.0)`

### 2.5 기회 분석 (Opportunity Analyzer)

5가지 기회 유형을 자동 감지합니다:

| 유형 | 우선순위 | 조건 | 전략 |
|------|---------|------|------|
| **GAP** | 60-90 | 브랜드 미언급, 경쟁사 언급 | 해당 질문에 콘텐츠 즉시 생산 |
| **VOLATILE** | 65-85 | 엔진간/시점간 언급 불안정 | 콘텐츠 안정화, 스키마 보강 |
| **WEAK_MENTION** | 70 | 언급되지만 BSF < 30 (부정확) | 정보 정확성 개선 |
| **DOMINANCE** | 30 | 내 브랜드만 독점 언급 | 방어 전략, 정기 모니터링 |
| **BLIND_SPOT** | 50 | 어떤 브랜드도 미언급 | 블루오션 선점 |

**E-E-A-T 차원 자동 매핑:**
- 추천/정보 질문 → Expertise 차원 교정
- 비교/출처 질문 → Authoritativeness 차원 교정
- 루틴/제품적합 질문 → Experience 차원 교정
- 리스크/신뢰 질문 → Trustworthiness 차원 교정

### 2.6 Per-Layer Metrics (업종 대비 포지셔닝)

| 메트릭 | 이름 | 계산 | 의미 |
|--------|------|------|------|
| **IRI** | Industry Readiness Index | 보편 질문 중 어떤 브랜드든 언급된 비율 | 업종의 AI 대응 성숙도 |
| **BDR** | Brand Defense Rate | 브랜드 관련 질문 중 내 브랜드 언급 비율 | 내 브랜드 방어력 |
| **CWR** | Competitive Win Rate | 경쟁 비교 질문 중 내 브랜드가 **먼저** 언급된 비율 | 경쟁 우위 |
| **OPP** | Opportunity Score | 보편 질문 중 아무도 미언급 비율 (IRI의 역수) | 선점 기회 크기 |

**CWR 포지셔널 분석:** AI 응답 텍스트에서 내 브랜드 이름이 경쟁사 이름보다 **앞에** 등장하는지 체크합니다. 이는 AI 검색 결과에서의 실질적 추천 순서를 반영합니다.

---

## 3. 브랜드 역설계 실전 활용 시나리오

### 시나리오 1: 신규 브랜드 론칭

```
1. 업종 선택 (예: skincare)
2. 업종 벤치마크 확인
   → 업종 AEPI 평균: 52, P75: 71, TOP: 89
3. 경쟁사 3개 역설계
   → L1/L2/L3 점수 확인 → 강점/약점 파악
4. Cold Start A- 전략 실행
   → GENESIS에 업종 블루프린트 전달
   → 5분 내 L1≥75, L2≥70 수준의 사이트 자동 생성
5. 갭 분석 RED 항목부터 콘텐츠 생산
```

### 시나리오 2: 기존 브랜드 최적화

```
1. 내 브랜드 사이트 감사 실행
   → AEPI: 45 → 업종 P25 수준 (하위 25%)
2. 갭 분석 확인
   → 🟡 YELLOW 12건: AI가 미반영하는 콘텐츠
   → 🔴 RED 8건: 업종 필수인데 우리에 없는 콘텐츠
3. 처방 우선순위 확인
   → #1: add_eeat_signal (E-E-A-T < 50) → 즉시 저자 정보 추가
   → #2: add_schema (FAQ 스키마 0건) → FAQPage 마크업 추가
   → #3: create_content (RED 갭 3건) → 신규 콘텐츠 3건 제작
4. 2주 후 재감사
   → AEPI: 45 → 62 (+17pt) → 업종 P50 수준으로 상승
```

### 시나리오 3: 경쟁사 모니터링

```
1. 경쟁사 5개 + 내 브랜드 → 배치 감사
2. 리더보드에서 순위 확인
   → 내 브랜드: 3위/6개 (AEPI: 67)
   → 1위: Brand-A (AEPI: 82)
3. Brand-A 드릴다운 → L1/L2/L3 비교
   → L2 스키마: Brand-A(89) vs 나(52) → 스키마 갭 37pt
   → L3 E-E-A-T: Brand-A(78) vs 나(71) → 비교적 근접
4. 전략: L2 스키마에 집중 투자 → AEPI 갭 축소 가능
5. Cron 자동 재감사로 경쟁사 변화 주간 추적
```

---

## 4. 지식그래프 (Knowledge Graph)

### 4.1 브랜드 온톨로지 자동 구축

역설계 과정에서 브랜드의 엔티티 관계 그래프가 자동 생성됩니다:

```
SiteKnowledgeGraph {
  entities: SurfaceEntity[];      // 추출된 엔티티
  nodes: BrandOntologyNode[];     // 그래프 노드
  edges: BrandOntologyEdge[];     // 관계 엣지
  concepts: TcoConcept[];         // TCO 개념
}
```

**엣지 유형:**
| 관계 | 의미 | 예시 |
|------|------|------|
| `co_occurs_with` | 같은 페이지에 동시 등장 | "히알루론산" ↔ "수분크림" |
| `treats` | 치료/해결 관계 | "레티놀" → "주름" |
| `contains` | 포함 관계 | "세럼" → "히알루론산" |
| `routine_step` | 루틴 단계 | "클렌저" → "토너" → "세럼" |
| `compares_to` | 비교 대상 | "Brand-A" ↔ "Brand-B" |
| `verifies` | 검증 관계 | "FDA 인증" → "성분 안전성" |
| `local_outlet` | 지역 매장 | "Brand-A" → "강남점" |

### 4.2 지식그래프 활용

- **콘텐츠 전략**: 엔티티 클러스터 기반 토픽 맵 → 콘텐츠 생산 로드맵
- **스키마 최적화**: 노드 유형별 최적 스키마 타입 자동 제안
- **경쟁 분석**: 경쟁사 그래프 vs 내 그래프 비교 → 엔티티 커버리지 갭 식별
- **QIS 연동**: 지식그래프 노드 → QIS Scene 자동 연결

---

## 5. 페르소나 역설계

### 5.1 브랜드 페르소나 5차원 분석

AI가 브랜드를 묘사할 때 사용하는 톤·어조를 정량화합니다:

| 차원 | 범위 | 설명 |
|------|------|------|
| **Warmth** | 0-1 | 따뜻함 vs 차가움 |
| **Formality** | 0-1 | 격식 vs 캐주얼 |
| **Confidence** | 0-1 | 자신감 vs 겸손 |
| **Expertise** | 0-1 | 전문성 수준 |
| **Empathy** | 0-1 | 공감 수준 |

### 5.2 Full Parametric Persona Audit

- 통계적 프로빙 (N회 반복 측정)
- 인지 강도 스코어링
- 바이브 드리프트 감지 (시점간 변화 추적)
- (Tier 3) 충실도 시뮬레이션: 기준선 vs 조건부 비교

### 5.3 어휘 프로파일

| 지표 | 의미 |
|------|------|
| `brand_term_usage` (0-100) | 브랜드 고유 용어 사용 빈도 |
| `technical_term_ratio` (0-100) | 전문 용어 비율 |
| `hedging_ratio` (0-100) | 헤징 표현 비율 ("~일 수 있습니다" 등) |

### 5.4 포지셔닝 분석

| 지표 | 의미 |
|------|------|
| `category_placement` | 브랜드가 어떤 카테고리에 배치되는지 |
| `competitive_frame` | 어떤 경쟁 프레임에서 언급되는지 |
| `sentiment_valence` (-1 ~ +1) | 긍정/부정 감정 방향 |
| `recommendation_strength` (0-100) | AI의 추천 강도 |

---

## 6. 벤치마크 운영 가이드

### 6.1 새 업종 추가 절차

```
1. reference-sites-registry.ts에 새 업종 사이트 시드
   → 최소 10개 (Excellent 5 + Average 3 + Poor 2)
2. industry-taxonomy.ts에 업종 정의 확인
   → subIndustryKey, macroKey, 7-dimension 가중치
3. 배치 감사 실행 → 초기 벤치마크 프로필 생성
4. cron/benchmark-refresh/route.ts에 요일 추가
```

### 6.2 벤치마크 신선도 관리

| 항목 | 주기 | 방법 |
|------|------|------|
| 자동 재감사 | 주간 (요일별 1업종) | Vercel Cron |
| 레퍼런스 사이트 교체 | 분기별 | 수동 큐레이션 |
| 가중치 재보정 | 반기별 | 업종 트렌드 반영 |
| 신규 업종 추가 | 수시 | 비즈니스 필요에 따라 |

### 6.3 Supabase 테이블 요구사항

```sql
-- 벤치마크 스냅샷 시계열 저장
CREATE TABLE benchmark_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  sub_industry_key TEXT NOT NULL,
  macro_industry_key TEXT,
  metrics JSONB NOT NULL,
  aepi_score NUMERIC(5,2),
  tier TEXT,
  audited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  diff_from_previous JSONB,
  UNIQUE(url, audited_at)
);

CREATE INDEX idx_bs_url ON benchmark_snapshots(url, audited_at DESC);
CREATE INDEX idx_bs_industry ON benchmark_snapshots(sub_industry_key, audited_at DESC);

-- 최신 스냅샷 뷰
CREATE VIEW benchmark_snapshots_latest AS
  SELECT DISTINCT ON (url, sub_industry_key) *
  FROM benchmark_snapshots
  ORDER BY url, sub_industry_key, audited_at DESC;
```

---

> **다음 문서:** [Part 3: QIS & 콘텐츠 전략 활용 가이드](BSW_OS_BRAND_GUIDE_PART3_QIS_CONTENT_STRATEGY.md)
