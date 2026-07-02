import { getSupabaseAdminClient } from '../supabase';
import { EmbeddingService } from '../embeddings/embedding-service';
import { cosineSimilarity } from '../math/vector-math';
import { PatternAttractorSpec, ContextTensor, AttractorType } from './types';

export interface ScoredAttractor {
  attractor: PatternAttractorSpec;
  similarityScore: number;
}

export class AttractorRetriever {
  private embeddingService: EmbeddingService;

  constructor(private workspaceId: string, private domainId: string) {
    this.embeddingService = new EmbeddingService();
  }

  // Retrieve and score candidate attractors matching a query & context tensor
  async retrieveCandidates(
    query: string,
    tensor: ContextTensor,
    options?: { limit?: number; includeDeprecated?: boolean; brandId?: string }
  ): Promise<PatternAttractorSpec[]> {
    const supabase = getSupabaseAdminClient();
    
    // 1. Fetch attractors for this domain
    let dbQuery = supabase
      .from('pattern_attractors')
      .select('*')
      .eq('workspace_id', this.workspaceId)
      .eq('domain_id', this.domainId);

    if (!options?.includeDeprecated) {
      dbQuery = dbQuery.eq('status', 'active');
    }

    if (options?.brandId) {
      // Fetch both domain standard and brand-specific ones
      dbQuery = dbQuery.or(`brand_id.is.null,brand_id.eq.${options.brandId}`);
    } else {
      dbQuery = dbQuery.is('brand_id', null);
    }

    const { data: attractorsData, error } = await dbQuery;
    if (error || !attractorsData || attractorsData.length === 0) {
      return [];
    }

    // Convert DB records to PatternAttractorSpec
    const attractors: PatternAttractorSpec[] = attractorsData.map((row) => ({
      id: row.id,
      version: row.version,
      status: row.status,
      type: row.type as AttractorType[],
      scope: row.scope,
      domain: { id: this.domainId, name: tensor.domain },
      brand_id: row.brand_id,
      natural_definition: row.natural_definition,
      trigger_state: row.trigger_state,
      concept_state: row.concept_state,
      evidence_anchor: row.evidence_anchor,
      vibe_signature: row.vibe_signature,
      action_policy: row.action_policy,
      media_soliton_rule: row.media_soliton_rule,
      target_state: row.target_state,
      metrics: row.metrics,
      failure_modes: row.failure_modes,
      recomposition_rule: row.recomposition_rule
    }));

    // 2. Perform trigger similarity matching via embeddings
    const queryVector = await this.embeddingService.getEmbedding(
      this.workspaceId,
      query,
      'probe_question'
    );

    const scoredAttractors: ScoredAttractor[] = [];

    for (const attractor of attractors) {
      const patterns = attractor.trigger_state?.user_question_patterns || [];
      if (patterns.length === 0) {
        // If no patterns, fallback to low default similarity
        scoredAttractors.push({ attractor, similarityScore: 0.1 });
        continue;
      }

      // Fetch embeddings for all patterns and calculate max similarity
      let maxSim = 0;
      try {
        const patternVectors = await this.embeddingService.getEmbeddingsBatch(
          this.workspaceId,
          patterns,
          'probe_question'
        );

        for (const vector of patternVectors) {
          const sim = cosineSimilarity(queryVector, vector);
          if (sim > maxSim) {
            maxSim = sim;
          }
        }
      } catch (err) {
        console.error(`Embedding generation failed for attractor ${attractor.id} trigger patterns:`, err);
        // String fallback matching
        const matched = patterns.some((p) => query.toLowerCase().includes(p.toLowerCase()));
        maxSim = matched ? 0.8 : 0.2;
      }

      scoredAttractors.push({ attractor, similarityScore: maxSim });
    }

    // 3. Filter by threshold (cosine similarity >= 0.50 for candidate consideration)
    const threshold = 0.50;
    let candidates = scoredAttractors
      .filter((s) => s.similarityScore >= threshold)
      .sort((a, b) => b.similarityScore - a.similarityScore);

    // 4. Filter by Context Tensor constraints
    // Penalize risk mismatches and boost intent alignment
    candidates = candidates.map((c) => {
      const att = c.attractor;
      let penalty = 0;
      
      // Risk level mismatch penalty
      const queryRisk = tensor.risk_state;
      const attRisk = att.trigger_state?.risk_state?.level;
      if (queryRisk && attRisk) {
        const riskLevels = ['low', 'medium', 'high', 'critical'];
        const queryIdx = riskLevels.indexOf(queryRisk);
        const attIdx = riskLevels.indexOf(attRisk);
        if (queryIdx >= 0 && attIdx >= 0) {
          const diff = Math.abs(queryIdx - attIdx);
          penalty += diff * 0.05; // 5% penalty per risk level gap
        }
      }
      
      // Intent alignment bonus
      const queryIntent = tensor.intent_state;
      const attIntents = att.trigger_state?.intent_state || [];
      if (queryIntent && attIntents.length > 0 && attIntents.includes(queryIntent)) {
        penalty -= 0.1; // 10% bonus for intent match
      }
      
      return {
        ...c,
        similarityScore: Math.max(0, c.similarityScore - penalty)
      };
    }).filter((s) => s.similarityScore >= threshold)
      .sort((a, b) => b.similarityScore - a.similarityScore);
    
    const limit = options?.limit || 5;
    return candidates.slice(0, limit).map((c) => c.attractor);
  }
}
