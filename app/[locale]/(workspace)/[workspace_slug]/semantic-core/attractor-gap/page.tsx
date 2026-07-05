"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { 
  ArrowLeft, 
  AlertTriangle, 
  Activity, 
  CheckCircle2, 
  TrendingUp, 
  RefreshCw, 
  Wrench, 
  Flame, 
  AlertCircle,
  HelpCircle
} from "lucide-react";
import { 
  getPatternAttractors, 
  getBrandAttractorPortfolio, 
  calculatePortfolioScore
} from "@/app/actions/semantic";
import { GapType } from "@/lib/pattern-attractor/types";

export default function AttractorGapPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";
  const locale = (params?.locale as string) || "ko";
  const domainFromUrl = searchParams.get('domain') || '';

  const [wsId, setWsId] = useState<string>("");
  const [domains, setDomains] = useState<any[]>([]);
  const [selectedDomainId, setSelectedDomainId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [portfolioScore, setPortfolioScore] = useState<number>(0);
  const [gaps, setGaps] = useState<any[]>([]);
  const [tasks, setTasks] = useState<string[]>([]);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    initPage();
  }, [workspaceSlug]);

  const initPage = async () => {
    setLoading(true);
    setDbError(null);
    try {
      const { getSupabaseClient } = await import("@/lib/supabase");
      const supabase = getSupabaseClient();

      const { data: ws } = await supabase
        .from("workspaces")
        .select("id")
        .eq("slug", workspaceSlug)
        .single();

      if (ws?.id) {
        setWsId(ws.id);
        
        // Load domains
        const { data: domainList } = await supabase
          .from("domains")
          .select("*")
          .eq("workspace_id", ws.id);
        
        if (domainList && domainList.length > 0) {
          setDomains(domainList);
          const matchedDomain = domainFromUrl ? domainList.find(d => d.slug === domainFromUrl) : null;
          const initialDomainId = matchedDomain ? matchedDomain.id : domainList[0].id;
          setSelectedDomainId(initialDomainId);
          await runAnalysis(ws.id, initialDomainId);
        } else {
          setLoading(false);
        }
      }
    } catch (err: any) {
      console.error("Failed to init page:", err);
      setDbError(err.message || "페이지 로딩 중 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  const runAnalysis = async (currentWsId: string, domainId: string) => {
    setLoading(true);
    try {
      // 1. Calculate portfolio score
      const score = await calculatePortfolioScore(currentWsId, "brand_default", domainId);
      setPortfolioScore(score);

      // 2. Fetch standard attractors & portfolio entries to build Gap Report
      const standardList = await getPatternAttractors(currentWsId, { domainId });
      const portfolio = await getBrandAttractorPortfolio(currentWsId, "brand_default");

      // Build Gap Analysis Report client-side
      const calculatedGaps = [];
      const calculatedTasks = [];

      for (const standard of standardList) {
        const entry = portfolio.find((e) => e.attractor_id === standard.id);
        
        if (!entry) {
          // Missing
          calculatedGaps.push({
            gap_type: "missing_attractor",
            attractor_id: standard.id,
            severity: "critical",
            description: `'${standard.natural_definition}' 패턴 처리 콘텐츠가 브랜드에 부재합니다.`,
            recommended_fix: "어트랙터를 활성화하고 7개 채널 Media Soliton을 생성하세요."
          });
          calculatedTasks.push(`[신규 생성] ${standard.id.split('.').pop()} 패턴 자산 빌드`);
        } else {
          const readiness = Number(entry.readiness_score || 0);
          if (entry.status === "weak" || readiness < 60) {
            calculatedGaps.push({
              gap_type: "weak_attractor",
              attractor_id: standard.id,
              severity: "high",
              description: `패턴이 있으나 증빙/근거 연결 강도(${readiness}%)가 부족합니다.`,
              recommended_fix: "TCO 개념 바인딩을 완료하고, 실측 Claim 원격 서명을 탑재하세요."
            });
            calculatedTasks.push(`[근거 보강] ${standard.id.split('.').pop()} 온톨로지 매핑 정제`);
          }

          if (entry.status === "misaligned") {
            calculatedGaps.push({
              gap_type: "misaligned_attractor",
              attractor_id: standard.id,
              severity: "medium",
              description: "콘텐츠의 실제 Vibe가 목표 Vibe Signature와 일치하지 않습니다.",
              recommended_fix: "L0-L3 Vibe Spec에 맞춰 슬라이더 톤 조정을 적용하세요."
            });
            calculatedTasks.push(`[톤 매칭] ${standard.id.split('.').pop()} Vibe Signature 미세 조정`);
          }

          if (entry.status === "unsafe") {
            calculatedGaps.push({
              gap_type: "unsafe_attractor",
              attractor_id: standard.id,
              severity: "critical",
              description: "Action Policy 또는 금지 어구 정책(must_not_do) 위반 위험 감지.",
              recommended_fix: "허위/과장 표현을 방지하는 안전 에스컬레이션을 강제 바인딩하세요."
            });
            calculatedTasks.push(`[정책 준수] ${standard.id.split('.').pop()} Action Policy 가드 보강`);
          }
        }
      }

      setGaps(calculatedGaps);
      setTasks(calculatedTasks);
    } catch (err: any) {
      console.error("Failed to run analysis:", err);
      setDbError(err.message || "분석 오류 발생");
    } finally {
      setLoading(false);
    }
  };

  const handleDomainChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedDomainId(id);
    await runAnalysis(wsId, id);
  };

  const getSeverityColor = (severity: string) => {
    if (severity === "critical") return "bg-red-500/10 text-red-400 border-red-500/20";
    if (severity === "high") return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    return "bg-blue-500/10 text-blue-400 border-blue-500/20";
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto text-slate-100 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}/${workspaceSlug}/semantic-core`}
            className="p-2.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-white rounded-xl border border-white/5 transition-all"
            id="back_btn"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
              Attractor Gap 진단
            </h1>
            <p className="text-xs text-slate-400">도메인 표준 대비 브랜드 특화 Attractor 포트폴리오 정밀 분석</p>
          </div>
        </div>

        {/* Domain Selector */}
        <div className="flex items-center gap-2 bg-slate-800/60 p-1.5 rounded-xl border border-white/5 backdrop-blur-md">
          <span className="text-xs text-slate-400 px-2 font-medium">활성 도메인</span>
          <select
            value={selectedDomainId}
            onChange={handleDomainChange}
            className="bg-slate-900 border-none text-xs text-orange-400 font-bold rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-orange-500/30 cursor-pointer"
            id="domain_select"
          >
            {domains.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.slug})
              </option>
            ))}
          </select>
        </div>
      </div>

      {dbError && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {dbError}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <RefreshCw className="w-7 h-7 animate-spin text-orange-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Portfolio Score Card & Metrics (좌측) */}
          <div className="lg:col-span-1 space-y-6">
            {/* Score Card */}
            <div className="bg-slate-900/60 rounded-2xl border border-white/5 p-6 flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden backdrop-blur-md">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-500/10 to-transparent rounded-bl-full pointer-events-none" />
              
              <Activity className="w-8 h-8 text-orange-400" />
              <div className="space-y-1">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">포트폴리오 달성도 (Readiness)</h3>
                <div className="text-4xl font-extrabold text-transparent bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text font-mono">
                  {portfolioScore.toFixed(0)}%
                </div>
              </div>
              
              <div className="w-full bg-slate-950/60 rounded-full h-2.5 border border-white/5 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-orange-500 to-yellow-500 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${portfolioScore}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500">
                도메인 표준 9개 Attractor 중 완성도가 확보된 활성 자산의 비율입니다.
              </p>
            </div>

            {/* Recomposition Tasks */}
            <div className="bg-slate-900/60 rounded-2xl border border-white/5 p-5 space-y-4 backdrop-blur-md">
              <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5 border-b border-white/5 pb-2.5">
                <Wrench className="w-4 h-4 text-orange-400" /> Recomposition 자동 개선 태스크 ({tasks.length})
              </h3>
              
              {tasks.length === 0 ? (
                <div className="text-center p-6 text-xs text-slate-500">
                  <CheckCircle2 className="w-7 h-7 mx-auto mb-2 text-emerald-500" />
                  지정된 개선 보강 태스크가 없습니다.
                </div>
              ) : (
                <div className="space-y-2">
                  {tasks.map((task, idx) => (
                    <div key={idx} className="p-3 bg-slate-950/40 rounded-xl border border-white/5 flex items-center justify-between gap-3 hover:bg-slate-950/60 transition-all">
                      <span className="text-[11px] font-medium text-slate-300 font-mono line-clamp-1">{task}</span>
                      <button 
                        onClick={() => alert("개선 작업 실행 프로세스가 성공적으로 가동되었습니다.")}
                        className="px-2.5 py-1 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30 text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Flame className="w-3 h-3" /> 실행
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Gap List (우측/중앙) */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider px-1">진단된 자산 결여 및 취약점 ({gaps.length})</h3>
            
            {gaps.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 bg-slate-900/40 rounded-2xl border border-white/5 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                <h4 className="text-sm font-bold text-slate-200">완벽한 얼라인먼트 상태</h4>
                <p className="text-xs text-slate-500">도메인 표준 대비 어떠한 어트랙터 누락이나 Vibe 불합치가 발견되지 않았습니다.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-1">
                {gaps.map((gap, idx) => (
                  <div key={idx} className="p-5 bg-slate-900/60 rounded-2xl border border-white/5 backdrop-blur-md flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${getSeverityColor(gap.severity)}`}>
                          {gap.severity}
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold font-mono">
                          {gap.attractor_id.split('.').slice(-2).join(' / ')}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-200">{gap.description}</h4>
                      <p className="text-[11px] text-slate-400 font-medium">💡 권장 해결책: {gap.recommended_fix}</p>
                    </div>

                    <button
                      onClick={() => alert(`${gap.gap_type} 보정 빌드가 시작되었습니다.`)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-white/5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap self-end md:self-start"
                    >
                      보정 작업 트리거
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
