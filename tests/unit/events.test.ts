import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SyncEventHub, SyncEvent } from '../../lib/events/sync-event-hub';
import { getSupabaseAdminClient } from '../../lib/supabase';
import { checkWorkspacePermission } from '../../lib/auth';
import { createIndustryStandardPanel } from '../../app/actions/probe-panel-factory';
import { syncTenantContent } from '../../app/actions/sync';

vi.mock('../../lib/supabase', () => ({
  getSupabaseAdminClient: vi.fn(),
}));

vi.mock('../../lib/auth', () => ({
  checkWorkspacePermission: vi.fn(),
}));

vi.mock('../../app/actions/probe-panel-factory', () => ({
  createIndustryStandardPanel: vi.fn(),
}));

vi.mock('../../app/actions/sync', () => ({
  syncTenantContent: vi.fn(),
}));

const createMockQueryBuilder = (data: any = null, error: any = null) => {
  const qb: any = {
    eq: vi.fn().mockImplementation(() => qb),
    select: vi.fn().mockImplementation(() => qb),
    insert: vi.fn().mockImplementation(() => qb),
    update: vi.fn().mockImplementation(() => qb),
    upsert: vi.fn().mockImplementation(() => qb),
    limit: vi.fn().mockImplementation(() => qb),
    maybeSingle: vi.fn().mockImplementation(async () => ({ data, error })),
    single: vi.fn().mockImplementation(async () => ({ data, error })),
    then: vi.fn().mockImplementation((onFulfilled) => {
      return Promise.resolve(onFulfilled({ data, error }));
    }),
  };
  return qb;
};

describe('SaaS Event-Driven Integration Hub Test Suite (Phase 2C)', () => {
  const workspaceId = '00000000-0000-4000-a000-000000000001';
  const tenantId = 'ffffffff-ffff-4fff-bfff-ffffffffffff';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkWorkspacePermission).mockResolvedValue(true);
  });

  it('should process TENANT_ONBOARDED event and deploy standard panel + schedule baseline', async () => {
    const event: SyncEvent = {
      type: 'TENANT_ONBOARDED',
      tenantId,
      tenantSlug: 'k-beauty-center',
      industry: 'beauty',
      workspaceId
    };

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'tenant_workspace_bridge') {
        return createMockQueryBuilder({ id: 'bridge-123' });
      }
      if (table === 'ai_observation_runs') {
        return createMockQueryBuilder({ id: 'baseline-run-999' });
      }
      return createMockQueryBuilder();
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    vi.mocked(createIndustryStandardPanel).mockResolvedValue({
      panelId: 'panel-beauty-123',
      questionCount: 20
    });

    const hub = new SyncEventHub();
    const result = await hub.dispatch(event);

    expect(result.status).toBe('dispatched');
    expect(result.payload.bridgeId).toBe('bridge-123');
    expect(result.payload.panelId).toBe('panel-beauty-123');
    expect(result.payload.runId).toBe('baseline-run-999');
    expect(createIndustryStandardPanel).toHaveBeenCalledWith(workspaceId, 'beauty', 'k beauty center', ['경쟁사']);
  });

  it('should process ANSWER_CARD_PUBLISHED event and trigger sync + retest scheduling', async () => {
    const event: SyncEvent = {
      type: 'ANSWER_CARD_PUBLISHED',
      tenantId,
      cardId: 'card-abc',
      workspaceId
    };

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'tenant_workspace_bridge') {
        return createMockQueryBuilder({ id: 'bridge-123' });
      }
      if (table === 'probe_panels') {
        return createMockQueryBuilder({ id: 'panel-beauty-123' });
      }
      if (table === 'ai_observation_runs') {
        return createMockQueryBuilder({ id: 'retest-run-777' });
      }
      return createMockQueryBuilder();
    });

    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    vi.mocked(syncTenantContent).mockResolvedValue({
      status: 'success',
      syncedRecords: { evidenceCount: 1, boundaryCount: 1, capitalCount: 1, cqCount: 1, conceptCount: 1, vibeSpecCount: 1, personaSpecCount: 1 },
      lastSyncedAt: new Date().toISOString()
    });

    const hub = new SyncEventHub();
    const result = await hub.dispatch(event);

    expect(result.status).toBe('dispatched');
    expect(syncTenantContent).toHaveBeenCalledWith('bridge-123');
    expect(result.payload.retestRunId).toBe('retest-run-777');
  });
});
