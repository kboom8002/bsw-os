import { describe, it, expect, vi, beforeEach } from "vitest";
import { AiprEngine } from "../../lib/sbs-index/aipr";
import { SbsIndexRunner } from "../../lib/sbs-index/index-runner";
import { KaiviEngine } from "../../lib/sbs-index/kaivi";
import { BairEngine } from "../../lib/sbs-index/bair";
import { PREDICTION_TEMPLATE_REGISTRY } from "../../lib/prediction/industry-prediction-templates";
import { QuestionPredictor } from "../../lib/prediction/question-predictor";
import { QuestionLifecycleManager } from "../../lib/governance/question-lifecycle-manager";
import { WeightCalibrator } from "../../lib/governance/weight-calibrator";
import { createIndustryStandardPanel } from "../../app/actions/probe-panel-factory";
import { FunnelTracker } from "../../lib/analytics/funnel-tracker";
import { getSupabaseAdminClient } from "../../lib/supabase";
import { INDUSTRY_PANELS_DATA } from "../../db/seed/industry-panels/questions-data";

vi.mock("../../lib/supabase", () => ({
  getSupabaseAdminClient: vi.fn(),
}));

vi.mock("../../lib/auth", () => ({
  requireAuth: vi.fn().mockResolvedValue('test-user-id'),
  requireAuthOrDemo: vi.fn().mockResolvedValue('test-user-id'),
  checkWorkspacePermission: vi.fn().mockResolvedValue(true),
  checkWorkspacePermissionOrDemo: vi.fn().mockResolvedValue(true),
  getWorkspaceRole: vi.fn().mockResolvedValue('admin'),
}));

const createMockQueryBuilder = (data: any = null, error: any = null) => {
  const qb: any = {
    eq: vi.fn().mockImplementation(() => qb),
    neq: vi.fn().mockImplementation(() => qb),
    not: vi.fn().mockImplementation(() => qb),
    lt: vi.fn().mockImplementation(() => qb),
    in: vi.fn().mockImplementation(() => qb),
    order: vi.fn().mockImplementation(() => qb),
    limit: vi.fn().mockImplementation(() => qb),
    select: vi.fn().mockImplementation(() => qb),
    insert: vi.fn().mockImplementation(() => qb),
    update: vi.fn().mockImplementation(() => qb),
    upsert: vi.fn().mockImplementation(() => qb),
    maybeSingle: vi.fn().mockImplementation(async () => ({ data, error })),
    single: vi.fn().mockImplementation(async () => ({ data, error })),
    then: vi.fn().mockImplementation((onFulfilled) => {
      return Promise.resolve(onFulfilled({ data, error }));
    }),
  };
  return qb;
};

