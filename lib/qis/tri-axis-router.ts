/**
 * QIS 3축 라우터 (tri-axis-router.ts)
 * 
 * Signal의 컨텍스트를 분석하여 적절한 Hub 축(Industry/Place/Vortex)으로 라우팅합니다.
 * [v2.0] 단순 substring 매칭에서 키워드 고속 패스 + 임베딩/LLM 의미론적 의미 라우팅 하이브리드로 업그레이드.
 */

import { getAIProvider } from '../ai/ai-provider';
import type { QisSignalPayload, QisPredictedQuestion } from '../qis-shared-schemas';
import type { QuestionAsset } from '../benchmark/benchmark-asset-extractor';

// ═══════════════════════════════════════════════════════
// 지역 키워드 매핑 (한국어 → slug)
// ═══════════════════════════════════════════════════════
const REGION_KEYWORDS: Record<string, string> = {
  '제주': 'jeju',
  '제주도': 'jeju',
  '서귀포': 'jeju',
  '한라산': 'jeju',
  '애월': 'jeju',
  '함덕': 'jeju',
  '중문': 'jeju',
  '협재': 'jeju',
  '성산': 'jeju',
  '우도': 'jeju',
  '표선': 'jeju',
  '한림': 'jeju',
  '조천': 'jeju',
  '월정리': 'jeju',
  '이호': 'jeju',
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
  '흑돼지': 'k-food',
  '해산물': 'k-food',
  '횟집': 'k-food',
  '감귤': 'jeju-local',
  '한라봉': 'jeju-local',
  '특산물': 'jeju-local',
  '게스트하우스': 'k-stay',
  '스노클링': 'jeju-experience',
  '올레길': 'jeju-experience',
  '서핑': 'jeju-experience',
};

// 축별 추천 콘텐츠 포맷
const AXIS_FORMAT_MAP: Record<string, string[]> = {
  industry: ['expert_column', 'how_to', 'data_brief'],
  place: ['case_study', 'comparison', 'answer'],
  vortex: ['answer', 'expert_column', 'data_brief'],
  cross_axis: ['answer', 'case_study', 'expert_column'],
};

export type AxisClassification = 'industry' | 'place' | 'vortex' | 'cross_axis';

export interface MultiAxisResult {
  primaryAxis: AxisClassification;
  secondaryAxis?: AxisClassification;
  confidence: number;
  placeSlug?: string;
  vortexSlug?: string;
}

/**
 * 텍스트를 다축 분류하고, 각 축별 신뢰도 점수를 반환합니다.
 * Rule-based fast path → LLM semantic classification with confidence fallback.
 * SDD §5.2 multiAxisRoute: 2축 이상 유사도 > 0.60 시 cross_axis 판정.
 */
export async function multiAxisClassify(text: string): Promise<MultiAxisResult> {
  const detectedPlace = detectPlaceFromText(text);
  const detectedVortex = detectVortexFromText(text);

  // Fast path: 양축 모두 감지 → cross_axis 확정
  if (detectedPlace && detectedVortex) {
    return { primaryAxis: 'cross_axis', confidence: 0.95, placeSlug: detectedPlace, vortexSlug: detectedVortex };
  }

  // Fast path: 단일 축 감지
  if (detectedPlace && !detectedVortex) {
    return { primaryAxis: 'place', confidence: 0.85, placeSlug: detectedPlace };
  }
  if (detectedVortex && !detectedPlace) {
    return { primaryAxis: 'vortex', confidence: 0.85, vortexSlug: detectedVortex };
  }

  // Slow path: LLM 의미론적 분류 (축별 신뢰도 포함)
  try {
    const ai = getAIProvider();
    const prompt = `당신은 한국어 텍스트를 4개 축으로 분류하는 의미론적 분석 전문가입니다.

텍스트: "${text}"

각 축에 대한 적합도를 0.0 ~ 1.0 신뢰도로 평가하십시오:
- place: 특정 지리적/오프라인 지역이 핵심인 경우
- vortex: 전문 테마 업종(뷰티, 웨딩 등)이 핵심인 경우
- industry: 일반적 정보/지식성 검색인 경우
- cross_axis: 지리적 요소와 전문 테마가 모두 융합된 경우

규칙:
1. 가장 높은 축을 primaryAxis로 선택
2. 두 번째로 높은 축의 신뢰도가 0.60 이상이면 secondaryAxis로 포함
3. place와 vortex 모두 0.60 이상이면 primaryAxis를 cross_axis로 변경

JSON 스키마를 따르십시오.`;

    const schema = {
      type: "OBJECT",
      properties: {
        primaryAxis: { type: "STRING", enum: ["place", "vortex", "cross_axis", "industry"] },
        secondaryAxis: { type: "STRING", enum: ["place", "vortex", "cross_axis", "industry", "none"] },
        confidence: { type: "NUMBER" },
        placeConfidence: { type: "NUMBER" },
        vortexConfidence: { type: "NUMBER" }
      },
      required: ["primaryAxis", "confidence", "placeConfidence", "vortexConfidence"]
    };

    const res = await ai.generateStructuredOutput<{
      primaryAxis: string;
      secondaryAxis?: string;
      confidence: number;
      placeConfidence: number;
      vortexConfidence: number;
    }>(prompt, schema, { temperature: 0.1 });

    // SDD §5.2: 2축 이상 유사도 > 0.60 시 cross_axis 판정
    let finalPrimary = res.primaryAxis as AxisClassification;
    if (res.placeConfidence >= 0.60 && res.vortexConfidence >= 0.60) {
      finalPrimary = 'cross_axis';
    }

    return {
      primaryAxis: finalPrimary,
      secondaryAxis: res.secondaryAxis && res.secondaryAxis !== 'none' ? res.secondaryAxis as AxisClassification : undefined,
      confidence: res.confidence,
      placeSlug: res.placeConfidence >= 0.60 ? detectPlaceFromText(text) || undefined : undefined,
      vortexSlug: res.vortexConfidence >= 0.60 ? detectVortexFromText(text) || undefined : undefined,
    };
  } catch (err) {
    console.warn('[TriAxisRouter] multiAxisClassify LLM failed:', (err as Error).message);
    return { primaryAxis: 'industry', confidence: 0.5 };
  }
}

