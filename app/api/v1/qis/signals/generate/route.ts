import { type NextRequest, NextResponse } from 'next/server';
import { SignalOrchestrator } from '@/lib/signal-collection/orchestrator';

export const maxDuration = 300; // LLM 다중 호출을 감안한 5분 만료 타임아웃 지정

/**
 * POST /api/v1/qis/signals/generate
 * LLM 5-Lens 자동 질문 생성 파이프라인을 전체 가동합니다.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspace_id, domain_name, brand_name, options } = body;

    if (!workspace_id || !domain_name) {
      return NextResponse.json({ error: 'Missing required fields: workspace_id, domain_name' }, { status: 400 });
    }

    const result = await SignalOrchestrator.runFullPipeline(
      workspace_id,
      domain_name,
      brand_name,
      {
        workspaceId: workspace_id,
        brandUSP: options?.brandUSP,
        repeatEval: options?.repeatEval || 1,
        industryKey: options?.industryKey,
        enableMMR: options?.enableMMR ?? true
      }
    );

    return NextResponse.json({
      ok: true,
      data: result
    });
  } catch (err: any) {
    console.error('[QIS Signals Generate] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}
