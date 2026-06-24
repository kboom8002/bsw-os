# BSW-OS × GENESIS AI홈피 — 연계 구현 명세서

> **Version:** 1.0 (2026-06-24)
> **Scope:** AEO 진단 → 즉시 웹사이트 구축 → 자동 성장 파이프라인의 구체적 구현 설계
> **전제:** 전략 문서 `SYNERGY_STRATEGY_bsw_genesis_integration.md`의 5개 Axis를 구현

---

## 1. 통합 아키텍처

### 1.1 시스템 경계

```
┌──────────────────────────────────────────────────────────────────────┐
│                    BSW-OS (bsw-os.vercel.app)                        │
│  ┌────────────┐  ┌───────────┐  ┌────────────┐  ┌───────────────┐  │
│  │Quick/Full  │  │Industry   │  │Relative    │  │Strategy      │  │
│  │Audit       │  │Benchmark  │  │Positioner  │  │Generator     │  │
│  │Engine      │  │Engine     │  │            │  │              │  │
│  └─────┬──────┘  └─────┬─────┘  └─────┬──────┘  └──────┬───────┘  │
│        │               │               │               │          │
│  ┌─────▼───────────────▼───────────────▼───────────────▼──────┐   │
│  │              Synergy Bridge API (신규)                       │   │
│  │  /api/synergy/handoff    — 구축 핸드오프 패키지 생성         │   │
│  │  /api/synergy/feedback   — GENESIS → BSW-OS 피드백 수신     │   │
│  │  /api/synergy/re-audit   — 자동 재진단 트리거               │   │
│  └─────────────────────────┬──────────────────────────────────┘   │
└────────────────────────────┼─────────────────────────────────────┘
                             │  Handoff Package (JSON)
                             ▼
┌────────────────────────────┼─────────────────────────────────────┐
│  ┌─────────────────────────▼──────────────────────────────────┐  │
│  │              Synergy Receiver API (신규)                     │  │
│  │  /api/v1/synergy/onboard  — BSW-OS 핸드오프 수신 + 빌드     │  │
│  │  /api/v1/synergy/growth-seed — 갭 데이터 → Growth 주입      │  │
│  │  /api/v1/synergy/report   — 운영 데이터 → BSW-OS 전송       │  │
│  └──────┬──────────────┬────────────────┬─────────────────────┘  │
│         │              │                │                         │
│  ┌──────▼──────┐ ┌─────▼──────┐ ┌──────▼───────┐                │
│  │Turnkey      │ │Growth      │ │Content       │                │
│  │Onboarding   │ │Orchestrator│ │Polishing     │                │
│  │Engine       │ │(9-step)    │ │Engine        │                │
│  └─────────────┘ └────────────┘ └──────────────┘                │
│                    GENESIS AI홈피 (aihompyhub)                    │
└──────────────────────────────────────────────────────────────────┘
```

### 1.2 Handoff Package 명세

BSW-OS에서 GENESIS로 전달하는 핵심 데이터 패키지입니다.

```typescript
/**
 * BSW-OS → GENESIS 핸드오프 패키지
 * /api/synergy/handoff 에서 생성
 */
interface SynergyHandoffPackage {
  // ── 메타 ──
  version: '1.0';
  generatedAt: string;              // ISO 8601
  sourceAuditSessionId: string;     // BSW-OS audit_sessions.id
  
  // ── 브랜드 정보 ──
  brand: {
    name: string;
    websiteUrl: string;
    detectedIndustry: string;       // BSW-OS detectIndustry() 결과
    genesisIndustryKey: string;     // GENESIS IndustryIgnition 키로 변환
  };

  // ── L1/L2/L3 진단 결과 요약 ──
  auditSummary: {
    techInfraScore: number;
    schemaQualityScore: number;
    contentSemanticScore: number;
    aepiScore: number;
    overallGrade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
    overallPercentile: number;
    auditMode: 'estimated' | 'measured' | 'partial';
  };

  // ── 업종 포지셔닝 ──
  positioning: {
    subIndustryKey: string;
    overallPercentile: number;
    overallTier: string;
    strengths: { metricKey: string; percentileRank: number }[];
    weaknesses: { metricKey: string; percentileRank: number }[];
  } | null;

  // ── 개선 전략 ──
  strategy: {
    overallGrade: string;
    targetGrade: string;
    quickWins: StrategyItemSummary[];
    prioritizedStrategies: StrategyItemSummary[];
  } | null;

  // ── 콘텐츠 갭 (구축 시 우선 생성 대상) ──
  contentGaps: {
    red: ContentGapItem[];    // 신규 생성 필요
    yellow: ContentGapItem[]; // 기존 콘텐츠 개선 필요
    white: ContentGapItem[];  // 블루오션 기회
  };

  // ── 스키마 요구사항 ──
  schemaRequirements: {
    missingTypes: string[];           // ['FAQPage', 'HowTo', 'Product']
    orgSchemaPresent: boolean;
    orgSameAsProfiles: string[];
    requiredSchemaTypes: string[];    // Blueprint에서 도출
  };

  // ── 기술 인프라 요구사항 ──
  techRequirements: {
    mustAllowAiBots: string[];        // ['GPTBot', 'Google-Extended', ...]
    requireLlmsTxt: boolean;
    requireSsr: boolean;
    targetTtfbMs: number;
    requireHttps: boolean;
  };

  // ── Blueprint 기반 디자인 힌트 ──
  designHints: {
    blueprintDesignPatterns: BlueprintRecommendation[];
    suggestedVtdsArchetype: string;   // 'Calm-Care' | 'Focus-Competent' | etc.
    trustSignalPriority: 'high' | 'medium' | 'low';
    conversionFocus: 'comparison' | 'routine' | 'product' | 'expertise';
  };

  // ── GNB/IA 보정 데이터 ──
  gnbCorrections: {
    missingNodes: { id: string; reason: string }[];
    priorityNodes: { id: string; weight: number }[];
    entityDistribution: Record<string, number>;  // surface_type → count
  };

  // ── QIS 질문 시드 ──
  questionSeeds: {
    industryOnly: { question: string; layer: string; score: number }[];
    siteOnly: { question: string; layer: string }[];
  };
}

interface StrategyItemSummary {
  rank: number;
  title: string;
  category: string;
  effort: 'easy' | 'moderate' | 'hard';
  impact: 'high' | 'medium' | 'low';
  currentValue: number;
  industryAvg: number;
  industryTop: number;
  actionItems: string[];
}

interface ContentGapItem {
  entityName: string;
  entityType: string;
  prescriptionType: string;
  prescriptionDetail: string | null;
  estimatedAepiImpact: number;
  priorityScore: number;
  suggestedUcaType: string;         // GENESIS UCA type으로 매핑
  suggestedContentBrief: string;    // AI 드래프트 생성용 브리프
}

interface BlueprintRecommendation {
  metric: string;
  targetScore: number;
  currentIndustryAvg: number;
  recommendation: string;
  priority: number;
}
```

