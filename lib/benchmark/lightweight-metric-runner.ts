/**
 * lib/benchmark/lightweight-metric-runner.ts
 *
 * AI 호출 ZERO 기반 경량 지표 측정 엔진.
 * AAS (Brand Answer Share), OCR (Observed Citation Rate),
 * BSF (Brand Semantic Fidelity) 모두 텍스트 매칭만으로 산출합니다.
 *
 * ─ 측정 원칙 ─
 * - AAS: AI 응답에 브랜드 키워드가 등장하는 비율
 * - OCR: AI 응답 Citations에 브랜드 도메인이 포함되는 비율
 * - BSF: must_include 매칭 비율 (Judge LLM 없음)
 * - BAIR: AAS × (BSF / 100) 으로 파생
 */

import { SearchProviderFactory } from '../ai/search-provider-factory';
import type { BrandConfig, DomainConfig } from './domain-config';
import type { SeedProbeQuestion } from '../../db/seed/industry-panels/questions-data';
import { calculatePerLayerMetrics } from './per-layer-metrics';

export interface LightweightBrandResult {
  brand_slug: string;
  brand_name: string;
  engine_name: string;
  aas: number;          // 0-100
  ocr: number;          // 0-100
  bsf: number;          // 0-100
  bair: number;         // 0-100
  bdr?: number;
  cwr?: number;
  iri?: number;
  opp?: number;
  mention_count: number;
  citation_count: number;
  sample_size: number;
  measured_at: string;
}

export interface QuestionDetail {
  question_text: string;
  question_type: string;
  layer: string;
  per_engine: Record<string, {
    raw_response_text: string;
    brands_mentioned: string[];
    citation_domains: string[];
    bsf_score: number;
  }>;
}

export interface LightweightDomainResult {
  domain_slug: string;
  domain_name: string;
  measurement_type: 'daily_light' | 'weekly_full';
  engines: string[];
  brand_results: LightweightBrandResult[];
  measured_at: string;
  question_details?: QuestionDetail[];
}

/**
 * 단일 응답에서 브랜드 키워드 AAS 산출
 *
 * - 한국어 키워드: 부분 문자열 매칭 (한국어는 단어 경계 개념 없음)
 * - 영어/ASCII 키워드: 단어 경계(word boundary) 매칭으로 false positive 방지
 *   예) 'dro' → hydro, drops, syndrome 등에서 오탐 방지
 */
function calcAAS(responseText: string, keywords: string[]): boolean {
  return keywords.some(kw => {
    // 한국어 포함 키워드는 substring 매칭
    if (/[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(kw)) {
      return responseText.toLowerCase().includes(kw.toLowerCase());
    }
    // 영어/ASCII 키워드는 단어 경계 매칭 (false positive 방지)
    const escaped = kw.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`(?<![a-zA-Z0-9])${escaped}(?![a-zA-Z0-9])`, 'i');
    return pattern.test(responseText);
  });
}

/**
 * Citations에서 브랜드 도메인 OCR 산출 (pure domain matching)
 */
function calcOCR(
  citations: Array<{ domain: string; url: string }>,
  brandDomains: string[]
): boolean {
  if (citations.length === 0) return false;
  return citations.some(c => {
    const domain = c.domain.toLowerCase().replace(/^www\./, '');
    const url = c.url.toLowerCase();
    return brandDomains.some(bd => domain.includes(bd.replace(/^www\./, '')) || url.includes(bd));
  });
}

/**
 * must_include 매칭 기반 BSF 산출 (AI Judge 없음)
 */
function calcBSF(responseText: string, mustInclude: string[], shouldInclude: string[]): number {
  const text = responseText.toLowerCase();

  let mustCount = 0;
  mustInclude.forEach(term => {
    // {brand} placeholder를 무시
    if (term.includes('{brand}')) return;
    if (text.includes(term.toLowerCase())) mustCount++;
  });
  const mustRatio = mustInclude.filter(t => !t.includes('{brand}')).length > 0
    ? mustCount / mustInclude.filter(t => !t.includes('{brand}')).length
    : 1.0;

  let shouldCount = 0;
  shouldInclude.forEach(term => {
    if (term.includes('{brand}')) return;
    if (text.includes(term.toLowerCase())) shouldCount++;
  });
  const shouldRatio = shouldInclude.filter(t => !t.includes('{brand}')).length > 0
    ? shouldCount / shouldInclude.filter(t => !t.includes('{brand}')).length
    : 1.0;

  return parseFloat(((mustRatio * 70) + (shouldRatio * 30)).toFixed(2));
}

