import { NextRequest, NextResponse } from 'next/server';
import { IndustryReportRunner, type ReportBrandInput, type IndustryReportOptions } from '../../../../lib/industry-report/report-runner';
import { BENCHMARK_DOMAINS } from '../../../../lib/benchmark/domain-config';

export const maxDuration = 300;

/**
 * POST /api/industry-report/generate
 *
 * Body:
 * {
 *   workspaceId?: string;          // null이면 공개 리포트
 *   subIndustryKey: string;        // "skincare" | "wedding" ...
 *   brands?: ReportBrandInput[];   // 옵션: 없으면 실측 벤치마크 설정(BENCHMARK_DOMAINS)의 브랜드를 자동 사용
 *   options?: IndustryReportOptions;
 * }
 *
 * Response:
 * { success: true, reportId: string, data: IndustryReportData }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      workspaceId = null,
      subIndustryKey,
      brands,
      options = {},
    }: {
      workspaceId?: string | null;
      subIndustryKey: string;
      brands?: ReportBrandInput[];
      options?: IndustryReportOptions;
    } = body;

    // 입력 유효성 검사
    if (!subIndustryKey) {
      return NextResponse.json(
        { success: false, message: 'subIndustryKey is required' },
        { status: 400 }
      );
    }
    
    let finalBrands = brands;
    
    // 브랜드가 없거나 비어있는 경우 도메인 설정에서 가져옴
    if (!finalBrands || finalBrands.length === 0) {
      const domainConfig = BENCHMARK_DOMAINS[subIndustryKey];
      if (domainConfig && domainConfig.brands) {
        finalBrands = domainConfig.brands.map(b => ({
          slug: b.slug,
          name: b.name,
          domains: b.domains,
          keywords: b.keywords
        }));
      }
    }

    if (!finalBrands || finalBrands.length < 2) {
      return NextResponse.json(
        { success: false, message: 'At least 2 brands are required for competitive report. Provide them or ensure they exist in BENCHMARK_DOMAINS.' },
        { status: 400 }
      );
    }
    if (finalBrands.length > 30) {
      return NextResponse.json(
        { success: false, message: 'Maximum 30 brands per report' },
        { status: 400 }
      );
    }

    console.log(`[industry-report/generate] Starting report: ${subIndustryKey}, ${finalBrands.length} brands`);

    const { reportId, data } = await IndustryReportRunner.generate(
      workspaceId,
      subIndustryKey,
      finalBrands,
      options
    );

    return NextResponse.json({ success: true, reportId, data });

  } catch (err: any) {
    console.error('[industry-report/generate] Error:', err.message);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
