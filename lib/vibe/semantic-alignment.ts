import { getSupabaseAdminClient } from '../supabase';
import { EmbeddingService } from '../embeddings/embedding-service';
import { cosineSimilarity } from '../math/vector-math';

const embeddingService = new EmbeddingService();

export interface SemanticAlignmentResult {
  score: number;
  guideVector: number[];
  pageVector: number[];
  cached: boolean;
}

/**
 * Computes real-time vector cosine similarity based vibe alignment between a Vibe Spec and a Semantic Page.
 */
export async function computeSemanticVibeAlignment(
  workspaceId: string,
  vibeSpecId: string,
  pageId: string
): Promise<SemanticAlignmentResult> {
  const supabase = getSupabaseAdminClient();

  // 1. Fetch Vibe Spec
  const { data: vibeSpec, error: specError } = await supabase
    .from('vibe_specs')
    .select('vibe_name, brand_guide_text, target_vector')
    .eq('workspace_id', workspaceId)
    .eq('id', vibeSpecId)
    .single();

  if (specError || !vibeSpec) {
    throw new Error(`Failed to fetch vibe spec: ${specError?.message || 'Not found'}`);
  }

  // 2. Fetch Semantic Page
  const { data: page, error: pageError } = await supabase
    .from('semantic_pages')
    .select('page_title, visible_content')
    .eq('workspace_id', workspaceId)
    .eq('id', pageId)
    .single();

  if (pageError || !page) {
    throw new Error(`Failed to fetch semantic page: ${pageError?.message || 'Not found'}`);
  }

  // Fallback text if guide text or page body is empty
  const guideText = vibeSpec.brand_guide_text || `Brand tone guidelines for ${vibeSpec.vibe_name}. Target vibe parameters: ${JSON.stringify(vibeSpec.target_vector)}`;
  const pageText = page.visible_content || `Semantic page titled ${page.page_title}`;

  // 3. Obtain 3072-dim embeddings (with DB Cache)
  const hashService = embeddingService.generateHash.bind(embeddingService);
  const guideHash = hashService(guideText);
  const pageHash = hashService(pageText);

  // Check if cache has both vectors first to determine the cached flag correctly
  let cached = false;
  try {
    const { count, error } = await supabase
      .from('embedding_cache')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .in('content_hash', [guideHash, pageHash]);
    
    if (!error && count === 2) {
      cached = true;
    }
  } catch (e) {
    // Ignore cache hit count error
  }

  const guideVector = await embeddingService.getEmbedding(workspaceId, guideText, 'vibe_guide', 3072);
  const pageVector = await embeddingService.getEmbedding(workspaceId, pageText, 'page_body', 3072);

  // 4. Compute High-Dimensional Cosine Similarity
  const sim = cosineSimilarity(guideVector, pageVector);
  
  // Cosine similarity ranges from -1.0 to 1.0. Typically positive dimensions maps [0, 1].
  // Scale to [0, 100] percent score
  const score = parseFloat((Math.max(0, sim) * 100).toFixed(2));

  return {
    score,
    guideVector,
    pageVector,
    cached,
  };
}

/**
 * Scan all pages assigned or belonging to a workspace and calculate alignment rankings.
 */
export async function batchAlignmentScan(
  workspaceId: string,
  vibeSpecId: string
): Promise<Array<{ pageId: string; pageName: string; score: number }>> {
  const supabase = getSupabaseAdminClient();

  // Fetch all pages in the workspace
  const { data: pages, error } = await supabase
    .from('semantic_pages')
    .select('id, page_title')
    .eq('workspace_id', workspaceId);

  if (error || !pages) {
    return [];
  }

  const results: Array<{ pageId: string; pageName: string; score: number }> = [];

  for (const page of pages) {
    try {
      const alignment = await computeSemanticVibeAlignment(workspaceId, vibeSpecId, page.id);
      results.push({
        pageId: page.id,
        pageName: page.page_title,
        score: alignment.score,
      });
    } catch (e) {
      console.warn(`Failed to align page ${page.id}:`, e);
    }
  }

  // Sort by highest alignment score
  return results.sort((a, b) => b.score - a.score);
}
