// lib/industry/batch-audit-runner.ts
// 업종별 레퍼런스 사이트 배치 감사 엔진
// Quick (HTML-only) 또는 Full (AI 반영 포함) 옵션 선택 가능

import { QuickSiteAnalyzer } from '../surface/quick-site-analyzer';
import { TechInfraAuditResult } from '../surface/tech-infra-auditor';
import { SchemaQualityAuditResult } from '../surface/schema-quality-auditor';
import { ContentSemanticResult } from '../surface/content-semantic-analyzer';
import { ReferenceSite } from './reference-sites-registry';

export interface SiteAuditSnapshot {
  siteId: string;
  siteUrl: string;
  brandName: string;
  tier: 'excellent' | 'average' | 'poor';
  subIndustryKey: string;

  // L1 메트릭
  techInfraScore: number;
  aiCrawlerAccessScore: number;
  ttfbMs: number;
  sitemapFreshnessScore: number;
  canonicalConsistency: number;
  httpsEnabled: boolean;
  llmsTxtExists: boolean;
  renderingMode: string;
  robotsBotMatrix: { botName: string; allowed: boolean }[];

  // L2 메트릭
  schemaQualityScore: number;
  schemaCoverage: number;
  ogCompleteness: number;
  schemaTypeCount: number;
  schemaTypesPresent: string[];
  orgSchemaPresent: boolean;
  orgSameAsCount: number;
  faqSchemaCount: number;
  howToSchemaCount: number;
  productSchemaCount: number;
  articleSchemaCount: number;

  // L3 메트릭
  contentSemanticScore: number;
  eeatOverall: number;
  eeatExperience: number;
  eeatExpertise: number;
  eeatAuthoritativeness: number;
  eeatTrustworthiness: number;
  answerFirstAvgScore: number;
  freshnessScore: number;
  multimediaScore: number;
  citationQualityScore: number;
  internalLinkTopologyScore: number;
  originalityScore: number;
  quantitativeDataDensity: number;

  // 구조 메트릭
  totalPages: number;
  topicClusterCount: number;
  totalImages: number;
  imagesWithAlt: number;
  totalOutboundLinks: number;
  authorityDomainRatio: number;

  // 이슈 요약
  criticalIssueCount: number;
  warningIssueCount: number;

  auditMode: 'quick' | 'full';
  auditedAt: string;
  error?: string;
}

export interface BatchAuditOptions {
  /** 'quick': HTML-only 분석 (AI API 비용 없음, ~5-10초/사이트)
   *  'full': AI 반영도 포함 (API 비용 발생, ~60-120초/사이트) */
  mode: 'quick' | 'full';
  /** 사이트당 최대 크롤링 페이지 수 (기본: 5) */
  maxPagesPerSite?: number;
  /** 실패한 사이트를 건너뛰고 계속 진행할지 여부 (기본: true) */
  skipOnError?: boolean;
}

export interface BatchAuditProgress {
  total: number;
  completed: number;
  failed: number;
  currentSite?: string;
  results: SiteAuditSnapshot[];
}

