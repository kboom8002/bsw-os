// lib/industry/industry-taxonomy.ts
// BSW-OS × AIHOMPYHUB 통합 업종 분류 체계 V3
// 3계층: BM 매크로(5) → BSW 세부업종(28) → AIHOMPY 변형(48+)

// ═══════════════════════════════════════════════════════════════
// 타입 정의
// ═══════════════════════════════════════════════════════════════

/** Layer 1: 5대 BM 매크로 카테고리 키 */
export type MacroCategoryKey =
  | 'ecommerce_d2c'
  | 'local_services'
  | 'ymyl_professional'
  | 'b2b_tech_saas'
  | 'media_content_hub';

/** Layer 2: 세부 업종 */
export interface SubIndustry {
  key: string;
  displayNameKo: string;
  displayNameEn: string;
  macroKey: MacroCategoryKey;
  /** @deprecated Use macroKey instead. Kept for backward compatibility. */
  parentKey: string;
}

/** Layer 1: 매크로 카테고리 */
export interface MacroCategory {
  key: MacroCategoryKey;
  displayNameKo: string;
  displayNameEn: string;
  icon: string;
  description: string;
  subIndustries: SubIndustry[];
}

/**
 * @deprecated V1 호환용. V3에서는 MacroCategory를 사용하세요.
 */
export interface IndustryCategory {
  key: string;
  displayNameKo: string;
  displayNameEn: string;
  icon: string;
  subIndustries: SubIndustry[];
}

// ═══════════════════════════════════════════════════════════════
// V3 매크로 카테고리 레지스트리 (Layer 1 + Layer 2)
// ═══════════════════════════════════════════════════════════════