---

## 2. BSW-OS 측 구현 명세

### 2.1 Synergy Bridge API

#### `POST /api/synergy/handoff`

**목적:** BSW-OS 진단 결과를 GENESIS 호환 핸드오프 패키지로 변환

**신규 파일:** `app/api/synergy/handoff/route.ts`

```typescript
// 입력
interface HandoffRequest {
  auditSessionId: string;      // 진단 세션 ID
  targetGenesisUrl?: string;   // GENESIS 인스턴스 URL (기본: 환경변수)
}

// 처리 흐름
// 1. audit_sessions에서 result_data 조회
// 2. industry_benchmark_profiles에서 Blueprint 조회
// 3. AuditResult → SynergyHandoffPackage 변환
//    - detectIndustry() 결과를 GENESIS IndustryIgnition 키로 매핑
//    - SurfaceGapAnalysis[] → ContentGapItem[] 변환 (UCA 타입 매핑 포함)
//    - SchemaQualityAuditResult → schemaRequirements 변환
//    - ImprovementStrategy → strategy 요약 변환
//    - 엔티티 분포 분석 → gnbCorrections 생성
// 4. SynergyHandoffPackage JSON 반환

// 출력
{ handoffPackage: SynergyHandoffPackage }
```

#### `POST /api/synergy/feedback`

**목적:** GENESIS 운영 데이터를 수신하여 BSW-OS 시계열에 기록

**신규 파일:** `app/api/synergy/feedback/route.ts`

```typescript
// 입력
interface FeedbackPayload {
  tenantId: string;
  websiteUrl: string;
  geoScore: { current: number; grade: string; failingChecks: string[] };
  polishScores: { assetId: string; score: number; grade: string }[];
  missionsCompleted: number;
  contentChanges: number;
  weekNumber: number;
}

// 처리 흐름
// 1. websiteUrl로 기존 audit_sessions 조회
// 2. GEO Score → TemporalTrend에 추가 기록
// 3. contentChanges ≥ 10 → 자동 재진단 트리거 (Quick)
// 4. geoScore.current 20점 이상 하락 → 알림 생성
```

#### `POST /api/synergy/re-audit`

**목적:** 자동 재진단 트리거

**신규 파일:** `app/api/synergy/re-audit/route.ts`

```typescript
// 입력
interface ReAuditRequest {
  websiteUrl: string;
  brandName: string;
  industry: string;
  triggerReason: 'monthly_review' | 'geo_drop' | 'content_threshold' | 'quarterly';
  auditMode: 'quick' | 'full';
}

// 처리 흐름
// 1. runQuickSiteAudit() 또는 startAuditSession() 호출
// 2. 이전 세션과 AEPI δ 계산
// 3. RelativePosition 변화 추적
// 4. 결과를 GENESIS로 콜백 전송
```

### 2.2 업종 분류 매핑 테이블

BSW-OS와 GENESIS의 업종 키를 통합하는 매핑 모듈입니다.

**신규 파일:** `lib/industry/genesis-industry-mapper.ts`

