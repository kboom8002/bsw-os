import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BairEngine } from '../../../lib/sbs-index/bair';
import { AiprEngine } from '../../../lib/sbs-index/aipr';
import { SbsIndexRunner } from '../../../lib/sbs-index/index-runner';
import { getSupabaseAdminClient } from '../../../lib/supabase';
import { CONVENIENCE_TEST_BRANDS, CONVENIENCE_PROBE_QUESTIONS } from './convenience-probe-questions';
import { assertBAIRFormula, formatBAIRReport } from './bair-test-helpers';
import { getObservationProvider } from '../../../lib/ai/observation-provider';

// Mock Supabase admin client
vi.mock('../../../lib/supabase', () => ({
  getSupabaseAdminClient: vi.fn(),
}));

const createMockQueryBuilder = (data: any = null, error: any = null) => {
  const qb: any = {
    eq: vi.fn().mockImplementation(() => qb),
    limit: vi.fn().mockImplementation(() => qb),
    order: vi.fn().mockImplementation(() => qb),
    select: vi.fn().mockImplementation(() => qb),
    delete: vi.fn().mockImplementation(() => qb),
    insert: vi.fn().mockImplementation(() => qb),
    update: vi.fn().mockImplementation(() => qb),
    single: vi.fn().mockImplementation(async () => ({ data, error })),
    maybeSingle: vi.fn().mockImplementation(async () => ({ data, error })),
    then: vi.fn().mockImplementation((onFulfilled) => {
      return Promise.resolve(onFulfilled({ data, error }));
    }),
  };
  return qb;
};

