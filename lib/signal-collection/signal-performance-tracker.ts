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
   * 시그널 승격 시 성과 추적 초기 등록
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
        console.warn('[SignalPerformanceTracker] Insert deferred:', error.message);
      }
    } catch (e: any) {
      console.warn('[SignalPerformanceTracker] Init failed:', e.message);
    }
  }

  /**
   * 30일 누적 성과 업데이트 및 Realized Value 계산
   */
  static async updatePerformance(signalId: string, metrics: Partial<SignalPerformance>): Promise<void> {
    const supabase = getSupabaseAdminClient();
    try {
      // 실현 가치 공식: (클릭 수 * 2.0) + (전환 수 * 50.0) + (AI 언급률 * 100.0)
      const clicks = metrics.clicks_30d || 0;
      const conv = metrics.actual_conversion || 0;
      const mention = metrics.ai_mention_rate || 0;
      const realizedValue = (clicks * 2.0) + (conv * 50.0) + (mention * 100.0);

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
   * Google Search Console 데이터(external_signals)로부터 성과 인입
   */
  public static async ingestFromGSC(workspaceId: string): Promise<number> {
    const supabase = getSupabaseAdminClient();
    try {
      // 1. GSC 시그널 조회
      const { data: gscSignals } = await supabase
        .from('external_signals')
        .select('content, metadata')
        .eq('workspace_id', workspaceId)
        .eq('source_type', 'gsc_query');

      if (!gscSignals || gscSignals.length === 0) return 0;

      // 2. 추적 대상 시그널과 매칭 및 업데이트
      const { data: tracked } = await supabase
        .from('signal_performance_tracking')
        .select('signal_id, question_signals(query)')
        .eq('workspace_id', workspaceId);

      if (!tracked || tracked.length === 0) return 0;

      let updatedCount = 0;

      for (const t of tracked) {
        const sig = t.question_signals as any;
        const query = sig?.query;
        if (!query) continue;

        // 동일 쿼리 검색
        const match = gscSignals.find(s => s.content.trim().toLowerCase() === query.trim().toLowerCase());
        if (match) {
          const clicks = match.metadata?.clicks || 0;
          const impressions = match.metadata?.impressions || 0;
          
          await this.updatePerformance(t.signal_id, {
            clicks_30d: clicks,
            impressions_30d: impressions
          });
          updatedCount++;
        }
      }

      return updatedCount;
    } catch (err: any) {
      console.warn('[SignalPerformanceTracker] GSC performance ingest failed:', err.message);
      return 0;
    }
  }

  /**
   * AI Mention/Citation 메트릭 인입 (Observatory AI Probes 결과)
   */
  public static async ingestFromProbes(workspaceId: string): Promise<number> {
    const supabase = getSupabaseAdminClient();
    try {
      // 1. 브랜드 정보(이름, aliases) 조회
      const { data: brands } = await supabase
        .from('brands')
        .select('name, aliases')
        .eq('workspace_id', workspaceId);

      if (!brands || brands.length === 0) return 0;
      
      const brandEntities = brands.flatMap(b => [b.name, ...(b.aliases || [])]).filter(Boolean);

      // 2. 최근 프로브 실행 데이터와 추적 대상 시그널 매칭
      const { data: tracked } = await supabase
        .from('signal_performance_tracking')
        .select('signal_id, question_signals(query)')
        .eq('workspace_id', workspaceId);

      if (!tracked || tracked.length === 0) return 0;

      let updatedCount = 0;

      for (const t of tracked) {
        const sig = t.question_signals as any;
        const query = sig?.query;
        if (!query) continue;

        // 해당 쿼리로 실행된 프로브 런 조회 (최근 5회)
        const { data: runs } = await supabase
          .from('probe_runs')
          .select('raw_response_text')
          .eq('workspace_id', workspaceId)
          .ilike('query', `%${query}%`)
          .order('created_at', { ascending: false })
          .limit(5);

        if (runs && runs.length > 0) {
          // 브랜드명이 포함된 비중을 AI Mention Rate로 산출
          const mentionCount = runs.filter(r => {
            const text = (r.raw_response_text || '').toLowerCase();
            return brandEntities.some(ent => text.includes(ent.toLowerCase()));
          }).length;

          const mentionRate = mentionCount / runs.length;
          
          await this.updatePerformance(t.signal_id, {
            ai_mention_rate: mentionRate
          });
          updatedCount++;
        }
      }

      return updatedCount;
    } catch (err: any) {
      console.warn('[SignalPerformanceTracker] Probe performance ingest failed:', err.message);
      return 0;
    }
  }

  /**
   * 실제 행동 전환 수(Conversion) 인입
   */
  public static async ingestFromOutcomes(workspaceId: string): Promise<number> {
    const supabase = getSupabaseAdminClient();
    try {
      // outcome_events 테이블 조회
      const { data: tracked } = await supabase
        .from('signal_performance_tracking')
        .select('signal_id, question_signals(query)')
        .eq('workspace_id', workspaceId);

      if (!tracked || tracked.length === 0) return 0;

      let updatedCount = 0;

      for (const t of tracked) {
        const sig = t.question_signals as any;
        const query = sig?.query;
        if (!query) continue;

        // 해당 쿼리 유입을 통한 전환 수 계산 (가상의 outcome_events 쿼리)
        const { data: events } = await supabase
          .from('outcome_events')
          .select('count')
          .eq('workspace_id', workspaceId)
          .eq('event_type', 'conversion')
          .eq('attribution_query', query)
          .maybeSingle();

        if (events) {
          await this.updatePerformance(t.signal_id, {
            actual_conversion: events.count || 0
          });
          updatedCount++;
        }
      }

      return updatedCount;
    } catch (err: any) {
      console.warn('[SignalPerformanceTracker] Outcome performance ingest failed (non-blocking):', err.message);
      return 0;
    }
  }

  /**
   * 성과 데이터를 기반으로 QVS 차원별 최적의 가중치를 역산 학습 (온라인 피드백 루프)
   *
   * [v2.0] 단순 공분산 대신 Ridge Regression 규제화 선형 회귀 적용으로 
   * 다중공선성 문제를 해결하고 가중치 스코어 정합성 대폭 향상.
   */
  static async learnWeights(workspaceId: string): Promise<Record<string, number> | null> {
    const supabase = getSupabaseAdminClient();
    try {
      // 1. 성과가 기록된 레코드 획득
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
        return null;
      }

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

      if (X.length < 8) return null; // 최소 8개 샘플 필요

      // 2. Ridge Regression 실행 (L2 규제상수 lambda = 1.0)
      const learned = this.solveRidgeRegression(X, Y, 1.0);
      
      const keys = [
        'relevance', 'specificity', 'urgency', 'opportunity', 
        'conversion', 'snippet_fitness', 'entity_clarity', 'multi_engine_consistency'
      ];

      const weights: Record<string, number> = {};
      
      // 가중치가 양수가 되도록 강제하고 정규화 처리
      const positiveWeights = learned.map(w => Math.max(0.01, w));
      const totalWeight = positiveWeights.reduce((s, val) => s + val, 0);

      keys.forEach((key, idx) => {
        weights[key] = parseFloat((positiveWeights[idx] / totalWeight).toFixed(4));
      });

      return weights;
    } catch (e) {
      console.warn('[SignalPerformanceTracker] Weight learning failed:', e);
      return null;
    }
  }

  /**
   * Ridge Regression Solver (L2 규제 선형 회귀)
   * w = (X^T * X + lambda * I)^-1 * X^T * Y
   */
  private static solveRidgeRegression(X: number[][], Y: number[], lambda: number): number[] {
    const N = X.length;
    const M = X[0].length;

    // 1. X^T (M x N) 생성
    const XT: number[][] = Array.from({ length: M }, () => new Array(N).fill(0));
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < M; j++) {
        XT[j][i] = X[i][j];
      }
    }

    // 2. XTX = X^T * X (M x M) 곱셈
    const XTX: number[][] = Array.from({ length: M }, () => new Array(M).fill(0));
    for (let i = 0; i < M; i++) {
      for (let j = 0; j < M; j++) {
        let sum = 0;
        for (let k = 0; k < N; k++) {
          sum += XT[i][k] * X[k][j];
        }
        XTX[i][j] = sum;
      }
    }

    // 3. X^T * X + lambda * I 규제 추가
    for (let i = 0; i < M; i++) {
      XTX[i][i] += lambda;
    }

    // 4. XTY = X^T * Y (M x 1) 곱셈
    const XTY: number[] = new Array(M).fill(0);
    for (let i = 0; i < M; i++) {
      let sum = 0;
      for (let k = 0; k < N; k++) {
        sum += XT[i][k] * Y[k];
      }
      XTY[i] = sum;
    }

    // 5. Gauss-Jordan Elimination으로 XTX 행렬 역행렬 계산 및 곱셈
    // XTX 행렬을 [XTX | I] 형태로 확장 (M x 2M)
    const augmented: number[][] = Array.from({ length: M }, () => new Array(2 * M).fill(0));
    for (let i = 0; i < M; i++) {
      for (let j = 0; j < M; j++) {
        augmented[i][j] = XTX[i][j];
      }
      augmented[i][M + i] = 1.0;
    }

    for (let i = 0; i < M; i++) {
      // 피벗 행 찾기
      let maxVal = Math.abs(augmented[i][i]);
      let pivotRow = i;
      for (let k = i + 1; k < M; k++) {
        if (Math.abs(augmented[k][i]) > maxVal) {
          maxVal = Math.abs(augmented[k][i]);
          pivotRow = k;
        }
      }

      // 행 교환
      const temp = augmented[pivotRow];
      augmented[pivotRow] = augmented[i];
      augmented[i] = temp;

      // 대각선 1 정규화
      const diag = augmented[i][i];
      if (Math.abs(diag) < 1e-9) {
        throw new Error('[RidgeRegression] Singular matrix error.');
      }
      for (let j = 0; j < 2 * M; j++) {
        augmented[i][j] /= diag;
      }

      // 타행 소거
      for (let k = 0; k < M; k++) {
        if (k !== i) {
          const factor = augmented[k][i];
          for (let j = 0; j < 2 * M; j++) {
            augmented[k][j] -= factor * augmented[i][j];
          }
        }
      }
    }

    // 역행렬 추출
    const inv: number[][] = Array.from({ length: M }, () => new Array(M).fill(0));
    for (let i = 0; i < M; i++) {
      for (let j = 0; j < M; j++) {
        inv[i][j] = augmented[i][M + j];
      }
    }

    // w = inv * XTY
    const w: number[] = new Array(M).fill(0);
    for (let i = 0; i < M; i++) {
      let sum = 0;
      for (let j = 0; j < M; j++) {
        sum += inv[i][j] * XTY[j];
      }
      w[i] = sum;
    }

    return w;
  }
}
