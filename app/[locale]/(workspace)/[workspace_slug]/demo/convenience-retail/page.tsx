"use client";

import React, { useState } from "react";
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

export default function ConvenienceDemoFlow() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";

  // Feature flag state for real convenience brands
  const [activeBrand, setActiveBrand] = useState<"Quick25" | "GS25" | "CU">("Quick25");

  // Trace steps
  const steps = [
    {
      title: "1. Brand Truth & Store locators",
      desc: `${activeBrand}'s strategic 24/7 store locator accuracy claims locked securely in the Brand Truth Vault.`,
      status: "Verified",
      link: `/${workspaceSlug}/truth`,
      meta: "Strategic Claim: Guaranteed 24/7 store locator accuracy"
    },
    {
      title: "2. Promotion & Stock Evidence",
      desc: "Evidence sheet 'Registry Certificate' verified to guarantee local inventory uptime.",
      status: "Verified",
      link: `/${workspaceSlug}/truth/evidence`,
      meta: "Evidence Certificate: Locator Registry Uptime verified"
    },
    {
      title: "3. Late-Night combination signals",
      desc: "Crawl signals mapped to canonical questions targeting '오늘 밤 편의점 야식으로 가성비 좋은 조합은?'.",
      status: "Linked",
      link: `/${workspaceSlug}/semantic-core/signals`,
      meta: "Signal Query intent: Navigational"
    },
    {
      title: "4. Menu combos & coordinates Surface",
      desc: `${activeBrand} Late-Night Combo Menu representation object linked to semantic LocalBusiness schemas.`,
      status: "Gates Passed",
      link: `/${workspaceSlug}/objects`,
      meta: "JSON-LD Struct: LocalBusiness/MenuProduct"
    },
    {
      title: "5. Observatory local Action Panel",
      desc: "Convenience Local Action Panel frozen to verify search assistant map listings.",
      status: "Frozen v1",
      link: `/${workspaceSlug}/observatory/panels`,
      meta: "Crawler Probe: Where is the nearest store located?"
    },
    {
      title: "6. Benchmark AEO/GEO Report",
      desc: "Local Action AEO/GEO Report compiled under strict gates, with methodology disclosures.",
      status: "Published",
      link: `/${workspaceSlug}/reports`,
      meta: "AEO Readiness: 90.00% ARS"
    },
    {
      title: "7. Fix-It & Action CTA patch",
      desc: "RCA exception approved, local business schema corrector patch applied, verifying +35% ARS lift with zero regressions.",
      status: "Completed",
      link: `/${workspaceSlug}/fixit`,
      meta: "Post-Patch Lift Snapshot: +35.00% ARS lift"
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
            Local action & Menu combinations Flow
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 flex items-center gap-3">
            <Layers className="w-8 h-8 text-indigo-400" />
            Convenience Retail E2E Flow
          </h1>
          <p className="text-slate-400 text-sm">
            Walk the trace path for local search intents, pricing boundaries, and action map CTAs.
          </p>
        </div>

        {/* Brand switcher feature flags */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveBrand("Quick25")}
            className={`px-3 py-1.5 text-[10px] font-bold font-mono rounded-lg border transition-all ${
              activeBrand === "Quick25" ? "border-indigo-500 bg-indigo-500/10 text-white" : "border-white/5 bg-slate-900 text-slate-400"
            }`}
          >
            QUICK25 (SYNTHETIC)
          </button>
          <button
            onClick={() => setActiveBrand("GS25")}
            className={`px-3 py-1.5 text-[10px] font-bold font-mono rounded-lg border transition-all ${
              activeBrand === "GS25" ? "border-indigo-500 bg-indigo-500/10 text-white" : "border-white/5 bg-slate-900 text-slate-400"
            }`}
          >
            GS25 (FEATURE-FLAG)
          </button>
          <button
            onClick={() => setActiveBrand("CU")}
            className={`px-3 py-1.5 text-[10px] font-bold font-mono rounded-lg border transition-all ${
              activeBrand === "CU" ? "border-indigo-500 bg-indigo-500/10 text-white" : "border-white/5 bg-slate-900 text-slate-400"
            }`}
          >
            CU (FEATURE-FLAG)
          </button>
        </div>
      </div>

      {/* Warning */}
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
