# BSW-OS × GENESIS AI홈피 — 연계 구현 명세서 v2.0

> **Version:** 2.0 (2026-06-24) — QIS 양방향 연동 + Hub Platform + Archetype 시스템 통합
> **Scope:** 전략 문서 v2.0의 7개 Axis를 구현하기 위한 구체적 기술 명세
> **신규 범위:** QIS Pull/Push API, Hub Content Pool 매칭, Archetype 자동 매칭, Expected Layer 피드, BAIR 교차 검증

---

## 1. 통합 아키텍처 v2.0

### 1.1 시스템 토폴로지

```
┌─────────────────── BSW-OS ──────────────────┐
│                                              │
│  ┌──────────┐  ┌────────────┐  ┌──────────┐ │
│  │Surface   │  │QIS Engine  │  │Industry  │ │
│  │Reverse   │  │S-OGDE v2.0 │  │Benchmark │ │
│  │Engineer  │  │            │  │          │ │
│  └────┬─────┘  └─────┬──────┘  └────┬─────┘ │
│       │               │              │       │
│  ┌────▼───────────────▼──────────────▼────┐  │
│  │         Synergy Bridge API v2          │  │
│  │  /api/synergy/handoff-v2  (Axis 1-2)  │  │
│  │  /api/synergy/feedback    (Axis 4)    │  │
│  │  /api/synergy/re-audit    (Axis 4)    │  │
│  │  /api/v1/qis/predictions  (Axis 5)   │  │
│  │  /api/v1/qis/feedback     (Axis 5)   │  │
│  └──────────────────┬────────────────────┘  │
└─────────────────────┼───────────────────────┘
                      │
          ┌───────────┼───────────┐
          │  Handoff   │  QIS      │
          │  Package   │  Signals/ │
          │  v2        │  Metrics  │
          │           │  Predict  │
          ▼           ▼           ▼
┌─────────────────── GENESIS AI홈피 ──────────────────────┐
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │           Synergy Receiver API v2                    │ │
│  │  /api/v1/synergy/onboard-v2     (Axis 1-2-6)       │ │
│  │  /api/v1/synergy/growth-seed    (Axis 3)           │ │
│  │  /api/v1/synergy/report         (Axis 4)           │ │
│  │  /api/v1/qis/signals            (Axis 5) ★existing │ │
│  │  /api/v1/qis/metrics            (Axis 5) ★existing │ │
│  │  /api/v1/qis/layers             (Axis 5) ★existing │ │
│  │  /api/v1/qis/questions          (Axis 5) ★existing │ │
│  └──────┬─────────────┬───────────────┬────────────────┘ │
│         │             │               │                   │
│  ┌──────▼─────┐ ┌─────▼─────┐ ┌──────▼───────┐          │
│  │Turnkey     │ │Growth     │ │Hub Content   │          │
│  │+ Archetype │ │Orchestrat.│ │Pool + QIS    │          │
│  │Matcher     │ │+ Predicted│ │+ Expected    │          │
│  │            │ │Content    │ │Layer         │          │
│  └────────────┘ └───────────┘ └──────────────┘          │
│                  GENESIS AI홈피                           │
└──────────────────────────────────────────────────────────┘
```

### 1.2 Handoff Package v2 명세

v1.0 대비 **추가된 필드** (★ 표시):

```typescript
interface SynergyHandoffPackageV2 extends SynergyHandoffPackageV1 {
  version: '2.0';

  // ★ QIS 질문 자산 (확장)
  qisAssets: {
    // v1.0 questionSeeds 확장
    industryOnlyQuestions: QisPredictedQuestion[];   // BSW 예측 질문 전체
    siteOnlyQuestions: { question: string; surfaceType: string }[];
    crossMapCoverage: {
      totalIndustryQuestions: number;
      totalSiteProbes: number;
      bothCount: number;
      industryOnlyCount: number;
      siteOnlyCount: number;
      goldilocksCoverage: number;   // 0-1
    };
    // ★ Hub Probe Panel 연계
    hubProbeResults?: {
      hubSlug: string;
      bairScore: number;  // 0-1
      aasScore: number;   // AI Answer Share
      ocrScore: number;   // Official Citation Rate
      bsfScore: number;   // Brand Semantic Fidelity
      probeDetails: { question: string; cited: boolean; rank: number }[];
    };
  };

  // ★ Archetype 매칭 힌트
  archetypeHints: {
    suggestedArchetypeId: string;        // 'skincare_natural'
    suggestedProfileId: string;          // 'skincare_indie_brand'
    matchConfidence: number;             // 0-1
    vec7dProjection: {                   // BSW 진단 → Vec7D 변환값
      warmth: number; energy: number; polish: number;
      authentic: number; heritage: number; futuristic: number; playful: number;
    };
    sectionPriority: string[];           // Section Registry 타입 우선순위
    psychologyLayerWeights: {            // 5-Layer 심리 가중치
      attention: number; trust: number; value: number; proof: number; action: number;
    };
  };

  // ★ S2P Gap Report 변환 (10영역)
  s2pGapMapping: {
    gnbIa: number;          // 0-100
    questionAnswer: number;
    offerClarity: number;
    trustEvidence: number;
    visualExplanation: number;
    policySafety: number;
    conversion: number;
    seoAeoGeo: number;
    mobileUx: number;
    operations: number;
    tf8BlockScores: Record<string, number>;  // TF8 초기 점수
  };

  // ★ Hub Content Pool 매칭 요청
  hubContentRequest: {
    hubSlug: string;                     // 'k-wedding', 'k-skincare'
    gapMatchedAssets: {                  // 갭에 매칭된 Hub 콘텐츠
      hubAssetId: string;
      gapEntityName: string;
      supplyMode: 'direct' | 'custom_template' | 'draft';
    }[];
    totalDirectAvailable: number;
    totalCustomAvailable: number;
    totalDraftAvailable: number;
  };

  // ★ Expected Layer 요구사항
  expectedLayerRequirements: {
    mustInclude: string[];
    stronglyRecommended: string[];
    shouldInclude: string[];
    caution: string[];
    mustNotDo: string[];
    safetyGateLevel: 'standard' | 'medical' | 'financial';
    ymylGrade: 'none' | 'low' | 'medium' | 'high';
  };
}
```

