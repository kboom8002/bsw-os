import { getSupabaseAdminClient } from "../supabase";
import { AiprEngine } from "./aipr";
import { AepiCalculator } from "../benchmark/aepi-calculator";
import { INDUSTRY_PANELS_DATA } from "../../db/seed/industry-panels/questions-data";

// ═══════════════════════════════════════════════════════════════
// KAIVI V2 — 다원 복합 Korea AI Visibility Index
// ═══════════════════════════════════════════════════════════════
//
// V1 → V2 주요 변경:
// 1. BAIR 100% 의존 → BAIR + AEPI + Per-Layer + MRI 4원 복합
// 2. 단일 지표 취약성 제거 — 각 원천 지표가 독립적으로 측정됨
// 3. 데이터 소스 투명화 — 각 컴포넌트 점수 breakdown 제공
//
// 공식: KAIVI_v2 = clamp(
//   0.30×BAIRavg + 0.30×AEPIavg + 0.25×PerLayerAvg + 0.15×MRI,
//   0, 100
// )
//
// 가중치 근거 (SOTA AEO/GEO 프레임워크 기반):
// - BAIR  0.30: 브랜드 레벨 AI 평판 — 가시성·감성·인용 복합
// - AEPI  0.30: 엔티티 레벨 존재감 — 7차원 반영도 (가장 과학적 독자 지표)
// - PerLayer 0.25: 전략적 성과 — IRI·BDR·CWR 전투력 지표
// - MRI   0.15: 데이터 성숙도 — 운영진실·증거·검증 상태
//
// BAIR와 AEPI에 동일 가중치(0.30)를 부여한 근거:
// - BAIR는 "AI가 브랜드를 어떻게 말하는가" (output-side)
// - AEPI는 "AI가 브랜드 정보를 얼마나 정확히 알고 있는가" (input-side)
// - 양쪽 모두 중요하며 독립적 측정 경로를 가짐
// ═══════════════════════════════════════════════════════════════

export interface KaiviBreakdown {
  bairAvg: number;
  aepiAvg: number;
  perLayerAvg: number;
  mri: number;
}

export interface KaiviResult {
  kaivi: number;
  breakdown: KaiviBreakdown;
  industriesEvaluated: number;
  measuredAt: string;
}

const KAIVI_WEIGHTS = {
  BAIR:      0.30,
  AEPI:      0.30,
  PER_LAYER: 0.25,
  MRI:       0.15,
} as const;

export class KaiviEngine {
  private aiprEngine: AiprEngine;

  constructor() {
    this.aiprEngine = new AiprEngine();
  }

  /**
   * KAIVI V2 — 다원 복합 Korea AI Visibility Index
   *
   * 4개 독립 지표원(BAIR, AEPI, Per-Layer, MRI)을 종합하여
   * 워크스페이스의 국가 AI 가시성 수준을 산출합니다.
   */
  public async computeKAIVI(workspaceId: string): Promise<number> {
    const result = await this.computeKAIVIWithBreakdown(workspaceId);
    return result.kaivi;
  }

  /**
   * Breakdown을 포함한 KAIVI 산출
   */
  public async computeKAIVIWithBreakdown(workspaceId: string): Promise<KaiviResult> {
    const supabase = getSupabaseAdminClient();

    // ── 1. MRI (Meaning Readiness Index) — 운영진실 검증 비율 ──
    const mri = await this.measureMRI(workspaceId);

    // ── 2. BAIR 평균 — 업종별 상위 BAIR ──
    const { bairAvg, industriesCount } = await this.measureBairAverage(workspaceId);

    // ── 3. AEPI 평균 — 엔티티 반영 스냅샷 ──
    const aepiAvg = await this.measureAepiAverage(workspaceId);

    // ── 4. Per-Layer 평균 — IRI·BDR·CWR 종합 ──
    const perLayerAvg = await this.measurePerLayerAverage(workspaceId);

    // ── 5. KAIVI V2 가중 합산 ──
    const kaiviRaw =
      KAIVI_WEIGHTS.BAIR      * bairAvg +
      KAIVI_WEIGHTS.AEPI      * aepiAvg +
      KAIVI_WEIGHTS.PER_LAYER * perLayerAvg +
      KAIVI_WEIGHTS.MRI       * mri;

    const kaivi = Number(Math.max(0, Math.min(100, kaiviRaw)).toFixed(2));

    return {
      kaivi,
      breakdown: {
        bairAvg: Number(bairAvg.toFixed(2)),
        aepiAvg: Number(aepiAvg.toFixed(2)),
        perLayerAvg: Number(perLayerAvg.toFixed(2)),
        mri: Number(mri.toFixed(2)),
      },
      industriesEvaluated: industriesCount,
      measuredAt: new Date().toISOString(),
    };
  }

