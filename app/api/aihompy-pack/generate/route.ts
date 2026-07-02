/**
 * app/api/aihompy-pack/generate/route.ts
 *
 * POST /api/aihompy-pack/generate
 * 소상공인 AI홈피 팩 최종 조립 및 생성 파이프라인 API
 */

import { NextResponse } from 'next/server';
import { generateAihompyPack } from '../../../actions/semantic';

export const maxDuration = 120; // 2분 제한

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { workspaceId, businessData, tier } = body;

    if (!workspaceId || !businessData || !tier) {
      return NextResponse.json(
        { success: false, error: 'workspaceId, businessData, tier는 필수 필드입니다.' },
        { status: 400 }
      );
    }

    const result = await generateAihompyPack(workspaceId, businessData, tier);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API aihompy-pack generate] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'AI홈피 팩 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
