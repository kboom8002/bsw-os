"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  RefreshCw, Activity, MapPin, Sparkles, GitBranch,
  Clock, CheckCircle2, AlertCircle, ArrowLeft,
  Play, ChevronDown, Terminal, Wifi, WifiOff,
  ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight
} from "lucide-react";

type Phase = "pull" | "push" | "all";
type SyncStatus = "idle" | "running" | "success" | "error";

interface SyncResult {
  ok: boolean;
  data?: {
    phase: string;
    timestamp: string;
    pull?: {
      signals?: { count: number; status: string; message?: string };
      metrics?: { count: number; status: string; message?: string };
      layers?:  { count: number; status: string; message?: string };
    };
    push?: {
      count: number;
      status: string;
      message?: string;
      triAxisBreakdown?: {
        industry: number;
        place: number;
        vortex: number;
        crossAxis: number;
      };
    };
  };
  error?: string;
}

const PHASE_OPTIONS: { value: Phase; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
  {
    value: "push",
    label: "Push",
    desc: "예측 질문 → Hub 전송만",
    icon: <ArrowUpFromLine className="h-3.5 w-3.5" />,
    color: "from-violet-600 to-indigo-600",
  },
  {
    value: "pull",
    label: "Pull",
    desc: "Hub → 시그널·메트릭·레이어 수집만",
    icon: <ArrowDownToLine className="h-3.5 w-3.5" />,
    color: "from-cyan-600 to-blue-600",
  },
  {
    value: "all",
    label: "All (Pull + Push)",
    desc: "수집 후 전송 — 전체 사이클",
    icon: <ArrowLeftRight className="h-3.5 w-3.5" />,
    color: "from-emerald-600 to-teal-600",
  },
];

