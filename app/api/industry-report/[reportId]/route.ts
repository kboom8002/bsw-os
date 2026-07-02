import { NextRequest, NextResponse } from 'next/server';
import { IndustryReportRunner } from '@/lib/industry-report/report-runner';

/**
 * GET /api/industry-report/[reportId]
 *
 * 특정 리포트 ID의 전체 데이터를 반환합니다.
 *
 * Response:
 * { success: true, data: IndustryReportData }
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  const { reportId } = await params;

  if (!reportId) {
    return NextResponse.json(
      { success: false, message: 'reportId is required' },
      { status: 400 }
    );
  }

  try {
    const data = await IndustryReportRunner.fetchReport(reportId);

    if (!data) {
      return NextResponse.json(
        { success: false, message: 'Report not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });

  } catch (err: any) {
    console.error(`[industry-report/${reportId}] Error:`, err.message);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/industry-report/[reportId]
 *
 * 리포트 상태 변경 (draft → published 등)
 * Body: { status: "published" | "archived" }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  const { reportId } = await params;
  const { status } = await request.json();

  if (!['published', 'archived', 'draft'].includes(status)) {
    return NextResponse.json(
      { success: false, message: 'Invalid status. Use: published | archived | draft' },
      { status: 400 }
    );
  }

  try {
    const { getSupabaseAdminClient } = await import('@/lib/supabase');
    const supabase = getSupabaseAdminClient();

    const updateData: Record<string, unknown> = { status };
    if (status === 'published') {
      updateData.published_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('industry_report_snapshots')
      .update(updateData)
      .eq('id', reportId);

    if (error) throw error;

    return NextResponse.json({ success: true, message: `Report status updated to: ${status}` });

  } catch (err: any) {
    console.error(`[industry-report/PATCH ${reportId}] Error:`, err.message);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
