import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkWorkspacePermission, getWorkspaceRole } from '../../lib/auth';
import { getSupabaseAdminClient } from '../../lib/supabase';

// Mock Supabase admin client to isolate business logic
vi.mock('../../lib/supabase', () => ({
  getSupabaseAdminClient: vi.fn(),
}));

describe('Multi-Tenant Workspace & RBAC Permission Logic Tests', () => {
  const mockWorkspaceId = '11111111-1111-1111-1111-111111111111';
  const mockUserId = '22222222-2222-2222-2222-222222222222';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should resolve the correct workspace membership role for an active user session', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: { role: 'brand_strategist' }, error: null }),
          }),
        }),
      }),
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const role = await getWorkspaceRole(mockWorkspaceId, mockUserId);

    expect(role).toBe('brand_strategist');
    expect(mockFrom).toHaveBeenCalledWith('workspace_memberships');
  });

  it('should block operations if the user is not a registered member of the workspace', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const isAllowed = await checkWorkspacePermission(mockWorkspaceId, mockUserId, ['admin', 'owner']);

    expect(isAllowed).toBe(false);
  });

  it('should authorize mutative actions only if the user has an elevated workspace role', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: { role: 'admin' }, error: null }),
          }),
        }),
      }),
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const isAllowed = await checkWorkspacePermission(mockWorkspaceId, mockUserId, ['admin', 'owner']);

    expect(isAllowed).toBe(true);
  });

  it('should block read-only roles (e.g., executive_viewer) from executing mutative operations', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: { role: 'executive_viewer' }, error: null }),
          }),
        }),
      }),
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const isAllowed = await checkWorkspacePermission(mockWorkspaceId, mockUserId, ['owner', 'admin']);

    expect(isAllowed).toBe(false);
  });
});
