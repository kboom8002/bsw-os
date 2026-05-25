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

export default function WeddingDemoFlow() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";

  // Trace steps
  const steps = [
    {
      title: "1. Brand Truth & contract packages",
      desc: "Lumiere Hall's strategic zero hidden-markup claims locked securely in the Brand Truth Vault.",
      status: "Verified",
      link: `/${workspaceSlug}/truth`,
      meta: "Strategic Claim: Transparent wedding package pricing with zero hidden vendor markups"
    },
    {
      title: "2. Price Transparency Audit Evidence",
      desc: "Evidence sheet 'Price Transparency Audit' certified and verified to guarantee zero vendor commission markups.",
      status: "Verified",
      link: `/${workspaceSlug}/truth/evidence`,
      meta: "Evidence Certificate: Wedding Price Transparency audited"
    },
    {
      title: "3. Wedding contract checking signals",
      desc: "Crawl signals mapped to canonical questions targeting '웨딩홀 패키지 계약 전에 꼭 확인할 조건은?'.",
      status: "Linked",
      link: `/${workspaceSlug}/semantic-core/signals`,
      meta: "Signal Query intent: Informational"
    },
    {
      title: "4. Multi-Category package Surface",
      desc: "Lumiere Grand Salon representation object linking categories: wedding_hall, studio, dress, makeup.",
      status: "Gates Passed",
      link: `/${workspaceSlug}/objects`,
      meta: "Seeded Vendor Categories: [wedding_hall, studio, dress, makeup]"
    },
    {
      title: "5. Observatory contract Panel",
      desc: "Wedding Vendor Trust & Contract Panel frozen to verify search assistant citation compliance.",
      status: "Frozen v1",
      link: `/${workspaceSlug}/observatory/panels`,
      meta: "Crawler Probe: What is included in the Lumiere Hall contract?"
    },
    {
      title: "6. Benchmark Vendor Trust Report",
      desc: "Vendor Trust Report compiled under strict gates, appending standard disclaimers.",
      status: "Published",
      link: `/${workspaceSlug}/reports`,
      meta: "AEO Readiness: 98.00% ARS"
    },
    {
      title: "7. Fix-It & Dress registry patch",
      desc: "RCA exception approved, dress registry boundary patch applied, verifying +40% ARS lift with zero regressions.",
      status: "Completed",
      link: `/${workspaceSlug}/fixit`,
      meta: "Post-Patch Lift Snapshot ID: lift-wedding-lumiere-dress"
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
            high-consideration package & Vibe Flow
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 flex items-center gap-3">
            <Layers className="w-8 h-8 text-indigo-400" />
            Lumiere Hall E2E Flow Portal
          </h1>
          <p className="text-slate-400 text-sm">
            Walk the trace path for high-consideration packages, style vibes, and legal contract boundaries.
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