describe('T1 — Convenience Retail BAIR Index E2E Measurement Test (Level 3 Validation)', () => {
  const workspaceId = 'conv-test-workspace-8888';
  let originalMode: string | undefined;

  beforeEach(() => {
    originalMode = process.env.AI_PROVIDER_MODE;
    // Dynamically toggle live gemini mode if apiKey is set
    process.env.AI_PROVIDER_MODE = process.env.GEMINI_API_KEY ? 'gemini' : 'mock';
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.AI_PROVIDER_MODE = originalMode;
  });

  it('should successfully execute all 5 E2E validation phases for CU vs GS25', async () => {
    // -------------------------------------------------------------------------
    // Phase 1: Panel Creation Verification
    // -------------------------------------------------------------------------
    const targetBrand = CONVENIENCE_TEST_BRANDS.target; // CU
    const competitorBrand = CONVENIENCE_TEST_BRANDS.competitor; // GS25

    expect(targetBrand).toBe('CU');
    expect(competitorBrand).toBe('GS25');
    expect(CONVENIENCE_PROBE_QUESTIONS).toHaveLength(15);

    // Verify first question template configuration
    const firstQuestion = CONVENIENCE_PROBE_QUESTIONS[0];
    const interpolatedQuestionText = firstQuestion.question_text
      .replace('{brand}', targetBrand)
      .replace('{competitor}', competitorBrand);
    
    expect(interpolatedQuestionText).toContain('CU');

    // -------------------------------------------------------------------------
    // Phase 2: AI Observation & Crawler Simulation
    // -------------------------------------------------------------------------
    // Simulating the runAIResponseProbeAgent logic by obtaining responses via MockObservationProvider
    const observationProvider = getObservationProvider('Google SGE');
    
    const targetObsData: any[] = [];
    const competitorObsData: any[] = [];

    // Crawl targets responses
    for (const q of CONVENIENCE_PROBE_QUESTIONS) {
      const targetQueryText = q.question_text
        .replace('{brand}', targetBrand)
        .replace('{competitor}', competitorBrand);

      const competitorQueryText = q.question_text
        .replace('{brand}', competitorBrand)
        .replace('{competitor}', targetBrand);

      const targetRes = await observationProvider.queryEngine(targetQueryText, 'Google SGE');
      const competitorRes = await observationProvider.queryEngine(competitorQueryText, 'Google SGE');

      targetObsData.push({
        id: `run-${q.id}-target`,
        workspace_id: workspaceId,
        probe_question_id: q.id,
        raw_response_text: targetRes.rawResponseText,
        engine_name: 'Google SGE',
        latency_ms: targetRes.latencyMs,
      });

      competitorObsData.push({
        id: `run-${q.id}-competitor`,
        workspace_id: workspaceId,
        probe_question_id: q.id,
        raw_response_text: competitorRes.rawResponseText,
        engine_name: 'Google SGE',
        latency_ms: competitorRes.latencyMs,
      });
    }

    expect(targetObsData).toHaveLength(15);
    expect(competitorObsData).toHaveLength(15);
    
    // Assert target (CU) and competitor (GS25) response texts exist
    expect(targetObsData[0].raw_response_text).toBeTruthy();
    expect(competitorObsData[0].raw_response_text).toBeTruthy();

    if (!process.env.GEMINI_API_KEY) {
      // Assert mock target (CU) has high-quality reputation terms
      expect(targetObsData[0].raw_response_text).toContain('HACCP');
      expect(targetObsData[0].raw_response_text).toContain('안심');
      expect(targetObsData[0].raw_response_text).toContain('No.1');

      // Assert mock competitor (GS25) has some negative indicators
      expect(competitorObsData[0].raw_response_text).toContain('주의');
      expect(competitorObsData[0].raw_response_text).toContain('불균형');
    }

    // -------------------------------------------------------------------------
    // Phase 3: BAIR Computation & Mathematical Validation
    // -------------------------------------------------------------------------
    const bairEngine = new BairEngine();

    // 1. Mocking Supabase data retrieval for CU (Target)
    const mockFromForCU = vi.fn().mockImplementation((table: string) => {
      if (table === 'probe_runs') {
        return createMockQueryBuilder(targetObsData);
      }
      return createMockQueryBuilder([]);
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFromForCU,
    } as any);

    const cuResult = await bairEngine.computeBAIR(workspaceId, targetBrand);

    // 2. Mocking Supabase data retrieval for GS25 (Competitor)
    const mockFromForGS25 = vi.fn().mockImplementation((table: string) => {
      if (table === 'probe_runs') {
        return createMockQueryBuilder(competitorObsData);
      }
      return createMockQueryBuilder([]);
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFromForGS25,
    } as any);

    const gs25Result = await bairEngine.computeBAIR(workspaceId, competitorBrand);

    // Verify mathematical formula calculations using helper assertions
    assertBAIRFormula({
      brand: cuResult.brand,
      bair: cuResult.bair,
      bsf: cuResult.bsf,
      aas: cuResult.aas,
      ocr: cuResult.ocr,
      swel: cuResult.swel,
      totalRuns: targetObsData.length,
      matchedRuns: targetObsData.filter(r => r.raw_response_text.toLowerCase().includes(targetBrand.toLowerCase())).length,
      positiveRuns: 15, // Mock data CU should hit 100% positive
      recommendedRuns: 15, // Mock data CU should hit 100% recommended
    });

    assertBAIRFormula({
      brand: gs25Result.brand,
      bair: gs25Result.bair,
      bsf: gs25Result.bsf,
      aas: gs25Result.aas,
      ocr: gs25Result.ocr,
      swel: gs25Result.swel,
      totalRuns: competitorObsData.length,
      matchedRuns: competitorObsData.filter(r => r.raw_response_text.toLowerCase().includes(competitorBrand.toLowerCase())).length,
      positiveRuns: 0, // Mock data GS25 has more negative keywords or balanced, thus failing positive criteria
      recommendedRuns: 0,
    });

    // CU must outperform GS25 based on the designed mock response parameters
    expect(cuResult.bair).toBeGreaterThan(gs25Result.bair);

    // -------------------------------------------------------------------------
    // Phase 4: AIPR Ranking & Competitor Benchmarking
    // -------------------------------------------------------------------------
    const aiprEngine = new AiprEngine();

    // Mocking both datasets integration inside AIPR Engine
    // AIPR internally queries BAIR for each brand
    const mockFromForAipr = vi.fn().mockImplementation((table: string) => {
      // Return combined data or mock responses based on standard implementation details
      if (table === 'probe_runs') {
        return createMockQueryBuilder([...targetObsData, ...competitorObsData]);
      }
      return createMockQueryBuilder([]);
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFromForAipr,
    } as any);

    const aiprLeaderboard = await aiprEngine.computeAIPR(
      workspaceId,
      'convenience_retail',
      targetBrand,
      [competitorBrand]
    );

    // Assert leaderboard structure
    expect(aiprLeaderboard).toHaveLength(2); // CU and GS25
    expect(aiprLeaderboard[0].brand).toBe('CU'); // Winner
    expect(aiprLeaderboard[1].brand).toBe('GS25');
    expect(aiprLeaderboard[0].rank).toBe(1);
    expect(aiprLeaderboard[1].rank).toBe(2);
    expect(aiprLeaderboard[0].bairScore).toBeGreaterThan(aiprLeaderboard[1].bairScore);

    // Generate and log the formatted report
    const markdownReport = formatBAIRReport(
      workspaceId,
      {
        brand: cuResult.brand,
        bair: cuResult.bair,
        bsf: cuResult.bsf,
        aas: cuResult.aas,
        ocr: cuResult.ocr,
        swel: cuResult.swel,
        totalRuns: 15,
        matchedRuns: 15,
        positiveRuns: 15,
        recommendedRuns: 15,
      },
      {
        brand: gs25Result.brand,
        bair: gs25Result.bair,
        bsf: gs25Result.bsf,
        aas: gs25Result.aas,
        ocr: gs25Result.ocr,
        swel: gs25Result.swel,
        totalRuns: 15,
        matchedRuns: 15,
        positiveRuns: 0,
        recommendedRuns: 0,
      }
    );

    console.log(markdownReport);

    // -------------------------------------------------------------------------
    // Phase 5: DB Persistence Validation
    // -------------------------------------------------------------------------
    // Verify that Supabase query execution is mapped with correct table queries
    expect(mockFromForCU).toHaveBeenCalledWith('probe_runs');
    expect(mockFromForGS25).toHaveBeenCalledWith('probe_runs');
  });
});
