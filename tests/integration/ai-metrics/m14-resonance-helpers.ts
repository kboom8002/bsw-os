/**
 * M14 Cross-Cultural Resonance — Pure Function Helpers
 *
 * Two independent computation paths:
 *   Path A: Aggregator formula (derives M14 from existing M3/M4/M9 scores)
 *   Path B: LLM Judge 5-axis model (direct structured evaluation)
 *
 * Both paths are production-ready; Path B is primary when AI_PROVIDER_MODE=gemini.
 */

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface FiveAxisSubscores {
  /** Emotional/psychological resonance with target culture */
  affective_fit: number;
  /** Self-concept / cultural identity alignment */
  identity_fit: number;
  /** How well the content translates to local context */
  context_translation: number;
  /** Commercial appeal in target market */
  commercial_fit: number;
  /** Low cultural friction / no appropriation signals */
  low_friction: number;
}

export interface DualPathResult {
  /** Score from Aggregator formula (Path A) */
  aggregator_score: number;
  /** Score from LLM Judge (Path B) */
  judge_score: number;
  /** Absolute delta between paths */
  delta: number;
  /** True if delta < threshold */
  consistent: boolean;
  /** Set when delta ≥ threshold */
  divergence_warning?: string;
}

export interface MarketResonanceProfile {
  market: 'KR' | 'JP_SEA' | 'NA_EU';
  label: string;
  /** Expected bias for each axis (adjustment applied to base subscores) */
  axis_bias: FiveAxisSubscores;
  /** Typical M14 rank relative to other markets for K-Beauty content */
  expected_rank: 1 | 2 | 3;
}

export type ResonanceGrade = 'A' | 'B' | 'C' | 'D' | 'F';

// ─────────────────────────────────────────────────────────────
// Path A — Aggregator Formula
// ─────────────────────────────────────────────────────────────

/**
 * Compute M14 using the Aggregator weighted formula.
 *
 * Formula: clamp(0,1,  0.4×M3 + 0.3×(1−M4) + 0.3×(1−M9))
 *
 * @param m3  Brand/Cultural Concept Fidelity  [0, 1]
 * @param m4  Concept Distortion Rate          [0, 1]  (lower = better)
 * @param m9  Floor Risk Score                 [0, 1]  (lower = better)
 */
export function computeM14Aggregator(m3: number, m4: number, m9: number): number {
  const raw = 0.4 * m3 + 0.3 * (1 - m4) + 0.3 * (1 - m9);
  return Math.min(1.0, Math.max(0.0, raw));
}

// ─────────────────────────────────────────────────────────────
// Path B — LLM Judge 5-Axis Model
// ─────────────────────────────────────────────────────────────

/**
 * Compute M14 using the LLM Judge 5-axis weighted model.
 *
 * Weights (sum = 1.0):
 *   Affective Fit        0.30
 *   Identity Fit         0.25
 *   Context Translation  0.20
 *   Commercial Fit       0.15
 *   Low Friction         0.10
 */
export function computeM14FiveAxis(subscores: FiveAxisSubscores): number {
  const raw =
    0.30 * subscores.affective_fit +
    0.25 * subscores.identity_fit +
    0.20 * subscores.context_translation +
    0.15 * subscores.commercial_fit +
    0.10 * subscores.low_friction;
  return Math.min(1.0, Math.max(0.0, raw));
}

// ─────────────────────────────────────────────────────────────
// Dual-Path Consistency Guard
// ─────────────────────────────────────────────────────────────

/**
 * Compare Path A and Path B results.
 * Production policy: warn if |A − B| ≥ threshold (default 0.15).
 */
