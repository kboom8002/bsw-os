import { getSupabaseAdminClient } from '../supabase';
import { getEmbeddingProvider } from './embedding-provider';
import * as crypto from 'crypto';

/**
 * Calculates a SHA-256 hash of a string to use as a stable cache key.
 */
function getContentHash(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Fetches the embedding vector for a given text, utilizing DB caching to minimize API costs.
 * Strictly respects workspace_id tenant boundaries.
 */
export async function getOrComputeEmbedding(workspaceId: string, text: string): Promise<number[]> {
  const hash = getContentHash(text);
  const modelName = 'text-embedding-004';
  const supabase = getSupabaseAdminClient();

  // 1. Attempt to hit the cache
  const { data: cacheRecord, error: cacheErr } = await supabase
    .from('embedding_cache')
    .select('embedding_vector')
    .eq('workspace_id', workspaceId)
    .eq('content_hash', hash)
    .eq('model_name', modelName)
    .maybeSingle();

  if (cacheRecord?.embedding_vector && Array.isArray(cacheRecord.embedding_vector)) {
    return cacheRecord.embedding_vector as number[];
  }

  // 2. Cache miss: invoke EmbeddingProvider
  const provider = getEmbeddingProvider();
  const vector = await provider.embed(text);

  // 3. Write back to cache for future requests (runs asynchronously or synchronously)
  const { error: insertErr } = await supabase
    .from('embedding_cache')
    .insert({
      workspace_id: workspaceId,
      content_hash: hash,
      embedding_vector: vector,
      model_name: modelName
    });

  if (insertErr) {
    console.error(`Failed to write embedding cache: ${insertErr.message}`);
    // Non-blocking error, return vector anyway
  }

  return vector;
}

/**
 * Computes semantic cosine similarity of a page text against target vibe dimensions.
 */
export async function computeSemanticVibeVector(
  workspaceId: string,
  text: string
): Promise<{ clinical: number; warm: number; luxury: number }> {
  // Generate embedding for text
  const textVector = await getOrComputeEmbedding(workspaceId, text);

  // Pre-defined semantic anchor terms representing our dimensions
  const anchorClinical = "scientific, clinical trial evidence, dermatologist certified, efficacy formula, laboratory tested";
  const anchorWarm = "warm empathy, human caregiver, gentle touch, emotional support, comforting skin relationship";
  const anchorLuxury = "premium luxury aesthetics, elegant design, expensive, elite high-end lifestyle, sophisticated styling";

  const [vecClinical, vecWarm, vecLuxury] = await Promise.all([
    getOrComputeEmbedding(workspaceId, anchorClinical),
    getOrComputeEmbedding(workspaceId, anchorWarm),
    getOrComputeEmbedding(workspaceId, anchorLuxury)
  ]);

  // Calculate cosine similarity scores
  const scoreClinical = Math.max(0, cosineSimilarity(textVector, vecClinical));
  const scoreWarm = Math.max(0, cosineSimilarity(textVector, vecWarm));
  const scoreLuxury = Math.max(0, cosineSimilarity(textVector, vecLuxury));

  const total = scoreClinical + scoreWarm + scoreLuxury;
  if (total === 0) {
    return { clinical: 34, warm: 33, luxury: 33 }; // default equal balance fallback
  }

  // Normalize scores to sum to exactly 100%
  const clinical = Math.round((scoreClinical / total) * 100);
  const warm = Math.round((scoreWarm / total) * 100);
  const luxury = 100 - (clinical + warm); // ensure sum is exactly 100

  return { clinical, warm, luxury };
}

// Simple internal cosine similarity helper to avoid circular imports
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const mag = Math.sqrt(normA) * Math.sqrt(normB);
  return mag === 0 ? 0 : dotProduct / mag;
}