export default function QISTriaxisPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "ko";
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";

  const [phase, setPhase] = useState<Phase>("push");
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [result, setResult] = useState<SyncResult | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [phaseOpen, setPhaseOpen] = useState(false);

  const addLog = (msg: string) =>
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString("ko-KR")}] ${msg}`]);

  const handleSync = async () => {
    if (status === "running") return;

    setStatus("running");
    setResult(null);
    setLogs([]);

    const selected = PHASE_OPTIONS.find((p) => p.value === phase)!;
    addLog(`🚀 QIS Sync 시작 — phase: ${phase.toUpperCase()}`);
    addLog(`📡 엔드포인트 호출: /api/cron/qis-sync?phase=${phase}`);

    try {
      const url = `/api/cron/qis-sync?phase=${phase}&secret=${process.env.NEXT_PUBLIC_CRON_SECRET_HINT || ""}`;
      // 서버 사이드 프록시를 통해 secret 노출 없이 호출
      const res = await fetch(`/api/cron/qis-sync?phase=${phase}`, {
        method: "GET",
        headers: {
          "X-Manual-Trigger": "true",
        },
      });

      const json: SyncResult = await res.json();
      setResult(json);

      if (!res.ok || !json.ok) {
        addLog(`❌ 오류 응답: ${json.error || res.statusText}`);
        setStatus("error");
        return;
      }

      // Pull 로그
      if (json.data?.pull) {
        const { signals, metrics, layers } = json.data.pull;
        if (signals) addLog(`📥 시그널 수집: ${signals.count}개 — ${signals.status}${signals.message ? ` (${signals.message})` : ""}`);
        if (metrics) addLog(`📊 메트릭 수집: ${metrics.count}개 — ${metrics.status}${metrics.message ? ` (${metrics.message})` : ""}`);
        if (layers)  addLog(`🧱 기대층 수집: ${layers.count}개 — ${layers.status}${layers.message ? ` (${layers.message})` : ""}`);
      }

      // Push 로그
      if (json.data?.push) {
        const p = json.data.push;
        addLog(`📤 Hub Push: ${p.count}개 — ${p.status}${p.message ? ` (${p.message})` : ""}`);
        if (p.triAxisBreakdown) {
          const b = p.triAxisBreakdown;
          addLog(`   ↳ Industry: ${b.industry} | Place: ${b.place} | Vortex: ${b.vortex} | Cross: ${b.crossAxis}`);
        }
      }

      addLog("✅ 동기화 완료");
      setLastSync(new Date().toISOString());
      setStatus("success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      addLog(`❌ 네트워크 오류: ${msg}`);
      setStatus("error");
    }
  };

  const selectedPhase = PHASE_OPTIONS.find((p) => p.value === phase)!;

  const statusBadge = () => {
    switch (status) {
      case "running": return <span className="flex items-center gap-1.5 text-amber-400 text-xs font-bold"><RefreshCw className="h-3 w-3 animate-spin" /> 실행 중...</span>;
      case "success": return <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold"><CheckCircle2 className="h-3 w-3" /> 성공</span>;
      case "error":   return <span className="flex items-center gap-1.5 text-red-400 text-xs font-bold"><AlertCircle className="h-3 w-3" /> 오류</span>;
      default:        return <span className="flex items-center gap-1.5 text-slate-500 text-xs"><Wifi className="h-3 w-3" /> 대기 중</span>;
    }
  };

  const axisStats = [
    { label: "Industry", labelKo: "업종", icon: Activity, color: "from-violet-500 to-indigo-500", count: result?.data?.push?.triAxisBreakdown?.industry ?? "—" },
    { label: "Place",    labelKo: "지역", icon: MapPin,    color: "from-cyan-500 to-blue-500",    count: result?.data?.push?.triAxisBreakdown?.place ?? "—" },
    { label: "Vortex",   labelKo: "테마", icon: Sparkles,  color: "from-amber-500 to-orange-500", count: result?.data?.push?.triAxisBreakdown?.vortex ?? "—" },
    { label: "Cross",    labelKo: "교차축", icon: GitBranch, color: "from-emerald-500 to-teal-500", count: result?.data?.push?.triAxisBreakdown?.crossAxis ?? "—" },
  ];

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 font-sans max-w-5xl w-full mx-auto text-slate-100 bg-slate-900 min-h-screen">
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
            <div className="text-xs text-cyan-400 font-mono">SEMANTIC CORE · QIS</div>
            <h1 className="text-2xl font-extrabold text-white">QIS 3축 Hub 동기화</h1>
            <p className="text-xs text-slate-400 mt-0.5">업종 · 지역 · 테마 예측 질문 ↔ Hub 연동 수동 제어</p>
          </div>
        </div>
        <div>{statusBadge()}</div>
      </div>

      {/* ─── 수동 트리거 패널 ─── */}
      <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <Terminal className="h-4 w-4 text-indigo-400" />
          <h2 className="text-sm font-bold text-slate-200">수동 트리거</h2>
          <span className="ml-auto text-[10px] font-mono text-slate-500 border border-slate-700 rounded px-2 py-0.5">
            GET /api/cron/qis-sync
          </span>
        </div>

        {/* Phase 선택 */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">실행 모드 (phase)</label>
          <div className="relative">
            <button
              onClick={() => setPhaseOpen((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-indigo-500/50 transition-all text-sm"
            >
              <span className="flex items-center gap-2.5">
                <span className={`p-1.5 rounded-lg bg-gradient-to-br ${selectedPhase.color} text-white`}>
                  {selectedPhase.icon}
                </span>
                <span className="font-bold text-white">{selectedPhase.label}</span>
                <span className="text-slate-400 text-xs">{selectedPhase.desc}</span>
              </span>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${phaseOpen ? "rotate-180" : ""}`} />
            </button>

            {phaseOpen && (
              <div className="absolute top-full mt-1 w-full z-20 bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden">
                {PHASE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setPhase(opt.value); setPhaseOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 transition-colors text-left ${opt.value === phase ? "bg-slate-800" : ""}`}
                  >
                    <span className={`p-1.5 rounded-lg bg-gradient-to-br ${opt.color} text-white`}>
                      {opt.icon}
                    </span>
                    <span>
                      <div className="text-sm font-bold text-white">{opt.label}</div>
                      <div className="text-xs text-slate-400">{opt.desc}</div>
                    </span>
                    {opt.value === phase && <CheckCircle2 className="h-4 w-4 text-emerald-400 ml-auto" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 호출 URL 미리보기 */}
        <div className="bg-slate-950/60 border border-slate-700/50 rounded-xl px-4 py-3 font-mono text-xs text-slate-400">
          <span className="text-emerald-400">GET</span>{" "}
          <span className="text-slate-300">/api/cron/qis-sync</span>
          <span className="text-amber-400">?phase={phase}</span>
          <span className="text-slate-500">&secret=****</span>
        </div>

        {/* 실행 버튼 */}
        <button
          onClick={handleSync}
          disabled={status === "running"}
          className={`w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-sm text-white transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r ${selectedPhase.color} hover:brightness-110`}
        >
          {status === "running" ? (
            <><RefreshCw className="h-4 w-4 animate-spin" /> 실행 중...</>
          ) : (
            <><Play className="h-4 w-4" /> 지금 실행</>
          )}
        </button>
      </div>

      {/* ─── 실시간 로그 ─── */}
      {logs.length > 0 && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-800">
            <Terminal className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">실행 로그</span>
            {lastSync && (
              <span className="ml-auto text-[10px] text-slate-600 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(lastSync).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
          <div className="p-5 space-y-1.5 max-h-60 overflow-y-auto">
            {logs.map((log, i) => (
              <div key={i} className={`font-mono text-xs leading-relaxed ${
                log.includes("✅") ? "text-emerald-400" :
                log.includes("❌") ? "text-red-400" :
                log.includes("🚀") ? "text-indigo-400" :
                log.includes("📥") || log.includes("📊") || log.includes("🧱") ? "text-cyan-400" :
                log.includes("📤") ? "text-violet-400" :
                log.includes("↳") ? "text-slate-500" :
                "text-slate-400"
              }`}>
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── 3축 결과 카드 (Push 결과 있을 때만) ─── */}
      {result?.data?.push?.triAxisBreakdown !== undefined && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Push 결과 — 3축 분류</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {axisStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 backdrop-blur-xl">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className={`p-2 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                      <Icon className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-mono uppercase">{stat.label}</p>
                      <p className="text-xs font-bold text-slate-200">{stat.labelKo}</p>
                    </div>
                  </div>
                  <p className="text-2xl font-black text-white">{stat.count}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">건 전송</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Pull 결과 상세 (Pull 결과 있을 때만) ─── */}
      {result?.data?.pull && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-800">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Pull 수집 결과</h3>
          </div>
          <div className="divide-y divide-slate-800/50">
            {[
              { key: "signals", label: "시그널", icon: Wifi,              color: "text-cyan-400" },
              { key: "metrics", label: "메트릭", icon: Activity,          color: "text-violet-400" },
              { key: "layers",  label: "기대층 레이어", icon: GitBranch,  color: "text-amber-400" },
            ].map(({ key, label, icon: Icon, color }) => {
              const item = result.data?.pull?.[key as keyof typeof result.data.pull] as { count: number; status: string; message?: string } | undefined;
              if (!item) return null;
              const isOk = item.status === "ok";
              return (
                <div key={key} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${color}`} />
                    <span className="text-sm text-slate-300">{label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-white">{item.count}개</span>
                    {isOk
                      ? <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">OK</span>
                      : <span className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full font-bold">{item.status}</span>
                    }
                    {item.message && <span className="text-[10px] text-slate-500">{item.message}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── 연결 상태 안내 (Pull count=0일 때) ─── */}
      {result?.ok && result.data?.pull?.signals?.count === 0 && (
        <div className="flex items-start gap-3 bg-amber-950/30 border border-amber-500/20 rounded-xl px-4 py-3">
          <WifiOff className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-amber-400">Hub 시그널 없음</p>
            <p className="text-xs text-amber-400/70 mt-0.5">
              Hub 팀의 <code className="font-mono bg-amber-950/50 px-1 rounded">POST /api/v1/qis/signals</code> 엔드포인트가 아직 준비되지 않았거나 데이터가 없습니다.
              Hub API가 열리면 Pull이 자동으로 작동합니다.
            </p>
          </div>
        </div>
      )}

      {result?.ok && result.data?.push?.status === "no_new_predictions" && (
        <div className="flex items-start gap-3 bg-blue-950/30 border border-blue-500/20 rounded-xl px-4 py-3">
          <AlertCircle className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-blue-400">전송할 예측 질문 없음</p>
            <p className="text-xs text-blue-400/70 mt-0.5">
              <code className="font-mono bg-blue-950/50 px-1 rounded">predicted_questions</code> 테이블이 비어있습니다.
              먼저 <strong>Pull</strong>을 실행하여 Hub 시그널을 수집하면 예측 질문이 자동 생성됩니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
