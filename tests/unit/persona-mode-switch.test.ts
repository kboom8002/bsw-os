import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validatePersonaCrisisContent, detectAuthorityOverreach } from '../../app/actions/persona';
import { getSupabaseAdminClient } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => ({
  getSupabaseAdminClient: vi.fn(),
}));

const createMockQueryBuilder = (data: any = null) => {
  const qb: any = {
    eq: vi.fn().mockImplementation(() => qb),
    select: vi.fn().mockImplementation(() => qb),
    single: vi.fn().mockResolvedValue({ data, error: null }),
  };
  return qb;
};

describe('Persona Mode Switching and Safe Content Test (TDD-06)', () => {
  const mockWorkspaceId = '11111111-1111-4111-a111-111111111111';
  const mockPersonaId = '22222222-2222-4222-b222-222222222222';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should block aggressive commercial CTA when persona is in CRISIS mode', async () => {
    const mockFrom = vi.fn().mockImplementation(() => {
      return createMockQueryBuilder({
        current_mode: 'crisis',
      });
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const badContent = 'Buy now to secure your skin protection with 50% discount!';
    await expect(validatePersonaCrisisContent(mockWorkspaceId, mockPersonaId, badContent)).rejects.toThrow(
      'CRISIS MODE ACTION BLOCK: Aggressive commercial CTA trigger word'
    );
  });

  it('should allow neutral informational content in CRISIS mode', async () => {
    const mockFrom = vi.fn().mockImplementation(() => {
      return createMockQueryBuilder({
        current_mode: 'crisis',
      });
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const safeContent = 'Please read our product ingredients list carefully for potential allergens.';
    await expect(validatePersonaCrisisContent(mockWorkspaceId, mockPersonaId, safeContent)).resolves.not.toThrow();
  });

  it('should flag authority overreach when claiming clinical facts without clinical authority scope', async () => {
    const mockFrom = vi.fn().mockImplementation(() => {
      return createMockQueryBuilder({
        persona_name: 'Friendly Concierge',
        authority_scope: ['warm_tone', 'casual_chat'], // Lacks 'clinical'
      });
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const overreachingClaim = 'This treatment clinically diagnoses and resolves severe eczema.';
    const result = await detectAuthorityOverreach(mockWorkspaceId, mockPersonaId, overreachingClaim);

    expect(result.overreach).toBe(true);
    expect(result.violations[0]).toContain('requires "clinical" authority');
  });

  it('should pass authority check when claiming clinical facts with clinical authority scope', async () => {
    const mockFrom = vi.fn().mockImplementation(() => {
      return createMockQueryBuilder({
        persona_name: 'Derm Advisor',
        authority_scope: ['clinical', 'medical'],
      });
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const claim = 'This formula was clinically evaluated for sensitive skin.';
    const result = await detectAuthorityOverreach(mockWorkspaceId, mockPersonaId, claim);

    expect(result.overreach).toBe(false);
  });
});
