/**
 * lib/aihompy-pack/business-intake.ts
 *
 * 소상공인 업체 정보 수집, 파싱 및 네이버 플레이스 연동용 인테이크 모듈
 */

import { getAIProvider } from '../ai/ai-provider';

export interface BusinessIntakeData {
  business_name: string;
  address: string;
  phone: string;
  business_hours: string;
  description: string;
  
  // 업종 분류
  industry_type: 'restaurant_cafe' | 'accommodation' | 'experience' | 'wellness_kbeauty';
  
  // 네이버 플레이스 연동용 필드 (선택)
  naver_place_url?: string;
  naver_place_id?: string;
  
  // 상황형 속성 (물리적 특징 및 서비스 범위)
  facilities: {
    parking: boolean;
    parking_detail?: string;       // "무료 주차 30대"
    indoor_seats: boolean;
    wheelchair_access: boolean;
    kids_menu: boolean;
    pet_allowed: boolean;
    foreign_language_menu: string[]; // ["en", "ja", "zh"]
  };
  
  // 콘텐츠 원천 데이터
  menu_items: Array<{ name: string; price: number; description?: string }>;
  photos: Array<{ url: string; alt_text?: string; category: string }>;
  reviews_summary?: string;
  faq_entries: Array<{ question: string; answer: string }>;
}

export interface MatchingAttractorCandidate {
  attractor_id: string;
  fit_score: number;
  matched_concepts: string[];
  reason: string;
}

export class BusinessIntakeProcessor {
  /**
   * 네이버 플레이스 정보를 연동하여 기본 데이터 구조로 파싱합니다.
   * (실제 네이버 API 호출 및 크롤링 인터페이스 플레이스홀더 포함)
   */
  public static async fetchAndParseNaverPlace(placeUrlOrId: string): Promise<Partial<BusinessIntakeData>> {
    const placeId = this.extractPlaceId(placeUrlOrId);
    if (!placeId) {
      throw new Error('[BusinessIntakeProcessor] 유효한 네이버 플레이스 ID 또는 URL이 아닙니다.');
    }

    console.log(`[BusinessIntakeProcessor] 네이버 플레이스 ID ${placeId} 연동 시도 중...`);
    
    // Naver Place API / Crawl Mock
    // 실제 운영 시에는 이 포인트에서 외부 모듈을 연동하거나 프록시 크롤러를 작동시킵니다.
    return {
      naver_place_id: placeId,
      naver_place_url: `https://map.naver.com/v5/entry/place/${placeId}`,
      business_name: '제주 애월 감성 베이커리 카페 (네이버 동기화)',
      address: '제주특별자치도 제주시 애월읍 애월로 12-1',
      phone: '064-123-4567',
      business_hours: '매일 10:00 - 20:00 (라스트오더 19:30)',
      description: '제주 애월 바다가 한눈에 들어오는 넉넉한 주차 공간을 갖춘 아늑한 카페입니다. 유기농 밀가루로 구워낸 소금빵이 대표 메뉴이며, 외국인 친구와 함께 와도 주문이 편리하도록 다국어 메뉴판을 지원합니다.',
      facilities: {
        parking: true,
        parking_detail: '전용 주차장 20대 완비',
        indoor_seats: true,
        wheelchair_access: true,
        kids_menu: true,
        pet_allowed: false,
        foreign_language_menu: ['en', 'ja']
      },
      menu_items: [
        { name: '시그니처 애월 바다 소금빵', price: 4500, description: '제주 천일염을 사용하여 고소함과 짠맛의 조화가 예술인 대표 빵' },
        { name: '한라봉 아인슈페너', price: 7500, description: '수제 한라봉 청 위에 쫀쫀한 크림이 올라간 감귤 아인슈페너' }
      ],
      faq_entries: [
        { question: '주차가 가능한가요?', answer: '네, 매장 바로 앞에 20대 무료 주차가 가능한 단독 주차장이 완비되어 있어 초보 운전자도 편리합니다.' }
      ]
    };
  }

