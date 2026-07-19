"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  evaluateTruthLockGate,
  saveTruthLockEvaluation,
  listTruthLockHistory,
} from "@/app/actions/truth";
import { resolveWorkspaceSlug } from "@/app/actions/workspace";
import {
  ArrowLeft, ShieldCheck, AlertTriangle, CheckCircle2, XCircle,
  History, Info, Loader2, RefreshCw
} from "lucide-react";

const GATE_LEVELS = ["L0", "L1", "L2", "L3", "L4"] as const;
const GATE_DESCRIPTIONS: Record<string, string> = {
  L0: "워크스페이스 기본 설정 완비 확인",
  L1: "전략/운영 클레임 최소 1개 이상 존재",
  L2: "고위험 클레임에 검증된 증거 + 경계 규칙 연결",
  L3: "전체 운영 클레임에 최소 1개의 검증된 증거 연결",
  L4: "미해결 Truth Delta 없음 (완전 정렬)",
};

interface EvalLogItem {
  id: string;
  gate_level: string;
  is_passed: boolean;
  blocking_reasons: string[];
  warnings: string[];
  evaluated_at: string;
}

export default function GatePage() {
  const params = useParams();
  const locale = (params?.locale as string) || "ko";
  const workspaceSlug = (params?.workspace_slug as string) || "";

  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [activeLevel, setActiveLevel] = useState<typeof GATE_LEVELS[number]>("L2");
  const [running, setRunning] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<any | null>(null);
  const [historyLogs, setHistoryLogs] = useState<EvalLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!workspaceSlug) return;
      try {
        setLoading(true);
        const wsId = await resolveWorkspaceSlug(workspaceSlug);
        if (!wsId) throw new Error("워크스페이스를 찾을 수 없습니다.");
        setWorkspaceId(wsId);
        const history = await listTruthLockHistory(wsId);
        setHistoryLogs(history as EvalLogItem[]);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [workspaceSlug]);

  const handleRunGate = async () => {
    if (!workspaceId) return;
    setRunning(true);
    setEvaluationResult(null);
    setError(null);
    try {
      const result = await evaluateTruthLockGate(workspaceId, activeLevel);
      setEvaluationResult(result);
      // Save the evaluation result
      await saveTruthLockEvaluation(workspaceId, result);
      // Refresh history
      const history = await listTruthLockHistory(workspaceId);
      setHistoryLogs(history as EvalLogItem[]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-4xl w-full mx-auto text-slate-100 bg-slate-900">
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/${workspaceSlug}/truth`} className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <div className="text-xs text-cyan-400 font-mono">Brand Truth Studio</div>
          <h1 className="text-2xl font-extrabold text-white">Truth Lock Gate 평가기</h1>
        </div>
      </div>

      {error && <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/20 text-red-400 text-xs">{error}</div>}

      {/* Gate Level Selector */}
      <div className="bg-slate-950/40 rounded-2xl border border-white/5 p-6 space-y-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 to-blue-500" />
        <div>
          <h3 className="font-bold text-white mb-1">평가 레벨 선택</h3>
          <p className="text-xs text-slate-400">누적 체크 구조 — 상위 레벨은 하위 레벨 조건을 모두 포함합니다.</p>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {GATE_LEVELS.map(level => (
            <button
              key={level}
              onClick={() => setActiveLevel(level)}
              className={`p-3 rounded-xl border text-center transition-all ${activeLevel === level ? "border-cyan-500/40 bg-cyan-950/30 text-cyan-300" : "border-white/5 text-slate-500 hover:border-white/10 hover:text-slate-300"}`}
            >
              <div className="font-bold text-sm">{level}</div>
            </button>
          ))}
        </div>
        <div className="flex items-start gap-2 p-3 rounded-xl bg-white/5 border border-white/5">
          <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-slate-300">{GATE_DESCRIPTIONS[activeLevel]}</p>
        </div>
        <button
          onClick={handleRunGate}
          disabled={running}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
          {running ? `${activeLevel} 게이트 평가 중...` : `${activeLevel} Truth Lock Gate 실행`}
        </button>
      </div>

      {/* Evaluation Result */}
      {evaluationResult && (
        <div className={`p-6 rounded-2xl border space-y-4 ${evaluationResult.isPassed ? "border-green-500/20 bg-green-950/10" : "border-red-500/20 bg-red-950/10"}`}>
          <div className="flex items-center gap-3">
            {evaluationResult.isPassed ? (
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            ) : (
              <XCircle className="w-6 h-6 text-red-400" />
            )}
            <div>
              <h3 className={`font-bold text-lg ${evaluationResult.isPassed ? "text-green-300" : "text-red-300"}`}>
                {evaluationResult.gateLevel} {evaluationResult.isPassed ? "통과 ✓" : "실패 ✗"}
              </h3>
              <p className="text-xs text-slate-500">
                {evaluationResult.isPassed ? "모든 조건이 충족되었습니다." : `${evaluationResult.blockingReasons.length}개 차단 사유가 있습니다.`}
              </p>
            </div>
          </div>
          {evaluationResult.blockingReasons.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-red-400 uppercase tracking-wide">차단 사유</p>
              {evaluationResult.blockingReasons.map((reason: string, i: number) => (
                <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-red-950/30 border border-red-500/10">
                  <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-300">{reason}</p>
                </div>
              ))}
            </div>
          )}
          {evaluationResult.warnings.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-amber-400 uppercase tracking-wide">경고</p>
              {evaluationResult.warnings.map((warn: string, i: number) => (
                <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-amber-950/20 border border-amber-500/10">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-300">{warn}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* History */}
      <div className="space-y-4">
        <h3 className="font-bold text-white flex items-center gap-2">
          <History className="w-4 h-4 text-slate-400" /> 평가 이력
        </h3>
        {loading ? (
          <div className="flex items-center justify-center h-24 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> 이력 로딩 중...
          </div>
        ) : historyLogs.length === 0 ? (
          <div className="text-center py-8 text-slate-600 text-xs">아직 평가 이력이 없습니다.</div>
        ) : (
          <div className="space-y-2">
            {historyLogs.map(log => (
              <div key={log.id} className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${log.is_passed ? "border-green-500/10 bg-green-950/10" : "border-red-500/10 bg-red-950/10"}`}>
                <div className="flex items-center gap-3">
                  {log.is_passed ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
                  <div>
                    <span className={`text-sm font-bold ${log.is_passed ? "text-green-300" : "text-red-300"}`}>{log.gate_level}</span>
                    {log.blocking_reasons.length > 0 && (
                      <p className="text-[10px] text-slate-500 mt-0.5">{log.blocking_reasons.length}개 차단 사유</p>
                    )}
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  {new Date(log.evaluated_at).toLocaleString("ko-KR")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