/**
 * 경량 측정 엔진 — 특정 도메인의 모든 브랜드를 AI 호출 최소화로 측정
 */
export class LightweightMetricRunner {
  private engines: string[];

  constructor(engines: string[] = ['chatgpt_search', 'gemini_grounding']) {
    this.engines = engines;
  }

  /**
   * 도메인 전체 브랜드에 대해 경량 측정 실행
   */
  async run(
    domainConfig: DomainConfig,
    questions: SeedProbeQuestion[],
    measurementType: 'daily_light' | 'weekly_full' = 'daily_light'
  ): Promise<LightweightDomainResult> {
    const measuredAt = new Date().toISOString();
    const brandResults: LightweightBrandResult[] = [];

    // 측정할 질문 샘플링
    const sampleCount = measurementType === 'daily_light'
      ? domainConfig.sampleQuestionsForLight
      : domainConfig.sampleQuestionsForFull;

    const sampledQuestions = this._sampleQuestions(questions, sampleCount, domainConfig);

    console.log(`\n[LightweightRunner] Domain: ${domainConfig.name} | ${sampledQuestions.length}Q × ${this.engines.length} engines`);

    // 모든 질문을 한 번만 API 호출하여 공유 (비용 절감)
    // 병렬 배치 처리: 5개 질문씩 동시 실행하여 순차 실행 대비 ~5배 속도 향상
    const queryResults: Map<string, Record<string, { text: string; citations: any[] }>> = new Map();
    const BATCH_SIZE = 5;

    for (let batchStart = 0; batchStart < sampledQuestions.length; batchStart += BATCH_SIZE) {
      const batch = sampledQuestions.slice(batchStart, batchStart + BATCH_SIZE);
      console.log(`  → Batch ${Math.floor(batchStart / BATCH_SIZE) + 1}/${Math.ceil(sampledQuestions.length / BATCH_SIZE)} (${batch.length}Q)`);

      await Promise.all(batch.map(async (q) => {
        const queryText = q.question_text.replace(/{brand}/g, '').trim();
        try {
          const multiRes = await SearchProviderFactory.runMultiEngine(queryText, this.engines);
          const perEngineResult: Record<string, { text: string; citations: any[] }> = {};
          for (const engine of this.engines) {
            const engineRes = multiRes.results[engine];
            if (engineRes) {
              perEngineResult[engine] = {
                text: engineRes.raw_response_text,
                citations: engineRes.citations || [],
              };
            }
          }
          queryResults.set(q.question_text, perEngineResult);
        } catch (err: any) {
          console.warn(`  ⚠ Query failed: "${queryText}" — ${err.message}`);
          queryResults.set(q.question_text, {});
        }
      }));
    }

    // ── AIPR 방식 AAS 분모 계산 ──────────────────────────────────────────
    // 분모 = 패널 내 브랜드 중 1개라도 언급된 응답 수
    // (정보형 질문 등 브랜드가 전혀 등장하지 않는 응답은 분모에서 제외)
    let brandedResponseCount = 0;
    for (const [_qt, engineResults] of queryResults.entries()) {
      for (const engine of this.engines) {
        const res = engineResults[engine];
        if (!res) continue;
        const anyBrand = domainConfig.brands.some(b => calcAAS(res.text, b.keywords));
        if (anyBrand) brandedResponseCount++;
      }
    }
    console.log(`\n  [AIPR] branded responses: ${brandedResponseCount} / ${queryResults.size * this.engines.length} total`);

    // 브랜드별 집계
    for (const brand of domainConfig.brands) {
      // 브랜드 도메인 설정 (OCR 계산용)
      SearchProviderFactory.setBrandDomains(brand.domains);

      const compositeResults: Array<{
        aas: boolean; ocr: boolean; bsf: number;
      }> = [];

      for (const [_qText, engineResults] of queryResults.entries()) {
        const q = sampledQuestions.find(sq => sq.question_text === _qText);
        if (!q) continue;

        for (const engine of this.engines) {
          const res = engineResults[engine];
          if (!res) continue;

          const aasHit = calcAAS(res.text, brand.keywords);
          const ocrHit = calcOCR(res.citations, brand.domains);
          const bsf = calcBSF(res.text, q.must_include, q.should_include);

          compositeResults.push({ aas: aasHit, ocr: ocrHit, bsf });
        }
      }

      if (compositeResults.length === 0) {
        brandResults.push({
          brand_slug: brand.slug,
          brand_name: brand.name,
          engine_name: 'composite',
          aas: 0, ocr: 0, bsf: 0, bair: 0,
          bdr: 0, cwr: 0, iri: 0, opp: 0,
          mention_count: 0, citation_count: 0,
          sample_size: sampledQuestions.length,
          measured_at: measuredAt,
        });
        continue;
      }

      const mentionCount = compositeResults.filter(r => r.aas).length;
      const citationCount = compositeResults.filter(r => r.ocr).length;

      // AAS: AIPR 방식 — 브랜드 언급 응답 수를 분모로 사용 (Share of Voice)
      // 전체 응답 대신 "브랜드가 1개라도 등장한 응답"만 분모로 삼아
      // 정보형 질문의 브랜드 미언급이 수치를 희석하는 문제를 제거
      const aiprDenominator = brandedResponseCount > 0 ? brandedResponseCount : compositeResults.length;
      const aas = parseFloat(((mentionCount / aiprDenominator) * 100).toFixed(1));
      const ocr = parseFloat(((citationCount / compositeResults.length) * 100).toFixed(1));
      const bsf = parseFloat((compositeResults.reduce((s, r) => s + r.bsf, 0) / compositeResults.length).toFixed(1));
      const bair = parseFloat((aas * (bsf / 100)).toFixed(1));

      // Calculate Advanced Metrics
      // First, we need to extract the question details for this brand's evaluation
      // Actually, we can generate questionDetails map right here, but questionDetails is generated at the end.
      // Let's just create a temporary array for this calculation.
      const tempDetails: QuestionDetail[] = [];
      for (const [_qText, engineResults] of queryResults.entries()) {
        const q = sampledQuestions.find(sq => sq.question_text === _qText);
        if (!q) continue;
        const det: QuestionDetail = { question_text: q.question_text, question_type: q.question_type, layer: q.layer || 'unknown', per_engine: {} };
        for (const engine of this.engines) {
          const res = engineResults[engine];
          if (!res) continue;
          const mentioned = domainConfig.brands.filter(b => calcAAS(res.text, b.keywords)).map(b => b.name);
          det.per_engine[engine] = { raw_response_text: res.text, brands_mentioned: mentioned, citation_domains: [], bsf_score: 0 };
        }
        tempDetails.push(det);
      }
      const advanced = calculatePerLayerMetrics(brand, tempDetails, sampledQuestions, 'composite');

      brandResults.push({
        brand_slug: brand.slug,
        brand_name: brand.name,
        engine_name: 'composite',
        aas, ocr, bsf, bair,
        bdr: advanced.bdr, cwr: advanced.cwr, iri: advanced.iri, opp: advanced.opp,
        mention_count: mentionCount,
        citation_count: citationCount,
        sample_size: sampledQuestions.length,
        measured_at: measuredAt,
      });

      console.log(`    [${brand.name}] AAS: ${aas}% | BDR: ${advanced.bdr}% | CWR: ${advanced.cwr}% | IRI: ${advanced.iri}%`);
    }

    // ── Question Details 수집 (Opportunity Intelligence용) ──
    const questionDetails: QuestionDetail[] = [];
    for (const [_qText, engineResults] of queryResults.entries()) {
      const q = sampledQuestions.find(sq => sq.question_text === _qText);
      if (!q) continue;

      const detail: QuestionDetail = {
        question_text: q.question_text,
        question_type: q.question_type,
        layer: q.layer || 'unknown',
        per_engine: {}
      };

      for (const engine of this.engines) {
        const res = engineResults[engine];
        if (!res) continue;

        const mentioned = domainConfig.brands.filter(b => calcAAS(res.text, b.keywords)).map(b => b.name);
        const domains = res.citations.map(c => c.domain);
        const bsf = calcBSF(res.text, q.must_include, q.should_include);

        detail.per_engine[engine] = {
          raw_response_text: res.text,
          brands_mentioned: mentioned,
          citation_domains: domains,
          bsf_score: bsf
        };
      }
      questionDetails.push(detail);
    }

    return {
      domain_slug: domainConfig.slug,
      domain_name: domainConfig.name,
      measurement_type: measurementType,
      engines: this.engines,
      brand_results: brandResults,
      measured_at: measuredAt,
      question_details: questionDetails
    };
  }

