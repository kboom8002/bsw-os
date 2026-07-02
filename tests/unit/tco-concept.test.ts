import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkWorkspacePermission } from '../../lib/auth';
import { getSupabaseAdminClient } from '../../lib/supabase';
import { createTcoConcept, createOntologyEdge } from '../../app/actions/semantic';
import { tcoConceptSchema } from '../../lib/schema';

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
    insert: vi.fn().mockImplementation(() => qb),
    single: vi.fn().mockResolvedValue({ data, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
    then: (resolve: any) => resolve({ data, count, error: null })
  };
  return qb;
};

describe('TDD-04: TCO Concept Schema & KG Integrity Tests', () => {
  const wsId = '00000000-0000-4000-a000-000000000001';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('TCO Concept Rich Payload Constraints (Not Tag-Only)', () => {
    it('should reject TCO Concept creation if concept_type or operational_fields is missing or malformed', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

      const tagOnlyPayload = {
        concept_name: 'BarrierProtection',
        slug: 'barrier-protection',
        definition: 'Simple protection details'
        // LACKS concept_type and operational_fields!
      };

      await expect(
        createTcoConcept(wsId, tagOnlyPayload)
      ).rejects.toThrow();
    });

    it('should successfully parse TCO Concept with valid concept_type and operational_fields payload', () => {
      const validPayload = {
        workspace_id: wsId,
        concept_name: 'BarrierProtection',
        slug: 'barrier-protection',
        definition: 'Comprehensive clinical skin barrier protection mechanism.',
        concept_type: 'tco_domain_entity',
        operational_fields: {
          criticality: 'high',
          related_ingredients: ['Ceramide', 'Niacinamide'],
          industry_sector: 'K-Beauty'
        }
      };

      const parsed = tcoConceptSchema.parse(validPayload);
      expect(parsed.concept_type).toBe('tco_domain_entity');
      expect(parsed.operational_fields.criticality).toBe('high');
    });
  });

  describe('Ontology Knowledge Graph Integrity (createOntologyEdge)', () => {
    it('should block edge creation and throw error if source or target nodes do not exist', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'brand_ontology_nodes') {
          // Mock that query returns null -> node does not exist!
          return createMockQueryBuilder(null);
        }
        return createMockQueryBuilder();
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      await expect(
        createOntologyEdge(wsId, {
          source_node_id: '00000000-0000-4000-a000-000000000021',
          target_node_id: '00000000-0000-4000-a000-000000000022',
          relation_type: 'validates_claim'
        })
      ).rejects.toThrow('KG INTEGRITY ERROR: Source or Target node not found');
    });

    it('should block edge creation and throw error if node workspace_id does not match edge workspace_id (Isolation)', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'brand_ontology_nodes') {
          // Returns node from a DIFFERENT workspace!
          return createMockQueryBuilder({ id: 'node-1', workspace_id: 'DIFFERENT-WORKSPACE-ID' });
        }
        return createMockQueryBuilder();
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      await expect(
        createOntologyEdge(wsId, {
          source_node_id: '00000000-0000-4000-a000-000000000021',
          target_node_id: '00000000-0000-4000-a000-000000000022',
          relation_type: 'validates_claim'
        })
      ).rejects.toThrow('SECURITY VIOLATION: Cross-workspace ontology edge mutation blocked');
    });
  });
});