  /**
   * MRI (Meaning Readiness Index) — 운영진실 + 증거 검증 비율
   *
   * brand_operational_truths의 approved/verified 비율을 기반으로 산출합니다.
   * 데이터가 없으면 0을 반환합니다 (V1의 기본값 0.82 제거).
   */
  private async measureMRI(workspaceId: string): Promise<number> {
    const supabase = getSupabaseAdminClient();

    const { data: claims } = await supabase
      .from("brand_operational_truths")
      .select("review_status")
      .eq("workspace_id", workspaceId);

    if (!claims || claims.length === 0) return 0;

    const approved = claims.filter(
      c => c.review_status === "approved" || c.review_status === "verified"
    ).length;

    return Number(((approved / claims.length) * 100).toFixed(2));
  }

  /**
   * BAIR 평균 — 워크스페이스의 업종별 1위 BAIR 평균
   */
  private async measureBairAverage(
    workspaceId: string
  ): Promise<{ bairAvg: number; industriesCount: number }> {
    const supabase = getSupabaseAdminClient();

    // 워크스페이스에 등록된 업종 패널 조회
    const { data: panels } = await supabase
      .from("probe_panels")
      .select("industry, panel_name")
      .eq("workspace_id", workspaceId);

    const uniqueIndustries = [
      ...new Set((panels ?? []).map(p => p.industry).filter(Boolean)),
    ];

    const industries =
      uniqueIndustries.length > 0
        ? uniqueIndustries
        : Object.keys(INDUSTRY_PANELS_DATA);

    let bairSum = 0;

    for (const ind of industries) {
      // 패널 이름에서 브랜드 키워드 추출
      const indPanel = panels?.find(p => p.industry === ind);
      const brand =
        indPanel?.panel_name?.match(/^\[(.+?)\]/)?.[1] ?? "DefaultBrand";

      const aipr = await this.aiprEngine.computeAIPR(
        workspaceId,
        ind,
        brand,
        [] // 경쟁사 없이 자사 BAIR만 측정
      );
      const topScore = aipr[0]?.bairScore ?? 0;
      bairSum += topScore;
    }

    const bairAvg =
      industries.length > 0 ? bairSum / industries.length : 0;

    return { bairAvg, industriesCount: industries.length };
  }

  /**
   * AEPI 평균 — entity_reflection_snapshots의 최근 AEPI 점수
   */
  private async measureAepiAverage(workspaceId: string): Promise<number> {
    const supabase = getSupabaseAdminClient();

    // 최근 엔티티 반영 스냅샷들의 aepi_score 평균
    const { data: snapshots } = await supabase
      .from("entity_reflection_snapshots")
      .select("aepi_score")
      .eq("workspace_id", workspaceId)
      .order("measured_at", { ascending: false })
      .limit(10);

    if (!snapshots || snapshots.length === 0) return 0;

    const validScores = snapshots
      .map(s => Number(s.aepi_score))
      .filter(v => v > 0);

    if (validScores.length === 0) return 0;

    return validScores.reduce((a, b) => a + b, 0) / validScores.length;
  }

  /**
   * Per-Layer 평균 — 최근 벤치마크 스냅샷의 IRI·BDR·CWR 평균
   *
   * OPP(기회 점수)는 "미커버 영역"이므로 가시성 지수에는 제외하고
   * IRI(업종 준비도) + BDR(브랜드 방어율) + CWR(경쟁 승리율)만 사용합니다.
   */
  private async measurePerLayerAverage(workspaceId: string): Promise<number> {
    const supabase = getSupabaseAdminClient();

    // 최근 벤치마크 스냅샷에서 per-layer 지표 조회
    const { data: snapshots } = await supabase
      .from("industry_benchmark_snapshots")
      .select("iri, bdr, cwr")
      .eq("workspace_id", workspaceId)
      .order("measured_at", { ascending: false })
      .limit(5);

    if (!snapshots || snapshots.length === 0) return 0;

    // IRI, BDR, CWR 각각의 최근 평균 → 3지표 종합 평균
    const avgIRI = this.avgField(snapshots, "iri");
    const avgBDR = this.avgField(snapshots, "bdr");
    const avgCWR = this.avgField(snapshots, "cwr");

    // 3개 전략 지표의 균등 가중 평균
    return (avgIRI + avgBDR + avgCWR) / 3;
  }

  /** 유틸리티: 특정 필드의 평균값 */
  private avgField(rows: any[], field: string): number {
    const vals = rows
      .map(r => Number(r[field]))
      .filter(v => !isNaN(v) && v >= 0);
    if (vals.length === 0) return 0;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }
}