```typescript
/**
 * BSW-OS IndustryTaxonomy ↔ GENESIS IndustryIgnition 매핑
 */
const INDUSTRY_MAPPING: Record<string, string> = {
  // BSW-OS key → GENESIS key
  'skincare': 'skincare',
  'beauty': 'haircare',           // BSW beauty → GENESIS haircare
  'wedding_studio': 'wedding_sdm',
  'clinic': 'clinic',
  'restaurant': 'korean_food',    // 가장 근접한 매핑
  'real_estate': 'real_estate',
  'education': 'consulting',      // 교육 → 컨설팅 (가장 근접)
  'travel': 'hotel_hospitality',
  'pet': 'place',                 // 반려동물 → 장소형 (가장 근접)
  'fashion_ecommerce': 'skincare_premium', // 이커머스 → 프리미엄 (근접)
  'it_software': 'startup',
  'food_beverage': 'korean_food',
  'convenience_retail': 'place',
  // 역방향 (GENESIS에만 있는 키)
  'hanbang': 'skincare',          // 한방 → 스킨케어 역매핑
  'photography': 'wedding_studio',
  'k_experience': 'travel',
};

export function mapBswToGenesis(bswKey: string): string;
export function mapGenesisToBsw(genesisKey: string): string;
```

### 2.3 Gap → UCA Type 매핑 모듈

**신규 파일:** `lib/industry/gap-to-uca-mapper.ts`

```typescript
/**
 * BSW-OS prescription_type + surface_type → GENESIS UCA content type
 */
interface UcaMapping {
  ucaType: string;
  contentLayer: 'catalog' | 'authority' | 'editorial' | 'community' | 'visual';
  draftStrategy: 'ai_generate' | 'template_fill' | 'manual_request';
  briefTemplate: string;
}

const PRESCRIPTION_TO_UCA: Record<string, UcaMapping> = {
  'create_content': {
    ucaType: 'answer',
    contentLayer: 'editorial',
    draftStrategy: 'ai_generate',
    briefTemplate: '{{entity_name}}에 대한 전문적인 답변 콘텐츠를 생성하세요. {{prescription_detail}}'
  },
  'add_faq_markup': {
    ucaType: 'faq',
    contentLayer: 'authority',
    draftStrategy: 'ai_generate',
    briefTemplate: '{{entity_name}} 관련 자주 묻는 질문 5개와 답변을 생성하세요.'
  },
  'add_eeat_signal': {
    ucaType: 'evidence',
    contentLayer: 'authority',
    draftStrategy: 'ai_generate',
    briefTemplate: '{{entity_name}}의 전문성/신뢰성을 증명하는 근거 콘텐츠를 생성하세요.'
  },
  'add_author_markup': {
    ucaType: 'person',
    contentLayer: 'authority',
    draftStrategy: 'template_fill',
    briefTemplate: '전문가 프로필 템플릿: 이름, 자격, 경력, 전문 분야를 입력하세요.'
  },
  'add_schema': {
    ucaType: 'product',
    contentLayer: 'catalog',
    draftStrategy: 'ai_generate',
    briefTemplate: '{{entity_name}} 제품/서비스 정보를 구조화된 형식으로 생성하세요.'
  },
  'opportunity_content': {
    ucaType: 'article',
    contentLayer: 'editorial',
    draftStrategy: 'ai_generate',
    briefTemplate: '[블루오션] {{entity_name}}에 대한 심층 아티클을 생성하세요. 경쟁사가 다루지 않는 관점을 포함.'
  },
  'improve_heading': {
    ucaType: 'solution',
    contentLayer: 'catalog',
    draftStrategy: 'ai_generate',
    briefTemplate: '{{entity_name}} 솔루션 페이지를 Answer-First 문체로 구조화하세요.'
  },
  'improve_internal_linking': {
    ucaType: 'routine',
    contentLayer: 'editorial',
    draftStrategy: 'ai_generate',
    briefTemplate: '{{entity_name}} 관련 루틴/프로세스를 내부 링크 중심으로 구성하세요.'
  },
};

/**
 * surface_type 기반 보조 매핑 (prescription이 없는 RED 갭용)
 */
const SURFACE_TYPE_TO_UCA: Record<string, string> = {
  'factoid': 'answer',
  'procedural': 'routine',
  'comparative': 'compare',
  'authority': 'evidence',
  'schema_org': 'product',
  'topical_cluster': 'article',
  'local_geo': 'contact_info',
  'brand_identity': 'about_brand',
  'product_catalog': 'product',
  'person_expertise': 'person',
  'temporal_event': 'campaign',
  'media_asset': 'gallery',
};
```

---

## 3. GENESIS 측 구현 명세

### 3.1 Synergy Receiver API

#### `POST /api/v1/synergy/onboard`

**목적:** BSW-OS 핸드오프 패키지를 수신하여 Turnkey Onboarding 파이프라인 실행

**신규 파일:** `apps/web/app/api/v1/synergy/onboard/route.ts`

