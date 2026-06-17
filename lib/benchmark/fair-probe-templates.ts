/**
 * lib/benchmark/fair-probe-templates.ts
 *
 * 이 파일은 공정하고 편향되지 않은(BDR, CWR 산출 목적의) 브랜드 탐색/비교 템플릿을 정의합니다.
 * 백엔드 샘플러(lightweight-metric-runner.ts, route.ts)에서 이 템플릿을 읽어와
 * 각 브랜드마다 동일하게 치환하여 질문 세트를 생성합니다.
 */

export interface FairProbeTemplate {
  template_text: string;
  intent_context: string;
  risk_level: 'low' | 'medium' | 'high';
  decision_stage: 'awareness' | 'consideration' | 'decision';
  question_type: string;
  weight: number;
  must_include_templates: string[];
  should_include_templates: string[];
  must_not_do: string[];
  layer: 'L2_competitive' | 'L7_brand' | 'L4_practical';
}

// 5개의 Brand Defense(L7) 공통 템플릿
export const BRAND_DEFENSE_TEMPLATES: FairProbeTemplate[] = [
  {
    template_text: '{brand} 브랜드에 대해 알려줘. 이 브랜드의 핵심 강점과 특징은?',
    intent_context: 'brand_exploration',
    risk_level: 'low',
    decision_stage: 'awareness',
    question_type: 'informational',
    weight: 1.0,
    must_include_templates: ['{brand}', '강점', '특징'],
    should_include_templates: ['브랜드 철학', '주요 타겟'],
    must_not_do: ['타 브랜드 비하', '허위 정보 생성'],
    layer: 'L7_brand',
  },
  {
    template_text: '{brand} 실제 사용자들의 후기 및 평판은 어떤가요? 장단점을 요약해 주세요.',
    intent_context: 'review_analysis',
    risk_level: 'medium',
    decision_stage: 'consideration',
    question_type: 'review',
    weight: 1.0,
    must_include_templates: ['{brand}', '장점', '단점'],
    should_include_templates: ['사용자 후기', '실제 경험'],
    must_not_do: ['없는 후기 조작'],
    layer: 'L7_brand',
  },
  {
    template_text: '{brand} 공식 사이트나 연락처, 혹은 매장/스튜디오 위치 정보를 알려주세요.',
    intent_context: 'brand_access',
    risk_level: 'low',
    decision_stage: 'decision',
    question_type: 'informational',
    weight: 1.0,
    must_include_templates: ['{brand}', '위치', '공식 사이트'],
    should_include_templates: ['연락처', '오프라인'],
    must_not_do: ['경쟁사 링크 제공'],
    layer: 'L7_brand',
  },
  {
    template_text: '다른 비슷한 브랜드들과 비교했을 때 {brand}만이 가지는 특별한 차별점은 무엇인가요?',
    intent_context: 'differentiation',
    risk_level: 'medium',
    decision_stage: 'consideration',
    question_type: 'comparison',
    weight: 1.0,
    must_include_templates: ['{brand}', '차별점'],
    should_include_templates: ['독창성', '경쟁 우위'],
    must_not_do: ['일방적인 경쟁사 비난'],
    layer: 'L7_brand',
  },
  {
    template_text: '어떤 상황에서(어떤 고민, 혹은 어떤 스타일을 원할 때) {brand}를 선택하는 것이 가장 좋은가요?',
    intent_context: 'contextual_recommendation',
    risk_level: 'low',
    decision_stage: 'decision',
    question_type: 'recommendation',
    weight: 1.0,
    must_include_templates: ['{brand}', '추천 대상'],
    should_include_templates: ['상황별 추천', '타겟 고객'],
    must_not_do: ['잘못된 타겟층 안내'],
    layer: 'L7_brand',
  },
];

