import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  createQuestionSignal,
  promoteSignalToQuestionCapital,
  createCanonicalQuestion,
  mergeCanonicalQuestions,
  createQisScene,
  evaluateLineageCompleteness
} from '../../app/actions/semantic';
import { getSupabaseAdminClient } from '../../lib/supabase';
import { checkWorkspacePermission, checkWorkspacePermissionOrDemo } from '../../lib/auth';

// Mock Supabase admin client and permissions checks to isolate logic
vi.mock('../../lib/supabase', () => ({
  getSupabaseAdminClient: vi.fn(),
}));

vi.mock('../../lib/auth', () => ({
  requireAuth: vi.fn().mockResolvedValue('test-user-id'),
  requireAuthOrDemo: vi.fn().mockResolvedValue('test-user-id'),
  checkWorkspacePermission: vi.fn().mockResolvedValue(true),
  checkWorkspacePermissionOrDemo: vi.fn().mockResolvedValue(true),
}));

// Chainable and Thenable Supabase Query Builder mock
const createMockQueryBuilder = (data: any = null, count: number = 0) => {
  const qb: any = {
    eq: vi.fn().mockImplementation(() => qb),
    in: vi.fn().mockImplementation(() => qb),
    select: vi.fn().mockImplementation(() => qb),
    insert: vi.fn().mockImplementation(() => qb),
    update: vi.fn().mockImplementation(() => qb),
    delete: vi.fn().mockImplementation(() => qb),
    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
    single: vi.fn().mockResolvedValue({ data, error: null }),
    // Thenable support to handle promise resolutions natively
    then: (resolve: any) => resolve({ data, count, error: null })
  };
  return qb;
};

