/**
 * lib/pipeline/pipeline-state-manager.ts
 *
 * 파이프라인 실행 상태 관리 클래스.
 * - Phase별 체크포인트 저장/로드
 * - 중지(Pause) 플래그 관리 (DB 플래그 방식)
 * - Bootstrap 상태 캐싱 및 리셋
 * - 재개(Resume) 지원
 */

import { getSupabaseAdminClient } from '@/lib/supabase';

// ─────────────────────────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────────────────────────

export const PIPELINE_PHASES = [
  'phase0_bootstrap',
  'phase0_5_external',
  'phase0_6_hubFeedback',
  'phase1_signals',
  'phase1b_brandSignals',
  'phase1_5_deepDive',
  'phase2_opportunities',
  'phase2_1_reportGaps',
  'phase2_5_surfacePersist',
  'phase2_6_deepDiveEnrich',
  'phase3_promotions',
  'phase3_1_brandAssignment',
  'phase4_hubPush',
  'phase5_saturation',
] as const;

export type PipelinePhase = typeof PIPELINE_PHASES[number];

export type ResetScope = 'bootstrap_only' | 'signals_and_cq' | 'full';

export const PHASE_LABELS: Record<string, string> = {
  'phase0_bootstrap': '0. Bootstrap (TCO/KG)',
  'phase0_5_external': '0.5 외부 시그널 수집',
  'phase0_6_hubFeedback': '0.6 Hub 피드백 수신',
  'phase1_signals': '1. S-OGDE 시그널 생성',
  'phase1b_brandSignals': '1-B 브랜드 순회',
  'phase1_5_deepDive': '1.5 딥다이브 분석',
  'phase2_opportunities': '2. 벤치마크 기회 매핑',
  'phase2_1_reportGaps': '2.1 리포트 갭 피드',
  'phase2_5_surfacePersist': '2.5 Surface 저장',
  'phase2_6_deepDiveEnrich': '2.6 딥다이브 보강',
  'phase3_promotions': '3. CQ 승격 (MMR)',
  'phase3_1_brandAssignment': '3.1 브랜드 할당',
  'phase4_hubPush': '4. AI Hub 전송',
  'phase5_saturation': '5. 포화도 측정',
};

export type PhaseStatus = 'pending' | 'running' | 'completed' | 'failed' | 'paused' | 'skipped';

export interface PhaseResult {
  status: PhaseStatus;
  completed_at?: string;
  error?: string;
  [key: string]: any;
}

export interface RunProgress {
  runId: string;
  status: string;
  currentPhase: string | null;
  pauseRequested: boolean;
  phases: Record<string, PhaseResult>;
  resumeFrom: string | null;
}

export interface BootstrapStatus {
  isComplete: boolean;
  isPartial: boolean;
  tcoCount: number;
  kgCount: number;
  cachedResult?: PhaseResult;
}

// ─────────────────────────────────────────────────────────────
// 커스텀 에러
// ─────────────────────────────────────────────────────────────

export class PipelinePausedError extends Error {
  constructor(public readonly pausedAtPhase: string) {
    super(`Pipeline paused before phase: ${pausedAtPhase}`);
    this.name = 'PipelinePausedError';
  }
}

// ─────────────────────────────────────────────────────────────
// PipelineStateManager
// ─────────────────────────────────────────────────────────────

export class PipelineStateManager {
  /**
   * Phase 결과를 pipeline_runs.phase_results에 저장 (체크포인트).
   */
  static async updatePhaseResult(
    runId: string,
    phase: string,
    result: PhaseResult
  ): Promise<void> {
    const supabase = getSupabaseAdminClient();
    try {
      // phase_results는 JSONB — phase 키만 upsert
      const { error } = await supabase.rpc('jsonb_set_phase_result', {
        p_run_id: runId,
        p_phase: phase,
        p_result: result,
      }).single();

      if (error) {
        // RPC가 없으면 수동 업데이트 (fallback)
        await PipelineStateManager._fallbackUpdatePhase(runId, phase, result);
      }
    } catch {
      await PipelineStateManager._fallbackUpdatePhase(runId, phase, result);
    }
  }

  /**
   * Supabase RPC 없이 JSONB 업데이트 fallback
   */
  private static async _fallbackUpdatePhase(
    runId: string,
    phase: string,
    result: PhaseResult
  ): Promise<void> {
    const supabase = getSupabaseAdminClient();

    // 현재 phase_results 로드
    const { data: row } = await supabase
      .from('pipeline_runs')
      .select('phase_results')
      .eq('id', runId)
      .single();

    const current = (row?.phase_results as Record<string, PhaseResult>) ?? {};
    current[phase] = result;

    await supabase
      .from('pipeline_runs')
      .update({
        phase_results: current,
        current_phase: phase,
      })
      .eq('id', runId);
  }

