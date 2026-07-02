import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPatchTicket, evaluatePatchPassGate } from '../../app/actions/fixit';
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
    select: vi.fn().mockImplementation(() => qb),
    insert: vi.fn().mockImplementation(() => qb),
    single: vi.fn().mockImplementation(() => createMockQueryBuilder(data, error)),
    then: vi.fn().mockImplementation((onFulfilled) => {
      return Promise.resolve(onFulfilled({ data, error }));
    }),
  };
  return qb;
};

describe('TDD-09: Patch Ticket Hypothesis and Retest Gates', () => {
  const workspaceId = '00000000-0000-4000-a000-000000000001';
  const rcaId = 'rca-111';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should require a structured patch hypothesis for creation', async () => {
    vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

    const invalidPatch = {
      rca_case_id: rcaId,
      patch_name: 'Fix Schema',
      patch_hypothesis: '' // Empty hypothesis!
    };

    await expect(createPatchTicket(workspaceId, invalidPatch)).rejects.toThrow();
  });

  it('should block patch success if retest run configuration is completely missing', async () => {
    vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

    const mockPatch = {
      patch_name: 'Fix Schema v1',
      patch_hypothesis: 'Adding JSON-LD will lift OCR.',
      status: 'applied'
    };

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'patch_tickets') {
        return createMockQueryBuilder(mockPatch);
      }
      if (table === 'retest_plans') {
        return createMockQueryBuilder([]); // No retest plan!
      }
      return createMockQueryBuilder();
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const gate = await evaluatePatchPassGate(workspaceId, 'patch-111');
    expect(gate.status).toBe('fail');
    expect(gate.blockingReasons).toContain("Patch lacks an active Retest Plan configuration. SUCCESS REQUIRES RETEST.");
  });
});
