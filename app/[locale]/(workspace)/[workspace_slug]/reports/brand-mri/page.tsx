"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft, Stethoscope, Activity, TrendingUp, TrendingDown,
  ShieldAlert, Target, AlertTriangle, CheckCircle, Loader2,
  Download, ExternalLink, BarChart2, Layers, Eye, RefreshCw,
  Zap, ChevronRight
} from "lucide-react";
import { BENCHMARK_DOMAINS } from "@/lib/benchmark/domain-config";

export default function BrandMRIPage() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "";
  const locale = (params?.locale as string) || "ko";

  // State
  const [wsId, setWsId] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");

  // MRI Data
  const [observatoryData, setObservatoryData] = useState<any>(null);
  const [gapData, setGapData] = useState<any>(null);
  const [strategyMatrix, setStrategyMatrix] = useState<any>(null);
  const [salesGap, setSalesGap] = useState<any>(null);
  const [bmriScore, setBmriScore] = useState<any>(null);

  const domainConfig = selectedDomain ? BENCHMARK_DOMAINS[selectedDomain as keyof typeof BENCHMARK_DOMAINS] : undefined;
  const brands = domainConfig?.brands ?? [];

  useEffect(() => {
    initPage();
  }, [workspaceSlug]);

  const initPage = async () => {
    setLoading(true);
    try {
      const { resolveWorkspaceSlug } = await import("@/app/actions/workspace");
      const resolved = await resolveWorkspaceSlug(workspaceSlug);
      if (resolved) {
        setWsId(resolved);
        setSelectedDomain(Object.keys(BENCHMARK_DOMAINS)[0] || "");
      }
    } catch (err) {
      console.error("Failed to init Brand MRI:", err);
    } finally {
      setLoading(false);
    }
  };

  const runMRI = useCallback(async () => {
    if (!wsId || !selectedDomain) return;
    setLoading(true);

    try {
      // 병렬 데이터 로드
      const [obsModule, semanticModule, qisBridgeModule, salesModule] = await Promise.all([
        import("@/app/actions/observatory"),
        import("@/app/actions/semantic"),
        import("@/app/actions/qis-bridge"),
        import("@/app/actions/sales-automation"),
      ]);

      const [latestMetrics, gapResult, stratResult] = await Promise.allSettled([
        // 1. Observatory 최신 메트릭
        obsModule.listAllLatestMetrics(wsId),
        // 2. Attractor Gap 분석
        selectedBrand
          ? semanticModule.calculatePortfolioScore(wsId, selectedBrand, selectedDomain)
          : Promise.resolve(null),
        // 3. QVS×AEPI 전략 매트릭스
        qisBridgeModule.getQvsAepiStrategyMatrix(wsId, selectedDomain),
      ]);

      // B-MRI 점수 계산
      try {
        const bmriModule = await import("@/lib/metrics/b-mri");
        // computeBMRI는 순수 함수: (AAS, OCR, BSF, QTC, GCTR, ARS, competitorAas, confidencePenalty, volatilityPenalty)
        // Observatory 메트릭에서 추출하여 계산
        const metrics = latestMetrics.status === "fulfilled" && Array.isArray(latestMetrics.value) ? latestMetrics.value : [];
        const getMetricVal = (name: string) => {
          const m = metrics.find((m: any) => m.metric_key === name || m.name === name);
          return m?.value ?? 0;
        };
        const score = bmriModule.computeBMRI(
          getMetricVal("aas"), getMetricVal("ocr"), getMetricVal("bsf"),
          getMetricVal("qtc"), getMetricVal("gctr"), getMetricVal("ars"),
          getMetricVal("competitor_aas"), getMetricVal("confidence_penalty"), getMetricVal("volatility_penalty")
        );
        setBmriScore(score);
      } catch {
        setBmriScore(null);
      }

      setObservatoryData(latestMetrics.status === "fulfilled" ? latestMetrics.value : null);
      setGapData(gapResult.status === "fulfilled" ? gapResult.value : null);
      setStrategyMatrix(stratResult.status === "fulfilled" ? stratResult.value : null);
    } catch (err) {
      console.error("MRI analysis failed:", err);
    } finally {
      setLoading(false);
    }
  }, [wsId, selectedDomain, selectedBrand]);

  useEffect(() => {
    if (wsId && selectedDomain) runMRI();
  }, [wsId, selectedDomain, selectedBrand]);

  // Score 표시 컴포넌트
  const ScoreGauge = ({ label, score, max = 100, color = "cyan" }: { label: string; score: number; max?: number; color?: string }) => {
    const pct = Math.min(100, Math.max(0, (score / max) * 100));
    const colors: Record<string, string> = {
      cyan: "from-cyan-500 to-blue-500",
      emerald: "from-emerald-500 to-green-500",
      amber: "from-amber-500 to-orange-500",
      red: "from-red-500 to-rose-500",
      purple: "from-purple-500 to-violet-500",
    };
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <div className="text-xs text-slate-400 mb-1">{label}</div>
        <div className="text-2xl font-bold text-white">{typeof score === "number" ? score.toFixed(1) : "—"}</div>
        <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
          <div className={`h-full rounded-full bg-gradient-to-r ${colors[color] || colors.cyan}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  };

  if (loading && !observatoryData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href={`/${locale}/${workspaceSlug}/reports`}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-rose-400" />
            Brand MRI 리포트
          </h1>
          <p className="text-sm text-slate-400 mt-1">AI 시대 브랜드 건강 진단 — 5엔진 스냅샷 + Attractor 갭 + 처방</p>
        </div>
        <div className="ml-auto flex gap-3">
          <button
            onClick={runMRI}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            새로고침
          </button>
        </div>
      </div>

      {/* 도메인/브랜드 선택 */}
      <div className="flex gap-4 mb-8">
        <select
          value={selectedDomain}
          onChange={e => { setSelectedDomain(e.target.value); setSelectedBrand(""); }}
          className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-sm text-white"
        >
          {Object.entries(BENCHMARK_DOMAINS).map(([key, cfg]) => (
            <option key={key} value={key} className="bg-slate-900">{(cfg as any).label || key}</option>
          ))}
        </select>
        {brands.length > 0 && (
          <select
            value={selectedBrand}
            onChange={e => setSelectedBrand(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-sm text-white"
          >
            <option value="" className="bg-slate-900">전체 (도메인 레벨)</option>
            {brands.map((b: any) => (
              <option key={b.slug} value={b.slug} className="bg-slate-900">{b.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* ── Section 1: B-MRI 종합 점수 ── */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 rounded-2xl p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-rose-400" />
          AI 시대 브랜드 건강 종합 점수 (B-MRI)
        </h2>
        <div className="grid grid-cols-5 gap-4">
          <ScoreGauge label="종합 B-MRI" score={bmriScore?.composite || 0} color="purple" />
          <ScoreGauge label="AI 가시성" score={bmriScore?.dimensions?.ai_visibility || 0} color="cyan" />
          <ScoreGauge label="콘텐츠 품질" score={bmriScore?.dimensions?.content_quality || 0} color="emerald" />
          <ScoreGauge label="브랜드 중심성" score={bmriScore?.dimensions?.brand_centrality || 0} color="amber" />
          <ScoreGauge label="리스크 관리" score={bmriScore?.dimensions?.risk_management || 0} color="red" />
        </div>
      </div>

      {/* ── Section 2: AI 5엔진 스냅샷 ── */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5 text-cyan-400" />
          AI 5엔진 스냅샷
        </h2>
        {observatoryData && Array.isArray(observatoryData) ? (
          <div className="grid grid-cols-5 gap-4">
            {observatoryData.slice(0, 5).map((metric: any, i: number) => {
              const engines = ["Google AI Overview", "ChatGPT", "Perplexity", "Claude", "Gemini"];
              const icon = i === 0 ? "🔍" : i === 1 ? "💬" : i === 2 ? "🔮" : i === 3 ? "🤖" : "✨";
              return (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="text-lg mb-1">{icon}</div>
                  <div className="text-xs text-slate-400">{engines[i] || metric.engine || `Engine ${i + 1}`}</div>
                  <div className="text-xl font-bold text-white mt-1">
                    {metric.value != null ? `${Number(metric.value).toFixed(1)}%` : "—"}
                  </div>
                  <div className="flex items-center gap-1 text-xs mt-1">
                    {metric.delta > 0 ? (
                      <><TrendingUp className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400">+{metric.delta?.toFixed(1)}</span></>
                    ) : metric.delta < 0 ? (
                      <><TrendingDown className="w-3 h-3 text-red-400" /><span className="text-red-400">{metric.delta?.toFixed(1)}</span></>
                    ) : (
                      <span className="text-slate-500">변동 없음</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Observatory 메트릭 데이터가 없습니다.</p>
            <Link href={`/${locale}/${workspaceSlug}/observatory`} className="text-cyan-400 text-sm mt-2 inline-block">
              Observatory에서 Probe 실행하기 →
            </Link>
          </div>
        )}
      </div>

      {/* ── Section 3: QVS×AEPI 전략 매트릭스 ── */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-amber-400" />
          QVS × AEPI 전략 매트릭스
        </h2>
        {strategyMatrix?.matrix ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <div className="text-sm font-medium text-red-400 mb-1">🔴 위협 (높은 QVS + 낮은 AEPI)</div>
              <div className="text-2xl font-bold">{strategyMatrix.summary?.threat || 0}</div>
              <div className="text-xs text-slate-400 mt-1">즉시 대응 필요 질문</div>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
              <div className="text-sm font-medium text-emerald-400 mb-1">🟢 핵심 (높은 QVS + 높은 AEPI)</div>
              <div className="text-2xl font-bold">{strategyMatrix.summary?.core || 0}</div>
              <div className="text-xs text-slate-400 mt-1">강점 유지 질문</div>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              <div className="text-sm font-medium text-amber-400 mb-1">🟡 유지 (낮은 QVS + 높은 AEPI)</div>
              <div className="text-2xl font-bold">{strategyMatrix.summary?.maintain || 0}</div>
              <div className="text-xs text-slate-400 mt-1">효율적 유지 질문</div>
            </div>
            <div className="bg-slate-500/10 border border-slate-500/20 rounded-xl p-4">
              <div className="text-sm font-medium text-slate-400 mb-1">⚪ 무시 (낮은 QVS + 낮은 AEPI)</div>
              <div className="text-2xl font-bold">{strategyMatrix.summary?.ignore || 0}</div>
              <div className="text-xs text-slate-400 mt-1">리소스 투입 불필요</div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-slate-500 text-sm">전략 매트릭스 데이터 없음</div>
        )}
      </div>

      {/* ── Section 4: Attractor 포트폴리오 갭 ── */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-400" />
          Attractor 포트폴리오 갭 분석
        </h2>
        {gapData ? (
          <div className="space-y-3">
            <div className="flex items-center gap-4 mb-4">
              <ScoreGauge label="포트폴리오 점수" score={gapData.portfolioScore || gapData.score || 0} color="purple" />
              <div className="flex-1 grid grid-cols-4 gap-3 text-sm">
                {["missing_attractor", "weak_attractor", "misaligned_attractor", "trust_gap"].map(type => {
                  const count = (gapData.gaps || []).filter((g: any) => g.gap_type === type).length;
                  return (
                    <div key={type} className="bg-white/5 rounded-xl p-3 text-center">
                      <div className="text-lg font-bold text-white">{count}</div>
                      <div className="text-xs text-slate-400">{type.replace(/_/g, " ")}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            {(gapData.gaps || []).slice(0, 5).map((gap: any, i: number) => (
              <div key={i} className={`p-3 rounded-xl border ${
                gap.severity === "critical" ? "bg-red-500/10 border-red-500/20" :
                gap.severity === "high" ? "bg-amber-500/10 border-amber-500/20" :
                "bg-white/5 border-white/10"
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{gap.diagnosis || gap.gap_type}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    gap.severity === "critical" ? "bg-red-500/20 text-red-400" :
                    gap.severity === "high" ? "bg-amber-500/20 text-amber-400" :
                    "bg-slate-500/20 text-slate-400"
                  }`}>{gap.severity}</span>
                </div>
                {gap.recommended_fix && (
                  <div className="text-xs text-slate-400 mt-1">처방: {gap.recommended_fix}</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-500 text-sm">
            브랜드를 선택하면 Attractor 갭 분석이 실행됩니다.
          </div>
        )}
      </div>

      {/* ── Section 5: 처방 액션 플랜 ── */}
      <div className="bg-gradient-to-br from-cyan-950/50 to-blue-950/50 border border-cyan-500/20 rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-cyan-400" />
          처방 액션 플랜
        </h2>
        <div className="space-y-3">
          {/* 위협 질문 → Answer Factory 연결 */}
          {strategyMatrix?.summary?.threat > 0 && (
            <Link
              href={`/${locale}/${workspaceSlug}/semantic-core/answer-factory`}
              className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <div className="text-sm font-medium">위협 질문 {strategyMatrix.summary.threat}개 → Answer Asset 생성</div>
                  <div className="text-xs text-slate-400">높은 검색량이지만 AI 답변이 없는 질문에 선제 대응</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
            </Link>
          )}

          {/* Attractor Gap → Attractor 생성 연결 */}
          {gapData?.gaps?.filter((g: any) => g.severity === "critical").length > 0 && (
            <Link
              href={`/${locale}/${workspaceSlug}/semantic-core/attractors`}
              className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Target className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <div className="text-sm font-medium">Critical Attractor Gap {gapData.gaps.filter((g: any) => g.severity === "critical").length}개 해소</div>
                  <div className="text-xs text-slate-400">누락/약한 Attractor 패턴을 생성하여 답변 품질 강화</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
            </Link>
          )}

          {/* Observatory 재진단 */}
          <Link
            href={`/${locale}/${workspaceSlug}/observatory`}
            className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <Eye className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <div className="text-sm font-medium">AI 5엔진 재진단 실행</div>
                <div className="text-xs text-slate-400">최신 AI 답변 상태를 Observatory에서 추적</div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  );
}
