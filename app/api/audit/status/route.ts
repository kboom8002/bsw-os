import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../../lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
  }

  try {
    const db = getSupabaseAdminClient();
    const { data, error } = await db
      .from('audit_sessions')
      .select('status, progress, result_data')
      .eq('id', sessionId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({
      status: data.status,
      progress: data.progress,
      // We do not return the full result_data here to save bandwidth, 
      // unless status is completed.
      ...(data.status === 'completed' && { resultReady: true })
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
