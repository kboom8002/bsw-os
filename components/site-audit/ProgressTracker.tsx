"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2, Clock, Loader2, AlertCircle,
  Pause, Play, SkipForward, XCircle, AlertTriangle,
} from "lucide-react";

interface ProgressTrackerProps {
  sessionId: string;
  locale: string;
  tierName?: string;
}

type StepStatus = "pending" | "running" | "completed" | "failed" | "skipped";

interface StepState {
  status: StepStatus;
  startedAt?: number;
  completedAt?: number;
  message?: string;
  error?: string;
}

const STEPS = [
  { icon: "⚡", label: "Quick baseline", est: "~10초" },
  { icon: "🕷️", label: "웹사이트 크롤링", est: "~15초" },
  { icon: "🔧", label: "L1 기술 인프라 감사", est: "~5초" },
  { icon: "📋", label: "L2 Schema 품질 감사", est: "~5초" },
  { icon: "🧠", label: "LLM Entity 추출", est: "~45초" },
  { icon: "🔗", label: "지식 그래프 구축", est: "~15초" },
  { icon: "💡", label: "AI 앤서카드 역설계", est: "~30초" },
  { icon: "🎯", label: "프로빙 시나리오 생성", est: "~15초" },
  { icon: "📊", label: "QIS 업종 교차 매핑", est: "~10초" },
  { icon: "📝", label: "L3 콘텐츠 시맨틱 분석", est: "~10초" },
  { icon: "🔍", label: "Entity Reflection 실측", est: "~90초" },
  { icon: "📈", label: "AEPI 가시성 지수 산출", est: "~5초" },
  { icon: "👤", label: "브랜드 페르소나 분석", est: "~60초" },
  { icon: "🏭", label: "업종 포지셔닝 + Gap 분석", est: "~20초" },
  { icon: "📅", label: "시계열 트렌드 + 최종 저장", est: "~10초" },
];

function formatElapsed(ms: number): string {
  const secs = Math.floor(ms / 1000);
  if (secs < 60) return `${secs}초`;
  const mins = Math.floor(secs / 60);
  const rem = secs % 60;
  return `${mins}분 ${rem}초`;
}

