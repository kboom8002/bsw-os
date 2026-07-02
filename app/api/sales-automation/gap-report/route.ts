/**
 * app/api/sales-automation/gap-report/route.ts
 *
 * POST /api/sales-automation/gap-report
 * 포털 갭 리포트 생성 및 저장 API
 */

import { NextResponse } from 'next/server';
import { generatePortalGapReport } from '../../../actions/sales-automation';

export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { workspaceId, domainId, period } = body;

    if (!workspaceId || !period) {
      return NextResponse.json(
        { success: false, error: 'workspaceId와 period는 필수 필드입니다.' },
        { status: 400 }
      );
    }

    const result = await generatePortalGapReport(workspaceId, domainId, period);
    return NextResponse.json({ success: true, report: result });
  } catch (error: any) {
    console.error('[API sales-automation gap-report] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || '갭 리포트 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