```typescript
// 입력: SynergyHandoffPackage (from BSW-OS)

// 6-Phase 확장 파이프라인
async function handleSynergyOnboard(pkg: SynergyHandoffPackage) {
  // Phase 0: BSW-OS 데이터 검증 + 업종 매핑
  const industryConfig = getIndustryIgnition(pkg.brand.genesisIndustryKey);
  
  // Phase 1: 디자인 시스템 자동 결정
  const designConfig = await resolveDesignFromBlueprint(pkg.designHints);
  //   - suggestedVtdsArchetype → VTDS Vec7D 초기값
  //   - trustSignalPriority → Trust Template Layer 가중치
  //   - conversionFocus → Conversion Template Layer 선택
  //   - YAML 테마 자동 선택 (44개 중 최적 매칭)
  
  // Phase 2: GNB/IA 자동 구축
  const gnbConfig = await buildGnbFromBlueprint(
    pkg.brand.genesisIndustryKey,  // 업종 프리셋 로드
    pkg.gnbCorrections,            // BSW-OS 갭 기반 보정
    pkg.contentGaps                // RED 갭 → 추가 노드
  );
  
  // Phase 3: 초기 콘텐츠 시드 생성 (RED 갭 우선)
  const contentSeeds = await generateContentSeeds(
    pkg.contentGaps.red,           // RED 갭 → AI 드래프트 (최우선)
    pkg.contentGaps.white,         // WHITE 기회 → 토픽 시드
    pkg.questionSeeds,             // QIS 질문 → answer UCA
    pkg.brand,
    industryConfig
  );
  
  // Phase 4: 스키마 & 기술 설정
  const techConfig = {
    requiredSchemas: pkg.schemaRequirements.requiredSchemaTypes,
    aiBotsAllowed: pkg.techRequirements.mustAllowAiBots,
    llmsTxtEnabled: pkg.techRequirements.requireLlmsTxt,
    renderingMode: pkg.techRequirements.requireSsr ? 'ssr' : 'hybrid',
  };
  
  // Phase 5: DB 시딩 (Turnkey Engine 호출)
  await turnkeyEngine.seed({
    tenant: { slug: slugify(pkg.brand.name), industry_type: pkg.brand.genesisIndustryKey },
    brandProfile: { brand_name: pkg.brand.name, website_url: pkg.brand.websiteUrl },
    designConfig,
    gnbConfig,
    contentAssets: contentSeeds,
    techConfig,
  });
  
  // Phase 6: Growth Orchestrator 초기화
  await initGrowthWithBswData(tenantId, pkg);
}
```

#### `POST /api/v1/synergy/growth-seed`

**목적:** BSW-OS 갭 데이터를 Growth Orchestrator에 주입

**신규 파일:** `apps/web/app/api/v1/synergy/growth-seed/route.ts`

```typescript
async function seedGrowthFromBsw(tenantId: string, pkg: SynergyHandoffPackage) {
  // 1. RED 갭 → growth_missions에 초기 미션 삽입
  const initialMissions = pkg.contentGaps.red.map(gap => ({
    priority: 'yellow' as const,
    action_type: 'review_needed' as const,
    title: `[AEO 갭] ${gap.entityName}`,
    description: gap.suggestedContentBrief,
    source: 'bsw_audit' as const,
    estimated_minutes: gap.draftStrategy === 'ai_generate' ? 2 : 10,
    impact_score: gap.estimatedAepiImpact,
  }));

  // 2. WHITE 기회 → topics 테이블 시드
  for (const opp of pkg.contentGaps.white) {
    await supabase.from('topics').insert({
      tenant_id: tenantId,
      title: opp.entityName,
      source: 'bsw_blue_ocean',
      qvs_score: opp.priorityScore,
      status: 'predicted',
    });
  }

  // 3. QIS 질문 → answer_cards 시드
  for (const q of pkg.questionSeeds.industryOnly) {
    await supabase.from('answer_cards').insert({
      tenant_id: tenantId,
      question: q.question,
      source: 'bsw_qis',
      priority: q.score,
      status: 'draft',
    });
  }

  // 4. Strategy Quick Wins → 첫 주 미션으로 변환
  if (pkg.strategy?.quickWins) {
    for (const qw of pkg.strategy.quickWins.slice(0, 3)) {
      initialMissions.push({
        priority: 'yellow',
        action_type: 'review_needed',
        title: `[Quick Win] ${qw.title}`,
        description: qw.actionItems.join('\n'),
        source: 'bsw_strategy',
        estimated_minutes: qw.effort === 'easy' ? 5 : 15,
        impact_score: qw.impact === 'high' ? 90 : 60,
      });
    }
  }

  // 5. 첫 주 growth_missions 저장
  await saveInitialMissions(tenantId, initialMissions);
}
```

#### `POST /api/v1/synergy/report`

**목적:** 주간 운영 데이터를 BSW-OS에 전송

**신규 파일:** `apps/web/app/api/v1/synergy/report/route.ts`

