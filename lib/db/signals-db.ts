import { getSupabaseAdminClient } from '../supabase';

/**
 * Core DB execution layer for feeding benchmark opportunities to signals.
 * Bypasses HTTP-only Server Action authentication checks.
 */
export async function feedBenchmarkOpportunitiesToSignalsCore(
  workspaceId: string,
  opportunities: Array<{ query: string; intent: string; source: string }>
): Promise<{ fedCount: number; skippedCount: number; errors: string[] }> {
  const supabase = getSupabaseAdminClient();
  let fedCount = 0;
  let skippedCount = 0;
  const errors: string[] = [];

  for (const opp of opportunities) {
    try {
      // 중복 체크: 동일 query가 이미 존재하면 skip
      const { data: existing } = await supabase
        .from('question_signals')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('query', opp.query)
        .maybeSingle();

      if (existing) {
        skippedCount++;
        continue;
      }

      // 시그널 등록
      const signalData = {
        workspace_id: workspaceId,
        query: opp.query,
        volume: 0, // 추후 VolumeEstimator로 갱신
        intent: opp.intent || 'informational',
        status: 'mined' as const,
        source: opp.source,
      };

      const { error } = await supabase
        .from('question_signals')
        .insert(signalData);

      if (error) {
        errors.push(`Signal insert failed for "${opp.query}": ${error.message}`);
      } else {
        fedCount++;
      }
    } catch (err: any) {
      errors.push(`Error processing "${opp.query}": ${err.message}`);
    }
  }

  return { fedCount, skippedCount, errors };
}
