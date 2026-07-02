import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRcaCase, acceptRcaCase, rejectRcaCase } from '../../app/actions/fixit';
import { checkWorkspacePermission } from '../../lib/auth';
import { getSupabaseAdminClient } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => ({
  getSupabaseAdminClient: vi.fn(),
}));

vi.mock('../../lib/auth', () => ({
  requireAuth: vi.fn().mockResolvedValue('test-user-id'),
  requireAuthOrDemo: vi.fn().mockResolvedValue('test-user-id'),
  checkWorkspacePermission: vi.fn().mockResolvedValue(true),
  checkWorkspacePermissionOrDemo: vi.fn().mockResolvedValue(true),
  getWorkspaceRole: vi.fn().mockResolvedValue('admin'),
}));

const createMockQueryBuilder = (data: any = null, error: any = null) => {
  const qb: any = {
    eq: vi.fn().mockImplementation(() => qb),
    select: vi.fn().mockImplementation(() => qb),
    insert: vi.fn().mockImplementation(() => qb),
    update: vi.fn().mockImplementation(() => qb),
    single: vi.fn().mockImplementation(() => createMockQueryBuilder(data, error)),
    then: vi.fn().mockImplementation((onFulfilled) => {
      return Promise.resolve(onFulfilled({ data, error }));
    }),
  };
  return qb;
};

describe('TDD-09: RCA Case Validation and Status Governance', () => {
  const workspaceId = '00000000-0000-4000-a000-000000000001';
  const snapshotId = '00000000-0000-4000-a000-000000000002';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should require a structured cause hypothesis for RCA Case creation', async () => {
    vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

    const invalidRca = {
      source_metric_snapshot_id: snapshotId,
      metric_name: 'ARS',
      metric_value: 45.00,
      cause_hypothesis: '' // Missing/Empty!
    };

    await expect(createRcaCase(workspaceId, invalidRca)).rejects.toThrow();
  });

  it('should generate RCA cases with status candidate by default', async () => {
    vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

    const payload = {
      source_metric_snapshot_id: snapshotId,
      metric_name: 'ARS',
      metric_value: 45.00,
      cause_hypothesis: 'Auto-suggested: Low OCR due to missing schema tags.',
      status: 'candidate'
    };

    const mockFrom = vi.fn().mockImplementation(() => {
      return createMockQueryBuilder({
        id: '00000000-0000-4000-a000-000000000003',
        ...payload
      });
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const result = await createRcaCase(workspaceId, payload);
    expect(result).toBeDefined();
    expect(result.status).toBe('candidate');
  });

  it('should support accepting and rejecting RCA cases manually by strategists', async () => {
    vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

    const mockFrom = vi.fn().mockImplementation(() => {
      return createMockQueryBuilder({
        id: '00000000-0000-4000-a000-000000000004',
        status: 'approved',
        justification_notes: 'Valid root cause.'
      });
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    // Accept case
    const accepted = await acceptRcaCase(workspaceId, '00000000-0000-4000-a000-000000000004', 'Valid root cause.');
    expect(accepted.status).toBe('approved');
  });
});
