import { NextRequest, NextResponse } from 'next/server';
import { PipelineStateManager, PHASE_LABELS } from '@/lib/pipeline/pipeline-state-manager';

export const dynamic = 'force-dynamic';

/**
 * GET /api/pipeline/e2e/status?runId=xxx
 *
 * 실행 중인 파이프라인의 Phase별 진행 상태를 반환.
 * Orchestration 페이지에서 폴링하여 실시간 표시에 사용.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const runId = searchParams.get('runId');

    if (!runId) {
      return NextResponse.json({ error: 'runId is required' }, { status: 400 });
    }

    const progress = await PipelineStateManager.getRunProgress(runId);

    // Phase별 상태를 레이블 포함하여 응답
    const phaseSummary = Object.fromEntries(
      Object.entries(progress.phases).map(([phase, result]) => [
        phase,
        {
          label: PHASE_LABELS[phase] ?? phase,
          status: (result as any).status,
          completedAt: (result as any).completed_at,
          error: (result as any).error,
        },
      ])
    );

    return NextResponse.json({
      runId: progress.runId,
      status: progress.status,
      currentPhase: progress.currentPhase,
      currentPhaseLabel: progress.currentPhase ? (PHASE_LABELS[progress.currentPhase] ?? progress.currentPhase) : null,
      pauseRequested: progress.pauseRequested,
      resumeFrom: progress.resumeFrom,
      phases: phaseSummary,
    });
  } catch (err: any) {
    if (err.message?.includes('not found')) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }
    console.error('[API /pipeline/e2e/status] Error:', err);
    return NextResponse.json({ error: err?.message || '상태 조회 오류' }, { status: 500 });
  }
}
