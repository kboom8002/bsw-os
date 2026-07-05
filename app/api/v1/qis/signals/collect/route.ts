import { type NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase';
import { questionSignalSchema } from '@/lib/schema';

export const maxDuration = 60;

/**
 * POST /api/v1/qis/signals/collect
 * 수동/온라인 질문 수집 및 question_signals 테이블 적재
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspace_id, domain_id, source_type, items } = body;

    if (!workspace_id || !items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    const results = {
      received: items.length,
      stored: 0,
      errors: [] as string[]
    };

    for (const item of items) {
      const signalPayload = {
        workspace_id,
        domain_id: domain_id || null,
        query: item.raw_question || item.query, // query 컬럼 유지 호환성
        volume: item.volume || 0,
        intent: item.intent || 'informational',
        status: 'mined',
        
        // QPA-OS 분석 필드 바인딩
        source_type: source_type || item.source_type || 'manual_input',
        source_url: item.source_url || null,
        normalized_question: item.normalized_question || item.raw_question || item.query,
        language: item.language || 'ko',
        locale: item.locale || 'ko-KR',
        persona: item.persona || null,
        journey_stage: item.journey_stage || null,
        source_payload: item.source_payload || {},
        extracted_entities: item.extracted_entities || []
      };

      // Zod 스키마 검증
      const parsed = questionSignalSchema.safeParse(signalPayload);
      if (!parsed.success) {
        results.errors.push(`Validation error: ${parsed.error.message}`);
        continue;
      }

      const { data, error } = await supabase
        .from('question_signals')
        .insert(signalPayload)
        .select('id')
        .single();

      if (error) {
        results.errors.push(`Database error: ${error.message}`);
      } else {
        results.stored++;
      }
    }

    return NextResponse.json({
      ok: true,
      ...results
    });
  } catch (err: any) {
    console.error('[QIS Signals Collect] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}
