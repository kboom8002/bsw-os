import { describe, it, expect, vi, beforeEach } from 'vitest';
import { computeSemanticVibeAlignment, batchAlignmentScan } from '../../lib/vibe/semantic-alignment';
import { computeVPA } from '../../app/actions/persona';
import { getSupabaseAdminClient } from '../../lib/supabase';

// Mock Supabase admin client
vi.mock('../../lib/supabase', () => ({
  getSupabaseAdminClient: vi.fn(),
}));

const createMockQueryBuilder = (data: any = null, error: any = null, count: number = 0) => {
  const qb: any = {
    eq: vi.fn().mockImplementation(() => qb),
    in: vi.fn().mockImplementation(() => qb),
    select: vi.fn().mockImplementation(() => qb),
    insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    single: vi.fn().mockResolvedValue({ data, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
    then: (resolve: any) => resolve({ data, count, error })
  };
  return qb;
};


describe('Semantic Vibe Alignment Tests (Stream 1)', () => {
  const mockWorkspaceId = '11111111-1111-4111-a111-111111111111';
  const mockVibeSpecId = '22222222-2222-4222-b222-222222222222';
  const mockPageId = '33333333-3333-4333-c333-333333333333';

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.VPA_MODE;
  });

  describe('1. computeSemanticVibeAlignment', () => {
    it('should successfully compute alignment between spec and page text', async () => {
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'vibe_specs') {
          return createMockQueryBuilder({
            vibe_name: 'Derm Advisor',
            brand_guide_text: 'Clinical, scientific and trustful skincare guidelines.',
            target_vector: { clinical: 80, warm: 20, luxury: 0 }
          });
        }
        if (table === 'semantic_pages') {
          return createMockQueryBuilder({
            page_title: 'PureBarrier Cream',
            visible_content: 'Scientific formulation with ceramide NP and squalane, dermatologically tested.'
          });
        }
        return createMockQueryBuilder(null);
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      const result = await computeSemanticVibeAlignment(mockWorkspaceId, mockVibeSpecId, mockPageId);

      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.guideVector.length).toBe(3072);
      expect(result.pageVector.length).toBe(3072);
    });
  });

  describe('2. batchAlignmentScan', () => {
    it('should list all workspace pages ordered by highest alignment score', async () => {
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'semantic_pages') {
          // Return two mock pages
          return createMockQueryBuilder([
            { id: 'page-1', page_title: 'Scientific Clinical Page' },
            { id: 'page-2', page_title: 'Aesthetic Party Page' }
          ]);
        }
        if (table === 'vibe_specs') {
          return createMockQueryBuilder({
            vibe_name: 'Clinical Skincare Vibe',
            brand_guide_text: 'Clinical, scientific and highly medical guidelines.',
            target_vector: { clinical: 100, warm: 0, luxury: 0 }
          });
        }
        return createMockQueryBuilder(null);
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      const rankings = await batchAlignmentScan(mockWorkspaceId, mockVibeSpecId);

      expect(rankings.length).toBe(2);
      expect(rankings[0].score).toBeGreaterThanOrEqual(rankings[1].score);
    });
  });

  describe('3. computeVPA with VPA_MODE=semantic integration', () => {
    it('should invoke computeSemanticVibeAlignment when VPA_MODE is set to semantic', async () => {
      process.env.VPA_MODE = 'semantic';

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'vibe_assignments') {
          return createMockQueryBuilder({ vibe_spec_id: mockVibeSpecId });
        }
        if (table === 'vibe_specs') {
          return createMockQueryBuilder({
            vibe_name: 'Derm Advisor',
            brand_guide_text: 'Clinical skincare guidelines.',
            target_vector: { clinical: 80, warm: 20, luxury: 0 }
          });
        }
        if (table === 'semantic_pages') {
          return createMockQueryBuilder({
            page_title: 'PureBarrier',
            visible_content: 'Scientific ceramide barrier.'
          });
        }
        return createMockQueryBuilder(null);
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      const score = await computeVPA(mockWorkspaceId, mockPageId);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });
});
