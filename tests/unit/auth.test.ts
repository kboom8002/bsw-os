import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getWorkspaceRole, checkWorkspacePermission } from '../../lib/auth';

const mockMaybeSingle = vi.fn();
const mockEq2 = vi.fn(() => ({ maybeSingle: mockMaybeSingle }));
const mockEq1 = vi.fn(() => ({ eq: mockEq2 }));
const mockSelect = vi.fn(() => ({ eq: mockEq1 }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));

vi.mock('../../lib/supabase', () => {
  return {
    getSupabaseAdminClient: vi.fn(() => ({
      from: mockFrom,
    })),
  };
});

describe('BSW-OS Server-side Authorization RBAC Tests (TDD-02)', () => {
  const originalWindow = typeof window !== 'undefined' ? window : undefined;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (originalWindow) {
      global.window = originalWindow as any;
    } else {
      // @ts-ignore
      delete global.window;
    }
  });

  it('should throw error when getWorkspaceRole is invoked on client (window defined)', async () => {
    global.window = {} as any;

    await expect(getWorkspaceRole('ws-1', 'user-1')).rejects.toThrow(
      'SECURITY BREACH: getWorkspaceRole can only be executed on the server side.'
    );
  });

  it('should return role successfully when membership exists', async () => {
    // @ts-ignore
    delete global.window;

    mockMaybeSingle.mockResolvedValueOnce({
      data: { role: 'owner' },
      error: null,
    });

    const role = await getWorkspaceRole('ws-1', 'user-1');
    expect(role).toBe('owner');
    expect(mockFrom).toHaveBeenCalledWith('workspace_memberships');
    expect(mockSelect).toHaveBeenCalledWith('role');
    expect(mockEq1).toHaveBeenCalledWith('workspace_id', 'ws-1');
    expect(mockEq2).toHaveBeenCalledWith('user_id', 'user-1');
  });

  it('should return null when membership does not exist or DB error occurs', async () => {
    // @ts-ignore
    delete global.window;

    // case 1: no data
    mockMaybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });
    let role = await getWorkspaceRole('ws-1', 'user-1');
    expect(role).toBeNull();

    // case 2: DB error
    mockMaybeSingle.mockResolvedValueOnce({
      data: null,
      error: new Error('DB Error'),
    });
    role = await getWorkspaceRole('ws-1', 'user-1');
    expect(role).toBeNull();
  });

  it('should authorize allowed roles correctly via checkWorkspacePermission', async () => {
    // @ts-ignore
    delete global.window;

    // case 1: role is owner, allowed roles includes owner -> true
    mockMaybeSingle.mockResolvedValueOnce({
      data: { role: 'owner' },
      error: null,
    });
    let allowed = await checkWorkspacePermission('ws-1', 'user-1', ['owner', 'admin']);
    expect(allowed).toBe(true);

    // case 2: role is executive_viewer, allowed roles does not include executive_viewer -> false
    mockMaybeSingle.mockResolvedValueOnce({
      data: { role: 'executive_viewer' },
      error: null,
    });
    allowed = await checkWorkspacePermission('ws-1', 'user-1', ['owner', 'admin']);
    expect(allowed).toBe(false);

    // case 3: no role (null) -> false
    mockMaybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });
    allowed = await checkWorkspacePermission('ws-1', 'user-1', ['owner', 'admin']);
    expect(allowed).toBe(false);
  });
});
