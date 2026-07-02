/**
 * app/[locale]/(workspace)/[workspace_slug]/regional-report/page.tsx
 *
 * "use client" 지자체/협회 리포트 메인 대시보드
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  MapPin, Sparkles, FileText, ChevronRight, Calendar, 
  Map, ShieldAlert, Award, Loader2, Eye 
} from 'lucide-react';
import { resolveWorkspaceSlug } from '../../../../actions/workspace';
import { 
  listRegionalReports, generateRegionalReport 
} from '../../../../actions/regional-report';

export default function RegionalReportMainPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const workspaceSlug = params.workspace_slug as string;

  const [workspaceId, setWorkspaceId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // 리포트 생성 옵션
  const [reportType, setReportType] = useState<any>('monthly_question_intelligence');
  const [period, setPeriod] = useState('2026-07');
  const [regionName, setRegionName] = useState('제주 애월읍');

  // 리포트 목록
  const [reportsList, setReportsList] = useState<any[]>([]);

  useEffect(() => {
    async function loadReports() {
      try {
        const wsId = await resolveWorkspaceSlugWrapper(workspaceSlug);
        if (wsId) {
          setWorkspaceId(wsId);
          const list = await listRegionalReports(wsId);
          setReportsList(list);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, [workspaceSlug]);

  const resolveWorkspaceSlugWrapper = async (slug: string) => {
    const { resolveWorkspaceSlug } = await import('../../../../actions/workspace');
    return await resolveWorkspaceSlug(slug);
  };

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const report = await generateRegionalReport(workspaceId, reportType, period, regionName);
      if (report) {
        // 상세 리포트 뷰어 전달을 위해 sessionStorage 캐싱
        sessionStorage.setItem(`regional_report_${report.id}`, JSON.stringify(report));
        
        // 상세로 이동
        router.push(`/${locale}/${workspaceSlug}/regional-report/${report.id}`);
      }
    } catch (e) {
      alert('리포트 생성 중 오류가 발생했습니다.');
    } finally {
      setGenerating(false);
    }
  };

  const handleGoToDetail = (repId: string) => {
    router.push(`/${locale}/${workspaceSlug}/regional-report/${repId}`);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#090b10] text-white">
        <Loader2 className="animate-spin h-12 w-12 text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090b10] text-[#e2e8f0] px-8 py-10 font-sans">
      
      {/* Header */}
      <div className="mb-10 border-b border-[#1e293b] pb-6">
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 bg-clip-text text-transparent flex items-center gap-3">
          <MapPin className="h-8 w-8 text-indigo-400" />
          지자체·협회 AEO 로컬 리포트
        </h1>
        <p className="mt-2 text-sm text-[#94a3b8]">
          지역 전체 상권의 월별 질문 수요 추이, 대중교통/배리어프리 정본 AEO 커버리지 및 지자체 전용 행정 정책 제언 보고서를 출력합니다.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Report Generator Options (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#111622]/80 border border-[#1e293b] rounded-2xl p-6 backdrop-blur-md shadow-lg space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-400" />
              신규 로컬 리포트 옵션 선택
            </h2>

            {/* 4대 리포트 유형 카드 선택 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { id: 'monthly_question_intelligence', title: '📊 월간 질문 인텔리전스 (QI)', desc: '상위 100개 기회 질문, 카테고리별 수요 증감 추적 보고서' },
                { id: 'accessibility_gap', title: '♿ 교통·무장애 접근성 정보 갭', desc: '유모차/휠체어 안심 동선, 저보행 고령자 갭 분석' },
                { id: 'foreign_tourist_question', title: '🌍 Foreign Tourist Demand (AEO)', desc: '영어 검색 질문 타깃, 다국어 문진 및 결제 갭 보고서 (영문 우선)' },
                { id: 'smb_ai_transition', title: '🤖 소상공인 AI 전환도 진단', desc: 'AI홈피 및 llm.txt 탑재율, 지자체 인센티브 추천 정책' }
              ].map(card => (
                <div
                  key={card.id}
                  onClick={() => setReportType(card.id as any)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                    reportType === card.id
                      ? 'bg-indigo-600/10 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                      : 'bg-[#090b10] border-[#1e293b] hover:border-indigo-400'
                  }`}
                >
                  <span className="text-sm font-bold text-white block">{card.title}</span>
                  <p className="text-[11px] text-[#94a3b8] mt-2 leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>

            {/* 세부 파라미터 (기간, 지역) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-[#94a3b8] flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> 분석 대상 기간
                </label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="mt-1.5 w-full px-4 py-2.5 bg-[#090b10] border border-[#334155] rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="2026-07">2026년 7월</option>
                  <option value="2026-06">2026년 6월</option>
                  <option value="2026-05">2026년 5월</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#94a3b8] flex items-center gap-1">
                  <Map className="h-3.5 w-3.5" /> 대상 지역 상권
                </label>
                <input
                  type="text"
                  value={regionName}
                  onChange={(e) => setRegionName(e.target.value)}
                  placeholder="예: 제주 애월읍"
                  className="mt-1.5 w-full px-4 py-2.5 bg-[#090b10] border border-[#334155] rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              onClick={handleGenerateReport}
              disabled={generating}
              className="w-full py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 disabled:from-[#1e293b] disabled:to-[#1e293b] disabled:text-[#64748b] text-white rounded-2xl font-bold tracking-wide transition-all shadow-[0_0_20px_rgba(139,92,246,0.25)] flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 text-white" />
                  지역 질문 텐서 크로스 갭 분석 중...
                </>
              ) : (
                <>
                  <FileText className="h-5 w-5" />
                  지역 종합 진단 보고서 생성
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: History List (1 col) */}
        <div className="space-y-6">
          <div className="bg-[#111622]/80 border border-[#1e293b] rounded-2xl p-5 backdrop-blur-md shadow-lg space-y-4">
            <h2 className="text-sm font-extrabold text-[#94a3b8] uppercase tracking-wider">보고서 발행 히스토리</h2>
            
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {reportsList.map((r, idx) => (
                <div
                  key={idx}
                  onClick={() => handleGoToDetail(r.id)}
                  className="p-4 bg-[#090b10] border border-[#1e293b] hover:border-indigo-500 rounded-xl cursor-pointer transition-all flex justify-between items-center"
                >
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-white truncate max-w-[180px]">{r.report_title}</h3>
                    <span className="text-[10px] text-[#64748b] mt-1 block">커버리지 지수: {r.coverage_score}%</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#64748b] flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
