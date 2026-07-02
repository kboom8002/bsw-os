import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkWorkspacePermission } from '../../lib/auth';
import { getSupabaseAdminClient } from '../../lib/supabase';
import { evaluateTruthLockGate } from '../../app/actions/truth';

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

const createMockQueryBuilder = (data: any = null, count: number = 0) => {
  const qb: any = {
    eq: vi.fn().mockImplementation(() => qb),
    in: vi.fn().mockImplementation(() => qb),
    select: vi.fn().mockImplementation(() => qb),
    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
    single: vi.fn().mockResolvedValue({ data, error: null }),
    then: (resolve: any) => resolve({ data, count, error: null })
  };
  return qb;
};

describe('TDD-03: Truth Lock Gate Evaluation Engine Tests', () => {
  const wsId = '00000000-0000-4000-a000-000000000001';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Gate Levels L0 - L4 Transitions', () => {
    it('should pass L0 Gate if workspace is present and not corrupted', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'workspaces') {
          return createMockQueryBuilder([], 1); // count = 1
        }
        return createMockQueryBuilder([]);
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      const result = await evaluateTruthLockGate(wsId, 'L0');
      expect(result.isPassed).toBe(true);
      expect(result.blockingReasons.length).toBe(0);
    });

    it('should block L1 Gate if strategic or operational claims are missing', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'workspaces') {
          return createMockQueryBuilder([], 1);
        }
        if (table === 'brand_strategic_truths') {
          return createMockQueryBuilder([]); // LACKS strategic!
        }
        if (table === 'brand_operational_truths') {
          return createMockQueryBuilder([]); // LACKS operational!
        }
        return createMockQueryBuilder([]);
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      const result = await evaluateTruthLockGate(wsId, 'L1');
      expect(result.isPassed).toBe(false);
      expect(result.blockingReasons.some(r => r.includes('Strategic'))).toBe(true);
      expect(result.blockingReasons.some(r => r.includes('Operational'))).toBe(true);
    });

    it('should block L3 Gate if any operational claim lacks verified evidence references', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'workspaces') {
          return createMockQueryBuilder([], 1);
        }
        if (table === 'brand_strategic_truths') {
          return createMockQueryBuilder([{ id: 'st-1' }]);
        }
        if (table === 'brand_operational_truths') {
          return createMockQueryBuilder([{ id: 'op-1', claim: 'Skin benefits', risk_level: 'medium' }]);
        }
        if (table === 'brand_operational_truth_evidence') {
          return createMockQueryBuilder([]); // LACKS evidence references!
        }
        return createMockQueryBuilder([]);
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      const result = await evaluateTruthLockGate(wsId, 'L3');
      expect(result.isPassed).toBe(false);
      expect(result.blockingReasons[0]).toContain('has zero evidence references attached');
    });

    it('should block L4 Gate if unresolved truth discrepancy deltas exist', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'workspaces') {
          return createMockQueryBuilder([], 1);
        }
        if (table === 'brand_strategic_truths') {
          return createMockQueryBuilder([{ id: 'st-1' }]);
        }
        if (table === 'brand_operational_truths') {
          return createMockQueryBuilder([{ id: 'op-1', claim: 'Pure Barrier', risk_level: 'medium' }]);
        }
        if (table === 'brand_operational_truth_evidence') {
          return createMockQueryBuilder([{ evidence_item_id: 'ev-1' }]);
        }
        if (table === 'evidence_items') {
          return createMockQueryBuilder([{ id: 'ev-1', is_verified: true }]);
        }
        if (table === 'truth_delta_snapshots') {
          return createMockQueryBuilder([{ id: 'delta-1', delta_summary: 'Discrepancy' }]); // Unresolved delta exists!
        }
        return createMockQueryBuilder([]);
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      const result = await evaluateTruthLockGate(wsId, 'L4');
      expect(result.isPassed).toBe(false);
      expect(result.blockingReasons[0]).toContain('Open discrepancy deltas still exist');
    });
  });
});
