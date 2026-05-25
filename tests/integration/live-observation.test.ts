import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getObservationProvider } from '../../lib/ai/observation-provider';
import { getSignalMiningProvider } from '../../lib/ai/signal-mining-provider';
import { runAIResponseProbeAgent } from '../../lib/ai/observatory_agents';
import { getSupabaseAdminClient } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => ({
  getSupabaseAdminClient: vi.fn(),
}));

// A highly robust Promise-compatible Supabase query mock builder
const createMockQueryBuilder = (data: any = null) => {
  const qb: any = {
    eq: vi.fn().mockImplementation(() => qb),
    select: vi.fn().mockImplementation(() => qb),
    delete: vi.fn().mockImplementation(() => qb),
    insert: vi.fn().mockImplementation(() => qb),
    update: vi.fn().mockImplementation(() => qb),
    order: vi.fn().mockImplementation(() => qb),
    limit: vi.fn().mockImplementation(() => qb),
    single: vi.fn().mockImplementation(() => createMockQueryBuilder(data)),
    maybeSingle: vi.fn().mockImplementation(() => createMockQueryBuilder(data)),
    // Satisfy await thenable
    then: vi.fn().mockImplementation((onFulfilled) => {
      return Promise.resolve(onFulfilled({ data, error: null }));
    }),
  };
  return qb;
};

describe('Live Observation & Signal Mining integration tests (Phase 3)', () => {
  const originalMode = process.env.AI_PROVIDER_MODE;
  const workspaceId = "00000000-0000-0000-0000-000000000001";

  beforeEach(() => {
    process.env.AI_PROVIDER_MODE = 'mock';
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.AI_PROVIDER_MODE = originalMode;
  });

  it('should return MockObservationProvider by default', async () => {
    const provider = getObservationProvider('Google SGE');
    const result = await provider.queryEngine('how to use retinol?', 'Google SGE');
    expect(result.rawResponseText).toContain('PureBarrier Retinol');
    expect(result.engineName).toBe('Google SGE');
  });

  it('should return MockSignalProvider by default', async () => {
    const provider = getSignalMiningProvider();
    const signals = await provider.mineSignals('PureBarrier.com');
    expect(signals.length).toBe(2);
    expect(signals[0].query).toContain('레티놀');
    expect(signals[0].intent).toBe('informational');
  });

  it('should fallback to mock crawler fixtures in runAIResponseProbeAgent when fixture name passed', async () => {
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === "agent_runs") {
        return createMockQueryBuilder({ id: "agent-run-1111", status: "candidate" });
      }
      if (table === "ai_observation_runs") {
        return createMockQueryBuilder({ id: "obs-run-2222", probe_panel_id: "panel-3333" });
      }
      if (table === "probe_questions") {
        // Return array of questions (essential!)
        return createMockQueryBuilder([
          { id: "q-4444", question_text: "Test?", target_keyword: "PureBarrier" }
        ]);
      }
      if (table === "probe_runs") {
        return createMockQueryBuilder({ id: "pr-5555" });
      }
      return createMockQueryBuilder();
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    // Run probe agent in mock fixture mode
    const result = await runAIResponseProbeAgent(workspaceId, "obs-run-2222", 'success_fixture');
    expect(result.probeRunsCount).toBe(1);
    expect(result.agentRunId).toBe("agent-run-1111");
  });
});
