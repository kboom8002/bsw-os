import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runReportDraftingAgent, runReportInsightAgent } from '../../lib/ai/reports_agents';
import { getSupabaseAdminClient } from '../../lib/supabase';
import { addReportSection, generateReportDraft } from '../../app/actions/reports';

vi.mock('../../lib/supabase', () => ({
  getSupabaseAdminClient: vi.fn(),
}));

vi.mock('../../app/actions/reports', () => ({
  generateReportDraft: vi.fn(),
  addReportSection: vi.fn(),
}));

// Robust Promise-compatible Supabase query mock builder
const createMockQueryBuilder = (data: any = null, error: any = null) => {
  const qb: any = {
    eq: vi.fn().mockImplementation(() => qb),
    select: vi.fn().mockImplementation(() => qb),
    insert: vi.fn().mockImplementation(() => qb),
    update: vi.fn().mockImplementation(() => qb), // update chain added!
    single: vi.fn().mockImplementation(() => createMockQueryBuilder(data, error)),
    then: vi.fn().mockImplementation((onFulfilled) => {
      return Promise.resolve(onFulfilled({ data, error }));
    }),
  };
  return qb;
};

describe('TDD-08: AI Report Drafting and Status Governance', () => {
  const workspaceId = '00000000-0000-4000-a000-000000000001';
  const reportId = 'report-444';
  const runId = 'run-555';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should save newly synthesized AI executive summaries as candidate status by default', async () => {
    // 1. Mock Report Drafting action
    vi.mocked(generateReportDraft).mockResolvedValue([
      { id: 'sec-111', section_title: 'Executive Summary', status: 'candidate' }
    ]);

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'agent_runs') {
        return createMockQueryBuilder({ id: 'agent-run-rep-111' });
      }
      return createMockQueryBuilder();
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const result = await runReportDraftingAgent(workspaceId, reportId);
    expect(result.draftedSectionsCount).toBe(1);
    expect(result.agentRunId).toBe('agent-run-rep-111');
  });

  it('should save AI insight sections with candidate status to prevent unreviewed publication', async () => {
    // 2. Mock snaps query and section insertion
    const mockSnapshots = [
      { metric_name: 'ARS', metric_value: 80.00 },
      { metric_name: 'OCR', metric_value: 70.00 }
    ];

    vi.mocked(addReportSection).mockResolvedValue({
      id: 'sec-222',
      section_title: 'AI Observation Insights Pass',
      status: 'candidate' // Must be candidate by default!
    });

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'agent_runs') {
        return createMockQueryBuilder({ id: 'agent-run-rep-222' });
      }
      if (table === 'metric_snapshots') {
        return createMockQueryBuilder(mockSnapshots);
      }
      return createMockQueryBuilder();
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const result = await runReportInsightAgent(workspaceId, reportId, runId);
    expect(result.section.id).toBe('sec-222');
    expect(result.section.status).toBe('candidate');
  });
});