// ═══════════════════════════════════════════════════════
// 1. 신호의 축 분류 (하이브리드 엔진)
// ═══════════════════════════════════════════════════════

/**
 * Signal의 컨텍스트를 분석하여 적절한 축으로 분류합니다.
 */
export async function classifySignalAxis(signal: QisSignalPayload): Promise<AxisClassification> {
  // 1. 명시적 지정이 있으면 즉시 반환 (Fast Path)
  if (signal.hub_axis && signal.hub_axis !== 'industry') {
    return signal.hub_axis as AxisClassification;
  }

  const hasPlace = !!signal.place_slug || !!signal.geo_context;
  const hasVortex = !!signal.vortex_slug;

  if (hasPlace && hasVortex) return 'cross_axis';
  if (hasPlace) return 'place';
  if (hasVortex) return 'vortex';

  // 2. 규칙 기반 텍스트 매칭 (Fast Path 2)
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

  // 3. LLM 기반 의미론적 분류 판정 (Slow Path - 모호할 때만 호출)
  try {
    const ai = getAIProvider();
    const prompt = `당신은 검색 신호(Signal)를 3개의 허브 축 중 하나로 분류하는 의미 분석 전문가입니다.
문장: "${text}"

이 문장을 분석하여 다음 4가지 축 중 가장 적합한 라우팅 대상과 사유를 선택하십시오:
- 'place': 특정 지리적/오프라인 지역명이나 장소에 관한 내용이 주를 이룰 때
- 'vortex': 특정 전문 테마 업종(예: 뷰티, 웨딩, 한의원, 시니어케어 등)의 고민이 뚜렷할 때
- 'cross_axis': 지리적 요소와 전문 테마 요소가 모두 융합되어 있을 때 (예: "제주도 웨딩 야외스냅 추천")
- 'industry': 그 외 일반적인 정보/지식성 검색 내용일 때

다음 JSON 스키마를 만족하게 응답하십시오.`;

    const schema = {
      type: "OBJECT",
      properties: {
        axis: { type: "STRING", enum: ["place", "vortex", "cross_axis", "industry"] }
      },
      required: ["axis"]
    };

    const res = await ai.generateStructuredOutput<{ axis: string }>(prompt, schema, { temperature: 0.1 });
    return res.axis as AxisClassification;

  } catch (err) {
    console.warn('[TriAxisRouter] LLM routing failed, falling back to industry:', (err as Error).message);
    return 'industry';
  }
}

// ═══════════════════════════════════════════════════════
// 2. 예측 질문에 축 정보 강화
// ═══════════════════════════════════════════════════════

/**
 * 예측 질문에 3축 타겟 정보를 부여합니다.
 */
export async function enrichPredictionWithAxis(
  prediction: QisPredictedQuestion,
  signal: QisSignalPayload,
): Promise<QisPredictedQuestion> {
  const axis = await classifySignalAxis(signal);
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

/**
 * 4종 질문 자산을 공급 대상(Industry, Place, Vortex, Brand)에 맞게 3축 분류 및 분배합니다.
 */
export function routeAssetsToTargets(assets: QuestionAsset[]): {
  industry: QuestionAsset[];
  place: QuestionAsset[];
  vortex: QuestionAsset[];
  brand: Record<string, QuestionAsset[]>;
} {
  const payload: {
    industry: QuestionAsset[];
    place: QuestionAsset[];
    vortex: QuestionAsset[];
    brand: Record<string, QuestionAsset[]>;
  } = {
    industry: [],
    place: [],
    vortex: [],
    brand: {},
  };

  for (const asset of assets) {
    switch (asset.target_axis) {
      case 'place':
        payload.place.push(asset);
        break;
      case 'vortex':
        payload.vortex.push(asset);
        break;
      default:
        payload.industry.push(asset);
    }

    if (asset.brand_slug) {
      if (!payload.brand[asset.brand_slug]) {
        payload.brand[asset.brand_slug] = [];
      }
      payload.brand[asset.brand_slug].push(asset);
    }
  }

  return payload;
}
