import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runUnsafeWordingCheck } from '../../app/actions/reports';
import { getSupabaseAdminClient } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => ({
  getSupabaseAdminClient: vi.fn(),
}));

const createMockQueryBuilder = (data: any = null, error: any = null) => {
  const qb: any = {
    eq: vi.fn().mockImplementation(() => qb),
    select: vi.fn().mockImplementation(() => qb),
    insert: vi.fn().mockImplementation(() => qb),
    single: vi.fn().mockImplementation(() => createMockQueryBuilder(data, error)),
    then: vi.fn().mockImplementation((onFulfilled) => {
      return Promise.resolve(onFulfilled({ data, error }));
    }),
  };
  return qb;
};

describe('TDD-08: Unsafe Wording Scanner Hardening', () => {
  const workspaceId = '00000000-0000-4000-a000-000000000001';
  const reportId = 'report-222';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should flag forbidden and misleading terms inside report sections', async () => {
    // Mock section containing forbidden "actual market share" and "definitive ranking" terms
    const mockSections = [
      { section_title: 'Introduction', section_body: 'Our retinol delivers actual market share and produces legally final competitive rankings.' },
      { section_title: 'Fidelity', section_body: 'This guarantees visibility across SGE answer segments.' }
    ];

    const mockFrom = vi.fn().mockImplementation(() => {
      return createMockQueryBuilder(mockSections);
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const findings = await runUnsafeWordingCheck(workspaceId, reportId);
    expect(findings).toBeDefined();
    expect(findings.length).toBe(3); // Flagged: market share, legally final, guarantees visibility
  });

  it('should NOT flag approved proxy terminology and caveats', async () => {
    // Safe terms: "panel-based proxy", "observed AI/search-like response"
    const mockSections = [
      { section_title: 'Methodology Description', section_body: 'This report employs panel-based proxy measurement to analyze observed AI/search-like responses.' }
    ];

    const mockFrom = vi.fn().mockImplementation(() => {
      return createMockQueryBuilder(mockSections);
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const findings = await runUnsafeWordingCheck(workspaceId, reportId);
    expect(findings.length).toBe(0); // Safe words must pass with zero flags!
  });
});
