// lib/industry/strategy-generator.ts
// Gap-to-Best 분석 → 업종 기반 개선 전략 생성기

import { RelativePosition, GapToBest, MetricPosition, PositionTier } from './relative-positioner';
import { IndustryBlueprint, BlueprintRecommendation } from './benchmark-aggregator';
import { SurfaceGapAnalysis } from '../schema';
import { METRIC_META, BenchmarkMetricKey } from './batch-audit-runner';
import { MacroCategoryKey } from './industry-taxonomy';

export type OverallGrade = 'S' | 'A' | 'B' | 'C' | 'D' | 'F';

export interface StrategyItem {
  rank: number;
  category: 'tech_infra' | 'schema' | 'content' | 'design';
  title: string;
  description: string;

  // 근거 수치
  currentValue: number;
  industryAvg: number;
  industryTop: number;
  gap: number;

  // 벤치마크 기반 근거
  evidenceBasis: string;
  bestPracticeExample?: string;

  // 실행 가이드
  actionItems: string[];
  implementationEffort: 'easy' | 'moderate' | 'hard';
  expectedImpact: 'high' | 'medium' | 'low';
  impactScore: number;

  percentileRank: number;
}

export interface ImprovementStrategy {
  subIndustryKey: string;
  macroKey?: MacroCategoryKey;
  displayNameKo: string;
  brandName: string;
  websiteUrl: string;
  generatedAt: string;

  executiveSummary: string;
  overallGrade: OverallGrade;
  overallPercentile: number;

  prioritizedStrategies: StrategyItem[];
  quickWins: StrategyItem[];           // easy effort + high/medium impact
  longTermInvestments: StrategyItem[]; // hard effort + high impact
}

export class StrategyGenerator {
  /**
   * RelativePosition + IndustryBlueprint + 기존 GapAnalysis → ImprovementStrategy
   */
  generate(
    position: RelativePosition,
    blueprint: IndustryBlueprint,
    existingGaps: SurfaceGapAnalysis[]
  ): ImprovementStrategy {
    const strategies: StrategyItem[] = [];
    let rank = 1;

    // 모든 Blueprint 추천을 MetricPosition과 연결
    const allRecs = [
      ...blueprint.techInfraStandard.recommendations.map(r => ({ ...r, category: 'tech_infra' as const })),
      ...blueprint.schemaStandard.recommendations.map(r => ({ ...r, category: 'schema' as const })),
      ...blueprint.contentStrategy.recommendations.map(r => ({ ...r, category: 'content' as const })),
      ...blueprint.designPatterns.recommendations.map(r => ({ ...r, category: 'design' as const })),
    ].sort((a, b) => b.priority - a.priority);

    for (const rec of allRecs) {
      // 연관 메트릭 중 브랜드가 가장 낮은 위치를 찾음
      const relatedPositions = position.metricPositions.filter(mp =>
        rec.relatedMetrics.includes(mp.metricKey)
      );

      if (relatedPositions.length === 0) continue;

      const worstPosition = relatedPositions.sort(
        (a, b) => a.percentileRank - b.percentileRank
      )[0];

      // 이미 top10이면 전략에서 제외
      if (worstPosition.percentileRank >= 90) continue;

      const impactScore = rec.priority * (1 - worstPosition.percentileRank / 100);

      const strategy: StrategyItem = {
        rank: rank++,
        category: rec.category,
        title: rec.title,
        description: rec.description,
        currentValue: worstPosition.brandValue,
        industryAvg: worstPosition.industryP50,
        industryTop: worstPosition.industryP75,
        gap: worstPosition.gap,
        evidenceBasis: `${position.displayNameKo} 업종 분석 (${position.displayNameKo} ${rec.evidenceBasis})`,
        actionItems: this.generateActionItems(rec, worstPosition),
        implementationEffort: rec.implementationEffort,
        expectedImpact: rec.expectedImpact,
        impactScore: Math.round(impactScore * 10) / 10,
        percentileRank: worstPosition.percentileRank,
      };

      strategies.push(strategy);
    }

    // 기존 Gap 분석의 critical 처방전 추가 (중복 없이)
    const existingCritical = existingGaps
      .filter(g => g.quadrant === 'red' && g.prescription_type)
      .slice(0, 3);

    for (const gap of existingCritical) {
      const alreadyExists = strategies.some(s =>
        s.title.toLowerCase().includes(gap.prescription_type ?? '')
      );
      if (!alreadyExists) {
        strategies.push({
          rank: rank++,
          category: 'content',
          title: `[콘텐츠 갭] ${gap.entity_name ?? '콘텐츠 부족'}`,
          description: gap.prescription_detail ?? 'AI 검색에서 누락된 콘텐츠',
          currentValue: 0,
          industryAvg: 50,
          industryTop: 75,
          gap: 75,
          evidenceBasis: '업종 QIS 분석 기반 콘텐츠 갭',
          actionItems: [`"${gap.entity_name ?? '주제'}" 관련 콘텐츠 페이지 생성`],
          implementationEffort: 'moderate',
          expectedImpact: 'high',
          impactScore: gap.estimated_aepi_impact ?? 0,
          percentileRank: 20,
        });
      }
    }

    const quickWins = strategies.filter(
      s => s.implementationEffort === 'easy' &&
           (s.expectedImpact === 'high' || s.expectedImpact === 'medium')
    ).slice(0, 5);

    const longTermInvestments = strategies.filter(
      s => s.implementationEffort === 'hard' && s.expectedImpact === 'high'
    ).slice(0, 3);

    const grade = this.calcGrade(position.overallPercentile);

    return {
      subIndustryKey: position.subIndustryKey,
      displayNameKo: position.displayNameKo,
      brandName: position.brandName,
      websiteUrl: position.websiteUrl,
      generatedAt: new Date().toISOString(),
      executiveSummary: this.generateExecutiveSummary(position, grade, strategies),
      overallGrade: grade,
      overallPercentile: position.overallPercentile,
      prioritizedStrategies: strategies.slice(0, 10),
      quickWins,
      longTermInvestments,
    };
  }

