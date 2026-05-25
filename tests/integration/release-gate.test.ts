import { describe, it, expect, vi, beforeEach } from 'vitest';
import { evaluateReleaseGates } from '../../app/actions/release';
import { getSupabaseAdminClient } from '../../lib/supabase';
import { checkWorkspacePermission } from '../../lib/auth';

vi.mock('../../lib/supabase', () => ({
  getSupabaseAdminClient: vi.fn(),
}));

vi.mock('../../lib/auth', () => ({
  checkWorkspacePermission: vi.fn(),
}));

const createMockQueryBuilder = (data: any = null, error: any = null) => {
  const qb: any = {
    eq: vi.fn().mockImplementation(() => qb),
    select: vi.fn().mockImplementation(() => qb),
    single: vi.fn().mockResolvedValue({ data, error }),
    then: (resolve: any) => resolve({ data, error })
  };
  return qb;
};

describe('BSW-OS Release-Gate Failure Block Integration Tests (TDD-06)', () => {
  const mockWorkspaceId = 'e2fa0fcd-99b3-46bc-81bf-4b216fb0ffcf';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkWorkspacePermission).mockResolvedValue(true);
  });

  it('should PASS release gates when all 3 MVP domains are seeded', async () => {
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'domains') {
        return createMockQueryBuilder([
          { slug: 'k-beauty-skincare' },
          { slug: 'convenience-retail' },
          { slug: 'wedding-services' }
        ]);
      }
      return createMockQueryBuilder([]);
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const result = await evaluateReleaseGates(mockWorkspaceId);

    expect(result.status).toBe('pass');
    expect(result.gates.demoGate.status).toBe('pass');
    expect(result.blockers.length).toBe(0);
  });

  it('should FAIL release gates when convenince domain is missing from seed', async () => {
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'domains') {
        return createMockQueryBuilder([
          { slug: 'k-beauty-skincare' },
          { slug: 'wedding-services' }
        ]);
      }
      return createMockQueryBuilder([]);
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const result = await evaluateReleaseGates(mockWorkspaceId);

    expect(result.status).toBe('fail');
    expect(result.gates.demoGate.status).toBe('fail');
    expect(result.blockers.length).toBeGreaterThan(0);
    expect(result.blockers[0]).toContain('Demo Release Gate: Skeletons for K-Beauty');
    expect(result.requiredFixes[0]).toContain('Run the full-loop domain seed');
  });
});
