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
  Lock,
  GitPullRequest,
  Check,
  Zap,
  Play
} from "lucide-react";

export default function PatchTicketDetail() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";
  const patchTicketId = (params?.patchTicketId as string) || "pat-1";

  // State
  const [patch, setPatch] = useState({
    id: patchTicketId,
    patch_name: "Clinical Retinol Credential injection",
    patch_hypothesis: "AI Proposed Hypothesis: Binding the certified squalane retinol concentration inside the surface contract will raise AAS by 15%.",
    status: patchTicketId === "pat-2" ? "completed" : "candidate",
    rca_case_id: "rca-1"
  });

  const [changes, setChanges] = useState({
    artifactType: "surface_contract",
    artifactId: "surf-retinol-concentration",
    originalPayload: { credential: null, approved: false },
    modifiedPayload: { credential: "cert-retinol-squalane-99", approved: true }
  });

  const [retestPlan, setRetestPlan] = useState<any | null>(
    patchTicketId === "pat-2" ? { id: "plan-1", panel: "Clinical Retinol Panel (v1)", baseline: "run-base" } : null
  );

  const [retestRun, setRetestRun] = useState<any | null>(
    patchTicketId === "pat-2" ? { id: "run-1", status: "completed", verdict: "pass" } : null
  );

  const [gateVerdict, setGateVerdict] = useState<any | null>(
    patchTicketId === "pat-2" ? { status: "pass", lift: "+15.2% ARS", regression: false } : null
  );

  const [notification, setNotification] = useState<string | null>(null);

  const handleApprovePatch = () => {
    setPatch(prev => ({ ...prev, status: "approved" }));
    setNotification("✅ Patch ticket approved! Ready for retest configuration.");
    setTimeout(() => setNotification(null), 3000);
  };

  const handleConfigureRetest = () => {
    setRetestPlan({
      id: `plan-${Date.now()}`,
      panel: "Clinical Retinol Panel (v1)",
      baseline: "run-base"
    });
    setNotification("⚙️ Retest Plan successfully created: Linked target panel and baseline crawl run.");
    setTimeout(() => setNotification(null), 3000);
  };

  const handleExecuteRetest = () => {
    setNotification("🚀 Starting post-patch retest crawl run...");
    setRetestRun({ id: `run-${Date.now()}`, status: "running" });

    setTimeout(() => {
      setRetestRun({ id: "run-1", status: "completed", verdict: "pass" });
      setNotification("✨ Post-patch observation run complete! Retest scores stored.");
    }, 1500);
  };

  const handleEvaluateGate = () => {
    if (!retestRun || retestRun.status !== "completed") return;
    setNotification("⚖️ Evaluating Patch Pass Gate parameters...");
    setTimeout(() => {
      setGateVerdict({
        status: "pass",
        lift: "+16.8% ARS",
        regression: false
      });
      setPatch(prev => ({ ...prev, status: "completed" }));
      setNotification("🎉 Patch Pass Gate cleared successfully! Statistical lift verified with ZERO regressions.");
    }, 1000);
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-6xl w-full mx-auto text-slate-100 bg-slate-900">
      {/* Back Link */}
      <div>
        <Link
          href={`/${workspaceSlug}/fixit/patches`}
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-500 hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          BACK TO PATCHES DECK
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
              PATCH ID: {patch.id}
            </span>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-white/5 text-slate-400">
              LINKED RCA: {patch.rca_case_id}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 flex items-center gap-3">
            <GitPullRequest className="w-8 h-8 text-indigo-400" />
            {patch.patch_name}
          </h1>
          <p className="text-slate-400 text-sm">
            Configure hypothesized content payloads, audit original layouts, and run retest verifications.
          </p>
        </div>

        {/* Status display */}
        <div className="p-4 rounded-xl border border-white/5 bg-slate-950/40 text-center min-w-[120px]">
          <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">Patch Status</div>
          <div className={`text-lg font-bold uppercase ${
            patch.status === "completed" ? "text-emerald-400" : patch.status === "approved" ? "text-indigo-400" : "text-amber-400"
          }`}>
            {patch.status}
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

      {/* Core components split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns: Hypothesis & Changes preview */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Hypothesis */}
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/30 space-y-4">
            <h3 className="font-bold text-lg text-white">Patch Hypothesis</h3>
            <p className="text-sm text-slate-300 italic font-mono bg-slate-900/40 p-4 rounded-xl leading-relaxed">
              "{patch.patch_hypothesis}"
            </p>

            {patch.status === "candidate" && (
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleApprovePatch}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white transition-all flex items-center gap-1.5 font-mono"
                >
                  <Check className="w-4 h-4" />
                  Approve Patch Hypothesis
                </button>
              </div>
            )}
          </div>

          {/* Artifact payload changes */}
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/30 space-y-6">
            <div>
              <h3 className="font-bold text-base text-white">Artifact Change Payload View</h3>
              <span className="text-[10px] text-slate-500 font-mono uppercase mt-1 block">
                Target: {changes.artifactType} ({changes.artifactId})
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-red-950/5 border border-red-500/10 space-y-2">
                <span className="text-[10px] text-red-400 font-bold uppercase font-mono block">Original Payload (Baseline)</span>
                <pre className="font-mono text-slate-400 text-[11px] overflow-auto max-h-32">
                  {JSON.stringify(changes.originalPayload, null, 2)}
                </pre>
              </div>

              <div className="p-4 rounded-xl bg-emerald-950/5 border border-emerald-500/10 space-y-2">
                <span className="text-[10px] text-emerald-400 font-bold uppercase font-mono block">Modified Payload (Patched)</span>
                <pre className="font-mono text-slate-200 text-[11px] overflow-auto max-h-32">
                  {JSON.stringify(changes.modifiedPayload, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Retest & Pass Gate Control Deck */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Retest controls */}
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/30 space-y-6">
            <h3 className="font-bold text-sm text-slate-300 uppercase tracking-wider font-mono border-b border-white/5 pb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" />
              Retest Verification
            </h3>

            {patch.status === "candidate" ? (
              <p className="text-xs text-slate-500 font-mono italic">
                * Retest scheduling is locked until the patch hypothesis is approved by a strategist.
              </p>
            ) : !retestPlan ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Success requires retesting. Configure a retest plan to link crawls post-patch.
                </p>
                <button
                  onClick={handleConfigureRetest}
                  className="w-full py-2.5 text-center text-xs font-bold font-mono rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-all"
                >
                  Configure Retest Plan
                </button>
              </div>
            ) : !retestRun ? (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-white/5 border border-white/5 text-[11px] space-y-1 font-mono">
                  <span className="text-slate-500 block uppercase">Linked Plan</span>
                  <span className="text-white block">{retestPlan.panel}</span>
                </div>
                <button
                  onClick={handleExecuteRetest}
                  className="w-full py-2.5 text-center text-xs font-bold font-mono rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-all flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Execute Retest Run
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-white/5 border border-white/5 text-[11px] space-y-2 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500 uppercase">Retest Crawler</span>
                    <span className="text-emerald-400 font-bold uppercase">{retestRun.status}</span>
                  </div>
                  {retestRun.status === "completed" && (
                    <div className="flex justify-between">
                      <span className="text-slate-500 uppercase">Crawl Verdict</span>
                      <span className="text-emerald-400 font-bold uppercase">PASS</span>
                    </div>
                  )}
                </div>

                {retestRun.status === "completed" && !gateVerdict && (
                  <button
                    onClick={handleEvaluateGate}
                    className="w-full py-2.5 text-center text-xs font-bold font-mono rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-all flex items-center justify-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Evaluate Pass Gate
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Gate output console */}
          {gateVerdict && (
            <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/30 space-y-4">
              <h3 className="font-bold text-sm text-slate-300 uppercase tracking-wider font-mono border-b border-white/5 pb-3">
                Patch Pass Gate
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between font-mono">
                  <span className="text-slate-500 uppercase">Final Verdict:</span>
                  <span className="text-emerald-400 font-bold uppercase">PASS</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-slate-500 uppercase">ARS Lift Delta:</span>
                  <span className="text-emerald-400 font-bold">{gateVerdict.lift}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-slate-500 uppercase">Regressions:</span>
                  <span className="text-emerald-400 font-bold">NONE FLAGGED</span>
                </div>

                <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-950/10 text-emerald-300 text-[10px] leading-relaxed">
                  The patch satisfies Vibe OS safety indices and is ready to be promoted as a reusable Factory component.
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
