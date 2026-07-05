/**
 * lib/industry-report/report-data-builder.ts
 *
 * 리포트 4대 비주얼(랭킹표, 4사분면, AEPI 레이더, 시계열)용
 * 데이터 어셈블러.
 */

import type { IndustryReportBrandRanking, IndustryReportSnapshot } from '../schema';
import type { Quadrant, PositionMatrixResult } from './competitive-position-matrix';

// ═══════════════════════════════════════════════════════════════
// 출력 타입 정의
// ═══════════════════════════════════════════════════════════════

/** 랭킹 테이블 1행 */
export interface BrandRankingRow {
  rank: number;
  prevRank: number | null;
  rankChange: number;            // +2, -1, 0
  rankChangeLabel: string;       // "↑2", "↓1", "─"
  brand: string;
  brandSlug: string;
  bairScore: number;
  bairChange: number;
  bsf: number;
  aas_w: number;
  ocr: number;
  mentionQuality: number | null;
  bdr: number | null;
  cwr: number | null;
  top3: number | null;
  top5: number | null;
  freshness: number | null;
  quadrant: Quadrant | null;
  isEstimated: boolean;
  sampleSize: number;
}

/** AEPI 7차원 레이더 차트 데이터 */
export interface RadarChartData {
  dimensions: string[];           // ["factoid","procedural","comparative","authority","schema_org","topical_cluster","local_geo"]
  dimensionLabels: string[];      // ["사실형","절차형","비교형","권위","스키마","토픽클러스터","지역/지리"]
  industryAvg: number[];          // [65, 58, 72, ...]
  topBrands: Array<{
    brand: string;
    brandSlug: string;
    values: number[];
    bairScore: number;
  }>;
}

/** 시계열 비교 데이터 */
export interface TimeSeriesData {
  periods: string[];              // ["2026-Q1", "2026-Q2", "2026-Q3"]
  brands: Array<{
    brand: string;
    brandSlug: string;
    bairHistory: (number | null)[];
    iriHistory: (number | null)[];
  }>;
}

/** Executive Summary 섹션 */
export interface ExecutiveSummary {
  industryIRI: number | null;
  industryOPP: number | null;
  industryAvgBAIR: number | null;
  industryAvgAEPI: number | null;
  topBrand: string;
  topBrandBAIR: number;
  biggestRiser: { brand: string; change: number } | null;
  biggestFaller: { brand: string; change: number } | null;
  totalBrands: number;
  totalProbes: number;
  totalResponses: number;
  enginesUsed: string[];
}

/** 전체 리포트 데이터 구조 */
export interface IndustryReportData {
  snapshot: IndustryReportSnapshot;
  summary: ExecutiveSummary;
  rankings: BrandRankingRow[];
  positionMatrix: PositionMatrixResult;
  radar: RadarChartData;
  timeSeries: TimeSeriesData | null;
}

// ═══════════════════════════════════════════════════════════════
// AEPI 차원 레이블
// ═══════════════════════════════════════════════════════════════

const AEPI_DIMENSIONS = ['factoid', 'procedural', 'comparative', 'authority', 'schema_org', 'topical_cluster', 'local_geo'];
const AEPI_LABELS = ['사실형', '절차형', '비교형', '권위/신뢰', '스키마', '토픽클러스터', '지역/지리'];

// ═══════════════════════════════════════════════════════════════
// 핵심 빌더 함수들
// ═══════════════════════════════════════════════════════════════

/**
 * 랭킹 행 배열 생성
 */
export function buildRankingRows(rankings: IndustryReportBrandRanking[]): BrandRankingRow[] {
  return rankings
    .sort((a, b) => a.rank_position - b.rank_position)
    .map((r) => {
      const change = r.rank_change ?? 0;
      let rankChangeLabel = '─';
      if (change > 0) rankChangeLabel = `↑${change}`;
      else if (change < 0) rankChangeLabel = `↓${Math.abs(change)}`;

      return {
        rank: r.rank_position,
        prevRank: r.prev_rank_position ?? null,
        rankChange: change,
        rankChangeLabel,
        brand: r.brand_name,
        brandSlug: r.brand_slug,
        bairScore: r.bair_score,
        bairChange: r.bair_change ?? 0,
        bsf: r.bsf,
        aas_w: r.aas_w,
        ocr: r.ocr,
        mentionQuality: r.mention_quality ?? null,
        bdr: r.bdr ?? null,
        cwr: r.cwr ?? null,
        top3: r.top3 ?? null,
        top5: r.top5 ?? null,
        freshness: r.freshness ?? null,
        quadrant: (r.quadrant as Quadrant) ?? null,
        isEstimated: r.is_estimated,
        sampleSize: r.sample_size,
      };
    });
}

