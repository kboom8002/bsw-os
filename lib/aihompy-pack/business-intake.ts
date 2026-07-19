/**
 * lib/aihompy-pack/business-intake.ts
 *
 * 소상공인 업체 정보 수집, 파싱 및 네이버 플레이스 연동용 인테이크 모듈
 * v2: 네이버 플레이스 실 크롤링 + 업종 타입 확장
 */

import { getAIProvider } from '../ai/ai-provider';
import { NaverPlaceClient } from './naver-place-client';

export interface BusinessIntakeData {
  business_name: string;
  address: string;
  phone: string;
  business_hours: string;
  description: string;
  
  // 업종 분류 (확장: tourism_activity 추가)
  industry_type: 'restaurant_cafe' | 'accommodation' | 'experience' | 'wellness_kbeauty' | 'tourism_activity';
  
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
    /** 외국어 안내 지원 여부 */
    foreign_language_staff?: boolean;
    /** 반실내/루프탑 등 우천 대응 가능 여부 */
    rain_shelter?: boolean;
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
   * 네이버 플레이스 URL 또는 ID에서 업체 정보를 실 크롤링합니다.
   */
  public static async fetchAndParseNaverPlace(placeUrlOrId: string): Promise<Partial<BusinessIntakeData>> {
    console.log(`[BusinessIntakeProcessor] 네이버 플레이스 실 크롤링 시작: ${placeUrlOrId}`);
    
    const raw = await NaverPlaceClient.fetchByUrlOrId(placeUrlOrId);

    if (!raw) {
      throw new Error('[BusinessIntakeProcessor] 유효한 네이버 플레이스 ID 또는 URL이 아닙니다.');
    }

    // AI로 카테고리 → industry_type 매핑
    const industryType = await this.inferIndustryType(raw.category, raw.description);

    // 업체 설명에서 시설 속성 AI 추론
    const inferredFacilities = await this.inferFacilitiesFromDescription(
      raw.description || '',
      raw.business_name
    );

    return {
      naver_place_id: raw.place_id,
      naver_place_url: raw.naver_url,
      business_name: raw.business_name,
      address: raw.address,
      phone: raw.phone || '',
      business_hours: raw.business_hours || '영업시간 확인 필요',
      description: raw.description || `${raw.business_name} — ${raw.category}`,
      industry_type: industryType,
      facilities: inferredFacilities,
      menu_items: [],
      photos: [],
      faq_entries: [],
    };
  }

  /**
   * AI로 카테고리 문자열에서 industry_type을 추론합니다.
   */
  private static async inferIndustryType(
    category: string,
    description?: string
  ): Promise<BusinessIntakeData['industry_type']> {
    const catLower = (category + ' ' + (description || '')).toLowerCase();

    if (/호텔|펜션|숙소|게스트하우스|민박|리조트|풀빌라|모텔/.test(catLower)) return 'accommodation';
    if (/스킨케어|피부|한의원|마사지|스파|뷰티|미용|네일|왁싱|화장품/.test(catLower)) return 'wellness_kbeauty';
    if (/체험|투어|액티비티|낚시|승마|서핑|스노쿨|오름|해녀|레저|원데이/.test(catLower)) return 'experience';
    if (/관광|명소|여행|관람|박물관|미술관|공연|전시|아쿠아|테마파크/.test(catLower)) return 'tourism_activity';
    // 기본값: 맛집·카페
    return 'restaurant_cafe';
  }

