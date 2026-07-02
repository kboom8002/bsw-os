import { getSupabaseAdminClient } from '../../../lib/supabase';
import IndustryReportDashboard from '../../../components/industry-report/IndustryReportDashboard';
import type { IndustryReportData } from '../../../lib/industry-report/report-data-builder';
import { IndustryReportRunner } from '../../../lib/industry-report/report-runner';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: '업종별 AEO/GEO 경쟁 리포트 | BSW-OS AI Visibility',
  description:
    '업종별 AI 검색 경쟁 현황 — BAIR, AEPI, IRI, OPP, BDR, CWR 지표 기반 브랜드 AI 가시성 랭킹 및 전략 포지셔닝 분석.',
};

async function getLatestReports(): Promise<{ industryKey: string; reportId: string; data: IndustryReportData }[]> {
  const supabase = getSupabaseAdminClient();

  // 발행된 최신 리포트 목록 (업종별 최신 1개)
  const { data: snapshots } = await supabase
    .from('industry_report_snapshots')
    .select('id, sub_industry_key, report_period, status, published_at, report_title, industry_avg_bair, industry_iri, total_brands')
    .in('status', ['published', 'draft'])
    .order('created_at', { ascending: false })
    .limit(50);

  if (!snapshots || snapshots.length === 0) return [];

  // 업종별로 최신 1개만 선택
  const latestByIndustry = new Map<string, typeof snapshots[0]>();
  for (const snap of snapshots) {
    if (!latestByIndustry.has(snap.sub_industry_key)) {
      latestByIndustry.set(snap.sub_industry_key, snap);
    }
  }

  // 최대 6개 업종 리포트 로드
  const results: { industryKey: string; reportId: string; data: IndustryReportData }[] = [];
  const industryList = Array.from(latestByIndustry.values()).slice(0, 6);

  for (const snap of industryList) {
    try {
      const data = await IndustryReportRunner.fetchReport(snap.id);
      if (data) {
        results.push({ industryKey: snap.sub_industry_key, reportId: snap.id, data });
      }
    } catch {
      // 개별 리포트 오류는 스킵
    }
  }

  return results;
}

export default async function IndustryReportPage() {
  const reports = await getLatestReports();

  return <IndustryReportDashboard reports={reports} />;
}
