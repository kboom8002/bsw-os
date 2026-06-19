"use server";

import { WebsiteCrawler } from "../../lib/surface/website-crawler";
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
import {
  SurfaceEntity, ReversedAnswerCard,
  EntityReflectionSnapshot, ObservedParametricPersona,
  PersonaSpec, SurfaceGapAnalysis
} from "../../lib/schema";
import { ParametricPersonaSnapshot } from "../../lib/persona/parametric-persona-snapshot";
import { getSupabaseAdminClient } from "../../lib/supabase";

export interface AuditResult {
  websiteUrl: string;
  brandName: string;
  entities: SurfaceEntity[];
  cards: ReversedAnswerCard[];
  snapshot: EntityReflectionSnapshot | null;
  observedPersona: ObservedParametricPersona | null;
  parametricSnapshot: ParametricPersonaSnapshot | null;
  personaSpec: PersonaSpec | null;
  gaps: SurfaceGapAnalysis[];
  trends: TemporalTrend[];
  auditMode: 'estimated' | 'measured' | 'partial';
  sessionId?: string;
  industry?: string;
}

/**
 * 크롤링된 엔티티와 URL 기반 업종 자동 감지
 */
function detectIndustry(websiteUrl: string, entities: SurfaceEntity[]): string {
  const allText = [
    websiteUrl.toLowerCase(),
    ...entities.map(e => `${e.entity_name} ${JSON.stringify(e.entity_content)}`)
  ].join(' ').toLowerCase();

  const INDUSTRY_KEYWORDS: Record<string, string[]> = {
    wedding_studio: ['웨딩', '스튜디오', '촬영', '포토', '스냅', '결혼', 'wedding', 'studio', 'photo', 'bridal', '드레스'],
    skincare: ['스킨케어', '화장품', '뷰티', '코스메틱', '피부', '세럼', '크림', 'skincare', 'cosmetic', 'beauty', 'serum', '클렌저'],
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

/**
 * Quick Audit: HTML 크롤링만으로 즉시 추정 (AI API 호출 없음, ~5초)
 */

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

export async function runQuickSiteAudit(
  workspaceId: string,
  websiteUrl: string,
  brandName: string,
  industry?: string
): Promise<AuditResult> {
  const analyzer = new QuickSiteAnalyzer();
  const result = await analyzer.analyze(workspaceId, websiteUrl, brandName);

  const finalResult = {
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
    industry
  };

  try {
    const db = getSupabaseAdminClient();
    const { data } = await db.from('audit_sessions').insert({
      workspace_id: workspaceId,
      brand_name: result.brandName,
      website_url: result.websiteUrl,
      industry: industry || 'default',
      tier: 'free',
      status: 'completed',
      result_data: finalResult
    }).select('id').single();
    if (data) (finalResult as any).sessionId = data.id;
  } catch (e) {
    console.error("Failed to save quick audit session:", e);
  }

  return finalResult as AuditResult;
}

/**
 * Full Audit: 10단계 파이프라인, 내결함성 적용.
 * 각 단계 실패 시 Quick Audit 추정값으로 폴백 (0 반환 방지)
 */

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
    progress: { current_step: 0, total_steps: 11, message: '진단 대기 중...' }
  }).select('id').single();

  if (error || !data) {
    throw new Error('Failed to create audit session: ' + error?.message);
  }

  const sessionId = data.id;

  // Run in background (fire and forget)
  runFullSiteAuditBackground(sessionId, workspaceId, websiteUrl, brandName, competitors, tier, industryInput)
    .catch(err => {
      console.error(`Background audit ${sessionId} failed:`, err);
      db.from('audit_sessions').update({ status: 'failed', progress: { message: '진단 실패: ' + err.message } }).eq('id', sessionId);
    });

  return sessionId;
}