```typescript
// Growth Orchestrator Step 9 (saveMission) 후 자동 호출
async function reportToBsw(tenantId: string, weeklyResult: WeeklyGrowthResult) {
  const bswApiUrl = process.env.BSW_OS_API_URL;
  
  await fetch(`${bswApiUrl}/api/synergy/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-Key': process.env.BSW_SYNERGY_KEY },
    body: JSON.stringify({
      tenantId,
      websiteUrl: tenant.website_url,
      geoScore: weeklyResult.geoScore,
      polishScores: await getRecentPolishScores(tenantId),
      missionsCompleted: weeklyResult.missions.filter(m => m.completed).length,
      contentChanges: weeklyResult.autoCompleted.length,
      weekNumber: getIsoWeekNumber(),
    }),
  });
}
```

### 3.2 Growth Orchestrator 확장

**수정 파일:** `apps/web/lib/studio/growth-orchestrator.ts`

#### Step 5 확장: BSW-OS 갭 기반 기회 발견

```typescript
// 기존 findOpportunities()에 BSW-OS 데이터 소스 추가
async function findOpportunities(tenantId: string, geoScore: GeoScoreSnapshot) {
  const opportunities: Opportunity[] = [];
  
  // 기존 소스 1: GEO 실패 항목
  for (const check of geoScore.failingChecks) {
    opportunities.push({ topic: check.name, score: check.points * 2, type: 'geo_gap' });
  }
  
  // 기존 소스 2: QIS 예측 질문
  const qisQuestions = await getQisPredictions(tenantId);
  for (const q of qisQuestions) {
    opportunities.push({ topic: q.text, score: q.qvs_score, type: 'qis_question' });
  }
  
  // ★ 신규 소스 3: BSW-OS 갭 데이터
  const bswGaps = await getBswGapData(tenantId);
  for (const gap of bswGaps) {
    opportunities.push({
      topic: gap.entity_name,
      score: gap.priority_score * 3,  // BSW 갭은 3배 가중
      type: gap.quadrant === 'red' ? 'bsw_content_gap' : 'bsw_reflection_gap',
      metadata: { prescriptionType: gap.prescription_type, aepiImpact: gap.estimated_aepi_impact },
    });
  }
  
  return opportunities.sort((a, b) => b.score - a.score).slice(0, 10);
}
```

#### Step 6 확장: BSW-OS 기반 미션 카드 생성

```typescript
// generateMissionCards()에 BSW-OS 소스 추가
function generateMissionCards(opportunities: Opportunity[], ...): MissionCard[] {
  const missions: MissionCard[] = [];
  
  for (const opp of opportunities) {
    if (opp.type === 'bsw_content_gap') {
      // RED 갭 → AI 드래프트 생성 미션
      missions.push({
        priority: 'yellow',
        action_type: 'review_needed',
        source: 'bsw_audit',
        title: `[AEO 진단] ${opp.topic} 콘텐츠 생성`,
        description: `BSW-OS 진단에서 발견된 콘텐츠 공백입니다. AI가 초안을 생성했습니다.`,
        estimated_minutes: 2,
        impact_score: opp.metadata.aepiImpact,
        cta_action: `/studio/content/review/${opp.draftAssetId}`,
      });
    } else if (opp.type === 'bsw_reflection_gap') {
      // YELLOW 갭 → Polish 미션
      missions.push({
        priority: 'yellow',
        action_type: 'review_needed',
        source: 'bsw_audit',
        title: `[AEO 개선] ${opp.topic} 콘텐츠 보강`,
        description: `이 콘텐츠는 AI 검색 결과에 반영되지 않고 있습니다. Polish를 적용했습니다.`,
        estimated_minutes: 3,
        cta_action: `/studio/content/polish/${opp.existingAssetId}`,
      });
    }
  }
  
  return missions;
}
```

### 3.3 Content Polishing Engine 확장

**수정 파일:** `apps/web/lib/studio/polish-scorer.ts`

#### L3 Content Semantic 피드 통합

```typescript
// scoreAsset()에 BSW-OS L3 데이터 보정 추가
async function scoreAsset(
  asset: UniversalContentAsset,
  brandContext: BrandContext,
  bswL3Data?: ContentSemanticResult  // ★ 신규 선택적 파라미터
): Promise<PolishScore> {
  const baseScore = calculateBaseScore(asset, brandContext);
  
  if (bswL3Data) {
    // BSW-OS L3 데이터로 보정
    const corrections = {
      aeoReadiness: baseScore.dimensions.aeoReadiness * 0.7 + 
                    (bswL3Data.answerFirstScores?.[0]?.score ?? 50) * 0.3,
      brandAlignment: baseScore.dimensions.brandAlignment * 0.7 +
                      (bswL3Data.eeat.overall ?? 50) * 0.3,
    };
    
    return { ...baseScore, dimensions: { ...baseScore.dimensions, ...corrections } };
  }
  
  return baseScore;
}
```

### 3.4 디자인 시스템 연계

**신규 파일:** `apps/web/lib/studio/blueprint-to-vtds.ts`

```typescript
/**
 * BSW-OS IndustryBlueprint.designPatterns → VTDS Vec7D 매핑
 */
interface Vec7DMapping {
  calm: number;      // 0-1
  warm: number;
  focus: number;
  play: number;
  bold: number;
  heritage: number;
  raw: number;
}