  /**
   * AI로 업체 설명 텍스트에서 시설 속성을 추론합니다.
   */
  private static async inferFacilitiesFromDescription(
    description: string,
    businessName: string
  ): Promise<BusinessIntakeData['facilities']> {
    const desc = description.toLowerCase();

    // 규칙 기반 추론 (빠른 초기값)
    const parking = /주차|parking/.test(desc);
    const indoorSeats = /실내|indoor|좌석|홀/.test(desc);
    const wheelchairAccess = /휠체어|경사로|엘리베이터|무장애|배리어/.test(desc);
    const kidsMenu = /아이|어린이|유아|키즈|아기|하이체어/.test(desc);
    const petAllowed = /반려동물|애완|펫/.test(desc);
    const foreignMenu = /영어|메뉴판|english menu|外文|다국어|외국어/.test(desc);
    const rainShelter = /실내|지붕|비|우천|천막|테라스|루프탑/.test(desc);

    // AI 보완: 설명이 충분히 길면 AI로 재검증
    if (description.length > 80) {
      try {
        const ai = getAIProvider();
        const prompt = `Business: "${businessName}"
Description: "${description}"

Extract facility attributes. Return JSON with exactly these boolean keys:
parking, indoor_seats, wheelchair_access, kids_menu, pet_allowed, foreign_language_menu (array of language codes like ["en","ja"]), rain_shelter, foreign_language_staff.

Only mark true if explicitly mentioned or strongly implied. Be conservative.`;

        const result = await ai.generateStructuredOutput<any>(
          `System:\n${prompt}\n\nUser:\nExtract facility attributes.`,
          {
            type: 'object',
            properties: {
              parking: { type: 'boolean' },
              indoor_seats: { type: 'boolean' },
              wheelchair_access: { type: 'boolean' },
              kids_menu: { type: 'boolean' },
              pet_allowed: { type: 'boolean' },
              foreign_language_menu: { type: 'array', items: { type: 'string' } },
              rain_shelter: { type: 'boolean' },
              foreign_language_staff: { type: 'boolean' },
            },
            required: ['parking', 'indoor_seats'],
          },
          { temperature: 0.0 }
        );

        return {
          parking: result.parking ?? parking,
          indoor_seats: result.indoor_seats ?? indoorSeats,
          wheelchair_access: result.wheelchair_access ?? wheelchairAccess,
          kids_menu: result.kids_menu ?? kidsMenu,
          pet_allowed: result.pet_allowed ?? petAllowed,
          foreign_language_menu: result.foreign_language_menu ?? (foreignMenu ? ['en'] : []),
          rain_shelter: result.rain_shelter ?? rainShelter,
          foreign_language_staff: result.foreign_language_staff ?? false,
        };
      } catch {
        // fallback to rule-based
      }
    }

    return {
      parking,
      indoor_seats: indoorSeats,
      wheelchair_access: wheelchairAccess,
      kids_menu: kidsMenu,
      pet_allowed: petAllowed,
      foreign_language_menu: foreignMenu ? ['en'] : [],
      rain_shelter: rainShelter,
      foreign_language_staff: false,
    };
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
    if (data.facilities.foreign_language_staff) concepts.push(`${prefix}companion.foreigner`);
    if (data.facilities.rain_shelter || data.facilities.indoor_seats) concepts.push('weather.rain');

    if (data.facilities.wheelchair_access) {
      if (data.industry_type === 'restaurant_cafe') {
        concepts.push('access.public_transit');
        concepts.push('companion.elderly');
      } else if (data.industry_type === 'accommodation') {
        concepts.push('stay.no_car_access');
        concepts.push('stay.barrier_free');
      } else if (data.industry_type === 'experience' || data.industry_type === 'tourism_activity') {
        concepts.push('exp.elderly_intensity');
        concepts.push('exp.barrier_free_route');
      }
    }
    
    // description 텍스트 마이닝
    const lowerDesc = data.description.toLowerCase();
    if (lowerDesc.includes('공항') || lowerDesc.includes('airport')) {
      if (data.industry_type === 'restaurant_cafe') concepts.push('time.airport_buffer');
      if (data.industry_type === 'accommodation') concepts.push('stay.airport_shuttle');
    }
    if (lowerDesc.includes('비오는') || lowerDesc.includes('실내') || lowerDesc.includes('rainy')) {
      if (data.industry_type === 'restaurant_cafe') concepts.push('weather.rain');
      if (data.industry_type === 'experience') concepts.push('exp.indoor_facility');
    }
    if (lowerDesc.includes('외국인') || lowerDesc.includes('영어') || lowerDesc.includes('english')) {
      concepts.push(`${prefix}companion.foreigner`);
    }
    if (lowerDesc.includes('부모님') || lowerDesc.includes('어르신') || lowerDesc.includes('휠체어')) {
      concepts.push(`${prefix}companion.elderly`);
    }
    if (data.industry_type === 'wellness_kbeauty') {
      if (lowerDesc.includes('진정') || lowerDesc.includes('보습')) concepts.push('well.skin_soothing');
      if (lowerDesc.includes('햇볕') || lowerDesc.includes('쿨링')) concepts.push('well.sunburn_care');
      concepts.push('well.sensitive_skin');
    }
    if (data.industry_type === 'tourism_activity') {
      if (lowerDesc.includes('투어') || lowerDesc.includes('가이드')) concepts.push('tourism.guided_tour');
      if (lowerDesc.includes('예약')) concepts.push('tourism.advance_booking');
    }

    // 중복 제거
    return [...new Set(concepts)];
  }

  private static getConceptPrefix(industry: string): string {
    switch (industry) {
      case 'restaurant_cafe': return '';
      case 'accommodation': return 'stay.';
      case 'experience': return 'exp.';
      case 'wellness_kbeauty': return 'well.';
      case 'tourism_activity': return 'tourism.';
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

      // 업종 필터: 어트랙터 ID에 업종 prefix가 있으면 해당 업종만 매칭
      const attrIdLower = (attr.id || '').toLowerCase();
      const industryMismatch =
        (attrIdLower.includes('resto') && !['restaurant_cafe'].includes(data.industry_type)) ||
        (attrIdLower.includes('stay') && !['accommodation'].includes(data.industry_type)) ||
        (attrIdLower.includes('well') && !['wellness_kbeauty'].includes(data.industry_type));

      if (industryMismatch) continue;

      if (fitScore >= 50 || reqConcepts.length === 0) {
        results.push({
          attractor_id: attr.id,
          fit_score: fitScore,
          matched_concepts: matched,
          reason: `"${data.business_name}"의 시설/속성이 어트랙터 [${reqConcepts.join(', ')}] 조건을 ${matched.length}/${reqConcepts.length}개 충족합니다.`,
        });
      }
    }

    return results.sort((a, b) => b.fit_score - a.fit_score);
  }
}
