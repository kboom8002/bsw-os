import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../../lib/supabase';

export async function POST(req: Request) {
  try {
    const { session_id, approved, feedback } = await req.json();

    if (!session_id) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    
    // Update session status
    const status = approved ? 'approved' : 'rejected';
    const { error: updateError } = await supabase
      .from('deep_dive_sessions')
      .update({ status, admin_feedback: feedback })
      .eq('id', session_id);
      
    if (updateError) {
      console.warn("Could not update supabase, ignoring for mock", updateError);
    }

    let registered = 0;
    if (approved) {
      // 1. Get workspace_id from session
      const { data: sessionData, error: sessionErr } = await supabase
        .from('deep_dive_sessions')
        .select('workspace_id')
        .eq('id', session_id)
        .single();
        
      if (sessionErr || !sessionData) {
        console.warn("[Approve API] Could not find session:", sessionErr);
      } else {
        const workspaceId = sessionData.workspace_id;
        
        // 2. Fetch all candidates for this session
        const { data: candidates, error: candErr } = await supabase
          .from('deep_dive_target_questions')
          .select('*')
          .eq('session_id', session_id);
          
        if (candErr || !candidates) {
          console.warn("[Approve API] Failed to fetch candidates:", candErr);
        } else {
          const { CqAutoRegistrar } = await import('../../../../lib/deep-dive/cq-auto-registrar');
          for (const cand of candidates) {
            try {
              // Ensure marked as approved
              cand.admin_approval_status = 'approved';
              
              // We also need to update its status in the DB
              await supabase
                .from('deep_dive_target_questions')
                .update({ admin_approval_status: 'approved' })
                .eq('id', cand.id);
                
              await CqAutoRegistrar.register(workspaceId, cand, 'system-admin');
              registered++;
            } catch (err: any) {
              console.warn(`[Approve API] Failed to register candidate "${cand.question_text}":`, err.message);
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      status,
      registeredCount: registered,
      message: approved ? `Approved and ${registered} Canonical Questions Registered.` : 'Rejected.'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
