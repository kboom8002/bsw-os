/**
 * lib/experiments/sentinel-selector.ts
 *
 * Heartbeat Pulse를 위한 대표 질문(Sentinel) 자동 선정.
 *
 * 선정 전략 (5개):
 *   1. 가장 높은 weight의 질문  (핵심 질문)
 *   2. 가장 높은 과거 variance의 질문  (변동 민감 질문)
 *   3. risk_level='high'인 YMYL 질문  (안전 감시 질문)
 *   4. 경쟁사 비교(comparison) 의도 질문  (경쟁 감시 질문)
 *   5. 가장 최근 QVS S/A등급 예측 질문  (선점 감시 질문)
 */

import { getSupabaseAdminClient } from '../supabase';

export interface SentinelQuestion {
  id: string;
  question_text: string;
  question_type: string;
  risk_level: string;
  weight: number;
  intent_context: string;
  /** 선정 이유 */
  sentinel_role: 'highest_weight' | 'max_variance' | 'ymyl_safety' | 'competitor_monitor' | 'preemption_watch';
}

export interface SentinelConfig {
  selection_strategy: 'highest_weight' | 'max_variance' | 'strategic';
  sentinel_count: 5;
}

export class SentinelSelector {
  /**
   * 패널에서 5개 대표 질문을 선정합니다.
   *
   * @param workspaceId 워크스페이스 ID
   * @param panelId     프로브 패널 ID
   * @returns 선정된 Sentinel 질문 5개
   */
  async select(
    workspaceId: string,
    panelId: string,
  ): Promise<SentinelQuestion[]> {
    const supabase = getSupabaseAdminClient();

    // 패널의 전체 활성 질문 조회
    const { data: questions, error } = await supabase
      .from('probe_questions')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('probe_panel_id', panelId)
      .eq('lifecycle_status', 'active');

    if (error || !questions || questions.length === 0) {
      console.warn(`[SentinelSelector] 질문을 찾을 수 없습니다: panelId=${panelId}`);
      return [];
    }

    const selected: SentinelQuestion[] = [];
    const usedIds = new Set<string>();

    // ── 1. 가장 높은 weight 질문 (핵심 질문) ──
    const highestWeight = this._pickHighestWeight(questions, usedIds);
    if (highestWeight) {
      selected.push({ ...this._toSentinel(highestWeight), sentinel_role: 'highest_weight' });
      usedIds.add(highestWeight.id);
    }

    // ── 2. 과거 variance 최대 질문 (변동 민감 질문) ──
    // 과거 judge 결과에서 표준편차를 계산 (없으면 weight 하위 기준)
    const maxVariance = await this._pickMaxVariance(workspaceId, questions, usedIds);
    if (maxVariance) {
      selected.push({ ...this._toSentinel(maxVariance), sentinel_role: 'max_variance' });
      usedIds.add(maxVariance.id);
    }

    // ── 3. YMYL 안전 감시 질문 ──
    const ymyl = this._pickYmyl(questions, usedIds);
    if (ymyl) {
      selected.push({ ...this._toSentinel(ymyl), sentinel_role: 'ymyl_safety' });
      usedIds.add(ymyl.id);
    }

    // ── 4. 경쟁사 비교 질문 ──
    const competitor = this._pickCompetitor(questions, usedIds);
    if (competitor) {
      selected.push({ ...this._toSentinel(competitor), sentinel_role: 'competitor_monitor' });
      usedIds.add(competitor.id);
    }

    // ── 5. 선점 감시 질문 (QVS 예측 / 최근 등록된 질문) ──
    const preemption = this._pickPreemption(questions, usedIds);
    if (preemption) {
      selected.push({ ...this._toSentinel(preemption), sentinel_role: 'preemption_watch' });
      usedIds.add(preemption.id);
    }

    // 5개 미만이면 weight 높은 순으로 채움
    if (selected.length < 5) {
      const remaining = questions
        .filter((q: any) => !usedIds.has(q.id))
        .sort((a: any, b: any) => b.weight - a.weight);
      for (const q of remaining) {
        if (selected.length >= 5) break;
        selected.push({ ...this._toSentinel(q), sentinel_role: 'highest_weight' });
        usedIds.add(q.id);
      }
    }

    return selected.slice(0, 5);
  }

  // ─────────────────────────────────────────
  // Private selectors
  // ─────────────────────────────────────────

  private _pickHighestWeight(questions: any[], usedIds: Set<string>): any | null {
    return questions
      .filter((q: any) => !usedIds.has(q.id))
      .sort((a: any, b: any) => b.weight - a.weight)[0] ?? null;
  }

  private async _pickMaxVariance(
    workspaceId: string,
    questions: any[],
    usedIds: Set<string>,
  ): Promise<any | null> {
    const supabase = getSupabaseAdminClient();
    const eligible = questions.filter((q: any) => !usedIds.has(q.id));
    if (eligible.length === 0) return null;

    // response_judgments에서 brand_semantic_fidelity_score 표준편차 계산
    const variances: { id: string; variance: number }[] = [];

    for (const q of eligible.slice(0, 10)) {
      // 성능상 최대 10개만 계산
      const { data: judgments } = await supabase
        .from('response_judgments')
        .select('brand_semantic_fidelity_score')
        .in(
          'probe_run_id',
          (
            await supabase
              .from('probe_runs')
              .select('id')
              .eq('workspace_id', workspaceId)
              .eq('probe_question_id', q.id)
          ).data?.map((r: any) => r.id) ?? [],
        )
        .limit(20);

      if (!judgments || judgments.length < 2) {
        variances.push({ id: q.id, variance: 0 });
        continue;
      }

      const scores = judgments.map((j: any) => Number(j.brand_semantic_fidelity_score) || 0);
      const avg = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
      const variance =
        scores.reduce((a: number, b: number) => a + Math.pow(b - avg, 2), 0) / scores.length;
      variances.push({ id: q.id, variance });
    }

    const maxId = variances.sort((a, b) => b.variance - a.variance)[0]?.id;
    return eligible.find((q: any) => q.id === maxId) ?? eligible[0];
  }

  private _pickYmyl(questions: any[], usedIds: Set<string>): any | null {
    return (
      questions.find(
        (q: any) => !usedIds.has(q.id) && (q.is_ymyl || q.risk_level === 'high'),
      ) ?? null
    );
  }

  private _pickCompetitor(questions: any[], usedIds: Set<string>): any | null {
    const competitorKeywords = ['비교', '경쟁', 'vs', 'versus', 'compare', '대비'];
    return (
      questions.find(
        (q: any) =>
          !usedIds.has(q.id) &&
          competitorKeywords.some(
            (kw) =>
              q.question_text?.toLowerCase().includes(kw) ||
              q.intent_context?.toLowerCase().includes(kw),
          ),
      ) ?? null
    );
  }

  private _pickPreemption(questions: any[], usedIds: Set<string>): any | null {
    // 가장 최근 등록된 질문 (QVS 선점 후보)
    return (
      questions
        .filter((q: any) => !usedIds.has(q.id))
        .sort(
          (a: any, b: any) =>
            new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime(),
        )[0] ?? null
    );
  }

  private _toSentinel(q: any): Omit<SentinelQuestion, 'sentinel_role'> {
    return {
      id: q.id,
      question_text: q.question_text,
      question_type: q.question_type ?? 'standard',
      risk_level: q.risk_level ?? 'low',
      weight: q.weight ?? 1.0,
      intent_context: q.intent_context ?? '',
    };
  }
}
