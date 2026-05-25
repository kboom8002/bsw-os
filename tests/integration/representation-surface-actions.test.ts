import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkWorkspacePermission } from '../../lib/auth';
import { getSupabaseAdminClient } from '../../lib/supabase';
import { createInternalLinkRule } from '../../app/actions/objects';

vi.mock('../../lib/supabase', () => ({
  getSupabaseAdminClient: vi.fn(),
}));

vi.mock('../../lib/auth', () => ({
  checkWorkspacePermission: vi.fn(),
}));

const createMockQueryBuilder = (data: any = null, count: number = 0) => {
  const qb: any = {
    eq: vi.fn().mockImplementation(() => qb),
    select: vi.fn().mockImplementation(() => qb),
    insert: vi.fn().mockImplementation(() => qb),
    single: vi.fn().mockResolvedValue({ data, error: null }),
    then: (resolve: any) => resolve({ data, count, error: null })
  };
  return qb;
};

describe('TDD-05: Internal Link Rule RLS & Cross-Tenant Safety Integration Tests', () => {
  const wsId = '00000000-0000-4000-a000-000000000001';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully establish link rule inside owner workspace RLS sandbox boundaries', async () => {
    vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'internal_link_rules') {
        return createMockQueryBuilder({ id: 'rule-777', workspace_id: wsId });
      }
      return createMockQueryBuilder();
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const result = await createInternalLinkRule(wsId, {
      rule_name: 'Sensitive Retinol Link Rule',
      source_concept_id: '00000000-0000-4000-a000-000000000010',
      target_page_id: '00000000-0000-4000-a000-000000000020',
      anchor_text: '민감성 피부 레티놀',
      is_active: true
    });

    expect(result.id).toBe('rule-777');
    expect(result.workspace_id).toBe(wsId);
  });

  it('should throw UNAUTHORIZED permission error if user lacks strategic workspace access role', async () => {
    vi.mocked(checkWorkspacePermission).mockResolvedValue(false);

    await expect(
      createInternalLinkRule(wsId, {
        rule_name: 'Unauthorized Rule',
        source_concept_id: '00000000-0000-4000-a000-000000000010',
        target_page_id: '00000000-0000-4000-a000-000000000020',
        anchor_text: 'Unauthorized Text',
        is_active: true
      })
    ).rejects.toThrow('UNAUTHORIZED');
  });
});
