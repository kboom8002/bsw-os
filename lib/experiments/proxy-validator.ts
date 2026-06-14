/**
 * lib/experiments/proxy-validator.ts
 *
 * Proxy 정확도 교차 검증.
 *
 * 목표:
 *   Tier 1 ↔ Tier 3: AAS 상관 ≥ 0.85, 변동 탐지 재현율 ≥ 0.90, 오경보율 ≤ 0.15
 *   Tier 2 ↔ Tier 3: M1 ≥ 0.90, M3 ≥ 0.90, M4 ≥ 0.85, M6 ≥ 0.85
 */

import { getSupabaseAdminClient } from '../supabase';
import type { ProxyValidation } from './types';

export class ProxyValidator {
  /**
   * Tier 1/2 vs Tier 3 교차 검증을 수행합니다.
   * 같은 패널에서 세 Tier를 동시 실행한 결과를 비교합니다.
   *
   * @param workspaceId     워크스페이스 ID
   * @param panelId         비교할 프로브 패널 ID
   * @param tier1RunIds     Heartbeat Observation Run ID 목록
   * @param tier2RunIds     Weekly Scan Observation Run ID 목록
   * @param tier3RunIds     Full Run Observation Run ID 목록
   */
  async validate(
    workspaceId: string,
    panelId: string,
    tier1RunIds: string[],
    tier2RunIds: string[],
    tier3RunIds: string[],
  ): Promise<ProxyValidation> {
    const supabase = getSupabaseAdminClient();
    const now = new Date().toISOString();

    // 각 Tier의 지표 집계
    const [metrics1, metrics2, metrics3] = await Promise.all([
      this._aggregateRunMetrics(supabase, workspaceId, tier1RunIds),
      this._aggregateRunMetrics(supabase, workspaceId, tier2RunIds),
      this._aggregateRunMetrics(supabase, workspaceId, tier3RunIds),
    ]);

    const sampleSize = Math.min(
      tier1RunIds.length,
      tier2RunIds.length,
      tier3RunIds.length,
    );

    // Tier 1 ↔ Tier 3
    const aas1 = metrics1.map((m) => m.aas);
    const aas3 = metrics3.map((m) => m.aas);
    const aas_correlation = this._pearsonR(aas1, aas3);

    const changeDetected1 = metrics1.map((m) => m.change_flag);
    const changeDetected3 = metrics3.map((m) => m.anomaly_flag);
    const change_detection_recall = this._recall(changeDetected1, changeDetected3);
    const false_alarm_rate = this._falseAlarmRate(changeDetected1, changeDetected3);

    // Tier 2 ↔ Tier 3
    const m1_2 = metrics2.map((m) => m.m1);
    const m1_3 = metrics3.map((m) => m.m1);
    const m3_2 = metrics2.map((m) => m.m3);
    const m3_3 = metrics3.map((m) => m.m3);
    const m4_2 = metrics2.map((m) => m.m4);
    const m4_3 = metrics3.map((m) => m.m4);
    const m6_2 = metrics2.map((m) => m.m6);
    const m6_3 = metrics3.map((m) => m.m6);

    const validation: ProxyValidation = {
      heartbeat_vs_full: {
        aas_correlation: parseFloat(aas_correlation.toFixed(4)),
        change_detection_recall: parseFloat(change_detection_recall.toFixed(4)),
        false_alarm_rate: parseFloat(false_alarm_rate.toFixed(4)),
      },
      weekly_vs_full: {
        m1_correlation: parseFloat(this._pearsonR(m1_2, m1_3).toFixed(4)),
        m3_correlation: parseFloat(this._pearsonR(m3_2, m3_3).toFixed(4)),
        m4_correlation: parseFloat(this._pearsonR(m4_2, m4_3).toFixed(4)),
        m6_correlation: parseFloat(this._pearsonR(m6_2, m6_3).toFixed(4)),
      },
      evaluated_at: now,
      sample_size: sampleSize,
      is_valid: this._checkGoals(aas_correlation, change_detection_recall, false_alarm_rate, m1_2, m1_3, m3_2, m3_3, m4_2, m4_3, m6_2, m6_3),
    };

    console.info('[ProxyValidator] 교차 검증 결과:', JSON.stringify(validation, null, 2));
    return validation;
  }

  // ─────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────

