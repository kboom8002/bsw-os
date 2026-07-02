'use server';

/**
 * app/actions/industry-benchmark.ts
 *
 * 업종별 벤치마크 역설계 시스템 Server Actions
 * - 배치 감사 실행 (BatchAuditRunner)
 * - 벤치마크 프로필 / Blueprint 저장 & 조회 (BenchmarkAggregator)
 * - 레퍼런스 사이트 관리
 */

import { BatchAuditRunner, SiteAuditSnapshot, BatchAuditOptions } from '../../lib/industry/batch-audit-runner';
import { BenchmarkAggregator, IndustryBenchmarkProfile, IndustryBlueprint } from '../../lib/industry/benchmark-aggregator';
import {
  getReferenceSitesBySubIndustry,
  getDbReferenceSites as _getDbReferenceSites,
  addReferenceSite as _addReferenceSite,
  deleteReferenceSite as _deleteReferenceSite,
} from '../../lib/industry/reference-sites-registry';
import type { ReferenceSite, NewReferenceSite } from '../../lib/industry/reference-sites-registry';
import { findSubIndustry } from '../../lib/industry/industry-taxonomy';
import { getSupabaseAdminClient } from '../../lib/supabase';
import { QuickSiteAnalyzer } from '../../lib/surface/quick-site-analyzer';
import type { TechInfraAuditResult } from '../../lib/surface/tech-infra-auditor';
import type { SchemaQualityAuditResult } from '../../lib/surface/schema-quality-auditor';
import type { ContentSemanticResult } from '../../lib/surface/content-semantic-analyzer';

// ─────────────────────────────────────────────────────────────────────────────
// 배치 감사 실행
// ─────────────────────────────────────────────────────────────────────────────

export interface BatchAuditResult {
  snapshots: SiteAuditSnapshot[];
  profile: IndustryBenchmarkProfile;
  blueprint: IndustryBlueprint;
  subIndustryKey: string;
}

/**
 * 업종 전체 레퍼런스 사이트 배치 감사 → 집계 → DB 저장
 *
 * @param subIndustryKey  세부 업종 키 (e.g. 'skincare')
 * @param workspaceId     감사 워크스페이스 ID
 * @param mode            'quick' | 'full'
 */
export async function runBatchAudit(
  subIndustryKey: string,
  workspaceId: string,
  mode: 'quick' | 'full'
): Promise<BatchAuditResult> {
  // 1. 레퍼런스 사이트 조회
  const sites: ReferenceSite[] = getReferenceSitesBySubIndustry(subIndustryKey);
  if (sites.length === 0) {
    throw new Error(`No reference sites found for sub-industry: ${subIndustryKey}`);
  }

  // 2. 업종 메타 조회
  const subIndustry = findSubIndustry(subIndustryKey);
  const displayNameKo = subIndustry?.displayNameKo ?? subIndustryKey;

  // 3. 배치 감사 실행
  const options: BatchAuditOptions = { mode, maxPagesPerSite: 5, skipOnError: true };
  const runner = new BatchAuditRunner();
  const snapshots = await runner.runBatch(sites, workspaceId, options);

  // 4. 개별 감사 결과를 DB에 저장 (테이블 없을 경우 graceful fallback)
  try {
    const supabase = getSupabaseAdminClient();
    const rows = snapshots.map((snapshot) => ({
      reference_site_id: null,
      sub_industry_key: subIndustryKey,
      metrics: snapshot,
      audited_at: snapshot.auditedAt,
    }));
    const { error } = await supabase.from('benchmark_audit_results').insert(rows);
    if (error) {
      console.warn('[industry-benchmark] benchmark_audit_results insert failed:', error.message);
    }
  } catch (err: unknown) {
    console.warn('[industry-benchmark] DB save for audit results skipped:', err instanceof Error ? err.message : String(err));
  }

  // 5. 집계 실행 (유효한 스냅샷이 없으면 예외 발생 — 호출자에서 처리)
  const aggregator = new BenchmarkAggregator();
  const { profile, blueprint } = aggregator.aggregate(snapshots, subIndustryKey, displayNameKo);

  // 6. IndustryBenchmarkProfile DB 저장 (upsert on sub_industry_key)
  try {
    const supabase = getSupabaseAdminClient();
    const profileRow = {
      sub_industry_key: profile.subIndustryKey,
      display_name: profile.displayNameKo,
      sample_count: profile.sampleCount,
      percentile_distributions: profile.metricDistributions,
      tier_statistics: profile.tierStatistics,
      excellent_patterns: profile.excellentPatterns,
      common_pitfalls: profile.commonPitfalls,
      generated_at: profile.generatedAt,
    };
    const { error } = await supabase
      .from('industry_benchmark_profiles')
      .upsert(profileRow, { onConflict: 'sub_industry_key' });
    if (error) {
      console.warn('[industry-benchmark] industry_benchmark_profiles upsert failed:', error.message);
    }
  } catch (err: unknown) {
    console.warn('[industry-benchmark] DB save for benchmark profile skipped:', err instanceof Error ? err.message : String(err));
  }

  // 7. IndustryBlueprint DB 저장 (upsert on sub_industry_key)
  try {
    const supabase = getSupabaseAdminClient();
    const blueprintRow = {
      sub_industry_key: blueprint.subIndustryKey,
      display_name: blueprint.displayNameKo,
      tech_infra_standard: blueprint.techInfraStandard,
      schema_standard: blueprint.schemaStandard,
      content_strategy: blueprint.contentStrategy,
      design_patterns: blueprint.designPatterns,
      target_scores: blueprint.targetScores,
      sample_count: blueprint.sampleCount,
      generated_at: blueprint.generatedAt,
    };
    const { error } = await supabase
      .from('industry_blueprints')
      .upsert(blueprintRow, { onConflict: 'sub_industry_key' });
    if (error) {
      console.warn('[industry-benchmark] industry_blueprints upsert failed:', error.message);
    }
  } catch (err: unknown) {
    console.warn('[industry-benchmark] DB save for blueprint skipped:', err instanceof Error ? err.message : String(err));
  }

  return { snapshots, profile, blueprint, subIndustryKey };
}

