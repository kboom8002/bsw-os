import { type NextRequest, NextResponse } from 'next/server';
import { SemanticDedup } from '@/lib/signal-collection/semantic-dedup';

export const maxDuration = 120;

/**
 * POST /api/v1/qis/signals/deduplicate
 * 코사인 유사도 0.85 기반 시맨틱 중복 제거 및 클러스터링
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { candidates, threshold } = body;

    if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
      return NextResponse.json({ error: 'Missing or empty field: candidates' }, { status: 400 });
    }

    // RawSignalCandidate 형식으로 데이터 정규화
    const formattedCandidates = candidates.map((item: any) => ({
      query: item.query || item.raw_question,
      source: item.source || 'manual_dedup',
      volume: item.volume || 0,
      metadata: item.metadata || {}
    }));

    const dedup = new SemanticDedup(threshold || 0.85);
    const result = await dedup.deduplicate(formattedCandidates);

    return NextResponse.json({
      ok: true,
      data: result
    });
  } catch (err: any) {
    console.error('[QIS Signals Deduplicate] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}
