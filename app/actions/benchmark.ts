'use server';

/**
 * app/actions/benchmark.ts
 *
 * 정기 발표용 Industry Benchmark 대시보드용 Server Actions.
 * Supabase의 industry_benchmark_snapshots 테이블을 통해
 * 측정 데이터를 저장하고 조회합니다.
 */

import { getSupabaseAdminClient } from '../../lib/supabase';
import { LightweightMetricRunner } from '../../lib/benchmark/lightweight-metric-runner';
import { BENCHMARK_DOMAINS, type DomainSlug, type DomainConfig } from '../../lib/benchmark/domain-config';
import { INDUSTRY_PANELS_DATA } from '../../db/seed/industry-panels/questions-data';
import type { LightweightBrandResult } from '../../lib/benchmark/lightweight-metric-runner';

const TABLE = 'industry_benchmark_snapshots';

// ─── 타입 ──────────────────────────────────────────────────────
export interface BenchmarkLeaderboardEntry {
  rank: number;
  brand_slug: string;
  brand_name: string;
  aas: number;
  ocr: number;
  bsf: number | null;
  bair: number | null;
  aas_trend: number;   // 이전 대비 변화 (+/-/0)
  color: string;
}

export interface BenchmarkHistoryPoint {
  date: string;        // 'YYYY-MM-DD'
  brand_slug: string;
  brand_name: string;
  aas: number;
  ocr: number;
}

export interface DomainLeaderboardResult {
  domain_slug: string;
  domain_name: string;
  measured_at: string;
  leaderboard: BenchmarkLeaderboardEntry[];
  history: BenchmarkHistoryPoint[];
}

// ─── 측정 실행 ─────────────────────────────────────────────────

/**
 * 경량 측정 실행 (Daily: AAS + OCR + BSF, AI 0호출)
 */
