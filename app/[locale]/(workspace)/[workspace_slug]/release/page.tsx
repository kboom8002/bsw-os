"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  ArrowLeft,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  FileText,
  Activity,
  Layers,
  Cpu,
  Lock,
  Compass,
  ArrowRight,
  Bookmark
} from "lucide-react";

export default function ReleaseDashboard() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";

  // Mock release gate statuses
  const [gates, setGates] = useState({
    code: { passed: true, name: "Code Release Gate", desc: "Verifies TypeScript compilation and Vitest green runs." },
    demo: { passed: true, name: "Demo Release Gate", desc: "Confirms K-Beauty, Convenience, and Wedding domains seeded." },
    security: { passed: true, name: "Security Release Gate", desc: "Confirms private service role key wrappers and RLS controls." },
    acceptance: { passed: true, name: "Final Acceptance Gate", desc: "Inspects checklists, final gap reports, and go decisions." }
  });

  const [verdict, setVerdict] = useState<"go" | "go_with_waivers" | "no_go">("go");
  const [notification, setNotification] = useState<string | null>(null);

  const handleSimulateWaiver = () => {
    setVerdict("go_with_waivers");
    setNotification("⚠️ Release status updated: GO_WITH_WAIVERS active (Waivers recorded for local GS25/CU API integration).");
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSimulateGo = () => {
    setVerdict("go");
    setNotification("✨ Release status updated: GO active (All gates fully cleared).");
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-6xl w-full mx-auto text-slate-100 bg-slate-900">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="text-xs text-indigo-400 font-mono font-bold tracking-wider uppercase mb-1">
            BSW-OS Quality Release
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-indigo-400" />
            Hardening & Release Gates
          </h1>
          <p className="text-slate-400 text-sm">
            Auditing multi-tenant security hardening parameters, RLS protections, E2E demo configs, and compiling go decisions.
          </p>
        </div>

        {/* Simulator controls */}
        <div className="flex gap-2">
          <button
            onClick={handleSimulateWaiver}
            className="px-3.5 py-1.5 text-xs font-bold rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-mono transition-all"
          >
            Go With Waivers
          </button>
          <button
            onClick={handleSimulateGo}
            className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-mono transition-all"
          >
            Clear Go Status
          </button>
        </div>
      </div>

      {/* Notifications Banner */}
      {notification && (
        <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-950/20 text-indigo-300 text-xs font-mono flex items-start gap-3 backdrop-blur-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{notification}</span>
        </div>
      )}

      {/* Gates list and Go decision grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Gates list */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-lg text-white">Audited Release Gates</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.keys(gates).map(key => {
              const item = (gates as any)[key];
              return (
                <div key={key} className="p-5 rounded-2xl border border-white/5 bg-slate-950/30 space-y-3 relative overflow-hidden">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="font-bold text-white text-sm">{item.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase`}>
                      PASSED
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-normal">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Go/No-Go Decision board */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/30 space-y-6">
            <h3 className="font-bold text-sm text-slate-300 uppercase tracking-wider font-mono border-b border-white/5 pb-3">
              Go / No-Go Decision
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 font-mono uppercase block mb-1">Final Release Verdict</span>
                <div className={`text-2xl font-black uppercase flex items-center gap-1.5 ${
                  verdict === "go" 
                    ? "text-emerald-400" 
                    : verdict === "go_with_waivers" 
                    ? "text-amber-400" 
                    : "text-red-400"
                }`}>
                  {verdict === "go" ? (
                    <>
                      <CheckCircle className="w-6 h-6 text-emerald-400" />
                      GO (RELEASE)
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-6 h-6 text-amber-400" />
                      GO WITH WAIVERS
                    </>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-white/5 text-[10px] text-slate-400 font-mono leading-relaxed space-y-2">
                <span className="text-slate-300 font-bold block">VERDICT RATIONALE:</span>
                <p>
                  Unit tests and Next production compiles are 100% green. Trace loop seeds are complete across all three domains. RLS tenant boundaries are secure with zero service role leaks in client routes. Certified for immediate launch candidate publishing.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* final documents registry card list */}
      <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/30 space-y-6">
        <h3 className="font-bold text-base text-white border-b border-white/5 pb-4 flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-indigo-400" />
          Handoff & Compliance Documents Vault
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          
          <div className="p-4 rounded-xl border border-white/5 bg-slate-900/40 space-y-2">
            <span className="font-bold text-white block">Final Gap Report</span>
            <p className="text-[11px] text-slate-400 leading-normal">
              An honest, granular evaluation of deferred items and severity ratings.
            </p>
            <Link
              href="file:///c:/Users/User/bsw/docs/final_gap_report.md"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-mono font-bold flex items-center gap-1 mt-2"
            >
              Open MD <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-4 rounded-xl border border-white/5 bg-slate-900/40 space-y-2">
            <span className="font-bold text-white block">Release Checklist</span>
            <p className="text-[11px] text-slate-400 leading-normal">
              Programmatic checklist confirming RLS, mock provider, and E2E parameters.
            </p>
            <Link
              href="file:///c:/Users/User/bsw/docs/release_candidate_checklist.md"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-mono font-bold flex items-center gap-1 mt-2"
            >
              Open MD <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-4 rounded-xl border border-white/5 bg-slate-900/40 space-y-2">
            <span className="font-bold text-white block">Repo Handoff Summary</span>
            <p className="text-[11px] text-slate-400 leading-normal">
              Codebase architectural map linking directories, migrations, and components.
            </p>
            <Link
              href="file:///c:/Users/User/bsw/docs/repo_handoff_summary.md"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-mono font-bold flex items-center gap-1 mt-2"
            >
              Open MD <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-4 rounded-xl border border-white/5 bg-slate-900/40 space-y-2">
            <span className="font-bold text-white block">Go / No-Go Decision</span>
            <p className="text-[11px] text-slate-400 leading-normal">
              Definitive launch rationale, waivers catalog, and immediate next actions.
            </p>
            <Link
              href="file:///c:/Users/User/bsw/docs/go_no_go_decision.md"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-mono font-bold flex items-center gap-1 mt-2"
            >
              Open MD <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>
      </div>

    </div>
  );
}
