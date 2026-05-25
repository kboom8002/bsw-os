import { describe, it, expect, vi, beforeEach } from "vitest";
import { KWeddingHubCollector } from "../lib/prediction/signal-collectors/kweddinghub-collector";

describe("KWeddingHubCollector", () => {
  const workspaceId = "00000000-0000-4000-a000-000000000001";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("✅ Happy: KWeddingHub API 정상 호출 → EmergenceSignal 형태로 매핑 성공", async () => {
    const mockSignals = [
      {
        raw_text: "[고빈도 transactional 질문] 웨딩홀 대관료 추가금 범위는?",
        signal_type: "community_question",
        predicted_impact: "high",
        metadata: { intent: "transactional", harvested_count: 5 },
      },
    ];

    // Global fetch mock
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, data: mockSignals }),
    });
    global.fetch = mockFetch;

    const collector = new KWeddingHubCollector();
    const signals = await collector.collect(workspaceId, "wedding");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(signals).toHaveLength(1);
    expect(signals[0].source_type).toBe("kweddinghub");
    expect(signals[0].predicted_impact).toBe("high");
    expect(signals[0].raw_text).toContain("웨딩홀 대관료 추가금 범위");
    expect(signals[0].ai_analysis.source_channel).toBe("community_question");
  });

  it("⚠️ Edge: 웨딩 업종이 아닌 경우 빈 배열 반환", async () => {
    const collector = new KWeddingHubCollector();
    const signals = await collector.collect(workspaceId, "beauty");
    expect(signals).toEqual([]);
  });

  it("❌ Error: API 에러 응답 수신 시 빈 배열 반환하고 soft-fail", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "Internal Server Error",
    });
    global.fetch = mockFetch;

    const collector = new KWeddingHubCollector();
    const signals = await collector.collect(workspaceId, "wedding");

    expect(signals).toEqual([]);
  });
});
