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
  AlertTriangle,
  FileText,
  Percent,
  CheckCircle,
  AlertOctagon,
  LineChart,
  GitCompare,
  Loader2,
  Bookmark
} from "lucide-react";
import { resolveWorkspaceId } from "../../../../../../lib/workspace-resolver";
import { 
  listObservationRuns, 
  listMetricSnapshotsByRun, 
  createSemanticWebsiteLiftSnapshot 
} from "../../../../../../app/actions/observatory";

export default function ObservatoryMetricsView() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";

  const [runs, setRuns] = useState<any[]>([]);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  
  const [loadingRuns, setLoadingRuns] = useState(true);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [computingLift, setComputingLift] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Selected run for scorecard
  const [selectedRunId, setSelectedRunId] = useState("");
  const [metrics, setMetrics] = useState<any[]>([]);

  // Selected runs for lift comparison
  const [baseRunId, setBaseRunId] = useState("");
  const [activeRunId, setActiveRunId] = useState("");
  const [liftResult, setLiftResult] = useState<any | null>(null);

  // Load runs
  useEffect(() => {
    async function loadWorkspaceAndRuns() {
      try {
        setLoadingRuns(true);
        const uuid = await resolveWorkspaceId(workspaceSlug);
        setWorkspaceId(uuid);
        
        const runList = await listObservationRuns(uuid);
        const completedRuns = runList.filter(r => r.run_status === "completed");
        setRuns(completedRuns);
        
        if (completedRuns.length > 0) {
          setSelectedRunId(completedRuns[0].id);
          setBaseRunId(completedRuns[0].id);
          setActiveRunId(completedRuns[0].id);
        }
      } catch (err: any) {
        setErrorText(err.message || "Failed to load runs.");
      } finally {
        setLoadingRuns(false);
      }
    }
    loadWorkspaceAndRuns();
  }, [workspaceSlug]);

  // Load metrics when selectedRunId changes
  useEffect(() => {
    async function loadMetrics() {
      if (!workspaceId || !selectedRunId) return;
      try {
        setLoadingMetrics(true);
        const list = await listMetricSnapshotsByRun(workspaceId, selectedRunId);
        setMetrics(list);
      } catch (err: any) {
        setErrorText(err.message || "Failed to load metrics.");
      } finally {
        setLoadingMetrics(false);
      }
    }
    loadMetrics();
  }, [workspaceId, selectedRunId]);

  const handleCalculateLift = async () => {
    if (!workspaceId || !baseRunId || !activeRunId) return;

    try {
      setComputingLift(true);
      setErrorText(null);
      setLiftResult(null);

      const result = await createSemanticWebsiteLiftSnapshot(workspaceId, baseRunId, activeRunId);
      setLiftResult(result.lift_metrics);
    } catch (err: any) {
      setErrorText(err.message || "Failed to evaluate semantic lift.");
    } finally {
      setComputingLift(false);
    }
  };

  if (loadingRuns) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] text-slate-400 font-mono gap-3 bg-slate-900">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        <span>Loading AI search metrics dashboard...</span>
      </div>
    );
  }

  // Get metric values helper
  const getMetric = (name: string) => {
    const m = metrics.find(x => x.metric_name === name);
    return m ? Number(m.metric_value) : 0.00;
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-6xl w-full mx-auto text-slate-100 bg-slate-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="text-xs text-cyan-400 font-mono font-bold tracking-wider uppercase mb-1">
            Aggregated AEO/GEO benchmarks
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 flex items-center gap-3">
            <LineChart className="w-8 h-8 text-cyan-400" />
            AI Search Metrics Dashboard
          </h1>
          <p className="text-slate-400 text-sm">
            Audit AAS (Answer Share), OCR (Citation Rate), and compute Semantic Website Effect Lift (SWEL) comparisons.
          </p>
        </div>
      </div>

      {/* Metric Scorecard Selector */}
      <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 backdrop-blur-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="font-bold text-lg text-white flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-cyan-400" />
            AI Search Metrics Scorecard
          </h3>
          
          <div className="w-full sm:w-72">
            <select
              value={selectedRunId}
              onChange={(e) => setSelectedRunId(e.target.value)}
              className="w-full p-2 rounded-lg border border-white/10 bg-slate-900 text-slate-200 outline-none focus:border-cyan-500 font-mono text-xs cursor-pointer"
            >
              {runs.map(r => (
                <option key={r.id} value={r.id}>{r.run_name}</option>
              ))}
            </select>
          </div>
        </div>

        {loadingMetrics ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-500 font-mono text-xs gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
            <span>Aggregating run metrics...</span>
          </div>
        ) : !selectedRunId ? (
          <div className="p-8 rounded-xl border border-dashed border-white/5 text-center text-slate-500 text-xs font-mono">
            No completed runs found. Run an AI observation session first.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* AAS */}
            <div className="p-5 rounded-xl border border-white/5 bg-slate-950/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono uppercase">AI Answer Share</span>
                <span className="text-xl font-black text-cyan-400 font-mono">{getMetric("AAS")}%</span>
              </div>
              <h4 className="font-bold text-sm text-slate-200">AAS Score</h4>
              <p className="text-[10px] text-slate-400 leading-normal">
                Counts search engine response occurrences containing brand keywords or conceptual triggers.
              </p>
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <div className="bg-cyan-400 h-1.5 rounded-full" style={{ width: `${getMetric("AAS")}%` }}></div>
              </div>
            </div>

            {/* OCR */}
            <div className="p-5 rounded-xl border border-white/5 bg-slate-950/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono uppercase">Official Citation Rate</span>
                <span className="text-xl font-black text-purple-400 font-mono">{getMetric("OCR")}%</span>
              </div>
              <h4 className="font-bold text-sm text-slate-200">OCR Score</h4>
              <p className="text-[10px] text-slate-400 leading-normal">
                Measures whether AI answers reference official website clinical/factual URLs in citation anchors.
              </p>
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <div className="bg-purple-400 h-1.5 rounded-full" style={{ width: `${getMetric("OCR")}%` }}></div>
              </div>
            </div>

            {/* BSF */}
            <div className="p-5 rounded-xl border border-white/5 bg-slate-950/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono uppercase">Brand Semantic Fidelity</span>
                <span className="text-xl font-black text-amber-400 font-mono">{getMetric("BSF")}%</span>
              </div>
              <h4 className="font-bold text-sm text-slate-200">BSF Score</h4>
              <p className="text-[10px] text-slate-400 leading-normal">
                Verifies semantic representation alignments against approved operational brand truth claims on-server.
              </p>
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: `${getMetric("BSF")}%` }}></div>
              </div>
            </div>

            {/* QTC */}
            <div className="p-5 rounded-xl border border-white/5 bg-slate-950/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono uppercase">Question Territory Coverage</span>
                <span className="text-xl font-black text-rose-400 font-mono">{getMetric("QTC")}%</span>
              </div>
              <h4 className="font-bold text-sm text-slate-200">QTC Score</h4>
              <p className="text-[10px] text-slate-400 leading-normal">
                Indicates percentage of strategic question capital areas referenced in the final AI response feed.
              </p>
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <div className="bg-rose-400 h-1.5 rounded-full" style={{ width: `${getMetric("QTC")}%` }}></div>
              </div>
            </div>

            {/* GCTR */}
            <div className="p-5 rounded-xl border border-white/5 bg-slate-950/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono uppercase">GEO Concept Transfer Rate</span>
                <span className="text-xl font-black text-green-400 font-mono">{getMetric("GCTR")}%</span>
              </div>
              <h4 className="font-bold text-sm text-slate-200">GCTR Score</h4>
              <p className="text-[10px] text-slate-400 leading-normal">
                Measures whether active Generative Engine Optimization (GEO) ontology concepts successfully migrated.
              </p>
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <div className="bg-green-400 h-1.5 rounded-full" style={{ width: `${getMetric("GCTR")}%` }}></div>
              </div>
            </div>

            {/* ARS */}
            <div className="p-5 rounded-xl border border-cyan-500/20 bg-cyan-950/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-cyan-400 font-mono uppercase font-bold">AEO Readiness Score</span>
                <span className="text-xl font-black text-cyan-400 font-mono">{getMetric("ARS")}%</span>
              </div>
              <h4 className="font-bold text-sm text-white">ARS (Weighted Composite)</h4>
              <p className="text-[10px] text-slate-300 leading-normal">
                Weighted index: AAS*0.2 + OCR*0.2 + BSF*0.3 + QTC*0.1 + GCTR*0.2. Core release gate driver.
              </p>
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <div className="bg-cyan-500 h-1.5 rounded-full" style={{ width: `${getMetric("ARS")}%` }}></div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Lift Snapshot Comparison Console */}
      <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 backdrop-blur-sm space-y-6">
        <h3 className="font-bold text-lg text-white flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-cyan-400" />
          Semantic Website Effect Lift (SWEL) Snapshot Evaluator
        </h3>
        <p className="text-slate-400 text-xs leading-relaxed font-sans">
          Compare the lift in AEO Readiness Scores between a base website crawled observation run and a post-deployment active run. 
          **BSW-OS non-negotiable rule**: Both runs must use the *exact same panel version*.
        </p>

        {/* Form selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 uppercase">Base Observation Run (Before)</label>
            <select
              value={baseRunId}
              onChange={(e) => setBaseRunId(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-white/10 bg-slate-900 text-slate-200 outline-none focus:border-cyan-500 cursor-pointer"
            >
              {runs.map(r => (
                <option key={r.id} value={r.id}>{r.run_name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 uppercase">Active Observation Run (After)</label>
            <select
              value={activeRunId}
              onChange={(e) => setActiveRunId(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-white/10 bg-slate-900 text-slate-200 outline-none focus:border-cyan-500 cursor-pointer"
            >
              {runs.map(r => (
                <option key={r.id} value={r.id}>{r.run_name}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleCalculateLift}
          disabled={computingLift || runs.length < 2}
          className="px-4 py-2.5 text-xs font-bold rounded-lg bg-cyan-500 hover:bg-cyan-600 text-slate-950 transition-all shadow-md shadow-cyan-500/10 flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {computingLift && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Compute SWEL Lift Snapshot
        </button>

        {/* Error/Blocked Banner */}
        {errorText && (
          <div className="p-4 rounded-xl border border-red-500/20 bg-red-950/20 text-red-300 text-xs font-mono flex items-start gap-3">
            <AlertOctagon className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
            <div>
              <span className="font-bold text-white block mb-0.5">COMPUTATION BLOCKED</span>
              <span>{errorText}</span>
            </div>
          </div>
        )}

        {/* Lift result display */}
        {liftResult && (
          <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/20 text-emerald-300 text-xs font-mono flex items-start gap-3">
            <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
            <div>
              <span className="font-bold text-white block mb-1">SWEL Lift Snapshot Computed Successfully!</span>
              <div className="space-y-1 leading-normal">
                <div>Base AEO Readiness Score (ARS): <span className="font-bold text-white">{liftResult.base_ars}%</span></div>
                <div>Active AEO Readiness Score (ARS): <span className="font-bold text-white">{liftResult.active_ars}%</span></div>
                <div className="text-sm font-black text-emerald-400 pt-1">
                  Observed Semantic Lift Delta (SWEL): {liftResult.swel_lift > 0 ? "+" : ""}{liftResult.swel_lift}%
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
