"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  Wrench,
  ShieldAlert,
  GitPullRequest,
  CheckCircle,
  Activity,
  Layers,
  ArrowRight,
  TrendingUp,
  Database,
  Cpu,
  BookOpen,
  ArrowLeft
} from "lucide-react";

export default function FixitStudioHub() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";

  // Mock numbers/stats
  const stats = {
    rcasCount: 3,
    activePatches: 2,
    playbookRules: 4,
    completedRetests: 5
  };

  const [notification, setNotification] = useState<string | null>(null);

  const handleTriggerAutoAnalysis = () => {
    setNotification("🤖 AI Suggestion Agent running... Scanning metric weaknesses and mapping rules.");
    setTimeout(() => {
      setNotification("✨ AI Analysis complete! Generated 1 new RCA candidate for Retinol citation weakness.");
    }, 1500);
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-6xl w-full mx-auto text-slate-100 bg-slate-900">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="text-xs text-indigo-400 font-mono font-bold tracking-wider uppercase mb-1">
            BSW-OS Closed-Loop Optimization
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 flex items-center gap-3">
            <Wrench className="w-8 h-8 text-indigo-400" />
            Fix-It Studio Hub
          </h1>
          <p className="text-slate-400 text-sm">
            Close the loop from crawler weaknesses to root cause analysis, patches, retests, lift curves, and factory components.
          </p>
        </div>

        <div>
          <button
            onClick={handleTriggerAutoAnalysis}
            className="px-4 py-2.5 text-xs font-bold rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/10 font-mono"
          >
            <Cpu className="w-4 h-4 text-white" />
            Run Metric Weakness Map
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-950/20 text-indigo-300 text-xs font-mono flex items-start gap-3 backdrop-blur-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{notification}</span>
        </div>
      )}

      {/* Grid Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <Link 
          href={`/${workspaceSlug}/fixit/rca`}
          className="p-5 rounded-2xl border border-white/5 bg-slate-950/30 hover:bg-slate-950/60 transition-all space-y-2 block group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-mono uppercase block">Root Cause Cases</span>
            <ShieldAlert className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white group-hover:text-indigo-400 transition-colors">
            {stats.rcasCount} Cases
          </div>
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            Manage hypotheses <ArrowRight className="w-3 h-3" />
          </span>
        </Link>

        <Link 
          href={`/${workspaceSlug}/fixit/patches`}
          className="p-5 rounded-2xl border border-white/5 bg-slate-950/30 hover:bg-slate-950/60 transition-all space-y-2 block group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-mono uppercase block">Patch Tickets</span>
            <GitPullRequest className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white group-hover:text-cyan-400 transition-colors">
            {stats.activePatches} Tickets
          </div>
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            Track approvals <ArrowRight className="w-3 h-3" />
          </span>
        </Link>

        <Link 
          href={`/${workspaceSlug}/fixit/retests`}
          className="p-5 rounded-2xl border border-white/5 bg-slate-950/30 hover:bg-slate-950/60 transition-all space-y-2 block group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-mono uppercase block">Retest Runs</span>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white group-hover:text-purple-400 transition-colors">
            {stats.completedRetests} Runs
          </div>
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            Execute crawls <ArrowRight className="w-3 h-3" />
          </span>
        </Link>

        <Link 
          href={`/${workspaceSlug}/fixit/playbook`}
          className="p-5 rounded-2xl border border-white/5 bg-slate-950/30 hover:bg-slate-950/60 transition-all space-y-2 block group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-mono uppercase block">Playbook Rules</span>
            <BookOpen className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white group-hover:text-emerald-400 transition-colors">
            {stats.playbookRules} Rules
          </div>
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            View triggers <ArrowRight className="w-3 h-3" />
          </span>
        </Link>

      </div>

      {/* Visual Navigation Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Card: Lift & Factory Reuse */}
        <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              Post-Patch Lift Analyzer
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Verify statistical score lifters and inspect guardrail regressions on a side-by-side curve dashboard.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-white/5 bg-slate-900/40 space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-xs text-slate-400">Average Post-Patch Lift:</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">+12.4% ARS</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Guardrail Regressions:</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">None Flagged</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              href={`/${workspaceSlug}/fixit/lift`}
              className="flex-1 py-2.5 text-center text-xs font-bold font-mono rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all"
            >
              Analyze Lift Curves
            </Link>
            <Link
              href={`/${workspaceSlug}/fixit/factory-candidates`}
              className="flex-1 py-2.5 text-center text-xs font-bold font-mono rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-all"
            >
              Factory Reuse
            </Link>
          </div>
        </div>

        {/* Right Card: Playbook Trigger Settings */}
        <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              Playbook Trigger Rules
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Configure automatic thresholds triggering Root Cause Proposals on generative crawl results.
            </p>
          </div>

          <div className="space-y-2">
            <div className="p-3 rounded-lg border border-white/5 bg-slate-900/40 text-[11px] font-mono flex items-center justify-between text-slate-300">
              <span>ARS Readiness &lt; 60%</span>
              <span className="text-indigo-400">Auto-RCA</span>
            </div>
            <div className="p-3 rounded-lg border border-white/5 bg-slate-900/40 text-[11px] font-mono flex items-center justify-between text-slate-300">
              <span>OCR Citation Rate &lt; 40%</span>
              <span className="text-indigo-400">Auto-RCA</span>
            </div>
          </div>

          <Link
            href={`/${workspaceSlug}/fixit/playbook`}
            className="block w-full py-2.5 text-center text-xs font-bold font-mono rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all"
          >
            Configure Playbook Rules
          </Link>
        </div>

      </div>

    </div>
  );
}
