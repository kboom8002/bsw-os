"use client";

/**
 * app/[locale]/(workspace)/[workspace_slug]/golden-reference/page.tsx
 * 골든 레퍼런스 대시보드 v2
 *
 * v2 변경사항:
 * - 증분 배치 (3사이트씩 자동 반복)
 * - 중단(Pause) / 계속(Resume) 버튼
 * - 부분 성공 시에도 산출물 생성 가능 (최소 1개)
 * - 실시간 프로그레스 + 사이트별 상태 표시
 * - 개별 사이트 재분석 버튼
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import {
  Diamond,
  RefreshCw,
  Sparkles,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  BarChart2,
  Layers,
  FileText,
  ImageIcon,
  Award,
  Palette,
  Play,
  Pause,
  RotateCcw,
  Loader2,
  Globe,
  TrendingUp,
  Zap,
  Timer,
  SkipForward,
} from "lucide-react";

// ─── 업종 목록 ────────────────────────────────────────────────

const INDUSTRIES = [
  { key: "skincare", label: "스킨케어/뷰티", emoji: "💄", color: "from-pink-500 to-rose-600" },
  { key: "wedding", label: "웨딩 서비스", emoji: "💍", color: "from-yellow-400 to-amber-500" },
  { key: "medical_clinic", label: "병원/클리닉", emoji: "🏥", color: "from-cyan-500 to-teal-600" },
  { key: "restaurant_cafe", label: "식당/카페", emoji: "☕", color: "from-orange-500 to-red-600" },
  { key: "hotel", label: "호텔/숙박", emoji: "🏨", color: "from-indigo-500 to-violet-600" },
  { key: "place_brand", label: "지역 브랜드", emoji: "🗺️", color: "from-green-500 to-emerald-600" },
];

// ─── 산출물 6종 정의 ──────────────────────────────────────────

const DELIVERABLES = [
  { key: "tokens", label: "Design Tokens", icon: Palette, color: "text-violet-400", bgColor: "bg-violet-500/10 border-violet-500/20", desc: "색상·폰트·shape·모션" },
  { key: "layouts", label: "Layout Blueprints", icon: Layers, color: "text-cyan-400", bgColor: "bg-cyan-500/10 border-cyan-500/20", desc: "GNB·Shell·Grid·Footer" },
  { key: "sections", label: "Section Sequences", icon: BarChart2, color: "text-indigo-400", bgColor: "bg-indigo-500/10 border-indigo-500/20", desc: "섹션 순서·심리 플로우" },
  { key: "content", label: "Content Templates", icon: FileText, color: "text-emerald-400", bgColor: "bg-emerald-500/10 border-emerald-500/20", desc: "Hero 카피·FAQ·CTA" },
  { key: "images", label: "Image References", icon: ImageIcon, color: "text-yellow-400", bgColor: "bg-yellow-500/10 border-yellow-500/20", desc: "Hero·제품·팀 이미지" },
  { key: "quality", label: "Quality Benchmark", icon: Award, color: "text-orange-400", bgColor: "bg-orange-500/10 border-orange-500/20", desc: "10차원 품질 점수" },
];

// ─── 타입 ────────────────────────────────────────────────────

interface SiteStatus {
  url: string;
  brandName: string;
  tier: string;
  tags: string[];
  analyzed: boolean;
  snapshot: any | null;
}

interface BatchState {
  total: number;
  analyzed: number;
  pending: number;
  progress: number;
  lastAnalyzedAt: string | null;
  sites: SiteStatus[];
  availableTypes?: string[];
}

type BatchMode = 'idle' | 'running' | 'paused' | 'done';

// ─── 유틸 ────────────────────────────────────────────────────

function tierBadge(tier: string) {
  if (tier === "excellent") return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  if (tier === "poor") return "bg-red-500/20 text-red-400 border-red-500/30";
  return "bg-slate-500/20 text-slate-400 border-slate-500/30";
}

function tierLabel(tier: string) {
  if (tier === "excellent") return "Excellent";
  if (tier === "poor") return "Anchor";
  return "Average";
}

function fmtDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────

export default function GoldenReferencePage() {
  const params = useParams();

  const [selectedIndustry, setSelectedIndustry] = useState("skincare");
  const [batchState, setBatchState] = useState<BatchState | null>(null);
  const [loadingBatch, setLoadingBatch] = useState(false);
  const [batchMode, setBatchMode] = useState<BatchMode>("idle");
  const [runningConsensus, setRunningConsensus] = useState(false);
  const [availableOutputs, setAvailableOutputs] = useState<string[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [analyzingSite, setAnalyzingSite] = useState<string | null>(null);

  const pauseRef = useRef(false);
  const abortRef = useRef(false);

  const addLog = (msg: string) => setLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 49)]);

  // ─── 배치 상태 조회 ──────────────────────────────────────

  const fetchBatchState = useCallback(async (industry: string) => {
    setLoadingBatch(true);
    try {
      const res = await fetch(`/api/golden/batch?subIndustryKey=${industry}`);
      if (res.ok) {
        const data = await res.json();
        setBatchState(data);
        setAvailableOutputs(data.availableTypes ?? []);
      }
    } catch {
      // 무시
    } finally {
      setLoadingBatch(false);
    }
  }, []);

  useEffect(() => {
    fetchBatchState(selectedIndustry);
    setLog([]);
    setBatchMode("idle");
    setTotalElapsed(0);
    pauseRef.current = false;
    abortRef.current = false;
  }, [selectedIndustry, fetchBatchState]);

  // ─── 증분 배치 실행 (자동 반복) ──────────────────────────

  const handleRunBatch = async () => {
    if (batchMode === "running") return;

    pauseRef.current = false;
    abortRef.current = false;
    setBatchMode("running");
    const startTime = Date.now();

    addLog(`🚀 ${selectedIndustry} 업종 배치 분석 시작 (3사이트씩 증분)`);

    let iteration = 0;
    let totalSucceeded = 0;
    let totalFailed = 0;

    while (!abortRef.current) {
      // 일시정지 체크
      if (pauseRef.current) {
        setBatchMode("paused");
        addLog(`⏸️ 일시정지됨 — '계속' 버튼을 눌러 재개하세요`);
        break;
      }

      iteration++;
      try {
        const res = await fetch("/api/golden/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subIndustryKey: selectedIndustry,
            skipExisting: true,
            batchSize: 3,
          }),
        });
        const data = await res.json();

        if (!data.ok) {
          addLog(`❌ API 오류: ${data.error}`);
          break;
        }

        // 결과 처리
        if (data.results) {
          for (const r of data.results) {
            if (r.ok) {
              const moduleSummary = r.modules
                ? Object.entries(r.modules).filter(([, v]) => v).map(([k]) => k).join("·")
                : "";
              addLog(`  ✓ ${r.brandName} (${fmtDuration(r.durationMs ?? 0)}) [${moduleSummary}]`);
            } else {
              addLog(`  ✗ ${r.brandName}: ${r.error}`);
            }
          }
        }

        totalSucceeded += data.succeeded ?? 0;
        totalFailed += data.failed ?? 0;

        // 상태 갱신
        setTotalElapsed(Date.now() - startTime);
        await fetchBatchState(selectedIndustry);

        // 완료 체크
        if (data.done || (data.remaining ?? 0) === 0) {
          addLog(`✅ 배치 완료! 성공: ${totalSucceeded}개, 실패: ${totalFailed}개 (${fmtDuration(Date.now() - startTime)})`);
          setBatchMode("done");
          return;
        }

        // 라운드 간 1초 대기
        addLog(`📦 라운드 ${iteration} 완료 — 잔여 ${data.remaining}개, 계속 진행 중...`);
        await new Promise(r => setTimeout(r, 1000));

      } catch (err) {
        addLog(`❌ 네트워크 오류: ${String(err)}`);
        setBatchMode("paused");
        break;
      }
    }

    if (abortRef.current) {
      addLog(`⏹️ 배치 중단됨 — 성공 ${totalSucceeded}개, 실패 ${totalFailed}개`);
      setBatchMode("idle");
    }
  };

  // ─── 일시정지 ──────────────────────────────────────────────

  const handlePause = () => {
    pauseRef.current = true;
  };

  // ─── 재개 ────────────────────────────────────────────────

  const handleResume = () => {
    pauseRef.current = false;
    abortRef.current = false;
    handleRunBatch();
  };

  // ─── 중단 ────────────────────────────────────────────────

  const handleStop = () => {
    abortRef.current = true;
    pauseRef.current = false;
    setBatchMode("idle");
  };

  // ─── 개별 사이트 재분석 ──────────────────────────────────

  const handleReanalyzeSite = async (url: string, brandName: string) => {
    setAnalyzingSite(url);
    addLog(`🔄 ${brandName} 재분석 시작...`);
    try {
      const res = await fetch("/api/golden/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subIndustryKey: selectedIndustry,
          singleUrl: url,
        }),
      });
      const data = await res.json();
      if (data.ok && data.results?.[0]) {
        const r = data.results[0];
        if (r.ok) {
          addLog(`  ✓ ${brandName} 재분석 완료 (${fmtDuration(r.durationMs ?? 0)})`);
        } else {
          addLog(`  ✗ ${brandName} 재분석 실패: ${r.error}`);
        }
      }
      await fetchBatchState(selectedIndustry);
    } catch (err) {
      addLog(`❌ 오류: ${String(err)}`);
    } finally {
      setAnalyzingSite(null);
    }
  };

  // ─── 합의 생성 (부분 성공 지원) ──────────────────────────

  const handleRunConsensus = async () => {
    if (runningConsensus) return;
    setRunningConsensus(true);

    const analyzedCount = batchState?.analyzed ?? 0;
    addLog(`🧪 ${selectedIndustry} 패턴 합의 시작 (${analyzedCount}개 사이트 기반)...`);

    try {
      const res = await fetch("/api/golden/consensus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subIndustryKey: selectedIndustry }),
      });
      const data = await res.json();
      if (data.ok) {
        addLog(`✅ 6종 산출물 생성 완료 — 표본: ${data.sampleCount}개 사이트`);
        if (data.consensus?.topFontPairs) {
          addLog(`  🎨 주요 폰트: ${data.consensus.topFontPairs[0] ?? "—"}`);
        }
        await fetchBatchState(selectedIndustry);
      } else {
        addLog(`❌ 오류: ${data.error}`);
      }
    } catch (err) {
      addLog(`❌ 오류: ${String(err)}`);
    } finally {
      setRunningConsensus(false);
    }
  };

  // ─── 내보내기 ──────────────────────────────────────────────

  const handleExport = (deliverable: string) => {
    window.open(
      `/api/golden/export?subIndustryKey=${selectedIndustry}&deliverable=${deliverable}`,
      "_blank"
    );
  };

  const handleExportAll = () => {
    window.open(
      `/api/golden/export?subIndustryKey=${selectedIndustry}&deliverable=all`,
      "_blank"
    );
  };

  const industryInfo = INDUSTRIES.find(i => i.key === selectedIndustry) ?? INDUSTRIES[0];
  const progressPct = batchState?.progress ?? 0;
  const analyzedCount = batchState?.analyzed ?? 0;
  const isRunning = batchMode === "running";
  const isPaused = batchMode === "paused";

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Diamond className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">골든 레퍼런스</h1>
              <p className="text-sm text-slate-400">업종별 Top-tier 사이트 비주얼 역설계 → 합의 기준 자동 산출</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {availableOutputs.length > 0 && (
            <button
              onClick={handleExportAll}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-violet-300 text-sm transition-all"
            >
              <Download className="w-4 h-4" />
              전체 번들 내보내기
            </button>
          )}
        </div>
      </div>

      {/* 업종 선택 탭 */}
      <div className="flex flex-wrap gap-2">
        {INDUSTRIES.map(ind => (
          <button
            key={ind.key}
            onClick={() => setSelectedIndustry(ind.key)}
            disabled={isRunning}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
              selectedIndustry === ind.key
                ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
                : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
            } ${isRunning ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <span>{ind.emoji}</span>
            <span>{ind.label}</span>
          </button>
        ))}
      </div>

      {/* 분석 현황 카드 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* 배치 현황 */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-white/8 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${industryInfo.color} flex items-center justify-center text-sm`}>
                {industryInfo.emoji}
              </div>
              <div>
                <h2 className="font-semibold text-white">{industryInfo.label} 분석 현황</h2>
                {batchState?.lastAnalyzedAt && (
                  <p className="text-xs text-slate-500">마지막 분석: {new Date(batchState.lastAnalyzedAt).toLocaleString("ko-KR")}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* 배치 모드 상태 표시 */}
              {isRunning && (
                <span className="flex items-center gap-1.5 text-xs text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  분석 중...
                </span>
              )}
              {isPaused && (
                <span className="flex items-center gap-1.5 text-xs text-yellow-300 bg-yellow-500/10 px-2.5 py-1 rounded-lg border border-yellow-500/20">
                  <Pause className="w-3 h-3" />
                  일시정지
                </span>
              )}
              {batchMode === "done" && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" />
                  완료
                </span>
              )}
              <button
                onClick={() => fetchBatchState(selectedIndustry)}
                disabled={loadingBatch}
                className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${loadingBatch ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* 프로그레스 바 */}
          {batchState && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">분석 완료</span>
                <span className="text-white font-medium">{batchState.analyzed} / {batchState.total}</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    isRunning
                      ? "bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 bg-[length:200%_100%] animate-[shimmer_2s_linear_infinite]"
                      : "bg-gradient-to-r from-violet-500 to-indigo-500"
                  }`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>{progressPct}% 완료</span>
                <div className="flex items-center gap-3">
                  {totalElapsed > 0 && (
                    <span className="flex items-center gap-1">
                      <Timer className="w-3 h-3" />
                      {fmtDuration(totalElapsed)}
                    </span>
                  )}
                  <span>대기: {batchState.pending}개</span>
                </div>
              </div>
            </div>
          )}

          {/* 실행 버튼 */}
          <div className="flex gap-2 flex-wrap">
            {/* 시작 / 계속 */}
            {!isRunning && (
              <button
                onClick={isPaused ? handleResume : handleRunBatch}
                disabled={runningConsensus}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-all shadow-lg shadow-indigo-500/20"
              >
                {isPaused ? <SkipForward className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isPaused ? "계속 분석" : (batchState?.pending ?? 0) > 0 ? "배치 분석 실행" : "전체 재분석"}
              </button>
            )}

            {/* 일시정지 */}
            {isRunning && (
              <button
                onClick={handlePause}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-medium transition-all shadow-lg shadow-yellow-500/20"
              >
                <Pause className="w-4 h-4" />
                일시정지
              </button>
            )}

            {/* 중단 */}
            {(isRunning || isPaused) && (
              <button
                onClick={handleStop}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 text-sm font-medium transition-all"
              >
                <XCircle className="w-4 h-4" />
                중단
              </button>
            )}

            {/* 합의 생성 (부분 성공도 가능) */}
            <button
              onClick={handleRunConsensus}
              disabled={isRunning || runningConsensus || analyzedCount < 1}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-all shadow-lg shadow-violet-500/20"
              title={analyzedCount < 1 ? "최소 1개 사이트 분석 필요" : `${analyzedCount}개 사이트 데이터로 산출물 생성`}
            >
              {runningConsensus ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {runningConsensus ? "합의 생성 중..." : `산출물 생성 (${analyzedCount}개 기반)`}
            </button>
          </div>

          {/* 안내 메시지 */}
          {analyzedCount > 0 && analyzedCount < (batchState?.total ?? 0) && !isRunning && !isPaused && (
            <div className="flex items-start gap-2 p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl">
              <Zap className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-blue-300/80">
                <strong>{analyzedCount}개 사이트</strong>가 이미 분석되었습니다.
                지금 바로 <strong>"산출물 생성"</strong>을 실행하면 현재 데이터로 산출물을 도출합니다.
                나머지 {(batchState?.total ?? 0) - analyzedCount}개는 나중에 추가 분석할 수 있습니다.
              </div>
            </div>
          )}

          {/* 실행 로그 */}
          {log.length > 0 && (
            <div className="bg-slate-950/60 rounded-xl p-3 max-h-48 overflow-y-auto space-y-0.5">
              {log.map((entry, i) => (
                <p
                  key={i}
                  className={`text-xs font-mono leading-relaxed ${
                    entry.includes("✓") ? "text-emerald-400" :
                    entry.includes("✗") || entry.includes("❌") ? "text-red-400" :
                    entry.includes("✅") ? "text-emerald-300" :
                    entry.includes("⏸️") ? "text-yellow-300" :
                    entry.includes("🚀") || entry.includes("📦") ? "text-indigo-300" :
                    "text-slate-400"
                  }`}
                >
                  {entry}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* 통계 */}
        <div className="space-y-3">
          <div className="bg-slate-900/60 border border-white/8 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-white">레지스트리</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">등록 사이트</span>
                <span className="text-sm font-bold text-white">{batchState?.total ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Excellent tier</span>
                <span className="text-sm text-emerald-400">{batchState?.sites.filter(s => s.tier === "excellent").length ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Average tier</span>
                <span className="text-sm text-slate-400">{batchState?.sites.filter(s => s.tier === "average").length ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Anchor (Poor)</span>
                <span className="text-sm text-red-400">{batchState?.sites.filter(s => s.tier === "poor").length ?? "—"}</span>
              </div>
            </div>
          </div>
          <div className="bg-slate-900/60 border border-white/8 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-violet-400" />
              <span className="text-sm font-medium text-white">산출물 현황</span>
            </div>
            <div className="space-y-1.5">
              {DELIVERABLES.map(d => (
                <div key={d.key} className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">{d.label}</span>
                  {availableOutputs.includes(d.key)
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    : <Clock className="w-3.5 h-3.5 text-slate-600" />
                  }
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 6종 산출물 카드 */}
      <div>
        <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
          <Diamond className="w-4 h-4 text-violet-400" />
          산출물 6종
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {DELIVERABLES.map(({ key, label, icon: Icon, color, bgColor, desc }) => {
            const ready = availableOutputs.includes(key);
            return (
              <div
                key={key}
                className={`relative flex flex-col gap-3 p-4 rounded-2xl border transition-all ${
                  ready
                    ? `${bgColor} hover:scale-105 cursor-pointer`
                    : "bg-slate-900/40 border-white/5 opacity-60"
                }`}
                onClick={() => ready && handleExport(key)}
              >
                <Icon className={`w-6 h-6 ${color}`} />
                <div>
                  <p className="text-xs font-semibold text-white leading-tight">{label}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-snug">{desc}</p>
                </div>
                <div className="flex items-center justify-between">
                  {ready ? (
                    <div className="flex items-center gap-1 text-xs text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>완료</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-slate-600">
                      <Clock className="w-3 h-3" />
                      <span>대기</span>
                    </div>
                  )}
                  {ready && <Download className="w-3 h-3 text-slate-400" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 사이트별 분석 상태 테이블 */}
      {batchState && batchState.sites.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-cyan-400" />
            사이트별 분석 상태
            <span className="text-xs font-normal text-slate-500">({batchState.sites.length}개)</span>
          </h2>
          <div className="bg-slate-900/60 border border-white/8 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">사이트</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">티어</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-slate-500">토큰</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-slate-500">레이아웃</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-slate-500">섹션</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">태그</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-slate-500">액션</th>
                  </tr>
                </thead>
                <tbody>
                  {batchState.sites.map((site) => {
                    const snap = site.snapshot;
                    const hasTokens = snap?.design_tokens != null;
                    const hasLayout = snap?.layout_structure != null;
                    const hasSection = snap?.section_sequence != null;
                    const isAnalyzing = analyzingSite === site.url;

                    return (
                      <tr key={site.url} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-white text-xs">{site.brandName}</p>
                            <p className="text-slate-600 text-xs truncate max-w-[160px]">{site.url}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${tierBadge(site.tier)}`}>
                            {tierLabel(site.tier)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {!site.analyzed ? <span className="text-slate-700">—</span>
                            : hasTokens ? <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                            : <AlertCircle className="w-4 h-4 text-yellow-500 mx-auto" />
                          }
                        </td>
                        <td className="px-4 py-3 text-center">
                          {!site.analyzed ? <span className="text-slate-700">—</span>
                            : hasLayout ? <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                            : <AlertCircle className="w-4 h-4 text-yellow-500 mx-auto" />
                          }
                        </td>
                        <td className="px-4 py-3 text-center">
                          {!site.analyzed ? <span className="text-slate-700">—</span>
                            : hasSection ? <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                            : <AlertCircle className="w-4 h-4 text-yellow-500 mx-auto" />
                          }
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {site.tags.slice(0, 2).map(tag => (
                              <span key={tag} className="text-xs bg-white/5 text-slate-500 px-1.5 py-0.5 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {site.analyzed ? (
                            <button
                              onClick={() => handleReanalyzeSite(site.url, site.brandName)}
                              disabled={isAnalyzing || isRunning}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all disabled:opacity-50"
                              title="재분석"
                            >
                              {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                              <Clock className="w-3 h-3" />
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
