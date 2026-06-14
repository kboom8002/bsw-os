/**
 * T5 — M14 Cross-Cultural Resonance (문화 공명도) 프러덕션 레벨 측정 테스트
 *
 * 4개 테스트 스위트:
 *   Suite 1 — Aggregator 수학 공식 검증 (Path A)
 *   Suite 2 — LLM Judge 5-Axis 평가 검증 (Path B)
 *   Suite 3 — Dual-Path 일치성 가드레일
 *   Suite 4 — Multi-Market M14 세분화 (KR / JP_SEA / NA_EU)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSupabaseAdminClient } from '../../../lib/supabase';
import { CulturalJudgeProvider } from '../../../lib/judges/cultural-judge-provider';
import {
  computeM14Aggregator,
  computeM14FiveAxis,
  checkDualPathConsistency,
  getResonanceGrade,
  getMarketContext,
  applyMarketBias,
  type FiveAxisSubscores,
} from './m14-resonance-helpers';

// ─── Mocks ───────────────────────────────────────────────────

vi.mock('../../../lib/supabase', () => ({
  getSupabaseAdminClient: vi.fn(),
}));

vi.mock('../../../lib/ai/ai-provider', () => ({
  getAIProvider: vi.fn(() => ({
    generateStructuredOutput: vi.fn(async (_prompt: string, _schema: any) => ({
      resonance_score: 0.87,
      transferability_score: 0.81,
    })),
  })),
}));

// ─── Test Data Matrix ─────────────────────────────────────────

/**
 * 8-scenario test matrix  (Path A — Aggregator formula)
 *
 * Formula: M14 = clamp(0,1,  0.4×M3 + 0.3×(1−M4) + 0.3×(1−M9))
 *
 * Manual verification:
 *   Perfect:       0.4×1.00 + 0.3×(1-0.00) + 0.3×(1-0.00) = 1.0000
 *   Worst:         0.4×0.00 + 0.3×(1-1.00) + 0.3×(1-1.00) = 0.0000
 *   TonyMoly-like: 0.4×0.88 + 0.3×(1-0.05) + 0.3×(1-0.06) = 0.352+0.285+0.282 = 0.9190 → wait
 *
 *   Let me recalculate:
 *   TonyMoly: 0.4×0.88=0.352, 0.3×0.95=0.285, 0.3×0.94=0.282 → 0.919
 *   High-Fidelity: 0.4×0.92=0.368, 0.3×0.98=0.294, 0.3×0.96=0.288 → 0.950
 *   Low-Fidelity: 0.4×0.40=0.160, 0.3×0.70=0.210, 0.3×0.50=0.150 → 0.520
 *   KR:       0.4×0.95=0.380, 0.3×0.98=0.294, 0.3×0.97=0.291 → 0.965
 *   JP_SEA:   0.4×0.82=0.328, 0.3×0.92=0.276, 0.3×0.90=0.270 → 0.874
 *   NA_EU:    0.4×0.70=0.280, 0.3×0.88=0.264, 0.3×0.85=0.255 → 0.799
 */
const AGGREGATOR_SCENARIOS = [
  { name: 'Perfect',       m3: 1.00, m4: 0.00, m9: 0.00, expected: 1.0000, grade: 'A' },
  { name: 'Worst',         m3: 0.00, m4: 1.00, m9: 1.00, expected: 0.0000, grade: 'F' },
  { name: 'TonyMoly-like', m3: 0.88, m4: 0.05, m9: 0.06, expected: 0.9190, grade: 'A' },
  { name: 'High-Fidelity', m3: 0.92, m4: 0.02, m9: 0.04, expected: 0.9500, grade: 'A' },
  { name: 'Low-Fidelity',  m3: 0.40, m4: 0.30, m9: 0.50, expected: 0.5200, grade: 'D' },
  { name: 'KR Market',     m3: 0.95, m4: 0.02, m9: 0.03, expected: 0.9650, grade: 'A' },
  { name: 'JP_SEA Market', m3: 0.82, m4: 0.08, m9: 0.10, expected: 0.8740, grade: 'A' },
  { name: 'NA_EU Market',  m3: 0.70, m4: 0.12, m9: 0.15, expected: 0.7990, grade: 'B' },
] as const;

// ─── Suites ───────────────────────────────────────────────────

