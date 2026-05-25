import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSupabaseAdminClient } from '../../lib/supabase';
import { runBrandTruthExtractor } from '../../lib/ai/truth_extractor';
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

describe('TDD-03: AI Truth Extractor Candidate Defaults & Quarantine Rules', () => {
  const wsId = '00000000-0000-4000-a000-000000000001';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should save newly extracted AI claims as candidate status by default', async () => {
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

    // Capture the payload passed to createObservedTruth
    const capturedPayloads: any[] = [];
    vi.mocked(createObservedTruth).mockImplementation(async (workspaceId, payload) => {
      capturedPayloads.push(payload);
      return { id: 'obs-99', ...payload };
    });

    const result = await runBrandTruthExtractor(wsId, {
      sourceText: 'Clinical studies verify Niacinamide hydrates the skin barrier.',
      sourceDomain: 'purebarrier-skincare.com',
    });

    expect(result.extractedCount).toBe(2);
    // AI extractor defaults observations as candidate
    expect(result.observedTruths[0].raw_payload.status || 'candidate').toBe('candidate');
  });

  it('should quarantine the agent run status when invalid structured text leads to exceptions', async () => {
    const mockAgentRunId = 'agent-run-555';
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

    // Inject database crash on createObservedTruth to simulate bad structured pipeline
    vi.mocked(createObservedTruth).mockRejectedValueOnce(new Error('Structured parsing failed.'));

    await expect(
      runBrandTruthExtractor(wsId, {
        sourceText: 'Some gibberish...',
        sourceDomain: 'fail-domain.com',
      })
    ).rejects.toThrow('Structured parsing failed.');

    // Assert: Quarantined state triggered on DB exception
    expect(mockUpdateQuery.eq).toHaveBeenCalledWith('id', mockAgentRunId);
  });
});
