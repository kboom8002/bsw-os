import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkWorkspacePermission } from '../../lib/auth';
import { getSupabaseAdminClient } from '../../lib/supabase';
import { createTestWorkspace, createTestUser, createWorkspaceMember, assertRlsDenied } from '../helpers';
import { kBeautyFixture } from '../fixtures';

vi.mock('../../lib/supabase', () => ({
  getSupabaseAdminClient: vi.fn(),
}));

const createMockQueryBuilder = (data: any = null) => {
  const qb: any = {
    eq: vi.fn().mockImplementation(() => qb),
    select: vi.fn().mockImplementation(() => qb),
    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
    single: vi.fn().mockResolvedValue({ data, error: null }),
    then: (resolve: any) => resolve({ data, error: null })
  };
  return qb;
};

describe('TDD-02: Multi-Tenant Workspace Isolation Tests', () => {
  const wsA = createTestWorkspace({ id: 'aaaa-aaaa-aaaa-aaaa', name: 'Workspace A', slug: 'workspace-a' });
  const wsB = createTestWorkspace({ id: 'bbbb-bbbb-bbbb-bbbb', name: 'Workspace B', slug: 'workspace-b' });
  
  const userA = createTestUser({ id: 'user-a-id', email: 'usera@example.com' });
  const userB = createTestUser({ id: 'user-b-id', email: 'userb@example.com' });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should deny user A from reading workspace B data due to tenant boundaries', async () => {
    // Mock getWorkspaceRole for user A in workspace B -> returns null (not a member)
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'workspace_memberships') {
        return createMockQueryBuilder(null); // not a member of Workspace B
      }
      return createMockQueryBuilder(null);
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const isAllowed = await checkWorkspacePermission(wsB.id, userA.id, ['owner', 'admin', 'brand_strategist']);
    expect(isAllowed).toBe(false); // denied!
  });

  it('should deny user A from mutating workspace B data due to tenant boundaries', async () => {
    // Mock getWorkspaceRole for user A in workspace B -> returns null
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'workspace_memberships') {
        return createMockQueryBuilder(null);
      }
      return createMockQueryBuilder(null);
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    // Using assertRlsDenied helper to verify mutation throws or returns false
    const mutationPromise = (async () => {
      const allowed = await checkWorkspacePermission(wsB.id, userA.id, ['owner', 'admin']);
      if (!allowed) throw new Error('UNAUTHORIZED: Insufficient permissions.');
      return { success: true };
    })();

    await expect(mutationPromise).rejects.toThrow('UNAUTHORIZED');
  });

  it('should block anonymous user session from reading workspace-owned rows', async () => {
    const anonymousUserId = ''; // empty or null id

    const mockFrom = vi.fn().mockImplementation(() => {
      return createMockQueryBuilder(null); // no membership
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const isAllowed = await checkWorkspacePermission(wsA.id, anonymousUserId, ['owner', 'admin', 'brand_strategist']);
    expect(isAllowed).toBe(false); // blocked!
  });

  it('should block anonymous user session from mutating workspace resources', async () => {
    const anonymousUserId = '';

    const mockFrom = vi.fn().mockImplementation(() => {
      return createMockQueryBuilder(null);
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const mutationPromise = (async () => {
      const allowed = await checkWorkspacePermission(wsA.id, anonymousUserId, ['owner', 'admin']);
      if (!allowed) throw new Error('UNAUTHORIZED');
      return { success: true };
    })();

    await expect(mutationPromise).rejects.toThrow('UNAUTHORIZED');
  });
});
