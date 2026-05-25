import * as crypto from 'crypto';
import { getSupabaseAdminClient } from '../supabase';
import { EmbeddingProvider, EmbeddingResult } from './types';
import { OpenAIEmbeddingProvider } from './openai-embedding-provider';
import { GeminiEmbeddingProvider } from './gemini-embedding-provider';
import { MockEmbeddingProvider } from './mock-embedding-provider';

export class EmbeddingService {
  private provider: EmbeddingProvider;
  private defaultDimensions = 3072;

  constructor() {
    // Select the best provider based on active API Keys in env
    if (process.env.OPENAI_API_KEY) {
      this.provider = new OpenAIEmbeddingProvider();
    } else if (process.env.GOOGLE_AI_API_KEY) {
      this.provider = new GeminiEmbeddingProvider();
    } else {
      this.provider = new MockEmbeddingProvider();
    }
  }

  /**
   * Helper to hash string contents for exact-match deduplication.
   */
  public generateHash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  /**
   * Fetches the embedding vector for a given piece of text.
   * Leverages Supabase embedding_cache table to bypass third-party API calls when cached.
   */
  public async getEmbedding(
    workspaceId: string,
    text: string,
    contentType: 'page_body' | 'vibe_guide' | 'brand_truth' | 'probe_question' = 'page_body',
    dimensions = 3072
  ): Promise<number[]> {
    const hash = this.generateHash(text);
    const supabase = getSupabaseAdminClient();

    // 1. Try to read from Database cache first
    try {
      const { data, error } = await supabase
        .from('embedding_cache')
        .select('embedding_vector')
        .eq('workspace_id', workspaceId)
        .eq('content_hash', hash)
        .eq('model_name', this.provider.modelName)
        .single();

      if (data && !error) {
        // Return parsed JSON vector
        const cachedVector = typeof data.embedding_vector === 'string' 
          ? JSON.parse(data.embedding_vector) 
          : data.embedding_vector;
        
        if (Array.isArray(cachedVector) && cachedVector.length === dimensions) {
          return cachedVector;
        }
      }
    } catch (dbError) {
      console.warn('Embedding cache DB read failed, proceeding with direct generation:', dbError);
    }

    // 2. Not cached or invalid, call the active provider API
    const result = await this.provider.embed(text, dimensions);

    // 3. Write-Through cache to DB
    try {
      await supabase.from('embedding_cache').insert({
        workspace_id: workspaceId,
        content_hash: hash,
        embedding_vector: result.vector, // Supabase stores JSONB
        model_name: this.provider.modelName,
        dimensions: result.dimensions,
        content_type: contentType,
      });
    } catch (dbWriteError) {
      console.warn('Embedding cache DB write failed:', dbWriteError);
    }

    return result.vector;
  }

  /**
   * Batch process embeddings with caching.
   */
  public async getEmbeddingsBatch(
    workspaceId: string,
    texts: string[],
    contentType: 'page_body' | 'vibe_guide' | 'brand_truth' | 'probe_question' = 'page_body',
    dimensions = 3072
  ): Promise<number[][]> {
    return Promise.all(texts.map(text => this.getEmbedding(workspaceId, text, contentType, dimensions)));
  }
}
