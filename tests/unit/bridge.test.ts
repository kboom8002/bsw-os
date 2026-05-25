import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSupabaseAdminClient } from '../../lib/supabase';
import { tenantWorkspaceBridgeSchema } from '../../lib/schema';

vi.mock('../../lib/supabase', () => ({
  getSupabaseAdminClient: vi.fn(),
}));

describe('Tenant-Workspace Bridge Table Test Suite (Phase 2A)', () => {
  const workspaceId = '00000000-0000-4000-a000-000000000001';
  const tenantId = 'ffffffff-ffff-4fff-bfff-ffffffffffff';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should validate the bridge Zod schema successfully with correct inputs', () => {
    const payload = {
      aihompy_tenant_id: tenantId,
      aihompy_tenant_slug: 'beauty-skincare-lab',
      aihompy_industry: 'beauty',
      bsw_workspace_id: workspaceId,
      sync_status: 'pending',
      sync_config: { autoRetest: true }
    };

    const parsed = tenantWorkspaceBridgeSchema.parse(payload);
    expect(parsed.aihompy_tenant_slug).toBe('beauty-skincare-lab');
    expect(parsed.sync_status).toBe('pending');
  });

  it('should fail validation if tenant_id is an invalid UUID format', () => {
    const payload = {
      aihompy_tenant_id: 'invalid-uuid-string',
      aihompy_tenant_slug: 'beauty-skincare-lab',
      aihompy_industry: 'beauty',
      bsw_workspace_id: workspaceId,
    };

    expect(() => tenantWorkspaceBridgeSchema.parse(payload)).toThrow();
  });
});
