import { describe, it, expect, vi, beforeEach } from 'vitest';
import { computeDomainIndexSnapshot } from '../../app/actions/observatory';
import { checkWorkspacePermission } from '../../lib/auth';
import { getSupabaseAdminClient } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => ({
  getSupabaseAdminClient: vi.fn(),
}));

vi.mock('../../lib/auth', () => ({
  checkWorkspacePermission: vi.fn(),
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

describe('TDD-07: Domain Index Snapshot and MRI Metrics Suite', () => {
  const workspaceId = '00000000-0000-4000-a000-000000000001';
  const runId = 'obs-run-222';
  const definitionId = 'idx-def-333';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should compute OPS-MRI, B-MRI, TCO-GEO, S-MRI with 100-ARS scale mapping', async () => {
    vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

    // Mock Metric Snapshots under this run (necessary for computeDomainIndexSnapshot)
    const mockMetricSnapshots = [
      { metric_name: 'ARS', metric_value: 80.00 },
      { metric_name: 'GCTR', metric_value: 70.00 },
    ];

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'metric_snapshots') {
        return createMockQueryBuilder(mockMetricSnapshots);
      }
      if (table === 'ai_observation_runs') {
        return createMockQueryBuilder([{ id: 'obs-run-222' }]);
      }
      // Insert result mock
      return createMockQueryBuilder({
        id: 'domain-idx-snap-111',
        computed_value: 80.00,
        details: {
          OPS_MRI: 15.00,
          B_MRI: 15.75, // Updated for formula version 2.0
          TCO_GEO: 70.00,
          S_MRI: 72.00, // ARS * 0.9 = 72.00
          confidence: 95
        }
      });
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    // Act
    const result = await computeDomainIndexSnapshot(workspaceId, definitionId, runId);
    expect(result).toBeDefined();
    expect(result.computed_value).toBe(80.00);
    
    // Check MRI profiles in details
    expect(result.details.B_MRI).toBe(15.75); // Updated for formula version 2.0
    expect(result.details.OPS_MRI).toBe(15.00);
    expect(result.details.TCO_GEO).toBe(70.00);
    expect(result.details.S_MRI).toBe(72.00);
  });
});
