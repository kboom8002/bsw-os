// lib/industry/benchmark-aggregator.ts
// 업종별 벤치마크 통계 집계 & 표준 설계안(Blueprint) 도출 엔진

import {
  SiteAuditSnapshot,
  BENCHMARK_METRIC_KEYS,
  METRIC_META,
  BenchmarkMetricKey,
} from './batch-audit-runner';

// ── 백분위 분포 ─────────────────────────────────────────
export interface PercentileDistribution {
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  min: number;
  max: number;
  mean: number;
  count: number;
}

export interface TierStatistics {
  excellent: { mean: number; count: number };
  average: { mean: number; count: number };
  poor: { mean: number; count: number };
}

// ── 우수/미흡 패턴 ───────────────────────────────────────
export interface ExcellentPattern {
  dimension: string;
  metricKey: string;
  observation: string;
  excellentMean: number;
  poorMean: number;
  gap: number;
  prevalenceInExcellent: number;  // 우수 사이트 중 적용 비율 (%)
  actionableInsight: string;
}

export interface CommonPitfall {
  dimension: string;
  metricKey: string;
  observation: string;
  severity: 'critical' | 'warning';
  prevalenceInPoor: number;
  actionableInsight: string;
}

// ── Blueprint ────────────────────────────────────────────
export interface BlueprintRecommendation {
  priority: number;             // 1-10
  title: string;
  description: string;
  evidenceBasis: string;
  expectedImpact: 'high' | 'medium' | 'low';
  implementationEffort: 'easy' | 'moderate' | 'hard';
  targetValue: number;
  currentIndustryAvg: number;
  relatedMetrics: string[];
}

export interface BlueprintSection {
  title: string;
  targetScore: number;          // p75 기준
  currentIndustryAvg: number;
  recommendations: BlueprintRecommendation[];
}

export interface IndustryBlueprint {
  subIndustryKey: string;
  displayNameKo: string;
  sampleCount: number;
  generatedAt: string;
  techInfraStandard: BlueprintSection;
  schemaStandard: BlueprintSection;
  contentStrategy: BlueprintSection;
  designPatterns: BlueprintSection;
  targetScores: Record<string, number>;  // metricKey → p75 값
}

// ── 집계 프로필 ──────────────────────────────────────────
export interface IndustryBenchmarkProfile {
  subIndustryKey: string;
  displayNameKo: string;
  sampleCount: number;
  generatedAt: string;
  metricDistributions: Record<string, PercentileDistribution>;
  tierStatistics: Record<string, TierStatistics>;
  excellentPatterns: ExcellentPattern[];
  commonPitfalls: CommonPitfall[];
}

// ── 집계 결과 ────────────────────────────────────────────
export interface AggregationResult {
  profile: IndustryBenchmarkProfile;
  blueprint: IndustryBlueprint;
}

// ────────────────────────────────────────────────────────
// BenchmarkAggregator
// ────────────────────────────────────────────────────────
export class BenchmarkAggregator {
  /**
   * SiteAuditSnapshot[] → IndustryBenchmarkProfile + IndustryBlueprint
   */
  aggregate(
    snapshots: SiteAuditSnapshot[],
    subIndustryKey: string,
    displayNameKo: string
  ): AggregationResult {
    // 에러가 있는 스냅샷은 집계에서 제외
    const valid = snapshots.filter(s => !s.error);

    if (valid.length === 0) {
      throw new Error('No valid snapshots to aggregate');
    }

    // 1. 메트릭별 백분위 분포 계산
    const metricDistributions: Record<string, PercentileDistribution> = {};
    const tierStatistics: Record<string, TierStatistics> = {};

    for (const key of BENCHMARK_METRIC_KEYS) {
      const values = valid.map(s => s[key] as number);
      metricDistributions[key] = this.calcPercentiles(values);

      const excellent = valid.filter(s => s.tier === 'excellent').map(s => s[key] as number);
      const average = valid.filter(s => s.tier === 'average').map(s => s[key] as number);
      const poor = valid.filter(s => s.tier === 'poor').map(s => s[key] as number);

      tierStatistics[key] = {
        excellent: { mean: this.mean(excellent), count: excellent.length },
        average:   { mean: this.mean(average), count: average.length },
        poor:      { mean: this.mean(poor), count: poor.length },
      };
    }

    // 2. 우수 패턴 도출
    const excellentPatterns = this.deriveExcellentPatterns(valid, tierStatistics);

    // 3. 공통 함정 도출
    const commonPitfalls = this.deriveCommonPitfalls(valid, tierStatistics);

    // 4. Blueprint 생성
    const blueprint = this.buildBlueprint(
      subIndustryKey,
      displayNameKo,
      valid,
      metricDistributions,
      tierStatistics,
      excellentPatterns
    );

    const profile: IndustryBenchmarkProfile = {
      subIndustryKey,
      displayNameKo,
      sampleCount: valid.length,
      generatedAt: new Date().toISOString(),
      metricDistributions,
      tierStatistics,
      excellentPatterns,
      commonPitfalls,
    };

    return { profile, blueprint };
  }

