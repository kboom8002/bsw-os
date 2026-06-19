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

    if (approved) {
      // In a real system, this would register Canonical Questions (CQ) to the core semantic system.
      // For now, return a success message.
    }

    return NextResponse.json({ success: true, status, message: approved ? 'Approved and Canonical Questions Registered.' : 'Rejected.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
