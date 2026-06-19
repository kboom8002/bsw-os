import { StatisticalProbeResult } from './statistical-prober';

export interface CognitiveIntensityFactor {
  recognition: number;
  attribute_depth: number;
  consistency: number;
  differentiation: number;
  hedging_inverse: number;
}

export interface CognitiveIntensityMetrics {
  score: number; // 0~100
  grade: 'STRONG' | 'MODERATE' | 'WEAK' | 'ABSENT';
  factors: CognitiveIntensityFactor;
}

export interface CognitiveIntensityResult {
  overall: CognitiveIntensityMetrics;
  b2c?: CognitiveIntensityMetrics;
  b2b?: CognitiveIntensityMetrics;
  gap_analysis?: {
    b2b_b2c_delta: number; // B2B score - B2C score
    weaker_model: 'B2B' | 'B2C' | 'BALANCED';
    recommendation_ko: string;
  };
}

export class CognitiveIntensityScorer {
  /**
   * Scores the cognitive intensity for given statistical results.
   */
  score(
    brandName: string,
    b2cResult?: StatisticalProbeResult,
    b2bResult?: StatisticalProbeResult
  ): CognitiveIntensityResult {
    const result: CognitiveIntensityResult = {
      overall: this.calculateMetrics(brandName, null) // will be aggregated
    };

    if (b2cResult) {
      result.b2c = this.calculateMetrics(brandName, b2cResult);
    }
    if (b2bResult) {
      result.b2b = this.calculateMetrics(brandName, b2bResult);
    }

    // Aggregate overall
    if (b2cResult && b2bResult) {
      const b2cScore = result.b2c!.score;
      const b2bScore = result.b2b!.score;
      const avgScore = (b2cScore + b2bScore) / 2;
      
      const avgFactors: CognitiveIntensityFactor = {
        recognition: (result.b2c!.factors.recognition + result.b2b!.factors.recognition) / 2,
        attribute_depth: (result.b2c!.factors.attribute_depth + result.b2b!.factors.attribute_depth) / 2,
        consistency: (result.b2c!.factors.consistency + result.b2b!.factors.consistency) / 2,
        differentiation: (result.b2c!.factors.differentiation + result.b2b!.factors.differentiation) / 2,
        hedging_inverse: (result.b2c!.factors.hedging_inverse + result.b2b!.factors.hedging_inverse) / 2,
      };

      result.overall = {
        score: Math.round(avgScore),
        grade: this.getGrade(avgScore),
        factors: avgFactors
      };

      const delta = b2bScore - b2cScore;
      let weaker: 'B2B' | 'B2C' | 'BALANCED' = 'BALANCED';
      let rec = '두 모델 모두 균형잡힌 인지를 보이고 있습니다.';

      if (Math.abs(delta) > 10) {
        if (delta > 0) {
          weaker = 'B2C';
          rec = 'B2C 소비자 대상 인지도가 B2B보다 낮습니다. 대중적인 브랜드 캠페인과 B2C 콘텐츠 보강이 필요합니다.';
        } else {
          weaker = 'B2B';
          rec = 'B2B 파트너/기업 대상 인지도가 B2C보다 현저히 낮습니다. 전문성, 신뢰도 중심의 레퍼런스 구축이 시급합니다.';
        }
      }

      result.gap_analysis = {
        b2b_b2c_delta: Math.round(delta),
        weaker_model: weaker,
        recommendation_ko: rec
      };
    } else if (b2cResult) {
      result.overall = { ...result.b2c! };
    } else if (b2bResult) {
      result.overall = { ...result.b2b! };
    }

    return result;
  }

  private calculateMetrics(brandName: string, data: StatisticalProbeResult | null): CognitiveIntensityMetrics {
    if (!data || data.sampleSize === 0) {
      return {
        score: 0,
        grade: 'ABSENT',
        factors: { recognition: 0, attribute_depth: 0, consistency: 0, differentiation: 0, hedging_inverse: 0 }
      };
    }

    // 1. Recognition: How often is the brand name explicitly mentioned in the response?
    let recognitionCount = 0;
    let totalKeywords = 0;
    const allKeywords = new Set<string>();

    data.rawResponses.forEach(r => {
      if (r.response.answer_text.toLowerCase().includes(brandName.toLowerCase())) {
        recognitionCount++;
      }
      r.response.extracted_keywords.forEach(kw => {
        allKeywords.add(kw.toLowerCase());
        totalKeywords++;
      });
    });
    
    const recognition = Math.min(1.0, recognitionCount / data.rawResponses.length);

    // 2. Attribute Depth: Number of unique keywords vs total responses
    // Expected around 2 unique keywords per response
    const expectedUniqueKeywords = data.rawResponses.length * 2;
    const attribute_depth = Math.min(1.0, allKeywords.size / (expectedUniqueKeywords || 1));

    // 3. Consistency: Taken directly from statistical prober
    const consistency = data.overallConsistency;

    // 4. Differentiation: Proxy using brand_term_usage from distributions
    // Average brand_term_usage / 100
    const diffStat = data.parameterDistributions['brand_term_usage'];
    const differentiation = Math.min(1.0, diffStat ? diffStat.mean / 100.0 : 0);

    // 5. Hedging Inverse: 1 - (hedging_ratio / 100)
    const hedgeStat = data.parameterDistributions['hedging_ratio'];
    const hedging_inverse = Math.max(0, 1.0 - (hedgeStat ? hedgeStat.mean / 100.0 : 0));

    // Calculate weighted score
    const score = (
      (recognition * 0.25) +
      (attribute_depth * 0.25) +
      (consistency * 0.20) +
      (differentiation * 0.15) +
      (hedging_inverse * 0.15)
    ) * 100;

    const roundedScore = Math.round(score);

    return {
      score: roundedScore,
      grade: this.getGrade(roundedScore),
      factors: {
        recognition,
        attribute_depth,
        consistency,
        differentiation,
        hedging_inverse
      }
    };
  }

  private getGrade(score: number): 'STRONG' | 'MODERATE' | 'WEAK' | 'ABSENT' {
    if (score >= 80) return 'STRONG';
    if (score >= 60) return 'MODERATE';
    if (score >= 40) return 'WEAK';
    return 'ABSENT';
  }
}
