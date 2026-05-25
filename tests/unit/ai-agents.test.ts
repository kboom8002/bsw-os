import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runBrandTruthExtractor } from '../../lib/ai/truth_extractor';
import { getSupabaseAdminClient } from '../../lib/supabase';
import { createObservedTruth } from '../../app/actions/truth';

vi.mock('../../lib/supabase', () => ({
  getSupabaseAdminClient: vi.fn(),
}));

vi.mock('../../app/actions/truth', () => ({
  createObservedTruth: vi.fn(),
}));

const createMockQueryBuilder = (data: any = null, error: any = null) => {
  const qb: any = {
    eq: vi.fn().mockImplementation(() => qb),
    select: vi.fn().mockImplementation(() => qb),
    insert: vi.fn().mockImplementation(() => qb),
    update: vi.fn().mockImplementation(() => qb),
    single: vi.fn().mockResolvedValue({ data, error }),
    then: (resolve: any) => resolve({ data, error })
  };
  return qb;
};

describe('BSW-OS AI Agent Truth Extractor Tests (TDD-05)', () => {
  const mockWorkspaceId = 'e2fa0fcd-99b3-46bc-81bf-4b216fb0ffcf';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully run brand truth extractor and audit the execution workflow', async () => {
    const mockAgentRunId = 'agent-run-111';

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'agent_runs') {
        return createMockQueryBuilder({ id: mockAgentRunId });
      }
      return createMockQueryBuilder();
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    vi.mocked(createObservedTruth).mockImplementation(async (workspaceId, payload) => {
      return { id: 'obs-' + Math.random(), observed_claim: payload.observed_claim };
    });

    const result = await runBrandTruthExtractor(mockWorkspaceId, {
      sourceText: 'We use high quality niacinamide in our clinical skincare products.',
      sourceDomain: 'purebarrier-skincare.com',
    });

    expect(result.extractedCount).toBe(2);
    expect(result.agentRunId).toBe(mockAgentRunId);
    expect(result.observedTruths[0].observed_claim).toContain('Niacinamide');
    expect(mockFrom).toHaveBeenCalledWith('agent_runs');
    expect(createObservedTruth).toHaveBeenCalledTimes(2);
  });

  it('should quarantine the agent run status if execution fails midway', async () => {
    const mockAgentRunId = 'agent-run-222';
    const mockErrorMsg = 'Failed to save observed truth in DB';

    const mockUpdateQuery = createMockQueryBuilder();
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'agent_runs') {
        return {
          insert: vi.fn().mockImplementation(() => ({
            select: vi.fn().mockImplementation(() => ({
              single: vi.fn().mockResolvedValue({ data: { id: mockAgentRunId }, error: null })
            }))
          })),
          update: vi.fn().mockReturnValue(mockUpdateQuery),
        } as any;
      }
      return createMockQueryBuilder();
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    vi.mocked(createObservedTruth).mockRejectedValueOnce(new Error(mockErrorMsg));

    await expect(
      runBrandTruthExtractor(mockWorkspaceId, {
        sourceText: 'skincare is good',
        sourceDomain: 'fail-domain.com',
      })
    ).rejects.toThrow(mockErrorMsg);

    expect(mockFrom).toHaveBeenCalledWith('agent_runs');
    expect(mockUpdateQuery.eq).toHaveBeenCalledWith('id', mockAgentRunId);
  });
});
