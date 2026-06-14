import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createIndustryStandardPanel } from '../../app/actions/probe-panel-factory';
import { getSupabaseAdminClient } from '../../lib/supabase';
import { checkWorkspacePermission } from '../../lib/auth';
import { INDUSTRY_PANELS_DATA } from '../../db/seed/industry-panels/questions-data';

vi.mock('../../lib/supabase', () => ({
  getSupabaseAdminClient: vi.fn(),
}));

vi.mock('../../lib/auth', () => ({
  checkWorkspacePermission: vi.fn(),
}));

const createMockQueryBuilder = (data: any = null, error: any = null) => {
  const qb: any = {
    eq: vi.fn().mockImplementation(() => qb),
    select: vi.fn().mockImplementation(() => qb),
    insert: vi.fn().mockImplementation(() => qb),
    update: vi.fn().mockImplementation(() => qb),
    maybeSingle: vi.fn().mockImplementation(async () => ({ data, error })),
    single: vi.fn().mockImplementation(async () => ({ data, error })),
    upsert: vi.fn().mockImplementation(async () => ({ data, error })),
    then: vi.fn().mockImplementation((onFulfilled) => {
      return Promise.resolve(onFulfilled({ data, error }));
    }),
  };
  return qb;
};

describe('SBS Joint Index Industry Probe Panels Test Suite (Phase 1A)', () => {
  const workspaceId = '00000000-0000-4000-a000-000000000001';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkWorkspacePermission).mockResolvedValue(true);
  });

  it('should verify that all 26 industries are fully defined in dataset', () => {
    const industries = Object.keys(INDUSTRY_PANELS_DATA);
    expect(industries).toHaveLength(26);
    expect(industries).toContain('beauty');
    expect(industries).toContain('wedding');
    expect(industries).toContain('clinic');
    expect(industries).toContain('restaurant');
    expect(industries).toContain('real_estate');
    expect(industries).toContain('legal');
    expect(industries).toContain('education');
    expect(industries).toContain('travel');
    expect(industries).toContain('pet');
    expect(industries).toContain('auto');
  });

  it('should successfully mock-seed a K-Beauty panel and verify keywords replacement', async () => {
    const insertedRecords: Record<string, any[]> = {
      probe_panels: [],
      probe_questions: [],
      expected_layers: []
    };

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      let mockId = '11111111-1111-4111-a111-111111111111';
      if (table === 'probe_questions') mockId = '22222222-2222-4222-a222-222222222222';
      if (table === 'expected_layers') mockId = '33333333-3333-4333-a333-333333333333';

      return {
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        insert: vi.fn().mockImplementation((payload) => {
          insertedRecords[table].push(payload);
          return createMockQueryBuilder({ id: mockId });
        }),
        upsert: vi.fn().mockImplementation((payload) => {
          insertedRecords[table].push(payload);
          return createMockQueryBuilder({ id: mockId });
        }),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: mockId }, error: null })
      } as any;
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const result = await createIndustryStandardPanel(
      workspaceId,
      'beauty',
      'PureBarrier',
      ['CompetitorX']
    );

    expect(result.questionCount).toBe(20);
    expect(insertedRecords.probe_panels).toHaveLength(1);
    expect(insertedRecords.probe_panels[0].panel_name).toBe('[PureBarrier] SBS-AIPR-Beauty-v1');
    expect(insertedRecords.probe_panels[0].industry).toBe('beauty');
    expect(insertedRecords.probe_panels[0].sbs_index_target).toBe('AIPR');

    // Verify brand and competitor replacements in questions
    const firstQuestion = insertedRecords.probe_questions[0];
    expect(firstQuestion.target_keyword).toBe('PureBarrier');

    // Verify competitor replacement in comparison questions
    const comparisonQ = insertedRecords.probe_questions.find(
      q => q.question_text.includes('vs')
    );
    expect(comparisonQ).toBeDefined();
    expect(comparisonQ.question_text).toContain('PureBarrier');
    expect(comparisonQ.question_text).toContain('CompetitorX');
  });

  it('should verify YMYL high-risk question ratio >= 30% for Clinic and Legal panels', () => {
    // Clinic YMYL check
    const clinicQuestions = INDUSTRY_PANELS_DATA.clinic.questions;
    const clinicHighRiskCount = clinicQuestions.filter(q => q.risk_level === 'high').length;
    const clinicRatio = clinicHighRiskCount / clinicQuestions.length;
    expect(clinicRatio).toBeGreaterThanOrEqual(0.30); // 9 / 15 = 60%

    // Legal YMYL check
    const legalQuestions = INDUSTRY_PANELS_DATA.legal.questions;
    const legalHighRiskCount = legalQuestions.filter(q => q.risk_level === 'high').length;
    const legalRatio = legalHighRiskCount / legalQuestions.length;
    expect(legalRatio).toBeGreaterThanOrEqual(0.30); // 9 / 12 = 75%
  });

  it('should verify that all questions have at least 2 query variants defined', () => {
    for (const [ind, data] of Object.entries(INDUSTRY_PANELS_DATA)) {
      for (const q of data.questions) {
        expect(q.query_variants.length).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('should verify that every question has non-empty 3-tier expected layers (must, should, must_not_do)', () => {
    for (const [ind, data] of Object.entries(INDUSTRY_PANELS_DATA)) {
      for (const q of data.questions) {
        expect(q.must_include.length).toBeGreaterThan(0);
        expect(q.should_include.length).toBeGreaterThan(0);
        expect(q.must_not_do.length).toBeGreaterThan(0);
      }
    }
  });
});
