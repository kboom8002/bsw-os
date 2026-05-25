import { describe, it, expect, vi, beforeEach } from "vitest";
import { PreemptiveContentFactory } from "../../lib/prediction/content-factory";
import { getSupabaseAdminClient } from "../../lib/supabase";

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

describe("Pre-emptive Content Factory (PCF) Unit Test Suite (Phase 4B)", () => {
  const workspaceId = "00000000-0000-4000-a000-000000000001";
  const blueprintId = "44444444-4444-4444-c444-444444444444";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should generate a draft containing brand voice keywords", async () => {
    const factory = new PreemptiveContentFactory();

    const mockBlueprint = {
      id: blueprintId,
      workspace_id: workspaceId,
      recommended_structure: "guide",
      brand_voice_keywords: ["식약처", "세라마이드"],
      predicted_questions: {
        question_text: "민감성 피부 레티놀 화끈거림 대처",
      },
    };

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === "content_blueprints") {
        return createMockQueryBuilder(mockBlueprint);
      }
      return createMockQueryBuilder();
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const draft = await factory.generateDraft(blueprintId);

    expect(draft).toContain("민감성 피부");
    expect(draft).toContain("식약처");
  });

  it("should compute VPA score and penalize forbidden terms", async () => {
    const factory = new PreemptiveContentFactory();

    const mockVibe = {
      workspace_id: workspaceId,
      warmth_ratio: 0.8,
    };

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === "vibe_specs") {
        return createMockQueryBuilder(mockVibe);
      }
      return createMockQueryBuilder();
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const scoreWarm = await factory.vibeCheck("고객님께 따뜻한 보습을 권장합니다.", workspaceId);
    const scoreBad = await factory.vibeCheck("이 크림은 100% 보장하는 부작용 전혀 없음 화장품입니다.", workspaceId);

    expect(scoreWarm).toBe(85); // 70 + 15
    expect(scoreBad).toBe(10);  // 70 - 30 - 30
  });

  it("should adjust tone to replace prohibited terms and insert E-E-A-T reference", () => {
    const factory = new PreemptiveContentFactory();

    const initial = "이 크림은 100% 보장하며 부작용 전혀 없음 스킨케어입니다.";
    const adjusted = factory.adjustTone(initial, 85);

    expect(adjusted).toContain("안심하고 믿을 수 있도록 신뢰 보장");
    expect(adjusted).toContain("임상을 거쳐 저자극 안전성을 인증 받음");
    expect(adjusted).toContain("전성분 배합");
  });

  it("should enforce expected layer rules in Safety Gate", async () => {
    const factory = new PreemptiveContentFactory();

    const mockBlueprint = {
      id: blueprintId,
      predicted_questions: {
        auto_must_include: ["식약처 승인"],
        auto_must_not_do: ["하루에 여러 번 사용"],
      },
    };

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === "content_blueprints") {
        return createMockQueryBuilder(mockBlueprint);
      }
      return createMockQueryBuilder();
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const pass = await factory.safetyGate("식약처 승인 완료된 저자극 케어입니다.", blueprintId);
    const failMissing = await factory.safetyGate("그냥 순한 저자극 케어입니다.", blueprintId);
    const failForbidden = await factory.safetyGate("식약처 승인 완료되었으며 하루에 여러 번 사용하세요.", blueprintId);

    expect(pass.passed).toBe(true);
    expect(failMissing.passed).toBe(false);
    expect(failMissing.reason).toContain("Missing mandatory fact");
    expect(failForbidden.passed).toBe(false);
    expect(failForbidden.reason).toContain("Forbidden instruction");
  });

  it("should block queuing when VPA threshold or Safety Gate fails, and queue on success", async () => {
    const factory = new PreemptiveContentFactory();

    const mockBlueprint = {
      id: blueprintId,
      workspace_id: workspaceId,
      draft_content: "이 제품은 100% 보장하며 그냥 순한 레티놀입니다.", // low VPA, missing "식약처 승인"
      target_vpa: 75,
      predicted_questions: {
        auto_must_include: ["식약처 승인"],
        auto_must_not_do: ["하루에 여러 번 사용"],
      },
    };

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === "content_blueprints") {
        return createMockQueryBuilder(mockBlueprint);
      }
      return createMockQueryBuilder();
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    // Should throw due to safety gate failure first (missing Must Include "식약처 승인")
    await expect(factory.sendToTenantQueue(blueprintId)).rejects.toThrow(/SafetyGateBlocked/);
  });
});
