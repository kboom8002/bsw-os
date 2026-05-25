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
  Users,
  ShieldAlert,
  Save,
  MessageSquare,
  Check,
  X
} from "lucide-react";

export default function FidelityReviewWorkspace() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";
  const reportId = (params?.reportId as string) || "rep-1";

  // Mock initial findings
  const initialFindings = reportId === "rep-2" ? [
    {
      id: "find-1",
      finding_type: "market_share",
      offending_text: 'Found forbidden term "market share" in section "Competitive Landscape Analysis": "Claims to measure true AI/search market share"',
      is_resolved: false,
      resolution_notes: ""
    }
  ] : [];

  // Mock initial reviews
  const initialReviews = reportId === "rep-2" ? [] : [
    {
      id: "rev-1",
      reviewer: "Audrey Strategist (audrey@brandsemantic.io)",
      decision: "approved",
      notes: "The AI draft has been thoroughly edited. Competitor keywords are factual observations and proxy disclaimers are correctly in place.",
      timestamp: "2026-05-23T18:45:00Z"
    }
  ];

  // State
  const [findings, setFindings] = useState(initialFindings);
  const [reviews, setReviews] = useState(initialReviews);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [activeResolvingId, setActiveResolvingId] = useState<string | null>(null);

  const [reviewDecision, setReviewDecision] = useState<"approved" | "rejected">("approved");
  const [reviewNotes, setReviewNotes] = useState("");

  const [notification, setNotification] = useState<string | null>(null);

  const handleResolveFinding = (id: string, notes: string) => {
    if (!notes.trim()) return;
    setFindings(prev => prev.map(f => {
      if (f.id === id) {
        return { ...f, is_resolved: true, resolution_notes: notes };
      }
      return f;
    }));
    setActiveResolvingId(null);
    setResolutionNotes("");
    setNotification("✅ Safety finding resolved successfully! Resolution notes attached.");
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewNotes.trim()) return;

    const newReview = {
      id: `rev-${Date.now()}`,
      reviewer: "Lead Strategist Session (simulated)",
      decision: reviewDecision,
      notes: reviewNotes,
      timestamp: new Date().toISOString()
    };

    setReviews(prev => [newReview, ...prev]);
    setReviewNotes("");
    setNotification(`📋 Manual review recorded: Decision classified as ${reviewDecision.toUpperCase()}.`);
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-6xl w-full mx-auto text-slate-100 bg-slate-900">
      {/* Back Link */}
      <div>
        <Link
          href={`/${workspaceSlug}/reports/${reportId}`}
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-500 hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          BACK TO PORTAL
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="text-xs text-indigo-400 font-mono font-bold tracking-wider uppercase mb-1">
            Governed Review Board
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-indigo-400" />
            Fidelity Review Board
          </h1>
          <p className="text-slate-400 text-sm">
            Audit compliance findings, clear wording exceptions, and log manual strategist signoffs.
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

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns: Wording Findings Queue */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/30 space-y-6">
            <h3 className="font-bold text-lg text-white flex items-center gap-2 border-b border-white/5 pb-4">
              <ShieldAlert className="w-5 h-5 text-indigo-400" />
              Unsafe Wording Scanner Findings ({findings.filter(f => !f.is_resolved).length} Unresolved)
            </h3>

            {findings.length === 0 ? (
              <div className="p-4 rounded-xl border border-emerald-500/10 bg-emerald-950/5 text-emerald-300 text-xs font-mono flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Zero unsafe wording findings detected in this report copy. Clear to proceed!</span>
              </div>
            ) : (
              <div className="space-y-4">
                {findings.map(f => (
                  <div 
                    key={f.id} 
                    className={`p-4 rounded-xl border transition-all text-xs space-y-3 ${
                      f.is_resolved 
                        ? "border-emerald-500/20 bg-emerald-950/5 text-slate-400" 
                        : "border-red-500/20 bg-red-950/10 text-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-[9px] uppercase">
                      <span className={`px-2 py-0.5 rounded ${
                        f.is_resolved ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                      }`}>
                        TYPE: {f.finding_type}
                      </span>
                      <span className="text-slate-500">
                        {f.is_resolved ? "Resolved" : "Action Required"}
                      </span>
                    </div>

                    <p className="leading-relaxed font-sans">{f.offending_text}</p>

                    {f.is_resolved ? (
                      <div className="p-2.5 rounded bg-white/5 text-[11px] text-slate-400 italic">
                        <strong>Resolution Justification:</strong> "{f.resolution_notes}"
                      </div>
                    ) : (
                      <div className="pt-2">
                        {activeResolvingId === f.id ? (
                          <div className="space-y-2">
                            <textarea
                              required
                              value={resolutionNotes}
                              onChange={(e) => setResolutionNotes(e.target.value)}
                              placeholder="Describe why this wording has been approved/mitigated (e.g. Factual brand mention containing required caveat)..."
                              className="w-full p-2.5 rounded-lg border border-white/10 bg-slate-900 text-slate-200 outline-none focus:border-indigo-500 text-xs"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setActiveResolvingId(null)}
                                className="px-3 py-1.5 rounded bg-white/5 border border-white/5 text-[10px] font-bold text-slate-400 font-mono"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleResolveFinding(f.id, resolutionNotes)}
                                className="px-3.5 py-1.5 rounded bg-indigo-500 hover:bg-indigo-600 text-[10px] font-bold text-white font-mono flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" />
                                Submit Resolution
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setActiveResolvingId(f.id);
                              setResolutionNotes("");
                            }}
                            className="px-3.5 py-1.5 text-[10px] font-bold rounded bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all font-mono"
                          >
                            Resolve Exception
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past Review Decisions audit log */}
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/30 space-y-6">
            <h3 className="font-bold text-base text-white flex items-center gap-2 border-b border-white/5 pb-4">
              <Users className="w-5 h-5 text-indigo-400" />
              Manual Review Audit History
            </h3>

            {reviews.length === 0 ? (
              <p className="text-xs text-slate-500 font-mono italic">
                No manual strategist reviews have been submitted for this report yet.
              </p>
            ) : (
              <div className="space-y-4">
                {reviews.map(rev => (
                  <div key={rev.id} className="p-4 rounded-xl border border-white/5 bg-slate-900/40 text-xs space-y-2">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="font-bold text-white block">{rev.reviewer}</span>
                      <span className={`px-2 py-0.5 font-mono text-[9px] uppercase rounded ${
                        rev.decision === "approved"
                          ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                          : "bg-red-500/10 border border-red-500/20 text-red-400"
                      }`}>
                        {rev.decision}
                      </span>
                    </div>
                    <p className="text-slate-300 font-sans leading-relaxed">{rev.notes}</p>
                    <span className="text-[9px] text-slate-500 font-mono block pt-1">
                      Log Timestamp: {new Date(rev.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Submission Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/30 space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <MessageSquare className="w-4.5 h-4.5 text-indigo-400" />
              Record Strategist Signoff
            </h3>
            
            <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
              
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-mono uppercase">Review Decision</label>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setReviewDecision("approved")}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all flex items-center justify-center gap-1.5 font-mono ${
                      reviewDecision === "approved"
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                        : "border-white/5 bg-slate-900 text-slate-400"
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    APPROVED
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewDecision("rejected")}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all flex items-center justify-center gap-1.5 font-mono ${
                      reviewDecision === "rejected"
                        ? "border-red-500 bg-red-500/10 text-red-400"
                        : "border-white/5 bg-slate-900 text-slate-400"
                    }`}
                  >
                    <X className="w-3.5 h-3.5" />
                    REJECTED
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-mono uppercase">Strategist Review Notes</label>
                <textarea
                  required
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Attest that this report meets the BSW-OS competitive brand safety criteria, detailing any necessary manual rewrites..."
                  className="w-full h-32 p-2.5 rounded-lg border border-white/10 bg-slate-900 text-slate-200 outline-none focus:border-indigo-500 resize-none font-sans"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 font-bold rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-all font-mono"
              >
                Log Review Decision
              </button>

            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