export function checkDualPathConsistency(
  aggregatorScore: number,
  judgeScore: number,
  threshold = 0.15
): DualPathResult {
  const delta = Math.abs(aggregatorScore - judgeScore);
  const consistent = delta < threshold;
  return {
    aggregator_score: aggregatorScore,
    judge_score: judgeScore,
    delta,
    consistent,
    divergence_warning: consistent
      ? undefined
      : `M14 dual-path divergence detected: aggregator=${aggregatorScore.toFixed(4)}, judge=${judgeScore.toFixed(4)}, delta=${delta.toFixed(4)} ≥ threshold=${threshold}`,
  };
}

// ─────────────────────────────────────────────────────────────
// Grade Mapping
// ─────────────────────────────────────────────────────────────

/**
 * Map M14 score to resonance grade.
 *
 * Grade bands (aligned with existing M3/BCF convention):
 *   A  ≥ 0.85
 *   B  ≥ 0.70
 *   C  ≥ 0.55
 *   D  ≥ 0.40
 *   F  < 0.40
 */
export function getResonanceGrade(score: number): ResonanceGrade {
  if (score >= 0.85) return 'A';
  if (score >= 0.70) return 'B';
  if (score >= 0.55) return 'C';
  if (score >= 0.40) return 'D';
  return 'F';
}

// ─────────────────────────────────────────────────────────────
// Multi-Market Context Factory
// ─────────────────────────────────────────────────────────────

/**
 * Return the resonance profile for a given target market.
 * Each profile contains axis_bias that is ADDED to a base subscore set
 * to simulate how the same K-Beauty content lands differently per market.
 *
 * Bias values can be negative (penalty) or positive (amplifier).
 * Clamping is applied downstream when computing M14FiveAxis.
 */
export function getMarketContext(market: 'KR' | 'JP_SEA' | 'NA_EU'): MarketResonanceProfile {
  const profiles: Record<string, MarketResonanceProfile> = {
    KR: {
      market: 'KR',
      label: '한국 본토 (Korea Domestic)',
      axis_bias: {
        affective_fit: +0.05,   // Strong emotional resonance with home culture
        identity_fit: +0.08,    // Highest self-concept alignment
        context_translation: +0.02, // No translation overhead
        commercial_fit: +0.03,
        low_friction: +0.04,
      },
      expected_rank: 1,
    },
    JP_SEA: {
      market: 'JP_SEA',
      label: '일본 / 동남아시아 (Japan & Southeast Asia)',
      axis_bias: {
        affective_fit: 0.00,    // Moderate resonance (K-Wave penetration)
        identity_fit: -0.05,    // Partial identity overlap
        context_translation: -0.08, // Some cultural translation loss
        commercial_fit: +0.02,  // Strong K-Beauty commercial traction
        low_friction: -0.02,
      },
      expected_rank: 2,
    },
    NA_EU: {
      market: 'NA_EU',
      label: '북미 / 유럽 (North America & Europe)',
      axis_bias: {
        affective_fit: -0.05,   // Lower emotional fit (exotic factor)
        identity_fit: -0.12,    // Low identity overlap
        context_translation: -0.12, // High cultural translation cost
        commercial_fit: -0.03,  // Growing but early-stage K-Beauty adoption
        low_friction: -0.05,    // Potential orientalism/exoticism friction
      },
      expected_rank: 3,
    },
  };
  return profiles[market];
}

/**
 * Apply market bias to a base 5-axis subscore set, clamping each axis to [0, 1].
 */
export function applyMarketBias(
  base: FiveAxisSubscores,
  bias: FiveAxisSubscores
): FiveAxisSubscores {
  return {
    affective_fit: Math.min(1, Math.max(0, base.affective_fit + bias.affective_fit)),
    identity_fit: Math.min(1, Math.max(0, base.identity_fit + bias.identity_fit)),
    context_translation: Math.min(1, Math.max(0, base.context_translation + bias.context_translation)),
    commercial_fit: Math.min(1, Math.max(0, base.commercial_fit + bias.commercial_fit)),
    low_friction: Math.min(1, Math.max(0, base.low_friction + bias.low_friction)),
  };
}
