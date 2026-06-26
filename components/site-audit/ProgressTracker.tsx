"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, Loader2, AlertCircle, Pause, Play, RotateCcw } from "lucide-react";

interface ProgressTrackerProps {
  sessionId: string;
  locale: string;
  tierName?: string;
}

interface ProgressData {
  current_step: number;
  total_steps: number;
  message: string;
}

const STEPS = [
  { icon: '🕷️', label: '웹사이트 크롤링', est: '~15초' },
  { icon: '📊', label: '빠른 엔티티 추출', est: '~5초' },
  { icon: '🧠', label: 'LLM 심층 분석', est: '~45초' },
  { icon: '🔗', label: '지식 그래프 구축', est: '~10초' },
  { icon: '💡', label: 'AI 답변 카드 역설계', est: '~30초' },
  { icon: '👤', label: '브랜드 페르소나 역설계', est: '~30초' },
  { icon: '⚙️', label: '기술 인프라 감사', est: '~15초' },
  { icon: '📋', label: 'Schema.org 품질 감사', est: '~15초' },
  { icon: '📝', label: '콘텐츠 시맨틱 분석', est: '~30초' },
  { icon: '🔍', label: 'AI 검색 반영도 검증', est: '~90초' },
  { icon: '🎯', label: '갭 분석 및 처방전 생성', est: '~20초' },
];

export default function ProgressTracker({ sessionId, locale, tierName = "Pro" }: ProgressTrackerProps) {
  const router = useRouter();
  const [status, setStatus] = useState<string>("running");
  const [progress, setProgress] = useState<ProgressData>({
    current_step: 0,
    total_steps: 11,
    message: "진단 대기 중..."
  });
  const [error, setError] = useState<string | null>(null);
  const [pauseLoading, setPauseLoading] = useState(false);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [checkpointStep, setCheckpointStep] = useState<number>(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const pollStatus = async () => {
      try {
        const res = await fetch(`/api/audit/status?sessionId=${sessionId}`);
        if (!res.ok) {
          throw new Error("Failed to fetch status");
        }
        const data = await res.json();
        
        setStatus(data.status);
        if (data.progress) {
          setProgress(data.progress);
        }
        if (data.last_checkpoint_step) {
          setCheckpointStep(data.last_checkpoint_step);
        }

        if (data.status === "completed") {
          clearInterval(interval);
          // Redirect to results page
          router.push(`/${locale}/site-audit/results/${sessionId}`);
        } else if (data.status === "failed") {
          clearInterval(interval);
          setError(data.progress?.message || "진단 중 오류가 발생했습니다.");
        }
      } catch (err: any) {
        console.error("Polling error:", err);
      }
    };

    pollStatus(); // initial call
    interval = setInterval(pollStatus, 3000);

    return () => clearInterval(interval);
  }, [sessionId, locale, router]);

  const handlePause = async () => {
    setPauseLoading(true);
    try {
      const res = await fetch(`/api/audit/pause?sessionId=${sessionId}`, { method: 'POST' });
      const data = await res.json();
      if (data.ok) setStatus('paused');
    } catch (e) {
      console.error('Pause failed', e);
    } finally {
      setPauseLoading(false);
    }
  };

  const handleResume = async () => {
    setResumeLoading(true);
    try {
      const res = await fetch(`/api/audit/resume?sessionId=${sessionId}`, { method: 'POST' });
      const data = await res.json();
      if (data.ok) setStatus('running');
    } catch (e) {
      console.error('Resume failed', e);
    } finally {
      setResumeLoading(false);
    }
  };

  const percentage = Math.round((progress.current_step / progress.total_steps) * 100);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans text-slate-100">
      <div className="max-w-xl w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-500/20 rounded-full mb-4 border border-indigo-500/30">
            {status === "failed" ? (
              <AlertCircle className="h-6 w-6 text-red-400" />
            ) : status === "completed" ? (
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            ) : (
              <Loader2 className="h-6 w-6 text-indigo-400 animate-spin" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-slate-100">
            {status === "failed" ? "진단 실패" : status === "paused" ? "⏸ 일시정지" : status === "completed" ? "진단 완료!" : "정밀 진단 진행 중..."}
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            {tierName} 진단 | 예상 소요: {tierName === "Enterprise" ? "~15분" : tierName === "Pro" ? "~8분" : "~3분"}
          </p>
          {/* 일시정지 / 재개 버튼 */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {status === "running" && (
              <button
                onClick={handlePause}
                disabled={pauseLoading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600/20 border border-amber-500/30 text-amber-400 hover:bg-amber-600/30 transition-all text-xs font-bold disabled:opacity-50"
              >
                {pauseLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Pause className="h-3.5 w-3.5" />}
                일시정지
              </button>
            )}
            {status === "paused" && (
              <>
                <div className="text-xs text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1.5">
                  ⏸ Step {checkpointStep} 완료 후 저장됨 — 이어하기 가능
                </div>
                <button
                  onClick={handleResume}
                  disabled={resumeLoading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/30 transition-all text-xs font-bold disabled:opacity-50"
                >
                  {resumeLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                  이어 계속하기
                </button>
              </>
            )}
          </div>
        </div>

        {error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
            {error}
          </div>
        ) : (
          <>
            <div className="bg-slate-950 rounded-xl p-6 border border-slate-800 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-300">진행률</span>
                <span className="text-sm font-bold text-indigo-400">{percentage}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2.5 mb-4">
                <div 
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-slate-500" />
                <span className="text-slate-300">
                  Step {progress.current_step}/{progress.total_steps}: <span className="text-slate-400">{progress.message}</span>
                </span>
              </div>
            </div>

            {/* Step List with descriptions */}
            <div className="space-y-1.5 mb-6">
              {STEPS.map((step, idx) => {
                const stepNum = idx + 1;
                const isCompleted = stepNum < progress.current_step;
                const isCurrent = stepNum === progress.current_step;
                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-all ${
                      isCompleted
                        ? 'bg-emerald-500/5 text-emerald-400'
                        : isCurrent
                          ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                          : 'text-slate-600'
                    }`}
                  >
                    <span className="text-base w-6 text-center shrink-0">
                      {isCompleted ? '✅' : step.icon}
                    </span>
                    <span className={`flex-1 font-medium ${
                      isCurrent ? 'text-indigo-300' : isCompleted ? 'text-emerald-400/80' : 'text-slate-600'
                    }`}>
                      {step.label}
                    </span>
                    <span className={`font-mono text-[10px] ${
                      isCompleted ? 'text-emerald-500/50' : isCurrent ? 'text-indigo-400/60' : 'text-slate-700'
                    }`}>
                      {isCompleted ? '완료' : step.est}
                    </span>
                    {isCurrent && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="text-center">
              <p className="text-xs text-slate-500">
                진단이 완료되면 결과 대시보드로 자동 이동합니다.<br/>
                이 창을 닫아도 서버에서 진단은 계속 진행됩니다.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
