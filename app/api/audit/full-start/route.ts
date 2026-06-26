import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "../../../../lib/supabase";
import { WebsiteCrawler } from "../../../../lib/surface/website-crawler";
import { LlmEntityExtractor } from "../../../../lib/surface/llm-entity-extractor";
import { KnowledgeGraphBuilder } from "../../../../lib/surface/knowledge-graph-builder";
import { AnswerCardReverser } from "../../../../lib/surface/answer-card-reverser";
import { ProbeGenerator } from "../../../../lib/surface/probe-generator";
import { QisCrossMapper } from "../../../../lib/surface/qis-cross-mapper";
import { EntityReflectionRunner } from "../../../../lib/benchmark/entity-reflection-runner";
import { AepiCalculator } from "../../../../lib/benchmark/aepi-calculator";
import { PersonaReverseEngineer } from "../../../../lib/surface/persona-reverse-engineer";
import { GapAnalyzer } from "../../../../lib/benchmark/gap-analyzer";
import { TemporalTracker } from "../../../../lib/benchmark/temporal-tracker";
import { QuickSiteAnalyzer } from "../../../../lib/surface/quick-site-analyzer";
import { TechInfraAuditor } from "../../../../lib/surface/tech-infra-auditor";
import { SchemaQualityAuditor } from "../../../../lib/surface/schema-quality-auditor";
import { ContentSemanticAnalyzer } from "../../../../lib/surface/content-semantic-analyzer";
import { RelativePositioner } from "../../../../lib/industry/relative-positioner";
import { StrategyGenerator } from "../../../../lib/industry/strategy-generator";
import { getBenchmarkProfile, getIndustryBlueprint } from "../../../actions/industry-benchmark";

// Vercel Pro: 최대 800초
export const maxDuration = 800;

function detectIndustry(websiteUrl: string, entities: any[]): string {
  const allText = [websiteUrl.toLowerCase(), ...entities.map(e => `${e.entity_name} ${JSON.stringify(e.entity_content)}`)].join(' ').toLowerCase();
  const KEYWORDS: Record<string, string[]> = {
    skincare: ['스킨케어','화장품','뷰티','코스메틱','피부','세럼','크림','skincare','cosmetic','beauty','serum'],
    wedding_studio: ['웨딩','스튜디오','촬영','포토','스냅','결혼','wedding','studio','photo','bridal'],
    beauty: ['메이크업','헤어','살롱','네일','makeup','salon','nail','hair'],
    clinic: ['병원','클리닉','의원','진료','치료','clinic','hospital','medical','피부과','성형'],
    restaurant: ['레스토랑','음식점','맛집','카페','배달','restaurant','cafe','dining'],
    fashion_ecommerce: ['패션','의류','쇼핑몰','옷','fashion','clothing','apparel','ecommerce'],
    it_software: ['소프트웨어','앱','SaaS','개발','software','app','tech','platform'],
    food_beverage: ['식품','음료','건강식품','식자재','food','beverage','nutrition'],
    education: ['학원','교육','강의','수업','튜터','education','academy','tutor','course'],
    travel: ['여행','투어','호텔','숙소','관광','travel','tour','hotel','tourism'],
  };
  let bestMatch = 'default'; let bestScore = 0;
  for (const [ind, kws] of Object.entries(KEYWORDS)) {
    const s = kws.filter(k => allText.includes(k)).length;
    if (s > bestScore) { bestScore = s; bestMatch = ind; }
  }
  return bestScore >= 2 ? bestMatch : 'default';
}

async function upd(db: any, sid: string, step: number, msg: string) {
  await db.from("audit_sessions").update({
    progress: { current_step: step, total_steps: 14, message: msg, updated_at: new Date().toISOString() },
    last_checkpoint_step: step
  }).eq("id", sid);
}

async function isPaused(db: any, sid: string): Promise<boolean> {
  const { data } = await db.from("audit_sessions").select("status").eq("id", sid).single();
  return data?.status === "paused";
}

