import { NextRequest, NextResponse } from 'next/server';
import { IndustryReportRunner } from '../../../../lib/industry-report/report-runner';
import { exportToMarkdown, exportToJson } from '../../../../lib/industry-report/export-report';

/**
 * POST /api/industry-report/export
 *
 * 리포트를 Markdown 또는 JSON으로 내보냅니다.
 *
 * Body:
 * {
 *   reportId: string;
 *   format: "markdown" | "json";
 * }
 *
 * Response: 파일 다운로드 (Content-Disposition attachment)
 */
export async function POST(request: NextRequest) {
  try {
    const { reportId, format = 'markdown' }: { reportId: string; format: 'markdown' | 'json' } =
      await request.json();

    if (!reportId) {
      return NextResponse.json(
        { success: false, message: 'reportId is required' },
        { status: 400 }
      );
    }
    if (!['markdown', 'json'].includes(format)) {
      return NextResponse.json(
        { success: false, message: 'format must be "markdown" or "json"' },
        { status: 400 }
      );
    }

    // 리포트 데이터 조회
    const data = await IndustryReportRunner.fetchReport(reportId);
    if (!data) {
      return NextResponse.json(
        { success: false, message: 'Report not found' },
        { status: 404 }
      );
    }

    const period = data.snapshot.report_period.replace(/[^a-zA-Z0-9-]/g, '_');
    const industry = data.snapshot.sub_industry_key;

    if (format === 'markdown') {
      const markdown = exportToMarkdown(data);
      const filename = `BSW_${industry}_${period}_AEO_Report.md`;

      return new NextResponse(markdown, {
        status: 200,
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    // JSON
    const json = exportToJson(data);
    const filename = `BSW_${industry}_${period}_AEO_Report.json`;

    return new NextResponse(json, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (err: any) {
    console.error('[industry-report/export] Error:', err.message);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
