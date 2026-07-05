'use server';

/**
 * app/actions/pipeline-control.ts
 *
 * 파이프라인 제어 서버 액션:
 * - 중지(Pause) / 계속(Resume) / 실패 Phase 재시도(Retry)
 * - Bootstrap / 전체 데이터 리셋
 * - Phase 선택 실행
 */

import { getSupabaseAdminClient } from '@/lib/supabase';
import {
  PipelineStateManager,
  PIPELINE_PHASES,
  type PipelinePhase,
  type ResetScope,
} from '@/lib/pipeline/pipeline-state-manager';

// ─────────────────────────────────────────────────────────────
// 내부 유틸
// ─────────────────────────────────────────────────────────────

async function resolveWorkspaceId(workspaceSlug: string): Promise<string> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('workspaces')
    .select('id')
    .eq('slug', workspaceSlug)
    .single();
  if (error || !data) throw new Error(`Workspace not found: ${workspaceSlug}`);
  return data.id;
}

// ─────────────────────────────────────────────────────────────
// 1. 중지 (Pause)
// ─────────────────────────────────────────────────────────────

/**
 * 실행 중인 파이프라인에 중지 플래그를 설정.
 * 현재 Phase가 완료된 후 다음 Phase 시작 전에 멈춤.
 */
export async function pausePipelineAction(
  workspaceSlug: string,
  runId: string
): Promise<{ ok: boolean; message: string }> {
  try {
    await PipelineStateManager.requestPause(runId);
    return { ok: true, message: '중지 요청 전송 완료. 현재 Phase가 끝난 후 멈춥니다.' };
  } catch (err: any) {
    return { ok: false, message: err.message };
  }
}

// ─────────────────────────────────────────────────────────────
// 2. 계속 (Resume)
// ─────────────────────────────────────────────────────────────

/**
 * paused 상태의 파이프라인을 resume_from Phase부터 재개 실행.
 */
export async function resumePipelineAction(
  workspaceSlug: string,
  runId: string
): Promise<{ ok: boolean; resumeFrom: string | null; message: string }> {
  try {
    const workspaceId = await resolveWorkspaceId(workspaceSlug);
    const { resumeFrom } = await PipelineStateManager.markAsResuming(runId);

    // 실제 파이프라인 재실행 (중지된 Phase부터)
    const { runE2EPipeline } = await import('./qis-bridge');

    // 워크스페이스에서 도메인 키 조회
    const supabase = getSupabaseAdminClient();
    const { data: run } = await supabase
      .from('pipeline_runs')
      .select('domain_key, brand_name')
      .eq('id', runId)
      .single();

    if (!run) throw new Error('Run not found');

    // 백그라운드 실행 (await 없이 — Vercel Edge에서는 waitUntil 필요)
    runE2EPipeline(workspaceId, run.domain_key, run.brand_name ?? undefined, {
      mode: 'standalone',
      resumeFromPhase: resumeFrom ?? undefined,
      existingRunId: runId,
    }).catch(console.error);

    return {
      ok: true,
      resumeFrom,
      message: `${resumeFrom ?? '처음'}부터 파이프라인을 재개합니다.`,
    };
  } catch (err: any) {
    return { ok: false, resumeFrom: null, message: err.message };
  }
}

// ─────────────────────────────────────────────────────────────
// 3. 실패 Phase 재시도 (Retry)
// ─────────────────────────────────────────────────────────────

/**
 * 실패한 첫 번째 Phase부터 재실행.
 */
export async function retryFromFailedPhaseAction(
  workspaceSlug: string,
  runId: string
): Promise<{ ok: boolean; resumeFrom: string | null; message: string }> {
  try {
    const workspaceId = await resolveWorkspaceId(workspaceSlug);
    const { resumeFrom } = await PipelineStateManager.markAsRetry(runId);

    const supabase = getSupabaseAdminClient();
    const { data: run } = await supabase
      .from('pipeline_runs')
      .select('domain_key, brand_name')
      .eq('id', runId)
      .single();

    if (!run) throw new Error('Run not found');

    const { runE2EPipeline } = await import('./qis-bridge');
    runE2EPipeline(workspaceId, run.domain_key, run.brand_name ?? undefined, {
      mode: 'standalone',
      resumeFromPhase: resumeFrom ?? undefined,
      existingRunId: runId,
    }).catch(console.error);

    return {
      ok: true,
      resumeFrom,
      message: `실패 Phase(${resumeFrom ?? '처음'})부터 재시도합니다.`,
    };
  } catch (err: any) {
    return { ok: false, resumeFrom: null, message: err.message };
  }
}

// ─────────────────────────────────────────────────────────────
// 4. Bootstrap 리셋
// ─────────────────────────────────────────────────────────────

/**
 * TCO/KG Bootstrap 데이터를 삭제하고 재생성 가능 상태로 전환.
 * 다음 파이프라인 실행 시 Phase 0이 다시 실행됨.
 */
