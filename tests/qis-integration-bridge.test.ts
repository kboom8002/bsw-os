import { describe, it, expect, vi } from 'vitest';
import { QisHubClient } from '@/lib/qis/hub-client';
import { GoldenQisBridge } from '@/lib/golden/golden-qis-bridge';
import { CqAutoRegistrar } from '@/lib/deep-dive/cq-auto-registrar';

// Mock getSupabaseAdminClient with a chainable mock builder
vi.mock('@/lib/supabase', () => {
  const chainObj: any = {};
  chainObj.select = vi.fn().mockReturnValue(chainObj);
  chainObj.insert = vi.fn().mockReturnValue(chainObj);
  chainObj.update = vi.fn().mockReturnValue(chainObj);
  chainObj.eq = vi.fn().mockReturnValue(chainObj);
  chainObj.single = vi.fn().mockResolvedValue({
    data: { id: 'mock-capital-node-id', title: 'mock title' },
    error: null
  });
  chainObj.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });

  const mockFrom = vi.fn().mockReturnValue(chainObj);

  return {
    getSupabaseAdminClient: () => ({
      from: mockFrom
    })
  };
});

describe('QIS Integration Bridge and Stub Tests', () => {
  describe('QisHubClient (P3-1 stub verification)', () => {
    it('should initialize and execute push predicted questions without throwing', async () => {
      const client = new QisHubClient();
      expect(client).toBeDefined();

      const result = await client.pushPredictedQuestions([{ question_text: 'test' }]);
      expect(typeof result).toBe('boolean');
    });

    it('should pull metrics and layers returning values', async () => {
      const client = new QisHubClient();
      const metrics = await client.pullMetrics('skincare');
      const layers = await client.pullExpectedLayers('skincare');
      expect(typeof metrics).toBe('number');
      expect(typeof layers).toBe('number');
    });
  });

  describe('GoldenQisBridge (P1-4 consensus mapping)', () => {
    it('should extract mustIncludes from consensus template and sequence and return correct counts', async () => {
      const workspaceId = 'test-workspace-id';
      const consensus = {
        content_templates: [
          { consensus_pattern: 'Must show clinical ingredients' }
        ],
        section_sequences: [
          { section_name: 'Hero Section', required_by_percent: 85 },
          { section_name: 'Footer', required_by_percent: 30 } // should be skipped because percent < 70
        ]
      };

      const result = await GoldenQisBridge.feedConsensusToQisScenes(workspaceId, consensus, 'skincare');
      
      expect(result).toBeDefined();
      expect(result.newMustIncludes).toBe(2); // 'Must show clinical ingredients' and 'Section: Hero Section (85% consensus)'
    });
  });

  describe('CqAutoRegistrar (P1-1 deep-dive approval CQ registration)', () => {
    it('should register approved candidate and return true', async () => {
      const workspaceId = 'test-workspace-id';
      const candidate = {
        id: 'test-cand-id',
        question_text: 'What is dermashield cream?',
        admin_approval_status: 'approved' as const,
        composite_priority: 90,
        eeat_dimension: 'expertise',
        current_ai_coverage: 'none' as const,
        competitors_owning: [],
        estimated_aepi_impact: 10,
        estimated_bdr_delta: 5,
        first_mover_window_days: 30,
        sources: []
      };

      const result = await CqAutoRegistrar.register(workspaceId, candidate, 'admin-1');
      expect(result).toBe(true);
    });

    it('should throw if candidate is not approved', async () => {
      const workspaceId = 'test-workspace-id';
      const candidate = {
        id: 'test-cand-id',
        question_text: 'What is dermashield cream?',
        admin_approval_status: 'pending' as const,
        composite_priority: 90,
        eeat_dimension: 'expertise',
        current_ai_coverage: 'none' as const,
        competitors_owning: [],
        estimated_aepi_impact: 10,
        estimated_bdr_delta: 5,
        first_mover_window_days: 30,
        sources: []
      };

      await expect(CqAutoRegistrar.register(workspaceId, candidate, 'admin-1')).rejects.toThrow(
        'Candidate must be admin-approved before registration.'
      );
    });
  });
});
