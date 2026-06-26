import { EntityReflectionSnapshot } from '../schema';
import { MacroCategoryKey, getMacroKey } from '../industry/industry-taxonomy';

// ═══════════════════════════════════════════════════════════════
// 타입 정의
// ═══════════════════════════════════════════════════════════════

export interface AEPIBreakdown {
  composite: number;
  dimensions: Record<string, number>;
  tech_modifier: number;
  eeat_modifier: number;
  industry: string;
  weights_used: Record<string, number>;
  /** V3: 적용된 BM 매크로 카테고리 */
  macroKey?: MacroCategoryKey;
  /** V3: 매크로 5영역 가중치 */
  macroWeights?: { e: number; c: number; t: number; s: number; r: number };
}

// ═══════════════════════════════════════════════════════════════
// AEPI Calculator V3 — 2단계 동적 가중치 엔진
// ═══════════════════════════════════════════════════════════════

export class AepiCalculator {

  // ── Layer 1: BM 매크로 5영역 가중치 ──────────────────────
  // { e: 엔티티, c: 콘텐츠, t: 기술, s: 스키마, r: E-E-A-T }
  private static MACRO_WEIGHTS: Record<MacroCategoryKey, { e: number; c: number; t: number; s: number; r: number }> = {
    ecommerce_d2c:      { e: 0.20, c: 0.20, t: 0.25, s: 0.25, r: 0.10 },
    local_services:     { e: 0.15, c: 0.15, t: 0.20, s: 0.20, r: 0.30 },
    ymyl_professional:  { e: 0.25, c: 0.15, t: 0.15, s: 0.15, r: 0.30 },
    b2b_tech_saas:      { e: 0.20, c: 0.35, t: 0.20, s: 0.15, r: 0.10 },
    media_content_hub:  { e: 0.25, c: 0.30, t: 0.10, s: 0.15, r: 0.20 },
  };

