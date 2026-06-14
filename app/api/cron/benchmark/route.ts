import { NextRequest, NextResponse } from 'next/server';
import { runLightBenchmark } from '../../../actions/benchmark';

export const maxDuration = 60;

/**
 * GET /api/cron/benchmark
 *
 * Vercel Cron 또는 외부 스케줄러에서 호출하는 정기 측정 API.
 *
 * Query params:
 *   - type: 'daily' | 'weekly' (default: 'daily')
 *   - domain: 'skincare' | 'wedding_studio' | 'all' (default: 'all')
 *   - secret: CRON_SECRET 토큰 (보안용)
 *
 * Vercel cron 설정 (vercel.json):
 * {
 *   "crons": [
 *     {
 *       "path": "/api/cron/benchmark?type=daily&secret=CRON_SECRET",
 *       "schedule": "0 2 * * *"
 *     }
 *   ]
 * }
 */
export async function GET(request: NextRequest) {
  // 보안 토큰 확인
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && secret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const type = searchParams.get('type') ?? 'daily';
  const domain = searchParams.get('domain') ?? 'all';
  const workspaceId = process.env.DEFAULT_WORKSPACE_ID ?? 'demo-workspace-id';

  const domains = domain === 'all'
    ? ['skincare', 'wedding_studio']
    : [domain];

  const engines = ['chatgpt_search', 'gemini_grounding'];
  const results: Record<string, any> = {};

  for (const domainSlug of domains) {
    try {
      if (type === 'daily') {
        const res = await runLightBenchmark(domainSlug as any, workspaceId, engines);
        results[domainSlug] = res;
      } else if (type === 'weekly') {
        // Weekly: 더 많은 질문 샘플로 full 측정
        const res = await runLightBenchmark(domainSlug as any, workspaceId, engines);
        results[domainSlug] = res;
      }
    } catch (err: any) {
      results[domainSlug] = { success: false, message: err.message };
    }
  }

  return NextResponse.json({
    type,
    timestamp: new Date().toISOString(),
    results,
  });
}
