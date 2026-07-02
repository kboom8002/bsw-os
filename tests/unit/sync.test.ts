import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncTenantContent } from '../../app/actions/sync';
import { getSupabaseAdminClient } from '../../lib/supabase';
import { checkWorkspacePermission } from '../../lib/auth';

vi.mock('../../lib/supabase', () => ({
  getSupabaseAdminClient: vi.fn(),
}));

vi.mock('../../lib/auth', () => ({
  requireAuth: vi.fn().mockResolvedValue('test-user-id'),
  requireAuthOrDemo: vi.fn().mockResolvedValue('test-user-id'),
  checkWorkspacePermission: vi.fn().mockResolvedValue(true),
  checkWorkspacePermissionOrDemo: vi.fn().mockResolvedValue(true),
}));

const createMockQueryBuilder = (data: any = null, error: any = null) => {
  const qb: any = {
    eq: vi.fn().mockImplementation(() => qb),
    select: vi.fn().mockImplementation(() => qb),
    insert: vi.fn().mockImplementation(() => qb),
    update: vi.fn().mockImplementation(() => qb),
    upsert: vi.fn().mockImplementation(async () => ({ data, error })),
    single: vi.fn().mockImplementation(async () => ({ data, error })),
    then: vi.fn().mockImplementation((onFulfilled) => {
      return Promise.resolve(onFulfilled({ data, error }));
    }),
  };
  return qb;
};

describe('Content Synchronization Pipeline Test Suite (Phase 2B)', () => {
  const workspaceId = '00000000-0000-4000-a000-000000000001';
  const bridgeId = '55555555-5555-4555-e555-555555555555';
  const tenantId = 'ffffffff-ffff-4fff-bfff-ffffffffffff';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkWorkspacePermission).mockResolvedValue(true);
  });

  it('should successfully synchronize all tenant assets from AIHompyHub to BSW-OS', async () => {
    const mockBridge = {
      id: bridgeId,
      aihompy_tenant_id: tenantId,
      aihompy_tenant_slug: 'beauty-brand',
      aihompy_industry: 'beauty',
      bsw_workspace_id: workspaceId,
      sync_status: 'pending'
    };

    const upsertedTables: string[] = [];

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'tenant_workspace_bridge') {
        return createMockQueryBuilder(mockBridge);
      }
      const mockId = '11111111-1111-4111-a111-111111111111';
      return {
        ...createMockQueryBuilder({ id: mockId }),
        upsert: vi.fn().mockImplementation((payload) => {
          upsertedTables.push(table);
          return createMockQueryBuilder({ id: mockId });
        })
      } as any;
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const result = await syncTenantContent(bridgeId);

    expect(result.status).toBe('success');
    expect(result.syncedRecords.evidenceCount).toBe(1);
    expect(result.syncedRecords.boundaryCount).toBe(1);
    expect(result.syncedRecords.conceptCount).toBe(1);

    // Verify all mapping BSW-OS destination tables received data
    expect(upsertedTables).toContain('brand_strategic_truths');
    expect(upsertedTables).toContain('evidence_items');
    expect(upsertedTables).toContain('boundary_rules');
    expect(upsertedTables).toContain('question_capital_nodes');
    expect(upsertedTables).toContain('canonical_questions');
    expect(upsertedTables).toContain('tco_concepts');
    expect(upsertedTables).toContain('vibe_specs');
    expect(upsertedTables).toContain('persona_specs');
  });

  it('should throw an error if the bridge is not found', async () => {
    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: vi.fn().mockImplementation(() => createMockQueryBuilder(null, { message: 'Not Found' })),
    } as any);

    await expect(syncTenantContent(bridgeId)).rejects.toThrow('BridgeNotFound');
  });
});