describe('Semantic Core Module Tests (AG-B3)', () => {
  const mockWorkspaceId = 'e2fa0fcd-99b3-46bc-81bf-4b216fb0ffcf';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Signal Mining & Promotions (Layer 1)', () => {
    it('should promote an organic query signal to a strategic Question Capital node', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'question_signals') {
          return createMockQueryBuilder({ id: 'sig-1', query: 'is niacinamide safe for skin barrier' });
        }
        if (table === 'question_capital_nodes') {
          return createMockQueryBuilder({ id: 'cap-1', title: 'Skincare Safety', slug: 'skincare-safety', strategic_weight: 1.0 });
        }
        return createMockQueryBuilder(null);
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      const result = await promoteSignalToQuestionCapital(mockWorkspaceId, 'sig-1', 'Skincare Safety');

      expect(mockFrom).toHaveBeenCalledWith('question_signals');
      expect(mockFrom).toHaveBeenCalledWith('question_capital_nodes');
      expect(result.title).toBe('Skincare Safety');
      expect(result.slug).toBe('skincare-safety');
    });
  });

  describe('Canonical Questions & Deduplication Merges (Layer 2)', () => {
    it('should block createCanonicalQuestion if semantic signature matches an existing CQ', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'canonical_questions') {
          // Simulate an existing record matching the signature
          return createMockQueryBuilder({ id: 'cq-existing' });
        }
        return createMockQueryBuilder(null);
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      const data = {
        normalized_question: 'Is niacinamide safe for damaged skin barrier?',
        slug: 'is-niacinamide-safe-for-damaged-skin-barrier',
        signature: '7b0a6493e829dc74',
        question_capital_node_id: null
      };

      await expect(createCanonicalQuestion(mockWorkspaceId, data))
        .rejects.toThrow('DEDUPLICATION ERROR');
    });

    it('should cleanly merge duplicate CQs and shift scene children to the target CQ', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

      const mockFrom = vi.fn().mockReturnValue(createMockQueryBuilder(null));
      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      const result = await mergeCanonicalQuestions(mockWorkspaceId, 'cq-target', ['cq-src1', 'cq-src2']);

      expect(mockFrom).toHaveBeenCalledWith('qis_scenes');
      expect(mockFrom).toHaveBeenCalledWith('canonical_questions');
      expect(result.success).toBe(true);
      expect(result.mergedCount).toBe(2);
    });
  });

  describe('QIS Scene Constraints (Layer 3)', () => {
    it('should block createQisScene if canonical question reference is missing', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

      const mockFrom = vi.fn().mockReturnValue(createMockQueryBuilder(null));
      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      const badData = {
        scene_name: 'Invalid Scene',
        query_template: 'test template',
        intent_model: 'informational',
        scenario_context: 'Mobile searcher',
        risk_level: 'medium',
        canonical_question_id: '' // Missing CQ Reference
      };

      await expect(createQisScene(mockWorkspaceId, badData))
        .rejects.toThrow();
    });
  });

  describe('Cryptographic Claim-Evidence-Boundary Lineage (Layer 4)', () => {
    it('should fail claim lineage check if evidence is missing', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'claim_nodes') {
          return createMockQueryBuilder({ id: 'claim-1', operational_truth_id: 'oper-1', claim_summary: 'Claim 1' });
        }
        if (table === 'brand_operational_truths') {
          return createMockQueryBuilder({ id: 'oper-1', risk_level: 'medium' });
        }
        if (table === 'lineage_records') {
          // Missing evidence_item_id
          return createMockQueryBuilder({ id: 'lin-1', evidence_item_id: null, boundary_rule_id: null });
        }
        return createMockQueryBuilder(null);
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      const result = await evaluateLineageCompleteness(mockWorkspaceId, 'claim-1');

      expect(result.isPublishable).toBe(false);
      expect(result.blockers[0]).toContain('clinical evidence referencing');
      expect(result.verificationSignature).toBeNull();
    });

    it('should fail claim lineage check if evidence document is unverified', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'claim_nodes') {
          return createMockQueryBuilder({ id: 'claim-1', operational_truth_id: 'oper-1', claim_summary: 'Claim 1' });
        }
        if (table === 'brand_operational_truths') {
          return createMockQueryBuilder({ id: 'oper-1', risk_level: 'medium' });
        }
        if (table === 'lineage_records') {
          return createMockQueryBuilder({ id: 'lin-1', evidence_item_id: 'ev-1', boundary_rule_id: null });
        }
        if (table === 'evidence_items') {
          // is_verified is FALSE
          return createMockQueryBuilder({ id: 'ev-1', title: 'Clinical PDF', is_verified: false });
        }
        return createMockQueryBuilder(null);
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      const result = await evaluateLineageCompleteness(mockWorkspaceId, 'claim-1');

      expect(result.isPublishable).toBe(false);
      expect(result.blockers[0]).toContain('has not been verified');
    });

    it('should block high-risk claims without safety Boundary Rules', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'claim_nodes') {
          return createMockQueryBuilder({ id: 'claim-1', operational_truth_id: 'oper-1', claim_summary: 'Claim 1' });
        }
        if (table === 'brand_operational_truths') {
          // RISK IS HIGH
          return createMockQueryBuilder({ id: 'oper-1', risk_level: 'high' });
        }
        if (table === 'lineage_records') {
          return createMockQueryBuilder({ id: 'lin-1', evidence_item_id: 'ev-1', boundary_rule_id: null });
        }
        if (table === 'evidence_items') {
          return createMockQueryBuilder({ id: 'ev-1', title: 'Clinical PDF', is_verified: true });
        }
        return createMockQueryBuilder(null);
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      const result = await evaluateLineageCompleteness(mockWorkspaceId, 'claim-1');

      expect(result.isPublishable).toBe(false);
      expect(result.blockers[0]).toContain('safety Boundary Rule');
    });

    it('should generate a premium cryptographic verification seal hash if all constraints are met', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'claim_nodes') {
          return createMockQueryBuilder({ id: 'claim-1', operational_truth_id: 'oper-1', claim_summary: 'Claim 1' });
        }
        if (table === 'brand_operational_truths') {
          // RISK IS HIGH
          return createMockQueryBuilder({ id: 'oper-1', risk_level: 'high' });
        }
        if (table === 'lineage_records') {
          return createMockQueryBuilder({ id: 'lin-1', evidence_item_id: 'ev-1', boundary_rule_id: 'rule-1' });
        }
        if (table === 'evidence_items') {
          return createMockQueryBuilder({ id: 'ev-1', title: 'Clinical PDF', is_verified: true });
        }
        if (table === 'boundary_rules') {
          return createMockQueryBuilder({ id: 'rule-1', rule_name: 'Dermal safety rule', is_active: true });
        }
        return createMockQueryBuilder(null);
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      const result = await evaluateLineageCompleteness(mockWorkspaceId, 'claim-1');

      expect(result.isPublishable).toBe(true);
      expect(result.blockers.length).toBe(0);
      expect(result.verificationSignature).toBeDefined();
      expect(result.verificationSignature).not.toBeNull();
      expect(result.verificationSignature?.length).toBe(64); // SHA-256 hex is 64 characters
    });
  });

  describe('Negative Path & Error Handling (TDD-04)', () => {
    it('should throw UNAUTHORIZED error in createCanonicalQuestion if user lacks permissions', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(false);
      vi.mocked(checkWorkspacePermissionOrDemo).mockResolvedValue(false);

      await expect(
        createCanonicalQuestion(mockWorkspaceId, {
          normalized_question: 'What is retinol?',
          slug: 'what-is-retinol',
          signature: 'sig-retinol'
        })
      ).rejects.toThrow('UNAUTHORIZED: Insufficient permissions to define canonical questions.');
    });

    it('should throw UNAUTHORIZED error in createQisScene if user lacks permissions', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(false);
      vi.mocked(checkWorkspacePermissionOrDemo).mockResolvedValue(false);

      await expect(
        createQisScene(mockWorkspaceId, {
          scene_name: 'Scene 1',
          query_template: 'template',
          intent_model: 'informational',
          scenario_context: 'context',
          risk_level: 'low',
          canonical_question_id: 'cq-1'
        })
      ).rejects.toThrow('UNAUTHORIZED: Insufficient permissions to create QIS scenes.');
    });

    it('should throw Zod error in createCanonicalQuestion if data payload violates schema', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

      await expect(
        createCanonicalQuestion(mockWorkspaceId, {
          normalized_question: 'Valid Question',
          slug: '',
          signature: 'sig'
        })
      ).rejects.toThrow();
    });
  });
});
