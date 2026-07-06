import { getSupabaseAdminClient } from '../supabase';
import { HubFeedbackPayload, FeedbackProcessResult } from './types';
import { feedBenchmarkOpportunitiesToSignalsCore } from '../db/signals-db';

export class FeedbackProcessor {
  /**
   * AI Hub로부터 수신한 피드백 데이터를 파이프라인 데이터베이스에 처리하여 환류시킵니다.
   */
  static async processIncoming(
    workspaceId: string,
    payload: HubFeedbackPayload,
    industryKey: string
  ): Promise<FeedbackProcessResult> {
    const supabase = getSupabaseAdminClient();
    const result: FeedbackProcessResult = {
      newSignals: 0,
      cpsUpdated: 0,
      errors: []
    };

    // 1. 검색 패턴 -> 신규 시그널 피딩 (unresolved 및 matched_count >= 2 필터)
    try {
      const candidates = (payload.search_patterns || [])
        .filter(p => !p.resolved && p.matched_count >= 2)
        .map(p => ({
          query: p.query,
          intent: 'informational',
          source: 'hub_feedback' // 피드백 출처 식별자
        }));

      if (candidates.length > 0) {
        const feedResult = await feedBenchmarkOpportunitiesToSignalsCore(workspaceId, candidates);
        result.newSignals = feedResult.fedCount;
        if (feedResult.errors.length > 0) {
          result.errors.push(...feedResult.errors);
        }
      }
    } catch (err: any) {
      result.errors.push(`Failed to feed signals: ${err.message}`);
    }

    // 2. CQ 소비 조회수 -> CPS 점수 보정 (+0.1 * view_count_24h, 최대 10점 상한)
    try {
      const topCqs = payload.top_cqs || [];
      for (const cq of topCqs) {
        if (!cq.bsw_question_id) continue;

        // 기존 CQ 조회
        const { data: existingCq, error: getCqError } = await supabase
          .from('canonical_questions')
          .select('id, cps_score, metadata')
          .eq('id', cq.bsw_question_id)
          .eq('workspace_id', workspaceId)
          .maybeSingle();

        if (getCqError || !existingCq) continue;

        // 점수 보정 계산
        const currentCps = existingCq.cps_score ?? 50;
        const viewBoost = Math.min((cq.view_count_24h || 0) * 0.1, 10.0);
        const newCps = Math.min(100.0, currentCps + viewBoost);

        // 메타데이터 업데이트
        const metadata = {
          ...(existingCq.metadata || {}),
          hub_view_count_24h: cq.view_count_24h,
          hub_arena_thread_reply_count: cq.arena_thread_reply_count,
          last_feedback_at: new Date().toISOString()
        };

        const { error: updateCqError } = await supabase
          .from('canonical_questions')
          .update({
            cps_score: newCps,
            metadata
          })
          .eq('id', cq.bsw_question_id);

        if (updateCqError) {
          result.errors.push(`Failed to update CPS for CQ ${cq.bsw_question_id}: ${updateCqError.message}`);
        } else {
          result.cpsUpdated++;
        }
      }
    } catch (err: any) {
      result.errors.push(`Failed to update CQ scores: ${err.message}`);
    }

    // 3. Arena Top Answers를 CQ 메타데이터에 기록
    try {
      const arenaAnswers = payload.arena_top_answers || [];
      for (const answer of arenaAnswers) {
        // 타이틀이 정확하게 일치하는 CQ를 찾습니다.
        const { data: matchedCq } = await supabase
          .from('canonical_questions')
          .select('id, metadata')
          .eq('normalized_question', answer.thread_title)
          .eq('workspace_id', workspaceId)
          .maybeSingle();

        if (matchedCq) {
          const metadata = {
            ...(matchedCq.metadata || {}),
            hub_arena_elo: answer.elo_score,
            hub_arena_helpful_ratio: answer.helpful_ratio,
            hub_best_layer: answer.best_layer
          };

          await supabase
            .from('canonical_questions')
            .update({ metadata })
            .eq('id', matchedCq.id);
        }
      }
    } catch (err: any) {
      result.errors.push(`Failed to record arena answers: ${err.message}`);
    }

    // 4. 피드백 로그 상태 업데이트 (processed = true)
    try {
      const { error: logUpdateError } = await supabase
        .from('hub_feedback_logs')
        .update({
          processed: true,
          process_result: result
        })
        .eq('workspace_id', workspaceId)
        .eq('region', payload.region)
        .eq('feedback_date', payload.date);

      if (logUpdateError) {
        console.error(`[FeedbackProcessor] Log update error: ${logUpdateError.message}`);
      }
    } catch (err: any) {
      console.error(`[FeedbackProcessor] Failed to update process log: ${err.message}`);
    }

    return result;
  }
}
