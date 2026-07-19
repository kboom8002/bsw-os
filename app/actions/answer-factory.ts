"use server";

/**
 * app/actions/answer-factory.ts
 *
 * Answer Factory 전용 Server Actions.
 * Q-Intelligence 예측 질문 + Pattern Attractor를 결합하여
 * Answer Asset을 생성하고 Hub/Storefront에 발행하는 전체 파이프라인.
 *
 * 재사용 모듈:
 * - lib/answer-supply/answer-mission-compiler.ts (311줄)
 * - lib/answer-supply/answer-asset-generator.ts (342줄)
 * - lib/answer-supply/answer-page-compiler.ts (213줄)
 * - lib/answer-supply/json-ld-factory.ts (191줄)
 * - lib/prediction/content-factory.ts (244줄)
 * - lib/prediction/vibe-forecaster.ts (140줄)
 * - lib/pattern-attractor/attractor-fit-scorer.ts
 * - lib/pattern-attractor/attractor-retriever.ts
 */

import { getSupabaseAdminClient } from "../../lib/supabase";
import { requireAuthOrDemo, checkWorkspacePermissionOrDemo } from "../../lib/auth";
import { AnswerMissionCompiler, type AnswerMission } from "../../lib/answer-supply/answer-mission-compiler";
import { AnswerAssetGenerator, type AnswerAssetSpec } from "../../lib/answer-supply/answer-asset-generator";
import { AnswerPageCompiler } from "../../lib/answer-supply/answer-page-compiler";
import { JsonLdFactory } from "../../lib/answer-supply/json-ld-factory";
import { PreemptiveContentFactory } from "../../lib/prediction/content-factory";
import { VibeBalancedForecaster } from "../../lib/prediction/vibe-forecaster";

// ── 타입 ─────────────────────────────────────────────────────────────

export interface AnswerPipelineInput {
  workspaceId: string;
  canonicalQuestionId: string;
  sceneId: string;
  attractorId?: string;        // 선택: Attractor 가이드 적용
  tenantId?: string;           // aihompy Hub 전달 대상
  targetVpa?: number;          // VPA 목표 점수 (기본 75)
}

export interface AnswerPipelineResult {
  success: boolean;
  mission?: AnswerMission;
  blueprint?: {
    id: string;
    recommendedStructure: string;
    targetVpa: number;
    toneGuidelines: string;
  };
  draft?: {
    content: string;
    vpaScore: number;
    safetyPassed: boolean;
    safetyReason?: string;
  };
  asset?: AnswerAssetSpec;
  page?: {
    html: string;
    title: string;
  };
  jsonLd?: Record<string, unknown>;
  attractorFit?: {
    totalScore: number;
    gate: "activate" | "conditional" | "skip";
  };
  readyToPublish: boolean;
  error?: string;
}

export interface PublishResult {
  success: boolean;
  hubPushed?: boolean;
  queuedForTenant?: boolean;
  publishedAssetId?: string;
  error?: string;
}

// ── 인증 헬퍼 ─────────────────────────────────────────────────────

async function authorizeWorkspace(workspaceId: string): Promise<string> {
  const userId = await requireAuthOrDemo();
  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
    "owner", "admin", "semantic_architect", "brand_strategist",
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Answer Factory 접근 권한이 없습니다.");
  }
  return userId;
}

// ── 1. Answer Pipeline (원클릭 에셋 생성) ────────────────────────

/**
 * Attractor-guided Answer Asset 원클릭 생성 파이프라인.
 *
 * 파이프라인 단계:
 * 1. (Optional) Attractor 적합도 검증
 * 2. AnswerMissionCompiler.compile() → AnswerMission
 * 3. VibeBalancedForecaster.createContentBlueprint() → Blueprint
 * 4. PreemptiveContentFactory.generateDraft() → Draft
 * 5. PreemptiveContentFactory.safetyGate() → 안전 검증
 * 6. PreemptiveContentFactory.vibeCheck() → VPA 점수
 * 7. AnswerAssetGenerator.generate() → 7채널 에셋
 * 8. AnswerPageCompiler.compile() → HTML
 * 9. JsonLdFactory.compile() → 구조화 데이터
 */
