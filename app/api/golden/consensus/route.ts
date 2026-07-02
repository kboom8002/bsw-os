/**
 * app/api/golden/consensus/route.ts
 *
 * 패턴 집계 + 6종 JSON 생성 API.
 * POST: 업종의 모든 스냅샷을 집계하여 골든 레퍼런스 산출물 생성
 * GET:  기존 산출물 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase';
import { PatternConsensusEngine } from '@/lib/golden/pattern-consensus-engine';
import { GoldenJsonBuilder } from '@/lib/golden/golden-json-builder';
import type { SubIndustryKey, VisualAnalysisSnapshot } from '@/lib/golden/types';

export const maxDuration = 60;

// ─── POST: 합의 생성 ──────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subIndustryKey } = body;

    if (!subIndustryKey) {
      return NextResponse.json({ error: 'subIndustryKey 필수' }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    // 1. 스냅샷 데이터 로드
    const { data: rows, error: fetchError } = await supabase
      .from('golden_visual_snapshots')
      .select('*')
      .eq('sub_industry_key', subIndustryKey);

    if (fetchError) throw fetchError;

    if (!rows || rows.length < 3) {
      return NextResponse.json(
        { error: `최소 3개 사이트 분석이 필요합니다. 현재: ${rows?.length ?? 0}개` },
        { status: 422 }
      );
    }

    // 2. DB rows → VisualAnalysisSnapshot 변환
    const snapshots: VisualAnalysisSnapshot[] = rows.map((row: any) => ({
      url: row.url,
      brandName: row.brand_name,
      subIndustryKey: row.sub_industry_key,
      positioning: row.positioning ?? 'standard',
      design_tokens: row.design_tokens,
      layout_structure: row.layout_structure,
      section_sequence: row.section_sequence,
      content_templates: row.content_templates,
      image_references: row.image_references,
      vibe_vector: row.vibe_vector,
      analyzed_at: row.analyzed_at,
      analysis_version: row.analysis_version,
    }));

    // 3. 합의 계산
    const engine = new PatternConsensusEngine();
    const consensus = engine.computeFullConsensus(snapshots);

    // 4. 6종 JSON 빌드
    const outputs = GoldenJsonBuilder.buildAll(snapshots, subIndustryKey as SubIndustryKey);


    // 5. DB에 산출물 저장 (UPSERT)
    const deliverableTypes = ['tokens', 'layouts', 'sections', 'content', 'images', 'quality'] as const;
    const upsertRows = deliverableTypes.map(type => ({
      sub_industry_key: subIndustryKey,
      deliverable_type: type,
      output_data: outputs[type] as any,
      sample_count: snapshots.length,
      generated_at: new Date().toISOString(),
    }));

    const { error: saveError } = await supabase
      .from('golden_reference_outputs')
      .upsert(upsertRows, { onConflict: 'sub_industry_key,deliverable_type' });

    if (saveError) {
      console.error('[golden/consensus] 산출물 저장 실패:', saveError);
    }

    return NextResponse.json({
      ok: true,
      subIndustryKey,
      sampleCount: snapshots.length,
      generatedAt: new Date().toISOString(),
      outputs,
      consensus: {
        colorClusterCount: consensus.color.clusters.length,
        topFontPairs: consensus.typography.topPairs.slice(0, 3).map(p => p.pairId),
        primaryRadius: consensus.shape.primaryRadius.consensus,
        topSectionTypes: Object.entries(consensus.sections.sectionFrequency)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([type]) => type),
      },
    });

  } catch (err) {
    console.error('[golden/consensus] 오류:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// ─── GET: 기존 산출물 조회 ────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const subIndustryKey = searchParams.get('subIndustryKey');
  const type = searchParams.get('type'); // 특정 산출물 타입만 조회

  if (!subIndustryKey) {
    return NextResponse.json({ error: 'subIndustryKey 필수' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdminClient();

    let query = supabase
      .from('golden_reference_outputs')
      .select('*')
      .eq('sub_industry_key', subIndustryKey)
      .order('generated_at', { ascending: false });

    if (type) {
      query = query.eq('deliverable_type', type);
    }

    const { data, error } = await query;
    if (error) throw error;

    if (!data || data.length === 0) {
      return NextResponse.json({
        ok: false,
        message: '아직 산출물이 없습니다. POST로 합의 생성을 먼저 실행하세요.',
        outputs: null,
      });
    }

    const outputs: Record<string, any> = {};
    for (const row of data) {
      outputs[row.deliverable_type] = row.output_data;
    }

    return NextResponse.json({
      ok: true,
      subIndustryKey,
      sampleCount: data[0]?.sample_count ?? 0,
      generatedAt: data[0]?.generated_at ?? null,
      availableTypes: data.map((r: any) => r.deliverable_type),
      outputs,
    });

  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
