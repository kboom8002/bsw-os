import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../../../lib/supabase';
import { FeedbackProcessor } from '../../../../../lib/hub-feedback/feedback-processor';
import { HubFeedbackPayload } from '../../../../../lib/hub-feedback/types';

export const maxDuration = 30;

const DOMAIN_INDUSTRY_MAP: Record<string, string> = {
  jeju: 'jeju_smb',
  korea: 'skincare',
};

/**
 * POST /api/v1/feedback/ingest
 * AI Hub로부터 역방향 피드백을 수집하여 BSW 시스템에 저장 및 처리
 *
 * Headers:
 *   x-hub-secret: <HUB_FEEDBACK_SECRET>
 *
 * Body: HubFeedbackPayload & { workspace: string }
 */
export async function POST(request: NextRequest) {
  try {
    const HUB_FEEDBACK_SECRET = process.env.HUB_FEEDBACK_SECRET;
    if (!HUB_FEEDBACK_SECRET) {
      return NextResponse.json(
        { ok: false, code: 'SERVER_NOT_CONFIGURED', message: 'HUB_FEEDBACK_SECRET is not configured' },
        { status: 500 }
      );
    }

    // 1. 인증 헤더 검증
    const secret = request.headers.get('x-hub-secret');
    if (secret !== HUB_FEEDBACK_SECRET) {
      return NextResponse.json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 });
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ ok: false, code: 'INVALID_JSON' }, { status: 400 });
    }

    // 2. 파라미터 검증
    const { region, date, workspace: workspaceSlug } = body;
    if (!region || !date) {
      return NextResponse.json({ ok: false, code: 'MISSING_PARAMS', message: 'region and date are required' }, { status: 400 });
    }

    const targetSlug = workspaceSlug || 'jeju-hub'; // fallback default slug

    // 3. Workspace Slug -> ID 해석
    const supabase = getSupabaseAdminClient();
    const { data: wsData, error: wsError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('slug', targetSlug)
      .maybeSingle();

    if (wsError || !wsData) {
      return NextResponse.json(
        { ok: false, code: 'WORKSPACE_NOT_FOUND', message: `Workspace not found: ${targetSlug}` },
        { status: 404 }
      );
    }

    const workspaceId = wsData.id;

    // 4. 피드백 원본 DB 저장 (upsert)
    const { error: upsertError } = await supabase
      .from('hub_feedback_logs')
      .upsert({
        workspace_id: workspaceId,
        region,
        feedback_date: date,
        source: 'hub_push',
        payload: body,
        processed: false
      }, {
        onConflict: 'workspace_id,region,feedback_date,source'
      });

    if (upsertError) {
      return NextResponse.json(
        { ok: false, code: 'DB_SAVE_FAILED', message: upsertError.message },
        { status: 500 }
      );
    }

    // 5. 즉시 비동기 환류 처리
    const industryKey = DOMAIN_INDUSTRY_MAP[region] || 'jeju_smb';
    const processResult = await FeedbackProcessor.processIncoming(
      workspaceId,
      body as HubFeedbackPayload,
      industryKey
    );

    return NextResponse.json({
      ok: true,
      message: 'Feedback received and processed',
      data: processResult
    });

  } catch (err: any) {
    return NextResponse.json(
      { ok: false, code: 'INTERNAL_ERROR', message: err.message },
      { status: 500 }
    );
  }
}
