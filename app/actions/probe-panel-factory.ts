"use server";

import { getSupabaseAdminClient } from "../../lib/supabase";
import { checkWorkspacePermission, requireAuth, requireAuthOrDemo, checkWorkspacePermissionOrDemo } from "../../lib/auth";
import { probePanelSchema, probeQuestionSchema, expectedLayerSchema } from "../../lib/schema";
import { INDUSTRY_PANELS_DATA, IndustryType } from "../../db/seed/industry-panels/questions-data";


/**
 * Creates a customized, industry-standard Probe Panel with all questions and expected layers.
 */
export async function createIndustryStandardPanel(
  workspaceId: string,
  industry: IndustryType,
  brandKeyword: string,
  competitorKeywords: string[]
): Promise<{ panelId: string; questionCount: number }> {
  const userId = await requireAuthOrDemo();
  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to create industry standard panels.");
  }

  const { createIndustryStandardPanelCore } = await import("../../lib/db/probe-panel-db");
  return createIndustryStandardPanelCore(workspaceId, industry, brandKeyword, competitorKeywords);
}


interface PanelDiff {
  added: string[];
  removed: string[];
  weightChanged: { questionText: string; from: number; to: number }[];
}

/**
 * 두 프로브 패널 버전 간의 추가/삭제/가중치 변경 질문 차이를 분석합니다.
 */
export async function diffPanels(
  workspaceId: string,
  panelIdA: string,
  panelIdB: string
): Promise<PanelDiff> {
  const userId = await requireAuthOrDemo();
  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to diff panels.");
  }

  const supabase = getSupabaseAdminClient();

  const { data: questionsA } = await supabase
    .from("probe_questions")
    .select("question_text, weight")
    .eq("workspace_id", workspaceId)
    .eq("probe_panel_id", panelIdA);

  const { data: questionsB } = await supabase
    .from("probe_questions")
    .select("question_text, weight")
    .eq("workspace_id", workspaceId)
    .eq("probe_panel_id", panelIdB);

  const qMapA = new Map<string, number>();
  (questionsA ?? []).forEach(q => qMapA.set(q.question_text, q.weight ?? 1.0));

  const qMapB = new Map<string, number>();
  (questionsB ?? []).forEach(q => qMapB.set(q.question_text, q.weight ?? 1.0));

  const added: string[] = [];
  const removed: string[] = [];
  const weightChanged: { questionText: string; from: number; to: number }[] = [];

  // B에만 있는 질문 -> 추가됨
  qMapB.forEach((weight, text) => {
    if (!qMapA.has(text)) {
      added.push(text);
    } else {
      const oldWeight = qMapA.get(text)!;
      if (oldWeight !== weight) {
        weightChanged.push({ questionText: text, from: oldWeight, to: weight });
      }
    }
  });

  // A에만 있는 질문 -> 삭제됨
  qMapA.forEach((_, text) => {
    if (!qMapB.has(text)) {
      removed.push(text);
    }
  });

  return { added, removed, weightChanged };
}

/**
 * 지정된 과거 프로브 패널 버전으로 롤백 처리합니다.
 */
export async function rollbackPanel(
  workspaceId: string,
  panelId: string
): Promise<{ success: boolean; rolledBackTo: string }> {
  const userId = await requireAuthOrDemo();
  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to rollback panel.");
  }

  const supabase = getSupabaseAdminClient();

  // 1. 기존 활성 패널 비활성화 처리
  await supabase
    .from("probe_panels")
    .update({ is_active: false })
    .eq("workspace_id", workspaceId)
    .eq("is_active", true);

  // 2. 대상 패널 활성화 처리
  const { data, error } = await supabase
    .from("probe_panels")
    .update({ is_active: true })
    .eq("workspace_id", workspaceId)
    .eq("id", panelId)
    .select("id, panel_name")
    .single();

  if (error || !data) {
    throw new Error(`DB Error during panel rollback: ${error?.message || "Panel not found"}`);
  }

  // Audit trail
  await supabase.from("audit_events").insert({
    workspace_id: workspaceId,
    user_id: userId,
    action: "PANEL_ROLLBACK",
    target_type: "probe_panels",
    target_id: panelId,
    payload: { rolledBackTo: data.panel_name },
  });

  return { success: true, rolledBackTo: data.panel_name };
}
