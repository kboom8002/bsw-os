"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  ArrowLeft,
  CheckCircle,
  FileText,
  ShieldCheck,
  Activity,
  Layers,
  Cpu,
  TrendingUp,
  ExternalLink,
  Info
} from "lucide-react";

export default function KBeautyDemoFlow() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";

  // Trace steps
  const steps = [
    {
      title: "1. Brand Truth & Safety boundaries",
      desc: "PureBarrier's strategic and operational derm recovery claims locked securely in the Brand Truth Vault.",
      status: "Verified",
      link: `/${workspaceSlug}/truth`,
      meta: "Strategic Claim: Dermatologist recovery barrier formula"
    },
    {
      title: "2. Clinical Trial Evidence",
      desc: "Clinical evidence sheet 'Global Derm Ceramide Trial' certified and verified with 100% fidelity.",
      status: "Verified",
      link: `/${workspaceSlug}/truth/evidence`,
      meta: "Evidence Certificate ID: ev-purebarrier-ceramide"
    },
    {
      title: "3. Semantic Query Signals (QIS)",
      desc: "Crawl signals mapped to canonical questions and scenes targeting '민감성 피부 장벽 회복 루틴은 어떻게 짜야 하나요?'.",
      status: "Linked",
      link: `/${workspaceSlug}/semantic-core/signals`,
      meta: "Signal Query intent: Informational"
    },
    {
      title: "4. Presentation Surface Contract",
      desc: "PureBarrier Skin Recovery Cream representation object linked to semantic schema structures.",
      status: "Gates Passed",
      link: `/${workspaceSlug}/objects`,
      meta: "JSON-LD Struct: Product/RoutineProduct"
    },
    {
      title: "5. Observatory Crawl Panel",
      desc: "K-Beauty Sensitive Skincare Panel frozen (locked) to run statistical observed crawls.",
      status: "Frozen v1",
      link: `/${workspaceSlug}/observatory/panels`,
      meta: "Crawler Probe: What makes PureBarrier Cream good for sensitive skin?"
    },
    {
      title: "6. Benchmark Publication Report",
      desc: "Benchmark Trust Report cleared under strict gates, appending standard methodology appendices and proxy caveats.",
      status: "Published",
      link: `/${workspaceSlug}/reports`,
      meta: "AEO Readiness: 95.00% ARS"
    },
    {
      title: "7. Fix-It & Retest loop",
      desc: "RCA exception approved, patch applied, and post-patch retest executed to verify +15.2% ARS lift with zero regressions.",
      status: "Completed",
      link: `/${workspaceSlug}/fixit`,
      meta: "Post-Patch Lift Snapshot ID: lift-purebarrier-ceramide"
    }
  ];

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-4xl w-full mx-auto text-slate-100 bg-slate-900">
      
      {/* Back Link */}
      <div>
        <Link
          href={`/${workspaceSlug}/demo`}
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-500 hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          BACK TO DEMO HUB
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="text-xs text-indigo-400 font-mono font-bold tracking-wider uppercase mb-1">
            YMYL Skin barrier recovery Flow
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-indigo-400" />
            PureBarrier E2E Flow Portal
          </h1>
          <p className="text-slate-400 text-sm">
            Walk the secure trace path for YMYL clinical skincare claims, demonstrating evidence boundaries and metrics lifts.
          </p>
        </div>
      </div>

      {/* standard warning banner about proxy caveats */}
      <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-950/20 text-amber-300 text-xs flex items-start gap-3">
        <Info className="w-4.5 h-4.5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white block mb-0.5">Governed AI Proxy Notice</span>
          <p className="leading-normal">
            Observations are compiled from simulated cohort queries via panel-based proxies; results are statistical approximations and do not represent internal, proprietary LLM weighting systems.
          </p>
        </div>
      </div>

      {/* E2E Steps List */}
      <div className="space-y-6">
        {steps.map((step, idx) => (
          <div key={idx} className="p-6 rounded-2xl border border-white/5 bg-slate-950/30 space-y-3 relative overflow-hidden">
            
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-base text-white">{step.title}</h3>
              <span className="px-2 py-0.5 rounded text-[8px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                {step.status}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed font-sans leading-normal">
              {step.desc}
            </p>

            <div className="p-3 rounded-lg bg-white/5 border border-white/5 text-[10px] font-mono text-slate-300 italic">
              {step.meta}
            </div>

            <div className="flex justify-end pt-1">
              <Link
                href={step.link}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono"
              >
                Inspect Artifact Module <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
