import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createVibeRatingEvent, createVibeSpec } from '../../app/actions/persona';
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
    update: vi.fn().mockImplementation(() => qb),
    single: vi.fn().mockResolvedValue({ data, error: null }),
  };
  return qb;
};

describe('Vibe Rating and Evidence Test (TDD-06)', () => {
  const mockWorkspaceId = '11111111-1111-4111-a111-111111111111';
  const mockVibeSpecId = '22222222-2222-4222-a222-222222222222';
  const mockTargetId = '33333333-3333-4333-a333-333333333333';
  const mockEvidenceId = '44444444-4444-4444-a444-444444444444';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should block Vibe rating event creation if evidence_item_id is completely missing', async () => {
    vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

    const payload = {
      vibe_spec_id: mockVibeSpecId,
      target_id: mockTargetId,
      target_type: 'page',
      rating_scores: { clinical: 50, warm: 30, luxury: 20 },
      // evidence_item_id missing!
    };

    await expect(createVibeRatingEvent(mockWorkspaceId, payload)).rejects.toThrow(
      'No evidence, no vibe score. The vibe rating event lacks a clinical evidence reference link.'
    );
  });

  it('should block Vibe rating event if the evidence is not verified', async () => {
    vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'evidence_items') {
        return createMockQueryBuilder({
          id: mockEvidenceId,
          is_verified: false, // Not verified!
        });
      }
      return createMockQueryBuilder();
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const payload = {
      vibe_spec_id: mockVibeSpecId,
      target_id: mockTargetId,
      target_type: 'page',
      rating_scores: { clinical: 50, warm: 30, luxury: 20 },
      evidence_item_id: mockEvidenceId,
    };

    await expect(createVibeRatingEvent(mockWorkspaceId, payload)).rejects.toThrow(
      'No evidence, no vibe score. The linked evidence item must be actively VERIFIED first.'
    );
  });

  it('should validate VibeSpec vector sum is exactly 100%', async () => {
    vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

    const invalidSpec = {
      vibe_name: 'Overpowered Luxury',
      slug: 'overpowered-luxury',
      target_vector: { clinical: 50, warm: 40, luxury: 30 }, // Sum is 120!
    };

    await expect(createVibeSpec(mockWorkspaceId, invalidSpec)).rejects.toThrow(
      'Validation Error: Target vector sums must equal exactly 100%'
    );
  });

  it('should successfully create VibeSpec when target vector sum is exactly 100%', async () => {
    vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

    const mockFrom = vi.fn().mockImplementation(() => {
      return createMockQueryBuilder({
        id: mockVibeSpecId,
        vibe_name: 'Balanced Spec',
        slug: 'balanced-spec',
        target_vector: { clinical: 50, warm: 30, luxury: 20 },
      });
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const validSpec = {
      vibe_name: 'Balanced Spec',
      slug: 'balanced-spec',
      target_vector: { clinical: 50, warm: 30, luxury: 20 },
      anti_vibe_keywords: ['cheap', 'scam'],
    };

    const result = await createVibeSpec(mockWorkspaceId, validSpec);
    expect(result.slug).toBe('balanced-spec');
  });
});
