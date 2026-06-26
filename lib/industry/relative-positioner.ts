// lib/industry/relative-positioner.ts
// 브랜드 감사 결과 vs 업종 벤치마크 프로필 → 상대 포지셔닝 계산

import { AuditResult } from '../../app/actions/site-audit';
import { IndustryBenchmarkProfile, IndustryBlueprint } from './benchmark-aggregator';
import { BENCHMARK_METRIC_KEYS, METRIC_META, BenchmarkMetricKey } from './batch-audit-runner';
import { MacroCategoryKey } from './industry-taxonomy';

export type PositionTier =
  | 'top10'
  | 'top25'
  | 'above_avg'
  | 'average'
  | 'below_avg'
  | 'bottom25';

export interface MetricPosition {
  metricKey: string;
  metricNameKo: string;
  metricNameEn: string;
  layer: 'L1' | 'L2' | 'L3';
  unit: string;
  brandValue: number;
  industryP25: number;
  industryP50: number;
  industryP75: number;
  industryP90: number;
  percentileRank: number;          // 0-100 (높을수록 업종 내 상위)
  positionTier: PositionTier;
  excellentMean: number;
  gap: number;                     // excellentMean - brandValue (양수 = 부족)
  gapPercent: number;              // gap / excellentMean * 100
}

export interface GapToBest {
  metricKey: string;
  metricNameKo: string;
  brandValue: number;
  excellentMean: number;
  gap: number;
  priority: number;               // gap × weight
  blueprintRecommendation?: string;
}

export interface RelativePosition {
  subIndustryKey: string;
  macroKey?: MacroCategoryKey;
  displayNameKo: string;
  brandName: string;
  websiteUrl: string;
  generatedAt: string;

  overallPercentile: number;
  overallTier: PositionTier;

  metricPositions: MetricPosition[];

  strengths: MetricPosition[];      // percentileRank >= 75
  weaknesses: MetricPosition[];     // percentileRank < 50

  gapToBest: GapToBest[];           // Gap 크기 내림차순
}

export class RelativePositioner {
  /**
   * 브랜드 감사 결과 + 업종 벤치마크 프로필 → 상대 포지셔닝
   */
  position(
    auditResult: AuditResult,
    profile: IndustryBenchmarkProfile,
    blueprint: IndustryBlueprint
  ): RelativePosition {
    // AuditResult → 메트릭 맵
    const brandMetrics = this.extractBrandMetrics(auditResult);

    const metricPositions: MetricPosition[] = [];
    const gapToBest: GapToBest[] = [];

    for (const key of BENCHMARK_METRIC_KEYS) {
      const meta = METRIC_META[key];
      const dist = profile.metricDistributions[key];
      const tierStat = profile.tierStatistics[key];

      if (!dist || !meta) continue;

      const brandValue = brandMetrics[key] ?? 0;
      const excellentMean = tierStat?.excellent?.mean ?? dist.p75;

      // 백분위 추정: 선형 보간
      const percentileRank = this.estimatePercentile(brandValue, dist, meta.higherIsBetter);
      const positionTier = this.toPositionTier(percentileRank);

      const gap = meta.higherIsBetter
        ? excellentMean - brandValue
        : brandValue - excellentMean;  // TTFB: 낮을수록 좋음
      const gapPercent = excellentMean > 0 ? Math.abs(gap) / excellentMean * 100 : 0;

      const mp: MetricPosition = {
        metricKey: key,
        metricNameKo: meta.nameKo,
        metricNameEn: meta.nameEn,
        layer: meta.layer,
        unit: meta.unit,
        brandValue: Math.round(brandValue * 10) / 10,
        industryP25: Math.round(dist.p25 * 10) / 10,
        industryP50: Math.round(dist.p50 * 10) / 10,
        industryP75: Math.round(dist.p75 * 10) / 10,
        industryP90: Math.round(dist.p90 * 10) / 10,
        percentileRank: Math.round(percentileRank),
        positionTier,
        excellentMean: Math.round(excellentMean * 10) / 10,
        gap: Math.round(gap * 10) / 10,
        gapPercent: Math.round(gapPercent * 10) / 10,
      };

      metricPositions.push(mp);

      // Gap 분석 (개선 여지가 있는 메트릭만)
      if (gap > 0) {
        const priority = gap * meta.weight;
        // Blueprint에서 관련 추천 찾기
        const relatedRec = this.findBlueprintRec(key, blueprint);

        gapToBest.push({
          metricKey: key,
          metricNameKo: meta.nameKo,
          brandValue: mp.brandValue,
          excellentMean: mp.excellentMean,
          gap: mp.gap,
          priority: Math.round(priority * 10) / 10,
          blueprintRecommendation: relatedRec,
        });
      }
    }

    // 종합 백분위 = 가중 평균 (weight 기준)
    const totalWeight = BENCHMARK_METRIC_KEYS.reduce((s, k) => s + METRIC_META[k].weight, 0);
    const overallPercentile = metricPositions.reduce((s, mp) => {
      const weight = METRIC_META[mp.metricKey as BenchmarkMetricKey].weight;
      return s + mp.percentileRank * weight;
    }, 0) / totalWeight;

    const strengths = metricPositions
      .filter(mp => mp.percentileRank >= 75)
      .sort((a, b) => b.percentileRank - a.percentileRank);

    const weaknesses = metricPositions
      .filter(mp => mp.percentileRank < 50)
      .sort((a, b) => a.percentileRank - b.percentileRank);

    gapToBest.sort((a, b) => b.priority - a.priority);

    return {
      subIndustryKey: profile.subIndustryKey,
      displayNameKo: profile.displayNameKo,
      brandName: auditResult.brandName,
      websiteUrl: auditResult.websiteUrl,
      generatedAt: new Date().toISOString(),
      overallPercentile: Math.round(overallPercentile),
      overallTier: this.toPositionTier(overallPercentile),
      metricPositions,
      strengths,
      weaknesses,
      gapToBest: gapToBest.slice(0, 10),
    };
  }

