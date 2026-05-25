"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  ArrowLeft,
  GitPullRequest,
  Plus,
  CheckCircle,
  HelpCircle,
  FileText,
  Clock,
  ExternalLink
} from "lucide-react";

export default function PatchesList() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";

  // Mock initial patches list
  const [patches, setPatches] = useState([
    {
      id: "pat-1",
      rca_case_id: "rca-1",
      patch_name: "Clinical Retinol Credential injection",
      patch_hypothesis: "AI Proposed Hypothesis: Binding the certified squalane retinol concentration inside the surface contract will raise AAS by 15%.",
      status: "candidate",
      created_at: "2026-05-23T19:05:00Z"
    },
    {
      id: "pat-2",
      rca_case_id: "rca-2",
      patch_name: "In Vivo Efficacy certification linking",
      patch_hypothesis: "Hypothesis: Linking the third-party retinol certificate directly restores search assistant trust citations.",
      status: "completed",
      created_at: "2026-05-23T18:30:00Z"
    }
  ]);

  const [notification, setNotification] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newHypothesis, setNewHypothesis] = useState("");

  const handleCreatePatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (newHypothesis.length < 10) {
      alert("Patch hypothesis must be at least 10 characters long.");
      return;
    }

    const newPatch = {
      id: `pat-${Date.now()}`,
      rca_case_id: "rca-1",
      patch_name: newName,
      patch_hypothesis: `Hypothesis: ${newHypothesis}`,
      status: "candidate", // candidate by default!
      created_at: new Date().toISOString()
    };

    setPatches(prev => [newPatch, ...prev]);
    setNewName("");
    setNewHypothesis("");
    setNotification("✨ Success: Patch Ticket created as 'Candidate'. Requires review.");
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
            Governed Code & Copy Patches
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 flex items-center gap-3">
            <GitPullRequest className="w-8 h-8 text-indigo-400" />
            Patch Tickets Deck
          </h1>
          <p className="text-slate-400 text-sm">
            Track and deploy hypothesized content patches. Every patch represents a structured hypothesis, not a final truth, and requires retesting.
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

      {/* Split grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Patches List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-lg text-white">Active Operational Patches</h3>
          
          <div className="space-y-4">
            {patches.map(pat => (
              <div key={pat.id} className="p-6 rounded-2xl border border-white/5 bg-slate-950/30 space-y-4">
                
                {/* Meta header info */}
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[9px] font-mono rounded bg-white/5 text-slate-400">
                      ID: {pat.id}
                    </span>
                    <span className="px-2 py-0.5 text-[9px] font-mono rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/25">
                      LINKED RCA: {pat.rca_case_id}
                    </span>
                  </div>
                  
                  <span className={`px-2 py-0.5 text-[8px] font-mono font-bold rounded uppercase ${
                    pat.status === "candidate"
                      ? "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                      : pat.status === "completed"
                      ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                      : "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400"
                  }`}>
                    {pat.status}
                  </span>
                </div>

                {/* Body details */}
                <div>
                  <h4 className="font-bold text-sm text-white mb-1">{pat.patch_name}</h4>
                  <p className="text-slate-300 text-xs leading-relaxed italic">
                    "{pat.patch_hypothesis}"
                  </p>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-[9px] text-slate-500 font-mono flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Proposed: {new Date(pat.created_at).toLocaleString()}
                  </span>
                  
                  <Link
                    href={`/${workspaceSlug}/fixit/patches/${pat.id}`}
                    className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    Manage Patch <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>

              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Proposals Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/30 space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Plus className="w-4.5 h-4.5 text-indigo-400" />
              Propose Patch Ticket
            </h3>

            <form onSubmit={handleCreatePatch} className="space-y-4 text-xs">
              
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-mono uppercase">Patch Ticket Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Squalane official URL correction"
                  className="w-full p-2.5 rounded-lg border border-white/10 bg-slate-900 text-slate-200 outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-mono uppercase">Patch Hypothesis (Required)</label>
                <textarea
                  required
                  value={newHypothesis}
                  onChange={(e) => setNewHypothesis(e.target.value)}
                  placeholder="Propose structured patch hypothesis (minimum 10 characters)..."
                  className="w-full h-32 p-2.5 rounded-lg border border-white/10 bg-slate-900 text-slate-200 outline-none focus:border-indigo-500 resize-none font-sans"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 font-bold rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-all font-mono"
              >
                Propose Patch
              </button>

            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
