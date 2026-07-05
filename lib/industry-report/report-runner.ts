/**
 * lib/industry-report/report-runner.ts
 *
 * IndustryReportRunner — 업종별 AEO/GEO 경쟁 리포트 생성 오케스트레이터.
 *
 * 파이프라인:
 *   Step 1: 프로브 세트 생성 (buildForIndustryReport)
 *   Step 2: Multi-Engine AI 호출 (SearchProviderFactory.runMultiEngine)
 *   Step 3: 브랜드별 지표 산출 (BAIR·Per-Layer·AEPI)
 *   Step 4: 경쟁 포지셔닝 (AIPR 랭킹·4사분면)
 *   Step 5: 시계열 비교 (TemporalTracker)
 *   Step 6: DB 저장 (industry_report_snapshots + industry_report_brand_rankings)
 */

import { getSupabaseAdminClient } from '../supabase';
import { SearchProviderFactory } from '../ai/search-provider-factory';
import { AepiCalculator } from '../benchmark/aepi-calculator';
import { calculatePerLayerMetrics } from '../benchmark/per-layer-metrics';
import { buildForIndustryReport, type IndustryReportProbeOptions } from '../benchmark/fair-probe-templates';
import { calcWeightedAAS } from '../benchmark/mention-classifier';
import { analyzeFreshness } from '../benchmark/freshness-analyzer';
import { getBrandPosition } from '../benchmark/per-layer-metrics';
import {
  calculatePositionMatrix,
  type BrandBdrCwr,
  type PositionMatrixResult,
} from './competitive-position-matrix';
import {
  buildRankingRows,
  buildRadarChartData,
  buildExecutiveSummary,
  buildTimeSeriesData,
  type IndustryReportData,
} from './report-data-builder';
import type { IndustryReportSnapshot, IndustryReportBrandRanking } from '../schema';
import { INDUSTRY_PANELS_DATA } from '../../db/seed/industry-panels/questions-data';
import { getMacroKey } from '../industry/industry-taxonomy';

// ═══════════════════════════════════════════════════════════════
// 타입 정의
// ═══════════════════════════════════════════════════════════════

export interface ReportBrandInput {
  /** 브랜드 slug (DB 키) */
  slug: string;
  /** 표시용 브랜드명 (한국어) */
  name: string;
  /** OCR 측정용 공식 도메인 배열 */
  domains: string[];
  /** AAS 측정용 키워드 배열 */
  keywords: string[];
}