async function runFullSiteAuditBackground(sessionId: string, 
  workspaceId: string,
  websiteUrl: string,
  brandName: string,
  competitors: string[] = [],
  tier: 'free' | 'tier1' | 'tier1.5' | 'tier2' | 'tier3' = 'tier3',
  industryInput?: string
): Promise<AuditResult> {
  console.log(`[Audit Action] Beginning full site audit for ${brandName} (${websiteUrl}), tier: ${tier}`);

  // Quick audit as baseline (always available as fallback)
  let quickResult: QuickAuditResult | null = null;
  try {
    await updateProgress(sessionId, 0, 11, '빠른 진단 기준으로 초기 추정 중...');
  const analyzer = new QuickSiteAnalyzer();
    quickResult = await analyzer.analyze(workspaceId, websiteUrl, brandName);
  } catch (e: any) {
    console.warn(`[Audit Action] Quick audit baseline failed: ${e.message}`);
  }

  // Track what succeeded for auditMode
  let hasLlmEntities = false;
  let hasReflection = false;

  try {
    // ── Step 1: Crawl Website ──
    let crawledPages: any[] = [];
    try {
      const crawler = new WebsiteCrawler();
      await updateProgress(sessionId, 1, 11, '웹사이트 구조 크롤링 중...');
      crawledPages = await crawler.crawl(websiteUrl, 10);
      console.log(`[Audit] Step 1 OK: crawled ${crawledPages.length} pages`);
    } catch (e: any) {
      console.warn(`[Audit] Step 1 FAIL (crawl): ${e.message}. Using quick audit entities.`);
      if (quickResult) {
        return { ...quickResultToAudit(quickResult, industryInput), auditMode: 'estimated' };
      }
      throw e;
    }

    // ── Step 2: Extract Entities (LLM) ──
    let allEntities: SurfaceEntity[] = [];
    try {
      const extractor = new LlmEntityExtractor();
      await updateProgress(sessionId, 2, 11, '지식 자산(Entity) 추출 중...');
      allEntities = await extractor.extractBatch(workspaceId, crawledPages.slice(0, 5), websiteUrl);
      hasLlmEntities = allEntities.length > 0;
      console.log(`[Audit] Step 2 OK: extracted ${allEntities.length} entities in batch`);
    } catch (e: any) {
      console.warn(`[Audit] Step 2 FAIL (LLM extract): ${e.message}. Using quick audit entities.`);
      allEntities = quickResult?.entities || [];
    }

    // If LLM extraction produced nothing, use quick audit entities
    if (allEntities.length === 0 && quickResult) {
      allEntities = quickResult.entities;
    }

    // ── Step 3: Build Knowledge Graph ──
    let kg: any = { entities: allEntities, nodes: [], edges: [], concepts: [] };
    try {
      const kgBuilder = new KnowledgeGraphBuilder();
      await updateProgress(sessionId, 3, 11, '지식 그래프 구축 중...');
      kg = await kgBuilder.build(workspaceId, websiteUrl, allEntities);
      console.log(`[Audit] Step 3 OK: KG with ${kg.entities.length} entities`);
    } catch (e: any) {
      console.warn(`[Audit] Step 3 FAIL (KG): ${e.message}. Using flat entities.`);
      kg = { entities: allEntities, nodes: [], edges: [], concepts: [] };
    }

    // ── Step 4: Reverse Answer Cards ──
    let cards: ReversedAnswerCard[] = quickResult?.cards || [];
    try {
      const reverser = new AnswerCardReverser();
      await updateProgress(sessionId, 4, 11, 'AI 앤서카드 역설계 중...');
      const reversedResult = await reverser.reverse(workspaceId, websiteUrl, kg);
      cards = reversedResult.cards;
      console.log(`[Audit] Step 4 OK: ${cards.length} answer cards`);
    } catch (e: any) {
      console.warn(`[Audit] Step 4 FAIL (cards): ${e.message}. Using quick cards.`);
    }

    // ── Step 5: Generate Probes ──
    let customProbes: any[] = [];
    try {
      const probeGen = new ProbeGenerator();
      await updateProgress(sessionId, 5, 11, '동적 프로빙 시나리오 생성 중...');
      customProbes = await probeGen.generateProbes(cards, brandName, competitors);
      console.log(`[Audit] Step 5 OK: ${customProbes.length} probes`);
    } catch (e: any) {
      console.warn(`[Audit] Step 5 FAIL (probes): ${e.message}. Skipping reflection.`);
    }

    // ── Step 6: QIS Cross Map (업종 자동 감지) ──
    let mappings: any[] = [];
    const detectedIndustry = industryInput || detectIndustry(websiteUrl, kg.entities);
    try {
      if (detectedIndustry !== 'default') {
        const crossMapper = new QisCrossMapper();
        await updateProgress(sessionId, 6, 11, 'QIS 기반 업종 교차 매핑 중...');
        mappings = await crossMapper.crossMap(detectedIndustry, customProbes);
        console.log(`[Audit] Step 6 OK: ${mappings.length} mappings (industry: ${detectedIndustry})`);
      } else {
        console.log(`[Audit] Step 6 SKIP: no matching industry panel for this site.`);
      }
    } catch (e: any) {
      console.warn(`[Audit] Step 6 FAIL (QIS): ${e.message}.`);
    }

    // ── Step 7: Entity Reflection (AI API calls — most likely to fail) ──
    let snapshot: EntityReflectionSnapshot | null = quickResult?.snapshot || null;
    let reflectionDetails: any[] = [];
    let rawResponses: string[] = [];
    if (customProbes.length > 0) {
      try {
        const refRunner = new EntityReflectionRunner();
        await updateProgress(sessionId, 7, 11, 'AI 엔진 대상 Entity Reflection 실측 중...');
        const reflectionResult = await refRunner.run(
          workspaceId, websiteUrl, kg.entities,
          customProbes.slice(0, 5), // limit to 5 probes for speed
          [new URL(websiteUrl).host]
        );
        snapshot = reflectionResult.snapshot;
        reflectionDetails = reflectionResult.reflectionDetails;
        rawResponses = reflectionResult.rawResponses;
        hasReflection = true;
        console.log(`[Audit] Step 7 OK: Reflection metrics captured`);
      } catch (e: any) {
        console.warn(`[Audit] Step 7 FAIL (reflection): ${e.message}. Using quick estimates.`);
        // Keep quickResult.snapshot as fallback (NOT zeros)
      }
    }

    // ── Step 8: AEPI Score ──
    if (snapshot && hasReflection) {
      try {
        await updateProgress(sessionId, 8, 11, '종합 AEPI 가시성 지수 산출 중...');
        const aepi = AepiCalculator.calculate(snapshot, detectedIndustry);
        snapshot.aepi_score = aepi;
        console.log(`[Audit] Step 8 OK: AEPI = ${aepi}`);
      } catch (e: any) {
        console.warn(`[Audit] Step 8 FAIL (AEPI): ${e.message}.`);
      }
    }

    // ── Step 9: Persona (v2.0 or fallback) ──
    let observedPersona: ObservedParametricPersona | null = null;
    let parametricSnapshot: ParametricPersonaSnapshot | null = null;
    let personaSpec: PersonaSpec | null = null;
    try {
      const personaEngineer = new PersonaReverseEngineer();
      if (tier === 'tier1' && rawResponses.length > 0) {
        await updateProgress(sessionId, 9, 11, '브랜드 페르소나 분석 중...');
        observedPersona = await personaEngineer.analyze(
          workspaceId, websiteUrl, brandName, rawResponses
        );
        console.log(`[Audit] Step 9 OK: v1 Persona extracted`);
      } else if (tier !== 'tier1') {
        await updateProgress(sessionId, 9, 11, '파라메트릭 페르소나 N회 반복 측정 중...');
        parametricSnapshot = await personaEngineer.runFullPersonaAudit(
          workspaceId, websiteUrl, brandName, detectedIndustry, tier as 'free' | 'tier1.5' | 'tier2' | 'tier3'
        );
        console.log(`[Audit] Step 9 OK: v2/v3 Parametric Persona Snapshot generated`);
      }
    } catch (e: any) {
      console.warn(`[Audit] Step 9 FAIL (Persona): ${e.message}`);
    }

    // ── Step 10: Gap Analysis ──
    let gaps: SurfaceGapAnalysis[] = quickResult?.gaps || [];
    try {
      if (mappings.length > 0) {
        const gapAnalyzer = new GapAnalyzer();
        await updateProgress(sessionId, 10, 11, '최적화 Gap 분석 및 처방전 발급 중...');
        gaps = await gapAnalyzer.analyze(
          workspaceId, websiteUrl, kg.entities,
          reflectionDetails, mappings
        );
        console.log(`[Audit] Step 10 OK: ${gaps.length} gaps`);
      }
    } catch (e: any) {
      console.warn(`[Audit] Step 10 FAIL (gaps): ${e.message}. Using quick gaps.`);
    }

    // ── Step 11: Temporal Trends ──
    let trends: TemporalTrend[] = [];
    try {
      if (snapshot) {
        const tracker = new TemporalTracker();
        await updateProgress(sessionId, 11, 11, '시계열 트렌드 기록 중...');
        trends = await tracker.getTrends(websiteUrl, snapshot);
        console.log(`[Audit] Step 11 OK: ${trends.length} temporal trends fetched`);
      }
    } catch (e: any) {
      console.warn(`[Audit] Step 11 FAIL (trends): ${e.message}`);
    }

    // Determine audit mode
    const auditMode: AuditResult['auditMode'] = hasReflection
      ? 'measured'
      : hasLlmEntities
        ? 'partial'
        : 'estimated';

    const finalResult = {
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
      industry: detectedIndustry
    };

    try {
      const db = getSupabaseAdminClient();
      await db.from('audit_sessions').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        result_data: finalResult
      }).eq('id', sessionId);
    } catch (e) {
      console.error("Failed to save full audit session:", e);
    }

    return finalResult as AuditResult;
  } catch (e: any) {
    console.error(`[Audit Action] Full audit failed: ${e.message}. Returning quick audit.`);
    if (quickResult) {
      return quickResultToAudit(quickResult, industryInput);
    }
    // Ultimate fallback
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
    auditMode: q.auditMode
  };
}
