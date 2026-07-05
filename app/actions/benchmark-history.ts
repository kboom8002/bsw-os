'use server';
/**
 * app/actions/benchmark-history.ts
 * 벤치마크 측정 이력 저장 및 불러오기 server actions.
 * industry_benchmark_snapshots 테이블의 measured_at 기준으로 이력을 그룹핑합니다.
 */

import { getSupabaseAdminClient } from '../../lib/supabase';
import { BENCHMARK_DOMAINS } from '../../lib/benchmark/domain-config';

const SNAPSHOTS_TABLE = 'industry_benchmark_snapshots';
const RUNS_TABLE = 'benchmark_measurement_runs';

import type { MeasurementRun, MeasurementRunDetail } from './benchmark-history-types';

/**
 * 모든 도메인의 측정 이력 목록을 가져옵니다.
 * benchmark_measurement_runs 테이블에서 도메인별 최근 20개를 반환합니다.
 * 테이블이 없을 경우 industry_benchmark_snapshots에서 직접 그룹핑합니다.
 */
export async function getBenchmarkMeasurementHistory(
  domainSlug?: string
): Promise<MeasurementRun[]> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return [];

  try {
    // First try dedicated runs table
    let query = supabase
      .from(RUNS_TABLE)
      .select('*')
      .order('measured_at', { ascending: false })
      .limit(50);

    if (domainSlug) {
      query = query.eq('domain_slug', domainSlug);
    }

    const { data: runsData, error: runsError } = await query;

    if (!runsError && runsData && runsData.length > 0) {
      return runsData.map((r: any) => ({
        ...r,
        domain_name: BENCHMARK_DOMAINS[r.domain_slug]?.name ?? r.domain_slug,
      }));
    }

    // Fallback: derive history from industry_benchmark_snapshots
    // Group by (domain_slug, measured_at) to get unique runs
    let snapshotQuery = supabase
      .from(SNAPSHOTS_TABLE)
      .select('domain_slug, measured_at, brand_slug, brand_name, sample_size')
      .order('measured_at', { ascending: false })
      .limit(500);

    if (domainSlug) {
      snapshotQuery = snapshotQuery.eq('domain_slug', domainSlug);
    }

    const { data: snapshots, error: snapshotError } = await snapshotQuery;

    if (snapshotError || !snapshots) return [];

    // Group snapshots into runs by (domain_slug + measured_at bucket)
    const runMap = new Map<string, MeasurementRun>();
    for (const snap of snapshots) {
      // Round measured_at to minute precision for grouping
      const at = new Date(snap.measured_at);
      at.setSeconds(0, 0);
      const bucket = `${snap.domain_slug}__${at.toISOString()}`;

      if (!runMap.has(bucket)) {
        runMap.set(bucket, {
          id: bucket,
          domain_slug: snap.domain_slug,
          domain_name: BENCHMARK_DOMAINS[snap.domain_slug]?.name ?? snap.domain_slug,
          run_label: null,
          measured_at: at.toISOString(),
          brand_count: 0,
          question_count: snap.sample_size ?? 0,
          engine: 'gemini_grounding',
          status: 'completed',
        });
      }
      const run = runMap.get(bucket)!;
      run.brand_count++;
    }

    return Array.from(runMap.values())
      .sort((a, b) => new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime())
      .slice(0, 50);

  } catch (err) {
    console.warn('[benchmark-history] Failed to load history:', err);
    return [];
  }
}

/**
 * 특정 측정 시점(measured_at)의 리더보드 데이터를 가져옵니다.
 */
export async function getMeasurementRunDetail(
  domainSlug: string,
  measuredAt: string
): Promise<MeasurementRunDetail | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  try {
    // Round to minute bucket to match grouping
    const at = new Date(measuredAt);
    at.setSeconds(0, 0);
    const atEnd = new Date(at.getTime() + 60_000); // +1 minute

    const { data: snapshots, error } = await supabase
      .from(SNAPSHOTS_TABLE)
      .select('*')
      .eq('domain_slug', domainSlug)
      .gte('measured_at', at.toISOString())
      .lt('measured_at', atEnd.toISOString())
      .order('bair', { ascending: false });

    if (error || !snapshots) return null;

    const domainConfig = BENCHMARK_DOMAINS[domainSlug];
    const leaderboard = snapshots.map((snap: any, idx: number) => {
      const brandCfg = domainConfig?.brands.find((b) => b.slug === snap.brand_slug);
      return {
        rank: idx + 1,
        brand_slug: snap.brand_slug,
        brand_name: snap.brand_name ?? brandCfg?.name ?? snap.brand_slug,
        aas: snap.aas ?? 0,
        ocr: snap.ocr ?? 0,
        bsf: snap.bsf ?? null,
        bair: snap.bair ?? null,
        bdr: snap.bdr ?? null,
        cwr: snap.cwr ?? null,
        color: brandCfg?.color ?? '#6366f1',
      };
    });

    return {
      id: `${domainSlug}__${at.toISOString()}`,
      domain_slug: domainSlug,
      domain_name: domainConfig?.name ?? domainSlug,
      run_label: null,
      measured_at: measuredAt,
      brand_count: snapshots.length,
      question_count: snapshots[0]?.sample_size ?? 0,
      engine: 'gemini_grounding',
      status: 'completed',
      leaderboard,
    };
  } catch (err) {
    console.warn('[benchmark-history] Failed to load run detail:', err);
    return null;
  }
}

/**
 * 측정 완료 후 runs 테이블에 레코드를 저장합니다.
 * /api/benchmark/save 에서 호출합니다.
 */
export async function saveMeasurementRun(params: {
  domainSlug: string;
  measuredAt: string;
  brandCount: number;
  questionCount: number;
  workspaceId?: string;
  runLabel?: string;
}): Promise<void> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;

  try {
    await supabase.from(RUNS_TABLE).insert({
      domain_slug: params.domainSlug,
      measured_at: params.measuredAt,
      brand_count: params.brandCount,
      question_count: params.questionCount,
      workspace_id: params.workspaceId ?? null,
      run_label: params.runLabel ?? null,
      engine: 'gemini_grounding',
      status: 'completed',
    });
  } catch (err) {
    // Non-fatal: snapshots table still has the data
    console.warn('[benchmark-history] Failed to record run:', err);
  }
}

/**
 * 측정 이력 레코드의 라벨을 업데이트합니다.
 */
export async function updateMeasurementRunLabel(
  runId: string,
  label: string
): Promise<{ success: boolean }> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { success: false };

  try {
    const { error } = await supabase
      .from(RUNS_TABLE)
      .update({ run_label: label })
      .eq('id', runId);

    return { success: !error };
  } catch {
    return { success: false };
  }
}

/**
 * 측정 이력 레코드를 삭제합니다 (admin only).
 */
export async function deleteMeasurementRun(runId: string): Promise<{ success: boolean }> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { success: false };

  try {
    const { error } = await supabase
      .from(RUNS_TABLE)
      .delete()
      .eq('id', runId);

    return { success: !error };
  } catch {
    return { success: false };
  }
}
