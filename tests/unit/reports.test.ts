import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  createBenchmarkReport,
  updateBenchmarkReport,
  addReportSection,
  updateReportSection,
  generateReportDraft,
  attachMetricSnapshots,
  attachDomainIndexSnapshot,
  attachMethodologyDisclosure,
  runUnsafeWordingCheck,
  resolveUnsafeWordingFinding,
  reviewReport,
  evaluateReportExportGate,
  createReportExport
} from '../../app/actions/reports';
import { getSupabaseAdminClient } from '../../lib/supabase';
import { checkWorkspacePermission } from '../../lib/auth';

// Mock Supabase client and auth RBAC permission helper
vi.mock('../../lib/supabase', () => ({
  getSupabaseAdminClient: vi.fn(),
}));

vi.mock('../../lib/auth', () => ({
  checkWorkspacePermission: vi.fn(),
}));

const createMockQueryBuilder = (data: any = null, count: number = 0) => {
  let capturedData = data;
  const qb: any = {
    eq: vi.fn().mockImplementation(() => qb),
    select: vi.fn().mockImplementation(() => qb),
    insert: vi.fn().mockImplementation((payload) => {
      capturedData = Array.isArray(payload) ? payload : { ...capturedData, ...payload };
      return qb;
    }),
    update: vi.fn().mockImplementation((payload) => {
      capturedData = { ...capturedData, ...payload };
      return qb;
    }),
    single: vi.fn().mockImplementation(async () => {
      return { data: capturedData, error: null };
    }),
    order: vi.fn().mockImplementation(() => qb),
    then: (resolve: any) => resolve({ data: capturedData, count, error: null })
  };
  return qb;
};

