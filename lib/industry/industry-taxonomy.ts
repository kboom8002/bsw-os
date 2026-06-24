// lib/industry/industry-taxonomy.ts
// 업종 분류 체계 - 상위 카테고리 + 세부 업종 2단계

export interface SubIndustry {
  key: string;
  displayNameKo: string;
  displayNameEn: string;
  parentKey: string;
}

export interface IndustryCategory {
  key: string;
  displayNameKo: string;
  displayNameEn: string;
  icon: string;
  subIndustries: SubIndustry[];
}

export const INDUSTRY_TAXONOMY: IndustryCategory[] = [
  {
    key: 'beauty',
    displayNameKo: '뷰티/화장품',
    displayNameEn: 'Beauty & Cosmetics',
    icon: '✨',
    subIndustries: [
      { key: 'skincare', displayNameKo: '스킨케어', displayNameEn: 'Skincare', parentKey: 'beauty' },
      { key: 'beauty', displayNameKo: '색조/메이크업', displayNameEn: 'Color Cosmetics', parentKey: 'beauty' },
    ],
  },
  {
    key: 'wedding_services',
    displayNameKo: '웨딩 서비스',
    displayNameEn: 'Wedding Services',
    icon: '💍',
    subIndustries: [
      { key: 'wedding_studio', displayNameKo: '웨딩스튜디오', displayNameEn: 'Wedding Studio', parentKey: 'wedding_services' },
      { key: 'wedding', displayNameKo: '웨딩플래닝', displayNameEn: 'Wedding Planning', parentKey: 'wedding_services' },
    ],
  },
  {
    key: 'medical',
    displayNameKo: '의료/건강',
    displayNameEn: 'Medical & Healthcare',
    icon: '🏥',
    subIndustries: [
      { key: 'clinic', displayNameKo: '병원/클리닉', displayNameEn: 'Clinic', parentKey: 'medical' },
      { key: 'healthcare', displayNameKo: '헬스케어', displayNameEn: 'Healthcare', parentKey: 'medical' },
    ],
  },
  {
    key: 'food',
    displayNameKo: '식음료/외식',
    displayNameEn: 'Food & Beverage',
    icon: '🍽️',
    subIndustries: [
      { key: 'restaurant', displayNameKo: '레스토랑/외식', displayNameEn: 'Restaurant', parentKey: 'food' },
      { key: 'food_beverage', displayNameKo: '식품/음료', displayNameEn: 'Food & Beverage', parentKey: 'food' },
      { key: 'convenience_retail', displayNameKo: '편의점/유통', displayNameEn: 'Convenience Retail', parentKey: 'food' },
    ],
  },
  {
    key: 'professional',
    displayNameKo: '전문 서비스',
    displayNameEn: 'Professional Services',
    icon: '⚖️',
    subIndustries: [
      { key: 'legal', displayNameKo: '법률', displayNameEn: 'Legal', parentKey: 'professional' },
      { key: 'finance', displayNameKo: '금융', displayNameEn: 'Finance', parentKey: 'professional' },
      { key: 'insurance', displayNameKo: '보험', displayNameEn: 'Insurance', parentKey: 'professional' },
      { key: 'consulting_b2b', displayNameKo: '컨설팅/B2B', displayNameEn: 'Consulting B2B', parentKey: 'professional' },
    ],
  },
  {
    key: 'tech',
    displayNameKo: 'IT/소프트웨어',
    displayNameEn: 'IT & Software',
    icon: '💻',
    subIndustries: [
      { key: 'it_software', displayNameKo: 'IT/SaaS', displayNameEn: 'IT/SaaS', parentKey: 'tech' },
    ],
  },
  {
    key: 'lifestyle',
    displayNameKo: '라이프스타일',
    displayNameEn: 'Lifestyle',
    icon: '🌿',
    subIndustries: [
      { key: 'travel', displayNameKo: '여행/관광', displayNameEn: 'Travel', parentKey: 'lifestyle' },
      { key: 'pet', displayNameKo: '반려동물', displayNameEn: 'Pet', parentKey: 'lifestyle' },
      { key: 'fashion_ecommerce', displayNameKo: '패션/이커머스', displayNameEn: 'Fashion E-commerce', parentKey: 'lifestyle' },
    ],
  },
  {
    key: 'real_estate',
    displayNameKo: '부동산/건설',
    displayNameEn: 'Real Estate & Construction',
    icon: '🏗️',
    subIndustries: [
      { key: 'real_estate', displayNameKo: '부동산', displayNameEn: 'Real Estate', parentKey: 'real_estate' },
      { key: 'construction', displayNameKo: '건설', displayNameEn: 'Construction', parentKey: 'real_estate' },
    ],
  },
  {
    key: 'education',
    displayNameKo: '교육',
    displayNameEn: 'Education',
    icon: '📚',
    subIndustries: [
      { key: 'education', displayNameKo: '교육/학원', displayNameEn: 'Education', parentKey: 'education' },
    ],
  },
  {
    key: 'auto',
    displayNameKo: '자동차',
    displayNameEn: 'Automotive',
    icon: '🚗',
    subIndustries: [
      { key: 'auto', displayNameKo: '자동차', displayNameEn: 'Automotive', parentKey: 'auto' },
    ],
  },
  {
    key: 'entertainment',
    displayNameKo: '엔터테인먼트',
    displayNameEn: 'Entertainment',
    icon: '🎭',
    subIndustries: [
      { key: 'entertainment', displayNameKo: '엔터테인먼트', displayNameEn: 'Entertainment', parentKey: 'entertainment' },
    ],
  },
];

/**
 * 세부 업종 키로 IndustryCategory를 찾음
 */
export function findCategoryBySubIndustryKey(subKey: string): IndustryCategory | undefined {
  return INDUSTRY_TAXONOMY.find(cat =>
    cat.subIndustries.some(sub => sub.key === subKey)
  );
}

/**
 * 세부 업종 키로 SubIndustry를 찾음
 */
export function findSubIndustry(subKey: string): SubIndustry | undefined {
  for (const cat of INDUSTRY_TAXONOMY) {
    const found = cat.subIndustries.find(sub => sub.key === subKey);
    if (found) return found;
  }
  return undefined;
}

/**
 * 전체 세부 업종 목록을 flat하게 반환
 */
export function getAllSubIndustries(): SubIndustry[] {
  return INDUSTRY_TAXONOMY.flatMap(cat => cat.subIndustries);
}
