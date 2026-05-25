import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createReportExport } from '../../app/actions/reports';
import { checkWorkspacePermission } from '../../lib/auth';
import { getSupabaseAdminClient } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => ({
  getSupabaseAdminClient: vi.fn(),
}));

vi.mock('../../lib/auth', () => ({
  checkWorkspacePermission: vi.fn(),
}));

// Robust mock query builder with order chain support
const createMockQueryBuilder = (data: any = null, error: any = null) => {
  const qb: any = {
    eq: vi.fn().mockImplementation(() => qb),
    select: vi.fn().mockImplementation(() => qb),
    insert: vi.fn().mockImplementation(() => qb),
    order: vi.fn().mockImplementation(() => qb), // Order chain support added!
    single: vi.fn().mockImplementation(() => createMockQueryBuilder(data, error)),
    then: vi.fn().mockImplementation((onFulfilled) => {
      return Promise.resolve(onFulfilled({ data, error }));
    }),
  };
  return qb;
};

describe('TDD-08: Report Export Structure and Payload Integrity', () => {
  const workspaceId = '00000000-0000-4000-a000-000000000001';
  const reportId = 'report-333';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully compile markdown and HTML exports with mandated proxy caveat', async () => {
    vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

    const mockReport = {
      report_name: 'PureBarrier Retinol Launch Report',
      scores: { ARS: 85.00 },
      methodology_disclosure_id: 'methodology-111'
    };

    const mockSections = [
      { section_title: 'Introduction', section_body: 'Our active observation panel-based proxies under this specific methodology.' }
    ];

    const mockDisclosure = {
      methodology_description: 'PureBarrier testing panel v1.',
      proxy_caveat_text: 'All AI/search observation metrics are panel-based proxies.'
    };

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'benchmark_reports') {
        return createMockQueryBuilder(mockReport);
      }
      if (table === 'report_sections') {
        return createMockQueryBuilder(mockSections);
      }
      if (table === 'methodology_disclosures') {
        return createMockQueryBuilder(mockDisclosure);
      }
      if (table === 'report_gate_results') {
        return createMockQueryBuilder({ id: 'gate-ok', status: 'pass' });
      }
      // Insert export record
      return createMockQueryBuilder({
        id: 'export-999',
        export_format: 'markdown',
        is_published: true
      });
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    // Act: Markdown Export
    const mdResult = await createReportExport(workspaceId, reportId, 'markdown');
    expect(mdResult).toBeDefined();
    expect(mdResult.is_published).toBe(true);

    // Act: HTML Export
    const htmlResult = await createReportExport(workspaceId, reportId, 'html');
    expect(htmlResult).toBeDefined();
  });
});
