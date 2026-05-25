import { describe, it, expect, vi, beforeEach } from "vitest";
import { VibeBalancedForecaster } from "../../lib/prediction/vibe-forecaster";
import { getSupabaseAdminClient } from "../../lib/supabase";
import { contentBlueprintSchema } from "../../lib/schema";

vi.mock("../../lib/supabase", () => ({
  getSupabaseAdminClient: vi.fn(),
}));

const createMockQueryBuilder = (data: any = null, error: any = null) => {
  const qb: any = {
    eq: vi.fn().mockImplementation(() => qb),
    limit: vi.fn().mockImplementation(() => qb),
    select: vi.fn().mockImplementation(() => qb),
    insert: vi.fn().mockImplementation(() => qb),
    maybeSingle: vi.fn().mockImplementation(async () => ({ data, error })),
    single: vi.fn().mockImplementation(async () => ({ data, error })),
    then: vi.fn().mockImplementation((onFulfilled) => {
      return Promise.resolve(onFulfilled({ data, error }));
    }),
  };
  return qb;
};

describe("Vibe-Balanced Super-Forecaster (VBSF) Unit Test Suite (Phase 4A)", () => {
  const workspaceId = "00000000-0000-4000-a000-000000000001";
  const predictedQuestionId = "33333333-3333-4333-b333-333333333333";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should validate Content Blueprint Zod schema successfully with correct inputs", () => {
    const payload = {
      workspace_id: workspaceId,
      predicted_question_id: predictedQuestionId,
      recommended_structure: "guide",
      recommended_schema: [{ "@context": "https://schema.org" }],
      recommended_length: { min: 300, max: 800, optimal: 500 },
      required_eeat_level: "expert",
      target_vpa: 80.00,
      tone_guidelines: ["Professional-first"],
      forbidden_expressions: ["100% 보장"],
      brand_voice_keywords: ["안전성", "임상"],
      status: "draft",
    };

    const parsed = contentBlueprintSchema.parse(payload);
    expect(parsed.recommended_structure).toBe("guide");
    expect(parsed.target_vpa).toBe(80.00);
  });

  it("should combine predicted question, vibe spec, and truths to create Content Blueprint successfully", async () => {
    const forecaster = new VibeBalancedForecaster();

    const mockQuestion = {
      id: predictedQuestionId,
      workspace_id: workspaceId,
      predicted_intent: "informational_safety",
      question_text: "민감성 피부를 위한 저자극 레티놀 사용법 및 부작용 대처법",
      auto_must_include: ["식약처 승인"],
    };

    const mockVibe = {
      workspace_id: workspaceId,
      warmth_ratio: 0.3,
      professionalism_ratio: 0.8,
    };

    const mockTruths = [
      { claim: "민감성 피부 자극 지수 0.00 범주 판정 획득" },
    ];

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === "predicted_questions") {
        return createMockQueryBuilder(mockQuestion);
      }
      if (table === "vibe_specs") {
        return createMockQueryBuilder(mockVibe);
      }
      if (table === "brand_operational_truths") {
        return createMockQueryBuilder(mockTruths);
      }
      if (table === "content_blueprints") {
        return createMockQueryBuilder({
          id: "44444444-4444-4444-c444-444444444444",
          workspace_id: workspaceId,
          predicted_question_id: predictedQuestionId,
          recommended_structure: "guide",
          target_vpa: 85.00,
          tone_guidelines: ["Professional-first"],
          brand_voice_keywords: ["민감성", "피부"],
        });
      }
      return createMockQueryBuilder();
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const blueprint = await forecaster.createContentBlueprint(workspaceId, predictedQuestionId, { targetVpa: 85.00 });

    expect(blueprint.predicted_question_id).toBe(predictedQuestionId);
    expect(blueprint.target_vpa).toBe(85.00);
    expect(blueprint.tone_guidelines[0]).toContain("Professional-first");
    expect(mockFrom).toHaveBeenCalledWith("predicted_questions");
    expect(mockFrom).toHaveBeenCalledWith("vibe_specs");
    expect(mockFrom).toHaveBeenCalledWith("brand_operational_truths");
  });
});
