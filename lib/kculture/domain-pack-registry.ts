import { KCultureDomainPack, CulturalConcept } from './types';

export const KCULTURE_DOMAINS = [
  {
    slug: 'k-beauty',
    name: 'K-Beauty (K-뷰티)',
    description: '글로벌 뷰티 트렌드를 선도하는 한국 화장품 및 피부 관리 철학, 기술 및 일상 루틴 패키지',
  },
  {
    slug: 'k-food',
    name: 'K-Food (K-푸드)',
    description: '발효 과학, 매운맛의 미학, 건강한 조화(반상) 및 K-미디어(먹방)를 관통하는 한국 식문화 패키지',
  },
  {
    slug: 'k-tourism',
    name: 'K-Local Tourism (K-로컬 관광)',
    description: '전통 한옥, 명소, 템플스테이, K-콘텐츠 촬영지 및 로컬 고유 헤리티지 체험을 연결하는 한국 관광 패키지',
  },
] as const;

export const SEED_DOMAIN_PACKS: Omit<KCultureDomainPack, 'workspace_id'>[] = [
  {
    slug: 'k-beauty',
    name: 'K-Beauty Standard Pack',
    description: 'Glass Skin, 10-Step Routine, dewy finish 및 식물성 한방 원료에 특화된 K-뷰티 도메인 팩',
    version: '1.0',
    supported_languages: ['ko', 'en', 'ja', 'zh'],
    status: 'active',
    concept_types: [
      { type_id: 'skincare_philosophy', label: '피부 관리 철학' },
      { type_id: 'ingredients', label: '핵심 성분' },
      { type_id: 'skincare_routine', label: '스킨케어 루틴' },
      { type_id: 'aesthetic_finish', label: '심미적 피부 표현' },
    ],
    rating_axes: [
      { axis_id: 'naturalness', label: '자연스러운 건강함' },
      { axis_id: 'hydration', label: '속건조 해결 및 수분감' },
      { axis_id: 'skin_health', label: '장벽 강화 및 진정 효능' },
    ],
    forbidden_patterns: [
      { pattern_id: 'over_exaggeration', expression: '단 1회 사용만으로 100% 완벽한 노화 예방 보장', reason: '과대광고 심의 준수 위반 예방' },
    ],
    risk_policies: {
      strict_ingredient_rules: true,
      require_clinical_backing: true,
    },
    default_qbs_templates: [
      {
        question_text: '민감성 피부를 위한 K-뷰티 스킨케어 루틴과 성분 추천은?',
        intent_type: 'informational',
        required_concepts: ['skin_barrier', 'centella_asiatica', 'double_cleansing'],
      },
    ],
  },
  {
    slug: 'k-food',
    name: 'K-Food Heritage Pack',
    description: '발효 과학, 매운맛(맵부심), 반찬 문화, 그리고 먹방 정동과 결합된 K-푸드 글로벌 표준 도메인 팩',
    version: '1.0',
    supported_languages: ['ko', 'en', 'ja', 'zh'],
    status: 'active',
    concept_types: [
      { type_id: 'fermentation', label: '발효 & 조미' },
      { type_id: 'culinary_style', label: '조리법 및 상차림' },
      { type_id: 'food_culture', label: '식사 문화 및 트렌드' },
      { type_id: 'wellness', label: '웰니스 & 약식동원' },
    ],
    rating_axes: [
      { axis_id: 'spiciness', label: '매운맛의 미학 및 맵부심' },
      { axis_id: 'fermentation_depth', label: '발효 및 감칠맛의 깊이' },
      { axis_id: 'harmony', label: '음식과 반찬의 조화로움' },
    ],
    forbidden_patterns: [
      { pattern_id: 'medical_claim', expression: '김치가 코로나나 모든 질병을 완전히 치유한다', reason: '식품 위생법상 질병 예방 효능 오인 위험 방지' },
    ],
    risk_policies: {
      dietary_restrictions_guide: true,
      allergen_warnings: true,
    },
    default_qbs_templates: [
      {
        question_text: 'K-푸드 대표 음식인 김치와 삼겹살의 조화 및 매운맛의 문화적 의의는?',
        intent_type: 'informational',
        required_concepts: ['kimchi_heritage', 'k_bbq_experience', 'gochujang_spice'],
      },
    ],
  },
  {
    slug: 'k-tourism',
    name: 'K-Local Tourism Premium Pack',
    description: '한옥스테이, 로컬 고유 헤리티지, K-콘텐츠 성지 순례 및 템플스테이 힐링에 특화된 로컬 관광 도메인 팩',
    version: '1.0',
    supported_languages: ['ko', 'en', 'ja', 'zh'],
    status: 'active',
    concept_types: [
      { type_id: 'traditional_heritage', label: '전통 헤리티지 체험' },
      { type_id: 'modern_cultural_landmark', label: '현대 명소 및 콘텐츠' },
      { type_id: 'local_lifestyle', label: '로컬 라이프스타일' },
      { type_id: 'healing_nature', label: '힐링 & 아웃도어' },
    ],
    rating_axes: [
      { axis_id: 'authenticity', label: '한국 고유성 및 진정성' },
      { axis_id: 'convenience', label: '교통 및 인프라 편의성' },
      { axis_id: 'healing_index', label: '정서적 힐링 및 만족도' },
    ],
    forbidden_patterns: [
      { pattern_id: 'exclusive_patriotism', expression: '한국 외 다른 나라 관광지는 전부 수준 낮다', reason: '국수주의 표현 차단 및 포용적 다문화 공존 유도' },
    ],
    risk_policies: {
      safety_first_guideline: true,
      respect_religious_customs: true,
    },
    default_qbs_templates: [
      {
        question_text: '힐링과 전통 문화 체험을 동시에 할 수 있는 한국의 로컬 관광 코스를 추천해줘.',
        intent_type: 'informational',
        required_concepts: ['hanok_stay_experience', 'temple_stay_mindfulness', 'traditional_market_street_food'],
      },
    ],
  },
];