**QisPredictedQuestion 상세 타입:**

```typescript
interface QisPredictedQuestion {
  bswQuestionId: string;
  questionText: string;
  predictedIntent: QisIntentType;      // 12종
  predictedVolume: 'low' | 'medium' | 'high';
  confidence: number;                   // 0-1
  firstMoverWindowDays: number;
  currentAiCoverage: 'none' | 'sparse' | 'moderate' | 'saturated';
  qvsComposite: number;
  autoMustInclude: string[];
  autoMustNotDo: string[];
}

type QisIntentType =
  | 'recommendation' | 'informational' | 'risk_boundary'
  | 'comparison' | 'trust_verification' | 'source_seeking'
  | 'contract_check' | 'price_package' | 'action_seeking'
  | 'routine_guidance' | 'product_fit' | 'local_intent';
```

---

## 2. BSW-OS 측 구현 명세 v2.0

### 2.1 Archetype 자동 매칭 모듈

**신규 파일:** `lib/industry/archetype-matcher.ts`

```typescript
import { Vec7D } from './genesis-types';

/**
 * BSW-OS 진단 결과 → GENESIS Archetype Vec7D 변환
 * Blueprint designPatterns + EEAT + L3 분석 결과를 7차원 감성 벡터로 투영
 */
export function auditResultToVec7d(
  audit: AuditResult,
  blueprint: IndustryBlueprint | null
): Vec7D {
  const eeat = audit.contentSemanticResult?.eeat ?? { overall: 50 };
  const techScore = audit.techInfraResult?.techInfraScore ?? 50;
  const contentScore = audit.contentSemanticResult?.contentSemanticScore ?? 50;
  
  // 기본 매핑 로직
  const trustSignal = (eeat.trustworthiness ?? 50) / 100;
  const expertiseSignal = (eeat.expertise ?? 50) / 100;
  const freshness = (audit.contentSemanticResult?.freshnessScore ?? 50) / 100;
  
  return {
    warmth: clamp(0.3 + trustSignal * 0.4, 0, 1),
    energy: clamp(freshness * 0.6 + (1 - techScore / 100) * 0.2, 0, 1),
    polish: clamp(techScore / 100 * 0.7, 0, 1),
    authentic: clamp(0.3 + (eeat.experience ?? 50) / 100 * 0.5, 0, 1),
    heritage: clamp(expertiseSignal * 0.6 + (blueprint?.designPatterns?.trustPriority === 'high' ? 0.3 : 0), 0, 1),
    futuristic: clamp((1 - expertiseSignal) * 0.3 + freshness * 0.3, 0, 1),
    playful: clamp((1 - trustSignal) * 0.3 + (contentScore < 40 ? 0.2 : 0), 0, 1),
  };
}

/**
 * Vec7D 코사인 유사도 기반 최적 아키타입 매칭
 */
export function matchArchetype(
  projectedVec7d: Vec7D,
  industryKey: string,
  archetypeRegistry: ArchetypeMaster[]
): { archetypeId: string; confidence: number; profileId: string } {
  const candidates = archetypeRegistry.filter(a => a.industryType === industryKey);
  
  let bestMatch = { archetypeId: '', confidence: 0, profileId: '' };
  
  for (const arch of candidates) {
    const similarity = cosineSimilarity(
      Object.values(projectedVec7d),
      Object.values(arch.lookAndFeel.targetVec7d)
    );
    if (similarity > bestMatch.confidence) {
      bestMatch = {
        archetypeId: arch.archetypeId,
        confidence: similarity,
        profileId: arch.profileId,
      };
    }
  }
  
  return bestMatch;
}

/**
 * BSW-OS 진단 결과 → 5-Layer Psychology 가중치 변환
 */
export function auditToPsychologyWeights(audit: AuditResult): PsychologyLayerWeights {
  const eeat = audit.contentSemanticResult?.eeat ?? { overall: 50, trustworthiness: 50 };
  const schema = audit.schemaQualityResult?.schemaQualityScore ?? 50;
  const tech = audit.techInfraResult?.techInfraScore ?? 50;
  
  // 약한 영역의 가중치를 높임
  const trustWeight = eeat.trustworthiness < 50 ? 0.3 : 0.15;
  const proofWeight = schema < 50 ? 0.25 : 0.15;
  const actionWeight = tech > 70 ? 0.25 : 0.15;
  const valueWeight = 0.25;
  const attentionWeight = 1 - trustWeight - proofWeight - actionWeight - valueWeight;
  
  return { attention: attentionWeight, trust: trustWeight, value: valueWeight, proof: proofWeight, action: actionWeight };
}

/**
 * BSW-OS Section 우선순위 도출 (60+ Section 중 선택)
 */
export function deriveSectionPriority(audit: AuditResult, gaps: SurfaceGapAnalysis[]): string[] {
  const sections: string[] = ['hero_qa_focus']; // 기본 히어로
  
  if ((audit.contentSemanticResult?.eeat?.trustworthiness ?? 100) < 50) {
    sections.push('trust_strip', 'stats_band');
  }
  if (gaps.some(g => g.prescriptionType === 'add_faq_markup')) {
    sections.push('faq_accordion');
  }
  if (gaps.some(g => g.entityType === 'comparative')) {
    sections.push('compare_block');
  }
  if (gaps.some(g => g.entityType === 'procedural')) {
    sections.push('routine_steps');
  }
  if (gaps.some(g => g.prescriptionType === 'add_author_markup')) {
    sections.push('doctor_profile');
  }
  if ((audit.schemaQualityResult?.schemaQualityScore ?? 100) < 40) {
    sections.push('catalog_grid');
  }
  if ((audit.contentSemanticResult?.multimediaScore ?? 100) < 30) {
    sections.push('masonry_gallery');
  }
  
  sections.push('cta_banner', 'semantic_search');
  return sections;
}
```

