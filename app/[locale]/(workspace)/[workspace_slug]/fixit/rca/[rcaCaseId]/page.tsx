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
  Save,
  MessageSquare,
  Activity,
  Cpu,
  Check,
  X
} from "lucide-react";

export default function RcaCaseDetail() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";
  const rcaCaseId = (params?.rcaCaseId as string) || "rca-1";

  // State
  const [rca, setRca] = useState({
    id: rcaCaseId,
    metric_name: "ARS",
    metric_value: 50.00,
    cause_hypothesis: "AI Proposed Hypothesis: Crawl values dropped due to unlinked squalane ingredients and missing official citation links.",
    status: rcaCaseId === "rca-2" ? "approved" : "candidate",
    justification_notes: rcaCaseId === "rca-2" ? "Agreed: The squalane surface was unlinked during B4 migration." : ""
  });

  const [patches, setPatches] = useState<any[]>([]);
  const [justificationInput, setJustificationInput] = useState("");
  const [notification, setNotification] = useState<string | null>(null);

  const handleApproveCase = () => {
    if (!justificationInput.trim()) {
      alert("Please provide strategist justification notes.");
      return;
    }
    setRca(prev => ({
      ...prev,
      status: "approved",
      justification_notes: justificationInput
    }));
    setJustificationInput("");
    setNotification("✅ RCA Case hypothesis approved by strategist!");
    setTimeout(() => setNotification(null), 3000);
  };

  const handleRejectCase = () => {
    if (!justificationInput.trim()) {
      alert("Please provide strategist justification notes.");
      return;
    }
    setRca(prev => ({
      ...prev,
      status: "rejected",
      justification_notes: justificationInput
    }));
    setJustificationInput("");
    setNotification("❌ RCA Case hypothesis marked as rejected.");
    setTimeout(() => setNotification(null), 3000);
  };

  const handleTriggerPatchAgent = () => {
    setNotification("🤖 Proposing Patch Ticket suggestion from RCA context...");
    setTimeout(() => {
      const newPatch = {
        id: `pat-${Date.now()}`,
        patch_name: "Retinol citation credential mapping",
        patch_hypothesis: "AI Proposes: Mapping the validated in vivo retinol credential inside the surface contract will restore ARS by 15%.",
        status: "candidate"
      };
      setPatches(prev => [...prev, newPatch]);
      setNotification("✨ AI Suggested Patch: Appended 'Retinol citation credential mapping' as candidate patch ticket.");
    }, 1200);
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-6xl w-full mx-auto text-slate-100 bg-slate-900">
      {/* Back Link */}
      <div>
        <Link
          href={`/${workspaceSlug}/fixit/rca`}
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-500 hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          BACK TO RCA LIST
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
              RCA ID: {rca.id}
            </span>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-red-500/10 text-red-400">
              Weakness: {rca.metric_name} ({rca.metric_value}%)
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 flex items-center gap-3">
            <FileText className="w-8 h-8 text-indigo-400" />
            Root Cause Hypothesis Case
          </h1>
          <p className="text-slate-400 text-sm">
            Hypothesize metric degradations and map remediation actions.
          </p>
        </div>

        {/* Status indicator */}
        <div className="p-4 rounded-xl border border-white/5 bg-slate-950/40 text-center min-w-[120px]">
          <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">Status Verdict</div>
          <div className={`text-lg font-bold uppercase ${
            rca.status === "approved" ? "text-emerald-400" : rca.status === "rejected" ? "text-red-400" : "text-amber-400"
          }`}>
            {rca.status}
          </div>
        </div>
      </div>

      {/* Notifications Banner */}
      {notification && (
        <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-950/20 text-indigo-300 text-xs font-mono flex items-start gap-3 backdrop-blur-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{notification}</span>
        </div>
      )}

      {/* Details structure */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns: Cause analysis */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/30 space-y-6">
            <h3 className="font-bold text-lg text-white">Cause Hypothesis Overview</h3>
            
            <p className="text-sm text-slate-300 italic font-mono bg-slate-900/40 p-4 rounded-xl leading-relaxed">
              "{rca.cause_hypothesis}"
            </p>

            {rca.justification_notes && (
              <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-950/5 space-y-2">
                <span className="text-[10px] text-indigo-400 font-bold uppercase font-mono">Strategist Justification Signoff</span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {rca.justification_notes}
                </p>
              </div>
            )}

            {/* Strategist Approval inputs */}
            {rca.status === "candidate" && (
              <div className="space-y-4 pt-4 border-t border-white/5 text-xs">
                <label className="text-[10px] text-slate-500 font-mono uppercase">Strategist Action Justification Notes</label>
                <textarea
                  required
                  value={justificationInput}
                  onChange={(e) => setJustificationInput(e.target.value)}
                  placeholder="Record justification notes to approve/reject this cause hypothesis..."
                  className="w-full h-24 p-3.5 rounded-xl border border-white/5 bg-slate-900 text-slate-300 outline-none focus:border-indigo-500 resize-none font-sans"
                />

                <div className="flex gap-2">
                  <button
                    onClick={handleRejectCase}
                    className="flex-1 py-2 text-xs font-bold rounded-lg border border-red-500/30 hover:bg-red-500/10 text-red-400 transition-all font-mono"
                  >
                    Reject Cause Hypothesis
                  </button>
                  <button
                    onClick={handleApproveCase}
                    className="flex-1 py-2 text-xs font-bold rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-all font-mono"
                  >
                    Approve Hypothesis
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* AI Patch generation list */}
          {rca.status === "approved" && (
            <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/30 space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h3 className="font-bold text-base text-white">Suggested Remedies (AI Patches)</h3>
                <button
                  onClick={handleTriggerPatchAgent}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all flex items-center gap-1.5 font-mono"
                >
                  <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                  Trigger Patch Agent
                </button>
              </div>

              {patches.length === 0 ? (
                <p className="text-xs text-slate-500 font-mono italic">
                  No patch suggestion has been run for this Root Cause Case yet. Trigger the AI agent to formulate one.
                </p>
              ) : (
                <div className="space-y-4">
                  {patches.map(p => (
                    <div key={p.id} className="p-4 rounded-xl border border-white/5 bg-slate-900/40 text-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="font-bold text-white block">{p.patch_name}</span>
                        <span className="px-2 py-0.5 font-mono text-[8px] uppercase rounded bg-amber-500/10 border border-amber-500/20 text-amber-400">
                          {p.status}
                        </span>
                      </div>
                      <p className="text-slate-400 leading-relaxed italic">"{p.patch_hypothesis}"</p>
                      <div className="flex justify-end pt-1">
                        <Link
                          href={`/${workspaceSlug}/fixit/patches`}
                          className="px-3 py-1.5 rounded bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-bold font-mono"
                        >
                          Go to Patches Deck
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Reference card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/30 space-y-4">
            <h3 className="font-bold text-sm text-white">Traceability Anchors</h3>
            <p className="text-xs text-slate-400">
              This cause hypothesis traces back to:
            </p>

            <div className="space-y-3 pt-2 text-xs">
              <div className="p-3 rounded-lg bg-white/5 border border-white/5 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-mono block">Originating Snapshot</span>
                <span className="font-bold text-white font-mono">snap-aeo-retinol-v1</span>
              </div>

              <div className="p-3 rounded-lg bg-white/5 border border-white/5 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-mono block">Crawl Metric</span>
                <span className="font-bold text-red-400 font-mono">{rca.metric_name} ({rca.metric_value}%)</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