describe('BSW-OS Report Publisher MVP Test Suite (AG-B7)', () => {
  const mockWorkspaceId = '11111111-1111-4111-a111-111111111111';
  const mockReportId = '22222222-2222-4222-b222-222222222222';
  const mockDisclosureId = '33333333-3333-4333-c333-333333333333';
  const mockRunId = '44444444-4444-4444-d444-444444444444';
  const mockSnapshotId = '55555555-5555-4555-e555-555555555555';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Unsafe Wording Scan Algorithm', () => {
    it('should flag unsafe market-share and ranking terms inside report sections', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === "report_sections") {
          return createMockQueryBuilder([
            {
              section_title: "Summary",
              section_body: "We guarantee ranking and control substantial market share through hidden preference metrics."
            }
          ]);
        }
        if (table === "unsafe_wording_findings") {
          return createMockQueryBuilder({ id: "find-1" });
        }
        return createMockQueryBuilder();
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      const findings = await runUnsafeWordingCheck(mockWorkspaceId, mockReportId);
      // forbidden terms detected: "market share", "hidden preference", "guarantee ranking"
      expect(findings.length).toBeGreaterThan(0);
      expect(mockFrom).toHaveBeenCalledWith("report_sections");
      expect(mockFrom).toHaveBeenCalledWith("unsafe_wording_findings");
    });
  });

  describe('2. AI Section Draft Candidate Defaults', () => {
    it('should default all AI-drafted report sections as candidate by default', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === "report_sections") {
          return createMockQueryBuilder({ id: "sec-mock" });
        }
        return createMockQueryBuilder();
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      const sections = await generateReportDraft(mockWorkspaceId, mockReportId);
      expect(sections.length).toBe(2);
      expect(sections[0].status).toBe('candidate');
      expect(sections[1].status).toBe('candidate');
    });
  });

  describe('3. Traceability Metadata Integrities', () => {
    it('should preserve originating run reference on attaching metrics snapshots', async () => {
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === "metric_snapshots") {
          return createMockQueryBuilder([
            { metric_name: "ARS", metric_value: 95.00 },
            { metric_name: "OCR", metric_value: 88.00 }
          ]);
        }
        if (table === "benchmark_reports") {
          return createMockQueryBuilder({ id: mockReportId });
        }
        return createMockQueryBuilder();
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      const report = await attachMetricSnapshots(mockWorkspaceId, mockReportId, mockRunId);
      expect(report.scores.ARS).toBe(95.00);
      expect(report.scores_metadata.source_observation_run_id).toBe(mockRunId);
    });

    it('should preserve snapshot references when binding domain indices', async () => {
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === "domain_index_snapshots") {
          return createMockQueryBuilder({ computed_value: 75.00, details: { test: "mock" } });
        }
        if (table === "benchmark_reports") {
          return createMockQueryBuilder({ id: mockReportId });
        }
        return createMockQueryBuilder();
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      const report = await attachDomainIndexSnapshot(mockWorkspaceId, mockReportId, mockSnapshotId);
      expect(report.scores.index_value).toBe(75.00);
      expect(report.scores_metadata.source_index_snapshot_id).toBe(mockSnapshotId);
    });
  });

  describe('4. Publication Release Gates & Export Blockers', () => {
    it('should fail export evaluation if methodology appendix is missing', async () => {
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === "benchmark_reports") {
          return createMockQueryBuilder({
            report_name: "Retinol Audit Report",
            scores: { ARS: 90.00 },
            methodology_disclosure_id: null // MISSING methodology!
          });
        }
        if (table === "report_sections") {
          return createMockQueryBuilder([
            { section_body: "observed proxy: Panel measures statistical scores." }
          ]);
        }
        if (table === "unsafe_wording_findings") {
          return createMockQueryBuilder([]); // no unresolved issues
        }
        if (table === "report_gate_results") {
          return createMockQueryBuilder({ id: "gate-1" });
        }
        return createMockQueryBuilder();
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      const verdict = await evaluateReportExportGate(mockWorkspaceId, mockReportId);
      expect(verdict.status).toBe('fail');
      expect(verdict.blockingReasons.some(r => r.includes("Methodology Appendix"))).toBe(true);
    });

    it('should fail export evaluation if standard proxy caveats are absent from content', async () => {
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === "benchmark_reports") {
          return createMockQueryBuilder({
            report_name: "Retinol Audit Report",
            scores: { ARS: 90.00 },
            methodology_disclosure_id: mockDisclosureId
          });
        }
        if (table === "report_sections") {
          return createMockQueryBuilder([
            { section_body: "Missing proxy caveats disclaimer." } // CAVEAT TEXT MISSING
          ]);
        }
        if (table === "unsafe_wording_findings") {
          return createMockQueryBuilder([]); 
        }
        if (table === "report_gate_results") {
          return createMockQueryBuilder({ id: "gate-2" });
        }
        return createMockQueryBuilder();
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      const verdict = await evaluateReportExportGate(mockWorkspaceId, mockReportId);
      expect(verdict.status).toBe('fail');
      expect(verdict.blockingReasons.some(r => r.includes("proxy caveat"))).toBe(true);
    });

    it('should fail export evaluation if competitive real-brand reports lack manual strategist approved reviews', async () => {
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === "benchmark_reports") {
          return createMockQueryBuilder({
            report_name: "CompetitorA Deep Retinol Audit", // COMPETITIVE!
            scores: { ARS: 90.00 },
            methodology_disclosure_id: mockDisclosureId
          });
        }
        if (table === "report_sections") {
          return createMockQueryBuilder([
            { section_body: "observed proxy: Panel measures statistical scores." }
          ]);
        }
        if (table === "unsafe_wording_findings") {
          return createMockQueryBuilder([]); 
        }
        if (table === "report_reviews") {
          return createMockQueryBuilder([]); // LACKS manual approved review!
        }
        if (table === "report_gate_results") {
          return createMockQueryBuilder({ id: "gate-3" });
        }
        return createMockQueryBuilder();
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      const verdict = await evaluateReportExportGate(mockWorkspaceId, mockReportId);
      expect(verdict.status).toBe('fail');
      expect(verdict.blockingReasons.some(r => r.includes("Competitive real-brand"))).toBe(true);
    });

    it('should block createReportExport actions if any gate releases fail', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === "benchmark_reports") {
          return createMockQueryBuilder({
            report_name: "Weekly Retinol Report",
            scores: { ARS: 90.00 },
            methodology_disclosure_id: null // BLOCKED: no methodology
          });
        }
        if (table === "report_sections") {
          return createMockQueryBuilder([]);
        }
        if (table === "unsafe_wording_findings") {
          return createMockQueryBuilder([]);
        }
        if (table === "report_gate_results") {
          return createMockQueryBuilder({ id: "gate-4" });
        }
        return createMockQueryBuilder();
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      await expect(createReportExport(mockWorkspaceId, mockReportId, 'markdown')).rejects.toThrow(
        "EXPORT SECURITY BLOCKED: Report failed the safety publication gate."
      );
    });
  });
});
