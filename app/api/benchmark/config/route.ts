import { NextRequest, NextResponse } from 'next/server';
import { BENCHMARK_DOMAINS } from '../../../../lib/benchmark/domain-config';
import { INDUSTRY_PANELS_DATA } from '../../../../db/seed/industry-panels/questions-data';

/**
 * GET /api/benchmark/config?domain=skincare
 *
 * 측정에 필요한 설정(브랜드, 질문 목록)을 반환합니다.
 * Mixed Goldilocks Sampling: L1/L3/L5/L6(50%) + L2(25%) + L7(25%)
 */
export async function GET(request: NextRequest) {
  const domain = request.nextUrl.searchParams.get('domain');
  if (!domain) {
    return NextResponse.json({ error: 'domain param required' }, { status: 400 });
  }

  const domainConfig = BENCHMARK_DOMAINS[domain];
  if (!domainConfig) {
    return NextResponse.json({ error: `Unknown domain: ${domain}` }, { status: 404 });
  }

  const industryType = domainConfig.industryType as keyof typeof INDUSTRY_PANELS_DATA;
  const panelData = INDUSTRY_PANELS_DATA[industryType];
  if (!panelData) {
    return NextResponse.json({ error: `No panel data for: ${industryType}` }, { status: 404 });
  }

  const allQuestions = panelData.questions;
  const sampleCount = domainConfig.sampleQuestionsForLight;
  const brands = domainConfig.brands;
  
  const sampledQuestions = mixedGoldilocksSampling(allQuestions, sampleCount, brands);

  return NextResponse.json({
    domain: {
      slug: domainConfig.slug,
      name: domainConfig.name,
    },
    brands: brands.map(b => ({
      slug: b.slug,
      name: b.name,
      keywords: b.keywords,
      domains: b.domains,
    })),
    questions: sampledQuestions.map(q => ({
      // 이미 치환된 텍스트들은 그대로 유지하고, 혹시 남은 {brand}/{competitor} 플레이스홀더만 제거
      question_text: q.question_text.replace(/{brand}/g, '').replace(/{competitor}/g, '').trim(),
      must_include: (q.must_include ?? []).filter((t: string) => !t.includes('{brand}') && !t.includes('{competitor}')),
      should_include: (q.should_include ?? []).filter((t: string) => !t.includes('{brand}') && !t.includes('{competitor}')),
      layer: q.layer ?? 'unknown',
      target_keyword: (q.target_keyword ?? '').replace(/{brand}/g, '').replace(/{competitor}/g, '').trim(),
    })),
    engines: ['gemini_grounding'],
  });
}

/**
 * 3-Layer Mixed Goldilocks Sampling
 * - L1/L3/L5/L6 (Generic): 50%
 * - L2_competitive: 25% (브랜드별로 랜덤 경쟁사와 1:1 매칭)
 * - L7_brand: 25% (모든 브랜드에게 1:1 부여)
 */
function mixedGoldilocksSampling(
  questions: any[],
  count: number,
  brands: { name: string; keywords: string[] }[]
): any[] {
  const genericLayers = new Set(['L1_universal', 'L3_ingredient', 'L5_ymyl', 'L6_trend']);
  
  const genericQuestions = questions.filter(q => genericLayers.has(q.layer) || !q.layer);
  const l2Questions = questions.filter(q => q.layer === 'L2_competitive');
  const l7Questions = questions.filter(q => q.layer === 'L7_brand');

  const selected: any[] = [];
  const selectedTexts = new Set<string>();

  const add = (q: any): boolean => {
    if (!selectedTexts.has(q.question_text)) {
      selected.push(q);
      selectedTexts.add(q.question_text);
      return true;
    }
    return false;
  };

  // 1. L7_brand (25%) - 모든 브랜드에 공평하게 할당
  if (l7Questions.length > 0) {
    for (const brand of brands) {
      // 렌덤 L7 질문 선택 (웨딩스튜디오 등 브랜드 하드코딩이 이미 된 경우 대비)
      const cand = l7Questions.filter(q => q.question_text.includes('{brand}') || q.target_keyword?.includes('{brand}') || q.question_text.includes(brand.name));
      const bq = cand.length > 0 ? cand[Math.floor(Math.random() * cand.length)] : l7Questions[Math.floor(Math.random() * l7Questions.length)];
      
      const cloned = JSON.parse(JSON.stringify(bq));
      cloned.question_text = cloned.question_text.replace(/{brand}/g, brand.name);
      cloned.target_keyword = (cloned.target_keyword || '').replace(/{brand}/g, brand.name);
      if (cloned.must_include) cloned.must_include = cloned.must_include.map((t: string) => t.replace(/{brand}/g, brand.name));
      if (cloned.should_include) cloned.should_include = cloned.should_include.map((t: string) => t.replace(/{brand}/g, brand.name));
      add(cloned);
    }
  }

  // 2. L2_competitive (25%) - 브랜드별 vs 무작위 타 브랜드 페어링
  if (l2Questions.length > 0) {
    for (const brand of brands) {
      const cand = l2Questions.filter(q => q.question_text.includes('{brand}') || q.target_keyword?.includes('{brand}') || q.question_text.includes(brand.name));
      const bq = cand.length > 0 ? cand[Math.floor(Math.random() * cand.length)] : l2Questions[Math.floor(Math.random() * l2Questions.length)];
      
      // 랜덤 경쟁사 추출
      const competitors = brands.filter(b => b.name !== brand.name);
      const randomCompetitor = competitors.length > 0 ? competitors[Math.floor(Math.random() * competitors.length)].name : '타 브랜드';

      const cloned = JSON.parse(JSON.stringify(bq));
      cloned.question_text = cloned.question_text.replace(/{brand}/g, brand.name).replace(/{competitor}/g, randomCompetitor);
      cloned.target_keyword = (cloned.target_keyword || '').replace(/{brand}/g, brand.name).replace(/{competitor}/g, randomCompetitor);
      if (cloned.must_include) cloned.must_include = cloned.must_include.map((t: string) => t.replace(/{brand}/g, brand.name).replace(/{competitor}/g, randomCompetitor));
      if (cloned.should_include) cloned.should_include = cloned.should_include.map((t: string) => t.replace(/{brand}/g, brand.name).replace(/{competitor}/g, randomCompetitor));
      add(cloned);
    }
  }

  // 3. 제네릭 질문 (나머지 분량 50%+)
  const shuffledGeneric = [...genericQuestions].sort(() => Math.random() - 0.5);
  for (const q of shuffledGeneric) {
    if (selected.length >= count) break;
    add(q);
  }

  return selected.sort(() => Math.random() - 0.5);
}
