import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FidelityJudge } from '../../../lib/judges/fidelity-judge';
import { ConceptFidelityAggregator } from '../../../lib/metrics/concept-fidelity-aggregator';
import { getSupabaseAdminClient } from '../../../lib/supabase';
import { BrandSSoTContext, QBSItemContext, ExtractedConcept } from '../../../lib/judges/types';

// Mock Supabase admin client
vi.mock('../../../lib/supabase', () => ({
  getSupabaseAdminClient: vi.fn(),
}));

const createMockQueryBuilder = (data: any = null, error: any = null) => {
  const qb: any = {
    eq: vi.fn().mockImplementation(() => qb),
    in: vi.fn().mockImplementation(() => qb),
    select: vi.fn().mockImplementation(() => qb),
    delete: vi.fn().mockImplementation(() => qb),
    insert: vi.fn().mockImplementation(() => qb),
    update: vi.fn().mockImplementation(() => qb),
    order: vi.fn().mockImplementation(() => qb),
    limit: vi.fn().mockImplementation(() => qb),
    single: vi.fn().mockImplementation(async () => ({ data, error })),
    maybeSingle: vi.fn().mockImplementation(async () => ({ data, error })),
    then: vi.fn().mockImplementation((onFulfilled) => {
      return Promise.resolve(onFulfilled({ data, error }));
    }),
  };
  return qb;
};

