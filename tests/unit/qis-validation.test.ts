import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkWorkspacePermission } from '../../lib/auth';
import { getSupabaseAdminClient } from '../../lib/supabase';
import { createQisScene, evaluateSemanticLineageGate } from '../../app/actions/semantic';
import { qisSceneSchema } from '../../lib/schema';

vi.mock('../../lib/supabase', () => ({
  getSupabaseAdminClient: vi.fn(),
}));

vi.mock('../../lib/auth', () => ({
  checkWorkspacePermission: vi.fn(),
}));

const createMockQueryBuilder = (data: any = null, count: number = 0) => {
  const qb: any = {
    eq: vi.fn().mockImplementation(() => qb),
    in: vi.fn().mockImplementation(() => qb),
    select: vi.fn().mockImplementation(() => qb),
    insert: vi.fn().mockImplementation(() => qb),
    single: vi.fn().mockResolvedValue({ data, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
    then: (resolve: any) => resolve({ data, count, error: null })
  };
  return qb;
};

describe('TDD-04: QIS Scene Safety Gates & Validation Tests', () => {
  const wsId = '00000000-0000-4000-a000-000000000001';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Zod Schema Strict Rules', () => {
    it('should reject QIS Scene creation if canonical_question_id is missing', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

      const invalidPayload = {
        scene_name: 'Retinol routine context',
        query_template: 'How to use retinol?',
        intent_model: 'informational',
        scenario_context: 'User sensitive skin scenario'
      };

      await expect(
        createQisScene(wsId, invalidPayload)
      ).rejects.toThrow();
    });

    it('should reject QIS Scene creation if query_template, intent_model, or scenario_context is missing', () => {
      const invalidPayload = {
        workspace_id: wsId,
        canonical_question_id: '00000000-0000-4000-a000-000000000010',
        scene_name: 'Retinol routine context',
        // query_template missing!
        intent_model: 'informational'
      };

      const parsed = qisSceneSchema.safeParse(invalidPayload);
      expect(parsed.success).toBe(false);
    });
  });

  describe('Semantic Release Gate Evaluator (evaluateSemanticLineageGate)', () => {
    it('should block release (isPassed = false) if QIS risk_level is high/critical and no active boundary rules exist', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'qis_scenes') {
          return createMockQueryBuilder({
            id: 'qis-1',
            risk_level: 'critical',
            intent_model: 'informational',
            scene_name: 'High risk claim scenario'
          });
        }
        if (table === 'boundary_rules') {
          return createMockQueryBuilder([]); // LACKS active boundary rules!
        }
        return createMockQueryBuilder([]);
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      // Trigger safety gate check
      const result = await evaluateSemanticLineageGate(wsId, 'qis-1');

      expect(result.isPassed).toBe(false);
      expect(result.blockers.some(b => b.includes('lacks an active Boundary Rule'))).toBe(true);
    });

    it('should block release if QIS is action-stage (local/transactional intent) and lacks action policies or objects', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'qis_scenes') {
          return createMockQueryBuilder({
            id: 'qis-2',
            risk_level: 'low',
            intent_model: 'local', // Action stage!
            scene_name: 'Find nearest cosmetics shop'
          });
        }
        if (table === 'action_policies') {
          return createMockQueryBuilder([]); // LACKS action policies!
        }
        return createMockQueryBuilder([]);
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      const result = await evaluateSemanticLineageGate(wsId, 'qis-2');

      expect(result.isPassed).toBe(false);
      expect(result.blockers.some(b => b.includes('lacks a mandatory Action Policy'))).toBe(true);
    });

    it('should pass release gate if safety and action policies are fully satisfied', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'qis_scenes') {
          return createMockQueryBuilder({
            id: 'qis-3',
            risk_level: 'high',
            intent_model: 'local',
            scene_name: 'Purchase sensitive skincare product'
          });
        }
        if (table === 'boundary_rules') {
          return createMockQueryBuilder([{ id: 'br-1', is_active: true }]);
        }
        if (table === 'action_policies') {
          return createMockQueryBuilder([{ id: 'ap-1', is_allowed: true }]);
        }
        return createMockQueryBuilder([]);
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      const result = await evaluateSemanticLineageGate(wsId, 'qis-3');

      expect(result.isPassed).toBe(true);
      expect(result.blockers.length).toBe(0);
    });
  });
});