export class BatchAuditRunner {
  /**
   * 레퍼런스 사이트 목록을 순차적으로 감사하고 결과를 수집합니다.
   *
   * @param sites 감사할 레퍼런스 사이트 목록
   * @param workspaceId 워크스페이스 ID (QuickSiteAnalyzer 호환)
   * @param options 감사 옵션 (quick/full, maxPages 등)
   * @param onProgress 진행 상황 콜백 (선택)
   */
  async runBatch(
    sites: ReferenceSite[],
    workspaceId: string,
    options: BatchAuditOptions = { mode: 'quick' },
    onProgress?: (progress: BatchAuditProgress) => void
  ): Promise<SiteAuditSnapshot[]> {
    const { mode = 'quick', skipOnError = true } = options;
    const snapshots: SiteAuditSnapshot[] = [];
    const analyzer = new QuickSiteAnalyzer();

    for (let i = 0; i < sites.length; i++) {
      const site = sites[i];

      onProgress?.({
        total: sites.length,
        completed: i,
        failed: sites.length - snapshots.length - (sites.length - i),
        currentSite: site.url,
        results: snapshots,
      });

      try {
        console.log(`[BatchAudit] (${i + 1}/${sites.length}) Auditing: ${site.url}`);

        const result = await analyzer.analyze(workspaceId, site.url, site.brandName);

        const techInfra: TechInfraAuditResult | undefined = result.techInfra;
        const schemaQuality: SchemaQualityAuditResult | undefined = result.schemaQuality;
        const contentSemantic: ContentSemanticResult | undefined = result.contentSemantic;

        // 스키마 유형 목록 수집
        const schemaTypesPresent: string[] = [];
        if (schemaQuality?.organizationSchema) schemaTypesPresent.push('Organization');
        if (schemaQuality?.localBusinessSchema) schemaTypesPresent.push('LocalBusiness');
        if ((schemaQuality?.faqPageSchemas?.length ?? 0) > 0) schemaTypesPresent.push('FAQPage');
        if ((schemaQuality?.howToSchemas?.length ?? 0) > 0) schemaTypesPresent.push('HowTo');
        if ((schemaQuality?.productSchemas?.length ?? 0) > 0) schemaTypesPresent.push('Product');
        if ((schemaQuality?.articleSchemas?.length ?? 0) > 0) schemaTypesPresent.push('Article');
        if ((schemaQuality?.breadcrumbSchemas?.length ?? 0) > 0) schemaTypesPresent.push('BreadcrumbList');
        if ((schemaQuality?.aggregateRatingSchemas?.length ?? 0) > 0) schemaTypesPresent.push('AggregateRating');

        // 이슈 카운트
        const allL1Issues = techInfra?.issues ?? [];
        const allL2Issues = schemaQuality?.issues ?? [];
        const allL3Issues = contentSemantic?.issues ?? [];
        const allIssues = [...allL1Issues, ...allL2Issues, ...allL3Issues];
        const criticalCount = allIssues.filter(iss => iss.severity === 'critical').length;
        const warningCount = allIssues.filter(iss => iss.severity === 'warning').length;

        const snapshot: SiteAuditSnapshot = {
          siteId: site.id,
          siteUrl: site.url,
          brandName: site.brandName,
          tier: site.tier,
          subIndustryKey: site.subIndustryKey,

          // L1
          techInfraScore: techInfra?.techInfraScore ?? 0,
          aiCrawlerAccessScore: techInfra?.aiCrawlerAccessScore ?? 0,
          ttfbMs: techInfra?.ttfbMs ?? 0,
          sitemapFreshnessScore: techInfra?.sitemapFreshnessScore ?? 0,
          canonicalConsistency: techInfra?.canonicalConsistency ?? 0,
          httpsEnabled: techInfra?.httpsEnabled ?? false,
          llmsTxtExists: techInfra?.llmsTxtExists ?? false,
          renderingMode: techInfra?.renderingMode ?? 'ssr',
          robotsBotMatrix: (techInfra?.robotsBotMatrix ?? []).map(b => ({
            botName: b.botName,
            allowed: b.allowed,
          })),

          // L2
          schemaQualityScore: schemaQuality?.schemaQualityScore ?? 0,
          schemaCoverage: schemaQuality?.schemaCoverage ?? 0,
          ogCompleteness: schemaQuality?.ogCompleteness?.completenessScore ?? 0,
          schemaTypeCount: schemaQuality?.schemaTypeCount ?? 0,
          schemaTypesPresent,
          orgSchemaPresent: !!schemaQuality?.organizationSchema,
          orgSameAsCount: schemaQuality?.orgSameAsProfiles?.length ?? 0,
          faqSchemaCount: schemaQuality?.faqPageSchemas?.length ?? 0,
          howToSchemaCount: schemaQuality?.howToSchemas?.length ?? 0,
          productSchemaCount: schemaQuality?.productSchemas?.length ?? 0,
          articleSchemaCount: schemaQuality?.articleSchemas?.length ?? 0,

          // L3
          contentSemanticScore: contentSemantic?.contentSemanticScore ?? 0,
          eeatOverall: contentSemantic?.eeat?.overall ?? 0,
          eeatExperience: contentSemantic?.eeat?.experience ?? 0,
          eeatExpertise: contentSemantic?.eeat?.expertise ?? 0,
          eeatAuthoritativeness: contentSemantic?.eeat?.authoritativeness ?? 0,
          eeatTrustworthiness: contentSemantic?.eeat?.trustworthiness ?? 0,
          answerFirstAvgScore: contentSemantic
            ? (contentSemantic.answerFirstScores.reduce((s, a) => s + a.directAnswerScore, 0) /
               Math.max(contentSemantic.answerFirstScores.length, 1))
            : 0,
          freshnessScore: contentSemantic?.freshnessAnalysis?.freshnessScore ?? 0,
          multimediaScore: contentSemantic?.multimediaAudit?.multimediaScore ?? 0,
          citationQualityScore: contentSemantic?.citationNetwork?.citationQualityScore ?? 0,
          internalLinkTopologyScore: contentSemantic?.internalLinkTopology?.topologyScore ?? 0,
          originalityScore: contentSemantic?.originalityScore ?? 0,
          quantitativeDataDensity: contentSemantic?.quantitativeDataDensity ?? 0,

          // 구조
          totalPages: result.crawledPages,
          topicClusterCount: contentSemantic?.topicClusters?.length ?? 0,
          totalImages: contentSemantic?.multimediaAudit?.totalImages ?? 0,
          imagesWithAlt: contentSemantic?.multimediaAudit?.imagesWithAlt ?? 0,
          totalOutboundLinks: contentSemantic?.citationNetwork?.totalOutboundLinks ?? 0,
          authorityDomainRatio: contentSemantic?.citationNetwork?.authorityDomainRatio ?? 0,

          // 이슈
          criticalIssueCount: criticalCount,
          warningIssueCount: warningCount,

          auditMode: mode,
          auditedAt: new Date().toISOString(),
        };

        snapshots.push(snapshot);
        console.log(`[BatchAudit] ✓ ${site.brandName}: L1=${snapshot.techInfraScore} L2=${snapshot.schemaQualityScore} L3=${snapshot.contentSemanticScore}`);

      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error(`[BatchAudit] ✗ Failed ${site.url}: ${msg}`);

        if (!skipOnError) throw error;

        // 실패한 사이트는 빈 스냅샷으로 기록
        snapshots.push({
          siteId: site.id,
          siteUrl: site.url,
          brandName: site.brandName,
          tier: site.tier,
          subIndustryKey: site.subIndustryKey,
          techInfraScore: 0, aiCrawlerAccessScore: 0, ttfbMs: 0,
          sitemapFreshnessScore: 0, canonicalConsistency: 0,
          httpsEnabled: false, llmsTxtExists: false, renderingMode: 'ssr',
          robotsBotMatrix: [],
          schemaQualityScore: 0, schemaCoverage: 0, ogCompleteness: 0,
          schemaTypeCount: 0, schemaTypesPresent: [], orgSchemaPresent: false,
          orgSameAsCount: 0, faqSchemaCount: 0, howToSchemaCount: 0,
          productSchemaCount: 0, articleSchemaCount: 0,
          contentSemanticScore: 0, eeatOverall: 0, eeatExperience: 0,
          eeatExpertise: 0, eeatAuthoritativeness: 0, eeatTrustworthiness: 0,
          answerFirstAvgScore: 0, freshnessScore: 0, multimediaScore: 0,
          citationQualityScore: 0, internalLinkTopologyScore: 0,
          originalityScore: 0, quantitativeDataDensity: 0,
          totalPages: 0, topicClusterCount: 0, totalImages: 0,
          imagesWithAlt: 0, totalOutboundLinks: 0, authorityDomainRatio: 0,
          criticalIssueCount: 0, warningIssueCount: 0,
          auditMode: mode,
          auditedAt: new Date().toISOString(),
          error: msg,
        });
      }
    }

    onProgress?.({
      total: sites.length,
      completed: sites.length,
      failed: snapshots.filter(s => !!s.error).length,
      results: snapshots,
    });

    return snapshots;
  }
}

