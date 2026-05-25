"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  ShieldCheck, 
  Sparkles, 
  HelpCircle, 
  Layers, 
  Eye, 
  FileText, 
  ArrowRight,
  Database,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

export default function TruthDashboard() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-6xl w-full mx-auto text-slate-100 bg-slate-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="text-xs text-cyan-400 font-mono font-bold tracking-wider uppercase mb-1">
            Studio Module
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
            Brand Truth Studio
          </h1>
          <p className="text-slate-400 text-sm">
            Configure strategic brand pillars, document evidence-backed claims, and manage safety boundary rules.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/${workspaceSlug}/truth/gate`}
            className="px-4 py-2 text-sm font-bold rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 shadow-md shadow-cyan-400/10 transition-all flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            Run Truth Lock Gate
          </Link>
        </div>
      </div>

      {/* Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Strategic Truth Status Card */}
        <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-slate-500 font-mono uppercase">Strategic Layer</span>
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </div>
            <h3 className="font-bold text-lg text-white mb-2">Strategic Truth</h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-6">
              Establish core mission statements, visions, and high-level marketing pillars.
            </p>
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 font-mono text-[10px] text-slate-300">
              Pillars: Clinical Efficacy, Scientific Traceability, Zero Hallucinations.
            </div>
          </div>
          <Link
            href={`/${workspaceSlug}/truth/strategic`}
            className="mt-6 flex items-center justify-between text-xs font-bold text-cyan-400 hover:underline"
          >
            <span>Configure Strategic Truth</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Operational Claims Card */}
        <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-slate-500 font-mono uppercase">Factual Layer</span>
              <Layers className="w-4 h-4 text-purple-400" />
            </div>
            <h3 className="font-bold text-lg text-white mb-2">Operational Claims</h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-6">
              Document verified chemical, pricing, or product claims that must transfer to AI search engines.
            </p>
            <div className="flex items-center gap-4 text-xs font-mono text-slate-300">
              <div>Claims: <span className="text-white font-bold">12 Active</span></div>
              <div>High Risk: <span className="text-red-400 font-bold">3 Restricted</span></div>
            </div>
          </div>
          <Link
            href={`/${workspaceSlug}/truth/operational`}
            className="mt-6 flex items-center justify-between text-xs font-bold text-purple-400 hover:underline"
          >
            <span>Manage Operational Claims</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Observed Claims Card */}
        <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-slate-500 font-mono uppercase">Crawled Layer</span>
              <Eye className="w-4 h-4 text-green-400" />
            </div>
            <h3 className="font-bold text-lg text-white mb-2">Observed Claims</h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-6">
              Scrape external portals and analyze how AI models reconstruct your brand claims.
            </p>
            <div className="flex items-center gap-4 text-xs font-mono text-slate-300">
              <div>Observed: <span className="text-white font-bold">4 Extracted</span></div>
              <div className="flex items-center gap-1 text-green-400">
                <CheckCircle className="w-3 h-3" /> 100% Aligned
              </div>
            </div>
          </div>
          <Link
            href={`/${workspaceSlug}/truth/observed`}
            className="mt-6 flex items-center justify-between text-xs font-bold text-green-400 hover:underline"
          >
            <span>Review Observed Claims</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Gating & Evidence Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Evidence & Boundaries Repository */}
        <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 backdrop-blur-sm space-y-6">
          <h3 className="font-bold text-lg text-white">Trust Assets Repository</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Evidence attachments and boundary rules act as the source of trust for AEO/GEO indexing gates.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href={`/${workspaceSlug}/truth/evidence`}
              className="p-4 rounded-xl border border-white/5 bg-slate-900/60 hover:bg-slate-900 transition-all space-y-1 block"
            >
              <div className="font-bold text-sm text-slate-200">Evidence Library</div>
              <div className="text-[10px] text-slate-500 font-mono">Verified PDF lab trials</div>
            </Link>
            <Link
              href={`/${workspaceSlug}/truth/boundaries`}
              className="p-4 rounded-xl border border-white/5 bg-slate-900/60 hover:bg-slate-900 transition-all space-y-1 block"
            >
              <div className="font-bold text-sm text-slate-200">Boundary Rules</div>
              <div className="text-[10px] text-slate-500 font-mono">Forbidden words & disclosures</div>
            </Link>
          </div>
        </div>

        {/* Truth Lock Gate Status */}
        <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 backdrop-blur-sm flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-bold text-lg text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              Truth Lock Release Status
            </h3>
            <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-950/20 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-slate-100">Release Gate level: L2 Passed</div>
                <p className="text-[10px] text-slate-400 leading-normal mt-1">
                  All critical and high-risk operational claims have verified clinical trials attached. Verified and safe for public semantic generation.
                </p>
              </div>
            </div>
          </div>
          <Link
            href={`/${workspaceSlug}/truth/gate`}
            className="mt-6 flex items-center justify-between text-xs font-bold text-cyan-400 hover:underline"
          >
            <span>Gate Evaluator Details</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
