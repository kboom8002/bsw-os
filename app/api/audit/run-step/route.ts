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

// Each step gets up to 5 minutes
export const maxDuration = 300;

// ─── Industry detection ───
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

// ─── Helper: update progress in DB ───
async function upd(db: ReturnType<typeof getSupabaseAdminClient>, sid: string, step: number, msg: string) {
  await db.from("audit_sessions").update({
    progress: { current_step: step, total_steps: 14, message: msg, last_checkpoint_step: step, updated_at: new Date().toISOString() },
  }).eq("id", sid);
}

// ─── Helper: save checkpoint data ───
async function saveCheckpoint(db: ReturnType<typeof getSupabaseAdminClient>, sid: string, step: number, data: Record<string, any>) {
  await db.from("audit_sessions").update({
    result_data: data,
    progress: { current_step: step, total_steps: 14, message: `Step ${step} checkpoint saved`, last_checkpoint_step: step, updated_at: new Date().toISOString() },
  }).eq("id", sid);
}

// ─── Default fallback values ───
const DEFAULT_TECH_INFRA = {
  robotsBotMatrix: [], aiCrawlerAccessScore: 50, httpsEnabled: false, sslCertValid: false,
  sslCertExpiryDays: 0, ttfbMs: 0, ttfbGrade: "slow", redirectChainDepth: 0, brokenLinks: [],
  renderingMode: "ssr", spaDetected: false, sitemapExists: false, sitemapUrlCount: 0,
  sitemapFreshnessScore: 0, llmsTxtExists: false, canonicalConsistency: 0, techInfraScore: 50, issues: [],
};

const DEFAULT_SCHEMA_QUALITY = {
  organizationSchema: null, localBusinessSchema: null, faqPageSchemas: [], howToSchemas: [],
  productSchemas: [], articleSchemas: [], breadcrumbSchemas: [], aggregateRatingSchemas: [], otherSchemas: [],
  orgSameAsProfiles: [], orgLogoPresent: false, orgContactPresent: false,
  ogCompleteness: { hasOgTitle: false, hasOgDescription: false, hasOgImage: false, hasOgType: false, hasOgUrl: false, completenessScore: 0, perPageScores: [] },
  metaTagAudit: { titleOptimization: [], descriptionQuality: [], authorPresent: 0, robotsDirectives: [], canonicalStatus: [] },
  schemaQualityScore: 50, schemaTypeCount: 0, schemaCoverage: 0, issues: [],
};

const DEFAULT_CONTENT_SEMANTIC = {
  eeat: { experience: 50, expertise: 50, authoritativeness: 50, trustworthiness: 50, overall: 50, signals: [] },
  answerFirstScores: [],
  freshnessAnalysis: { averageAgeDays: 180, freshContentRatio: 0, stalestPage: null, newestPage: null, freshnessScore: 50, perPageFreshness: [] },
  topicClusters: [], quantitativeDataDensity: 0,
  multimediaAudit: { totalImages: 0, imagesWithAlt: 0, imagesWithoutAlt: 0, altTextQualityScore: 0, videoCount: 0, hasEmbeddedVideo: false, multimediaScore: 0 },
  citationNetwork: { totalOutboundLinks: 0, uniqueExternalDomains: 0, authorityDomainRatio: 0, nofollowRatio: 0, citationQualityScore: 50, topCitedDomains: [] },
  originalityScore: 50,
  internalLinkTopology: { totalInternalLinks: 0, orphanPages: [], hubPages: [], averageLinksPerPage: 0, maxDepth: 0, topologyScore: 50 },
  contentSemanticScore: 50, issues: [],
};

