import { describe, it, expect, vi, beforeEach } from 'vitest';
import { computePostPatchLift } from '../../app/actions/fixit';
import { getSupabaseAdminClient } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => ({
  getSupabaseAdminClient: vi.fn(),
}));

const createMockQueryBuilder = (data: any = null, error: any = null) => {
  const qb: any = {
    eq: vi.fn().mockImplementation(() => qb),
    select: vi.fn().mockImplementation(() => qb),
    insert: vi.fn().mockImplementation(() => qb),
    single: vi.fn().mockImplementation(() => createMockQueryBuilder(data, error)),
    then: vi.fn().mockImplementation((onFulfilled) => {
      return Promise.resolve(onFulfilled({ data, error }));
    }),
  };
  return qb;
};

describe('TDD-09: Retest Run Lift Metrics Comparison', () => {
  const workspaceId = '00000000-0000-4000-a000-000000000001';
  const retestRunId = 'retest-run-111';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should compute exact absolute lift per metrics and link baseline & retest datasets', async () => {
    const baselineScores = { ARS: 50.00, BSF: 70.00 };
    const retestScores = { ARS: 65.00, BSF: 75.00 };

    const mockFrom = vi.fn().mockImplementation(() => {
      // Mock post-patch lift snapshot insertion returning computed lift
      return createMockQueryBuilder({
        id: 'lift-snapshot-111',
        lift_values: { ARS: 15.00, BSF: 5.00 },
        final_verdict: 'pass',
        is_guardrail_regressed: false
      });
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const result = await computePostPatchLift(workspaceId, retestRunId, baselineScores, retestScores);
    expect(result).toBeDefined();
    expect(result.final_verdict).toBe('pass');
    expect(result.lift_values.ARS).toBe(15.00); // 65 - 50 = 15
    expect(result.lift_values.BSF).toBe(5.00); // 75 - 70 = 5
    expect(result.is_guardrail_regressed).toBe(false);
  });
});
