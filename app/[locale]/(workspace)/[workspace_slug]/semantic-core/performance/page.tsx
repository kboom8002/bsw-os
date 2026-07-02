"use client";

import React, { useState, useEffect, startTransition } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslation } from "@/lib/i18n/context";
import { getSignalPerformanceData, triggerWeightRecalibration } from "@/app/actions/semantic";
import { 
  ArrowLeft, 
  TrendingUp, 
  RefreshCw, 
  AlertTriangle, 
  Loader2, 
  CheckCircle,
  AlertCircle,
  Eye,
  MousePointerClick,
  Sparkles,
  Award
} from "lucide-react";

interface PerformanceRecord {
  id: string;
  signal_id: string;
  promoted_at: string;
  impressions_30d: number;
  clicks_30d: number;
  ctr_30d?: number;
  ai_mention_rate: number;
  realized_value?: number;
  is_anomaly?: boolean;
  anomaly_reason?: string;
  question_signals?: {
    query: string;
    cps_score: number;
    qvs_total: number;
  };
}

export default function SignalPerformancePage() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";
  const locale = (params?.locale as string) || "ko";
  const { t } = useTranslation();

  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<PerformanceRecord[]>([]);
  
  // Recalibration states
  const [calibrating, setCalibrating] = useState(false);
  const [calibResult, setCalibResult] = useState<{ success: boolean; message: string; weights?: any } | null>(null);

  // Resolve Workspace ID from Slug
  useEffect(() => {
    async function resolveWorkspace() {
      try {
        const { getSupabaseClient } = await import("@/lib/supabase");
        const supabase = getSupabaseClient();
        const { data, error: wsError } = await supabase
          .from("workspaces")
          .select("id")
          .eq("slug", workspaceSlug)
          .single();

        if (wsError || !data) {
          // Fallback to default
          setWorkspaceId("11111111-1111-1111-1111-111111111111");
        } else {
          setWorkspaceId(data.id);
        }
      } catch (err) {
        setWorkspaceId("11111111-1111-1111-1111-111111111111");
      }
    }
    resolveWorkspace();
  }, [workspaceSlug]);

  const loadData = async () => {
    if (!workspaceId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getSignalPerformanceData(workspaceId);
      setRecords(data);
    } catch (err: any) {
      setError(err.message || "성과 데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId) {
      loadData();
    }
  }, [workspaceId]);

  const handleRecalibrate = async () => {
    setCalibrating(true);
    setCalibResult(null);
    try {
      const res = await triggerWeightRecalibration(workspaceId);
      setCalibResult(res);
      if (res.success) {
        loadData();
      }
    } catch (err: any) {
      setCalibResult({
        success: false,
        message: err.message || "가중치 재조정 중 오류가 발생했습니다."
      });
    } finally {
      setCalibrating(false);
    }
  };

  const totalImpressions = records.reduce((sum, r) => sum + (r.impressions_30d || 0), 0);
  const totalClicks = records.reduce((sum, r) => sum + (r.clicks_30d || 0), 0);
  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const anomaliesCount = records.filter(r => r.is_anomaly).length;

  return (
    <div className="space-y-8 p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}/${workspaceSlug}/semantic-core`}
            className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="text-xs text-cyan-400 font-mono flex items-center gap-1">
              <Award className="w-3.5 h-3.5" /> FEEDBACK & OPTIMIZATION LOOP
            </div>
            <h1 className="text-2xl font-extrabold text-white">시그널 성과 피드백 루프</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 text-xs font-bold rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> 새로고침
          </button>
          
          <button
            onClick={handleRecalibrate}
            disabled={calibrating || records.length < 10}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-400 hover:to-indigo-400 text-white flex items-center gap-1.5 transition-all shadow-lg shadow-indigo-500/10 disabled:opacity-40"
          >
            <Sparkles className="w-3.5 h-3.5" /> OLS 가중치 재조정
          </button>
        </div>
      </div>

      {/* Recalibration Result banner */}
      {calibResult && (
        <div className={`p-4 rounded-xl border flex flex-col gap-2 text-sm ${
          calibResult.success 
            ? "border-violet-500/20 text-violet-300 bg-violet-950/10" 
            : "border-red-500/20 text-red-400 bg-red-950/10"
        }`}>
          <div className="flex items-center gap-2 font-bold">
            {calibResult.success ? <CheckCircle className="w-4 h-4 text-violet-400" /> : <AlertCircle className="w-4 h-4" />}
            <span>{calibResult.message}</span>
          </div>
          {calibResult.success && calibResult.weights && (
            <div className="mt-2 text-xs bg-slate-950/50 p-3 rounded-lg border border-white/5 font-mono grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-400">
              {Object.entries(calibResult.weights).map(([k, v]) => (
                <div key={k} className="flex justify-between border-r border-white/5 pr-2">
                  <span>{k}:</span>
                  <span className="font-bold text-violet-400">{(v as number).toFixed(4)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/40 relative overflow-hidden">
          <div className="text-slate-400 text-xs font-semibold">30일 누적 노출수</div>
          <div className="text-2xl font-black text-white mt-2 flex items-baseline gap-1">
            {totalImpressions.toLocaleString()}
            <span className="text-xs text-slate-500 font-normal">회</span>
          </div>
          <Eye className="absolute right-4 bottom-4 w-12 h-12 text-white/5 pointer-events-none" />
        </div>

        <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/40 relative overflow-hidden">
          <div className="text-slate-400 text-xs font-semibold">30일 누적 클릭수</div>
          <div className="text-2xl font-black text-cyan-400 mt-2 flex items-baseline gap-1">
            {totalClicks.toLocaleString()}
            <span className="text-xs text-slate-500 font-normal">회</span>
          </div>
          <MousePointerClick className="absolute right-4 bottom-4 w-12 h-12 text-cyan-500/5 pointer-events-none" />
        </div>

        <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/40 relative overflow-hidden">
          <div className="text-slate-400 text-xs font-semibold">평균 CTR</div>
          <div className="text-2xl font-black text-emerald-400 mt-2">
            {avgCtr.toFixed(2)}%
          </div>
          <TrendingUp className="absolute right-4 bottom-4 w-12 h-12 text-emerald-500/5 pointer-events-none" />
        </div>

        <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/40 relative overflow-hidden">
          <div className="text-slate-400 text-xs font-semibold">탐지된 성과 이상치</div>
          <div className={`text-2xl font-black mt-2 ${anomaliesCount > 0 ? "text-yellow-400" : "text-slate-500"}`}>
            {anomaliesCount}건
          </div>
          <AlertTriangle className="absolute right-4 bottom-4 w-12 h-12 text-yellow-500/5 pointer-events-none" />
        </div>
      </div>

      {/* Main Table area */}
      <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 space-y-4">
        <h2 className="text-sm font-bold text-slate-300">시그널 추적 및 성과 로그</h2>

        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
            <span className="text-sm font-semibold">성과 데이터를 분석하는 중...</span>
          </div>
        ) : error ? (
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6 text-center space-y-2">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
            <p className="text-sm font-bold text-red-400">데이터 로드 오류</p>
            <p className="text-xs text-slate-500">{error}</p>
            <button onClick={loadData} className="mt-2 px-3 py-1.5 text-xs font-bold rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10">재시도</button>
          </div>
        ) : records.length === 0 ? (
          <div className="border border-dashed border-white/10 rounded-xl p-12 text-center space-y-2">
            <TrendingUp className="h-8 w-8 text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-slate-400">추적 중인 성과 데이터가 없습니다</p>
            <p className="text-xs text-slate-500">시그널을 승격하면 자동으로 피드백 성과 추적이 시작됩니다.</p>
            {records.length < 10 && (
              <div className="text-[11px] text-yellow-500/80 bg-yellow-500/5 border border-yellow-500/10 p-3 rounded-lg max-w-md mx-auto mt-4 leading-normal">
                ⚠️ OLS 가중치 자동 역산을 위해서는 최소 10개 이상의 누적 성과 시그널이 필요합니다 (현재: {records.length}개).
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-slate-400 font-semibold">
                  <th className="py-3 px-4">추적 대상 시그널</th>
                  <th className="py-3 px-4 text-center">CPS 점수</th>
                  <th className="py-3 px-4 text-center">QVS 총점</th>
                  <th className="py-3 px-4 text-right">노출 (30일)</th>
                  <th className="py-3 px-4 text-right">클릭 (30일)</th>
                  <th className="py-3 px-4 text-right">AI 언급률</th>
                  <th className="py-3 px-4 text-right">산출된 실현가치</th>
                  <th className="py-3 px-4 text-center">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {records.map((record) => {
                  const signal = record.question_signals;
                  const ctr = record.impressions_30d > 0 ? (record.clicks_30d / record.impressions_30d) * 100 : 0;
                  return (
                    <tr key={record.id} className="hover:bg-white/5 transition-all text-slate-300 font-medium">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white text-sm">{signal?.query || "알 수 없는 쿼리"}</div>
                        <div className="text-[10px] text-slate-500 mt-1 font-mono">승격일: {new Date(record.promoted_at).toLocaleDateString()}</div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-400">
                        {signal?.cps_score?.toFixed(1) || "-"}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-400">
                        {signal?.qvs_total?.toFixed(1) || "-"}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold">
                        {record.impressions_30d?.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-cyan-400">
                        {record.clicks_30d?.toLocaleString()}
                        <span className="text-[10px] text-slate-500 font-normal ml-1">({ctr.toFixed(1)}% CTR)</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-violet-400">
                        {(record.ai_mention_rate * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                        {record.realized_value ? record.realized_value.toFixed(1) : "0.0"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {record.is_anomaly ? (
                          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" title={record.anomaly_reason}>
                            <AlertTriangle className="w-3 h-3" /> 이상치
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle className="w-3 h-3" /> 수렴됨
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
