"use server";

import { WebsiteCrawler, CrawledPage } from "../../lib/surface/website-crawler";
import { LlmEntityExtractor } from "../../lib/surface/llm-entity-extractor";
import { KnowledgeGraphBuilder } from "../../lib/surface/knowledge-graph-builder";
import { AnswerCardReverser } from "../../lib/surface/answer-card-reverser";
import { ProbeGenerator } from "../../lib/surface/probe-generator";
import { QisCrossMapper } from "../../lib/surface/qis-cross-mapper";
import { EntityReflectionRunner } from "../../lib/benchmark/entity-reflection-runner";
import { AepiCalculator } from "../../lib/benchmark/aepi-calculator";
import { PersonaReverseEngineer } from "../../lib/surface/persona-reverse-engineer";
import { GapAnalyzer } from "../../lib/benchmark/gap-analyzer";
import { TemporalTracker, TemporalTrend } from "../../lib/benchmark/temporal-tracker";
import { QuickSiteAnalyzer, QuickAuditResult } from "../../lib/surface/quick-site-analyzer";
import { TechInfraAuditor, TechInfraAuditResult } from "../../lib/surface/tech-infra-auditor";
import { SchemaQualityAuditor, SchemaQualityAuditResult } from "../../lib/surface/schema-quality-auditor";
import { ContentSemanticAnalyzer, ContentSemanticResult } from "../../lib/surface/content-semantic-analyzer";
import {
  SurfaceEntity, ReversedAnswerCard,
  EntityReflectionSnapshot, ObservedParametricPersona,
  PersonaSpec, SurfaceGapAnalysis
} from "../../lib/schema";
import { ParametricPersonaSnapshot } from "../../lib/persona/parametric-persona-snapshot";
import { getSupabaseAdminClient } from "../../lib/supabase";
import { RelativePositioner, RelativePosition } from "../../lib/industry/relative-positioner";
import { StrategyGenerator, ImprovementStrategy } from "../../lib/industry/strategy-generator";
import { getBenchmarkProfile, getIndustryBlueprint } from "./industry-benchmark";
import { AuditResult } from "./site-audit-types";

/**
 * 크롤링된 엔티티와 URL 기반 업종 자동 감지
 */
function detectIndustry(websiteUrl: string, entities: SurfaceEntity[]): string {
  const allText = [
    websiteUrl.toLowerCase(),
    ...entities.map(e => `${e.entity_name} ${JSON.stringify(e.entity_content)}`)
  ].join(' ').toLowerCase();

  const INDUSTRY_KEYWORDS: Record<string, string[]> = {
    skincare: ['스킨케어', '화장품', '뷰티', '코스메틱', '피부', '세럼', '크림', 'skincare', 'cosmetic', 'beauty', 'serum', '클렌저'],
    wedding_studio: ['웨딩', '스튜디오', '촬영', '포토', '스냅', '결혼', 'wedding', 'studio', 'photo', 'bridal', '드레스'],
    beauty: ['메이크업', '헤어', '살롱', '네일', 'makeup', 'salon', 'nail', 'hair'],
    clinic: ['병원', '클리닉', '의원', '진료', '치료', 'clinic', 'hospital', 'medical', '피부과', '성형'],
    restaurant: ['레스토랑', '음식점', '맛집', '카페', '배달', 'restaurant', 'cafe', 'dining'],
    real_estate: ['부동산', '아파트', '매물', '분양', 'real estate', 'property', 'apartment'],
    education: ['학원', '교육', '강의', '수업', '튜터', 'education', 'academy', 'tutor', 'course'],
    travel: ['여행', '투어', '호텔', '숙소', '관광', 'travel', 'tour', 'hotel', 'tourism'],
    pet: ['반려동물', '펫', '강아지', '고양이', 'pet', 'dog', 'cat', 'veterinary'],
    convenience_retail: ['편의점', '리테일', '매장', '소매', 'convenience', 'retail', 'store'],
    fashion_ecommerce: ['패션', '의류', '쇼핑몰', '옷', 'fashion', 'clothing', 'apparel', 'ecommerce'],
    it_software: ['소프트웨어', '앱', 'SaaS', '개발', 'software', 'app', 'tech', 'platform'],
    food_beverage: ['식품', '음료', '건강식품', '식자재', 'food', 'beverage', 'nutrition'],
  };

  let bestMatch = '';
  let bestScore = 0;

  for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    const matchCount = keywords.filter(kw => allText.includes(kw)).length;
    if (matchCount > bestScore) {
      bestScore = matchCount;
      bestMatch = industry;
    }
  }

  const detected = bestScore >= 2 ? bestMatch : 'default';
  console.log(`[Audit] Industry auto-detected: "${detected}" (score: ${bestScore})`);
  return detected;
}

