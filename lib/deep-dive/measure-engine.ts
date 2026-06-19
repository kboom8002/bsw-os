import { getDomainConfig } from '../benchmark/domain-config';
import { INDUSTRY_PANELS_DATA } from '../../db/seed/industry-panels/questions-data';
import { fairProbeSetBuilder } from '../benchmark/fair-probe-templates';
import { SearchProviderFactory } from '../ai/search-provider-factory';
import { calcWeightedAAS } from '../benchmark/mention-classifier';
import { calculatePerLayerMetrics } from '../benchmark/per-layer-metrics';
import { OpportunityAnalyzer } from '../benchmark/opportunity-analyzer';
import { QuestionDetail } from '../benchmark/lightweight-metric-runner';
import { LlmAnalyst } from './llm-analyst';

export async function runDeepDiveMeasure(workspace_id: string, brand_slug: string, domain_slug: string) {
  const domainConfig = getDomainConfig(domain_slug as any);
  if (!domainConfig) {
    throw new Error('Invalid domain slug');
  }

  const brand = domainConfig.brands.find(b => b.slug === brand_slug);
  if (!brand) {
    throw new Error('Invalid brand slug');
  }

  const questionsData = INDUSTRY_PANELS_DATA[domainConfig.industryType as keyof typeof INDUSTRY_PANELS_DATA];
  if (!questionsData) {
    throw new Error('Invalid industry type');
  }

  // Deep Dive는 타겟 브랜드 중심 분석이므로, 타겟과 무관한 경쟁사 비교 질문을 제외
  const genericLayers = new Set(['L1_universal', 'L3_ingredient', 'L5_ymyl', 'L6_trend']);
  const allBrandNames = domainConfig.brands.map(b => b.name.toLowerCase());
  const targetBrandNames = new Set([
    brand.name.toLowerCase(),
    ...brand.keywords.map(k => k.toLowerCase())
  ]);
  
  const genericQuestions = questionsData.questions.filter(q => {
    if (!genericLayers.has(q.layer || 'unknown') && q.layer) return false;
    
    // 질문 텍스트에 다른 브랜드명이 명시적으로 포함된 경우, 타겟 브랜드도 포함되어야 함
    const qText = (q.question_text || '').toLowerCase();
    const mentionedBrands = allBrandNames.filter(bn => qText.includes(bn));
    if (mentionedBrands.length > 0) {
      // 다른 브랜드만 언급되고 타겟 브랜드가 언급되지 않은 질문은 제외
      const mentionsTarget = Array.from(targetBrandNames).some(tn => qText.includes(tn));
      if (!mentionsTarget) return false;
    }
    return true;
  });

  const isPlaceBrand = domain_slug.startsWith('seoul_district');
  const isKpop = domain_slug.startsWith('kpop');
  const lang = domain_slug.endsWith('_en') ? 'en' : 'ko';
  
  // Deep Dive에서는 타겟 브랜드만 전달 (경쟁사 probe 생성 방지)
  const sampledQuestions = fairProbeSetBuilder(
    genericQuestions,
    10,
    [brand],  // 타겟 브랜드만 전달
    1,
    isPlaceBrand,
    lang as any,
    isKpop
  );

  const queries = sampledQuestions.map(q => q.question_text);
  const engines = ['gemini_grounding'];

  const searchResults = await Promise.all(queries.map(q => SearchProviderFactory.runMultiEngine(q, engines)));

  const questionDetailsPromises = sampledQuestions.map(async (q, idx) => {
    const qRes = searchResults[idx];
    const perEngine: Record<string, any> = {};

    for (const eng of engines) {
      const engRes = qRes.results[eng];
      if (!engRes) continue;

      let bsfScore = 0;
      const text = engRes.raw_response_text || '';
      
      let matchedInclude = 0;
      let matchedShould = 0;
      const mustTemplates = q.must_include_templates || [];
      const shouldTemplates = q.should_include_templates || [];
      
      mustTemplates.forEach((t: string) => {
        if (text.toLowerCase().includes(t.toLowerCase())) matchedInclude++;
      });
      shouldTemplates.forEach((t: string) => {
        if (text.toLowerCase().includes(t.toLowerCase())) matchedShould++;
      });

      if (mustTemplates.length > 0) {
        bsfScore += (matchedInclude / mustTemplates.length) * 70;
      } else {
        bsfScore += 70;
      }
      if (shouldTemplates.length > 0) {
        bsfScore += (matchedShould / shouldTemplates.length) * 30;
      } else {
        bsfScore += 30;
      }

      const brandsMentioned: string[] = [];
      let mentionQuality = { strong: 0, neutral: 0, negative: 0 } as any;

      for (const b of domainConfig.brands) {
        const res = calcWeightedAAS(text, b.keywords);
        if (res.hit) {
          brandsMentioned.push(b.name);
          if (b.slug === brand_slug) {
            const deepRes = await LlmAnalyst.classifyMentionDeep(text, b.name, q.question_text);
            mentionQuality[deepRes.sentiment]++;
          }
        }
      }

      perEngine[eng] = {
        raw_response_text: text,
        brands_mentioned: brandsMentioned,
        citation_domains: engRes.citations?.map(c => c.domain) || [],
        bsf_score: bsfScore,
        mention_quality: mentionQuality
      };
    }

    return {
      question_text: q.question_text,
      question_type: q.question_type || 'informational',
      layer: q.layer || 'unknown',
      per_engine: perEngine
    } as QuestionDetail;
  });

  const questionDetails: QuestionDetail[] = await Promise.all(questionDetailsPromises);

  let aas = 0, ocr = 0, bdr = 0, cwr = 0, iri = 0, opp = 0;
  const metrics = calculatePerLayerMetrics(brand, questionDetails, questionsData.questions);
  
  bdr = metrics.bdr;
  cwr = metrics.cwr;
  iri = metrics.iri;
  opp = metrics.opp;

  let mentionHits = 0;
  let citationHits = 0;
  let totalEngines = 0;

  let strongHits = 0;
  let neutralHits = 0;
  let negativeHits = 0;

  for (const q of questionDetails) {
    for (const eng of Object.keys(q.per_engine)) {
      totalEngines++;
      const engData = q.per_engine[eng] as any;
      if (engData.brands_mentioned.includes(brand.name)) mentionHits++;
      
      const bDomains = brand.domains || [];
      const hasCitation = engData.citation_domains.some((d: string) => bDomains.some(bd => d.includes(bd)));
      if (hasCitation) citationHits++;

      if (engData.mention_quality) {
        strongHits += engData.mention_quality.strong;
        neutralHits += engData.mention_quality.neutral;
        negativeHits += engData.mention_quality.negative;
      }
    }
  }

  if (totalEngines > 0) {
    aas = (mentionHits / totalEngines) * 100;
    ocr = (citationHits / totalEngines) * 100;
  }

  const mentionQuality = {
    strongRate: mentionHits > 0 ? (strongHits / mentionHits) * 100 : 0,
    neutralRate: mentionHits > 0 ? (neutralHits / mentionHits) * 100 : 0,
    negativeRate: mentionHits > 0 ? (negativeHits / mentionHits) * 100 : 0,
  };

  const opportunityReport = OpportunityAnalyzer.analyze(
    brand.name,
    brand.slug,
    questionDetails
  );

  return {
    benchmarkSnapshot: {
      aas, ocr, bsf: 0, bair: 0, bdr, cwr, iri, opp, rank: 0, totalBrands: domainConfig.brands.length,
      mentionQuality
    },
    opportunityReport,
    questionDetails
  };
}