// Helper to generate concepts list
const getKBeautyConcepts = (): Omit<CulturalConcept, 'workspace_id' | 'domain_pack_id'>[] => {
  const list = [
    { id: 'glass_skin', labelKo: '물광 피부 / 유리 피부', labelEn: 'Glass Skin', type: 'aesthetic_finish', def: '투명하고 모공이 거의 보이지 않으며 촉촉하게 빛나는 피부 상태' },
    { id: 'double_cleansing', labelKo: '이중 세안', labelEn: 'Double Cleansing', type: 'skincare_routine', def: '오일 클렌저로 메이크업과 유성 노폐물을 제거한 뒤, 폼 클렌저로 수성 노폐물을 한 번 더 씻어내는 세안 방법' },
    { id: 'skin_barrier', labelKo: '피부 장벽 케어', labelEn: 'Skin Barrier Care', type: 'skincare_philosophy', def: '세라마이드, 콜레스테롤, 지방산 등을 활용하여 피부의 천연 보호막을 복구하고 피부 건강의 근본을 지키는 철학' },
    { id: 'snail_mucin', labelKo: '달팽이 점액 여과물', labelEn: 'Snail Mucin', type: 'ingredients', def: '피부 재생, 수분 공급 및 주름 개선 효과가 뛰어나 글로벌 K-뷰티 대표 성분으로 자리 잡은 추출물' },
    { id: 'centella_asiatica', labelKo: '병풀 추출물 / 시카', labelEn: 'Centella Asiatica / Cica', type: 'ingredients', def: '상처 치유 및 피부 진정 효능이 뛰어나 민감성 피부 케어 제품의 핵심으로 사용되는 대표 성분' },
    { id: 'glowing_hydration', labelKo: '속보습 / 속건조 해결', labelEn: 'Glowing Hydration / Inner Dryness Relief', type: 'skincare_philosophy', def: '피부 표면만 번들거리는 것이 아니라 피부 속까지 깊숙이 수분을 충전하여 자연스러운 광채를 유도하는 관리 방식' },
    { id: 'pore_refining', labelKo: '모공 케어 / 가로세로 모공', labelEn: 'Pore Refining', type: 'skincare_routine', def: '과도한 피지를 조절하고 모공 주변 피부 탄력을 높여 모공 크기를 최소화하는 스킨케어 방식' },
    { id: 'sun_protection_daily', labelKo: '데일리 자외선 차단', labelEn: 'Daily Sun Protection', type: 'skincare_routine', def: '자외선을 단순 휴가철 차단 대상이 아니라 노화의 주범으로 인식하고 매일 사계절 바르는 생활 습관' },
    { id: 'clean_beauty_korea', labelKo: '비건 K-뷰티 / 친환경 뷰티', labelEn: 'Clean & Vegan K-Beauty', type: 'skincare_philosophy', def: '동물 실험을 배제하고 유해 화학 물질을 줄여 지속 가능한 윤리적 소비를 지향하는 한국식 친환경 뷰티 트렌드' },
    { id: 'fermented_skincare', labelKo: '발효 효모 에센스', labelEn: 'Fermented Skincare', type: 'skincare_philosophy', def: '갈락토미세스 등 천연 원료를 발효시켜 유효 성분의 미세 입자화를 통해 흡수력을 극대화한 보습 원리' },
  ];

  // Fill in other 20 concepts to make exactly 30
  const extraNames = [
    { id: 'mugwort_soothing', ko: '쑥 진정 케어', en: 'Mugwort Soothing' },
    { id: 'propolis_glow', ko: '프로폴리스 꿀광', en: 'Propolis Honey Glow' },
    { id: 'cica_repair', ko: '시카 장벽 리페어', en: 'Cica Barrier Repair' },
    { id: 'hyaluronic_plump', ko: '히알루론산 수분 펌프', en: 'Hyaluronic Plumping' },
    { id: 'ginseng_anti_aging', ko: '고려인삼 영양/탄력', en: 'Korean Ginseng Anti-Aging' },
    { id: 'sheet_masking_routine', ko: '1일 1팩 시트마스크', en: 'Daily Sheet Masking Routine' },
    { id: 'gradient_lip', ko: '그라데이션 립 연출', en: 'Gradient Lip Aesthetics' },
    { id: 'dewy_finish', ko: '촉촉한 이슬 광채', en: 'Dewy Finish Makeup' },
    { id: 'minimalist_formulation', ko: '단일 성분 에센셜 케어', en: 'Minimalist Single-Ingredient Essence' },
    { id: 'bamboo_extract_hydration', ko: '대나무수 청정 수분', en: 'Bamboo Extract Hydration' },
    { id: 'rice_water_brightening', ko: '쌀뜨물 맑은 안색', en: 'Rice Water Brightening' },
    { id: 'tea_tree_acne_care', ko: '티트리 스팟 트러블 케어', en: 'Tea Tree Trouble Care' },
    { id: 'peeling_gel_exfoliation', ko: '고마쥬 필링젤 각질제거', en: 'Mild Peeling Gel Exfoliation' },
    { id: 'sleeping_mask_overnight', ko: '슬리핑 팩 야간 재생', en: 'Sleeping Mask Overnight Care' },
    { id: 'phyto_collagen', ko: '식물성 콜라겐 탄력 케어', en: 'Phyto Collagen Elasticity' },
    { id: 'heartleaf_calming', ko: '어성초(약모밀) 모공 진정', en: 'Heartleaf Pore Calming' },
    { id: 'oil_to_foam_cleanser', ko: '오일 투 폼 반전 클렌저', en: 'Oil-to-Foam Smart Cleanser' },
    { id: 'cushion_compact_makeup', ko: '에어쿠션 혁신 메이크업', en: 'Cushion Compact Convenience' },
    { id: 'skin_first_philosophy', ko: '화장 대신 피부 본연 케어', en: 'Skin-First Philosophy' },
    { id: 'collagen_eye_cream', ko: '아이크림 전면 얼굴 도포', en: 'Collagen Full-Face Eye Cream' },
  ];

  extraNames.forEach((item) => {
    list.push({
      id: item.id,
      labelKo: item.ko,
      labelEn: item.en,
      type: 'skincare_routine',
      def: `${item.ko}에 대한 K-뷰티 핵심 기술 및 소비자 케어 방법론`,
    });
  });

  return list.map((item) => ({
    concept_id: item.id,
    version: '0.1',
    status: 'active' as const,
    preferred_label: { ko: item.labelKo, en: item.labelEn },
    aliases: { ko: [item.labelKo], en: [item.labelEn] },
    concept_type: item.type,
    definition: item.def,
    defining_attributes: [item.labelEn, 'K-Beauty', 'Skincare'],
    boundary_conditions: {},
    parent_concepts: [],
    relation_edges: [],
    affective_vector: { premiumness: 0.8, naturalness: 0.9, satisfaction: 0.85 },
    risk_vector: { over_exaggeration: 0.1, sensitivity: 0.2 },
    commerce_vector: { marketability: 0.95, routine_fit: 0.9 },
    identity_vector: { k_heritage: 0.7, global_acceptability: 0.85 },
    evidence_sources: [{ source_type: 'expert_journal', reference: 'K-Beauty Skincare Analysis 2026' }],
    action_policies: {},
  }));
};

