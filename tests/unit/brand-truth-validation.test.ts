import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkWorkspacePermission } from '../../lib/auth';
import { getSupabaseAdminClient } from '../../lib/supabase';
import { 
  upsertStrategicTruth, 
  upsertOperationalTruth, 
  createObservedTruth,
  createEvidenceItem,
  createBoundaryRule,
  createTruthDelta,
  evaluateTruthLockGate
} from '../../app/actions/truth';
import { kBeautyFixture, reportExportFixture } from '../helpers'; // using helper skeletons if needed, else raw
import { evidenceItemSchema, boundaryRuleSchema } from '../../lib/schema';

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
  const qb: any = {
    eq: vi.fn().mockImplementation(() => qb),
    in: vi.fn().mockImplementation(() => qb),
    select: vi.fn().mockImplementation(() => qb),
    insert: vi.fn().mockImplementation(() => qb),
    upsert: vi.fn().mockImplementation(() => qb),
    update: vi.fn().mockImplementation(() => qb),
    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
    single: vi.fn().mockResolvedValue({ data, error: null }),
    then: (resolve: any) => resolve({ data, count, error: null })
  };
  return qb;
};

describe('TDD-03: Brand Truth Core Separations & Validation Tests', () => {
  const wsId = '00000000-0000-4000-a000-000000000001';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Truth Separation & Anti-Overwrite Rules', () => {
    it('should strictly write Strategic Truths only to strategic table', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);
      
      const mockFrom = vi.fn().mockReturnValue(createMockQueryBuilder({ id: 'strat-1' }));
      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      await upsertStrategicTruth(wsId, {
        statement: 'Strict Strategic Skincare Solutions',
        vision: 'Our Strategic Vision',
        core_pillars: ['Pillar 1']
      });

      expect(mockFrom).toHaveBeenCalledWith('brand_strategic_truths');
      expect(mockFrom).not.toHaveBeenCalledWith('brand_operational_truths');
    });

    it('should block Observed Truth from automatically overwriting Operational Claims', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

      const mockFrom = vi.fn().mockReturnValue(createMockQueryBuilder({ id: 'obs-1' }));
      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      await createObservedTruth(wsId, {
        observed_claim: 'Observed Hydration stats: 95%',
        source_domain: 'competitor.com',
        confidence_score: 80.00,
        is_aligned_with_operational: false,
        raw_payload: {}
      });

      // Assert Observed Truth only inserts into brand_observed_truths table
      expect(mockFrom).toHaveBeenCalledWith('brand_observed_truths');
      expect(mockFrom).not.toHaveBeenCalledWith('brand_operational_truths');
    });
  });

  describe('2. Evidence Item & Stale Rules Validation', () => {
    it('should reject evidence item creation if evidence_type (source type) is missing or invalid', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

      const badEvidence = {
        title: 'Clinical Trial Result',
        content: 'Niacinamide hydrates sensitive skin.',
        evidence_type: 'invalid_type_does_not_exist' // bad enum
      };

      await expect(
        createEvidenceItem(wsId, badEvidence)
      ).rejects.toThrow();
    });

    it('should support confidence_score and reviewer_id fields within schema contracts', () => {
      const validEvidencePayload = {
        workspace_id: wsId,
        title: 'Clinical Trial Result',
        content: 'Pure Niacinamide formula tested successfully.',
        evidence_type: 'clinical_trial',
        is_verified: true,
        // Confidence and review metadata handled
        confidence_score: 95.50,
        reviewer_id: '00000000-0000-4000-a000-000000000010'
      };

      const parsed = evidenceItemSchema.parse(validEvidencePayload);
      expect(parsed.is_verified).toBe(true);
    });

    it('should trigger stale evidence warning during Gate evaluation if evidence is older than 3 years', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'workspaces') {
          return createMockQueryBuilder([], 1);
        }
        if (table === 'brand_strategic_truths') {
          return createMockQueryBuilder([{ id: 'st-1' }]);
        }
        if (table === 'brand_operational_truths') {
          return createMockQueryBuilder([{ id: 'op-1', claim: 'Acme Hydration', risk_level: 'low' }]);
        }
        if (table === 'brand_operational_truth_evidence') {
          return createMockQueryBuilder([{ evidence_item_id: 'ev-1' }]);
        }
        if (table === 'evidence_items') {
          // Date is 2020 (stale for 2026 current time)
          return createMockQueryBuilder([{ id: 'ev-1', title: 'Old Study 2020', is_verified: true, created_at: '2020-05-23T20:00:00Z' }]);
        }
        return createMockQueryBuilder([]);
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      // Evaluate L2 gate
      const result = await evaluateTruthLockGate(wsId, 'L2');
      
      // Assert: stale warning should be generated
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Stale Evidence Warning');
    });
  });

  describe('3. Boundary Rule & High-Risk Rules Validation', () => {
    it('should enforce that high-risk claims must link to active boundary rules at L2 Gate', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'workspaces') {
          return createMockQueryBuilder([], 1);
        }
        if (table === 'brand_strategic_truths') {
          return createMockQueryBuilder([{ id: 'st-1' }]);
        }
        if (table === 'brand_operational_truths') {
          // Critical claim without boundaries!
          return createMockQueryBuilder([{ id: 'op-1', claim: 'Medical eczema cure', risk_level: 'critical' }]);
        }
        if (table === 'brand_operational_truth_evidence') {
          return createMockQueryBuilder([{ evidence_item_id: 'ev-1' }]);
        }
        if (table === 'evidence_items') {
          return createMockQueryBuilder([{ id: 'ev-1', is_verified: true }]);
        }
        if (table === 'brand_operational_truth_boundaries') {
          return createMockQueryBuilder([]); // LACKS boundary!
        }
        return createMockQueryBuilder([]);
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      const result = await evaluateTruthLockGate(wsId, 'L2');
      expect(result.isPassed).toBe(false);
      expect(result.blockingReasons[0]).toContain('lacks a mandatory safety Boundary Rule');
    });

    it('should enforce boundary rule schema structure with forbidden terms arrays', () => {
      const boundaryData = {
        workspace_id: wsId,
        rule_name: 'YMYL Eczema Restriction',
        forbidden_terms: ['cure eczema', 'heals psoriasis'],
        risk_level: 'critical',
        is_active: true
      };

      const parsed = boundaryRuleSchema.parse(boundaryData);
      expect(parsed.forbidden_terms).toContain('cure eczema');
    });
  });

  describe('4. Truth Delta Mismatch Snapshot rules', () => {
    it('should create truth delta snapshot as resolved = false when observed and operational claims mismatch', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

      const mockFrom = vi.fn().mockReturnValue(createMockQueryBuilder({ id: 'delta-1', is_resolved: false }));
      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      const result = await createTruthDelta(wsId, {
        source_observed_truth_id: '00000000-0000-4000-a000-000000000011',
        target_operational_truth_id: '00000000-0000-4000-a000-000000000012',
        delta_summary: 'Factual discrepancy in observed Retinol active concentration.',
        severity: 'high',
        is_resolved: false // Defaults unresolved!
      });

      expect(mockFrom).toHaveBeenCalledWith('truth_delta_snapshots');
      expect(result.is_resolved).toBe(false); // Does not auto-apply or auto-resolve!
    });
  });
});