// ─────────────────────────────────────────────────────────────────────────────
// 클라이언트 주도 오케스트레이션 (Pause / Resume 지원)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 단일 레퍼런스 사이트 감사 — 클라이언트가 1개씩 순차 호출하는 방식.
 * 각 호출은 Vercel 타임아웃(최대 5분) 내에 독립적으로 완료됩니다.
 */
export async function auditSingleSite(
  site: ReferenceSite,
  subIndustryKey: string,
  mode: 'quick' | 'full',
  workspaceId: string = 'admin'
): Promise<SiteAuditSnapshot> {
  const analyzer = new QuickSiteAnalyzer();

  let snapshot: SiteAuditSnapshot;

  try {
    console.log(`[auditSingleSite] Auditing: ${site.url}`);
    const result = await analyzer.analyze(workspaceId, site.url, site.brandName);

    const techInfra: TechInfraAuditResult | undefined = result.techInfra;
    const schemaQuality: SchemaQualityAuditResult | undefined = result.schemaQuality;
    const contentSemantic: ContentSemanticResult | undefined = result.contentSemantic;

    const schemaTypesPresent: string[] = [];
    if (schemaQuality?.organizationSchema)                        schemaTypesPresent.push('Organization');
    if (schemaQuality?.localBusinessSchema)                       schemaTypesPresent.push('LocalBusiness');
    if ((schemaQuality?.faqPageSchemas?.length ?? 0) > 0)        schemaTypesPresent.push('FAQPage');
    if ((schemaQuality?.howToSchemas?.length ?? 0) > 0)          schemaTypesPresent.push('HowTo');
    if ((schemaQuality?.productSchemas?.length ?? 0) > 0)        schemaTypesPresent.push('Product');
    if ((schemaQuality?.articleSchemas?.length ?? 0) > 0)        schemaTypesPresent.push('Article');
    if ((schemaQuality?.breadcrumbSchemas?.length ?? 0) > 0)     schemaTypesPresent.push('BreadcrumbList');
    if ((schemaQuality?.aggregateRatingSchemas?.length ?? 0) > 0) schemaTypesPresent.push('AggregateRating');

    const allIssues = [
      ...(techInfra?.issues ?? []),
      ...(schemaQuality?.issues ?? []),
      ...(contentSemantic?.issues ?? []),
    ];

    snapshot = {
      siteId: site.id,
      siteUrl: site.url,
      brandName: site.brandName,
      tier: site.tier,
      subIndustryKey,
      techInfraScore: techInfra?.techInfraScore ?? 0,
      aiCrawlerAccessScore: techInfra?.aiCrawlerAccessScore ?? 0,
      ttfbMs: techInfra?.ttfbMs ?? 0,
      sitemapFreshnessScore: techInfra?.sitemapFreshnessScore ?? 0,
      canonicalConsistency: techInfra?.canonicalConsistency ?? 0,
      httpsEnabled: techInfra?.httpsEnabled ?? false,
      llmsTxtExists: techInfra?.llmsTxtExists ?? false,
      renderingMode: techInfra?.renderingMode ?? 'ssr',
      robotsBotMatrix: (techInfra?.robotsBotMatrix ?? []).map(b => ({ botName: b.botName, allowed: b.allowed })),
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
      totalPages: result.crawledPages,
      topicClusterCount: contentSemantic?.topicClusters?.length ?? 0,
      totalImages: contentSemantic?.multimediaAudit?.totalImages ?? 0,
      imagesWithAlt: contentSemantic?.multimediaAudit?.imagesWithAlt ?? 0,
      totalOutboundLinks: contentSemantic?.citationNetwork?.totalOutboundLinks ?? 0,
      authorityDomainRatio: contentSemantic?.citationNetwork?.authorityDomainRatio ?? 0,
      criticalIssueCount: allIssues.filter(i => i.severity === 'critical').length,
      warningIssueCount: allIssues.filter(i => i.severity === 'warning').length,
      auditMode: mode,
      auditedAt: new Date().toISOString(),
    };

    console.log(`[auditSingleSite] ✓ ${site.brandName}: L1=${snapshot.techInfraScore} L2=${snapshot.schemaQualityScore} L3=${snapshot.contentSemanticScore}`);

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[auditSingleSite] ✗ Failed ${site.url}: ${msg}`);

    // 실패 시 빈 스냅샷 반환 (중단 방지)
    snapshot = {
      siteId: site.id, siteUrl: site.url, brandName: site.brandName,
      tier: site.tier, subIndustryKey,
      techInfraScore: 0, aiCrawlerAccessScore: 0, ttfbMs: 0,
      sitemapFreshnessScore: 0, canonicalConsistency: 0,
      httpsEnabled: false, llmsTxtExists: false, renderingMode: 'ssr', robotsBotMatrix: [],
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
      auditMode: mode, auditedAt: new Date().toISOString(),
      error: msg,
    };
  }

  // 단일 결과를 DB에 즉시 저장 (중간 저장 — 재개 시 활용 가능)
  try {
    const supabase = getSupabaseAdminClient();
    await supabase.from('benchmark_audit_results').insert({
      reference_site_id: null,
      sub_industry_key: subIndustryKey,
      metrics: snapshot,
      audited_at: snapshot.auditedAt,
    });
  } catch {
    // graceful fallback — DB가 없어도 진행
  }

  return snapshot;
}

export interface AggregateBatchAuditResult {
  profile: IndustryBenchmarkProfile;
  blueprint: IndustryBlueprint;
}

/**
 * 수집된 스냅샷 배열로 집계 → Blueprint 생성 → DB 저장.
 * 클라이언트 루프가 완료되거나 일시정지 후 재개 완료 시 호출합니다.
 */
export async function aggregateBatchAudit(
  snapshots: SiteAuditSnapshot[],
  subIndustryKey: string
): Promise<AggregateBatchAuditResult> {
  if (snapshots.length === 0) {
    throw new Error('aggregateBatchAudit: 스냅샷이 없습니다.');
  }

  const subIndustry = findSubIndustry(subIndustryKey);
  const displayNameKo = subIndustry?.displayNameKo ?? subIndustryKey;

  const aggregator = new BenchmarkAggregator();
  const { profile, blueprint } = aggregator.aggregate(snapshots, subIndustryKey, displayNameKo);

  // IndustryBenchmarkProfile 저장
  try {
    const supabase = getSupabaseAdminClient();
    await supabase.from('industry_benchmark_profiles').upsert({
      sub_industry_key: profile.subIndustryKey,
      display_name: profile.displayNameKo,
      sample_count: profile.sampleCount,
      percentile_distributions: profile.metricDistributions,
      tier_statistics: profile.tierStatistics,
      excellent_patterns: profile.excellentPatterns,
      common_pitfalls: profile.commonPitfalls,
      generated_at: profile.generatedAt,
    }, { onConflict: 'sub_industry_key' });
  } catch {
    // graceful fallback
  }

  // IndustryBlueprint 저장
  try {
    const supabase = getSupabaseAdminClient();
    await supabase.from('industry_blueprints').upsert({
      sub_industry_key: blueprint.subIndustryKey,
      display_name: blueprint.displayNameKo,
      tech_infra_standard: blueprint.techInfraStandard,
      schema_standard: blueprint.schemaStandard,
      content_strategy: blueprint.contentStrategy,
      design_patterns: blueprint.designPatterns,
      target_scores: blueprint.targetScores,
      sample_count: blueprint.sampleCount,
      generated_at: blueprint.generatedAt,
    }, { onConflict: 'sub_industry_key' });
  } catch {
    // graceful fallback
  }

  return { profile, blueprint };
}

// ─────────────────────────────────────────────────────────────────────────────
// 조회 — 프로필 / Blueprint / 감사 이력
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 업종 벤치마크 프로필 조회
 */
export async function getBenchmarkProfile(
  subIndustryKey: string
): Promise<IndustryBenchmarkProfile | null> {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from('industry_benchmark_profiles')
      .select('*')
      .eq('sub_industry_key', subIndustryKey)
      .single();

    if (error || !data) return null;

    // DB 컬럼 → IndustryBenchmarkProfile 형태로 변환
    const profile: IndustryBenchmarkProfile = {
      subIndustryKey: data.sub_industry_key,
      displayNameKo: data.display_name,
      sampleCount: data.sample_count,
      generatedAt: data.generated_at,
      metricDistributions: data.percentile_distributions ?? {},
      tierStatistics: data.tier_statistics ?? {},
      excellentPatterns: data.excellent_patterns ?? [],
      commonPitfalls: data.common_pitfalls ?? [],
    };

    return profile;
  } catch (err: unknown) {
    console.warn('[industry-benchmark] getBenchmarkProfile failed:', err instanceof Error ? err.message : String(err));
    return null;
  }
}

/**
 * 업종 표준 설계안(Blueprint) 조회
 */
export async function getIndustryBlueprint(
  subIndustryKey: string
): Promise<IndustryBlueprint | null> {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from('industry_blueprints')
      .select('*')
      .eq('sub_industry_key', subIndustryKey)
      .single();

    if (error || !data) return null;

    // DB 컬럼 → IndustryBlueprint 형태로 변환
    const blueprint: IndustryBlueprint = {
      subIndustryKey: data.sub_industry_key,
      displayNameKo: data.display_name,
      sampleCount: data.sample_count ?? 0,
      generatedAt: data.generated_at,
      techInfraStandard: data.tech_infra_standard ?? { title: '', targetScore: 0, currentIndustryAvg: 0, recommendations: [] },
      schemaStandard: data.schema_standard ?? { title: '', targetScore: 0, currentIndustryAvg: 0, recommendations: [] },
      contentStrategy: data.content_strategy ?? { title: '', targetScore: 0, currentIndustryAvg: 0, recommendations: [] },
      designPatterns: data.design_patterns ?? { title: '', targetScore: 0, currentIndustryAvg: 0, recommendations: [] },
      targetScores: data.target_scores ?? {},
    };

    return blueprint;
  } catch (err: unknown) {
    console.warn('[industry-benchmark] getIndustryBlueprint failed:', err instanceof Error ? err.message : String(err));
    return null;
  }
}

/**
 * 업종 감사 이력 조회 (최근 50건)
 */
export async function getBenchmarkAuditHistory(
  subIndustryKey: string
): Promise<SiteAuditSnapshot[]> {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from('benchmark_audit_results')
      .select('metrics')
      .eq('sub_industry_key', subIndustryKey)
      .order('audited_at', { ascending: false })
      .limit(50);

    if (error || !data) return [];

    // metrics 컬럼이 SiteAuditSnapshot 형태로 저장됨
    return data.map((row) => row.metrics as SiteAuditSnapshot);
  } catch (err: unknown) {
    console.warn('[industry-benchmark] getBenchmarkAuditHistory failed:', err instanceof Error ? err.message : String(err));
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 레퍼런스 사이트 관리 — reference-sites-registry.ts에서 re-export
// ─────────────────────────────────────────────────────────────────────────────



/** 레퍼런스 사이트 추가 (Server Action wrapper) */
export async function addReferenceSite(site: NewReferenceSite): Promise<{ id: string }> {
  return _addReferenceSite(site);
}

/** 레퍼런스 사이트 삭제 (Server Action wrapper) */
export async function deleteReferenceSite(id: string): Promise<boolean> {
  return _deleteReferenceSite(id);
}

/** DB에서 사용자 추가 사이트 조회 (Server Action wrapper) */
export async function getDbReferenceSites(subIndustryKey: string): Promise<ReferenceSite[]> {
  return _getDbReferenceSites(subIndustryKey);
}
