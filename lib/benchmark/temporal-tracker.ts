// lib/benchmark/temporal-tracker.ts
// 벤치마크 스냅샷 시계열 추적 + Diff 계산 시스템 V2.0
// 실제 DB 연동 (benchmark_snapshots 테이블)

import type { SiteAuditSnapshot } from '../industry/batch-audit-runner';
import { BENCHMARK_METRIC_KEYS, METRIC_META } from '../industry/batch-audit-runner';
import { getSupabaseAdminClient } from '../supabase';

// ═══════════════════════════════════════════════════════════════
// Legacy interface (EntityReflectionSnapshot 기반 ERR 트래킹 — 하위 호환 유지)
// ═══════════════════════════════════════════════════════════════

export interface TemporalTrend {
  snapshot_id: string;
  measured_at: string;
  aepi_score: number;
  err_factoid: number;
  err_procedural: number;
}

// ═══════════════════════════════════════════════════════════════
// V2.0: 실제 시계열 스냅샷 타입
// ═══════════════════════════════════════════════════════════════

export interface BenchmarkHistoryPoint {
  id: string;
  url: string;
  brandName: string;
  subIndustryKey: string;
  auditedAt: string;
  /** 22개 핵심 벤치마크 메트릭 */
  metrics: Record<string, number>;
  /** AEPI 종합 점수 (L1×0.3 + L2×0.3 + L3×0.4) */
  aepiScore: number;
  tier: 'excellent' | 'average' | 'poor';
}

export interface MetricChange {
  key: string;
  nameKo: string;
  previous: number;
  current: number;
  delta: number;        // current - previous
  deltaPercent: number; // delta / previous × 100
  direction: 'improved' | 'declined' | 'stable';
  significance: 'major' | 'minor' | 'negligible'; // |delta%| > 15 / 5 / else
}

export interface SnapshotDiff {
  url: string;
  brandName: string;
  subIndustryKey: string;
  previousAuditedAt: string;
  currentAuditedAt: string;
  periodDays: number;
  aepiDelta: number;
  tierChange: { from: string; to: string } | null;
  /** 모든 메트릭 변화 */
  metricChanges: MetricChange[];
  /** |deltaPercent| > 15인 메트릭 */
  majorChanges: MetricChange[];
  /** 개선된 메트릭 수 */
  improvedCount: number;
  /** 저하된 메트릭 수 */
  declinedCount: number;
  /** 변화 없음 메트릭 수 */
  stableCount: number;
  /** 한국어 자연어 요약 */
  summary: string;
}

export interface IndustryTemporalStats {
  subIndustryKey: string;
  periodDays: number;
  /** 업종 평균 AEPI 변화 */
  avgAepiDelta: number;
  /** 메트릭별 업종 평균 변화 */
  avgMetricDeltas: Record<string, number>;
  /** 업종 내 개선 추세 브랜드 수 */
  improvedBrandsCount: number;
  /** 업종 내 저하 추세 브랜드 수 */
  declinedBrandsCount: number;
  dataPoints: number;
}

// ═══════════════════════════════════════════════════════════════
// TemporalTracker V2.0
// ═══════════════════════════════════════════════════════════════

export class TemporalTracker {

  // ─────────────────────────────────────────────────────────
  // 1. 스냅샷 저장
  // ─────────────────────────────────────────────────────────

