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
  Play,
  CheckCircle,
  FileText,
  AlertOctagon,
  Database,
  Cpu,
  History,
  Loader2,
  AlertTriangle
} from "lucide-react";
import { resolveWorkspaceId } from "../../../../../../lib/workspace-resolver";
import { 
  listProbePanels, 
  listObservationRuns, 
  startObservationRun, 
  createMockProbeRunResult, 
  completeObservationRun 
} from "../../../../../../app/actions/observatory";

export default function ObservatoryRunsDashboard() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";
  const locale = (params?.locale as string) || "ko";

  const [runs, setRuns] = useState<any[]>([]);
  const [panels, setPanels] = useState<any[]>([]);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Form states
  const [selectedPanel, setSelectedPanel] = useState("");
  const [selectedFixture, setSelectedFixture] = useState("success_fixture");
  const [newRunName, setNewRunName] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      const uuid = await resolveWorkspaceId(workspaceSlug);
      setWorkspaceId(uuid);
      
      const allPanels = await listProbePanels(uuid);
      setPanels(allPanels);
      
      // Default select first locked panel
      const lockedPanels = allPanels.filter(p => p.is_locked);
      if (lockedPanels.length > 0) {
        setSelectedPanel(lockedPanels[0].id);
      }
      
      const runList = await listObservationRuns(uuid);
      setRuns(runList);
    } catch (err: any) {
      setError(err.message || "Failed to load runs dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [workspaceSlug]);

  const handleStartObservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRunName.trim() || !selectedPanel || !workspaceId) return;

    try {
      setSubmitting(true);
      setError(null);
      
      // 1. Start Observation Run (Create run record as candidate)
      const run = await startObservationRun(workspaceId, selectedPanel, newRunName);
      
      // 2. Trigger Mock External Provider Crawls
      await createMockProbeRunResult(workspaceId, run.id, selectedFixture as any);
      
      // 3. Complete Run & Auto-Compute Metrics Snapshot
      await completeObservationRun(workspaceId, run.id);
      
      setNewRunName("");
      setNotification(`🧬 Success: Mock Observation Provider run completed! Stored raw responses and generated reviews candidate judgments.`);
      setTimeout(() => setNotification(null), 4000);
      
      // Reload run list
      const runList = await listObservationRuns(workspaceId);
      setRuns(runList);
    } catch (err: any) {
      setError(err.message || "Failed to trigger observation run.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] text-slate-400 font-mono gap-3 bg-slate-900">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        <span>Loading AI observation console...</span>
      </div>
    );
  }

  const lockedPanels = panels.filter(p => p.is_locked);

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-6xl w-full mx-auto text-slate-100 bg-slate-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="text-xs text-cyan-400 font-mono font-bold tracking-wider uppercase mb-1">
            Sandbox & Run orchestrations
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
            AI Observation Runs Console
          </h1>
          <p className="text-slate-400 text-sm">
            Orchestrate external AI search scrapes. Run simulated sandbox providers, store raw crawler copy feeds, and analyze brand fidelity results.
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

      {/* Notifications banner */}
      {notification && (
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/20 text-emerald-300 text-xs font-mono flex items-start gap-3 backdrop-blur-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{notification}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Columns: Run Configurator form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/30 space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Play className="w-4.5 h-4.5 text-cyan-400" />
              Configure AI Probe Run
            </h3>
            
            <form onSubmit={handleStartObservation} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-mono uppercase">Select Locked Probe Panel</label>
                {lockedPanels.length === 0 ? (
                  <div className="p-3 rounded-lg bg-red-950/20 border border-red-500/10 text-red-400 text-[10px] leading-normal font-mono">
                    ⚠️ No locked probe panels found in this workspace. Please lock a version in panels studio first.
                  </div>
                ) : (
                  <select
                    value={selectedPanel}
                    onChange={(e) => setSelectedPanel(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-white/10 bg-slate-900 text-slate-200 outline-none focus:border-cyan-500 font-mono"
                  >
                    {lockedPanels.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.panel_name} (v{p.version}) [Locked]
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-mono uppercase">Select Mock Provider Engine</label>
                <select
                  value={selectedFixture}
                  onChange={(e) => setSelectedFixture(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-white/10 bg-slate-900 text-slate-200 outline-none focus:border-cyan-500 font-mono"
                >
                  <option value="success_fixture">Success Fixture (95% Fidelity, Citations PASS)</option>
                  <option value="mixed_source_fixture">Mixed Source Fixture (Mentions competitors, Citations FAIL)</option>
                  <option value="dark_pattern_fixture">Dark Pattern Fixture (Mentions brand, Scarcity violations!)</option>
                  <option value="error_fixture">Error Fixture (Simulate 504 Timeout crawl failure)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-mono uppercase">Run Name Label</label>
                <input
                  type="text"
                  required
                  value={newRunName}
                  onChange={(e) => setNewRunName(e.target.value)}
                  placeholder="e.g. Active Retinol Beta run"
                  className="w-full p-2.5 rounded-lg border border-white/10 bg-slate-900 text-slate-200 outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || lockedPanels.length === 0}
                className="w-full py-2.5 font-bold rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 shadow-md shadow-cyan-400/10 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Executing E2E Crawl...
                  </>
                ) : (
                  <>
                    <Cpu className="w-4 h-4" />
                    Trigger Sandbox Run
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Historical Observation Runs list */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 space-y-4">
            <h3 className="font-bold text-lg text-white flex items-center gap-2">
              <History className="w-5 h-5 text-cyan-400" />
              Observation Runs Archive
            </h3>
            
            <div className="space-y-4">
              {runs.length === 0 ? (
                <div className="p-8 rounded-xl border border-white/5 bg-slate-900/10 text-center text-slate-500 font-mono text-xs">
                  No observation runs triggered yet. Configure and trigger one to get started.
                </div>
              ) : (
                runs.map(run => (
                  <div key={run.id} className="p-4 rounded-xl border border-white/5 bg-slate-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-slate-200">{run.run_name}</h4>
                      <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500 font-mono">
                        <span>Panel: {run.panel_name}</span>
                        <span>Engine: {run.engine_name || "mock_provider"}</span>
                        <span>Run ID: {run.id.substring(0, 10)}...</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded uppercase border ${
                        run.run_status === "completed" 
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                      }`}>
                        {run.run_status}
                      </span>
                      <Link
                        href={`/${locale}/${workspaceSlug}/observatory/runs/${run.id}`}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all flex items-center gap-1"
                      >
                        Audit Details
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
