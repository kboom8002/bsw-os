import { NextRequest, NextResponse } from 'next/server';
import { BENCHMARK_DOMAINS } from '../../../../lib/benchmark/domain-config';
import { INDUSTRY_PANELS_DATA } from '../../../../db/seed/industry-panels/questions-data';

/**
 * GET /api/benchmark/config?domain=skincare
 *
 * 측정에 필요한 설정(브랜드, 질문 목록)을 반환합니다.
 * 질문은 sampleQuestionsForLight 수만큼 가중 샘플링합니다.
 * - L7_brand: 50% (브랜드당 최소 1개 보장)
 * - L2_competitive: 30%
 * - 기타: 20%
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

  // 가중 샘플링 (L7 브랜드 우선, 브랜드당 최소 1개 L7 보장)
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
 * L7 브랜드 우선 가중 샘플링
 * - 브랜드당 최소 1개의 L7 질문 보장
 * - L7: 50%, L2: 30%, 기타: 20% 목표 분포
 */
function sampleQuestionsWeighted(
  questions: any[],
  count: number,
  brands: { keywords: string[] }[]
): any[] {
  if (questions.length <= count) return [...questions];

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

  // 레이어별 분류
  const l7Questions = questions.filter(q => q.layer === 'L7_brand');
  const l2Questions = questions.filter(q => q.layer === 'L2_competitive');
  const otherQuestions = questions.filter(q => q.layer !== 'L7_brand' && q.layer !== 'L2_competitive');

  // 브랜드 키워드 매칭 헬퍼
  const matchesBrand = (q: any, brand: { keywords: string[] }): boolean => {
    const text = ((q.question_text ?? '') + ' ' + (q.target_keyword ?? '')).toLowerCase();
    return brand.keywords.some(kw => text.includes(kw.toLowerCase()));
  };

  // Step 1: 브랜드당 L7 질문 최소 1개 보장
  for (const brand of brands) {
    const brandL7 = l7Questions.filter(q => matchesBrand(q, brand));
    if (brandL7.length > 0) {
      const pick = brandL7[Math.floor(Math.random() * brandL7.length)];
      add(pick);
    }
  }

  // Step 2: 목표 분포 계산
  const targetL7 = Math.round(count * 0.5);
  const targetL2 = Math.round(count * 0.3);
  const targetOther = count - targetL7 - targetL2;

  // L7 추가 채우기
  const remainingL7 = l7Questions.filter(q => !selectedTexts.has(q.question_text));
  const shuffledL7 = [...remainingL7].sort(() => Math.random() - 0.5);
  const needL7 = Math.max(0, targetL7 - selected.length);
  for (let i = 0; i < Math.min(needL7, shuffledL7.length); i++) {
    add(shuffledL7[i]);
  }

  // L2 채우기
  const shuffledL2 = [...l2Questions].sort(() => Math.random() - 0.5);
  let l2Added = 0;
  for (const q of shuffledL2) {
    if (l2Added >= targetL2) break;
    if (add(q)) l2Added++;
  }

  // 기타 채우기
  const shuffledOther = [...otherQuestions].sort(() => Math.random() - 0.5);
  let otherAdded = 0;
  for (const q of shuffledOther) {
    if (otherAdded >= targetOther) break;
    if (add(q)) otherAdded++;
  }

  // 슬롯이 남을 경우 미선택 질문으로 채우기
  if (selected.length < count) {
    const allRemaining = questions.filter(q => !selectedTexts.has(q.question_text));
    const shuffledRemaining = [...allRemaining].sort(() => Math.random() - 0.5);
    for (const q of shuffledRemaining) {
      if (selected.length >= count) break;
      add(q);
    }
  }

  return selected.slice(0, count);
}
