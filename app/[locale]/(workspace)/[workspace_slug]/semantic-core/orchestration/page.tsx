"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { BENCHMARK_DOMAINS } from "@/lib/benchmark/domain-config";
import { getPipelineReadiness, seedDemoData } from "@/app/actions/semantic";
import { deleteAuditRun, resolveWorkspaceSlug } from "@/app/actions/workspace";
import {
  pausePipelineAction,
  resumePipelineAction,
  retryFromFailedPhaseAction,
  resetBootstrapAction,
  resetPipelineDataAction,
} from "@/app/actions/pipeline-control";
import { PHASE_LABELS, type ResetScope } from "@/lib/pipeline/pipeline-state-manager";
import {
  ArrowLeft, Sparkles, Loader2, AlertTriangle, RefreshCw, Cpu,
  Layers, Play, Pause, SkipForward, RotateCcw, CheckCircle, Database,
  BarChart2, Activity, GitFork, ArrowRight, Trash2, ChevronDown,
  AlertCircle, XCircle, ToggleLeft, ToggleRight, CheckSquare, Square,
  ChevronRight, Zap, Filter, ListFilter, Eye, ArrowUpCircle,
} from "lucide-react";

// ── 타입 ─────────────────────────────────────────────────────────────
interface RecentRunItem {
  id: string; pipeline_type: string; domain_key: string;
  brand_slug: string; status: string; result_summary: any;
  error_message: string; started_at: string; completed_at: string; duration_ms: number;
}

interface ReadinessData {
  benchmarkCount: number; goldenCount: number; auditCount: number;
  deepDiveCount: number; tcoCount: number; kgCount: number;
  signalCount: number; cqCount: number; sceneCount: number; recentRuns: RecentRunItem[];
}

interface PhaseProgress {
  [phase: string]: {
    status: 'pending' | 'running' | 'completed' | 'failed' | 'paused' | 'skipped';
    label: string; completedAt?: string; error?: string;
  };
}

interface Signal {
  id: string; query: string; intent: string; source: string;
  status: string; cps_score: number; volume: number;
  created_at: string; industry_key: string;
}

interface SignalGroup {
  source: string; label: string; count: number; signals: Signal[];
}

type ResetModalScope = ResetScope | null;
type PipelineStep = 'bootstrap' | 'collect' | 'promote' | 'finalize';

// ── 수집 Phase 정의 (개별 토글용) ──────────────────────────────────
const COLLECT_PHASES = [
  { key: 'phase0_5_external',       label: '0.5 외부 시그널 수집',    desc: '외부 컬렉션 트리거 + 변환 + 볼륨 보강' },
  { key: 'phase0_6_hubFeedback',    label: '0.6 Hub 피드백 수신',     desc: 'AI Hub 역방향 피드백 pull' },
  { key: 'phase1_signals',          label: '1. S-OGDE 시그널 생성',   desc: '핵심 AI 시그널 파이프라인' },
  { key: 'phase1b_brandSignals',    label: '1-B 브랜드 순회',         desc: '브랜드별 특화 시그널 (AI 호출, 비용 제한 적용)' },
  { key: 'phase1_5_deepDive',       label: '1.5 딥다이브 분석',       desc: 'Target Discovery → Signal Feed' },
  { key: 'phase2_opportunities',    label: '2. 벤치마크 기회 매핑',   desc: '벤치마크 스냅샷 → 자동 시그널' },
  { key: 'phase2_1_reportGaps',     label: '2.1 리포트 갭 피드',      desc: '업종 리포트 약점 → 시그널' },
  { key: 'phase2_5_surfacePersist', label: '2.5 Surface 역질문',     desc: 'Audit 역질문 → CQ 승격' },
  { key: 'phase2_6_deepDiveEnrich', label: '2.6 딥다이브 보강',       desc: '딥다이브 갭 → 시그널 + CQ' },
];

const SOURCE_LABEL_MAP: Record<string, string> = {
  's_ogde': 'S-OGDE (AI 생성)', 'external_collection': '외부 수집',
  'hub_feedback': 'Hub 피드백', 'deep_dive_target': '딥다이브 타겟',
  'surface_reversal': 'Surface 역질문', 'benchmark_opportunity': '벤치마크 기회',
  'report_weak_bdr': '리포트 갭 (BDR)', 'report_weak_cwr': '리포트 갭 (CWR)',
  'report_prescription': '리포트 처방', 'deep_dive_gap': '딥다이브 갭',
  'deep_dive_weak_bsf': '딥다이브 약점 (BSF)', 'manual': '수동 입력',
};