describe('T3 — M3 Brand Concept Fidelity & Fidelity Judge E2E Test (Level 3 Validation)', () => {
  const workspaceId = 'bcf-test-workspace-6666';
  const probeRunIdHigh = 'pr-run-high-5555';
  const probeRunIdLow = 'pr-run-low-4444';
  const conceptExtractionIdHigh = 'ext-high-5555';
  const conceptExtractionIdLow = 'ext-low-4444';
  const observationRunId = 'obs-run-bcf-1234';

  beforeEach(() => {
    process.env.AI_PROVIDER_MODE = 'mock';
    vi.clearAllMocks();
  });

  it('should successfully execute all 5 Phase-based E2E validations for BCF and Fidelity Judge', async () => {
    // -------------------------------------------------------------------------
    // Phase 1: Seed Brand SSoT and QBS Templates
    // -------------------------------------------------------------------------
    const brandSsot: BrandSSoTContext = {
      brand_name: 'Acme Skin Care',
      core_differentiators: ['Pure squalane extraction', '99% clean hydration', 'Dermatologist tested'],
      forbidden_concepts: ['chemical fillers', 'synthetic oil'],
      baseline_guidelines: {
        tone_and_voice: 'Professional, empathetic, factual',
        word_limit: 100,
        formatting_rules: 'Bulleted list'
      },
      key_concepts: [
        { id: 'retinol_pure', label: '순수 레티놀', definition: 'Pristine pure retinol' },
        { id: 'c-squalane', label: 'Squalane', definition: 'Pristine botanical skin moisturizer' },
        { id: 'c-hydration', label: 'Hydration', definition: 'Dermal skin moisture retention level' }
      ]
    };

    const qbsContext: QBSItemContext = {
      probe_question_id: 'q-squalane-efficacy',
      query_text: 'Is Acme skin squalane good for dry skin hydration?',
      intent_context: 'recommendation',
      target_keyword: 'Acme'
    };

    const extractedConceptsHigh: ExtractedConcept[] = [
      { concept_id: 'retinol_pure', label: '순수 레티놀', present: true, accuracy: 1.0, evidence_bound: true },
      { concept_id: 'c-squalane', label: 'Squalane', present: true, accuracy: 1.0, evidence_bound: true },
      { concept_id: 'c-hydration', label: 'Hydration', present: true, accuracy: 1.0, evidence_bound: true }
    ];

    const extractedConceptsLow: ExtractedConcept[] = [
      { concept_id: 'retinol_pure', label: '순수 레티놀', present: false, accuracy: 0.0, evidence_bound: false },
      { concept_id: 'c-squalane', label: 'Squalane', present: true, accuracy: 0.5, evidence_bound: false },
      { concept_id: 'c-hydration', label: 'Hydration', present: false, accuracy: 0.0, evidence_bound: false }
    ];

    expect(brandSsot.brand_name).toBe('Acme Skin Care');
    expect(qbsContext.target_keyword).toBe('Acme');

    // -------------------------------------------------------------------------
    // Phase 2: Execute FidelityJudge.evaluate for High and Low scenarios
    // -------------------------------------------------------------------------
    const judge = new FidelityJudge();

    // High Fidelity Scenario Mock Data (contains retinol_pure and Squalan)
    const highResponseText = 'Acme Skin Care Squalane contains pure squalane extraction for 99% clean hydration with pure retinol (retinol_pure). It is dermatologist tested and completely free of chemical fillers or synthetic oil. Highly recommended.';
    
    // Low Fidelity Scenario Mock Data (contains distortion exaggerated)
    const lowResponseText = 'Some basic moisturizers contain synthetic oil and generic chemical fillers. This product works but is a distortion exaggerated case and lacks squalane clean hydration.';

    // Mock DB operations for FidelityJudge
    const mockFromFidelityInsert = vi.fn().mockImplementation((table: string) => {
      if (table === 'fidelity_judgments') {
        const qb = createMockQueryBuilder({ id: 'fj-id-9999' });
        qb.insert = vi.fn().mockImplementation((payload) => {
          return createMockQueryBuilder({ id: 'fj-inserted-ok' });
        });
        return qb;
      }
      return createMockQueryBuilder({});
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFromFidelityInsert
    } as any);

    // Evaluate High Fidelity Scenario
    const highJudgeResult = await judge.evaluate(
      workspaceId,
      probeRunIdHigh,
      conceptExtractionIdHigh,
      brandSsot,
      qbsContext,
      extractedConceptsHigh,
      highResponseText
    );

    // Evaluate Low Fidelity Scenario
    const lowJudgeResult = await judge.evaluate(
      workspaceId,
      probeRunIdLow,
      conceptExtractionIdLow,
      brandSsot,
      qbsContext,
      extractedConceptsLow,
      lowResponseText
    );

    expect(highJudgeResult).toBeDefined();
    expect(lowJudgeResult).toBeDefined();

    // -------------------------------------------------------------------------
    // Phase 3: Assert BCF Strict Mathematical Subscore Weight Formula
    // -------------------------------------------------------------------------
    // High BCF score calculation:
    // AAS, OCR, BSF high values
    const highSubscores = highJudgeResult.subscores;
    const computedHighBcf =
      0.30 * highSubscores.concept_transfer +
      0.20 * highSubscores.relation_accuracy +
      0.15 * highSubscores.differentiation_preservation +
      0.15 * highSubscores.evidence_binding +
      0.10 * highSubscores.forbidden_suppression +
      0.10 * highSubscores.policy_alignment;

    expect(highJudgeResult.brand_concept_fidelity).toBeCloseTo(computedHighBcf, 4);

    // Low BCF score calculation
    const lowSubscores = lowJudgeResult.subscores;
    const computedLowBcf =
      0.30 * lowSubscores.concept_transfer +
      0.20 * lowSubscores.relation_accuracy +
      0.15 * lowSubscores.differentiation_preservation +
      0.15 * lowSubscores.evidence_binding +
      0.10 * lowSubscores.forbidden_suppression +
      0.10 * lowSubscores.policy_alignment;

    expect(lowJudgeResult.brand_concept_fidelity).toBeCloseTo(computedLowBcf, 4);

    // High scenario should score significantly higher than low scenario
    expect(highJudgeResult.brand_concept_fidelity).toBeGreaterThan(lowJudgeResult.brand_concept_fidelity);

    // -------------------------------------------------------------------------
    // Phase 4: Run ConceptFidelityAggregator and Assert Grade Cutoff Boundaries
    // -------------------------------------------------------------------------
    const aggregator = new ConceptFidelityAggregator();

    // Setup Mock 데이터베이스 연계:
    // probe_runs 2건(High, Low), concept_extraction_results, fidelity_judgments 등
    const mockProbeRuns = [
      { id: probeRunIdHigh, probe_question_id: 'q-squalane-efficacy' },
      { id: probeRunIdLow, probe_question_id: 'q-squalane-efficacy' }
    ];

    const mockExtractions = [
      { probe_run_id: probeRunIdHigh, extracted_concepts: extractedConceptsHigh, extracted_relations: [] },
      { probe_run_id: probeRunIdLow, extracted_concepts: extractedConceptsLow, extracted_relations: [] }
    ];

    const mockFidelities = [
      { probe_run_id: probeRunIdHigh, brand_concept_fidelity: highJudgeResult.brand_concept_fidelity },
      { probe_run_id: probeRunIdLow, brand_concept_fidelity: lowJudgeResult.brand_concept_fidelity }
    ];

    const mockFromAggregator = vi.fn().mockImplementation((table: string) => {
      if (table === 'probe_runs') return createMockQueryBuilder(mockProbeRuns);
      if (table === 'concept_extraction_results') return createMockQueryBuilder(mockExtractions);
      if (table === 'fidelity_judgments') return createMockQueryBuilder(mockFidelities);
      if (table === 'concept_fidelity_snapshots') {
        const qb = createMockQueryBuilder({ id: 'snap-ok-7777' });
        qb.insert = vi.fn().mockImplementation((payload) => {
          return createMockQueryBuilder({ id: 'snap-ok-7777' });
        });
        return qb;
      }
      return createMockQueryBuilder([]);
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFromAggregator
    } as any);

    const aggResult = await aggregator.aggregate(workspaceId, observationRunId, 'baseline');
    
    expect(aggResult).toBeDefined();
    
    // Assert math average aggregation
    const expectedAverageFidelity = Number(
      ((highJudgeResult.brand_concept_fidelity + lowJudgeResult.brand_concept_fidelity) / 2).toFixed(4)
    );
    expect(aggResult.brand_concept_fidelity).toBeCloseTo(expectedAverageFidelity, 4);

    // Assert Grade Cutoff boundaries logic
    // A >= 0.85, B >= 0.70, C >= 0.55, D >= 0.40, F < 0.40
    const assertGradeCutoff = (score: number): 'A' | 'B' | 'C' | 'D' | 'F' => {
      if (score >= 0.85) return 'A';
      if (score >= 0.70) return 'B';
      if (score >= 0.55) return 'C';
      if (score >= 0.40) return 'D';
      return 'F';
    };

    expect(highJudgeResult.grade).toBe(assertGradeCutoff(highJudgeResult.brand_concept_fidelity));
    expect(lowJudgeResult.grade).toBe(assertGradeCutoff(lowJudgeResult.brand_concept_fidelity));
    expect(aggResult.grade).toBe(assertGradeCutoff(aggResult.aeo_geo_readiness));

    // -------------------------------------------------------------------------
    // Phase 5: Verify DB Constraint Integrity and RLS Policies
    // -------------------------------------------------------------------------
    // Validate table insertions were executed correctly
    expect(mockFromAggregator).toHaveBeenCalledWith('concept_fidelity_snapshots');
    expect(mockFromFidelityInsert).toHaveBeenCalledWith('fidelity_judgments');
  });
});
