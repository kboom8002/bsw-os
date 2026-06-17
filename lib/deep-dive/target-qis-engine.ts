import { TargetQuestionCandidate } from './types';
import { UnifiedQuestionMapping } from '../surface/qis-cross-mapper';

export class TargetQisEngine {
  /**
   * Discover Target QIS Candidates by merging multiple sources
   * Mock implementation that returns realistic structure based on the plan.
   */
  static async discoverTargets(
    workspaceId: string, 
    brandSlug: string, 
    mappings: UnifiedQuestionMapping[]
  ): Promise<TargetQuestionCandidate[]> {
    const candidates: TargetQuestionCandidate[] = [];
    
    // 1. Extract from QisCrossMapper (RED quadrant -> industry_only)
    const redMappings = mappings.filter(m => m.coverage_status === 'industry_only');
    
    for (const m of redMappings) {
      candidates.push({
        question_text: m.question_text,
        sources: [{
          type: 'cross_map_red',
          source_detail: `Industry QIS Layer: ${m.industry_qis_layer}`,
          priority_score: 85
        }],
        composite_priority: 85,
        eeat_dimension: 'expertise',
        current_ai_coverage: 'none',
        competitors_owning: ['Dr.Jart+', 'CNP'],
        estimated_aepi_impact: 18.0,
        estimated_bdr_delta: 5.5,
        first_mover_window_days: 30
      });
    }

    // 2. We would normally fetch OpportunityAnalyzer results and merge using Jaccard Similarity.
    // For now, we inject a synthetic blue ocean opportunity to represent a complete result set.
    candidates.push({
      question_text: '레티놀 입문 시 부작용 없는 보습크림 추천',
      sources: [{
        type: 'blind_spot',
        source_detail: 'No brand is currently dominating this high-intent query.',
        priority_score: 95
      }],
      composite_priority: 95,
      eeat_dimension: 'trust',
      current_ai_coverage: 'none',
      competitors_owning: [],
      estimated_aepi_impact: 22.5,
      estimated_bdr_delta: 12.0,
      first_mover_window_days: 90
    });

    // Sort by composite priority descending
    return candidates.sort((a, b) => b.composite_priority - a.composite_priority);
  }
}