  /**
   * 3-Layer Mixed Goldilocks Sampling
   */
  private _sampleQuestions(
    questions: SeedProbeQuestion[],
    count: number,
    domainConfig: DomainConfig
  ): SeedProbeQuestion[] {
    const brands = domainConfig.brands;
    const genericLayers = new Set(['L1_universal', 'L3_ingredient', 'L5_ymyl', 'L6_trend']);
    
    const genericQuestions = questions.filter(q => genericLayers.has(q.layer || 'unknown') || !q.layer);
    const l2Questions = questions.filter(q => q.layer === 'L2_competitive');
    const l7Questions = questions.filter(q => q.layer === 'L7_brand');

    const selected: SeedProbeQuestion[] = [];
    const selectedTexts = new Set<string>();

    const add = (q: SeedProbeQuestion): boolean => {
      if (!selectedTexts.has(q.question_text)) {
        selected.push(q);
        selectedTexts.add(q.question_text);
        return true;
      }
      return false;
    };

    // 1. L7_brand
    if (l7Questions.length > 0) {
      for (const brand of brands) {
        const cand = l7Questions.filter(q => q.question_text.includes('{brand}') || q.target_keyword?.includes('{brand}') || q.question_text.includes(brand.name));
        const bq = cand.length > 0 ? cand[Math.floor(Math.random() * cand.length)] : l7Questions[Math.floor(Math.random() * l7Questions.length)];
        
        const cloned = JSON.parse(JSON.stringify(bq)) as SeedProbeQuestion;
        cloned.question_text = cloned.question_text.replace(/{brand}/g, brand.name);
        cloned.target_keyword = (cloned.target_keyword || '').replace(/{brand}/g, brand.name);
        if (cloned.must_include) cloned.must_include = cloned.must_include.map((t: string) => t.replace(/{brand}/g, brand.name));
        if (cloned.should_include) cloned.should_include = cloned.should_include.map((t: string) => t.replace(/{brand}/g, brand.name));
        add(cloned);
      }
    }

    // 2. L2_competitive
    if (l2Questions.length > 0) {
      for (const brand of brands) {
        const cand = l2Questions.filter(q => q.question_text.includes('{brand}') || q.target_keyword?.includes('{brand}') || q.question_text.includes(brand.name));
        const bq = cand.length > 0 ? cand[Math.floor(Math.random() * cand.length)] : l2Questions[Math.floor(Math.random() * l2Questions.length)];
        
        const competitors = brands.filter(b => b.name !== brand.name);
        const randomCompetitor = competitors.length > 0 ? competitors[Math.floor(Math.random() * competitors.length)].name : '타 브랜드';

        const cloned = JSON.parse(JSON.stringify(bq)) as SeedProbeQuestion;
        cloned.question_text = cloned.question_text.replace(/{brand}/g, brand.name).replace(/{competitor}/g, randomCompetitor);
        cloned.target_keyword = (cloned.target_keyword || '').replace(/{brand}/g, brand.name).replace(/{competitor}/g, randomCompetitor);
        if (cloned.must_include) cloned.must_include = cloned.must_include.map((t: string) => t.replace(/{brand}/g, brand.name).replace(/{competitor}/g, randomCompetitor));
        if (cloned.should_include) cloned.should_include = cloned.should_include.map((t: string) => t.replace(/{brand}/g, brand.name).replace(/{competitor}/g, randomCompetitor));
        add(cloned);
      }
    }

    // 3. Generic
    const shuffledGeneric = [...genericQuestions].sort(() => Math.random() - 0.5);
    for (const q of shuffledGeneric) {
      if (selected.length >= count) break;
      add(q);
    }

    return selected.sort(() => Math.random() - 0.5);
  }
}
