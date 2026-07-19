import { getSupabaseAdminClient } from '../supabase';
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
import { MEASUREMENT_PROFILE_LAYERS } from './domain-config';
import type { SeedProbeQuestion } from '../../db/seed/industry-panels/questions-data';
import { calculatePerLayerMetrics } from './per-layer-metrics';
import { fairProbeSetBuilder } from './fair-probe-templates';
import { calcWeightedAAS } from './mention-classifier';
import { llmJudge } from './llm-judge';
import { calculateFreshnessMetrics } from './freshness-analyzer';

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
  top3?: number;       // 0-100 Top-3 Presence Rate
  top5?: number;       // 0-100 Top-5 Presence Rate
  freshness?: number;  // 0-100 Freshness Score
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
    search_queries?: string[];
    llm_cwr_winner?: string;
    llm_bsf_score?: number;
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
export function calcAAS_old(responseText: string, keywords: string[]): boolean {
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
export function calcOCR(
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
export function calcBSF(responseText: string, mustInclude: string[], shouldInclude: string[]): number {
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

    // 역방향 환류 (QIS/PA/Hub 데이터로 프로브 강화)
    let enrichment;
    try {
      const { ProbeEnricher } = await import('./probe-enricher');
      const enricher = new ProbeEnricher();
      enrichment = await enricher.enrich(domainConfig.slug);
    } catch (e: any) {
      console.warn(`[LightweightRunner] Dynamic enrichment skipped: ${e.message}`);
    }

    const sampledQuestions = this._sampleQuestions(questions, sampleCount, domainConfig, enrichment);

    console.log(`\n[LightweightRunner] Domain: ${domainConfig.name} | ${sampledQuestions.length}Q × ${this.engines.length} engines`);

    // 모든 질문을 한 번만 API 호출하여 공유 (비용 절감)
    // 병렬 배치 처리: 5개 질문씩 동시 실행하여 순차 실행 대비 ~5배 속도 향상
    const queryResults: Map<string, Record<string, { text: string; citations: any[]; search_queries?: string[] }>> = new Map();
    const BATCH_SIZE = 5;

    for (let batchStart = 0; batchStart < sampledQuestions.length; batchStart += BATCH_SIZE) {
      const batch = sampledQuestions.slice(batchStart, batchStart + BATCH_SIZE);
      console.log(`  → Batch ${Math.floor(batchStart / BATCH_SIZE) + 1}/${Math.ceil(sampledQuestions.length / BATCH_SIZE)} (${batch.length}Q)`);

      await Promise.all(batch.map(async (q) => {
        const queryText = q.question_text.replace(/{brand}/g, '').trim();
        try {
          const multiRes = await SearchProviderFactory.runMultiEngine(queryText, this.engines);
          const perEngineResult: Record<string, { text: string; citations: any[]; search_queries?: string[]; llm_cwr_winner?: string; llm_bsf_score?: number; }> = {};
          for (const engine of this.engines) {
            const engineRes = multiRes.results[engine];
            if (engineRes) {
              let llm_cwr_winner;
              let llm_bsf_score;

              if (q.layer === 'L2_competitive' || q.layer === 'L7_brand') {
                const targetBrand = (q as any).target_brand || 'TargetBrand';
                const competitorBrand = (q as any).target_competitor;
                try {
                  const judgeRes = await llmJudge.evaluate(queryText, engineRes.raw_response_text, targetBrand, competitorBrand, q.must_include);
                  llm_cwr_winner = judgeRes.cwr_winner ?? undefined;
                  llm_bsf_score = judgeRes.bsf_score;
                } catch (e) {
                  console.error('LLM Judge failed', e);
                }
              }

              perEngineResult[engine] = {
                text: engineRes.raw_response_text,
                citations: engineRes.citations || [],
                search_queries: engineRes.response_metadata?.search_queries,
                llm_cwr_winner,
                llm_bsf_score
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

    return this.finalizeResults(domainConfig, sampledQuestions, queryResults, measurementType);
  }

  /**
   * 3-Layer Mixed Goldilocks Sampling
   */

  async startBackground(
    workspaceId: string,
    domainSlug: string,
    domainConfig: DomainConfig,
    questions: SeedProbeQuestion[],
    measurementType: 'daily_light' | 'weekly_full' = 'daily_light',
    targetBrandSlug?: string
  ): Promise<string> {
    const supabase = getSupabaseAdminClient();
    const sampleCount = measurementType === 'daily_light'
      ? domainConfig.sampleQuestionsForLight
      : domainConfig.sampleQuestionsForFull;
    const sampledQuestions = this._sampleQuestions(questions, sampleCount, domainConfig);
    
    const { data, error } = await supabase.from('benchmark_sessions').insert({
      workspace_id: workspaceId,
      domain_slug: domainSlug,
      status: 'running',
      total_queries: sampledQuestions.length,
      completed_queries: 0,
      saved_state: {
        sampledQuestions,
        queryResults: {},
        batchStart: 0,
        measurementType,
        targetBrandSlug
      }
    }).select('session_id').single();
    
    if (error || !data) throw new Error('Failed to create benchmark session: ' + error?.message);
    
    // start background processing asynchronously
    this.processBackground(data.session_id, workspaceId, domainConfig, questions).catch(console.error);
    return data.session_id;
  }

  async resume(
    sessionId: string,
    savedState: any,
    domainConfig: DomainConfig,
    questions: SeedProbeQuestion[],
    workspaceId: string
  ): Promise<void> {
    this.processBackground(sessionId, workspaceId, domainConfig, questions).catch(console.error);
  }

  private async processBackground(
    sessionId: string,
    workspaceId: string,
    domainConfig: DomainConfig,
    questions: SeedProbeQuestion[]
  ) {
    const supabase = getSupabaseAdminClient();
    const { data: session } = await supabase.from('benchmark_sessions').select('*').eq('session_id', sessionId).single();
    if (!session || session.status !== 'running') return;
    
    let { sampledQuestions, queryResults: savedResults, batchStart, measurementType, targetBrandSlug } = session.saved_state;
    const queryResults: Map<string, Record<string, { text: string; citations: any[] }>> = new Map(Object.entries(savedResults || {}));
    const BATCH_SIZE = 5;

    for (let i = batchStart; i < sampledQuestions.length; i += BATCH_SIZE) {
      // Check status before continuing
      const { data: currentSession } = await supabase.from('benchmark_sessions').select('status').eq('session_id', sessionId).single();
      if (currentSession?.status !== 'running') return;

      const batch = sampledQuestions.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(async (q: any) => {
        const queryText = q.question_text.replace(/{brand}/g, '').trim();
        try {
          const multiRes = await SearchProviderFactory.runMultiEngine(queryText, this.engines);
          const perEngineResult: Record<string, { text: string; citations: any[]; search_queries?: string[]; llm_cwr_winner?: string; llm_bsf_score?: number; }> = {};
          for (const engine of this.engines) {
            const engineRes = multiRes.results[engine];
            if (engineRes) {
              let llm_cwr_winner;
              let llm_bsf_score;

              if (q.layer === 'L2_competitive' || q.layer === 'L7_brand') {
                const targetBrand = (q as any).target_brand || 'TargetBrand';
                const competitorBrand = (q as any).target_competitor;
                try {
                  const judgeRes = await llmJudge.evaluate(queryText, engineRes.raw_response_text, targetBrand, competitorBrand, q.must_include);
                  llm_cwr_winner = judgeRes.cwr_winner ?? undefined;
                  llm_bsf_score = judgeRes.bsf_score;
                } catch (e) {
                  console.error('LLM Judge failed', e);
                }
              }

              perEngineResult[engine] = {
                text: engineRes.raw_response_text,
                citations: engineRes.citations || [],
                search_queries: engineRes.response_metadata?.search_queries,
                llm_cwr_winner,
                llm_bsf_score
              };
            }
          }
          queryResults.set(q.question_text, perEngineResult);
        } catch (err: any) {
          queryResults.set(q.question_text, {});
        }
      }));
      
      // Save state
      await supabase.from('benchmark_sessions').update({
        completed_queries: Math.min(i + BATCH_SIZE, sampledQuestions.length),
        saved_state: {
          sampledQuestions,
          queryResults: Object.fromEntries(queryResults),
          batchStart: i + BATCH_SIZE,
          measurementType,
          targetBrandSlug
        }
      }).eq('session_id', sessionId);
    }
    
    // Process results
    const result = await this.finalizeResults(domainConfig, sampledQuestions, queryResults, measurementType);
    
    // Save to industry_benchmark_snapshots
    const records = result.brand_results.map((br: any) => ({
      workspace_id: workspaceId,
      domain_slug: domainConfig.slug,
      brand_slug: br.brand_slug,
      brand_name: br.brand_name,
      engine_name: br.engine_name,
      aas: br.aas,
      ocr: br.ocr,
      bsf: br.bsf,
      ars: null,
      bair: br.bair,
      // Per-Layer Metrics
      iri: br.iri ?? null,
      bdr: br.bdr ?? null,
      cwr: br.cwr ?? null,
      opp: br.opp ?? null,
      // Top-N Presence & Freshness
      top3: br.top3 ?? null,
      top5: br.top5 ?? null,
      freshness: br.freshness ?? null,
      mention_count: br.mention_count,
      citation_count: br.citation_count,
      sample_size: br.sample_size,
      measurement_type: measurementType,
      measured_at: br.measured_at,
    }));
    await supabase.from('industry_benchmark_snapshots').insert(records);
    
    await supabase.from('benchmark_sessions').update({ status: 'completed' }).eq('session_id', sessionId);
  }


  private async finalizeResults(
    domainConfig: DomainConfig,
    sampledQuestions: SeedProbeQuestion[],
    queryResults: Map<string, Record<string, { text: string; citations: any[] }>>,
    measurementType: 'daily_light' | 'weekly_full'
  ): Promise<LightweightDomainResult> {
    const measuredAt = new Date().toISOString();
    const brandResults: LightweightBrandResult[] = [];
    const GENERIC_LAYERS = new Set(['L1_universal', 'L3_ingredient', 'L5_ymyl', 'L6_trend']);

    // 1. Build Question Details and run LLM Context Validation asynchronously
    const questionDetails: QuestionDetail[] = [];
    for (const [_qText, engineResults] of queryResults.entries()) {
      const q = sampledQuestions.find(sq => sq.question_text === _qText);
      if (!q) continue;

      const detail: QuestionDetail = {
        question_text: q.question_text,
        question_type: q.question_type || 'general',
        layer: q.layer || 'unknown',
        per_engine: {}
      };

      for (const engine of this.engines) {
        const res = engineResults[engine];
        if (!res) continue;

        const mentioned: string[] = [];
        for (const b of domainConfig.brands) {
          let hit = calcWeightedAAS(res.text, b.keywords).hit;
          if (hit) {
            const qAny = q as any;
            if (q.layer === 'L2_competitive') {
              if (qAny.target_brand !== b.name && qAny.target_competitor !== b.name) hit = false;
            } else if (q.layer === 'L7_brand') {
              if (qAny.target_brand !== b.name) hit = false;
            } else if ((q.layer && GENERIC_LAYERS.has(q.layer)) || !q.layer) {
              // LLM context validation for generic L1, L3, L5, L6 layers to weed out negative comparisons
              try {
                const validation = await llmJudge.validateMentionContext(q.question_text, res.text, b.name);
                if (validation === 'dismissed' || validation === 'negative') {
                  hit = false;
                }
              } catch (e) {
                console.error(`[LightweightRunner] LLM mention context validation failed for ${b.name}:`, e);
              }
            }
          }
          if (hit) {
            mentioned.push(b.name);
          }
        }

        const domains = res.citations.map(c => c.domain);
        const bsf = calcBSF(res.text, q.must_include || [], q.should_include || []);

        detail.per_engine[engine] = {
          raw_response_text: res.text,
          brands_mentioned: mentioned,
          citation_domains: domains,
          bsf_score: bsf,
          search_queries: (res as any).search_queries,
          llm_cwr_winner: (res as any).llm_cwr_winner,
          llm_bsf_score: (res as any).llm_bsf_score
        };
      }
      questionDetails.push(detail);
    }

    // 2. Compute brandedResponseCount for AIPR denominator
    let brandedResponseCount = 0;
    for (const qd of questionDetails) {
      for (const engine of this.engines) {
        const resDetail = qd.per_engine[engine];
        if (resDetail && resDetail.brands_mentioned.length > 0) {
          brandedResponseCount++;
        }
      }
    }
    console.log(`\n  [AIPR] branded responses: ${brandedResponseCount} / ${queryResults.size * this.engines.length} total`);

    // 3. Aggregate results per brand
    for (const brand of domainConfig.brands) {
      // Set brand domains for citations
      SearchProviderFactory.setBrandDomains(brand.domains);

      const compositeResults: Array<{
        aas: boolean; ocr: boolean; bsf: number;
      }> = [];

      for (const qd of questionDetails) {
        for (const engine of this.engines) {
          const resDetail = qd.per_engine[engine];
          if (!resDetail) continue;

          const aasHit = resDetail.brands_mentioned.includes(brand.name);
          // Retrieve the raw response for OCR check
          const rawQ = queryResults.get(qd.question_text)?.[engine];
          const ocrHit = rawQ ? calcOCR(rawQ.citations, brand.domains) : false;
          const bsf = resDetail.bsf_score;

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
          top3: 0, top5: 0, freshness: 0,
          mention_count: 0, citation_count: 0,
          sample_size: sampledQuestions.length,
          measured_at: measuredAt,
        });
        continue;
      }

      const mentionCount = compositeResults.filter(r => r.aas).length;
      const citationCount = compositeResults.filter(r => r.ocr).length;

      const aiprDenominator = brandedResponseCount > 0 ? brandedResponseCount : compositeResults.length;
      const aas = parseFloat(((mentionCount / aiprDenominator) * 100).toFixed(1));
      const ocr = parseFloat(((citationCount / compositeResults.length) * 100).toFixed(1));
      const bsf = parseFloat((compositeResults.reduce((s, r) => s + r.bsf, 0) / compositeResults.length).toFixed(1));
      const bair = parseFloat((aas * (bsf / 100)).toFixed(1));

      // Calculate Advanced Metrics using the single unified questionDetails array
      const advanced = calculatePerLayerMetrics(brand, questionDetails, sampledQuestions, 'composite');

      // Freshness Score
      const brandResponseTexts: string[] = [];
      for (const qd of questionDetails) {
        for (const eng of this.engines) {
          const resDetail = qd.per_engine[eng];
          if (resDetail?.raw_response_text) {
            brandResponseTexts.push(resDetail.raw_response_text);
          }
        }
      }
      const freshnessResult = calculateFreshnessMetrics(brandResponseTexts);

      brandResults.push({
        brand_slug: brand.slug,
        brand_name: brand.name,
        engine_name: 'composite',
        aas, ocr, bsf, bair,
        bdr: advanced.bdr, cwr: advanced.cwr, iri: advanced.iri, opp: advanced.opp,
        top3: advanced.top3, top5: advanced.top5,
        freshness: freshnessResult.freshnessScore,
        mention_count: mentionCount,
        citation_count: citationCount,
        sample_size: sampledQuestions.length,
        measured_at: measuredAt,
      });

      console.log(`    [${brand.name}] AAS: ${aas}% | BDR: ${advanced.bdr}% | CWR: ${advanced.cwr}% | Top3: ${advanced.top3}% | Top5: ${advanced.top5}% | Fresh: ${freshnessResult.freshnessScore}% | IRI: ${advanced.iri}%`);
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
  private _sampleQuestions(
    questions: SeedProbeQuestion[],
    count: number,
    domainConfig: DomainConfig,
    enrichment?: {
      qis_injected_must_include: string[];
      pa_dynamic_probes: any[];
      hub_priority_weights: Map<string, number>;
      tco_discovered_keywords: string[];
    }
  ): SeedProbeQuestion[] {
    const brands = domainConfig.brands;
    
    const isPlaceBrand = domainConfig.slug.startsWith('seoul_district') || domainConfig.slug.startsWith('jeju_place') || domainConfig.slug.startsWith('jeju_attraction');
    const isKpop = domainConfig.slug.startsWith('kpop');
    const lang = domainConfig.slug.endsWith('_en') ? 'en' : 'ko';
    const kCount = domainConfig.repetitionCount ?? 2;
    const profile = domainConfig.measurementProfile || 'full_audit';
    const activeLayers = MEASUREMENT_PROFILE_LAYERS[profile];

    // Filter questions by active layers in measurement profile
    const filteredQuestions = questions.filter(q => {
      const layer = q.layer || 'L1_universal';
      return activeLayers.has(layer);
    });

    console.log(`[LightweightRunner] Profile "${profile}": ${filteredQuestions.length}/${questions.length} questions active`);
    
    // 1. 일반적인 샘플러 실행
    let baseProbes = fairProbeSetBuilder(filteredQuestions, Math.floor(count / 2), brands, kCount, isPlaceBrand, lang as any, isKpop, profile);

    // 2. 채널①: QIS Scene must_include 주입
    if (enrichment?.qis_injected_must_include && enrichment.qis_injected_must_include.length > 0) {
      baseProbes = baseProbes.map(q => {
        if (q.layer === 'L7_brand' || q.layer === 'L2_competitive' || q.layer === 'L4_practical') {
          const merged = Array.from(new Set([...(q.must_include || []), ...enrichment.qis_injected_must_include]));
          return { ...q, must_include: merged };
        }
        return q;
      });
    }

    // 3. 채널②: PA Dynamic Probes 추가
    if (enrichment?.pa_dynamic_probes && enrichment.pa_dynamic_probes.length > 0) {
      console.log(`[LightweightRunner] Injecting ${enrichment.pa_dynamic_probes.length} PA dynamic templates...`);
      for (const brand of brands) {
        for (const template of enrichment.pa_dynamic_probes) {
          if (template.layer === 'L7_brand') {
            const questionText = template.template_text.replace(/{brand}/g, brand.name);
            const basicMustInclude = template.must_include_templates.map((t: string) => t.replace(/{brand}/g, brand.name));
            const finalMustInclude = enrichment.qis_injected_must_include
              ? Array.from(new Set([...basicMustInclude, ...enrichment.qis_injected_must_include]))
              : basicMustInclude;

            baseProbes.push({
              question_text: questionText,
              target_keyword: brand.name,
              must_include: finalMustInclude,
              should_include: [],
              must_not_do: template.must_not_do,
              layer: 'L7_brand',
              intent_context: template.intent_context,
              risk_level: template.risk_level,
              decision_stage: template.decision_stage,
              question_type: template.question_type,
              weight: template.weight,
              target_brand: brand.name
            } as any);
          } else if (template.layer === 'L2_competitive') {
            const competitors = brands.filter(b => b.name !== brand.name);
            if (competitors.length > 0) {
              const competitor = competitors[Math.floor(Math.random() * competitors.length)].name;
              const questionText = template.template_text.replace(/{brand}/g, brand.name).replace(/{competitor}/g, competitor);
              const basicMustInclude = template.must_include_templates.map((t: string) => t.replace(/{brand}/g, brand.name).replace(/{competitor}/g, competitor));
              const finalMustInclude = enrichment.qis_injected_must_include
                ? Array.from(new Set([...basicMustInclude, ...enrichment.qis_injected_must_include]))
                : basicMustInclude;

              baseProbes.push({
                question_text: questionText,
                target_keyword: brand.name,
                must_include: finalMustInclude,
                should_include: [],
                must_not_do: template.must_not_do,
                layer: 'L2_competitive',
                intent_context: template.intent_context,
                risk_level: template.risk_level,
                decision_stage: template.decision_stage,
                question_type: template.question_type,
                weight: template.weight,
                target_brand: brand.name,
                target_competitor: competitor
              } as any);
            }
          }
        }
      }
    }

    return baseProbes;
  }
}