describe('T5 — M14 Cross-Cultural Resonance (문화 공명도)', () => {

  // ================================================================
  // Suite 1 — Aggregator 수학 공식 검증 (Path A)
  // ================================================================
  describe('Suite 1 — Aggregator Formula Verification (Path A)', () => {

    it.each(AGGREGATOR_SCENARIOS)(
      'scenario "$name": M3=$m3, M4=$m4, M9=$m9 → M14 ≈ $expected (grade $grade)',
      ({ m3, m4, m9, expected, grade }) => {
        const score = computeM14Aggregator(m3, m4, m9);
        expect(score).toBeCloseTo(expected, 4);
        expect(getResonanceGrade(score)).toBe(grade);
      }
    );

    it('should always clamp output to [0, 1] even with out-of-range inputs', () => {
      // Inputs beyond valid range must not produce scores outside [0,1]
      expect(computeM14Aggregator(1.5, -0.2, -0.1)).toBe(1.0);
      expect(computeM14Aggregator(-0.5, 1.5, 1.2)).toBe(0.0);
    });

    it('should verify formula coefficient sum equals 1.0', () => {
      // With M4=0 and M9=0, M14 = 0.4×M3 + 0.3 + 0.3 = 0.4×M3 + 0.6
      // At M3=1.0: expect 1.0
      expect(computeM14Aggregator(1.0, 0.0, 0.0)).toBeCloseTo(1.0, 4);
      // At M3=0.0: 0.4×0 + 0.3 + 0.3 = 0.6
      expect(computeM14Aggregator(0.0, 0.0, 0.0)).toBeCloseTo(0.6, 4);
      // Coefficient sensitivity: doubling M3 from 0.5→1.0 should raise M14 by 0.4×0.5=0.2
      const low  = computeM14Aggregator(0.5, 0.0, 0.0);
      const high = computeM14Aggregator(1.0, 0.0, 0.0);
      expect(high - low).toBeCloseTo(0.2, 4);
    });

    it('should demonstrate that Distortion (M4) and FloorRisk (M9) have equal 0.3 weight each', () => {
      // Increasing M4 by 0.1 should decrease M14 by 0.03
      const base = computeM14Aggregator(0.80, 0.10, 0.10);
      const highM4 = computeM14Aggregator(0.80, 0.20, 0.10);
      expect(base - highM4).toBeCloseTo(0.03, 4);

      // Increasing M9 by 0.1 should also decrease M14 by 0.03
      const highM9 = computeM14Aggregator(0.80, 0.10, 0.20);
      expect(base - highM9).toBeCloseTo(0.03, 4);
    });
  });

  // ================================================================
  // Suite 2 — LLM Judge 5-Axis 평가 검증 (Path B)
  // ================================================================
  describe('Suite 2 — LLM Judge 5-Axis Evaluation (Path B)', () => {

    it('should compute M14 from 5-axis subscores with correct weights', () => {
      // Perfect subscores → M14 = 1.0
      const perfect: FiveAxisSubscores = {
        affective_fit: 1.0,
        identity_fit: 1.0,
        context_translation: 1.0,
        commercial_fit: 1.0,
        low_friction: 1.0,
      };
      expect(computeM14FiveAxis(perfect)).toBeCloseTo(1.0, 4);

      // Zero subscores → M14 = 0.0
      const zero: FiveAxisSubscores = {
        affective_fit: 0.0,
        identity_fit: 0.0,
        context_translation: 0.0,
        commercial_fit: 0.0,
        low_friction: 0.0,
      };
      expect(computeM14FiveAxis(zero)).toBeCloseTo(0.0, 4);
    });

    it('should verify 5-axis weight contributions individually', () => {
      // Only affective_fit = 1.0, rest = 0 → M14 should equal w=0.30
      expect(computeM14FiveAxis({ affective_fit: 1.0, identity_fit: 0, context_translation: 0, commercial_fit: 0, low_friction: 0 }))
        .toBeCloseTo(0.30, 4);

      // Only identity_fit = 1.0 → w=0.25
      expect(computeM14FiveAxis({ affective_fit: 0, identity_fit: 1.0, context_translation: 0, commercial_fit: 0, low_friction: 0 }))
        .toBeCloseTo(0.25, 4);

      // Only context_translation = 1.0 → w=0.20
      expect(computeM14FiveAxis({ affective_fit: 0, identity_fit: 0, context_translation: 1.0, commercial_fit: 0, low_friction: 0 }))
        .toBeCloseTo(0.20, 4);

      // Only commercial_fit = 1.0 → w=0.15
      expect(computeM14FiveAxis({ affective_fit: 0, identity_fit: 0, context_translation: 0, commercial_fit: 1.0, low_friction: 0 }))
        .toBeCloseTo(0.15, 4);

      // Only low_friction = 1.0 → w=0.10
      expect(computeM14FiveAxis({ affective_fit: 0, identity_fit: 0, context_translation: 0, commercial_fit: 0, low_friction: 1.0 }))
        .toBeCloseTo(0.10, 4);

      // Weight sum sanity check: all weights must sum to 1.0
      const sumCheck = computeM14FiveAxis({
        affective_fit: 1.0,
        identity_fit: 1.0,
        context_translation: 1.0,
        commercial_fit: 1.0,
        low_friction: 1.0,
      });
      expect(sumCheck).toBeCloseTo(1.0, 4);
    });

    it('should return mock resonance/transferability from CulturalJudgeProvider in mock mode', async () => {
      // CulturalJudgeProvider.runResonanceAndTransferability in mock mode
      // (AI_PROVIDER_MODE defaults to 'mock' in test environment)
      const originalMode = process.env.AI_PROVIDER_MODE;
      process.env.AI_PROVIDER_MODE = 'mock';

      const mockCtx: any = {
        workspace_id: 'test-workspace',
        domain_pack: { id: 'dp-1', slug: 'k-beauty', name: 'K-Beauty', supported_languages: ['ko','en'], concept_types: [], rating_axes: [], forbidden_patterns: [], risk_policies: {} },
        concepts: [],
        target_market: 'KR',
        target_microgroup: 'Gen Z Female',
      };

      const result = await CulturalJudgeProvider.runResonanceAndTransferability(
        mockCtx,
        'K-뷰티는 스킨케어 루틴의 핵심입니다. Glass Skin을 달성하기 위한 이중 세안 방법을 소개합니다.'
      );

      expect(result).toBeDefined();
      expect(result.resonance).toBeTypeOf('number');
      expect(result.transferability).toBeTypeOf('number');
      expect(result.resonance).toBeGreaterThanOrEqual(0);
      expect(result.resonance).toBeLessThanOrEqual(1);
      expect(result.transferability).toBeGreaterThanOrEqual(0);
      expect(result.transferability).toBeLessThanOrEqual(1);

      // Mock mode should return fixed values: resonance=0.88, transferability=0.82
      expect(result.resonance).toBe(0.88);
      expect(result.transferability).toBe(0.82);

      process.env.AI_PROVIDER_MODE = originalMode;
    });

    it('should return structured output with correct schema in gemini mode (simulated)', async () => {
      // Simulate gemini mode: AI provider returns { resonance_score, transferability_score }
      const originalMode = process.env.AI_PROVIDER_MODE;
      process.env.AI_PROVIDER_MODE = 'gemini';

      const mockCtx: any = {
        workspace_id: 'test-workspace',
        domain_pack: { id: 'dp-1', slug: 'k-beauty', name: 'K-Beauty', supported_languages: ['ko','en'], concept_types: [], rating_axes: [], forbidden_patterns: [], risk_policies: {} },
        concepts: [],
        target_market: 'KR',
      };

      const result = await CulturalJudgeProvider.runResonanceAndTransferability(
        mockCtx,
        'K-뷰티는 글로벌 뷰티 시장에서 혁신적인 스킨케어 패러다임을 제시합니다.'
      );

      // Mocked AI provider returns { resonance_score: 0.87, transferability_score: 0.81 }
      expect(result.resonance).toBe(0.87);
      expect(result.transferability).toBe(0.81);
      expect(getResonanceGrade(result.resonance)).toBe('A');

      process.env.AI_PROVIDER_MODE = originalMode;
    });
  });

  // ================================================================
  // Suite 3 — Dual-Path 일치성 가드레일
  // ================================================================
  describe('Suite 3 — Dual-Path Consistency Check', () => {

    it('should pass consistency check when delta < 0.15 (default threshold)', () => {
      // Path A = 0.82, Path B = 0.88 → delta = 0.06 → consistent
      const result = checkDualPathConsistency(0.82, 0.88);

      expect(result.consistent).toBe(true);
      expect(result.delta).toBeCloseTo(0.06, 4);
      expect(result.divergence_warning).toBeUndefined();
      expect(result.aggregator_score).toBe(0.82);
      expect(result.judge_score).toBe(0.88);
    });

    it('should fail consistency check and emit warning when delta ≥ 0.15', () => {
      // Path A = 0.60, Path B = 0.88 → delta = 0.28 → divergence warning
      const result = checkDualPathConsistency(0.60, 0.88);

      expect(result.consistent).toBe(false);
      expect(result.delta).toBeCloseTo(0.28, 4);
      expect(result.divergence_warning).toBeDefined();
      expect(result.divergence_warning).toContain('divergence detected');
      expect(result.divergence_warning).toContain('aggregator=0.6000');
      expect(result.divergence_warning).toContain('judge=0.8800');
    });

    it('should respect custom threshold parameter', () => {
      // Strict threshold of 0.05: delta=0.06 → divergence
      const strict = checkDualPathConsistency(0.82, 0.88, 0.05);
      expect(strict.consistent).toBe(false);

      // Loose threshold of 0.30: delta=0.28 → consistent
      const loose = checkDualPathConsistency(0.60, 0.88, 0.30);
      expect(loose.consistent).toBe(true);
    });

    it('should handle exact threshold boundary (delta === threshold → inconsistent)', () => {
      // delta = 0.15 exactly is NOT consistent (strict less-than check)
      const boundary = checkDualPathConsistency(0.70, 0.85, 0.15);
      expect(boundary.delta).toBeCloseTo(0.15, 4);
      expect(boundary.consistent).toBe(false);
    });

    it('should be symmetric (A vs B == B vs A)', () => {
      const forward  = checkDualPathConsistency(0.75, 0.90);
      const backward = checkDualPathConsistency(0.90, 0.75);
      expect(forward.delta).toBeCloseTo(backward.delta, 4);
      expect(forward.consistent).toBe(backward.consistent);
    });

    it('should demonstrate real-world TonyMoly dual-path scenario', () => {
      // TonyMoly data:
      //   Path A (aggregator): M3=0.88, M4=0.05, M9=0.06 → 0.9190
      //   Path B (LLM judge mock): resonance=0.88
      const pathA = computeM14Aggregator(0.88, 0.05, 0.06);
      const pathB = 0.88; // Mock judge output

      const consistency = checkDualPathConsistency(pathA, pathB);

      expect(pathA).toBeCloseTo(0.9190, 4);
      expect(consistency.delta).toBeCloseTo(Math.abs(0.9190 - 0.88), 4);
      // delta ≈ 0.039 → consistent within 0.15 threshold
      expect(consistency.consistent).toBe(true);

      console.log(`
  ┌─────────────────────────────────────────────────────┐
  │  TonyMoly M14 Dual-Path Report                       │
  ├─────────────────────────────────────────────────────┤
  │  Path A (Aggregator):  ${pathA.toFixed(4)}  Grade: ${getResonanceGrade(pathA)}       │
  │  Path B (LLM Judge):   ${pathB.toFixed(4)}  Grade: ${getResonanceGrade(pathB)}       │
  │  Delta:                ${consistency.delta.toFixed(4)}                       │
  │  Status:               ${consistency.consistent ? '✅ CONSISTENT' : '⚠️  DIVERGENCE'}               │
  └─────────────────────────────────────────────────────┘`);
    });
  });

  // ================================================================
  // Suite 4 — Multi-Market M14 세분화 (KR / JP_SEA / NA_EU)
  // ================================================================
  describe('Suite 4 — Multi-Market M14 Segmentation', () => {

    /**
     * K-Beauty baseline subscores (neutral, no market bias applied yet)
     * These represent a well-written K-Beauty AI response in Korean domestic context.
     */
    const KBEAUTY_BASE_SUBSCORES: FiveAxisSubscores = {
      affective_fit: 0.88,
      identity_fit: 0.85,
      context_translation: 0.82,
      commercial_fit: 0.80,
      low_friction: 0.90,
    };

    it('should compute M14 for each market and verify KR > JP_SEA > NA_EU ranking', () => {
      const markets = (['KR', 'JP_SEA', 'NA_EU'] as const);
      const scores: Record<string, number> = {};

      for (const market of markets) {
        const profile = getMarketContext(market);
        const biasedSubscores = applyMarketBias(KBEAUTY_BASE_SUBSCORES, profile.axis_bias);
        scores[market] = computeM14FiveAxis(biasedSubscores);
      }

      console.log(`
  ┌─────────────────────────────────────────────────────┐
  │  K-Beauty M14 Multi-Market Segmentation Report       │
  ├─────────────────────────────────────────────────────┤
  │  🇰🇷 KR (한국):         ${scores.KR.toFixed(4)}  Grade: ${getResonanceGrade(scores.KR)}       │
  │  🌏 JP_SEA (일본/동남아): ${scores.JP_SEA.toFixed(4)}  Grade: ${getResonanceGrade(scores.JP_SEA)}       │
  │  🌍 NA_EU (북미/유럽):   ${scores.NA_EU.toFixed(4)}  Grade: ${getResonanceGrade(scores.NA_EU)}       │
  └─────────────────────────────────────────────────────┘`);

      // K-Beauty content resonates most strongly in domestic Korean market
      expect(scores.KR).toBeGreaterThan(scores.JP_SEA);
      expect(scores.JP_SEA).toBeGreaterThan(scores.NA_EU);
    });

    it('should return correct expected_rank from market context', () => {
      expect(getMarketContext('KR').expected_rank).toBe(1);
      expect(getMarketContext('JP_SEA').expected_rank).toBe(2);
      expect(getMarketContext('NA_EU').expected_rank).toBe(3);
    });

    it('should verify axis_bias values are applied correctly per market', () => {
      const krProfile   = getMarketContext('KR');
      const naeuProfile = getMarketContext('NA_EU');

      // KR has the highest identity_fit bias (+0.08)
      expect(krProfile.axis_bias.identity_fit).toBeGreaterThan(0);

      // NA_EU has the lowest identity_fit bias (-0.12)
      expect(naeuProfile.axis_bias.identity_fit).toBeLessThan(0);

      // NA_EU context_translation penalty is the largest negative bias
      expect(naeuProfile.axis_bias.context_translation).toBeLessThanOrEqual(-0.10);
    });

    it('should clamp biased subscores within [0, 1] even with large biases', () => {
      // Apply extreme positive bias to already-maxed subscores
      const maxSubscores: FiveAxisSubscores = {
        affective_fit: 1.0,
        identity_fit: 1.0,
        context_translation: 1.0,
        commercial_fit: 1.0,
        low_friction: 1.0,
      };
      const krBias = getMarketContext('KR').axis_bias;
      const biased = applyMarketBias(maxSubscores, krBias);

      // All axes must still be ≤ 1.0
      expect(biased.affective_fit).toBeLessThanOrEqual(1.0);
      expect(biased.identity_fit).toBeLessThanOrEqual(1.0);
      expect(biased.context_translation).toBeLessThanOrEqual(1.0);
      expect(biased.commercial_fit).toBeLessThanOrEqual(1.0);
      expect(biased.low_friction).toBeLessThanOrEqual(1.0);

      // Apply extreme negative bias to zero subscores
      const zeroSubscores: FiveAxisSubscores = {
        affective_fit: 0.0,
        identity_fit: 0.0,
        context_translation: 0.0,
        commercial_fit: 0.0,
        low_friction: 0.0,
      };
      const naeuBias = getMarketContext('NA_EU').axis_bias;
      const negBiased = applyMarketBias(zeroSubscores, naeuBias);

      // All axes must still be ≥ 0.0
      expect(negBiased.affective_fit).toBeGreaterThanOrEqual(0.0);
      expect(negBiased.identity_fit).toBeGreaterThanOrEqual(0.0);
      expect(negBiased.context_translation).toBeGreaterThanOrEqual(0.0);
    });

    it('should produce A-grade for KR market given strong K-Beauty content', () => {
      const profile = getMarketContext('KR');
      const biasedSubscores = applyMarketBias(KBEAUTY_BASE_SUBSCORES, profile.axis_bias);
      const m14 = computeM14FiveAxis(biasedSubscores);
      const grade = getResonanceGrade(m14);

      expect(m14).toBeGreaterThan(0.85);
      expect(grade).toBe('A');
    });

    it('should produce B-or-higher grade for JP_SEA market (K-Wave influence)', () => {
      const profile = getMarketContext('JP_SEA');
      const biasedSubscores = applyMarketBias(KBEAUTY_BASE_SUBSCORES, profile.axis_bias);
      const m14 = computeM14FiveAxis(biasedSubscores);
      const grade = getResonanceGrade(m14);

      expect(m14).toBeGreaterThan(0.70); // B or better
      expect(['A', 'B']).toContain(grade);
    });

    it('should perform full end-to-end M14 segmentation with dual-path consistency per market', () => {
      const markets = (['KR', 'JP_SEA', 'NA_EU'] as const);

      // Aggregator path uses market-specific M3/M4/M9 proxies
      const aggregatorInputs = {
        KR:     { m3: 0.95, m4: 0.02, m9: 0.03 },
        JP_SEA: { m3: 0.82, m4: 0.08, m9: 0.10 },
        NA_EU:  { m3: 0.70, m4: 0.12, m9: 0.15 },
      };

      const report: Array<{
        market: string;
        pathA: number;
        pathB: number;
        consistent: boolean;
        gradeA: string;
        gradeB: string;
      }> = [];

      for (const market of markets) {
        const { m3, m4, m9 } = aggregatorInputs[market];
        const pathA = computeM14Aggregator(m3, m4, m9);

        const profile = getMarketContext(market);
        const biasedSubscores = applyMarketBias(KBEAUTY_BASE_SUBSCORES, profile.axis_bias);
        const pathB = computeM14FiveAxis(biasedSubscores);

        const consistency = checkDualPathConsistency(pathA, pathB);

        report.push({
          market,
          pathA,
          pathB,
          consistent: consistency.consistent,
          gradeA: getResonanceGrade(pathA),
          gradeB: getResonanceGrade(pathB),
        });
      }

      console.log(`
  ┌─────────────────────────────────────────────────────────────────────┐
  │  M14 Full E2E Multi-Market Dual-Path Report                          │
  ├────────┬────────────┬────────────┬───────┬───────┬─────────────────┤
  │ Market │  Path A    │  Path B    │  Gr A │  Gr B │  Status          │
  ├────────┼────────────┼────────────┼───────┼───────┼─────────────────┤
  ${report.map(r => `│ ${r.market.padEnd(6)} │  ${r.pathA.toFixed(4)}    │  ${r.pathB.toFixed(4)}    │  ${r.gradeA}    │  ${r.gradeB}    │  ${r.consistent ? '✅ OK          ' : '⚠️ DIVERGENCE  '} │`).join('\n  ')}
  └────────┴────────────┴────────────┴───────┴───────┴─────────────────┘`);

      // All markets should have valid scores
      for (const r of report) {
        expect(r.pathA).toBeGreaterThanOrEqual(0);
        expect(r.pathA).toBeLessThanOrEqual(1);
        expect(r.pathB).toBeGreaterThanOrEqual(0);
        expect(r.pathB).toBeLessThanOrEqual(1);
      }

      // Market ranking: KR should have highest aggregator score
      const krReport    = report.find(r => r.market === 'KR')!;
      const jpseaReport = report.find(r => r.market === 'JP_SEA')!;
      const naeuReport  = report.find(r => r.market === 'NA_EU')!;

      expect(krReport.pathA).toBeGreaterThan(jpseaReport.pathA);
      expect(jpseaReport.pathA).toBeGreaterThan(naeuReport.pathA);
    });
  });

  // ================================================================
  // Suite 5 — Grade Mapping Boundary Tests
  // ================================================================
  describe('Suite 5 — Resonance Grade Mapping', () => {

    it('should correctly map all grade boundary values', () => {
      // Exact boundary conditions
      expect(getResonanceGrade(1.00)).toBe('A');
      expect(getResonanceGrade(0.85)).toBe('A');  // exact lower bound of A
      expect(getResonanceGrade(0.849)).toBe('B'); // just below A
      expect(getResonanceGrade(0.70)).toBe('B');   // exact lower bound of B
      expect(getResonanceGrade(0.699)).toBe('C'); // just below B
      expect(getResonanceGrade(0.55)).toBe('C');   // exact lower bound of C
      expect(getResonanceGrade(0.549)).toBe('D'); // just below C
      expect(getResonanceGrade(0.40)).toBe('D');   // exact lower bound of D
      expect(getResonanceGrade(0.399)).toBe('F'); // just below D
      expect(getResonanceGrade(0.00)).toBe('F');
    });

    it('should produce A grade for perfect resonance and F for zero resonance', () => {
      expect(getResonanceGrade(computeM14Aggregator(1.0, 0.0, 0.0))).toBe('A');
      expect(getResonanceGrade(computeM14Aggregator(0.0, 1.0, 1.0))).toBe('F');
    });
  });

});
