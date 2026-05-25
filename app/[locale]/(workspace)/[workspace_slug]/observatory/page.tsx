"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  Eye, 
  Layers, 
  Cpu, 
  ClipboardList, 
  LineChart, 
  Brain, 
  Scale, 
  ArrowRight,
  ShieldAlert
} from "lucide-react";

export default function ObservatoryPortalDashboard() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";

  const submodules = [
    {
      name: "AI Probe Panels",
      href: `/${workspaceSlug}/observatory/panels`,
      icon: Layers,
      color: "text-cyan-400",
      description: "Govern versioned search query collections, map active QIS contexts, and lock/freeze question specifications."
    },
    {
      name: "AI Observation Runs",
      href: `/${workspaceSlug}/observatory/runs`,
      icon: Cpu,
      color: "text-purple-400",
      description: "Trigger sandboxed crawls over locked panels. Query deterministic mock providers and record raw response copy."
    },
    {
      name: "Response Judgments",
      href: `/${workspaceSlug}/observatory/judgments`,
      icon: ClipboardList,
      color: "text-emerald-400",
      description: "Fidelity review board. Audit citation links, brand semantic accuracy, and approve/reject candidate scores."
    },
    {
      name: "AI Search Metrics",
      href: `/${workspaceSlug}/observatory/metrics`,
      icon: LineChart,
      color: "text-white",
      description: "Compute AAS (Answer Share), OCR (Citation Rate), and compute Semantic Website Effect Lift (SWEL) comparisons."
    },
    {
      name: "Mismatch Risk Indices (MRI)",
      href: `/${workspaceSlug}/observatory/indices`,
      icon: Brain,
      color: "text-rose-400",
      description: "Govern internal operational Diagnosis risk (OPS-MRI) and competitive external search crawling risk (B-MRI) side-by-side."
    },
    {
      name: "Methodology Disclosures",
      href: `/${workspaceSlug}/observatory/methodology`,
      icon: Scale,
      color: "text-amber-400",
      description: "Maintain active proxy caveat statements, limitations warnings, and legal brand safety declarations."
    }
  ];

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-6xl w-full mx-auto text-slate-100 bg-slate-900">
      {/* Header */}
      <div className="border-b border-white/5 pb-6">
        <div className="text-xs text-cyan-400 font-mono font-bold tracking-wider uppercase mb-1">
          Module B6: AI Search Observatory & Metrics Hub
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 flex items-center gap-3">
          <Eye className="w-8 h-8 text-cyan-400" />
          AI Search Observatory
        </h1>
        <p className="text-slate-400 text-sm">
          BSW-OS's unified external AI search and AEO crawling benchmark audit deck. 
          Analyze brand representation across generative models, check citation links, and calculate clinical safety indices.
        </p>
      </div>

      {/* Portal Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {submodules.map(sub => (
          <div 
            key={sub.name}
            className="p-6 rounded-2xl border border-white/5 bg-slate-950/50 flex flex-col justify-between hover:border-white/10 transition-all hover:translate-y-[-2px] duration-200"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <sub.icon className={`w-6 h-6 ${sub.color}`} />
                <h3 className="font-bold text-base text-white">{sub.name}</h3>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                {sub.description}
              </p>
            </div>
            
            <Link
              href={sub.href}
              className={`mt-6 flex items-center justify-between text-xs font-bold ${sub.color} hover:underline`}
            >
              <span>Explore Submodule</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ))}
      </div>

      {/* Safety Disclosures Banner */}
      <div className="p-6 rounded-2xl border border-amber-500/20 bg-amber-950/15 text-amber-300 space-y-3">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          MANDATORY PROXY CAVEAT NOTICE
        </h3>
        <p className="text-[11px] leading-relaxed italic font-mono leading-normal">
          "All AI/search observation metrics are panel-based proxies under this specific methodology and measurement period. 
          These observed AI/search-like responses and observed answer shares do not constitute true market share, definitive AI ranking, 
          actual AI preference, or guaranteed visibility, and they do not prove consumer preference."
        </p>
      </div>
    </div>
  );
}
