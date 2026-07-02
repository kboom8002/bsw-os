/**
 * app/api/sales-automation/match/route.ts
 *
 * POST /api/sales-automation/match
 * 영업 대상 업체 목록 갭 분석 매칭 및 적합 상품 도출 API
 */

import { NextResponse } from 'next/server';
import { matchSalesTargets } from '../../../actions/sales-automation';

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { workspaceId, reportId, businesses } = body;

    if (!workspaceId || !businesses || !Array.isArray(businesses)) {
      return NextResponse.json(
        { success: false, error: 'workspaceId와 businesses 배열은 필수 필드입니다.' },
        { status: 400 }
      );
    }

    const results = await matchSalesTargets(workspaceId, reportId, businesses);
    return NextResponse.json({ success: true, targets: results });
  } catch (error: any) {
    console.error('[API sales-automation match] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || '업체 갭 매칭 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