// ── 컴포넌트 ──────────────────────────────────────────────────────────
export default function OrchestrationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) || "ko";
  const rawSlug = params?.workspace_slug as string;
  const workspaceSlug = (rawSlug && rawSlug !== 'undefined') ? rawSlug : "demo-brand-semantic-lab";
  const domainFromUrl = searchParams.get('domain') || Object.keys(BENCHMARK_DOMAINS)[0];
  const brandFromUrl = searchParams.get('brand') || 'all';
  const [workspaceId, setWorkspaceId] = useState<string>('');

  const [selectedDomain, setSelectedDomain] = useState(domainFromUrl);
  const [selectedBrand, setSelectedBrand] = useState(brandFromUrl);

  const [loading, setLoading] = useState(true);
  const [runningPipeline, setRunningPipeline] = useState(false);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [runStatus, setRunStatus] = useState<string | null>(null);
  const [phaseProgress, setPhaseProgress] = useState<PhaseProgress>({});
  const [pipelineLogs, setPipelineLogs] = useState<string[]>([]);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // 스텝별 상태
  const [activeTab, setActiveTab] = useState<'stepwise' | 'full'>('stepwise');
  const [currentStep, setCurrentStep] = useState<PipelineStep | null>(null);
  const [stepResults, setStepResults] = useState<Record<string, any>>({});

  // 수집 Phase 토글
  const [enabledPhases, setEnabledPhases] = useState<Record<string, boolean>>(
    Object.fromEntries(COLLECT_PHASES.map(p => [p.key, true]))
  );

  // 시그널 선택
  const [signals, setSignals] = useState<Signal[]>([]);
  const [signalGroups, setSignalGroups] = useState<SignalGroup[]>([]);
  const [selectedSignalIds, setSelectedSignalIds] = useState<Set<string>>(new Set());
  const [signalsLoading, setSignalsLoading] = useState(false);
  const [signalFilter, setSignalFilter] = useState<string>('all');

  // 기타 UI 상태
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<{ success: boolean; message: string } | null>(null);
  const [deletingRunId, setDeletingRunId] = useState<string | null>(null);
  const [runTypeFilter, setRunTypeFilter] = useState<string>('all');
  const [resetModal, setResetModal] = useState<ResetModalScope>(null);
  const [resetting, setResetting] = useState(false);
  const [resetResult, setResetResult] = useState<string | null>(null);
  const [controlLoading, setControlLoading] = useState(false);
  const [controlMsg, setControlMsg] = useState<string | null>(null);

  const [readiness, setReadiness] = useState<ReadinessData>({
    benchmarkCount: 0, goldenCount: 0, auditCount: 0, deepDiveCount: 0,
    tcoCount: 0, kgCount: 0, signalCount: 0, cqCount: 0, sceneCount: 0, recentRuns: []
  });

  const domainConfig = BENCHMARK_DOMAINS[selectedDomain];
  const brands = domainConfig?.brands ?? [];

  // ── 폴링 ─────────────────────────────────────────────────────────
  const startPolling = useCallback((runId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/pipeline/e2e/status?runId=${runId}`);
        if (!res.ok) return;
        const data = await res.json();
        setPhaseProgress(data.phases ?? {});
        setRunStatus(data.status);
        if (['completed', 'failed', 'paused'].includes(data.status)) {
          clearInterval(pollRef.current!);
          setRunningPipeline(false);
        }
      } catch {}
    }, 3000);
  }, []);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);
  useEffect(() => { initPage(); }, [workspaceSlug, selectedDomain]);

  const initPage = async () => {
    setLoading(true);
    try {
      const wsId = await resolveWorkspaceSlug(workspaceSlug);
      if (wsId) {
        setWorkspaceId(wsId);
        const data = await getPipelineReadiness(wsId, selectedDomain);
        setReadiness(data);
      }
    } finally { setLoading(false); }
  };

  // ── 시그널 로드 ────────────────────────────────────────────────
  const loadSignals = async () => {
    if (!workspaceId) return;
    setSignalsLoading(true);
    try {
      const res = await fetch(`/api/pipeline/signals?workspaceId=${workspaceId}&domainKey=${selectedDomain}&status=all&limit=300`);
      if (res.ok) {
        const data = await res.json();
        setSignals(data.signals || []);
        setSignalGroups(data.groups || []);
        // 기본 전체 선택
        setSelectedSignalIds(new Set((data.signals || []).map((s: Signal) => s.id)));
      } else {
        console.error('[loadSignals] API error:', res.status, await res.text());
      }
    } finally { setSignalsLoading(false); }
  };

  // ── 파이프라인 API 호출 헬퍼 ──────────────────────────────────
  const callPipelineApi = async (phaseGroup: string, extra: Record<string, any> = {}) => {
    const res = await fetch('/api/pipeline/e2e', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceId,
        domainName: selectedDomain,
        brandName: selectedBrand === 'all' ? undefined : selectedBrand,
        phaseGroup,
        options: { mode: selectedBrand === 'all' ? 'hub' : 'standalone' },
        ...extra,
      }),
    });
    if (res.status === 409) {
      const { error } = await res.json();
      throw new Error(error);
    }
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(error || `HTTP ${res.status}`);
    }
    const { result } = await res.json();
    return result;
  };

  // ── Step 1: Bootstrap ─────────────────────────────────────────
  const runBootstrap = async () => {
    setRunningPipeline(true);
    setCurrentStep('bootstrap');
    setPipelineLogs(['[Step 1] Bootstrap 시작...']);
    try {
      const result = await callPipelineApi('bootstrap');
      const tco = result.phase0_bootstrap?.tcoConcepts ?? 0;
      const kg = result.phase0_bootstrap?.kgNodes ?? 0;
      const skipped = result.phase0_bootstrap?.skipped;
      setStepResults(prev => ({ ...prev, bootstrap: result }));
      setPipelineLogs(prev => [
        ...prev,
        `✅ Bootstrap ${skipped ? '(캐시 사용)' : '완료'} — TCO: ${tco}개, KG 노드: ${kg}개`,
        ...(result.phaseErrors?.length > 0 ? result.phaseErrors.map((e: any) => `⚠️ ${e.phase}: ${e.message}`) : []),
      ]);
      if (result.runId) { setCurrentRunId(result.runId); startPolling(result.runId); }
      const updatedReadiness = await getPipelineReadiness(workspaceId, selectedDomain);
      setReadiness(updatedReadiness);
    } catch (err: any) {
      setPipelineLogs(prev => [...prev, `❌ Bootstrap 실패: ${err.message}`]);
    } finally { setRunningPipeline(false); }
  };

  // ── Step 2: 시그널 수집 ──────────────────────────────────────
  const runCollect = async () => {
    setRunningPipeline(true);
    setCurrentStep('collect');
    const enabled = COLLECT_PHASES.filter(p => enabledPhases[p.key]).map(p => p.key);
    setPipelineLogs(['[Step 2] 시그널 수집 시작...', `활성 Phase: ${enabled.length}개`]);
    try {
      const result = await callPipelineApi('collect', { enabledPhases: enabled });
      const collected = result.phase1_signals?.count ?? 0;
      const external = result.phase0_5_signals?.collected ?? 0;
      setStepResults(prev => ({ ...prev, collect: result }));
      setPipelineLogs(prev => [
        ...prev,
        `✅ 수집 완료`,
        `  · 외부 시그널: ${external}건`,
        `  · S-OGDE 시그널: ${collected}건`,
        result.phase1b_brandSignals ? `  · 브랜드 순회: ${result.phase1b_brandSignals.totalSignals}건` : '',
        result.phase1_5_deepDive ? `  · 딥다이브: ${result.phase1_5_deepDive.targetsFound}개 타겟` : '',
        ...(result.phaseErrors?.length > 0 ? result.phaseErrors.map((e: any) => `  ⚠️ ${e.phase}: ${e.message}`) : []),
      ].filter(Boolean));
      if (result.runId) { setCurrentRunId(result.runId); }
      const updatedReadiness = await getPipelineReadiness(workspaceId, selectedDomain);
      setReadiness(updatedReadiness);
      // 시그널 목록 자동 로드
      await loadSignals();
    } catch (err: any) {
      setPipelineLogs(prev => [...prev, `❌ 수집 실패: ${err.message}`]);
    } finally { setRunningPipeline(false); }
  };

  // ── Step 3: CQ 승격 ──────────────────────────────────────────
  const runPromote = async () => {
    if (selectedSignalIds.size === 0) return;
    setRunningPipeline(true);
    setCurrentStep('promote');
    setPipelineLogs([`[Step 3] CQ 승격 시작 — 선택된 시그널 ${selectedSignalIds.size}개`]);
    try {
      const result = await callPipelineApi('promote', {
        selectedSignalIds: Array.from(selectedSignalIds),
      });
      const promoted = result.phase3_promotions?.promotedCount ?? 0;
      const cqCreated = result.phase3_promotions?.cqCreated ?? 0;
      const assigned = result.phase3_1_brandAssignment?.packagesCreated ?? 0;
      setStepResults(prev => ({ ...prev, promote: result }));
      setPipelineLogs(prev => [
        ...prev,
        `✅ 승격 완료`,
        `  · 승격된 시그널: ${promoted}건`,
        `  · 생성된 CQ: ${cqCreated}개`,
        `  · 브랜드 배정 패키지: ${assigned}개`,
        ...(result.phaseErrors?.length > 0 ? result.phaseErrors.map((e: any) => `  ⚠️ ${e.phase}: ${e.message}`) : []),
      ]);
      const updatedReadiness = await getPipelineReadiness(workspaceId, selectedDomain);
      setReadiness(updatedReadiness);
    } catch (err: any) {
      setPipelineLogs(prev => [...prev, `❌ 승격 실패: ${err.message}`]);
    } finally { setRunningPipeline(false); }
  };

  // ── Step 4: Hub Push + Saturation ──────────────────────────────
  const runFinalize = async () => {
    setRunningPipeline(true);
    setCurrentStep('finalize');
    setPipelineLogs(['[Step 4] Hub Push & 포화도 분석 시작...']);
    try {
      const result = await callPipelineApi('finalize');
      const pushed = result.phase4_hubPush?.pushed;
      const cqCount = result.phase4_hubPush?.cqCount ?? 0;
      const coverage = result.phase5_saturation?.coveragePercent ?? 0;
      setStepResults(prev => ({ ...prev, finalize: result }));
      setPipelineLogs(prev => [
        ...prev,
        `✅ 완료`,
        pushed ? `  · Hub Push: CQ ${cqCount}개 전송` : '  · Hub Push: 비활성',
        `  · 커버리지 포화도: ${coverage.toFixed(1)}%`,
        ...(result.phaseErrors?.length > 0 ? result.phaseErrors.map((e: any) => `  ⚠️ ${e.phase}: ${e.message}`) : []),
      ]);
      const updatedReadiness = await getPipelineReadiness(workspaceId, selectedDomain);
      setReadiness(updatedReadiness);
    } catch (err: any) {
      setPipelineLogs(prev => [...prev, `❌ 완료 실패: ${err.message}`]);
    } finally { setRunningPipeline(false); }
  };

  // ── 전체 실행 (기존 호환) ────────────────────────────────────
  const runFull = async () => {
    setRunningPipeline(true);
    setActiveTab('full');
    setPipelineLogs(['[Full E2E] 전체 파이프라인 시작...', `도메인: ${selectedDomain}`]);
    try {
      const result = await callPipelineApi('full');
      const emoji = result.status === 'success' ? '✅' : result.status === 'partial_success' ? '⚠️' : '❌';
      setPipelineLogs(prev => [
        ...prev,
        `[Phase 0] Bootstrap — TCO: ${result.phase0_bootstrap?.tcoConcepts ?? 0}, KG: ${result.phase0_bootstrap?.kgNodes ?? 0}${result.phase0_bootstrap?.skipped ? ' (캐시)' : ''}`,
        `[Phase 1] 시그널: ${result.phase1_signals?.count ?? 0}건`,
        result.phase1b_brandSignals ? `[Phase 1-B] 브랜드 순회: ${result.phase1b_brandSignals.totalSignals}건` : '',
        `[Phase 3] CQ 승격: ${result.phase3_promotions?.promotedCount ?? 0}건 → CQ ${result.phase3_promotions?.cqCreated ?? 0}개`,
        result.phase4_hubPush?.pushed ? `[Phase 4] Hub Push: CQ ${result.phase4_hubPush.cqCount}개` : '',
        result.phase5_saturation ? `[Phase 5] 포화도: ${result.phase5_saturation.coveragePercent?.toFixed(1)}%` : '',
        ...(result.phaseErrors?.length > 0 ? result.phaseErrors.map((e: any) => `⚠️ ${e.phase}: ${e.message}`) : []),
        `${emoji} 상태: ${result.status} (${result.totalDuration ? (result.totalDuration / 1000).toFixed(1) : 0}s)`,
      ].filter(Boolean));
      if (result.runId) { setCurrentRunId(result.runId); startPolling(result.runId); }
      const updatedReadiness = await getPipelineReadiness(workspaceId, selectedDomain);
      setReadiness(updatedReadiness);
    } catch (err: any) {
      setPipelineLogs(prev => [...prev, `❌ ${err?.message}`]);
    } finally { setRunningPipeline(false); }
  };

  // ── 파이프라인 제어 ──────────────────────────────────────────
  const handlePause = async () => {
    if (!currentRunId) return;
    setControlLoading(true);
    const res = await pausePipelineAction(workspaceSlug, currentRunId);
    setControlMsg(res.message); setRunStatus('pausing'); setControlLoading(false);
  };
  const handleResume = async () => {
    if (!currentRunId) return;
    setControlLoading(true); setRunningPipeline(true);
    const res = await resumePipelineAction(workspaceSlug, currentRunId);
    setControlMsg(res.message);
    if (res.ok) { setRunStatus('running'); startPolling(currentRunId); }
    setControlLoading(false);
  };
  const handleRetry = async () => {
    if (!currentRunId) return;
    setControlLoading(true); setRunningPipeline(true);
    const res = await retryFromFailedPhaseAction(workspaceSlug, currentRunId);
    setControlMsg(res.message);
    if (res.ok) { setRunStatus('running'); startPolling(currentRunId); }
    setControlLoading(false);
  };
  const handleReset = async () => {
    if (!resetModal) return;
    setResetting(true); setResetResult(null);
    try {
      const res = await resetPipelineDataAction(workspaceSlug, selectedDomain, resetModal);
      setResetResult(res.message);
      setCurrentRunId(null); setRunStatus(null); setPhaseProgress({});
      const updatedReadiness = await getPipelineReadiness(workspaceId, selectedDomain);
      setReadiness(updatedReadiness);
    } catch (err: any) { setResetResult(`오류: ${err.message}`); }
    finally { setResetting(false); setResetModal(null); }
  };

  // ── 시그널 선택 헬퍼 ────────────────────────────────────────
  const toggleSignal = (id: string) => {
    setSelectedSignalIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const selectAllInGroup = (group: SignalGroup) => {
    setSelectedSignalIds(prev => {
      const next = new Set(prev);
      group.signals.forEach(s => next.add(s.id));
      return next;
    });
  };
  const deselectAllInGroup = (group: SignalGroup) => {
    setSelectedSignalIds(prev => {
      const next = new Set(prev);
      group.signals.forEach(s => next.delete(s.id));
      return next;
    });
  };

  const filteredSignals = signalFilter === 'all' ? signals
    : signals.filter(s => (s.source || '').startsWith(signalFilter));

  const getWorkflowStep = () => {
    if (readiness.benchmarkCount === 0) return 1;
    if (readiness.goldenCount === 0) return 2;
    if (readiness.auditCount === 0) return 3;
    if (readiness.deepDiveCount === 0) return 4;
    return 5;
  };
  const activeStep = getWorkflowStep();

  // ── Step 진행 표시 ─────────────────────────────────────────
  const PIPELINE_STEPS = [
    { key: 'bootstrap', label: 'Bootstrap', icon: Database, color: 'violet' },
    { key: 'collect',   label: '시그널 수집', icon: Zap,      color: 'cyan' },
    { key: 'promote',   label: 'CQ 승격',    icon: ArrowUpCircle, color: 'emerald' },
    { key: 'finalize',  label: 'Hub 완료',   icon: Sparkles,  color: 'amber' },
  ] as const;

  const stepDone = (key: string) => !!stepResults[key];

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 font-sans max-w-6xl w-full mx-auto text-slate-100 bg-slate-900">
      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b border-white/5 pb-6">
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/${workspaceSlug}/semantic-core`}
            className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="text-xs text-cyan-400 font-mono">QIS PIPELINE INTEGRATION CONTROL</div>
            <h1 className="text-2xl font-extrabold text-white">파이프라인 오케스트레이션</h1>
          </div>
        </div>
        <button onClick={initPage} disabled={loading}
          className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* ── 도메인 / 브랜드 선택 ── */}
      <div className="p-5 rounded-2xl border border-white/5 bg-slate-950/40 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-400">도메인 / 업종 선택</label>
          <select value={selectedDomain} onChange={e => { setSelectedDomain(e.target.value); setSelectedBrand('all'); setSignals([]); setSignalGroups([]); }}
            className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-slate-900 text-slate-100 text-sm font-semibold focus:outline-none focus:border-cyan-500">
            {Object.keys(BENCHMARK_DOMAINS).map(key => (
              <option key={key} value={key}>{BENCHMARK_DOMAINS[key].name} ({key})</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-400">타겟 브랜드 선택</label>
          <select value={selectedBrand} onChange={e => setSelectedBrand(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-slate-900 text-slate-100 text-sm font-semibold focus:outline-none focus:border-cyan-500">
            <option value="all">허브 포털 모드 (브랜드 미지정)</option>
            {brands.map(b => <option key={b.slug} value={b.slug}>{b.name}</option>)}
          </select>
        </div>
      </div>

      {/* ── 실행 모드 탭 ── */}
      <div className="flex gap-2 border-b border-white/5">
        <button onClick={() => setActiveTab('stepwise')}
          className={`px-4 py-2 text-sm font-bold transition-all border-b-2 ${activeTab === 'stepwise' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
          단계별 실행 (Step-by-Step)
        </button>
        <button onClick={() => setActiveTab('full')}
          className={`px-4 py-2 text-sm font-bold transition-all border-b-2 ${activeTab === 'full' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
          원클릭 전체 실행 (E2E)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: 실행 패널 ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* ─────── 단계별 실행 모드 ─────── */}
          {activeTab === 'stepwise' && (
            <div className="space-y-4">
              {/* Step 진행 표시기 */}
              <div className="flex items-center gap-2 p-4 rounded-2xl border border-white/5 bg-slate-950/30">
                {PIPELINE_STEPS.map((step, idx) => {
                  const done = stepDone(step.key);
                  const active = currentStep === step.key && runningPipeline;
                  const Icon = step.icon;
                  return (
                    <React.Fragment key={step.key}>
                      <div className={`flex flex-col items-center gap-1 flex-1 transition-all`}>
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                          done ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400' :
                          active ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400 animate-pulse' :
                          'border-slate-700 bg-slate-800 text-slate-500'
                        }`}>
                          {done ? <CheckCircle className="w-4 h-4" /> : active ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
                        </div>
                        <div className={`text-[10px] font-bold text-center ${done ? 'text-emerald-400' : active ? 'text-cyan-400' : 'text-slate-500'}`}>
                          {step.label}
                        </div>
                      </div>
                      {idx < PIPELINE_STEPS.length - 1 && (
                        <div className={`h-0.5 flex-1 max-w-8 transition-all ${done ? 'bg-emerald-500/50' : 'bg-slate-700'}`} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Step 1: Bootstrap */}
              <div className={`rounded-2xl border p-5 space-y-3 transition-all ${stepDone('bootstrap') ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-white/5 bg-slate-950/40'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className={`w-4 h-4 ${stepDone('bootstrap') ? 'text-emerald-400' : 'text-violet-400'}`} />
                    <span className="text-sm font-bold text-slate-200">Step 1: Bootstrap (TCO/KG)</span>
                    {stepDone('bootstrap') && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">완료</span>}
                  </div>
                  <button onClick={runBootstrap} disabled={runningPipeline || !workspaceId}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs font-bold hover:bg-violet-500/30 transition-all disabled:opacity-40">
                    {runningPipeline && currentStep === 'bootstrap' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    실행
                  </button>
                </div>
                <div className="text-[11px] text-slate-500">TCO 개념 및 온톨로지 KG를 생성합니다. 이미 존재하면 캐시에서 로드합니다.</div>
                {stepDone('bootstrap') && (
                  <div className="flex gap-4 text-xs font-mono">
                    <span className="text-slate-400">TCO: <span className="text-emerald-400 font-bold">{stepResults.bootstrap?.phase0_bootstrap?.tcoConcepts ?? 0}</span></span>
                    <span className="text-slate-400">KG 노드: <span className="text-emerald-400 font-bold">{stepResults.bootstrap?.phase0_bootstrap?.kgNodes ?? 0}</span></span>
                    {stepResults.bootstrap?.phase0_bootstrap?.skipped && <span className="text-slate-500">(캐시 사용)</span>}
                  </div>
                )}
              </div>

              {/* Step 2: 시그널 수집 */}
              <div className={`rounded-2xl border p-5 space-y-4 transition-all ${stepDone('collect') ? 'border-cyan-500/20 bg-cyan-500/5' : 'border-white/5 bg-slate-950/40'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className={`w-4 h-4 ${stepDone('collect') ? 'text-cyan-400' : 'text-cyan-500'}`} />
                    <span className="text-sm font-bold text-slate-200">Step 2: 시그널 수집</span>
                    {stepDone('collect') && <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono">완료</span>}
                  </div>
                  <button onClick={runCollect} disabled={runningPipeline || !workspaceId}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold hover:bg-cyan-500/30 transition-all disabled:opacity-40">
                    {runningPipeline && currentStep === 'collect' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    수집 실행
                  </button>
                </div>

                {/* Phase 개별 토글 */}
                <div className="space-y-2">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide flex items-center gap-1">
                    <ListFilter className="w-3 h-3" /> 수집 Phase 선택 (개별 on/off)
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {COLLECT_PHASES.map(phase => (
                      <button key={phase.key} onClick={() => setEnabledPhases(prev => ({ ...prev, [phase.key]: !prev[phase.key] }))}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${enabledPhases[phase.key] ? 'border-cyan-500/20 bg-cyan-500/5' : 'border-white/5 bg-slate-950/30 opacity-50'}`}>
                        {enabledPhases[phase.key]
                          ? <ToggleRight className="w-4 h-4 text-cyan-400 shrink-0" />
                          : <ToggleLeft className="w-4 h-4 text-slate-600 shrink-0" />}
                        <div className="min-w-0">
                          <div className="text-[11px] font-bold text-slate-300">{phase.label}</div>
                          <div className="text-[10px] text-slate-500 truncate">{phase.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 수집된 시그널 테이블 */}
                {signals.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-bold text-slate-300">
                          수집된 시그널 ({signals.length}건) — {selectedSignalIds.size}개 선택됨
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => setSelectedSignalIds(new Set(signals.map(s => s.id)))}
                          className="text-[10px] px-2 py-1 rounded border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all">
                          전체 선택
                        </button>
                        <button onClick={() => setSelectedSignalIds(new Set())}
                          className="text-[10px] px-2 py-1 rounded border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all">
                          전체 해제
                        </button>
                        <button onClick={loadSignals} disabled={signalsLoading}
                          className="text-[10px] px-2 py-1 rounded border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10 transition-all">
                          {signalsLoading ? <Loader2 className="w-3 h-3 animate-spin inline" /> : '새로고침'}
                        </button>
                      </div>
                    </div>

                    {/* 소스 필터 */}
                    <div className="flex gap-1.5 flex-wrap">
                      <button onClick={() => setSignalFilter('all')}
                        className={`text-[10px] px-2 py-0.5 rounded font-mono transition-all ${signalFilter === 'all' ? 'bg-slate-700 text-slate-200' : 'text-slate-500 hover:text-slate-300'}`}>
                        전체 ({signals.length})
                      </button>
                      {signalGroups.map(g => (
                        <button key={g.source} onClick={() => setSignalFilter(g.source)}
                          className={`text-[10px] px-2 py-0.5 rounded font-mono transition-all ${signalFilter === g.source ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-500 hover:text-slate-300'}`}>
                          {g.label} ({g.count})
                        </button>
                      ))}
                    </div>

                    {/* 소스별 그룹 */}
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {signalGroups
                        .filter(g => signalFilter === 'all' || g.source === signalFilter)
                        .map(group => {
                          const groupSelected = group.signals.filter(s => selectedSignalIds.has(s.id)).length;
                          const allInGroup = groupSelected === group.signals.length;
                          return (
                            <div key={group.source} className="border border-white/5 rounded-xl overflow-hidden">
                              <div className="flex items-center justify-between px-3 py-2 bg-slate-900/80">
                                <div className="flex items-center gap-2">
                                  <button onClick={() => allInGroup ? deselectAllInGroup(group) : selectAllInGroup(group)}
                                    className="text-slate-400 hover:text-white transition-all">
                                    {allInGroup ? <CheckSquare className="w-3.5 h-3.5 text-cyan-400" /> : <Square className="w-3.5 h-3.5" />}
                                  </button>
                                  <span className="text-[11px] font-bold text-slate-300">{group.label}</span>
                                  <span className="text-[10px] text-slate-500 font-mono">{groupSelected}/{group.count}</span>
                                </div>
                              </div>
                              <div className="divide-y divide-white/5">
                                {group.signals.slice(0, 20).map(signal => (
                                  <label key={signal.id} className={`flex items-start gap-2 px-3 py-2 cursor-pointer transition-all ${selectedSignalIds.has(signal.id) ? 'bg-cyan-500/5' : 'hover:bg-white/2'}`}>
                                    <input type="checkbox" checked={selectedSignalIds.has(signal.id)}
                                      onChange={() => toggleSignal(signal.id)}
                                      className="mt-0.5 w-3.5 h-3.5 accent-cyan-500 shrink-0" />
                                    <div className="min-w-0 flex-1">
                                      <div className="text-[11px] text-slate-300 leading-tight">{signal.query}</div>
                                      <div className="flex gap-2 mt-0.5">
                                        <span className="text-[9px] text-slate-500 font-mono">{signal.intent}</span>
                                        {signal.cps_score > 0 && <span className="text-[9px] text-emerald-500 font-mono">CPS:{signal.cps_score.toFixed(2)}</span>}
                                        {signal.volume > 0 && <span className="text-[9px] text-slate-500 font-mono">Vol:{signal.volume}</span>}
                                      </div>
                                    </div>
                                  </label>
                                ))}
                                {group.signals.length > 20 && (
                                  <div className="px-3 py-2 text-[10px] text-slate-500 text-center">... 외 {group.signals.length - 20}건 더 있음</div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* 수집 후 시그널이 없을 때 */}
                {stepDone('collect') && signals.length === 0 && (
                  <button onClick={loadSignals} disabled={signalsLoading}
                    className="w-full py-2 text-xs rounded-xl border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10 transition-all flex items-center justify-center gap-1.5">
                    {signalsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                    수집된 시그널 보기
                  </button>
                )}
              </div>

              {/* Step 3: CQ 승격 */}
              <div className={`rounded-2xl border p-5 space-y-3 transition-all ${stepDone('promote') ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-white/5 bg-slate-950/40'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ArrowUpCircle className={`w-4 h-4 ${stepDone('promote') ? 'text-emerald-400' : 'text-emerald-500'}`} />
                    <span className="text-sm font-bold text-slate-200">Step 3: CQ 승격 & 브랜드 배정</span>
                    {stepDone('promote') && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">완료</span>}
                  </div>
                  <button onClick={runPromote} disabled={runningPipeline || !workspaceId || selectedSignalIds.size === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold hover:bg-emerald-500/30 transition-all disabled:opacity-40">
                    {runningPipeline && currentStep === 'promote' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowUpCircle className="w-3.5 h-3.5" />}
                    {selectedSignalIds.size > 0 ? `선택된 ${selectedSignalIds.size}개 승격` : '시그널 선택 필요'}
                  </button>
                </div>
                <div className="text-[11px] text-slate-500">
                  Step 2에서 선택한 시그널을 CQ(정규 질문)으로 승격하고 브랜드에 배정합니다.
                  선택하지 않으면 MMR 알고리즘이 자동으로 최적 시그널을 선택합니다.
                </div>
                {stepDone('promote') && (
                  <div className="flex gap-4 text-xs font-mono">
                    <span className="text-slate-400">승격: <span className="text-emerald-400 font-bold">{stepResults.promote?.phase3_promotions?.promotedCount ?? 0}</span>건</span>
                    <span className="text-slate-400">CQ 생성: <span className="text-emerald-400 font-bold">{stepResults.promote?.phase3_promotions?.cqCreated ?? 0}</span>개</span>
                    {stepResults.promote?.phase3_1_brandAssignment && (
                      <span className="text-slate-400">브랜드 패키지: <span className="text-emerald-400 font-bold">{stepResults.promote.phase3_1_brandAssignment.packagesCreated ?? 0}</span>개</span>
                    )}
                  </div>
                )}
              </div>

              {/* Step 4: Hub Push & 완료 */}
              <div className={`rounded-2xl border p-5 space-y-3 transition-all ${stepDone('finalize') ? 'border-amber-500/20 bg-amber-500/5' : 'border-white/5 bg-slate-950/40'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className={`w-4 h-4 ${stepDone('finalize') ? 'text-amber-400' : 'text-amber-500'}`} />
                    <span className="text-sm font-bold text-slate-200">Step 4: Hub Push & 포화도 분석</span>
                    {stepDone('finalize') && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono">완료</span>}
                  </div>
                  <button onClick={runFinalize} disabled={runningPipeline || !workspaceId}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold hover:bg-amber-500/30 transition-all disabled:opacity-40">
                    {runningPipeline && currentStep === 'finalize' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    완료
                  </button>
                </div>
                <div className="text-[11px] text-slate-500">CQ와 QIS Scene을 AI Hub에 Push하고 커버리지 포화도를 분석합니다.</div>
                {stepDone('finalize') && (
                  <div className="flex gap-4 text-xs font-mono">
                    {stepResults.finalize?.phase4_hubPush?.pushed && (
                      <span className="text-slate-400">Hub Push: <span className="text-amber-400 font-bold">CQ {stepResults.finalize.phase4_hubPush.cqCount}개</span></span>
                    )}
                    {stepResults.finalize?.phase5_saturation && (
                      <span className="text-slate-400">포화도: <span className="text-amber-400 font-bold">{stepResults.finalize.phase5_saturation.coveragePercent?.toFixed(1)}%</span></span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─────── 전체 실행 모드 ─────── */}
          {activeTab === 'full' && (
            <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    E2E 원클릭 전체 실행
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Bootstrap → 시그널 수집 → CQ 승격 → Hub Push까지 자동 실행합니다.
                    (기존 캐시된 단계는 건너뜁니다)
                  </p>
                </div>
                <button onClick={runFull} disabled={runningPipeline || !workspaceId}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-extrabold transition-all disabled:opacity-50 shrink-0">
                  {runningPipeline ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                  원클릭 가동
                </button>
              </div>

              {/* 파이프라인 제어 버튼 */}
              {(runningPipeline || currentRunId) && (
                <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-white/5">
                  {runStatus === 'running' && (
                    <button onClick={handlePause} disabled={controlLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-bold hover:bg-amber-500/20 transition-all disabled:opacity-50">
                      {controlLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Pause className="w-3.5 h-3.5" />}
                      중지
                    </button>
                  )}
                  {runStatus === 'paused' && (
                    <button onClick={handleResume} disabled={controlLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-all disabled:opacity-50">
                      {controlLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                      계속 실행
                    </button>
                  )}
                  {runStatus === 'failed' && (
                    <button onClick={handleRetry} disabled={controlLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-bold hover:bg-cyan-500/20 transition-all disabled:opacity-50">
                      {controlLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                      실패 Phase 재시도
                    </button>
                  )}
                  {controlMsg && <span className="text-[10px] text-slate-400 font-mono">{controlMsg}</span>}
                </div>
              )}

              {/* Phase 진행 체크리스트 */}
              {Object.keys(phaseProgress).length > 0 && (
                <div className="p-3 rounded-xl border border-white/5 bg-slate-950 space-y-1">
                  <div className="text-[10px] text-slate-500 font-mono pb-1 border-b border-white/5 mb-2">PHASE PROGRESS</div>
                  {Object.entries(phaseProgress).map(([phase, p]) => {
                    const icon = p.status === 'completed' ? '✅' : p.status === 'running' ? '⏳' : p.status === 'failed' ? '❌' : p.status === 'paused' ? '⏸️' : p.status === 'skipped' ? '⏭️' : '⬜';
                    return (
                      <div key={phase} className="flex items-center justify-between text-[10px] font-mono">
                        <span className={`${p.status === 'running' ? 'text-cyan-400 animate-pulse' : p.status === 'completed' ? 'text-emerald-400' : p.status === 'failed' ? 'text-red-400' : 'text-slate-600'}`}>
                          {icon} {p.label ?? PHASE_LABELS[phase] ?? phase}
                        </span>
                        {p.error && <span className="text-red-400 truncate max-w-[150px]" title={p.error}>{p.error}</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── 콘솔 로그 (공용) ── */}
          {pipelineLogs.length > 0 && (
            <div className="p-4 rounded-xl border border-white/5 bg-slate-950 font-mono text-xs space-y-1">
              <div className="flex items-center justify-between text-slate-400 border-b border-white/5 pb-1.5 mb-2">
                <span className="flex items-center gap-2">
                  <Activity className={`w-3.5 h-3.5 ${runningPipeline ? 'text-cyan-400 animate-pulse' : 'text-slate-600'}`} />
                  PIPELINE_RUN_CONSOLE
                </span>
                <button onClick={() => setPipelineLogs([])} className="text-[9px] text-slate-600 hover:text-slate-400">지우기</button>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-0.5 text-cyan-400/80 whitespace-pre-wrap">
                {pipelineLogs.map((log, i) => <div key={i}>{log}</div>)}
              </div>
            </div>
          )}

          {/* ── 권장 워크플로우 ── */}
          <div className="p-5 rounded-2xl border border-white/5 bg-slate-950/20 space-y-3">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-cyan-400" />
              권장 사전 준비 워크플로우
            </h3>
            <div className="space-y-2">
              {[
                { step: 1, label: '업종 실측 벤치마크', href: `/${locale}/${workspaceSlug}/site-audit/industry-benchmark`, done: readiness.benchmarkCount > 0 },
                { step: 2, label: '골든 레퍼런스 컨센서스', href: `/${locale}/${workspaceSlug}/golden-reference`, done: readiness.goldenCount > 0 },
                { step: 3, label: '자사 사이트 역설계 감사', href: `/${locale}/site-audit`, done: readiness.auditCount > 0 },
                { step: 4, label: '브랜드 딥 다이브', href: `/${locale}/${workspaceSlug}/deep-dive`, done: readiness.deepDiveCount > 0 },
              ].map(item => (
                <div key={item.step} className={`flex items-center justify-between gap-4 p-2.5 rounded-xl border ${activeStep === item.step ? 'border-cyan-500/30 bg-cyan-500/5' : 'border-white/5 bg-slate-900/30'}`}>
                  <div className="flex items-center gap-2">
                    {item.done ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> : <div className="w-4 h-4 rounded-full border border-slate-600 shrink-0 flex items-center justify-center text-[9px] text-slate-500">{item.step}</div>}
                    <span className="text-xs text-slate-300">{item.label}</span>
                  </div>
                  {!item.done && <Link href={item.href} className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[10px] font-bold rounded-lg transition-all shrink-0">이동</Link>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: Readiness + 이력 + 관리 ── */}
        <div className="space-y-4">
          {/* Readiness */}
          <div className="p-5 rounded-2xl border border-white/5 bg-slate-950/40 space-y-3">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" /> 업종 자산 Readiness
            </h3>
            {[
              { label: 'TCO 개념 개수', value: readiness.tcoCount, link: null },
              { label: 'KG 노드 개수', value: readiness.kgCount, link: null },
              { label: '수집된 시그널', value: readiness.signalCount, link: `/${locale}/${workspaceSlug}/semantic-core/signals` },
              { label: '승격된 질문 (CQ)', value: readiness.cqCount, link: `/${locale}/${workspaceSlug}/semantic-core/question-capital` },
              { label: '생성된 QIS Scene', value: readiness.sceneCount, link: `/${locale}/${workspaceSlug}/semantic-core/attractors` },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center text-xs py-1 border-b border-white/5 last:border-0">
                <span className="text-slate-400">{item.label}</span>
                {item.link && item.value > 0 ? (
                  <Link href={item.link} className="font-mono text-cyan-400 font-bold hover:underline">
                    {item.value} →
                  </Link>
                ) : (
                  <span className={`font-mono font-bold ${item.value > 0 ? 'text-cyan-400' : 'text-slate-600'}`}>{item.value}</span>
                )}
              </div>
            ))}
          </div>

          {/* 최근 실행 이력 */}
          <div className="p-5 rounded-2xl border border-white/5 bg-slate-950/40 space-y-3">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" /> 최근 실행 이력
            </h3>
            <div className="space-y-2">
              {readiness.recentRuns.length === 0 ? (
                <div className="text-xs text-slate-500 text-center py-4">실행 이력이 존재하지 않습니다.</div>
              ) : (
                readiness.recentRuns.slice(0, 8).map(run => (
                  <div key={run.id} className="p-2.5 rounded-lg bg-slate-900 border border-white/5 space-y-1 group">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-200 uppercase font-bold truncate max-w-[80px]">{run.pipeline_type}</span>
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold ${run.status === "completed" ? "bg-emerald-500/10 text-emerald-400" : run.status === "failed" ? "bg-red-500/10 text-red-400" : "bg-cyan-500/10 text-cyan-400 animate-pulse"}`}>
                          {run.status.toUpperCase()}
                        </span>
                        <button onClick={async () => {
                          setDeletingRunId(run.id);
                          await deleteAuditRun(run.id).catch(() => {});
                          setReadiness(prev => ({ ...prev, recentRuns: prev.recentRuns.filter(r => r.id !== run.id) }));
                          setDeletingRunId(null);
                        }} disabled={deletingRunId === run.id}
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-500/10 text-slate-600 hover:text-red-400 transition-all">
                          {deletingRunId === run.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-500">
                      <span>{new Date(run.started_at).toLocaleDateString('ko-KR')} {new Date(run.started_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
                      {run.duration_ms && <span>{(run.duration_ms / 1000).toFixed(1)}s</span>}
                    </div>
                    {run.domain_key && <div className="text-[9px] text-slate-600 font-mono">{run.domain_key}{run.brand_slug ? ` / ${run.brand_slug}` : ''}</div>}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 데이터 관리 */}
          <div className="p-5 rounded-2xl border border-white/5 bg-slate-950/40 space-y-3">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" /> 데이터 관리
            </h3>
            <button onClick={() => setResetModal('bootstrap_only')} disabled={resetting}
              className="w-full py-2 text-xs font-bold rounded-xl border border-amber-500/20 text-amber-400 hover:bg-amber-500/5 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50">
              <RotateCcw className="w-3.5 h-3.5" /> Bootstrap 리셋 (TCO/KG 재생성)
            </button>
            <button onClick={() => setResetModal('full')} disabled={resetting}
              className="w-full py-2 text-xs font-bold rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/5 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50">
              <XCircle className="w-3.5 h-3.5" /> 전체 데이터 리셋 (시그널+CQ+Bootstrap)
            </button>
            <div className="border-t border-white/5 pt-3">
              <button onClick={async () => {
                setSeeding(true); setSeedResult(null);
                try { const res = await seedDemoData(); setSeedResult(res); if (res.success) initPage(); }
                catch (err: any) { setSeedResult({ success: false, message: err.message }); }
                finally { setSeeding(false); }
              }} disabled={seeding}
                className="w-full py-2 text-xs font-bold rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50">
                {seeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
                {seeding ? '시딩 진행 중...' : '데모 데이터 생성'}
              </button>
            </div>
            {(seedResult || resetResult) && (
              <div className={`p-2.5 rounded-lg border text-[10px] ${(seedResult?.success || resetResult?.startsWith('리셋')) ? 'border-green-500/20 text-green-400' : 'border-amber-500/20 text-amber-400'}`}>
                {seedResult?.message ?? resetResult}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 리셋 확인 모달 ── */}
      {resetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm mx-4 p-6 rounded-2xl border border-white/10 bg-slate-900 shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" /> 데이터 리셋 확인
            </h3>
            <p className="text-sm text-slate-400">
              {resetModal === 'bootstrap_only' && 'TCO 개념과 KG 온톨로지 데이터를 삭제합니다.'}
              {resetModal === 'full' && 'TCO/KG + 시그널 + CQ + QIS Scene 전체를 삭제합니다.'}
            </p>
            <p className="text-xs text-amber-400 font-bold">⚠️ 이 작업은 되돌릴 수 없습니다.</p>
            <div className="flex gap-3">
              <button onClick={() => setResetModal(null)} className="flex-1 py-2 rounded-xl border border-white/10 text-slate-400 text-sm font-bold hover:bg-white/5 transition-all">취소</button>
              <button onClick={handleReset} disabled={resetting}
                className="flex-1 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-bold hover:bg-red-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : null} 리셋 실행
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