### 2.2 S2P Gap Mapping 모듈

**신규 파일:** `lib/industry/s2p-gap-mapper.ts`

```typescript
/**
 * BSW-OS 진단 결과 → GENESIS S2P Gap Report 10영역으로 변환
 * s2pGrowthBridge.ts의 GAP_TO_TF8_MAP과 호환
 */
export function auditToS2PGap(audit: AuditResult, gaps: SurfaceGapAnalysis[]): S2PGapMapping {
  const gnbGaps = gaps.filter(g => g.prescriptionType === 'create_content').length;
  const qaGaps = gaps.filter(g => ['factoid', 'procedural'].includes(g.entityType)).length;
  const trustGaps = gaps.filter(g => g.prescriptionType === 'add_eeat_signal').length;
  
  return {
    gnbIa: Math.max(0, 100 - gnbGaps * 10),
    questionAnswer: Math.max(0, 100 - qaGaps * 8),
    offerClarity: audit.schemaQualityResult?.schemaQualityScore ?? 50,
    trustEvidence: Math.min(100, (audit.contentSemanticResult?.eeat?.trustworthiness ?? 50)),
    visualExplanation: audit.contentSemanticResult?.multimediaScore ?? 30,
    policySafety: audit.schemaQualityResult?.schemaQualityScore ?? 50,
    conversion: audit.techInfraResult?.techInfraScore ?? 50,
    seoAeoGeo: audit.aepiScore ?? 50,
    mobileUx: audit.techInfraResult?.renderingMode === 'ssr' ? 80 : 50,
    operations: audit.techInfraResult?.sitemapScore ?? 30,
    tf8BlockScores: mapToTf8({/*... derived from above ...*/}),
  };
}

const GAP_TO_TF8_MAP: Record<string, string> = {
  gnbIa: 'F', questionAnswer: 'K', offerClarity: 'T',
  trustEvidence: 'W', visualExplanation: 'O', policySafety: 'W',
  conversion: 'A', seoAeoGeo: 'S', mobileUx: 'F', operations: 'T',
};
```

### 2.3 Hub Content Pool 매칭 모듈

**신규 파일:** `lib/industry/hub-content-matcher.ts`

