"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  ArrowLeft,
  Layers,
  CheckCircle,
  AlertTriangle,
  Zap,
  Sparkles,
  ArrowRight,
  Clock,
  Check
} from "lucide-react";

export default function FactoryCandidates() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";

  // Mock candidates
  const [candidates, setCandidates] = useState([
    {
      id: "fac-1",
      candidate_name: "Retinol Concentration Surface Credentials",
      artifact_type: "surface_contract",
      lift_verdict: "pass",
      status: "candidate",
      promoted_at: null,
      created_at: "2026-05-23T19:15:00Z"
    },
    {
      id: "fac-2",
      candidate_name: "Squalane official URL metadata page config",
      artifact_type: "representation_object",
      lift_verdict: "pass",
      status: "promoted",
      promoted_at: "2026-05-23T19:22:00Z",
      created_at: "2026-05-23T19:00:00Z"
    }
  ]);

  const [notification, setNotification] = useState<string | null>(null);

  const handlePromoteCandidate = (id: string) => {
    setCandidates(prev => prev.map(c => {
      if (c.id === id) {
        return { ...c, status: "promoted", promoted_at: new Date().toISOString() };
      }
      return c;
    }));
    setNotification("🚀 Success: Verified component promoted to workspace factory registry!");
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-6xl w-full mx-auto text-slate-100 bg-slate-900">
      {/* Back Link */}
      <div>
        <Link
          href={`/${workspaceSlug}/fixit`}
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-500 hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          BACK TO FIX-IT CENTRAL
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="text-xs text-indigo-400 font-mono font-bold tracking-wider uppercase mb-1">
            Governed Reusable catalog
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 flex items-center gap-3">
            <Layers className="w-8 h-8 text-indigo-400" />
            Factory Reuse Registry
          </h1>
          <p className="text-slate-400 text-sm">
            Promote verified, high-performing content patches to reuse registries. Requires verified positive lift, no critical regression, and strategist approvals.
          </p>
        </div>
      </div>

      {/* Notifications Banner */}
      {notification && (
        <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-950/20 text-indigo-300 text-xs font-mono flex items-start gap-3 backdrop-blur-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{notification}</span>
        </div>
      )}

      {/* Catalog items list */}
      <div className="space-y-6">
        <h3 className="font-bold text-lg text-white">Reuse Candidates</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {candidates.map(cand => (
            <div key={cand.id} className="p-6 rounded-2xl border border-white/5 bg-slate-950/30 space-y-4">
              
              {/* Meta details */}
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <span className="px-2 py-0.5 text-[8px] font-mono rounded bg-white/5 text-slate-400 uppercase">
                  TYPE: {cand.artifact_type}
                </span>
                
                <span className={`px-2 py-0.5 text-[8px] font-mono font-bold rounded uppercase ${
                  cand.status === "promoted"
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                    : "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                }`}>
                  {cand.status}
                </span>
              </div>

              {/* Body */}
              <div>
                <h4 className="font-bold text-sm text-white mb-1">{cand.candidate_name}</h4>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-[10px] text-slate-400">Lift Validation:</span>
                  <span className="text-emerald-400 text-xs font-bold font-mono uppercase">Verified PASS</span>
                </div>
              </div>

              {/* Time logs & promotion control */}
              <div className="flex justify-between items-center pt-3 border-t border-white/5">
                <div className="text-[9px] text-slate-500 font-mono space-y-0.5">
                  <div>Logged: {new Date(cand.created_at).toLocaleString()}</div>
                  {cand.promoted_at && <div>Promoted: {new Date(cand.promoted_at).toLocaleString()}</div>}
                </div>

                {cand.status === "candidate" ? (
                  <button
                    onClick={() => handlePromoteCandidate(cand.id)}
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-bold font-mono flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    Promote Registry
                  </button>
                ) : (
                  <div className="text-[10px] text-emerald-400 font-bold font-mono flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    REGISTERED
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
