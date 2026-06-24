"use server";

import { getSupabaseAdminClient } from "../../lib/supabase";
import {  checkWorkspacePermission , requireAuth } from "../../lib/auth";
import { questionValueScoreSchema } from "../../lib/schema";


/**
 * 1. Score or update a Question Value Score (QVS) record.
 * Respects RLS and workspace authorization.
 */
export async function scoreQuestionValue(
  workspaceId: string,
  params: {
    id?: string;
    probe_question_id?: string | null;
    predicted_question_id?: string | null;
    volume_score: number;
    conversion_score: number;
    arpu_score: number;
    first_mover_score?: number;
    competition_score: number;
    industry: string;
    scoring_method?: "auto" | "manual";
  }
) {
  const userId = await requireAuth();

  const isAuthorized = await checkWorkspacePermission(workspaceId, userId, [
    "owner",
    "admin",
    "brand_strategist",
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to modify question value scores.");
  }

  const firstMoverScore = params.first_mover_score ?? 1.0;
  const scoringMethod = params.scoring_method ?? "auto";

  // 1. Math Calculation
  // QVS = Volume * Conversion * ARPU * FirstMover * (1 - Competition)
  const qvsComposite = params.volume_score * params.conversion_score * params.arpu_score * firstMoverScore * (1 - params.competition_score);
  const estimatedMonthlyValue = qvsComposite; // KRW monthly contribution value

  // 2. Preemption Deadline Calculation (Default to 30 days or based on predicted question if linked)
  let preemptionDeadline = new Date();
  if (params.predicted_question_id) {
    const supabase = getSupabaseAdminClient();
    const { data: predicted } = await supabase
      .from("predicted_questions")
      .select("first_mover_window_days")
      .eq("id", params.predicted_question_id)
      .maybeSingle();

    const days = predicted?.first_mover_window_days ?? 30;
    preemptionDeadline.setDate(preemptionDeadline.getDate() + days);
  } else {
    preemptionDeadline.setDate(preemptionDeadline.getDate() + 90); // Default 90 days for probe questions
  }

  // 3. Zod validation
  const parsed = questionValueScoreSchema.parse({
    id: params.id,
    workspace_id: workspaceId,
    probe_question_id: params.probe_question_id,
    predicted_question_id: params.predicted_question_id,
    volume_score: params.volume_score,
    conversion_score: params.conversion_score,
    arpu_score: params.arpu_score,
    first_mover_score: firstMoverScore,
    competition_score: params.competition_score,
    qvs_composite: Number(qvsComposite.toFixed(2)),
    estimated_monthly_value: Number(estimatedMonthlyValue.toFixed(2)),
    preemption_deadline: preemptionDeadline.toISOString(),
    industry: params.industry,
    scoring_method: scoringMethod,
  });

  const supabase = getSupabaseAdminClient();

  const { data: result, error } = await supabase
    .from("question_value_scores")
    .upsert({
      id: parsed.id || undefined,
      workspace_id: parsed.workspace_id,
      probe_question_id: parsed.probe_question_id,
      predicted_question_id: parsed.predicted_question_id,
      volume_score: parsed.volume_score,
      conversion_score: parsed.conversion_score,
      arpu_score: parsed.arpu_score,
      first_mover_score: parsed.first_mover_score,
      competition_score: parsed.competition_score,
      qvs_composite: parsed.qvs_composite,
      estimated_monthly_value: parsed.estimated_monthly_value,
      preemption_deadline: parsed.preemption_deadline,
      industry: parsed.industry,
      scoring_method: parsed.scoring_method,
      scored_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error || !result) {
    throw new Error(`DB Error: ${error?.message || "Upsert failed"}`);
  }

  // 4. Audit Trail Event
  await supabase.from("audit_events").insert({
    workspace_id: workspaceId,
    user_id: userId,
    action: "SCORE_QUESTION_VALUE",
    target_type: "question_value_scores",
    target_id: result.id,
    payload: {
      qvs_composite: result.qvs_composite,
      estimated_monthly_value: result.estimated_monthly_value,
      probe_question_id: result.probe_question_id,
      predicted_question_id: result.predicted_question_id,
    },
  });

  return result;
}

/**
 * 2. Get top-value questions by industry.
 * Respects RLS on workspace_id.
 */
export async function getTopValueQuestions(
  workspaceId: string,
  industry: string,
  limit: number = 10
) {
  const userId = await requireAuth();

  const isAuthorized = await checkWorkspacePermission(workspaceId, userId, [
    "owner",
    "admin",
    "brand_strategist",
    "executive_viewer",
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to view value questions.");
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("question_value_scores")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("industry", industry)
    .order("qvs_composite", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`DB Error: ${error.message}`);
  }

  return data;
}

/**
 * 3. Find preemption opportunities: High value, low competition questions.
 */
export async function getPreemptionOpportunities(workspaceId: string, limit: number = 5) {
  const userId = await requireAuth();

  const isAuthorized = await checkWorkspacePermission(workspaceId, userId, [
    "owner",
    "admin",
    "brand_strategist",
    "executive_viewer",
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to view opportunities.");
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("question_value_scores")
    .select("*")
    .eq("workspace_id", workspaceId)
    .lt("competition_score", 0.4) // Low competition threshold
    .order("qvs_composite", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`DB Error: ${error.message}`);
  }

  return data;
}
