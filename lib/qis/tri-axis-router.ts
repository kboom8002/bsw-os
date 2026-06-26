/**
 * QIS 3축 라우터 (tri-axis-router.ts)
 * 
 * Signal의 컨텍스트를 분석하여 적절한 Hub 축(Industry/Place/Vortex)으로
 * 라우팅합니다. BSW-OS의 예측 질문을 aihompyhub의 3축 인프라에
 * 정확하게 전달하기 위한 핵심 모듈입니다.
 * 
 * @see issueTriAxisContentMission (aihompyhub)
 * @see autoMatchAxes (aihompyhub)
 */

import type { QisSignalPayload, QisPredictedQuestion, HubAxis } from '../qis-shared-schemas';

// ═══════════════════════════════════════════════════════
// 지역 키워드 매핑 (한국어 → slug)
// ═══════════════════════════════════════════════════════
const REGION_KEYWORDS: Record<string, string> = {
  '제주': 'jeju',
  '제주도': 'jeju',
  '서귀포': 'jeju',
  '한라산': 'jeju',
  '성수': 'seongsu',
  '성수동': 'seongsu',
  '강남': 'gangnam',
  '강남구': 'gangnam',
  '홍대': 'hongdae',
  '홍대입구': 'hongdae',
  '이태원': 'itaewon',
  '해운대': 'haeundae',
  '부산': 'busan',
  '경주': 'gyeongju',
  '전주': 'jeonju',
  '여수': 'yeosu',
  '속초': 'sokcho',
  '강릉': 'gangneung',
  '대구': 'daegu',
  '대전': 'daejeon',
  '인천': 'incheon',
  '광주': 'gwangju',
  '울산': 'ulsan',
  '춘천': 'chuncheon',
  '서울': 'seoul',
};

// 테마 키워드 → Vortex DAO slug 매핑
const THEME_KEYWORDS: Record<string, string> = {
  '웨딩': 'k-wedding',
  '결혼': 'k-wedding',
  '뷰티': 'k-beauty',
  '스킨케어': 'k-beauty',
  '피부관리': 'k-beauty',
  '한방': 'hanbang',
  '한의원': 'hanbang',
  '부동산': 'real-estate',
  '매물': 'real-estate',
  '맛집': 'k-food',
  '음식': 'k-food',
  '카페': 'k-cafe',
  '사진': 'k-photo',
  '촬영': 'k-photo',
  '숙소': 'k-stay',
  '호텔': 'k-hotel',
  '펜션': 'k-stay',
  // V3 추가 업종 키워드
  '시니어': 'senior-care',
  '시니어케어': 'senior-care',
  '네일': 'k-nail',
  '헤어': 'k-hair',
  '미용': 'k-hair',
  '피트니스': 'k-fitness',
  '헬스': 'k-fitness',
  '필라테스': 'k-fitness',
  '요가': 'k-fitness',
  '반려동물': 'k-pet',
  '펫': 'k-pet',
  '인테리어': 'k-home',
  '가구': 'k-home',
};

// 축별 추천 콘텐츠 포맷
const AXIS_FORMAT_MAP: Record<string, string[]> = {
  industry: ['expert_column', 'how_to', 'data_brief'],
  place: ['case_study', 'comparison', 'answer'],
  vortex: ['answer', 'expert_column', 'data_brief'],
  cross_axis: ['answer', 'case_study', 'expert_column'],
};

export type AxisClassification = 'industry' | 'place' | 'vortex' | 'cross_axis';

// ═══════════════════════════════════════════════════════
// 1. 신호의 축 분류
// ═══════════════════════════════════════════════════════

/**
 * Signal의 컨텍스트를 분석하여 적절한 축으로 분류합니다.
 * 
 * 우선순위:
 * 1. 명시적 hub_axis → 그대로 사용
 * 2. place_slug 또는 geo_context 존재 → place
 * 3. vortex_slug 존재 → vortex
 * 4. raw_text에서 지역/테마 키워드 감지
 * 5. place + vortex 동시 해당 → cross_axis
 * 6. 기본 → industry
 */
