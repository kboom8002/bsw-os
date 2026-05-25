import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkWorkspacePermission } from '../../lib/auth';
import { getSupabaseAdminClient } from '../../lib/supabase';
import { validateSurfaceContract } from '../../app/actions/objects';

vi.mock('../../lib/supabase', () => ({
  getSupabaseAdminClient: vi.fn(),
}));

vi.mock('../../lib/auth', () => ({
  checkWorkspacePermission: vi.fn(),
}));

const createMockQueryBuilder = (data: any = null, count: number = 0) => {
  const qb: any = {
    eq: vi.fn().mockImplementation(() => qb),
    select: vi.fn().mockImplementation(() => qb),
    single: vi.fn().mockResolvedValue({ data, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
    update: vi.fn().mockImplementation(() => qb),
    then: (resolve: any) => resolve({ data, count, error: null })
  };
  return qb;
};

describe('TDD-05: Surface Contract Layout & Safety Validation Tests', () => {
  const wsId = '00000000-0000-4000-a000-000000000001';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should block validation (success = false) if contract allowed object maps to high-risk scene but required_blocks lacks safety_boundary', async () => {
    vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'surface_contracts') {
        // Lacks safety_boundary block!
        return createMockQueryBuilder({
          id: 'con-1',
          contract_name: 'Product Details Page',
          allowed_objects: ['obj-1'],
          required_blocks: ['header', 'features']
        });
      }
      if (table === 'representation_objects') {
        return createMockQueryBuilder({ id: 'obj-1', object_name: 'Anti-aging Cream', qis_refs: ['qis-1'] });
      }
      if (table === 'qis_scenes') {
        return createMockQueryBuilder({ id: 'qis-1', scene_name: 'Eczema cure intent', risk_level: 'critical' });
      }
      return createMockQueryBuilder();
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const result = await validateSurfaceContract(wsId, 'con-1');

    expect(result.success).toBe(false);
    expect(result.blockers[0]).toContain('lacks a mandatory "safety_boundary" required block');
  });

  it('should block validation if object carries 3 or more claims but required_blocks lacks clinical/trust proof blocks', async () => {
    vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'surface_contracts') {
        // Lacks trust_proof required block!
        return createMockQueryBuilder({
          id: 'con-2',
          contract_name: 'Heavy Specifications Page',
          allowed_objects: ['obj-2'],
          required_blocks: ['header', 'safety_boundary']
        });
      }
      if (table === 'representation_objects') {
        // Carries 3 claims!
        return createMockQueryBuilder({
          id: 'obj-2',
          object_name: 'Multi-Active Niacinamide',
          qis_refs: [],
          claim_refs: ['cl-1', 'cl-2', 'cl-3']
        });
      }
      return createMockQueryBuilder();
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const result = await validateSurfaceContract(wsId, 'con-2');

    expect(result.success).toBe(false);
    expect(result.blockers.some(b => b.includes('Evidence-heavy object') && b.includes('lacks trust_proof block'))).toBe(true);
  });
});