// 3개의 Competitive(L2) 공통 템플릿
export const COMPETITIVE_TEMPLATES: FairProbeTemplate[] = [
  {
    template_text: '{brand}와 {competitor}를 비교해 주세요. 각각 어떤 사람에게 더 잘 맞을까요?',
    intent_context: 'comparison',
    risk_level: 'medium',
    decision_stage: 'consideration',
    question_type: 'comparison',
    weight: 1.0,
    must_include_templates: ['{brand}', '{competitor}', '비교'],
    should_include_templates: ['장단점', '추천 대상'],
    must_not_do: ['한쪽 브랜드만 일방적으로 편들기'],
    layer: 'L2_competitive',
  },
  {
    template_text: '{brand} 대신 선택할 수 있는 가장 강력한 대안 브랜드는 {competitor}인가요? 두 브랜드의 결정적 차이는?',
    intent_context: 'alternative_exploration',
    risk_level: 'medium',
    decision_stage: 'consideration',
    question_type: 'comparison',
    weight: 1.0,
    must_include_templates: ['{brand}', '{competitor}', '차이점'],
    should_include_templates: ['대안', '비교 우위'],
    must_not_do: ['허위 사실 기반 비교'],
    layer: 'L2_competitive',
  },
  {
    template_text: '예산과 가성비를 고려할 때 {brand}와 {competitor} 중 어느 곳이 더 합리적인 선택인가요?',
    intent_context: 'value_comparison',
    risk_level: 'low',
    decision_stage: 'decision',
    question_type: 'comparison',
    weight: 1.0,
    must_include_templates: ['{brand}', '{competitor}', '가성비'],
    should_include_templates: ['가격대', '합리성'],
    must_not_do: ['정확하지 않은 가격 정보로 우위 확정'],
    layer: 'L2_competitive',
  },
];


export const PLACE_BRAND_DEFENSE_TEMPLATES: FairProbeTemplate[] = [
  { template_text: '{brand}의 대표 관광 명소와 볼거리 3곳을 알려줘. 각각의 특징도 설명해줘.', intent_context: 'landmark_exploration', risk_level: 'low', decision_stage: 'awareness', question_type: 'informational', weight: 1.0, must_include_templates: ['{brand}', '명소', '볼거리'], should_include_templates: ['특징'], must_not_do: [], layer: 'L7_brand' },
  { template_text: 'What are the top 3 must-visit attractions in {brand}? Please explain the unique features of each.', intent_context: 'landmark_exploration_en', risk_level: 'low', decision_stage: 'awareness', question_type: 'informational', weight: 1.0, must_include_templates: ['{brand}', 'attractions'], should_include_templates: ['features'], must_not_do: [], layer: 'L7_brand' },
  { template_text: '{brand}에서 꼭 가봐야 할 맛집이나 먹거리 거리를 추천해줘.', intent_context: 'food_exploration', risk_level: 'low', decision_stage: 'consideration', question_type: 'recommendation', weight: 1.0, must_include_templates: ['{brand}', '맛집', '먹거리'], should_include_templates: ['추천'], must_not_do: [], layer: 'L7_brand' },
  { template_text: 'Where are the best places to eat or street food alleys in {brand}?', intent_context: 'food_exploration_en', risk_level: 'low', decision_stage: 'consideration', question_type: 'recommendation', weight: 1.0, must_include_templates: ['{brand}', 'eat', 'street food'], should_include_templates: ['best places'], must_not_do: [], layer: 'L7_brand' },
  { template_text: '{brand}만의 독특한 매력과 다른 지역과의 차별점은 무엇이야?', intent_context: 'differentiation', risk_level: 'medium', decision_stage: 'consideration', question_type: 'comparison', weight: 1.0, must_include_templates: ['{brand}', '매력', '차별점'], should_include_templates: ['독특한'], must_not_do: [], layer: 'L7_brand' },
  { template_text: 'What is the unique charm of {brand} and how does it differentiate from other areas in Seoul?', intent_context: 'differentiation_en', risk_level: 'medium', decision_stage: 'consideration', question_type: 'comparison', weight: 1.0, must_include_templates: ['{brand}', 'unique', 'differentiate'], should_include_templates: ['charm'], must_not_do: [], layer: 'L7_brand' },
  { template_text: '{brand}의 역사적 배경이나 문화적 특색에 대해 알려줘.', intent_context: 'heritage_exploration', risk_level: 'low', decision_stage: 'awareness', question_type: 'informational', weight: 1.0, must_include_templates: ['{brand}', '역사', '문화'], should_include_templates: ['특색'], must_not_do: [], layer: 'L7_brand' },
  { template_text: 'Can you tell me about the historical background and cultural characteristics of {brand}?', intent_context: 'heritage_exploration_en', risk_level: 'low', decision_stage: 'awareness', question_type: 'informational', weight: 1.0, must_include_templates: ['{brand}', 'historical', 'cultural'], should_include_templates: ['background'], must_not_do: [], layer: 'L7_brand' }
];

