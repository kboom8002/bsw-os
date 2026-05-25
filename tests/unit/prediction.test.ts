import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSupabaseAdminClient } from "../../lib/supabase";
import { emergenceSignalSchema, predictedQuestionSchema } from "../../lib/schema";
import { NewsCollector } from "../../lib/prediction/signal-collectors/news-collector";
import { RegulationCollector } from "../../lib/prediction/signal-collectors/regulation-collector";
import { SearchTrendCollector } from "../../lib/prediction/signal-collectors/search-trend-collector";
import { CommunityCollector } from "../../lib/prediction/signal-collectors/community-collector";
import { SeasonalCollector } from "../../lib/prediction/signal-collectors/seasonal-collector";
import { InternalCollector } from "../../lib/prediction/signal-collectors/internal-collector";
import { QuestionPredictor } from "../../lib/prediction/question-predictor";

vi.mock("../../lib/supabase", () => ({
  getSupabaseAdminClient: vi.fn(),
}));

const createMockQueryBuilder = (data: any = null, error: any = null) => {
  const qb: any = {
    eq: vi.fn().mockImplementation(() => qb),
    select: vi.fn().mockImplementation(() => qb),
    insert: vi.fn().mockImplementation(() => qb),
    update: vi.fn().mockImplementation(() => qb),
    maybeSingle: vi.fn().mockImplementation(async () => ({ data, error })),
    single: vi.fn().mockImplementation(async () => ({ data, error })),
    then: vi.fn().mockImplementation((onFulfilled) => {
      return Promise.resolve(onFulfilled({ data, error }));
    }),
  };
  return qb;
};

describe("Question Emergence Predictor (QEP) Test Suite (Phase 3B)", () => {
  const workspaceId = "00000000-0000-4000-a000-000000000001";
  const signalId = "22222222-2222-4222-a222-222222222222";
  const predictionId = "33333333-3333-4333-b333-333333333333";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should validate standard emergence signal and predicted question schemas", () => {
    const signalPayload = {
      workspace_id: workspaceId,
      source_type: "news",
      industry: "beauty",
      raw_text: "식약처 고시 개정안 발표",
      predicted_impact: "high",
      status: "new",
    };

    const parsedSignal = emergenceSignalSchema.parse(signalPayload);
    expect(parsedSignal.predicted_impact).toBe("high");

    const predictionPayload = {
      workspace_id: workspaceId,
      signal_id: signalId,
      question_text: "민감성 피부를 위한 저자극 레티놀 사용법",
      question_variants: ["민감성 레티놀 부작용"],
      predicted_intent: "informational_safety",
      industry: "beauty",
      predicted_volume: "high",
      current_ai_coverage: "none",
      first_mover_window_days: 30,
      preemption_urgency: "high",
      confidence: 0.85,
      auto_must_include: ["식약처 승인"],
      auto_should_include: ["보습제 병행"],
      auto_must_not_do: ["하루에 여러 번 사용"],
    };

    const parsedPred = predictedQuestionSchema.parse(predictionPayload);
    expect(parsedPred.confidence).toBe(0.85);
  });

  it("should gather standardized news and regulation signals using collectors", async () => {
    const newsCollector = new NewsCollector();
    const regCollector = new RegulationCollector();

    const newsSignals = await newsCollector.collect(workspaceId, "beauty");
    const regSignals = await regCollector.collect(workspaceId, "wedding");

    expect(newsSignals).toHaveLength(2);
    expect(newsSignals[0].source_type).toBe("news");
    expect(newsSignals[0].predicted_impact).toBe("high");

    expect(regSignals).toHaveLength(1);
    expect(regSignals[0].source_type).toBe("regulation");
    expect(regSignals[0].predicted_impact).toBe("critical");
  });

  it("should gather standardized signals from trend, community, seasonal, and internal collectors", async () => {
    const trendCollector = new SearchTrendCollector();
    const commCollector = new CommunityCollector();
    const seaCollector = new SeasonalCollector();
    const intCollector = new InternalCollector();

    const trendSignals = await trendCollector.collect(workspaceId, "beauty");
    const commSignals = await commCollector.collect(workspaceId, "clinic");
    const seaSignals = await seaCollector.collect(workspaceId, "wedding");
    const intSignals = await intCollector.collect(workspaceId, "beauty");

    expect(trendSignals[0].source_type).toBe("search_trend");
    expect(commSignals[0].source_type).toBe("community");
    expect(seaSignals[0].source_type).toBe("seasonal");
    expect(intSignals[0].source_type).toBe("internal");
  });

  it("should predict questions and automatically generate Expected Layers from beauty signals", async () => {
    const predictor = new QuestionPredictor();

    const mockSignal = {
      id: signalId,
      workspace_id: workspaceId,
      source_type: "news",
      industry: "beauty",
      raw_text: "식약처 저자극 레티놀 승인 관련 신소재 특허 출원 증가",
      predicted_impact: "high" as const,
      status: "new" as const,
      ai_analysis: {},
    };

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === "predicted_questions") {
        return createMockQueryBuilder({
          ...mockSignal,
          id: predictionId,
          question_text: "민감성 피부를 위한 저자극 레티놀 사용법 및 부작용 대처법",
          auto_must_include: ["식약처 승인"],
          auto_should_include: ["보습제 병행"],
          auto_must_not_do: ["하루에 여러 번 사용"],
        });
      }
      return createMockQueryBuilder();
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const predictions = await predictor.predictQuestionsFromSignal(mockSignal);

    expect(predictions).toHaveLength(3);
    expect(predictions[0].question_text).toContain("레티놀");
    expect(predictions[0].auto_must_include.length).toBeGreaterThan(0);
    expect(predictions[0].auto_must_not_do.length).toBeGreaterThan(0);
  });

  it("should estimate first-mover window and evaluate AI coverage levels correctly", async () => {
    const predictor = new QuestionPredictor();

    const windowCritical = predictor.estimateFirstMoverWindow({
      source_type: "news",
      industry: "beauty",
      raw_text: "위약금 분쟁 긴급",
      predicted_impact: "critical",
      status: "new",
      ai_analysis: {},
    });

    const windowLow = predictor.estimateFirstMoverWindow({
      source_type: "news",
      industry: "beauty",
      raw_text: "가이드라인",
      predicted_impact: "low",
      status: "new",
      ai_analysis: {},
    });

    expect(windowCritical).toBe(14);
    expect(windowLow).toBe(90);

    const coverageNone = await predictor.checkAICoverage("웨딩홀 당일 계약 취소 수수료");
    const coverageSparse = await predictor.checkAICoverage("민감성 피부 레티놀 보습 크림");

    expect(coverageNone).toBe("none");
    expect(coverageSparse).toBe("sparse");
  });

  it("should process forecasting feedback and calculate super-forecasting accuracy", async () => {
    const predictor = new QuestionPredictor();

    const mockPrediction = {
      id: predictionId,
      confidence: 0.85,
    };

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === "predicted_questions") {
        return createMockQueryBuilder({
          ...mockPrediction,
          actually_emerged: true,
          prediction_accuracy: 0.85,
        });
      }
      return createMockQueryBuilder();
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const updated = await predictor.submitFeedback(predictionId, true);

    expect(updated.actually_emerged).toBe(true);
    expect(updated.prediction_accuracy).toBe(0.85); // 1.0 - |1.0 - 0.85| = 0.85
  });
});
