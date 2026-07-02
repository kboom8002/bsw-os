/**
 * app/api/golden/analyze/route.ts
 *
 * 단일 사이트 비주얼 분석 실행 API.
 * POST: 분석 실행
 * GET:  분석 결과 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase';
import { WebsiteCrawler } from '@/lib/surface/website-crawler';
import { DesignTokenExtractor } from '@/lib/golden/design-token-extractor';
import { LayoutStructureAnalyzer } from '@/lib/golden/layout-structure-analyzer';
import { SectionSequenceDetector } from '@/lib/golden/section-sequence-detector';
import { ContentTemplateHarvester } from '@/lib/golden/content-template-harvester';
import { ImageReferenceCataloger } from '@/lib/golden/image-reference-cataloger';
import type { VisualAnalysisSnapshot } from '@/lib/golden/types';

export const maxDuration = 60;

// ─── POST: 단일 사이트 분석 실행 ─────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, brandName, subIndustryKey, positioning = 'standard' } = body;

    if (!url || !brandName || !subIndustryKey) {
      return NextResponse.json({ error: 'url, brandName, subIndustryKey 필수' }, { status: 400 });
    }

    // 1. 웹사이트 크롤링
    const crawler = new WebsiteCrawler();
    let crawlResult;
    try {
      crawlResult = await crawler.crawl(url, 5); // 5페이지 (빠른 모드)
    } catch (err) {
      return NextResponse.json(
        { error: `크롤링 실패: ${err instanceof Error ? err.message : String(err)}` },
        { status: 502 }
      );
    }

    if (!crawlResult.pages || crawlResult.pages.length === 0) {
      return NextResponse.json({ error: '페이지 크롤링 결과가 없습니다' }, { status: 422 });
    }

    const homePage = crawlResult.pages[0];

    // 2. 비주얼 추출 모듈 실행 (병렬)
    const [designTokens, layoutStructure, contentTemplates, imageReferences] = await Promise.all([
      new DesignTokenExtractor().extract(homePage, brandName).catch(() => null),
      Promise.resolve(new LayoutStructureAnalyzer().analyze(homePage, brandName)).catch(() => null),
      Promise.resolve(new ContentTemplateHarvester().harvest(crawlResult.pages, brandName)).catch(() => null),
      Promise.resolve(new ImageReferenceCataloger().catalog(crawlResult.pages, brandName)).catch(() => null),
    ]);

    const sectionSequence = await Promise.resolve(
      new SectionSequenceDetector().detect(crawlResult.pages, brandName)
    ).catch(() => null);

    // 3. 스냅샷 조립
    const snapshot: VisualAnalysisSnapshot = {
      url,
      brandName,
      subIndustryKey,
      positioning,
      design_tokens: designTokens ?? undefined,
      layout_structure: layoutStructure ?? undefined,
      section_sequence: sectionSequence ?? undefined,
      content_templates: contentTemplates ?? undefined,
      image_references: imageReferences ?? undefined,
      vibe_vector: undefined,
      analyzed_at: new Date().toISOString(),
      analysis_version: 'v1.0',
    };

    // 4. Supabase 저장 (UPSERT)
    const supabase = getSupabaseAdminClient();
    const { error: dbError } = await supabase
      .from('golden_visual_snapshots')
      .upsert({
        sub_industry_key: subIndustryKey,
        url,
        brand_name: brandName,
        positioning,
        design_tokens: designTokens,
        layout_structure: layoutStructure,
        section_sequence: sectionSequence,
        content_templates: contentTemplates,
        image_references: imageReferences,
        analyzed_at: new Date().toISOString(),
        analysis_version: 'v1.0',
      }, { onConflict: 'sub_industry_key,url' });

    if (dbError) {
      console.error('[golden/analyze] DB 저장 실패:', dbError);
      // DB 에러는 무시하고 결과는 반환
    }

    return NextResponse.json({
      ok: true,
      snapshot,
      modules: {
        designTokens: designTokens != null,
        layoutStructure: layoutStructure != null,
        sectionSequence: sectionSequence != null,
        contentTemplates: contentTemplates != null,
        imageReferences: imageReferences != null,
      },
    });

  } catch (err) {
    console.error('[golden/analyze] 오류:', err);
    return NextResponse.json(
      { error: `분석 실패: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}

// ─── GET: 분석 결과 조회 ──────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');
  const subIndustryKey = searchParams.get('subIndustryKey');

  if (!url || !subIndustryKey) {
    return NextResponse.json({ error: 'url, subIndustryKey 필수' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from('golden_visual_snapshots')
      .select('*')
      .eq('sub_industry_key', subIndustryKey)
      .eq('url', url)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: '분석 결과 없음', snapshot: null }, { status: 404 });
    }

    return NextResponse.json({ ok: true, snapshot: data });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