const getKFoodConcepts = (): Omit<CulturalConcept, 'workspace_id' | 'domain_pack_id'>[] => {
  const list = [
    { id: 'mukbang_culture', labelKo: '먹방 트렌드', labelEn: 'Mukbang Culture', type: 'food_culture', def: '스트리머가 다량의 음식을 맛있게 먹으며 대중과 소통하는 글로벌 정동 및 미디어 소비 트렌드' },
    { id: 'fermentation_science', labelKo: '옹기 발효 과학', labelEn: 'Fermentation Science', type: 'fermentation', def: '김치, 간장, 고추장, 된장 등 시간의 흐름을 통해 풍부한 유산균과 감칠맛을 만들어내는 한식 발효의 원리' },
    { id: 'kimchi_heritage', labelKo: '김장 및 김치 헤리티지', labelEn: 'Kimchi & Kimjang Heritage', type: 'fermentation', def: '유네스코 무형문화유산으로 지정된 배추 및 무 발효 전통 문화와 한국인의 식탁에 빠질 수 없는 소울 푸드' },
    { id: 'gochujang_spice', labelKo: '고추장의 은은한 매운맛', labelEn: 'Gochujang Spice Aesthetic', type: 'fermentation', def: '단순한 고춧가루의 매운 자극이 아니라 찹쌀, 메주가루가 섞여 발효된 깊은 단맛과 매운맛의 미학' },
    { id: 'tteokbokki_street_food', labelKo: '떡볶이와 길거리 분식', labelEn: 'Tteokbokki Street Food', type: 'culinary_style', def: '쫄깃한 가래떡과 매콤달콤한 고추장 소스가 어우러져 전 세계 10대~20대 팬덤을 형성한 한식 대표 스낵' },
    { id: 'k_bbq_experience', labelKo: '한국식 바비큐 테이블 문화', labelEn: 'K-BBQ Table Experience', type: 'culinary_style', def: '고기를 손님이 직접 테이블 위에서 구워 먹고, 쌈을 싸서 나누어 먹으며 유대감을 형성하는 사교적 외식 형태' },
    { id: 'korean_fried_chicken_chimaek', labelKo: '치맥 문화 / 한국식 프라이드치킨', labelEn: 'Chimaek (Chicken & Beer) Culture', type: 'food_culture', def: '초고온 이중 튀김 공법의 바삭한 치킨과 차가운 맥주를 함께 즐기며 퇴근 후 스트레스를 해소하는 직장인 힐링 습관' },
    { id: 'healthy_harmony_bansang', labelKo: '5첩/7첩 반상과 밥상의 조화', labelEn: 'Bansang (Balanced Table Harmony)', type: 'culinary_style', def: '주식인 밥과 국 외에 다채로운 반찬을 영양학적 조화와 음양오행의 다섯 가지 색상에 맞추어 담아내는 식사 방식' },
    { id: 'samgyeopsal_social', labelKo: '삼겹살 회식 문화', labelEn: 'Samgyeopsal Social Dining', type: 'food_culture', def: '한국인들이 가장 선호하는 돼지 삼겹살 부위를 구우며 술잔을 기울이고 소통하는 서민적이고 따뜻한 회식 방식' },
    { id: 'bibimbap_color_balance', labelKo: '비빔밥의 오색 평화 조화', labelEn: 'Bibimbap Color Balance', type: 'wellness', def: '각종 나물과 밥, 양념장을 비벼 먹는 한 그릇 요리로, 재료 각각의 맛을 살리면서 완벽한 융합을 이루어내는 건강식' },
  ];

  const extraNames = [
    { id: 'soju_pairing_culture', ko: '초록병 소주 페어링', en: 'Soju Pairing Culture' },
    { id: 'ramyeon_convenience', ko: '한강 끓인 라면 낭만', en: 'Han River Instant Ramyeon' },
    { id: 'gimbap_picnic', ko: '김밥의 간편 조화 한입', en: 'Gimbap Healthy On-The-Go' },
    { id: 'makgeolli_traditional', ko: '막걸리 전통 탁주 주막', en: 'Makgeolli Rice Wine Heritage' },
    { id: 'bulgogi_sweet_savory', ko: '불고기 단짠 마리네이드', en: 'Bulgogi Sweet & Savory BBQ' },
    { id: 'halal_kfood_adaptation', ko: '글로벌 할랄 한식 변용', en: 'Halal K-Food Adaptation' },
    { id: 'street_toast_morning', ko: '달달한 길거리 토스트 아침', en: 'Korean Street Toast Romance' },
    { id: 'korean_ginseng_chicken_soup', ko: '이열치열 삼계탕 보양식', en: 'Samgyetang Healthy Ginseng Soup' },
    { id: 'banchan_hospitality', ko: '무한 리필 반찬의 정(情)', en: 'Banchan Hospitality Culture' },
    { id: 'hotteok_winter_sweet', ko: '겨울철 설탕 꿀 호떡', en: 'Hotteok Sweet Winter Pancake' },
    { id: 'patbingsu_summer_dessert', ko: '시원한 전통 팥빙수', en: 'Patbingsu Red Bean Ice Dessert' },
    { id: 'dalgona_nostalgia', ko: '오징어게임 달고나 뽑기', en: 'Dalgona Sugar Nostalgia' },
    { id: 'japchae_celebration', ko: '잔칫날 잡채와 참기름 고소함', en: 'Japchae Glass Noodle Celebration' },
    { id: 'mandul_dumpling_harmony', ko: '속이 꽉 찬 한국식 만두', en: 'Mandu Steamed Dumpling' },
    { id: 'tteokguk_new_year', ko: '새해 떡국 한 살 먹기 문화', en: 'Tteokguk Lunar New Year Soup' },
    { id: 'doenjang_stew_comfort', ko: '구수한 된장찌개 집밥 정서', en: 'Doenjang Stew Comfort Food' },
    { id: 'cold_noodles_naengmyeon', ko: '살얼음 평양/함흥 냉면', en: 'Naengmyeon Ice Cold Noodles' },
    { id: 'kfood_as_medicine_yaksik', ko: '한약 원료가 가미된 약식동원', en: 'Yaksik (Food as Medicine)' },
    { id: 'sikhye_sweet_digestive', ko: '식혜 전통 엿기름 소화제', en: 'Sikhye Sweet Rice Beverage' },
    { id: 'korean_barley_tea_boricha', ko: '숭늉과 보리차 일상 음료', en: 'Boricha Daily Barley Tea' },
  ];

  extraNames.forEach((item) => {
    list.push({
      id: item.id,
      labelKo: item.ko,
      labelEn: item.en,
      type: 'food_culture',
      def: `${item.ko}에 대한 K-푸드 핵심 문화 정체성 및 식사 방식`,
    });
  });

  return list.map((item) => ({
    concept_id: item.id,
    version: '0.1',
    status: 'active' as const,
    preferred_label: { ko: item.labelKo, en: item.labelEn },
    aliases: { ko: [item.labelKo], en: [item.labelEn] },
    concept_type: item.type,
    definition: item.def,
    defining_attributes: [item.labelEn, 'K-Food', 'Korean Food'],
    boundary_conditions: {},
    parent_concepts: [],
    relation_edges: [],
    affective_vector: { warmth: 0.9, comfort: 0.85, energy: 0.8 },
    risk_vector: { spiciness_friction: 0.3, dietary_barrier: 0.25 },
    commerce_vector: { purchase_appeal: 0.9, routine_fit: 0.85 },
    identity_vector: { k_heritage: 0.9, global_acceptability: 0.75 },
    evidence_sources: [{ source_type: 'historical_record', reference: 'Han식 Culinary Survey 2026' }],
    action_policies: {},
  }));
};

