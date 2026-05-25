import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CosineAlignmentEngine } from '../../lib/embeddings/cosine-engine';
import { getSupabaseAdminClient } from '../../lib/supabase';
import { cosineSimilarity } from '../../lib/math/vector-math';

vi.mock('../../lib/supabase', () => ({
  getSupabaseAdminClient: vi.fn(),
}));

const createMockQueryBuilder = (data: any = null, error: any = null) => {
  const qb: any = {
    eq: vi.fn().mockImplementation(() => qb),
    select: vi.fn().mockImplementation(() => qb),
    insert: vi.fn().mockImplementation(() => qb),
    update: vi.fn().mockImplementation(() => qb),
    limit: vi.fn().mockImplementation(() => qb),
    maybeSingle: vi.fn().mockImplementation(async () => ({ data, error })),
    single: vi.fn().mockImplementation(async () => ({ data, error })),
    then: vi.fn().mockImplementation((onFulfilled) => {
      return Promise.resolve(onFulfilled({ data, error }));
    }),
  };
  return qb;
};

describe('Cosine Alignment Engine Test Suite (Phase 1B)', () => {
  const workspaceId = '00000000-0000-4000-a000-000000000001';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should verify 3072-dim cosine similarity math calculations', () => {
    const vecA = new Array(3072).fill(0).map((_, i) => (i === 0 ? 1 : 0));
    const vecB = new Array(3072).fill(0).map((_, i) => (i === 0 ? 1 : 0));
    const vecC = new Array(3072).fill(0).map((_, i) => (i === 1 ? 1 : 0));

    expect(cosineSimilarity(vecA, vecB)).toBe(1.0);
    expect(cosineSimilarity(vecA, vecC)).toBe(0.0);
  });

  it('should compute VPA between brand intent and page body and return correct score', async () => {
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      // Mock embedding cache hit to avoid calling real APIs
      if (table === 'embedding_cache') {
        const dummyVector = new Array(3072).fill(0).map(() => Math.random());
        return createMockQueryBuilder({ embedding_vector: dummyVector });
      }
      return createMockQueryBuilder();
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const engine = new CosineAlignmentEngine();
    const score = await engine.computeVPA(
      workspaceId,
      'PrismBarrier dermatological ceramide skin health',
      'This product uses squalane for intense hydration.'
    );

    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should process batch VPA calculations correctly', async () => {
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'embedding_cache') {
        const dummyVector = new Array(3072).fill(0).map(() => 0.5);
        return createMockQueryBuilder({ embedding_vector: dummyVector });
      }
      return createMockQueryBuilder();
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const engine = new CosineAlignmentEngine();
    const contents = [
      'Content snippet alpha',
      'Content snippet beta',
      'Content snippet gamma'
    ];

    const results = await engine.batchVPA(
      workspaceId,
      'Brand core values',
      contents
    );

    expect(results).toHaveLength(3);
    results.forEach(res => {
      expect(res.vpaScore).toBeDefined();
      expect(res.similarity).toBeDefined();
    });
  });

  it('should flag vibe drift alert if page VPA falls below threshold', async () => {
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'brand_truths') {
        return createMockQueryBuilder({ strategic_intent: 'Only certified pristine dermatology' });
      }
      if (table === 'semantic_pages') {
        return createMockQueryBuilder([
          { id: 'page-1', page_title: 'Valid Page', slug: 'valid-page', page_body: 'Dermatology certified cream' },
          { id: 'page-2', page_title: 'Drifted Page', slug: 'drifted-page', page_body: 'Cheap discount products' }
        ]);
      }
      if (table === 'embedding_cache') {
        const vec = new Array(3072).fill(0).map(() => Math.random());
        return createMockQueryBuilder({ embedding_vector: vec });
      }
      return createMockQueryBuilder();
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const engine = new CosineAlignmentEngine();
    // Force a very high threshold to trigger drift
    const alerts = await engine.detectVibeDrift(workspaceId, 99.00);

    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0].pageTitle).toBeDefined();
    expect(alerts[0].currentVPA).toBeLessThan(99.00);
  });
});
