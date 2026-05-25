import { getSupabaseAdminClient } from "../supabase";

export type FunnelStage = "intake" | "analyzed" | "observed" | "predicted" | "content_created" | "measured";

export interface FunnelMetrics {
  stage: FunnelStage;
  count: number;
  percentage: number;
}

export interface FunnelReport {
  workspaceId: string;
  stages: FunnelMetrics[];
  totalQuestions: number;
  conversionRates: Record<string, number>;
  bottleneck: string;
  generatedAt: string;
}

export class FunnelTracker {
  /**
   * Records a funnel stage transition for a question.
   */
  public async recordTransition(
    workspaceId: string,
    questionId: string,
    fromStage: FunnelStage,
    toStage: FunnelStage,
    isPredicted: boolean = false,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const supabase = getSupabaseAdminClient();

    await supabase.from("question_funnel_events").insert({
      workspace_id: workspaceId,
      probe_question_id: isPredicted ? null : questionId,
      predicted_question_id: isPredicted ? questionId : null,
      from_stage: fromStage,
      to_stage: toStage,
      event_metadata: metadata,
    });

    // Update the question's current funnel stage
    const table = isPredicted ? "predicted_questions" : "probe_questions";
    await supabase
      .from(table)
      .update({ funnel_stage: toStage })
      .eq("id", questionId);
  }

  /**
   * Generates a complete funnel report for a workspace.
   * Counts questions at each stage and computes conversion rates.
   */
  public async generateReport(workspaceId: string): Promise<FunnelReport> {
    const supabase = getSupabaseAdminClient();

    // Count probe questions per funnel stage
    const { data: probeQuestions } = await supabase
      .from("probe_questions")
      .select("funnel_stage")
      .eq("workspace_id", workspaceId)
      .eq("lifecycle_status", "active");

    const stageCounts: Record<FunnelStage, number> = {
      intake: 0,
      analyzed: 0,
      observed: 0,
      predicted: 0,
      content_created: 0,
      measured: 0,
    };

    for (const q of (probeQuestions ?? [])) {
      const stage = (q.funnel_stage || "intake") as FunnelStage;
      if (stageCounts[stage] !== undefined) {
        stageCounts[stage]++;
      }
    }

    // Count predicted questions too
    const { data: predictions } = await supabase
      .from("predicted_questions")
      .select("id")
      .eq("workspace_id", workspaceId);
    stageCounts.predicted += (predictions?.length ?? 0);

    // Count content blueprints
    const { data: blueprints } = await supabase
      .from("content_blueprints")
      .select("id")
      .eq("workspace_id", workspaceId);
    stageCounts.content_created += (blueprints?.length ?? 0);

    // Count observation runs
    const { data: observations } = await supabase
      .from("ai_observation_runs")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("run_status", "completed");
    stageCounts.observed += (observations?.length ?? 0);

    const totalQuestions = Object.values(stageCounts).reduce((a, b) => a + b, 0);

    const stages: FunnelMetrics[] = Object.entries(stageCounts).map(([stage, count]) => ({
      stage: stage as FunnelStage,
      count,
      percentage: totalQuestions > 0 ? Number(((count / totalQuestions) * 100).toFixed(1)) : 0,
    }));

    // Conversion rates between consecutive stages
    const stageOrder: FunnelStage[] = ["intake", "analyzed", "observed", "predicted", "content_created", "measured"];
    const conversionRates: Record<string, number> = {};
    let bottleneck = "none";
    let worstRate = 100;

    for (let i = 0; i < stageOrder.length - 1; i++) {
      const from = stageOrder[i];
      const to = stageOrder[i + 1];
      const fromCount = stageCounts[from];
      const toCount = stageCounts[to];

      const rate = fromCount > 0 ? Number(((toCount / fromCount) * 100).toFixed(1)) : 0;
      conversionRates[`${from}_to_${to}`] = rate;

      if (rate < worstRate && fromCount > 0) {
        worstRate = rate;
        bottleneck = `${from} → ${to} (${rate}%)`;
      }
    }

    return {
      workspaceId,
      stages,
      totalQuestions,
      conversionRates,
      bottleneck,
      generatedAt: new Date().toISOString(),
    };
  }
}