```typescript
/**
 * BSW-OS 갭 → GENESIS Hub Content Pool 매칭
 * 갭에 해당하는 Hub 콘텐츠가 있으면 AI 생성 대신 Hub에서 공급
 */
export async function matchHubContent(
  gaps: SurfaceGapAnalysis[],
  hubSlug: string,
  genesisApiUrl: string
): Promise<HubContentMatchResult> {
  // GENESIS Hub Content Pool 조회
  const hubAssets = await fetch(
    `${genesisApiUrl}/api/v1/studio/hub-supply?hub_slug=${hubSlug}&is_active=true`
  ).then(r => r.json());
  
  const matches: HubContentMatch[] = [];
  
  for (const gap of gaps.filter(g => g.quadrant === 'red')) {
    const ucaType = mapPrescriptionToUcaType(gap.prescriptionType, gap.entityType);
    const hubMatch = hubAssets.find((ha: any) => 
      ha.asset_type === ucaType && 
      textSimilarity(ha.title, gap.entityName) > 0.3
    );
    
    if (hubMatch) {
      matches.push({
        hubAssetId: hubMatch.id,
        gapEntityName: gap.entityName,
        supplyMode: hubMatch.supply_mode,
        assetType: hubMatch.asset_type,
        title: hubMatch.title,
      });
    }
  }
  
  return {
    hubSlug,
    gapMatchedAssets: matches,
    totalDirectAvailable: hubAssets.filter((a: any) => a.supply_mode === 'direct').length,
    totalCustomAvailable: hubAssets.filter((a: any) => a.supply_mode === 'custom_template').length,
    totalDraftAvailable: hubAssets.filter((a: any) => a.supply_mode === 'draft').length,
    unmatchedGaps: gaps.filter(g => !matches.find(m => m.gapEntityName === g.entityName)),
  };
}
```

### 2.4 Handoff v2 생성 API

**수정 파일:** `app/api/synergy/handoff/route.ts` (v2 확장)

```typescript
// v2 추가 단계:
async function generateHandoffV2(auditSessionId: string): Promise<SynergyHandoffPackageV2> {
  const v1 = await generateHandoffV1(auditSessionId); // 기존 로직
  
  // ★ QIS 자산 추가
  const qisCrossMap = await crossMapQis(v1.brand.detectedIndustry, audit.entities);
  const bswPredictions = await getPredictions(auditSessionId);
  
  // ★ Archetype 매칭
  const vec7d = auditResultToVec7d(audit, blueprint);
  const archetypeMatch = matchArchetype(vec7d, v1.brand.genesisIndustryKey, archetypeRegistry);
  const sectionPriority = deriveSectionPriority(audit, gaps);
  const psychologyWeights = auditToPsychologyWeights(audit);
  
  // ★ S2P Gap 매핑
  const s2pGap = auditToS2PGap(audit, gaps);
  
  // ★ Hub Content 매칭
  const hubSlug = mapIndustryToHubSlug(v1.brand.genesisIndustryKey);
  const hubMatch = await matchHubContent(gaps, hubSlug, GENESIS_API_URL);
  
  // ★ Expected Layer
  const expectedLayer = await pullExpectedLayer(hubSlug);
  
  return {
    ...v1,
    version: '2.0',
    qisAssets: {
      industryOnlyQuestions: bswPredictions,
      siteOnlyQuestions: qisCrossMap.siteOnly,
      crossMapCoverage: qisCrossMap.coverage,
      hubProbeResults: await getHubBairScore(hubSlug),
    },
    archetypeHints: {
      suggestedArchetypeId: archetypeMatch.archetypeId,
      suggestedProfileId: archetypeMatch.profileId,
      matchConfidence: archetypeMatch.confidence,
      vec7dProjection: vec7d,
      sectionPriority,
      psychologyLayerWeights: psychologyWeights,
    },
    s2pGapMapping: s2pGap,
    hubContentRequest: hubMatch,
    expectedLayerRequirements: expectedLayer,
  };
}
```

---

## 3. GENESIS 측 구현 명세 v2.0

### 3.1 Synergy Onboard v2 (Archetype + Hub + QIS 통합)

**수정 파일:** `apps/web/app/api/v1/synergy/onboard/route.ts` (v2)

