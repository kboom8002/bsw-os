import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkWorkspacePermission } from '../../lib/auth';
import { getSupabaseAdminClient } from '../../lib/supabase';
import { evaluateLineageCompleteness } from '../../app/actions/semantic';

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

describe('TDD-04: Claim-Evidence-Boundary Lineage Completeness Tests', () => {
  const wsId = '00000000-0000-4000-a000-000000000001';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should mark claim lineage as incomplete (isPublishable = false) if evidence is missing', async () => {
    vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'claim_nodes') {
        return createMockQueryBuilder({ id: 'cn-1', operational_truth_id: 'op-1', claim_summary: 'Barrier repair' });
      }
      if (table === 'brand_operational_truths') {
        return createMockQueryBuilder({ risk_level: 'medium', claim: 'Barrier repair' });
      }
      if (table === 'lineage_records') {
        // Lineage lacks evidence_item_id!
        return createMockQueryBuilder({ id: 'lin-1', claim_node_id: 'cn-1', evidence_item_id: null, boundary_rule_id: null });
      }
      return createMockQueryBuilder([]);
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const result = await evaluateLineageCompleteness(wsId, 'cn-1');

    expect(result.isPublishable).toBe(false);
    expect(result.blockers[0]).toContain('lacks clinical evidence referencing');
  });

  it('should block release and report active boundary rules missing if risk_level is high and rule is missing or inactive', async () => {
    vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'claim_nodes') {
        return createMockQueryBuilder({ id: 'cn-2', operational_truth_id: 'op-2', claim_summary: 'Clinical retinol usage' });
      }
      if (table === 'brand_operational_truths') {
        return createMockQueryBuilder({ risk_level: 'critical', claim: 'Clinical retinol usage' });
      }
      if (table === 'lineage_records') {
        return createMockQueryBuilder({ id: 'lin-2', claim_node_id: 'cn-2', evidence_item_id: 'ev-2', boundary_rule_id: 'br-2' });
      }
      if (table === 'evidence_items') {
        return createMockQueryBuilder({ id: 'ev-2', is_verified: true, title: 'Retinol Clinical Study' });
      }
      if (table === 'boundary_rules') {
        // Mock that the boundary rule is INACTIVE!
        return createMockQueryBuilder({ id: 'br-2', is_active: false, rule_name: 'YMYL Sensitive Eczema Block' });
      }
      return createMockQueryBuilder([]);
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const result = await evaluateLineageCompleteness(wsId, 'cn-2');

    expect(result.isPublishable).toBe(false);
    expect(result.blockers.some(b => b.includes('YMYL Sensitive Eczema Block') && b.includes('inactive'))).toBe(true);
  });
});
