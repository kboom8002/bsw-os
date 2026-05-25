import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  createRcaCase,
  updateRcaCase,
  createPatchTicket,
  updatePatchTicket,
  applyPatchArtifactChange,
  createRetestPlan,
  startRetestRun,
  completeRetestRun,
  computePostPatchLift,
  checkGuardrailRegression,
  createFactoryReuseCandidate,
  promoteFactoryReuseCandidate,
  createFixitPlaybookRule,
  evaluatePatchPassGate,
  evaluateFactoryReuseCandidate
} from '../../app/actions/fixit';
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
    in: vi.fn().mockImplementation(() => qb),
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
    then: (resolve: any) => resolve({ data: capturedData, count, error: null })
  };
  return qb;
};

describe('BSW-OS Fix-It Studio MVP Test Suite (AG-B8)', () => {
  const mockWorkspaceId = '11111111-1111-4111-a111-111111111111';
  const mockRcaId = '22222222-2222-4222-b222-222222222222';
  const mockPatchId = '33333333-3333-4333-c333-333333333333';
  const mockPlanId = '44444444-4444-4444-d444-444444444444';
  const mockRetestRunId = '55555555-5555-4555-e555-555555555555';
  const mockLiftId = '66666666-6666-4666-f666-666666666666';
  const mockCandidateId = '77777777-7777-4777-7777-777777777777';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Root Cause Analysis & Patch Hypotheses (Non-Negotiable)', () => {
    it('should throw validation error if RCA cause hypothesis is omitted or too short', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

      const rcaData = {
        metric_name: "ARS",
        metric_value: 50.00,
        cause_hypothesis: "" // MISSING!
      };

      await expect(createRcaCase(mockWorkspaceId, rcaData)).rejects.toThrow();
    });

    it('should throw validation error if Patch hypothesis is omitted or too short', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

      const patchData = {
        rca_case_id: mockRcaId,
        patch_name: "Retinol patch",
        patch_hypothesis: "" // MISSING!
      };

      await expect(createPatchTicket(mockWorkspaceId, patchData)).rejects.toThrow();
    });
  });

  describe('2. Retest Verification & Mismatch linkages', () => {
    it('should block evaluatePatchPassGate if no retests have been executed', async () => {
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === "patch_tickets") {
          return createMockQueryBuilder({
            patch_name: "Retinol Fix",
            patch_hypothesis: "Valid Hypothesis: Resolves crawler weakness.",
            status: "approved"
          });
        }
        if (table === "retest_plans") {
          return createMockQueryBuilder([]); // LACKS PLANS!
        }
        return createMockQueryBuilder();
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      const gate = await evaluatePatchPassGate(mockWorkspaceId, mockPatchId);
      expect(gate.status).toBe('fail');
      expect(gate.blockingReasons.some(r => r.includes("Retest Plan"))).toBe(true);
    });

    it('should calculate lift values correctly based on post-patch retest completed runs', async () => {
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === "post_patch_lift_snapshots") {
          return createMockQueryBuilder({ id: mockLiftId });
        }
        return createMockQueryBuilder();
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      const baseline = { ARS: 50.00, BSF: 90.00 };
      const retest = { ARS: 65.00, BSF: 92.00 };

      const lift = await computePostPatchLift(mockWorkspaceId, mockRetestRunId, baseline, retest);
      expect(lift.lift_values.ARS).toBe(15.00); // 65 - 50 = +15%
      expect(lift.lift_values.BSF).toBe(2.00);  // 92 - 90 = +2%
      expect(lift.final_verdict).toBe('pass');
    });
  });

  describe('3. Guardrail Regression Overrides', () => {
    it('should trigger regression alarm if Brand Semantic Fidelity (BSF) drops > 5%', () => {
      const baseline = { BSF: 90.00 };
      const retest = { BSF: 84.00 }; // drop of 6% (>5%!)

      const audit = checkGuardrailRegression(baseline, retest);
      expect(audit.isRegressed).toBe(true);
      expect(audit.details[0]).toContain("BSF");
    });

    it('should trigger regression alarm if new dark patterns are introduced post-patch', () => {
      const baseline = { BSF: 90.00, dark_patterns_count: 0 };
      const retest = { BSF: 91.00, dark_patterns_count: 2 }; // introduced 2 dark patterns!

      const audit = checkGuardrailRegression(baseline, retest);
      expect(audit.isRegressed).toBe(true);
      expect(audit.details[0]).toContain("Dark Pattern");
    });

    it('should override positive lift values and fail the Patch Pass Gate on regression', async () => {
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === "post_patch_lift_snapshots") {
          return createMockQueryBuilder({ id: mockLiftId });
        }
        return createMockQueryBuilder();
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      // Baseline vs retest: ARS has positive lift (50 -> 65 = +15), but BSF regresses (90 -> 80 = -10!)
      const baseline = { ARS: 50.00, BSF: 90.00, dark_patterns_count: 0 };
      const retest = { ARS: 65.00, BSF: 80.00, dark_patterns_count: 0 };

      const lift = await computePostPatchLift(mockWorkspaceId, mockRetestRunId, baseline, retest);
      expect(lift.is_guardrail_regressed).toBe(true);
      expect(lift.final_verdict).toBe('fail'); // blocked by regression!
    });
  });

  describe('4. Factory Candidate Promotion Gates', () => {
    it('should block factory promotion if base lift snapshot has guardrail regressions', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === "factory_reuse_candidates") {
          return createMockQueryBuilder({
            post_patch_lift_snapshot_id: mockLiftId,
            status: "candidate"
          });
        }
        if (table === "post_patch_lift_snapshots") {
          return createMockQueryBuilder({
            final_verdict: "fail", // FAILED snapshot
            is_guardrail_regressed: true // Regressed!
          });
        }
        return createMockQueryBuilder();
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      await expect(promoteFactoryReuseCandidate(mockWorkspaceId, mockCandidateId)).rejects.toThrow(
        "PROMOTION LOCKED: Candidate failed the Factory reuse promotion gate."
      );
    });
  });
});
