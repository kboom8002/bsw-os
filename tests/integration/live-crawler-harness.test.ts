import { describe, it, expect, vi, beforeEach } from 'vitest';
import { startLiveObservationRun, upsertObservationEngineConfig } from '../../app/actions/observatory';
import { getSupabaseAdminClient } from '../../lib/supabase';
import { checkWorkspacePermission } from '../../lib/auth';

// Mock Supabase admin client and auth permission helper
vi.mock('../../lib/supabase', () => ({
  getSupabaseAdminClient: vi.fn(),
}));

vi.mock('../../lib/auth', () => ({
  checkWorkspacePermission: vi.fn(),
}));

const createMockQueryBuilder = (data: any = null, error: any = null, count: number = 0) => {
  const qb: any = {
    eq: vi.fn().mockImplementation(() => qb),
    select: vi.fn().mockImplementation(() => qb),
    update: vi.fn().mockImplementation(() => qb),
    insert: vi.fn().mockImplementation(() => qb),
    single: vi.fn().mockResolvedValue({ data, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
    then: (resolve: any) => resolve({ data, count, error })
  };
  return qb;
};

describe('Live Crawler and EvalHarness Integration Suite (Stream 2)', () => {
  const mockWorkspaceId = '11111111-1111-4111-a111-111111111111';
  const mockRunId = '22222222-2222-4222-b222-222222222222';
  const mockPanelId = '33333333-3333-4333-c333-333333333333';
  const mockQuestionId = '44444444-4444-4444-d444-444444444444';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully execute the full startLiveObservationRun pipeline', async () => {
    vi.mocked(checkWorkspacePermission).mockResolvedValue(true); // Authorized

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'ai_observation_runs') {
        return createMockQueryBuilder({
          probe_panel_id: mockPanelId,
          run_name: 'Live Observation Demo Run'
        });
      }
      if (table === 'probe_questions') {
        return createMockQueryBuilder([
          { id: mockQuestionId, question_text: 'Is Ceramide active?', target_keyword: 'Ceramide', intent_context: 'Clinical Skincare' }
        ]);
      }
      if (table === 'expected_layers') {
        return createMockQueryBuilder({
          must_include: ['Ceramide NP'],
          should_include: ['Safe formulation'],
          must_not_do: ['Do not exaggerate benefits']
        });
      }
      if (table === 'probe_runs') {
        return createMockQueryBuilder({ id: 'pr-1' });
      }
      if (table === 'response_judgments') {
        return createMockQueryBuilder({ id: 'judg-1' });
      }
      return createMockQueryBuilder(null);
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const result = await startLiveObservationRun(mockWorkspaceId, mockRunId, 'chatgpt_search');

    expect(result.success).toBe(true);
    expect(result.runId).toBe(mockRunId);
    expect(result.engineName).toBe('chatgpt_search');
    expect(result.runResultsCount).toBe(1);
  });

  it('should successfully upsert an engine configuration', async () => {
    vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

    const mockFrom = vi.fn().mockImplementation(() => {
      return createMockQueryBuilder(null); // Cache miss to force insert
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const configPayload = {
      engine_name: 'chatgpt_search',
      provider_type: 'chatgpt',
      rate_limit_rpm: 15,
      is_active: true
    };

    const result = await upsertObservationEngineConfig(mockWorkspaceId, configPayload);
    expect(result).toBeDefined();
  });
});
