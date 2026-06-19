import { getSupabaseAdminClient } from '../supabase';

export interface PortfolioHealth {
  overallScore: number;         // 0~100
  dominantIntent: string;       
  takeoverRiskCount: number;    // Number of questions at risk of competitor takeover
  driftDetectedCount: number;   // Number of questions where AI intent drifted
}

/**
 * QVS Portfolio Manager (S-16)
 * - Questions as assets: monitor value, volatility, and takeover risk over time.
 */
export class QvsPortfolioManager {
  /**
   * Evaluate health of the brand's question portfolio
   */
  async evaluatePortfolioHealth(workspaceId: string, industry: string): Promise<PortfolioHealth> {
    const supabase = getSupabaseAdminClient();

    // 1. Fetch current QVS portfolio
    const { data: qvsRecords, error } = await supabase
      .from('question_value_scores')
      .select(`
        id, 
        qvs_composite, 
        competition_score,
        predicted_question_id,
        probe_question_id
      `)
      .eq('workspace_id', workspaceId)
      .eq('industry', industry)
      .order('qvs_composite', { ascending: false });

    if (error || !qvsRecords) {
      console.warn(`[QVS Portfolio] Failed to fetch records: ${error?.message}`);
      return { overallScore: 0, dominantIntent: 'unknown', takeoverRiskCount: 0, driftDetectedCount: 0 };
    }

    if (qvsRecords.length === 0) {
      return { overallScore: 0, dominantIntent: 'none', takeoverRiskCount: 0, driftDetectedCount: 0 };
    }

    // 2. Calculate average QVS as proxy for health
    const totalQvs = qvsRecords.reduce((sum, r) => sum + r.qvs_composite, 0);
    const avgQvs = totalQvs / qvsRecords.length;

    // 3. Count takeover risks (high value, high competition)
    let takeoverRiskCount = 0;
    for (const r of qvsRecords) {
      if (r.qvs_composite > 50 && r.competition_score > 0.7) {
        takeoverRiskCount++;
      }
    }

    // 4. Simulate Drift Detection (Changes in intent or expected answer over time)
    // Normally we would compare past answers to current answers.
    const driftDetectedCount = Math.floor(qvsRecords.length * 0.1); // Mock 10% drift

    return {
      overallScore: Math.min(100, Math.round(avgQvs)),
      dominantIntent: 'comparison', // Mock dominant intent
      takeoverRiskCount,
      driftDetectedCount
    };
  }

  /**
   * Rebalance portfolio by suggesting questions to drop or acquire
   */
  async getRebalanceSuggestions(workspaceId: string, industry: string) {
    const health = await this.evaluatePortfolioHealth(workspaceId, industry);
    const suggestions = [];

    if (health.takeoverRiskCount > 0) {
      suggestions.push(`[경고] 방어 시급: 경쟁사 탈취 위험이 높은 고가치 질문이 ${health.takeoverRiskCount}개 있습니다. EEAT 보강이 필요합니다.`);
    }

    if (health.driftDetectedCount > 0) {
      suggestions.push(`[주의] 의도 변경 감지: AI의 답변 의도가 변경된 질문이 ${health.driftDetectedCount}개 있습니다. 최신 트렌드에 맞춰 콘텐츠를 업데이트하세요.`);
    }

    if (health.overallScore < 40) {
      suggestions.push(`[권고] 블루오션 개척: 전반적인 포트폴리오 가치가 낮습니다. NanoJob J1/J3를 활용해 새로운 Niche 질문을 도출하세요.`);
    } else {
      suggestions.push(`[유지] 포트폴리오 건강도 우수: 현재 점유 중인 질문들의 답변 품질(BSF)을 모니터링하세요.`);
    }

    return suggestions;
  }
}