  // ── Layer 2: 세부업종별 7차원 서피스 가중치 ─────────────
  // [factoid, procedural, comparative, authority, schema_org, topical_cluster, local_geo]
  private static WEIGHT_PRESETS: Record<string, Record<string, number>> = {
    // ── M1: ecommerce_d2c ──
    skincare:       { factoid: 0.20, procedural: 0.15, comparative: 0.25, authority: 0.15, schema_org: 0.10, topical_cluster: 0.10, local_geo: 0.05 },
    fashion:        { factoid: 0.10, procedural: 0.10, comparative: 0.30, authority: 0.10, schema_org: 0.10, topical_cluster: 0.25, local_geo: 0.05 },
    food_product:   { factoid: 0.20, procedural: 0.15, comparative: 0.20, authority: 0.10, schema_org: 0.15, topical_cluster: 0.10, local_geo: 0.10 },
    home_living:    { factoid: 0.15, procedural: 0.15, comparative: 0.25, authority: 0.10, schema_org: 0.15, topical_cluster: 0.15, local_geo: 0.05 },

    // ── M2: local_services ──
    hair_nail:      { factoid: 0.15, procedural: 0.20, comparative: 0.15, authority: 0.10, schema_org: 0.10, topical_cluster: 0.05, local_geo: 0.25 },
    restaurant_cafe:{ factoid: 0.15, procedural: 0.15, comparative: 0.20, authority: 0.10, schema_org: 0.10, topical_cluster: 0.05, local_geo: 0.25 },
    fitness:        { factoid: 0.15, procedural: 0.20, comparative: 0.15, authority: 0.10, schema_org: 0.10, topical_cluster: 0.10, local_geo: 0.20 },
    wedding:        { factoid: 0.10, procedural: 0.10, comparative: 0.15, authority: 0.10, schema_org: 0.10, topical_cluster: 0.15, local_geo: 0.30 },
    hotel:          { factoid: 0.15, procedural: 0.15, comparative: 0.15, authority: 0.10, schema_org: 0.10, topical_cluster: 0.10, local_geo: 0.25 },
    academy:        { factoid: 0.25, procedural: 0.15, comparative: 0.15, authority: 0.20, schema_org: 0.10, topical_cluster: 0.10, local_geo: 0.05 },
    auto_service:   { factoid: 0.15, procedural: 0.15, comparative: 0.20, authority: 0.15, schema_org: 0.10, topical_cluster: 0.05, local_geo: 0.20 },
    pet_care:       { factoid: 0.20, procedural: 0.20, comparative: 0.20, authority: 0.15, schema_org: 0.10, topical_cluster: 0.10, local_geo: 0.05 },

    // ── M3: ymyl_professional ──
    medical_clinic: { factoid: 0.25, procedural: 0.20, comparative: 0.10, authority: 0.25, schema_org: 0.10, topical_cluster: 0.05, local_geo: 0.05 },
    hanbang:        { factoid: 0.20, procedural: 0.20, comparative: 0.10, authority: 0.25, schema_org: 0.10, topical_cluster: 0.10, local_geo: 0.05 },
    senior_care:    { factoid: 0.20, procedural: 0.15, comparative: 0.10, authority: 0.25, schema_org: 0.10, topical_cluster: 0.10, local_geo: 0.10 },
    legal:          { factoid: 0.15, procedural: 0.15, comparative: 0.10, authority: 0.30, schema_org: 0.10, topical_cluster: 0.05, local_geo: 0.15 },
    finance_accounting: { factoid: 0.20, procedural: 0.15, comparative: 0.15, authority: 0.25, schema_org: 0.10, topical_cluster: 0.10, local_geo: 0.05 },
    real_estate:    { factoid: 0.15, procedural: 0.10, comparative: 0.15, authority: 0.15, schema_org: 0.10, topical_cluster: 0.05, local_geo: 0.30 },

    // ── M4: b2b_tech_saas ──
    it_saas:        { factoid: 0.15, procedural: 0.20, comparative: 0.20, authority: 0.10, schema_org: 0.10, topical_cluster: 0.20, local_geo: 0.05 },
    consulting:     { factoid: 0.15, procedural: 0.15, comparative: 0.15, authority: 0.20, schema_org: 0.10, topical_cluster: 0.20, local_geo: 0.05 },
    online_education: { factoid: 0.25, procedural: 0.15, comparative: 0.15, authority: 0.20, schema_org: 0.10, topical_cluster: 0.10, local_geo: 0.05 },
    startup:        { factoid: 0.15, procedural: 0.20, comparative: 0.20, authority: 0.10, schema_org: 0.10, topical_cluster: 0.20, local_geo: 0.05 },

    // ── M5: media_content_hub ──
    photography:    { factoid: 0.10, procedural: 0.10, comparative: 0.25, authority: 0.10, schema_org: 0.15, topical_cluster: 0.20, local_geo: 0.10 },
    entertainment:  { factoid: 0.10, procedural: 0.10, comparative: 0.20, authority: 0.10, schema_org: 0.10, topical_cluster: 0.30, local_geo: 0.10 },
    k_culture_content: { factoid: 0.15, procedural: 0.15, comparative: 0.15, authority: 0.15, schema_org: 0.10, topical_cluster: 0.25, local_geo: 0.05 },
    expert_professional: { factoid: 0.15, procedural: 0.15, comparative: 0.15, authority: 0.25, schema_org: 0.10, topical_cluster: 0.15, local_geo: 0.05 },
    place_brand:    { factoid: 0.15, procedural: 0.10, comparative: 0.15, authority: 0.10, schema_org: 0.10, topical_cluster: 0.10, local_geo: 0.30 },
    travel_tourism: { factoid: 0.15, procedural: 0.15, comparative: 0.15, authority: 0.10, schema_org: 0.10, topical_cluster: 0.10, local_geo: 0.25 },

    // ── V1 호환 별칭 (레거시 키 → V3 가중치 자동 폴백) ──
    wedding_studio: { factoid: 0.10, procedural: 0.10, comparative: 0.15, authority: 0.10, schema_org: 0.10, topical_cluster: 0.15, local_geo: 0.30 },
    medical:        { factoid: 0.25, procedural: 0.20, comparative: 0.10, authority: 0.25, schema_org: 0.10, topical_cluster: 0.05, local_geo: 0.05 },
    k_beauty:       { factoid: 0.15, procedural: 0.20, comparative: 0.25, authority: 0.10, schema_org: 0.10, topical_cluster: 0.15, local_geo: 0.05 },
    food_bev:       { factoid: 0.20, procedural: 0.15, comparative: 0.20, authority: 0.10, schema_org: 0.15, topical_cluster: 0.10, local_geo: 0.10 },
    education:      { factoid: 0.25, procedural: 0.15, comparative: 0.15, authority: 0.20, schema_org: 0.10, topical_cluster: 0.10, local_geo: 0.05 },
    finance:        { factoid: 0.20, procedural: 0.15, comparative: 0.15, authority: 0.25, schema_org: 0.10, topical_cluster: 0.10, local_geo: 0.05 },
    travel:         { factoid: 0.15, procedural: 0.15, comparative: 0.15, authority: 0.10, schema_org: 0.10, topical_cluster: 0.10, local_geo: 0.25 },

    // ── 기본 폴백 ──
    default:        { factoid: 0.15, procedural: 0.15, comparative: 0.15, authority: 0.15, schema_org: 0.15, topical_cluster: 0.15, local_geo: 0.10 },
  };

