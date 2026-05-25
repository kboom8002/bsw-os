"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createSurfaceContract } from "@/app/actions/objects";
import { 
  ArrowLeft, 
  Workflow, 
  Plus, 
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Boxes
} from "lucide-react";

interface SurfaceContractItem {
  id: string;
  contract_name: string;
  slug: string;
  allowed_objects: string[];
  required_blocks: string[];
  is_valid: boolean;
}

interface RepresentationObject {
  id: string;
  object_name: string;
}

export default function SurfacesCatalogPage() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";
  const mockWorkspaceId = "11111111-1111-1111-1111-111111111111";

  const [objects] = useState<RepresentationObject[]>([
    { id: "obj-1", object_name: "Active Niacinamide formula percentage" },
    { id: "obj-2", object_name: "Eco compostable sandwich wraps" }
  ]);

  const [contracts, setContracts] = useState<SurfaceContractItem[]>([
    { id: "con-1", contract_name: "Premium Skincare Details Surface", slug: "premium-skincare-details-surface", allowed_objects: ["obj-1"], required_blocks: ["clinical_evidence", "safety_boundary"], is_valid: true },
    { id: "con-2", contract_name: "Convenience Sandwich Card Surface", slug: "convenience-sandwich-card-surface", allowed_objects: ["obj-2"], required_blocks: ["clinical_evidence"], is_valid: false }
  ]);

  const [isCreating, setIsCreating] = useState(false);
  const [contractName, setContractName] = useState("");
  const [slug, setSlug] = useState("");
  const [selectedObjects, setSelectedObjects] = useState<string[]>([]);
  const [requiredBlocks, setRequiredBlocks] = useState<string[]>(["clinical_evidence"]);

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const resetForm = () => {
    setContractName("");
    setSlug("");
    setSelectedObjects([]);
    setRequiredBlocks(["clinical_evidence"]);
    setFeedback(null);
  };

  const handleNameChange = (val: string) => {
    setContractName(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractName.trim() || !slug.trim()) return;

    try {
      const data = {
        contract_name: contractName,
        slug,
        allowed_objects: selectedObjects,
        qis_refs: [],
        required_blocks: requiredBlocks,
        is_valid: false,
        validation_details: {}
      };

      const result = await createSurfaceContract(mockWorkspaceId, data);
      
      const created: SurfaceContractItem = {
        id: result.id || "con-" + Math.floor(Math.random() * 1000),
        contract_name: result.contract_name,
        slug: result.slug,
        allowed_objects: result.allowed_objects,
        required_blocks: result.required_blocks,
        is_valid: result.is_valid
      };

      setContracts(prev => [...prev, created]);
      setFeedback({ type: "success", message: `Surface Contract "${contractName}" successfully created!` });
      setIsCreating(false);
      resetForm();
    } catch (err) {
      setFeedback({ type: "error", message: `Failure: ${(err as Error).message}` });
    }
  };

  const toggleObjectSelection = (id: string) => {
    if (selectedObjects.includes(id)) {
      setSelectedObjects(prev => prev.filter(x => x !== id));
    } else {
      setSelectedObjects(prev => [...prev, id]);
    }
  };

  const toggleBlockSelection = (block: string) => {
    if (requiredBlocks.includes(block)) {
      setRequiredBlocks(prev => prev.filter(x => x !== block));
    } else {
      setRequiredBlocks(prev => [...prev, block]);
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
            <h1 className="text-2xl font-extrabold text-white">Surface Contracts Builder</h1>
          </div>
        </div>
        <button
          onClick={() => {
            setIsCreating(true);
            setFeedback(null);
          }}
          className="px-4 py-2 text-xs font-bold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 transition-all shadow-lg shadow-cyan-500/10"
        >
          <Plus className="w-4 h-4" /> Build Contract
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
        {/* Contracts grid */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 space-y-4">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <Workflow className="w-5 h-5 text-cyan-400" />
              Active Web Layout Contracts
            </h3>

            <div className="grid grid-cols-1 gap-4">
              {contracts.map((con) => (
                <div key={con.id} className="p-5 rounded-xl border border-white/5 bg-slate-900/60 flex flex-col justify-between space-y-4 relative overflow-hidden">
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[9px] font-mono font-bold ${
                      con.is_valid 
                        ? "border-green-500/20 text-green-400 bg-green-950/20" 
                        : "border-red-500/20 text-red-400 bg-red-950/20"
                    }`}>
                      {con.is_valid ? <ShieldCheck className="w-3 h-3 text-green-400" /> : <ShieldAlert className="w-3 h-3 text-red-400" />}
                      {con.is_valid ? "VALID" : "UNVALIDATED"}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-bold text-white text-sm">{con.contract_name}</h4>
                    <p className="text-[10px] text-slate-500 font-mono">Slug: {con.slug}</p>
                  </div>

                  {/* Allowed objects list */}
                  <div className="space-y-1 text-xs">
                    <span className="block font-mono text-[9px] text-slate-500 uppercase">Allowed Presentation Objects</span>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {con.allowed_objects.map(objId => {
                        const obj = objects.find(o => o.id === objId);
                        return (
                          <span key={objId} className="px-2 py-0.5 rounded bg-slate-950 border border-white/5 font-mono text-[10px] text-slate-300">
                            {obj ? obj.object_name : objId}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Required blocks */}
                  <div className="space-y-1 text-xs">
                    <span className="block font-mono text-[9px] text-slate-500 uppercase">Required Visual Section Blocks</span>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {con.required_blocks.map(b => (
                        <span key={b} className="px-2.5 py-0.5 rounded-full border border-purple-500/20 text-purple-400 bg-purple-950/20 font-mono text-[9px] uppercase font-bold">
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end border-t border-white/5 pt-3">
                    <Link
                      href={`/${workspaceSlug}/surfaces/${con.id}`}
                      className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      Audit Contract Gates <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Builder Panel */}
        <div>
          {isCreating ? (
            <form onSubmit={handleCreate} className="p-6 rounded-2xl border border-white/10 bg-slate-950/40 space-y-4">
              <h3 className="font-bold text-sm text-slate-200">Build Surface Contract</h3>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400">Contract Name</label>
                <input
                  type="text"
                  value={contractName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-900 text-slate-100 text-xs font-semibold"
                  placeholder="e.g. Skin Elasticity spec details"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400">Contract Slug (Auto-generated)</label>
                <input
                  type="text"
                  value={slug}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-900/60 text-slate-400 text-xs font-mono cursor-not-allowed"
                  readOnly
                />
              </div>

              {/* Select objects */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400">Allowed Representation Objects</label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto border border-white/5 rounded-lg p-2 bg-slate-900">
                  {objects.map(obj => (
                    <label key={obj.id} className="flex items-center gap-2 p-1.5 hover:bg-white/5 rounded text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedObjects.includes(obj.id)}
                        onChange={() => toggleObjectSelection(obj.id)}
                        className="rounded border-white/10 text-cyan-500 focus:ring-0 bg-slate-950"
                      />
                      <span className="truncate">{obj.object_name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Select required blocks */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400">Required Visual Sections</label>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={requiredBlocks.includes("clinical_evidence")}
                      onChange={() => toggleBlockSelection("clinical_evidence")}
                      className="rounded border-white/10 text-cyan-500 focus:ring-0 bg-slate-950"
                    />
                    <span>Clinical Evidence Block (Factual references)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={requiredBlocks.includes("safety_boundary")}
                      onChange={() => toggleBlockSelection("safety_boundary")}
                      className="rounded border-white/10 text-cyan-500 focus:ring-0 bg-slate-950"
                    />
                    <span>Safety Boundary Block (Active disclosures)</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all text-xs text-center"
                >
                  Create Contract
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
          ) : (
            <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 space-y-4">
              <h3 className="font-bold text-sm text-slate-300 flex items-center gap-1.5">
                <Boxes className="w-4.5 h-4.5 text-cyan-400" />
                Surface Layer Contracts
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                A **Surface Contract** maps what presentation objects are allowed to be projected on a page layout, and defines what required safety sections must be rendered by the compiler.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