  /**
   * 중지(Pause) 요청 플래그를 DB에 설정.
   * 현재 실행 중인 Phase가 완료되면 다음 Phase 시작 전에 중지됨.
   */
  static async requestPause(runId: string): Promise<void> {
    const supabase = getSupabaseAdminClient();
    await supabase
      .from('pipeline_runs')
      .update({ pause_requested: true })
      .eq('id', runId)
      .eq('status', 'running');
  }

  /**
   * 다음 Phase 시작 전에 중지 플래그를 확인.
   * true이면 파이프라인을 중지해야 함.
   */
  static async shouldPause(runId: string): Promise<boolean> {
    const supabase = getSupabaseAdminClient();
    const { data } = await supabase
      .from('pipeline_runs')
      .select('pause_requested')
      .eq('id', runId)
      .single();
    return data?.pause_requested === true;
  }

  /**
   * 중지 후 상태를 'paused'로 업데이트.
   */
  static async markAsPaused(runId: string, pausedAtPhase: string): Promise<void> {
    const supabase = getSupabaseAdminClient();
    await supabase
      .from('pipeline_runs')
      .update({
        status: 'paused',
        pause_requested: false,
        resume_from: pausedAtPhase,
        current_phase: pausedAtPhase,
      })
      .eq('id', runId);
  }

  /**
   * 중지된 파이프라인을 재개 상태로 전환.
   * resume_from에 저장된 Phase부터 계속 실행됨.
   */
  static async markAsResuming(runId: string): Promise<{ resumeFrom: string | null }> {
    const supabase = getSupabaseAdminClient();
    const { data } = await supabase
      .from('pipeline_runs')
      .select('resume_from, phase_results')
      .eq('id', runId)
      .eq('status', 'paused')
      .single();

    if (!data) throw new Error('Run not found or not in paused state');

    await supabase
      .from('pipeline_runs')
      .update({
        status: 'running',
        pause_requested: false,
      })
      .eq('id', runId);

    return { resumeFrom: data.resume_from };
  }

  /**
   * 실패한 Phase부터 재실행할 수 있도록 resume_from 설정.
   */
  static async markAsRetry(runId: string): Promise<{ resumeFrom: string | null }> {
    const supabase = getSupabaseAdminClient();
    const { data } = await supabase
      .from('pipeline_runs')
      .select('phase_results')
      .eq('id', runId)
      .single();

    if (!data) throw new Error('Run not found');

    // 실패한 첫 번째 Phase 찾기
    const phaseResults = (data.phase_results as Record<string, PhaseResult>) ?? {};
    let firstFailedPhase: string | null = null;

    for (const phase of PIPELINE_PHASES) {
      const r = phaseResults[phase];
      if (!r || r.status === 'failed') {
        firstFailedPhase = phase;
        break;
      }
    }

    await supabase
      .from('pipeline_runs')
      .update({
        status: 'running',
        pause_requested: false,
        resume_from: firstFailedPhase,
        // 실패한 Phase의 상태를 pending으로 초기화
        ...(firstFailedPhase && {
          phase_results: {
            ...phaseResults,
            [firstFailedPhase]: { status: 'pending' },
          },
        }),
      })
      .eq('id', runId);

    return { resumeFrom: firstFailedPhase };
  }

  /**
   * 현재 run의 Phase별 진행 상태를 조회.
   */
  static async getRunProgress(runId: string): Promise<RunProgress> {
    const supabase = getSupabaseAdminClient();
    const { data } = await supabase
      .from('pipeline_runs')
      .select('id, status, current_phase, pause_requested, phase_results, resume_from')
      .eq('id', runId)
      .single();

    if (!data) throw new Error(`Run not found: ${runId}`);

    return {
      runId: data.id,
      status: data.status,
      currentPhase: data.current_phase,
      pauseRequested: data.pause_requested ?? false,
      phases: (data.phase_results as Record<string, PhaseResult>) ?? {},
      resumeFrom: data.resume_from,
    };
  }

