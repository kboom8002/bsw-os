import { NextRequest, NextResponse } from 'next/server';
import { runLightBenchmark, getBenchmarkSessionStatus, pauseBenchmarkSession, resumeBenchmarkSession } from '../../../actions/benchmark';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action = 'start', domainSlug, targetBrandSlug, sessionId } = body;

    if (action === 'status') {
      if (!sessionId) return NextResponse.json({ success: false, message: 'sessionId required' }, { status: 400 });
      const status = await getBenchmarkSessionStatus(sessionId);
      return NextResponse.json({ success: true, status });
    }

    if (action === 'pause') {
      if (!sessionId) return NextResponse.json({ success: false, message: 'sessionId required' }, { status: 400 });
      const res = await pauseBenchmarkSession(sessionId);
      return NextResponse.json({ success: true, message: 'Session paused', res });
    }

    if (action === 'resume') {
      if (!sessionId) return NextResponse.json({ success: false, message: 'sessionId required' }, { status: 400 });
      // Non-blocking
      resumeBenchmarkSession(sessionId).catch(console.error);
      return NextResponse.json({ success: true, message: 'Session resumed in background', sessionId });
    }

    if (action === 'start') {
      if (!domainSlug) {
        return NextResponse.json({ success: false, message: 'domainSlug is required' }, { status: 400 });
      }

      console.log(`[API /benchmark/run] Starting measurement for domain: ${domainSlug}, targetBrand: ${targetBrandSlug}`);

      // If it's a long run, start it and return sessionId
      const result = await runLightBenchmark(
        domainSlug,
        undefined,
        ['chatgpt_search', 'gemini_grounding'],
        targetBrandSlug,
        true // background mode
      );

      return NextResponse.json(result);
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });

  } catch (err: any) {
    console.error(`[API /benchmark/run] Error:`, err.message);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