export async function runAnswerPipeline(
  input: AnswerPipelineInput
): Promise<AnswerPipelineResult> {
  const { workspaceId, canonicalQuestionId, sceneId, attractorId, tenantId, targetVpa = 75 } = input;

  await authorizeWorkspace(workspaceId);

  const result: AnswerPipelineResult = {
    success: false,
    readyToPublish: false,
  };

  try {
    // ── Stage 1: Attractor 적합도 검증 (선택) ──
    if (attractorId) {
      try {
        const { AttractorFitScorer } = await import("../../lib/pattern-attractor/attractor-fit-scorer");
        const { ContextTensorBuilder } = await import("../../lib/pattern-attractor/context-tensor-builder");

        const scorer = new AttractorFitScorer();

        const supabase = getSupabaseAdminClient();

        // Attractor 직접 조회
        const { data: attractorData } = await supabase
          .from("pattern_attractors")
          .select("*")
          .eq("id", attractorId)
          .eq("workspace_id", workspaceId)
          .maybeSingle();

        const { data: cq } = await supabase
          .from("canonical_questions")
          .select("normalized_question, primary_intent, risk_level")
          .eq("id", canonicalQuestionId)
          .maybeSingle();

        if (attractorData && cq) {
          // ContextTensor 구성
          const tensor = {
            domain: attractorData.domain_id || "general",
            user_state: cq.primary_intent || "informational",
            risk_state: (cq.risk_level || "low") as "low" | "medium" | "high" | "uncertain",
            intent_state: cq.primary_intent || "informational",
            evidence_state: "available",
            time_state: "current",
            channel_state: "homepage" as const,
          };

          const fitResult = await scorer.scoreAttractorFit(
            attractorData,
            cq.normalized_question,
            tensor,
            [] // availableEvidence
          );
          result.attractorFit = {
            totalScore: fitResult.total_score,
            gate: fitResult.gate,
          };

          if (fitResult.gate === "skip") {
            console.warn(
              `[AnswerFactory] Attractor fit score too low (${fitResult.total_score}), proceeding without attractor guidance`
            );
          }
        }
      } catch (e: any) {
        console.warn(`[AnswerFactory] Attractor fit check failed: ${e.message}`);
      }
    }

    // ── Stage 2: Answer Mission 컴파일 ──
    const missionCompiler = new AnswerMissionCompiler();
    const mission = await missionCompiler.compile(workspaceId, canonicalQuestionId, sceneId);
    result.mission = mission;

    // ── Stage 3: Content Blueprint 생성 ──
    // predicted_questions ID를 조회 (CQ와 연결된 예측 질문)
    const supabase = getSupabaseAdminClient();
    const { data: linkedPrediction } = await supabase
      .from("predicted_questions")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("question_text", mission.question.normalizedQuestion)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let blueprintId: string | null = null;

    if (linkedPrediction?.id) {
      try {
        const forecaster = new VibeBalancedForecaster();
        const blueprint = await forecaster.createContentBlueprint(
          workspaceId,
          linkedPrediction.id,
          { targetVpa }
        );
        blueprintId = blueprint.id ?? null;
        result.blueprint = {
          id: blueprint.id ?? "",
          recommendedStructure: blueprint.recommended_structure,
          targetVpa: blueprint.target_vpa,
          toneGuidelines: Array.isArray(blueprint.tone_guidelines) ? blueprint.tone_guidelines.join(", ") : (blueprint.tone_guidelines || ""),
        };
      } catch (e: any) {
        console.warn(`[AnswerFactory] Blueprint creation failed: ${e.message}`);
      }
    }

    // ── Stage 4: Draft 생성 ──
    const contentFactory = new PreemptiveContentFactory();

    if (blueprintId) {
      const draftContent = await contentFactory.generateDraft(blueprintId);

      // ── Stage 5: Safety Gate ──
      const safetyResult = await contentFactory.safetyGate(draftContent, blueprintId);

      // ── Stage 6: VPA Check ──
      const vpaScore = await contentFactory.vibeCheck(draftContent, workspaceId, blueprintId);

      result.draft = {
        content: draftContent,
        vpaScore,
        safetyPassed: safetyResult.passed,
        safetyReason: safetyResult.reason,
      };

      // VPA가 낮으면 톤 자동 조정 시도
      if (vpaScore < targetVpa) {
        const adjusted = contentFactory.adjustTone(draftContent, targetVpa);
        const adjustedVpa = await contentFactory.vibeCheck(adjusted, workspaceId, blueprintId);
        if (adjustedVpa > vpaScore) {
          result.draft.content = adjusted;
          result.draft.vpaScore = adjustedVpa;
        }
      }
    }

    // ── Stage 7: Answer Asset 생성 (7채널) ──
    const assetGenerator = new AnswerAssetGenerator();
    const asset = await assetGenerator.generate(mission, tenantId);
    result.asset = asset;

    // ── Stage 8: Answer Page 컴파일 ──
    const pageCompiler = new AnswerPageCompiler();
    const pageHtml = pageCompiler.compileHtml(asset);
    result.page = {
      html: pageHtml,
      title: asset.title,
    };

    // ── Stage 9: JSON-LD 생성 ──
    const jsonLdFactory = new JsonLdFactory();
    const jsonLd = jsonLdFactory.generate(asset);
    result.jsonLd = jsonLd;

    // ── 발행 준비 판정 ──
    const safetyOk = result.draft?.safetyPassed !== false;
    const vpaOk = (result.draft?.vpaScore ?? 100) >= targetVpa * 0.8; // 80% 이상이면 허용
    result.readyToPublish = safetyOk && vpaOk;

    // DB에 결과 저장
    await supabase.from("answer_factory_runs").upsert({
      workspace_id: workspaceId,
      canonical_question_id: canonicalQuestionId,
      scene_id: sceneId,
      attractor_id: attractorId || null,
      asset_id: asset.id,
      blueprint_id: blueprintId,
      vpa_score: result.draft?.vpaScore || null,
      safety_passed: result.draft?.safetyPassed ?? true,
      attractor_fit_score: result.attractorFit?.totalScore || null,
      ready_to_publish: result.readyToPublish,
      status: result.readyToPublish ? "ready" : "needs_review",
      created_at: new Date().toISOString(),
    }, { onConflict: "workspace_id,canonical_question_id,scene_id" }).then(() => {});

    result.success = true;
  } catch (e: any) {
    console.error("[AnswerFactory Pipeline] Error:", e);
    result.error = e.message;
  }

  return result;
}

