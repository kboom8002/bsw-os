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
import { QuickSiteAnalyzer, QuickAuditResult } from "../../lib/surface/quick-site-analyzer";
import {
  SurfaceEntity, ReversedAnswerCard,
  EntityReflectionSnapshot, ObservedParametricPersona,
  PersonaSpec, SurfaceGapAnalysis
} from "../../lib/schema";

export interface AuditResult {
  websiteUrl: string;
  brandName: string;
  entities: SurfaceEntity[];
  cards: ReversedAnswerCard[];
  snapshot: EntityReflectionSnapshot | null;
  observedPersona: ObservedParametricPersona | null;
  personaSpec: PersonaSpec | null;
  gaps: SurfaceGapAnalysis[];
  auditMode: 'estimated' | 'measured' | 'partial';
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
export async function runQuickSiteAudit(
  workspaceId: string,
  websiteUrl: string,
  brandName: string
): Promise<AuditResult> {
  const analyzer = new QuickSiteAnalyzer();
  const result = await analyzer.analyze(workspaceId, websiteUrl, brandName);

  return {
    websiteUrl: result.websiteUrl,
    brandName: result.brandName,
    entities: result.entities,
    cards: result.cards,
    snapshot: result.snapshot,
    observedPersona: null,
    personaSpec: null,
    gaps: result.gaps,
    auditMode: result.auditMode
  };
}

/**
 * Full Audit: 10단계 파이프라인, 내결함성 적용.
 * 각 단계 실패 시 Quick Audit 추정값으로 폴백 (0 반환 방지)
 */
export async function runFullSiteAudit(
  workspaceId: string,
  websiteUrl: string,
  brandName: string,
  competitors: string[] = []
): Promise<AuditResult> {
  console.log(`[Audit Action] Beginning full site audit for ${brandName} (${websiteUrl})`);

  // Quick audit as baseline (always available as fallback)
  let quickResult: QuickAuditResult | null = null;
  try {
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
      crawledPages = await crawler.crawl(websiteUrl, 10);
      console.log(`[Audit] Step 1 OK: crawled ${crawledPages.length} pages`);
    } catch (e: any) {
      console.warn(`[Audit] Step 1 FAIL (crawl): ${e.message}. Using quick audit entities.`);
      if (quickResult) {
        return { ...quickResultToAudit(quickResult), auditMode: 'estimated' };
      }
      throw e;
    }

    // ── Step 2: Extract Entities (LLM) ──
    let allEntities: SurfaceEntity[] = [];
    try {
      const extractor = new LlmEntityExtractor();
      for (const page of crawledPages.slice(0, 5)) { // limit to 5 pages for speed
        const pageEnts = await extractor.extract(workspaceId, page, websiteUrl);
        allEntities.push(...pageEnts);
      }
      hasLlmEntities = allEntities.length > 0;
      console.log(`[Audit] Step 2 OK: extracted ${allEntities.length} entities`);
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
      customProbes = await probeGen.generateProbes(cards, brandName, competitors);
      console.log(`[Audit] Step 5 OK: ${customProbes.length} probes`);
    } catch (e: any) {
      console.warn(`[Audit] Step 5 FAIL (probes): ${e.message}. Skipping reflection.`);
    }

    // ── Step 6: QIS Cross Map (업종 자동 감지) ──
    let mappings: any[] = [];
    const detectedIndustry = detectIndustry(websiteUrl, kg.entities);
    try {
      if (detectedIndustry !== 'default') {
        const crossMapper = new QisCrossMapper();
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
    let reflectedEntityIds: string[] = [];
    if (customProbes.length > 0) {
      try {
        const refRunner = new EntityReflectionRunner();
        const reflectionResult = await refRunner.run(
          workspaceId, websiteUrl, kg.entities,
          customProbes.slice(0, 5), // limit to 5 probes for speed
          [new URL(websiteUrl).host]
        );
        snapshot = reflectionResult.snapshot;
        reflectedEntityIds = reflectionResult.reflectedEntityIds;
        hasReflection = true;
        console.log(`[Audit] Step 7 OK: ${reflectedEntityIds.length}/${kg.entities.length} reflected`);
      } catch (e: any) {
        console.warn(`[Audit] Step 7 FAIL (reflection): ${e.message}. Using quick estimates.`);
        // Keep quickResult.snapshot as fallback (NOT zeros)
      }
    }

    // ── Step 8: AEPI Score ──
    if (snapshot && hasReflection) {
      try {
        const aepi = AepiCalculator.calculate(snapshot, detectedIndustry);
        snapshot.aepi_score = aepi;
        console.log(`[Audit] Step 8 OK: AEPI = ${aepi}`);
      } catch (e: any) {
        console.warn(`[Audit] Step 8 FAIL (AEPI): ${e.message}.`);
      }
    }

    // ── Step 9: Persona (optional, graceful skip) ──
    let observedPersona: ObservedParametricPersona | null = null;
    let personaSpec: PersonaSpec | null = null;
    // Skip persona reverse engineering for now — it's non-essential

    // ── Step 10: Gap Analysis ──
    let gaps: SurfaceGapAnalysis[] = quickResult?.gaps || [];
    try {
      if (mappings.length > 0) {
        const gapAnalyzer = new GapAnalyzer();
        gaps = await gapAnalyzer.analyze(
          workspaceId, websiteUrl, kg.entities,
          reflectedEntityIds, mappings
        );
        console.log(`[Audit] Step 10 OK: ${gaps.length} gaps`);
      }
    } catch (e: any) {
      console.warn(`[Audit] Step 10 FAIL (gaps): ${e.message}. Using quick gaps.`);
    }

    // Determine audit mode
    const auditMode: AuditResult['auditMode'] = hasReflection
      ? 'measured'
      : hasLlmEntities
        ? 'partial'
        : 'estimated';

    return {
      websiteUrl,
      brandName,
      entities: kg.entities,
      cards,
      snapshot,
      observedPersona,
      personaSpec,
      gaps,
      auditMode
    };
  } catch (e: any) {
    console.error(`[Audit Action] Full audit failed: ${e.message}. Returning quick audit.`);
    if (quickResult) {
      return quickResultToAudit(quickResult);
    }
    // Ultimate fallback
    return {
      websiteUrl, brandName,
      entities: [], cards: [],
      snapshot: null, observedPersona: null, personaSpec: null,
      gaps: [], auditMode: 'estimated'
    };
  }
}

/** Convert QuickAuditResult to AuditResult */
function quickResultToAudit(q: QuickAuditResult): AuditResult {
  return {
    websiteUrl: q.websiteUrl,
    brandName: q.brandName,
    entities: q.entities,
    cards: q.cards,
    snapshot: q.snapshot,
    observedPersona: null,
    personaSpec: null,
    gaps: q.gaps,
    auditMode: q.auditMode
  };
}
