"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  ShieldCheck, 
  Sparkles, 
  ArrowRight,
  Shield,
  FileText,
  AlertTriangle,
  BookOpen,
  Scale,
  Plus,
  CheckCircle,
  Loader2
} from "lucide-react";
import { resolveWorkspaceId } from "../../../../../../lib/workspace-resolver";
import { listMethodologyDisclosures, createMethodologyDisclosure } from "../../../../../../app/actions/observatory";

export default function MethodologyDisclosureView() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";

  const [disclosures, setDisclosures] = useState<any[]>([]);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const uuid = await resolveWorkspaceId(workspaceSlug);
        setWorkspaceId(uuid);
        const list = await listMethodologyDisclosures(uuid);
        setDisclosures(list);
      } catch (err: any) {
        setError(err.message || "Failed to load methodology disclosures.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [workspaceSlug]);

  const handleAddDisclosure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newDesc || !workspaceId) return;

    try {
      setSubmitting(true);
      setError(null);
      await createMethodologyDisclosure(workspaceId, {
        disclosure_name: newName,
        methodology_description: newDesc
      });
      
      const list = await listMethodologyDisclosures(workspaceId);
      setDisclosures(list);
      
      setNewName("");
      setNewDesc("");
      setNotification("🧬 Success: New Brand Safety Methodology Disclosure registered with active proxy caveat.");
      setTimeout(() => setNotification(null), 3500);
    } catch (err: any) {
      setError(err.message || "Failed to register disclosure.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] text-slate-400 font-mono gap-3 bg-slate-900">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        <span>Loading methodology studio data...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-6xl w-full mx-auto text-slate-100 bg-slate-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="text-xs text-cyan-400 font-mono font-bold tracking-wider uppercase mb-1">
            Methodology & Limitation disclosures
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 flex items-center gap-3">
            <Scale className="w-8 h-8 text-cyan-400" />
            Methodology Disclosures Studio
          </h1>
          <p className="text-slate-400 text-sm">
            Configure legal brand guidelines. Enforce active proxy caveats, limitation notifications, and compliance alerts.
          </p>
        </div>
      </div>

      {/* Error Banner */}
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

      {/* Core Methodology and Proxy Caveat display */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns: Active Disclosures Catalog */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="font-bold text-lg text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            Active Methodology Disclosures
          </h3>

          <div className="space-y-6">
            {disclosures.length === 0 ? (
              <div className="p-8 rounded-2xl border border-white/5 bg-slate-950/20 text-center text-slate-500 font-mono text-xs">
                No active disclosures found. Use the form to register one.
              </div>
            ) : (
              disclosures.map(disc => (
                <div key={disc.id} className="p-6 rounded-2xl border border-white/5 bg-slate-950/30 space-y-4">
                  <div className="border-b border-white/5 pb-3">
                    <h4 className="font-bold text-base text-white">{disc.disclosure_name}</h4>
                    <span className="text-[10px] text-slate-500 font-mono uppercase">ID: {disc.id}</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-mono uppercase">Methodology Description:</span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {disc.methodology_description}
                    </p>
                  </div>

                  {/* NON-NEGOTIABLE PROXY CAVEAT */}
                  <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-950/15 text-amber-300 space-y-2">
                    <span className="text-[10px] font-mono font-bold uppercase flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Mandatory Proxy Caveat & Limitations Disclosure
                    </span>
                    <p className="text-[10.5px] leading-relaxed italic font-mono">
                      "{disc.proxy_caveat_text}"
                    </p>
                  </div>

                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Register New Disclosure form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/30 space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Plus className="w-4.5 h-4.5 text-cyan-400" />
              Register Disclosure
            </h3>

            <form onSubmit={handleAddDisclosure} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-mono uppercase">Disclosure Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Q3 Squalane SEO crawl panel"
                  className="w-full p-2.5 rounded-lg border border-white/10 bg-slate-900 text-slate-200 outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-mono uppercase">Methodology Description</label>
                <textarea
                  required
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Describe the crawl panel questions size, frequency, and intent mapping engine..."
                  className="w-full h-24 p-2.5 rounded-lg border border-white/10 bg-slate-900 text-slate-200 outline-none focus:border-cyan-500 resize-none font-sans"
                />
              </div>

              <div className="p-3 rounded-lg bg-white/5 border border-white/5 text-[9px] text-slate-400 leading-normal">
                ℹ️ **Note**: Registering this disclosure automatically appends BSW-OS's standard legal limitations proxy caveat.
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 font-bold rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {submitting ? "Registering..." : "Register Methodology"}
              </button>
            </form>
          </div>
        </div>

      </div>

    </div>
  );
}
