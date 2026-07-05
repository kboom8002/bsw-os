'use server';

/**
 * app/actions/fix-it-automation.ts
 *
 * Fix-It RCA ?뚯씠?꾨씪??Server Actions.
 *
 * - runAutoRCA:      ?댁긽 ?먯? ??RCA 媛???앹꽦 (?먮룞)
 * - approvePatch:    ?⑥튂 ?곗폆 ?뱀씤 ???먮룞 ?곸슜 ??荑⑤떎???ㅼ?以??깅줉
 * - executeRetest:   荑⑤떎??醫낅즺 ??由ы뀒?ㅽ듃 ?ㅽ뻾
 * - checkRegression: ??愿痢?寃곌낵濡??뚭? ?먯?
 */

import { getSupabaseAdminClient } from '../../lib/supabase';
import { AnomalyDetector } from '../../lib/fix-it/anomaly-detector';
import { RcaGenerator } from '../../lib/fix-it/rca-generator';
import { PatchExecutor } from '../../lib/fix-it/patch-executor';
import { RetestScheduler } from '../../lib/fix-it/retest-scheduler';
import { RegressionGuard } from '../../lib/fix-it/regression-guard';
import { resolveIndustryKey } from '../../lib/fix-it/cooldown-config';
import type { Anomaly, RcaHypothesis, PatchTicket, RcaContext } from '../../lib/fix-it/types';

// ?????????????????????????????????????????
// ???댁긽 ?먯? + RCA 媛???앹꽦
// ?????????????????????????????????????????

interface RunAutoRCAInput {
  workspaceId: string;
  observationRunId: string;
}

interface RunAutoRCAResult {
  anomalies: Anomaly[];
  hypotheses: RcaHypothesis[];
  error?: string;
}

export async function runAutoRCA(input: RunAutoRCAInput): Promise<RunAutoRCAResult> {
  try {
    const { workspaceId, observationRunId } = input;
    const supabase = getSupabaseAdminClient();

    // ?댁긽 ?먯?
    const detector = new AnomalyDetector();
    const anomalies = await detector.detect(workspaceId, observationRunId);

    if (anomalies.length === 0) {
      return { anomalies: [], hypotheses: [] };
    }

    // 而⑦뀓?ㅽ듃 ?섏쭛
    const context = await _buildRcaContext(workspaceId, supabase);

    // RCA 媛???앹꽦
    const generator = new RcaGenerator();
    const hypotheses = await generator.generateHypotheses(workspaceId, anomalies, context);

    return { anomalies, hypotheses };
  } catch (err: any) {
    console.error('[runAutoRCA] error:', err.message);
    return { anomalies: [], hypotheses: [], error: err.message };
  }
}

// ?????????????????????????????????????????
// ???⑥튂 ?뱀씤 ???먮룞 ?곸슜 ??荑⑤떎???ㅼ?以?
// ?????????????????????????????????????????

interface ApprovePatchInput {
  workspaceId: string;
  patchTicket: PatchTicket;
  panelId: string;
  industry?: string;
  approvedBy: string;
}

interface ApprovePatchResult {
  success: boolean;
  retestScheduledAt?: string;
  cooldownDays?: number;
  error?: string;
}

export async function approvePatch(input: ApprovePatchInput): Promise<ApprovePatchResult> {
  try {
    const { workspaceId, patchTicket, panelId, industry, approvedBy } = input;

    // ?뱀씤 泥섎━
    const ticket: PatchTicket = {
      ...patchTicket,
      status: 'approved',
      approved_by: approvedBy,
    };

    // ?⑥튂 ?곸슜
    const executor = new PatchExecutor();
    const result = await executor.execute(workspaceId, ticket);

    if (!result.success) {
      return { success: false, error: result.error_message };
    }

    // 荑⑤떎???ㅼ?以??깅줉
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

// ?????????????????????????????????????????
// ??由ы뀒?ㅽ듃 ?ㅽ뻾
// ?????????????????????????????????????????

interface ExecuteRetestInput {
  workspaceId: string;
}

interface ExecuteRetestResult {
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

      // ?뚭? ?먯?
      const regressionAlerts = await guard.checkRegression(workspaceId, runId);
      if (regressionAlerts.length > 0) {
        console.warn(
          `[executeRetest] ?뚭? ?먯?: ${regressionAlerts.length}媛?寃쎄퀬 (runId: ${runId})`,
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

// ?????????????????????????????????????????
// ???뚭? ?먯?
// ?????????????????????????????????????????

export async function checkRegression(workspaceId: string, newSnapshotId: string) {
  const guard = new RegressionGuard();
  return guard.checkRegression(workspaceId, newSnapshotId);
}

// ?????????????????????????????????????????
// Helper: RCA 而⑦뀓?ㅽ듃 鍮뚮뱶
// ?????????????????????????????????????????

async function _buildRcaContext(workspaceId: string, supabase: any): Promise<RcaContext> {
  // SSoT 濡쒕뱶
  const { data: truths } = await supabase
    .from('brand_operational_truths')
    .select('claim, risk_level')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(10);

  // 理쒓렐 ?먯씠?꾪듃 ?ㅽ뻾 ?대젰 (蹂寃??대젰 ???
  const { data: recentRuns } = await supabase
    .from('agent_runs')
    .select('agent_name, created_at, status')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(5);

  // 怨쇨굅 RCA 耳?댁뒪 (agent_runs?먯꽌 fix_it 愿??
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
      description: `?곹깭: ${r.status}`,
    })),
    past_rca_summaries: (pastRca ?? [])
      .map((r: any) => {
        const out = r.output_payload;
        return out ? `[${r.created_at?.slice(0, 10)}] ${JSON.stringify(out).slice(0, 100)}` : '';
      })
      .filter(Boolean),
  };
}
