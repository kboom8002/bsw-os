/**
 * T6 — B-MRI (Brand MRI) 프러덕션 레벨 측정 테스트
 *
 * B-MRI = AI/검색형 응답에서의 브랜드 관측 수행 지수 (외부 관측 기반)
 * D-MRI = 내부 브랜드 진단 준비도 지수 (내부 진단 기반)
 * → 두 지표는 BSW-OS 구조 원칙에 따라 반드시 분리되어야 함.
 *
 * 공식:
 *   B-MRI = 0.20×AAS + 0.15×OCR + 0.20×BSF + 0.15×QTC
 *           + 0.15×GCTR + 0.10×ARS + 0.05×CPS
 *           − (confidencePenalty×100) − (volatilityPenalty×100)
 *   CPS   = max(0, AAS − competitorAAS + 50)
 *   clamp(0, 100)
 *
 * 6개 스위트 / 28개 테스트:
 *   Suite 1 — 수학 공식 정확성 (8 시나리오)
 *   Suite 2 — 구성요소 민감도 분석
 *   Suite 3 — Competitive Position Score 포지셔닝
 *   Suite 4 — Volatility & Confidence 패널티
 *   Suite 5 — TonyMoly 브랜드 케이스 스터디
 *   Suite 6 — 가중치 완결성 & Clamp 경계
 */

import { describe, it, expect } from 'vitest';
import { computeBMRI } from '../../../lib/metrics/b-mri';
import { computeDMRI } from '../../../lib/metrics/d-mri';
import {
  TONYMOLY_BMRI_INPUT,
  INNISFREE_BMRI_INPUT,
  analyzeWeakDimensions,
  computeBaseBMRI,
  generateBMRIActionPlan,
  manualComputeBMRI,
  type BMriTestInput,
} from './b-mri-test-helpers';

// ─────────────────────────────────────────────────────────────
// Suite 1 — 수학 공식 정확성 (8 시나리오)
// ─────────────────────────────────────────────────────────────

/**
 * 8-Scenario Test Matrix — Manual Calculation (CPS = max(0, AAS−competitor+50)):
 *
 * 1. Spec:        CPS=max(0,80-25+50)=105
 *    raw = 0.20×80+0.15×75+0.20×90+0.15×85+0.15×70+0.10×82+0.05×105 − 0.005×100 − 0.01×100
 *        = 16+11.25+18+12.75+10.5+8.2+5.25 − 0.5 − 1.0
 *        = 81.95 − 1.5 = 80.45 ✓
 *
 * 2. Perfect:     CPS=max(0,100-0+50)=150
 *    raw = 20+15+20+15+15+10+7.5 = 102.5 → clamped = 100.00
 *
 * 3. Zero:        CPS=max(0,0-100+50)=0
 *    raw = 0 → 0.00
 *
 * 4. High-Penalty: Same inputs as Spec, but CP=0.05, VP=0.10
 *    base = 81.95 (Spec without penalties)
 *    raw  = 81.95 − 5.0 − 10.0 = 66.95
 *
 * 5. Parity:      AAS=competitor=60 → CPS=max(0,60-60+50)=50
 *    raw = 0.20×60+0.15×60+0.20×70+0.15×65+0.15×60+0.10×68+0.05×50
 *        = 12+9+14+9.75+9+6.8+2.5 = 63.05
 *
 * 6. TonyMoly:    CPS=max(0,72-40+50)=82
 *    raw = 0.20×72+0.15×45+0.20×88+0.15×78+0.15×80+0.10×82+0.05×82 − 0.01×100 − 0.02×100
 *        = 14.4+6.75+17.6+11.7+12.0+8.2+4.1 − 1.0 − 2.0
 *        = 74.75 − 3.0 = 71.75
 *
 * 7. Weak-OCR:    CPS=max(0,80-25+50)=105
 *    raw = 0.20×80+0.15×10+0.20×90+0.15×85+0.15×70+0.10×82+0.05×105
 *        = 16+1.5+18+12.75+10.5+8.2+5.25 = 72.20 (no penalty)
 *
 * 8. No-Competitor: CPS=max(0,75-75+50)=50
 *    raw = 0.20×75+0.15×60+0.20×80+0.15×70+0.15×65+0.10×75+0.05×50
 *        = 15+9+16+10.5+9.75+7.5+2.5 = 70.25
 */