export async function POST(request: Request) {
  const db = getSupabaseAdminClient();
  try {
    const body = await request.json();
    const { sessionId, step } = body as { sessionId: string; step: number };

    if (!sessionId || step === undefined || step === null) {
      return NextResponse.json({ error: "Missing sessionId or step" }, { status: 400 });
    }
    if (step < 0 || step > 14) {
      return NextResponse.json({ error: "Step must be 0-14" }, { status: 400 });
    }

    // Load session
    const { data: session, error: sessErr } = await db.from("audit_sessions")
      .select("workspace_id, website_url, brand_name, tier, industry, progress, result_data, status")
      .eq("id", sessionId).single();

    if (sessErr || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const wid = session.workspace_id;
    const websiteUrl = session.website_url;
    const brandName = session.brand_name;
    const tier = session.tier || "tier2";
    const industryInput = session.industry;
    const competitors: string[] = session.progress?.competitors || [];
    const cp: Record<string, any> = session.result_data || {};

    // Ensure session is in a valid state to run
    if (session.status === "completed") {
      return NextResponse.json({ error: "Session already completed" }, { status: 400 });
    }

    // Mark session as running
    await db.from("audit_sessions").update({ status: "running" }).eq("id", sessionId);

    try {
      switch (step) {
        // ── Step 0: Quick Baseline ──
        case 0: {
          await upd(db, sessionId, 0, "빠른 기준 추정 중...");
          let quickResult: any = null;
          try {
            quickResult = await new QuickSiteAnalyzer().analyze(wid, websiteUrl, brandName);
          } catch (e: any) {
            console.warn("[S0]", e.message);
          }
          await saveCheckpoint(db, sessionId, 0, { ...cp, quickResult });
          return NextResponse.json({ ok: true, step: 0, message: "Quick baseline done" });
        }

        // ── Step 1: Crawl ──
        case 1: {
          await upd(db, sessionId, 1, "웹사이트 구조 크롤링 중...");
          let crawlResult: any = null;
          let crawledPages: any[] = [];
          try {
            crawlResult = await new WebsiteCrawler().crawl(websiteUrl, 20);
            crawledPages = crawlResult.pages || [];
          } catch (e: any) {
            console.warn("[S1]", e.message);
            // If crawl fails but we have quickResult, save and continue
            if (!cp.quickResult) throw e;
          }
          await saveCheckpoint(db, sessionId, 1, { ...cp, crawlResult, crawledPages });
          return NextResponse.json({ ok: true, step: 1, message: `Crawled ${crawledPages.length} pages` });
        }

        // ── Step 2: L1 Tech Infra ──
        case 2: {
          await upd(db, sessionId, 2, "L1: 기술 인프라(AI Crawler Accessibility) 진단 중...");
          let techInfra = cp.quickResult?.techInfra ?? DEFAULT_TECH_INFRA;
          try {
            if (cp.crawlResult) {
              techInfra = TechInfraAuditor.audit(cp.crawlResult);
            }
          } catch (e: any) {
            console.warn("[S2]", e.message);
          }
          await saveCheckpoint(db, sessionId, 2, { ...cp, techInfra });
          return NextResponse.json({ ok: true, step: 2, message: `Tech Infra Score: ${techInfra.techInfraScore}` });
        }

        // ── Step 3: L2 Schema Quality ──
        case 3: {
          await upd(db, sessionId, 3, "L2: 구조화 시맨틱(Schema & OG metadata) 진단 중...");
          let schemaQuality = cp.quickResult?.schemaQuality ?? DEFAULT_SCHEMA_QUALITY;
          try {
            if (cp.crawledPages?.length > 0) {
              schemaQuality = SchemaQualityAuditor.audit(cp.crawledPages);
            }
          } catch (e: any) {
            console.warn("[S3]", e.message);
          }
          await saveCheckpoint(db, sessionId, 3, { ...cp, schemaQuality });
          return NextResponse.json({ ok: true, step: 3, message: `Schema Quality Score: ${schemaQuality.schemaQualityScore}` });
        }

        // ── Step 4: LLM Entity Extraction ──
        case 4: {
          await upd(db, sessionId, 4, "지식 자산(Entity) 추출 중...");
          let allEntities: any[] = cp.quickResult?.entities || [];
          let hasLlmEntities = false;
          if (tier !== "free" && cp.crawledPages?.length > 0) {
            try {
              const extracted = await new LlmEntityExtractor().extractBatch(wid, cp.crawledPages.slice(0, 10), websiteUrl);
              if (extracted.length > 0) { allEntities = extracted; hasLlmEntities = true; }
            } catch (e: any) {
              console.warn("[S4]", e.message);
            }
          }
          if (allEntities.length === 0 && cp.quickResult?.entities?.length > 0) {
            allEntities = cp.quickResult.entities;
          }
          await saveCheckpoint(db, sessionId, 4, { ...cp, allEntities, hasLlmEntities });
          return NextResponse.json({ ok: true, step: 4, message: `Extracted ${allEntities.length} entities` });
        }

        // ── Step 5: Knowledge Graph ──
        case 5: {
          await upd(db, sessionId, 5, "지식 그래프 구축 중...");
          const entities = cp.allEntities || cp.quickResult?.entities || [];
          let kg: any = { entities, nodes: [], edges: [], concepts: [] };
          try {
            kg = await new KnowledgeGraphBuilder().build(wid, websiteUrl, entities);
          } catch (e: any) {
            console.warn("[S5]", e.message);
          }
          await saveCheckpoint(db, sessionId, 5, { ...cp, kg });
          return NextResponse.json({ ok: true, step: 5, message: `KG with ${kg.entities?.length || 0} entities` });
        }

        // ── Step 6: Answer Cards ──
        case 6: {
          await upd(db, sessionId, 6, "AI 앤서카드 역설계 중...");
          let cards: any[] = cp.quickResult?.cards || [];
          try {
            const kg = cp.kg || { entities: cp.allEntities || [], nodes: [], edges: [], concepts: [] };
            const reversed = await new AnswerCardReverser().reverse(wid, websiteUrl, kg);
            if (reversed.cards?.length > 0) cards = reversed.cards;
          } catch (e: any) {
            console.warn("[S6]", e.message);
          }
          await saveCheckpoint(db, sessionId, 6, { ...cp, cards });
          return NextResponse.json({ ok: true, step: 6, message: `${cards.length} answer cards` });
        }

        // ── Step 7: Probes ──
        case 7: {
          await upd(db, sessionId, 7, "동적 프로빙 시나리오 생성 중...");
          let customProbes: any[] = [];
          try {
            customProbes = await new ProbeGenerator().generateProbes(cp.cards || [], brandName, competitors);
          } catch (e: any) {
            console.warn("[S7]", e.message);
          }
          await saveCheckpoint(db, sessionId, 7, { ...cp, customProbes });
          return NextResponse.json({ ok: true, step: 7, message: `${customProbes.length} probes` });
        }

        // ── Step 8: QIS Cross Map ──
        case 8: {
          await upd(db, sessionId, 8, "QIS 기반 업종 교차 매핑 중...");
          const kgEntities = cp.kg?.entities || cp.allEntities || [];
          const detectedIndustry = industryInput && industryInput !== "default"
            ? industryInput
            : detectIndustry(websiteUrl, kgEntities);
          let mappings: any[] = [];
          try {
            if (detectedIndustry !== "default") {
              mappings = await new QisCrossMapper().crossMap(detectedIndustry, cp.customProbes || []);
            }
          } catch (e: any) {
            console.warn("[S8]", e.message);
          }
          await saveCheckpoint(db, sessionId, 8, { ...cp, mappings, detectedIndustry });
          return NextResponse.json({ ok: true, step: 8, message: `${mappings.length} mappings (industry: ${detectedIndustry})` });
        }

        // ── Step 9: L3 Content Semantic ──
        case 9: {
          await upd(db, sessionId, 9, "L3: 콘텐츠 시맨틱(E-E-A-T, Answer-First, Freshness) 분석 중...");
          let contentSemantic = cp.quickResult?.contentSemantic ?? DEFAULT_CONTENT_SEMANTIC;
          try {
            if (cp.crawledPages?.length > 0) {
              const httpsEnabled = cp.techInfra?.httpsEnabled ?? false;
              const sameAsCount = cp.schemaQuality?.orgSameAsProfiles?.length ?? 0;
              contentSemantic = ContentSemanticAnalyzer.analyze(cp.crawledPages, httpsEnabled, sameAsCount);
            }
          } catch (e: any) {
            console.warn("[S9]", e.message);
          }
          await saveCheckpoint(db, sessionId, 9, { ...cp, contentSemantic });
          return NextResponse.json({ ok: true, step: 9, message: `Content Semantic Score: ${contentSemantic.contentSemanticScore}` });
        }

        // ── Step 10: Entity Reflection ──
        case 10: {
          await upd(db, sessionId, 10, "AI 엔진 대상 Entity Reflection 실측 중...");
          let snapshot: any = cp.quickResult?.snapshot || null;
          let reflectionDetails: any[] = [];
          let rawResponses: string[] = [];
          let hasReflection = false;
          const probes = cp.customProbes || [];
          if (probes.length > 0) {
            try {
              const kgEntities = cp.kg?.entities || cp.allEntities || [];
              const refResult = await new EntityReflectionRunner().run(
                wid, websiteUrl, kgEntities,
                probes.slice(0, 5),
                [new URL(websiteUrl).host],
                "composite",
                competitors
              );
              snapshot = refResult.snapshot;
              reflectionDetails = refResult.reflectionDetails;
              rawResponses = refResult.rawResponses;
              hasReflection = true;
            } catch (e: any) {
              console.warn("[S10]", e.message);
            }
          }
          // Apply L1/L2/L3 mod scores
          if (snapshot) {
            const techScore = cp.techInfra?.techInfraScore ?? 50;
            const schemaScore = cp.schemaQuality?.schemaQualityScore ?? 50;
            snapshot.tech_mod_score = Math.round((techScore + schemaScore) / 2);
            snapshot.eeat_mod_score = cp.contentSemantic?.eeat?.overall ?? 50;
          }
          await saveCheckpoint(db, sessionId, 10, { ...cp, snapshot, reflectionDetails, rawResponses, hasReflection });
          return NextResponse.json({ ok: true, step: 10, message: hasReflection ? "Reflection captured" : "Reflection skipped" });
        }

        // ── Step 11: AEPI Score ──
        case 11: {
          await upd(db, sessionId, 11, "종합 AEPI 가시성 지수 산출 중...");
          const snapshot = cp.snapshot;
          if (snapshot && cp.hasReflection) {
            try {
              const detectedIndustry = cp.detectedIndustry || "default";
              const aepi = AepiCalculator.calculate(snapshot, detectedIndustry);
              snapshot.aepi_score = aepi;
              await saveCheckpoint(db, sessionId, 11, { ...cp, snapshot });
              return NextResponse.json({ ok: true, step: 11, message: `AEPI = ${aepi}` });
            } catch (e: any) {
              console.warn("[S11]", e.message);
            }
          }
          await saveCheckpoint(db, sessionId, 11, cp);
          return NextResponse.json({ ok: true, step: 11, message: "AEPI skipped (no reflection)" });
        }

        // ── Step 12: Persona ──
        case 12: {
          await upd(db, sessionId, 12, "브랜드 페르소나 역설계 중...");
          let observedPersona: any = null;
          let parametricSnapshot: any = null;
          try {
            const pe = new PersonaReverseEngineer();
            if (tier === "tier1" && (cp.rawResponses?.length || 0) > 0) {
              observedPersona = await pe.analyze(wid, websiteUrl, brandName, cp.rawResponses);
            } else if (tier !== "tier1" && tier !== "free") {
              const detectedIndustry = cp.detectedIndustry || "default";
              parametricSnapshot = await pe.runFullPersonaAudit(wid, websiteUrl, brandName, detectedIndustry, tier as any);
            }
          } catch (e: any) {
            console.warn("[S12]", e.message);
          }
          await saveCheckpoint(db, sessionId, 12, { ...cp, observedPersona, parametricSnapshot });
          return NextResponse.json({ ok: true, step: 12, message: "Persona analysis done" });
        }

        // ── Step 13: Industry Positioning + Gap Analysis ──
        case 13: {
          await upd(db, sessionId, 13, "업종 포지셔닝 및 Gap 분석 중...");
          const detectedIndustry = cp.detectedIndustry || "default";
          let relativePosition: any = null;
          let improvementStrategy: any = null;
          let gaps: any[] = cp.quickResult?.gaps || [];
          try {
            if (detectedIndustry !== "default") {
              const [profile, blueprint] = await Promise.all([
                getBenchmarkProfile(detectedIndustry),
                getIndustryBlueprint(detectedIndustry),
              ]);
              if (profile && blueprint) {
                const kgEntities = cp.kg?.entities || cp.allEntities || [];
                const tmp: any = {
                  websiteUrl, brandName, entities: kgEntities,
                  cards: cp.cards || [], snapshot: cp.snapshot, gaps: [], auditMode: "partial",
                };
                relativePosition = new RelativePositioner().position(tmp, profile, blueprint);
                improvementStrategy = new StrategyGenerator().generate(relativePosition, blueprint, gaps);
              }
            }
            if ((cp.mappings?.length || 0) > 0) {
              const kgEntities = cp.kg?.entities || cp.allEntities || [];
              gaps = await new GapAnalyzer().analyze(
                wid, websiteUrl, kgEntities,
                cp.reflectionDetails || [], cp.mappings,
                cp.techInfra || DEFAULT_TECH_INFRA,
                cp.schemaQuality || DEFAULT_SCHEMA_QUALITY,
                cp.contentSemantic || DEFAULT_CONTENT_SEMANTIC,
              );
            }
          } catch (e: any) {
            console.warn("[S13]", e.message);
          }
          await saveCheckpoint(db, sessionId, 13, { ...cp, relativePosition, improvementStrategy, gaps });
          return NextResponse.json({ ok: true, step: 13, message: `${gaps.length} gaps analyzed` });
        }

        // ── Step 14: Temporal Trends + Final Save ──
        case 14: {
          await upd(db, sessionId, 14, "시계열 트렌드 기록 및 최종 저장 중...");
          let trends: any[] = [];
          try {
            if (cp.snapshot) {
              trends = await new TemporalTracker().getTrends(websiteUrl);
            }
          } catch (e: any) {
            console.warn("[S14]", e.message);
          }

          // Determine audit mode
          const auditMode = cp.hasReflection ? "measured" : cp.hasLlmEntities ? "partial" : "estimated";
          const kgEntities = cp.kg?.entities || cp.allEntities || [];
          const detectedIndustry = cp.detectedIndustry || "default";

          const finalResult = {
            websiteUrl, brandName, entities: kgEntities,
            cards: cp.cards || [], snapshot: cp.snapshot || null,
            observedPersona: cp.observedPersona || null,
            parametricSnapshot: cp.parametricSnapshot || null,
            personaSpec: null,
            gaps: cp.gaps || [], trends, auditMode,
            industry: detectedIndustry,
            techInfra: cp.techInfra || DEFAULT_TECH_INFRA,
            schemaQuality: cp.schemaQuality || DEFAULT_SCHEMA_QUALITY,
            contentSemantic: cp.contentSemantic || DEFAULT_CONTENT_SEMANTIC,
            relativePosition: cp.relativePosition || null,
            improvementStrategy: cp.improvementStrategy || null,
          };

          // Save L1/L2/L3 snapshots
          let tech_infra_snapshot_id: string | undefined;
          let schema_quality_snapshot_id: string | undefined;
          let content_semantic_snapshot_id: string | undefined;

          try {
            const techInfra = cp.techInfra || DEFAULT_TECH_INFRA;
            const schemaQuality = cp.schemaQuality || DEFAULT_SCHEMA_QUALITY;
            const contentSemantic = cp.contentSemantic || DEFAULT_CONTENT_SEMANTIC;

            const { data: tData } = await db.from("tech_infra_snapshots").insert({
              workspace_id: wid, website_url: websiteUrl, audit_session_id: sessionId,
              robots_bot_matrix: techInfra.robotsBotMatrix, ai_crawler_access_score: techInfra.aiCrawlerAccessScore,
              https_enabled: techInfra.httpsEnabled, ttfb_ms: techInfra.ttfbMs,
              sitemap_url_count: techInfra.sitemapUrlCount, llms_txt_exists: techInfra.llmsTxtExists,
              canonical_consistency: techInfra.canonicalConsistency, tech_infra_score: techInfra.techInfraScore,
              issues: techInfra.issues, measured_at: new Date().toISOString(),
            }).select("id").single();
            if (tData) tech_infra_snapshot_id = tData.id;

            const { data: sData } = await db.from("schema_quality_snapshots").insert({
              workspace_id: wid, website_url: websiteUrl, audit_session_id: sessionId,
              schema_quality_score: schemaQuality.schemaQualityScore, schema_type_count: schemaQuality.schemaTypeCount,
              org_schema_present: !!schemaQuality.organizationSchema, faq_schema_count: schemaQuality.faqPageSchemas.length,
              og_completeness_score: schemaQuality.ogCompleteness.completenessScore,
              issues: schemaQuality.issues, measured_at: new Date().toISOString(),
            }).select("id").single();
            if (sData) schema_quality_snapshot_id = sData.id;

            const afAvg = contentSemantic.answerFirstScores?.length > 0
              ? Math.round(contentSemantic.answerFirstScores.reduce((s: number, i: any) => s + i.directAnswerScore, 0) / contentSemantic.answerFirstScores.length)
              : 0;
            const { data: cData } = await db.from("content_semantic_snapshots").insert({
              workspace_id: wid, website_url: websiteUrl, audit_session_id: sessionId,
              eeat_experience: contentSemantic.eeat.experience, eeat_expertise: contentSemantic.eeat.expertise,
              eeat_authoritativeness: contentSemantic.eeat.authoritativeness, eeat_trustworthiness: contentSemantic.eeat.trustworthiness,
              answer_first_avg_score: afAvg, freshness_score: contentSemantic.freshnessAnalysis.freshnessScore,
              content_semantic_score: contentSemantic.contentSemanticScore,
              issues: contentSemantic.issues, measured_at: new Date().toISOString(),
            }).select("id").single();
            if (cData) content_semantic_snapshot_id = cData.id;
          } catch (snapErr) {
            console.warn("[S14] Snapshot save failed:", snapErr);
          }

          // Mark session completed
          await db.from("audit_sessions").update({
            status: "completed",
            completed_at: new Date().toISOString(),
            result_data: finalResult,
            progress: { current_step: 14, total_steps: 14, message: "진단 완료", last_checkpoint_step: 14, updated_at: new Date().toISOString() },
          }).eq("id", sessionId);

          return NextResponse.json({ ok: true, step: 14, message: "Audit complete", completed: true });
        }

        default:
          return NextResponse.json({ error: `Unknown step ${step}` }, { status: 400 });
      }
    } catch (stepErr: any) {
      console.error(`[run-step] Step ${step} failed:`, stepErr.message);
      // Save error state but DON'T mark session as failed — the client can retry or skip
      await upd(db, sessionId, step, `Step ${step} failed: ${stepErr.message}`);
      return NextResponse.json(
        { ok: false, step, error: stepErr.message, message: `Step ${step} failed: ${stepErr.message}` },
        { status: 500 }
      );
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
