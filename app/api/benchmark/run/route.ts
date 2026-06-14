import { NextRequest, NextResponse } from 'next/server';
import { runLightBenchmark } from '../../../actions/benchmark';

/**
 * POST /api/benchmark/run
 *
 * 즉시 실측 API Route — Server Action 대신 사용하여
 * Vercel Serverless Function의 maxDuration을 활용합니다.
 *
 * Vercel Hobby: maxDuration = 60s (기본 10s를 override)
 * Vercel Pro: maxDuration = 300s
 */
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domainSlug, targetBrandSlug } = body;

    if (!domainSlug) {
      return NextResponse.json(
        { success: false, message: 'domainSlug is required' },
        { status: 400 }
      );
    }

    console.log(`[API /benchmark/run] Starting measurement for domain: ${domainSlug}, targetBrand: ${targetBrandSlug}`);

    const result = await runLightBenchmark(
      domainSlug,
      undefined,
      ['chatgpt_search', 'gemini_grounding'],
      targetBrandSlug
    );

    console.log(`[API /benchmark/run] Result: success=${result.success}, message=${result.message}`);

    return NextResponse.json(result);
  } catch (err: any) {
    console.error(`[API /benchmark/run] Error:`, err.message);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
