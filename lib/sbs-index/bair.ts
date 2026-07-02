import { getSupabaseAdminClient } from "../supabase";
import { calcWeightedAAS, classifyMention, MentionStrength } from "../benchmark/mention-classifier";

// ═══════════════════════════════════════════════════════════════
// BAIR V2 — 가중 합산 기반 Brand AI Reputation Index
// ═══════════════════════════════════════════════════════════════
//
// V1 → V2 주요 변경:
// 1. 곱셈 합성 → 가중 합산 (범위 보장: 0~100)
// 2. SWEL 하드코딩 → semantic_pages 기반 실측
// 3. 키워드 리스트 감성 → mention-classifier 기반 가중 감성
// 4. Mention Quality(MQ) 차원 추가
//
// 공식: BAIR_v2 = clamp(
//   0.35×BSF + 0.25×AAS_w + 0.20×OCR + 0.10×SWEL_m + 0.10×MQ,
//   0, 100
// )
//
// 가중치 근거 (SOTA AEO/GEO 연구 기반):
// - BSF 0.35: Presence(가시성)가 가장 근본적 — 언급되지 않으면 신뢰도·인용도 무의미
// - AAS_w 0.25: 감성 품질 — strong/neutral/negative 3단계 가중 분류
// - OCR 0.20: 인용율 — AI 검색에서 트래픽 전환의 핵심 동인
// - SWEL_m 0.10: 구조적 준비도 — 시맨틱 페이지·스키마 인프라
// - MQ 0.10: 언급 강도 — strong mention 비율 (1위/추천/최고 등)
// ═══════════════════════════════════════════════════════════════

export interface BairResult {
  brand: string;
  bsf: number;            // Brand Share of Voice (0~100)
  aas: number;            // Weighted AI Answer Sentiment (0~100)
  ocr: number;            // Observed Citation Rate (0~100)
  swel: number;           // Measured Semantic Exposure Lift (0~100)
  mentionQuality: number; // Strong mention ratio (0~100)
  bair: number;           // Composite BAIR V2 score (0~100)
  isEstimated: boolean;   // true = 프로브 데이터 부족으로 추정치 포함
  /** @deprecated V1 호환용 — 신규 코드는 사용하지 말 것 */
  swel_v1?: number;
}

// ═══════════════════════════════════════════════════════════════
// V2 가중치 상수
// ═══════════════════════════════════════════════════════════════

const BAIR_WEIGHTS = {
  BSF:  0.35,  // Presence is king
  AAS:  0.25,  // Sentiment quality
  OCR:  0.20,  // Citation drives traffic
  SWEL: 0.10,  // Structural readiness
  MQ:   0.10,  // Mention strength
} as const;

export class BairEngine {
  /**
   * BAIR V2 — 가중 합산 기반 Brand AI Reputation Index
   *
   * 모든 컴포넌트를 0~100 스케일로 정규화 후 가중 합산합니다.
   * 프로브 데이터가 충분하면 isEstimated=false, 부족하면 true.
   */
  public async computeBAIR(workspaceId: string, brandKeyword: string): Promise<BairResult> {
    const supabase = getSupabaseAdminClient();

    // ── 1. 관측 충실도 스냅샷 확인 (정밀 지표 소스) ──
    const { data: latestSnapshot } = await supabase
      .from("concept_fidelity_snapshots")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(1);

    // ── 2. 프로브 런 데이터 로드 ──
    const { data: runs } = await supabase
      .from("probe_runs")
      .select("raw_response_text, response_text")
      .eq("workspace_id", workspaceId)
      .limit(100);

    let bsf = 0;
    let aas = 0;
    let mentionQuality = 0;
    let ocr = 0;
    let isEstimated = true;

    const brandKeywords = [brandKeyword];

    if (runs && runs.length >= 5) {
      isEstimated = false;
      const total = runs.length;
      let matchedCount = 0;
      let weightedSentimentSum = 0;
      let strongCount = 0;

      for (const r of runs) {
        const text = r.raw_response_text || r.response_text || "";
        if (!text) continue;

        // mention-classifier 기반 가중 감성 분석
        const result = calcWeightedAAS(text, brandKeywords);

        if (result.hit) {
          matchedCount++;
          weightedSentimentSum += result.weight;

          if (result.strength === 'strong') {
            strongCount++;
          }
        }
      }

      if (matchedCount > 0) {
        // BSF: 전체 프로브 중 언급된 비율 (0~100)
        bsf = Math.round((matchedCount / total) * 100);

        // AAS_w: 가중 감성 평균 (strong=1.0, neutral=0.3, negative=0.0) → 0~100
        aas = Math.round((weightedSentimentSum / matchedCount) * 100);

        // MQ: strong mention 비율 (0~100)
        mentionQuality = Math.round((strongCount / matchedCount) * 100);
      }
    } else if (runs && runs.length > 0) {
      // 데이터 부족 — 기본 추정 (isEstimated = true)
      isEstimated = true;
      const total = runs.length;
      let matchedCount = 0;

      for (const r of runs) {
        const text = r.raw_response_text || r.response_text || "";
        if (!text) continue;
        const result = calcWeightedAAS(text, brandKeywords);
        if (result.hit) matchedCount++;
      }

      bsf = total > 0 ? Math.round((matchedCount / total) * 100) : 0;
      aas = 50;  // 데이터 부족 시 중립 추정
      mentionQuality = 30;
    }

    // ── 3. OCR (Citation Rate) — 인용 도메인 매칭 ──
    ocr = await this.measureCitationRate(workspaceId, brandKeyword);

    // ── 4. 관측 충실도 스냅샷이 존재하면 BSF·OCR 업그레이드 ──
    if (latestSnapshot && latestSnapshot.length > 0) {
      const snap = latestSnapshot[0];
      if (snap.brand_concept_fidelity !== null && snap.brand_concept_fidelity !== undefined) {
        bsf = Math.round(Number(snap.brand_concept_fidelity) * 100);
        isEstimated = false;
      }
      if (snap.citation_backed_rate !== null && snap.citation_backed_rate !== undefined) {
        ocr = Math.round(Number(snap.citation_backed_rate) * 100);
      }
    }

    // ── 5. SWEL — 시맨틱 페이지·스키마 인프라 실측 ──
    const swel = await this.measureSWEL(workspaceId);

    // ── 6. BAIR V2 가중 합산 ──
    const bairRaw =
      BAIR_WEIGHTS.BSF  * bsf +
      BAIR_WEIGHTS.AAS  * aas +
      BAIR_WEIGHTS.OCR  * ocr +
      BAIR_WEIGHTS.SWEL * swel +
      BAIR_WEIGHTS.MQ   * mentionQuality;

    const bair = Number(Math.max(0, Math.min(100, bairRaw)).toFixed(2));

    return {
      brand: brandKeyword,
      bsf,
      aas,
      ocr,
      swel,
      mentionQuality,
      bair,
      isEstimated,
    };
  }