export const PLACE_PRACTICAL_TEMPLATES: FairProbeTemplate[] = [
  { template_text: '{brand}를 반나절 동안 둘러보는 추천 코스를 짜줘.', intent_context: 'itinerary', risk_level: 'medium', decision_stage: 'decision', question_type: 'recommendation', weight: 1.0, must_include_templates: ['{brand}', '반나절', '코스'], should_include_templates: ['추천'], must_not_do: [], layer: 'L4_practical' },
  { template_text: 'Can you plan a half-day itinerary for exploring {brand}?', intent_context: 'itinerary_en', risk_level: 'medium', decision_stage: 'decision', question_type: 'recommendation', weight: 1.0, must_include_templates: ['{brand}', 'half-day', 'itinerary'], should_include_templates: ['exploring'], must_not_do: [], layer: 'L4_practical' },
  { template_text: '{brand} 여행 시 대중교통으로 접근하는 방법은?', intent_context: 'transportation', risk_level: 'low', decision_stage: 'decision', question_type: 'informational', weight: 1.0, must_include_templates: ['{brand}', '대중교통', '방법'], should_include_templates: ['접근'], must_not_do: [], layer: 'L4_practical' },
  { template_text: 'What is the best way to get to {brand} using public transportation?', intent_context: 'transportation_en', risk_level: 'low', decision_stage: 'decision', question_type: 'informational', weight: 1.0, must_include_templates: ['{brand}', 'public transportation'], should_include_templates: ['get to'], must_not_do: [], layer: 'L4_practical' }
];

export const PLACE_COMPETITIVE_TEMPLATES: FairProbeTemplate[] = [
  { template_text: '{brand}와 {competitor} 중 주말 나들이로 더 좋은 곳은 어디야? 이유도 알려줘.', intent_context: 'comparison', risk_level: 'medium', decision_stage: 'consideration', question_type: 'comparison', weight: 1.0, must_include_templates: ['{brand}', '{competitor}', '주말'], should_include_templates: ['이유'], must_not_do: [], layer: 'L2_competitive' },
  { template_text: 'Between {brand} and {competitor}, which is a better place for a weekend outing? Please explain why.', intent_context: 'comparison_en', risk_level: 'medium', decision_stage: 'consideration', question_type: 'comparison', weight: 1.0, must_include_templates: ['{brand}', '{competitor}', 'weekend'], should_include_templates: ['why'], must_not_do: [], layer: 'L2_competitive' },
  { template_text: '맛집 탐방을 한다면 {brand}와 {competitor} 중 어디가 더 나을까?', intent_context: 'comparison_food', risk_level: 'medium', decision_stage: 'consideration', question_type: 'comparison', weight: 1.0, must_include_templates: ['{brand}', '{competitor}', '맛집'], should_include_templates: ['탐방'], must_not_do: [], layer: 'L2_competitive' },
  { template_text: 'For a food tour, which district is better: {brand} or {competitor}?', intent_context: 'comparison_food_en', risk_level: 'medium', decision_stage: 'consideration', question_type: 'comparison', weight: 1.0, must_include_templates: ['{brand}', '{competitor}', 'food tour'], should_include_templates: ['better'], must_not_do: [], layer: 'L2_competitive' },
  { template_text: '외국인 관광객에게 {brand}와 {competitor} 중 어디를 추천할래?', intent_context: 'comparison_foreigner', risk_level: 'medium', decision_stage: 'consideration', question_type: 'comparison', weight: 1.0, must_include_templates: ['{brand}', '{competitor}', '외국인'], should_include_templates: ['추천'], must_not_do: [], layer: 'L2_competitive' },
  { template_text: 'Which would you recommend to a foreign tourist: {brand} or {competitor}?', intent_context: 'comparison_foreigner_en', risk_level: 'medium', decision_stage: 'consideration', question_type: 'comparison', weight: 1.0, must_include_templates: ['{brand}', '{competitor}', 'foreign tourist'], should_include_templates: ['recommend'], must_not_do: [], layer: 'L2_competitive' }
];


