"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  ShieldCheck, 
  Sparkles, 
  ArrowRight,
  Shield,
  Activity,
  CheckCircle,
  XCircle,
  FileText,
  Eye,
  Check,
  X,
  ClipboardList,
  Loader2,
  AlertTriangle
} from "lucide-react";
import { resolveWorkspaceId } from "../../../../../../lib/workspace-resolver";
import { 
  listObservationRuns, 
  listJudgmentsByRun, 
  reviewResponseJudgment 
} from "../../../../../../app/actions/observatory";

export default function ObservatoryJudgmentsQueue() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";

  const [runs, setRuns] = useState<any[]>([]);
  const [selectedRunId, setSelectedRunId] = useState("");
  const [judgments, setJudgments] = useState<any[]>([]);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  const [loadingRuns, setLoadingRuns] = useState(true);
  const [loadingJudgments, setLoadingJudgments] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Load runs first
  useEffect(() => {
    async function loadWorkspaceAndRuns() {
      try {
        setLoadingRuns(true);
        const uuid = await resolveWorkspaceId(workspaceSlug);
        setWorkspaceId(uuid);
        
        const runList = await listObservationRuns(uuid);
        setRuns(runList);
        
        if (runList.length > 0) {
          setSelectedRunId(runList[0].id);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load observation runs.");
      } finally {
        setLoadingRuns(false);
      }
    }
    loadWorkspaceAndRuns();
  }, [workspaceSlug]);

  // Load judgments when selectedRunId changes
  useEffect(() => {
    async function loadJudgments() {
      if (!workspaceId || !selectedRunId) return;
      try {
        setLoadingJudgments(true);
        const list = await listJudgmentsByRun(workspaceId, selectedRunId);
        setJudgments(list);
      } catch (err: any) {
        setError(err.message || "Failed to load judgments.");
      } finally {
        setLoadingJudgments(false);
      }
    }
    loadJudgments();
  }, [workspaceId, selectedRunId]);

  const handleReview = async (id: string, status: "approved" | "rejected") => {
    if (!workspaceId) return;
    try {
      setSubmittingId(id);
      setError(null);
      await reviewResponseJudgment(workspaceId, id, status);
      
      setNotification(`Successfully marked judgment as ${status.toUpperCase()}. Metrics compiled.`);
      setTimeout(() => setNotification(null), 3500);

      // Refresh list
      const list = await listJudgmentsByRun(workspaceId, selectedRunId);
      setJudgments(list);
    } catch (err: any) {
      setError(err.message || "Failed to submit review.");
    } finally {
      setSubmittingId(null);
    }
  };

  if (loadingRuns) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] text-slate-400 font-mono gap-3 bg-slate-900">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        <span>Loading observation runs archive...</span>
      </div>
    );
  }

  const candidateJudgments = judgments.filter(j => j.review_status === "candidate");

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-6xl w-full mx-auto text-slate-100 bg-slate-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="text-xs text-cyan-400 font-mono font-bold tracking-wider uppercase mb-1">
            Fidelity review panel
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-cyan-400" />
            Response Judgments Console
          </h1>
          <p className="text-slate-400 text-sm">
            Audit candidate response assessments. Review citations, concept transfer rates, and brand semantic fidelity scores to lock metrics.
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-950/20 text-red-400 text-xs font-mono flex items-start gap-3 backdrop-blur-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>Error: {error}</span>
        </div>
      )}

      {/* Notification banner */}
      {notification && (
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/20 text-emerald-300 text-xs font-mono flex items-start gap-3 backdrop-blur-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{notification}</span>
        </div>
      )}

      {/* Run Selector Dropdown */}
      <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/30 space-y-4 max-w-md">
        <label className="text-[10px] text-slate-400 font-mono uppercase block">Select Observation Run to Audit</label>
        {runs.length === 0 ? (
          <div className="text-xs font-mono text-slate-500 leading-normal">
            No observation runs found. Trigger a run in Observation Runs console first.
          </div>
        ) : (
          <select
            value={selectedRunId}
            onChange={(e) => setSelectedRunId(e.target.value)}
            className="w-full p-2.5 rounded-lg border border-white/10 bg-slate-900 text-slate-200 outline-none focus:border-cyan-500 font-mono text-xs cursor-pointer"
          >
            {runs.map(run => (
              <option key={run.id} value={run.id}>
                {run.run_name} (Run ID: {run.id.substring(0, 8)})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Queue items list */}
      <div className="space-y-6">
        <h3 className="font-bold text-lg text-white">Reviewer Candidate Queue</h3>
        
        {loadingJudgments ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-500 font-mono text-xs gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
            <span>Fetching response judgments...</span>
          </div>
        ) : !selectedRunId ? (
          <div className="p-8 rounded-2xl border border-dashed border-white/5 text-center text-slate-500 text-sm">
            Select an active observation run above to load candidate judgments.
          </div>
        ) : candidateJudgments.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-white/5 text-center text-slate-500 text-sm">
            🎉 Flawless! No candidate response judgments require review for this run. All observations aggregated!
          </div>
        ) : (
          <div className="space-y-6">
            {candidateJudgments.map(j => (
              <div key={j.id} className="p-6 rounded-2xl border border-white/5 bg-slate-950/30 space-y-4">
                
                {/* Meta details header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
                  <span className="text-xs text-slate-400 font-bold font-sans">
                    Question: "{j.question_text}"
                  </span>
                  <span className="px-2 py-0.5 text-[8px] font-mono font-bold rounded uppercase bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    {j.review_status}
                  </span>
                </div>

                {/* Stored raw response text display */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-500 font-mono uppercase">Crawl observed response text:</span>
                  <p className="p-3.5 rounded-lg border border-white/5 bg-slate-900/60 font-mono text-xs text-slate-300 leading-normal italic">
                    "{j.raw_response_text}"
                  </p>
                </div>

                {/* Judgment scorecard values */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                    <span className="text-[8px] text-slate-500 font-mono uppercase block mb-0.5">Answer share cite</span>
                    <span className={`text-xs font-bold font-mono ${j.is_citation_found ? "text-purple-400" : "text-slate-400"}`}>
                      {j.is_citation_found ? "CITED PASS" : "CITE FAIL"}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                    <span className="text-[8px] text-slate-500 font-mono uppercase block mb-0.5">Semantic fidelity</span>
                    <span className="text-xs font-bold font-mono text-amber-400">
                      {j.brand_semantic_fidelity_score}%
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                    <span className="text-[8px] text-slate-500 font-mono uppercase block mb-0.5">Territory coverage</span>
                    <span className={`text-xs font-bold font-mono ${j.question_territory_covered ? "text-cyan-400" : "text-slate-400"}`}>
                      {j.question_territory_covered ? "COVERED" : "UNCOVERED"}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                    <span className="text-[8px] text-slate-500 font-mono uppercase block mb-0.5">Concept Transfer</span>
                    <span className={`text-xs font-bold font-mono ${j.geo_concept_transferred ? "text-green-400" : "text-slate-400"}`}>
                      {j.geo_concept_transferred ? "PASSED" : "FAILED"}
                    </span>
                  </div>
                </div>

                {/* Approve/Reject Controls */}
                <div className="pt-4 border-t border-white/5 flex items-center justify-end gap-3">
                  <button
                    onClick={() => handleReview(j.id, "approved")}
                    disabled={submittingId !== null}
                    className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/10 cursor-pointer disabled:opacity-50"
                  >
                    {submittingId === j.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    Approve Score
                  </button>
                  <button
                    onClick={() => handleReview(j.id, "rejected")}
                    disabled={submittingId !== null}
                    className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-red-500 hover:bg-red-600 text-white transition-all flex items-center gap-1.5 shadow-md shadow-red-500/10 cursor-pointer disabled:opacity-50"
                  >
                    {submittingId === j.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <X className="w-3.5 h-3.5" />
                    )}
                    Reject / Flag
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