/**
 * 22개 벤치마크 메트릭 키 목록 (집계 시 사용)
 */
export const BENCHMARK_METRIC_KEYS = [
  'techInfraScore',
  'aiCrawlerAccessScore',
  'ttfbMs',
  'sitemapFreshnessScore',
  'canonicalConsistency',
  'schemaQualityScore',
  'schemaCoverage',
  'ogCompleteness',
  'schemaTypeCount',
  'contentSemanticScore',
  'eeatOverall',
  'eeatExperience',
  'eeatExpertise',
  'eeatAuthoritativeness',
  'eeatTrustworthiness',
  'answerFirstAvgScore',
  'freshnessScore',
  'multimediaScore',
  'citationQualityScore',
  'internalLinkTopologyScore',
  'originalityScore',
  'quantitativeDataDensity',
] as const;

export type BenchmarkMetricKey = (typeof BENCHMARK_METRIC_KEYS)[number];

export const METRIC_META: Record<BenchmarkMetricKey, {
  nameKo: string;
  nameEn: string;
  layer: 'L1' | 'L2' | 'L3';
  higherIsBetter: boolean;
  unit: string;
  weight: number; // 상대 중요도 (합계=100)
}> = {
  techInfraScore:           { nameKo: '기술 인프라 종합', nameEn: 'Tech Infra Score', layer: 'L1', higherIsBetter: true, unit: 'pt', weight: 8 },
  aiCrawlerAccessScore:     { nameKo: 'AI 봇 접근성', nameEn: 'AI Crawler Access', layer: 'L1', higherIsBetter: true, unit: 'pt', weight: 7 },
  ttfbMs:                   { nameKo: '응답 속도(TTFB)', nameEn: 'TTFB', layer: 'L1', higherIsBetter: false, unit: 'ms', weight: 4 },
  sitemapFreshnessScore:    { nameKo: '사이트맵 갱신율', nameEn: 'Sitemap Freshness', layer: 'L1', higherIsBetter: true, unit: 'pt', weight: 3 },
  canonicalConsistency:     { nameKo: 'Canonical 일관성', nameEn: 'Canonical Consistency', layer: 'L1', higherIsBetter: true, unit: '%', weight: 3 },
  schemaQualityScore:       { nameKo: '스키마 품질 종합', nameEn: 'Schema Quality Score', layer: 'L2', higherIsBetter: true, unit: 'pt', weight: 8 },
  schemaCoverage:           { nameKo: '스키마 커버리지', nameEn: 'Schema Coverage', layer: 'L2', higherIsBetter: true, unit: '%', weight: 5 },
  ogCompleteness:           { nameKo: 'OG 태그 완성도', nameEn: 'OG Completeness', layer: 'L2', higherIsBetter: true, unit: 'pt', weight: 4 },
  schemaTypeCount:          { nameKo: '스키마 유형 수', nameEn: 'Schema Type Count', layer: 'L2', higherIsBetter: true, unit: 'types', weight: 4 },
  contentSemanticScore:     { nameKo: '콘텐츠 시맨틱 종합', nameEn: 'Content Semantic Score', layer: 'L3', higherIsBetter: true, unit: 'pt', weight: 8 },
  eeatOverall:              { nameKo: 'E-E-A-T 종합', nameEn: 'E-E-A-T Overall', layer: 'L3', higherIsBetter: true, unit: 'pt', weight: 8 },
  eeatExperience:           { nameKo: 'E-E-A-T 경험', nameEn: 'E-E-A-T Experience', layer: 'L3', higherIsBetter: true, unit: 'pt', weight: 4 },
  eeatExpertise:            { nameKo: 'E-E-A-T 전문성', nameEn: 'E-E-A-T Expertise', layer: 'L3', higherIsBetter: true, unit: 'pt', weight: 4 },
  eeatAuthoritativeness:    { nameKo: 'E-E-A-T 권위', nameEn: 'E-E-A-T Authoritativeness', layer: 'L3', higherIsBetter: true, unit: 'pt', weight: 4 },
  eeatTrustworthiness:      { nameKo: 'E-E-A-T 신뢰', nameEn: 'E-E-A-T Trustworthiness', layer: 'L3', higherIsBetter: true, unit: 'pt', weight: 4 },
  answerFirstAvgScore:      { nameKo: 'Answer-First 문체', nameEn: 'Answer-First Score', layer: 'L3', higherIsBetter: true, unit: 'pt', weight: 5 },
  freshnessScore:           { nameKo: '콘텐츠 신선도', nameEn: 'Freshness Score', layer: 'L3', higherIsBetter: true, unit: 'pt', weight: 5 },
  multimediaScore:          { nameKo: '멀티모달 자산', nameEn: 'Multimedia Score', layer: 'L3', higherIsBetter: true, unit: 'pt', weight: 4 },
  citationQualityScore:     { nameKo: '인용 네트워크 품질', nameEn: 'Citation Quality', layer: 'L3', higherIsBetter: true, unit: 'pt', weight: 4 },
  internalLinkTopologyScore:{ nameKo: '내부 링크 토폴로지', nameEn: 'Internal Link Topology', layer: 'L3', higherIsBetter: true, unit: 'pt', weight: 4 },
  originalityScore:         { nameKo: '콘텐츠 독창성', nameEn: 'Originality Score', layer: 'L3', higherIsBetter: true, unit: 'pt', weight: 4 },
  quantitativeDataDensity:  { nameKo: '정량 데이터 밀도', nameEn: 'Quantitative Data Density', layer: 'L3', higherIsBetter: true, unit: '%', weight: 3 },
};
