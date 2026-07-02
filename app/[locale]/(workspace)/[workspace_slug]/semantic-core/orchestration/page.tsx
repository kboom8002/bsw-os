"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslation } from "@/lib/i18n/context";
import { BENCHMARK_DOMAINS } from "@/lib/benchmark/domain-config";
import { getPipelineReadiness, createPipelineRun, updatePipelineRun, seedDemoData } from "@/app/actions/semantic";
import { deleteAuditRun, getAuditRunHistory, resolveWorkspaceSlug } from "@/app/actions/workspace";
import { runE2EPipeline } from "@/app/actions/qis-bridge";
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Cpu,
  Layers,
  Play,
  CheckCircle,
  Database,
  HelpCircle,
  BarChart2,
  Activity,
  GitFork,
  ArrowRight,
  Trash2,
  Filter
} from "lucide-react";

interface RecentRunItem {
  id: string;
  pipeline_type: string;
  domain_key: string;
  brand_slug: string;
  status: string;
  result_summary: any;
  error_message: string;
  started_at: string;
  completed_at: string;
  duration_ms: number;
}

interface ReadinessData {
  benchmarkCount: number;
  goldenCount: number;
  auditCount: number;
  deepDiveCount: number;
  tcoCount: number;
  kgCount: number;
  signalCount: number;
  cqCount: number;
  sceneCount: number;
  recentRuns: RecentRunItem[];
}

