"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { evaluateObjectReadiness, reviewRepresentationObject } from "@/app/actions/objects";
import { 
  ArrowLeft, 
  Layers, 
  Lock, 
  ShieldCheck, 
  FileText, 
  AlertOctagon, 
  Fingerprint, 
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  Settings,
  ShieldAlert
} from "lucide-react";

interface RepresentationObjectDetail {
  id: string;
  object_name: string;
  slug: string;
  object_type: string;
  qis_refs: string[];
  claim_refs: string[];
  raw_properties: Record<string, string>;
  readiness_status: "draft" | "ready" | "failed_safety";
}

export default function ObjectDetailPage() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";
  const objectId = (params?.objectId as string) || "obj-1";
  const mockWorkspaceId = "11111111-1111-1111-1111-111111111111";

  const [obj, setObj] = useState<RepresentationObjectDetail>({
    id: objectId,
    object_name: "Active Niacinamide formula percentage",
    slug: "active-niacinamide-formula-percentage",
    object_type: "ingredient",
    qis_refs: ["qis-1", "qis-2"],
    claim_refs: ["claim-1", "claim-2"],
    raw_properties: { concentration: "5%", purity: "99.8%", ph: "5.5" },
    readiness_status: "draft"
  });

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [blockers, setBlockers] = useState<string[]>([]);
  const [checking, setChecking] = useState(false);

  const triggerVerification = async () => {
    setChecking(true);
    setFeedback(null);
    setBlockers([]);

    try {
      // Trigger the secure server action
      const result = await evaluateObjectReadiness(mockWorkspaceId, objectId);

      setObj(prev => ({ ...prev, readiness_status: result.status as any }));

      if (result.success) {
        setFeedback({ type: "success", message: "CRITICAL PASS: All claim lineages verified successfully!" });
      } else {
        setFeedback({ type: "error", message: "OBJECT BLOCK: Claim lineage safety checks failed." });
        setBlockers(result.blockers);
      }
    } catch (err) {
      setFeedback({ type: "error", message: `Failure: ${(err as Error).message}` });
    } finally {
      setChecking(false);
    }
  };

  const forceStatus = async (status: "draft" | "ready" | "failed_safety") => {
    try {
      await reviewRepresentationObject(mockWorkspaceId, objectId, status);
      setObj(prev => ({ ...prev, readiness_status: status }));
      setFeedback({ type: "success", message: `Readiness status forced to: ${status}` });
    } catch (err) {
      setFeedback({ type: "error", message: `Failure: ${(err as Error).message}` });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready": return "border-green-500/20 text-green-400 bg-green-950/20";
      case "failed_safety": return "border-red-500/20 text-red-400 bg-red-950/20";
      default: return "border-yellow-500/20 text-yellow-400 bg-yellow-950/20";
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-4xl w-full mx-auto text-slate-100 bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="flex items-center gap-4">
          <Link 
            href={`/${workspaceSlug}/objects`}
            className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="text-xs text-cyan-400 font-mono">Presentation Objects Catalog</div>
            <h1 className="text-2xl font-extrabold text-white">{obj.object_name}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`inline-block px-3 py-1 rounded-full border text-xs font-mono font-bold ${getStatusColor(obj.readiness_status)}`}>
            STATUS: {obj.readiness_status.toUpperCase()}
          </span>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-sm ${
          feedback.type === "success" 
            ? "border-green-500/20 text-green-400 bg-green-950/20" 
            : "border-red-500/20 text-red-400 bg-red-950/20"
        }`}>
          {feedback.type === "success" ? <ShieldCheck className="w-5 h-5 text-green-400" /> : <ShieldAlert className="w-5 h-5 text-red-400" />}
          <span className="font-semibold">{feedback.message}</span>
        </div>
      )}

      {/* Blockers alert list */}
      {blockers.length > 0 && (
        <div className="p-5 rounded-2xl border border-red-500/20 bg-red-950/10 space-y-3">
          <h4 className="text-xs font-bold font-mono text-red-400 flex items-center gap-1.5 uppercase">
            <AlertOctagon className="w-4 h-4" />
            Safety Lineage Failure Logs:
          </h4>
          <ul className="space-y-1.5 pl-5 list-disc text-xs text-slate-300">
            {blockers.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Specifications panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Properties */}
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 space-y-4">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <Settings className="w-4 h-4 text-cyan-400" />
              Object Properties Mappings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(obj.raw_properties).map(([key, val]) => (
                <div key={key} className="p-3 rounded-lg border border-white/5 bg-slate-900/40 text-xs">
                  <span className="block font-mono text-[9px] text-slate-500 uppercase mb-0.5">{key}</span>
                  <span className="font-bold text-slate-200">{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Trace reference loops */}
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 space-y-4">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-400" />
              Upstream Trace Mappings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono text-slate-400">
              <div className="p-3 rounded-lg border border-white/5 bg-slate-950/40 space-y-1.5">
                <span className="block font-bold text-slate-200">QIS Scenes References</span>
                {obj.qis_refs.map(r => (
                  <span key={r} className="block text-[10px] bg-slate-900 px-2 py-0.5 rounded border border-white/5">{r}</span>
                ))}
              </div>
              <div className="p-3 rounded-lg border border-white/5 bg-slate-950/40 space-y-1.5">
                <span className="block font-bold text-slate-200">Claim Nodes References</span>
                {obj.claim_refs.map(r => (
                  <span key={r} className="block text-[10px] bg-slate-900 px-2 py-0.5 rounded border border-white/5">{r}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Validation Gate actions panel */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/40 space-y-4">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <Lock className="w-5 h-5 text-cyan-400" />
              Object Readiness Gate
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Before a presentation object can be added to any surface contract, it must satisfy clinical safety gates. This traces every associated claim to a verified evidence signature.
            </p>

            <button
              onClick={triggerVerification}
              disabled={checking}
              className="w-full py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              {checking ? "Verifying..." : "Verify Object Readiness"}
            </button>
          </div>

          {/* Admin Override */}
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 space-y-4">
            <h3 className="font-bold text-sm text-slate-300 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-yellow-400" />
              Manual Review Override
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => forceStatus("ready")}
                className="px-2 py-1.5 rounded-lg border border-green-500/20 text-green-400 hover:bg-green-950/20 bg-slate-900 text-center font-bold"
              >
                Approve Specs
              </button>
              <button
                onClick={() => forceStatus("failed_safety")}
                className="px-2 py-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-950/20 bg-slate-900 text-center font-bold"
              >
                Flag Safety
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
