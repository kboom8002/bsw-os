"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createRepresentationObject } from "@/app/actions/objects";
import { runRepresentationObjectAgent } from "@/lib/ai/objects_agents";
import { 
  ArrowLeft, 
  Layers, 
  Plus, 
  Cpu, 
  Sparkles, 
  History,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  Tag,
  ArrowRight,
  ShieldCheck,
  AlertOctagon
} from "lucide-react";

interface RepresentationObjectItem {
  id: string;
  object_name: string;
  slug: string;
  object_type: string;
  readiness_status: "draft" | "ready" | "failed_safety";
}

export default function ObjectsCatalogPage() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";
  const mockWorkspaceId = "11111111-1111-1111-1111-111111111111";

  const [objects, setObjects] = useState<RepresentationObjectItem[]>([
    { id: "obj-1", object_name: "Active Niacinamide formula percentage", slug: "active-niacinamide-formula-percentage", object_type: "ingredient", readiness_status: "ready" },
    { id: "obj-2", object_name: "Eco compostable sandwich wraps", slug: "eco-compostable-sandwich-wraps", object_type: "product_spec", readiness_status: "draft" }
  ]);

  const [isCreating, setIsCreating] = useState(false);
  const [runningAgent, setRunningAgent] = useState(false);
  const [agentLogs, setAgentLogs] = useState<string[]>([]);
  const [agentSuccess, setAgentSuccess] = useState(false);

  // Form states
  const [objectName, setObjectName] = useState("");
  const [slug, setSlug] = useState("");
  const [objectType, setObjectType] = useState("ingredient");
  const [agentObjectName, setAgentObjectName] = useState("Probiotics Liposome spec");

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const resetForm = () => {
    setObjectName("");
    setSlug("");
    setObjectType("ingredient");
    setFeedback(null);
  };

  const handleNameChange = (val: string) => {
    setObjectName(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
  };

  const handleCreateManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!objectName.trim() || !slug.trim()) return;

    try {
      const data = {
        object_name: objectName,
        slug,
        object_type: objectType,
        qis_refs: [],
        claim_refs: [],
        concept_refs: [],
        evidence_refs: [],
        boundary_refs: [],
        raw_properties: { concentration: "5%", ph: "5.5" },
        readiness_status: "draft" as const
      };

      const result = await createRepresentationObject(mockWorkspaceId, data);
      
      const created: RepresentationObjectItem = {
        id: result.id || "obj-" + Math.floor(Math.random() * 1000),
        object_name: result.object_name,
        slug: result.slug,
        object_type: result.object_type,
        readiness_status: result.readiness_status as any
      };

      setObjects(prev => [...prev, created]);
      setFeedback({ type: "success", message: `Representation Object "${objectName}" registered inside the catalog!` });
      setIsCreating(false);
      resetForm();
    } catch (err) {
      setFeedback({ type: "error", message: `Failure: ${(err as Error).message}` });
    }
  };

  const handleRunAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentObjectName.trim()) return;

    setRunningAgent(true);
    setAgentSuccess(false);
    setAgentLogs([
      "[System] Booting Representation Object Agent...",
      `[Target] Processing target spec parameter: "${agentObjectName}"...`,
      "[Security] Validating workspace permission constraints...",
      "[Safety] Auditing agent_run as 'candidate' state in database ledger..."
    ]);

    try {
      const mockQisId = "44444444-4444-4444-4444-444444444444";

      await new Promise(r => setTimeout(r, 600));
      setAgentLogs(prev => [...prev, "[AI] Crawling associated user QIS scene intent context...", "[AI Synthesis] Structuring raw specifications JSON payload..."]);

      await new Promise(r => setTimeout(r, 600));
      setAgentLogs(prev => [...prev, "[AI Trace] Inheritance mapping claim_refs & concept_refs...", "[System] Persisting candidate presentation object to DB..."]);

      const result = await runRepresentationObjectAgent(mockWorkspaceId, mockQisId, agentObjectName);

      setAgentLogs(prev => [
        ...prev,
        `[Success] Object successfully generated: "${result.representationObject.object_name}"`,
        `[Trace] Registered agent run ID: ${result.agentRunId}`
      ]);

      const created: RepresentationObjectItem = {
        id: result.representationObject.id || "obj-" + Math.floor(Math.random() * 1000),
        object_name: result.representationObject.object_name,
        slug: result.representationObject.slug,
        object_type: result.representationObject.object_type,
        readiness_status: result.representationObject.readiness_status as any
      };

      setObjects(prev => [created, ...prev]);
      setAgentSuccess(true);
    } catch (err) {
      setAgentLogs(prev => [...prev, `[Error] Run failed: ${(err as Error).message}`]);
    } finally {
      setRunningAgent(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready": return "border-green-500/20 text-green-400 bg-green-950/20";
      case "failed_safety": return "border-red-500/20 text-red-400 bg-red-950/20";
      default: return "border-yellow-500/20 text-yellow-400 bg-yellow-950/20";
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-5xl w-full mx-auto text-slate-100 bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="flex items-center gap-4">
          <Link 
            href={`/${workspaceSlug}`}
            className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="text-xs text-cyan-400 font-mono">Presentation Studio</div>
            <h1 className="text-2xl font-extrabold text-white">Representation Objects Catalog</h1>
          </div>
        </div>
        <button
          onClick={() => {
            setIsCreating(true);
            setFeedback(null);
          }}
          className="px-4 py-2 text-xs font-bold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 transition-all shadow-lg shadow-cyan-500/10"
        >
          <Plus className="w-4 h-4" /> Define Object
        </button>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-sm ${
          feedback.type === "success" 
            ? "border-green-500/20 text-green-400 bg-green-950/20" 
            : "border-red-500/20 text-red-400 bg-red-950/20"
        }`}>
          {feedback.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Catalog list */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 space-y-4">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              Factual Representation Objects
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {objects.map((obj) => (
                <div key={obj.id} className="p-4 rounded-xl border border-white/5 bg-slate-900/60 flex flex-col justify-between space-y-3 relative overflow-hidden">
                  <div className="absolute top-4 right-4">
                    <span className={`inline-block px-2 py-0.5 rounded-full border text-[9px] uppercase font-mono font-bold ${getStatusColor(obj.readiness_status)}`}>
                      {obj.readiness_status}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-xs leading-normal pr-16">{obj.object_name}</h4>
                    <p className="text-[9px] text-slate-500 font-mono mt-1">slug: {obj.slug}</p>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-3">
                    <span className="text-[9px] font-mono font-bold uppercase text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-white/5">
                      {obj.object_type}
                    </span>
                    <Link
                      href={`/${workspaceSlug}/objects/${obj.id}`}
                      className="text-[10px] font-bold text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      Verify Readiness <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Controls */}
        <div className="space-y-6">
          {/* AI Scaffolder Trigger */}
          <form onSubmit={handleRunAgent} className="p-6 rounded-2xl border border-white/5 bg-slate-950/40 space-y-4">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              AI Representation Agent
            </h3>
            <p className="text-slate-400 text-xs leading-normal">
              Provide an ingredient/specification name to trigger the AI agent to automatically compile properties and map semantic lineages.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400">Spec Object Name</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={agentObjectName}
                  onChange={(e) => setAgentObjectName(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-white/10 bg-slate-900 text-slate-100 text-xs font-semibold"
                  placeholder="e.g. Zinc PCA specs"
                  required
                />
                <button
                  type="submit"
                  disabled={runningAgent}
                  className="px-3 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all text-xs flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Run
                </button>
              </div>
            </div>

            {agentLogs.length > 0 && (
              <div className="mt-4 rounded-xl bg-black p-3.5 font-mono text-[10px] text-green-400 border border-white/5 space-y-1.5 max-h-40 overflow-y-auto">
                <div className="flex items-center gap-1.5 text-slate-400 font-semibold mb-1 border-b border-white/5 pb-1">
                  <History className="w-3.5 h-3.5" />
                  OBJECT_AGENT_LOG
                </div>
                {agentLogs.map((log, index) => (
                  <div key={index}>{log}</div>
                ))}
                {runningAgent && <div className="text-cyan-400 animate-pulse">Running AI Synthesis...</div>}
                {agentSuccess && <div className="text-yellow-400">[Trace] Audited as 'candidate' and written.</div>}
              </div>
            )}
          </form>

          {/* Manual Form */}
          {isCreating && (
            <form onSubmit={handleCreateManual} className="p-6 rounded-2xl border border-white/10 bg-slate-950/40 space-y-4">
              <h3 className="font-bold text-sm text-slate-200">Define Representation Object</h3>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400">Object Name</label>
                <input
                  type="text"
                  value={objectName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-900 text-slate-100 text-xs font-semibold"
                  placeholder="e.g. Stratum moisture specs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400">Slug (Auto-generated)</label>
                <input
                  type="text"
                  value={slug}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-900/60 text-slate-400 text-xs font-mono cursor-not-allowed"
                  readOnly
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400">Object Type</label>
                <select
                  value={objectType}
                  onChange={(e) => setObjectType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-900 text-slate-200 text-xs font-semibold"
                >
                  <option value="ingredient">Ingredient Spec</option>
                  <option value="product_spec">Product Specs</option>
                  <option value="service_spec">Service Specifications</option>
                </select>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all text-xs text-center"
                >
                  Register Object
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    resetForm();
                  }}
                  className="px-4 py-2 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {!isCreating && (
            <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 space-y-4">
              <h3 className="font-bold text-sm text-slate-300 flex items-center gap-1.5">
                <AlertOctagon className="w-4.5 h-4.5 text-cyan-400" />
                Object-First Paradigm
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                BSW-OS mandates **Object-first, Page-later**. By encapsulating factual spec properties as structured **Representation Objects** before building pages, we ensure absolute source traceability.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