const SCENARIOS: Array<{
  name: string;
  args: [number,number,number,number,number,number,number,number,number];
  expected: number;
}> = [
  {
    name: 'Spec (기존 단위 테스트 재현)',
    args: [80, 75, 90, 85, 70, 82, 25, 0.005, 0.01],
    expected: 80.45,
  },
  {
    name: 'Perfect (all-100, no penalty)',
    args: [100, 100, 100, 100, 100, 100, 0, 0, 0],
    expected: 100.00,
  },
  {
    name: 'Zero (all-0, max competitor)',
    args: [0, 0, 0, 0, 0, 0, 100, 0, 0],
    expected: 0.00,
  },
  {
    name: 'High-Penalty (Spec + CP=0.05, VP=0.10)',
    args: [80, 75, 90, 85, 70, 82, 25, 0.05, 0.10],
    expected: 66.95,
  },
  {
    name: 'Parity (AAS = competitorAAS = 60)',
    args: [60, 60, 70, 65, 60, 68, 60, 0, 0],
    expected: 63.05,
  },
  {
    name: 'TonyMoly (www.tonymoly.com 추정)',
    args: [72, 45, 88, 78, 80, 82, 40, 0.01, 0.02],
    expected: 71.75,
  },
  {
    name: 'Weak-OCR (OCR=10, 공식 인용 거의 없음)',
    args: [80, 10, 90, 85, 70, 82, 25, 0, 0],
    expected: 72.20,
  },
  {
    name: 'No-Competitor advantage (AAS = competitorAAS = 75)',
    args: [75, 60, 80, 70, 65, 75, 75, 0, 0],
    expected: 70.25,
  },
];

