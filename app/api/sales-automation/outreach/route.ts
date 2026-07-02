/**
 * app/api/sales-automation/outreach/route.ts
 *
 * POST /api/sales-automation/outreach
 * 영업 대상 맞춤 제안 메시지 자동 생성 API
 */

import { NextResponse } from 'next/server';
import { generateOutreachMessage } from '../../../actions/sales-automation';

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { workspaceId, targetId } = body;

    if (!workspaceId || !targetId) {
      return NextResponse.json(
        { success: false, error: 'workspaceId와 targetId는 필수 필드입니다.' },
        { status: 400 }
      );
    }

    const message = await generateOutreachMessage(workspaceId, targetId);
    return NextResponse.json({ success: true, outreach_message: message });
  } catch (error: any) {
    console.error('[API sales-automation outreach] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || '영업 메시지 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
