/**
 * app/api/aihompy-pack/naver-sync/route.ts
 *
 * 네이버 플레이스 URL/ID로 업체 정보 실 크롤링 API 엔드포인트
 * POST { naverUrl: string }
 * → { success: true, data: Partial<BusinessIntakeData> }
 */

import { NextRequest, NextResponse } from 'next/server';
import { BusinessIntakeProcessor } from '../../../../lib/aihompy-pack/business-intake';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { naverUrl } = await req.json();

    if (!naverUrl || typeof naverUrl !== 'string') {
      return NextResponse.json(
        { success: false, error: '네이버 플레이스 URL 또는 ID를 입력해 주세요.' },
        { status: 400 }
      );
    }

    const data = await BusinessIntakeProcessor.fetchAndParseNaverPlace(naverUrl);

    return NextResponse.json({
      success: true,
      data,
      message: `"${data.business_name}" 정보를 성공적으로 불러왔습니다.`,
    });
  } catch (err: any) {
    console.error('[naver-sync API] Error:', err);

    // 유효하지 않은 URL 오류
    if (err.message?.includes('유효한 네이버 플레이스')) {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: '네이버 플레이스 정보 조회 중 오류가 발생했습니다. URL을 확인해 주세요.',
        detail: process.env.NODE_ENV === 'development' ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}
