"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  Sliders,
  CheckCircle,
  FileText,
  FileSpreadsheet,
  Activity,
  History,
  TrendingUp,
  Plus,
  Info,
  Check
} from "lucide-react";

export default function VibeSpecDetailView() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";
  const vibeSpecId = (params?.vibeSpecId as string) || "vibe-1";

  // Mock details for vibe spec
  const spec = {
    id: vibeSpecId,
    vibe_name: "Premium Clinical Sophistication",
    slug: "premium-clinical-sophistication",
    target_vector: { clinical: 50, warm: 30, luxury: 20 },
    vcs: 95.50,
    vpa: 92.20,
    vmri: 12.40
  };

  // Mock clinical evidence library for the uploader
  const [evidenceList, setEvidenceList] = useState([
    {
      id: "ev-1",
      title: "Double-Blind Dermatological Retinol Trial 2026",
      evidence_type: "clinical_trial",
      is_verified: true,
      url: "https://journals.clinicalskin.org/retinol-trial-2026.pdf"
    },
    {
      id: "ev-2",
      title: "Squalane Purity Analysis Certification",
      evidence_type: "certificate",
      is_verified: true,
      url: "https://certificates.puritylab.org/squalane-analysis.pdf"
    }
  ]);

  // Mock rating events log
  const [ratings, setRatings] = useState([
    {
      id: "rate-1",
      target_title: "Active Retinol Booster Serum page",
      scores: { clinical: 52, warm: 28, luxury: 20 },
      evidence_title: "Double-Blind Dermatological Retinol Trial 2026",
      timestamp: "2026-05-23T18:10:00Z"
    },
    {
      id: "rate-2",
      target_title: "Clinical Ingredients Index page",
      scores: { clinical: 48, warm: 32, luxury: 20 },
      evidence_title: "Squalane Purity Analysis Certification",
      timestamp: "2026-05-23T15:20:00Z"
    }
  ]);

  // Form states
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [selectedEvidenceId, setSelectedEvidenceId] = useState("ev-1");
  const [newClinical, setNewClinical] = useState(50);
  const [newWarm, setNewWarm] = useState(30);
  const [newLuxury, setNewLuxury] = useState(20);
  const [notification, setNotification] = useState<string | null>(null);

  const handleUploadEvidence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    const newEv = {
      id: `ev-${Date.now()}`,
      title: newTitle,
      evidence_type: "clinical_trial",
      is_verified: true, // Auto-verified for UI demonstration
      url: newUrl || "https://clinical-repository.org/uploaded-evidence.pdf"
    };

    setEvidenceList(prev => [...prev, newEv]);
    setSelectedEvidenceId(newEv.id);
    setNewTitle("");
    setNewUrl("");
    setNotification("🧬 Success: New clinical trial evidence uploaded and verified by standard BSW-OS gate review!");
    setTimeout(() => setNotification(null), 3000);
  };

  const handleLogVibeRating = () => {
    // Satisfy "No evidence, no vibe score"
    if (!selectedEvidenceId) {
      alert("Error: You must select verified clinical evidence to log a vibe rating score.");
      return;
    }

    const linkedEv = evidenceList.find(e => e.id === selectedEvidenceId);
    if (!linkedEv || !linkedEv.is_verified) {
      alert("Error: Evidence must be verified to log a score.");
      return;
    }

    const sum = Number(newClinical) + Number(newWarm) + Number(newLuxury);
    if (sum !== 100) {
      alert(`Error: Knobs sum must equal exactly 100%. Current sum is ${sum}%.`);
      return;
    }

    const newRate = {
      id: `rate-${Date.now()}`,
      target_title: "Interactive Surface Sandbox",
      scores: { clinical: Number(newClinical), warm: Number(newWarm), luxury: Number(newLuxury) },
      evidence_title: linkedEv.title,
      timestamp: new Date().toISOString()
    };

    setRatings(prev => [newRate, ...prev]);
    setNotification("☀️ Vibe Rating Event logged successfully! Aggregated Vibe Profile updated in vector database.");
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-6xl w-full mx-auto text-slate-100 bg-slate-900">
      {/* Back Link */}
      <div>
        <Link
          href={`/${workspaceSlug}/vibe/specs`}
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-500 hover:text-rose-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          BACK TO VIBE STUDIO
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-rose-500/10 border border-rose-500/20 text-rose-300">
              SPEC ID: {spec.id}
            </span>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-white/5 border border-white/5 text-slate-400">
              V-Ratio: {spec.target_vector.clinical}/{spec.target_vector.warm}/{spec.target_vector.luxury}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 flex items-center gap-3">
            <Sliders className="w-8 h-8 text-rose-400" />
            {spec.vibe_name}
          </h1>
          <p className="text-slate-400 text-sm">
            Auditing Vibe Alignment (VPA), Consistency Score (VCS), and logging evidence-linked vibe rating scores.
          </p>
        </div>

        {/* Knobs overview */}
        <div className="flex gap-4">
          <div className="p-3.5 rounded-xl border border-white/5 bg-slate-950/40 text-center min-w-[90px]">
            <div className="text-[9px] text-slate-500 font-mono uppercase mb-0.5">VPA</div>
            <div className="text-2xl font-black text-cyan-400">{spec.vpa}%</div>
          </div>
          <div className="p-3.5 rounded-xl border border-white/5 bg-slate-950/40 text-center min-w-[90px]">
            <div className="text-[9px] text-slate-500 font-mono uppercase mb-0.5">VCS</div>
            <div className="text-2xl font-black text-amber-400">{spec.vcs}%</div>
          </div>
          <div className="p-3.5 rounded-xl border border-white/5 bg-slate-950/40 text-center min-w-[90px]">
            <div className="text-[9px] text-slate-500 font-mono uppercase mb-0.5">VMRI</div>
            <div className="text-2xl font-black text-rose-400">{spec.vmri}%</div>
          </div>
        </div>
      </div>

      {/* Notifications Alert */}
      {notification && (
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/20 text-emerald-300 text-xs font-mono flex items-start gap-3 backdrop-blur-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{notification}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Columns: Evidence Uploader & Rating Logger */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Uploader Panel */}
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/30 space-y-6">
            <h3 className="font-bold text-lg text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-rose-400" />
              Strategic Clinical Evidence Uploader
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Before logging any vibe rating scores, BSW-OS requires a validated evidence file link to verify claims.
            </p>

            <form onSubmit={handleUploadEvidence} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-mono uppercase">Evidence Title</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. In Vivo Hydration Efficacy Study"
                    className="w-full p-2.5 rounded-lg border border-white/10 bg-slate-900 text-slate-200 text-xs outline-none focus:border-rose-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-mono uppercase">File URL</label>
                  <input
                    type="url"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="e.g. https://clinical.org/trial.pdf"
                    className="w-full p-2.5 rounded-lg border border-white/10 bg-slate-900 text-slate-200 text-xs outline-none focus:border-rose-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                Upload & Verify Evidence
              </button>
            </form>

            {/* List of evidence items */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="text-[10px] text-slate-500 font-mono uppercase">Select Evidence for Vibe Rating:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {evidenceList.map(ev => (
                  <button
                    key={ev.id}
                    onClick={() => setSelectedEvidenceId(ev.id)}
                    className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                      selectedEvidenceId === ev.id 
                        ? "border-rose-500 bg-rose-950/10 text-rose-300"
                        : "border-white/5 bg-slate-900/40 text-slate-400 hover:bg-slate-900/60"
                    }`}
                  >
                    <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                      selectedEvidenceId === ev.id ? "text-rose-400" : "text-slate-600"
                    }`} />
                    <div>
                      <div className="text-xs font-bold leading-tight">{ev.title}</div>
                      <span className="text-[9px] font-mono text-slate-500 leading-normal block mt-1">
                        URL: {ev.url.substring(0, 30)}...
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sandboxed Rating Logger */}
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 space-y-6">
            <h3 className="font-bold text-lg text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-rose-400" />
              Evidence-Backed Vibe Rating Event Logger
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Adjust vector scores based on copy analysis. BSW-OS enforces the **"No evidence, no vibe score"** policy by locking ratings until linked to a clinical study above.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-cyan-400 font-bold">🧬 Clinical</span>
                  <span>{newClinical}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={newClinical}
                  onChange={(e) => {
                    setNewClinical(parseInt(e.target.value));
                    // Simple balance other sliders
                    const remainder = 100 - parseInt(e.target.value);
                    setNewWarm(Math.round(remainder * 0.6));
                    setNewLuxury(remainder - Math.round(remainder * 0.6));
                  }}
                  className="w-full accent-cyan-400"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-amber-400 font-bold">☀️ Warm</span>
                  <span>{newWarm}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={newWarm}
                  onChange={(e) => {
                    setNewWarm(parseInt(e.target.value));
                    const remainder = 100 - parseInt(e.target.value);
                    setNewClinical(Math.round(remainder * 0.7));
                    setNewLuxury(remainder - Math.round(remainder * 0.7));
                  }}
                  className="w-full accent-amber-400"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-purple-400 font-bold">✨ Luxury</span>
                  <span>{newLuxury}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={newLuxury}
                  onChange={(e) => {
                    setNewLuxury(parseInt(e.target.value));
                    const remainder = 100 - parseInt(e.target.value);
                    setNewClinical(Math.round(remainder * 0.7));
                    setNewWarm(remainder - Math.round(remainder * 0.7));
                  }}
                  className="w-full accent-purple-400"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-4">
              <div className="text-xs text-slate-400 font-sans">
                Linked Evidence: <span className="text-rose-400 font-mono font-bold">
                  {evidenceList.find(e => e.id === selectedEvidenceId)?.title.substring(0, 30)}...
                </span>
              </div>
              <button
                onClick={handleLogVibeRating}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-rose-500 hover:bg-rose-600 text-white transition-all shadow-md shadow-rose-500/10"
              >
                Log Rating Event
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Historical Logs & Chart representation */}
        <div className="lg:col-span-1 space-y-6">
          {/* Performance Trend Chart Mock */}
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/30 space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <TrendingUp className="w-4.5 h-4.5 text-rose-400" />
              Alignment Performance Trends
            </h3>
            <p className="text-[10px] text-slate-500 leading-normal">
              Historical VPA/VCS indices tracked across active page runs.
            </p>
            {/* Visual simulation using CSS bars */}
            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>VPA Alignment (5 Runs)</span>
                  <span>92.20%</span>
                </div>
                <div className="flex items-end gap-1.5 h-16 pt-2">
                  <div className="bg-cyan-500/30 hover:bg-cyan-500 w-full h-[60%] rounded-t transition-all" />
                  <div className="bg-cyan-500/30 hover:bg-cyan-500 w-full h-[75%] rounded-t transition-all" />
                  <div className="bg-cyan-500/30 hover:bg-cyan-500 w-full h-[80%] rounded-t transition-all" />
                  <div className="bg-cyan-500/30 hover:bg-cyan-500 w-full h-[90%] rounded-t transition-all" />
                  <div className="bg-cyan-500 w-full h-[92%] rounded-t transition-all" />
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>VCS Consistency (5 Runs)</span>
                  <span>95.50%</span>
                </div>
                <div className="flex items-end gap-1.5 h-16 pt-2">
                  <div className="bg-amber-500/30 hover:bg-amber-500 w-full h-[95%] rounded-t transition-all" />
                  <div className="bg-amber-500/30 hover:bg-amber-500 w-full h-[90%] rounded-t transition-all" />
                  <div className="bg-amber-500/30 hover:bg-amber-500 w-full h-[96%] rounded-t transition-all" />
                  <div className="bg-amber-500/30 hover:bg-amber-500 w-full h-[92%] rounded-t transition-all" />
                  <div className="bg-amber-500 w-full h-[95%] rounded-t transition-all" />
                </div>
              </div>
            </div>
          </div>

          {/* Historical Rating Logs */}
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/30 space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <History className="w-4.5 h-4.5 text-rose-400" />
              Vibe Ratings Chronological Log
            </h3>
            <div className="space-y-3.5">
              {ratings.map(r => (
                <div key={r.id} className="text-xs border-b border-white/5 pb-3 last:border-b-0 space-y-1">
                  <div className="flex justify-between font-mono text-[9px] text-slate-500">
                    <span>{new Date(r.timestamp).toLocaleTimeString()}</span>
                    <span>🧬 {r.scores.clinical}/{r.scores.warm}/{r.scores.luxury}</span>
                  </div>
                  <div className="font-semibold text-slate-200 truncate">{r.target_title}</div>
                  <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-mono italic">
                    <FileText className="w-3 h-3 flex-shrink-0 text-slate-500" />
                    <span className="truncate">{r.evidence_title}</span>
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
