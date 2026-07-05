'use server';

/**
 * app/actions/monitoring.ts
 *
 * 3-Tier 痢≪젙 泥닿퀎 Server Actions.
 *
 * - runHeartbeat:      Tier 1 ?쇨컙 寃쎈웾 痢≪젙 ?ㅽ뻾
 * - runWeeklyScan:     Tier 2 二쇨컙 ?쒖? 痢≪젙 ?ㅽ뻾
 * - runEscalationCheck: ?ㅼ?以?湲곕컲 ?먯뒪而щ젅?댁뀡 ?먮룞 寃곗젙
 * - runProxyValidation: Tier 援먯감 寃利?
 */

import { HeartbeatPulse } from '../../lib/experiments/heartbeat-pulse';
import { WeeklyScan } from '../../lib/experiments/weekly-scan';
import { EscalationEngine } from '../../lib/experiments/escalation-engine';
import { ProxyValidator } from '../../lib/experiments/proxy-validator';
import { RepeatedRunner } from '../../lib/experiments/repeated-runner';
import type { HeartbeatResult, WeeklyScanResult, EscalationResult, ProxyValidation } from '../../lib/experiments/types';
import { getSupabaseAdminClient } from '../../lib/supabase';

// ?????????????????????????????????????????
// Tier 1: Heartbeat Pulse
// ?????????????????????????????????????????

interface RunHeartbeatInput {
  workspaceId: string;
  panelId: string;
  engineName?: string;
  brandKeywords?: string[];
  competitorKeywords?: string[];
}

interface RunHeartbeatResult {
  heartbeat?: HeartbeatResult;
  escalation?: EscalationResult;
  error?: string;
}

export async function runHeartbeat(input: RunHeartbeatInput): Promise<RunHeartbeatResult> {
  try {
    const { workspaceId, panelId, engineName, brandKeywords = [], competitorKeywords = [] } = input;

    // ?댁쟾 Heartbeat 寃곌낵 議고쉶 (蹂???먯???
    const { previousAas, previousBsf } = await _fetchPreviousHeartbeatMetrics(workspaceId);

    const pulse = new HeartbeatPulse();
    const heartbeat = await pulse.run(
      workspaceId,
      panelId,
      engineName,
      brandKeywords,
      competitorKeywords,
      previousAas,
      previousBsf,
    );

    // ?먯뒪而щ젅?댁뀡 寃곗젙
    const escalationEngine = new EscalationEngine();
    const escalation = escalationEngine.fromHeartbeat(heartbeat);

    console.info(`[runHeartbeat] ${escalationEngine.format(escalation)}`);

    return { heartbeat, escalation };
  } catch (err: any) {
    console.error('[runHeartbeat] error:', err.message);
    return { error: err.message };
  }
}

// ?????????????????????????????????????????
// Tier 2: Weekly Scan
// ?????????????????????????????????????????

interface RunWeeklyScanInput {
  workspaceId: string;
  panelId: string;
  engines?: [string, string];
}

interface RunWeeklyScanResult {
  scan?: WeeklyScanResult;
  escalation?: EscalationResult;
  error?: string;
}

export async function runWeeklyScan(input: RunWeeklyScanInput): Promise<RunWeeklyScanResult> {
  try {
    const {
      workspaceId,
      panelId,
      engines = ['chatgpt_search', 'perplexity_search'],
    } = input;

    const scanner = new WeeklyScan();
    const scan = await scanner.run(workspaceId, panelId, engines as [string, string]);

    // ?먯뒪而щ젅?댁뀡 寃곗젙
    const escalationEngine = new EscalationEngine();
    const escalation = escalationEngine.fromWeeklyScan(scan);

    console.info(`[runWeeklyScan] ${escalationEngine.format(escalation)}`);

    // Tier 3 利됱떆 ?ㅽ뻾 沅뚭퀬 ????Tier 3 ?먮룞 ?ㅽ뻾
    if (escalation.execute_immediately && escalation.decision.tier === 3) {
      console.info('[runWeeklyScan] Tier 3 Full Run ?먮룞 ?먯뒪而щ젅?댁뀡 ?ㅽ뻾...');
      const runner = new RepeatedRunner();
      await runner.run(workspaceId, panelId, 1, 'baseline', {
        engines: escalation.recommended_engines ?? [],
      });
    }

    return { scan, escalation };
  } catch (err: any) {
    console.error('[runWeeklyScan] error:', err.message);
    return { error: err.message };
  }
}

