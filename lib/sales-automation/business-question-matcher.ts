/**
 * lib/sales-automation/business-question-matcher.ts
 *
 * 영업 대상 업체와 포털 갭 질문을 매칭하고 적합 상품을 판정하는 매칭 엔진
 */

import type { BusinessAttributes, BusinessMatchResult } from './types';

export class BusinessQuestionMatcher {
  /**
   * 개별 업체의 시설/서비스 사양 정보와 포털 갭 상황을 대조하여
   * 영업에 적합한 기회 요인(Matched Gaps), 타깃 어트랙터, 스코어 및 제안 상품을 판정합니다.
   */
  public static matchBusinessToGaps(
    attributes: BusinessAttributes,
    gapSummary: Record<string, number>
  ): BusinessMatchResult {
    const matchedGapTypes: string[] = [];
    const matchedAttractors: string[] = [];
    let scoreAccumulator = 0;

    // 1. 주차 매칭 (access.parking 갭이 존재하는 경우)
    if (attributes.parking) {
      matchedGapTypes.push('missing_attractor.access.parking');
      matchedAttractors.push('attractor.resto.parking_convenience');
      scoreAccumulator += 25;
    }

    // 2. 우천 실내 매칭 (weather.rain 갭 대응)
    if (attributes.indoor_seats) {
      matchedGapTypes.push('missing_attractor.weather.rain');
      matchedAttractors.push('attractor.resto.rainy_day_visit');
      scoreAccumulator += 25;
    }

    // 3. 다국어 지원 매칭 (companion.foreigner 갭 대응)
    if (attributes.foreign_language_menu.length > 0) {
      matchedGapTypes.push('conversion_gap.companion.foreigner');
      matchedAttractors.push('attractor.resto.foreigner_friendly');
      scoreAccumulator += 20;
    }

    // 4. 배리어 프리 매칭 (policy.low_walk_route 갭 대응)
    if (attributes.wheelchair_access) {
      matchedGapTypes.push('missing_attractor.accessibility');
      matchedAttractors.push('attractor.resto.elderly_companion');
      scoreAccumulator += 20;
    }

    // 5. 키즈 프렌들리 매칭 (companion.child 갭 대응)
    if (attributes.kids_menu) {
      matchedGapTypes.push('missing_attractor.companion.child');
      matchedAttractors.push('attractor.resto.child_friendly');
      scoreAccumulator += 10;
    }

    // 매칭 스코어 최종 클램프 (0 - 100)
    const matchScore = Math.min(100, Math.max(0, scoreAccumulator));

    // 매칭된 강점에 따른 최적 제안 상품 및 요금제 판정
    let recommendedProduct = 'Rainy-Day AI홈피 Pack';
    let recommendedTier: 'basic' | 'pro' | 'premium' = 'pro';

    if (attributes.foreign_language_menu.length > 0 && matchScore >= 70) {
      recommendedProduct = 'Foreigner-Friendly Page Pack';
      recommendedTier = 'premium';
    } else if (attributes.wheelchair_access && !attributes.parking) {
      recommendedProduct = 'Accessibility Verification Pack';
      recommendedTier = 'pro';
    } else if (matchScore <= 40) {
      recommendedProduct = 'Review Summary & Trust Pack';
      recommendedTier = 'basic';
    }

    return {
      matched_gap_types: matchedGapTypes,
      matched_attractors: matchedAttractors,
      match_score: matchScore,
      recommended_product: recommendedProduct,
      recommended_tier: recommendedTier
    };
  }

  /**
   * 다수 업체 데이터에 대한 배치(Batch) 매칭을 수행합니다.
   */
  public static batchMatch(
    businesses: Array<{ name: string; attributes: BusinessAttributes }>,
    gapSummary: Record<string, number>
  ): Array<{ name: string; result: BusinessMatchResult }> {
    return businesses.map(biz => ({
      name: biz.name,
      result: this.matchBusinessToGaps(biz.attributes, gapSummary)
    }));
  }
}