  /**
   * SiteAuditSnapshot을 benchmark_snapshots 테이블에 저장
   * (업종 벤치마크 이력 축적 + diff 자동 계산)
   */
  async saveSnapshot(snapshot: SiteAuditSnapshot): Promise<string | null> {
    try {
      const supabase = getSupabaseAdminClient();

      const metrics = this.extractMetrics(snapshot);
      const aepiScore = this.calcAepi(snapshot);

      const currentPoint: BenchmarkHistoryPoint = {
        id: 'current',
        url: snapshot.siteUrl,
        brandName: snapshot.brandName,
        subIndustryKey: snapshot.subIndustryKey,
        auditedAt: snapshot.auditedAt,
        metrics,
        aepiScore,
        tier: snapshot.tier,
      };

      // 이전 스냅샷 조회 → diff 계산
      const previous = await this.getLatestSnapshot(snapshot.siteUrl, snapshot.subIndustryKey);
      const diff = previous ? this.computeDiff(previous, currentPoint) : null;

      const { data, error } = await supabase
        .from('benchmark_snapshots')
        .insert({
          url: snapshot.siteUrl,
          brand_name: snapshot.brandName,
          sub_industry_key: snapshot.subIndustryKey,
          macro_industry_key: snapshot.macroKey ?? null,
          metrics,
          aepi_score: aepiScore,
          tier: snapshot.tier,
          audited_at: snapshot.auditedAt,
          diff_from_previous: diff ?? null,
        })
        .select('id')
        .single();

      if (error) {
        console.warn('[TemporalTracker] saveSnapshot failed:', error.message);
        return null;
      }
      return data?.id ?? null;
    } catch (err: unknown) {
      console.warn('[TemporalTracker] saveSnapshot error:', err instanceof Error ? err.message : String(err));
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────
  // 2. 이력 조회
  // ─────────────────────────────────────────────────────────

  /**
   * 특정 URL의 시계열 스냅샷 이력 조회
   */
  async getHistory(
    url: string,
    subIndustryKey: string,
    months = 6
  ): Promise<BenchmarkHistoryPoint[]> {
    try {
      const supabase = getSupabaseAdminClient();
      const since = new Date();
      since.setMonth(since.getMonth() - months);

      const { data, error } = await supabase
        .from('benchmark_snapshots')
        .select('id, url, brand_name, sub_industry_key, audited_at, metrics, aepi_score, tier')
        .eq('url', url)
        .eq('sub_industry_key', subIndustryKey)
        .gte('audited_at', since.toISOString())
        .order('audited_at', { ascending: true });

      if (error || !data) return [];

      return data.map((row) => ({
        id: row.id,
        url: row.url,
        brandName: row.brand_name,
        subIndustryKey: row.sub_industry_key,
        auditedAt: row.audited_at,
        metrics: (row.metrics as Record<string, number>) ?? {},
        aepiScore: row.aepi_score ?? 0,
        tier: row.tier as 'excellent' | 'average' | 'poor',
      }));
    } catch (err: unknown) {
      console.warn('[TemporalTracker] getHistory error:', err instanceof Error ? err.message : String(err));
      return [];
    }
  }

  /**
   * 업종 전체의 최신 스냅샷 목록 조회 (리더보드용)
   */
  async getLatestByIndustry(subIndustryKey: string): Promise<BenchmarkHistoryPoint[]> {
    try {
      const supabase = getSupabaseAdminClient();

      // 업종별 URL 목록 × 최신 스냅샷만 (DISTINCT ON 상당)
      const { data, error } = await supabase
        .from('benchmark_snapshots_latest')  // DB View 사용
        .select('*')
        .eq('sub_industry_key', subIndustryKey)
        .order('aepi_score', { ascending: false });

      if (error || !data) {
        // View 없으면 fallback: 최근 30일 스냅샷 중 URL별 최신
        return this.getLatestByIndustryFallback(subIndustryKey);
      }

      return data.map((row) => ({
        id: row.id,
        url: row.url,
        brandName: row.brand_name,
        subIndustryKey: row.sub_industry_key,
        auditedAt: row.audited_at,
        metrics: (row.metrics as Record<string, number>) ?? {},
        aepiScore: row.aepi_score ?? 0,
        tier: row.tier as 'excellent' | 'average' | 'poor',
      }));
    } catch (err: unknown) {
      console.warn('[TemporalTracker] getLatestByIndustry error:', err instanceof Error ? err.message : String(err));
      return [];
    }
  }

  private async getLatestByIndustryFallback(subIndustryKey: string): Promise<BenchmarkHistoryPoint[]> {
    try {
      const supabase = getSupabaseAdminClient();
      const since = new Date();
      since.setDate(since.getDate() - 30);

      const { data, error } = await supabase
        .from('benchmark_snapshots')
        .select('id, url, brand_name, sub_industry_key, audited_at, metrics, aepi_score, tier')
        .eq('sub_industry_key', subIndustryKey)
        .gte('audited_at', since.toISOString())
        .order('audited_at', { ascending: false });

      if (error || !data) return [];

      // URL별 최신 1개만
      const seen = new Set<string>();
      return data
        .filter((row) => {
          if (seen.has(row.url)) return false;
          seen.add(row.url);
          return true;
        })
        .map((row) => ({
          id: row.id,
          url: row.url,
          brandName: row.brand_name,
          subIndustryKey: row.sub_industry_key,
          auditedAt: row.audited_at,
          metrics: (row.metrics as Record<string, number>) ?? {},
          aepiScore: row.aepi_score ?? 0,
          tier: row.tier as 'excellent' | 'average' | 'poor',
        }));
    } catch {
      return [];
    }
  }

  private async getLatestSnapshot(url: string, subIndustryKey: string): Promise<BenchmarkHistoryPoint | null> {
    try {
      const supabase = getSupabaseAdminClient();
      const { data, error } = await supabase
        .from('benchmark_snapshots')
        .select('id, url, brand_name, sub_industry_key, audited_at, metrics, aepi_score, tier')
        .eq('url', url)
        .eq('sub_industry_key', subIndustryKey)
        .order('audited_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return null;
      return {
        id: data.id,
        url: data.url,
        brandName: data.brand_name,
        subIndustryKey: data.sub_industry_key,
        auditedAt: data.audited_at,
        metrics: (data.metrics as Record<string, number>) ?? {},
        aepiScore: data.aepi_score ?? 0,
        tier: data.tier as 'excellent' | 'average' | 'poor',
      };
    } catch {
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────
  // 3. Diff 계산
  // ─────────────────────────────────────────────────────────

  /**
   * 두 스냅샷 간 변화량 계산
   */
  computeDiff(previous: BenchmarkHistoryPoint, current: BenchmarkHistoryPoint): SnapshotDiff {
    const prevDate = new Date(previous.auditedAt);
    const currDate = new Date(current.auditedAt);
    const periodDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

    const metricChanges: MetricChange[] = BENCHMARK_METRIC_KEYS.map((key) => {
      const prev = previous.metrics[key] ?? 0;
      const curr = current.metrics[key] ?? 0;
      const delta = curr - prev;
      const deltaPercent = prev !== 0 ? (delta / prev) * 100 : (curr > 0 ? 100 : 0);
      const meta = METRIC_META[key as keyof typeof METRIC_META];
      const effectiveDelta = meta.higherIsBetter ? delta : -delta;

      const direction: MetricChange['direction'] =
        Math.abs(deltaPercent) < 2 ? 'stable' :
        effectiveDelta > 0 ? 'improved' : 'declined';

      const significance: MetricChange['significance'] =
        Math.abs(deltaPercent) > 15 ? 'major' :
        Math.abs(deltaPercent) > 5 ? 'minor' : 'negligible';

      return {
        key,
        nameKo: meta.nameKo,
        previous: prev,
        current: curr,
        delta,
        deltaPercent,
        direction,
        significance,
      };
    });

    const majorChanges = metricChanges.filter((m) => m.significance === 'major');
    const improvedCount = metricChanges.filter((m) => m.direction === 'improved').length;
    const declinedCount = metricChanges.filter((m) => m.direction === 'declined').length;
    const stableCount = metricChanges.filter((m) => m.direction === 'stable').length;

    const aepiDelta = (current.aepiScore ?? 0) - (previous.aepiScore ?? 0);
    const tierChange = previous.tier !== current.tier
      ? { from: previous.tier, to: current.tier }
      : null;

    const summary = this.generateSummary({
      brandName: current.brandName,
      periodDays,
      aepiDelta,
      tierChange,
      improvedCount,
      declinedCount,
      majorChanges,
    });

    return {
      url: current.url,
      brandName: current.brandName,
      subIndustryKey: current.subIndustryKey,
      previousAuditedAt: previous.auditedAt,
      currentAuditedAt: current.auditedAt,
      periodDays,
      aepiDelta,
      tierChange,
      metricChanges,
      majorChanges,
      improvedCount,
      declinedCount,
      stableCount,
      summary,
    };
  }

  /**
   * 업종 시계열 통계 집계
   */
  async getIndustryTemporalStats(
    subIndustryKey: string,
    periodDays = 30
  ): Promise<IndustryTemporalStats | null> {
    try {
      const supabase = getSupabaseAdminClient();
      const since = new Date();
      since.setDate(since.getDate() - periodDays);

      const { data, error } = await supabase
        .from('benchmark_snapshots')
        .select('url, metrics, aepi_score, tier, audited_at, diff_from_previous')
        .eq('sub_industry_key', subIndustryKey)
        .gte('audited_at', since.toISOString())
        .not('diff_from_previous', 'is', null);

      if (error || !data || data.length === 0) return null;

      const diffs = data
        .map((row) => row.diff_from_previous as SnapshotDiff)
        .filter(Boolean);

      if (diffs.length === 0) return null;

      // 메트릭별 평균 delta
      const avgMetricDeltas: Record<string, number> = {};
      for (const key of BENCHMARK_METRIC_KEYS) {
        const deltas = diffs.map((d) => d.metricChanges.find((m) => m.key === key)?.delta ?? 0);
        avgMetricDeltas[key] = deltas.reduce((a, b) => a + b, 0) / deltas.length;
      }

      const avgAepiDelta = diffs.reduce((s, d) => s + d.aepiDelta, 0) / diffs.length;
      const improvedBrandsCount = diffs.filter((d) => d.aepiDelta > 2).length;
      const declinedBrandsCount = diffs.filter((d) => d.aepiDelta < -2).length;

      return {
        subIndustryKey,
        periodDays,
        avgAepiDelta,
        avgMetricDeltas,
        improvedBrandsCount,
        declinedBrandsCount,
        dataPoints: diffs.length,
      };
    } catch (err: unknown) {
      console.warn('[TemporalTracker] getIndustryTemporalStats error:', err instanceof Error ? err.message : String(err));
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────
  // 4. Legacy 호환 (ERR 기반 트렌드)
  // ─────────────────────────────────────────────────────────

  /**
   * @deprecated V1 ERR 기반. 실제 DB 이력이 없으면 빈 배열 반환.
   */
  async getTrends(websiteUrl: string): Promise<TemporalTrend[]> {
    try {
      const history = await this.getHistory(websiteUrl, '', 6);
      if (history.length === 0) return [];
      return history.map((h) => ({
        snapshot_id: h.id,
        measured_at: h.auditedAt,
        aepi_score: h.aepiScore,
        err_factoid: h.metrics['eeatAuthoritativeness'] ?? 0,
        err_procedural: h.metrics['eeatExpertise'] ?? 0,
      }));
    } catch {
      return [];
    }
  }

  // ─────────────────────────────────────────────────────────
  // 5. 유틸리티
  // ─────────────────────────────────────────────────────────

  private extractMetrics(snapshot: SiteAuditSnapshot): Record<string, number> {
    const metrics: Record<string, number> = {};
    for (const key of BENCHMARK_METRIC_KEYS) {
      const val = (snapshot as unknown as Record<string, unknown>)[key];
      metrics[key] = typeof val === 'number' ? val : (typeof val === 'boolean' ? (val ? 100 : 0) : 0);
    }
    return metrics;
  }

  private calcAepi(snapshot: SiteAuditSnapshot): number {
    const l1 = snapshot.techInfraScore ?? 0;
    const l2 = snapshot.schemaQualityScore ?? 0;
    const l3 = snapshot.contentSemanticScore ?? 0;
    return Math.round(l1 * 0.30 + l2 * 0.30 + l3 * 0.40);
  }

  private generateSummary(params: {
    brandName: string;
    periodDays: number;
    aepiDelta: number;
    tierChange: { from: string; to: string } | null;
    improvedCount: number;
    declinedCount: number;
    majorChanges: MetricChange[];
  }): string {
    const { brandName, periodDays, aepiDelta, tierChange, improvedCount, declinedCount, majorChanges } = params;

    const directionKo = aepiDelta > 0 ? `+${aepiDelta.toFixed(1)}점 향상` : aepiDelta < 0 ? `${aepiDelta.toFixed(1)}점 저하` : '변화 없음';
    const tierText = tierChange ? ` 등급이 ${tierChange.from} → ${tierChange.to}으로 변경되었으며,` : '';

    const majorText = majorChanges.length > 0
      ? ` 주요 변화: ${majorChanges.slice(0, 3).map((m) => `${m.nameKo}(${m.delta > 0 ? '+' : ''}${m.delta.toFixed(0)})`).join(', ')}.`
      : '';

    return `${brandName}은(는) 최근 ${periodDays}일간 AEPI ${directionKo}.${tierText} ${improvedCount}개 메트릭 개선, ${declinedCount}개 저하.${majorText}`;
  }
}