async function updateProgress(sessionId: string, currentStep: number, totalSteps: number, message: string) {
  try {
    const db = getSupabaseAdminClient();
    await db.from('audit_sessions').update({
      progress: {
        current_step: currentStep,
        total_steps: totalSteps,
        message: message,
        updated_at: new Date().toISOString()
      }
    }).eq('id', sessionId);
    console.log(`[Audit Session ${sessionId}] Step ${currentStep}/${totalSteps}: ${message}`);
  } catch (e) {
    console.error(`Failed to update progress for session ${sessionId}:`, e);
  }
}

/** 일시정지 여부 확인 */
async function checkPaused(sessionId: string): Promise<boolean> {
  try {
    const db = getSupabaseAdminClient();
    const { data } = await db.from('audit_sessions')
      .select('status').eq('id', sessionId).single();
    return data?.status === 'paused';
  } catch {
    return false;
  }
}

/** 중간 결과를 checkpoint_data에 저장 */
async function saveCheckpoint(
  sessionId: string,
  stepIndex: number,
  checkpointData: Record<string, any>,
  partialResult?: Partial<AuditResult>
) {
  try {
    const db = getSupabaseAdminClient();
    await db.from('audit_sessions').update({
      last_checkpoint_step: stepIndex,
      checkpoint_data: checkpointData,
      ...(partialResult ? { partial_result: partialResult } : {})
    }).eq('id', sessionId);
  } catch (e) {
    console.warn(`[Audit] Could not save checkpoint at step ${stepIndex}:`, e);
  }
}

/** 감사 세션 상태 조회 (클라이언트 폴링용) */
export async function getAuditSession(sessionId: string) {
  const db = getSupabaseAdminClient();
  const { data } = await db.from('audit_sessions')
    .select('id, status, progress, last_checkpoint_step, brand_name, website_url, tier, result_data, partial_result')
    .eq('id', sessionId)
    .single();
  return data;
}

/** 실행 중인 감사 일시정지 */
export async function pauseAuditSession(sessionId: string): Promise<{ ok: boolean; message: string }> {
  try {
    const db = getSupabaseAdminClient();
    const { data } = await db.from('audit_sessions')
      .select('status').eq('id', sessionId).single();
    if (!data || data.status !== 'running') {
      return { ok: false, message: '실행 중이 아닌 세션은 일시정지할 수 없습니다.' };
    }
    await db.from('audit_sessions').update({
      status: 'paused',
      paused_at: new Date().toISOString()
    }).eq('id', sessionId);
    return { ok: true, message: '다음 단계 시작 전 일시정지됩니다.' };
  } catch (e: any) {
    return { ok: false, message: e.message };
  }
}

/** 일시정지된 감사 이어하기 */
export async function resumeAuditSession(sessionId: string): Promise<{ ok: boolean; message: string }> {
  try {
    const db = getSupabaseAdminClient();
    const { data } = await db.from('audit_sessions')
      .select('*').eq('id', sessionId).single();
    if (!data || data.status !== 'paused') {
      return { ok: false, message: '일시정지 상태의 세션만 재개할 수 있습니다.' };
    }
    const resumeFrom = (data.last_checkpoint_step as number) || 0;
    const checkpointData = (data.checkpoint_data as Record<string, any>) || {};

    await db.from('audit_sessions').update({
      status: 'running',
      resumed_at: new Date().toISOString()
    }).eq('id', sessionId);

    // 이어 실행 (checkpoint 이후 step부터)
    runFullSiteAuditBackground(
      sessionId, data.workspace_id, data.website_url, data.brand_name,
      data.competitors || [], data.tier || 'tier2', data.industry,
      resumeFrom, checkpointData
    ).catch(err => {
      console.error(`Resumed audit ${sessionId} failed:`, err);
      db.from('audit_sessions').update({ status: 'failed', progress: { message: '재개 후 진단 실패: ' + err.message } }).eq('id', sessionId);
    });

    return { ok: true, message: `Step ${resumeFrom + 1}부터 재개합니다.` };
  } catch (e: any) {
    return { ok: false, message: e.message };
  }
}