export const MACRO_CATEGORIES: MacroCategory[] = [
  {
    key: 'ecommerce_d2c',
    displayNameKo: '이커머스/D2C 제품형',
    displayNameEn: 'E-commerce & D2C Products',
    icon: '🛒',
    description: '온라인 결제, 상품 배송, 리뷰 관리가 핵심인 제품 판매형 비즈니스',
    subIndustries: [
      { key: 'skincare', displayNameKo: '스킨케어/뷰티 제품', displayNameEn: 'Skincare & Beauty Products', macroKey: 'ecommerce_d2c', parentKey: 'ecommerce_d2c' },
      { key: 'fashion', displayNameKo: '패션/의류 D2C', displayNameEn: 'Fashion & Apparel', macroKey: 'ecommerce_d2c', parentKey: 'ecommerce_d2c' },
      { key: 'food_product', displayNameKo: '식품/음료 제조판매', displayNameEn: 'Food & Beverage Products', macroKey: 'ecommerce_d2c', parentKey: 'ecommerce_d2c' },
      { key: 'home_living', displayNameKo: '홈/리빙', displayNameEn: 'Home & Living', macroKey: 'ecommerce_d2c', parentKey: 'ecommerce_d2c' },
    ],
  },
  {
    key: 'local_services',
    displayNameKo: '지역 기반 오프라인 서비스형',
    displayNameEn: 'Local Offline Services',
    icon: '📍',
    description: '지리적 위치, 매장 방문 및 예약, 지역 커뮤니티 평판이 핵심인 비즈니스',
    subIndustries: [
      { key: 'hair_nail', displayNameKo: '헤어/네일 살롱', displayNameEn: 'Hair & Nail Salon', macroKey: 'local_services', parentKey: 'local_services' },
      { key: 'restaurant_cafe', displayNameKo: '레스토랑/카페', displayNameEn: 'Restaurant & Cafe', macroKey: 'local_services', parentKey: 'local_services' },
      { key: 'fitness', displayNameKo: '피트니스/웰니스', displayNameEn: 'Fitness & Wellness', macroKey: 'local_services', parentKey: 'local_services' },
      { key: 'wedding', displayNameKo: '웨딩 서비스', displayNameEn: 'Wedding Services', macroKey: 'local_services', parentKey: 'local_services' },
      { key: 'hotel', displayNameKo: '호텔/호스피탈리티', displayNameEn: 'Hotel & Hospitality', macroKey: 'local_services', parentKey: 'local_services' },
      { key: 'academy', displayNameKo: '학원/교습소', displayNameEn: 'Academy & Tutoring', macroKey: 'local_services', parentKey: 'local_services' },
      { key: 'auto_service', displayNameKo: '자동차 서비스', displayNameEn: 'Automotive Service', macroKey: 'local_services', parentKey: 'local_services' },
      { key: 'pet_care', displayNameKo: '반려동물', displayNameEn: 'Pet Care', macroKey: 'local_services', parentKey: 'local_services' },
    ],
  },
  {
    key: 'ymyl_professional',
    displayNameKo: '고신뢰 전문직 (YMYL)',
    displayNameEn: 'YMYL Professional Services',
    icon: '🛡️',
    description: '자산·건강에 직결되어 극도의 전문성과 신뢰도가 요구되는 도메인',
    subIndustries: [
      { key: 'medical_clinic', displayNameKo: '의원/병원', displayNameEn: 'Medical Clinic', macroKey: 'ymyl_professional', parentKey: 'ymyl_professional' },
      { key: 'hanbang', displayNameKo: '한의원/한방', displayNameEn: 'Korean Traditional Medicine', macroKey: 'ymyl_professional', parentKey: 'ymyl_professional' },
      { key: 'senior_care', displayNameKo: '시니어케어', displayNameEn: 'Senior Care', macroKey: 'ymyl_professional', parentKey: 'ymyl_professional' },
      { key: 'legal', displayNameKo: '법률사무소', displayNameEn: 'Legal Services', macroKey: 'ymyl_professional', parentKey: 'ymyl_professional' },
      { key: 'finance_accounting', displayNameKo: '세무/회계/금융', displayNameEn: 'Finance & Accounting', macroKey: 'ymyl_professional', parentKey: 'ymyl_professional' },
      { key: 'real_estate', displayNameKo: '부동산', displayNameEn: 'Real Estate', macroKey: 'ymyl_professional', parentKey: 'ymyl_professional' },
    ],
  },
  {
    key: 'b2b_tech_saas',
    displayNameKo: 'B2B 테크/SaaS',
    displayNameEn: 'B2B Tech & SaaS',
    icon: '💻',
    description: '기업 대상 소프트웨어 서비스, 기술 문서 및 시맨틱 콘텐츠 중심',
    subIndustries: [
      { key: 'it_saas', displayNameKo: 'IT/SaaS', displayNameEn: 'IT & SaaS', macroKey: 'b2b_tech_saas', parentKey: 'b2b_tech_saas' },
      { key: 'consulting', displayNameKo: '비즈니스 컨설팅', displayNameEn: 'Business Consulting', macroKey: 'b2b_tech_saas', parentKey: 'b2b_tech_saas' },
      { key: 'online_education', displayNameKo: '온라인 교육/EdTech', displayNameEn: 'Online Education', macroKey: 'b2b_tech_saas', parentKey: 'b2b_tech_saas' },
      { key: 'startup', displayNameKo: '스타트업', displayNameEn: 'Startup', macroKey: 'b2b_tech_saas', parentKey: 'b2b_tech_saas' },
    ],
  },
  {
    key: 'media_content_hub',
    displayNameKo: '미디어/콘텐츠 허브',
    displayNameEn: 'Media & Content Hub',
    icon: '🎬',
    description: '지식 콘텐츠, 크리에이터, 미디어, 전문가 AI홈피, 지역 브랜드',
    subIndustries: [
      { key: 'photography', displayNameKo: '사진/스튜디오', displayNameEn: 'Photography Studio', macroKey: 'media_content_hub', parentKey: 'media_content_hub' },
      { key: 'entertainment', displayNameKo: '엔터테인먼트', displayNameEn: 'Entertainment', macroKey: 'media_content_hub', parentKey: 'media_content_hub' },
      { key: 'k_culture_content', displayNameKo: 'K-컬처 콘텐츠', displayNameEn: 'K-Culture Content', macroKey: 'media_content_hub', parentKey: 'media_content_hub' },
      { key: 'expert_professional', displayNameKo: '전문가 AI홈피', displayNameEn: 'Expert AI Homepage', macroKey: 'media_content_hub', parentKey: 'media_content_hub' },
      { key: 'place_brand', displayNameKo: '지역/플레이스', displayNameEn: 'Place Brand', macroKey: 'media_content_hub', parentKey: 'media_content_hub' },
      { key: 'travel_tourism', displayNameKo: '여행/관광', displayNameEn: 'Travel & Tourism', macroKey: 'media_content_hub', parentKey: 'media_content_hub' },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════
// AIHOMPY ↔ BSW 양방향 매핑 (Layer 3)
// ═══════════════════════════════════════════════════════════════

/** AIHOMPY 48+ 세부변형 키 → BSW V3 세부업종 키 (정방향 매핑) */
export const AIHOMPY_TO_BSW: Record<string, string> = {
  // ── 이커머스/D2C ──
  skincare: 'skincare',
  skincare_premium: 'skincare',
  haircare: 'skincare',
  k_style: 'fashion',
  korean_food: 'food_product',

  // ── 로컬 서비스 ──
  // 웨딩 (12종 → 1종)
  wedding_sdm: 'wedding',
  wedding_studio: 'wedding',
  wedding_photo_studio: 'wedding',
  kwedding_inbound: 'wedding',
  wedding_snap: 'wedding',
  wedding_dress: 'wedding',
  wedding_makeup: 'wedding',
  wedding_hall: 'wedding',
  gangnam_wedding_dress: 'wedding',
  gangnam_wedding_makeup: 'wedding',
  gangnam_wedding_sdm: 'wedding',
  wedding_expert: 'wedding',
  // 식음료
  mixture_poi: 'restaurant_cafe',
  // 호텔
  hotel_hospitality: 'hotel',

  // ── YMYL 전문직 ──
  clinic: 'medical_clinic',
  hanbang: 'hanbang',
  senior_care: 'senior_care',
  real_estate: 'real_estate',

  // ── B2B/SaaS ──
  consulting: 'consulting',
  dual_brain_vortex: 'consulting',
  startup: 'startup',
  startup_ir_ready: 'startup',
  startup_product_led: 'startup',
  startup_b2b_saas: 'startup',
  startup_growth_stage: 'startup',
  startup_deeptech: 'startup',

  // ── 미디어/콘텐츠 ──
  photography: 'photography',
  indie_band: 'entertainment',
  k_rock_ballad: 'entertainment',
  k_cosmetics_media: 'k_culture_content',
  book_knowledge: 'k_culture_content',
  accessibility_media: 'k_culture_content',
  k_experience: 'k_culture_content',
  // 전문가
  expert_aihompy: 'expert_professional',
  participant_aihompy: 'expert_professional',
  bfw_expert: 'expert_professional',
  jeju_expert: 'expert_professional',
  jeju_food_expert: 'expert_professional',
  jeju_experience_expert: 'expert_professional',
  jeju_local_expert: 'expert_professional',
  // 지역/플레이스
  place: 'place_brand',
  place_dao: 'place_brand',
  regional: 'place_brand',
  // 여행
  travel: 'travel_tourism',
  // 일반
  general: 'consulting',
};

/** BSW V3 세부업종 → AIHOMPY 기본(default) 키 (역방향: GENESIS 개설 시 사용) */
export const BSW_TO_AIHOMPY_DEFAULT: Record<string, string> = {
  skincare: 'skincare',
  fashion: 'k_style',
  food_product: 'korean_food',
  home_living: 'general',
  hair_nail: 'general',
  restaurant_cafe: 'korean_food',
  fitness: 'general',
  wedding: 'wedding_sdm',
  hotel: 'hotel_hospitality',
  academy: 'general',
  auto_service: 'general',
  pet_care: 'general',
  medical_clinic: 'clinic',
  hanbang: 'hanbang',
  senior_care: 'senior_care',
  legal: 'general',
  finance_accounting: 'general',
  real_estate: 'real_estate',
  it_saas: 'startup',
  consulting: 'consulting',
  online_education: 'general',
  startup: 'startup',
  photography: 'photography',
  entertainment: 'indie_band',
  k_culture_content: 'k_cosmetics_media',
  expert_professional: 'expert_aihompy',
  place_brand: 'place',
  travel_tourism: 'k_experience',
};

// ═══════════════════════════════════════════════════════════════
// V1 → V3 마이그레이션 매핑
// ═══════════════════════════════════════════════════════════════

/** V1 세부업종 키 → V3 세부업종 키 (기존 데이터 호환) */
export const V1_TO_V3_KEY_MAP: Record<string, string> = {
  // 키 동일 (변환 불필요)
  skincare: 'skincare',
  legal: 'legal',
  real_estate: 'real_estate',
  entertainment: 'entertainment',
  // 키 변경
  beauty: 'skincare',
  wedding_studio: 'wedding',
  wedding: 'wedding',
  clinic: 'medical_clinic',
  healthcare: 'medical_clinic',
  restaurant: 'restaurant_cafe',
  food_beverage: 'food_product',
  convenience_retail: 'food_product',
  finance: 'finance_accounting',
  insurance: 'finance_accounting',
  consulting_b2b: 'consulting',
  it_software: 'it_saas',
  travel: 'travel_tourism',
  pet: 'pet_care',
  fashion_ecommerce: 'fashion',
  construction: 'real_estate',
  education: 'academy',
  auto: 'auto_service',
  jeju_attraction_ko: 'travel_tourism',
  jeju_smb: 'restaurant_cafe',
};

// ═══════════════════════════════════════════════════════════════
// 하위 호환용 INDUSTRY_TAXONOMY (V1 형태로 변환)
// ═══════════════════════════════════════════════════════════════

/**
 * V1 호환 INDUSTRY_TAXONOMY
 * 기존 코드가 `INDUSTRY_TAXONOMY.map(cat => ...)` 형태로 사용하므로
 * MacroCategory를 IndustryCategory로 투영합니다.
 */
export const INDUSTRY_TAXONOMY: IndustryCategory[] = MACRO_CATEGORIES.map(mc => ({
  key: mc.key,
  displayNameKo: mc.displayNameKo,
  displayNameEn: mc.displayNameEn,
  icon: mc.icon,
  subIndustries: mc.subIndustries,
}));

// ═══════════════════════════════════════════════════════════════
// 유틸리티 함수
// ═══════════════════════════════════════════════════════════════

/** 세부 업종 키 → MacroCategory 반환 */
export function findMacroCategory(subKey: string): MacroCategory | undefined {
  const resolved = V1_TO_V3_KEY_MAP[subKey] || subKey;
  return MACRO_CATEGORIES.find(mc =>
    mc.subIndustries.some(sub => sub.key === resolved)
  );
}

/** 세부 업종 키 → MacroCategoryKey 반환 */
export function getMacroKey(subKey: string): MacroCategoryKey | undefined {
  return findMacroCategory(subKey)?.key;
}

/**
 * 세부 업종 키로 IndustryCategory를 찾음
 * @deprecated V3에서는 findMacroCategory() 사용 권장
 */
export function findCategoryBySubIndustryKey(subKey: string): IndustryCategory | undefined {
  const resolved = V1_TO_V3_KEY_MAP[subKey] || subKey;
  return INDUSTRY_TAXONOMY.find(cat =>
    cat.subIndustries.some(sub => sub.key === resolved)
  );
}

/**
 * 세부 업종 키로 SubIndustry를 찾음 (V1 키 자동 변환 포함)
 */
export function findSubIndustry(subKey: string): SubIndustry | undefined {
  const resolved = V1_TO_V3_KEY_MAP[subKey] || subKey;
  for (const mc of MACRO_CATEGORIES) {
    const found = mc.subIndustries.find(sub => sub.key === resolved);
    if (found) return found;
  }
  return undefined;
}

/**
 * 전체 세부 업종 목록을 flat하게 반환
 */
export function getAllSubIndustries(): SubIndustry[] {
  return MACRO_CATEGORIES.flatMap(mc => mc.subIndustries);
}

/**
 * AIHOMPY 업종 키를 BSW V3 세부업종 키로 변환
 * @returns BSW V3 키, 매핑 없으면 'consulting' (기본 폴백)
 */
export function resolveAihompyKey(aihompyKey: string): string {
  return AIHOMPY_TO_BSW[aihompyKey] || 'consulting';
}

/**
 * BSW V3 세부업종 키를 AIHOMPY 기본 업종 키로 변환
 * @returns AIHOMPY 키, 매핑 없으면 'general' (기본 폴백)
 */
export function resolveBswKey(bswKey: string): string {
  return BSW_TO_AIHOMPY_DEFAULT[bswKey] || 'general';
}

/**
 * V1 업종 키를 V3 키로 마이그레이션
 * @returns V3 키, 이미 V3 키이거나 매핑 없으면 원본 반환
 */
export function migrateV1Key(v1Key: string): string {
  return V1_TO_V3_KEY_MAP[v1Key] || v1Key;
}
