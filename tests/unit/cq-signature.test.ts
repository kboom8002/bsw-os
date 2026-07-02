import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkWorkspacePermission } from '../../lib/auth';
import { getSupabaseAdminClient } from '../../lib/supabase';
import { createCanonicalQuestion, mergeCanonicalQuestions } from '../../app/actions/semantic';

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
    in: vi.fn().mockImplementation(() => qb),
    select: vi.fn().mockImplementation(() => qb),
    insert: vi.fn().mockImplementation(() => qb),
    update: vi.fn().mockImplementation(() => qb),
    delete: vi.fn().mockImplementation(() => qb),
    single: vi.fn().mockResolvedValue({ data, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
    then: (resolve: any) => resolve({ data, count, error: null })
  };
  return qb;
};

describe('TDD-04: Canonical Question Signature Deduplication & Merge Tests', () => {
  const wsId = '00000000-0000-4000-a000-000000000001';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should block createCanonicalQuestion with Zod validation or DB deduplication error if signature already exists', async () => {
    vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'canonical_questions') {
        // Mock that we already have an existing CQ with that signature
        return createMockQueryBuilder({ id: 'cq-existing-1', signature: 'sig-123' });
      }
      return createMockQueryBuilder();
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    await expect(
      createCanonicalQuestion(wsId, {
        question_capital_node_id: '00000000-0000-4000-a000-000000000010',
        normalized_question: 'How to apply pure Niacinamide correctly?',
        slug: 'how-to-apply-pure-niacinamide-correctly',
        signature: 'sig-123'
      })
    ).rejects.toThrow('DEDUPLICATION ERROR');
  });

  it('should merge Canonical Questions by moving QIS scenes and deleting source questions', async () => {
    vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

    const mockUpdateQuery = createMockQueryBuilder({ success: true });
    const mockDeleteQuery = createMockQueryBuilder({ success: true });

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'qis_scenes') {
        return mockUpdateQuery;
      }
      if (table === 'canonical_questions') {
        return mockDeleteQuery;
      }
      return createMockQueryBuilder();
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const result = await mergeCanonicalQuestions(wsId, 'target-cq-id', ['source-cq-1', 'source-cq-2']);

    expect(result.success).toBe(true);
    expect(result.mergedCount).toBe(2);

    expect(mockUpdateQuery.update).toHaveBeenCalledWith({ canonical_question_id: 'target-cq-id' });
    expect(mockUpdateQuery.in).toHaveBeenCalledWith('canonical_question_id', ['source-cq-1', 'source-cq-2']);
    expect(mockDeleteQuery.delete).toHaveBeenCalled();
    expect(mockDeleteQuery.in).toHaveBeenCalledWith('id', ['source-cq-1', 'source-cq-2']);
  });
});