  // ── 내부 유틸 ────────────────────────────────────────
  private calcPercentiles(values: number[]): PercentileDistribution {
    if (values.length === 0) {
      return { p10: 0, p25: 0, p50: 0, p75: 0, p90: 0, min: 0, max: 0, mean: 0, count: 0 };
    }
    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    const percentile = (p: number) => {
      const idx = (p / 100) * (n - 1);
      const lo = Math.floor(idx);
      const hi = Math.ceil(idx);
      return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
    };
    return {
      p10: percentile(10),
      p25: percentile(25),
      p50: percentile(50),
      p75: percentile(75),
      p90: percentile(90),
      min: sorted[0],
      max: sorted[n - 1],
      mean: this.mean(values),
      count: n,
    };
  }

  private mean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((s, v) => s + v, 0) / values.length;
  }

  private deriveExcellentPatterns(
    snapshots: SiteAuditSnapshot[],
    tierStats: Record<string, TierStatistics>
  ): ExcellentPattern[] {
    const patterns: ExcellentPattern[] = [];
    const excellentSites = snapshots.filter(s => s.tier === 'excellent');
    const poorSites = snapshots.filter(s => s.tier === 'poor');

    if (excellentSites.length === 0) return [];

    for (const key of BENCHMARK_METRIC_KEYS) {
      const meta = METRIC_META[key];
      const excellentMean = tierStats[key]?.excellent?.mean ?? 0;
      const poorMean = tierStats[key]?.poor?.mean ?? 0;

      const gap = meta.higherIsBetter
        ? excellentMean - poorMean
        : poorMean - excellentMean;  // TTFB의 경우 poor가 더 높음

      // Gap이 큰 메트릭만 패턴으로 도출
      const threshold = meta.unit === 'pt' ? 15 : (meta.unit === '%' ? 10 : 300);
      if (Math.abs(gap) < threshold) continue;

      const prevalence = excellentSites.filter(s => {
        const val = s[key] as number;
        if (meta.higherIsBetter) return val >= excellentMean * 0.8;
        return val <= excellentMean * 1.2;
      }).length / excellentSites.length * 100;

      patterns.push({
        dimension: this.getDimensionName(key),
        metricKey: key,
        observation: this.generateObservation(key, excellentMean, poorMean, meta),
        excellentMean: Math.round(excellentMean * 10) / 10,
        poorMean: Math.round(poorMean * 10) / 10,
        gap: Math.round(Math.abs(gap) * 10) / 10,
        prevalenceInExcellent: Math.round(prevalence),
        actionableInsight: this.generateInsight(key, excellentMean, meta),
      });
    }

    // gap 내림차순 정렬
    return patterns.sort((a, b) => b.gap - a.gap).slice(0, 10);
  }

  private deriveCommonPitfalls(
    snapshots: SiteAuditSnapshot[],
    tierStats: Record<string, TierStatistics>
  ): CommonPitfall[] {
    const pitfalls: CommonPitfall[] = [];
    const poorSites = snapshots.filter(s => s.tier === 'poor');
    if (poorSites.length === 0) return [];

    const criticalThresholds: Record<string, number> = {
      techInfraScore: 40,
      schemaQualityScore: 30,
      eeatOverall: 35,
      aiCrawlerAccessScore: 60,
      ogCompleteness: 50,
    };

    for (const [key, threshold] of Object.entries(criticalThresholds)) {
      const prevalence = poorSites.filter(s => (s as unknown as Record<string, number>)[key] < threshold).length /
        poorSites.length * 100;
      if (prevalence < 50) continue;

      const meta = METRIC_META[key as BenchmarkMetricKey];
      if (!meta) continue;

      pitfalls.push({
        dimension: this.getDimensionName(key as BenchmarkMetricKey),
        metricKey: key,
        observation: `미흡 사이트의 ${Math.round(prevalence)}%가 ${meta.nameKo} ${threshold}점 미만`,
        severity: prevalence >= 80 ? 'critical' : 'warning',
        prevalenceInPoor: Math.round(prevalence),
        actionableInsight: this.generateInsight(key as BenchmarkMetricKey,
          tierStats[key]?.excellent?.mean ?? 70, meta),
      });
    }

    return pitfalls;
  }

  private buildBlueprint(
    subIndustryKey: string,
    displayNameKo: string,
    snapshots: SiteAuditSnapshot[],
    distributions: Record<string, PercentileDistribution>,
    tierStats: Record<string, TierStatistics>,
    patterns: ExcellentPattern[]
  ): IndustryBlueprint {
    // 목표 점수 = p75 (업종 상위 25%)
    const targetScores: Record<string, number> = {};
    for (const key of BENCHMARK_METRIC_KEYS) {
      targetScores[key] = Math.round((distributions[key]?.p75 ?? 0) * 10) / 10;
    }

    const excellentSites = snapshots.filter(s => s.tier === 'excellent');

    // === 기술 인프라 섹션 ===
    const techPatterns = patterns.filter(p =>
      ['techInfraScore', 'aiCrawlerAccessScore', 'ttfbMs', 'sitemapFreshnessScore', 'canonicalConsistency'].includes(p.metricKey)
    );

    const techRecs: BlueprintRecommendation[] = [];

    // AI 크롤러 접근성
    const aiAccessExcMean = tierStats['aiCrawlerAccessScore']?.excellent?.mean ?? 80;
    if (aiAccessExcMean > 60) {
      techRecs.push({
        priority: 10,
        title: 'AI 봇 5종 전체 허용 (robots.txt 최적화)',
        description: 'OAI-SearchBot, GPTBot, Google-Extended, PerplexityBot, Anthropic-AI의 크롤링을 명시적으로 허용합니다.',
        evidenceBasis: `우수 사이트 평균 ${Math.round(aiAccessExcMean)}점 달성`,
        expectedImpact: 'high',
        implementationEffort: 'easy',
        targetValue: targetScores['aiCrawlerAccessScore'],
        currentIndustryAvg: distributions['aiCrawlerAccessScore']?.p50 ?? 60,
        relatedMetrics: ['aiCrawlerAccessScore', 'techInfraScore'],
      });
    }

    // llms.txt
    const llmsTxtAdoption = excellentSites.filter(s => s.llmsTxtExists).length /
      Math.max(excellentSites.length, 1) * 100;
    if (llmsTxtAdoption > 20) {
      techRecs.push({
        priority: 7,
        title: '/llms.txt 파일 추가 (AI 검색 차별화)',
        description: 'AI 어시스턴트에게 사이트 콘텐츠를 명확히 안내하는 llms.txt 파일을 생성합니다.',
        evidenceBasis: `우수 사이트 ${Math.round(llmsTxtAdoption)}%가 적용`,
        expectedImpact: 'medium',
        implementationEffort: 'easy',
        targetValue: 100,
        currentIndustryAvg: snapshots.filter(s => s.llmsTxtExists).length / snapshots.length * 100,
        relatedMetrics: ['techInfraScore'],
      });
    }

    // TTFB
    const ttfbP75 = distributions['ttfbMs']?.p75 ?? 1500;
    techRecs.push({
      priority: 6,
      title: `TTFB ${Math.round(ttfbP75)}ms 이하 달성`,
      description: '서버 응답 속도를 최적화하여 AI 크롤러의 접근성을 높입니다.',
      evidenceBasis: `업종 우수 사이트 기준 ${Math.round(tierStats['ttfbMs']?.excellent?.mean ?? 700)}ms`,
      expectedImpact: 'medium',
      implementationEffort: 'moderate',
      targetValue: targetScores['ttfbMs'],
      currentIndustryAvg: distributions['ttfbMs']?.p50 ?? 1200,
      relatedMetrics: ['ttfbMs', 'techInfraScore'],
    });

    // === 구조화 데이터 섹션 ===
    // 우수 사이트의 공통 스키마 유형
    const schemaTypeFreq: Record<string, number> = {};
    for (const site of excellentSites) {
      for (const type of site.schemaTypesPresent) {
        schemaTypeFreq[type] = (schemaTypeFreq[type] ?? 0) + 1;
      }
    }
    const requiredSchemas = Object.entries(schemaTypeFreq)
      .filter(([, count]) => count / Math.max(excellentSites.length, 1) >= 0.6)
      .map(([type]) => type)
      .sort();

    const schemaRecs: BlueprintRecommendation[] = [];
    if (requiredSchemas.length > 0) {
      schemaRecs.push({
        priority: 10,
        title: `필수 스키마 세트 구현: ${requiredSchemas.join(', ')}`,
        description: `우수 사이트 60%+ 이상이 공통으로 사용하는 스키마 유형입니다.`,
        evidenceBasis: `우수 사이트 공통 패턴: ${requiredSchemas.join(' + ')}`,
        expectedImpact: 'high',
        implementationEffort: 'moderate',
        targetValue: targetScores['schemaQualityScore'],
        currentIndustryAvg: distributions['schemaQualityScore']?.p50 ?? 50,
        relatedMetrics: ['schemaQualityScore', 'schemaTypeCount', 'schemaCoverage'],
      });
    }

    const orgSameAsExcMean = tierStats['orgSameAsCount']?.excellent?.mean ?? 3;
    schemaRecs.push({
      priority: 9,
      title: `Organization 스키마 + sameAs ${Math.ceil(orgSameAsExcMean)}개 이상`,
      description: 'LinkedInn, Instagram, YouTube, Facebook, Wikipedia 등 공식 SNS/외부 프로필 연결',
      evidenceBasis: `우수 사이트 평균 sameAs ${Math.round(orgSameAsExcMean)}개`,
      expectedImpact: 'high',
      implementationEffort: 'easy',
      targetValue: targetScores['schemaQualityScore'],
      currentIndustryAvg: distributions['schemaQualityScore']?.p50 ?? 50,
      relatedMetrics: ['schemaQualityScore', 'eeatAuthoritativeness'],
    });

    schemaRecs.push({
      priority: 8,
      title: 'OG 태그 5종 완비 (og:title, og:description, og:image, og:type, og:url)',
      description: '모든 페이지에 OpenGraph 태그를 완비하여 AI 검색 및 SNS 공유 최적화',
      evidenceBasis: `우수 사이트 OG 완성도 평균 ${Math.round(tierStats['ogCompleteness']?.excellent?.mean ?? 85)}점`,
      expectedImpact: 'medium',
      implementationEffort: 'easy',
      targetValue: targetScores['ogCompleteness'],
      currentIndustryAvg: distributions['ogCompleteness']?.p50 ?? 60,
      relatedMetrics: ['ogCompleteness', 'schemaQualityScore'],
    });

    // === 콘텐츠 전략 섹션 ===
    const contentRecs: BlueprintRecommendation[] = [];

    contentRecs.push({
      priority: 10,
      title: `E-E-A-T 종합 ${Math.round(targetScores['eeatOverall'])}점 목표`,
      description: '경험(후기/리뷰), 전문성(저자 정보), 권위(외부 인용), 신뢰(HTTPS/약관) 4축 신호를 균형 있게 강화',
      evidenceBasis: `우수 사이트 E-E-A-T 평균 ${Math.round(tierStats['eeatOverall']?.excellent?.mean ?? 70)}점`,
      expectedImpact: 'high',
      implementationEffort: 'moderate',
      targetValue: targetScores['eeatOverall'],
      currentIndustryAvg: distributions['eeatOverall']?.p50 ?? 50,
      relatedMetrics: ['eeatOverall', 'eeatExperience', 'eeatExpertise', 'eeatAuthoritativeness', 'eeatTrustworthiness'],
    });

    contentRecs.push({
      priority: 9,
      title: `Answer-First 문체 ${Math.round(targetScores['answerFirstAvgScore'])}점 목표`,
      description: '첫 100단어 내 질문에 대한 직접적 답변을 제시하는 구조로 콘텐츠를 재작성',
      evidenceBasis: `우수 사이트 평균 ${Math.round(tierStats['answerFirstAvgScore']?.excellent?.mean ?? 70)}점`,
      expectedImpact: 'high',
      implementationEffort: 'moderate',
      targetValue: targetScores['answerFirstAvgScore'],
      currentIndustryAvg: distributions['answerFirstAvgScore']?.p50 ?? 50,
      relatedMetrics: ['answerFirstAvgScore', 'contentSemanticScore'],
    });

    contentRecs.push({
      priority: 8,
      title: `콘텐츠 갱신율 ${Math.round(targetScores['freshnessScore'])}점 유지 (90일 이내 갱신)`,
      description: '주요 페이지를 90일 이내 주기로 업데이트하여 AI 검색 신선도 신호 강화',
      evidenceBasis: `우수 사이트 신선도 평균 ${Math.round(tierStats['freshnessScore']?.excellent?.mean ?? 70)}점`,
      expectedImpact: 'medium',
      implementationEffort: 'moderate',
      targetValue: targetScores['freshnessScore'],
      currentIndustryAvg: distributions['freshnessScore']?.p50 ?? 50,
      relatedMetrics: ['freshnessScore', 'contentSemanticScore'],
    });

    // === 디자인/구조 패턴 섹션 ===
    const designRecs: BlueprintRecommendation[] = [];

    designRecs.push({
      priority: 8,
      title: '이미지 alt 텍스트 90%+ 완비',
      description: '모든 이미지에 설명적인 alt 텍스트를 추가하여 멀티모달 AI 검색 접근성 향상',
      evidenceBasis: `우수 사이트 멀티모달 점수 평균 ${Math.round(tierStats['multimediaScore']?.excellent?.mean ?? 75)}점`,
      expectedImpact: 'medium',
      implementationEffort: 'easy',
      targetValue: targetScores['multimediaScore'],
      currentIndustryAvg: distributions['multimediaScore']?.p50 ?? 55,
      relatedMetrics: ['multimediaScore', 'contentSemanticScore'],
    });

    designRecs.push({
      priority: 7,
      title: '권위 도메인 인용 20%+ 확보',
      description: '학술/정부/뉴스 도메인(.edu, .gov, 네이버, 위키피디아) 출처를 인용하여 인용 네트워크 품질 향상',
      evidenceBasis: `우수 사이트 인용 품질 평균 ${Math.round(tierStats['citationQualityScore']?.excellent?.mean ?? 65)}점`,
      expectedImpact: 'medium',
      implementationEffort: 'moderate',
      targetValue: targetScores['citationQualityScore'],
      currentIndustryAvg: distributions['citationQualityScore']?.p50 ?? 45,
      relatedMetrics: ['citationQualityScore', 'eeatAuthoritativeness'],
    });

    designRecs.push({
      priority: 6,
      title: '내부 링크 토폴로지 최적화 (토픽 클러스터 2+ 구성)',
      description: '허브 페이지와 스포크 페이지를 연결하는 토픽 클러스터 구조로 내부 링크 밀도 향상',
      evidenceBasis: `우수 사이트 토폴로지 점수 평균 ${Math.round(tierStats['internalLinkTopologyScore']?.excellent?.mean ?? 65)}점`,
      expectedImpact: 'medium',
      implementationEffort: 'hard',
      targetValue: targetScores['internalLinkTopologyScore'],
      currentIndustryAvg: distributions['internalLinkTopologyScore']?.p50 ?? 45,
      relatedMetrics: ['internalLinkTopologyScore', 'contentSemanticScore'],
    });

    return {
      subIndustryKey,
      displayNameKo,
      sampleCount: snapshots.length,
      generatedAt: new Date().toISOString(),
      techInfraStandard: {
        title: '기술 인프라 표준',
        targetScore: targetScores['techInfraScore'],
        currentIndustryAvg: distributions['techInfraScore']?.p50 ?? 50,
        recommendations: techRecs,
      },
      schemaStandard: {
        title: '구조화 데이터 표준',
        targetScore: targetScores['schemaQualityScore'],
        currentIndustryAvg: distributions['schemaQualityScore']?.p50 ?? 50,
        recommendations: schemaRecs,
      },
      contentStrategy: {
        title: '콘텐츠 전략 표준',
        targetScore: targetScores['contentSemanticScore'],
        currentIndustryAvg: distributions['contentSemanticScore']?.p50 ?? 50,
        recommendations: contentRecs,
      },
      designPatterns: {
        title: '디자인/구조 패턴',
        targetScore: targetScores['multimediaScore'],
        currentIndustryAvg: distributions['multimediaScore']?.p50 ?? 50,
        recommendations: designRecs,
      },
      targetScores,
    };
  }

  private getDimensionName(key: BenchmarkMetricKey): string {
    const meta = METRIC_META[key];
    return meta?.layer ?? 'General';
  }

  private generateObservation(
    key: BenchmarkMetricKey,
    excellentMean: number,
    poorMean: number,
    meta: { nameKo: string; unit: string }
  ): string {
    return `우수 사이트 ${meta.nameKo} 평균 ${Math.round(excellentMean)}${meta.unit} vs 미흡 사이트 ${Math.round(poorMean)}${meta.unit}`;
  }

  private generateInsight(
    key: BenchmarkMetricKey,
    excellentMean: number,
    meta: { nameKo: string; unit: string }
  ): string {
    return `${meta.nameKo}를 ${Math.round(excellentMean)}${meta.unit} 이상으로 개선하세요`;
  }
}