export default function OrchestrationPage() {
  const params = useParams();
  const { t } = useTranslation();
  const locale = (params?.locale as string) || "ko";
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";
  const [workspaceId, setWorkspaceId] = useState<string>('');
  
  const [selectedDomain, setSelectedDomain] = useState('skincare');
  const [selectedBrand, setSelectedBrand] = useState('dr-o');
  
  const [loading, setLoading] = useState(true);
  const [runningPipeline, setRunningPipeline] = useState(false);
  const [pipelineLogs, setPipelineLogs] = useState<string[]>([]);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<{ success: boolean; message: string } | null>(null);
  const [deletingRunId, setDeletingRunId] = useState<string | null>(null);
  const [runTypeFilter, setRunTypeFilter] = useState<string>('all');
  const [readiness, setReadiness] = useState<ReadinessData>({
    benchmarkCount: 0,
    goldenCount: 0,
    auditCount: 0,
    deepDiveCount: 0,
    tcoCount: 0,
    kgCount: 0,
    signalCount: 0,
    cqCount: 0,
    sceneCount: 0,
    recentRuns: []
  });

  const domainConfig = BENCHMARK_DOMAINS[selectedDomain];
  const brands = domainConfig?.brands ?? [];

  useEffect(() => {
    initPage();
  }, [workspaceSlug, selectedDomain]);

  const handleSeedDemo = async () => {
    setSeeding(true);
    setSeedResult(null);
    try {
      const res = await seedDemoData();
      setSeedResult(res);
      if (res.success) {
        initPage();
      }
    } catch (err: any) {
      setSeedResult({ success: false, message: err.message || "시딩 오류 발생" });
    } finally {
      setSeeding(false);
    }
  };

  const initPage = async () => {
    setLoading(true);
    try {
      const wsId = await resolveWorkspaceSlug(workspaceSlug);

      if (wsId) {
        setWorkspaceId(wsId);
        const data = await getPipelineReadiness(wsId, selectedDomain);
        setReadiness(data);
      }
    } catch (err) {
      console.error("Failed to initialize orchestration page:", err);
    } finally {
      setLoading(false);
    }
  };

  const triggerE2EPipeline = async () => {
    if (!workspaceId) return;
    setRunningPipeline(true);
    setPipelineLogs(["[System] Initializing E2E QIS Pipeline Execution...", `[System] Workspace: ${workspaceSlug}`, `[System] Industry: ${selectedDomain}`]);

    let runId = "";
    try {
      // 1. Record Run
      const run = await createPipelineRun(workspaceId, "e2e_qis", selectedDomain, selectedBrand);
      runId = run.id;
      setPipelineLogs(prev => [...prev, `[System] Run ID registered: ${runId}`, "[System] Launching Phase 0: Bootstrap TCO/KG (checks existing data)..."]);

      // 2. Call server action
      const result = await runE2EPipeline(workspaceId, selectedDomain, selectedBrand === "all" ? undefined : selectedBrand, {
        mode: selectedBrand === "all" ? "hub" : "standalone"
      });

      // 3. Complete Run
      await updatePipelineRun(runId, "completed", result);
      
      setPipelineLogs(prev => [
        ...prev,
        `[Phase 0] Bootstrap Completed (Concepts: ${result.phase0_bootstrap?.tcoConcepts || 0}, Ontology: ${result.phase0_bootstrap?.kgNodes || 0})`,
        `[Phase 1] Signal Collection Done (Generated: ${result.phase1_signals?.count || 0})`,
        `[Phase 2] Benchmark Opps Mapped (Imported: ${result.phase2_opportunities?.fedCount || 0})`,
        `[Phase 3] MMR Promotion Executed (Promoted to CQ: ${result.phase3_promotions?.promotedCount || 0})`,
        `[Success] E2E Pipeline completed successfully in ${result.totalDuration ? (result.totalDuration / 1000).toFixed(1) : 0}s.`
      ]);

      // Reload readiness metrics
      const updatedReadiness = await getPipelineReadiness(workspaceId, selectedDomain);
      setReadiness(updatedReadiness);
    } catch (err: any) {
      console.error("Pipeline run failed:", err);
      setPipelineLogs(prev => [...prev, `[Error] Pipeline failed: ${err.message}`]);
      if (runId) {
        await updatePipelineRun(runId, "failed", null, err.message);
      }
    } finally {
      setRunningPipeline(false);
    }
  };

  // Logic to determine step recommendation
  const getWorkflowStep = () => {
    if (readiness.benchmarkCount === 0) return 1;
    if (readiness.goldenCount === 0) return 2;
    if (readiness.auditCount === 0) return 3;
    if (readiness.deepDiveCount === 0) return 4;
    return 5;
  };

  const activeStep = getWorkflowStep();

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-5xl w-full mx-auto text-slate-100 bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-6">
        <div className="flex items-center gap-4">
          <Link
            href={`/${locale}/${workspaceSlug}/semantic-core`}
            className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="text-xs text-cyan-400 font-mono">QIS PIPELINE INTEGRATION CONTROL</div>
            <h1 className="text-2xl font-extrabold text-white">파이프라인 오케스트레이션 대시보드</h1>
          </div>
        </div>
        <button
          onClick={initPage}
          className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Target Selector */}
      <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/40 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-400">도메인 / 업종 선택</label>
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-slate-900 text-slate-100 text-sm font-semibold focus:outline-none focus:border-cyan-500"
          >
            {Object.keys(BENCHMARK_DOMAINS).map(key => (
              <option key={key} value={key}>{BENCHMARK_DOMAINS[key].name} ({key})</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-400">타겟 브랜드 선택</label>
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-slate-900 text-slate-100 text-sm font-semibold focus:outline-none focus:border-cyan-500"
          >
            <option value="all">허브 포털 모드 (브랜드 미지정)</option>
            {brands.map(b => (
              <option key={b.slug} value={b.slug}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {!workspaceId && !loading && (
        <div className="flex items-center gap-2 p-4 text-sm bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>워크스페이스 ID를 확인하지 못했습니다. 데모 모드 또는 시드 데이터 실행을 확인하세요.</span>
        </div>
      )}

      {/* Interactive Dependency Graph */}
      <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 space-y-4">
        <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
          <GitFork className="w-4 h-4 text-cyan-400" />
          파이프라인 의존성 그래프 (Pipeline Dependency Tree)
        </h3>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 border border-white/5 rounded-xl bg-slate-900/60 overflow-x-auto min-w-[500px]">
          {/* Node 1: Benchmark */}
          <div className={`p-4 rounded-xl border w-44 text-center transition-all ${readiness.benchmarkCount > 0 ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400" : "border-slate-800 bg-slate-950 text-slate-500"}`}>
            <BarChart2 className="w-5 h-5 mx-auto mb-2" />
            <div className="text-xs font-extrabold uppercase">1. 업종 벤치마크</div>
            <div className="text-[10px] mt-1 font-mono">{readiness.benchmarkCount} Snapshots</div>
          </div>

          <ArrowRight className="w-5 h-5 text-slate-600 hidden md:block" />

          {/* Node 2: Golden Reference */}
          <div className={`p-4 rounded-xl border w-44 text-center transition-all ${readiness.goldenCount > 0 ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400" : "border-slate-800 bg-slate-950 text-slate-500"}`}>
            <Layers className="w-5 h-5 mx-auto mb-2" />
            <div className="text-xs font-extrabold uppercase">2. 골든 레퍼런스</div>
            <div className="text-[10px] mt-1 font-mono">{readiness.goldenCount} Deliverables</div>
          </div>

          <ArrowRight className="w-5 h-5 text-slate-600 hidden md:block" />

          {/* Node 3: Deep Dive */}
          <div className={`p-4 rounded-xl border w-44 text-center transition-all ${readiness.deepDiveCount > 0 ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400" : "border-slate-800 bg-slate-950 text-slate-500"}`}>
            <Cpu className="w-5 h-5 mx-auto mb-2" />
            <div className="text-xs font-extrabold uppercase">3. 딥 다이브 분석</div>
            <div className="text-[10px] mt-1 font-mono">{readiness.deepDiveCount} Sessions</div>
          </div>

          <ArrowRight className="w-5 h-5 text-slate-600 hidden md:block" />

          {/* Node 4: E2E QIS */}
          <div className={`p-4 rounded-xl border w-44 text-center transition-all ${readiness.signalCount > 0 ? "border-cyan-500/30 bg-cyan-500/5 text-cyan-400 animate-pulse" : "border-slate-800 bg-slate-950 text-slate-500"}`}>
            <Sparkles className="w-5 h-5 mx-auto mb-2" />
            <div className="text-xs font-extrabold uppercase">4. QIS E2E 실행</div>
            <div className="text-[10px] mt-1 font-mono">{readiness.signalCount} Signals</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Workflow execution */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recommended Next Step */}
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/40 space-y-4">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-cyan-400" />
              권장 실행 순서 워크플로우 (Recommended Path)
            </h3>
            
            <div className="space-y-3">
              {/* Step 1: Benchmark */}
              <div className={`flex items-start justify-between gap-4 p-3 rounded-xl border ${activeStep === 1 ? "border-cyan-500/30 bg-cyan-500/5" : "border-white/5 bg-slate-900/40"}`}>
                <div className="space-y-1">
                  <div className="text-xs font-extrabold text-slate-200">Step 1: 업종 실측 벤치마크 프로파일 빌드</div>
                  <div className="text-[11px] text-slate-400">업종 내 선두 브랜드들의 실측 데이터를 수집하여 레퍼런스 기준점을 만듭니다.</div>
                </div>
                {readiness.benchmarkCount > 0 ? (
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                ) : (
                  <Link
                    href={`/${locale}/${workspaceSlug}/site-audit/industry-benchmark`}
                    className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[11px] font-bold rounded-lg transition-all shrink-0"
                  >
                    이동
                  </Link>
                )}
              </div>

              {/* Step 2: Golden Reference */}
              <div className={`flex items-start justify-between gap-4 p-3 rounded-xl border ${activeStep === 2 ? "border-cyan-500/30 bg-cyan-500/5" : "border-white/5 bg-slate-900/40"}`}>
                <div className="space-y-1">
                  <div className="text-xs font-extrabold text-slate-200">Step 2: 골든 레퍼런스 컨센서스 도출</div>
                  <div className="text-[11px] text-slate-400">벤치마크 데이터에서 핵심 디자인 토큰, 섹션 구조, 컨센서스를 추출합니다.</div>
                </div>
                {readiness.goldenCount > 0 ? (
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                ) : readiness.benchmarkCount === 0 ? (
                  <button
                    disabled
                    className="px-3 py-1 bg-slate-800 text-slate-500 text-[11px] font-bold rounded-lg shrink-0 cursor-not-allowed border border-white/5"
                  >
                    이동
                  </button>
                ) : (
                  <Link
                    href={`/${locale}/${workspaceSlug}/golden-reference`}
                    className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[11px] font-bold rounded-lg transition-all shrink-0"
                  >
                    이동
                  </Link>
                )}
              </div>

              {/* Step 3: Site Audit */}
              <div className={`flex items-start justify-between gap-4 p-3 rounded-xl border ${activeStep === 3 ? "border-cyan-500/30 bg-cyan-500/5" : "border-white/5 bg-slate-900/40"}`}>
                <div className="space-y-1">
                  <div className="text-xs font-extrabold text-slate-200">Step 3: 자사 사이트 역설계 감사 (Site Audit)</div>
                  <div className="text-[11px] text-slate-400">자사 사이트의 서피스 구조와 브랜드 지식 그래프(KG)를 추출합니다.</div>
                </div>
                {readiness.auditCount > 0 ? (
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                ) : (
                  <Link
                    href={`/${locale}/site-audit`}
                    className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[11px] font-bold rounded-lg transition-all shrink-0"
                  >
                    이동
                  </Link>
                )}
              </div>

              {/* Step 4: Deep Dive */}
              <div className={`flex items-start justify-between gap-4 p-3 rounded-xl border ${activeStep === 4 ? "border-cyan-500/30 bg-cyan-500/5" : "border-white/5 bg-slate-900/40"}`}>
                <div className="space-y-1">
                  <div className="text-xs font-extrabold text-slate-200">Step 4: 브랜드 딥 다이브 타겟 발굴</div>
                  <div className="text-[11px] text-slate-400">자사 결함(Gap) 분석, 경쟁사 기회 탐색을 통해 최적의 신규 질문 타겟을 발굴합니다.</div>
                </div>
                {readiness.deepDiveCount > 0 ? (
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                ) : (
                  <Link
                    href={`/${locale}/${workspaceSlug}/deep-dive`}
                    className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[11px] font-bold rounded-lg transition-all shrink-0"
                  >
                    이동
                  </Link>
                )}
              </div>

              {/* Step 5: E2E Pipeline */}
              <div className={`flex items-start justify-between gap-4 p-3 rounded-xl border ${activeStep === 5 ? "border-cyan-500/30 bg-cyan-500/5" : "border-white/5 bg-slate-900/40"}`}>
                <div className="space-y-1">
                  <div className="text-xs font-extrabold text-slate-200">Step 5: E2E QIS 풀 파이프라인 최종 가동</div>
                  <div className="text-[11px] text-slate-400">상류 데이터를 기반으로 시그널 수집, 정밀 평가, 질문 자산 승격을 원클릭 실행합니다.</div>
                </div>
                <button
                  onClick={triggerE2EPipeline}
                  disabled={runningPipeline || !workspaceId}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-extrabold rounded-lg transition-all shrink-0 flex items-center gap-1 disabled:opacity-50"
                >
                  {runningPipeline ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  원클릭 가동
                </button>
              </div>
            </div>
          </div>

          {/* Console / Output Logs */}
          {(runningPipeline || pipelineLogs.length > 0) && (
            <div className="p-4 rounded-xl border border-white/5 bg-slate-950 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-400 border-b border-white/5 pb-2">
                <span className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                  ORCHESTRATOR_RUN_CONSOLE
                </span>
                <span className="text-[10px] text-slate-500">v4.0</span>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1 text-cyan-400/90 whitespace-pre-wrap">
                {pipelineLogs.map((log, i) => (
                  <div key={i}>{log}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Readiness matrix */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/40 space-y-4">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              업종 자산 Readiness
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs py-1 border-b border-white/5">
                <span className="text-slate-400">TCO 개념 개수</span>
                <span className="font-mono text-cyan-400 font-bold">{readiness.tcoCount}</span>
              </div>
              <div className="flex justify-between items-center text-xs py-1 border-b border-white/5">
                <span className="text-slate-400">KG 노드 개수</span>
                <span className="font-mono text-cyan-400 font-bold">{readiness.kgCount}</span>
              </div>
              <div className="flex justify-between items-center text-xs py-1 border-b border-white/5">
                <span className="text-slate-400">수집된 시그널</span>
                <span className="font-mono text-cyan-400 font-bold">{readiness.signalCount}</span>
              </div>
              <div className="flex justify-between items-center text-xs py-1 border-b border-white/5">
                <span className="text-slate-400">승격된 질문 (CQ)</span>
                <span className="font-mono text-cyan-400 font-bold">{readiness.cqCount}</span>
              </div>
              <div className="flex justify-between items-center text-xs py-1">
                <span className="text-slate-400">생성된 QIS Scene</span>
                <span className="font-mono text-cyan-400 font-bold">{readiness.sceneCount}</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/40 space-y-4">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              최근 실행 이력
            </h3>

            <div className="space-y-3">
              {readiness.recentRuns.length === 0 ? (
                <div className="text-xs text-slate-500 text-center py-6">실행 이력이 존재하지 않습니다.</div>
              ) : (
                <>
                  {/* Type Filter */}
                  <div className="flex gap-1 flex-wrap">
                    {['all', 'e2e_qis', 'benchmark', 'golden_reference', 'site_audit', 'deep_dive'].map(type => (
                      <button
                        key={type}
                        onClick={() => setRunTypeFilter(type)}
                        className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold transition-all ${
                          runTypeFilter === type
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                            : 'text-slate-500 hover:text-slate-300 border border-transparent'
                        }`}
                      >
                        {type === 'all' ? '전체' : type.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  {readiness.recentRuns
                    .filter(run => runTypeFilter === 'all' || run.pipeline_type === runTypeFilter)
                    .map(run => (
                    <div key={run.id} className="p-2.5 rounded-lg bg-slate-900 border border-white/5 space-y-1 group">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-slate-200 uppercase font-bold">{run.pipeline_type}</span>
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold ${run.status === "completed" ? "bg-emerald-500/10 text-emerald-400" : run.status === "failed" ? "bg-red-500/10 text-red-400" : "bg-cyan-500/10 text-cyan-400 animate-pulse"}`}>
                            {run.status.toUpperCase()}
                          </span>
                          <button
                            onClick={async () => {
                              setDeletingRunId(run.id);
                              try {
                                await deleteAuditRun(run.id);
                                setReadiness(prev => ({
                                  ...prev,
                                  recentRuns: prev.recentRuns.filter(r => r.id !== run.id)
                                }));
                              } catch (err) {
                                console.error('Failed to delete run:', err);
                              } finally {
                                setDeletingRunId(null);
                              }
                            }}
                            disabled={deletingRunId === run.id}
                            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-500/10 text-slate-600 hover:text-red-400 transition-all"
                            title="이 실행 이력 삭제"
                          >
                            {deletingRunId === run.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-500">
                        <span>{new Date(run.started_at).toLocaleDateString('ko-KR')} {new Date(run.started_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
                        {run.duration_ms && <span>{((run.duration_ms || 0) / 1000).toFixed(1)}s</span>}
                      </div>
                      {run.domain_key && (
                        <div className="text-[9px] text-slate-600 font-mono">
                          {run.domain_key}{run.brand_slug ? ` / ${run.brand_slug}` : ''}
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Demo Seeding Card */}
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/40 space-y-4">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              데모 데이터 초기화 시딩
            </h3>
            <p className="text-slate-500 text-xs leading-normal">
              테스트 및 검증을 위해 워크스페이스에 기본 스킨케어, K-뷰티, 웨딩 등의 질문 자산 데모 데이터를 구축합니다.
            </p>
            <button
              onClick={handleSeedDemo}
              disabled={seeding}
              className="w-full py-2.5 text-xs font-bold rounded-xl border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/5 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
            >
              {seeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
              {seeding ? "시딩 진행 중..." : "데모 데이터 생성"}
            </button>
            {seedResult && (
              <div className={`p-2.5 rounded-lg border text-[10px] ${seedResult.success ? "border-green-500/20 text-green-400 bg-green-950/10" : "border-red-500/20 text-red-400 bg-red-950/10"}`}>
                {seedResult.message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
