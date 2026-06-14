import { INDUSTRY_PANELS_DATA, SeedProbeQuestion, IndustryType } from '../../db/seed/industry-panels/questions-data';

export interface UnifiedQuestionMapping {
  id: string;
  question_text: string;
  source: 'industry' | 'site' | 'both';
  industry_qis_layer?: string;
  coverage_status: 'both' | 'industry_only' | 'site_only';
  industry_question_ref?: SeedProbeQuestion;
  site_question_ref?: SeedProbeQuestion;
  similarity_score: number;
}

export class QisCrossMapper {
  /**
   * Safe Jaccard word overlap similarity score
   */
  private getJaccardSimilarity(str1: string, str2: string): number {
    const cleanWords = (s: string) => 
      s.toLowerCase()
       .replace(/[^a-z0-9가-힣\s]/g, '')
       .split(/\s+/)
       .filter(w => w.length > 1);

    const words1 = new Set(cleanWords(str1));
    const words2 = new Set(cleanWords(str2));

    if (words1.size === 0 || words2.size === 0) return 0;

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Check if two questions have keyword intersections
   */
  private checkKeywordMatch(q1: SeedProbeQuestion, q2: SeedProbeQuestion): boolean {
    const mi1 = q1.must_include.map(w => w.toLowerCase().trim());
    const mi2 = q2.must_include.map(w => w.toLowerCase().trim());
    
    // If they share strategic non-brand keywords (e.g., ingredients like "retinol", "squalane")
    const common = mi1.filter(w => mi2.includes(w) && w.length > 2);
    return common.length > 0;
  }

  /**
   * Perform cross mapping between Set A (Industry) and Set B (Site)
   */
  async crossMap(industry: string, siteProbes: SeedProbeQuestion[]): Promise<UnifiedQuestionMapping[]> {
    const mappings: UnifiedQuestionMapping[] = [];
    
    // Load Industry QIS (Set A)
    const indData = INDUSTRY_PANELS_DATA[industry as IndustryType];
    const industryQuestions = indData ? indData.questions : [];

    const mappedSiteQuestionIndices = new Set<number>();
    const mappedIndustryQuestionIndices = new Set<number>();

    // 1. Cross-matching loop
    industryQuestions.forEach((indQ, indIdx) => {
      let bestMatchIdx = -1;
      let bestScore = 0;

      siteProbes.forEach((siteQ, siteIdx) => {
        if (mappedSiteQuestionIndices.has(siteIdx)) return;

        const score = this.getJaccardSimilarity(indQ.question_text, siteQ.question_text);
        const keywordMatch = this.checkKeywordMatch(indQ, siteQ);
        
        // Boost similarity if there's a specific product/ingredient keyword match
        const finalScore = keywordMatch ? score + 0.25 : score;

        if (finalScore > bestScore) {
          bestScore = finalScore;
          bestMatchIdx = siteIdx;
        }
      });

      // Goldilocks threshold for match: 0.35 similarity
      if (bestMatchIdx !== -1 && bestScore >= 0.35) {
        const siteQ = siteProbes[bestMatchIdx];
        mappedSiteQuestionIndices.add(bestMatchIdx);
        mappedIndustryQuestionIndices.add(indIdx);

        mappings.push({
          id: `map-both-${Date.now()}-${indIdx}`,
          question_text: indQ.question_text,
          source: 'both',
          industry_qis_layer: indQ.layer,
          coverage_status: 'both',
          industry_question_ref: indQ,
          site_question_ref: siteQ,
          similarity_score: Math.min(100, Math.round(bestScore * 100))
        });
      }
    });

    // 2. Collect unmatched Set A (Industry Only -> Content Gap / RED)
    industryQuestions.forEach((indQ, indIdx) => {
      if (mappedIndustryQuestionIndices.has(indIdx)) return;

      mappings.push({
        id: `map-ind-${Date.now()}-${indIdx}`,
        question_text: indQ.question_text,
        source: 'industry',
        industry_qis_layer: indQ.layer,
        coverage_status: 'industry_only',
        industry_question_ref: indQ,
        similarity_score: 0
      });
    });

    // 3. Collect unmatched Set B (Site Only -> Unique Strength / GREEN)
    siteProbes.forEach((siteQ, siteIdx) => {
      if (mappedSiteQuestionIndices.has(siteIdx)) return;

      mappings.push({
        id: `map-site-${Date.now()}-${siteIdx}`,
        question_text: siteQ.question_text,
        source: 'site',
        industry_qis_layer: siteQ.layer || 'L7_brand',
        coverage_status: 'site_only',
        site_question_ref: siteQ,
        similarity_score: 0
      });
    });

    return mappings;
  }
}