export default function ProgressTracker({ sessionId, locale, tierName = "Pro" }: ProgressTrackerProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(-1);
  const [steps, setSteps] = useState<StepState[]>(() =>
    STEPS.map(() => ({ status: "pending" as StepStatus }))
  );
  const [paused, setPaused] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [globalStart, setGlobalStart] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [initialized, setInitialized] = useState(false);

  // Refs to avoid stale closures
  const pausedRef = useRef(false);
  const cancelledRef = useRef(false);
  const currentStepRef = useRef(-1);

  // Tick timer for elapsed display
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Update ref on state change
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => { cancelledRef.current = cancelled; }, [cancelled]);
  useEffect(() => { currentStepRef.current = currentStep; }, [currentStep]);

  const updateStep = useCallback((idx: number, patch: Partial<StepState>) => {
    setSteps(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  }, []);

  const runStep = useCallback(async (step: number): Promise<boolean> => {
    if (cancelledRef.current) return false;
    if (pausedRef.current) return false;

    setCurrentStep(step);
    updateStep(step, { status: "running", startedAt: Date.now() });

    try {
      const res = await fetch("/api/audit/run-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, step }),
      });

      const data = await res.json();

      if (!res.ok || data.ok === false) {
        updateStep(step, {
          status: "failed",
          completedAt: Date.now(),
          error: data.error || data.message || `Step ${step} failed`,
          message: data.message,
        });
        // Failed steps are NOT fatal — continue to next
        return true;
      }

      updateStep(step, {
        status: "completed",
        completedAt: Date.now(),
        message: data.message,
      });

      return true;
    } catch (err: any) {
      updateStep(step, {
        status: "failed",
        completedAt: Date.now(),
        error: err.message || "Network error",
      });
      // Network errors are non-fatal — continue
      return true;
    }
  }, [sessionId, updateStep]);

  const runAllSteps = useCallback(async (startFrom: number) => {
    if (!globalStart) setGlobalStart(Date.now());

    for (let step = startFrom; step <= 14; step++) {
      if (cancelledRef.current) break;

      // Wait while paused
      while (pausedRef.current && !cancelledRef.current) {
        await new Promise(r => setTimeout(r, 500));
      }
      if (cancelledRef.current) break;

      const shouldContinue = await runStep(step);
      if (!shouldContinue) break;
    }

    // If not cancelled, the final step marks session completed in DB
    if (!cancelledRef.current) {
      router.push(`/${locale}/site-audit/results/${sessionId}`);
    }
  }, [globalStart, runStep, router, locale, sessionId]);

  // Initialize: check if resuming from checkpoint
  useEffect(() => {
    if (initialized) return;
    setInitialized(true);

    (async () => {
      try {
        const res = await fetch(`/api/audit/status?sessionId=${sessionId}`);
        const data = await res.json();

        if (data.status === "completed") {
          router.push(`/${locale}/site-audit/results/${sessionId}`);
          return;
        }

        let startFrom = 0;
        if (data.last_checkpoint_step && data.last_checkpoint_step > 0) {
          startFrom = data.last_checkpoint_step + 1;
          // Mark already-completed steps
          setSteps(prev => {
            const next = [...prev];
            for (let i = 0; i < startFrom && i < next.length; i++) {
              next[i] = { status: "completed", message: "Checkpoint에서 복원됨" };
            }
            return next;
          });
        }

        setGlobalStart(Date.now());
        runAllSteps(startFrom);
      } catch (err) {
        console.error("Failed to init progress tracker:", err);
        setGlobalStart(Date.now());
        runAllSteps(0);
      }
    })();
  }, [initialized, sessionId, locale, router, runAllSteps]);

  // ─── Controls ───
  const handlePause = () => {
    setPaused(true);
    pausedRef.current = true;
  };

  const handleResume = () => {
    setPaused(false);
    pausedRef.current = false;
  };

  const handleSkip = () => {
    const step = currentStepRef.current;
    if (step >= 0 && step <= 14) {
      updateStep(step, { status: "skipped", completedAt: Date.now(), message: "건너뜀" });
    }
  };

  const handleCancel = () => {
    setCancelled(true);
    cancelledRef.current = true;
    // Redirect to results with partial data
    router.push(`/${locale}/site-audit/results/${sessionId}`);
  };

  // ─── Computed values ───
  const completedCount = steps.filter(s => s.status === "completed" || s.status === "skipped" || s.status === "failed").length;
  const percentage = Math.round((completedCount / STEPS.length) * 100);
  const totalElapsed = globalStart ? now - globalStart : 0;
  const isFinished = completedCount === STEPS.length;
  const failedCount = steps.filter(s => s.status === "failed").length;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans text-slate-100">
      <div className="max-w-xl w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-500/20 rounded-full mb-4 border border-indigo-500/30">
            {cancelled ? (
              <XCircle className="h-6 w-6 text-amber-400" />
            ) : isFinished ? (
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            ) : paused ? (
              <Pause className="h-6 w-6 text-amber-400" />
            ) : (
              <Loader2 className="h-6 w-6 text-indigo-400 animate-spin" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-slate-100">
            {cancelled
              ? "진단 중단됨"
              : isFinished
                ? "진단 완료!"
                : paused
                  ? "⏸ 일시정지"
                  : "정밀 진단 진행 중..."}
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            {tierName} 진단 | 경과 시간: {formatElapsed(totalElapsed)}
          </p>
          {failedCount > 0 && !isFinished && (
            <p className="text-xs text-amber-400/80 mt-1">
              ⚠ {failedCount}개 단계 실패 — 나머지 단계는 계속 진행됩니다
            </p>
          )}

          {/* Control Buttons */}
          <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
            {!isFinished && !cancelled && (
              <>
                {paused ? (
                  <button
                    onClick={handleResume}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/30 transition-all text-xs font-bold"
                  >
                    <Play className="h-3.5 w-3.5" />
                    이어 계속하기
                  </button>
                ) : (
                  <button
                    onClick={handlePause}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600/20 border border-amber-500/30 text-amber-400 hover:bg-amber-600/30 transition-all text-xs font-bold"
                  >
                    <Pause className="h-3.5 w-3.5" />
                    일시정지
                  </button>
                )}

                <button
                  onClick={handleSkip}
                  disabled={paused || currentStep < 0}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-700/30 border border-slate-600/30 text-slate-300 hover:bg-slate-700/50 transition-all text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <SkipForward className="h-3.5 w-3.5" />
                  현재 단계 건너뛰기
                </button>

                <button
                  onClick={handleCancel}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600/30 transition-all text-xs font-bold"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  중단
                </button>
              </>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-slate-950 rounded-xl p-6 border border-slate-800 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-300">진행률</span>
            <span className="text-sm font-bold text-indigo-400">{percentage}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2.5 mb-4">
            <div
              className="bg-indigo-600 h-2.5 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Clock className="h-4 w-4 text-slate-500" />
            <span className="text-slate-300">
              {currentStep >= 0 && currentStep <= 14 ? (
                <>Step {currentStep}/{STEPS.length - 1}: <span className="text-slate-400">{STEPS[currentStep]?.label}</span></>
              ) : (
                <span className="text-slate-400">대기 중...</span>
              )}
            </span>
          </div>
        </div>

        {/* Step List */}
        <div className="space-y-1 mb-6 max-h-[420px] overflow-y-auto pr-1">
          {STEPS.map((stepDef, idx) => {
            const state = steps[idx];
            const elapsed = state.startedAt
              ? (state.completedAt || now) - state.startedAt
              : 0;

            return (
              <div
                key={idx}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-all ${
                  state.status === "completed"
                    ? "bg-emerald-500/5 text-emerald-400"
                    : state.status === "running"
                      ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                      : state.status === "failed"
                        ? "bg-red-500/5 text-red-400"
                        : state.status === "skipped"
                          ? "bg-slate-800/30 text-slate-500"
                          : "text-slate-600"
                }`}
              >
                {/* Icon */}
                <span className="text-base w-6 text-center shrink-0">
                  {state.status === "completed" ? "✅" :
                   state.status === "failed" ? <AlertTriangle className="h-4 w-4 text-red-400 inline" /> :
                   state.status === "skipped" ? "⏭️" :
                   state.status === "running" ? <Loader2 className="h-4 w-4 text-indigo-400 animate-spin inline" /> :
                   stepDef.icon}
                </span>

                {/* Label */}
                <span className={`flex-1 font-medium ${
                  state.status === "running" ? "text-indigo-300" :
                  state.status === "completed" ? "text-emerald-400/80" :
                  state.status === "failed" ? "text-red-400/80" :
                  state.status === "skipped" ? "text-slate-500" :
                  "text-slate-600"
                }`}>
                  {stepDef.label}
                  {state.status === "failed" && state.error && (
                    <span className="ml-2 text-[10px] text-red-400/60">({state.error.substring(0, 40)})</span>
                  )}
                </span>

                {/* Time */}
                <span className={`font-mono text-[10px] shrink-0 ${
                  state.status === "completed" ? "text-emerald-500/50" :
                  state.status === "running" ? "text-indigo-400/60" :
                  state.status === "failed" ? "text-red-400/50" :
                  "text-slate-700"
                }`}>
                  {state.status === "completed" || state.status === "failed"
                    ? formatElapsed(elapsed)
                    : state.status === "running"
                      ? formatElapsed(elapsed)
                      : state.status === "skipped"
                        ? "건너뜀"
                        : stepDef.est}
                </span>

                {/* Running indicator */}
                {state.status === "running" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="text-center">
          <p className="text-xs text-slate-500">
            {cancelled
              ? "부분 결과로 이동합니다..."
              : isFinished
                ? "결과 대시보드로 이동 중..."
                : "진단이 완료되면 결과 대시보드로 자동 이동합니다."}
          </p>
        </div>
      </div>
    </div>
  );
}