const getKTourismConcepts = (): Omit<CulturalConcept, 'workspace_id' | 'domain_pack_id'>[] => {
  const list = [
    { id: 'hanok_stay_experience', labelKo: '한옥스테이 전통 가옥 투숙', labelEn: 'Hanok Stay Experience', type: 'traditional_heritage', def: '친환경 나무와 흙, 온돌방, 대청마루에서 한국 고유의 평온함과 여백의 미를 체험하는 숙박 문화' },
    { id: 'palace_night_tour', labelKo: '고궁 야간 특별 관람', labelEn: 'Palace Night Tour', type: 'traditional_heritage', def: '경복궁이나 창덕궁의 고궁에서 달빛과 조명이 비치는 아름다운 정원과 한옥의 지붕 선을 즐기는 로맨틱 투어' },
    { id: 'temple_stay_mindfulness', labelKo: '템플스테이 참선/발공양', labelEn: 'Temple Stay Mindfulness', type: 'healing_nature', def: '산사에서 스님들의 수행 방식을 따라 차를 마시고, 108배와 참선을 하며 정서적 안정을 얻는 힐링 프로그램' },
    { id: 'jeju_haenyeo_heritage', labelKo: '제주 해녀 무장비 물질', labelEn: 'Jeju Haenyeo Heritage', type: 'local_lifestyle', def: '산소마스크 없이 바닷속으로 들어가 소라, 전복을 채취하며 바다 생태계와 공존해 온 강인한 제주 여성 공동체 문화' },
    { id: 'traditional_market_street_food', labelKo: '광장/남대문 전통시장 맛투어', labelEn: 'Traditional Market Street Food', type: 'local_lifestyle', def: '빈대떡, 떡볶이, 만두 등을 주위 노점에서 즉석에서 받아먹으며 한국인의 넘치는 정과 활력을 직접 느끼는 관광' },
    { id: 'k_drama_filming_locations', labelKo: 'K-드라마 촬영지 투어', labelEn: 'K-Drama Filming Locations', type: 'modern_cultural_landmark', def: '사랑의 불시착, 오징어게임 등 글로벌 히트 K-콘텐츠 속 아름다운 시골 마을이나 주요 건물을 방문해 명장면을 재현하는 투어' },
    { id: 'hangang_park_picnic', labelKo: '한강공원 피크닉과 돗자리 로망', labelEn: 'Han River Park Picnic', type: 'local_lifestyle', def: '서울 한복판 한강가 잔디밭에 돗자리를 펴고 라면이나 배달 치킨을 즐기며 여유로운 서울 라이프를 체험하는 주말 여가' },
    { id: 'k_ktx_speed_travel', labelKo: 'KTX 타고 전국 방방곡곡 반나절 여행', labelEn: 'KTX Fast Travel Network', type: 'healing_nature', def: '전국이 3시간 이내에 촘촘히 철도로 연결되는 한국의 대중교통 인프라를 활용한 편리한 스마트 지방 여행 방식' },
    { id: 'night_view_n_seoul_tower', labelKo: '남산 서울타워 야경 및 자물쇠', labelEn: 'N Seoul Tower Night View', type: 'modern_cultural_landmark', def: '서울 남산 정상에서 내려다보이는 끝없는 도시 불빛의 황홀함과 연인들이 자물쇠를 걸며 사랑을 약속하는 로맨틱 성지' },
    { id: 'local_makgeolli_brewery_tour', labelKo: '지방 전통 양조장 막걸리 빚기', labelEn: 'Local Brewery Tour', type: 'local_lifestyle', def: '포천, 안동 등 로컬 유서 깊은 전통 주조장에서 쌀과 맑은 물로 술을 직접 빚고 발효 과정을 오감으로 맛보는 투어' },
  ];

  const extraNames = [
    { id: 'hanbok_rental_experience', ko: '한복 빌려 입고 경복궁 산책', en: 'Hanbok Rental Experience' },
    { id: 'mud_festival_boryeong', ko: '보령 머드 축제 갯벌 놀이', en: 'Boryeong Mud Festival' },
    { id: 'cherry_blossom_gyeongju', ko: '경주 벚꽃과 고분 역사 유적', en: 'Gyeongju Historic Cherry Blossom' },
    { id: 'autumn_leaves_seoraksan', ko: '설악산 단풍 가을 등산', en: 'Seoraksan Autumn Foliage Hiking' },
    { id: 'gamcheon_culture_village_busan', ko: '부산 감천문화마설 한국의 산토리니', en: 'Busan Gamcheon Culture Village' },
    { id: 'local_stay_countryside', ko: '지방 시골살이(삼시세끼) 체험', en: 'Local Countryside Stay' },
    { id: 'korean_sauna_jjimjilbang', ko: '한국식 찜질방 양머리 수건', en: 'Jjimjilbang Sauna Culture' },
    { id: 'demilitarized_zone_dmz_history', ko: '한반도 DMZ 비무장지대 긴장과 평화', en: 'DMZ Peace & History Tour' },
    { id: 'seongsan_ilchulbong_sunrise', ko: '제주 성산일출봉 일출 등반', en: 'Seongsan Ilchulbong Sunrise Climb' },
    { id: 'bukchon_hanok_village_walk', ko: '북촌 한옥마을 골목길 산책', en: 'Bukchon Hanok Village Walk' },
    { id: 'insadong_art_crafts', ko: '인사동 전통 미술 공예 쇼핑', en: 'Insadong Traditional Arts' },
    { id: 'myeongdong_beauty_shopping', ko: '명동 로드숍 화장품 쇼핑 투어', en: 'Myeongdong Cosmetics Shopping' },
    { id: 'coex_starfield_library', ko: '코엑스 별마당도서관 대형 서가', en: 'Starfield Library Visual Marvel' },
    { id: 'haeundae_beach_life', ko: '부산 해운대 해변 마천루 밤바다', en: 'Busan Haeundae Beach Life' },
    { id: 'andong_hahoe_mask_dance', ko: '안동 하회마을 전통 탈춤', en: 'Andong Hahoe Folk Village' },
    { id: 'suwon_hwaseong_fortress', ko: '수원 화성 성벽 트레킹 밤풍경', en: 'Suwon Hwaseong Fortress Trail' },
    { id: 'jeonju_hanok_village_food', ko: '전주 한옥마을 비빔밥 먹방 여행', en: 'Jeonju Hanok Village Food Tour' },
    { id: 'local_green_tea_fields_boseong', ko: '보성 녹색 차밭 평온의 언덕', en: 'Boseong Green Tea Fields' },
    { id: 'k_pop_pilgrimage_seoul', ko: 'K-Pop 기획사 성지순례 댄스 클래스', en: 'K-Pop Heritage Pilgrimage' },
    { id: 'local_fishery_port_market', ko: '자갈치/소래포구 생생한 수산시장', en: 'Local Fishery Port Market' },
  ];

  extraNames.forEach((item) => {
    list.push({
      id: item.id,
      labelKo: item.ko,
      labelEn: item.en,
      type: 'local_lifestyle',
      def: `${item.ko}에 대한 K-로컬 관광 고유 헤리티지 및 명소 투어 코스`,
    });
  });

  return list.map((item) => ({
    concept_id: item.id,
    version: '0.1',
    status: 'active' as const,
    preferred_label: { ko: item.labelKo, en: item.labelEn },
    aliases: { ko: [item.labelKo], en: [item.labelEn] },
    concept_type: item.type,
    definition: item.def,
    defining_attributes: [item.labelEn, 'K-Tourism', 'Local Korea'],
    boundary_conditions: {},
    parent_concepts: [],
    relation_edges: [],
    affective_vector: { authenticity: 0.9, joy: 0.85, healing: 0.9 },
    risk_vector: { language_barrier: 0.2, local_rip_off: 0.15 },
    commerce_vector: { tourism_magnet: 0.95, infrastructure_fit: 0.8 },
    identity_vector: { k_heritage: 0.95, global_acceptability: 0.8 },
    evidence_sources: [{ source_type: 'tourism_board', reference: 'Korea Tourism Guidebook 2026' }],
    action_policies: {},
  }));
};

