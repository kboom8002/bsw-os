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
  UserCheck,
  AlertOctagon,
  TrendingUp,
  Brain,
  Loader2,
  RefreshCw
} from "lucide-react";
import { resolveWorkspaceId } from "../../../../../../lib/workspace-resolver";
import { 
  listObservationRuns, 
  listDomainIndexSnapshots, 
  computeDomainIndexSnapshot
} from "../../../../../../app/actions/observatory";

export default function ObservatoryIndicesDashboard() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";

  const [runs, setRuns] = useState<any[]>([]);
  const [selectedRunId, setSelectedRunId] = useState("");
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  const [loadingRuns, setLoadingRuns] = useState(true);
  const [loadingIndices, setLoadingIndices] = useState(false);
  const [computing, setComputing] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Load workspace and runs
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
        }

        const snaps = await listDomainIndexSnapshots(uuid);
        setSnapshots(snaps);
      } catch (err: any) {
        setErrorText(err.message || "Failed to load MRI data.");
      } finally {
        setLoadingRuns(false);
      }
    }
    loadWorkspaceAndRuns();
  }, [workspaceSlug]);

  // Load latest index snaps when workspaceId changes
  const reloadIndices = async () => {
    if (!workspaceId) return;
    try {
      setLoadingIndices(true);
      const snaps = await listDomainIndexSnapshots(workspaceId);
      setSnapshots(snaps);
    } catch (err: any) {
      setErrorText(err.message || "Failed to load index snapshots.");
    } finally {
      setLoadingIndices(false);
    }
  };

  const handleComputeIndices = async () => {
    if (!workspaceId || !selectedRunId) return;

    try {
      setComputing(true);
      setErrorText(null);
      setNotification(null);

      // Compute snapshot - definition will auto-bootstrap on the server side securely!
      await computeDomainIndexSnapshot(workspaceId, null, selectedRunId);
      setNotification("⚡ Success: Brand Mismatch Risk Index (MRI) computed successfully for selected run.");
      setTimeout(() => setNotification(null), 4000);

      await reloadIndices();
    } catch (err: any) {
      setErrorText(err.message || "Failed to compute MRI indices.");
    } finally {
      setComputing(false);
    }
  };

  if (loadingRuns) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] text-slate-400 font-mono gap-3 bg-slate-900">
        <Loader2 className="w-8 h-8 text-rose-400 animate-spin" />
        <span>Loading Brand MRI Hub...</span>
      </div>
    );
  }

  // Get current active index snapshot
  // If we have snapshots, we can show the latest one or the one matching the selected run
  const activeSnap = selectedRunId 
    ? snapshots.find(s => s.ai_observation_run_id === selectedRunId) || snapshots[0]
    : snapshots[0];

  // Default values mapping
  const indices = activeSnap ? {
    OPS_MRI: Number(activeSnap.details?.OPS_MRI ?? 15.00),
    B_MRI: Number(activeSnap.details?.B_MRI ?? 45.20),
    P_MRI: Number(activeSnap.details?.P_MRI ?? 25.00),
    V_MRI: Number(activeSnap.details?.V_MRI ?? 12.40),
    TCO_GEO: Number(activeSnap.details?.TCO_GEO ?? 95.00),
    S_MRI: Number(activeSnap.details?.S_MRI ?? 85.50),
    calculated_at: activeSnap.created_at
  } : null;

  const getRiskStatus = (val: number) => {
    if (val < 20) return { label: "SAFE", style: "text-green-400 border-green-500/20 bg-green-950/20" };
    if (val <= 50) return { label: "MEDIUM THREAT", style: "text-amber-400 border-amber-500/20 bg-amber-950/20" };
    return { label: "HIGH THREAT", style: "text-rose-400 border-rose-500/20 bg-rose-950/20" };
  };

  const getEffectivenessStatus = (val: number) => {
    if (val >= 80) return { label: "EXCELLENT", style: "text-green-400 border-green-500/20 bg-green-950/20" };
    if (val >= 50) return { label: "MODERATE", style: "text-amber-400 border-amber-500/20 bg-amber-950/20" };
    return { label: "CRITICAL", style: "text-rose-400 border-rose-500/20 bg-rose-950/20" };
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-6xl w-full mx-auto text-slate-100 bg-slate-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="text-xs text-rose-400 font-mono font-bold tracking-wider uppercase mb-1">
            MRI FAMILY AND STRUCTURAL AUDITS
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 flex items-center gap-3">
            <Brain className="w-8 h-8 text-rose-400" />
            Brand Mismatch Risk Index (MRI) Hub
          </h1>
          <p className="text-slate-400 text-sm">
            Govern separate internal operational risk vectors and external observed search crawlers performance metrics.
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {errorText && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-950/20 text-red-400 text-xs font-mono flex items-start gap-3 backdrop-blur-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>Error: {errorText}</span>
        </div>
      )}

      {/* Notification banner */}
      {notification && (
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/20 text-emerald-300 text-xs font-mono flex items-start gap-3 backdrop-blur-sm">
          <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{notification}</span>
        </div>
      )}

      {/* Controller console */}
      <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 backdrop-blur-sm space-y-6">
        <h3 className="font-bold text-sm text-slate-200">Select Observation Run & Compute MRI</h3>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-xs font-mono">
          <div className="w-full sm:w-80 space-y-1">
            <label className="text-[10px] text-slate-500 uppercase">Select Target Run</label>
            {runs.length === 0 ? (
              <div className="p-2.5 rounded-lg border border-white/5 bg-slate-900 text-slate-500 leading-normal text-[10px]">
                No completed runs. Trigger a run in AI Observation Runs first.
              </div>
            ) : (
              <select
                value={selectedRunId}
                onChange={(e) => setSelectedRunId(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-white/10 bg-slate-900 text-slate-200 outline-none focus:border-cyan-500 cursor-pointer"
              >
                {runs.map(r => (
                  <option key={r.id} value={r.id}>{r.run_name}</option>
                ))}
              </select>
            )}
          </div>

          <button
            onClick={handleComputeIndices}
            disabled={computing || !selectedRunId}
            className="sm:mt-5 px-4 py-2.5 font-bold rounded-lg bg-rose-500 hover:bg-rose-600 text-white transition-all shadow-md shadow-rose-500/10 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {computing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Compute MRI Snapshot
          </button>
        </div>
      </div>

      {/* OPS-MRI vs B-MRI Separation Alert */}
      <div className="p-6 rounded-2xl border border-rose-500/20 bg-rose-950/20 text-xs font-mono flex items-start gap-3 backdrop-blur-sm">
        <AlertOctagon className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-400" />
        <div>
          <span className="font-bold text-white block mb-1 text-sm">BSW-OS Structural Rule: Rigid OPS-MRI & B-MRI Separation</span>
          <p className="text-slate-300 leading-relaxed">
            * **OPS-MRI (Operational Diagnosis Index)** measures *internal operational quality* (unresolved content delta snapshots and vibe profile misalignments on your server).
            * **B-MRI (Brand Observed Risk Index)** measures *external competitive proxy crawling* (failure to transfer concepts and cite links in AI/search-like responses).
            BSW-OS programmatically isolates OPS-MRI from B-MRI to prevent external indexing volatile noise from corrupting your internal fact check gates.
          </p>
        </div>
      </div>

      {/* Gauges Grid */}
      {loadingIndices ? (
        <div className="flex flex-col items-center justify-center p-12 text-slate-500 font-mono text-xs gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-rose-400" />
          <span>Reloading indices...</span>
        </div>
      ) : !indices ? (
        <div className="p-12 rounded-2xl border border-white/5 bg-slate-950/10 text-center text-slate-500 font-mono text-sm">
          No index snapshots exist. Configure a run and click "Compute MRI Snapshot" to begin auditing.
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* OPS-MRI Card */}
            <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/50 flex flex-col justify-between hover:border-cyan-500/20 transition-all">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] text-slate-500 font-mono uppercase">Operational Risk</span>
                  <Activity className="w-4 h-4 text-cyan-400" />
                </div>
                <h3 className="font-bold text-lg text-white mb-1">OPS-MRI</h3>
                <div className="text-3xl font-black text-cyan-400 font-mono mb-2">{indices.OPS_MRI}%</div>
                <p className="text-slate-400 text-[10px] leading-relaxed">
                  Calculated from unresolved Observed Truth Delta Snapshots and profile mismatch severity (MSA) scores on-server.
                </p>
              </div>
              <div className={`mt-4 pt-2.5 border-t border-white/5 text-[9px] font-mono font-bold uppercase ${getRiskStatus(indices.OPS_MRI).label}`}>
                STATUS: {getRiskStatus(indices.OPS_MRI).label}
              </div>
            </div>

            {/* B-MRI Card */}
            <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/50 flex flex-col justify-between hover:border-rose-500/20 transition-all">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] text-slate-500 font-mono uppercase">Observed Risk</span>
                  <TrendingUp className="w-4 h-4 text-rose-400" />
                </div>
                <h3 className="font-bold text-lg text-white mb-1">B-MRI</h3>
                <div className="text-3xl font-black text-rose-400 font-mono mb-2">{indices.B_MRI}%</div>
                <p className="text-slate-400 text-[10px] leading-relaxed">
                  Measures competitive observed crawling failure (100 - ARS AEO readiness composite score).
                </p>
              </div>
              <div className={`mt-4 pt-2.5 border-t border-white/5 text-[9px] font-mono font-bold uppercase ${getRiskStatus(indices.B_MRI).label}`}>
                STATUS: {getRiskStatus(indices.B_MRI).label}
              </div>
            </div>

            {/* P-MRI Card */}
            <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/50 flex flex-col justify-between hover:border-indigo-500/20 transition-all">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] text-slate-500 font-mono uppercase">Persona Mismatch</span>
                  <UserCheck className="w-4 h-4 text-indigo-400" />
                </div>
                <h3 className="font-bold text-lg text-white mb-1">P-MRI</h3>
                <div className="text-3xl font-black text-indigo-400 font-mono mb-2">{indices.P_MRI}%</div>
                <p className="text-slate-400 text-[10px] leading-relaxed">
                  Based on active persona spec evaluation runs that are uncompleted or have failed.
                </p>
              </div>
              <div className={`mt-4 pt-2.5 border-t border-white/5 text-[9px] font-mono font-bold uppercase ${getRiskStatus(indices.P_MRI).label}`}>
                STATUS: {getRiskStatus(indices.P_MRI).label}
              </div>
            </div>

            {/* V-MRI Card */}
            <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/50 flex flex-col justify-between hover:border-amber-500/20 transition-all">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] text-slate-500 font-mono uppercase">Vibe OS Risk</span>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
                <h3 className="font-bold text-lg text-white mb-1">V-MRI</h3>
                <div className="text-3xl font-black text-amber-400 font-mono mb-2">{indices.V_MRI}%</div>
                <p className="text-slate-400 text-[10px] leading-relaxed">
                  Measures vector distance misalignment across clinical/warm/luxury dimensions and dark pattern triggers.
                </p>
              </div>
              <div className={`mt-4 pt-2.5 border-t border-white/5 text-[9px] font-mono font-bold uppercase ${getRiskStatus(indices.V_MRI).label}`}>
                STATUS: {getRiskStatus(indices.V_MRI).label}
              </div>
            </div>

          </div>

          {/* Lift Snapshot Consolidated */}
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 backdrop-blur-sm space-y-4">
            <h3 className="font-bold text-lg text-white">Other Core Indicators</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 rounded-xl border border-white/5 bg-slate-900/60 flex items-center justify-between">
                <span className="text-slate-400">TCO-GEO Concept effectiveness (higher is better):</span>
                <div className="flex items-center gap-3">
                  <span className="text-white font-bold">{indices.TCO_GEO}%</span>
                  <span className={`px-2 py-0.5 text-[8px] font-mono rounded ${getEffectivenessStatus(indices.TCO_GEO).style}`}>
                    {getEffectivenessStatus(indices.TCO_GEO).label}
                  </span>
                </div>
              </div>
              <div className="p-4 rounded-xl border border-white/5 bg-slate-900/60 flex items-center justify-between">
                <span className="text-slate-400">S-MRI Website Readiness (higher is better):</span>
                <div className="flex items-center gap-3">
                  <span className="text-white font-bold">{indices.S_MRI}%</span>
                  <span className={`px-2 py-0.5 text-[8px] font-mono rounded ${getEffectivenessStatus(indices.S_MRI).style}`}>
                    {getEffectivenessStatus(indices.S_MRI).label}
                  </span>
                </div>
              </div>
            </div>
            
            {indices.calculated_at && (
              <div className="text-[10px] text-slate-500 font-mono text-right uppercase">
                Last calculated snapshot: {new Date(indices.calculated_at).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
