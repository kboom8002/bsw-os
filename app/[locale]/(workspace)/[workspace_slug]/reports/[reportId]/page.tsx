"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  ArrowLeft,
  ShieldCheck,
  FileText,
  Activity,
  CheckCircle,
  Database,
  ArrowRight,
  TrendingUp,
  Cpu,
  Lock,
  GitPullRequest,
  CheckSquare,
  AlertTriangle
} from "lucide-react";

export default function ReportDetailSafetyPortal() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";
  const reportId = (params?.reportId as string) || "rep-1";

  // Mock report details
  const report = {
    id: reportId,
    report_name: reportId === "rep-2" ? "Acme Competitive Skincare Report" : "Weekly Retinol GEO Crawler Report",
    panel_version: 1,
    is_published: reportId === "rep-1",
    created_at: "2026-05-23T18:10:00Z",
    scores: reportId === "rep-2" ? {
      ARS: 50.00,
      AAS: 100.00,
      OCR: 0.00,
      BSF: 55.00
    } : {
      ARS: 98.50,
      AAS: 100.00,
      OCR: 100.00,
      BSF: 95.00
    }
  };

  // Mock safety checks results
  const [gateResults, setGateResults] = useState(reportId === "rep-2" ? {
    status: "fail",
    blocking_reasons: [
      "Unresolved unsafe market-share or brand-ranking wording findings were detected.",
      "Competitive real-brand benchmark reports require an approved manual review before export."
    ],
    required_fixes: [
      "Resolve the flagged forbidden term 'market share' inside the Review tab queue.",
      "Submit an APPROVED review decision on the manual reviewer board."
    ]
  } : {
    status: "pass",
    blocking_reasons: [],
    required_fixes: []
  });

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
              REPORT ID: {report.id}
            </span>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-white/5 border border-white/5 text-slate-400">
              Panel v{report.panel_version}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 flex items-center gap-3">
            <FileText className="w-8 h-8 text-indigo-400" />
            {report.report_name}
          </h1>
          <p className="text-slate-400 text-sm">
            Auditing AEO benchmark scorecards, active safety validation gates, and manual strategist reviews.
          </p>
        </div>

        {/* Status display */}
        <div className="p-4 rounded-xl border border-white/5 bg-slate-950/40 text-center min-w-[120px]">
          <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">Export Gate Status</div>
          <div className={`text-lg font-bold uppercase flex items-center justify-center gap-1 ${
            gateResults.status === "pass" ? "text-emerald-400" : "text-amber-400"
          }`}>
            {gateResults.status === "pass" ? (
              <>
                <CheckCircle className="w-4 h-4" />
                PASS
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4" />
                BLOCKED
              </>
            )}
          </div>
          <div className="text-[8px] text-slate-400 font-mono mt-1">REPLICABLE & SECURE</div>
        </div>
      </div>

      {/* Core navigation studio links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link 
          href={`/${workspaceSlug}/reports/${report.id}/builder`}
          className="p-4 rounded-xl border border-white/5 bg-slate-950/30 hover:bg-slate-950/60 transition-all text-center block"
        >
          <span className="text-[10px] text-slate-500 font-mono uppercase block mb-1">Edit draft</span>
          <span className="text-xs font-bold text-white">Report Builder</span>
        </Link>
        <Link 
          href={`/${workspaceSlug}/reports/${report.id}/methodology`}
          className="p-4 rounded-xl border border-white/5 bg-slate-950/30 hover:bg-slate-950/60 transition-all text-center block"
        >
          <span className="text-[10px] text-slate-500 font-mono uppercase block mb-1">Appendix</span>
          <span className="text-xs font-bold text-white">Methodology Spec</span>
        </Link>
        <Link 
          href={`/${workspaceSlug}/reports/${report.id}/review`}
          className="p-4 rounded-xl border border-white/5 bg-slate-950/30 hover:bg-slate-950/60 transition-all text-center block"
        >
          <span className="text-[10px] text-slate-500 font-mono uppercase block mb-1">Wording queue</span>
          <span className="text-xs font-bold text-white">Fidelity Review</span>
        </Link>
        <Link 
          href={`/${workspaceSlug}/reports/${report.id}/export`}
          className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-950/10 hover:bg-indigo-950/20 transition-all text-center block"
        >
          <span className="text-[10px] text-indigo-400 font-mono uppercase block mb-1">Publish canvas</span>
          <span className="text-xs font-bold text-indigo-300">Compile & Export</span>
        </Link>
      </div>

      {/* Overview scorecard and Safety validation details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left score cards */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 space-y-4">
            <h3 className="font-bold text-sm text-white">Attached Crawler Metrics</h3>
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-xs text-slate-400">AEO Readiness Score (ARS):</span>
                <span className="text-sm font-bold text-white font-mono">{report.scores.ARS}%</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-xs text-slate-400">AI Answer Share (AAS):</span>
                <span className="text-sm font-bold text-cyan-400 font-mono">{report.scores.AAS}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Official Citation Rate (OCR):</span>
                <span className="text-sm font-bold text-purple-400 font-mono">{report.scores.OCR}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right safety blockers list */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 space-y-4">
            <h3 className="font-bold text-lg text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              Report Export Gate Audit
            </h3>

            {gateResults.status === "pass" ? (
              <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/20 text-emerald-300 text-xs font-mono flex items-start gap-3">
                <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
                <div>
                  <span className="font-bold text-white block mb-0.5">GATE PASSED: Flawless Compliance Clear</span>
                  <p className="leading-normal">
                    This report links to an active methodology disclosure, contains the proxy caveat disclaimer, carries no unresolved unsafe wording triggers, and has cleared all required competitive strategist manual review gates. Fully authorized for HTML/Markdown export publishing.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-red-500/20 bg-red-950/20 text-red-300 text-xs font-mono flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
                  <div>
                    <span className="font-bold text-white block mb-1">GATE LOCKED: Safety Blockers Detected</span>
                    <ul className="list-disc pl-4 space-y-1">
                      {gateResults.blocking_reasons.map((b, idx) => (
                        <li key={idx}>{b}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-white/5 bg-slate-900/60 text-xs space-y-2">
                  <span className="text-slate-300 font-bold block">Required Fixes:</span>
                  <ul className="list-disc pl-4 space-y-1.5 text-slate-400">
                    {gateResults.required_fixes.map((f, idx) => (
                      <li key={idx}>{f}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
