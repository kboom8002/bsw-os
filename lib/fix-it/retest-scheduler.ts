/**
 * lib/fix-it/retest-scheduler.ts
 *
 * ⑥ 쿨다운 후 자동 리테스트 스케줄러.
 * 패치 적용 후 업종별 쿨다운이 지나면 Tier 3 Full Run을 자동 실행합니다.
 */

import { getSupabaseAdminClient } from '../supabase';
import { RepeatedRunner } from '../experiments/repeated-runner';
import { calcRetestScheduledAt, resolveIndustryKey, calcCooldownDays } from './cooldown-config';
import type { RetestSchedule, IndustryKey, PatchType } from './types';

export class RetestScheduler {
  private runner = new RepeatedRunner();

  /**
   * 패치 적용 후 리테스트를 스케줄링합니다.
   *
   * @param workspaceId    워크스페이스 ID
   * @param patchTicketId  패치 티켓 ID
   * @param panelId        리테스트에 사용할 프로브 패널 ID
   * @param industry       업종 키 (쿨다운 산출용)
   * @param patchType      패치 유형 (쿨다운 승수 결정)
   * @param patchAppliedAt 패치 적용 시각 (ISO 문자열)
   * @returns RetestSchedule
   */
  async schedule(
    workspaceId: string,
    patchTicketId: string,
    panelId: string,
    industry: string,
    patchType: PatchType,
    patchAppliedAt: string,
  ): Promise<RetestSchedule> {
    const industryKey = resolveIndustryKey(industry);
    const cooldownDays = calcCooldownDays(industryKey, patchType);
    const scheduledAt = calcRetestScheduledAt(patchAppliedAt, cooldownDays);

    const schedule: Omit<RetestSchedule, 'id'> = {
      workspace_id: workspaceId,
      patch_ticket_id: patchTicketId,
      panel_id: panelId,
      industry: industryKey,
      scheduled_at: scheduledAt,
      cooldown_days: cooldownDays,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    // DB에 저장 (retest_schedules 테이블 — 없으면 agent_runs에 기록)
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from('agent_runs')
      .insert({
        workspace_id: workspaceId,
        agent_name: 'retest_scheduler',
        input_payload: {
          ...schedule,
          type: 'retest_schedule',
        },
        status: 'candidate',
      })
      .select('id')
      .single();

    if (error) {
      console.error(`[RetestScheduler] schedule persist error: ${error.message}`);
    }

    const id = data?.id ?? `local-${Date.now()}`;
    console.info(
      `[RetestScheduler] 리테스트 스케줄 등록: ${id} — ${scheduledAt} (쿨다운: ${cooldownDays}일)`,
    );

    return { id, ...schedule };
  }

  /**
   * 스케줄된 리테스트를 즉시 실행합니다.
   * 실제 서비스에서는 크론잡/큐에서 scheduled_at 도달 시 호출합니다.
   *
   * @param schedule RetestSchedule 객체
   * @returns 생성된 Observation Run ID
   */
  async executeRetest(schedule: RetestSchedule): Promise<string> {
    const supabase = getSupabaseAdminClient();

    // agent_runs 상태 → running
    await supabase
      .from('agent_runs')
      .update({ status: 'active' })
      .eq('id', schedule.id);

    try {
      const result = await this.runner.run(
        schedule.workspace_id,
        schedule.panel_id,
        1,         // repetitions = 1 (리테스트는 1회)
        'intervention',
        { engines: [] },
      );

      // agent_runs 상태 → approved (완료)
      await supabase
        .from('agent_runs')
        .update({
          status: 'approved',
          output_payload: {
            retest_observation_run_id: result.observationRunId,
            total_runs: result.totalRuns,
            completed_at: new Date().toISOString(),
          },
        })
        .eq('id', schedule.id);

      console.info(`[RetestScheduler] 리테스트 완료: ${result.observationRunId}`);
      return result.observationRunId;
    } catch (err: any) {
      await supabase
        .from('agent_runs')
        .update({ status: 'quarantined', error_summary: err.message })
        .eq('id', schedule.id);
      throw err;
    }
  }

  /**
   * 실행 대기 중인 리테스트 스케줄을 조회합니다.
   * (현재 시각 기준 scheduled_at이 지난 pending 항목)
   */
  async getPendingSchedules(workspaceId: string): Promise<RetestSchedule[]> {
    const supabase = getSupabaseAdminClient();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('agent_runs')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('agent_name', 'retest_scheduler')
      .eq('status', 'candidate');

    if (error || !data) return [];

    return data
      .filter((row: any) => {
        const payload = row.input_payload || {};
        return payload.type === 'retest_schedule' &&
          payload.status === 'pending' &&
          payload.scheduled_at <= now;
      })
      .map((row: any) => ({
        id: row.id,
        ...row.input_payload,
      }));
  }
}
