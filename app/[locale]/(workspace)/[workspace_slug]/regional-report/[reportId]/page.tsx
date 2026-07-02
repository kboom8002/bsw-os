/**
 * app/[locale]/(workspace)/[workspace_slug]/regional-report/[reportId]/page.tsx
 *
 * "use client" 지자체 AEO 상세 리포트 뷰어 및 외부 배포 관리 페이지
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Sparkles, FileText, Check, Copy, Share2, 
  Download, Award, BarChart2, AlertTriangle, ShieldCheck, HelpCircle 
} from 'lucide-react';
import { resolveWorkspaceSlug } from '../../../../../actions/workspace';
import { exportRegionalReport } from '../../../../../actions/regional-report';

export default function RegionalReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const workspaceSlug = params.workspace_slug as string;
  const reportId = params.reportId as string;

  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // 공유 및 다운로드 상태
  const [copiedLink, setCopiedLink] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(`regional_report_${reportId}`);
      if (stored) {
        setReport(JSON.parse(stored));
        setLoading(false);
      } else {
        // Fallback: DB 데이터 리스폰스 (생략 혹은 임시 목업 세팅)
        loadFallbackMock();
      }
    }
  }, [reportId]);

  const loadFallbackMock = async () => {
    const { RegionalReportTemplate } = await import('../../../../../../lib/regional-report/regional-report-template');
    const wsId = await resolveWorkspaceSlugWrapper(workspaceSlug);
    if (wsId) {
      const data = await RegionalReportTemplate.buildReportData(
        wsId,
        'monthly_question_intelligence',
        '2026-07'
      );
      setReport(data);
    }
    setLoading(false);
  };

  const resolveWorkspaceSlugWrapper = async (slug: string) => {
    const { resolveWorkspaceSlug } = await import('../../../../../actions/workspace');
    return await resolveWorkspaceSlug(slug);
  };

  // 공개 공유 링크 복사 (인증 불필요 뷰어로 연결)
  const handleCopyShareLink = () => {
    if (!report?.shared_token) return;
    const shareUrl = `${window.location.origin}/${locale}/reports/share/${report.shared_token}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleExportMarkdown = async () => {
    if (!report) return;
    setExportLoading(true);
    try {
      const md = await exportRegionalReport(report, 'markdown');
      const blob = new Blob([md], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Regional_AEO_Report_${report.report_period}.md`;
      a.click();
    } catch (e) {
      alert('내보내기 실패');
    } finally {
      setExportLoading(false);
    }
  };

  if (loading || !report) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#090b10] text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090b10] text-[#e2e8f0] px-8 py-10 font-sans">
      
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e293b] pb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/${locale}/${workspaceSlug}/regional-report`)}
            className="p-2.5 bg-[#111622] hover:bg-[#1e293b] rounded-xl border border-[#1e293b] text-[#94a3b8] hover:text-white transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded text-[9px] font-extrabold uppercase">
                {report.report_type.replace(/_/g, ' ')}
              </span>
              <h1 className="text-2xl font-extrabold text-white">{report.report_title}</h1>
            </div>
            <p className="text-xs text-[#64748b] mt-1">지역 대상: {report.region_name} | 분석 기간: {report.report_period}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyShareLink}
            className="px-4 py-2.5 bg-[#111622] hover:bg-[#1e293b] border border-[#334155] rounded-xl text-xs font-semibold text-indigo-300 hover:text-white flex items-center gap-2 transition-all"
          >
            {copiedLink ? <Check className="h-4 w-4 text-green-400" /> : <Share2 className="h-4 w-4" />}
            {copiedLink ? '공유 링크 복사됨' : '공유용 링크 복사'}
          </button>

          <button
            onClick={handleExportMarkdown}
            disabled={exportLoading}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-[#1e293b] disabled:text-[#64748b] text-white rounded-xl text-xs font-bold transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)] flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {exportLoading ? '내보내는 중...' : '마크다운 다운로드'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Summary & Charts (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Executive Summary */}
          <div className="bg-[#111622]/80 border border-[#1e293b] rounded-2xl p-6 backdrop-blur-md shadow-lg space-y-4">
            <h2 className="text-md font-bold text-white flex items-center gap-2">
              <Award className="h-5 w-5 text-indigo-400" />
              Executive Summary (AI 분석 총평)
            </h2>
            <p className="text-xs text-[#e2e8f0] leading-relaxed bg-[#090b10] p-4 rounded-xl border border-[#1e293b] whitespace-pre-line">
              {report.executive_summary}
            </p>
          </div>

          {/* 카테고리별 시계열 트렌드 */}
          <div className="bg-[#111622]/80 border border-[#1e293b] rounded-2xl p-6 backdrop-blur-md shadow-lg space-y-4">
            <h2 className="text-md font-bold text-white flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-purple-400" />
              카테고리별 월간 질문 수요 변화
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.category_trends?.map((item: any, idx: number) => (
                <div key={idx} className="p-4 bg-[#090b10] border border-[#1e293b] rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white">{item.category}</span>
                    <span className={`font-bold ${item.change_rate >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {item.change_rate >= 0 ? '+' : ''}{item.change_rate}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-[#64748b]">
                    <span>금월 {item.current_volume}회 / 전월 {item.previous_volume}회</span>
                  </div>
                  <div className="text-[10px] bg-[#111622]/80 p-2 rounded text-[#94a3b8] italic truncate">
                    "Q: {item.top_query}"
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 상위 질문 100개 요약 테이블 */}
          <div className="bg-[#111622]/80 border border-[#1e293b] rounded-2xl p-6 backdrop-blur-md shadow-lg space-y-4">
            <h2 className="text-md font-bold text-white flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-pink-400" />
              상위 기회 질문 및 답변 갭 리스트
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-[#1e293b] text-[#64748b] font-bold">
                    <th className="py-2">순위</th>
                    <th>포털 질문 검색어</th>
                    <th>QVS 점수</th>
                    <th>CPS 점수</th>
                    <th>전월비 증가율</th>
                    <th>AEO 답변 상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b] text-[#e2e8f0]">
                  {report.top_questions?.map((q: any, i: number) => (
                    <tr key={i} className="hover:bg-[#1e293b]/20">
                      <td className="py-3 font-mono font-bold text-indigo-400">{q.rank}</td>
                      <td className="font-semibold text-white truncate max-w-[200px]" title={q.query}>{q.query}</td>
                      <td>{q.qvs_score}점</td>
                      <td>{q.cps_score}점</td>
                      <td className="text-emerald-400 font-bold">+{q.growth_rate}%</td>
                      <td>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          q.coverage === 'answered'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {q.coverage === 'answered' ? '완전답변' : '답변누락 (Gap)'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Policy Recommendations (1 col) */}
        <div className="space-y-6">
          
          {/* 답변 커버리지 스코어카드 */}
          <div className="bg-[#111622]/80 border border-[#1e293b] rounded-2xl p-6 backdrop-blur-md shadow-lg space-y-4">
            <h2 className="text-xs font-extrabold text-[#64748b] uppercase tracking-widest">AEO 답변 커버리지 요약</h2>
            
            <div className="p-4 bg-[#090b10] border border-[#1e293b] rounded-2xl text-center space-y-2">
              <span className="text-[10px] text-[#64748b] block">지역 종합 커버리지 등급</span>
              <span className="text-4xl font-black text-white">{report.coverage_summary.coverage_score}%</span>
              <span className="text-[10px] text-indigo-400 font-semibold block">총 {report.coverage_summary.total_queries}개 기회 질문 기준</span>
            </div>
            
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-[#1e293b]">
                <span className="text-[#64748b]">완전 답변 질문 수</span>
                <span className="font-semibold text-white">{report.coverage_summary.answered_count}개</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#1e293b]">
                <span className="text-[#64748b]">부분 답변 질문 수</span>
                <span className="font-semibold text-white">{report.coverage_summary.partial_count}개</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-[#64748b]">답변 누락 갭 질문 수</span>
                <span className="font-semibold text-rose-400">{report.coverage_summary.unanswered_count}개</span>
              </div>
            </div>
          </div>

          {/* AI 행정/정책 제언 추천 카드 */}
          <div className="bg-[#111622]/80 border border-[#1e293b] rounded-2xl p-6 backdrop-blur-md shadow-lg space-y-4">
            <h2 className="text-md font-bold text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-indigo-400" />
              지자체 추천 정책 제언
            </h2>
            
            <div className="space-y-4">
              {report.policy_recommendations?.map((rec: any, idx: number) => (
                <div key={idx} className="p-3.5 bg-[#090b10] border border-[#1e293b] rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white text-xs">{rec.title}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                      rec.priority === 'high' 
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}>
                      {rec.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#94a3b8] leading-relaxed">{rec.description}</p>
                  <span className="text-[9px] text-indigo-400 block font-semibold">기대 효과: {rec.expected_impact}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
