/**
 * app/[locale]/reports/share/[token]/page.tsx
 *
 * (비로그인 권한 허용) 지자체 AEO 리포트 공개 공유 뷰어 페이지
 */

import React from 'react';
import { getSharedReportByToken } from '../../../../actions/regional-report';
import { MapPin, Award, BarChart2, ShieldCheck, HelpCircle } from 'lucide-react';

// Vercel 런타임 옵션
export const maxDuration = 60;

interface SharedReportPageProps {
  params: Promise<{
    locale: string;
    token: string;
  }>;
}

export default async function SharedReportPublicPage({ params }: SharedReportPageProps) {
  const { locale, token } = await params;

  // 비인증 세션으로 해시 토큰 조회 실행
  const report = await getSharedReportByToken(token);

  if (!report) {
    return (
      <div className="min-h-screen bg-[#090b10] flex flex-col items-center justify-center text-white px-4">
        <h1 className="text-xl font-bold text-red-400">유효하지 않은 링크</h1>
        <p className="text-xs text-[#64748b] mt-2">만료되었거나 손상된 공유용 리포트 토큰입니다. 발행 기관에 문의하세요.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05070a] text-[#e2e8f0] px-6 py-12 font-sans selection:bg-indigo-500 selection:text-white flex justify-center">
      <div className="w-full max-w-4xl space-y-8">
        
        {/* Report Official Header */}
        <div className="border-b border-[#1e293b] pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded text-[9px] font-extrabold uppercase">
                Public Share Active
              </span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1.5">{report.report_title}</h1>
            <p className="text-xs text-[#64748b] mt-1">지역 범위: {report.region_name} | 분석 월: {report.report_period}</p>
          </div>
          
          <div className="text-right">
            <span className="text-[10px] text-slate-500 font-mono block">BSW-OS LOCAL PORTAL AEO REPORT</span>
            <span className="text-[9px] text-[#64748b] mt-1 block">발행 코드: {token.slice(0, 12)}...</span>
          </div>
        </div>

        {/* 2-Column Dashboard grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Main Left: 2 cols */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Executive Summary */}
            <div className="bg-[#111622]/65 border border-[#1e293b] rounded-2xl p-6 backdrop-blur-md shadow-lg space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Award className="h-4.5 w-4.5 text-indigo-400" />
                지자체 요약 분석 (Executive Summary)
              </h2>
              <p className="text-xs text-[#e2e8f0] leading-relaxed bg-[#090b10]/60 p-4 rounded-xl border border-[#1e293b]/70 whitespace-pre-line">
                {report.executive_summary}
              </p>
            </div>

            {/* category trends */}
            <div className="bg-[#111622]/65 border border-[#1e293b] rounded-2xl p-6 backdrop-blur-md shadow-lg space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart2 className="h-4.5 w-4.5 text-purple-400" />
                카테고리별 질문 수요 트렌드
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {report.category_trends?.map((item: any, idx: number) => (
                  <div key={idx} className="p-3.5 bg-[#090b10]/60 border border-[#1e293b]/70 rounded-xl space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-white text-[11px]">{item.category}</span>
                      <span className={`font-bold text-[11px] ${item.change_rate >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {item.change_rate >= 0 ? '+' : ''}{item.change_rate}%
                      </span>
                    </div>
                    <div className="text-[10px] text-[#64748b]">월간 수요: {item.current_volume}회</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top 갭 질문 */}
            <div className="bg-[#111622]/65 border border-[#1e293b] rounded-2xl p-6 backdrop-blur-md shadow-lg space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <HelpCircle className="h-4.5 w-4.5 text-pink-400" />
                미충족 질문 갭 리스트 (Top Gaps)
              </h2>
              <div className="space-y-2.5">
                {report.top_questions?.slice(0, 4).map((q: any, i: number) => (
                  <div key={i} className="p-3 bg-[#090b10]/50 border border-[#1e293b]/50 rounded-xl flex justify-between items-center text-xs">
                    <span className="font-semibold text-white truncate max-w-[220px]">{q.query}</span>
                    <span className="px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded text-[9px] font-bold">
                      {q.coverage === 'answered' ? '완전답변' : '답변공백 (AEO Gap)'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar: 1 col */}
          <div className="space-y-6">
            
            {/* Coverage Summary */}
            <div className="bg-[#111622]/65 border border-[#1e293b] rounded-2xl p-5 backdrop-blur-md shadow-lg space-y-3 text-center">
              <span className="text-[10px] text-[#64748b] uppercase tracking-wider block">종합 답변율 (ARS)</span>
              <span className="text-3xl font-black text-white block">{report.coverage_summary.coverage_score}%</span>
              <div className="w-full bg-[#090b10] rounded-full h-1.5 mt-2">
                <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${report.coverage_summary.coverage_score}%` }}></div>
              </div>
            </div>

            {/* Policy Recommendations */}
            <div className="bg-[#111622]/65 border border-[#1e293b] rounded-2xl p-5 backdrop-blur-md shadow-lg space-y-4">
              <h2 className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="h-4.5 w-4.5 text-indigo-400" />
                지자체 정책 제언 추천
              </h2>
              <div className="space-y-3.5">
                {report.policy_recommendations?.map((rec: any, idx: number) => (
                  <div key={idx} className="p-3 bg-[#090b10]/60 border border-[#1e293b]/80 rounded-xl space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-white text-[11px]">{rec.title}</span>
                      <span className="px-1 text-[8px] bg-indigo-950 text-indigo-300 rounded border border-indigo-800 uppercase font-bold">
                        {rec.priority}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#94a3b8] leading-relaxed mt-1.5">{rec.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Public Footer */}
        <div className="text-center pt-8 border-t border-[#1e293b] text-[10px] text-[#64748b] leading-relaxed">
          본 리포트는 BSW-OS (Brand Semantic Web Operating System) Local Portal AEO Engine에 의해 공인 조립된 공식 진단 결과입니다.<br/>
          본 보고서의 데이터는 Supabase 보안 RLS 정책 가이드 및 프록시 고지 의무 준수 게이트를 통과하였습니다.
        </div>
      </div>
    </div>
  );
}
