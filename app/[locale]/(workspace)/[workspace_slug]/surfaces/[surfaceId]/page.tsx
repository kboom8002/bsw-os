"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { validateSurfaceContract } from "@/app/actions/objects";
import { 
  ArrowLeft, 
  Workflow, 
  Lock, 
  ShieldCheck, 
  ShieldAlert, 
  AlertOctagon, 
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  Cpu,
  Layers
} from "lucide-react";

interface SurfaceContractDetail {
  id: string;
  contract_name: string;
  slug: string;
  allowed_objects: string[];
  required_blocks: string[];
  is_valid: boolean;
}

export default function SurfaceDetailPage() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";
  const surfaceId = (params?.surfaceId as string) || "con-1";
  const mockWorkspaceId = "11111111-1111-1111-1111-111111111111";

  const [contract, setContract] = useState<SurfaceContractDetail>({
    id: surfaceId,
    contract_name: "Premium Skincare Details Surface",
    slug: "premium-skincare-details-surface",
    allowed_objects: ["obj-1"],
    required_blocks: ["clinical_evidence"], // Simulating missing safety boundary for verification demo
    is_valid: false
  });

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [blockers, setBlockers] = useState<string[]>([]);
  const [checking, setChecking] = useState(false);

  const triggerVerification = async () => {
    setChecking(true);
    setFeedback(null);
    setBlockers([]);

    try {
      // Trigger the secure validation server action
      const result = await validateSurfaceContract(mockWorkspaceId, surfaceId);

      setContract(prev => ({ ...prev, is_valid: result.success }));

      if (result.success) {
        setFeedback({ type: "success", message: "CRITICAL PASS: Surface layout validates safety constraints successfully!" });
      } else {
        setFeedback({ type: "error", message: "SURFACE BLOCK: Safety required sections checks failed." });
        setBlockers(result.blockers);
      }
    } catch (err) {
      setFeedback({ type: "error", message: `Failure: ${(err as Error).message}` });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-4xl w-full mx-auto text-slate-100 bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="flex items-center gap-4">
          <Link 
            href={`/${workspaceSlug}/surfaces`}
            className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="text-xs text-cyan-400 font-mono">Surface Contracts Builder</div>
            <h1 className="text-2xl font-extrabold text-white">{contract.contract_name}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-mono font-bold ${
            contract.is_valid 
              ? "border-green-500/20 text-green-400 bg-green-950/20" 
              : "border-red-500/20 text-red-400 bg-red-950/20"
          }`}>
            {contract.is_valid ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
            {contract.is_valid ? "VALIDATED" : "UNVALIDATED"}
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
            Surface Validation Blocker Mapped:
          </h4>
          <ul className="space-y-1.5 pl-5 list-disc text-xs text-slate-300">
            {blockers.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Allowed Objects */}
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 space-y-4">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Allowed Spec Objects In Contract
            </h3>
            <div className="space-y-3">
              {contract.allowed_objects.map(objId => (
                <div key={objId} className="p-3 rounded-lg border border-white/5 bg-slate-900/40 text-xs flex justify-between items-center">
                  <span className="font-bold text-slate-200">Active Niacinamide formula percentage</span>
                  <span className="text-[10px] text-slate-500 font-mono">{objId}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Required blocks checklist */}
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 space-y-4">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <Workflow className="w-4 h-4 text-purple-400" />
              Required visual block specs
            </h3>
            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center p-3 rounded-lg bg-slate-950/40 border border-white/5">
                <span className="text-slate-300">clinical_evidence Block</span>
                <span className="text-green-400 text-[10px] font-bold">ACTIVE</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-slate-950/40 border border-white/5">
                <span className="text-slate-300">safety_boundary Block</span>
                <span className={`text-[10px] font-bold ${
                  contract.required_blocks.includes("safety_boundary") ? "text-green-400" : "text-slate-500"
                }`}>
                  {contract.required_blocks.includes("safety_boundary") ? "ACTIVE" : "INACTIVE / DEFERRED"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Validation Gate actions panel */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/40 space-y-4">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <Lock className="w-5 h-5 text-cyan-400" />
              Surface Validation Gate
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Before visual web layouts can compile, the contract must prove safe layout structures. High-risk spec elements require a mandatory **Safety Boundary disclosure** visual block.
            </p>

            <button
              onClick={triggerVerification}
              disabled={checking}
              className="w-full py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <Cpu className="w-4 h-4" />
              {checking ? "Auditing..." : "Audit Surface Safety"}
            </button>
          </div>

          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 space-y-4">
            <h3 className="font-bold text-sm text-slate-300 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              Visual Safety Audits
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Contracts map visual segments. By ensuring high-risk objects are followed by strict disclosures, BSW-OS guarantees legally-compliant projections E2E.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
