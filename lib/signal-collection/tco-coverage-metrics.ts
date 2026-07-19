/**
 * lib/signal-collection/tco-coverage-metrics.ts
 *
 * S-OGDE v3.0 — TCO Coverage Metrics.
 * 수집된 시그널의 TCO 보캐뷸러리 커버리지를 측정합니다.
 */

import { getSupabaseAdminClient } from '../supabase';

export interface TcoCoverageReport {
  totalSignals: number;
  matchedSignals: number;
  coverage: number;              // matched / total (0.0 - 1.0)
  totalConcepts: number;
  usedConcepts: number;
  conceptUtilization: number;    // used / total (0.0 - 1.0)
  blindSpotSignals: string[];    // TCO 미매핑 시그널 (상위 20개)
  underutilizedConcepts: string[]; // 시그널에 매핑되지 않는 TCO
}

export class TcoCoverageMetrics {
  /**
   * 워크스페이스의 TCO ↔ 시그널 커버리지를 계산합니다.
   */
  static async calculate(workspaceId: string): Promise<TcoCoverageReport> {
    const supabase = getSupabaseAdminClient();

    // 1. 전체 시그널 조회
    const { data: signals } = await supabase
      .from('question_signals')
      .select('query, matched_tco_concepts')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(500);

    // 2. 전체 TCO 개념 조회
    const { data: concepts } = await supabase
      .from('tco_concepts')
      .select('concept_name')
      .eq('workspace_id', workspaceId);

    const allSignals = signals || [];
    const allConcepts = concepts || [];
    const totalSignals = allSignals.length;
    const totalConcepts = allConcepts.length;

    // 3. 매칭된 시그널 / 미매칭 시그널 분류
    const matchedSignals = allSignals.filter(
      s => s.matched_tco_concepts && (s.matched_tco_concepts as string[]).length > 0
    ).length;

    const blindSpotSignals = allSignals
      .filter(s => !s.matched_tco_concepts || (s.matched_tco_concepts as string[]).length === 0)
      .map(s => s.query)
      .slice(0, 20);

    // 4. 사용된 TCO 개념 집계
    const usedConceptSet = new Set<string>();
    for (const sig of allSignals) {
      if (sig.matched_tco_concepts) {
        for (const cName of (sig.matched_tco_concepts as string[])) {
          usedConceptSet.add(cName);
        }
      }
    }

    const usedConcepts = usedConceptSet.size;
    const underutilizedConcepts = allConcepts
      .filter(c => !usedConceptSet.has(c.concept_name))
      .map(c => c.concept_name);

    return {
      totalSignals,
      matchedSignals,
      coverage: totalSignals > 0 ? parseFloat((matchedSignals / totalSignals).toFixed(4)) : 0,
      totalConcepts,
      usedConcepts,
      conceptUtilization: totalConcepts > 0 ? parseFloat((usedConcepts / totalConcepts).toFixed(4)) : 0,
      blindSpotSignals,
      underutilizedConcepts,
    };
  }

  /**
   * 커버리지 리포트를 로그 문자열로 포맷합니다.
   */
  static formatReport(report: TcoCoverageReport): string {
    return [
      `[S-OGDE v3.0] TCO Coverage: ${(report.coverage * 100).toFixed(1)}% (${report.matchedSignals}/${report.totalSignals} signals mapped)`,
      `[S-OGDE v3.0] TCO Utilization: ${(report.conceptUtilization * 100).toFixed(1)}% (${report.usedConcepts}/${report.totalConcepts} concepts used)`,
      report.blindSpotSignals.length > 0
        ? `[S-OGDE v3.0] Blind-spot signals: ${report.blindSpotSignals.length} → Phase T enrichment target`
        : '[S-OGDE v3.0] No blind-spot signals — full TCO coverage achieved',
    ].join('\n');
  }
}
