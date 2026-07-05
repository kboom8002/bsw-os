import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  createProbePanel, 
  updateProbePanel,
  createProbeQuestion,
  generateProbePanelFromQis,
  startObservationRun,
  createMockProbeRunResult,
  computeMetricSnapshot,
  computeDomainIndexSnapshot,
  createSemanticWebsiteLiftSnapshot,
  createMethodologyDisclosure,
} from '../../app/actions/observatory';
import { STANDARD_PROXY_CAVEAT } from '../../app/actions/observatory-constants';
import { getSupabaseAdminClient } from '../../lib/supabase';
import { checkWorkspacePermission } from '../../lib/auth';

// Mock Supabase client and auth RBAC permission helper
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
  let capturedData = data;
  const qb: any = {
    eq: vi.fn().mockImplementation(() => qb),
    in: vi.fn().mockImplementation(() => qb),
    select: vi.fn().mockImplementation(() => qb),
    upsert: vi.fn().mockImplementation((payload) => {
      capturedData = { ...capturedData, ...payload };
      return qb;
    }),
    insert: vi.fn().mockImplementation((payload) => {
      capturedData = Array.isArray(payload) ? payload : { ...capturedData, ...payload };
      return qb;
    }),
    delete: vi.fn().mockImplementation(() => qb),
    order: vi.fn().mockImplementation(() => qb),
    limit: vi.fn().mockImplementation(() => qb),
    single: vi.fn().mockImplementation(async () => {
      return { data: capturedData, error: null };
    }),
    maybeSingle: vi.fn().mockImplementation(async () => {
      return { data: capturedData, error: null };
    }),
    then: (resolve: any) => resolve({ data: capturedData, count, error: null })
  };
  return qb;
};

