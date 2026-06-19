import React, { useEffect, useState } from 'react';
import { RefreshCw, CheckCircle, Clock, Search, Target, FileText, Activity, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface PipelineProps {
  questionId: string;
  workspaceSlug: string;
  locale?: string;
}

export function QuestionLifecyclePipeline({ questionId, workspaceSlug, locale = 'ko' }: PipelineProps) {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/lifecycle/status?question_id=${questionId}`)
      .then(res => res.json())
      .then(data => {
        setStatus(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [questionId]);

  if (loading) {
    return <div className="h-24 flex items-center justify-center border border-white/5 bg-slate-950/20 rounded-xl animate-pulse"><RefreshCw className="w-5 h-5 text-slate-500 animate-spin" /></div>;
  }

  if (!status) return null;

  const stages = [
    { id: 'signal', label: 'Signal', icon: Search },
    { id: 'cq', label: 'CQ Reg.', icon: CheckCircle },
    { id: 'benchmarked', label: 'Measured', icon: Activity },
    { id: 'targeted', label: 'Targeted', icon: Target },
    { id: 'blueprinted', label: 'Blueprinted', icon: FileText },
    { id: 'verified', label: 'Verified', icon: RefreshCw }
  ];

  const currentStageIndex = stages.findIndex(s => s.id === status.lifecycle.stage);
  const sScore = status.metrics?.s_score || 0;

  return (
    <div className="mt-4 p-5 rounded-xl border border-white/10 bg-slate-950/40 font-sans space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          Semantic Flywheel Pipeline
          <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-mono border border-cyan-500/20">
            AUTO-PILOT ACTIVE
          </span>
        </h4>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">S-Score</div>
            <div className={`text-lg font-extrabold font-mono ${sScore >= 70 ? 'text-green-400' : sScore >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
              {sScore}
            </div>
          </div>
          {sScore < 40 && status.metrics?.gap_severity === 'high' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
              <AlertTriangle className="w-3.5 h-3.5" /> Weight Boosted
            </div>
          )}
        </div>
      </div>

      <div className="relative pt-6 pb-2">
        <div className="absolute top-9 left-6 right-6 h-0.5 bg-slate-800 rounded-full" />
        <div 
          className="absolute top-9 left-6 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-1000"
          style={{ width: `calc(${(Math.max(currentStageIndex, 0) / (stages.length - 1)) * 100}% - 2rem)` }}
        />
        
        <div className="relative flex justify-between">
          {stages.map((stage, idx) => {
            const isCompleted = idx <= currentStageIndex;
            const isCurrent = idx === currentStageIndex;
            const Icon = stage.icon;
            
            return (
              <div key={stage.id} className="flex flex-col items-center gap-2 z-10 w-16">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white border-2 transition-colors ${
                  isCurrent ? 'bg-blue-500 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]' :
                  isCompleted ? 'bg-cyan-900 border-cyan-500' : 'bg-slate-900 border-slate-700'
                }`}>
                  {isCompleted && !isCurrent ? <CheckCircle className="w-3.5 h-3.5 text-cyan-400" /> : <Icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-white' : 'text-slate-500'}`} />}
                </div>
                <div className={`text-[10px] font-bold text-center ${isCurrent ? 'text-white' : isCompleted ? 'text-slate-300' : 'text-slate-600'}`}>
                  {stage.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2 pt-2 border-t border-white/5">
        <Link href={`/${locale}/${workspaceSlug}/demo`} className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-white/5 hover:bg-slate-800 transition-colors text-xs text-center text-slate-300 font-medium">
          View Benchmark
        </Link>
        <Link href={`/${locale}/${workspaceSlug}/deep-dive`} className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-white/5 hover:bg-slate-800 transition-colors text-xs text-center text-slate-300 font-medium">
          Open Deep Dive
        </Link>
      </div>
    </div>
  );
}