export async function runQuickSiteAudit(
  workspaceId: string,
  websiteUrl: string,
  brandName: string,
  industry?: string
): Promise<AuditResult> {
  const analyzer = new QuickSiteAnalyzer();
  const result = await analyzer.analyze(workspaceId, websiteUrl, brandName);

  const detectedIndustry = industry || detectIndustry(websiteUrl, result.entities);

  const finalResult: AuditResult = {
    websiteUrl: result.websiteUrl,
    brandName: result.brandName,
    entities: result.entities,
    cards: result.cards,
    snapshot: result.snapshot,
    observedPersona: null,
    parametricSnapshot: null,
    personaSpec: null,
    gaps: result.gaps,
    trends: [],
    auditMode: result.auditMode,
    industry: detectedIndustry,
    techInfra: result.techInfra,
    schemaQuality: result.schemaQuality,
    contentSemantic: result.contentSemantic,
    relativePosition: null,
    improvementStrategy: null,
  };

  // 업종 벤치마크 포지셔닝 (벤치마크 프로필이 있을 때만)
  try {
    if (detectedIndustry && detectedIndustry !== 'default') {
      const [profile, blueprint] = await Promise.all([
        getBenchmarkProfile(detectedIndustry),
        getIndustryBlueprint(detectedIndustry),
      ]);
      if (profile && blueprint) {
        const positioner = new RelativePositioner();
        const strategyGen = new StrategyGenerator();
        const position = positioner.position(finalResult, profile, blueprint);
        const strategy = strategyGen.generate(position, blueprint, result.gaps);
        finalResult.relativePosition = position;
        finalResult.improvementStrategy = strategy;
        console.log(`[Audit] Industry positioning: ${position.overallPercentile}th percentile in ${detectedIndustry}`);
      }
    }
  } catch (e) {
    console.warn('[Audit] Could not compute industry positioning:', e);
  }

  try {
    const db = getSupabaseAdminClient();
    const { data } = await db.from('audit_sessions').insert({
      workspace_id: workspaceId,
      brand_name: result.brandName,
      website_url: result.websiteUrl,
      industry: detectedIndustry || 'default',
      tier: 'free',
      status: 'completed',
      result_data: finalResult
    }).select('id').single();
    if (data) finalResult.sessionId = data.id;
  } catch (e) {
    console.error("Failed to save quick audit session:", e);
  }

  return finalResult;
}

export async function startAuditSession(
  workspaceId: string,
  websiteUrl: string,
  brandName: string,
  competitors: string[] = [],
  tier: 'free' | 'tier1' | 'tier1.5' | 'tier2' | 'tier3' = 'tier3',
  industryInput?: string
): Promise<string> {
  const db = getSupabaseAdminClient();
  const { data, error } = await db.from('audit_sessions').insert({
    workspace_id: workspaceId,
    brand_name: brandName,
    website_url: websiteUrl,
    industry: industryInput || 'default',
    tier: tier,
    status: 'running',
    progress: { current_step: 0, total_steps: 14, message: '진단 대기 중...' }
  }).select('id').single();

  if (error || !data) {
    throw new Error('Failed to create audit session: ' + error?.message);
  }

  const sessionId = data.id;

  runFullSiteAuditBackground(sessionId, workspaceId, websiteUrl, brandName, competitors, tier, industryInput)
    .catch(err => {
      console.error(`Background audit ${sessionId} failed:`, err);
      db.from('audit_sessions').update({ status: 'failed', progress: { message: '진단 실패: ' + err.message } }).eq('id', sessionId);
    });

  return sessionId;
}

