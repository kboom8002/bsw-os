/**
 * lib/sales-automation/gap-product-mapper.ts
 *
 * 포털 갭 패턴과 영업 제안 패키지 상품 간 매핑 정의 구성 모듈
 */

import type { GapProductMapping } from './types';

export const DEFAULT_GAP_PRODUCT_MAPPINGS: GapProductMapping[] = [
  {
    gap_pattern: "weather.rain + missing_attractor",
    product_name: "Rainy-Day AI홈피 Pack",
    product_slug: "rainy-day-pack",
    product_description: "비 오는 날 실내 데이트나 가족 방문객이 주차와 실내 쾌적성을 우선 고려해 탐색할 때 노출을 강화하는 팩",
    applicable_industries: ['restaurant_cafe', 'experience'],
    default_tier: 'pro'
  },
  {
    gap_pattern: "policy.low_walk_route + missing_attractor",
    product_name: "Accessibility Verification Pack",
    product_slug: "accessibility-pack",
    product_description: "휠체어나 유모차가 문턱 없이 안전하게 입장할 수 있음을 증명하는 물리 배리어 프리 스키마 고도화 팩",
    applicable_industries: ['restaurant_cafe', 'accommodation', 'experience'],
    default_tier: 'pro'
  },
  {
    gap_pattern: "companion.foreigner + conversion_gap",
    product_name: "Foreigner-Friendly Page Pack",
    product_slug: "foreigner-pack",
    product_description: "영어 등 다국어 메뉴 스키마와 간편 다국어 문진, 비접촉 마스터/애플페이 카드 연동을 입증하는 외국인 특화 노출 팩",
    applicable_industries: ['restaurant_cafe', 'accommodation', 'wellness_kbeauty'],
    default_tier: 'premium'
  },
  {
    gap_pattern: "time.airport_buffer + missing_attractor",
    product_name: "Airport Buffer Exposure Pack",
    product_slug: "airport-buffer-pack",
    product_description: "공항 전후 1~2시간 버퍼 시간대 고속 메뉴 서비스와 간이 짐 보관 서비스를 매핑해 충성 타깃을 발굴하는 팩",
    applicable_industries: ['restaurant_cafe', 'accommodation'],
    default_tier: 'pro'
  },
  {
    gap_pattern: "companion.child + missing_attractor",
    product_name: "Family-Friendly Attractor Pack",
    product_slug: "family-pack",
    product_description: "유아 전용 하이체어, 친환경 키즈밀 식기 세트 및 유모차 안심 주차 구역 정보가 자동 조립되는 패밀리 타깃 팩",
    applicable_industries: ['restaurant_cafe', 'accommodation', 'experience'],
    default_tier: 'pro'
  },
  {
    gap_pattern: "broken_media_soliton",
    product_name: "CTA/Recomposition Pack",
    product_slug: "cta-recomposition-pack",
    product_description: "지도 클릭수 대비 예약/구매 전환율이 낮은 이탈 구간을 보완하여 CTA와 리컴포지션 피드백 루프를 강화하는 팩",
    applicable_industries: ['restaurant_cafe', 'accommodation', 'experience', 'wellness_kbeauty'],
    default_tier: 'pro'
  },
  {
    gap_pattern: "trust_gap",
    product_name: "Review Summary & Trust Pack",
    product_slug: "trust-pack",
    product_description: "공식 위생 3성 등급 또는 로컬 안심 계약서 등 정본 인증 증빙을 AI 크롤러에 명확히 색인시켜 신뢰 등급을 수립하는 팩",
    applicable_industries: ['restaurant_cafe', 'wellness_kbeauty'],
    default_tier: 'basic'
  }
];

export class GapProductMapper {
  /**
   * 발생한 갭 정보와 업종을 기반으로 가장 알맞은 패키지 상품 정보를 매치하여 반환합니다.
   */
  public static resolveMapping(gapPattern: string, industry: string): GapProductMapping {
    const matched = DEFAULT_GAP_PRODUCT_MAPPINGS.find(m => 
      m.gap_pattern.includes(gapPattern) && 
      (!m.applicable_industries || m.applicable_industries.includes(industry))
    );

    return matched || {
      workspace_id: '00000000-0000-0000-0000-000000000000',
      gap_pattern: gapPattern,
      product_name: "Standard AI홈피 Pack",
      product_slug: "standard-aihompy-pack",
      product_description: "소상공인 기본 AI 검색 노출 및 상황 대응 기본 팩",
      default_tier: 'pro'
    };
  }
}
