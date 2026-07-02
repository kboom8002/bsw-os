/**
 * app/[locale]/(workspace)/[workspace_slug]/sales-automation/page.tsx
 *
 * "use client" 세일즈 대시보드 (8항목 뷰)
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Megaphone, Sparkles, MapPin, TrendingUp, HelpCircle, 
  UserCheck, AlertTriangle, Package, BarChart2, Eye 
} from 'lucide-react';
import { resolveWorkspaceSlug } from '../../../../actions/workspace';
import { getSalesDashboardData, generatePortalGapReport } from '../../../../actions/sales-automation';

export default function SalesAutomationDashboard() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const workspaceSlug = params.workspace_slug as string;

  const [workspaceId, setWorkspaceId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);

  // 8대 지표 데이터 상태
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('2026-07');

  useEffect(() => {
    async function initDashboard() {
      try {
        const wsId = await resolveWorkspaceSlugWrapper(workspaceSlug);
        if (wsId) {
          setWorkspaceId(wsId);
          const data = await getSalesDashboardData(wsId, undefined);
          setDashboardData(data);
        }
      } catch (err) {
        console.error('Dashboard init failed', err);
      } finally {
        setLoading(false);
      }
    }
    initDashboard();
  }, [workspaceSlug]);

  // 임시 slug 리졸버 바인딩 (workspace server action)
  const resolveWorkspaceSlugWrapper = async (slug: string) => {
    const { resolveWorkspaceSlug } = await import('../../../../actions/workspace');
    return await resolveWorkspaceSlug(slug);
  };

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      await generatePortalGapReport(workspaceId, undefined, selectedPeriod);
      const updated = await getSalesDashboardData(workspaceId, undefined);
      setDashboardData(updated);
      alert('신규 포털 갭 분석 리포트가 성공적으로 적재되었습니다!');
    } catch (e) {
      alert('리포트 생성 실패');
    } finally {
      setGeneratingReport(false);
    }
  };

  if (loading || !dashboardData) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#090b10] text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090b10] text-[#e2e8f0] px-8 py-10 font-sans">
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e293b] pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-500 bg-clip-text text-transparent flex items-center gap-3">
            <Megaphone className="h-8 w-8 text-orange-400" />
            세일즈 자동화 엔진 (Sales Portal Gap)
          </h1>
          <p className="mt-2 text-sm text-[#94a3b8]">
            포털의 질문 수요 갭을 실시간 탐지하여 "주차 카페", "휠체어 스파" 등 비어 있는 시장(Gaps)에 적합한 로컬 소상공인을 타겟 세일즈합니다.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2.5 bg-[#111622] border border-[#334155] rounded-xl text-sm text-[#e2e8f0] focus:outline-none focus:border-orange-500"
          >
            <option value="2026-07">2026년 7월 (현재)</option>
            <option value="2026-06">2026년 6월</option>
          </select>

          <button
            onClick={handleGenerateReport}
            disabled={generatingReport}
            className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:bg-[#1e293b] disabled:text-[#64748b] text-white rounded-xl font-bold text-xs transition-all shadow-[0_0_15px_rgba(249,115,22,0.3)] flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {generatingReport ? '포털 분석 중...' : '포털 갭 집계 실행'}
          </button>
        </div>
      </div>

      {/* Grid: 8-Item Sales Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* 지표 3: 답변 가능 업체 수 */}
        <div className="bg-[#111622]/80 border border-[#1e293b] rounded-2xl p-5 backdrop-blur-md shadow-lg flex items-center gap-4">
          <div className="p-3.5 bg-orange-950/40 text-orange-400 rounded-2xl border border-orange-800/30">
            <UserCheck className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[11px] text-[#64748b] font-semibold uppercase block">3. 매칭된 영업 대상</span>
            <span className="text-2xl font-extrabold text-white mt-1 block">{dashboardData.answerableBusinessCount}개 업체</span>
            <span className="text-[9px] text-[#94a3b8]">제주 애월 상권 내 타겟 추출</span>
          </div>
        </div>

        {/* 지표 4: 가장 누락율 높은 카테고리 */}
        <div className="bg-[#111622]/80 border border-[#1e293b] rounded-2xl p-5 backdrop-blur-md shadow-lg flex items-center gap-4">
          <div className="p-3.5 bg-amber-950/40 text-amber-400 rounded-2xl border border-amber-800/30">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[11px] text-[#64748b] font-semibold block">4. 가장 부족한 정보 필드</span>
            <span className="text-xl font-extrabold text-white mt-1 block truncate max-w-[150px]">
              {dashboardData.missingFields?.[0]?.segment || '외국어 지원'}
            </span>
            <span className="text-[9px] text-amber-400 font-bold">누락율 85% 이상 감지</span>
          </div>
        </div>

        {/* 지표 6: 준비도 분포 요약 */}
        <div className="bg-[#111622]/80 border border-[#1e293b] rounded-2xl p-5 backdrop-blur-md shadow-lg flex items-center gap-4">
          <div className="p-3.5 bg-indigo-950/40 text-indigo-400 rounded-2xl border border-indigo-800/30">
            <BarChart2 className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[11px] text-[#64748b] font-semibold block">6. AI홈피 준비도 (낮음)</span>
            <span className="text-2xl font-extrabold text-white mt-1 block">{dashboardData.readinessDistribution?.low || 0}개 업체</span>
            <span className="text-[9px] text-indigo-400">즉시 전환 권장 타깃</span>
          </div>
        </div>

        {/* 지표 8: 예상 전환 리프트 */}
        <div className="bg-[#111622]/80 border border-[#1e293b] rounded-2xl p-5 backdrop-blur-md shadow-lg flex items-center gap-4">
          <div className="p-3.5 bg-emerald-950/40 text-emerald-400 rounded-2xl border border-emerald-800/30">
            <Eye className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[11px] text-[#64748b] font-semibold block">8. 예상 노출 리프트</span>
            <span className="text-2xl font-extrabold text-white mt-1 block">+{dashboardData.estimatedCTAs?.map_clicks.toLocaleString()}회</span>
            <span className="text-[9px] text-emerald-400">월간 지도 액션 상승 전망</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 cols: 기회 질문 트렌드 및 타겟 후보 */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 지표 1 & 2: 수요 증가 질문 및 QVS/CPS 점수 */}
          <div className="bg-[#111622]/80 border border-[#1e293b] rounded-2xl p-6 backdrop-blur-md shadow-lg space-y-4">
            <h2 className="text-md font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-400" />
              1 & 2. 포털 내 급상승 기회 질문 및 QVS 스코어
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-[#1e293b] text-[#64748b] font-bold">
                    <th className="py-2.5">순위</th>
                    <th>질문 내용 (포털 실제 검색어)</th>
                    <th>QVS 점수</th>
                    <th>CPS 점수</th>
                    <th>전월비 증가율</th>
                    <th>커버리지</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b] text-[#e2e8f0]">
                  {dashboardData.trendingQuestions?.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-[#1e293b]/30">
                      <td className="py-3 font-mono font-bold text-orange-400">{idx + 1}</td>
                      <td className="font-semibold text-white max-w-[200px] truncate">{item.query}</td>
                      <td>{item.qvs_score}점</td>
                      <td>{item.cps_score}점</td>
                      <td className="text-emerald-400 font-bold">+{item.growth_rate}%</td>
                      <td>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          item.coverage_status === 'answered' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {item.coverage_status === 'answered' ? '답변있음' : '답변부족 (Gap)'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 지표 5: 추천 영업 업체 후보 */}
          <div className="bg-[#111622]/80 border border-[#1e293b] rounded-2xl p-6 backdrop-blur-md shadow-lg space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-md font-bold text-white flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-indigo-400" />
                5. 적합 소상공인 추천 리스트
              </h2>
              <button
                onClick={() => router.push(`/${locale}/${workspaceSlug}/sales-automation/targets`)}
                className="px-3.5 py-1.5 bg-[#1c2132] hover:bg-[#334155] border border-[#334155] text-indigo-300 rounded-xl text-xs font-semibold transition-all"
              >
                영업 타깃 관리 뷰
              </button>
            </div>
            
            <div className="space-y-3">
              {dashboardData.recommendedBusinesses?.map((biz: any, idx: number) => (
                <div key={idx} className="p-4 bg-[#090b10] border border-[#1e293b] rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-white text-sm">{biz.business_name}</h3>
                      <span className="px-1.5 py-0.5 bg-orange-950 text-orange-400 border border-orange-800/30 rounded text-[9px] uppercase font-bold">
                        {biz.business_type}
                      </span>
                    </div>
                    <p className="text-xs text-[#64748b] mt-1">해소 가능한 갭: {biz.matched_gap_types.join(', ')}</p>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-right">
                      <span className="text-[10px] text-[#64748b] block">매칭 적합도</span>
                      <span className="text-xs font-bold text-orange-400">{biz.match_score}점</span>
                    </div>
                    <button
                      onClick={() => router.push(`/${locale}/${workspaceSlug}/sales-automation/targets?id=${biz.id}`)}
                      className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold transition-all"
                    >
                      맞춤 영업 메시지 조회
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 col: 제안 상품 매핑 및 기타 지표 */}
        <div className="space-y-6">
          
          {/* 지표 7: 제안 상품 매핑 정보 */}
          <div className="bg-[#111622]/80 border border-[#1e293b] rounded-2xl p-6 backdrop-blur-md shadow-lg space-y-4">
            <h2 className="text-md font-bold text-white flex items-center gap-2">
              <Package className="h-5 w-5 text-amber-400" />
              7. 갭 대응 영업 제안 상품
            </h2>
            <p className="text-xs text-[#94a3b8]">발견된 갭 패턴과 매치되는 1:1 세일즈 패키지 매핑 정보입니다.</p>
            
            <div className="space-y-3 pt-2">
              {dashboardData.missingFields?.map((s: any, idx: number) => (
                <div key={idx} className="p-3 bg-[#090b10] border border-[#1e293b] rounded-xl text-xs space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white">{s.recommended_product}</span>
                    <span className="px-2 py-0.5 bg-amber-950 text-amber-400 rounded text-[9px] font-bold">기회도 {s.opportunity_score}점</span>
                  </div>
                  <p className="text-[10px] text-[#64748b]">부족 도메인 속성: {s.segment}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 지표 8: 예상 전환 상세 */}
          <div className="bg-[#111622]/80 border border-[#1e293b] rounded-2xl p-6 backdrop-blur-md shadow-lg space-y-4">
            <h2 className="text-md font-bold text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-pink-400" />
              8. 예상 전환 시나리오 리프트
            </h2>
            
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#090b10]/60 border border-[#1e293b] rounded-xl flex justify-between items-center">
                <span className="text-[#94a3b8]">🗺️ 지도 약도 클릭수</span>
                <span className="font-extrabold text-white">+{dashboardData.estimatedCTAs?.map_clicks.toLocaleString()}회/월</span>
              </div>
              <div className="p-3 bg-[#090b10]/60 border border-[#1e293b] rounded-xl flex justify-between items-center">
                <span className="text-[#94a3b8]">📞 전화 문의 전화량</span>
                <span className="font-extrabold text-white">+{dashboardData.estimatedCTAs?.calls.toLocaleString()}회/월</span>
              </div>
              <div className="p-3 bg-[#090b10]/60 border border-[#1e293b] rounded-xl flex justify-between items-center">
                <span className="text-[#94a3b8]">💾 즐겨찾기 저장 횟수</span>
                <span className="font-extrabold text-white">+{dashboardData.estimatedCTAs?.saves.toLocaleString()}회/월</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
