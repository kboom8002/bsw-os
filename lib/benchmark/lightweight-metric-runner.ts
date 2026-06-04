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

export interface LightweightBrandResult {
  brand_slug: string;
  brand_name: string;
  engine_name: string;
  aas: number;          // 0-100
  ocr: number;          // 0-100
  bsf: number;          // 0-100
  bair: number;         // 0-100
  mention_count: number;
  citation_count: number;
  sample_size: number;
  measured_at: string;
}

export interface LightweightDomainResult {
  domain_slug: string;
  domain_name: string;
  measurement_type: 'daily_light' | 'weekly_full';
  engines: string[];
  brand_results: LightweightBrandResult[];
  measured_at: string;
}

/**
 * 단일 응답에서 브랜드 키워드 AAS 산출 (pure text matching)
 */
function calcAAS(responseText: string, keywords: string[]): boolean {
  const text = responseText.toLowerCase();
  return keywords.some(kw => text.includes(kw.toLowerCase()));
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
    const queryResults: Map<string, Record<string, { text: string; citations: any[] }>> = new Map();

    for (const q of sampledQuestions) {
      const queryText = q.question_text.replace(/{brand}/g, ''); // brand placeholder 제거
      console.log(`  → Query: "${queryText}"`);

      try {
        // 모든 브랜드가 공유하는 단일 API 호출
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
        console.warn(`  ⚠ Query failed: ${err.message}`);
        queryResults.set(q.question_text, {});
      }
    }

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
          mention_count: 0, citation_count: 0,
          sample_size: sampledQuestions.length,
          measured_at: measuredAt,
        });
        continue;
      }

      const mentionCount = compositeResults.filter(r => r.aas).length;
      const citationCount = compositeResults.filter(r => r.ocr).length;
      const aas = parseFloat(((mentionCount / compositeResults.length) * 100).toFixed(1));
      const ocr = parseFloat(((citationCount / compositeResults.length) * 100).toFixed(1));
      const bsf = parseFloat((compositeResults.reduce((s, r) => s + r.bsf, 0) / compositeResults.length).toFixed(1));
      const bair = parseFloat((aas * (bsf / 100)).toFixed(1));

      brandResults.push({
        brand_slug: brand.slug,
        brand_name: brand.name,
        engine_name: 'composite',
        aas, ocr, bsf, bair,
        mention_count: mentionCount,
        citation_count: citationCount,
        sample_size: sampledQuestions.length,
        measured_at: measuredAt,
      });

      console.log(`    [${brand.name}] AAS: ${aas}% | OCR: ${ocr}% | BSF: ${bsf}% | BAIR: ${bair}`);
    }

    return {
      domain_slug: domainConfig.slug,
      domain_name: domainConfig.name,
      measurement_type: measurementType,
      engines: this.engines,
      brand_results: brandResults,
      measured_at: measuredAt,
    };
  }

  /**
   * L7 브랜드 우선 및 가중 레이어 샘플링 (브랜드당 최소 1개 L7 보장)
   */
  private _sampleQuestions(
    questions: SeedProbeQuestion[],
    count: number,
    domainConfig: DomainConfig
  ): SeedProbeQuestion[] {
    if (questions.length <= count) return [...questions];

    const selected: SeedProbeQuestion[] = [];
    const selectedTexts = new Set<string>();

    const add = (q: SeedProbeQuestion) => {
      if (!selectedTexts.has(q.question_text)) {
        selected.push(q);
        selectedTexts.add(q.question_text);
        return true;
      }
      return false;
    };

    // 1. 레이어별 분류
    const l7Questions = questions.filter(q => q.layer === 'L7_brand');
    const l2Questions = questions.filter(q => q.layer === 'L2_competitive');
    const otherQuestions = questions.filter(q => q.layer !== 'L7_brand' && q.layer !== 'L2_competitive');

    // 2. 브랜드 매칭 헬퍼
    const matchBrand = (q: SeedProbeQuestion, brand: any) => {
      const text = (q.question_text + ' ' + (q.target_keyword || '')).toLowerCase();
      return brand.keywords.some((kw: string) => text.includes(kw.toLowerCase()));
    };

    // 3. 브랜드당 1개의 L7 질문 우선 확보
    domainConfig.brands.forEach(brand => {
      const brandL7Qs = l7Questions.filter(q => matchBrand(q, brand));
      if (brandL7Qs.length > 0) {
        const randomQ = brandL7Qs[Math.floor(Math.random() * brandL7Qs.length)];
        add(randomQ);
      }
    });

    // 4. 목표 레이어 분포 계산 (L7: 50%, L2: 30%, 기타: 20%)
    const targetL7 = Math.round(count * 0.5);
    const targetL2 = Math.round(count * 0.3);
    const targetOther = count - targetL7 - targetL2;

    // L7 질문 추가 채우기 (목표치까지)
    const remainingL7 = l7Questions.filter(q => !selectedTexts.has(q.question_text));
    const shuffledL7 = [...remainingL7].sort(() => Math.random() - 0.5);
    const currentL7Count = selected.length;
    const needL7 = Math.max(0, targetL7 - currentL7Count);
    for (let i = 0; i < Math.min(needL7, shuffledL7.length); i++) {
      add(shuffledL7[i]);
    }

    // L2 경쟁 질문 채우기 (목표치까지)
    const shuffledL2 = [...l2Questions].sort(() => Math.random() - 0.5);
    let l2Added = 0;
    for (const q of shuffledL2) {
      if (l2Added >= targetL2) break;
      if (add(q)) l2Added++;
    }

    // 기타 질문 채우기 (목표치까지)
    const shuffledOther = [...otherQuestions].sort(() => Math.random() - 0.5);
    let otherAdded = 0;
    for (const q of shuffledOther) {
      if (otherAdded >= targetOther) break;
      if (add(q)) otherAdded++;
    }

    // 슬롯이 남을 경우 미선택 질문 중 무작위로 채움
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
}
