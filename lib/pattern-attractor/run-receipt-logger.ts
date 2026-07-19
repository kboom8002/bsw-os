import { getSupabaseAdminClient } from '../supabase';
import { RunReceipt, GapType } from './types';

export class RunReceiptLogger {
  // Logs a new Run-Receipt to the database
  static async logReceipt(workspaceId: string, receipt: RunReceipt): Promise<string> {
    const supabase = getSupabaseAdminClient();

    // Look up domain_id and target UUIDs if possible
    // Let's resolve domain UUID from domains table slug
    const { data: domainRec } = await supabase
      .from('domains')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('slug', receipt.context_tensor.domain)
      .limit(1)
      .maybeSingle();

    const domainUuid = domainRec?.id || null;

    // Resolve media_soliton_id if provided
    const mediaSolitonId = receipt.output_variant || null;

    const payload = {
      workspace_id: workspaceId,
      session_id: receipt.session_id,
      brand_id: receipt.brand_id || null, // Use actual brand_id from receipt, not domain slug
      domain_id: domainUuid,
      attractor_id: receipt.attractor_id,
      input_query: receipt.input_query,
      concept_state: receipt.concept_state,
      context_tensor: receipt.context_tensor,
      vibe_spec: receipt.vibe_spec,
      action_policy: {},
      output_variant: receipt.output_variant,
      channel_type: receipt.channel_type,
      media_soliton_id: mediaSolitonId,
      cta_shown: receipt.cta_shown,
      cta_clicked: receipt.cta_clicked,
      user_behavior: receipt.user_behavior,
      human_feedback: receipt.human_feedback,
      detected_gaps: receipt.detected_gaps || [],
      attractor_fit_score: receipt.scores.attractor_fit,
      vibe_alignment_score: receipt.scores.vibe_alignment,
      policy_compliance_score: receipt.scores.policy_compliance
    };

    const { data, error } = await supabase
      .from('run_receipts')
      .insert(payload)
      .select('id')
      .single();

    if (error) {
      console.error('Failed to log run receipt:', error);
      throw new Error(`RunReceiptLogger: DB error - ${error.message}`);
    }

    // Update attractor stats incrementing activation count (atomic increment)
    try {
      // Priority 1: Atomic RPC increment
      const { error: rpcErr } = await supabase.rpc('increment_counter', {
        table_name: 'pattern_attractors',
        column_name: 'activation_count',
        row_id: receipt.attractor_id
      });
      
      if (rpcErr) {
        // Priority 2: Direct SQL via alternative RPC to avoid read-modify-write
        const { error: rawErr } = await supabase.rpc('run_sql', {
          query: `UPDATE pattern_attractors SET activation_count = COALESCE(activation_count, 0) + 1, updated_at = NOW() WHERE id = $1`,
          params: [receipt.attractor_id]
        });

        if (rawErr) {
          // Priority 3: Last resort — simple update (may lose count under concurrency)
          await supabase
            .from('pattern_attractors')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', receipt.attractor_id);
          console.warn(`[RunReceiptLogger] Atomic increment unavailable for attractor ${receipt.attractor_id}. Count may be stale.`, rawErr.message);
        }
      }
    } catch (updateErr) {
      console.warn(`[RunReceiptLogger] Failed to update activation count for attractor ${receipt.attractor_id}:`, updateErr);
    }

    return data?.id || '';
  }

  static async getReceiptsByAttractor(attractorId: string, limit = 50): Promise<any[]> {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from('run_receipts')
      .select('*')
      .eq('attractor_id', attractorId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return [];
    return data || [];
  }

  static async getReceiptsBySession(sessionId: string): Promise<any[]> {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from('run_receipts')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });

    if (error) return [];
    return data || [];
  }

  static async aggregateMetrics(
    attractorId: string,
    period: '7d' | '30d' | '90d' = '30d'
  ): Promise<{
    activation_count: number;
    avg_fit_score: number;
    avg_vibe_score: number;
    avg_policy_score: number;
    ctr: number;
    gaps_detected: Record<GapType, number>;
  }> {
    const supabase = getSupabaseAdminClient();
    
    // Calculate cutoff date
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { data, error } = await supabase
      .from('run_receipts')
      .select('*')
      .eq('attractor_id', attractorId)
      .gte('created_at', cutoffDate.toISOString());

    const result = {
      activation_count: 0,
      avg_fit_score: 0,
      avg_vibe_score: 0,
      avg_policy_score: 0,
      ctr: 0,
      gaps_detected: {} as Record<GapType, number>
    };

    if (error || !data || data.length === 0) return result;

    let fitSum = 0;
    let vibeSum = 0;
    let policySum = 0;
    let ctaShownCount = 0;
    let ctaClickedCount = 0;

    data.forEach((row) => {
      fitSum += row.attractor_fit_score || 0;
      vibeSum += row.vibe_alignment_score || 0;
      policySum += row.policy_compliance_score || 0;

      const shown = Array.isArray(row.cta_shown) ? row.cta_shown.length : 0;
      const clicked = Array.isArray(row.cta_clicked) ? row.cta_clicked.length : 0;
      ctaShownCount += shown;
      ctaClickedCount += clicked;

      const gaps = row.detected_gaps || [];
      gaps.forEach((g: GapType) => {
        result.gaps_detected[g] = (result.gaps_detected[g] || 0) + 1;
      });
    });

    const len = data.length;
    result.activation_count = len;
    result.avg_fit_score = parseFloat((fitSum / len).toFixed(2));
    result.avg_vibe_score = parseFloat((vibeSum / len).toFixed(2));
    result.avg_policy_score = parseFloat((policySum / len).toFixed(2));
    result.ctr = ctaShownCount > 0 ? parseFloat((ctaClickedCount / ctaShownCount).toFixed(4)) : 0;

    return result;
  }
}