  /**
   * Calculates the composite AEPI (backward compatible)
   */
  static calculate(snapshot: EntityReflectionSnapshot, industryType: string): number {
    return this.calculateWithBreakdown(snapshot, industryType).composite;
  }

  /**
   * V3: 2단계 동적 가중치가 적용된 AEPI 계산
   * macroKey가 주어지지 않으면 industryType에서 자동 해석
   */
  static calculateWithBreakdown(
    snapshot: EntityReflectionSnapshot,
    industryType: string,
    macroKey?: MacroCategoryKey
  ): AEPIBreakdown {
    // Layer 2: 세부업종별 7차원 가중치
    const weights = this.WEIGHT_PRESETS[industryType] || this.WEIGHT_PRESETS.default;
    const dimensions: Record<string, number> = {};

    let baseScore = 0;
    for (const [dim, weight] of Object.entries(weights)) {
      const errKey = `err_${dim}` as keyof EntityReflectionSnapshot;
      const dimScore = (snapshot[errKey] as number || 0);
      dimensions[dim] = dimScore;
      baseScore += dimScore * weight;
    }

    const techScore = snapshot.tech_mod_score;
    const techModifier = 0.8 + 0.2 * (techScore / 100);

    const eeatScore = snapshot.eeat_mod_score;
    const eeatModifier = 0.8 + 0.2 * (eeatScore / 100);

    // Layer 1: BM 매크로 보정 (V3)
    const resolvedMacroKey = macroKey || getMacroKey(industryType);
    let macroMultiplier = 1.0;
    let appliedMacroWeights: { e: number; c: number; t: number; s: number; r: number } | undefined;

    if (resolvedMacroKey) {
      const mw = this.MACRO_WEIGHTS[resolvedMacroKey];
      appliedMacroWeights = mw;

      // 매크로 가중치를 5영역 점수에 적용하여 보정 계수 산출
      // 5영역: entity(e), content(c), technical(t), schema(s), eeat(r)
      const entityDims = ['factoid', 'authority'];
      const contentDims = ['procedural', 'comparative', 'topical_cluster'];
      const techDims = ['schema_org']; // tech는 이미 modifier로 반영
      const localDims = ['local_geo'];

      const entityAvg = this.avgDimensions(dimensions, entityDims);
      const contentAvg = this.avgDimensions(dimensions, contentDims);
      const schemaDimAvg = this.avgDimensions(dimensions, techDims);
      const localAvg = this.avgDimensions(dimensions, localDims);

      // 매크로 가중치를 보정 계수로 변환 (기본 균등 0.20 대비 편차)
      const macroAdjustment =
        (entityAvg * (mw.e - 0.20)) +
        (contentAvg * (mw.c - 0.20)) +
        (techScore * (mw.t - 0.20) / 100) +
        (schemaDimAvg * (mw.s - 0.20)) +
        (eeatScore * (mw.r - 0.20) / 100);

      // 보정 계수: ±10% 범위 내 조정
      macroMultiplier = 1.0 + Math.max(-0.10, Math.min(0.10, macroAdjustment / 100));
    }

    const aepi = baseScore * techModifier * eeatModifier * macroMultiplier;

    return {
      composite: parseFloat(Math.min(100, Math.max(0, aepi)).toFixed(1)),
      dimensions,
      tech_modifier: parseFloat(techModifier.toFixed(3)),
      eeat_modifier: parseFloat(eeatModifier.toFixed(3)),
      industry: industryType,
      weights_used: weights,
      macroKey: resolvedMacroKey,
      macroWeights: appliedMacroWeights,
    };
  }

  static getWeights(industryType: string): Record<string, number> {
    return this.WEIGHT_PRESETS[industryType] || this.WEIGHT_PRESETS.default;
  }

  /** V3: 매크로 5영역 가중치 반환 */
  static getMacroWeights(macroKey: MacroCategoryKey): { e: number; c: number; t: number; s: number; r: number } {
    return this.MACRO_WEIGHTS[macroKey];
  }

  /** 차원 점수 평균 유틸리티 */
  private static avgDimensions(dimensions: Record<string, number>, keys: string[]): number {
    const vals = keys.map(k => dimensions[k] || 0).filter(v => v > 0);
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  }
}
