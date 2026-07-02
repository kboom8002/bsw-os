import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkWorkspacePermission } from '../../lib/auth';
import { getSupabaseAdminClient } from '../../lib/supabase';
import { evaluateObjectReadiness } from '../../app/actions/objects';

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
    select: vi.fn().mockImplementation(() => qb),
    single: vi.fn().mockResolvedValue({ data, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
    update: vi.fn().mockImplementation(() => qb),
    then: (resolve: any) => resolve({ data, count, error: null })
  };
  return qb;
};

describe('TDD-05: Representation Object Readiness Gate Tests', () => {
  const wsId = '00000000-0000-4000-a000-000000000001';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should pass and set status to ready if all claims have publishable lineage records', async () => {
    vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'representation_objects') {
        return createMockQueryBuilder({ id: 'obj-1', object_name: 'Safe Niacinamide', claim_refs: ['cl-1'] });
      }
      if (table === 'claim_nodes') {
        return createMockQueryBuilder({ id: 'cl-1', claim_summary: 'Hydrates skin barrier', operational_truth_id: 'op-1' });
      }
      if (table === 'brand_operational_truths') {
        return createMockQueryBuilder({ risk_level: 'medium' });
      }
      if (table === 'lineage_records') {
        return createMockQueryBuilder({ id: 'lin-1', is_publishable: true, evidence_item_id: 'ev-1' });
      }
      return createMockQueryBuilder();
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const result = await evaluateObjectReadiness(wsId, 'obj-1');

    expect(result.success).toBe(true);
    expect(result.status).toBe('ready');
    expect(result.blockers.length).toBe(0);
  });

  it('should block object readiness (failed_safety) if a high-risk claim linked has neither direct evidence nor boundaries', async () => {
    vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'representation_objects') {
        // High risk claim op-2 but no boundary/evidence link details!
        return createMockQueryBuilder({
          id: 'obj-2',
          object_name: 'High Risk Retinol',
          claim_refs: ['cl-2'],
          evidence_refs: [],
          boundary_refs: []
        });
      }
      if (table === 'claim_nodes') {
        return createMockQueryBuilder({ id: 'cl-2', claim_summary: 'Cures severe eczema', operational_truth_id: 'op-2' });
      }
      if (table === 'brand_operational_truths') {
        return createMockQueryBuilder({ risk_level: 'critical' });
      }
      if (table === 'lineage_records') {
        return createMockQueryBuilder({ id: 'lin-2', is_publishable: false, evidence_item_id: null, boundary_rule_id: null });
      }
      return createMockQueryBuilder();
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const result = await evaluateObjectReadiness(wsId, 'obj-2');

    expect(result.success).toBe(false);
    expect(result.status).toBe('failed_safety');
    expect(result.blockers.some(b => b.includes('High-risk object lacks safety evidence or boundary'))).toBe(true);
  });
});
