import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkWorkspacePermission } from '../../lib/auth';
import { getSupabaseAdminClient } from '../../lib/supabase';
import { upsertStrategicTruth } from '../../app/actions/truth';
import { promoteSignalToQuestionCapital } from '../../app/actions/semantic';
import { generateReportDraft } from '../../app/actions/reports';
import { kBeautyFixture, highRiskQisFixture } from '../fixtures';

vi.mock('../../lib/supabase', () => ({
  getSupabaseAdminClient: vi.fn(),
}));

vi.mock('../../lib/auth', () => ({
  checkWorkspacePermission: vi.fn(),
}));

const createMockQueryBuilder = (data: any = null, count: number = 0) => {
  const qb: any = {
    eq: vi.fn().mockImplementation(() => qb),
    select: vi.fn().mockImplementation(() => qb),
    insert: vi.fn().mockImplementation(() => qb),
    upsert: vi.fn().mockImplementation(() => qb),
    update: vi.fn().mockImplementation(() => qb),
    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
    single: vi.fn().mockResolvedValue({ data, error: null }),
    then: (resolve: any) => resolve({ data, count, error: null })
  };
  return qb;
};

describe('TDD-02: Compliance Audit & Agent Run Tracking Tests', () => {
  // Use strictly valid RFC4122 v4 UUIDs
  const mockWorkspaceId = '00000000-0000-4000-a000-000000000001';
  const mockSignalId = '00000000-0000-4000-a000-000000000002';
  const mockReportId = '00000000-0000-4000-a000-000000000003';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Security Audit Event Trail', () => {
    it('should write to audit_events table when a critical strategic claim mutation is performed', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

      const mockInsert = vi.fn().mockReturnValue(createMockQueryBuilder({ id: 'claim-mock-id' }));
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'audit_events') {
          return { insert: mockInsert } as any;
        }
        return createMockQueryBuilder({ id: 'claim-mock-id' });
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      await upsertStrategicTruth(mockWorkspaceId, {
        statement: kBeautyFixture.claims[0].statement,
        vision: 'Vision',
        core_pillars: ['Hydration']
      });

      // Assert: Must insert a security log record into audit_events!
      expect(mockFrom).toHaveBeenCalledWith('audit_events');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          workspace_id: mockWorkspaceId,
          action: 'CREATE_STRATEGIC_TRUTH',
          target_type: 'brand_strategic_truths'
        })
      );
    });

    it('should write to audit_events table when promoting search signals to Question Capital', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

      const mockInsert = vi.fn().mockReturnValue(createMockQueryBuilder({ id: 'node-mock-id' }));
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'audit_events') {
          return { insert: mockInsert } as any;
        }
        if (table === 'question_signals') {
          return createMockQueryBuilder({ id: mockSignalId, query: 'retinol sensitive skin' });
        }
        return createMockQueryBuilder({ id: 'node-mock-id' });
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      await promoteSignalToQuestionCapital(mockWorkspaceId, mockSignalId, 'Skincare Retinol Node');

      // Assert: Must insert log record into audit_events!
      expect(mockFrom).toHaveBeenCalledWith('audit_events');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          workspace_id: mockWorkspaceId,
          action: 'PROMOTE_SIGNAL_TO_CAPITAL',
          target_type: 'question_capital_nodes'
        })
      );
    });
  });

  describe('2. AI Candidate Execution Traceability', () => {
    it('should write to agent_runs table when generating AI draft sections as candidates', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

      const mockInsert = vi.fn().mockReturnValue(createMockQueryBuilder({ id: 'agent-run-id' }));
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'agent_runs') {
          return { insert: mockInsert } as any;
        }
        return createMockQueryBuilder({ id: 'section-mock-id' });
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      await generateReportDraft(mockWorkspaceId, mockReportId);

      // Assert: Must insert a transaction tracking record into agent_runs!
      expect(mockFrom).toHaveBeenCalledWith('agent_runs');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          workspace_id: mockWorkspaceId,
          agent_name: 'report-draft-generator-agent',
          status: 'candidate'
        })
      );
    });
  });
});
