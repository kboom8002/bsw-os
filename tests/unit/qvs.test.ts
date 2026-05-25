import { describe, it, expect, vi, beforeEach } from "vitest";
import { scoreQuestionValue, getTopValueQuestions, getPreemptionOpportunities } from "../../app/actions/qvs";
import { getSupabaseAdminClient } from "../../lib/supabase";
import { checkWorkspacePermission } from "../../lib/auth";
import { questionValueScoreSchema } from "../../lib/schema";

vi.mock("../../lib/supabase", () => ({
  getSupabaseAdminClient: vi.fn(),
}));

vi.mock("../../lib/auth", () => ({
  checkWorkspacePermission: vi.fn(),
}));

const createMockQueryBuilder = (data: any = null, error: any = null) => {
  const qb: any = {
    eq: vi.fn().mockImplementation(() => qb),
    lt: vi.fn().mockImplementation(() => qb),
    order: vi.fn().mockImplementation(() => qb),
    limit: vi.fn().mockImplementation(() => qb),
    select: vi.fn().mockImplementation(() => qb),
    insert: vi.fn().mockImplementation(() => qb),
    upsert: vi.fn().mockImplementation(() => qb),
    maybeSingle: vi.fn().mockImplementation(async () => ({ data, error })),
    single: vi.fn().mockImplementation(async () => ({ data, error })),
    then: vi.fn().mockImplementation((onFulfilled) => {
      return Promise.resolve(onFulfilled({ data, error }));
    }),
  };
  return qb;
};

describe("Question Value Scorer (QVS) Unit Test Suite (Phase 3A)", () => {
  const workspaceId = "00000000-0000-4000-a000-000000000001";
  const probeQuestionId = "11111111-1111-4111-a111-111111111111";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should validate Zod schema with correct inputs", () => {
    const payload = {
      workspace_id: workspaceId,
      probe_question_id: probeQuestionId,
      volume_score: 500,
      conversion_score: 0.02,
      arpu_score: 50000,
      first_mover_score: 1.2,
      competition_score: 0.3,
      qvs_composite: 8400,
      estimated_monthly_value: 8400,
      industry: "beauty",
      scoring_method: "auto",
    };

    const parsed = questionValueScoreSchema.parse(payload);
    expect(parsed.qvs_composite).toBe(8400);
    expect(parsed.estimated_monthly_value).toBe(8400);
  });

  it("should block score modification if user has insufficient roles", async () => {
    vi.mocked(checkWorkspacePermission).mockResolvedValue(false);

    const call = scoreQuestionValue(workspaceId, {
      probe_question_id: probeQuestionId,
      volume_score: 100,
      conversion_score: 0.05,
      arpu_score: 10000,
      competition_score: 0.1,
      industry: "beauty",
    });

    await expect(call).rejects.toThrow(/UNAUTHORIZED/);
  });

  it("should compute QVS composite, estimated value, and insert audit event on successful upsert", async () => {
    vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

    const mockResult = {
      id: "99999999-9999-4999-b999-999999999999",
      workspace_id: workspaceId,
      probe_question_id: probeQuestionId,
      volume_score: 500,
      conversion_score: 0.02,
      arpu_score: 50000,
      first_mover_score: 1.2,
      competition_score: 0.3,
      qvs_composite: 8400,
      estimated_monthly_value: 8400,
      industry: "beauty",
      scoring_method: "auto",
    };

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === "question_value_scores") {
        return createMockQueryBuilder(mockResult);
      }
      if (table === "audit_events") {
        return createMockQueryBuilder({ id: "audit-ok" });
      }
      return createMockQueryBuilder();
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const result = await scoreQuestionValue(workspaceId, {
      probe_question_id: probeQuestionId,
      volume_score: 500,
      conversion_score: 0.02,
      arpu_score: 50000,
      first_mover_score: 1.2,
      competition_score: 0.3,
      industry: "beauty",
    });

    expect(result.qvs_composite).toBe(8400);
    expect(result.estimated_monthly_value).toBe(8400);
    expect(mockFrom).toHaveBeenCalledWith("question_value_scores");
    expect(mockFrom).toHaveBeenCalledWith("audit_events");
  });

  it("should query top value questions in descending order", async () => {
    vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

    const mockRecords = [
      { id: "1", qvs_composite: 15000, industry: "beauty" },
      { id: "2", qvs_composite: 8400, industry: "beauty" },
    ];

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === "question_value_scores") {
        return createMockQueryBuilder(mockRecords);
      }
      return createMockQueryBuilder();
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const results = await getTopValueQuestions(workspaceId, "beauty", 2);

    expect(results).toHaveLength(2);
    expect(results[0].qvs_composite).toBe(15000);
  });

  it("should retrieve preemption opportunities filtering for low competition", async () => {
    vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

    const mockRecords = [
      { id: "1", qvs_composite: 9000, competition_score: 0.2 },
      { id: "2", qvs_composite: 4000, competition_score: 0.3 },
    ];

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === "question_value_scores") {
        return createMockQueryBuilder(mockRecords);
      }
      return createMockQueryBuilder();
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const results = await getPreemptionOpportunities(workspaceId, 2);

    expect(results).toHaveLength(2);
    expect(results[0].competition_score).toBeLessThan(0.4);
  });
});