```typescript
async function handleSynergyOnboardV2(pkg: SynergyHandoffPackageV2) {
  // Phase 0: 업종 + Archetype 결정
  const archetype = pkg.archetypeHints.suggestedArchetypeId
    ? await loadArchetype(pkg.archetypeHints.suggestedArchetypeId)
    : await detectArchetype(pkg.brand.genesisIndustryKey);
  
  // Phase 1: Archetype 기반 풀스택 설정
  const designConfig = {
    // Archetype Vec7D → VTDS 토큰
    vec7d: pkg.archetypeHints.vec7dProjection,
    baseTheme: archetype.lookAndFeel.baseTheme,
    motionLevel: archetype.lookAndFeel.motionLevel,
    // Section Registry에서 Psychology Layer 기반 선택
    homeSections: buildHomeSections(
      pkg.archetypeHints.sectionPriority,
      pkg.archetypeHints.psychologyLayerWeights
    ),
  };
  
  // Phase 2: GNB/IA — Archetype + 갭 보정 + Hub GNB
  const gnbConfig = {
    tenantGnb: buildGnbFromBlueprint(
      pkg.brand.genesisIndustryKey,
      pkg.gnbCorrections,
      pkg.contentGaps
    ),
    hubGnb: loadHubGnbPreset(pkg.hubContentRequest.hubSlug),
  };
  
  // Phase 3: 콘텐츠 시드 — Hub Pool + AI 생성 + QIS
  const contentSeeds = [];
  
  // 3a: Hub Content Pool에서 매칭된 콘텐츠 즉시 공급
  for (const match of pkg.hubContentRequest.gapMatchedAssets) {
    const hubAsset = await pullHubAsset(match.hubAssetId, match.supplyMode);
    if (match.supplyMode === 'direct') {
      contentSeeds.push({ ...hubAsset, status: 'active' });
    } else if (match.supplyMode === 'custom_template') {
      const customized = await customizeWithBrand(hubAsset, pkg.brand);
      contentSeeds.push({ ...customized, status: 'active' });
    } else {
      contentSeeds.push({ ...hubAsset, status: 'draft', review_status: 'pending' });
    }
  }
  
  // 3b: Hub에서 매칭 안 된 갭 → AI 드래프트
  for (const gap of pkg.hubContentRequest.unmatchedGaps) {
    const draft = await generateAiDraft(gap, pkg.brand, pkg.expectedLayerRequirements);
    contentSeeds.push({ ...draft, status: 'draft', review_status: 'pending' });
  }
  
  // 3c: QIS 예측 질문 → answer UCA
  for (const q of pkg.qisAssets.industryOnlyQuestions.slice(0, 10)) {
    if (q.confidence >= 0.70 && q.currentAiCoverage !== 'saturated') {
      const answerDraft = await generatePredictedAnswer(q, pkg.expectedLayerRequirements);
      contentSeeds.push(answerDraft);
    }
  }
  
  // 3d: Archetype 필수 콘텐츠 확인 + 누락분 생성
  for (const [type, req] of Object.entries(archetype.requiredContentAssets)) {
    if (req.severity === 'critical' && !contentSeeds.find(c => c.type === type)) {
      contentSeeds.push(await generateFromSeedTitle(archetype.contentSeedTitles[type], type));
    }
  }
  
  // Phase 4: Expected Layer 적용
  const complianceConfig = {
    safetyGateLevel: pkg.expectedLayerRequirements.safetyGateLevel,
    mustInclude: pkg.expectedLayerRequirements.mustInclude,
    mustNotDo: pkg.expectedLayerRequirements.mustNotDo,
  };
  
  // Phase 5: DB 시딩 (Turnkey Engine)
  const tenantId = await turnkeyEngine.seed({
    tenant: { slug: slugify(pkg.brand.name), industry_type: pkg.brand.genesisIndustryKey },
    brandProfile: pkg.brand,
    designConfig,
    gnbConfig,
    contentAssets: contentSeeds,
    complianceConfig,
    hubId: pkg.hubContentRequest.hubSlug,  // Hub 연결
    archetypeSlug: archetype.archetypeId,
  });
  
  // Phase 6: Growth Orchestrator 점화 (S2P Bridge)
  await s2pGrowthBridge.onSynergyOnboard({
    tenantId,
    tf8BlockScores: pkg.s2pGapMapping.tf8BlockScores,
    industryType: pkg.brand.genesisIndustryKey,
    bswAuditSessionId: pkg.sourceAuditSessionId,
    bswGapData: pkg.contentGaps,
    qisPredictions: pkg.qisAssets.industryOnlyQuestions,
  });
  
  // Phase 7: QIS 시드 등록
  await registerQisSeeds(tenantId, [
    ...archetype.questionCapitalSeed,
    ...pkg.qisAssets.industryOnlyQuestions.map(q => q.questionText),
  ]);
  
  // Phase 8: Synergy Config 저장 (재진단 설정)
  await saveSynergyConfig(tenantId, {
    bswAuditSessionId: pkg.sourceAuditSessionId,
    bswHandoffPackage: pkg,
    autoReAuditEnabled: true,
    reAuditIntervalWeeks: 4,
  });
  
  return { tenantId, contentCount: contentSeeds.length, archetype: archetype.archetypeId };
}
```

### 3.2 Growth Orchestrator v2 확장

**수정 파일:** `apps/web/lib/studio/growth-orchestrator.ts`

#### Step 5 — 5중 소스 기회 발견

