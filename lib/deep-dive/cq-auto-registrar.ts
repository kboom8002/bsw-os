import { getSupabaseAdminClient } from '../supabase';
import { TargetQuestionCandidate } from './types';
import * as crypto from 'crypto';
export class CqAutoRegistrar {
  /**
   * Registers a target question as a canonical question after admin approval.
   */
  static async register(workspaceId: string, candidate: TargetQuestionCandidate, adminId: string): Promise<boolean> {
    const supabase = getSupabaseAdminClient();
    
    // First, verify the candidate exists and is approved
    if (candidate.admin_approval_status !== 'approved') {
      throw new Error('Candidate must be admin-approved before registration.');
    }
    
    // 1. Create or find Question Capital Node
    const nodeName = `Strategic Territory for: ${candidate.question_text.slice(0, 15)}...`;
    
    let { data: capitalNode } = await supabase
      .from('question_capital_nodes')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('title', nodeName)
      .single();
      
    let capitalNodeId = capitalNode?.id;
      
    if (!capitalNodeId) {
      const { data: newNode, error: nodeErr } = await supabase
        .from('question_capital_nodes')
        .insert({
          id: crypto.randomUUID(),
          workspace_id: workspaceId,
          title: nodeName,
          slug: `st-${Date.now()}`,
          strategic_weight: 80
        })
        .select('id')
        .single();
        
      if (nodeErr || !newNode) throw new Error('Failed to create question capital node');
      capitalNodeId = newNode.id;
    }

    // 2. Create Canonical Question
    const signature = crypto
      .createHash('sha256')
      .update(candidate.question_text)
      .digest('hex')
      .substring(0, 64);

    const { data: newCq, error: cqErr } = await supabase
      .from('canonical_questions')
      .insert({
        id: crypto.randomUUID(),
        workspace_id: workspaceId,
        question_capital_node_id: capitalNodeId,
        normalized_question: candidate.question_text,
        slug: `cq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        signature
      })
      .select('id')
      .single();
      
    if (cqErr || !newCq) throw new Error('Failed to create canonical question: ' + cqErr?.message);
    
    // 3. QIS Scene 자동 생성
    try {
      await supabase
        .from('qis_scenes')
        .insert({
          id: crypto.randomUUID(),
          workspace_id: workspaceId,
          canonical_question_id: newCq.id,
          scene_name: `${candidate.question_text.slice(0, 30)} Scene`,
          query_template: candidate.question_text,
          intent_model: 'informational',
          scenario_context: `Auto-generated from deep-dive target (priority: ${candidate.composite_priority})`,
          risk_level: (candidate.eeat_dimension as string) === 'trust' ? 'high' : 'medium',
        });
    } catch (sceneErr: any) {
      console.warn('[CqAutoRegistrar] QIS scene creation skipped:', sceneErr.message);
    }
    
    // Update the candidate to mark it as registered
    await supabase
      .from('deep_dive_target_questions')
      .update({
        registered_cq_id: newCq.id,
        admin_approved_by: adminId,
        admin_approved_at: new Date().toISOString()
      })
      .eq('id', candidate.id);

    return true;
  }
}
