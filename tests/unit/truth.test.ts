import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  upsertStrategicTruth, 
  upsertOperationalTruth, 
  createObservedTruth,
  evaluateTruthLockGate 
} from '../../app/actions/truth';
import { getSupabaseAdminClient } from '../../lib/supabase';
import { checkWorkspacePermission } from '../../lib/auth';

// Mock Supabase admin client and permissions checks to isolate logic
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

// Flawless chainable and Thenable Supabase Query Builder mock
// Allows code under test to await a complex chain of select(), eq(), in() directly.
const createMockQueryBuilder = (data: any = null, count: number = 0) => {
  const qb: any = {
    eq: vi.fn().mockImplementation(() => qb),
    in: vi.fn().mockImplementation(() => qb),
    select: vi.fn().mockImplementation(() => qb),
    upsert: vi.fn().mockImplementation(() => qb),
    insert: vi.fn().mockImplementation(() => qb),
    delete: vi.fn().mockImplementation(() => qb),
    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
    single: vi.fn().mockResolvedValue({ data, error: null }),
    // Thenable support to handle promise resolutions natively
    then: (resolve: any) => resolve({ data, count, error: null })
  };
  return qb;
};

describe('Brand Truth Module & Gating Tests (AG-B2)', () => {
  // Use valid RFC4122 version-4 UUIDs
  const mockWorkspaceId = 'e2fa0fcd-99b3-46bc-81bf-4b216fb0ffcf';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rigid Claim Separation & Overwrite Boundary Checks', () => {
    it('should ensure strategic truths insert only into strategic table container', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);
      
      const mockQb = createMockQueryBuilder({ statement: 'Strategy' });
      const mockFrom = vi.fn().mockReturnValue(mockQb);

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      await upsertStrategicTruth(mockWorkspaceId, {
        statement: 'Rigorous clinical skincare solutions with zero variance.',
        vision: 'Vision statement',
        core_pillars: ['Traceability']
      });

      expect(mockFrom).toHaveBeenCalledWith('brand_strategic_truths');
      expect(mockFrom).not.toHaveBeenCalledWith('brand_operational_truths');
    });

    it('should restrict observed third-party claims from mutating operational tables', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);
      
      const mockQb = createMockQueryBuilder({ id: 'obs-99' });
      const mockFrom = vi.fn().mockReturnValue(mockQb);

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      await createObservedTruth(mockWorkspaceId, {
        observed_claim: 'Scraped active clinical Niacinamide formula percentage.',
        source_domain: 'competitorblog.com',
        confidence_score: 85.50,
        is_aligned_with_operational: true,
        raw_payload: {}
      });

      expect(mockFrom).toHaveBeenCalledWith('brand_observed_truths');
      expect(mockFrom).not.toHaveBeenCalledWith('brand_operational_truths');
    });
  });

  describe('Deterministic Truth Lock Gate Engine Triggers', () => {
    it('should pass L1 gate if at least one strategic and one operational claim exist', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'workspaces') {
          return createMockQueryBuilder([], 1); // count = 1
        }
        if (table === 'brand_strategic_truths') {
          return createMockQueryBuilder([{ id: 'st-1' }]);
        }
        if (table === 'brand_operational_truths') {
          return createMockQueryBuilder([{ id: 'op-1', claim: 'Claim 1', risk_level: 'low' }]);
        }
        return createMockQueryBuilder([]);
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      const result = await evaluateTruthLockGate(mockWorkspaceId, 'L1');

      expect(result.isPassed).toBe(true);
      expect(result.blockingReasons.length).toBe(0);
    });

    it('should block L2 gate when a critical/high-risk claim has no verified evidence attached', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'workspaces') {
          return createMockQueryBuilder([], 1);
        }
        if (table === 'brand_strategic_truths') {
          return createMockQueryBuilder([{ id: 'st-1' }]);
        }
        if (table === 'brand_operational_truths') {
          return createMockQueryBuilder([{ id: 'op-1', claim: 'Acme Skin cures eczema.', risk_level: 'critical' }]);
        }
        return createMockQueryBuilder([]); // Empty for evidence & boundaries links
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      const result = await evaluateTruthLockGate(mockWorkspaceId, 'L2');

      expect(result.isPassed).toBe(false);
      expect(result.blockingReasons[0]).toContain('L2 Blocker');
    });

    it('should pass L2 gate when a critical claim links to at least one verified evidence item and active boundary rule', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'workspaces') {
          return createMockQueryBuilder([], 1);
        }
        if (table === 'brand_strategic_truths') {
          return createMockQueryBuilder([{ id: 'st-1' }]);
        }
        if (table === 'brand_operational_truths') {
          return createMockQueryBuilder([{ id: 'op-1', claim: 'Acme 10% Niacinamide.', risk_level: 'critical' }]);
        }
        if (table === 'brand_operational_truth_evidence') {
          return createMockQueryBuilder([{ evidence_item_id: 'ev-1' }]);
        }
        if (table === 'evidence_items') {
          return createMockQueryBuilder([{ id: 'ev-1', is_verified: true }]);
        }
        if (table === 'brand_operational_truth_boundaries') {
          return createMockQueryBuilder([{ boundary_rule_id: 'bd-1' }]);
        }
        return createMockQueryBuilder([]);
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      const result = await evaluateTruthLockGate(mockWorkspaceId, 'L2');

      expect(result.isPassed).toBe(true);
      expect(result.blockingReasons.length).toBe(0);
    });
  });

  describe('Negative Path & Error Handling (TDD-04)', () => {
    it('should throw UNAUTHORIZED error in upsertStrategicTruth if user lacks permissions', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(false);

      await expect(
        upsertStrategicTruth(mockWorkspaceId, {
          statement: 'Some statement',
          vision: 'Some vision',
          core_pillars: ['Pillar']
        })
      ).rejects.toThrow('UNAUTHORIZED: Insufficient permissions to modify strategic truth.');
    });

    it('should throw UNAUTHORIZED error in upsertOperationalTruth if user lacks permissions', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(false);

      await expect(
        upsertOperationalTruth(mockWorkspaceId, {
          claim: 'Some operational claim',
          risk_level: 'low',
          confidence_score: 90
        })
      ).rejects.toThrow('UNAUTHORIZED: Insufficient permissions to modify operational claims.');
    });

    it('should throw Zod error in upsertStrategicTruth if data payload violates schema', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

      await expect(
        upsertStrategicTruth(mockWorkspaceId, {
          statement: '',
          vision: 'Vision',
          core_pillars: []
        })
      ).rejects.toThrow();
    });
  });
});
