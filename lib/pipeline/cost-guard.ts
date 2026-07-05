/**
 * lib/pipeline/cost-guard.ts
 *
 * 일일 LLM API 사용 비용 한도를 추적하고 제어하는 가드 모듈.
 * pipeline_runs 테이블의 result_summary->estimated_cost 값을 오늘 날짜 기준으로 집계합니다.
 */

import { getSupabaseAdminClient } from '../supabase';

export class CostGuard {
  /**
   * 오늘 하루 동안 특정 워크스페이스 및 도메인에서 사용된 예상 비용(USD)을 조회합니다.
   */
  static async getTodayCost(workspaceId: string, domainKey: string): Promise<number> {
    try {
      const supabase = getSupabaseAdminClient();
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      // 오늘 날짜 이후의 해당 워크스페이스, 도메인의 실행 이력 조회
      const { data: runs, error } = await supabase
        .from('pipeline_runs')
        .select('result_summary')
        .eq('workspace_id', workspaceId)
        .eq('domain_key', domainKey)
        .gte('started_at', todayStart.toISOString());

      if (error || !runs) {
        console.warn(`[CostGuard] Failed to fetch today's runs:`, error?.message);
        return 0;
      }

      let totalCost = 0;
      for (const run of runs) {
        const summary = run.result_summary as any;
        if (summary && typeof summary.estimated_cost === 'number') {
          totalCost += summary.estimated_cost;
        }
      }

      return totalCost;
    } catch (err: any) {
      console.error(`[CostGuard] Error in getTodayCost:`, err.message);
      return 0;
    }
  }

  /**
   * 실행 비용을 현재 실행(runId) 레코드에 누적 기록합니다.
   */
  static async trackCost(workspaceId: string, domainKey: string, costToAdd: number, runId?: string): Promise<void> {
    if (!runId) return;

    try {
      const supabase = getSupabaseAdminClient();

      // 기존 run 정보 획득
      const { data: run, error: getError } = await supabase
        .from('pipeline_runs')
        .select('result_summary')
        .eq('id', runId)
        .maybeSingle();

      if (getError || !run) {
        console.warn(`[CostGuard] Failed to fetch current run:`, getError?.message);
        return;
      }

      const summary = (run.result_summary as any) || {};
      const currentCost = typeof summary.estimated_cost === 'number' ? summary.estimated_cost : 0;
      summary.estimated_cost = currentCost + costToAdd;

      // 비용 업데이트
      await supabase
        .from('pipeline_runs')
        .update({ result_summary: summary })
        .eq('id', runId);

    } catch (err: any) {
      console.error(`[CostGuard] Error in trackCost:`, err.message);
    }
  }
}