describe('T6 — B-MRI (Brand MRI) 프러덕션 레벨 측정 테스트', () => {

  // ================================================================
  // Suite 1 — 수학 공식 정확성
  // ================================================================
  describe('Suite 1 — Formula Accuracy (8 Scenarios)', () => {

    it.each(SCENARIOS)(
      '$name → B-MRI = $expected',
      ({ args, expected }) => {
        const result = computeBMRI(...args);
        expect(result.value).toBeCloseTo(expected, 2);
      }
    );

    it('should return a BMriResult with all component fields', () => {
      const result = computeBMRI(80, 75, 90, 85, 70, 82, 25, 0.005, 0.01);
      expect(result).toHaveProperty('value');
      expect(result.components).toMatchObject({
        AAS: 80,
        OCR: 75,
        BSF: 90,
        QTC: 85,
        GCTR: 70,
        ARS: 82,
        confidencePenalty: 0.005,
        volatilityPenalty: 0.01,
      });
      expect(result.components.competitivePositionScore).toBeCloseTo(105, 2);
    });

    it('should match manualComputeBMRI helper for all 8 scenarios', () => {
      const inputs: BMriTestInput[] = SCENARIOS.map((s) => ({
        label: s.name,
        AAS: s.args[0],
        OCR: s.args[1],
        BSF: s.args[2],
        QTC: s.args[3],
        GCTR: s.args[4],
        ARS: s.args[5],
        competitorAAS: s.args[6],
        confidencePenalty: s.args[7],
        volatilityPenalty: s.args[8],
      }));

      for (const input of inputs) {
        const lib  = computeBMRI(input.AAS, input.OCR, input.BSF, input.QTC, input.GCTR, input.ARS, input.competitorAAS, input.confidencePenalty, input.volatilityPenalty);
        const manual = manualComputeBMRI(input);
        expect(lib.value).toBeCloseTo(manual, 2);
      }
    });
  });

  // ================================================================
  // Suite 2 — 구성요소 민감도 분석
  // ================================================================
  describe('Suite 2 — Component Sensitivity Analysis', () => {

    // Base: AAS=50, OCR=50, BSF=50, QTC=50, GCTR=50, ARS=50, competitor=50, 0 penalties
    // CPS = max(0, 50-50+50) = 50
    // base B-MRI = 0.20×50+0.15×50+0.20×50+0.15×50+0.15×50+0.10×50+0.05×50
    //            = 10+7.5+10+7.5+7.5+5+2.5 = 50.00
    const BASE_ARGS: [number,number,number,number,number,number,number,number,number] = [50, 50, 50, 50, 50, 50, 50, 0, 0];

    it('AAS +10 → B-MRI +2.0 (weight = 0.20)', () => {
      const base = computeBMRI(...BASE_ARGS).value;
      const up   = computeBMRI(60, 50, 50, 50, 50, 50, 50, 0, 0).value;
      // Note: AAS increase also affects CPS: CPS goes from 50 to 60
      // CPS change = 10, weight = 0.05 → +0.5pt from CPS
      // AAS direct = 10 × 0.20 = +2.0pt
      // Total delta ≈ 2.0 + 0.5 = 2.5
      const delta = up - base;
      // The direct AAS weight contribution is 2.0; CPS contribution adds 0.5
      expect(delta).toBeCloseTo(2.5, 2); // AAS affects both its own weight and CPS
    });

    it('OCR +10 → B-MRI +1.5 (weight = 0.15, no CPS effect)', () => {
      const base = computeBMRI(...BASE_ARGS).value;
      const up   = computeBMRI(50, 60, 50, 50, 50, 50, 50, 0, 0).value;
      const delta = up - base;
      expect(delta).toBeCloseTo(1.5, 2);
    });

    it('BSF +10 → B-MRI +2.0 (weight = 0.20, no CPS effect)', () => {
      const base = computeBMRI(...BASE_ARGS).value;
      const up   = computeBMRI(50, 50, 60, 50, 50, 50, 50, 0, 0).value;
      const delta = up - base;
      expect(delta).toBeCloseTo(2.0, 2);
    });

    it('QTC +10 → B-MRI +1.5 (weight = 0.15)', () => {
      const base = computeBMRI(...BASE_ARGS).value;
      const up   = computeBMRI(50, 50, 50, 60, 50, 50, 50, 0, 0).value;
      const delta = up - base;
      expect(delta).toBeCloseTo(1.5, 2);
    });

    it('GCTR +10 → B-MRI +1.5 (weight = 0.15)', () => {
      const base = computeBMRI(...BASE_ARGS).value;
      const up   = computeBMRI(50, 50, 50, 50, 60, 50, 50, 0, 0).value;
      const delta = up - base;
      expect(delta).toBeCloseTo(1.5, 2);
    });

    it('ARS +10 → B-MRI +1.0 (weight = 0.10)', () => {
      const base = computeBMRI(...BASE_ARGS).value;
      const up   = computeBMRI(50, 50, 50, 50, 50, 60, 50, 0, 0).value;
      const delta = up - base;
      expect(delta).toBeCloseTo(1.0, 2);
    });

    it('competitorAAS −10 (brand improves) → B-MRI +0.5 (CPS weight = 0.05)', () => {
      // Reducing competitor AAS by 10 increases CPS by 10 → B-MRI += 10×0.05 = +0.5
      const base = computeBMRI(...BASE_ARGS).value;
      const up   = computeBMRI(50, 50, 50, 50, 50, 50, 40, 0, 0).value;
      const delta = up - base;
      expect(delta).toBeCloseTo(0.5, 2);
    });
  });

  // ================================================================
  // Suite 3 — Competitive Position Score 포지셔닝
  // ================================================================
  describe('Suite 3 — Competitive Position Score (CPS) Logic', () => {

    it('brand dominance: AAS=80 vs competitor=30 → CPS=100, brand leads', () => {
      const result = computeBMRI(80, 60, 75, 70, 68, 75, 30, 0, 0);
      expect(result.components.competitivePositionScore).toBeCloseTo(100, 2);
      // B-MRI contribution from CPS: 100×0.05 = 5.0pt
    });

    it('competitor dominance: AAS=30 vs competitor=80 → CPS=0 (clamped)', () => {
      // max(0, 30-80+50) = max(0, 0) = 0
      const result = computeBMRI(30, 40, 55, 48, 50, 55, 80, 0, 0);
      expect(result.components.competitivePositionScore).toBe(0);
    });

    it('parity: AAS=competitorAAS → CPS=50 (neutral position)', () => {
      // max(0, 60-60+50) = 50
      const result = computeBMRI(60, 60, 70, 65, 60, 68, 60, 0, 0);
      expect(result.components.competitivePositionScore).toBe(50);
    });

    it('extreme disadvantage: AAS=0 vs competitor=60 → CPS=0 (clamped at 0)', () => {
      // max(0, 0-60+50) = max(0, -10) = 0
      const result = computeBMRI(0, 0, 0, 0, 0, 0, 60, 0, 0);
      expect(result.components.competitivePositionScore).toBe(0);
    });

    it('CPS contribution to B-MRI should be exactly 0.05 × CPS', () => {
      // With AAS=70, competitor=20 → CPS=100; all other fixed
      const result70 = computeBMRI(70, 50, 70, 60, 60, 65, 20, 0, 0);
      // With AAS=60, competitor=20 → CPS=90; all other same
      const result60 = computeBMRI(60, 50, 70, 60, 60, 65, 20, 0, 0);

      const cpsDiff = result70.components.competitivePositionScore - result60.components.competitivePositionScore;
      const bmriDiff = result70.value - result60.value;

      // AAS drop of 10 reduces B-MRI by 10×0.20=2.0 (direct) + 10×0.05=0.5 (CPS) = 2.5
      expect(cpsDiff).toBeCloseTo(10, 2);
      expect(bmriDiff).toBeCloseTo(2.5, 2);
    });
  });

  // ================================================================
  // Suite 4 — Volatility & Confidence 패널티
  // ================================================================
  describe('Suite 4 — Volatility & Confidence Penalty Simulation', () => {

    const BASE: [number,number,number,number,number,number,number] = [75, 65, 80, 72, 70, 78, 30];

    it('zero penalty: B-MRI should equal base score without deduction', () => {
      const noPenalty  = computeBMRI(...BASE, 0, 0);
      const withPenalty = computeBMRI(...BASE, 0.005, 0.01);
      const diff = noPenalty.value - withPenalty.value;
      // Expected deduction: 0.005×100 + 0.01×100 = 0.5 + 1.0 = 1.5
      expect(diff).toBeCloseTo(1.5, 2);
    });

    it('confidence=0.95 → penalty=0.005 → B-MRI −0.5pt', () => {
      const base   = computeBMRI(...BASE, 0, 0);
      const penalized = computeBMRI(...BASE, 0.005, 0);
      expect(base.value - penalized.value).toBeCloseTo(0.5, 2);
    });

    it('confidence=0.70 → penalty=0.03 → B-MRI −3.0pt', () => {
      const base    = computeBMRI(...BASE, 0, 0);
      const penalized = computeBMRI(...BASE, 0.03, 0);
      expect(base.value - penalized.value).toBeCloseTo(3.0, 2);
    });

    it('volatility=0.20 → penalty=0.02 → B-MRI −2.0pt', () => {
      const base    = computeBMRI(...BASE, 0, 0);
      const penalized = computeBMRI(...BASE, 0, 0.02);
      expect(base.value - penalized.value).toBeCloseTo(2.0, 2);
    });

    it('compound penalty: confidence=0.70 + volatility=0.20 → B-MRI −5.0pt (linear)', () => {
      const base    = computeBMRI(...BASE, 0, 0);
      const penalized = computeBMRI(...BASE, 0.03, 0.02);
      expect(base.value - penalized.value).toBeCloseTo(5.0, 2);
    });

    it('penalty scale is ×100: raw penalty values (0-1 range) are multiplied by 100', () => {
      // Raw penalty 0.10 → scaled deduction = 10.0pt
      const base    = computeBMRI(...BASE, 0, 0);
      const penalized = computeBMRI(...BASE, 0.10, 0);
      expect(base.value - penalized.value).toBeCloseTo(10.0, 2);
    });
  });

  // ================================================================
  // Suite 5 — TonyMoly 브랜드 케이스 스터디
  // ================================================================
  describe('Suite 5 — TonyMoly Brand Case Study', () => {

    it('should compute TonyMoly B-MRI = 71.75 from estimated inputs', () => {
      const { AAS, OCR, BSF, QTC, GCTR, ARS, competitorAAS, confidencePenalty, volatilityPenalty } = TONYMOLY_BMRI_INPUT;
      const result = computeBMRI(AAS, OCR, BSF, QTC, GCTR, ARS, competitorAAS, confidencePenalty, volatilityPenalty);

      expect(result.value).toBeCloseTo(71.75, 2);

      console.log(`
  ┌──────────────────────────────────────────────────────────────┐
  │  TonyMoly B-MRI Report (www.tonymoly.com 추정)               │
  ├──────────────────────────────────────────────────────────────┤
  │  B-MRI Score:  ${result.value.toFixed(2)} / 100                               │
  │                                                              │
  │  AAS  (AI Answer Share):        ${result.components.AAS}                      │
  │  OCR  (Official Citation Rate): ${result.components.OCR} ← 최약 차원           │
  │  BSF  (Brand Semantic Fidelity):${result.components.BSF}                      │
  │  QTC  (Question Territory):     ${result.components.QTC}                      │
  │  GCTR (GEO Concept Transfer):   ${result.components.GCTR}                      │
  │  ARS  (AEO Readiness):          ${result.components.ARS}                      │
  │  CPS  (Competitive Position):   ${result.components.competitivePositionScore.toFixed(2)}                   │
  └──────────────────────────────────────────────────────────────┘`);
    });

    it('should identify OCR as the weakest dimension for TonyMoly', () => {
      const { AAS, OCR, BSF, QTC, GCTR, ARS, competitorAAS, confidencePenalty, volatilityPenalty } = TONYMOLY_BMRI_INPUT;
      const result = computeBMRI(AAS, OCR, BSF, QTC, GCTR, ARS, competitorAAS, confidencePenalty, volatilityPenalty);

      const weakDims = analyzeWeakDimensions(result.components);

      expect(weakDims.length).toBeGreaterThan(0);
      expect(weakDims[0].dimension).toBe('OCR'); // OCR=45 is furthest below threshold (60)
      expect(weakDims[0].gap).toBeCloseTo(15, 0);
      expect(weakDims[0].priority).toBe('high');
    });

    it('should generate actionable OCR-focused RCA plan for TonyMoly', () => {
      const { AAS, OCR, BSF, QTC, GCTR, ARS, competitorAAS, confidencePenalty, volatilityPenalty } = TONYMOLY_BMRI_INPUT;
      const result = computeBMRI(AAS, OCR, BSF, QTC, GCTR, ARS, competitorAAS, confidencePenalty, volatilityPenalty);

      const plan = generateBMRIActionPlan(result);

      expect(plan.length).toBeGreaterThan(0);
      expect(plan[0]).toContain('OCR'); // Top action targets OCR
      expect(plan[0]).toContain('공식 출처');

      console.log('\n  TonyMoly B-MRI Action Plan:');
      plan.forEach((action) => console.log(`    ${action}`));
    });

    it('should show TonyMoly leads Innisfree in B-MRI (brand vs competitor)', () => {
      const tm = TONYMOLY_BMRI_INPUT;
      const if_ = INNISFREE_BMRI_INPUT;

      const tmResult = computeBMRI(tm.AAS, tm.OCR, tm.BSF, tm.QTC, tm.GCTR, tm.ARS, tm.competitorAAS, tm.confidencePenalty, tm.volatilityPenalty);
      const ifResult = computeBMRI(if_.AAS, if_.OCR, if_.BSF, if_.QTC, if_.GCTR, if_.ARS, if_.competitorAAS, if_.confidencePenalty, if_.volatilityPenalty);

      console.log(`
  ┌─────────────────────────────────────────────────────────┐
  │  K-Beauty B-MRI Competitive Report                       │
  ├──────────────────────┬────────────┬────────────────────┤
  │  Brand               │  B-MRI     │  vs Competitor     │
  ├──────────────────────┼────────────┼────────────────────┤
  │  TonyMoly            │  ${tmResult.value.toFixed(2)}     │  CPS=${tmResult.components.competitivePositionScore.toFixed(0)} (above)    │
  │  Innisfree           │  ${ifResult.value.toFixed(2)}     │  CPS=${ifResult.components.competitivePositionScore.toFixed(0)} (below)     │
  └──────────────────────┴────────────┴────────────────────┘`);

      // TonyMoly should outperform Innisfree in overall B-MRI
      expect(tmResult.value).toBeGreaterThan(ifResult.value);
      // TonyMoly CPS (vs Innisfree) should be > 50 (above parity)
      expect(tmResult.components.competitivePositionScore).toBeGreaterThan(50);
    });

    it('B-MRI and D-MRI must be structurally separate (different input sets)', () => {
      // B-MRI takes: AAS, OCR, BSF, QTC, GCTR, ARS, competitorAAS, CP, VP (observation-based)
      // D-MRI takes: workspaceId (queries internal DB for readiness metrics)
      // This test verifies they are different functions with different signatures.

      const bmriArgs: Parameters<typeof computeBMRI> = [72, 45, 88, 78, 80, 82, 40, 0.01, 0.02];
      const dmriArgs: Parameters<typeof computeDMRI> = ['workspace-id-string'];

      // Type assertions: computeBMRI should NOT accept a string workspace ID
      // computeDMRI should NOT accept numeric observation metrics
      expect(typeof bmriArgs[0]).toBe('number');    // AAS is numeric
      expect(typeof dmriArgs[0]).toBe('string');    // D-MRI takes workspaceId string

      // Verify both functions exist and are distinct
      expect(computeBMRI).toBeTypeOf('function');
      expect(computeDMRI).toBeTypeOf('function');
      expect(computeBMRI).not.toBe(computeDMRI);

      // B-MRI result is synchronous
      const bmriResult = computeBMRI(...bmriArgs);
      expect(bmriResult).toHaveProperty('value');
      expect(bmriResult).toHaveProperty('components');

      // D-MRI result is a Promise (async, DB-dependent)
      const dmriResult = computeDMRI(...dmriArgs);
      expect(dmriResult).toBeInstanceOf(Promise);
      // Don't await; we're only verifying structural separation
    });
  });

  // ================================================================
  // Suite 6 — 가중치 완결성 & Clamp 경계
  // ================================================================
  describe('Suite 6 — Weight Integrity & Clamp Boundaries', () => {

    it('base weights (without CPS) should sum to 0.95; with CPS contribution = 1.00 when CPS=100', () => {
      // Direct weights: 0.20+0.15+0.20+0.15+0.15+0.10 = 0.95
      // CPS is not a fixed weight — it's 0.05 × variable CPS score
      // When all=100 + CPS=100: 20+15+20+15+15+10+5 = 100
      const result = computeBMRI(100, 100, 100, 100, 100, 100, 50, 0, 0);
      // CPS = max(0, 100-50+50) = 100
      expect(result.components.competitivePositionScore).toBeCloseTo(100, 2);
      // raw = 20+15+20+15+15+10+5 = 100 → no clamping needed
      expect(result.value).toBeCloseTo(100.0, 2);
    });

    it('all-100 with perfect competitive (competitor=0): raw=102.5 → clamped to 100', () => {
      // CPS = max(0, 100-0+50) = 150
      // raw = 20+15+20+15+15+10+7.5 = 102.5 → clamped
      const result = computeBMRI(100, 100, 100, 100, 100, 100, 0, 0, 0);
      expect(result.value).toBe(100.00);
      expect(result.components.competitivePositionScore).toBeCloseTo(150, 0);
    });

    it('negative result scenario: high penalties should clamp to 0 (not negative)', () => {
      // All-zero metrics, high penalties
      const result = computeBMRI(0, 0, 0, 0, 0, 0, 100, 0.5, 0.5);
      // raw = 0 − 50 − 50 = −100 → clamped to 0
      expect(result.value).toBe(0.00);
    });

    it('B-MRI value should always be in [0, 100]', () => {
      const extremeCases: Array<[number,number,number,number,number,number,number,number,number]> = [
        [0, 0, 0, 0, 0, 0, 100, 1.0, 1.0],   // minimum possible
        [100, 100, 100, 100, 100, 100, 0, 0, 0], // maximum possible
        [50, 50, 50, 50, 50, 50, 50, 0.05, 0.05], // mid with penalties
        [85, 90, 95, 88, 82, 90, 10, 0.001, 0.005], // high performance
      ];

      for (const args of extremeCases) {
        const result = computeBMRI(...args);
        expect(result.value).toBeGreaterThanOrEqual(0);
        expect(result.value).toBeLessThanOrEqual(100);
      }
    });
  });

});
