"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  ArrowLeft,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  CheckCircle,
  FileText,
  Activity,
  History,
  GitPullRequest,
  Check,
  X
} from "lucide-react";

export default function PersonaSpecDetailView() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";
  const personaSpecId = (params?.personaSpecId as string) || "11111111-1111-4111-a111-111111111111";

  // Mock details for the active persona spec
  const spec = {
    id: personaSpecId,
    persona_name: "Clinical Wellness Advocate",
    slug: "clinical-wellness-advocate",
    version: 4,
    current_mode: "standard",
    allowed_modes: ["standard", "advisory", "crisis"],
    authority_scope: ["clinical", "warm", "scientific"],
    legal_guardrails: [
      "Include FDA clinical trial disclaimer",
      "Block treatment prescription statements",
      "Reject claims lacking double-blind backing references"
    ],
    pmri: 25,
    prompt_text: "You are an authoritative clinical research agent communicating with scientific empathy..."
  };

  // Mock patches queue
  const [patches, setPatches] = useState([
    {
      id: "patch-1",
      proposed_patch_text: "Add support for Advisory mode to standard domain scripts, allowing conversational skin diagnostics.",
      status: "candidate",
      created_at: "2026-05-23T11:00:00Z"
    },
    {
      id: "patch-2",
      proposed_patch_text: "Inject luxury aesthetic descriptions to active ingredients pages, focusing on pristine purity.",
      status: "approved",
      created_at: "2026-05-22T09:30:00Z"
    }
  ]);

  // Mock overreach audit logs
  const logs = [
    {
      id: "log-1",
      timestamp: "2026-05-23T18:40:22Z",
      claim: "Our serum permanently guarantees healing of severe psoriasis in 24 hours.",
      overreach: true,
      reason: "Claim asserts 'guarantee' & 'psoriasis' domain which requires 'legal' & 'medical' authority, but persona only holds [clinical, warm, scientific]"
    },
    {
      id: "log-2",
      timestamp: "2026-05-23T17:15:10Z",
      claim: "Clinical trials indicate a 32% reduction in skin dehydration over 14 days.",
      overreach: false,
      reason: "Safe. Verified against clinical evidence ID 9e4f55."
    }
  ];

  const handlePatchStatus = (patchId: string, newStatus: "approved" | "rejected") => {
    setPatches(prev => prev.map(p => {
      if (p.id === patchId) {
        return { ...p, status: newStatus };
      }
      return p;
    }));
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-6xl w-full mx-auto text-slate-100 bg-slate-900">
      {/* Back to Dashboard */}
      <div>
        <Link
          href={`/${workspaceSlug}/persona/specs`}
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-500 hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          BACK TO PERSONA DASHBOARD
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
              ID: {spec.id.substring(0, 8)}...
            </span>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-white/5 border border-white/5 text-slate-400">
              Version v{spec.version}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-indigo-400" />
            {spec.persona_name}
          </h1>
          <p className="text-slate-400 text-sm">
            Auditing legal parameters, active proposed patches, and real-time authority overreach logs.
          </p>
        </div>

        {/* P-MRI score */}
        <div className="p-4 rounded-xl border border-white/5 bg-slate-950/40 text-center min-w-[120px]">
          <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">P-MRI Risk Index</div>
          <div className={`text-4xl font-black ${
            spec.pmri > 60 
              ? "text-red-400" 
              : spec.pmri > 30 
              ? "text-amber-400" 
              : "text-emerald-400"
          }`}>
            {spec.pmri}%
          </div>
          <div className="text-[8px] text-slate-400 font-mono mt-1">GATES APPROVED</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Spec Configuration Details */}
        <div className="lg:col-span-1 space-y-6">
          {/* Authority Bounds */}
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/30 space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <ShieldCheck className="w-4.5 h-4.5 text-indigo-400" />
              Allowed Authority Scopes
            </h3>
            <div className="flex flex-wrap gap-2">
              {spec.authority_scope.map(scope => (
                <span key={scope} className="px-2.5 py-1 text-xs font-mono rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                  {scope}
                </span>
              ))}
            </div>
          </div>

          {/* Legal Guardrails */}
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/30 space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <FileText className="w-4.5 h-4.5 text-indigo-400" />
              Governed Legal Guardrails
            </h3>
            <ul className="text-slate-400 text-xs space-y-3 list-disc pl-4 leading-relaxed">
              {spec.legal_guardrails.map((g, idx) => (
                <li key={idx} className="marker:text-indigo-400">{g}</li>
              ))}
            </ul>
          </div>

          {/* P-MRI Risk Metrics breakdown */}
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/30 space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Activity className="w-4.5 h-4.5 text-indigo-400" />
              P-MRI Risk Analysis
            </h3>
            <div className="space-y-3 text-xs font-mono">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-slate-500">Mode Multiplier</span>
                <span className="text-white">+{spec.current_mode === "crisis" ? 30 : 0}%</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-slate-500">Guardrails Missing</span>
                <span className="text-white">+0%</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-slate-500">Candidate Patches</span>
                <span className="text-white">+{patches.filter(p => p.status === "candidate").length * 15}%</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-400 font-bold">Total P-MRI Index</span>
                <span className="text-indigo-400 font-bold">{spec.pmri}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Patches & Real-time Logs */}
        <div className="lg:col-span-2 space-y-8">
          {/* Proposed Patches Queue */}
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 space-y-6">
            <h3 className="font-bold text-lg text-white flex items-center gap-2">
              <GitPullRequest className="w-5 h-5 text-indigo-400" />
              Proposed Spec Adjustment Patches
            </h3>
            <div className="space-y-4">
              {patches.map(patch => (
                <div key={patch.id} className="p-4 rounded-xl border border-white/5 bg-slate-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 max-w-[80%]">
                    <p className="text-xs text-slate-300 font-sans leading-relaxed">
                      {patch.proposed_patch_text}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono">
                      <span>Logged: {new Date(patch.created_at).toLocaleString()}</span>
                      <span className={`px-2 py-0.5 rounded uppercase font-bold text-[8px] ${
                        patch.status === "candidate" 
                          ? "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                          : patch.status === "approved"
                          ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                          : "bg-red-500/10 border border-red-500/20 text-red-400"
                      }`}>
                        {patch.status}
                      </span>
                    </div>
                  </div>
                  {patch.status === "candidate" && (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handlePatchStatus(patch.id, "approved")}
                        className="p-1.5 rounded-lg border border-emerald-500/20 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-900/20 transition-all"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handlePatchStatus(patch.id, "rejected")}
                        className="p-1.5 rounded-lg border border-red-500/20 bg-red-950/20 text-red-400 hover:bg-red-900/20 transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Real-time Overreach Audits */}
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 space-y-6">
            <h3 className="font-bold text-lg text-white flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-400" />
              Active Authority Overreach Audit Logs
            </h3>
            <div className="space-y-4">
              {logs.map(log => (
                <div key={log.id} className="p-4 rounded-xl border border-white/5 bg-slate-900/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-mono">{log.timestamp}</span>
                    <span className={`px-2 py-0.5 rounded uppercase font-bold text-[8px] flex items-center gap-1 ${
                      log.overreach 
                        ? "bg-red-500/10 border border-red-500/20 text-red-400"
                        : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                    }`}>
                      {log.overreach ? (
                        <>
                          <ShieldAlert className="w-3 h-3" />
                          Overreach Blocked
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3 h-3" />
                          Passed
                        </>
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono block mb-1">Generated Output Claim:</span>
                    <p className="text-xs text-slate-200 font-sans italic border-l-2 border-white/10 pl-3 leading-relaxed">
                      "{log.claim}"
                    </p>
                  </div>
                  <div className="p-2.5 rounded bg-white/5 font-mono text-[10px] text-slate-400 leading-normal">
                    {log.reason}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
