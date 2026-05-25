import { describe, it, expect, vi, beforeEach } from 'vitest';
import { evaluateReportExportGate } from '../../app/actions/reports';
import { getSupabaseAdminClient } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => ({
  getSupabaseAdminClient: vi.fn(),
}));

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

describe('TDD-08: Report Export Gate Security Hardening', () => {
  const workspaceId = '00000000-0000-4000-a000-000000000001';
  const reportId = 'report-111';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should block export when methodology link is missing', async () => {
    const mockReport = {
      report_name: 'Core Skincare Report',
      scores: {},
      methodology_disclosure_id: null
    };

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'benchmark_reports') {
        return createMockQueryBuilder(mockReport);
      }
      if (table === 'report_sections') {
        return createMockQueryBuilder([]); // Enforce empty array instead of undefined to satisfy map()
      }
      return createMockQueryBuilder({ id: 'gate-result-id' });
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const gate = await evaluateReportExportGate(workspaceId, reportId);
    expect(gate.status).toBe('fail');
    expect(gate.blockingReasons).toContain("Report lacks a Methodology Appendix disclosure link. Benchmark reports cannot be published without unrolling methodology definitions.");
  });

  it('should block export when proxy caveat is missing in content body', async () => {
    const mockReport = {
      report_name: 'Core Skincare Report',
      scores: {},
      methodology_disclosure_id: 'methodology-111'
    };

    const mockSections = [
      { section_body: 'This skincare brand Retinol product has great clinical efficacy.' }
    ];

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'benchmark_reports') {
        return createMockQueryBuilder(mockReport);
      }
      if (table === 'report_sections') {
        return createMockQueryBuilder(mockSections);
      }
      return createMockQueryBuilder({ id: 'gate-result-id' });
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const gate = await evaluateReportExportGate(workspaceId, reportId);
    expect(gate.status).toBe('fail');
    expect(gate.blockingReasons).toContain("Report fails proxy caveat validation. The standard proxy caveat disclaimer must be present in the content body.");
  });

  it('should block export when there are unresolved unsafe wording findings', async () => {
    const mockReport = {
      report_name: 'Core Skincare Report',
      scores: {},
      methodology_disclosure_id: 'methodology-111'
    };

    const mockSections = [
      { section_body: 'Our active observation panel-based proxies under this specific methodology.' }
    ];

    const mockFindings = [
      { id: 'finding-111', is_resolved: false }
    ];

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'benchmark_reports') {
        return createMockQueryBuilder(mockReport);
      }
      if (table === 'report_sections') {
        return createMockQueryBuilder(mockSections);
      }
      if (table === 'unsafe_wording_findings') {
        return createMockQueryBuilder(mockFindings);
      }
      return createMockQueryBuilder({ id: 'gate-result-id' });
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const gate = await evaluateReportExportGate(workspaceId, reportId);
    expect(gate.status).toBe('fail');
    expect(gate.blockingReasons).toContain("Unresolved unsafe market-share or brand-ranking wording findings were detected. Reports must not assert definitive AI market share.");
  });

  it('should block competitive real-brand reports if manual review is not approved', async () => {
    const mockReport = {
      report_name: 'Competitive Brand Ranking Report',
      scores: {},
      methodology_disclosure_id: 'methodology-111'
    };

    const mockSections = [
      { section_body: 'Our active observation panel-based proxies under this specific methodology.' }
    ];

    const mockReviews: any[] = [];

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'benchmark_reports') {
        return createMockQueryBuilder(mockReport);
      }
      if (table === 'report_sections') {
        return createMockQueryBuilder(mockSections);
      }
      if (table === 'report_reviews') {
        return createMockQueryBuilder(mockReviews);
      }
      return createMockQueryBuilder({ id: 'gate-result-id' });
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const gate = await evaluateReportExportGate(workspaceId, reportId);
    expect(gate.status).toBe('fail');
    expect(gate.blockingReasons).toContain("Competitive real-brand benchmark reports require an approved manual review before export to satisfy safety boundary constraints.");
  });
});
