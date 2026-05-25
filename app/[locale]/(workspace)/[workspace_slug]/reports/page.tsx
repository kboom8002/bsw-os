"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  ShieldCheck, 
  Sparkles, 
  ArrowRight,
  Shield,
  Activity,
  FileBarChart,
  GitPullRequest,
  CheckCircle,
  FileCheck,
  Zap,
  Plus,
  Percent
} from "lucide-react";

export default function ReportsDashboard() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";

  // Mock list of benchmark reports
  const [reports, setReports] = useState([
    {
      id: "rep-1",
      report_name: "Weekly Retinol GEO Crawler Report",
      panel_version: 1,
      scores: { ARS: 98.50, AAS: 100.00, OCR: 100.00 },
      is_published: true,
      created_at: "2026-05-23T18:10:00Z"
    },
    {
      id: "rep-2",
      report_name: "Acme Competitive Skincare Report",
      panel_version: 1,
      scores: { ARS: 50.00, AAS: 100.00, OCR: 0.00 },
      is_published: false,
      created_at: "2026-05-23T15:20:00Z"
    }
  ]);

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-6xl w-full mx-auto text-slate-100 bg-slate-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="text-xs text-indigo-400 font-mono font-bold tracking-wider uppercase mb-1">
            Governed publishing studio
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 flex items-center gap-3">
            <FileBarChart className="w-8 h-8 text-indigo-400" />
            Benchmark Reports Hub
          </h1>
          <p className="text-slate-400 text-sm">
            Publish verified brand benchmarks. Scan for unsafe wording, attach methodology appendix disclaimers, and clear manual review gates.
          </p>
        </div>
        <div>
          <Link
            href={`/${workspaceSlug}/reports/new`}
            className="px-4 py-2 text-sm font-bold rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-md shadow-indigo-500/10 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Benchmark Report
          </Link>
        </div>
      </div>

      {/* Grid reports list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map(rep => (
          <div 
            key={rep.id} 
            className="p-6 rounded-2xl border border-white/5 bg-slate-950/50 flex flex-col justify-between hover:border-white/10 transition-all hover:translate-y-[-2px] duration-200"
          >
            <div>
              {/* Meta details */}
              <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                <span className="px-2 py-0.5 text-[9px] font-mono font-bold rounded bg-indigo-500/10 text-indigo-300 uppercase">
                  Panel v{rep.panel_version}
                </span>
                <span className={`px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full uppercase tracking-wider ${
                  rep.is_published 
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                    : "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                }`}>
                  {rep.is_published ? "Exported / Published" : "Draft"}
                </span>
              </div>

              {/* Title & scores */}
              <div className="mb-4">
                <h3 className="font-bold text-lg text-white mb-3">
                  {rep.report_name}
                </h3>
                
                {/* Score indicators */}
                <div className="grid grid-cols-3 gap-2 text-center pt-2">
                  <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                    <span className="text-[8px] text-slate-500 font-mono uppercase block">ARS</span>
                    <span className="text-sm font-bold text-white font-mono">{rep.scores.ARS}%</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                    <span className="text-[8px] text-slate-500 font-mono uppercase block">AAS</span>
                    <span className="text-sm font-bold text-cyan-400 font-mono">{rep.scores.AAS}%</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                    <span className="text-[8px] text-slate-500 font-mono uppercase block">OCR</span>
                    <span className="text-sm font-bold text-purple-400 font-mono">{rep.scores.OCR}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation links console */}
            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between gap-4">
              <Link
                href={`/${workspaceSlug}/reports/${rep.id}/builder`}
                className="text-xs font-mono font-bold text-slate-400 hover:text-white"
              >
                Open Builder
              </Link>
              <Link
                href={`/${workspaceSlug}/reports/${rep.id}`}
                className="text-xs font-bold text-indigo-400 hover:underline flex items-center gap-1.5"
              >
                <span>Safety Review & Export</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Safety Disclosures Banner */}
      <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 backdrop-blur-sm space-y-4">
        <h3 className="font-bold text-lg text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-400" />
          BSW-OS Report Publisher Core Ethics
        </h3>
        <p className="text-slate-400 text-xs leading-relaxed leading-normal">
          Reports are restricted from public exports unless they satisfy BSW-OS's strict safety release gates. 
          Every report must carry a **Methodology Appendix** and a **Proxy Caveat disclaimer**, and is audited by the **Unsafe Wording Scanners** to guarantee the brand does not claim definitive consumer preferences or definitive market shares based on proxy AI observation logs.
        </p>
      </div>
    </div>
  );
}
