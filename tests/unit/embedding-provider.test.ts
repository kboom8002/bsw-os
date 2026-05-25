import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MockEmbeddingProvider } from '../../lib/embeddings/mock-embedding-provider';
import { OpenAIEmbeddingProvider } from '../../lib/embeddings/openai-embedding-provider';
import { GeminiEmbeddingProvider } from '../../lib/embeddings/gemini-embedding-provider';
import { EmbeddingService } from '../../lib/embeddings/embedding-service';
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
    then: (resolve: any) => resolve({ data, count, error })
  };
  return qb;
};


describe('Embedding Providers and Service tests (Stream 1)', () => {
  const mockWorkspaceId = '11111111-1111-4111-a111-111111111111';

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.OPENAI_API_KEY;
    delete process.env.GOOGLE_AI_API_KEY;
  });

  describe('1. MockEmbeddingProvider', () => {
    it('should generate deterministic 3072-dim unit vector based on text hash', async () => {
      const provider = new MockEmbeddingProvider();
      const text1 = 'Sensitive Skin Care Routine';
      const text2 = 'Sensitive Skin Care Routine';
      const text3 = 'Completely different content';

      const res1 = await provider.embed(text1);
      const res2 = await provider.embed(text2);
      const res3 = await provider.embed(text3);

      // Check dimensions
      expect(res1.dimensions).toBe(3072);
      expect(res1.vector.length).toBe(3072);

      // Check determinism (identical texts must yield exact same vector)
      expect(res1.vector).toEqual(res2.vector);

      // Check divergence (different texts must yield different vectors)
      expect(res1.vector).not.toEqual(res3.vector);

      // Check if it is a normalized unit vector (length / magnitude equals 1.0)
      let sumSq = 0;
      for (const val of res1.vector) {
        sumSq += val * val;
      }
      expect(Math.sqrt(sumSq)).toBeCloseTo(1.0, 5);
    });
  });

  describe('2. OpenAI and Gemini Embedding Providers Fallback', () => {
    it('should fallback to mock provider when OPENAI_API_KEY is missing', async () => {
      const provider = new OpenAIEmbeddingProvider();
      const result = await provider.embed('Retinol Serum Application');
      expect(result.modelName).toBe('text-embedding-3-large-mock');
      expect(result.dimensions).toBe(3072);
    });

    it('should fallback to mock provider when GOOGLE_AI_API_KEY is missing', async () => {
      const provider = new GeminiEmbeddingProvider();
      const result = await provider.embed('Ceramide skin barrier treatment');
      expect(result.modelName).toBe('text-embedding-004-mock');
      expect(result.dimensions).toBe(3072);
    });
  });

  describe('3. EmbeddingService Cache Dedup', () => {
    it('should fetch from database cache when available', async () => {
      const mockVector = new Array(3072).fill(0).map((_, i) => (i === 0 ? 1.0 : 0.0));
      
      const mockFrom = vi.fn().mockImplementation(() => {
        return createMockQueryBuilder({
          embedding_vector: mockVector,
        });
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      const service = new EmbeddingService();
      const vector = await service.getEmbedding(mockWorkspaceId, 'Retinol Sensitive Skin');

      expect(vector).toEqual(mockVector);
      expect(mockFrom).toHaveBeenCalledWith('embedding_cache');
    });

    it('should call provider and write to database when cache misses', async () => {
      const mockFrom = vi.fn().mockImplementation(() => {
        // Return null data for cache miss
        return createMockQueryBuilder(null);
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      const service = new EmbeddingService();
      const vector = await service.getEmbedding(mockWorkspaceId, 'Unique content that is never cached');

      expect(vector.length).toBe(3072);
      expect(mockFrom).toHaveBeenCalledWith('embedding_cache');
    });
  });
});
