import { NextRequest, NextResponse } from 'next/server';
import { SearchProviderFactory } from '../../../../lib/ai/search-provider-factory';

/**
 * POST /api/benchmark/query
 *
 * 단일 질문을 단일 엔진에 보내고 결과를 반환합니다.
 * 각 호출이 5~8초로, Vercel Hobby의 10초 제한 내에 완료됩니다.
 *
 * Request body:
 *   { query: string, engine: string }
 *
 * Response:
 *   { text: string, citations: Citation[] }
 */
export const maxDuration = 15;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, engine } = body;

    if (!query || !engine) {
      return NextResponse.json(
        { error: 'query and engine are required' },
        { status: 400 }
      );
    }

    console.log(`[API /benchmark/query] engine=${engine}, query="${query.substring(0, 50)}..."`);

    const provider = SearchProviderFactory.getProvider(engine);
    const result = await provider.search(query);

    console.log(`[API /benchmark/query] ✓ text=${result.raw_response_text.length}chars, citations=${result.citations.length}`);

    return NextResponse.json({
      text: result.raw_response_text,
      citations: result.citations.map(c => ({
        url: c.url,
        domain: c.domain,
        title: c.title,
      })),
    });
  } catch (err: any) {
    console.error(`[API /benchmark/query] Error:`, err.message);
    return NextResponse.json(
      { text: `[Error: ${err.message}]`, citations: [] },
      { status: 200 } // 에러여도 200으로 반환 (클라이언트가 집계할 수 있도록)
    );
  }
}
