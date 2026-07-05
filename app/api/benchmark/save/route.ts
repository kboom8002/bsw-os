import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../../lib/supabase';

/**
 * POST /api/benchmark/save
 *
 * 클라이언트에서 집계한 측정 결과를 Supabase에 저장합니다.
 *
 * Request body:
 *   { domainSlug: string, brandResults: BrandResult[] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domainSlug, brandResults } = body;

    if (!domainSlug || !brandResults) {
      return NextResponse.json(
        { success: false, message: 'domainSlug and brandResults are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // workspace ID 조회
    let workspaceId: string | undefined;
    const { data: ws } = await supabase.from('workspaces').select('id').limit(1).single();
    if (ws) workspaceId = ws.id;
    if (!workspaceId) {
      return NextResponse.json({
        success: true,
        message: 'No workspace found, results computed but not saved to DB.',
      });
    }

    const TABLE = 'industry_benchmark_snapshots';
    const records = brandResults.map((br: any) => ({
      workspace_id: workspaceId,
      domain_slug: domainSlug,
      brand_slug: br.brand_slug,
      brand_name: br.brand_name,
      engine_name: 'composite',
      aas: br.aas,
      ocr: br.ocr,
      bsf: br.bsf,
      ars: null,
      bair: br.bair,
      bdr: br.bdr ?? null,
      cwr: br.cwr ?? null,
      iri: br.iri ?? null,
      opp: br.opp ?? null,
      top3: br.top3 ?? null,
      top5: br.top5 ?? null,
      freshness: br.freshness ?? null,
      mention_count: br.mention_count,
      citation_count: br.citation_count,
      sample_size: br.sample_size,
      measurement_type: 'daily_light',
      measured_at: br.measured_at,
    }));

    const { error } = await supabase.from(TABLE).insert(records);
    if (error) {
      console.warn('[benchmark/save] Supabase insert failed:', error.message);
    }

    return NextResponse.json({
      success: true,
      message: `Saved ${records.length} brand snapshots for ${domainSlug}.`,
    });
  } catch (err: any) {
    console.error('[benchmark/save] Error:', err.message);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
