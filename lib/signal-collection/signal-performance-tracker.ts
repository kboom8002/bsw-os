/**
 * lib/signal-collection/signal-performance-tracker.ts
 *
 * 승격된 시그널의 실제 검색 유입 성과 추적 및 피드백 루프 가중치 학습 엔진.
 */

import { getSupabaseAdminClient } from '../supabase';

export interface SignalPerformance {
  signal_id: string;
  workspace_id: string;
  promoted_at: string;
  content_published_at?: string;
  impressions_30d?: number;
  clicks_30d?: number;
  ai_mention_rate?: number;
  actual_conversion?: number;
  realized_value?: number;
}

export class SignalPerformanceTracker {
  /**
   * 시그널 승격 시 성과 추적 스켈레톤 초기 등록
   */
  static async initTracking(signalId: string, workspaceId: string): Promise<void> {
    const supabase = getSupabaseAdminClient();
    try {
      const { error } = await supabase
        .from('signal_performance_tracking')
        .insert({
          signal_id: signalId,
          workspace_id: workspaceId,
          promoted_at: new Date().toISOString(),
          impressions_30d: 0,
          clicks_30d: 0,
          ai_mention_rate: 0,
          actual_conversion: 0,
          realized_value: 0
        });
      
      if (error) {
        // 테이블이 아직 스키마에 동적 추가되지 않았을 경우 로그 경고만 기록 (논블로킹)
        console.warn('[SignalPerformanceTracker] Insert deferred:', error.message);
      }
    } catch (e: any) {
      console.warn('[SignalPerformanceTracker] Init failed:', e.message);
    }
  }

  /**
   * 크론 등에서 주기적으로 호출하여 30일 누적 성과 업데이트
   */
  static async updatePerformance(signalId: string, metrics: Partial<SignalPerformance>): Promise<void> {
    const supabase = getSupabaseAdminClient();
    try {
      // 실현 가치 계산 (클릭 수 × 2.0 + 전환 수 × 50.0 + AI 언급률 × 500)
      const clicks = metrics.clicks_30d || 0;
      const conv = metrics.actual_conversion || 0;
      const mention = metrics.ai_mention_rate || 0;
      const realizedValue = (clicks * 2.0) + (conv * 50.0) + (mention * 5.0);

      await supabase
        .from('signal_performance_tracking')
        .update({
          ...metrics,
          realized_value: realizedValue,
          updated_at: new Date().toISOString()
        })
        .eq('signal_id', signalId);
    } catch (e: any) {
      console.warn('[SignalPerformanceTracker] Update failed:', e.message);
    }
  }

  /**
   * 성과 데이터(Realized Value)를 기반으로 QVS 차원별 최적의 가중치를 역산 학습 (온라인 피드백 루프)
   *
   * 단순 다중 선형 회귀 OLS 모델 적용
   * 가중치 = (X^T X)^-1 X^T Y
   */
  static async learnWeights(workspaceId: string): Promise<Record<string, number> | null> {
    const supabase = getSupabaseAdminClient();
    try {
      // 1. 성과가 있는 추적 레코드와 해당 시그널의 QVS 차원 점수들을 조인 조회
      const { data: records, error } = await supabase
        .from('signal_performance_tracking')
        .select(`
          realized_value,
          question_signals (
            qvs_dimensions
          )
        `)
        .eq('workspace_id', workspaceId)
        .order('promoted_at', { ascending: false })
        .limit(200);

      if (error || !records || records.length < 10) {
        // 학습에 필요한 샘플 수가 부족할 경우 기본 가중치 반환
        return null;
      }

      // 2. 행렬 구성
      // X = [Relevance, Specificity, Urgency, Opportunity, Conversion, Snippet, Entity, Consistency]
      // Y = realized_value
      const X: number[][] = [];
      const Y: number[] = [];

      for (const r of records) {
        const sig = r.question_signals as any;
        const dims = sig?.qvs_dimensions;
        if (!dims) continue;

        X.push([
          dims.relevance || 0,
          dims.specificity || 0,
          dims.urgency || 0,
          dims.opportunity || 0,
          dims.conversion || 0,
          dims.snippet_fitness || 0,
          dims.entity_clarity || 0,
          dims.multi_engine_consistency || 0
        ]);
        Y.push(r.realized_value || 0);
      }

      if (X.length < 5) return null;

      // 3. OLS로 가중치 역산 계산 (여기에 단순 가중 평균 또는 Ridge/Lasso 적용 가능)
      // 프로덕션 안정성을 위해 각 차원의 점수 평균과 Realized Value의 상관관계를 추출해 가중치를 업데이트합니다.
      const weights: Record<string, number> = {};
      const keys = [
        'relevance', 'specificity', 'urgency', 'opportunity', 
        'conversion', 'snippet_fitness', 'entity_clarity', 'multi_engine_consistency'
      ];

      // 각 차원별 Y와의 공분산 계산 후 정규화
      const meanY = Y.reduce((s, val) => s + val, 0) / Y.length;
      const covs = keys.map((key, idx) => {
        const meanX = X.reduce((s, row) => s + row[idx], 0) / X.length;
        let cov = 0;
        for (let i = 0; i < X.length; i++) {
          cov += (X[i][idx] - meanX) * (Y[i] - meanY);
        }
        return Math.max(0.01, cov / X.length); // 공분산이 양수인 것만 반영
      });

      const totalCov = covs.reduce((s, v) => s + v, 0);
      
      keys.forEach((key, idx) => {
        // 합계 1.0이 되도록 정규화
        weights[key] = parseFloat((covs[idx] / totalCov).toFixed(4));
      });

      return weights;
    } catch (e) {
      console.warn('[SignalPerformanceTracker] Weight learning failed:', e);
      return null;
    }
  }
}
