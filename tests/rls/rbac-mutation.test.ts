import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkWorkspacePermission } from '../../lib/auth';
import { getSupabaseAdminClient } from '../../lib/supabase';
import { 
  createReportExport, 
  evaluateReportExportGate 
} from '../../app/actions/reports';
import { upsertStrategicTruth } from '../../app/actions/truth';
import { createTestWorkspace, createTestUser } from '../helpers';
import { reportExportFixture, kBeautyFixture } from '../fixtures';

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

describe('TDD-02: RBAC Role Mutation Permission Tests', () => {
  // Use valid RFC4122 v4 UUIDs to satisfy Zod validation
  const mockWorkspaceId = '00000000-0000-4000-a000-000000000001';
  const mockReportId = '00000000-0000-4000-a000-000000000002';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should authorize owner/admin role to mutate allowed truth claims', async () => {
    vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

    const mockFrom = vi.fn().mockReturnValue(createMockQueryBuilder({ id: 'claim-1' }));
    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const result = await upsertStrategicTruth(mockWorkspaceId, {
      statement: kBeautyFixture.claims[0].statement,
      vision: 'Corporate Vision statement',
      core_pillars: ['Hydration', 'Redness recovery']
    });

    expect(result).toBeDefined();
    expect(result.id).toBe('claim-1');
  });

  it('should strictly block executive_viewer from performing truth claim mutations', async () => {
    vi.mocked(checkWorkspacePermission).mockImplementation(async (wsId, userId, allowedRoles) => {
      return allowedRoles.includes('executive_viewer');
    });

    await expect(
      upsertStrategicTruth(mockWorkspaceId, {
        statement: kBeautyFixture.claims[0].statement,
        vision: 'Corporate Vision statement',
        core_pillars: ['Hydration']
      })
    ).rejects.toThrow('UNAUTHORIZED');
  });

  it('should deny observatory_analyst from executing report export approval mutations', async () => {
    vi.mocked(checkWorkspacePermission).mockImplementation(async (wsId, userId, allowedRoles) => {
      return allowedRoles.includes('observatory_analyst');
    });

    await expect(
      createReportExport(mockWorkspaceId, mockReportId, 'markdown')
    ).rejects.toThrow('UNAUTHORIZED');
  });

  it('should prevent persona_vibe_designer from bypassing a failed report export gate', async () => {
    vi.mocked(checkWorkspacePermission).mockResolvedValue(false); // denied!

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'benchmark_reports') {
        return createMockQueryBuilder({ report_name: 'Competitor A Report', scores: {}, methodology_disclosure_id: null });
      }
      return createMockQueryBuilder(null);
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    await expect(
      createReportExport(mockWorkspaceId, mockReportId, 'markdown')
    ).rejects.toThrow();
  });
});
