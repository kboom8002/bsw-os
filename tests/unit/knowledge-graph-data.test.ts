import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getKnowledgeGraphData } from '../../app/actions/semantic';
import { getSupabaseAdminClient } from '../../lib/supabase';
import { checkWorkspacePermission, checkWorkspacePermissionOrDemo } from '../../lib/auth';

// Mock Supabase admin client and auth permission helper
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

const createMockQueryBuilder = (data: any = null, error: any = null, count: number = 0) => {
  const qb: any = {
    eq: vi.fn().mockImplementation(() => qb),
    select: vi.fn().mockImplementation(() => qb),
    single: vi.fn().mockResolvedValue({ data, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
    then: (resolve: any) => resolve({ data, count, error })
  };
  return qb;
};

describe('Knowledge Graph Unified Data Evaluation (Stream 3)', () => {
  const mockWorkspaceId = '11111111-1111-4111-a111-111111111111';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should block graph loading if workspace permission check fails', async () => {
    vi.mocked(checkWorkspacePermission).mockResolvedValue(false); // Unauthorized
    vi.mocked(checkWorkspacePermissionOrDemo).mockResolvedValue(false); // Unauthorized

    await expect(getKnowledgeGraphData(mockWorkspaceId)).rejects.toThrow(
      "UNAUTHORIZED: Insufficient permissions to view the Knowledge Graph."
    );
  });

  it('should successfully build combined brand ontology and concept graph data format', async () => {
    vi.mocked(checkWorkspacePermission).mockResolvedValue(true); // Authorized
    vi.mocked(checkWorkspacePermissionOrDemo).mockResolvedValue(true); // Authorized

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'brand_ontology_nodes') {
        return createMockQueryBuilder([
          { id: 'node-1', node_name: 'Barrier Protection Strategic Claim', node_type: 'strategic_claim', reference_id: 'claim-1' },
          { id: 'node-2', node_name: 'Clinical Evidence PDF', node_type: 'evidence', reference_id: 'ev-1' }
        ]);
      }
      if (table === 'brand_ontology_edges') {
        return createMockQueryBuilder([
          { id: 'edge-1', source_node_id: 'node-1', target_node_id: 'node-2', relation_type: 'supported_by' }
        ]);
      }
      if (table === 'canonical_questions') {
        return createMockQueryBuilder([
          { id: 'cq-1', question_text: 'Is Ceramide good for skin?' }
        ]);
      }
      if (table === 'qis_scenes') {
        return createMockQueryBuilder([
          { id: 'qis-1', scene_name: 'Sensitive skincare Routine' }
        ]);
      }
      if (table === 'tco_concepts') {
        return createMockQueryBuilder([
          { id: 'tc-1', concept_name: 'Ceramide NP', category: 'ingredient' }
        ]);
      }
      if (table === 'lineage_records') {
        return createMockQueryBuilder([
          { id: 'lin-1', claim_node_id: 'claim-1', evidence_item_id: 'ev-1', boundary_rule_id: null, is_publishable: true }
        ]);
      }
      return createMockQueryBuilder(null);
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const result = await getKnowledgeGraphData(mockWorkspaceId);

    // Verify properties
    expect(result.nodes.length).toBe(5); // 2 ontology + 1 CQ + 1 QIS + 1 TCO
    expect(result.links.length).toBe(2); // 1 ontology edge + 1 lineage edge
    expect(result.stats.nodeCount).toBe(5);
    expect(result.stats.edgeCount).toBe(2);
    expect(result.stats.conceptCount).toBe(1);

    // Assert specific nodes and links are compiled in place
    const nodeTypes = result.nodes.map(n => n.type);
    expect(nodeTypes).toContain('strategic_claim');
    expect(nodeTypes).toContain('canonical_question');
    expect(nodeTypes).toContain('concept');
  });
});