// ── 2. Answer Asset 발행 ───────────────────────────────────────

/**
 * 생성된 Answer Asset을 Hub에 Push하거나 Tenant Queue에 발행.
 */
export async function publishAnswerAsset(
  workspaceId: string,
  assetId: string,
  targets: ("hub" | "tenant_queue")[]
): Promise<PublishResult> {
  await authorizeWorkspace(workspaceId);

  const result: PublishResult = { success: false };

  try {
    const supabase = getSupabaseAdminClient();

    // 에셋 조회
    const { data: run } = await supabase
      .from("answer_factory_runs")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("asset_id", assetId)
      .maybeSingle();

    if (!run) {
      return { success: false, error: "Answer Factory 실행 결과를 찾을 수 없습니다." };
    }

    if (!run.ready_to_publish) {
      return { success: false, error: "이 에셋은 아직 발행 준비가 되지 않았습니다. Safety Gate 또는 VPA 검증을 확인하세요." };
    }

    // Hub Push
    if (targets.includes("hub")) {
      try {
        const { QisHubClient } = await import("../../lib/qis/hub-client");
        const hubClient = new QisHubClient();

        const { data: cq } = await supabase
          .from("canonical_questions")
          .select("*")
          .eq("id", run.canonical_question_id)
          .maybeSingle();

        if (cq) {
          const pushResult = await hubClient.pushToAiHub("kr", [{
            id: cq.id,
            text: cq.normalized_question,
            industry_type: cq.industry_type || "general",
            source: "answer_factory",
            primary_intent: cq.primary_intent,
            risk_level: cq.risk_level,
            cps_score: cq.cps_score,
          }]);
          result.hubPushed = pushResult.ok;
        }
      } catch (e: any) {
        console.warn(`[AnswerFactory] Hub push failed: ${e.message}`);
        result.hubPushed = false;
      }
    }

    // Tenant Queue
    if (targets.includes("tenant_queue") && run.blueprint_id) {
      try {
        const contentFactory = new PreemptiveContentFactory();
        await contentFactory.sendToTenantQueue(run.blueprint_id);
        result.queuedForTenant = true;
      } catch (e: any) {
        console.warn(`[AnswerFactory] Tenant queue failed: ${e.message}`);
        result.queuedForTenant = false;
      }
    }

    // 상태 업데이트
    await supabase
      .from("answer_factory_runs")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
        publish_targets: targets,
      })
      .eq("workspace_id", workspaceId)
      .eq("asset_id", assetId);

    result.publishedAssetId = assetId;
    result.success = true;
  } catch (e: any) {
    console.error("[AnswerFactory Publish] Error:", e);
    result.error = e.message;
  }

  return result;
}

// ── 3. Answer Factory 대시보드 데이터 조회 ──────────────────────

/**
 * Answer Factory 통합 대시보드용 데이터 로드.
 * Attractor + CQ + Scene + 최근 실행 결과를 한번에 반환.
 */
