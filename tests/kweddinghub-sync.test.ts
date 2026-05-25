import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSupabaseAdminClient } from "../lib/supabase";
import { checkWorkspacePermission } from "../lib/auth";
import {
  pushPredictionsToKWeddingHub,
  pullFeedbackFromKWeddingHub,
  pullRealMetricsFromKWeddingHub,
} from "../app/actions/kweddinghub-sync";

vi.mock("../lib/supabase", () => ({
  getSupabaseAdminClient: vi.fn(),
}));

vi.mock("../lib/auth", () => ({
  checkWorkspacePermission: vi.fn(),
}));

const createMockQueryBuilder = (data: any = null, error: any = null) => {
  const qb: any = {
    eq: vi.fn().mockImplementation(() => qb),
    select: vi.fn().mockImplementation(() => qb),
    insert: vi.fn().mockImplementation(() => qb),
    update: vi.fn().mockImplementation(() => qb),
    order: vi.fn().mockImplementation(() => qb),
    limit: vi.fn().mockImplementation(() => qb),
    maybeSingle: vi.fn().mockImplementation(async () => ({ data, error })),
    single: vi.fn().mockImplementation(async () => ({ data, error })),
    then: vi.fn().mockImplementation((onFulfilled) => {
      return Promise.resolve(onFulfilled({ data, error }));
    }),
  };
  return qb;
};

describe("kweddinghub-sync", () => {
  const workspaceId = "00000000-0000-4000-a000-000000000001";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkWorkspacePermission).mockResolvedValue(true); // Default authorized
  });

  it("✅ Happy: pushPredictionsToKWeddingHub 정상 실행 시 예측 데이터를 KWeddingHub로 전송 성공", async () => {
    const mockPredictions = [
      {
        id: "22222222-2222-4222-a222-222222222222",
        question_text: "스튜디오 평균 촬영 대관비용 가이드",
        predicted_intent: "transactional",
        predicted_volume: "medium",
        confidence: 0.85,
        first_mover_window_days: 30,
        current_ai_coverage: "none",
        auto_must_include: ["가격 구성"],
        auto_must_not_do: [],
      },
    ];

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === "predicted_questions") {
        return createMockQueryBuilder(mockPredictions);
      }
      return createMockQueryBuilder();
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, received: 1 }),
    });
    global.fetch = mockFetch;

    const result = await pushPredictionsToKWeddingHub(workspaceId);

    expect(result.ok).toBe(true);
    expect(result.count).toBe(1);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("❌ Error: 미인증 유저 요청 시 에러 투척", async () => {
    vi.mocked(checkWorkspacePermission).mockResolvedValue(false); // Unauthorized

    await expect(pushPredictionsToKWeddingHub(workspaceId)).rejects.toThrow("UNAUTHORIZED");
  });
});
