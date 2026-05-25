import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateProbePanel, createMethodologyDisclosure } from '../../app/actions/observatory';
import { checkWorkspacePermission } from '../../lib/auth';
import { getSupabaseAdminClient } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => ({
  getSupabaseAdminClient: vi.fn(),
}));

vi.mock('../../lib/auth', () => ({
  checkWorkspacePermission: vi.fn(),
}));

// A highly robust Promise-compatible Supabase query mock builder
const createMockQueryBuilder = (data: any = null, error: any = null) => {
  const qb: any = {
    eq: vi.fn().mockImplementation(() => qb),
    in: vi.fn().mockImplementation(() => qb),
    select: vi.fn().mockImplementation(() => qb),
    delete: vi.fn().mockImplementation(() => qb),
    insert: vi.fn().mockImplementation(() => qb),
    update: vi.fn().mockImplementation(() => qb),
    single: vi.fn().mockImplementation(() => createMockQueryBuilder(data, error)),
    maybeSingle: vi.fn().mockImplementation(() => createMockQueryBuilder(data, error)),
    // Satisfy await thenable
    then: vi.fn().mockImplementation((onFulfilled) => {
      return Promise.resolve(onFulfilled({ data, error }));
    }),
  };
  return qb;
};

describe('TDD-07: Observatory Actions Integration and Security Hardening', () => {
  const workspaceId = '00000000-0000-4000-a000-000000000001';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should block updates to locked probe panels', async () => {
    vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

    // Mock that the probe panel is currently LOCKED (is_locked = true)
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'probe_panels') {
        return createMockQueryBuilder({
          id: 'panel-locked-111',
          panel_name: 'Core Retinol Panel',
          version: 2,
          is_locked: true // LOCKED!
        });
      }
      return createMockQueryBuilder();
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    // Act & Assert: Expect updateProbePanel to throw lock block exception
    await expect(
      updateProbePanel(workspaceId, 'panel-locked-111', { panel_name: 'Altered Panel' })
    ).rejects.toThrow('CRITICAL LOCK BLOCK');
  });

  it('should enforce methodology disclosure proxy caveat matching the glossary rules', async () => {
    vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

    const mockFrom = vi.fn().mockImplementation(() => {
      return createMockQueryBuilder({
        id: 'disclosure-111',
        disclosure_name: 'skincare methodology',
        proxy_caveat_text: 'All AI/search observation metrics are panel-based proxies'
      });
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    // Act
    const result = await createMethodologyDisclosure(workspaceId, {
      disclosure_name: 'skincare methodology',
      methodology_description: 'PureBarrier skincare observation panel testing.'
    });

    // Assert
    expect(result).toBeDefined();
    expect(result.proxy_caveat_text).toContain('panel-based proxies');
  });
});