export function classifySignalAxis(signal: QisSignalPayload): AxisClassification {
  // 명시적 지정이 있으면 그대로
  if (signal.hub_axis && signal.hub_axis !== 'industry') {
    return signal.hub_axis as AxisClassification;
  }

  const hasPlace = !!signal.place_slug || !!signal.geo_context;
  const hasVortex = !!signal.vortex_slug;

  // 명시적 slug가 있는 경우
  if (hasPlace && hasVortex) return 'cross_axis';
  if (hasPlace) return 'place';
  if (hasVortex) return 'vortex';

  // raw_text에서 키워드 감지
  const text = signal.raw_text || '';
  const detectedPlace = detectPlaceFromText(text);
  const detectedVortex = detectVortexFromText(text);

  if (detectedPlace && detectedVortex) return 'cross_axis';
  if (detectedPlace) return 'place';
  if (detectedVortex) return 'vortex';

  // signal_type 기반 분류
  if (['place_review', 'place_inquiry'].includes(signal.signal_type)) return 'place';
  if (['vortex_mission_signal'].includes(signal.signal_type)) return 'vortex';
  if (['cross_axis_trend'].includes(signal.signal_type)) return 'cross_axis';

  return 'industry';
}

// ═══════════════════════════════════════════════════════
// 2. 예측 질문에 축 정보 강화
// ═══════════════════════════════════════════════════════

/**
 * 예측 질문에 3축 타겟 정보를 부여합니다.
 * Signal의 컨텍스트를 기반으로 target_axis, place_slug, vortex_slug,
 * geo_keywords, recommended_formats를 설정합니다.
 */
export function enrichPredictionWithAxis(
  prediction: QisPredictedQuestion,
  signal: QisSignalPayload,
): QisPredictedQuestion {
  const axis = classifySignalAxis(signal);
  const text = signal.raw_text || '';

  // place_slug 결정
  let placeSlug = signal.place_slug || null;
  if (!placeSlug && (axis === 'place' || axis === 'cross_axis')) {
    placeSlug = detectPlaceFromText(text);
  }

  // vortex_slug 결정
  let vortexSlug = signal.vortex_slug || null;
  if (!vortexSlug && (axis === 'vortex' || axis === 'cross_axis')) {
    vortexSlug = detectVortexFromText(text);
  }

  // geo_keywords 추출
  const geoKeywords = extractGeoKeywords(text);
  if (signal.geo_context?.region && !geoKeywords.includes(signal.geo_context.region)) {
    geoKeywords.unshift(signal.geo_context.region);
  }

  // 축별 추천 포맷
  const recommendedFormats = AXIS_FORMAT_MAP[axis] || AXIS_FORMAT_MAP.industry;

  return {
    ...prediction,
    target_axis: axis,
    place_slug: placeSlug || undefined,
    vortex_slug: vortexSlug || undefined,
    geo_keywords: geoKeywords,
    recommended_formats: recommendedFormats,
  };
}

// ═══════════════════════════════════════════════════════
// 3. 예측 배열을 3축 그룹으로 분류
// ═══════════════════════════════════════════════════════

export interface TriAxisPayload {
  industry: QisPredictedQuestion[];
  place: QisPredictedQuestion[];
  vortex: QisPredictedQuestion[];
  crossAxis: QisPredictedQuestion[];
}

/**
 * 예측 배열을 3축 그룹으로 분류합니다.
 * 이미 enrichPredictionWithAxis()로 강화된 예측을 그룹화합니다.
 */
export function buildTriAxisPayload(predictions: QisPredictedQuestion[]): TriAxisPayload {
  const result: TriAxisPayload = {
    industry: [],
    place: [],
    vortex: [],
    crossAxis: [],
  };

  for (const pred of predictions) {
    switch (pred.target_axis) {
      case 'place':
        result.place.push(pred);
        break;
      case 'vortex':
        result.vortex.push(pred);
        break;
      case 'cross_axis':
        result.crossAxis.push(pred);
        break;
      default:
        result.industry.push(pred);
    }
  }

  return result;
}

// ═══════════════════════════════════════════════════════
// 내부 유틸리티
// ═══════════════════════════════════════════════════════

/** raw_text에서 지역 키워드를 감지하여 place slug 반환 */
function detectPlaceFromText(text: string): string | null {
  for (const [keyword, slug] of Object.entries(REGION_KEYWORDS)) {
    if (text.includes(keyword)) {
      return slug;
    }
  }
  return null;
}

/** raw_text에서 테마 키워드를 감지하여 vortex slug 반환 */
function detectVortexFromText(text: string): string | null {
  for (const [keyword, slug] of Object.entries(THEME_KEYWORDS)) {
    if (text.includes(keyword)) {
      return slug;
    }
  }
  return null;
}

/** raw_text에서 모든 지역 키워드를 추출 */
function extractGeoKeywords(text: string): string[] {
  const found: string[] = [];
  const seen = new Set<string>();
  for (const [keyword, slug] of Object.entries(REGION_KEYWORDS)) {
    if (text.includes(keyword) && !seen.has(slug)) {
      found.push(slug);
      seen.add(slug);
    }
  }
  return found;
}
