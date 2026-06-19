import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../../lib/supabase';

/**
 * GET: List past deep dive sessions for a workspace, filtered by domain/brand
 * POST: Load a specific session or update session with step results
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceSlug = searchParams.get('workspace');
    const domainSlug = searchParams.get('domain');
    const brandSlug = searchParams.get('brand');

    if (!workspaceSlug) {
      return NextResponse.json({ error: 'Missing workspace' }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    // Resolve workspace slug to ID
    let workspaceId = workspaceSlug;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(workspaceSlug);
    if (!isUuid) {
      const { data: ws } = await supabase.from('workspaces').select('id').eq('slug', workspaceSlug).single();
      if (ws) workspaceId = ws.id;
      else {
        const { data: firstWs } = await supabase.from('workspaces').select('id').limit(1).single();
        if (firstWs) workspaceId = firstWs.id;
      }
    }

    let query = supabase
      .from('deep_dive_sessions')
      .select('id, brand_slug, brand_name, status, created_at, domain_slug, subscription_tier')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (domainSlug) {
      query = query.eq('domain_slug', domainSlug);
    }
    if (brandSlug) {
      query = query.eq('brand_slug', brandSlug);
    }

    const { data: sessions, error } = await query;

    if (error) {
      // Table might not have domain_slug column yet, retry without filter
      const { data: fallbackSessions } = await supabase
        .from('deep_dive_sessions')
        .select('id, brand_slug, brand_name, status, created_at, subscription_tier')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(20);

      return NextResponse.json({ sessions: fallbackSessions || [] });
    }

    return NextResponse.json({ sessions: sessions || [] });
  } catch (error: any) {
    console.error('[deep-dive] Sessions list error:', error);
    return NextResponse.json({ sessions: [] });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, session_id } = body;

    const supabase = getSupabaseAdminClient();

    if (action === 'load' && session_id) {
      // Load full session data
      const { data: session, error } = await supabase
        .from('deep_dive_sessions')
        .select('*')
        .eq('id', session_id)
        .single();

      if (error || !session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      return NextResponse.json({ session });
    }

    if (action === 'update' && session_id) {
      // Update session with step results
      const updates: Record<string, any> = {};
      if (body.status) updates.status = body.status;
      if (body.diagnostic_snapshot) updates.diagnostic_snapshot = body.diagnostic_snapshot;
      if (body.discovered_candidates) updates.discovered_candidates = body.discovered_candidates;
      if (body.blueprints) updates.blueprints = body.blueprints;
      if (body.simulation) updates.simulation = body.simulation;
      if (body.completed_at) updates.completed_at = body.completed_at;

      const { error } = await supabase
        .from('deep_dive_sessions')
        .update(updates)
        .eq('id', session_id);

      if (error) {
        console.warn('[deep-dive] Session update error (non-fatal):', error.message);
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('[deep-dive] Sessions POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
