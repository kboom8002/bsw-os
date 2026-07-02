"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslation } from "@/lib/i18n/context";
import { getQvsAepiStrategyMatrix } from "@/app/actions/qis-bridge";
import { QvsAepiMatrix } from "@/components/benchmark/QvsAepiMatrix";
import { ArrowLeft, TrendingUp, AlertTriangle, RefreshCw } from "lucide-react";

export default function StrategyPage() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";
  const locale = (params?.locale as string) || "ko";
  const { t } = useTranslation();

  const [wsId, setWsId] = useState<string>("");
  const [matrixData, setMatrixData] = useState<any[]>([]);
  const [summary, setSummary] = useState({ threat: 0, core: 0, ignore: 0, maintain: 0 });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    initPage();
  }, [workspaceSlug]);

  const initPage = async () => {
    setLoading(true);
    setErrorMsg(null);
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
        await loadMatrix(ws.id);
      } else {
        setErrorMsg("워크스페이스를 찾을 수 없습니다.");
      }
    } catch (err: any) {
      console.error("Failed to initialize strategy page:", err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMatrix = async (currentWsId: string) => {
    try {
      const searchParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
      const subIndustryKey = searchParams.get("domain") || "skincare";
      const result = await getQvsAepiStrategyMatrix(currentWsId, subIndustryKey);
      setMatrixData(result.matrix || []);
      setSummary(result.summary || { threat: 0, core: 0, ignore: 0, maintain: 0 });
    } catch (err: any) {
      console.error("Failed to load strategy matrix:", err);
      setErrorMsg("매트릭스 데이터를 불러오지 못했습니다. 벤치마크 데이터를 먼저 생성해 주세요.");
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-5xl w-full mx-auto text-slate-100 bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="flex items-center gap-4">
          <Link 
            href={`/${locale}/${workspaceSlug}/semantic-core`}
            className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="text-xs text-cyan-400 font-mono">QIS 전략 분석</div>
            <h1 className="text-2xl font-extrabold text-white">QVS × AEPI 전략 매트릭스</h1>
          </div>
        </div>
        <button
          onClick={() => wsId && loadMatrix(wsId)}
          className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all flex items-center gap-1.5 text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          새로고침
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          <span className="text-slate-400 text-sm">전략 매트릭스 데이터 불러오는 중...</span>
        </div>
      ) : errorMsg ? (
        <div className="p-6 rounded-2xl border border-red-500/20 bg-red-950/10 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
          <h3 className="font-bold text-white text-base">데이터 부족 또는 실행 에러</h3>
          <p className="text-slate-400 text-xs max-w-md mx-auto">{errorMsg}</p>
          <div className="pt-2">
            <Link
              href={`/${locale}/${workspaceSlug}/semantic-core`}
              className="inline-block px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg border border-white/10"
            >
              대시보드로 돌아가기
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Quadrant Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Threat */}
            <div className="p-4 rounded-xl border border-red-500/20 bg-red-950/10">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-red-400">🔴 위협 영역 (Threat)</span>
                <span className="text-xs font-mono bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded-full font-bold">{summary.threat}</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                소비자 가치는 높은데 자사 커버리지가 부실한 영역. 최우선 콘텐츠 기획 필요.
              </p>
            </div>

            {/* Core */}
            <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-950/10">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-indigo-400">💎 핵심 영역 (Core)</span>
                <span className="text-xs font-mono bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded-full font-bold">{summary.core}</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                고가치 질문이자 자사 선점도 우수한 영역. 방어 및 정교한 주장 전파 필요.
              </p>
            </div>

            {/* Maintain */}
            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/10">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-emerald-400">🟢 유지 영역 (Maintain)</span>
                <span className="text-xs font-mono bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full font-bold">{summary.maintain}</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                저가치이지만 이미 선점한 안전 영역. 비용 대비 최적의 상시 유지 권장.
              </p>
            </div>

            {/* Ignore */}
            <div className="p-4 rounded-xl border border-slate-500/20 bg-slate-950/10">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-400">⚪ 모니터링 영역 (Ignore)</span>
                <span className="text-xs font-mono bg-slate-500/20 text-slate-300 px-1.5 py-0.5 rounded-full font-bold">{summary.ignore}</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                가치가 낮고 선점도 약한 단순 모니터링 영역. 우선순위 보류.
              </p>
            </div>
          </div>

          {/* Scatter Plot Chart */}
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/30">
            <h3 className="font-bold text-sm text-white mb-4">4사분면 분포 시각화 (X: 선점 성능, Y: 질문 가치)</h3>
            <div className="h-[450px]">
              <QvsAepiMatrix items={matrixData} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const Loader2 = ({ className }: { className?: string }) => (
  <div className={`border-2 border-cyan-400 border-t-transparent rounded-full animate-spin ${className}`} style={{ width: '1.5rem', height: '1.5rem' }} />
);
