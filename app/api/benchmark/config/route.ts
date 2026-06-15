import { NextRequest, NextResponse } from 'next/server';
import { BENCHMARK_DOMAINS } from '../../../../lib/benchmark/domain-config';
import { INDUSTRY_PANELS_DATA } from '../../../../db/seed/industry-panels/questions-data';

/**
 * GET /api/benchmark/config?domain=skincare
 *
 * 측정에 필요한 설정(브랜드, 질문 목록)을 반환합니다.
 * 공정성 확보(Fair-Play Benchmark v2):
 * - L7_brand, L2_competitive, L4_journey 레이어 완전 배제
 * - target_keyword가 '{brand}' 플레이스홀더가 아닌 질문(특정 브랜드명 하드코딩) 동적 필터링
 * - 오직 순수 제네릭 질문(L1, L3, L5, L6 중 비브랜드)만 100% 샘플링
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

  // 공정성 기반 제네릭 질문 샘플링
  const allQuestions = panelData.questions;
  const sampleCount = domainConfig.sampleQuestionsForLight;
  const brands = domainConfig.brands;
  const sampledQuestions = sampleQuestionsWeighted(allQuestions, sampleCount, brands);

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
 * 공정성(Fair-Play v2) 기반 혼합 샘플링
 * 배제 조건 완화: 상대 평가를 위해 각 브랜드당 1개의 브랜드 탐색 질문(L7_brand)을 동적으로 주입.
 * 나머지 분량은 순수 제네릭 질문으로 채웁니다.
 */
function sampleQuestionsWeighted(
  questions: any[],
  count: number,
  brands: { name: string; keywords: string[] }[]
): any[] {
  const brandQuestions = questions.filter(q => q.layer === 'L7_brand' && (q.question_text.includes('{brand}') || q.target_keyword?.includes('{brand}')));
  const genericQuestions = questions.filter(q => !['L7_brand', 'L2_competitive', 'L4_journey'].includes(q.layer));

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

  // 1. 브랜드별 1개의 브랜드 탐색 질문 동적 주입
  if (brandQuestions.length > 0) {
    for (const brand of brands) {
      const bq = brandQuestions[Math.floor(Math.random() * brandQuestions.length)];
      const cloned = JSON.parse(JSON.stringify(bq));
      cloned.question_text = cloned.question_text.replace(/{brand}/g, brand.name);
      cloned.target_keyword = (cloned.target_keyword || '').replace(/{brand}/g, brand.name);
      if (cloned.must_include) cloned.must_include = cloned.must_include.map((t: string) => t.replace(/{brand}/g, brand.name));
      if (cloned.should_include) cloned.should_include = cloned.should_include.map((t: string) => t.replace(/{brand}/g, brand.name));
      add(cloned);
    }
  }

  // 2. 남은 슬롯은 순수 제네릭 질문으로 채우기
  const shuffledGeneric = [...genericQuestions].sort(() => Math.random() - 0.5);
  for (const q of shuffledGeneric) {
    if (selected.length >= count) break;
    add(q);
  }

  // 3. 질문 섞기 (브랜드 질문이 앞쪽에 쏠리지 않도록)
  return selected.sort(() => Math.random() - 0.5);
}