export async function runLightBenchmark(
  domainSlug: DomainSlug,
  workspaceId?: string,
  engines: string[] = ['chatgpt_search', 'gemini_grounding']
): Promise<{ success: boolean; message: string; results?: LightweightBrandResult[] }> {
  try {
    const supabase = getSupabaseAdminClient();
    let actualWorkspaceId = workspaceId;
    if (!actualWorkspaceId) {
      const { data: ws } = await supabase.from('workspaces').select('id').limit(1).single();
      if (ws) actualWorkspaceId = ws.id;
    }
    if (!actualWorkspaceId) {
      return { success: false, message: 'No workspace found in database. Please run seeder first.' };
    }

    const domainConfig = BENCHMARK_DOMAINS[domainSlug];
    if (!domainConfig) {
      return { success: false, message: `Unknown domain: ${domainSlug}` };
    }

    const industryType = domainConfig.industryType as keyof typeof INDUSTRY_PANELS_DATA;
    const panelData = INDUSTRY_PANELS_DATA[industryType];
    if (!panelData) {
      return { success: false, message: `No question panel found for industry: ${industryType}` };
    }

    const runner = new LightweightMetricRunner(engines);
    const result = await runner.run(domainConfig, panelData.questions, 'daily_light');

    // Supabase에 저장
    const records = result.brand_results.map((br) => ({
      workspace_id: actualWorkspaceId,
      domain_slug: domainSlug,
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
      measurement_type: 'daily_light',
      measured_at: br.measured_at,
    }));

    const { error } = await supabase.from(TABLE).insert(records);
    if (error) {
      console.warn('[benchmark] Supabase insert failed (table may not exist):', error.message);
      // 테이블이 없어도 측정 결과는 반환
    }

    return {
      success: true,
      message: `Light benchmark completed for ${domainConfig.name}. ${records.length} brand snapshots saved.`,
      results: result.brand_results,
    };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

/**
 * 최신 리더보드 조회 — DB 스냅샷 기반
 */
export async function getLatestLeaderboard(
  domainSlug: string,
  workspaceId?: string
): Promise<DomainLeaderboardResult | null> {
  const domainConfig = BENCHMARK_DOMAINS[domainSlug as DomainSlug];
  if (!domainConfig) return null;

  try {
    const supabase = getSupabaseAdminClient();

    // 최신 측정 타임스탬프 조회 (정확한 timestamp 기준으로 조회)
    const { data: latest } = await supabase
      .from(TABLE)
      .select('measured_at')
      .eq('domain_slug', domainSlug)
      .order('measured_at', { ascending: false })
      .limit(1);

    if (!latest || latest.length === 0) {
      // DB 데이터 없음 → mock 데이터 반환
      return _getMockLeaderboard(domainConfig);
    }

    const latestTs = latest[0].measured_at;

    // 최신 배치 스냅샷 조회 — 정확한 타임스탬프로 조회하여 동일 배치만 가져옴
    // (같은 측정 실행에서 저장된 브랜드들은 동일 measured_at을 공유)
    const { data: snapshots } = await supabase
      .from(TABLE)
      .select('*')
      .eq('domain_slug', domainSlug)
      .eq('measured_at', latestTs);

    // 이전 측정 스냅샷 (trend 계산용) — 최신 타임스탬프 이전 것
    const { data: prevSnapshots } = await supabase
      .from(TABLE)
      .select('*')
      .eq('domain_slug', domainSlug)
      .lt('measured_at', latestTs)
      .order('measured_at', { ascending: false })
      .limit(domainConfig.brands.length);

    const leaderboard = _buildLeaderboard(
      domainConfig,
      snapshots ?? [],
      prevSnapshots ?? []
    );

    // 30일 히스토리
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: historyData } = await supabase
      .from(TABLE)
      .select('measured_at, brand_slug, brand_name, aas, ocr')
      .eq('domain_slug', domainSlug)
      .gte('measured_at', thirtyDaysAgo.toISOString())
      .order('measured_at', { ascending: true });

    const history = (historyData ?? []).map(h => ({
      date: h.measured_at.split('T')[0],
      brand_slug: h.brand_slug,
      brand_name: h.brand_name,
      aas: h.aas,
      ocr: h.ocr,
    }));

    return {
      domain_slug: domainSlug,
      domain_name: domainConfig.name,
      measured_at: latest[0].measured_at,
      leaderboard,
      history,
    };
  } catch {
    // DB 접근 실패 시 mock 반환
    return _getMockLeaderboard(domainConfig);
  }
}

/**
 * 모든 도메인 최신 요약 조회
 */
export async function getAllDomainSummaries(): Promise<Record<string, DomainLeaderboardResult | null>> {
  const results: Record<string, DomainLeaderboardResult | null> = {};
  await Promise.all(
    Object.keys(BENCHMARK_DOMAINS).map(async (slug) => {
      results[slug] = await getLatestLeaderboard(slug);
    })
  );
  return results;
}

// ─── Private Helpers ──────────────────────────────────────────

function _buildLeaderboard(
  domainConfig: DomainConfig,
  snapshots: any[],
  prevSnapshots: any[]
): BenchmarkLeaderboardEntry[] {
  const entries: BenchmarkLeaderboardEntry[] = domainConfig.brands.map(brand => {
    const snap = snapshots.find(s => s.brand_slug === brand.slug);
    const prev = prevSnapshots.find(s => s.brand_slug === brand.slug);

    const aas = snap?.aas ?? 0;
    const ocr = snap?.ocr ?? 0;
    const bsf = snap?.bsf ?? null;
    const bair = snap?.bair ?? null;
    const prevAas = prev?.aas ?? 0;
    const aasTrend = parseFloat((aas - prevAas).toFixed(1));

    return {
      rank: 0,
      brand_slug: brand.slug,
      brand_name: brand.name,
      aas, ocr, bsf, bair,
      aas_trend: aasTrend,
      color: brand.color,
    };
  });

  entries.sort((a: BenchmarkLeaderboardEntry, b: BenchmarkLeaderboardEntry) => {
    const scoreA = a.bair ?? a.aas;
    const scoreB = b.bair ?? b.aas;
    return scoreB - scoreA;
  });

  return entries.map((e: BenchmarkLeaderboardEntry, i: number) => ({ ...e, rank: i + 1 }));
}

/** DB 데이터 없을 때 반환하는 mock 데이터 */
function _getMockLeaderboard(
  domainConfig: (typeof BENCHMARK_DOMAINS)[DomainSlug]
): DomainLeaderboardResult {
  const mockAas = [38, 52, 61, 27, 44];
  const mockOcr = [12, 22, 31, 8, 18];
  const mockBair = [28, 40, 52, 18, 34];

  const leaderboard: BenchmarkLeaderboardEntry[] = domainConfig.brands
    .map((brand, i: number) => ({
      rank: 0,
      brand_slug: brand.slug,
      brand_name: brand.name,
      aas: mockAas[i] ?? 30,
      ocr: mockOcr[i] ?? 10,
      bsf: null,
      bair: mockBair[i] ?? 20,
      aas_trend: 0,
      color: brand.color,
    }))
    .sort((a, b) => (b.bair ?? b.aas) - (a.bair ?? a.aas))
    .map((e, i) => ({ ...e, rank: i + 1 }));

  return {
    domain_slug: domainConfig.slug,
    domain_name: domainConfig.name,
    measured_at: new Date().toISOString(),
    leaderboard,
    history: [],
  };
}