const CONVERSION_FOCUS_TO_VEC7D: Record<string, Partial<Vec7DMapping>> = {
  'comparison': { focus: 0.8, bold: 0.6 },        // 비교 중심 → 집중+대담
  'routine': { calm: 0.7, warm: 0.6 },             // 루틴 중심 → 차분+따뜻
  'product': { focus: 0.7, play: 0.5 },            // 제품 중심 → 집중+재미
  'expertise': { heritage: 0.7, focus: 0.6 },      // 전문성 중심 → 전통+집중
};

const TRUST_PRIORITY_TO_VEC7D: Record<string, Partial<Vec7DMapping>> = {
  'high': { heritage: 0.8, calm: 0.6 },            // 높은 신뢰 → 전통+차분
  'medium': { warm: 0.5, focus: 0.5 },
  'low': { play: 0.5, bold: 0.5 },
};

export function blueprintToVec7D(designHints: SynergyHandoffPackage['designHints']): Vec7DMapping {
  const base: Vec7DMapping = { calm: 0.5, warm: 0.5, focus: 0.5, play: 0.3, bold: 0.3, heritage: 0.3, raw: 0.2 };
  
  // conversionFocus 반영
  const conversionOverrides = CONVERSION_FOCUS_TO_VEC7D[designHints.conversionFocus] ?? {};
  // trustSignalPriority 반영
  const trustOverrides = TRUST_PRIORITY_TO_VEC7D[designHints.trustSignalPriority] ?? {};
  
  return { ...base, ...trustOverrides, ...conversionOverrides };
}

export function selectBestYamlTheme(vec7d: Vec7DMapping, industry: string): string {
  // 44개 YAML 테마와 Vec7D 코사인 유사도 계산 → 최적 매칭
  // ...
}
```

### 3.5 GNB/IA 자동 구축

**신규 파일:** `apps/web/lib/studio/blueprint-to-gnb.ts`

```typescript
import { INDUSTRY_GNB_NODES } from '@aihompyhub/gnb-config';

/**
 * BSW-OS 진단 데이터 기반 GNB/IA 자동 구축
 */
export function buildGnbFromBlueprint(
  industryKey: string,
  corrections: SynergyHandoffPackage['gnbCorrections'],
  contentGaps: SynergyHandoffPackage['contentGaps']
): GnbNode[] {
  // 1. 업종 기본 프리셋 로드
  const baseNodes = [...INDUSTRY_GNB_NODES[industryKey] ?? INDUSTRY_GNB_NODES['default']];
  
  // 2. RED 갭 기반 누락 노드 추가
  for (const gap of contentGaps.red) {
    const nodeId = mapPrescriptionToGnbNode(gap.prescriptionType, gap.entityType);
    if (nodeId && !baseNodes.find(n => n.id === nodeId)) {
      baseNodes.push({
        id: nodeId,
        label: getNodeLabel(nodeId),
        enabled: true,
        gnb_position: 'top',
        _reason: `BSW-OS RED gap: ${gap.entityName}`,
      });
    }
  }
  
  // 3. BSW-OS 보정 데이터 적용
  for (const missing of corrections.missingNodes) {
    const existing = baseNodes.find(n => n.id === missing.id);
    if (existing) {
      existing.enabled = true;
    } else {
      baseNodes.push({ id: missing.id, label: getNodeLabel(missing.id), enabled: true, gnb_position: 'top' });
    }
  }
  
  // 4. 엔티티 분포 기반 우선순위 정렬
  const entityWeights = corrections.entityDistribution;
  baseNodes.sort((a, b) => {
    const wA = corrections.priorityNodes.find(p => p.id === a.id)?.weight ?? 0;
    const wB = corrections.priorityNodes.find(p => p.id === b.id)?.weight ?? 0;
    return wB - wA;
  });
  
  return baseNodes;
}

function mapPrescriptionToGnbNode(prescription: string, entityType: string): string | null {
  const map: Record<string, string> = {
    'add_faq_markup': 'faq',
    'create_content': entityType === 'comparative' ? 'compare' : 'solutions',
    'add_eeat_signal': 'experts',
    'opportunity_content': 'routines',
    'add_author_markup': 'experts',
  };
  return map[prescription] ?? null;
}
```

---

## 4. 데이터베이스 확장

### 4.1 BSW-OS 측 신규 테이블

```sql
-- synergy_handoffs: 핸드오프 이력 추적
CREATE TABLE IF NOT EXISTS synergy_handoffs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_session_id UUID REFERENCES audit_sessions(id),
  genesis_tenant_id TEXT,
  handoff_package JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'delivered', 'accepted', 'building', 'completed', 'failed')),
  genesis_callback_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- synergy_feedback: GENESIS → BSW-OS 피드백 이력
CREATE TABLE IF NOT EXISTS synergy_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  handoff_id UUID REFERENCES synergy_handoffs(id),
  website_url TEXT NOT NULL,
  week_number INTEGER NOT NULL,
  geo_score JSONB,
  polish_scores JSONB,
  missions_completed INTEGER DEFAULT 0,
  content_changes INTEGER DEFAULT 0,
  received_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_synergy_feedback_url ON synergy_feedback(website_url);
