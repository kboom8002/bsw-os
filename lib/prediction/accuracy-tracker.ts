import { getSupabaseAdminClient } from "../supabase";
import { QuestionPredictor } from "./question-predictor";

export interface RecalibrationResult {
  sourceWeights: Record<string, number>;
  averageAccuracy: number;
}

export class PredictionAccuracyTracker {
  private predictor: QuestionPredictor;

  constructor() {
    this.predictor = new QuestionPredictor();
  }

  /**
   * 1. Verifies prediction accuracy by checking live/mock AI coverage levels.
   */
  public async verifyPrediction(predictionId: string): Promise<{ actuallyEmerged: boolean; accuracy: number }> {
    const supabase = getSupabaseAdminClient();

    const { data: pred } = await supabase
      .from("predicted_questions")
      .select("*")
      .eq("id", predictionId)
      .maybeSingle();

    if (!pred) {
      throw new Error(`PredictionNotFound: Question with ID ${predictionId} not found.`);
    }

    // Evaluate current coverage
    const coverage = await this.predictor.checkAICoverage(pred.question_text);
    const actuallyEmerged = coverage === "saturated" || coverage === "moderate" || coverage === "sparse";

    // Super-forecasting accuracy calculation
    const baseAccuracy = actuallyEmerged ? 1.0 : 0.0;
    const accuracy = Number((1.0 - Math.abs(baseAccuracy - Number(pred.confidence))).toFixed(2));

    await supabase
      .from("predicted_questions")
      .update({
        actually_emerged: actuallyEmerged,
        emerged_at: actuallyEmerged ? new Date().toISOString() : null,
        prediction_accuracy: accuracy,
      })
      .eq("id", predictionId);

    return { actuallyEmerged, accuracy };
  }

  /**
   * 2. Recalibrates signal source weights based on past accuracy statistics.
   */
  public async recalibrateSignalWeights(workspaceId?: string): Promise<RecalibrationResult> {
    const supabase = getSupabaseAdminClient();

    // Fetch past predicted questions with verified accuracies
    let query = supabase
      .from("predicted_questions")
      .select("*, emergence_signals(*)");
    if (workspaceId) {
      query = query.eq("workspace_id", workspaceId);
    }
    const { data: rawVerified } = await query;

    const verified = (rawVerified ?? []).filter(
      (v) => v.prediction_accuracy !== null && v.prediction_accuracy !== undefined
    );

    const defaultWeights: Record<string, number> = {
      news: 1.0,
      regulation: 1.0,
      search_trend: 1.0,
      community: 1.0,
      seasonal: 1.0,
      internal: 1.0,
    };

    if (verified.length === 0) {
      return {
        sourceWeights: defaultWeights,
        averageAccuracy: 0.5,
      };
    }

    const sourceSumAcc: Record<string, number> = {};
    const sourceCount: Record<string, number> = {};
    let totalAccuracy = 0;

    for (const pred of verified) {
      const source = pred.emergence_signals?.source_type || "news";
      const acc = Number(pred.prediction_accuracy);

      sourceSumAcc[source] = (sourceSumAcc[source] || 0) + acc;
      sourceCount[source] = (sourceCount[source] || 0) + 1;
      totalAccuracy += acc;
    }

    const calibratedWeights: Record<string, number> = { ...defaultWeights };
    for (const source of Object.keys(defaultWeights)) {
      const count = sourceCount[source] ?? 0;
      if (count > 0) {
        const avg = sourceSumAcc[source] / count;
        // Calibrate weight around 1.0 based on how far it exceeds or lags the baseline (0.50)
        calibratedWeights[source] = Number((1.0 + (avg - 0.5)).toFixed(2));
      }
    }

    const averageAccuracy = Number((totalAccuracy / verified.length).toFixed(2));

    return {
      sourceWeights: calibratedWeights,
      averageAccuracy,
    };
  }

  /**
   * 3. Computes sector-specific accuracy and bias report.
   * Bias = Sum(Confidence - ActualEmerged) / Count
   */
  public async getSectorAccuracyReport(
    workspaceId: string
  ): Promise<Record<string, { averageAccuracy: number; bias: number; predictionCount: number }>> {
    const supabase = getSupabaseAdminClient();

    const { data: verified } = await supabase
      .from("predicted_questions")
      .select("industry, confidence, actually_emerged, prediction_accuracy")
      .eq("workspace_id", workspaceId);

    const report: Record<string, { sumAccuracy: number; sumBias: number; count: number }> = {};

    if (verified) {
      for (const pred of verified) {
        if (pred.prediction_accuracy === null || pred.prediction_accuracy === undefined) continue;
        const ind = pred.industry || "generic";
        const acc = Number(pred.prediction_accuracy || 0);
        const actual = pred.actually_emerged ? 1.0 : 0.0;
        const bias = Number(pred.confidence) - actual;

        if (!report[ind]) {
          report[ind] = { sumAccuracy: 0, sumBias: 0, count: 0 };
        }
        report[ind].sumAccuracy += acc;
        report[ind].sumBias += bias;
        report[ind].count += 1;
      }
    }

    const finalReport: Record<string, { averageAccuracy: number; bias: number; predictionCount: number }> = {};
    for (const [ind, stats] of Object.entries(report)) {
      finalReport[ind] = {
        averageAccuracy: Number((stats.sumAccuracy / stats.count).toFixed(2)),
        bias: Number((stats.sumBias / stats.count).toFixed(2)),
        predictionCount: stats.count
      };
    }

    return finalReport;
  }
}
