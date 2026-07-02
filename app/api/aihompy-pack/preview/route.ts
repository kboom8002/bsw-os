/**
 * app/api/aihompy-pack/preview/route.ts
 *
 * POST /api/aihompy-pack/preview
 * 소상공인 AI홈피 팩 적용 어트랙터 실시간 미리보기 및 최적 티어 진단 API
 */

import { NextResponse } from 'next/server';
import { matchBusinessToAttractors } from '../../../actions/semantic';

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { workspaceId, businessData } = body;

    if (!workspaceId || !businessData) {
      return NextResponse.json(
        { success: false, error: 'workspaceId와 businessData는 필수 필드입니다.' },
        { status: 400 }
      );
    }

    const matched = await matchBusinessToAttractors(workspaceId, businessData);
    
    // 추천 티어 계산 로직
    // 매칭된 어트랙터가 6개 이상이면 Premium/Pro 권장, 3개 이하면 Basic 권장
    let recommendedTier: 'basic' | 'pro' | 'premium' = 'basic';
    if (matched.length >= 6) {
      recommendedTier = 'premium';
    } else if (matched.length >= 3) {
      recommendedTier = 'pro';
    }

    const estimatedSectionsCount = 3 + matched.length; // Hero + Accessibility + CTA + 상황형 섹션 수

    return NextResponse.json({
      success: true,
      applicable_attractors_count: matched.length,
      applicable_attractors: matched,
      recommended_tier: recommendedTier,
      estimated_sections_count: estimatedSectionsCount
    });
  } catch (error: any) {
    console.error('[API aihompy-pack preview] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || '미리보기 도출 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