CREATE INDEX idx_synergy_feedback_week ON synergy_feedback(week_number DESC);
```

### 4.2 GENESIS 측 테이블 확장

```sql
-- universal_content_assets에 BSW-OS 출처 추적 컬럼 추가
ALTER TABLE universal_content_assets 
  ADD COLUMN IF NOT EXISTS bsw_source_gap_id TEXT,
  ADD COLUMN IF NOT EXISTS bsw_prescription_type TEXT,
  ADD COLUMN IF NOT EXISTS bsw_aepi_impact NUMERIC(5,2);

-- growth_missions에 BSW-OS 연계 필드 추가
ALTER TABLE growth_missions
  ADD COLUMN IF NOT EXISTS bsw_audit_session_id TEXT,
  ADD COLUMN IF NOT EXISTS bsw_gap_data JSONB;

-- synergy_configs: 테넌트별 BSW-OS 연계 설정
CREATE TABLE IF NOT EXISTS synergy_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  bsw_audit_session_id TEXT,
  bsw_handoff_package JSONB,
  auto_re_audit_enabled BOOLEAN DEFAULT true,
  re_audit_interval_weeks INTEGER DEFAULT 4,
  last_re_audit_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 5. UI/UX 연계 플로우

### 5.1 BSW-OS 측: "즉시 구축" CTA

**수정 대상:** `components/site-audit/SiteAuditDashboard.tsx`

진단 결과 대시보드의 상단에 **"GENESIS로 즉시 구축"** CTA 버튼을 추가합니다.

```
┌─────────────────────────────────────────────────────────┐
│  🎯 현재 등급: C (업종 40%ile)                           │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  💡 이 진단 결과를 바탕으로                        │   │
│  │  업종 Top 25% 수준의 AI 홈페이지를                 │   │
│  │  즉시 구축할 수 있습니다.                          │   │
│  │                                                   │   │
│  │  ✅ 디자인 시스템 자동 생성                        │   │
│  │  ✅ GNB/IA 업종 최적화                            │   │
│  │  ✅ 초기 콘텐츠 30건 자동 생성 (갭 기반)           │   │
│  │  ✅ Schema.org 완전 자동 포함                     │   │
│  │  ✅ 주간 자동 성장 (Growth Orchestrator)           │   │
│  │                                                   │   │
│  │  [🚀 GENESIS로 즉시 구축하기]  [📋 핸드오프 JSON] │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 5.2 GENESIS 측: BSW-OS 연계 대시보드

**수정 대상:** `apps/web/app/admin/studio/page.tsx`

Studio 대시보드에 **BSW-OS 진단 연계 카드**를 추가합니다.

```
┌─────────────────────────────────────────────────────────┐
│  📊 AEO 진단 현황                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ AEPI 72  │  │ GEO B    │  │ 업종     │              │
│  │ (+8 δ)   │  │ (185pt)  │  │ 65%ile   │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│                                                         │
│  📋 BSW-OS 갭 기반 미션 (이번 주)                        │
│  🟡 [AEO 갭] FAQ 콘텐츠 생성 — AI 초안 리뷰 (2분)      │
│  🟡 [Quick Win] OG 태그 보강 — 자동 적용 리뷰 (1분)    │
│  🟡 [AEO 개선] 제품 스키마 보강 — Polish 리뷰 (3분)    │
│                                                         │
│  ⏰ 다음 자동 재진단: 2026-07-01 (7일 후)               │
│  [📊 전체 진단 결과 보기]  [🔄 즉시 재진단]             │
└─────────────────────────────────────────────────────────┘
```

### 5.3 Growth Mission Card에 BSW-OS 출처 배지

기존 미션 카드에 `source: 'bsw_audit'` 표시를 추가합니다.

```
┌──────────────────────────────────────────┐
│  🟡 Yellow | ⏱ 2분 | 🏷 BSW-OS 진단    │  ← 출처 배지
│──────────────────────────────────────────│
│  [AEO 갭] 스킨케어 성분 비교 FAQ 생성    │
│                                          │
│  BSW-OS 진단에서 발견된 콘텐츠 공백:      │
│  "comparative" 유형 엔티티가 업종 평균의  │
│  30% 수준입니다.                         │
│                                          │
│  예상 AEPI 영향: +8.5pt                  │
│                                          │
│  [AI 초안 리뷰하기]  [건너뛰기]          │
└──────────────────────────────────────────┘
```

---

## 6. 자동 재진단 Cron Job

**신규 파일:** `apps/web/app/api/cron/bsw-re-audit/route.ts`

```typescript
// Vercel Cron: 매주 월요일 Growth Orchestrator 실행 후
// 4주차마다 BSW-OS 재진단 트리거

