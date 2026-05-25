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
  FolderOpen,
  Lock,
  Unlock,
  Layers,
  Database,
  Plus,
  RefreshCw,
  X,
  Loader2,
  Trash2
} from "lucide-react";
import { resolveWorkspaceId } from "../../../../../../lib/workspace-resolver";
import { 
  listProbePanels, 
  createProbePanel, 
  lockProbePanelVersion, 
  generateProbePanelFromQis,
  deleteProbePanel
} from "../../../../../../app/actions/observatory";

export default function ObservatoryPanelsDashboard() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";
  const locale = (params?.locale as string) || "ko";

  const [panels, setPanels] = useState<any[]>([]);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [panelName, setPanelName] = useState("");
  const [panelSlug, setPanelSlug] = useState("");
  const [description, setDescription] = useState("");
  const [version, setVersion] = useState(1);

  async function loadData() {
    try {
      setLoading(true);
      const uuid = await resolveWorkspaceId(workspaceSlug);
      setWorkspaceId(uuid);
      const list = await listProbePanels(uuid);
      setPanels(list);
    } catch (err: any) {
      setError(err.message || "Failed to load probe panels.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [workspaceSlug]);

  const handleLockPanel = async (panelId: string) => {
    if (!workspaceId) return;
    try {
      setError(null);
      await lockProbePanelVersion(workspaceId, panelId);
      setNotification("🔒 Probe Panel version is now frozen and locked. Version reproducibility active.");
      setTimeout(() => setNotification(null), 3500);
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to lock panel.");
    }
  };

  const handleExtractFromQis = async (panelId: string) => {
    if (!workspaceId) return;
    try {
      setError(null);
      const result = await generateProbePanelFromQis(workspaceId, panelId);
      setNotification(`🧬 Successfully extracted active Query-Intent-Scenario (QIS) files into panel. ${result.length} questions appended.`);
      setTimeout(() => setNotification(null), 3500);
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to extract from QIS.");
    }
  };

  const handleDeletePanel = async (panelId: string) => {
    if (!workspaceId) return;
    if (!confirm("Are you sure you want to delete this panel? Questions under this panel will be removed.")) return;
    try {
      setError(null);
      await deleteProbePanel(workspaceId, panelId);
      setNotification("🗑️ Probe Panel deleted successfully.");
      setTimeout(() => setNotification(null), 3500);
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to delete panel.");
    }
  };

  const handleCreatePanel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId || !panelName || !panelSlug) return;
    try {
      setSubmitting(true);
      setError(null);
      await createProbePanel(workspaceId, {
        panel_name: panelName,
        slug: panelSlug,
        description,
        version,
        is_locked: false
      });
      setNotification("✨ Probe Panel successfully initialized as unlocked draft.");
      setTimeout(() => setNotification(null), 3500);
      setShowModal(false);
      
      // Reset form
      setPanelName("");
      setPanelSlug("");
      setDescription("");
      setVersion(1);

      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to create panel.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] text-slate-400 font-mono gap-3 bg-slate-900">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        <span>Loading probe panel studio data...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-6xl w-full mx-auto text-slate-100 bg-slate-900 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="text-xs text-cyan-400 font-mono font-bold tracking-wider uppercase mb-1">
            Observed AI search panel configurations
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
            AI Probe Panels Studio
          </h1>
          <p className="text-slate-400 text-sm">
            Maintain version-controlled query panels. Extract QIS query mappings, freeze question versions, and run E2E reproducible before/after lift benchmarks.
          </p>
        </div>
        <div>
          <button 
            onClick={() => setShowModal(true)}
            className="px-4 py-2 text-sm font-bold rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Synthesize New Panel
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-950/20 text-red-400 text-xs font-mono flex items-start gap-3 backdrop-blur-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>Error: {error}</span>
        </div>
      )}

      {/* Notifications Alert */}
      {notification && (
        <div className={`p-4 rounded-xl border text-xs font-mono flex items-start gap-3 backdrop-blur-sm ${
          notification.includes("🗑️") || notification.includes("Failed") || notification.includes("❌")
            ? "border-amber-500/20 bg-amber-950/20 text-amber-300"
            : "border-emerald-500/20 bg-emerald-950/20 text-emerald-300"
        }`}>
          <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{notification}</span>
        </div>
      )}

      {/* Grid panels list */}
      {panels.length === 0 ? (
        <div className="p-12 rounded-2xl border border-white/5 bg-slate-950/20 text-center text-slate-500 font-mono text-sm">
          No probe panels registered. Click "Synthesize New Panel" to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {panels.map(panel => (
            <div 
              key={panel.id}
              className="p-6 rounded-2xl border border-white/5 bg-slate-950/50 flex flex-col justify-between hover:border-white/10 transition-all hover:translate-y-[-2px] duration-200"
            >
              <div>
                {/* Top Meta details */}
                <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[9px] font-mono font-bold rounded bg-cyan-500/10 text-cyan-300 uppercase">
                      v{panel.version}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      /{panel.slug}
                    </span>
                  </div>
                  
                  <span className={`px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full uppercase tracking-wider flex items-center gap-1.5 ${
                    panel.is_locked 
                      ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                      : "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                  }`}>
                    {panel.is_locked ? (
                      <>
                        <Lock className="w-3 h-3" />
                        Locked
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3 h-3" />
                        Draft / Unlocked
                      </>
                    )}
                  </span>
                </div>

                {/* Title & Description */}
                <div className="mb-4">
                  <h3 className="font-bold text-lg text-white mb-2 flex items-center gap-2">
                    <Layers className="w-4.5 h-4.5 text-cyan-400" />
                    {panel.panel_name}
                  </h3>
                  <p className="text-slate-400 text-xs leading-relaxed mb-4">
                    {panel.description || "No description configured."}
                  </p>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 font-mono text-[10px] text-slate-300 flex items-center justify-between">
                    <span>Questions in version:</span>
                    <span className="font-bold text-white text-xs">{panel.question_count || 0}</span>
                  </div>
                </div>
              </div>

              {/* Actions button console */}
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between gap-4">
                <div className="flex gap-2">
                  {!panel.is_locked && (
                    <button
                      onClick={() => handleLockPanel(panel.id)}
                      className="px-3 py-1.5 text-[10px] font-bold rounded bg-emerald-500 hover:bg-emerald-600 text-white transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Lock className="w-3 h-3" />
                      Lock Version
                    </button>
                  )}
                  <button
                    onClick={() => handleExtractFromQis(panel.id)}
                    disabled={panel.is_locked}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded flex items-center gap-1 transition-all cursor-pointer ${
                      panel.is_locked 
                        ? "bg-slate-900 text-slate-700 cursor-not-allowed border border-transparent"
                        : "bg-white/5 border border-white/10 hover:bg-white/10 text-white"
                    }`}
                  >
                    <RefreshCw className="w-3 h-3" />
                    Extract QIS
                  </button>
                  {!panel.is_locked && (
                    <button
                      onClick={() => handleDeletePanel(panel.id)}
                      className="px-3 py-1.5 text-[10px] font-bold rounded bg-red-950/30 border border-red-500/20 text-red-400 hover:bg-red-900/30 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  )}
                </div>

                <Link
                  href={`/${locale}/${workspaceSlug}/observatory/panels/${panel.id}`}
                  className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1.5"
                >
                  <span>View questions</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Safety Caveat Bottom Box */}
      <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 backdrop-blur-sm space-y-4">
        <h3 className="font-bold text-lg text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-cyan-400" />
          Mandatory Proxy Measurement Notice
        </h3>
        <p className="text-slate-400 text-xs leading-relaxed font-sans">
          AI search answer parameters and citation indices calculated across this observatory are strictly **observed proxy measurements under specific methodologies and limitations**. They represent external crawler behavior within this localized panel and are not guaranteed hidden model preferences, true market shares, or definitive guaranteed rankings.
        </p>
      </div>

      {/* Create Panel Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl border border-white/10 bg-slate-900 text-slate-100 shadow-2xl relative space-y-4 animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-400" />
                Synthesize Probe Panel
              </h3>
              <p className="text-slate-400 text-xs font-mono">Create an isolated version-controlled test suite</p>
            </div>

            <form onSubmit={handleCreatePanel} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-mono uppercase">Panel Name</label>
                <input
                  type="text"
                  required
                  value={panelName}
                  onChange={(e) => {
                    setPanelName(e.target.value);
                    if (!panelSlug) {
                      setPanelSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
                    }
                  }}
                  placeholder="e.g. Skin Care Retinol Efficacy Panel"
                  className="w-full p-2.5 rounded-lg border border-white/10 bg-slate-800 text-slate-200 outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-mono uppercase">Slug</label>
                <input
                  type="text"
                  required
                  value={panelSlug}
                  onChange={(e) => setPanelSlug(e.target.value.toLowerCase())}
                  placeholder="e.g. retinol-efficacy-panel"
                  className="w-full p-2.5 rounded-lg border border-white/10 bg-slate-800 text-slate-200 outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-mono uppercase">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the target measurement intent, engines monitored, and key goals..."
                  className="w-full h-20 p-2.5 rounded-lg border border-white/10 bg-slate-800 text-slate-200 outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-mono uppercase">Initial Version</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={version}
                  onChange={(e) => setVersion(parseInt(e.target.value) || 1)}
                  className="w-full p-2.5 rounded-lg border border-white/10 bg-slate-800 text-slate-200 outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 font-bold rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? "Synthesizing..." : "Synthesize Panel"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