  /**
   * SWEL (Semantic Web Exposure Lift) — 실측
   *
   * 시맨틱 페이지·스키마 매핑·구조화 데이터 인프라의 존재와 품질을 측정합니다.
   * - semantic_pages 존재 여부 및 수량 (최대 50점)
   * - schema_mappings 존재 여부 및 수량 (최대 30점)
   * - surface_contracts 존재 여부 (최대 20점)
   */
  private async measureSWEL(workspaceId: string): Promise<number> {
    const supabase = getSupabaseAdminClient();

    // 시맨틱 페이지 수
    const { count: pageCount } = await supabase
      .from("semantic_pages")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId);

    // 스키마 매핑 수
    const { count: schemaCount } = await supabase
      .from("schema_mappings")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId);

    // 서피스 컨트랙트 수
    const { count: surfaceCount } = await supabase
      .from("surface_contracts")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId);

    // 각 인프라 기여도 산출 (diminishing returns 적용)
    const pagePart = Math.min(50, (pageCount ?? 0) * 5);       // 페이지당 5점, 최대 50
    const schemaPart = Math.min(30, (schemaCount ?? 0) * 6);   // 매핑당 6점, 최대 30
    const surfacePart = Math.min(20, (surfaceCount ?? 0) * 4);  // 컨트랙트당 4점, 최대 20

    return Math.min(100, pagePart + schemaPart + surfacePart);
  }

  /**
   * OCR (Observed Citation Rate) — 실측
   *
   * 벤치마크 스냅샷의 citation_count/sample_size 비율을 활용합니다.
   * 스냅샷이 없으면 0을 반환합니다.
   */
  private async measureCitationRate(workspaceId: string, brandKeyword: string): Promise<number> {
    const supabase = getSupabaseAdminClient();

    // 최신 벤치마크 스냅샷에서 인용율 확인
    const { data: snapshots } = await supabase
      .from("industry_benchmark_snapshots")
      .select("ocr, citation_count, sample_size")
      .eq("workspace_id", workspaceId)
      .order("measured_at", { ascending: false })
      .limit(5);

    if (snapshots && snapshots.length > 0) {
      // 최근 5개 스냅샷의 OCR 평균 (안정성 확보)
      const ocrValues = snapshots
        .map(s => s.ocr ?? (s.sample_size > 0 ? (s.citation_count / s.sample_size) * 100 : 0))
        .filter(v => v >= 0);

      if (ocrValues.length > 0) {
        return Math.round(ocrValues.reduce((a, b) => a + b, 0) / ocrValues.length);
      }
    }

    return 0;
  }

  /**
   * AITI (AI Trust Index) — 증거 매칭 기반 신뢰도 지수
   * AITI = (Evidence Match Rate × 100) − (Unsafe Wording Count × 5)
   */
  public async computeAITI(workspaceId: string): Promise<number> {
    const supabase = getSupabaseAdminClient();

    const { data: evidence } = await supabase
      .from("brand_truth_evidence")
      .select("verification_status")
      .eq("workspace_id", workspaceId);

    const { data: findings } = await supabase
      .from("unsafe_wording_findings")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("status", "quarantined");

    let matchRate = 0;
    if (evidence && evidence.length > 0) {
      const verified = evidence.filter((e) => e.verification_status === "verified").length;
      matchRate = verified / evidence.length;
    }

    const unsafeCount = findings?.length ?? 0;
    const aiti = Number((matchRate * 100 - unsafeCount * 5).toFixed(2));

    return Math.max(0, Math.min(100, aiti));
  }
}
