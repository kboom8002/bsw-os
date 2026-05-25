"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  ArrowLeft,
  ShieldAlert,
  Plus,
  CheckCircle,
  HelpCircle,
  FileText,
  Clock,
  ExternalLink
} from "lucide-react";

export default function RcaCasesList() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";

  // Mock initial RCA list
  const [rcas, setRcas] = useState([
    {
      id: "rca-1",
      metric_name: "ARS",
      metric_value: 50.00,
      cause_hypothesis: "AI Proposed Hypothesis: Crawl values dropped due to unlinked squalane ingredients and missing official citation links.",
      status: "candidate",
      created_at: "2026-05-23T19:00:00Z"
    },
    {
      id: "rca-2",
      metric_name: "OCR",
      metric_value: 30.00,
      cause_hypothesis: "Hypothesis: Lack of validated scientific evidence blocks official crawler links from showing inside AI citations.",
      status: "approved",
      created_at: "2026-05-23T18:15:00Z"
    }
  ]);

  const [notification, setNotification] = useState<string | null>(null);
  const [newMetricName, setNewMetricName] = useState("ARS");
  const [newMetricValue, setNewMetricValue] = useState(55.00);
  const [newHypothesis, setNewHypothesis] = useState("");

  const handleCreateRca = (e: React.FormEvent) => {
    e.preventDefault();
    if (newHypothesis.length < 10) {
      alert("Cause hypothesis must be at least 10 characters long.");
      return;
    }

    const newRca = {
      id: `rca-${Date.now()}`,
      metric_name: newMetricName,
      metric_value: Number(newMetricValue),
      cause_hypothesis: `Hypothesis: ${newHypothesis}`,
      status: "candidate", // candidate by default!
      created_at: new Date().toISOString()
    };

    setRcas(prev => [newRca, ...prev]);
    setNewHypothesis("");
    setNotification("✨ Success: RCA Case created as 'Candidate'. Requires strategist review.");
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
            Root Cause Hypotheses
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-indigo-400" />
            RCA Cases Console
          </h1>
          <p className="text-slate-400 text-sm">
            Investigate metric weaknesses under structured cause hypotheses. RCAs represent structured hypotheses, not absolute final truths.
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

      {/* Two columns split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: RCA list */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-lg text-white">Active Root Cause Investigations</h3>
          
          <div className="space-y-4">
            {rcas.map(rca => (
              <div key={rca.id} className="p-6 rounded-2xl border border-white/5 bg-slate-950/30 space-y-4">
                
                {/* Meta block */}
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[9px] font-mono rounded bg-white/5 text-slate-400">
                      ID: {rca.id}
                    </span>
                    <span className="px-2 py-0.5 text-[9px] font-mono rounded bg-red-500/10 text-red-300 border border-red-500/25">
                      {rca.metric_name}: {rca.metric_value}%
                    </span>
                  </div>
                  
                  <span className={`px-2 py-0.5 text-[8px] font-mono font-bold rounded uppercase ${
                    rca.status === "candidate"
                      ? "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                      : rca.status === "approved"
                      ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                      : "bg-red-500/10 border border-red-500/20 text-red-400"
                  }`}>
                    {rca.status}
                  </span>
                </div>

                {/* Body details */}
                <p className="text-slate-300 text-xs leading-relaxed italic">
                  "{rca.cause_hypothesis}"
                </p>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-[9px] text-slate-500 font-mono flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Logged: {new Date(rca.created_at).toLocaleString()}
                  </span>
                  
                  <Link
                    href={`/${workspaceSlug}/fixit/rca/${rca.id}`}
                    className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    Investigate Case <ExternalLink className="w-3.5 h-3.5" />
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
              Propose RCA Hypothesis
            </h3>

            <form onSubmit={handleCreateRca} className="space-y-4 text-xs">
              
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-mono uppercase">Target Weakness Metric</label>
                <select
                  value={newMetricName}
                  onChange={(e) => setNewMetricName(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-white/10 bg-slate-900 text-slate-200 outline-none focus:border-indigo-500 font-mono"
                >
                  <option value="ARS">AEO Readiness Score (ARS)</option>
                  <option value="OCR">Official Citation Rate (OCR)</option>
                  <option value="AAS">AI Answer Share (AAS)</option>
                  <option value="BSF">Brand Semantic Fidelity (BSF)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-mono uppercase">Observed Weakness Value (%)</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={newMetricValue}
                  onChange={(e) => setNewMetricValue(Number(e.target.value))}
                  className="w-full p-2.5 rounded-lg border border-white/10 bg-slate-900 text-slate-200 outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-mono uppercase">Cause Hypothesis (Required)</label>
                <textarea
                  required
                  value={newHypothesis}
                  onChange={(e) => setNewHypothesis(e.target.value)}
                  placeholder="Propose structured cause hypothesis (minimum 10 characters)..."
                  className="w-full h-32 p-2.5 rounded-lg border border-white/10 bg-slate-900 text-slate-200 outline-none focus:border-indigo-500 resize-none font-sans"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 font-bold rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-all font-mono"
              >
                Propose RCA
              </button>

            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