export async function resetBootstrapAction(
  workspaceSlug: string,
  domainKey: string
): Promise<{ ok: boolean; tcoDeleted: number; kgDeleted: number; message: string }> {
  try {
    const workspaceId = await resolveWorkspaceId(workspaceSlug);
    const result = await PipelineStateManager.resetBootstrap(workspaceId);
    return {
      ok: true,
      ...result,
      message: `Bootstrap 리셋 완료. TCO ${result.tcoDeleted}개, KG ${result.kgDeleted}개 삭제됨. 다음 실행 시 Phase 0이 재실행됩니다.`,
    };
  } catch (err: any) {
    return { ok: false, tcoDeleted: 0, kgDeleted: 0, message: err.message };
  }
}

// ─────────────────────────────────────────────────────────────
// 5. 파이프라인 데이터 리셋 (범위 선택)
// ─────────────────────────────────────────────────────────────

/**
 * 파이프라인 데이터를 선택한 범위로 리셋.
 * - bootstrap_only: TCO/KG만 삭제
 * - signals_and_cq: 시그널 + CQ + Scene 삭제
 * - full: 위 전체 삭제
 */
export async function resetPipelineDataAction(
  workspaceSlug: string,
  domainKey: string,
  scope: ResetScope
): Promise<{
  ok: boolean;
  deleted: Partial<{ tco: number; kg: number; signals: number; cq: number; scenes: number }>;
  message: string;
}> {
  try {
    const workspaceId = await resolveWorkspaceId(workspaceSlug);
    const deleted: any = {};

    if (scope === 'bootstrap_only' || scope === 'full') {
      const r = await PipelineStateManager.resetBootstrap(workspaceId);
      deleted.tco = r.tcoDeleted;
      deleted.kg = r.kgDeleted;
    }

    if (scope === 'signals_and_cq' || scope === 'full') {
      const r = await PipelineStateManager.resetSignalsAndCQ(workspaceId, domainKey);
      deleted.signals = r.signalsDeleted;
      deleted.cq = r.cqDeleted;
      deleted.scenes = r.scenesDeleted;
    }

    const parts: string[] = [];
    if (deleted.tco !== undefined) parts.push(`TCO ${deleted.tco}개`);
    if (deleted.kg !== undefined) parts.push(`KG ${deleted.kg}개`);
    if (deleted.signals !== undefined) parts.push(`시그널 ${deleted.signals}개`);
    if (deleted.cq !== undefined) parts.push(`CQ ${deleted.cq}개`);
    if (deleted.scenes !== undefined) parts.push(`Scene ${deleted.scenes}개`);

    return {
      ok: true,
      deleted,
      message: `리셋 완료: ${parts.join(', ')} 삭제됨.`,
    };
  } catch (err: any) {
    return { ok: false, deleted: {}, message: err.message };
  }
}

// ─────────────────────────────────────────────────────────────
// 6. Phase 선택 실행
// ─────────────────────────────────────────────────────────────

/**
 * 특정 Phase부터 새로 실행.
 * 의존성 체크 후 실행 가능하면 새 run을 생성하여 해당 Phase부터 시작.
 */
export async function runFromPhaseAction(
  workspaceSlug: string,
  domainKey: string,
  startPhase: PipelinePhase,
  brandName?: string
): Promise<{
  ok: boolean;
  runId?: string;
  missingDeps?: string[];
  message: string;
}> {
  try {
    const workspaceId = await resolveWorkspaceId(workspaceSlug);

    // 의존성 체크
    const { canRun, missingDeps } = await PipelineStateManager.checkPhaseDependency(
      workspaceId,
      domainKey,
      startPhase
    );

    if (!canRun) {
      return {
        ok: false,
        missingDeps,
        message: `선택한 Phase(${startPhase}) 실행 불가: 필수 데이터 없음 — ${missingDeps.join(', ')}`,
      };
    }

    const { runE2EPipeline } = await import('./qis-bridge');

    // 새 run 생성 (resumeFromPhase 설정)
    const result = await runE2EPipeline(workspaceId, domainKey, brandName, {
      mode: 'standalone',
      resumeFromPhase: startPhase,
    });

    return {
      ok: true,
      runId: result.runId,
      message: `${startPhase}부터 실행 시작. runId: ${result.runId?.slice(0, 8)}...`,
    };
  } catch (err: any) {
    return { ok: false, message: err.message };
  }
}

// ─────────────────────────────────────────────────────────────
// 7. 실행 상태 조회
// ─────────────────────────────────────────────────────────────

/**
 * 현재 run의 Phase별 진행 상태를 조회.
 * Orchestration 페이지의 폴링 기반 실시간 업데이트에 사용.
 */
export async function getPipelineProgressAction(runId: string) {
  try {
    const progress = await PipelineStateManager.getRunProgress(runId);
    return { ok: true, progress };
  } catch (err: any) {
    return { ok: false, progress: null, message: err.message };
  }
}

/**
 * 현재 Bootstrap 상태 조회.
 */
export async function getBootstrapStatusAction(workspaceSlug: string, domainKey: string) {
  try {
    const workspaceId = await resolveWorkspaceId(workspaceSlug);
    const status = await PipelineStateManager.getBootstrapStatus(workspaceId);
    return { ok: true, status };
  } catch (err: any) {
    return { ok: false, status: null, message: err.message };
  }
}

