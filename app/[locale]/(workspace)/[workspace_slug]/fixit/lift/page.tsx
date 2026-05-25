"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  ArrowLeft,
  TrendingUp,
  CheckCircle,
  Activity,
  Layers,
  ArrowUpRight,
  Sparkles
} from "lucide-react";

export default function LiftAnalyzer() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";

  // Mock lift snapshots
  const lifts = [
    {
      id: "lift-1",
      metric_name: "AEO Readiness Score (ARS)",
      baseline: 50.00,
      retest: 65.20,
      lift: 15.20,
      verdict: "pass",
      status: "Verified Lift"
    },
    {
      id: "lift-2",
      metric_name: "Official Citation Rate (OCR)",
      baseline: 30.00,
      retest: 45.00,
      lift: 15.00,
      verdict: "pass",
      status: "Verified Lift"
    },
    {
      id: "lift-3",
      metric_name: "Brand Semantic Fidelity (BSF)",
      baseline: 90.00,
      retest: 92.00,
      lift: 2.00,
      verdict: "pass",
      status: "Verified Lift"
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
            Statistical Lift snap curves
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-indigo-400" />
            Post-Patch Lift snapshots
          </h1>
          <p className="text-slate-400 text-sm">
            Auditing mathematical lifts across AEO metrics snapshots. Lifts compile post-patch crawls against baselines.
          </p>
        </div>
      </div>

      {/* Curves visual display cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {lifts.map(item => (
          <div key={item.id} className="p-6 rounded-2xl border border-white/5 bg-slate-950/30 space-y-4">
            
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">{item.metric_name}</span>
              <span className="px-2 py-0.5 rounded text-[8px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {item.status}
              </span>
            </div>

            {/* Simulated curve graphs */}
            <div className="h-16 flex items-end gap-1.5 pt-2">
              <div className="h-6 w-full rounded bg-white/5 flex items-center justify-center font-mono text-[9px] text-slate-500">
                {item.baseline}% Base
              </div>
              <div className="h-12 w-full rounded bg-indigo-500/20 border-t border-indigo-400 flex items-center justify-center font-mono text-[9px] text-indigo-300">
                {item.retest}% Retest
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-xs text-slate-400">Calculated Lift delta:</span>
              <span className="text-sm font-bold text-emerald-400 font-mono flex items-center gap-0.5">
                +{item.lift.toFixed(2)}%
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