  /**
   * 네이버 플레이스 URL 또는 ID에서 ID 추출
   */
  private static extractPlaceId(input: string): string | null {
    if (/^\d+$/.test(input)) {
      return input;
    }
    const match = input.match(/place\/(\d+)/) || input.match(/entry\/place\/(\d+)/);
    return match ? match[1] : null;
  }

  /**
   * 업체 정보를 기반으로 활성화할 맥락 개념(Concepts)들을 추출합니다.
   */
  public static extractContextConcepts(data: BusinessIntakeData): string[] {
    const concepts: string[] = [];
    const prefix = this.getConceptPrefix(data.industry_type);

    if (data.facilities.parking) concepts.push(`${prefix}access.parking`);
    if (data.facilities.kids_menu) concepts.push(`${prefix}companion.child`);
    if (data.facilities.foreign_language_menu.length > 0) concepts.push(`${prefix}companion.foreigner`);
    if (data.facilities.wheelchair_access) {
      if (data.industry_type === 'restaurant_cafe') {
        concepts.push('access.public_transit'); // 뚜벅이/접근성
      } else if (data.industry_type === 'accommodation') {
        concepts.push('stay.no_car_access');
      } else if (data.industry_type === 'experience') {
        concepts.push('exp.elderly_intensity');
      }
    }
    
    // description 텍스트 마이닝을 통한 진정/쿨링/공항 버퍼 개념 활성화
    const lowerDesc = data.description.toLowerCase();
    if (lowerDesc.includes('공항') || lowerDesc.includes('airport')) {
      if (data.industry_type === 'restaurant_cafe') concepts.push('time.airport_buffer');
      if (data.industry_type === 'accommodation') concepts.push('stay.airport_shuttle');
    }
    if (lowerDesc.includes('비오는') || lowerDesc.includes('실내') || lowerDesc.includes('rainy')) {
      if (data.industry_type === 'restaurant_cafe') concepts.push('weather.rain');
      if (data.industry_type === 'experience') concepts.push('exp.indoor_facility');
    }
    if (data.industry_type === 'wellness_kbeauty') {
      if (lowerDesc.includes('진정') || lowerDesc.includes('보습')) concepts.push('well.skin_soothing');
      if (lowerDesc.includes('햇볕') || lowerDesc.includes('쿨링')) concepts.push('well.sunburn_care');
      concepts.push('well.sensitive_skin'); // 기본 장착
    }

    return concepts;
  }

  private static getConceptPrefix(industry: string): string {
    switch (industry) {
      case 'restaurant_cafe': return '';
      case 'accommodation': return 'stay.';
      case 'experience': return 'exp.';
      case 'wellness_kbeauty': return 'well.';
      default: return '';
    }
  }

  /**
   * 업체 정보를 분석하여 매칭되는 어트랙터와 매칭 사유를 도출합니다.
   */
  public static async findApplicableAttractors(
    data: BusinessIntakeData,
    dbAttractors: any[]
  ): Promise<MatchingAttractorCandidate[]> {
    const activeConcepts = this.extractContextConcepts(data);
    const results: MatchingAttractorCandidate[] = [];

    for (const attr of dbAttractors) {
      const trigger = attr.trigger_state || {};
      const reqConcepts = attr.concept_state?.required_concepts || [];
      const userPatterns = trigger.user_question_patterns || [];
      
      // 필수 개념 중 활성화된 개념 교집합 분석
      const matched = reqConcepts.filter((c: string) => activeConcepts.includes(c));
      const fitScore = reqConcepts.length === 0 ? 50 : Math.round((matched.length / reqConcepts.length) * 100);

      if (fitScore >= 50 || reqConcepts.length === 0) {
        results.push({
          attractor_id: attr.id,
          fit_score: fitScore,
          matched_concepts: matched,
          reason: `업체의 정보('${data.business_name}') 및 시설 속성이 어트랙터 요구사항인 [${reqConcepts.join(', ')}]을 충족합니다.`
        });
      }
    }

    return results.sort((a, b) => b.fit_score - a.fit_score);
  }
}
