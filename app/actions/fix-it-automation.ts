'use server';

/**
 * app/actions/fix-it-automation.ts
 *
 * Fix-It RCA 파이프라인 Server Actions.
 *
 * - runAutoRCA:      이상 탐지 → RCA 가설 생성 (자동)
 * - approvePatch:    패치 티켓 승인 → 자동 적용 → 쿨다운 스케줄 등록
 * - executeRetest:   쿨다운 종료 후 리테스트 실행
 * - checkRegression: 새 관측 결과로 회귀 탐지
 */

import { getSupabaseAdminClient } from '../../lib/supabase';
import { AnomalyDetector } from '../../lib/fix-it/anomaly-detector';
import { RcaGenerator } from '../../lib/fix-it/rca-generator';
import { PatchExecutor } from '../../lib/fix-it/patch-executor';
import { RetestScheduler } from '../../lib/fix-it/retest-scheduler';
import { RegressionGuard } from '../../lib/fix-it/regression-guard';
import { resolveIndustryKey } from '../../lib/fix-it/cooldown-config';
import type { Anomaly, RcaHypothesis, PatchTicket, RcaContext } from '../../lib/fix-it/types';

// ─────────────────────────────────────────
// ① 이상 탐지 + RCA 가설 생성
// ─────────────────────────────────────────

export interface RunAutoRCAInput {
  workspaceId: string;
  observationRunId: string;
}

export interface RunAutoRCAResult {
  anomalies: Anomaly[];
  hypotheses: RcaHypothesis[];
  error?: string;
}

export async function runAutoRCA(input: RunAutoRCAInput): Promise<RunAutoRCAResult> {
  try {
    const { workspaceId, observationRunId } = input;
    const supabase = getSupabaseAdminClient();

    // 이상 탐지
    const detector = new AnomalyDetector();
    const anomalies = await detector.detect(workspaceId, observationRunId);

    if (anomalies.length === 0) {
      return { anomalies: [], hypotheses: [] };
    }

    // 컨텍스트 수집
    const context = await _buildRcaContext(workspaceId, supabase);

    // RCA 가설 생성
    const generator = new RcaGenerator();
    const hypotheses = await generator.generateHypotheses(workspaceId, anomalies, context);

    return { anomalies, hypotheses };
  } catch (err: any) {
    console.error('[runAutoRCA] error:', err.message);
    return { anomalies: [], hypotheses: [], error: err.message };
  }
}

// ─────────────────────────────────────────
// ④ 패치 승인 → 자동 적용 → 쿨다운 스케줄
// ─────────────────────────────────────────

export interface ApprovePatchInput {
  workspaceId: string;
  patchTicket: PatchTicket;
  panelId: string;
  industry?: string;
  approvedBy: string;
}

export interface ApprovePatchResult {
  success: boolean;
  retestScheduledAt?: string;
  cooldownDays?: number;
  error?: string;
}

export async function approvePatch(input: ApprovePatchInput): Promise<ApprovePatchResult> {
  try {
    const { workspaceId, patchTicket, panelId, industry, approvedBy } = input;

    // 승인 처리
    const ticket: PatchTicket = {
      ...patchTicket,
      status: 'approved',
      approved_by: approvedBy,
    };

    // 패치 적용
    const executor = new PatchExecutor();
    const result = await executor.execute(workspaceId, ticket);

    if (!result.success) {
      return { success: false, error: result.error_message };
    }

    // 쿨다운 스케줄 등록
    const scheduler = new RetestScheduler();
    const industryKey = resolveIndustryKey(industry);
    const schedule = await scheduler.schedule(
      workspaceId,
      patchTicket.id,
      panelId,
      industryKey,
      patchTicket.patch_type,
      result.applied_at,
    );

    return {
      success: true,
      retestScheduledAt: schedule.scheduled_at,
      cooldownDays: schedule.cooldown_days,
    };
  } catch (err: any) {
    console.error('[approvePatch] error:', err.message);
    return { success: false, error: err.message };
  }
}

// ─────────────────────────────────────────
// ⑦ 리테스트 실행
// ─────────────────────────────────────────

export interface ExecuteRetestInput {
  workspaceId: string;
}

export interface ExecuteRetestResult {
  executed: number;
  observationRunIds: string[];
  errors: string[];
}

export async function executeRetest(input: ExecuteRetestInput): Promise<ExecuteRetestResult> {
  const { workspaceId } = input;
  const scheduler = new RetestScheduler();
  const guard = new RegressionGuard();

  const pendingSchedules = await scheduler.getPendingSchedules(workspaceId);

  const observationRunIds: string[] = [];
  const errors: string[] = [];

  for (const schedule of pendingSchedules) {
    try {
      const runId = await scheduler.executeRetest(schedule);
      observationRunIds.push(runId);

      // 회귀 탐지
      const regressionAlerts = await guard.checkRegression(workspaceId, runId);
      if (regressionAlerts.length > 0) {
        console.warn(
          `[executeRetest] 회귀 탐지: ${regressionAlerts.length}개 경고 (runId: ${runId})`,
          regressionAlerts,
        );
      }
    } catch (err: any) {
      errors.push(`Schedule ${schedule.id}: ${err.message}`);
    }
  }

  return {
    executed: observationRunIds.length,
    observationRunIds,
    errors,
  };
}

// ─────────────────────────────────────────
// ⑨ 회귀 탐지
// ─────────────────────────────────────────

export async function checkRegression(workspaceId: string, newSnapshotId: string) {
  const guard = new RegressionGuard();
  return guard.checkRegression(workspaceId, newSnapshotId);
}

// ─────────────────────────────────────────
// Helper: RCA 컨텍스트 빌드
// ─────────────────────────────────────────

async function _buildRcaContext(workspaceId: string, supabase: any): Promise<RcaContext> {
  // SSoT 로드
  const { data: truths } = await supabase
    .from('brand_operational_truths')
    .select('claim, risk_level')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(10);

  // 최근 에이전트 실행 이력 (변경 이력 대용)
  const { data: recentRuns } = await supabase
    .from('agent_runs')
    .select('agent_name, created_at, status')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(5);

  // 과거 RCA 케이스 (agent_runs에서 fix_it 관련)
  const { data: pastRca } = await supabase
    .from('agent_runs')
    .select('output_payload, created_at')
    .eq('workspace_id', workspaceId)
    .like('agent_name', '%fix%')
    .order('created_at', { ascending: false })
    .limit(3);

  return {
    ssot_entries: (truths ?? []).map((t: any) => ({
      claim: t.claim,
      risk_level: t.risk_level,
    })),
    recent_changes: (recentRuns ?? []).map((r: any) => ({
      date: r.created_at?.slice(0, 10) ?? 'unknown',
      change_type: r.agent_name,
      description: `상태: ${r.status}`,
    })),
    past_rca_summaries: (pastRca ?? [])
      .map((r: any) => {
        const out = r.output_payload;
        return out ? `[${r.created_at?.slice(0, 10)}] ${JSON.stringify(out).slice(0, 100)}` : '';
      })
      .filter(Boolean),
  };
}
