import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSupabaseAdminClient } from '../../lib/supabase';
import { runSemanticSignalMiner } from '../../lib/ai/semantic_miner';
import { createQuestionSignal } from '../../app/actions/semantic';

vi.mock('../../lib/supabase', () => ({
  getSupabaseAdminClient: vi.fn(),
}));

vi.mock('../../app/actions/semantic', () => ({
  createQuestionSignal: vi.fn(),
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

describe('TDD-04: AI Semantic Signal Miner Candidate Defaults & Quarantine Rules', () => {
  const wsId = '00000000-0000-4000-a000-000000000001';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should save newly extracted signal miner runs as candidate status by default', async () => {
    const mockAgentRunId = 'agent-run-sem-111';

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'agent_runs') {
        return createMockQueryBuilder({ id: mockAgentRunId, status: 'candidate' });
      }
      return createMockQueryBuilder();
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const capturedSignals: any[] = [];
    vi.mocked(createQuestionSignal).mockImplementation(async (workspaceId, payload) => {
      capturedSignals.push(payload);
      return { id: 'sig-99', ...payload };
    });

    const result = await runSemanticSignalMiner(wsId, {
      sourceText: 'Users frequently search for Ceramide and Retinol products.',
      sourceDomain: 'skincareforum.com'
    });

    expect(result.extractedCount).toBe(2);
    expect(result.signals[0].status).toBe('mined');
    expect(capturedSignals.length).toBe(2);
  });

  it('should quarantine the agent run status when exception occurs during parsing', async () => {
    const mockAgentRunId = 'agent-run-sem-555';
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

    // Force failure on createQuestionSignal to trigger exception flow
    vi.mocked(createQuestionSignal).mockRejectedValueOnce(new Error('AI parsing failed.'));

    await expect(
      runSemanticSignalMiner(wsId, {
        sourceText: 'Some broken text...',
        sourceDomain: 'error-domain.com'
      })
    ).rejects.toThrow('AI parsing failed.');

    expect(mockUpdateQuery.eq).toHaveBeenCalledWith('id', mockAgentRunId);
  });
});
