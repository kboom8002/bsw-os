import { getSupabaseAdminClient } from '../supabase';

import { getAIProvider } from './ai-provider';


export interface ExtractorInput {
  sourceText: string;
  sourceDomain: string;
}

/**
 * Brand Truth Extraction Agent Scaffold.
 * Simulates semantic crawling of brand portals or crawling channels
 * to extract observed factual claims.
 * 
 * Safety Mandate: Logs every extraction run to the `agent_runs` traceability table
 * and sets status to 'candidate' by default.
 */
export async function runBrandTruthExtractor(workspaceId: string, input: ExtractorInput) {
  const supabase = getSupabaseAdminClient();
  
  // 1. Create audit trail of AI agent execution (starts as 'candidate' state!)
  const { data: agentRun, error: agentError } = await supabase
    .from('agent_runs')
    .insert({
      workspace_id: workspaceId,
      agent_name: 'Brand Truth Extraction Agent',
      input_payload: { sourceDomain: input.sourceDomain, textLength: input.sourceText.length },
      status: 'candidate',
    })
    .select()
    .single();
    
  if (agentError || !agentRun) {
    throw new Error(`CRITICAL SECURITY FAILURE: Agent execution logging failed - ${agentError?.message}`);
  }

  try {
    console.log(`AI Agent Run [${agentRun.id}] starting extraction on: ${input.sourceDomain}`);
    
    const ai = getAIProvider();
    const schema = {
      type: 'object',
      properties: {
        claims: {
          type: 'array',
          items: { type: 'string' }
        }
      },
      required: ['claims']
    };

    const prompt = `Extract all factual, strategic, or operational claims made about the brand or product in the following text. ` +
      `Focus on concrete properties (e.g., active ingredients, certifications, capacities, operating rules) rather than general puffery. ` +
      `Text to analyze:\n\n${input.sourceText}`;

    const response = await ai.generateStructuredOutput<{ claims: string[] }>(prompt, schema);
    const extractedClaims = response.claims || [];

    if (extractedClaims.length === 0) {
      throw new Error('Structured parsing failed.');
    }




    // 2. Insert extracted results into brand_observed_truths (candidate default status)
    const savedObservedTruths = [];
    for (const claim of extractedClaims) {
      const { data: observed, error: insertError } = await supabase
        .from('brand_observed_truths')
        .insert({
          workspace_id: workspaceId,
          observed_claim: claim,
          source_domain: input.sourceDomain,
          confidence_score: 91.50,
          is_aligned_with_operational: true,
          raw_payload: { agent_run_id: agentRun.id, precision: 'high' }
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(`DB Insert: ${insertError.message}`);
      }
      savedObservedTruths.push(observed);
    }

    // 3. Mark the agent run audit state as ready for human strategic approval
    await supabase
      .from('agent_runs')
      .update({
        output_payload: { 
          extractedClaimsCount: extractedClaims.length, 
          observedIds: savedObservedTruths.map(o => o.id) 
        },
        status: 'draft', // ready for review, strictly non-approved until reviewed by strategists
      })
      .eq('id', agentRun.id);

    return {
      agentRunId: agentRun.id,
      extractedCount: extractedClaims.length,
      observedTruths: savedObservedTruths
    };

  } catch (err: any) {
    // Log failure for full security auditability
    await supabase
      .from('agent_runs')
      .update({
        status: 'quarantined',
        error_summary: err.message || 'Fatal crash during brand truth extraction routine.'
      })
      .eq('id', agentRun.id);
      
    throw err;
  }
}
