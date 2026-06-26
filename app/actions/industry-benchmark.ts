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
  addReferenceSite as _addReferenceSite,
  deleteReferenceSite as _deleteReferenceSite,
} from '../../lib/industry/reference-sites-registry';
import type { ReferenceSite, NewReferenceSite } from '../../lib/industry/reference-sites-registry';
import { findSubIndustry } from '../../lib/industry/industry-taxonomy';
import { getSupabaseAdminClient } from '../../lib/supabase';

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
