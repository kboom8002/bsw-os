/**
 * lib/fix-it/regression-guard.ts
 *
 * ⑨ 회귀 방지 가드레일.
 * 리테스트 pass 이후 해당 지표를 자동 감시 대상에 등록하고,
 * 새로운 관측 결과와 비교하여 회귀를 탐지합니다.
 */

import { getSupabaseAdminClient } from '../supabase';
import { AnomalyDetector } from './anomaly-detector';
import type { GuardrailConfig, RegressionAlert } from './types';

export class RegressionGuard {
  private anomalyDetector = new AnomalyDetector();

  /**
   * 리테스트 pass 이후 해당 지표를 자동 감시 대상에 등록합니다.
   *
   * @param workspaceId    워크스페이스 ID
   * @param retestRunId    리테스트 Observation Run ID
   * @param guardrailConfig 가드레일 설정
   */
  async registerGuardrail(
    workspaceId: string,
    retestRunId: string,
    guardrailConfig: GuardrailConfig,
  ): Promise<void> {
    const supabase = getSupabaseAdminClient();

    const payload: GuardrailConfig = {
      ...guardrailConfig,
      workspace_id: workspaceId,
      retest_run_id: retestRunId,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('agent_runs')
      .insert({
        workspace_id: workspaceId,
        agent_name: 'regression_guard',
        input_payload: {
          type: 'guardrail_config',
          ...payload,
        },
        status: 'active',
      });

    if (error) {
      console.error(`[RegressionGuard] registerGuardrail error: ${error.message}`);
      throw new Error(`가드레일 등록 실패: ${error.message}`);
    }

    console.info(
      `[RegressionGuard] 가드레일 등록: ${guardrailConfig.metric_name} ` +
      `(floor: ${guardrailConfig.floor_value}, ceiling: ${guardrailConfig.ceiling_value ?? 'N/A'})`,
    );
  }

  /**
   * 새로운 관측 결과와 가드레일을 비교하여 회귀를 탐지합니다.
   *
   * @param workspaceId   워크스페이스 ID
   * @param newSnapshotId 새로운 Observation Run ID
   * @returns 회귀 알림 목록 (severity 내림차순)
   */
  async checkRegression(
    workspaceId: string,
    newSnapshotId: string,
  ): Promise<RegressionAlert[]> {
    const supabase = getSupabaseAdminClient();

    // 1. 등록된 가드레일 목록 조회
    const { data: guardRuns, error } = await supabase
      .from('agent_runs')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('agent_name', 'regression_guard')
      .eq('status', 'active');

    if (error || !guardRuns || guardRuns.length === 0) {
      return [];
    }

    const guardrails: GuardrailConfig[] = guardRuns
      .filter((r: any) => r.input_payload?.type === 'guardrail_config')
      .map((r: any) => r.input_payload as GuardrailConfig);

    // 2. 새 스냅샷의 지표 집계 (AnomalyDetector 재활용)
    const newAnomalies = await this.anomalyDetector.detect(workspaceId, newSnapshotId);
    const newMetrics: Record<string, number> = {};
    for (const a of newAnomalies) {
      newMetrics[a.metric_name] = a.current_value;
    }

    // 3. 가드레일과 비교
    const alerts: RegressionAlert[] = [];
    const now = new Date().toISOString();

    for (const guard of guardrails) {
      const currentValue = newMetrics[guard.metric_name];
      if (currentValue === undefined) continue;

      // floor 위반
      if (currentValue < guard.floor_value - guard.tolerance) {
        alerts.push({
          guardrail_id: guard.id ?? 'unknown',
          metric_name: guard.metric_name,
          previous_value: guard.floor_value,
          current_value: currentValue,
          violation_type: 'floor',
          severity: currentValue < guard.floor_value - guard.tolerance * 2 ? 'critical' : 'warning',
          detected_at: now,
        });
      }

      // ceiling 위반
      if (guard.ceiling_value !== undefined && currentValue > guard.ceiling_value + guard.tolerance) {
        alerts.push({
          guardrail_id: guard.id ?? 'unknown',
          metric_name: guard.metric_name,
          previous_value: guard.ceiling_value,
          current_value: currentValue,
          violation_type: 'ceiling',
          severity: currentValue > guard.ceiling_value + guard.tolerance * 2 ? 'critical' : 'warning',
          detected_at: now,
        });
      }
    }

    return alerts.sort((a, b) => {
      if (a.severity === 'critical' && b.severity !== 'critical') return -1;
      if (b.severity === 'critical' && a.severity !== 'critical') return 1;
      return 0;
    });
  }

  /**
   * 워크스페이스의 활성 가드레일 목록을 조회합니다.
   */
  async listGuardrails(workspaceId: string): Promise<GuardrailConfig[]> {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from('agent_runs')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('agent_name', 'regression_guard')
      .eq('status', 'active');

    if (error || !data) return [];

    return data
      .filter((r: any) => r.input_payload?.type === 'guardrail_config')
      .map((r: any) => ({ id: r.id, ...(r.input_payload as GuardrailConfig) }));
  }

  /**
   * 가드레일을 비활성화합니다.
   */
  async deactivateGuardrail(guardrailId: string): Promise<void> {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase
      .from('agent_runs')
      .update({ status: 'quarantined' })
      .eq('id', guardrailId);
    if (error) throw new Error(`가드레일 비활성화 실패: ${error.message}`);
  }
}