export async function GET(request: Request) {
  const tenants = await getTenantsWithSynergyEnabled();
  
  for (const tenant of tenants) {
    const config = await getSynergyConfig(tenant.id);
    const weeksSinceLastAudit = getWeeksDiff(config.last_re_audit_at, new Date());
    
    if (weeksSinceLastAudit >= config.re_audit_interval_weeks) {
      // BSW-OS 재진단 트리거
      await fetch(`${BSW_OS_URL}/api/synergy/re-audit`, {
        method: 'POST',
        body: JSON.stringify({
          websiteUrl: tenant.website_url,
          brandName: tenant.brand_name,
          industry: tenant.industry_type,
          triggerReason: 'monthly_review',
          auditMode: 'quick',
        }),
      });
      
      // 마지막 재진단 시각 업데이트
      await updateLastReAuditAt(tenant.id);
    }
  }
}
```

---

## 7. 환경 변수

### BSW-OS (.env.local)
```env
# GENESIS 연계
GENESIS_API_URL=https://aihompy.hub/api/v1
GENESIS_SYNERGY_API_KEY=sk_synergy_...
```

### GENESIS (.env.local)
```env
# BSW-OS 연계
BSW_OS_API_URL=https://bsw-os.vercel.app/api
BSW_SYNERGY_KEY=sk_bsw_synergy_...
BSW_RE_AUDIT_INTERVAL_WEEKS=4
```

---

## 8. 구현 우선순위 로드맵

### Phase 1: 핵심 데이터 브릿지 (1주)

| # | 작업 | 시스템 | 예상 |
|---|------|--------|------|
| 1.1 | `SynergyHandoffPackage` 타입 정의 | 공통 | 2h |
| 1.2 | `genesis-industry-mapper.ts` | BSW-OS | 2h |
| 1.3 | `gap-to-uca-mapper.ts` | BSW-OS | 3h |
| 1.4 | `POST /api/synergy/handoff` | BSW-OS | 4h |
| 1.5 | `POST /api/v1/synergy/onboard` | GENESIS | 6h |
| 1.6 | Turnkey Engine BSW-OS 데이터 수용 확장 | GENESIS | 4h |

### Phase 2: Growth 연계 (1주)

| # | 작업 | 시스템 | 예상 |
|---|------|--------|------|
| 2.1 | `POST /api/v1/synergy/growth-seed` | GENESIS | 4h |
| 2.2 | Growth Orchestrator Step 5 확장 | GENESIS | 3h |
| 2.3 | Growth Orchestrator Step 6 BSW 미션 카드 | GENESIS | 3h |
| 2.4 | Polish Scorer L3 피드 통합 | GENESIS | 2h |
| 2.5 | Mission Card UI BSW 배지 | GENESIS | 2h |

### Phase 3: 피드백 루프 (1주)

| # | 작업 | 시스템 | 예상 |
|---|------|--------|------|
| 3.1 | `POST /api/synergy/feedback` | BSW-OS | 3h |
| 3.2 | `POST /api/v1/synergy/report` | GENESIS | 3h |
| 3.3 | `POST /api/synergy/re-audit` | BSW-OS | 3h |
| 3.4 | `cron/bsw-re-audit` | GENESIS | 2h |
| 3.5 | Temporal Trend GENESIS 데이터 통합 | BSW-OS | 2h |

### Phase 4: 디자인 & GNB 자동화 (1주)

| # | 작업 | 시스템 | 예상 |
|---|------|--------|------|
| 4.1 | `blueprint-to-vtds.ts` | GENESIS | 4h |
| 4.2 | `blueprint-to-gnb.ts` | GENESIS | 4h |
| 4.3 | BSW-OS "즉시 구축" CTA UI | BSW-OS | 3h |
| 4.4 | GENESIS Studio BSW 연계 대시보드 | GENESIS | 4h |
| 4.5 | DB 마이그레이션 (양쪽) | 공통 | 2h |

> **총 예상:** ~4주 (약 60시간)

---

## 9. 검증 계획

| 검증 항목 | 방법 | 성공 기준 |
|---------|------|---------|
| 핸드오프 패키지 생성 | BSW-OS Quick Audit → handoff API 호출 | 유효한 JSON, 모든 필드 non-null |
| 업종 매핑 정확도 | 13개 BSW 업종 → GENESIS 업종 매핑 테스트 | 100% 매핑 성공 |
| Turnkey 빌드 | 핸드오프 → GENESIS onboard → 사이트 생성 | 5분 이내 완전한 사이트 |
| GNB 자동 구축 | RED 갭 3건 포함 핸드오프 → GNB 검증 | 누락 노드 0개 |
| Growth 미션 생성 | BSW 갭 5건 시드 → 주간 미션 확인 | 3개 이상 BSW 미션 포함 |
| 재진단 δ 측정 | 4주 운영 → 재진단 → AEPI δ 계산 | δ > 0 (개선 확인) |
| E2E 폐루프 | 진단→구축→4주 운영→재진단 | 전체 플로우 무중단 |

---

> **이 명세서를 기반으로 Phase 1부터 순차적으로 구현하면, 4주 내에 "AEO 진단 → 즉시 구축 → 자동 성장 → 재진단"의 완전한 폐루프가 실현됩니다.**
