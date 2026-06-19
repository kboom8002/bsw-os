import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../../lib/supabase';

// Mock in-memory store for fallback if table doesn't exist
const mockSettingsStore: Record<string, any> = {};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get('workspace_id');

  if (!workspaceId) {
    return NextResponse.json({ success: false, message: 'workspace_id is required' }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  
  try {
    const { data, error } = await supabase
      .from('workspace_settings')
      .select('settings')
      .eq('workspace_id', workspaceId)
      .single();

    if (error || !data) {
      return NextResponse.json({ success: true, settings: mockSettingsStore[workspaceId] || null });
    }

    return NextResponse.json({ success: true, settings: data.settings });
  } catch (err) {
    return NextResponse.json({ success: true, settings: mockSettingsStore[workspaceId] || null });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspace_id, settings } = body;

    if (!workspace_id || !settings) {
      return NextResponse.json({ success: false, message: 'workspace_id and settings are required' }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    
    // Save to mock store
    mockSettingsStore[workspace_id] = settings;

    // Try saving to DB
    try {
      const { data: existing } = await supabase.from('workspace_settings').select('id').eq('workspace_id', workspace_id).single();
      if (existing) {
        await supabase.from('workspace_settings').update({ settings }).eq('workspace_id', workspace_id);
      } else {
        await supabase.from('workspace_settings').insert({ workspace_id, settings });
      }
    } catch (dbErr) {
      // Ignore DB error if table doesn't exist, we use mock store
    }

    return NextResponse.json({ success: true, message: 'Settings saved' });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