  private async _aggregateRunMetrics(
    supabase: any,
    workspaceId: string,
    runIds: string[],
  ): Promise<{ aas: number; m1: number; m3: number; m4: number; m6: number; change_flag: boolean; anomaly_flag: boolean }[]> {
    if (runIds.length === 0) return [];

    const results = [];

    for (const runId of runIds) {
      // probe_runs 조회
      const { data: probeRuns } = await supabase
        .from('probe_runs')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('ai_observation_run_id', runId);

      const probeRunIds = (probeRuns ?? []).map((r: any) => r.id);
      if (probeRunIds.length === 0) {
        results.push({ aas: 0, m1: 0, m3: 0, m4: 0, m6: 0, change_flag: false, anomaly_flag: false });
        continue;
      }

      // response_judgments 조회
      const { data: judgments } = await supabase
        .from('response_judgments')
        .select('*')
        .eq('workspace_id', workspaceId)
        .in('probe_run_id', probeRunIds);

      if (!judgments || judgments.length === 0) {
        results.push({ aas: 0, m1: 0, m3: 0, m4: 0, m6: 0, change_flag: false, anomaly_flag: false });
        continue;
      }

      const n = judgments.length;
      const aas = judgments.reduce((acc: number, j: any) => acc + Number(j.brand_answer_share_score ?? 0), 0) / n;
      const m1 = judgments.filter((j: any) => j.geo_concept_transferred).length / n;
      const m3 = judgments.reduce((acc: number, j: any) => acc + Number(j.brand_semantic_fidelity_score ?? 0), 0) / n / 100;
      const m4 = judgments.filter((j: any) => j.distortion_flag).length / n;
      const m6 = judgments.reduce((acc: number, j: any) => acc + Number(j.hallucination_risk_score ?? 0), 0) / n / 100;

      const anomaly_flag = m4 > 0.15 || m6 > 0.10 || m1 < 0.60;
      const change_flag = aas < 40 || m3 < 0.65;

      results.push({ aas, m1, m3, m4, m6, change_flag, anomaly_flag });
    }

    return results;
  }

  /** Pearson 상관계수 계산 */
  private _pearsonR(a: number[], b: number[]): number {
    const n = Math.min(a.length, b.length);
    if (n < 2) return 0;

    const meanA = a.slice(0, n).reduce((s, v) => s + v, 0) / n;
    const meanB = b.slice(0, n).reduce((s, v) => s + v, 0) / n;

    let num = 0, stdA = 0, stdB = 0;
    for (let i = 0; i < n; i++) {
      const da = a[i] - meanA;
      const db = b[i] - meanB;
      num += da * db;
      stdA += da * da;
      stdB += db * db;
    }

    const denom = Math.sqrt(stdA * stdB);
    return denom === 0 ? 0 : num / denom;
  }

  /** 변동 탐지 재현율: Tier3에서 변동이 있을 때 Tier1도 탐지한 비율 */
  private _recall(pred: boolean[], truth: boolean[]): number {
    const n = Math.min(pred.length, truth.length);
    if (n === 0) return 0;
    let tp = 0, fn = 0;
    for (let i = 0; i < n; i++) {
      if (truth[i] && pred[i]) tp++;
      if (truth[i] && !pred[i]) fn++;
    }
    return tp + fn === 0 ? 1 : tp / (tp + fn);
  }

  /** 오경보율: Tier3에서 정상일 때 Tier1이 변동 탐지한 비율 */
  private _falseAlarmRate(pred: boolean[], truth: boolean[]): number {
    const n = Math.min(pred.length, truth.length);
    if (n === 0) return 0;
    let fp = 0, tn = 0;
    for (let i = 0; i < n; i++) {
      if (!truth[i] && pred[i]) fp++;
      if (!truth[i] && !pred[i]) tn++;
    }
    return fp + tn === 0 ? 0 : fp / (fp + tn);
  }

  private _checkGoals(
    aas_r: number, recall: number, far: number,
    m1_2: number[], m1_3: number[],
    m3_2: number[], m3_3: number[],
    m4_2: number[], m4_3: number[],
    m6_2: number[], m6_3: number[],
  ): boolean {
    return (
      aas_r >= 0.85 &&
      recall >= 0.90 &&
      far <= 0.15 &&
      this._pearsonR(m1_2, m1_3) >= 0.90 &&
      this._pearsonR(m3_2, m3_3) >= 0.90 &&
      this._pearsonR(m4_2, m4_3) >= 0.85 &&
      this._pearsonR(m6_2, m6_3) >= 0.85
    );
  }
}