/**
 * AEPI 레이더 차트 데이터 생성
 *
 * - 업종 평균: 모든 브랜드의 각 차원 평균
 * - Top N 브랜드: BAIR 기준 상위 브랜드
 */
export function buildRadarChartData(
  rankings: IndustryReportBrandRanking[],
  topN: number = 3
): RadarChartData {
  // 차원별 업종 평균 계산
  const industryAvg = AEPI_DIMENSIONS.map((dim) => {
    const values = rankings
      .map((r) => (r.aepi_dimensions as Record<string, number> | null)?.[dim])
      .filter((v): v is number => v !== undefined && v !== null);
    if (values.length === 0) return 0;
    return Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1));
  });

  // Top N 브랜드 선택 (BAIR 기준)
  const topBrands = rankings
    .sort((a, b) => b.bair_score - a.bair_score)
    .slice(0, topN)
    .map((r) => {
      const dims = (r.aepi_dimensions as Record<string, number> | null) ?? {};
      return {
        brand: r.brand_name,
        brandSlug: r.brand_slug,
        values: AEPI_DIMENSIONS.map((dim) => dims[dim] ?? 0),
        bairScore: r.bair_score,
      };
    });

  return {
    dimensions: AEPI_DIMENSIONS,
    dimensionLabels: AEPI_LABELS,
    industryAvg,
    topBrands,
  };
}

/**
 * Executive Summary 생성
 */
export function buildExecutiveSummary(
  snapshot: IndustryReportSnapshot,
  rankings: IndustryReportBrandRanking[]
): ExecutiveSummary {
  const sorted = [...rankings].sort((a, b) => a.rank_position - b.rank_position);
  const topBrand = sorted[0];

  // 최대 상승/하락 브랜드
  const withChange = sorted.filter((r) => r.prev_rank_position != null);
  const biggestRiser = withChange.length > 0
    ? withChange.reduce((prev, cur) => (cur.rank_change ?? 0) > (prev.rank_change ?? 0) ? cur : prev)
    : null;
  const biggestFaller = withChange.length > 0
    ? withChange.reduce((prev, cur) => (cur.rank_change ?? 0) < (prev.rank_change ?? 0) ? cur : prev)
    : null;

  return {
    industryIRI: snapshot.industry_iri ?? null,
    industryOPP: snapshot.industry_opp ?? null,
    industryAvgBAIR: snapshot.industry_avg_bair ?? null,
    industryAvgAEPI: snapshot.industry_avg_aepi ?? null,
    topBrand: topBrand?.brand_name ?? '─',
    topBrandBAIR: topBrand?.bair_score ?? 0,
    biggestRiser: biggestRiser && (biggestRiser.rank_change ?? 0) > 0
      ? { brand: biggestRiser.brand_name, change: biggestRiser.rank_change ?? 0 }
      : null,
    biggestFaller: biggestFaller && (biggestFaller.rank_change ?? 0) < 0
      ? { brand: biggestFaller.brand_name, change: biggestFaller.rank_change ?? 0 }
      : null,
    totalBrands: snapshot.total_brands,
    totalProbes: snapshot.total_probes,
    totalResponses: snapshot.total_responses,
    enginesUsed: snapshot.engines_used,
  };
}

/**
 * 시계열 데이터 생성 (과거 리포트 배열에서)
 */
export function buildTimeSeriesData(
  historicalReports: Array<{
    snapshot: IndustryReportSnapshot;
    rankings: IndustryReportBrandRanking[];
  }>
): TimeSeriesData {
  // 기간 순서대로 정렬
  const sorted = [...historicalReports].sort(
    (a, b) => a.snapshot.report_period.localeCompare(b.snapshot.report_period)
  );

  const periods = sorted.map((r) => r.snapshot.report_period);

  // 전 기간에 등장한 모든 브랜드 수집
  const allBrandSlugs = new Set<string>();
  for (const report of sorted) {
    for (const ranking of report.rankings) {
      allBrandSlugs.add(ranking.brand_slug);
    }
  }

  const brands = Array.from(allBrandSlugs).map((slug) => {
    const bairHistory: (number | null)[] = [];
    const iriHistory: (number | null)[] = [];

    let brandName = slug;

    for (const report of sorted) {
      const ranking = report.rankings.find((r) => r.brand_slug === slug);
      if (ranking) {
        brandName = ranking.brand_name;
        bairHistory.push(ranking.bair_score);
        iriHistory.push(ranking.iri ?? null);
      } else {
        bairHistory.push(null);
        iriHistory.push(null);
      }
    }

    return { brand: brandName, brandSlug: slug, bairHistory, iriHistory };
  });

  return { periods, brands };
}