async function runFullSiteAuditBackground(
  sessionId: string, 
  workspaceId: string,
  websiteUrl: string,
  brandName: string,
  competitors: string[] = [],
  tier: 'free' | 'tier1' | 'tier1.5' | 'tier2' | 'tier3' = 'tier3',
  industryInput?: string,
  resumeFromStep: number = 0,          // ← 이어하기 지점
  checkpointData: Record<string, any> = {}  // ← 이전 checkpoint 데이터
): Promise<AuditResult> {
  console.log(`[Audit Action] Beginning full site audit for ${brandName} (${websiteUrl}), tier: ${tier}`);

  let quickResult: QuickAuditResult | null = checkpointData.quickResult || null;
  if (!quickResult) {
    try {
      await updateProgress(sessionId, 0, 14, '빠른 진단 기준으로 초기 추정 중...');
      const analyzer = new QuickSiteAnalyzer();
      quickResult = await analyzer.analyze(workspaceId, websiteUrl, brandName);
    } catch (e: any) {
      console.warn(`[Audit Action] Quick audit baseline failed: ${e.message}`);
    }
  }

  let hasLlmEntities = false;
  let hasReflection = false;

  try {
    // ── Step 1: Crawl Website ──
    let crawlResult: any = checkpointData.crawlResult || null;
    let crawledPages: CrawledPage[] = checkpointData.crawledPages || [];
    if (resumeFromStep < 1 || !crawlResult) {
      try {
        const crawler = new WebsiteCrawler();
        await updateProgress(sessionId, 1, 14, '웹사이트 구조 크롤링 중...');
        if (await checkPaused(sessionId)) { console.log('[Audit] Paused at step 1'); return quickResult ? quickResultToAudit(quickResult, industryInput) : { websiteUrl, brandName, entities: [], cards: [], snapshot: null, observedPersona: null, parametricSnapshot: null, personaSpec: null, gaps: [], trends: [], auditMode: 'estimated' }; }
        crawlResult = await crawler.crawl(websiteUrl, 20);
        crawledPages = crawlResult.pages || [];
        console.log(`[Audit] Step 1 OK: crawled ${crawledPages.length} pages`);
        await saveCheckpoint(sessionId, 1, { quickResult, crawlResult, crawledPages });
      } catch (e: any) {
        console.warn(`[Audit] Step 1 FAIL (crawl): ${e.message}. Using quick audit entities.`);
        if (quickResult) {
          return { ...quickResultToAudit(quickResult, industryInput), auditMode: 'estimated' };
        }
        throw e;
      }
    }

    // ── Step 2: Tech Infra Audit (L1) ──
    let techInfra: TechInfraAuditResult;
    if (resumeFromStep >= 2 && checkpointData.techInfra) {
      techInfra = checkpointData.techInfra;
    } else {
      try {
        await updateProgress(sessionId, 2, 14, 'L1: 기술 인프라(AI Crawler Accessibility) 진단 중...');
        if (await checkPaused(sessionId)) { await saveCheckpoint(sessionId, 1, { quickResult, crawlResult, crawledPages }); return quickResultToAudit(quickResult!, industryInput); }
        techInfra = TechInfraAuditor.audit(crawlResult);
        console.log('[Audit] Step 2 OK: L1 Tech Infra Score =', techInfra.techInfraScore);
        await saveCheckpoint(sessionId, 2, { quickResult, crawlResult, crawledPages, techInfra });
      } catch (e: any) {
        console.warn(`[Audit] Step 2 FAIL (tech-infra): ${e.message}`);
        techInfra = quickResult?.techInfra || {
          robotsBotMatrix: [], aiCrawlerAccessScore: 50, httpsEnabled: false, sslCertValid: false,
          sslCertExpiryDays: 0, ttfbMs: 0, ttfbGrade: 'slow', redirectChainDepth: 0, brokenLinks: [],
          renderingMode: 'ssr', spaDetected: false, sitemapExists: false, sitemapUrlCount: 0,
          sitemapFreshnessScore: 0, llmsTxtExists: false, canonicalConsistency: 0, techInfraScore: 50, issues: []
        };
      }
    }

    // ── Step 3: Schema Quality Audit (L2) ──
    let schemaQuality: SchemaQualityAuditResult;
    try {
      if (await checkPaused(sessionId)) { return quickResultToAudit(quickResult!, industryInput); }
      await updateProgress(sessionId, 3, 14, 'L2: 구조화 시맨틱(Schema & OG metadata) 진단 중...');
      schemaQuality = SchemaQualityAuditor.audit(crawledPages);
      console.log('[Audit] Step 3 OK: L2 Schema Quality Score =', schemaQuality.schemaQualityScore);
      await saveCheckpoint(sessionId, 3, { quickResult, crawlResult, crawledPages, techInfra, schemaQuality });
    } catch (e: any) {
      console.warn(`[Audit] Step 3 FAIL (schema-quality): ${e.message}`);
      schemaQuality = quickResult?.schemaQuality || {
        organizationSchema: null, localBusinessSchema: null, faqPageSchemas: [], howToSchemas: [],
        productSchemas: [], articleSchemas: [], breadcrumbSchemas: [], aggregateRatingSchemas: [], otherSchemas: [],
        orgSameAsProfiles: [], orgLogoPresent: false, orgContactPresent: false,
        ogCompleteness: { hasOgTitle: false, hasOgDescription: false, hasOgImage: false, hasOgType: false, hasOgUrl: false, completenessScore: 0, perPageScores: [] },
        metaTagAudit: { titleOptimization: [], descriptionQuality: [], authorPresent: 0, robotsDirectives: [], canonicalStatus: [] },
        schemaQualityScore: 50, schemaTypeCount: 0, schemaCoverage: 0, issues: []
      };
    }

    // ── Step 4: Extract Entities (LLM) ──
    let allEntities: SurfaceEntity[] = checkpointData.allEntities || [];
    if (resumeFromStep < 4 || allEntities.length === 0) {
      try {
        if (await checkPaused(sessionId)) { return quickResultToAudit(quickResult!, industryInput); }
        const extractor = new LlmEntityExtractor();
        await updateProgress(sessionId, 4, 14, '지식 자산(Entity) 추출 중...');
        allEntities = await extractor.extractBatch(workspaceId, crawledPages.slice(0, 10), websiteUrl);
        hasLlmEntities = allEntities.length > 0;
        console.log(`[Audit] Step 4 OK: extracted ${allEntities.length} entities in batch`);
        await saveCheckpoint(sessionId, 4, { quickResult, crawlResult, crawledPages, techInfra, schemaQuality, allEntities });
      } catch (e: any) {
        console.warn(`[Audit] Step 4 FAIL (LLM extract): ${e.message}. Using quick audit entities.`);
        allEntities = quickResult?.entities || [];
      }
    } else {
      hasLlmEntities = allEntities.length > 0;
    }

    if (allEntities.length === 0 && quickResult) {
      allEntities = quickResult.entities;
    }

    // ── Step 5: Build Knowledge Graph ──
    let kg: any = checkpointData.kg || { entities: allEntities, nodes: [], edges: [], concepts: [] };
    if (resumeFromStep < 5 || !checkpointData.kg) {
      try {
        if (await checkPaused(sessionId)) { return quickResultToAudit(quickResult!, industryInput); }
        const kgBuilder = new KnowledgeGraphBuilder();
        await updateProgress(sessionId, 5, 14, '지식 그래프 구축 중...');
        kg = await kgBuilder.build(workspaceId, websiteUrl, allEntities);
        console.log(`[Audit] Step 5 OK: KG with ${kg.entities.length} entities`);
        await saveCheckpoint(sessionId, 5, { quickResult, crawlResult, crawledPages, techInfra, schemaQuality, allEntities, kg });
      } catch (e: any) {
        console.warn(`[Audit] Step 5 FAIL (KG): ${e.message}. Using flat entities.`);
        kg = { entities: allEntities, nodes: [], edges: [], concepts: [] };
      }
    }

    // ── Step 6: Reverse Answer Cards ──
    let cards: ReversedAnswerCard[] = quickResult?.cards || [];
    let canonicalQuestions: any[] = [];
    let qisScenes: any[] = [];
    try {
      const reverser = new AnswerCardReverser();
      await updateProgress(sessionId, 6, 14, 'AI 앤서카드 역설계 중...');
      const reversedResult = await reverser.reverse(workspaceId, websiteUrl, kg);
      cards = reversedResult.cards;
      canonicalQuestions = reversedResult.canonicalQuestions;
      qisScenes = reversedResult.qisScenes;
      console.log(`[Audit] Step 6 OK: ${cards.length} answer cards`);
    } catch (e: any) {
      console.warn(`[Audit] Step 6 FAIL (cards): ${e.message}. Using quick cards.`);
    }

    // ── Step 7: Generate Probes ──
    let customProbes: any[] = [];
    try {
      const probeGen = new ProbeGenerator();
      await updateProgress(sessionId, 7, 14, '동적 프로빙 시나리오 생성 중...');
      customProbes = await probeGen.generateProbes(cards, brandName, competitors);
      console.log(`[Audit] Step 7 OK: ${customProbes.length} probes`);
    } catch (e: any) {
      console.warn(`[Audit] Step 7 FAIL (probes): ${e.message}. Using fallback probes.`);
    }
    // FIX-3: Probe 실패 시 브랜드명 기반 폴백 프로브 생성
    if (customProbes.length === 0 && brandName) {
      console.log('[Audit] Step 7: Generating fallback probes for:', brandName);
      const fallbackQueries = [
        `${brandName} 추천`, `${brandName} 후기`, `${brandName} 가격`,
        `${brandName} 성분 분석`, `${brandName} 부작용`,
        `${brandName} vs 경쟁사 비교`, `${brandName} 사용법`,
        `${brandName} 효과`, `${brandName} 장단점`, `${brandName} 실제 사용 후기`
      ];
      customProbes = fallbackQueries.map((q, i) => ({
        id: `fallback-probe-${i}`,
        question: q,
        type: i < 3 ? 'brand_query' : (i < 6 ? 'comparison' : 'experience'),
        source: 'fallback_generator',
      }));
    }

    // ── Step 8: QIS Cross Map (업종 자동 감지) ──
    let mappings: any[] = [];
    const detectedIndustry = industryInput || detectIndustry(websiteUrl, kg.entities);
    try {
      if (detectedIndustry !== 'default') {
        const crossMapper = new QisCrossMapper();
        await updateProgress(sessionId, 8, 14, 'QIS 기반 업종 교차 매핑 중...');
        mappings = await crossMapper.crossMap(detectedIndustry, customProbes);
        console.log(`[Audit] Step 8 OK: ${mappings.length} mappings (industry: ${detectedIndustry})`);
      } else {
        console.log(`[Audit] Step 8 SKIP: no matching industry panel for this site.`);
      }
    } catch (e: any) {
      console.warn(`[Audit] Step 8 FAIL (QIS): ${e.message}.`);
    }

    // ── Step 9: Content Semantic Analysis (L3) ──
    let contentSemantic: ContentSemanticResult;
    try {
      await updateProgress(sessionId, 9, 14, 'L3: 콘텐츠 시맨틱(E-E-A-T, Answer-First, Freshness) 분석 중...');
      contentSemantic = ContentSemanticAnalyzer.analyze(crawledPages, techInfra.httpsEnabled, schemaQuality.orgSameAsProfiles.length);
      console.log('[Audit] Step 9 OK: L3 Content Semantic Score =', contentSemantic.contentSemanticScore);
    } catch (e: any) {
      console.warn(`[Audit] Step 9 FAIL (content-semantic): ${e.message}`);
      contentSemantic = quickResult?.contentSemantic || {
        eeat: { experience: 50, expertise: 50, authoritativeness: 50, trustworthiness: 50, overall: 50, signals: [] },
        answerFirstScores: [],
        freshnessAnalysis: { averageAgeDays: 180, freshContentRatio: 0, stalestPage: null, newestPage: null, freshnessScore: 50, perPageFreshness: [] },
        topicClusters: [], quantitativeDataDensity: 0, multimediaAudit: { totalImages: 0, imagesWithAlt: 0, imagesWithoutAlt: 0, altTextQualityScore: 0, videoCount: 0, hasEmbeddedVideo: false, multimediaScore: 0 },
        citationNetwork: { totalOutboundLinks: 0, uniqueExternalDomains: 0, authorityDomainRatio: 0, nofollowRatio: 0, citationQualityScore: 50, topCitedDomains: [] },
        originalityScore: 50,
        internalLinkTopology: { totalInternalLinks: 0, orphanPages: [], hubPages: [], averageLinksPerPage: 0, maxDepth: 0, topologyScore: 50 },
        contentSemanticScore: 50, issues: []
      };
    }

    // ── Step 10: Entity Reflection (AI API calls — most likely to fail) ──
    let snapshot: EntityReflectionSnapshot | null = quickResult?.snapshot || null;
    let reflectionDetails: any[] = [];
    let rawResponses: string[] = [];
    if (customProbes.length > 0) {
      try {
        const refRunner = new EntityReflectionRunner();
        await updateProgress(sessionId, 10, 14, 'AI 엔진 대상 Entity Reflection 실측 중...');
        const reflectionResult = await refRunner.run(
          workspaceId, websiteUrl, kg.entities,
          customProbes.slice(0, 5),
          [new URL(websiteUrl).host],
          'composite',
          competitors
        );
        snapshot = reflectionResult.snapshot;
        reflectionDetails = reflectionResult.reflectionDetails;
        rawResponses = reflectionResult.rawResponses;
        hasReflection = true;
        console.log(`[Audit] Step 10 OK: Reflection metrics captured`);
      } catch (e: any) {
        console.warn(`[Audit] Step 10 FAIL (reflection): ${e.message}. Using quick estimates.`);
      }
    }

    // Override tech_mod_score and eeat_mod_score in snapshot using our new layers
    if (snapshot) {
      snapshot.tech_mod_score = Math.round((techInfra.techInfraScore + schemaQuality.schemaQualityScore) / 2);
      snapshot.eeat_mod_score = contentSemantic.eeat.overall;
    }

    // ── Step 11: AEPI Score ──
    if (snapshot && hasReflection) {
      try {
        await updateProgress(sessionId, 11, 14, '종합 AEPI 가시성 지수 산출 중...');
        const aepi = AepiCalculator.calculate(snapshot, detectedIndustry);
        snapshot.aepi_score = aepi;
        console.log(`[Audit] Step 11 OK: AEPI = ${aepi}`);
      } catch (e: any) {
        console.warn(`[Audit] Step 11 FAIL (AEPI): ${e.message}.`);
      }
    }

    // ── Step 12: Persona (v2.0 or fallback) ──
    let observedPersona: ObservedParametricPersona | null = null;
    let parametricSnapshot: ParametricPersonaSnapshot | null = null;
    let personaSpec: PersonaSpec | null = null;
    try {
      const personaEngineer = new PersonaReverseEngineer();
      if (tier === 'tier1' && rawResponses.length > 0) {
        await updateProgress(sessionId, 12, 14, '브랜드 페르소나 분석 중...');
        observedPersona = await personaEngineer.analyze(
          workspaceId, websiteUrl, brandName, rawResponses
        );
        console.log(`[Audit] Step 12 OK: v1 Persona extracted`);
      } else if (tier !== 'tier1' && tier !== 'free') {
        await updateProgress(sessionId, 12, 14, '파라메트릭 페르소나 N회 반복 측정 중...');
        // FIX-4: 타임아웃 보호 (4분)
        const personaPromise = personaEngineer.runFullPersonaAudit(
          workspaceId, websiteUrl, brandName, detectedIndustry, tier as 'tier1.5' | 'tier2' | 'tier3'
        );
        const timeoutPromise = new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('Persona audit timed out after 240s')), 240_000)
        );
        parametricSnapshot = await Promise.race([personaPromise, timeoutPromise]);
        console.log(`[Audit] Step 12 OK: v2/v3 Parametric Persona Snapshot generated`);
      }
    } catch (e: any) {
      console.warn(`[Audit] Step 12 FAIL (Persona): ${e.message}`);
    }

    // ── Step 13: Gap Analysis ──
    let gaps: SurfaceGapAnalysis[] = quickResult?.gaps || [];
    try {
      if (mappings.length > 0) {
        const gapAnalyzer = new GapAnalyzer();
        await updateProgress(sessionId, 13, 14, '최적화 Gap 분석 및 처방전 발급 중...');
        gaps = await gapAnalyzer.analyze(
          workspaceId, websiteUrl, kg.entities,
          reflectionDetails, mappings,
          techInfra, schemaQuality, contentSemantic
        );
        console.log(`[Audit] Step 13 OK: ${gaps.length} gaps`);
      }
    } catch (e: any) {
      console.warn(`[Audit] Step 13 FAIL (gaps): ${e.message}. Using quick gaps.`);
    }

    // ── Step 14: Temporal Trends ──
    let trends: TemporalTrend[] = [];
    try {
      if (snapshot) {
        const tracker = new TemporalTracker();
        await updateProgress(sessionId, 14, 14, '시계열 트렌드 기록 중...');
        trends = await tracker.getTrends(websiteUrl);
        console.log(`[Audit] Step 14 OK: ${trends.length} temporal trends fetched`);
      }
    } catch (e: any) {
      console.warn(`[Audit] Step 14 FAIL (trends): ${e.message}`);
    }

    const auditMode: AuditResult['auditMode'] = hasReflection
      ? 'measured'
      : hasLlmEntities
        ? 'partial'
        : 'estimated';

    const finalResult: AuditResult = {
      websiteUrl,
      brandName,
      entities: kg.entities,
      cards,
      snapshot,
      observedPersona,
      parametricSnapshot,
      personaSpec,
      gaps,
      trends,
      auditMode,
      industry: detectedIndustry,
      techInfra,
      schemaQuality,
      contentSemantic,
      canonicalQuestions,
      qisScenes
    };

    // Save L1, L2, L3 snapshot tables to Supabase with dynamic fallback
    let tech_infra_snapshot_id: string | undefined;
    let schema_quality_snapshot_id: string | undefined;
    let content_semantic_snapshot_id: string | undefined;

    try {
      const db = getSupabaseAdminClient();
      
      const { data: tData } = await db.from('tech_infra_snapshots').insert({
        workspace_id: workspaceId,
        website_url: websiteUrl,
        audit_session_id: sessionId,
        robots_bot_matrix: techInfra.robotsBotMatrix,
        ai_crawler_access_score: techInfra.aiCrawlerAccessScore,
        https_enabled: techInfra.httpsEnabled,
        ttfb_ms: techInfra.ttfbMs,
        sitemap_url_count: techInfra.sitemapUrlCount,
        llms_txt_exists: techInfra.llmsTxtExists,
        canonical_consistency: techInfra.canonicalConsistency,
        tech_infra_score: techInfra.techInfraScore,
        issues: techInfra.issues,
        measured_at: new Date().toISOString()
      }).select('id').single();
      if (tData) tech_infra_snapshot_id = tData.id;

      const { data: sData } = await db.from('schema_quality_snapshots').insert({
        workspace_id: workspaceId,
        website_url: websiteUrl,
        audit_session_id: sessionId,
        schema_quality_score: schemaQuality.schemaQualityScore,
        schema_type_count: schemaQuality.schemaTypeCount,
        org_schema_present: !!schemaQuality.organizationSchema,
        faq_schema_count: schemaQuality.faqPageSchemas.length,
        og_completeness_score: schemaQuality.ogCompleteness.completenessScore,
        issues: schemaQuality.issues,
        measured_at: new Date().toISOString()
      }).select('id').single();
      if (sData) schema_quality_snapshot_id = sData.id;

      const { data: cData } = await db.from('content_semantic_snapshots').insert({
        workspace_id: workspaceId,
        website_url: websiteUrl,
        audit_session_id: sessionId,
        eeat_experience: contentSemantic.eeat.experience,
        eeat_expertise: contentSemantic.eeat.expertise,
        eeat_authoritativeness: contentSemantic.eeat.authoritativeness,
        eeat_trustworthiness: contentSemantic.eeat.trustworthiness,
        answer_first_avg_score: contentSemantic.answerFirstScores.length > 0 ? Math.round(contentSemantic.answerFirstScores.reduce((sum, item) => sum + item.directAnswerScore, 0) / contentSemantic.answerFirstScores.length) : 0,
        freshness_score: contentSemantic.freshnessAnalysis.freshnessScore,
        content_semantic_score: contentSemantic.contentSemanticScore,
        issues: contentSemantic.issues,
        measured_at: new Date().toISOString()
      }).select('id').single();
      if (cData) content_semantic_snapshot_id = cData.id;

    } catch (dbErr) {
      console.warn('[Audit Action] Could not insert L1/L2/L3 snapshots to DB. Table columns might be missing:', dbErr);
    }

    try {
      const db = getSupabaseAdminClient();
      await db.from('audit_sessions').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        result_data: finalResult,
        ...(tech_infra_snapshot_id ? { tech_infra_snapshot_id } : {}),
        ...(schema_quality_snapshot_id ? { schema_quality_snapshot_id } : {}),
        ...(content_semantic_snapshot_id ? { content_semantic_snapshot_id } : {})
      }).eq('id', sessionId);
    } catch (e) {
      console.error("Failed to save full audit session:", e);
    }

    return finalResult;
  } catch (e: any) {
    console.error(`[Audit Action] Full audit failed: ${e.message}. Returning quick audit.`);
    if (quickResult) {
      return quickResultToAudit(quickResult, industryInput);
    }
    return {
      websiteUrl, brandName,
      entities: [], cards: [],
      snapshot: null, observedPersona: null, parametricSnapshot: null, personaSpec: null,
      gaps: [], trends: [], auditMode: 'estimated'
    };
  }
}

/** Convert QuickAuditResult to AuditResult */
function quickResultToAudit(q: QuickAuditResult, industry?: string): AuditResult {
  return {
    websiteUrl: q.websiteUrl,
    brandName: q.brandName,
    entities: q.entities,
    cards: q.cards,
    snapshot: q.snapshot,
    observedPersona: null,
    parametricSnapshot: null,
    personaSpec: null,
    gaps: q.gaps,
    trends: [],
    auditMode: q.auditMode,
    techInfra: q.techInfra,
    schemaQuality: q.schemaQuality,
    contentSemantic: q.contentSemantic
  };
}
