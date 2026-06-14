/**
 * lib/fix-it/anomaly-detector.ts
 *
 * ① 이상 탐지 엔진 — Observation Run 결과를 분석하여 이상 지표를 자동 탐지.
 *
 * 탐지 규칙:
 *   critical: M1<0.60, M3<0.65, M4>0.15, M6>0.10, M9>0.30, M10<0.70
 *   warning:  M7<0.70, M8>0.20, AAS<40, BSF<50
 */

import { getSupabaseAdminClient } from '../supabase';
import type { Anomaly } from './types';

interface AnomalyRule {
  metric_name: string;
  threshold: number;
  direction: 'above' | 'below';
  severity: 'warning' | 'critical';
}

const ANOMALY_RULES: AnomalyRule[] = [
  { metric_name: 'M1_concept_transfer',    threshold: 0.60, direction: 'below', severity: 'critical' },
  { metric_name: 'M3_brand_fidelity',      threshold: 0.65, direction: 'below', severity: 'critical' },
  { metric_name: 'M4_distortion',          threshold: 0.15, direction: 'above', severity: 'critical' },
  { metric_name: 'M6_hallucination',       threshold: 0.10, direction: 'above', severity: 'critical' },
  { metric_name: 'M9_floor_risk',          threshold: 0.30, direction: 'above', severity: 'critical' },
  { metric_name: 'M10_policy_compliance',  threshold: 0.70, direction: 'below', severity: 'critical' },
  { metric_name: 'M7_stability',           threshold: 0.70, direction: 'below', severity: 'warning'  },
  { metric_name: 'M8_drift',               threshold: 0.20, direction: 'above', severity: 'warning'  },
  { metric_name: 'AAS',                    threshold: 40,   direction: 'below', severity: 'warning'  },
  { metric_name: 'BSF',                    threshold: 50,   direction: 'below', severity: 'warning'  },
];

export class AnomalyDetector {
  /**
   * Observation Run 결과를 분석하여 이상 지표를 자동 탐지합니다.
   *
   * @param workspaceId 워크스페이스 ID
   * @param snapshotId  분석할 Observation Run ID
   * @returns 탐지된 이상 목록 (critical 우선 정렬)
   */
  async detect(workspaceId: string, snapshotId: string): Promise<Anomaly[]> {
    const supabase = getSupabaseAdminClient();

    // 1. 해당 Run의 Response Judgments 조회
    const { data: judgments, error } = await supabase
      .from('response_judgments')
      .select('*')
      .eq('workspace_id', workspaceId)
      .in(
        'probe_run_id',
        // 서브쿼리: 해당 observation run의 probe_run id 목록
        (await supabase
          .from('probe_runs')
          .select('id')
          .eq('workspace_id', workspaceId)
          .eq('ai_observation_run_id', snapshotId)
        ).data?.map((r: any) => r.id) ?? [],
      );

    if (error || !judgments || judgments.length === 0) {
      console.warn(`[AnomalyDetector] No judgments found for run ${snapshotId}`);
      return [];
    }

    // 2. 지표별 평균값 계산
    const metrics = this._aggregateMetrics(judgments);

    // 3. 규칙 기반 이상 탐지
    const anomalies: Anomaly[] = [];

    for (const rule of ANOMALY_RULES) {
      const value = metrics[rule.metric_name];
      if (value === undefined) continue;

      const violated =
        rule.direction === 'above' ? value > rule.threshold : value < rule.threshold;

      if (violated) {
        anomalies.push({
          metric_name: rule.metric_name,
          current_value: value,
          threshold: rule.threshold,
          severity: rule.severity,
          direction: rule.direction,
          affected_concepts: this._extractAffectedConcepts(judgments, rule.metric_name),
        });
      }
    }

    // critical 우선 정렬
    return anomalies.sort((a, b) => {
      if (a.severity === 'critical' && b.severity !== 'critical') return -1;
      if (b.severity === 'critical' && a.severity !== 'critical') return 1;
      return 0;
    });
  }

  /**
   * judgment 데이터에서 각 지표 평균을 집계합니다.
   */
  private _aggregateMetrics(judgments: any[]): Record<string, number> {
    const n = judgments.length;
    if (n === 0) return {};

    const sum: Record<string, number> = {};
    const count: Record<string, number> = {};

    for (const j of judgments) {
      // Response Judgment 필드 → 지표 매핑
      const fieldMap: Record<string, string> = {
        geo_concept_transferred:        'M1_concept_transfer',    // boolean → 0/1
        brand_semantic_fidelity_score:  'M3_brand_fidelity',
        distortion_flag:                'M4_distortion',          // boolean
        hallucination_risk_score:       'M6_hallucination',
        brand_answer_share_score:       'AAS',
        brand_semantic_fidelity_score2: 'BSF',
      };

      // 직접 필드 매핑
      const addMetric = (metricName: string, raw: any) => {
        const val = typeof raw === 'boolean' ? (raw ? 1 : 0) : Number(raw);
        if (isNaN(val)) return;
        sum[metricName] = (sum[metricName] ?? 0) + val;
        count[metricName] = (count[metricName] ?? 0) + 1;
      };

      if (j.geo_concept_transferred !== undefined)
        addMetric('M1_concept_transfer', j.geo_concept_transferred);
      if (j.brand_semantic_fidelity_score !== undefined)
        addMetric('M3_brand_fidelity', Number(j.brand_semantic_fidelity_score) / 100);
      if (j.distortion_flag !== undefined)
        addMetric('M4_distortion', j.distortion_flag ? 1 : 0);
      if (j.hallucination_risk_score !== undefined)
        addMetric('M6_hallucination', Number(j.hallucination_risk_score) / 100);
      if (j.brand_answer_share_score !== undefined)
        addMetric('AAS', Number(j.brand_answer_share_score));
      if (j.brand_semantic_fidelity_score !== undefined)
        addMetric('BSF', Number(j.brand_semantic_fidelity_score));
    }

    const avg: Record<string, number> = {};
    for (const key of Object.keys(sum)) {
      avg[key] = sum[key] / (count[key] || 1);
    }
    return avg;
  }

  /**
   * 특정 지표 이상과 관련된 개념 목록을 추출합니다.
   */
  private _extractAffectedConcepts(judgments: any[], metricName: string): string[] {
    const concepts = new Set<string>();
    for (const j of judgments) {
      // 판정 메타데이터 또는 레이블에서 개념 추출 (존재할 경우)
      if (j.affected_concepts && Array.isArray(j.affected_concepts)) {
        j.affected_concepts.forEach((c: string) => concepts.add(c));
      }
      if (j.distortion_details && metricName === 'M4_distortion') {
        const details = typeof j.distortion_details === 'string'
          ? JSON.parse(j.distortion_details)
          : j.distortion_details;
        if (Array.isArray(details)) {
          details.forEach((d: any) => d.concept && concepts.add(d.concept));
        }
      }
    }
    return [...concepts].slice(0, 10);
  }
}
