"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  ArrowLeft,
  Activity,
  CheckCircle,
  HelpCircle,
  FileText,
  Clock,
  ExternalLink,
  Zap,
  Play
} from "lucide-react";

export default function RetestsList() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";

  // Mock retests list
  const runs = [
    {
      id: "run-1",
      plan_id: "plan-1",
      patch_name: "Clinical Retinol Credential injection",
      panel_name: "Clinical Retinol Panel (v1)",
      status: "completed",
      retest_verdict: "pass",
      created_at: "2026-05-23T19:10:00Z",
      completed_at: "2026-05-23T19:12:00Z"
    },
    {
      id: "run-2",
      plan_id: "plan-2",
      patch_name: "Squalane official URL correction",
      panel_name: "Clinical Squalane Panel (v1)",
      status: "running",
      retest_verdict: null,
      created_at: "2026-05-23T19:20:00Z",
      completed_at: null
    }
  ];

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-6xl w-full mx-auto text-slate-100 bg-slate-900">
      {/* Back Link */}
      <div>
        <Link
          href={`/${workspaceSlug}/fixit`}
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-500 hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          BACK TO FIX-IT CENTRAL
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="text-xs text-indigo-400 font-mono font-bold tracking-wider uppercase mb-1">
            Verification Crawlers
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 flex items-center gap-3">
            <Activity className="w-8 h-8 text-indigo-400" />
            Retest Runs Console
          </h1>
          <p className="text-slate-400 text-sm">
            Monitor and execute post-patch verification crawls. Verification requires compiling post-patch metrics against original baseline snapshots.
          </p>
        </div>
      </div>

      {/* Runs List */}
      <div className="space-y-6">
        <h3 className="font-bold text-lg text-white">Post-Patch Crawler Runs</h3>
        
        <div className="space-y-4">
          {runs.map(run => (
            <div key={run.id} className="p-6 rounded-2xl border border-white/5 bg-slate-950/30 space-y-4">
              
              {/* Meta header info */}
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[9px] font-mono rounded bg-white/5 text-slate-400">
                    RUN ID: {run.id}
                  </span>
                  <span className="px-2 py-0.5 text-[9px] font-mono rounded bg-purple-500/10 text-purple-300 border border-purple-500/25">
                    PLAN ID: {run.plan_id}
                  </span>
                </div>
                
                <span className={`px-2 py-0.5 text-[8px] font-mono font-bold rounded uppercase ${
                  run.status === "completed"
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                    : "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                }`}>
                  {run.status}
                </span>
              </div>

              {/* Run Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <h4 className="text-slate-500 font-mono text-[9px] uppercase mb-1">Target Patch Ticket</h4>
                  <div className="text-sm font-bold text-white">{run.patch_name}</div>
                </div>
                <div>
                  <h4 className="text-slate-500 font-mono text-[9px] uppercase mb-1">Observation Probe Panel</h4>
                  <div className="text-sm font-bold text-slate-300">{run.panel_name}</div>
                </div>
              </div>

              {/* Time stats */}
              <div className="flex justify-between items-center pt-2 border-t border-white/5">
                <div className="text-[9px] text-slate-500 font-mono space-y-0.5">
                  <div>Started: {new Date(run.created_at).toLocaleString()}</div>
                  {run.completed_at && <div>Completed: {new Date(run.completed_at).toLocaleString()}</div>}
                </div>
                
                <Link
                  href={`/${workspaceSlug}/fixit/retests/${run.id}`}
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono"
                >
                  Inspect Retest <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