  private generateActionItems(
    rec: BlueprintRecommendation,
    position: MetricPosition
  ): string[] {
    const actions: string[] = [];
    const key = position.metricKey as BenchmarkMetricKey;

    switch (key) {
      case 'aiCrawlerAccessScore':
        actions.push('robots.txt에 User-agent: OAI-SearchBot, GPTBot, Google-Extended, PerplexityBot, Anthropic-AI + Allow: / 추가');
        break;
      case 'schemaQualityScore':
        actions.push('Google의 Schema Markup Validator로 기존 스키마 오류 수정');
        actions.push('Organization 스키마에 sameAs 배열(LinkedIn, Instagram, YouTube) 추가');
        break;
      case 'ogCompleteness':
        actions.push('모든 페이지에 og:title, og:description, og:image, og:type, og:url 추가');
        actions.push('og:image 크기를 1200×630px로 최적화');
        break;
      case 'eeatOverall':
        actions.push('각 블로그/콘텐츠 페이지에 저자 메타 및 저자 프로필 페이지 연결');
        actions.push('서비스 페이지에 고객 후기/리뷰 섹션 추가 (AggregateRating 스키마 포함)');
        break;
      case 'answerFirstAvgScore':
        actions.push('주요 콘텐츠 페이지의 첫 단락을 질문에 대한 직접 답변으로 재작성');
        actions.push('H2/H3에 의문형 제목 사용 ("~하는 방법은?" 형식)');
        break;
      case 'freshnessScore':
        actions.push('90일 이상 미갱신 페이지 목록을 추출하여 업데이트 스케줄 수립');
        actions.push('dateModified 메타 태그 및 Article 스키마의 dateModified 필드 최신화');
        break;
      case 'citationQualityScore':
        actions.push('콘텐츠 내 통계/연구 데이터 출처를 학술/정부 도메인으로 연결');
        actions.push('Wikipedia, PubMed, 정부기관 등 권위 사이트 외부 링크 추가');
        break;
      default:
        actions.push(rec.description);
    }

    if (actions.length === 0) actions.push(rec.description);
    return actions;
  }

  private calcGrade(percentile: number): OverallGrade {
    if (percentile >= 90) return 'S';
    if (percentile >= 75) return 'A';
    if (percentile >= 60) return 'B';
    if (percentile >= 40) return 'C';
    if (percentile >= 25) return 'D';
    return 'F';
  }

  private generateExecutiveSummary(
    position: RelativePosition,
    grade: OverallGrade,
    strategies: StrategyItem[]
  ): string {
    const tierLabel: Record<PositionTier, string> = {
      top10: '업종 최상위 (Top 10%)',
      top25: '업종 상위 (Top 25%)',
      above_avg: '업종 평균 이상',
      average: '업종 평균',
      below_avg: '업종 평균 이하',
      bottom25: '업종 하위 (Bottom 25%)',
    };

    const topWeakness = position.weaknesses[0];
    const topStrategy = strategies[0];

    return `${position.brandName}는 ${position.displayNameKo} 업종 내 ${tierLabel[position.overallTier]} (종합 ${position.overallPercentile}백분위, 등급: ${grade})에 위치합니다. ` +
      `${position.strengths.length > 0
        ? `강점은 ${position.strengths[0].metricNameKo} (업종 ${position.strengths[0].percentileRank}백분위)입니다. `
        : ''}` +
      `${topWeakness
        ? `가장 시급한 개선 영역은 ${topWeakness.metricNameKo} (업종 ${topWeakness.percentileRank}백분위)이며, `
        : ''}` +
      `${topStrategy
        ? `우선순위 1위 전략은 "${topStrategy.title}"입니다.`
        : '전략적 개선이 필요합니다.'}`;
  }
}