```typescript
async function findOpportunitiesV2(tenantId: string, geoScore: GeoScoreSnapshot): Promise<Opportunity[]> {
  const opportunities: Opportunity[] = [];
  const synergyConfig = await getSynergyConfig(tenantId);
  
  // 소스 1: GEO 실패 항목 (기존)
  for (const check of geoScore.failingChecks) {
    opportunities.push({ topic: check.name, score: check.points * 2, type: 'geo_gap' });
  }
  
  // 소스 2: QIS 예측 질문 (기존)
  const qisQuestions = await getQisPredictions(tenantId);
  for (const q of qisQuestions) {
    opportunities.push({ topic: q.text, score: q.qvs_score, type: 'qis_question' });
  }
  
  // ★ 소스 3: BSW-OS RED 갭 (신규)
  if (synergyConfig?.bswGapData) {
    for (const gap of synergyConfig.bswGapData.red) {
      const isAlsoQis = qisQuestions.some(q => textSimilarity(q.text, gap.entityName) > 0.3);
      opportunities.push({
        topic: gap.entityName,
        score: gap.priorityScore * (isAlsoQis ? 4 : 3), // QIS 교차 시 추가 부스트
        type: 'bsw_content_gap',
        metadata: { prescriptionType: gap.prescriptionType, aepiImpact: gap.estimatedAepiImpact },
      });
    }
  }
  
  // ★ 소스 4: BSW-OS YELLOW 갭 → Polish 대상 (신규)
  if (synergyConfig?.bswGapData) {
    for (const gap of synergyConfig.bswGapData.yellow) {
      opportunities.push({
        topic: gap.entityName,
        score: gap.priorityScore * 2,
        type: 'bsw_reflection_gap',
        metadata: { existingAssetId: await findExistingAsset(tenantId, gap.entityName) },
      });
    }
  }
  
  // ★ 소스 5: BSW-OS WHITE 블루오션 (신규)
  if (synergyConfig?.bswGapData) {
    for (const gap of synergyConfig.bswGapData.white) {
      opportunities.push({
        topic: gap.entityName,
        score: gap.priorityScore * 1.5,
        type: 'bsw_blue_ocean',
      });
    }
  }
  
  return opportunities.sort((a, b) => b.score - a.score).slice(0, 10);
}
```

#### Step 9 확장 — BSW-OS 자동 피드백 전송

```typescript
async function saveMissionV2(tenantId: string, result: WeeklyGrowthResult) {
  await saveMission(tenantId, result); // 기존 로직
  
  // ★ BSW-OS에 주간 피드백 자동 전송
  const synergyConfig = await getSynergyConfig(tenantId);
  if (synergyConfig?.autoReAuditEnabled) {
    try {
      await reportToBsw(tenantId, result);
    } catch (e) {
      console.warn('[Synergy] BSW feedback failed, non-blocking:', e);
    }
  }
}
```

### 3.3 Content Polishing Engine v2 확장

**수정 파일:** `apps/web/lib/studio/polish-scorer.ts`

```typescript
// Expected Layer 통합 검증
async function scoreAssetV2(
  asset: UniversalContentAsset,
  brandContext: BrandContext,
  options?: {
    bswL3Data?: ContentSemanticResult;
    expectedLayer?: ExpectedLayerConfig;
  }
): Promise<PolishScoreV2> {
  const baseScore = await scoreAsset(asset, brandContext, options?.bswL3Data);
  
  if (options?.expectedLayer) {
    // Expected Layer 준수 검사
    const compliance = checkExpectedLayerCompliance(
      asset.json_payload.body_richtext ?? '',
      options.expectedLayer
    );
    
    // 준수율에 따라 점수 보정
    const compliancePenalty = (1 - compliance.ratio) * 15; // 최대 15점 감점
    
    return {
      ...baseScore,
      totalScore: Math.max(0, baseScore.totalScore - compliancePenalty),
      expectedLayerCompliance: compliance,
      violations: compliance.violations, // must_not_do 위반 시 🔴 경고
    };
  }
  
  return baseScore;
}

function checkExpectedLayerCompliance(bodyHtml: string, layer: ExpectedLayerConfig) {
  const text = stripHtml(bodyHtml).toLowerCase();
  const violations: string[] = [];
  let met = 0;
  let total = 0;
  
  for (const item of layer.mustInclude) {
    total++;
    if (text.includes(item.toLowerCase())) met++;
    else violations.push(`[MISSING] must_include: "${item}"`);
  }
  
  for (const item of layer.mustNotDo) {
    if (text.includes(item.toLowerCase())) {
      violations.push(`[VIOLATION] must_not_do: "${item}"`);
    }
  }
  
  return { ratio: total > 0 ? met / total : 1, violations };
}
```

### 3.4 Predicted Content Pipeline v2 확장

**수정 파일:** `apps/web/lib/studio/predictedContentPipeline.ts`

```typescript
// BSW-OS 예측 질문의 Expected Layer 자동 적용
async function processPredictedQuestionsV2(
  tenantId: string,
  industryType: string,
  predictedQuestions: QisPredictedQuestion[],
  expectedLayer?: ExpectedLayerConfig  // ★ BSW-OS Expected Layer 추가
) {
  for (const q of filteredQuestions) {
    const blueprint = {
      questionText: q.questionText,
      intent: q.predictedIntent,
      schemaType: intentToSchemaType(q.predictedIntent),
      // ★ BSW-OS Expected Layer + QIS auto 레이어 병합
      mustInclude: [
        ...(q.autoMustInclude ?? []),
        ...(expectedLayer?.mustInclude ?? []),
      ],
      mustNotDo: [
        ...(q.autoMustNotDo ?? []),
        ...(expectedLayer?.mustNotDo ?? []),
      ],
    };
    
    await createCmosDraft(tenantId, blueprint);
  }
}
```

---

## 4. 데이터베이스 확장 v2.0

### 4.1 BSW-OS 측 추가 테이블

