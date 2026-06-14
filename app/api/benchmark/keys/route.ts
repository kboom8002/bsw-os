import { NextResponse } from 'next/server';

/**
 * GET /api/benchmark/keys
 *
 * 클라이언트에서 직접 AI API를 호출할 수 있도록
 * 서버의 API 키를 안전하게 반환합니다.
 *
 * 보안: 프로덕션에서는 인증/rate limiting 추가 필요
 */
export async function GET() {
  return NextResponse.json({
    gemini: process.env.GEMINI_API_KEY || '',
    openai: process.env.OPENAI_API_KEY || '',
  });
}