  private extractBrandMetrics(audit: AuditResult): Record<string, number> {
    const techInfra = audit.techInfra;
    const schema = audit.schemaQuality;
    const content = audit.contentSemantic;

    const answerFirstAvg = content
      ? (content.answerFirstScores.reduce((s, a) => s + a.directAnswerScore, 0) /
         Math.max(content.answerFirstScores.length, 1))
      : 0;

    return {
      techInfraScore:           techInfra?.techInfraScore ?? 0,
      aiCrawlerAccessScore:     techInfra?.aiCrawlerAccessScore ?? 0,
      ttfbMs:                   techInfra?.ttfbMs ?? 0,
      sitemapFreshnessScore:    techInfra?.sitemapFreshnessScore ?? 0,
      canonicalConsistency:     techInfra?.canonicalConsistency ?? 0,
      schemaQualityScore:       schema?.schemaQualityScore ?? 0,
      schemaCoverage:           schema?.schemaCoverage ?? 0,
      ogCompleteness:           schema?.ogCompleteness?.completenessScore ?? 0,
      schemaTypeCount:          schema?.schemaTypeCount ?? 0,
      contentSemanticScore:     content?.contentSemanticScore ?? 0,
      eeatOverall:              content?.eeat?.overall ?? 0,
      eeatExperience:           content?.eeat?.experience ?? 0,
      eeatExpertise:            content?.eeat?.expertise ?? 0,
      eeatAuthoritativeness:    content?.eeat?.authoritativeness ?? 0,
      eeatTrustworthiness:      content?.eeat?.trustworthiness ?? 0,
      answerFirstAvgScore:      answerFirstAvg,
      freshnessScore:           content?.freshnessAnalysis?.freshnessScore ?? 0,
      multimediaScore:          content?.multimediaAudit?.multimediaScore ?? 0,
      citationQualityScore:     content?.citationNetwork?.citationQualityScore ?? 0,
      internalLinkTopologyScore: content?.internalLinkTopology?.topologyScore ?? 0,
      originalityScore:         content?.originalityScore ?? 0,
      quantitativeDataDensity:  content?.quantitativeDataDensity ?? 0,
    };
  }

  private estimatePercentile(
    value: number,
    dist: { p10: number; p25: number; p50: number; p75: number; p90: number; min: number; max: number },
    higherIsBetter: boolean
  ): number {
    if (!higherIsBetter) {
      // TTFB 등 낮을수록 좋은 경우: 값을 반전
      const maxVal = Math.max(dist.max, value);
      value = maxVal - value;
      dist = {
        p10: maxVal - dist.p90,
        p25: maxVal - dist.p75,
        p50: maxVal - dist.p50,
        p75: maxVal - dist.p25,
        p90: maxVal - dist.p10,
        min: maxVal - dist.max,
        max: maxVal - dist.min,
      };
    }

    const breakpoints = [
      { pct: 0, val: dist.min },
      { pct: 10, val: dist.p10 },
      { pct: 25, val: dist.p25 },
      { pct: 50, val: dist.p50 },
      { pct: 75, val: dist.p75 },
      { pct: 90, val: dist.p90 },
      { pct: 100, val: dist.max },
    ];

    if (value <= breakpoints[0].val) return 0;
    if (value >= breakpoints[breakpoints.length - 1].val) return 100;

    for (let i = 1; i < breakpoints.length; i++) {
      if (value <= breakpoints[i].val) {
        const lo = breakpoints[i - 1];
        const hi = breakpoints[i];
        const ratio = hi.val === lo.val ? 1 : (value - lo.val) / (hi.val - lo.val);
        return lo.pct + ratio * (hi.pct - lo.pct);
      }
    }

    return 100;
  }

  private toPositionTier(percentile: number): PositionTier {
    if (percentile >= 90) return 'top10';
    if (percentile >= 75) return 'top25';
    if (percentile >= 60) return 'above_avg';
    if (percentile >= 40) return 'average';
    if (percentile >= 25) return 'below_avg';
    return 'bottom25';
  }

  private findBlueprintRec(metricKey: string, blueprint: IndustryBlueprint): string | undefined {
    const allRecs = [
      ...blueprint.techInfraStandard.recommendations,
      ...blueprint.schemaStandard.recommendations,
      ...blueprint.contentStrategy.recommendations,
      ...blueprint.designPatterns.recommendations,
    ];

    const match = allRecs.find(r => r.relatedMetrics.includes(metricKey));
    return match?.title;
  }
}