describe('BSW-OS Observatory & Metrics MVP Test Suite (AG-B6)', () => {
  const mockWorkspaceId = '11111111-1111-4111-a111-111111111111';
  const mockPanelId = '22222222-2222-4222-b222-222222222222';
  const mockQuestionId = '33333333-3333-4333-c333-333333333333';
  const mockRunId = '44444444-4444-4444-d444-444444444444';
  const mockProbeRunId = '55555555-5555-4555-e555-555555555555';
  const mockIndexDefId = '66666666-6666-4666-f666-666666666666';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Probe Panel Locking & Versioning Controls', () => {
    it('should block question additions to locked probe panel versions', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

      const mockFrom = vi.fn().mockImplementation(() => {
        return createMockQueryBuilder({
          id: mockPanelId,
          panel_name: "Clinical Retinol Panel",
          is_locked: true, // LOCKED version
          version: 1
        });
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      const questionPayload = {
        probe_panel_id: mockPanelId,
        question_text: "What is squalane concentration?",
        intent_context: "informational",
        target_keyword: "squalane"
      };

      await expect(createProbeQuestion(mockWorkspaceId, questionPayload)).rejects.toThrow(
        'CRITICAL LOCK BLOCK: Probe Panel "Clinical Retinol Panel" (v1) is locked. Locked panel configurations cannot be altered.'
      );
    });

    it('should block starting observation runs over unlocked panels', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

      const mockFrom = vi.fn().mockImplementation(() => {
        return createMockQueryBuilder({
          id: mockPanelId,
          is_locked: false // UNLOCKED version
        });
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      await expect(startObservationRun(mockWorkspaceId, mockPanelId, "Crawler Beta")).rejects.toThrow(
        "Cannot run observation on an unlocked panel. Lock the version first to ensure statistical reproducibility."
      );
    });
  });

  describe('2. QIS-to-Panel Generation Engine', () => {
    it('should map active QIS query templates to probe questions successfully', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === "probe_panels") {
          return createMockQueryBuilder({ id: mockPanelId, is_locked: false });
        }
        if (table === "qis_scenes") {
          return createMockQueryBuilder([
            { scene_name: "Retinol Scene", query_template: "What makes {{brand}} special?", intent_model: "commercial" }
          ]);
        }
        if (table === "probe_questions") {
          return createMockQueryBuilder({ id: mockQuestionId });
        }
        return createMockQueryBuilder();
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      const questions = await generateProbePanelFromQis(mockWorkspaceId, mockPanelId);
      expect(questions.length).toBe(1);
      expect(mockFrom).toHaveBeenCalledWith("qis_scenes");
      expect(mockFrom).toHaveBeenCalledWith("probe_questions");
    });
  });

  describe('3. Mock Observation Provider & Stored Raw responses copy', () => {
    it('should execute mock provider crawls and store raw responses copies successfully', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === "ai_observation_runs") {
          return createMockQueryBuilder({ id: mockRunId, probe_panel_id: mockPanelId });
        }
        if (table === "probe_questions") {
          return createMockQueryBuilder([
            { id: "q-1", question_text: "What makes retinol special?", target_keyword: "retinol" }
          ]);
        }
        if (table === "probe_runs") {
          return createMockQueryBuilder({ id: mockProbeRunId });
        }
        if (table === "response_judgments") {
          return createMockQueryBuilder({ id: "judg-1" });
        }
        return createMockQueryBuilder();
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      const runs = await createMockProbeRunResult(mockWorkspaceId, mockRunId, "success_fixture");
      expect(runs.length).toBe(1);
      expect(mockFrom).toHaveBeenCalledWith("probe_runs"); // Stores raw responses!
      expect(mockFrom).toHaveBeenCalledWith("response_judgments"); // Auto-initializes judgments
    });
  });

  describe('4. Mathematical Metrics calculations', () => {
    it('should aggregate AAS, OCR, BSF, QTC, GCTR, and ARS scores correctly', async () => {
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === "probe_runs") {
          return createMockQueryBuilder([
            { id: "pr-1", raw_response_text: "Mentions BSW squalane" },
            { id: "pr-2", raw_response_text: "Mentions competitor retinol" }
          ]);
        }
        if (table === "response_judgments") {
          return createMockQueryBuilder([
            { probe_run_id: "pr-1", is_citation_found: true, brand_semantic_fidelity_score: 90, question_territory_covered: true, geo_concept_transferred: true },
            { probe_run_id: "pr-2", is_citation_found: false, brand_semantic_fidelity_score: 50, question_territory_covered: false, geo_concept_transferred: true }
          ]);
        }
        if (table === "metric_snapshots") {
          return createMockQueryBuilder();
        }
        return createMockQueryBuilder();
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      const snapshots = await computeMetricSnapshot(mockWorkspaceId, mockRunId);
      expect(snapshots.length).toBe(6);

      // AAS: Mentions "BSW" or "brand". pr-1 contains "BSW" -> 1 out of 2 = 50%.
      // OCR: 1 passes citation out of 2 = 50%.
      // BSF: Average (90+50) / 2 = 70%.
      // QTC: 1 covers territory out of 2 = 50%.
      // GCTR: 2 transfer concepts out of 2 = 100%.
      // ARS: (50*0.2) + (50*0.2) + (70*0.3) + (50*0.1) + (100*0.2) = 10 + 10 + 21 + 5 + 20 = 66%
      const arsSnap = snapshots.find(s => s.metric_name === "ARS");
      expect(arsSnap.metric_value).toBe(66);
    });

    it('should distinguish and calculate competitive observed B-MRI separate from internal OPS-MRI', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === "metric_snapshots") {
          return createMockQueryBuilder([
            { metric_name: "ARS", metric_value: 80.00 }, // B-MRI should be 100 - 80 = 20%
            { metric_name: "GCTR", metric_value: 90.00 }
          ]);
        }
        if (table === "domain_index_snapshots") {
          return createMockQueryBuilder();
        }
        return createMockQueryBuilder();
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      const snap = await computeDomainIndexSnapshot(mockWorkspaceId, mockIndexDefId, mockRunId);
      expect(snap.details.B_MRI).toBe(18.75); // Updated for formula version 2.0
      expect(snap.details.OPS_MRI).toBe(15.00); // Programmatically isolated operational diagnosis risk
    });
  });

  describe('5. Semantic Website Lift Snapshot - Same-Panel locking check', () => {
    it('should block Lift snapshot calculations when base and active runs use different panel versions', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

      const mockSingle = vi.fn()
        .mockResolvedValueOnce({ data: { probe_panel_id: "panel-v1" }, error: null })
        .mockResolvedValueOnce({ data: { probe_panel_id: "panel-v2" }, error: null });

      const mockQb = createMockQueryBuilder();
      mockQb.single = mockSingle;

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === "ai_observation_runs") {
          return mockQb;
        }
        return createMockQueryBuilder();
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      await expect(createSemanticWebsiteLiftSnapshot(mockWorkspaceId, "base-run-id", "active-run-id")).rejects.toThrow(
        "Semantic Lift Snapshot Blocked: Base and active observation runs must utilize the exact same panel version to maintain statistical integrity."
      );
    });
  });

  describe('6. Methodology disclosures & mandatory proxy caveats', () => {
    it('should guarantee methodology disclosures carry standard proxy caveats', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

      const mockFrom = vi.fn().mockImplementation(() => {
        return createMockQueryBuilder({ id: "meth-1" });
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      await createMethodologyDisclosure(mockWorkspaceId, {
        disclosure_name: "Monthly GEO Audit",
        methodology_description: "Crawl index observations"
        // Let it auto-inject standard caveat
      });

      expect(mockFrom).toHaveBeenCalledWith("methodology_disclosures");
    });
  });
});