export async function POST(request: Request) {
  const db = getSupabaseAdminClient();
  try {
    const body = await request.json();
    const { websiteUrl, brandName, competitors = [], tier = "tier2", industry, workspaceId } = body;
    if (!websiteUrl || !brandName) return NextResponse.json({ error: "Missing websiteUrl or brandName" }, { status: 400 });
    const wid = workspaceId || "c2498c4f-aee3-49e0-bb80-171a0852128f";

    const { data: sd, error: se } = await db.from("audit_sessions").insert({
      workspace_id: wid, brand_name: brandName, website_url: websiteUrl,
      industry: industry || "default", tier, status: "running",
      progress: { current_step: 0, total_steps: 14, message: "진단 준비 중..." }
    }).select("id").single();
    if (se || !sd) throw new Error("Session create failed: " + se?.message);
    const sessionId = sd.id;

    try {
      // Step 0: Quick Baseline
      await upd(db, sessionId, 0, "빠른 기준 추정 중...");
      let quickResult: any = null;
      try { quickResult = await new QuickSiteAnalyzer().analyze(wid, websiteUrl, brandName); }
      catch(e: any) { console.warn("[S0]", e.message); }

      if (await isPaused(db, sessionId)) return NextResponse.json({ sessionId });

      // Step 1: Crawl
      await upd(db, sessionId, 1, "웹사이트 구조 크롤링 중...");
      let crawlResult: any = null;
      let crawledPages: any[] = [];
      try {
        crawlResult = await new WebsiteCrawler().crawl(websiteUrl, 20);
        crawledPages = crawlResult.pages || [];
      } catch(e: any) {
        console.warn("[S1]", e.message);
        if (quickResult) {
          await db.from("audit_sessions").update({ status: "completed", result_data: quickResult }).eq("id", sessionId);
          return NextResponse.json({ sessionId });
        }
        throw e;
      }

      if (await isPaused(db, sessionId)) return NextResponse.json({ sessionId });

      // Step 2: L1 Tech Infra
      await upd(db, sessionId, 2, "L1: 기술 인프라(AI Crawler Accessibility) 진단 중...");
      let techInfra: any = quickResult?.techInfra ?? {
        robotsBotMatrix: [], aiCrawlerAccessScore: 50, httpsEnabled: false, sslCertValid: false,
        sslCertExpiryDays: 0, ttfbMs: 0, ttfbGrade: "slow", redirectChainDepth: 0, brokenLinks: [],
        renderingMode: "ssr", spaDetected: false, sitemapExists: false, sitemapUrlCount: 0,
        sitemapFreshnessScore: 0, llmsTxtExists: false, canonicalConsistency: 0, techInfraScore: 50, issues: []
      };
      try { techInfra = TechInfraAuditor.audit(crawlResult); }
      catch(e: any) { console.warn("[S2]", e.message); }

      if (await isPaused(db, sessionId)) return NextResponse.json({ sessionId });

      // Step 3: L2 Schema Quality
      await upd(db, sessionId, 3, "L2: 구조화 시맨틱(Schema & OG metadata) 진단 중...");
      let schemaQuality: any = quickResult?.schemaQuality ?? {
        organizationSchema: null, localBusinessSchema: null, faqPageSchemas: [], howToSchemas: [],
        productSchemas: [], articleSchemas: [], breadcrumbSchemas: [], aggregateRatingSchemas: [], otherSchemas: [],
        orgSameAsProfiles: [], orgLogoPresent: false, orgContactPresent: false,
        ogCompleteness: { hasOgTitle: false, hasOgDescription: false, hasOgImage: false, hasOgType: false, hasOgUrl: false, completenessScore: 0, perPageScores: [] },
        metaTagAudit: { titleOptimization: [], descriptionQuality: [], authorPresent: 0, robotsDirectives: [], canonicalStatus: [] },
        schemaQualityScore: 50, schemaTypeCount: 0, schemaCoverage: 0, issues: []
      };
      try { schemaQuality = SchemaQualityAuditor.audit(crawledPages); }
      catch(e: any) { console.warn("[S3]", e.message); }

      if (await isPaused(db, sessionId)) return NextResponse.json({ sessionId });

      // Step 4: LLM Entity Extraction
      await upd(db, sessionId, 4, "지식 자산(Entity) 추출 중...");
      let allEntities: any[] = quickResult?.entities || [];
      let hasLlmEntities = false;
      if (tier !== "free") {
        try {
          const extracted = await new LlmEntityExtractor().extractBatch(wid, crawledPages.slice(0, 10), websiteUrl);
          if (extracted.length > 0) { allEntities = extracted; hasLlmEntities = true; }
        } catch(e: any) { console.warn("[S4]", e.message); }
      }
      if (allEntities.length === 0 && quickResult?.entities?.length > 0) allEntities = quickResult.entities;

      if (await isPaused(db, sessionId)) return NextResponse.json({ sessionId });

      // Step 5: Knowledge Graph
      await upd(db, sessionId, 5, "지식 그래프 구축 중...");
      let kg: any = { entities: allEntities, nodes: [], edges: [], concepts: [] };
      try { kg = await new KnowledgeGraphBuilder().build(wid, websiteUrl, allEntities); }
      catch(e: any) { console.warn("[S5]", e.message); }

      if (await isPaused(db, sessionId)) return NextResponse.json({ sessionId });

      // Step 6: Answer Cards
      await upd(db, sessionId, 6, "AI 앤서카드 역설계 중...");
      let cards: any[] = quickResult?.cards || [];
      try {
        const reversed = await new AnswerCardReverser().reverse(wid, websiteUrl, kg);
        if (reversed.cards?.length > 0) cards = reversed.cards;
      } catch(e: any) { console.warn("[S6]", e.message); }

      if (await isPaused(db, sessionId)) return NextResponse.json({ sessionId });

      // Step 7: Probes
      await upd(db, sessionId, 7, "동적 프로빙 시나리오 생성 중...");
      let customProbes: any[] = [];
      try { customProbes = await new ProbeGenerator().generateProbes(cards, brandName, competitors); }
      catch(e: any) { console.warn("[S7]", e.message); }

      if (await isPaused(db, sessionId)) return NextResponse.json({ sessionId });

      // Step 8: QIS Cross Map
      await upd(db, sessionId, 8, "QIS 기반 업종 교차 매핑 중...");
      let mappings: any[] = [];
      const detectedIndustry = industry || detectIndustry(websiteUrl, kg.entities);
      try {
        if (detectedIndustry !== "default") {
          mappings = await new QisCrossMapper().crossMap(detectedIndustry, customProbes);
        }
      } catch(e: any) { console.warn("[S8]", e.message); }

      if (await isPaused(db, sessionId)) return NextResponse.json({ sessionId });

      // Step 9: L3 Content Semantic
      await upd(db, sessionId, 9, "L3: 콘텐츠 시맨틱(E-E-A-T, Answer-First, Freshness) 분석 중...");
      let contentSemantic: any = quickResult?.contentSemantic ?? {
        eeat: { experience: 50, expertise: 50, authoritativeness: 50, trustworthiness: 50, overall: 50, signals: [] },
        answerFirstScores: [], freshnessAnalysis: { averageAgeDays: 180, freshContentRatio: 0, stalestPage: null, newestPage: null, freshnessScore: 50, perPageFreshness: [] },
        topicClusters: [], quantitativeDataDensity: 0, multimediaAudit: { totalImages: 0, imagesWithAlt: 0, imagesWithoutAlt: 0, altTextQualityScore: 0, videoCount: 0, hasEmbeddedVideo: false, multimediaScore: 0 },
        citationNetwork: { totalOutboundLinks: 0, uniqueExternalDomains: 0, authorityDomainRatio: 0, nofollowRatio: 0, citationQualityScore: 50, topCitedDomains: [] },
        originalityScore: 50, internalLinkTopology: { totalInternalLinks: 0, orphanPages: [], hubPages: [], averageLinksPerPage: 0, maxDepth: 0, topologyScore: 50 },
        contentSemanticScore: 50, issues: []
      };
      try { contentSemantic = ContentSemanticAnalyzer.analyze(crawledPages, techInfra.httpsEnabled, schemaQuality.orgSameAsProfiles.length); }
      catch(e: any) { console.warn("[S9]", e.message); }

      if (await isPaused(db, sessionId)) return NextResponse.json({ sessionId });

      // Step 10: Entity Reflection
      await upd(db, sessionId, 10, "AI 엔진 대상 Entity Reflection 실측 중...");
      let snapshot: any = quickResult?.snapshot || null;
      let reflectionDetails: any[] = [];
      let rawResponses: string[] = [];
      let hasReflection = false;
      if (customProbes.length > 0) {
        try {
          const refResult = await new EntityReflectionRunner().run(
            wid, websiteUrl, kg.entities,
            customProbes.slice(0, 5),
            [new URL(websiteUrl).host],
            "composite",
            competitors
          );
          snapshot = refResult.snapshot;
          reflectionDetails = refResult.reflectionDetails;
          rawResponses = refResult.rawResponses;
          hasReflection = true;
        } catch(e: any) { console.warn("[S10]", e.message); }
      }
      if (snapshot) {
        snapshot.tech_mod_score = Math.round((techInfra.techInfraScore + schemaQuality.schemaQualityScore) / 2);
        snapshot.eeat_mod_score = contentSemantic.eeat.overall;
      }

      // Step 11: AEPI Score
      await upd(db, sessionId, 11, "종합 AEPI 가시성 지수 산출 중...");
      if (snapshot && hasReflection) {
        try {
          const aepi = AepiCalculator.calculate(snapshot, detectedIndustry);
          snapshot.aepi_score = aepi;
        } catch(e: any) { console.warn("[S11]", e.message); }
      }

      if (await isPaused(db, sessionId)) return NextResponse.json({ sessionId });

      // Step 12: Persona
      await upd(db, sessionId, 12, "브랜드 페르소나 역설계 중...");
      let observedPersona: any = null;
      let parametricSnapshot: any = null;
      let personaSpec: any = null;
      try {
        const pe = new PersonaReverseEngineer();
        if (tier === "tier1" && rawResponses.length > 0) {
          observedPersona = await pe.analyze(wid, websiteUrl, brandName, rawResponses);
        } else if (tier !== "tier1" && tier !== "free") {
          parametricSnapshot = await pe.runFullPersonaAudit(wid, websiteUrl, brandName, detectedIndustry, tier as any);
        }
      } catch(e: any) { console.warn("[S12]", e.message); }

      if (await isPaused(db, sessionId)) return NextResponse.json({ sessionId });

      // Step 13: Industry Positioning
      await upd(db, sessionId, 13, "업종 포지셔닝 및 Gap 분석 중...");
      let relativePosition: any = null;
      let improvementStrategy: any = null;
      let gaps: any[] = quickResult?.gaps || [];
      try {
        if (detectedIndustry !== "default") {
          const [profile, blueprint] = await Promise.all([
            getBenchmarkProfile(detectedIndustry),
            getIndustryBlueprint(detectedIndustry)
          ]);
          if (profile && blueprint) {
            const tmp: any = { websiteUrl, brandName, entities: kg.entities, cards, snapshot, gaps: [], auditMode: "partial" };
            relativePosition = new RelativePositioner().position(tmp, profile, blueprint);
            improvementStrategy = new StrategyGenerator().generate(relativePosition, blueprint, gaps);
          }
        }
        if (mappings.length > 0) {
          gaps = await new GapAnalyzer().analyze(wid, websiteUrl, kg.entities, reflectionDetails, mappings, techInfra, schemaQuality, contentSemantic);
        }
      } catch(e: any) { console.warn("[S13]", e.message); }

      // Step 14: Temporal Trends
      await upd(db, sessionId, 14, "시계열 트렌드 기록 중...");
      let trends: any[] = [];
      try { if (snapshot) trends = await new TemporalTracker().getTrends(websiteUrl); }
      catch(e: any) { console.warn("[S14]", e.message); }

      const auditMode = hasReflection ? "measured" : hasLlmEntities ? "partial" : "estimated";
      const finalResult = {
        websiteUrl, brandName, entities: kg.entities, cards, snapshot,
        observedPersona, parametricSnapshot, personaSpec, gaps, trends, auditMode,
        industry: detectedIndustry, techInfra, schemaQuality, contentSemantic,
        relativePosition, improvementStrategy
      };

      // Save L1/L2/L3 snapshots
      try {
        const { data: tData } = await db.from("tech_infra_snapshots").insert({
          workspace_id: wid, website_url: websiteUrl, audit_session_id: sessionId,
          robots_bot_matrix: techInfra.robotsBotMatrix, ai_crawler_access_score: techInfra.aiCrawlerAccessScore,
          https_enabled: techInfra.httpsEnabled, ttfb_ms: techInfra.ttfbMs,
          sitemap_url_count: techInfra.sitemapUrlCount, llms_txt_exists: techInfra.llmsTxtExists,
          canonical_consistency: techInfra.canonicalConsistency, tech_infra_score: techInfra.techInfraScore,
          issues: techInfra.issues, measured_at: new Date().toISOString()
        }).select("id").single();

        const { data: sData } = await db.from("schema_quality_snapshots").insert({
          workspace_id: wid, website_url: websiteUrl, audit_session_id: sessionId,
          schema_quality_score: schemaQuality.schemaQualityScore, schema_type_count: schemaQuality.schemaTypeCount,
          org_schema_present: !!schemaQuality.organizationSchema, faq_schema_count: schemaQuality.faqPageSchemas.length,
          og_completeness_score: schemaQuality.ogCompleteness.completenessScore,
          issues: schemaQuality.issues, measured_at: new Date().toISOString()
        }).select("id").single();

        const afAvg = contentSemantic.answerFirstScores.length > 0
          ? Math.round(contentSemantic.answerFirstScores.reduce((s: number, i: any) => s + i.directAnswerScore, 0) / contentSemantic.answerFirstScores.length) : 0;
        const { data: cData } = await db.from("content_semantic_snapshots").insert({
          workspace_id: wid, website_url: websiteUrl, audit_session_id: sessionId,
          eeat_experience: contentSemantic.eeat.experience, eeat_expertise: contentSemantic.eeat.expertise,
          eeat_authoritativeness: contentSemantic.eeat.authoritativeness, eeat_trustworthiness: contentSemantic.eeat.trustworthiness,
          answer_first_avg_score: afAvg, freshness_score: contentSemantic.freshnessAnalysis.freshnessScore,
          content_semantic_score: contentSemantic.contentSemanticScore,
          issues: contentSemantic.issues, measured_at: new Date().toISOString()
        }).select("id").single();

        await db.from("audit_sessions").update({
          status: "completed", completed_at: new Date().toISOString(), result_data: finalResult,
          ...(tData ? { tech_infra_snapshot_id: tData.id } : {}),
          ...(sData ? { schema_quality_snapshot_id: sData.id } : {}),
          ...(cData ? { content_semantic_snapshot_id: cData.id } : {}),
        }).eq("id", sessionId);
      } catch(e) {
        console.warn("[Audit] Snapshot save failed, saving result only:", e);
        await db.from("audit_sessions").update({ status: "completed", completed_at: new Date().toISOString(), result_data: finalResult }).eq("id", sessionId);
      }

      return NextResponse.json({ sessionId });

    } catch (auditErr: any) {
      console.error("[Audit] failed:", auditErr.message);
      await db.from("audit_sessions").update({ status: "failed", progress: { message: "진단 실패: " + auditErr.message } }).eq("id", sessionId);
      return NextResponse.json({ sessionId });
    }

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
