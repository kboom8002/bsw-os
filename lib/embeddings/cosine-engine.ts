import { EmbeddingService } from './embedding-service';
import { cosineSimilarity } from '../math/vector-math';
import { getSupabaseAdminClient } from '../supabase';

export interface VPAResult {
  contentText: string;
  similarity: number;
  vpaScore: number; // Normalized 0-100 score
}

export interface DriftAlert {
  pageId: string;
  pageTitle: string;
  slug: string;
  currentVPA: number;
  threshold: number;
  message: string;
  detectedAt: Date;
}

export class CosineAlignmentEngine {
  private embeddingService: EmbeddingService;

  constructor() {
    this.embeddingService = new EmbeddingService();
  }

  /**
   * Generates a 3072-dim embedding for a single text.
   * Utilizes internal cache and fallbacks.
   */
  public async getEmbedding(workspaceId: string, text: string, contentType: 'page_body' | 'vibe_guide' | 'brand_truth' | 'probe_question' = 'page_body'): Promise<number[]> {
    return this.embeddingService.getEmbedding(workspaceId, text, contentType, 3072);
  }

  /**
   * Generates 3072-dim embeddings for a batch of texts.
   */
  public async batchEmbed(workspaceId: string, texts: string[], contentType: 'page_body' | 'vibe_guide' | 'brand_truth' | 'probe_question' = 'page_body'): Promise<number[][]> {
    return this.embeddingService.getEmbeddingsBatch(workspaceId, texts, contentType, 3072);
  }

  /**
   * Computes the Vibe/Brand Alignment (VPA) score between brand guide text and content text.
   * VPA is normalized to 0 - 100 range based on cosine similarity.
   */
  public async computeVPA(workspaceId: string, brandGuideText: string, contentText: string): Promise<number> {
    if (!brandGuideText || !contentText) return 0;

    const brandVector = await this.getEmbedding(workspaceId, brandGuideText, 'brand_truth');
    const contentVector = await this.getEmbedding(workspaceId, contentText, 'page_body');

    const similarity = cosineSimilarity(brandVector, contentVector);
    // Normalize to 0-100 scale: cosine similarity on normalized text vectors sits in [0, 1] usually.
    const normalizedScore = Math.max(0, Math.min(100, parseFloat((similarity * 100).toFixed(2))));
    return normalizedScore;
  }

  /**
   * Computes VPA scores for multiple content texts against a single brand guide text.
   */
  public async batchVPA(workspaceId: string, brandGuideText: string, contents: string[]): Promise<VPAResult[]> {
    if (contents.length === 0) return [];
    if (!brandGuideText) {
      return contents.map(c => ({ contentText: c, similarity: 0, vpaScore: 0 }));
    }

    const brandVector = await this.getEmbedding(workspaceId, brandGuideText, 'brand_truth');
    const contentVectors = await this.batchEmbed(workspaceId, contents, 'page_body');

    return contents.map((text, idx) => {
      const vector = contentVectors[idx];
      const similarity = cosineSimilarity(brandVector, vector);
      const normalizedScore = Math.max(0, Math.min(100, parseFloat((similarity * 100).toFixed(2))));
      return {
        contentText: text,
        similarity,
        vpaScore: normalizedScore
      };
    });
  }

  /**
   * Time-series drift detection: scans workspace pages against their brand truths
   * and flags any pages whose VPA alignment falls below the defined threshold.
   */
  public async detectVibeDrift(workspaceId: string, threshold = 75.00): Promise<DriftAlert[]> {
    const supabase = getSupabaseAdminClient();

    // 1. Fetch brand truth
    const { data: brandTruth } = await supabase
      .from('brand_truths')
      .select('strategic_intent')
      .eq('workspace_id', workspaceId)
      .limit(1)
      .maybeSingle();

    if (!brandTruth || !brandTruth.strategic_intent) {
      return [];
    }

    // 2. Fetch pages
    const { data: pages } = await supabase
      .from('semantic_pages')
      .select('id, page_title, slug, page_body')
      .eq('workspace_id', workspaceId);

    if (!pages || pages.length === 0) {
      return [];
    }

    const brandGuide = brandTruth.strategic_intent;
    const pageBodies = pages.map(p => p.page_body);

    const vpaResults = await this.batchVPA(workspaceId, brandGuide, pageBodies);

    const alerts: DriftAlert[] = [];
    vpaResults.forEach((res, idx) => {
      if (res.vpaScore < threshold) {
        const page = pages[idx];
        alerts.push({
          pageId: page.id,
          pageTitle: page.page_title,
          slug: page.slug,
          currentVPA: res.vpaScore,
          threshold,
          message: `CRITICAL DRIFT: Vibe/Brand Alignment score (${res.vpaScore}) fell below the brand threshold of ${threshold}.`,
          detectedAt: new Date()
        });
      }
    });

    return alerts;
  }
}