// ?????????????????????????????????????????
// ?ㅼ?以?湲곕컲 ?먯뒪而щ젅?댁뀡 ?먮룞 寃곗젙
// ?????????????????????????????????????????

interface RunEscalationCheckInput {
  workspaceId: string;
  panelId: string;
}

interface RunEscalationCheckResult {
  escalation?: EscalationResult;
  triggered_tier?: number;
  error?: string;
}

export async function runEscalationCheck(
  input: RunEscalationCheckInput,
): Promise<RunEscalationCheckResult> {
  try {
    const { workspaceId, panelId } = input;
    const supabase = getSupabaseAdminClient();

    // 留덉?留?媛?Tier ?ㅽ뻾 ?쒓컖 議고쉶
    const { data: runs } = await supabase
      .from('ai_observation_runs')
      .select('run_metadata, created_at')
      .eq('workspace_id', workspaceId)
      .eq('probe_panel_id', panelId)
      .order('created_at', { ascending: false })
      .limit(20);

    let lastHeartbeat: string | null = null;
    let lastWeekly: string | null = null;
    let lastFull: string | null = null;

    for (const run of runs ?? []) {
      const tier = run.run_metadata?.tier;
      if (tier === 1 && !lastHeartbeat) lastHeartbeat = run.created_at;
      if (tier === 2 && !lastWeekly) lastWeekly = run.created_at;
      if (tier === 3 && !lastFull) lastFull = run.created_at;
    }

    const engine = new EscalationEngine();
    const escalation = engine.fromSchedule(lastHeartbeat, lastWeekly, lastFull);

    console.info(`[runEscalationCheck] ${engine.format(escalation)}`);

    let triggered_tier: number | undefined;

    if (escalation.execute_immediately) {
      triggered_tier = escalation.decision.tier;

      if (escalation.decision.tier === 1) {
        // Heartbeat ?ㅽ뻾
        const pulse = new HeartbeatPulse();
        await pulse.run(workspaceId, panelId);
      } else if (escalation.decision.tier === 2) {
        const scanner = new WeeklyScan();
        await scanner.run(
          workspaceId,
          panelId,
          (escalation.recommended_engines as [string, string]) ?? ['chatgpt_search', 'perplexity_search'],
        );
      } else if (escalation.decision.tier === 3) {
        const runner = new RepeatedRunner();
        await runner.run(workspaceId, panelId, 3, 'baseline');
      }
    }

    return { escalation, triggered_tier };
  } catch (err: any) {
    console.error('[runEscalationCheck] error:', err.message);
    return { error: err.message };
  }
}

// ?????????????????????????????????????????
// Proxy 援먯감 寃利?
// ?????????????????????????????????????????

interface RunProxyValidationInput {
  workspaceId: string;
  panelId: string;
  tier1RunIds: string[];
  tier2RunIds: string[];
  tier3RunIds: string[];
}

export async function runProxyValidation(
  input: RunProxyValidationInput,
): Promise<{ validation?: ProxyValidation; error?: string }> {
  try {
    const { workspaceId, panelId, tier1RunIds, tier2RunIds, tier3RunIds } = input;
    const validator = new ProxyValidator();
    const validation = await validator.validate(
      workspaceId,
      panelId,
      tier1RunIds,
      tier2RunIds,
      tier3RunIds,
    );
    return { validation };
  } catch (err: any) {
    console.error('[runProxyValidation] error:', err.message);
    return { error: err.message };
  }
}

// ?????????????????????????????????????????
// Helper
// ?????????????????????????????????????????

async function _fetchPreviousHeartbeatMetrics(
  workspaceId: string,
): Promise<{ previousAas?: number; previousBsf?: number }> {
  const supabase = getSupabaseAdminClient();

  const { data: prevRun } = await supabase
    .from('ai_observation_runs')
    .select('id, run_metadata')
    .eq('workspace_id', workspaceId)
    .contains('run_metadata', { tier: 1 })
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!prevRun) return {};

  const meta = prevRun.run_metadata as any;
  return {
    previousAas: meta?.aas_lite,
    previousBsf: meta?.bsf_lite,
  };
}
