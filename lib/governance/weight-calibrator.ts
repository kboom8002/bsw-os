import { getSupabaseAdminClient } from "../supabase";

export interface CalibrationResult {
  questionId: string;
  baseWeight: number;
  calibratedWeight: number;
  reason: string;
}

export class WeightCalibrator {
  /**
   * Recalibrates question weights based on observation metrics.
   *
   * 공식: calibrated_weight = base_weight * observation_boost * recency_decay
   *   - observation_boost: 관측 결과 brand_mention_rate > 0.5 → boost 1.15, < 0.2 → decay 0.85
   *   - recency_decay: 30일 이상 관측 미실행 → decay 0.90, 90일 이상 → 0.75
   */
  public async calibrateWorkspace(workspaceId: string): Promise<CalibrationResult[]> {
    const supabase = getSupabaseAdminClient();
    const results: CalibrationResult[] = [];

    // Fetch all active questions
    const { data: questions } = await supabase
      .from("probe_questions")
      .select("id, weight, base_weight, calibrated_weight, created_at")
      .eq("workspace_id", workspaceId)
      .eq("lifecycle_status", "active");

    if (!questions || questions.length === 0) return [];

    for (const q of questions) {
      const baseWeight = q.base_weight ?? q.weight ?? 1.0;

      // Check observation metrics for this question
      const { data: runs } = await supabase
        .from("probe_runs")
        .select("created_at, raw_response_text")
        .eq("workspace_id", workspaceId)
        .eq("probe_question_id", q.id)
        .order("created_at", { ascending: false })
        .limit(5);

      let observationBoost = 1.0;
      let recencyDecay = 1.0;
      let reason = "no_change";

      if (runs && runs.length > 0) {
        // Observation boost: based on mention rate in responses
        const mentionCount = runs.filter(r =>
          (r.raw_response_text || "").length > 50
        ).length;
        const mentionRate = mentionCount / runs.length;

        if (mentionRate > 0.5) {
          observationBoost = 1.15;
          reason = "high_observation_relevance";
        } else if (mentionRate < 0.2) {
          observationBoost = 0.85;
          reason = "low_observation_relevance";
        }

        // Recency decay: days since last observation
        const lastRunDate = new Date(runs[0].created_at);
        const daysSinceRun = (Date.now() - lastRunDate.getTime()) / (1000 * 60 * 60 * 24);

        if (daysSinceRun > 90) {
          recencyDecay = 0.75;
          reason += "+stale_90d";
        } else if (daysSinceRun > 30) {
          recencyDecay = 0.90;
          reason += "+aging_30d";
        }
      } else {
        // Never observed — apply mild decay
        recencyDecay = 0.85;
        reason = "never_observed";
      }

      const calibratedWeight = Number((baseWeight * observationBoost * recencyDecay).toFixed(2));

      // Clamp to [0.3, 2.0]
      const clamped = Math.max(0.3, Math.min(2.0, calibratedWeight));

      await supabase
        .from("probe_questions")
        .update({
          calibrated_weight: clamped,
          last_calibrated_at: new Date().toISOString(),
        })
        .eq("id", q.id);

      results.push({
        questionId: q.id,
        baseWeight,
        calibratedWeight: clamped,
        reason,
      });
    }

    return results;
  }
}