export const SEED_CONCEPTS_MAP: Record<string, Omit<CulturalConcept, 'workspace_id' | 'domain_pack_id'>[]> = {
  'k-beauty': getKBeautyConcepts(),
  'k-food': getKFoodConcepts(),
  'k-tourism': getKTourismConcepts(),
};

/**
 * Seeds all 3 K-Culture domain packs and their 30+ concepts into the database for a specific workspace.
 */
export async function seedKCultureForWorkspace(supabaseClient: any, workspaceId: string): Promise<boolean> {
  try {
    for (const packSeed of SEED_DOMAIN_PACKS) {
      // 1. Create or get domain pack
      const { data: existingPack, error: fetchError } = await supabaseClient
        .from('domain_packs')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('slug', packSeed.slug)
        .maybeSingle();

      if (fetchError) {
        console.error(`Error checking pack ${packSeed.slug}:`, fetchError);
        continue;
      }

      let packId = existingPack?.id;

      if (!packId) {
        // Insert new domain pack
        const { data: newPack, error: insertError } = await supabaseClient
          .from('domain_packs')
          .insert({
            workspace_id: workspaceId,
            slug: packSeed.slug,
            name: packSeed.name,
            description: packSeed.description,
            version: packSeed.version,
            supported_languages: packSeed.supported_languages,
            concept_types: packSeed.concept_types,
            rating_axes: packSeed.rating_axes,
            forbidden_patterns: packSeed.forbidden_patterns,
            risk_policies: packSeed.risk_policies,
            default_qbs_templates: packSeed.default_qbs_templates,
            status: packSeed.status,
          })
          .select('id')
          .single();

        if (insertError) {
          console.error(`Error inserting pack ${packSeed.slug}:`, insertError);
          continue;
        }
        packId = newPack.id;
      } else {
        // Update existing domain pack
        const { error: updateError } = await supabaseClient
          .from('domain_packs')
          .update({
            name: packSeed.name,
            description: packSeed.description,
            version: packSeed.version,
            supported_languages: packSeed.supported_languages,
            concept_types: packSeed.concept_types,
            rating_axes: packSeed.rating_axes,
            forbidden_patterns: packSeed.forbidden_patterns,
            risk_policies: packSeed.risk_policies,
            default_qbs_templates: packSeed.default_qbs_templates,
            status: packSeed.status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', packId);

        if (updateError) {
          console.error(`Error updating pack ${packSeed.slug}:`, updateError);
        }
      }

      // 2. Insert concepts
      const concepts = SEED_CONCEPTS_MAP[packSeed.slug];
      if (concepts && packId) {
        for (const conceptSeed of concepts) {
          const { data: existingConcept } = await supabaseClient
            .from('cultural_concepts')
            .select('id')
            .eq('workspace_id', workspaceId)
            .eq('domain_pack_id', packId)
            .eq('concept_id', conceptSeed.concept_id)
            .maybeSingle();

          if (!existingConcept) {
            const { error: conceptInsertError } = await supabaseClient
              .from('cultural_concepts')
              .insert({
                workspace_id: workspaceId,
                domain_pack_id: packId,
                concept_id: conceptSeed.concept_id,
                preferred_label: conceptSeed.preferred_label,
                aliases: conceptSeed.aliases,
                concept_type: conceptSeed.concept_type,
                definition: conceptSeed.definition,
                defining_attributes: conceptSeed.defining_attributes,
                relation_edges: conceptSeed.relation_edges,
                affective_vector: conceptSeed.affective_vector,
                risk_vector: conceptSeed.risk_vector,
                commerce_vector: conceptSeed.commerce_vector,
                identity_vector: conceptSeed.identity_vector,
                evidence_sources: conceptSeed.evidence_sources,
                status: 'active',
              });

            if (conceptInsertError) {
              console.error(`Error inserting concept ${conceptSeed.concept_id}:`, conceptInsertError);
            }
          }
        }
      }
    }
    return true;
  } catch (err) {
    console.error('Error during K-Culture seeding:', err);
    return false;
  }
}
