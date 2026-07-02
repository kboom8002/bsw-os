import { describe, it, expect, vi, beforeEach } from 'vitest';
import { computeDomainIndexSnapshot } from '../../app/actions/observatory';
import { checkWorkspacePermission } from '../../lib/auth';
import { getSupabaseAdminClient } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => ({
  getSupabaseAdminClient: vi.fn(),
}));

vi.mock('../../lib/auth', () => ({
  requireAuth: vi.fn().mockResolvedValue('test-user-id'),
  requireAuthOrDemo: vi.fn().mockResolvedValue('test-user-id'),
  checkWorkspacePermission: vi.fn().mockResolvedValue(true),
  checkWorkspacePermissionOrDemo: vi.fn().mockResolvedValue(true),
  getWorkspaceRole: vi.fn().mockResolvedValue('admin'),
}));

const createMockQueryBuilder = (data: any = null, error: any = null) => {
  const qb: any = {
    eq: vi.fn().mockImplementation(() => qb),
    in: vi.fn().mockImplementation(() => qb),
    order: vi.fn().mockImplementation(() => qb),
    limit: vi.fn().mockImplementation(() => qb),
    select: vi.fn().mockImplementation(() => qb),
    insert: vi.fn().mockImplementation(() => qb),
    single: vi.fn().mockImplementation(() => createMockQueryBuilder(data, error)),
    maybeSingle: vi.fn().mockImplementation(() => createMockQueryBuilder(data, error)),
    then: vi.fn().mockImplementation((onFulfilled) => {
      return Promise.resolve(onFulfilled({ data, error }));
    }),
  };
  return qb;
};

describe('TDD-07: Confidence and Volatility Safeguards (Fake Precision Blocking)', () => {
  const workspaceId = '00000000-0000-4000-a000-000000000001';
  const runId = 'obs-run-333';
  const definitionId = 'idx-def-444';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should set confidence to lower values or warnings when active snapshots are insufficient', async () => {
    vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

    // Mock very small snapshots size (e.g. only 1 metric snapshot in the database)
    const mockMetricSnapshots = [
      { metric_name: 'ARS', metric_value: 80.00 }
    ];

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'metric_snapshots') {
        return createMockQueryBuilder(mockMetricSnapshots);
      }
      if (table === 'ai_observation_runs') {
        return createMockQueryBuilder([{ id: 'obs-run-333' }]);
      }
      return createMockQueryBuilder({
        id: 'domain-idx-snap-222',
        computed_value: 80.00,
        details: {
          confidence: 60, // Insufficient snapshots yields lower confidence score!
          volatility: null,
          warning: "Insufficient data: Volatility calculations require at least 5 snapshots to avoid statistical artifacts."
        }
      });
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    // Act
    const result = await computeDomainIndexSnapshot(workspaceId, definitionId, runId);
    expect(result).toBeDefined();
    
    // Validate Fake Precision Prevention
    expect(result.details.confidence).toBe(60); // Not 95%
    expect(result.details.warning).toContain("Insufficient data");
  });
});