export async function getAnswerFactoryDashboard(workspaceId: string) {
  await authorizeWorkspace(workspaceId);

  const supabase = getSupabaseAdminClient();

  // 병렬 조회
  const [
    { data: recentRuns },
    { data: readyCqs },
    { data: scenes },
    { data: attractors },
    { count: totalRuns },
    { count: publishedCount },
  ] = await Promise.all([
    // 최근 실행 결과 (20건)
    supabase
      .from("answer_factory_runs")
      .select("*, canonical_questions(normalized_question, primary_intent)")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(20),

    // 에셋 생성 가능한 CQ (Scene이 연결된 것)
    supabase
      .from("canonical_questions")
      .select("id, normalized_question, primary_intent, risk_level, cps_score")
      .eq("workspace_id", workspaceId)
      .not("id", "is", null)
      .order("cps_score", { ascending: false })
      .limit(50),

    // 활성 QIS Scenes
    supabase
      .from("qis_scenes")
      .select("id, scene_name, risk_level, readiness_score")
      .eq("workspace_id", workspaceId)
      .order("readiness_score", { ascending: false })
      .limit(30),

    // 활성 Pattern Attractors
    supabase
      .from("pattern_attractors")
      .select("id, natural_definition, type, status, scope")
      .eq("workspace_id", workspaceId)
      .eq("status", "active")
      .limit(20),

    // 총 실행 수
    supabase
      .from("answer_factory_runs")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId),

    // 발행된 수
    supabase
      .from("answer_factory_runs")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("status", "published"),
  ]);

  return {
    recentRuns: recentRuns || [],
    readyCqs: readyCqs || [],
    scenes: scenes || [],
    attractors: attractors || [],
    stats: {
      totalRuns: totalRuns || 0,
      publishedCount: publishedCount || 0,
      readyCount: (recentRuns || []).filter((r: any) => r.ready_to_publish).length,
      avgVpa: (recentRuns || []).reduce((sum: number, r: any) => sum + (r.vpa_score || 0), 0) / Math.max((recentRuns || []).length, 1),
    },
  };
}

// ── 4. 개별 에셋 상세 조회 ──────────────────────────────────────

/**
 * Answer Factory 실행 결과 상세 조회.
 * 에셋 미리보기, VPA 점수, Safety Gate 결과 등 포함.
 */
export async function getAnswerFactoryRunDetail(workspaceId: string, runId: string) {
  await authorizeWorkspace(workspaceId);

  const supabase = getSupabaseAdminClient();

  const { data: run } = await supabase
    .from("answer_factory_runs")
    .select(`
      *,
      canonical_questions(normalized_question, primary_intent, risk_level, cps_score),
      qis_scenes:scene_id(scene_name, risk_level, readiness_score),
      pattern_attractors:attractor_id(natural_definition, type, status)
    `)
    .eq("workspace_id", workspaceId)
    .eq("id", runId)
    .maybeSingle();

  if (!run) {
    throw new Error("실행 결과를 찾을 수 없습니다.");
  }

  return run;
}

// ── 5. CQ-Scene 페어 목록 (Answer Factory 입력용) ───────────────

/**
 * Answer Factory에서 에셋 생성 가능한 CQ-Scene 페어 목록.
 * Scene이 연결된 CQ만 반환, Attractor 매칭 가능 여부도 표시.
 */
export async function getAvailableCqScenePairs(workspaceId: string, domainId?: string) {
  await authorizeWorkspace(workspaceId);

  const supabase = getSupabaseAdminClient();

  // CQ에 연결된 Scene 조회
  let query = supabase
    .from("canonical_questions")
    .select(`
      id, normalized_question, primary_intent, risk_level, cps_score, slug,
      qis_scenes(id, scene_name, risk_level, readiness_score, workspace_id)
    `)
    .eq("workspace_id", workspaceId)
    .order("cps_score", { ascending: false });

  if (domainId) {
    query = query.eq("domain_id", domainId);
  }

  const { data: pairs } = await query.limit(50);

  // 기존 answer_factory_runs와 매칭하여 이미 생성된 것 표시
  const cqIds = (pairs || []).map((p: any) => p.id);
  const { data: existingRuns } = await supabase
    .from("answer_factory_runs")
    .select("canonical_question_id, status, vpa_score, ready_to_publish")
    .eq("workspace_id", workspaceId)
    .in("canonical_question_id", cqIds.length > 0 ? cqIds : ["__none__"]);

  const existingMap = new Map(
    (existingRuns || []).map((r: any) => [r.canonical_question_id, r])
  );

  return (pairs || []).map((pair: any) => ({
    ...pair,
    scenes: pair.qis_scenes || [],
    existingRun: existingMap.get(pair.id) || null,
    hasScene: (pair.qis_scenes || []).length > 0,
  }));
}