export interface IndustryReportOptions {
  /** AI 엔진 목록 (default: ['chatgpt', 'gemini', 'perplexity']) */
  engines?: string[];
  /** 리포트 기간 레이블 (default: 자동 생성 "YYYY-QN") */
  reportPeriod?: string;
  /** 프로브 세트 옵션 */
  probeOptions?: IndustryReportProbeOptions;
  /** 전분기 리포트 ID (순위 비교용) */
  prevReportId?: string;
  /** Gap Analysis 포함 여부 (default: true) */
  includeGapAnalysis?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// 유틸리티
// ═══════════════════════════════════════════════════════════════

function getCurrentReportPeriod(): string {
  const now = new Date();
  const year = now.getFullYear();
  const quarter = Math.ceil((now.getMonth() + 1) / 3);
  return `${year}-Q${quarter}`;
}

function clamp(v: number): number {
  return Math.min(100, Math.max(0, v));
}

/** 텍스트에서 브랜드 언급 여부 확인 (한국어/영어 모두 지원) */
function hasBrandMention(text: string, brand: ReportBrandInput): boolean {
  const lower = text.toLowerCase();
  return brand.keywords.some((kw) => lower.includes(kw.toLowerCase()));
}

/** 텍스트에서 Citation 도메인 매칭 */
function hasDomainCitation(citations: any[], brand: ReportBrandInput): boolean {
  return citations.some((c) => {
    const url: string = (c.url || c.link || c.source || '').toLowerCase();
    return brand.domains.some((d) => url.includes(d.toLowerCase()));
  });
}

// ═══════════════════════════════════════════════════════════════
// IndustryReportRunner 메인 클래스
// ═══════════════════════════════════════════════════════════════

export class IndustryReportRunner {
  /**
   * 업종별 AEO/GEO 경쟁 리포트 생성
   *
   * @param workspaceId - Supabase workspace ID (null이면 공개 리포트)
   * @param subIndustryKey - BSW 세부업종 키 ("skincare" | "wedding" ...)
   * @param brands - 측정 대상 브랜드 배열
   * @param options - 리포트 옵션
   * @returns 생성된 리포트 ID
   */
  static async generate(
    workspaceId: string | null,
    subIndustryKey: string,
    brands: ReportBrandInput[],
    options: IndustryReportOptions = {}
  ): Promise<{ reportId: string; data: IndustryReportData }> {
    const supabase = getSupabaseAdminClient();
    const engines = options.engines ?? ['chatgpt', 'gemini', 'perplexity'];
    const reportPeriod = options.reportPeriod ?? getCurrentReportPeriod();
    const macroKey = getMacroKey(subIndustryKey) ?? 'ecommerce_d2c';

    // ── Step 1: Draft 레코드 생성 ────────────────────────────
    const reportTitle = `${reportPeriod} ${subIndustryKey} AEO/GEO 경쟁 리포트`;
    const { data: draftSnap, error: snapErr } = await supabase
      .from('industry_report_snapshots')
      .insert({
        workspace_id: workspaceId,
        report_title: reportTitle,
        sub_industry_key: subIndustryKey,
        macro_category_key: macroKey,
        report_period: reportPeriod,
        total_brands: brands.length,
        engines_used: engines,
        status: 'generating',
        prev_report_id: options.prevReportId ?? null,
      })
      .select()
      .single();

    if (snapErr || !draftSnap) {
      throw new Error(`리포트 초안 생성 실패: ${snapErr?.message}`);
    }
    const reportId: string = draftSnap.id;

    try {
      // ── Step 2: 프로브 세트 생성 ────────────────────────────
      const panelData = INDUSTRY_PANELS_DATA[subIndustryKey as keyof typeof INDUSTRY_PANELS_DATA];
      const genericQuestions = panelData?.questions ?? [];

      const { probes, hash: probeSetHash } = buildForIndustryReport(
        genericQuestions,
        brands,
        options.probeOptions
      );

      // ── Step 3: Multi-Engine AI 호출 ─────────────────────────
      // 질문마다 모든 엔진에서 응답 수집
      const queryResults = new Map<string, Record<string, { text: string; citations: any[] }>>();

      const BATCH_SIZE = 5;
      for (let i = 0; i < probes.length; i += BATCH_SIZE) {
        const batch = probes.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map(async (q: any) => {
            try {
              const multiRes = await SearchProviderFactory.runMultiEngine(q.question_text, engines);
              const perEngine: Record<string, { text: string; citations: any[] }> = {};
              for (const engine of engines) {
                const res = multiRes.results?.[engine];
                if (res) {
                  perEngine[engine] = {
                    text: res.raw_response_text ?? '',
                    citations: res.citations ?? [],
                  };
                }
              }
              queryResults.set(q.question_text, perEngine);
            } catch {
              queryResults.set(q.question_text, {});
            }
          })
        );
      }

      const totalResponses = Array.from(queryResults.values())
        .reduce((sum, perEng) => sum + Object.keys(perEng).length, 0);

      // ── Step 4: 브랜드별 지표 산출 ───────────────────────────
      const brandMetricsMap = new Map<string, {
        bair: number; bsf: number; aas_w: number; ocr: number; mq: number;
        iri: number; bdr: number; cwr: number; opp: number;
        top3: number; top5: number; freshness: number;
        aepiScore: number; aepiDimensions: Record<string, number>;
        sampleSize: number; isEstimated: boolean;
      }>();

      for (const brand of brands) {
        // AAS (Brand Share of Voice — BSF)
        let mentionCount = 0;
        let citationCount = 0;
        let strongMentionCount = 0;
        let totalQCount = 0;
        let anyBrandMentionedCount = 0;  // IRI용
        let l7Total = 0;
        let l7Defended = 0;
        let l2Total = 0;
        let l2Won = 0;
        let l2Top3 = 0;
        let l2Top5 = 0;

        for (const [_qText, perEngine] of queryResults) {
          const probe = probes.find((p: any) => p.question_text === _qText);
          if (!probe) continue;
          totalQCount++;

          // 이 질문에서 어떤 브랜드라도 언급됐는지 (IRI용)
          let anyMentioned = false;
          for (const engine of engines) {
            const res = perEngine[engine];
            if (!res) continue;
            if (brands.some((b) => hasBrandMention(res.text, b))) {
              anyMentioned = true;
            }
            // 자사 브랜드 언급
            if (hasBrandMention(res.text, brand)) {
              mentionCount++;
            }
            // Citation
            if (hasDomainCitation(res.citations, brand)) {
              citationCount++;
            }
          }
          if (anyMentioned) anyBrandMentionedCount++;

          // L7 BDR
          if (probe.layer === 'L7_brand' && probe.target_brand === brand.name) {
            l7Total++;
            const defended = engines.some((eng) => {
              const res = perEngine[eng];
              return res && hasBrandMention(res.text, brand);
            });
            if (defended) l7Defended++;
          }

          // L2 CWR
          if (probe.layer === 'L2_competitive' && probe.target_brand === brand.name) {
            l2Total++;
            const competitor = probe.target_competitor ?? '';
            const won = engines.some((eng) => {
              const res = perEngine[eng];
              if (!res) return false;
              const brandIdx = res.text.toLowerCase().indexOf(brand.name.toLowerCase());
              const compIdx = competitor
                ? res.text.toLowerCase().indexOf(competitor.toLowerCase())
                : -1;
              return brandIdx !== -1 && (compIdx === -1 || brandIdx < compIdx);
            });
            if (won) l2Won++;

            // Top-N Position 산출
            for (const eng of engines) {
              const res = perEngine[eng];
              if (!res) continue;
              // 이 응답에서 언급된 모든 브랜드 수집
              const mentionedInResponse = brands
                .filter((b) => hasBrandMention(res.text, b))
                .map((b) => b.name);
              if (mentionedInResponse.includes(brand.name)) {
                const pos = getBrandPosition(res.text, brand.name, mentionedInResponse);
                if (pos <= 3) l2Top3++;
                if (pos <= 5) l2Top5++;
              }
              break; // 첫 번째 엔진 기준
            }
          }
        }

        const totalEngineResponses = totalQCount * engines.length;
        const bsf = totalEngineResponses > 0 ? clamp((mentionCount / totalEngineResponses) * 100) : 0;
        const ocr = totalEngineResponses > 0 ? clamp((citationCount / totalEngineResponses) * 100) : 0;
        const mq = mentionCount > 0 ? clamp((strongMentionCount / mentionCount) * 100) : 0;

        // Weighted AAS — 각 응답에서 calcWeightedAAS 결과를 평균
        let aasWeightSum = 0;
        let aasCount = 0;
        for (const [, perEngine] of queryResults) {
          for (const engine of engines) {
            const res = perEngine[engine];
            if (!res || !res.text) continue;
            const result = calcWeightedAAS(res.text, brand.keywords);
            aasWeightSum += result.weight;
            aasCount++;
          }
        }
        const aasW = aasCount > 0 ? clamp((aasWeightSum / aasCount) * 100) : 0;

        // Freshness Score
        let freshnessWeightSum = 0;
        let freshnessCount = 0;
        for (const [, perEngine] of queryResults) {
          for (const engine of engines) {
            const res = perEngine[engine];
            if (!res?.text) continue;
            const fr = analyzeFreshness(res.text);
            freshnessWeightSum += fr.weight;
            freshnessCount++;
          }
        }
        const freshness = freshnessCount > 0 ? clamp((freshnessWeightSum / freshnessCount) * 100) : 0;

        // IRI / BDR / CWR / OPP / Top-N
        const iri = totalQCount > 0 ? clamp((anyBrandMentionedCount / totalQCount) * 100) : 0;
        const opp = 100 - iri;
        const bdr = l7Total > 0 ? clamp((l7Defended / l7Total) * 100) : 0;
        const cwr = l2Total > 0 ? clamp((l2Won / l2Total) * 100) : 0;
        const top3 = l2Total > 0 ? clamp((l2Top3 / l2Total) * 100) : 0;
        const top5 = l2Total > 0 ? clamp((l2Top5 / l2Total) * 100) : 0;

        // BAIR V2 (가중 합산)
        const bair = clamp(0.35 * bsf + 0.25 * aasW + 0.20 * ocr + 0.10 * 0 + 0.10 * mq);

        // AEPI — entity reflection이 없으면 Per-Layer 기반 추정
        const aepiDimensions: Record<string, number> = {
          factoid: clamp(bsf * 0.8),
          procedural: clamp(bdr * 0.9),
          comparative: clamp(cwr),
          authority: clamp(ocr * 1.1),
          schema_org: 50, // 인프라 미측정 시 기본값
          topical_cluster: clamp((iri + bdr) / 2),
          local_geo: clamp(bdr * 0.7),
        };
        const aepiScore = clamp(
          Object.values(aepiDimensions).reduce((a, b) => a + b, 0) / 7
        );

        brandMetricsMap.set(brand.slug, {
          bair, bsf, aas_w: aasW, ocr, mq,
          iri, bdr, cwr, opp,
          top3, top5, freshness,
          aepiScore, aepiDimensions,
          sampleSize: totalQCount,
          isEstimated: totalQCount < 5,
        });
      }

      // ── Step 5: AIPR 랭킹 정렬 ───────────────────────────────
      const sortedBrands = brands
        .map((b) => ({
          brand: b,
          metrics: brandMetricsMap.get(b.slug)!,
        }))
        .filter((x) => x.metrics)
        .sort((a, b) => b.metrics.bair - a.metrics.bair);

      // 전분기 순위 조회
      let prevRankMap = new Map<string, number>();
      let prevBairMap = new Map<string, number>();
      if (options.prevReportId) {
        const { data: prevRankings } = await supabase
          .from('industry_report_brand_rankings')
          .select('brand_slug, rank_position, bair_score')
          .eq('report_id', options.prevReportId);
        if (prevRankings) {
          for (const r of prevRankings) {
            prevRankMap.set(r.brand_slug, r.rank_position);
            prevBairMap.set(r.brand_slug, r.bair_score);
          }
        }
      }

      // ── Step 6: 4사분면 포지셔닝 ─────────────────────────────
      const bdrCwrInputs: BrandBdrCwr[] = sortedBrands.map((item) => ({
        brand: item.brand.name,
        brandSlug: item.brand.slug,
        bdr: item.metrics.bdr,
        cwr: item.metrics.cwr,
        bairScore: item.metrics.bair,
        aepiScore: item.metrics.aepiScore,
      }));
      const positionMatrix: PositionMatrixResult = calculatePositionMatrix(bdrCwrInputs);

      // ── Step 7: 업종 레벨 집계 ───────────────────────────────
      const allMetrics = sortedBrands.map((x) => x.metrics);
      const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
      const industryIRI = avg(allMetrics.map((m) => m.iri));
      const industryOPP = avg(allMetrics.map((m) => m.opp));
      const industryAvgBair = avg(allMetrics.map((m) => m.bair));
      const industryAvgAepi = avg(allMetrics.map((m) => m.aepiScore));

      // ── Step 8: DB 저장 ───────────────────────────────────────
      // 랭킹 레코드 생성
      const rankingRecords: Omit<IndustryReportBrandRanking, 'id' | 'created_at'>[] =
        sortedBrands.map((item, idx) => {
          const rank = idx + 1;
          const prevRank = prevRankMap.get(item.brand.slug) ?? null;
          const prevBair = prevBairMap.get(item.brand.slug) ?? null;
          const matrixEntry = positionMatrix.entries.find(
            (e) => e.brandSlug === item.brand.slug
          );

          return {
            report_id: reportId,
            brand_name: item.brand.name,
            brand_slug: item.brand.slug,
            rank_position: rank,
            bair_score: Number(item.metrics.bair.toFixed(1)),
            aepi_score: Number(item.metrics.aepiScore.toFixed(1)),
            bsf: Number(item.metrics.bsf.toFixed(1)),
            aas_w: Number(item.metrics.aas_w.toFixed(1)),
            ocr: Number(item.metrics.ocr.toFixed(1)),
            mention_quality: Number(item.metrics.mq.toFixed(1)),
            iri: Number(item.metrics.iri.toFixed(1)),
            bdr: Number(item.metrics.bdr.toFixed(1)),
            cwr: Number(item.metrics.cwr.toFixed(1)),
            opp: Number(item.metrics.opp.toFixed(1)),
            top3: Number(item.metrics.top3.toFixed(1)),
            top5: Number(item.metrics.top5.toFixed(1)),
            freshness: Number(item.metrics.freshness.toFixed(1)),
            aepi_dimensions: item.metrics.aepiDimensions,
            prev_rank_position: prevRank,
            rank_change: prevRank !== null ? prevRank - rank : 0,
            bair_change: prevBair !== null ? Number((item.metrics.bair - prevBair).toFixed(1)) : 0,
            quadrant: matrixEntry?.quadrant ?? null,
            is_estimated: item.metrics.isEstimated,
            sample_size: item.metrics.sampleSize,
          };
        });

      await supabase.from('industry_report_brand_rankings').insert(rankingRecords);

      // 스냅샷 업데이트
      await supabase
        .from('industry_report_snapshots')
        .update({
          industry_iri: Number(industryIRI.toFixed(1)),
          industry_opp: Number(industryOPP.toFixed(1)),
          industry_avg_bair: Number(industryAvgBair.toFixed(1)),
          industry_avg_aepi: Number(industryAvgAepi.toFixed(1)),
          total_probes: probes.length,
          total_responses: totalResponses,
          probe_set_hash: probeSetHash,
          status: 'draft',
        })
        .eq('id', reportId);

      // ── Step 9: 리포트 데이터 조립 ───────────────────────────
      const finalSnapshot: IndustryReportSnapshot = {
        ...draftSnap,
        industry_iri: Number(industryIRI.toFixed(1)),
        industry_opp: Number(industryOPP.toFixed(1)),
        industry_avg_bair: Number(industryAvgBair.toFixed(1)),
        industry_avg_aepi: Number(industryAvgAepi.toFixed(1)),
        total_probes: probes.length,
        total_responses: totalResponses,
        probe_set_hash: probeSetHash,
        status: 'draft',
      };

      const rankings = rankingRecords.map((r, idx) => ({ ...r, id: `temp-${idx}`, created_at: new Date().toISOString() })) as IndustryReportBrandRanking[];
      const rankingRows = buildRankingRows(rankings);
      const radar = buildRadarChartData(rankings);
      const summary = buildExecutiveSummary(finalSnapshot, rankings);

      const data: IndustryReportData = {
        snapshot: finalSnapshot,
        summary,
        rankings: rankingRows,
        positionMatrix,
        radar,
        timeSeries: null,
      };

      return { reportId, data };

    } catch (err: any) {
      // 실패 시 스냅샷 상태 업데이트
      await supabase
        .from('industry_report_snapshots')
        .update({ status: 'draft' })
        .eq('id', reportId);
      throw err;
    }
  }

