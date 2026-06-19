import { NextRequest, NextResponse } from 'next/server';
import { BENCHMARK_DOMAINS } from '../../../../lib/benchmark/domain-config';
import { INDUSTRY_PANELS_DATA } from '../../../../db/seed/industry-panels/questions-data';
import { fairProbeSetBuilder } from '../../../../lib/benchmark/fair-probe-templates';

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
  
  const isPlaceBrand = domain.startsWith('seoul_district');
  const isKpop = domain.startsWith('kpop');
  const lang = domain.endsWith('_en') ? 'en' : 'ko';
  const kCount = domainConfig.repetitionCount ?? 2;
  const sampledQuestions = fairProbeSetBuilder(allQuestions, Math.floor(sampleCount / 2), brands, kCount, isPlaceBrand, lang as any, isKpop);

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

