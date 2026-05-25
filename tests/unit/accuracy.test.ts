import { describe, it, expect, vi, beforeEach } from "vitest";
import { PredictionAccuracyTracker } from "../../lib/prediction/accuracy-tracker";
import { getSupabaseAdminClient } from "../../lib/supabase";

vi.mock("../../lib/supabase", () => ({
  getSupabaseAdminClient: vi.fn(),
}));

const createMockQueryBuilder = (data: any = null, error: any = null) => {
  const qb: any = {
    eq: vi.fn().mockImplementation(() => qb),
    not: vi.fn().mockImplementation(() => qb),
    select: vi.fn().mockImplementation(() => qb),
    update: vi.fn().mockImplementation(() => qb),
    maybeSingle: vi.fn().mockImplementation(async () => ({ data, error })),
    single: vi.fn().mockImplementation(async () => ({ data, error })),
    then: vi.fn().mockImplementation((onFulfilled) => {
      return Promise.resolve(onFulfilled({ data, error }));
    }),
  };
  return qb;
};

describe("Prediction Accuracy Tracker (Self-Learning Loop) Unit Test Suite (Phase 4C)", () => {
  const workspaceId = "00000000-0000-4000-a000-000000000001";
  const predictionId = "33333333-3333-4333-b333-333333333333";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should verify prediction accuracy successfully against mock crawler results", async () => {
    const tracker = new PredictionAccuracyTracker();

    const mockPrediction = {
      id: predictionId,
      question_text: "민감성 피부를 위한 저자극 레티놀 크림 사용법", // containing "레티놀" and "민감성" -> checkAICoverage returns "sparse" (which is emerged)
      confidence: 0.80,
    };

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === "predicted_questions") {
        return createMockQueryBuilder(mockPrediction);
      }
      return createMockQueryBuilder();
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const result = await tracker.verifyPrediction(predictionId);

    expect(result.actuallyEmerged).toBe(true);
    expect(result.accuracy).toBe(0.80); // 1.0 - |1.0 - 0.80| = 0.80
    expect(mockFrom).toHaveBeenCalledWith("predicted_questions");
  });

  it("should recalibrate signal weights based on past accuracy averages", async () => {
    const tracker = new PredictionAccuracyTracker();

    const mockVerifiedQuestions = [
      {
        id: "1",
        prediction_accuracy: 0.85,
        emergence_signals: { source_type: "news" },
      },
      {
        id: "2",
        prediction_accuracy: 0.90,
        emergence_signals: { source_type: "news" },
      },
      {
        id: "3",
        prediction_accuracy: 0.40,
        emergence_signals: { source_type: "regulation" },
      },
    ];

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === "predicted_questions") {
        return createMockQueryBuilder(mockVerifiedQuestions);
      }
      return createMockQueryBuilder();
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const recalibration = await tracker.recalibrateSignalWeights(workspaceId);

    expect(recalibration.averageAccuracy).toBe(0.72); // (0.85 + 0.90 + 0.40) / 3 = 0.716 -> 0.72
    expect(recalibration.sourceWeights.news).toBe(1.38); // 1.0 + (0.875 - 0.5) = 1.375 -> 1.38
    expect(recalibration.sourceWeights.regulation).toBe(0.90); // 1.0 + (0.4 - 0.5) = 0.90
    expect(recalibration.sourceWeights.seasonal).toBe(1.0); // unchanged
  });
});