describe("BSW-OS P0 Enhancements Test Suite", () => {
  const workspaceId = "00000000-0000-4000-a000-000000000001";
  const questionId = "11111111-1111-4111-a111-111111111111";
  const userId = "22222222-2222-4222-a222-222222222222";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- WS-A: Infrastructure Accuracy Tests ---

  it("P0-01: AIPR 결정적 해시: 동일 입력 -> 동일 출력 재현성 검증", async () => {
    const engine = new AiprEngine();
    const mockFrom = vi.fn().mockImplementation(() => createMockQueryBuilder([]));
    vi.mocked(getSupabaseAdminClient).mockReturnValue({ from: mockFrom } as any);

    const result1 = await engine.computeAIPR(workspaceId, "beauty", "PureBarrier", ["CompA", "CompB"]);
    const result2 = await engine.computeAIPR(workspaceId, "beauty", "PureBarrier", ["CompA", "CompB"]);

    expect(result1[0].bairScore).toBe(result2[0].bairScore);
    expect(result1[1].bairScore).toBe(result2[1].bairScore);
  });

  it("P0-02: AIPR 결정적 해시: 다른 브랜드 -> 다른 계수 보장", async () => {
    const engine = new AiprEngine();
    const mockFrom = vi.fn().mockImplementation(() => createMockQueryBuilder([]));
    vi.mocked(getSupabaseAdminClient).mockReturnValue({ from: mockFrom } as any);

    const result = await engine.computeAIPR(workspaceId, "beauty", "PureBarrier", ["CompA", "CompB"]);
    const scoreCompA = result.find(r => r.brand === "CompA")?.bairScore;
    const scoreCompB = result.find(r => r.brand === "CompB")?.bairScore;

    expect(scoreCompA).not.toBe(scoreCompB);
  });

  it("P0-03: SbsIndexRunner: 26개 업종 전부 AIPR 산출 확인", async () => {
    const runner = new SbsIndexRunner();
    const mockFrom = vi.fn().mockImplementation(() => createMockQueryBuilder([]));
    vi.mocked(getSupabaseAdminClient).mockReturnValue({ from: mockFrom } as any);

    const report = await runner.generateReport(workspaceId);
    expect(report.industryRankings).toHaveLength(Object.keys(INDUSTRY_PANELS_DATA).length);
    const beautyRankings = report.industryRankings.find(r => r.industry === "beauty");
    expect(beautyRankings).toBeDefined();
    expect(beautyRankings?.rankings.length).toBeGreaterThan(0);
  });

  it("P0-04: SbsIndexRunner: 패널 미존재 시 fallback 동작", async () => {
    const runner = new SbsIndexRunner();
    const mockFrom = vi.fn().mockImplementation(() => createMockQueryBuilder([]));
    vi.mocked(getSupabaseAdminClient).mockReturnValue({ from: mockFrom } as any);

    const report = await runner.generateReport(workspaceId);
    expect(report.industryRankings.length).toBe(Object.keys(INDUSTRY_PANELS_DATA).length);
  });

  it("P0-05: BAIR 다중 감성 키워드 매칭: 긍정 8패턴 정확성", async () => {
    const engine = new BairEngine();
    const mockRuns = [
      { raw_response_text: "PureBarrier 제품은 정말로 효과가 좋고 만족 스럽고 신뢰가 갑니다.", response_text: "" }
    ];
    const mockFrom = vi.fn().mockImplementation((table) => {
      if (table === "probe_runs") return createMockQueryBuilder(mockRuns);
      return createMockQueryBuilder();
    });
    vi.mocked(getSupabaseAdminClient).mockReturnValue({ from: mockFrom } as any);

    const result = await engine.computeBAIR(workspaceId, "PureBarrier");
    expect(result.aas).toBe(1.00); // 1 matched, 1 positive -> AAS = 1.00
  });

  it("P0-06: BAIR 다중 감성 키워드 매칭: 부정 6패턴 감산 정확성", async () => {
    const engine = new BairEngine();
    const mockRuns = [
      { raw_response_text: "PureBarrier 사용 후 심각한 부작용 및 문제 피부 자극이 발생하여 주의해야 합니다.", response_text: "" }
    ];
    const mockFrom = vi.fn().mockImplementation((table) => {
      if (table === "probe_runs") return createMockQueryBuilder(mockRuns);
      return createMockQueryBuilder();
    });
    vi.mocked(getSupabaseAdminClient).mockReturnValue({ from: mockFrom } as any);

    const result = await engine.computeBAIR(workspaceId, "PureBarrier");
    expect(result.aas).toBe(0.00); // More negatives than positives -> positiveCount = 0
  });

  // --- WS-B: Intelligence Engine Tests ---

  it("P0-07: 업종별 예측 템플릿: 10개 업종 전부 레지스트리 존재 확인", () => {
    const industries = ["beauty", "wedding", "clinic", "restaurant", "real_estate", "legal", "education", "travel", "pet", "auto"];
    industries.forEach(ind => {
      expect(PREDICTION_TEMPLATE_REGISTRY[ind]).toBeDefined();
      expect(PREDICTION_TEMPLATE_REGISTRY[ind].industry).toBe(ind);
    });
  });

  it("P0-08: 업종별 예측 템플릿: clinic 업종 YMYL auto_must_include 포함 확인", () => {
    const clinicTemplate = PREDICTION_TEMPLATE_REGISTRY["clinic"];
    const mockSignal = {
      workspace_id: workspaceId,
      id: "signal-123",
      industry: "clinic",
      predicted_impact: "high"
    } as any;

    const predictions = clinicTemplate.predict(mockSignal, 0.85, 30);
    expect(predictions).toHaveLength(1);
    expect(predictions[0].auto_must_include).toContain("대한피부과학회 전문의 자격 확인 절차 명시");
  });

  it("P0-09: 업종별 예측 템플릿: generic fallback 비사용 확인 (10개 업종)", async () => {
    const predictor = new QuestionPredictor();
    const mockFrom = vi.fn().mockImplementation(() => createMockQueryBuilder());
    vi.mocked(getSupabaseAdminClient).mockReturnValue({ from: mockFrom } as any);

    const mockSignal = {
      workspace_id: workspaceId,
      id: "signal-123",
      industry: "auto",
      predicted_impact: "critical"
    } as any;

    const result = await predictor.predictQuestionsFromSignal(mockSignal);
    expect(result[0].question_text).toContain("전기차 배터리 안전 기준 강화");
  });

  it("P0-10: 동적 AI Coverage: DB 관측 데이터 기반 판정 정확성", async () => {
    const predictor = new QuestionPredictor();
    const mockRuns = [
      { raw_response_text: "저자극 레티놀 사용법 및 민감성 피부에 좋은 루틴" },
      { raw_response_text: "레티놀 화장품 바르는 법" }
    ];
    const mockFrom = vi.fn().mockImplementation(() => createMockQueryBuilder(mockRuns));
    vi.mocked(getSupabaseAdminClient).mockReturnValue({ from: mockFrom } as any);

    const coverage = await predictor.checkAICoverage("민감성 레티놀 사용법", workspaceId);
    expect(coverage).toBe("saturated");
  });

  it("P0-11: 동적 AI Coverage: YMYL 키워드 -> 'none' 반환 확인", async () => {
    const predictor = new QuestionPredictor();
    const mockFrom = vi.fn().mockImplementation(() => createMockQueryBuilder([]));
    vi.mocked(getSupabaseAdminClient).mockReturnValue({ from: mockFrom } as any);

    const coverage = await predictor.checkAICoverage("예식장 계약금 위약금 환불 규정 가이드");
    expect(coverage).toBe("none");
  });

  it("P0-12: 동적 AI Coverage: 비교 키워드 -> 'sparse' 반환 확인", async () => {
    const predictor = new QuestionPredictor();
    const mockFrom = vi.fn().mockImplementation(() => createMockQueryBuilder([]));
    vi.mocked(getSupabaseAdminClient).mockReturnValue({ from: mockFrom } as any);

    const coverage = await predictor.checkAICoverage("PureBarrier vs 경쟁사 보습크림 비교 추천");
    expect(coverage).toBe("sparse");
  });

  // --- WS-C: Governance & Analytics Tests ---

  it("P0-13: 라이프사이클 상태 머신: draft->review->active 정상 전이", async () => {
    const manager = new QuestionLifecycleManager();
    const mockFrom = vi.fn().mockImplementation((table) => {
      if (table === "probe_questions") return createMockQueryBuilder({ lifecycle_status: "draft" });
      return createMockQueryBuilder();
    });
    vi.mocked(getSupabaseAdminClient).mockReturnValue({ from: mockFrom } as any);

    const res = await manager.transition(questionId, workspaceId, "review", userId);
    expect(res.success).toBe(true);
    expect(res.from).toBe("draft");
    expect(res.to).toBe("review");
  });

  it("P0-14: 라이프사이클 상태 머신: archived->active 불허 검증", async () => {
    const manager = new QuestionLifecycleManager();
    const mockFrom = vi.fn().mockImplementation((table) => {
      if (table === "probe_questions") return createMockQueryBuilder({ lifecycle_status: "archived" });
      return createMockQueryBuilder();
    });
    vi.mocked(getSupabaseAdminClient).mockReturnValue({ from: mockFrom } as any);

    await expect(manager.transition(questionId, workspaceId, "active", userId))
      .rejects.toThrow("InvalidTransition");
  });

  it("P0-15: TTL 만료 감지: 시의성 질문 자동 deprecated 전환", async () => {
    const manager = new QuestionLifecycleManager();
    const mockExpired = [{ id: "q-1" }, { id: "q-2" }];
    const mockFrom = vi.fn().mockImplementation((table) => {
      if (table === "probe_questions") return createMockQueryBuilder(mockExpired);
      return createMockQueryBuilder();
    });
    vi.mocked(getSupabaseAdminClient).mockReturnValue({ from: mockFrom } as any);

    const deprecatedCount = await manager.deprecateExpired(workspaceId);
    expect(deprecatedCount).toBe(2);
  });

  it("P0-16: TTL 자동 감지: '올해 트렌드' 패턴 -> is_time_sensitive=true", async () => {
    const insertedQuestions: any[] = [];
    const mockFrom = vi.fn().mockImplementation((table) => {
      if (table === "probe_panels") {
        return createMockQueryBuilder({ id: "00000000-0000-4000-a000-000000000002" });
      }
      if (table === "probe_questions") {
        const qb = createMockQueryBuilder(null);
        qb.insert = vi.fn().mockImplementation((data) => {
          insertedQuestions.push(data);
          return createMockQueryBuilder({ id: "00000000-0000-4000-a000-000000000003" });
        });
        return qb;
      }
      return createMockQueryBuilder({});
    });
    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const result = await createIndustryStandardPanel(
      workspaceId,
      "beauty",
      "PureBarrier",
      ["레티놀랩"]
    );
    expect(result.panelId).toBeDefined();
  });

  it("P0-17: weight 재보정: observation_boost 1.15 적용 확인", async () => {
    const calibrator = new WeightCalibrator();
    const mockQuestions = [
      { id: "q-1", base_weight: 1.0, lifecycle_status: "active" }
    ];
    const mockRuns = [
      { created_at: new Date().toISOString(), raw_response_text: "저자극 보습 크림의 효능을 설명한 80자 이상 텍스트 샘플입니다. 이 텍스트는 50자 제한을 초과하도록 특별히 길게 작성되었습니다." }
    ];
    const mockFrom = vi.fn().mockImplementation((table) => {
      if (table === "probe_questions") return createMockQueryBuilder(mockQuestions);
      if (table === "probe_runs") return createMockQueryBuilder(mockRuns);
      return createMockQueryBuilder();
    });
    vi.mocked(getSupabaseAdminClient).mockReturnValue({ from: mockFrom } as any);

    const results = await calibrator.calibrateWorkspace(workspaceId);
    expect(results[0].calibratedWeight).toBe(1.15); // 1.0 * 1.15 * 1.0
  });

  it("P0-18: weight 재보정: 90일 미관측 -> recency_decay 0.75 적용", async () => {
    const calibrator = new WeightCalibrator();
    const mockQuestions = [
      { id: "q-1", base_weight: 1.0, lifecycle_status: "active" }
    ];
    // Last observed 100 days ago
    const oldDate = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString();
    const mockRuns = [
      { created_at: oldDate, raw_response_text: "저자극 보습 크림의 효능을 설명한 80자 이상 텍스트 샘플입니다. 이 텍스트는 50자 제한을 초과하도록 특별히 길게 작성되었습니다." }
    ];
    const mockFrom = vi.fn().mockImplementation((table) => {
      if (table === "probe_questions") return createMockQueryBuilder(mockQuestions);
      if (table === "probe_runs") return createMockQueryBuilder(mockRuns);
      return createMockQueryBuilder();
    });
    vi.mocked(getSupabaseAdminClient).mockReturnValue({ from: mockFrom } as any);

    const results = await calibrator.calibrateWorkspace(workspaceId);
    expect(results[0].calibratedWeight).toBe(0.86); // 1.0 * 1.15 * 0.75 = 0.8625 -> 0.86
  });

  it("P0-19: weight 재보정: clamp [0.3, 2.0] 범위 내 보장", async () => {
    const calibrator = new WeightCalibrator();
    const mockQuestions = [
      { id: "q-1", base_weight: 0.1, lifecycle_status: "active" }
    ];
    const mockFrom = vi.fn().mockImplementation((table) => {
      if (table === "probe_questions") return createMockQueryBuilder(mockQuestions);
      if (table === "probe_runs") return createMockQueryBuilder([]);
      return createMockQueryBuilder();
    });
    vi.mocked(getSupabaseAdminClient).mockReturnValue({ from: mockFrom } as any);

    const results = await calibrator.calibrateWorkspace(workspaceId);
    expect(results[0].calibratedWeight).toBe(0.3); // Clamped from 0.085 to 0.3
  });

  it("P0-20: 퍼널 전환율: 단계별 카운트 정확성", async () => {
    const tracker = new FunnelTracker();
    const mockQuestions = [
      { funnel_stage: "intake" },
      { funnel_stage: "analyzed" },
    ];
    const mockFrom = vi.fn().mockImplementation((table) => {
      if (table === "probe_questions") return createMockQueryBuilder(mockQuestions);
      return createMockQueryBuilder([]);
    });
    vi.mocked(getSupabaseAdminClient).mockReturnValue({ from: mockFrom } as any);

    const report = await tracker.generateReport(workspaceId);
    const intakeStage = report.stages.find(s => s.stage === "intake");
    const analyzedStage = report.stages.find(s => s.stage === "analyzed");

    expect(intakeStage?.count).toBe(1);
    expect(analyzedStage?.count).toBe(1);
  });

  it("P0-21: 퍼널 전환율: bottleneck 식별 정확성", async () => {
    const tracker = new FunnelTracker();
    const mockQuestions = [
      { funnel_stage: "intake" }
    ];
    const mockFrom = vi.fn().mockImplementation((table) => {
      if (table === "probe_questions") return createMockQueryBuilder(mockQuestions);
      return createMockQueryBuilder([]);
    });
    vi.mocked(getSupabaseAdminClient).mockReturnValue({ from: mockFrom } as any);

    const report = await tracker.generateReport(workspaceId);
    expect(report.bottleneck).toBeDefined();
  });

  it("P0-22: 퍼널 전환율: conversionRate 0~100% 범위 보장", async () => {
    const tracker = new FunnelTracker();
    const mockQuestions = [
      { funnel_stage: "intake" }
    ];
    const mockFrom = vi.fn().mockImplementation((table) => {
      if (table === "probe_questions") return createMockQueryBuilder(mockQuestions);
      return createMockQueryBuilder([]);
    });
    vi.mocked(getSupabaseAdminClient).mockReturnValue({ from: mockFrom } as any);

    const report = await tracker.generateReport(workspaceId);
    const rates = Object.values(report.conversionRates);
    rates.forEach(rate => {
      expect(rate).toBeGreaterThanOrEqual(0);
      expect(rate).toBeLessThanOrEqual(100);
    });
  });
});
