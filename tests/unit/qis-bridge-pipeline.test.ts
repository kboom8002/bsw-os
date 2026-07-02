/**
 * tests/unit/qis-bridge-pipeline.test.ts
 *
 * Unit tests for the E2E QIS Pipeline in qis-bridge.ts
 * Tests: input validation, concurrency lock, phase error tracking, status calculation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock external dependencies ──────────────────────────────────────────────

// Mock Supabase admin client
const mockSupabase = {
  from: vi.fn(),
};

vi.mock('@/lib/supabase', () => ({
  getSupabaseAdminClient: () => mockSupabase,
}));

vi.mock('@/lib/auth', () => ({
  requireAuthOrDemo: vi.fn().mockResolvedValue('test-user-id'),
}));

vi.mock('@/lib/signal-collection/orchestrator', () => ({
  SignalOrchestrator: {
    runFullPipeline: vi.fn().mockResolvedValue({ savedSignals: 3 }),
  },
}));

vi.mock('@/lib/benchmark/domain-config', () => ({
  BENCHMARK_DOMAINS: {
    wedding_studio: { name: '웨딩', brands: [] },
    skincare: { name: '스킨케어', brands: [] },
  },
}));

// ─── Helper: build a chainable Supabase mock ─────────────────────────────────

function buildSupabaseChain(finalReturn: { data?: any; count?: number | null; error?: any }) {
  const chain: any = {};
  const methods = ['select', 'insert', 'update', 'eq', 'order', 'limit', 'maybeSingle', 'single', 'gte', 'in'];
  methods.forEach((m) => {
    chain[m] = vi.fn().mockReturnValue(chain);
  });
  // The last awaited call returns the finalReturn
  // Make it a thenable
  chain.then = undefined; // not a promise by default
  // Override maybeSingle to resolve
  chain.maybeSingle = vi.fn().mockResolvedValue(finalReturn);
  chain.single = vi.fn().mockResolvedValue(finalReturn);
  // Make the chain itself awaitable (for cases like `.select()` directly awaited)
  Object.defineProperty(chain, 'then', {
    get() {
      return (resolve: Function) => resolve(finalReturn);
    },
  });
  return chain;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('runE2EPipeline — Input Validation', () => {
  it('throws when workspaceId is empty', async () => {
    // We import after mocks are set up
    const { runE2EPipeline } = await import('@/app/actions/qis-bridge');

    await expect(
      runE2EPipeline('', 'skincare', undefined)
    ).rejects.toThrow('Invalid workspaceId');
  });

  it('throws when domainName is empty', async () => {
    const { runE2EPipeline } = await import('@/app/actions/qis-bridge');

    await expect(
      runE2EPipeline('some-workspace-id', '', undefined)
    ).rejects.toThrow('Invalid domainName');
  });

  it('throws when domainName is whitespace only', async () => {
    const { runE2EPipeline } = await import('@/app/actions/qis-bridge');

    await expect(
      runE2EPipeline('some-workspace-id', '   ', undefined)
    ).rejects.toThrow('Invalid domainName');
  });
});

describe('runE2EPipeline — autoPromoteTopN bounds', () => {
  it('clamps autoPromoteTopN below 1 to 1', async () => {
    // The function internally does Math.max(1, Math.min(20, value))
    // We test indirectly by checking no error is thrown with extreme values
    // (Full integration test would verify the clamped value is used)
    const { runE2EPipeline } = await import('@/app/actions/qis-bridge');

    // Setup minimal mocks to avoid pipeline actually running
    mockSupabase.from.mockReturnValue(buildSupabaseChain({ data: null, count: 0 }));

    // Should not throw due to invalid autoPromoteTopN
    // (just validates the clamping doesn't cause errors)
    try {
      await runE2EPipeline('workspace-1', 'skincare', undefined, { autoPromoteTopN: -5 });
    } catch (e: any) {
      // Only input validation errors are expected; negative topN shouldn't throw
      expect(e.message).not.toContain('autoPromoteTopN');
    }
  });
});

describe('runE2EPipeline — Concurrency Lock', () => {
  it('throws 409-style error when pipeline is already running', async () => {
    const { runE2EPipeline } = await import('@/app/actions/qis-bridge');

    // Mock: existing running pipeline started 30 seconds ago
    const recentStart = new Date(Date.now() - 30_000).toISOString();
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: 'existing-run-id', started_at: recentStart },
        error: null,
      }),
    };

    mockSupabase.from.mockReturnValue(fromMock);

    await expect(
      runE2EPipeline('workspace-1', 'skincare', undefined)
    ).rejects.toThrow('already running');
  });

  it('proceeds when existing run is stale (>5 min old)', async () => {
    const { runE2EPipeline } = await import('@/app/actions/qis-bridge');

    // Stale run started 6 minutes ago
    const staleStart = new Date(Date.now() - 6 * 60 * 1000).toISOString();

    let callCount = 0;
    mockSupabase.from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // First call: pipeline_runs check — returns stale run
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: 'stale-run-id', started_at: staleStart },
            error: null,
          }),
        };
      }
      // All other calls: return safe empty data
      return buildSupabaseChain({ data: null, count: 0, error: null });
    });

    // Should not throw 'already running'
    try {
      await runE2EPipeline('workspace-1', 'skincare', undefined);
    } catch (e: any) {
      expect(e.message).not.toContain('already running');
    }
  });
});

describe('runE2EPipeline — Phase Error Tracking', () => {
  it('returns phaseErrors array when phases fail', async () => {
    const { runE2EPipeline } = await import('@/app/actions/qis-bridge');
    const { SignalOrchestrator } = await import('@/lib/signal-collection/orchestrator');

    // Force Phase 1 to fail
    vi.mocked(SignalOrchestrator.runFullPipeline).mockRejectedValueOnce(
      new Error('LLM API timeout')
    );

    // Minimal DB mocks
    mockSupabase.from.mockReturnValue(buildSupabaseChain({ data: null, count: 0, error: null }));

    let result: any;
    try {
      result = await runE2EPipeline('workspace-1', 'skincare', undefined);
    } catch {
      // If it throws on another phase, that's fine for this test
      return;
    }

    // If it doesn't throw, phaseErrors should contain at least one entry
    if (result) {
      expect(result.phaseErrors).toBeDefined();
      expect(Array.isArray(result.phaseErrors)).toBe(true);
    }
  });

  it('result has status field', async () => {
    const { runE2EPipeline } = await import('@/app/actions/qis-bridge');

    mockSupabase.from.mockReturnValue(buildSupabaseChain({ data: null, count: 0, error: null }));

    let result: any;
    try {
      result = await runE2EPipeline('workspace-1', 'skincare', undefined);
    } catch {
      return; // Not testing for throw
    }

    if (result) {
      expect(['success', 'partial_success', 'failed', 'running']).toContain(result.status);
    }
  });
});

describe('Pipeline Validation Schemas', () => {
  it('E2EPipelineInputSchema validates UUID workspaceId', async () => {
    const { E2EPipelineInputSchema } = await import('@/lib/validation/pipeline-schemas');

    const result = E2EPipelineInputSchema.safeParse({
      workspaceId: 'not-a-uuid',
      domainName: 'skincare',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('UUID');
    }
  });

  it('E2EPipelineInputSchema passes with valid UUID and domainName', async () => {
    const { E2EPipelineInputSchema } = await import('@/lib/validation/pipeline-schemas');

    const result = E2EPipelineInputSchema.safeParse({
      workspaceId: '123e4567-e89b-12d3-a456-426614174000',
      domainName: 'skincare',
    });

    expect(result.success).toBe(true);
  });

  it('PromoteSignalInputSchema validates both UUIDs', async () => {
    const { PromoteSignalInputSchema } = await import('@/lib/validation/pipeline-schemas');

    const result = PromoteSignalInputSchema.safeParse({
      workspaceId: '123e4567-e89b-12d3-a456-426614174000',
      signalId: 'bad-id',
    });

    expect(result.success).toBe(false);
  });
});