  /**
   * Bootstrap(TCO/KG) 상태를 조회.
   * 가장 최근 완료된 run의 phase_results에서 캐시 확인 → 없으면 DB 카운트 쿼리.
   */
  static async getBootstrapStatus(workspaceId: string, domainKey: string): Promise<BootstrapStatus> {
    const supabase = getSupabaseAdminClient();

    // 1. 최근 성공 run에서 캐시된 Bootstrap 결과 확인
    const { data: lastRun } = await supabase
      .from('pipeline_runs')
      .select('phase_results')
      .eq('workspace_id', workspaceId)
      .eq('domain_key', domainKey)
      .in('status', ['completed', 'paused', 'partial_success'])
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const cachedPhase = (lastRun?.phase_results as any)?.phase0_bootstrap;
    if (cachedPhase?.status === 'completed' && cachedPhase?.tcoConcepts >= 30) {
      return {
        isComplete: true,
        isPartial: false,
        tcoCount: cachedPhase.tcoConcepts ?? 0,
        kgCount: cachedPhase.kgNodes ?? 0,
        cachedResult: cachedPhase,
      };
    }

    // 2. 캐시 없음 — 실제 DB 카운트 쿼리
    const [tcoRes, kgRes] = await Promise.all([
      supabase.from('tco_concepts').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId).like('slug', `${domainKey}-%`),
      supabase.from('brand_ontology_nodes').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId),
    ]);

    const tcoCount = tcoRes.count ?? 0;
    const kgCount = kgRes.count ?? 0;

    return {
      isComplete: tcoCount >= 30 && kgCount > 0,
      isPartial: (tcoCount > 0) !== (kgCount > 0),
      tcoCount,
      kgCount,
    };
  }

  /**
   * Bootstrap 데이터(TCO/KG)를 리셋.
   * 이후 파이프라인 실행 시 Phase 0이 재실행됨.
   */
  static async resetBootstrap(workspaceId: string): Promise<{ tcoDeleted: number; kgDeleted: number }> {
    const supabase = getSupabaseAdminClient();

    const [tcoRes, kgRes] = await Promise.all([
      supabase.from('tco_concepts').delete().eq('workspace_id', workspaceId).select('id'),
      supabase.from('brand_ontology_nodes').delete().eq('workspace_id', workspaceId).select('id'),
    ]);

    return {
      tcoDeleted: tcoRes.data?.length ?? 0,
      kgDeleted: kgRes.data?.length ?? 0,
    };
  }

  /**
   * 시그널 + CQ 데이터를 리셋.
   */
  static async resetSignalsAndCQ(
    workspaceId: string,
    domainKey: string
  ): Promise<{ signalsDeleted: number; cqDeleted: number; scenesDeleted: number }> {
    const supabase = getSupabaseAdminClient();

    const [sigRes, cqRes, sceneRes] = await Promise.all([
      supabase.from('question_signals').delete()
        .eq('workspace_id', workspaceId)
        .select('id'),
      supabase.from('canonical_questions').delete()
        .eq('workspace_id', workspaceId)
        .select('id'),
      supabase.from('qis_scenes').delete()
        .eq('workspace_id', workspaceId)
        .select('id'),
    ]);

    return {
      signalsDeleted: sigRes.data?.length ?? 0,
      cqDeleted: cqRes.data?.length ?? 0,
      scenesDeleted: sceneRes.data?.length ?? 0,
    };
  }

  /**
   * Phase 의존성 체크 — 특정 Phase 시작 전 필수 데이터 존재 여부 확인.
   */
  static async checkPhaseDependency(
    workspaceId: string,
    domainKey: string,
    startPhase: string
  ): Promise<{ canRun: boolean; missingDeps: string[] }> {
    const supabase = getSupabaseAdminClient();
    const missingDeps: string[] = [];
    const phaseIndex = PIPELINE_PHASES.indexOf(startPhase as PipelinePhase);

    // Phase 1 이후부터 시작하려면 Bootstrap 완료 필요
    if (phaseIndex >= PIPELINE_PHASES.indexOf('phase1_signals')) {
      const bootstrap = await PipelineStateManager.getBootstrapStatus(workspaceId, domainKey);
      if (!bootstrap.isComplete) {
        missingDeps.push('TCO/KG Bootstrap (Phase 0 미완료)');
      }
    }

    // Phase 2 이후부터 시작하려면 시그널 존재 필요
    if (phaseIndex >= PIPELINE_PHASES.indexOf('phase2_opportunities')) {
      const { count: signalCount } = await supabase
        .from('question_signals')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId);

      if ((signalCount ?? 0) === 0) {
        missingDeps.push('질문 시그널 (Phase 1 미완료)');
      }
    }

    // Phase 3 이후부터 시작하려면 벤치마크 기회 존재 필요
    if (phaseIndex >= PIPELINE_PHASES.indexOf('phase3_promotions')) {
      const { count: sigCount } = await supabase
        .from('question_signals')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .gte('cps_score', 30);

      if ((sigCount ?? 0) === 0) {
        missingDeps.push('충분한 CPS 점수 시그널 (Phase 2 미완료 또는 시그널 품질 부족)');
      }
    }

    return { canRun: missingDeps.length === 0, missingDeps };
  }
}
