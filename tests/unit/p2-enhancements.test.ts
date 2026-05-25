import { describe, it, expect, vi, beforeEach } from "vitest";
import { INDUSTRY_PANELS_DATA, IndustryType } from "../../db/seed/industry-panels/questions-data";
import { expectedLayerSchema, predictedQuestionSchema } from "../../lib/schema";
import { PreemptiveContentFactory } from "../../lib/prediction/content-factory";
import { QuestionPredictor } from "../../lib/prediction/question-predictor";
import { getSupabaseAdminClient } from "../../lib/supabase";
import { computeDelta, logDeltaAuditEvent } from "../../lib/logging";
import { SbsIndexRunner } from "../../lib/sbs-index/index-runner";

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
    limit: vi.fn().mockImplementation(() => qb),
    maybeSingle: vi.fn().mockImplementation(async () => ({ data, error })),
    single: vi.fn().mockImplementation(async () => ({ data, error })),
    then: vi.fn().mockImplementation((onFulfilled) => {
      return Promise.resolve(onFulfilled({ data, error }));
    }),
  };
  return qb;
};

describe("BSW-OS P2 Enhancements Test Suite", () => {
  const workspaceId = "00000000-0000-4000-a000-000000000001";
  const userId = "00000000-0000-4000-a000-000000000002";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- WS-A: 15 New Industry Panels & Templates Tests ---

  it("P2-01: 25개 신규 산업군 로드 및 크기 검증", () => {
    const industries = Object.keys(INDUSTRY_PANELS_DATA);
    expect(industries).toHaveLength(25);
    
    industries.forEach((ind) => {
      const data = INDUSTRY_PANELS_DATA[ind as IndustryType];
      expect(data.questions).toHaveLength(20);
    });
  });

  it("P2-02: 신규 15개 산업군 의사결정 및 로컬 의도 검증", () => {
    const newIndustries: IndustryType[] = [
      "finance", "insurance", "healthcare", "it_software", "food_beverage",
      "fashion_ecommerce", "logistics", "energy", "hr_recruitment", "consulting_b2b",
      "manufacturing", "construction", "entertainment", "agriculture", "public_nonprofit"
    ];

    newIndustries.forEach((ind) => {
      const data = INDUSTRY_PANELS_DATA[ind];
      const decisionCount = data.questions.filter(q => q.decision_stage === "decision").length;
      const localCount = data.questions.filter(q => q.question_type === "local_intent").length;

      expect(decisionCount).toBeGreaterThanOrEqual(3);
      expect(localCount).toBeGreaterThanOrEqual(2);
    });
  });

  // --- WS-B: Expected Layer 5-Tier Upgrade Tests ---

  it("P2-03: Expected Layer 5단계 스키마 동작 검증", () => {
    const validPayload = {
      workspace_id: workspaceId,
      probe_question_id: "00000000-0000-4000-a000-000000000003",
      must_include: ["필수 단어"],
      strongly_recommended: ["E-E-A-T 강력 권장 단어"],
      should_include: ["권장 단어"],
      caution: ["주의 단어"],
      must_not_do: ["금지 단어"],
      expected_layer_version: 2
    };

    const parsed = expectedLayerSchema.parse(validPayload);
    expect(parsed.strongly_recommended).toContain("E-E-A-T 강력 권장 단어");
    expect(parsed.caution).toContain("주의 단어");
  });

  it("P2-04: 5단계 기반 Safety Gate 판정 및 감점 수학적 검증", async () => {
    const factory = new PreemptiveContentFactory();
    
    const mockBlueprint = {
      workspace_id: workspaceId,
      target_vpa: 60,
      predicted_questions: {
        auto_strongly_recommended: ["세라마이드 장벽 임상 입증"],
        auto_caution: ["부작용 전혀 없음"]
      }
    };

    const mockFrom = vi.fn().mockImplementation(() => createMockQueryBuilder(mockBlueprint));
    vi.mocked(getSupabaseAdminClient).mockReturnValue({ from: mockFrom } as any);

    // Draft contains caution expression "부작용 전혀 없음" -> should deduct 5 points
    // Includes "세라마이드" -> satisfies strongly recommended tier and avoids E-E-A-T penalty
    const draftText = "세라마이드 보습 크림은 부작용 전혀 없음 효과를 보장합니다.";
    const score = await factory.vibeCheck(draftText, workspaceId, "blueprint-123");

    // Baseline 70 - 30 (forbidden) - 5 (caution) = 35!
    expect(score).toBe(35);
  });

  // --- WS-C: Regulatory DB Sync & Global Audit Trail Tests ---

  it("P2-05: YMYL 규제 DB 조인 및 자동 Expected Layer 병합 검증", async () => {
    const predictor = new QuestionPredictor();
    const mockSignal = {
      workspace_id: workspaceId,
      id: "signal-123",
      industry: "finance",
      predicted_impact: "high"
    } as any;

    const mockRegRefs = [
      {
        id: "33333333-3333-3333-a333-333333333333",
        agency: "금융위원회",
        article_code: "금융소비자보호법 제19조",
        safety_guideline: "원금 손실 가능성 및 중도해지 시 과세 조건 명시 의무",
        forbidden_keywords: ["확정수익 보장"]
      }
    ];

    const mockFrom = vi.fn().mockImplementation((table) => {
      if (table === "ymyl_regulatory_references") {
        return createMockQueryBuilder(mockRegRefs);
      }
      return createMockQueryBuilder();
    });
    vi.mocked(getSupabaseAdminClient).mockReturnValue({ from: mockFrom } as any);

    const predictions = await predictor.predictQuestionsFromSignal(mockSignal);
    expect(predictions).toHaveLength(3);

    // The predictions must contain the auto-injected guidelines and forbidden keywords
    predictions.forEach(pred => {
      expect(pred.auto_must_include).toContain("원금 손실 가능성 및 중도해지 시 과세 조건 명시 의무");
      expect(pred.auto_caution).toContain("확정수익 보장");
    });
  });

  it("P2-06: 전사 감사 추적 Delta 계산 정밀 검증", async () => {
    const oldRecord = { id: "123", statement: "구 버전 슬로건" };
    const newRecord = { id: "123", statement: "신 버전 슬로건" };

    const delta = computeDelta(oldRecord, newRecord);
    expect(delta.statement.from).toBe("구 버전 슬로건");
    expect(delta.statement.to).toBe("신 버전 슬로건");

    const mockFrom = vi.fn().mockImplementation(() => createMockQueryBuilder());
    vi.mocked(getSupabaseAdminClient).mockReturnValue({ from: mockFrom } as any);

    await logDeltaAuditEvent(workspaceId, userId, "UPDATE_STRATEGIC_TRUTH", "brand_strategic_truths", "123", oldRecord, newRecord);
    expect(mockFrom).toHaveBeenCalledWith("audit_events");
  });

  it("P2-07: 25개 대규모 산업 통합 KAIVI 및 AIPR 스루풋 성능 측정", async () => {
    // SbsIndexRunner executes AIPR and KAIVI. Let's make sure it handles all 25 industries without errors
    const mockFrom = vi.fn().mockImplementation((table) => {
      if (table === "probe_panels") {
        const panels = Object.keys(INDUSTRY_PANELS_DATA).map((ind, i) => ({
          id: `panel-${i}`,
          industry: ind,
          panel_name: `[PureBarrier] SBS-AIPR-${ind}-v1`,
          is_active: true
        }));
        return createMockQueryBuilder(panels);
      }
      if (table === "probe_questions") {
        return createMockQueryBuilder([{ id: "q-1", weight: 1.0 }]);
      }
      if (table === "brand_entities") {
        return createMockQueryBuilder([{ id: "b-1", name: "PureBarrier" }]);
      }
      return createMockQueryBuilder([]);
    });
    vi.mocked(getSupabaseAdminClient).mockReturnValue({ from: mockFrom } as any);

    const startTime = Date.now();
    const runner = new SbsIndexRunner();
    const result = await runner.generateReport(workspaceId);
    const duration = Date.now() - startTime;

    expect(result).toBeDefined();
    expect(result.kaivi).toBeGreaterThanOrEqual(0);
    // Performance gate: must run in less than 500ms under mocked environment
    expect(duration).toBeLessThan(500);
  });
});
