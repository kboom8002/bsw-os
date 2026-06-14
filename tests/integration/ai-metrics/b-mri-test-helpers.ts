/**
 * B-MRI Test Helpers
 *
 * Pure utilities for B-MRI (Brand MRI) test scenarios.
 * B-MRI = external observed performance in AI/search-like responses.
 * D-MRI = internal readiness/diagnostic quality. These MUST NOT be conflated.
 */

import type { BMriResult } from '../../../lib/metrics/b-mri';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface BMriTestInput {
  label: string;
  AAS: number;
  OCR: number;
  BSF: number;
  QTC: number;
  GCTR: number;
  ARS: number;
  competitorAAS: number;
  confidencePenalty: number;
  volatilityPenalty: number;
}

export interface WeakDimension {
  dimension: keyof BMriResult['components'];
  value: number;
  threshold: number;
  gap: number;
  priority: 'critical' | 'high' | 'medium';
}

// ─────────────────────────────────────────────────────────────
// Scenario Fixtures
// ─────────────────────────────────────────────────────────────

/**
 * TonyMoly B-MRI input (estimated from www.tonymoly.com public data)
 *
 * Rationale:
 *   AAS=72   — K-Beauty AI responses center TonyMoly moderately; strong in K-Food/Beauty context
 *   OCR=45   — Official citation rate is the weakest link; tonymoly.com not prominently cited
 *   BSF=88   — Brand semantic fidelity is high (clear ingredient/product concepts)
 *   QTC=78   — Good QIS territory coverage across skincare routines
 *   GCTR=80  — GEO concept transfer strong (K-Beauty concepts well represented)
 *   ARS=82   — AEO readiness solid (trust, boundary, explanation present)
 *   competitorAAS=40 — Innisfree estimated competitor AAS
 */
export const TONYMOLY_BMRI_INPUT: BMriTestInput = {
  label: 'TonyMoly (www.tonymoly.com baseline)',
  AAS: 72,
  OCR: 45,
  BSF: 88,
  QTC: 78,
  GCTR: 80,
  ARS: 82,
  competitorAAS: 40,
  confidencePenalty: 0.01,
  volatilityPenalty: 0.02,
};

/**
 * Innisfree B-MRI input (K-Beauty competitor baseline)
 */
export const INNISFREE_BMRI_INPUT: BMriTestInput = {
  label: 'Innisfree (competitor baseline)',
  AAS: 40,
  OCR: 55,
  BSF: 78,
  QTC: 68,
  GCTR: 72,
  ARS: 75,
  competitorAAS: 72, // TonyMoly as reference competitor
  confidencePenalty: 0.01,
  volatilityPenalty: 0.02,
};

// ─────────────────────────────────────────────────────────────
// Analysis Utilities
// ─────────────────────────────────────────────────────────────

/**
 * Identify underperforming dimensions in a B-MRI result.
 * Threshold defaults: AAS≥70, OCR≥60, BSF≥75, QTC≥70, GCTR≥70, ARS≥75.
 * Returns dimensions sorted by gap (worst first).
 */
export function analyzeWeakDimensions(
  components: BMriResult['components']
): WeakDimension[] {
  const thresholds: Record<string, number> = {
    AAS: 70,
    OCR: 60,
    BSF: 75,
    QTC: 70,
    GCTR: 70,
    ARS: 75,
  };

  const dims: WeakDimension[] = [];

  for (const [key, threshold] of Object.entries(thresholds)) {
    const value = components[key as keyof BMriResult['components']] as number;
    if (value < threshold) {
      const gap = threshold - value;
      dims.push({
        dimension: key as keyof BMriResult['components'],
        value,
        threshold,
        gap,
        priority: gap >= 20 ? 'critical' : gap >= 10 ? 'high' : 'medium',
      });
    }
  }

  return dims.sort((a, b) => b.gap - a.gap);
}

/**
 * Reconstruct the base B-MRI before penalty deductions.
 * base = value + confidencePenalty×100 + volatilityPenalty×100
 */
export function computeBaseBMRI(result: BMriResult): number {
  const { confidencePenalty, volatilityPenalty } = result.components;
  return Number(
    Math.min(
      100,
      result.value + confidencePenalty * 100 + volatilityPenalty * 100
    ).toFixed(2)
  );
}

/**
 * Generate RCA-ready action plan from B-MRI analysis.
 * Prioritizes the weakest dimension first.
 */
export function generateBMRIActionPlan(result: BMriResult): string[] {
  const weakDims = analyzeWeakDimensions(result.components);

  if (weakDims.length === 0) {
    return ['✅ All B-MRI dimensions are above threshold. Maintain current strategy.'];
  }

  return weakDims.map((d) => {
    const prefix = d.priority === 'critical' ? '🔴' : d.priority === 'high' ? '🟠' : '🟡';
    const actions: Record<string, string> = {
      AAS: `${prefix} [AAS ${d.value.toFixed(0)}→${d.threshold}] Brand centering 강화: 브랜드 중심 프로브 QIS 추가, 경쟁사 비교 시나리오 확대`,
      OCR: `${prefix} [OCR ${d.value.toFixed(0)}→${d.threshold}] 공식 출처 인용 강화: 브랜드 공식 도메인 Schema.org 마크업, 제품 페이지 GEO 최적화`,
      BSF: `${prefix} [BSF ${d.value.toFixed(0)}→${d.threshold}] 시맨틱 충실도 개선: 핵심 개념 TCO 노드 정비, Concept Distortion 원인 분석`,
      QTC: `${prefix} [QTC ${d.value.toFixed(0)}→${d.threshold}] QIS 커버리지 확대: 미커버 질문 영역 식별 및 프로브 패널 보강`,
      GCTR: `${prefix} [GCTR ${d.value.toFixed(0)}→${d.threshold}] GEO 개념 전달 개선: 키 TCO 개념의 페이지 내 구현 강화`,
      ARS: `${prefix} [ARS ${d.value.toFixed(0)}→${d.threshold}] AEO 구조 강화: Trust/Boundary/Action 요소 가시성 제고`,
    };
    return actions[d.dimension as string] ?? `${prefix} [${d.dimension}] 개선 필요 (현재: ${d.value.toFixed(0)}, 목표: ${d.threshold})`;
  });
}

// ─────────────────────────────────────────────────────────────
// Manual Calculation Verification
// ─────────────────────────────────────────────────────────────

/**
 * Pure formula replication (matches b-mri.ts implementation exactly).
 * Useful for verifying expected values inline in tests.
 *
 * CPS = max(0, AAS − competitorAAS + 50)
 * raw = 0.20×AAS + 0.15×OCR + 0.20×BSF + 0.15×QTC + 0.15×GCTR
 *     + 0.10×ARS + 0.05×CPS − CP×100 − VP×100
 * value = clamp(0, 100, raw)
 */
export function manualComputeBMRI(input: BMriTestInput): number {
  const cps = Math.max(0, input.AAS - input.competitorAAS + 50);
  const raw =
    0.20 * input.AAS +
    0.15 * input.OCR +
    0.20 * input.BSF +
    0.15 * input.QTC +
    0.15 * input.GCTR +
    0.10 * input.ARS +
    0.05 * cps -
    input.confidencePenalty * 100 -
    input.volatilityPenalty * 100;
  return Number(Math.max(0, Math.min(100, raw)).toFixed(2));
}
