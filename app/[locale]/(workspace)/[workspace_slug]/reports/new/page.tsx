"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft,
  ShieldCheck,
  FilePlus,
  Layers,
  Activity,
  AlertTriangle,
  Cpu
} from "lucide-react";

export default function NewReportWizard() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";

  const [reportName, setReportName] = useState("");
  const [panelVersion, setPanelVersion] = useState(1);
  const [competitorList, setCompetitorList] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportName.trim()) return;

    setIsPending(true);
    setTimeout(() => {
      // Navigate back to reports list
      router.push(`/${workspaceSlug}/reports`);
    }, 1500);
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-6xl w-full mx-auto text-slate-100 bg-slate-900">
      {/* Back Link */}
      <div>
        <Link
          href={`/${workspaceSlug}/reports`}
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-500 hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          BACK TO REPORTS HUB
        </Link>
      </div>

      {/* Header */}
      <div className="border-b border-white/5 pb-6">
        <div className="text-xs text-indigo-400 font-mono font-bold tracking-wider uppercase mb-1">
          benchmark report wizard
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 flex items-center gap-3">
          <FilePlus className="w-8 h-8 text-indigo-400" />
          Configure New Benchmark Report
        </h1>
        <p className="text-slate-400 text-sm">
          Map locked probe panels and declare competitor targets to initialize a reviewable benchmark report copy.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Form configurator */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/30 space-y-6">
            <h3 className="font-bold text-base text-white">Report Specifications</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-mono uppercase">Report Name Label</label>
                <input
                  type="text"
                  required
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  placeholder="e.g. Q3 Clinical Retinol observed GEO Performance Report"
                  className="w-full p-2.5 rounded-lg border border-white/10 bg-slate-900 text-slate-200 outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-mono uppercase">Link Locked Probe Panel</label>
                  <select
                    value={panelVersion}
                    onChange={(e) => setPanelVersion(parseInt(e.target.value))}
                    className="w-full p-2.5 rounded-lg border border-white/10 bg-slate-900 text-slate-200 outline-none focus:border-indigo-500 font-mono"
                  >
                    <option value={1}>K-Beauty Hydration AI Panel (v1) [Locked]</option>
                    <option value={2}>Luxury Absolute Balm panel (v1) [Locked]</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-mono uppercase">Competitors List (Comma separated)</label>
                  <input
                    type="text"
                    value={competitorList}
                    onChange={(e) => setCompetitorList(e.target.value)}
                    placeholder="e.g. CompetitorA, CompetitorB"
                    className="w-full p-2.5 rounded-lg border border-white/10 bg-slate-900 text-slate-200 outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-white/5 border border-white/5 text-[9px] text-slate-400 leading-normal">
                ℹ️ **Note**: Initializing this report will automatically trigger the **AI Report Drafting Agent** to synthesize executive summary drafts.
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2.5 font-bold rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-all shadow-md shadow-indigo-500/10 flex items-center justify-center gap-2"
              >
                {isPending ? "Generating Drafts..." : "Initialize & Generate AI Drafts"}
              </button>

            </form>
          </div>
        </div>

        {/* Right Column: Warning box */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <AlertTriangle className="w-4.5 h-4.5 text-amber-500" />
              Safety Boundaries Alert
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              If your report targets competitor names (such as **CompetitorA** or **CompetitorB**), it will be flagged as **competitive real-brand benchmark report**. 
              In compliance with BSW-OS, competitive exports strictly lock the release gate until a manual Strategist Review has been submitted and approved.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
