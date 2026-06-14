/**
 * lib/experiments/escalation-engine.ts
 *
 * Tier 간 자동 에스컬레이션 엔진.
 *
 * 에스컬레이션 규칙:
 *   Tier1 none/minor    → 다음 Tier 1 유지
 *   Tier1 significant   → Tier 2 (Weekly Scan 앞당김)
 *   Tier1 critical      → Tier 3 (Full Run 즉시)
 *   Tier2 anomaly 없음  → Tier 1 복귀
 *   Tier2 anomaly 있음  → Tier 3 (Full Run)
 *   Tier3 → Fix-It RCA 파이프라인
 */

import type { HeartbeatResult, WeeklyScanResult, EscalationDecision, EscalationResult } from './types';

export type { EscalationResult };

export class EscalationEngine {
  /**
   * Heartbeat 결과를 기반으로 에스컬레이션을 결정합니다.
   */
  fromHeartbeat(heartbeat: HeartbeatResult): EscalationResult {
    if (heartbeat.change_severity === 'critical' || heartbeat.recommend_full_run) {
      return {
        decision: { tier: 3, reason: 'critical_change' },
        reason: `Heartbeat critical 변동 탐지: ${heartbeat.change_details ?? '위험 신호'}`,
        execute_immediately: true,
      };
    }

    if (heartbeat.change_severity === 'significant' || heartbeat.recommend_weekly_scan) {
      return {
        decision: { tier: 2, reason: 'significant_change' },
        reason: `Heartbeat significant 변동 탐지: ${heartbeat.change_details ?? '이상 감지'}`,
        recommended_engines: ['chatgpt_search', 'perplexity_search'],
        execute_immediately: true,
      };
    }

    return {
      decision: { tier: 1, reason: 'no_change' },
      reason: `변동 없음 (severity: ${heartbeat.change_severity})`,
      execute_immediately: false,
    };
  }

  /**
   * Weekly Scan 결과를 기반으로 에스컬레이션을 결정합니다.
   */
  fromWeeklyScan(scan: WeeklyScanResult): EscalationResult {
    if (scan.recommend_full_run) {
      return {
        decision: { tier: 3, reason: 'anomaly_detected' },
        reason: `Weekly Scan에서 critical 이상 탐지 → Tier 3 Full Run 즉시 실행`,
        execute_immediately: true,
      };
    }

    if (scan.recommend_fix_it) {
      return {
        decision: { tier: 3, reason: 'anomaly_detected' },
        reason: `Weekly Scan에서 이상 탐지 → Tier 3 Full Run 권고`,
        execute_immediately: false,
      };
    }

    return {
      decision: { tier: 1, reason: 'no_change' },
      reason: `Weekly Scan 정상 — Tier 1 Heartbeat로 복귀`,
      execute_immediately: false,
    };
  }

  /**
   * 정기 스케줄에 따른 에스컬레이션을 결정합니다.
   *
   * @param lastHeartbeatAt  마지막 Heartbeat 실행 시각
   * @param lastWeeklyScanAt 마지막 Weekly Scan 실행 시각
   * @param lastFullRunAt    마지막 Full Run 실행 시각
   */
  fromSchedule(
    lastHeartbeatAt: string | null,
    lastWeeklyScanAt: string | null,
    lastFullRunAt: string | null,
  ): EscalationResult {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const oneWeekMs = 7 * oneDayMs;
    const oneMonthMs = 30 * oneDayMs;

    // Full Run: 1개월 이상 경과
    if (
      !lastFullRunAt ||
      now - new Date(lastFullRunAt).getTime() >= oneMonthMs
    ) {
      return {
        decision: { tier: 3, reason: 'scheduled_monthly' },
        reason: '월간 정기 Full Run 실행 시점',
        execute_immediately: true,
      };
    }

    // Weekly Scan: 1주일 이상 경과
    if (
      !lastWeeklyScanAt ||
      now - new Date(lastWeeklyScanAt).getTime() >= oneWeekMs
    ) {
      return {
        decision: { tier: 2, reason: 'scheduled_weekly' },
        reason: '주간 정기 Weekly Scan 실행 시점',
        recommended_engines: ['chatgpt_search', 'perplexity_search'],
        execute_immediately: true,
      };
    }

    // Heartbeat: 1일 이상 경과
    if (
      !lastHeartbeatAt ||
      now - new Date(lastHeartbeatAt).getTime() >= oneDayMs
    ) {
      return {
        decision: { tier: 1, reason: 'no_change' },
        reason: '일간 Heartbeat 실행 시점',
        execute_immediately: true,
      };
    }

    return {
      decision: { tier: 1, reason: 'no_change' },
      reason: '모든 Tier 최신 상태 — 대기',
      execute_immediately: false,
    };
  }

  /**
   * 에스컬레이션 결정을 사람이 읽을 수 있는 형태로 포맷합니다.
   */
  format(result: EscalationResult): string {
    const tierEmoji = { 1: '💓', 2: '📊', 3: '🔬' };
    const tier = result.decision.tier;
    return `${tierEmoji[tier]} Tier ${tier} — ${result.reason}${result.execute_immediately ? ' [즉시 실행]' : ''}`;
  }
}
