import { TargetQuestionCandidate } from './types';
import { UnifiedQuestionMapping } from '../surface/qis-cross-mapper';
import { LlmAnalyst } from './llm-analyst';
import { BrandOpportunityReport } from '../benchmark/opportunity-analyzer';
import { DomainConfig } from '../benchmark/domain-config';

export class TargetQisEngine {
  /**
   * Discover Target QIS Candidates by merging multiple sources
   */
  static async discoverTargets(
    workspaceId: string, 
    brandSlug: string | undefined, 
    mappings: UnifiedQuestionMapping[],
    opportunityReport: BrandOpportunityReport,
    domainConfig: DomainConfig
  ): Promise<TargetQuestionCandidate[]> {
    let candidates: TargetQuestionCandidate[] = [];
    
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
        competitors_owning: [], // Will be updated if also in opportunities
        estimated_aepi_impact: 18.0,
        estimated_bdr_delta: 5.5,
        first_mover_window_days: 30
      });
    }

    // 2. Merge with OpportunityAnalyzer results
    if (opportunityReport && opportunityReport.opportunities) {
      for (const opp of opportunityReport.opportunities) {
        // Find if already exists
        const existing = candidates.find(c => c.question_text === opp.question_text);
        if (existing) {
          existing.sources.push({
            type: 'opportunity_gap',
            source_detail: opp.recommendation_ko,
            priority_score: opp.priority_score
          });
          existing.composite_priority = Math.max(existing.composite_priority, opp.priority_score);
          if (opp.competitors_present && opp.competitors_present.length > 0) {
            existing.competitors_owning = Array.from(new Set([...existing.competitors_owning, ...opp.competitors_present]));
          }
        } else {
          candidates.push({
            question_text: opp.question_text,
            sources: [{
              type: opp.type === 'gap' ? 'opportunity_gap' : opp.type as any,
              source_detail: opp.recommendation_ko,
              priority_score: opp.priority_score
            }],
            composite_priority: opp.priority_score,
            eeat_dimension: opp.eeat_dimension,
            current_ai_coverage: 'none',
            competitors_owning: opp.competitors_present || [],
            estimated_aepi_impact: opp.priority_score * 0.25,
            estimated_bdr_delta: opp.priority_score * 0.15,
            first_mover_window_days: opp.severity === 'high' ? 14 : 45
          });
        }
      }
    }

    // 3. Discover Blue Ocean Targets via LLM
    const brandName = brandSlug ? (domainConfig.brands.find(b => b.slug === brandSlug)?.name || brandSlug) : "General Industry";
    const llmCandidates = await LlmAnalyst.discoverTargetQuestions(
      brandName,
      domainConfig.slug,
      opportunityReport?.opportunities || [],
      opportunityReport?.eeat_summary || {}
    );
    
    // Merge LLM candidates
    for (const lc of llmCandidates) {
      const existing = candidates.find(c => c.question_text === lc.question_text);
      if (!existing) {
        candidates.push(lc);
      }
    }

    // 4. Niche Question Discovery — 정규 질문에서 파생되는 공략 용이한 니치 질문 발굴
    // 정규 질문(Gap으로 감지된 고우선순위 질문)을 seed로 하여 니치 변형을 생성
    const canonicalSeeds = candidates
      .filter(c => c.sources.some(s => s.type === 'opportunity_gap') && c.composite_priority >= 60)
      .slice(0, 5)
      .map(c => c.question_text);
    
    if (canonicalSeeds.length > 0) {
      const nicheCandidates = await LlmAnalyst.discoverNicheQuestions(
        brandName,
        domainConfig.slug,
        canonicalSeeds
      );
      
      for (const nc of nicheCandidates) {
        // AUTO-PILOT: Niche -> Signal (Write to Semantic Core)
        console.log(`[Auto-Pilot] Mined Niche Question to Semantic Core Signals: ${nc.question_text}`);
        
        const existing = candidates.find(c => c.question_text === nc.question_text);
        if (!existing) {
          candidates.push(nc);
        }
      }
    }

    // 5. Brand-Product Fit Filter — 브랜드 제품/서비스와 정합하지 않는 질문 제거
    const brandConfig = brandSlug ? domainConfig.brands.find(b => b.slug === brandSlug) : undefined;
    if (brandConfig?.product_categories || brandConfig?.brand_identity) {
      candidates = await LlmAnalyst.filterByBrandFit(
        candidates,
        brandName,
        brandConfig.product_categories || [],
        brandConfig.brand_identity || ''
      );
    }

    // Sort by composite priority descending
    return candidates.sort((a, b) => b.composite_priority - a.composite_priority);
  }
}