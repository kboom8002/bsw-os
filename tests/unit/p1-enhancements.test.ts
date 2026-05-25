import { describe, it, expect, vi, beforeEach } from "vitest";
import { INDUSTRY_PANELS_DATA, IndustryType } from "../../db/seed/industry-panels/questions-data";
import { QueryExpander } from "../../lib/prediction/query-expander";
import { QuestionPredictor } from "../../lib/prediction/question-predictor";
import { CrossIndustryDeduplicator } from "../../lib/analytics/cross-industry-deduplicator";
import { CoverageAnalyzer } from "../../lib/analytics/coverage-score";
import { diffPanels, rollbackPanel } from "../../app/actions/probe-panel-factory";
import { PredictionAccuracyTracker } from "../../lib/prediction/accuracy-tracker";
import { getSupabaseAdminClient } from "../../lib/supabase";

vi.mock("../../lib/supabase", () => ({
  getSupabaseAdminClient: vi.fn(),
}));

vi.mock("../../lib/auth", () => ({
  checkWorkspacePermission: vi.fn().mockResolvedValue(true),
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

describe("BSW-OS P1 Enhancements Test Suite", () => {
  const workspaceId = "00000000-0000-4000-a000-000000000001";
  const panelIdA = "00000000-0000-4000-a000-000000000002";
  const panelIdB = "00000000-0000-4000-a000-000000000003";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- WS-A: Coverage & Standardization Tests ---

  it("P1-01: 10개 업종 전체 20문항 규격 검증", () => {
    Object.keys(INDUSTRY_PANELS_DATA).forEach((ind) => {
      const data = INDUSTRY_PANELS_DATA[ind as IndustryType];
      expect(data.questions).toHaveLength(20);
    });
  });

  it("P1-02: 업종별 Decision 단계 15% 비율 검증", () => {
    Object.keys(INDUSTRY_PANELS_DATA).forEach((ind) => {
      const data = INDUSTRY_PANELS_DATA[ind as IndustryType];
      const decisionCount = data.questions.filter(q => q.decision_stage === "decision").length;
      expect(decisionCount).toBeGreaterThanOrEqual(3); // 3/20 = 15%
    });
  });

  it("P1-03: 업종별 Local Intent 최소 2개 검증", () => {
    Object.keys(INDUSTRY_PANELS_DATA).forEach((ind) => {
      const data = INDUSTRY_PANELS_DATA[ind as IndustryType];
      const localCount = data.questions.filter(q => q.question_type === "local_intent").length;
      expect(localCount).toBeGreaterThanOrEqual(2);
    });
  });

  it("P1-04: query_variants AI 자동 다각화", () => {
    const expander = new QueryExpander();
    const variants = expander.expand("민감성 피부에 좋은 {brand} 보습크림 추천해줘", "PureBarrier");
    expect(variants).toHaveLength(5);
    expect(variants[0]).toBe("민감성 피부에 좋은 PureBarrier 보습크림 추천해줘");
    expect(variants[4]).toContain("Best PureBarrier");
  });

  // --- WS-B: Advanced Intelligence & Matching Tests ---

  it("P1-05: 신호 -> 3개 다중 파생 질문 분기 (Fan-out)", async () => {
    const predictor = new QuestionPredictor();
    const mockSignal = {
      workspace_id: workspaceId,
      id: "signal-123",
      industry: "beauty",
      predicted_impact: "high"
    } as any;

    const mockFrom = vi.fn().mockImplementation(() => createMockQueryBuilder());
    vi.mocked(getSupabaseAdminClient).mockReturnValue({ from: mockFrom } as any);

    const predictions = await predictor.predictQuestionsFromSignal(mockSignal);
    // Base 1 + Safety 1 + Comparison 1 = 3 predictions!
    expect(predictions).toHaveLength(3);
    const intents = predictions.map(p => p.predicted_intent);
    expect(intents).toContain("informational_safety");
    expect(intents).toContain("legal_compliance");
    expect(intents).toContain("value_comparison");
  });

  it("P1-06: Cross-Industry 유사도 기반 중복 판정", async () => {
    const deduplicator = new CrossIndustryDeduplicator();
    const result = await deduplicator.detectDuplicates(
      "민감성 피부용 보습 크림 추천",
      "민감성 피부를 위한 보습 크림 추천"
    );
    expect(result.similarity).toBeGreaterThan(0.85);
    expect(result.isDuplicate).toBe(true);
  });

  it("P1-07: 시맨틱 커버리지 스코어(SCS) 공식 계산", async () => {
    const analyzer = new CoverageAnalyzer();
    const active = ["민감성 피부용 보습 크림 추천", "레티놀 기초 화장품 순서"];
    const universe = ["민감 피부 보습제 추천", "레티놀 에센스 도포 순서", "건성 피부 보습크림"];

    const scs = await analyzer.computeSemanticCoverageScore(workspaceId, active, universe);
    expect(scs).toBeGreaterThanOrEqual(0);
    expect(scs).toBeLessThanOrEqual(100);
  });

  // --- WS-C: Advanced Governance & Analytics Tests ---

  it("P1-08: 패널 멀티 버전 관리 및 Diff 검증", async () => {
    const mockQuestionsA = [
      { question_text: "민감성 보습크림 추천", weight: 1.0 },
      { question_text: "레티놀 사용량", weight: 1.0 },
    ];
    const mockQuestionsB = [
      { question_text: "민감성 보습크림 추천", weight: 1.2 }, // Weight changed
      { question_text: "선크림 지수 비교", weight: 1.0 }, // Added
    ];

    const mockFrom = vi.fn().mockImplementation((table) => {
      if (table === "probe_questions") {
        const selectMock = vi.fn().mockImplementation((args) => {
          // Check panelId in eq query
          const isA = mockFrom.mock.calls.length % 2 === 1;
          return createMockQueryBuilder(isA ? mockQuestionsA : mockQuestionsB);
        });
        return { select: selectMock } as any;
      }
      return createMockQueryBuilder();
    });
    vi.mocked(getSupabaseAdminClient).mockReturnValue({ from: mockFrom } as any);

    const diff = await diffPanels(workspaceId, panelIdA, panelIdB);
    expect(diff.added).toContain("선크림 지수 비교");
    expect(diff.removed).toContain("레티놀 사용량");
    expect(diff.weightChanged).toHaveLength(1);
    expect(diff.weightChanged[0].from).toBe(1.0);
    expect(diff.weightChanged[0].to).toBe(1.2);
  });

  it("P1-09: YMYL 규제 매핑 무결성 검증", async () => {
    const mockFrom = vi.fn().mockImplementation(() => createMockQueryBuilder({
      is_ymyl: true,
      regulatory_ref_id: "ref-123"
    }));
    vi.mocked(getSupabaseAdminClient).mockReturnValue({ from: mockFrom } as any);

    const db = getSupabaseAdminClient();
    const { data: question } = await db.from("probe_questions").select("*").single();

    expect(question.is_ymyl).toBe(true);
    expect(question.regulatory_ref_id).toBe("ref-123");
  });

  it("P1-10: 업종별 정확도 세분화 리포팅 검증", async () => {
    const tracker = new PredictionAccuracyTracker();
    const mockVerified = [
      { industry: "beauty", confidence: 0.8, actually_emerged: true, prediction_accuracy: 0.8 },
      { industry: "beauty", confidence: 0.9, actually_emerged: false, prediction_accuracy: 0.1 },
      { industry: "wedding", confidence: 0.7, actually_emerged: true, prediction_accuracy: 0.7 }
    ];

    const mockFrom = vi.fn().mockImplementation(() => createMockQueryBuilder(mockVerified));
    vi.mocked(getSupabaseAdminClient).mockReturnValue({ from: mockFrom } as any);

    const report = await tracker.getSectorAccuracyReport(workspaceId);
    expect(report.beauty).toBeDefined();
    expect(report.wedding).toBeDefined();

    expect(report.beauty.predictionCount).toBe(2);
    expect(report.wedding.predictionCount).toBe(1);
    expect(report.beauty.averageAccuracy).toBe(0.45); // (0.8 + 0.1) / 2
    expect(report.beauty.bias).toBe(0.35); // ((0.8-1) + (0.9-0)) / 2 = (-0.2 + 0.9) / 2 = 0.35
  });
});
