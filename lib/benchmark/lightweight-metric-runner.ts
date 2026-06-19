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
import type { SeedProbeQuestion } from '../../db/seed/industry-panels/questions-data';
import { calculatePerLayerMetrics } from './per-layer-metrics';
import { fairProbeSetBuilder } from './fair-probe-templates';
import { calcWeightedAAS } from './mention-classifier';


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
    return this.finalizeResults(domainConfig, sampledQuestions, queryResults, measurementType);
  }

  private _sampleQuestions(
    questions: SeedProbeQuestion[],
    count: number,
    domainConfig: DomainConfig
  ): SeedProbeQuestion[] {
    const brands = domainConfig.brands;
    const genericLayers = new Set(['L1_universal', 'L3_ingredient', 'L5_ymyl', 'L6_trend']);
    
    // Extract generic questions only (we don't need l2/l7 from questions-data.ts anymore)
    const genericQuestions = questions.filter(q => genericLayers.has(q.layer || 'unknown') || !q.layer);
    
    // Use fairProbeSetBuilder to dynamically inject K=2 repetitions of L2/L7
    
    const isPlaceBrand = domainConfig.slug.startsWith('seoul_district');
    const isKpop = domainConfig.slug.startsWith('kpop');
    const lang = domainConfig.slug.endsWith('_en') ? 'en' : 'ko';
    const kCount = domainConfig.repetitionCount ?? 2;
    return fairProbeSetBuilder(genericQuestions, Math.floor(count / 2), brands, kCount, isPlaceBrand, lang as any, isKpop);

  }
}
