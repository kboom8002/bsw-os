/**
 * app/api/golden/batch/route.ts
 *
 * 업종 전체 사이트 배치 분석 API.
 * POST: 배치 분석 시작 (단일 사이트 또는 전체)
 * GET:  배치 진행 상태 조회
 *
 * v2 변경사항:
 * - 사이트 단위 증분 분석 (1회 호출 = 1~5 사이트)
 * - 중단/재개 지원 (skipExisting=true → 미분석만 처리)
 * - 부분 성공 시에도 산출물 생성 가능
 * - 타임아웃 안전 여유 (240초 이내 종료)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase';
import { REFERENCE_SITES, ReferenceSite } from '@/lib/industry/reference-sites-registry';
import { WebsiteCrawler } from '@/lib/surface/website-crawler';
import { DesignTokenExtractor } from '@/lib/golden/design-token-extractor';
import { LayoutStructureAnalyzer } from '@/lib/golden/layout-structure-analyzer';
import { SectionSequenceDetector } from '@/lib/golden/section-sequence-detector';
import { ContentTemplateHarvester } from '@/lib/golden/content-template-harvester';
import { ImageReferenceCataloger } from '@/lib/golden/image-reference-cataloger';
import type { SubIndustryKey, GoldenPositioning } from '@/lib/golden/types';

export const maxDuration = 300; // Vercel Pro: 5분

// ─── 상수 ─────────────────────────────────────────────────────

const BATCH_SIZE = 3;           // 1회 API 호출당 최대 처리 사이트 수
const SITE_TIMEOUT_MS = 30000;  // 사이트당 크롤링 타임아웃 (30초)
const SAFETY_MARGIN_MS = 240000; // Vercel 타임아웃 안전 여유 (4분)

// ─── tier → positioning 매핑 ─────────────────────────────────

function tierToPositioning(tier: string): GoldenPositioning {
  if (tier === 'excellent') return 'premium';
  if (tier === 'poor') return 'poor';
  return 'standard';
}

// ─── 단일 사이트 비주얼 분석 (타임아웃 포함) ──────────────────

async function analyzeSite(site: ReferenceSite): Promise<{
  ok: boolean;
  url: string;
  brandName: string;
  error?: string;
  modules?: { tokens: boolean; layout: boolean; sections: boolean; content: boolean; images: boolean };
  durationMs?: number;
}> {
  const startTime = Date.now();
  try {
    // 크롤링 (타임아웃 래핑)
    const crawler = new WebsiteCrawler();
    const crawlPromise = crawler.crawl(site.url, 3); // 3페이지로 축소 (속도)
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('크롤링 타임아웃 (30초)')), SITE_TIMEOUT_MS)
    );

    let crawlResult;
    try {
      crawlResult = await Promise.race([crawlPromise, timeoutPromise]);
    } catch (timeoutErr) {
      return {
        ok: false,
        url: site.url,
        brandName: site.brandName,
        error: timeoutErr instanceof Error ? timeoutErr.message : '크롤링 타임아웃',
        durationMs: Date.now() - startTime,
      };
    }

    if (!crawlResult.pages || crawlResult.pages.length === 0) {
      return {
        ok: false,
        url: site.url,
        brandName: site.brandName,
        error: '크롤 결과 없음 (접근 차단 또는 빈 페이지)',
        durationMs: Date.now() - startTime,
      };
    }

    const homePage = crawlResult.pages[0];
    const positioning = tierToPositioning(site.tier);

    // 5개 추출 모듈 병렬 실행 (각각 개별 catch)
    const [designTokens, layoutStructure, sectionSequence, contentTemplates, imageReferences] =
      await Promise.all([
        new DesignTokenExtractor().extract(homePage, site.brandName).catch(() => null),
        Promise.resolve(new LayoutStructureAnalyzer().analyze(homePage, site.brandName)).catch(() => null),
        Promise.resolve(new SectionSequenceDetector().detect(crawlResult.pages, site.brandName)).catch(() => null),
        Promise.resolve(new ContentTemplateHarvester().harvest(crawlResult.pages, site.brandName)).catch(() => null),
        Promise.resolve(new ImageReferenceCataloger().catalog(crawlResult.pages, site.brandName)).catch(() => null),
      ]);

    // DB 저장 (UPSERT)
    const supabase = getSupabaseAdminClient();
    const { error: dbError } = await supabase.from('golden_visual_snapshots').upsert({
      sub_industry_key: site.subIndustryKey,
      url: site.url,
      brand_name: site.brandName,
      positioning,
      design_tokens: designTokens,
      layout_structure: layoutStructure,
      section_sequence: sectionSequence,
      content_templates: contentTemplates,
      image_references: imageReferences,
      analyzed_at: new Date().toISOString(),
      analysis_version: 'v1.1',
    }, { onConflict: 'sub_industry_key,url' });

    if (dbError) {
      console.error(`[golden/batch] DB 저장 실패 (${site.brandName}):`, dbError);
    }

    return {
      ok: true,
      url: site.url,
      brandName: site.brandName,
      durationMs: Date.now() - startTime,
      modules: {
        tokens: designTokens != null,
        layout: layoutStructure != null,
        sections: sectionSequence != null,
        content: contentTemplates != null,
        images: imageReferences != null,
      },
    };
  } catch (err) {
    return {
      ok: false,
      url: site.url,
      brandName: site.brandName,
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - startTime,
    };
  }
}

// ─── POST: 배치 분석 (증분) ───────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      subIndustryKey,
      batchSize = BATCH_SIZE,
      skipExisting = true,
      singleUrl,           // 특정 1개 사이트만 재분석
      forceReanalyze = false,
    } = body;

    if (!subIndustryKey) {
      return NextResponse.json({ error: 'subIndustryKey 필수' }, { status: 400 });
    }

    const allSites = REFERENCE_SITES[subIndustryKey as SubIndustryKey];
    if (!allSites || allSites.length === 0) {
      return NextResponse.json({ error: `업종 '${subIndustryKey}'의 레퍼런스 사이트가 없습니다` }, { status: 404 });
    }

    // 단일 사이트 재분석 모드
    if (singleUrl) {
      const site = allSites.find(s => s.url === singleUrl);
      if (!site) {
        return NextResponse.json({ error: `사이트를 찾을 수 없습니다: ${singleUrl}` }, { status: 404 });
      }
      const result = await analyzeSite(site);
      return NextResponse.json({
        ok: true,
        mode: 'single',
        subIndustryKey,
        total: allSites.length,
        results: [result],
        succeeded: result.ok ? 1 : 0,
        failed: result.ok ? 0 : 1,
      });
    }

    // 이미 분석된 사이트 조회
    const supabase = getSupabaseAdminClient();
    const { data: existing } = await supabase
      .from('golden_visual_snapshots')
      .select('url')
      .eq('sub_industry_key', subIndustryKey);

    const existingUrls = new Set((existing ?? []).map((r: any) => r.url));

    // 미분석 사이트만 필터 (또는 forceReanalyze시 전체)
    let targetSites = allSites;
    if (skipExisting && !forceReanalyze) {
      targetSites = allSites.filter(s => !existingUrls.has(s.url));
    }

    if (targetSites.length === 0) {
      return NextResponse.json({
        ok: true,
        mode: 'batch',
        message: '모든 사이트가 이미 분석되어 있습니다',
        subIndustryKey,
        total: allSites.length,
        alreadyAnalyzed: existingUrls.size,
        remaining: 0,
        succeeded: 0,
        failed: 0,
        results: [],
        done: true,
      });
    }

    // batchSize만큼만 처리 (Vercel 타임아웃 방지)
    const batch = targetSites.slice(0, Math.min(batchSize, targetSites.length));
    const startTime = Date.now();

    const results: Awaited<ReturnType<typeof analyzeSite>>[] = [];

    for (const site of batch) {
      // 안전 여유 시간 체크 (4분 경과 시 중단)
      if (Date.now() - startTime > SAFETY_MARGIN_MS) {
        break;
      }

      const result = await analyzeSite(site);
      results.push(result);

      // 사이트 간 0.5초 딜레이 (rate limiting)
      if (batch.indexOf(site) < batch.length - 1) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    const succeeded = results.filter(r => r.ok).length;
    const failed = results.filter(r => !r.ok).length;
    const remaining = targetSites.length - results.length;

    return NextResponse.json({
      ok: true,
      mode: 'batch',
      subIndustryKey,
      total: allSites.length,
      alreadyAnalyzed: existingUrls.size + succeeded,
      attempted: results.length,
      succeeded,
      failed,
      remaining,
      done: remaining === 0,
      elapsedMs: Date.now() - startTime,
      results,
    });

  } catch (err) {
    console.error('[golden/batch] 오류:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// ─── GET: 배치 진행 상태 조회 ─────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const subIndustryKey = searchParams.get('subIndustryKey');

  if (!subIndustryKey) {
    return NextResponse.json({ error: 'subIndustryKey 필수' }, { status: 400 });
  }

  try {
    const sites = REFERENCE_SITES[subIndustryKey as SubIndustryKey] ?? [];
    const supabase = getSupabaseAdminClient();

    const { data: snapshots, error } = await supabase
      .from('golden_visual_snapshots')
      .select('url, brand_name, positioning, analyzed_at, design_tokens, layout_structure, section_sequence')
      .eq('sub_industry_key', subIndustryKey)
      .order('analyzed_at', { ascending: false });

    if (error) throw error;

    const analyzedUrls = new Set((snapshots ?? []).map((s: any) => s.url));

    const statusMap = sites.map(site => ({
      url: site.url,
      brandName: site.brandName,
      tier: site.tier,
      tags: site.tags,
      analyzed: analyzedUrls.has(site.url),
      snapshot: snapshots?.find((s: any) => s.url === site.url) ?? null,
    }));

    const analyzed = statusMap.filter(s => s.analyzed);
    const pending = statusMap.filter(s => !s.analyzed);

    // 산출물 존재 여부도 함께 반환
    const { data: outputs } = await supabase
      .from('golden_reference_outputs')
      .select('deliverable_type, generated_at, sample_count')
      .eq('sub_industry_key', subIndustryKey);

    const availableTypes = (outputs ?? []).map((o: any) => o.deliverable_type);

    return NextResponse.json({
      ok: true,
      subIndustryKey,
      total: sites.length,
      analyzed: analyzed.length,
      pending: pending.length,
      progress: sites.length > 0 ? Math.round((analyzed.length / sites.length) * 100) : 0,
      lastAnalyzedAt: snapshots?.[0]?.analyzed_at ?? null,
      sites: statusMap,
      availableTypes,
      outputMeta: outputs ?? [],
    });

  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