```sql
-- v2.0: Archetype 매칭 이력
CREATE TABLE IF NOT EXISTS synergy_archetype_matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  handoff_id UUID REFERENCES synergy_handoffs(id),
  suggested_archetype_id TEXT NOT NULL,
  match_confidence NUMERIC(3,2) NOT NULL,
  vec7d_projection JSONB NOT NULL,
  psychology_weights JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- v2.0: QIS 교차 매핑 이력
CREATE TABLE IF NOT EXISTS synergy_qis_crossmap (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  handoff_id UUID REFERENCES synergy_handoffs(id),
  industry_only_count INTEGER NOT NULL,
  site_only_count INTEGER NOT NULL,
  both_count INTEGER NOT NULL,
  goldilocks_coverage NUMERIC(3,2),
  cross_boosted_questions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- v2.0: BAIR Score 이력 (Hub QIS Benchmark 교차)
CREATE TABLE IF NOT EXISTS synergy_bair_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  website_url TEXT NOT NULL,
  hub_slug TEXT NOT NULL,
  bair_score NUMERIC(4,3) NOT NULL,
  aas_score NUMERIC(4,3),
  ocr_score NUMERIC(4,3),
  bsf_score NUMERIC(4,3),
  measured_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 4.2 GENESIS 측 추가 필드

```sql
-- synergy_configs 확장
ALTER TABLE synergy_configs
  ADD COLUMN IF NOT EXISTS archetype_slug TEXT,
  ADD COLUMN IF NOT EXISTS expected_layer_config JSONB,
  ADD COLUMN IF NOT EXISTS hub_slug TEXT,
  ADD COLUMN IF NOT EXISTS bsw_gap_data JSONB,
  ADD COLUMN IF NOT EXISTS qis_predictions JSONB,
  ADD COLUMN IF NOT EXISTS last_bair_score NUMERIC(4,3);

-- universal_content_assets 확장
ALTER TABLE universal_content_assets
  ADD COLUMN IF NOT EXISTS expected_layer_compliance JSONB,
  ADD COLUMN IF NOT EXISTS bsw_cross_boost BOOLEAN DEFAULT FALSE;
