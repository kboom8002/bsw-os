import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addExpectedLayer, getExpectedLayerByQuestion } from '../../app/actions/observatory';
import { judgeProbeRunWithLLM } from '../../lib/observatory/judgment/judge-response';
import { getSupabaseAdminClient } from '../../lib/supabase';
import { checkWorkspacePermission } from '../../lib/auth';

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
    then: vi.fn().mockImplementation((onFulfilled) => {
      return Promise.resolve(onFulfilled({ data, error }));
    }),
  };
  return qb;
};

describe('AEO/GEO Expected Layer & LLM Judge Test Suite', () => {
  const workspaceId = '00000000-0000-4000-a000-000000000001';
  const questionId = '33333333-3333-4333-a333-333333333333';
  const probeRunId = '55555555-5555-4555-e555-555555555555';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkWorkspacePermission).mockResolvedValue(true);
  });

  it('should successfully add and retrieve expected layers', async () => {
    const payload = {
      probe_question_id: questionId,
      must_include: ['pristine squalane hydration'],
      should_include: ['dermatology test'],
      must_not_do: ['exaggerated claims'],
      expected_layer_version: 1,
    };

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'probe_questions') {
        return createMockQueryBuilder({ probe_panel_id: 'panel-111' });
      }
      if (table === 'probe_panels') {
        return createMockQueryBuilder({ is_locked: false, version: 1, panel_name: 'Panel A' });
      }
      if (table === 'expected_layers') {
        // Mock no existing record for insert path
        return createMockQueryBuilder(payload);
      }
      return createMockQueryBuilder();
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const result = await addExpectedLayer(workspaceId, payload);
    expect(result).toBeDefined();
    expect(result.must_include).toContain('pristine squalane hydration');

    const retrieved = await getExpectedLayerByQuestion(workspaceId, questionId);
    expect(retrieved).toBeDefined();
  });

  it('should judge probe run and return Zod-validated structured judgment output', async () => {
    const mockProbeRun = {
      id: probeRunId,
      raw_response_text: 'The pristine squalane hydration serum is highly validated.',
      probe_question_id: questionId,
      probe_questions: {
        id: questionId,
        question_text: 'Is retinol hydration verified?',
        target_keyword: 'retinol',
      },
    };

    const mockExpectedLayer = {
      probe_question_id: questionId,
      must_include: ['pristine squalane hydration'],
      should_include: ['dermatology test'],
      must_not_do: ['exaggerated claims'],
    };

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'probe_runs') {
        return createMockQueryBuilder(mockProbeRun);
      }
      if (table === 'expected_layers') {
        return createMockQueryBuilder(mockExpectedLayer);
      }
      if (table === 'response_judgments') {
        return createMockQueryBuilder(null); // No existing judgment
      }
      return createMockQueryBuilder();
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const judgment = await judgeProbeRunWithLLM(workspaceId, probeRunId, 'mock');
    expect(judgment).toBeDefined();
    expect(judgment.confidence).toBeGreaterThanOrEqual(0);
    expect(judgment.centeredness_score).toBeDefined();
    expect(judgment.reasoning_summary).toContain('Mock AI judge evaluated response');
  });
});