  /**
   * 기존 리포트 데이터 조회 (DB에서)
   */
  static async fetchReport(reportId: string): Promise<IndustryReportData | null> {
    const supabase = getSupabaseAdminClient();

    const { data: snapshot } = await supabase
      .from('industry_report_snapshots')
      .select('*')
      .eq('id', reportId)
      .single();

    if (!snapshot) return null;

    const { data: rankings } = await supabase
      .from('industry_report_brand_rankings')
      .select('*')
      .eq('report_id', reportId)
      .order('rank_position', { ascending: true });

    if (!rankings) return null;

    const rankingRows = buildRankingRows(rankings as IndustryReportBrandRanking[]);
    const radar = buildRadarChartData(rankings as IndustryReportBrandRanking[]);
    const summary = buildExecutiveSummary(snapshot as IndustryReportSnapshot, rankings as IndustryReportBrandRanking[]);
    const bdrCwrInputs: BrandBdrCwr[] = rankings.map((r: any) => ({
      brand: r.brand_name,
      brandSlug: r.brand_slug,
      bdr: r.bdr ?? 0,
      cwr: r.cwr ?? 0,
      bairScore: r.bair_score,
    }));
    const positionMatrix = calculatePositionMatrix(bdrCwrInputs);

    // 시계열: 이전 리포트들 조회
    let timeSeries = null;
    if (snapshot.prev_report_id) {
      const historicalReports: Array<{ snapshot: IndustryReportSnapshot; rankings: IndustryReportBrandRanking[] }> = [];

      let currentPrevId: string | null = snapshot.prev_report_id;
      for (let i = 0; i < 4 && currentPrevId; i++) {
        const { data: prevSnap } = await supabase
          .from('industry_report_snapshots')
          .select('*')
          .eq('id', currentPrevId)
          .single();
        if (!prevSnap) break;

        const { data: prevRankings } = await supabase
          .from('industry_report_brand_rankings')
          .select('*')
          .eq('report_id', currentPrevId);

        if (prevRankings) {
          historicalReports.unshift({
            snapshot: prevSnap as IndustryReportSnapshot,
            rankings: prevRankings as IndustryReportBrandRanking[],
          });
        }
        currentPrevId = (prevSnap as any).prev_report_id ?? null;
      }

      // 현재 리포트도 포함
      historicalReports.push({
        snapshot: snapshot as IndustryReportSnapshot,
        rankings: rankings as IndustryReportBrandRanking[],
      });

      if (historicalReports.length >= 2) {
        timeSeries = buildTimeSeriesData(historicalReports);
      }
    }

    return {
      snapshot: snapshot as IndustryReportSnapshot,
      summary,
      rankings: rankingRows,
      positionMatrix,
      radar,
      timeSeries,
    };
  }
}
