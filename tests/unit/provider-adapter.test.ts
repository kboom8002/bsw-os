import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { MockProvider } from '../../lib/observatory/providers/mock-provider';
import { OpenAIResponsesProvider } from '../../lib/observatory/providers/openai-responses-provider';
import { GeminiProvider } from '../../lib/observatory/providers/gemini-provider';
import { EvalHarness } from '../../lib/observatory/harness/eval-harness';
import { ManualCalibrationNamespace } from '../../lib/observatory/calibration/manual-calibration';
import { getSupabaseAdminClient } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => ({
  getSupabaseAdminClient: vi.fn(),
}));

const createMockQueryBuilder = (data: any = null, error: any = null) => {
  const qb: any = {
    eq: vi.fn().mockImplementation(() => qb),
    select: vi.fn().mockImplementation(() => qb),
    insert: vi.fn().mockImplementation(() => qb),
    single: vi.fn().mockImplementation(async () => ({ data, error })),
    then: vi.fn().mockImplementation((resolve) => resolve({ data, error }))
  };
  return qb;
};

describe('AEO/GEO Phase 3: Provider Adapters & Calibration Lanes', () => {
  const workspaceId = '00000000-0000-4000-a000-000000000001';
  const questionId = '33333333-3333-4333-a333-333333333333';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should run mock provider execution and structured judging evaluation', async () => {
    const mock = new MockProvider();
    const strictRes = await mock.executeStrictRun(
      'Strict Pack',
      'What is retinol hydration?',
      { runId: 'run-1', workspaceId, probeQuestionId: questionId, lane: 'official', mode: 'cb_strict' }
    );
    expect(strictRes.normalized.status).toBe('SUCCESS');
    expect(strictRes.normalized.answerText).toContain('Retinol');

    const judgeRes = await mock.evaluateRunnerOutput(
      'Rubric',
      '{"must_include": []}',
      'BSW retinol hydration cited http://bsw.com',
      { runId: 'run-1', workspaceId, probeQuestionId: questionId, lane: 'official', mode: 'cb_strict' }
    );
    expect(judgeRes.normalized.centeredness_score).toBe(1.0);
    expect(judgeRes.normalized.official_citation).toBe(true);
  });

  it('should run EvalHarness and route manual calibration lane purely to local artifacts', async () => {
    const mock = new MockProvider();
    const harness = new EvalHarness({ runner: mock, judge: mock });

    const response = await harness.runEvaluation(
      workspaceId,
      questionId,
      'System Prompt',
      'What is squalane concentration?',
      '{"must_include": []}',
      'manual_calibration'
    );

    expect(response.lane).toBe('manual_calibration');
    expect(response.filePath).toBeDefined();
    expect(fs.existsSync(response.filePath)).toBe(true);

    // Cleanup local file
    if (fs.existsSync(response.filePath)) {
      fs.unlinkSync(response.filePath);
    }
  });

  it('should run EvalHarness and write official lane results to Supabase DB', async () => {
    const mock = new MockProvider();
    const harness = new EvalHarness({ runner: mock, judge: mock });

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'probe_runs') {
        return createMockQueryBuilder({ id: 'pr-123' });
      }
      if (table === 'response_judgments') {
        return createMockQueryBuilder({ id: 'judg-456' });
      }
      return createMockQueryBuilder();
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const response = await harness.runEvaluation(
      workspaceId,
      questionId,
      'System Prompt',
      'What is squalane concentration?',
      '{"must_include": []}',
      'official'
    );

    expect(response.lane).toBe('official');
    expect(response.probeRunId).toBe('pr-123');
    expect(response.judgmentId).toBe('judg-456');
    expect(mockFrom).toHaveBeenCalledWith('probe_runs');
    expect(mockFrom).toHaveBeenCalledWith('response_judgments');
  });

  it('should exercise Manual Calibration namespace runner and judge calibration flow', async () => {
    const mock = new MockProvider();
    const calib = new ManualCalibrationNamespace(mock, mock);

    const runnerCalib = await calib.calibrateRunner(
      'System Prompt Pack',
      'Question Text'
    );
    expect(runnerCalib.filePath).toBeDefined();
    expect(fs.existsSync(runnerCalib.filePath)).toBe(true);
    fs.unlinkSync(runnerCalib.filePath);

    const judgeCalib = await calib.calibrateJudge(
      'Judge Rubric',
      'Expected Layer Schema',
      'Sample response text containing BSW and http://bsw.com'
    );
    expect(judgeCalib.filePath).toBeDefined();
    expect(fs.existsSync(judgeCalib.filePath)).toBe(true);
    fs.unlinkSync(judgeCalib.filePath);
  });
});