```

---

## 5. QIS 양방향 데이터 흐름 상세

### 5.1 Daily Cron 연동 확장

**수정 파일:** `app/api/cron/qis-sync/route.ts` (BSW-OS)

```typescript
// v2: Synergy 연동 테넌트 피드백도 Pull
export async function GET(request: Request) {
  // 기존: KWeddingHub Pull → Push
  await pullFromHub('kwedding');
  await pushToHub('kwedding');
  
  // ★ 신규: Synergy 연동 테넌트 GEO/Polish 데이터 Pull
  const synergyTenants = await getSynergyFeedbackPending();
  for (const tenant of synergyTenants) {
    const feedback = await fetch(
      `${GENESIS_API_URL}/api/v1/synergy/report?tenant_id=${tenant.genesis_tenant_id}`
    ).then(r => r.json());
    
    if (feedback) {
      // GEO Score → TemporalTrend
      await recordTemporalDataPoint(tenant.website_url, {
        aepiScore: feedback.geoScore.current / 2.5, // GEO 250점 → AEPI 100점 스케일
        geoScore: feedback.geoScore.current,
        polishAvg: feedback.polishScores.reduce((s, p) => s + p.score, 0) / feedback.polishScores.length,
        missionsCompleted: feedback.missionsCompleted,
      });
      
      // BAIR Score 교차 기록
      if (feedback.bairScore) {
        await recordBairScore(tenant.website_url, tenant.hub_slug, feedback.bairScore);
      }
    }
  }
}
```

### 5.2 Hub Signal Types → BSW-OS 역설계 보강

| Hub 신호 유형 | BSW-OS 활용 | 역설계 보강 지점 |
|-------------|-----------|--------------|
| `community_question` | QIS 질문 우주 확장 | 실제 사용자 질문 → RED 갭 정밀화 |
| `verified_review` | EEAT trustworthiness 보정 | 실 리뷰 데이터 → L3 신뢰도 교정 |
| `price_report` | QVS ARPU 정밀화 | 실거래가 → 질문 가치 정확도 ↑ |
| `stress_pattern` | 감정 기반 질문 예측 | 스트레스 패턴 → 예측 질문 트리거 |
| `deal_room_contract` | QVS Conversion 정밀화 | 실 전환율 → ROI 정확도 ↑ |
| `preference_pattern` | 콘텐츠 토픽 우선순위 | 선호도 → 블루오션 기회 발굴 |

---

## 6. 구현 우선순위 로드맵 v2.0

### Phase 1: 핵심 브릿지 + Archetype (2주)

| # | 작업 | 시스템 | 예상 |
|---|------|--------|------|
| 1.1 | `SynergyHandoffPackageV2` 타입 정의 | 공통 | 3h |
| 1.2 | `archetype-matcher.ts` (Vec7D 변환 + 매칭) | BSW-OS | 4h |
| 1.3 | `s2p-gap-mapper.ts` (10영역 매핑) | BSW-OS | 3h |
| 1.4 | `hub-content-matcher.ts` (Hub Pool 매칭) | BSW-OS | 3h |
| 1.5 | `POST /api/synergy/handoff` v2 | BSW-OS | 5h |
| 1.6 | `POST /api/v1/synergy/onboard` v2 (8 Phase) | GENESIS | 8h |
| 1.7 | Archetype DB 연동 + preset_application_log 기록 | GENESIS | 3h |
| 1.8 | Hub Content Pool 매칭 공급 로직 | GENESIS | 4h |

### Phase 2: QIS 양방향 + Growth 확장 (2주)

| # | 작업 | 시스템 | 예상 |
|---|------|--------|------|
| 2.1 | Growth Orchestrator `findOpportunitiesV2()` | GENESIS | 4h |
| 2.2 | Mission Card BSW 소스 배지 + 우선순위 | GENESIS | 3h |
| 2.3 | `predictedContentPipeline` Expected Layer 통합 | GENESIS | 3h |
| 2.4 | `polish-scorer` Expected Layer 준수 검사 | GENESIS | 3h |
| 2.5 | QIS Cron Synergy 피드백 Pull | BSW-OS | 3h |
| 2.6 | BAIR Score 교차 기록 | BSW-OS | 2h |
| 2.7 | `POST /api/synergy/feedback` v2 | BSW-OS | 3h |
| 2.8 | `POST /api/v1/synergy/report` (주간 자동 전송) | GENESIS | 3h |

### Phase 3: 피드백 루프 + Elo (1주)

| # | 작업 | 시스템 | 예상 |
|---|------|--------|------|
| 3.1 | `POST /api/synergy/re-audit` (자동 재진단) | BSW-OS | 3h |
| 3.2 | `cron/bsw-re-audit` v2 (BAIR 트리거 추가) | GENESIS | 3h |
| 3.3 | Archetype Elo 캘리브레이션 (AEPI δ 반영) | GENESIS | 4h |
| 3.4 | TemporalTrend GENESIS+BAIR 통합 | BSW-OS | 3h |
| 3.5 | Persona Drift Alert → Growth Red Card | 양쪽 | 2h |

### Phase 4: UI/UX + 대시보드 (1주)

| # | 작업 | 시스템 | 예상 |
|---|------|--------|------|
| 4.1 | BSW-OS "Archetype 매칭 + 즉시 구축" CTA | BSW-OS | 4h |
| 4.2 | BSW-OS 핸드오프 미리보기 (Archetype + Hub 매칭 표시) | BSW-OS | 3h |
| 4.3 | GENESIS Studio BSW 연계 대시보드 v2 | GENESIS | 4h |
| 4.4 | GENESIS Mission Card BSW 배지 + 교차 부스트 표시 | GENESIS | 3h |
| 4.5 | DB 마이그레이션 (양쪽) | 공통 | 3h |

> **총 예상:** ~6주 (약 95시간), Phase 1-2로 4주 내 핵심 기능 MVP

---

## 7. 검증 계획 v2.0

| 검증 항목 | 방법 | 성공 기준 |
|---------|------|---------|
| Handoff v2 생성 | BSW Audit → handoff v2 API | 모든 v2 필드 유효, Archetype 매칭 confidence ≥ 0.5 |
| Archetype 매칭 | 11개 아키타입 각각 Vec7D 테스트 | 정확한 업종별 매칭, 코사인 유사도 ≥ 0.6 |
| Hub Pool 매칭 | 30개 Hub 콘텐츠 × 15 RED 갭 매칭 | 매칭율 ≥ 40% (6+/15) |
| Hub Content 공급 | direct 15개 즉시 활성화 | 100% active 전환 |
| QIS 예측 교차 | BSW 예측 + Hub 질문 교차 | 교차 부스트 적용 확인 |
| Expected Layer | must_include 5개 + must_not_do 3개 테스트 | 100% 검증 통과 |
| S2P Gap 매핑 | 10영역 → TF8 8블록 변환 | 모든 블록 점수 0-100 범위 |
| Growth v2 | 5중 소스 기회 발견 10개 | BSW 소스 ≥ 3개 포함 |
| E2E 폐루프 | 진단→매칭→구축→4주 운영→재진단 | AEPI δ > 0, BAIR δ > 0 |
| Elo 학습 | 2개 아키타입 비교 (4주 후) | Elo Rating 차이 발생 |

---

> **v2.0 결론:** QIS 양방향 연동과 Hub Platform 통합으로, 핸드오프 패키지가 v1.0의 9개 섹션에서 v2.0의 **14개 섹션**(+QIS 자산, Archetype 힌트, S2P 갭, Hub 콘텐츠 매칭, Expected Layer)으로 확장되었습니다. 이를 통해 GENESIS의 **아키타입 시스템(11종)**, **Hub Content Pool(업종당 30+)**, **Expected Layer(5-tier)**, **Predicted Content Pipeline(24h 자동 리뷰)** 이 BSW-OS 진단 데이터와 완전히 맞물려, "진단 5초 → 구축 수 분 → 성장 매주 자동 → 재진단 매월 자동"의 **완전 자동화 AEO 플랫폼**이 실현됩니다.