export function fairProbeSetBuilder(
  genericQuestions: any[],
  genericCount: number,
  brands: { name: string; keywords: string[], comparative_pairs?: string[], slug?: string }[],
  k: number = 2,
  isPlaceBrand: boolean = false
): any[] {
  const selected: any[] = [];
  
  const defenseTemplates = isPlaceBrand ? PLACE_BRAND_DEFENSE_TEMPLATES.concat(PLACE_PRACTICAL_TEMPLATES) : BRAND_DEFENSE_TEMPLATES;
  const competitiveTemplates = isPlaceBrand ? PLACE_COMPETITIVE_TEMPLATES : COMPETITIVE_TEMPLATES;

  // 1. L7_brand & L4_practical
  for (const brand of brands) {
    for (const template of defenseTemplates) {
      for (let i = 0; i < k; i++) {
        const cloned = {
          question_text: template.template_text.replace(/{brand}/g, brand.name),
          target_keyword: brand.name,
          must_include: template.must_include_templates.map(t => t.replace(/{brand}/g, brand.name)),
          should_include: template.should_include_templates.map(t => t.replace(/{brand}/g, brand.name)),
          must_not_do: template.must_not_do,
          layer: template.layer,
          intent_context: template.intent_context,
          risk_level: template.risk_level,
          decision_stage: template.decision_stage,
          question_type: template.question_type,
          weight: template.weight,
          target_brand: brand.name
        };
        const zwsp = '​'.repeat(i);
        cloned.question_text += zwsp;
        selected.push(cloned);
      }
    }
  }

  // 2. L2_competitive
  for (const brand of brands) {
    for (const template of competitiveTemplates) {
      for (let i = 0; i < k; i++) {
        let randomCompetitor = '타 브랜드';
        
        if (isPlaceBrand && brand.comparative_pairs && brand.comparative_pairs.length > 0) {
           const competitorSlug = brand.comparative_pairs[Math.floor(Math.random() * brand.comparative_pairs.length)];
           const compBrand = brands.find(b => b.slug === competitorSlug);
           if (compBrand) randomCompetitor = compBrand.name;
        } else {
           const competitors = brands.filter(b => b.name !== brand.name);
           if (competitors.length > 0) {
             randomCompetitor = competitors[Math.floor(Math.random() * competitors.length)].name;
           }
        }

        const cloned = {
          question_text: template.template_text.replace(/{brand}/g, brand.name).replace(/{competitor}/g, randomCompetitor),
          target_keyword: brand.name,
          must_include: template.must_include_templates.map(t => t.replace(/{brand}/g, brand.name).replace(/{competitor}/g, randomCompetitor)),
          should_include: template.should_include_templates.map(t => t.replace(/{brand}/g, brand.name).replace(/{competitor}/g, randomCompetitor)),
          must_not_do: template.must_not_do,
          layer: template.layer,
          intent_context: template.intent_context,
          risk_level: template.risk_level,
          decision_stage: template.decision_stage,
          question_type: template.question_type,
          weight: template.weight,
          target_brand: brand.name,
          target_competitor: randomCompetitor
        };
        const zwsp = '​'.repeat(i);
        cloned.question_text += zwsp;
        selected.push(cloned);
      }
    }
  }

  // 3. Generic Questions 
  const shuffledGeneric = [...genericQuestions].sort(() => Math.random() - 0.5);
  for (let i = 0; i < Math.min(genericCount, shuffledGeneric.length); i++) {
    selected.push(shuffledGeneric[i]);
  }

  return selected.sort(() => Math.random() - 0.5);
}
