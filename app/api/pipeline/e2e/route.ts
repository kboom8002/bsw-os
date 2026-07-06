import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { runE2EPipeline } from '../../../actions/qis-bridge';
import {
  pausePipelineAction,
  resumePipelineAction,
  retryFromFailedPhaseAction,
  resetBootstrapAction,
  resetPipelineDataAction,
} from '../../../actions/pipeline-control';
import { type ResetScope } from '@/lib/pipeline/pipeline-state-manager';

export const maxDuration = 800; // Vercel Pro 플랜 최대 (E2E 파이프라인은 질문 수에 따라 5~10분 소요)

const RequestSchema = z.object({
  workspaceId: z.string().min(1, 'workspaceId is required'),
  domainName: z.string().min(1, 'domainName is required'),
  brandName: z.string().optional(),
  phaseGroup: z.enum(['bootstrap', 'collect', 'promote', 'finalize', 'full']).default('full'),
  enabledPhases: z.array(z.string()).optional(),
  selectedSignalIds: z.array(z.string()).optional(),
  options: z.object({
    mode: z.enum(['hub', 'standalone']).default('standalone'),
    autoPromoteTopN: z.number().int().min(1).max(20).default(5),
    brandUSP: z.string().max(1000).optional(),
    industryKey: z.string().optional(),
    resumeFromPhase: z.string().optional(),
    rotationBrandSlugs: z.array(z.string()).optional(),
  }).optional(),
});

const ControlSchema = z.object({
  action: z.enum(['pause', 'resume', 'retry', 'reset_bootstrap', 'reset_data']),
  workspaceSlug: z.string().min(1),
  runId: z.string().optional(),
  domainKey: z.string().optional(),
  resetScope: z.enum(['bootstrap_only', 'signals_and_cq', 'full']).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: parsed.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`),
        },
        { status: 400 }
      );
    }

    const { workspaceId, domainName, brandName, phaseGroup, enabledPhases, selectedSignalIds, options } = parsed.data;

    const result = await runE2EPipeline(workspaceId, domainName, brandName, {
      ...options,
      phaseGroup,
      enabledPhases,
      selectedSignalIds,
    });

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    // 동시 실행 오류 등 명시적 에러
    if (err?.message?.includes('already running')) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }

    console.error('[API /pipeline/e2e] Unhandled error:', err);
    return NextResponse.json(
      { error: err?.message || '파이프라인 실행 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/pipeline/e2e — 파이프라인 제어 (중지/계속/리셋)
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ControlSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues.map(e => `${e.path.join('.')}: ${e.message}`) },
        { status: 400 }
      );
    }

    const { action, workspaceSlug, runId, domainKey, resetScope } = parsed.data;

    switch (action) {
      case 'pause':
        if (!runId) return NextResponse.json({ error: 'runId required for pause' }, { status: 400 });
        return NextResponse.json(await pausePipelineAction(workspaceSlug, runId));

      case 'resume':
        if (!runId) return NextResponse.json({ error: 'runId required for resume' }, { status: 400 });
        return NextResponse.json(await resumePipelineAction(workspaceSlug, runId));

      case 'retry':
        if (!runId) return NextResponse.json({ error: 'runId required for retry' }, { status: 400 });
        return NextResponse.json(await retryFromFailedPhaseAction(workspaceSlug, runId));

      case 'reset_bootstrap':
        if (!domainKey) return NextResponse.json({ error: 'domainKey required for reset_bootstrap' }, { status: 400 });
        return NextResponse.json(await resetBootstrapAction(workspaceSlug, domainKey));

      case 'reset_data':
        if (!domainKey) return NextResponse.json({ error: 'domainKey required for reset_data' }, { status: 400 });
        return NextResponse.json(
          await resetPipelineDataAction(workspaceSlug, domainKey, (resetScope ?? 'signals_and_cq') as ResetScope)
        );

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err: any) {
    console.error('[API /pipeline/e2e PATCH] Error:', err);
    return NextResponse.json({ error: err?.message || '제어 오류' }, { status: 500 });
  }
}
