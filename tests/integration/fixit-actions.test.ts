import { describe, it, expect, vi, beforeEach } from 'vitest';
import { promoteFactoryReuseCandidate } from '../../app/actions/fixit';
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
    select: vi.fn().mockImplementation(() => qb),
    update: vi.fn().mockImplementation(() => qb),
    single: vi.fn().mockImplementation(() => createMockQueryBuilder(data, error)),
    then: vi.fn().mockImplementation((onFulfilled) => {
      return Promise.resolve(onFulfilled({ data, error }));
    }),
  };
  return qb;
};

describe('TDD-09: Factory Reuse Promotion Integration and Security Gates', () => {
  const workspaceId = '00000000-0000-4000-a000-000000000001';
  const candidateId = '00000000-0000-4000-a000-000000000002';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should block Factory promotion when base lift verification is a FAIL', async () => {
    vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

    const mockCandidate = {
      id: candidateId,
      post_patch_lift_snapshot_id: '00000000-0000-4000-a000-000000000003',
      status: 'candidate'
    };

    // Lift snapshot has failed base lift (verdict = fail)
    const mockLift = {
      id: '00000000-0000-4000-a000-000000000003',
      final_verdict: 'fail', // FAILED!
      is_guardrail_regressed: false
    };

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'factory_reuse_candidates') {
        return createMockQueryBuilder(mockCandidate);
      }
      if (table === 'post_patch_lift_snapshots') {
        return createMockQueryBuilder(mockLift);
      }
      return createMockQueryBuilder();
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    // Act & Assert: Expect promotion to block
    await expect(
      promoteFactoryReuseCandidate(workspaceId, candidateId)
    ).rejects.toThrow('PROMOTION LOCKED');
  });

  it('should promote Factory candidate when base lift verification is PASS and has zero regressions', async () => {
    vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

    const mockCandidate = {
      id: candidateId,
      post_patch_lift_snapshot_id: '00000000-0000-4000-a000-000000000004',
      status: 'candidate'
    };

    const mockLift = {
      id: '00000000-0000-4000-a000-000000000004',
      final_verdict: 'pass', // PASS!
      is_guardrail_regressed: false // NO REGRESSIONS!
    };

    let candidateStatus = 'candidate';
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'factory_reuse_candidates') {
        const qb: any = {
          eq: vi.fn().mockImplementation(() => qb),
          select: vi.fn().mockImplementation(() => qb),
          update: vi.fn().mockImplementation((updateData: any) => {
            if (updateData.status) {
              candidateStatus = updateData.status;
            }
            return qb;
          }),
          single: vi.fn().mockImplementation(() => {
            return createMockQueryBuilder({
              id: candidateId,
              post_patch_lift_snapshot_id: '00000000-0000-4000-a000-000000000004',
              status: candidateStatus
            });
          }),
          then: vi.fn().mockImplementation((onFulfilled) => {
            return Promise.resolve(onFulfilled({ 
              data: {
                id: candidateId,
                post_patch_lift_snapshot_id: '00000000-0000-4000-a000-000000000004',
                status: candidateStatus
              }, 
              error: null 
            }));
          }),
        };
        return qb;
      }
      if (table === 'post_patch_lift_snapshots') {
        return createMockQueryBuilder(mockLift);
      }
      return createMockQueryBuilder();
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const result = await promoteFactoryReuseCandidate(workspaceId, candidateId);
    expect(result).toBeDefined();
    expect(result.status).toBe('promoted');
  });
});
