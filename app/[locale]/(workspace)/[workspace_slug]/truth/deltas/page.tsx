"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createTruthDelta } from "@/app/actions/truth";
import { 
  ArrowLeft, 
  AlertTriangle, 
  CheckCircle2, 
  Trash2, 
  HelpCircle,
  Activity
} from "lucide-react";

interface DeltaItem {
  id: string;
  source_observed_claim: string;
  target_operational_claim: string;
  delta_summary: string;
  severity: "low" | "medium" | "high";
  is_resolved: boolean;
  created_at: string;
}

export default function DeltasPage() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";

  const [deltas, setDeltas] = useState<DeltaItem[]>([
    {
      id: "delta-501",
      source_observed_claim: "Provides 100% cure rate for eczema skincare skins.",
      target_operational_claim: "Restores skin barrier health in under 7 days.",
      delta_summary: "Observed third-party claim uses forbidden term 'cure eczema' violating FDA boundaries.",
      severity: "high",
      is_resolved: false,
      created_at: "2026-05-23T11:45:00Z"
    },
    {
      id: "delta-502",
      source_observed_claim: "Store alcohol is available with no age checks at night.",
      target_operational_claim: "Weekly convenience menu is 2-for-1 discount.",
      delta_summary: "Observed competitor crawlers claim illegal sale rules missing alcohol risk disclosures.",
      severity: "medium",
      is_resolved: true,
      created_at: "2026-05-22T15:20:00Z"
    }
  ]);

  const handleResolve = (deltaId: string) => {
    // Interactive state updates for demo purposes
    setDeltas(prev => prev.map(d => {
      if (d.id === deltaId) {
        return { ...d, is_resolved: !d.is_resolved };
      }
      return d;
    }));
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case "high": return "border-red-500/30 text-red-400 bg-red-950/40 font-bold";
      case "medium": return "border-orange-500/30 text-orange-400 bg-orange-950/40";
      default: return "border-blue-500/30 text-blue-400 bg-blue-950/40";
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-5xl w-full mx-auto text-slate-100 bg-slate-900">
      {/* Breadcrumbs Header */}
      <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="flex items-center gap-4">
          <Link 
            href={`/${workspaceSlug}/truth`}
            className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="text-xs text-cyan-400 font-mono">Brand Truth Studio</div>
            <h1 className="text-2xl font-extrabold text-white">Truth Deltas Discrepancies</h1>
          </div>
        </div>
      </div>

      {/* Deltas Listing table */}
      <div className="border border-white/5 rounded-2xl overflow-hidden bg-slate-950/20">
        <div className="px-4 py-3 bg-slate-950/40 border-b border-white/5 font-mono text-xs text-slate-400">
          Discrepancy snapshots grid
        </div>
        <div className="divide-y divide-white/5">
          {deltas.map((item) => (
            <div 
              key={item.id} 
              className={`p-6 flex flex-col md:flex-row md:items-start justify-between gap-6 hover:bg-white/[0.01] transition-all relative ${
                item.is_resolved ? "opacity-60" : ""
              }`}
            >
              <div className="space-y-4 max-w-3xl">
                <div className="flex items-center gap-3">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[10px] uppercase font-mono ${getSeverityBadgeColor(item.severity)}`}>
                    {item.severity} Severity
                  </span>
                  <span className="text-xs text-slate-500 font-mono">ID: {item.id}</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 rounded-xl bg-red-950/10 border border-red-900/10 space-y-1">
                    <div className="text-red-400 font-semibold font-mono uppercase text-[9px]">AI Observed Claim</div>
                    <p className="text-slate-300 italic">&ldquo;{item.source_observed_claim}&rdquo;</p>
                  </div>
                  <div className="p-3 rounded-xl bg-cyan-950/10 border border-cyan-900/10 space-y-1">
                    <div className="text-cyan-400 font-semibold font-mono uppercase text-[9px]">Target Brand Claim</div>
                    <p className="text-slate-300 italic">&ldquo;{item.target_operational_claim}&rdquo;</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-white/5 bg-slate-950/30 text-slate-400 text-xs leading-relaxed">
                  <span className="font-bold text-slate-200 block mb-1">Discrepancy Analysis:</span>
                  {item.delta_summary}
                </div>
              </div>

              <div className="flex flex-col items-end gap-3 flex-shrink-0">
                <span className="text-[10px] text-slate-500 font-mono">Scraped: {new Date(item.created_at).toLocaleDateString()}</span>
                
                <button
                  onClick={() => handleResolve(item.id)}
                  className={`px-4 py-2 rounded-xl border text-xs font-bold font-mono transition-all flex items-center gap-1.5 ${
                    item.is_resolved 
                      ? "border-green-500/20 text-green-400 bg-green-950/20" 
                      : "border-yellow-500/20 text-yellow-400 bg-yellow-950/20 hover:border-yellow-400/40"
                  }`}
                >
                  {item.is_resolved ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Resolved
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4" /> Pending Fix
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
