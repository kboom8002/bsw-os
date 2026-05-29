import { describe, it, expect, vi, beforeEach } from "vitest";
import { BairEngine } from "../../lib/sbs-index/bair";
import { AiprEngine } from "../../lib/sbs-index/aipr";
import { KaiviEngine } from "../../lib/sbs-index/kaivi";
import { SbsIndexRunner } from "../../lib/sbs-index/index-runner";
import { SBSBroadcastCollector } from "../../lib/prediction/signal-collectors/sbs-broadcast-collector";
import { getSupabaseAdminClient } from "../../lib/supabase";

vi.mock("../../lib/supabase", () => ({
  getSupabaseAdminClient: vi.fn(),
}));

const createMockQueryBuilder = (data: any = null, error: any = null) => {
  const qb: any = {
    eq: vi.fn().mockImplementation(() => qb),
    limit: vi.fn().mockImplementation(() => qb),
    order: vi.fn().mockImplementation(() => qb),
    select: vi.fn().mockImplementation(() => qb),
    maybeSingle: vi.fn().mockImplementation(async () => ({ data, error })),
    single: vi.fn().mockImplementation(async () => ({ data, error })),
    then: vi.fn().mockImplementation((onFulfilled) => {
      return Promise.resolve(onFulfilled({ data, error }));
    }),
  };
  return qb;
};

describe("SBS Joint Index & Broadcast 연동 Test Suite (Phase 5)", () => {
  const workspaceId = "00000000-0000-4000-a000-000000000001";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should compute BAIR (Brand AI Reputation Index) correctly using standard formula", async () => {
    const engine = new BairEngine();

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === "probe_runs") {
        return createMockQueryBuilder([]); // Falls back to standard statistics
      }
      return createMockQueryBuilder();
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const result = await engine.computeBAIR(workspaceId, "PureBarrier");

    expect(result.brand).toBe("PureBarrier");
    expect(result.bair).toBe(65.67); // 55 * 0.82 * (1 + 0.3) * 1.12 = 65.6768 (floating representation 65.67)
  });

  it("should compute AI Trust Index (AITI) correctly with evidence match rate and unsafe wording penalties", async () => {
    const engine = new BairEngine();

    const mockEvidence = [
      { verification_status: "verified" },
      { verification_status: "verified" },
      { verification_status: "pending" }, // 2/3 = 66.6% match rate
    ];

    const mockFindings = [
      { id: "find-1" }, // penalty: 1 * 5 = 5 points
    ];

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === "brand_truth_evidence") {
        return createMockQueryBuilder(mockEvidence);
      }
      if (table === "unsafe_wording_findings") {
        return createMockQueryBuilder(mockFindings);
      }
      return createMockQueryBuilder();
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const aiti = await engine.computeAITI(workspaceId);

    expect(aiti).toBe(61.67); // (66.67) - 5 = 61.67
  });

  it("should rank competitor brands inside AIPR sorted leaderboards descending", async () => {
    const engine = new AiprEngine();

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      return createMockQueryBuilder([]);
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const leaderboard = await engine.computeAIPR(workspaceId, "beauty", "PureBarrier", ["CompetitorA", "CompetitorB"]);

    expect(leaderboard).toHaveLength(3);
    expect(leaderboard[0].rank).toBe(1);
    expect(leaderboard[0].bairScore).toBeGreaterThanOrEqual(leaderboard[1].bairScore);
    expect(leaderboard[1].bairScore).toBeGreaterThanOrEqual(leaderboard[2].bairScore);
  });

  it("should compute KAIVI combining industry averages and semantic preparedness average", async () => {
    const engine = new KaiviEngine();

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      return createMockQueryBuilder([]);
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const kaivi = await engine.computeKAIVI(workspaceId);

    expect(kaivi).toBeGreaterThan(0);
    expect(kaivi).toBeLessThanOrEqual(100);
  });

  it("should generate full joint SBS Index Reports via index runner", async () => {
    const runner = new SbsIndexRunner();

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      return createMockQueryBuilder([]);
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const report = await runner.generateReport(workspaceId);

    expect(report.kaivi).toBeDefined();
    expect(report.aiti).toBeDefined();
    expect(report.beautyAipr.length).toBeGreaterThan(0);
    expect(report.weddingAipr.length).toBeGreaterThan(0);
  });

  it("should collect upcoming scheduled TV trends and return standardized emergence signals", async () => {
    const collector = new SBSBroadcastCollector();

    const beautySignals = await collector.collect(workspaceId, "beauty");
    const weddingSignals = await collector.collect(workspaceId, "wedding");

    expect(beautySignals).toHaveLength(1);
    expect(beautySignals[0].source_type).toBe("broadcast");
    expect(beautySignals[0].predicted_impact).toBe("high");
    expect(beautySignals[0].ai_analysis.sbs_program_name).toBe("SBS 스페셜");

    expect(weddingSignals).toHaveLength(1);
    expect(weddingSignals[0].source_type).toBe("broadcast");
    expect(weddingSignals[0].predicted_impact).toBe("critical");
    expect(weddingSignals[0].ai_analysis.sbs_program_name).toBe("SBS 뉴스토리");
  });
});
