import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkDarkPatternFlags } from '../../app/actions/persona';
import { getSupabaseAdminClient } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => ({
  getSupabaseAdminClient: vi.fn(),
}));

const createMockQueryBuilder = (data: any = null) => {
  const qb: any = {
    eq: vi.fn().mockImplementation(() => qb),
    select: vi.fn().mockImplementation(() => qb),
    then: (resolve: any) => resolve({ data, error: null }),
  };
  return qb;
};

describe('Linguistic Dark Pattern Guardrails Scanner Test (TDD-06)', () => {
  const mockWorkspaceId = '11111111-1111-4111-a111-111111111111';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should flag content with false scarcity patterns', async () => {
    const mockFrom = vi.fn().mockImplementation(() => {
      return createMockQueryBuilder([
        {
          rule_name: 'False Scarcity Block',
          forbidden_linguistic_triggers: ['only 2 left', 'limited time only', 'while supplies last'],
          is_active: true,
        },
      ]);
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const badContent = 'Hurry up! There are only 2 left in stock for this clinical serum!';
    const result = await checkDarkPatternFlags(mockWorkspaceId, badContent);

    expect(result.flagged).toBe(true);
    expect(result.violations[0]).toContain('by trigger "only 2 left"');
  });

  it('should flag content with fear-based selling triggers', async () => {
    const mockFrom = vi.fn().mockImplementation(() => {
      return createMockQueryBuilder([
        {
          rule_name: 'Fear-Based Selling Block',
          forbidden_linguistic_triggers: ['prevent permanent damage', 'ruin your skin forever', 'aging rapidly'],
          is_active: true,
        },
      ]);
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const badContent = 'If you do not use our retinol now, you will ruin your skin forever.';
    const result = await checkDarkPatternFlags(mockWorkspaceId, badContent);

    expect(result.flagged).toBe(true);
    expect(result.violations[0]).toContain('by trigger "ruin your skin forever"');
  });

  it('should flag content with pressure CTA triggers', async () => {
    const mockFrom = vi.fn().mockImplementation(() => {
      return createMockQueryBuilder([
        {
          rule_name: 'Pressure CTA Block',
          forbidden_linguistic_triggers: ['buy now or lose forever', 'immediate action required', 'don\'t miss your only chance'],
          is_active: true,
        },
      ]);
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const badContent = 'This is your final warning. Don\'t miss your only chance!';
    const result = await checkDarkPatternFlags(mockWorkspaceId, badContent);

    expect(result.flagged).toBe(true);
    expect(result.violations[0]).toContain('by trigger "don\'t miss your only chance"');
  });

  it('should allow normal informative clean content with no dark pattern triggers', async () => {
    const mockFrom = vi.fn().mockImplementation(() => {
      return createMockQueryBuilder([
        {
          rule_name: 'False Scarcity Block',
          forbidden_linguistic_triggers: ['only 2 left'],
          is_active: true,
        },
      ]);
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const safeContent = 'Our gentle exfoliating toner helps refine skin texture over daily usage.';
    const result = await checkDarkPatternFlags(mockWorkspaceId, safeContent);

    expect(result.flagged).toBe(false);
    expect(result.violations.length).toBe(0);
  });
});
