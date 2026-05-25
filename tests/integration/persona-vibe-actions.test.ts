import { describe, it, expect, vi, beforeEach } from 'vitest';
import { assignVibe } from '../../app/actions/persona';
import { checkWorkspacePermission } from '../../lib/auth';
import { getSupabaseAdminClient } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => ({
  getSupabaseAdminClient: vi.fn(),
}));

vi.mock('../../lib/auth', () => ({
  checkWorkspacePermission: vi.fn(),
}));

const createMockQueryBuilder = (data: any = null) => {
  const qb: any = {
    eq: vi.fn().mockImplementation(() => qb),
    select: vi.fn().mockImplementation(() => qb),
    delete: vi.fn().mockImplementation(() => qb),
    insert: vi.fn().mockImplementation(() => qb),
    single: vi.fn().mockResolvedValue({ data, error: null }),
  };
  return qb;
};

describe('Persona & Vibe Target Assignment Validation Integration Test (TDD-06)', () => {
  const mockWorkspaceId = '11111111-1111-4111-a111-111111111111';
  const mockVibeSpecId = '22222222-2222-4222-a222-222222222222';
  const mockTargetId = '33333333-3333-4333-a333-333333333333';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should accept vibe assignments for allowed target types: qis, object, surface, page, section', async () => {
    vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

    const allowedTypes = ['qis', 'object', 'surface', 'page', 'section'];

    for (const type of allowedTypes) {
      const mockFrom = vi.fn().mockImplementation(() => {
        return createMockQueryBuilder({
          vibe_spec_id: mockVibeSpecId,
          target_id: mockTargetId,
          target_type: type,
        });
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      const result = await assignVibe(mockWorkspaceId, mockVibeSpecId, mockTargetId, type);
      expect(result.target_type).toBe(type);
    }
  });

  it('should reject vibe assignment with Zod error if target_type is invalid (e.g. unknown target type)', async () => {
    vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

    const mockFrom = vi.fn().mockImplementation(() => createMockQueryBuilder());
    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    // Target type 'domain' or 'website' or arbitrary string is NOT in the allowed enum
    const invalidType = 'unsupported_entity_type';

    await expect(assignVibe(mockWorkspaceId, mockVibeSpecId, mockTargetId, invalidType)).rejects.toThrow(
      'Invalid option'
    );
  });
});
