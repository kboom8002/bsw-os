import { getSupabaseAdminClient } from '../supabase';
import { createQuestionSignal } from '../../app/actions/semantic';
import { getSignalMiningProvider } from './signal-mining-provider';


export interface MinerInput {
  sourceText: string;
  sourceDomain: string;
}

/**
 * Semantic Signal Mining Agent.
 * Crawls external forums or search portals to mine question signals
 * indicating customer intents (Question Capital candidates).
 * 
 * Safety Mandate: Logs every execution to the `agent_runs` traceability table
 * and operates strictly on 'candidate' status default boundaries.
 */
export async function runSemanticSignalMiner(workspaceId: string, input: MinerInput) {
  const supabase = getSupabaseAdminClient();

  // 1. Create audit trail of AI agent execution (starts as 'candidate' state!)
  const { data: agentRun, error: agentError } = await supabase
    .from('agent_runs')
    .insert({
      workspace_id: workspaceId,
      agent_name: 'Semantic Signal Mining Agent',
      input_payload: { sourceDomain: input.sourceDomain, textLength: input.sourceText.length },
      status: 'candidate',
    })
    .select()
    .single();

  if (agentError || !agentRun) {
    throw new Error(`CRITICAL SECURITY FAILURE: Agent execution logging failed - ${agentError?.message}`);
  }

  try {
    const miner = getSignalMiningProvider();
    const minedSignalsList = await miner.mineSignals(input.sourceDomain);

    const savedSignals = [];
    for (const item of minedSignalsList) {
      const signal = await createQuestionSignal(workspaceId, {
        query: item.query,
        volume: item.volume,
        intent: item.intent,
        status: 'mined' // Mined signal candidate state!
      });
      savedSignals.push(signal);
    }

    // 2. Mark the agent run audit state as ready
    await supabase
      .from('agent_runs')
      .update({
        output_payload: {
          extractedQueriesCount: minedSignalsList.length,
          signalIds: savedSignals.map(s => s.id)
        },
        status: 'draft'
      })
      .eq('id', agentRun.id);

    return {
      agentRunId: agentRun.id,
      extractedCount: minedSignalsList.length,
      signals: savedSignals
    };

  } catch (err: any) {
    // Quarantine agent run on structural parser exception
    await supabase
      .from('agent_runs')
      .update({
        status: 'quarantined',
        error_summary: err.message || 'Fatal crash during semantic signal mining routine.'
      })
      .eq('id', agentRun.id);

    throw err;
  }
}
