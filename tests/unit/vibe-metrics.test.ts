import { describe, it, expect, vi, beforeEach } from 'vitest';
import { computeVPA, detectMSA, computeVCS, computeVMRI } from '../../app/actions/persona';
import { getSupabaseAdminClient } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => ({
  getSupabaseAdminClient: vi.fn(),
}));

const createMockQueryBuilder = (data: any = null) => {
  const qb: any = {
    eq: vi.fn().mockImplementation(() => qb),
    select: vi.fn().mockImplementation(() => qb),
    order: vi.fn().mockImplementation(() => qb),
    limit: vi.fn().mockImplementation(() => qb),
    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
    single: vi.fn().mockResolvedValue({ data, error: null }),
    then: (resolve: any) => resolve({ data, error: null }),
  };
  return qb;
};

describe('Vibe Metrics Core Math Test (TDD-06)', () => {
  const mockWorkspaceId = '11111111-1111-4111-a111-111111111111';
  const mockVibeSpecId = '22222222-2222-4222-b222-222222222222';
  const mockPageId = '33333333-3333-4333-c333-333333333333';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should calculate VPA and MSA with precise vector difference arithmetic', async () => {
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'vibe_assignments') {
        return createMockQueryBuilder({ vibe_spec_id: mockVibeSpecId });
      }
      if (table === 'vibe_specs') {
        return createMockQueryBuilder({
          target_vector: { clinical: 50, warm: 30, luxury: 20 },
        });
      }
      if (table === 'vibe_profiles') {
        return createMockQueryBuilder({
          aggregated_vector: { clinical: 45, warm: 32, luxury: 23 }, // diff sum: |5| + |2| + |3| = 10
        });
      }
      return createMockQueryBuilder();
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    // VPA = 100 - (diff / 2) = 100 - (10 / 2) = 95.00
    const vpa = await computeVPA(mockWorkspaceId, mockPageId);
    expect(vpa).toBe(95.00);

    // MSA = 100 - VPA = 5.00
    const msa = await detectMSA(mockWorkspaceId, mockPageId);
    expect(msa).toBe(5.00);
  });

  it('should compute VCS with standard deviation arithmetic over ratings history', async () => {
    const ratings = [
      { rating_scores: { clinical: 50, warm: 30, luxury: 20 } },
      { rating_scores: { clinical: 52, warm: 28, luxury: 20 } },
    ];

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'vibe_rating_events') {
        return createMockQueryBuilder(ratings);
      }
      if (table === 'vibe_specs') {
        return createMockQueryBuilder({
          target_vector: { clinical: 50, warm: 30, luxury: 20 },
        });
      }
      return createMockQueryBuilder();
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    // Distance 1: (|50-50| + |30-30| + |20-20|) / 2 = 0
    // Distance 2: (|50-52| + |30-28| + |20-20|) / 2 = (2 + 2) / 2 = 2
    // Average distance = 1. Variance = ( (0-1)^2 + (2-1)^2 ) / 2 = 1. StdDev = 1
    // VCS = 100 - (1 * 5) = 95.00
    const vcs = await computeVCS(mockWorkspaceId, mockVibeSpecId);
    expect(vcs).toBe(95.00);
  });

  it('should compute VMRI combining VCS and active page MSAs correctly', async () => {
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'vibe_assignments') {
        // Mock assignments
        return {
          ...createMockQueryBuilder([{ target_id: mockPageId, target_type: 'page' }]),
          eq: () => createMockQueryBuilder([{ target_id: mockPageId, target_type: 'page' }]),
        };
      }
      if (table === 'vibe_specs') {
        return createMockQueryBuilder({
          target_vector: { clinical: 50, warm: 30, luxury: 20 },
        });
      }
      if (table === 'vibe_profiles') {
        return createMockQueryBuilder({
          aggregated_vector: { clinical: 40, warm: 34, luxury: 26 }, // diff sum: 10 + 4 + 6 = 20. Diff / 2 = 10. MSA = 10
        });
      }
      if (table === 'vibe_rating_events') {
        return createMockQueryBuilder([
          { rating_scores: { clinical: 50, warm: 30, luxury: 20 } },
          { rating_scores: { clinical: 50, warm: 30, luxury: 20 } },
        ]);
      }
      return createMockQueryBuilder();
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    // VCS = 100 (diff is all 0). MSA = 10.
    // VMRI = (avgMSA * 0.6) + ((100 - VCS) * 0.4) = (10 * 0.6) + (0 * 0.4) = 6.00%
    const vmri = await computeVMRI(mockWorkspaceId, mockVibeSpecId);
    expect(vmri).toBe(6.00);
  });
});
