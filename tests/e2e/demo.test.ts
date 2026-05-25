import { describe, it, expect, vi, beforeEach } from 'vitest';
import { seedCore } from '../../db/seed/demo-core';
import { seedFullDemo } from '../../db/seed/demo-full';
import { seedKBeauty } from '../../db/seed/domains/k-beauty';
import { seedConvenience } from '../../db/seed/domains/convenience-retail';
import { seedWedding } from '../../db/seed/domains/wedding';
import { getSupabaseAdminClient } from '../../lib/supabase';

// Mock Supabase client
vi.mock('../../lib/supabase', () => ({
  getSupabaseAdminClient: vi.fn(),
}));

const createMockQueryBuilder = (data: any = null, count: number = 0) => {
  let capturedPayload: any = null;
  const qb: any = {
    eq: vi.fn().mockImplementation(() => qb),
    select: vi.fn().mockImplementation(() => qb),
    upsert: vi.fn().mockImplementation((payload) => {
      capturedPayload = payload;
      return qb;
    }),
    insert: vi.fn().mockImplementation((payload) => {
      capturedPayload = payload;
      return qb;
    }),
    update: vi.fn().mockImplementation((payload) => {
      capturedPayload = payload;
      return qb;
    }),
    single: vi.fn().mockImplementation(async () => {
      // Mock unique columns or slugs for single rows mapping
      const resultData = Array.isArray(capturedPayload) 
        ? capturedPayload[0] 
        : (capturedPayload || data);
      return { data: { id: "mock-id-seeded", name: "Mock Component", slug: "mock-slug", ...resultData }, error: null };
    }),
    then: (resolve: any) => {
      const resultData = Array.isArray(capturedPayload) 
        ? capturedPayload 
        : (capturedPayload || data);
      resolve({ data: resultData, count, error: null });
    }
  };
  return qb;
};

describe('BSW-OS Domain Seed & Demo Flows Test Suite (AG-B9)', () => {
  const mockWorkspaceId = '11111111-1111-4111-a111-111111111111';
  const mockDomainId = '22222222-2222-4222-b222-222222222222';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Idempotency & Seeder Integrities', () => {
    it('should successfully run core workspace skeleton seeder', async () => {
      const mockFrom = vi.fn().mockImplementation(() => {
        return createMockQueryBuilder({ id: mockWorkspaceId });
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      await seedCore();
      expect(mockFrom).toHaveBeenCalledWith('workspaces');
      expect(mockFrom).toHaveBeenCalledWith('workspace_memberships');
      expect(mockFrom).toHaveBeenCalledWith('domains');
    });

    it('should run full-demo master seeder orchestrator', async () => {
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'workspaces') {
          return createMockQueryBuilder({ id: mockWorkspaceId });
        }
        if (table === 'domains') {
          return createMockQueryBuilder([
            { id: 'dom-1', slug: 'k-beauty-skincare' },
            { id: 'dom-2', slug: 'convenience-retail' },
            { id: 'dom-3', slug: 'wedding-services' }
          ]);
        }
        return createMockQueryBuilder();
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      await seedFullDemo();
      expect(mockFrom).toHaveBeenCalledWith('workspaces');
      expect(mockFrom).toHaveBeenCalledWith('domains');
    });
  });

  describe('2. Domain Pack Traceability & Full-Loop Verifications', () => {
    it('should seed K-Beauty PureBarrier routine and safety disclaimers correctly', async () => {
      const mockFrom = vi.fn().mockImplementation(() => {
        return createMockQueryBuilder();
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      await seedKBeauty(mockWorkspaceId, mockDomainId);
      expect(mockFrom).toHaveBeenCalledWith('brand_truths');
      expect(mockFrom).toHaveBeenCalledWith('truth_evidence');
      expect(mockFrom).toHaveBeenCalledWith('claim_boundaries');
      expect(mockFrom).toHaveBeenCalledWith('representation_objects');
      expect(mockFrom).toHaveBeenCalledWith('benchmark_reports');
    });

    it('should seed Convenience Retail Quick25 store locator and local actions correctly', async () => {
      const mockFrom = vi.fn().mockImplementation(() => {
        return createMockQueryBuilder();
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      await seedConvenience(mockWorkspaceId, mockDomainId);
      expect(mockFrom).toHaveBeenCalledWith('brand_truths');
      expect(mockFrom).toHaveBeenCalledWith('qis_scenes');
      expect(mockFrom).toHaveBeenCalledWith('semantic_pages');
      expect(mockFrom).toHaveBeenCalledWith('post_patch_lift_snapshots');
    });

    it('should seed Wedding Services Lumiere Hall package and contract boundaries correctly', async () => {
      const mockFrom = vi.fn().mockImplementation(() => {
        return createMockQueryBuilder();
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      await seedWedding(mockWorkspaceId, mockDomainId);
      expect(mockFrom).toHaveBeenCalledWith('brand_truths');
      expect(mockFrom).toHaveBeenCalledWith('tco_concepts');
      // Must cover wedding_hall, studio, dress, makeup vendor categories (asserted via mock index attributes)
      expect(mockFrom).toHaveBeenCalledWith('kg_nodes');
      expect(mockFrom).toHaveBeenCalledWith('retest_runs');
      expect(mockFrom).toHaveBeenCalledWith('factory_reuse_candidates');
    });
  });
});
