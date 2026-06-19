"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslation } from "@/lib/i18n/context";
import { 
  createQuestionCapitalNode, 
  updateQuestionCapitalNode 
} from "@/app/actions/semantic";
import { 
  ArrowLeft, 
  Boxes, 
  Plus, 
  Edit3, 
  GitMerge, 
  HelpCircle, 
  TrendingUp, 
  CheckCircle,
  AlertTriangle
} from "lucide-react";

interface CapitalNode {
  id: string;
  title: string;
  slug: string;
  strategic_weight: number;
  parent_id: string | null;
}

export default function QuestionCapitalPage() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";
  const locale = (params?.locale as string) || "ko";
  const { t } = useTranslation();
  const mockWorkspaceId = "11111111-1111-1111-1111-111111111111";

  const [nodes, setNodes] = useState<CapitalNode[]>([
    { id: "cap-1", title: "Organic Skincare Ingredients", slug: "organic-skincare-ingredients", strategic_weight: 80, parent_id: null },
    { id: "cap-2", title: "Niacinamide Safety Guidelines", slug: "niacinamide-safety-guidelines", strategic_weight: 95, parent_id: "cap-1" },
    { id: "cap-3", title: "Hyaluronic Acid Efficacy", slug: "hyaluronic-acid-efficacy", strategic_weight: 60, parent_id: "cap-1" },
    { id: "cap-4", title: "Convenience Food Retail Trends", slug: "convenience-food-retail-trends", strategic_weight: 45, parent_id: null }
  ]);

  const [isCreating, setIsCreating] = useState(false);
  const [editingNode, setEditingNode] = useState<CapitalNode | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [weight, setWeight] = useState(50);
  const [parentId, setParentId] = useState("");

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const resetForm = () => {
    setTitle("");
    setSlug("");
    setWeight(50);
    setParentId("");
    setFeedback(null);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) return;

    try {
      const newNodeData = {
        title,
        slug,
        strategic_weight: Number(weight),
        parent_id: parentId || null
      };

      // Trigger the secure server action
      const result = await createQuestionCapitalNode(mockWorkspaceId, newNodeData);

      const created: CapitalNode = {
        id: result.id || "cap-" + Math.floor(Math.random() * 1000),
        title: result.title,
        slug: result.slug,
        strategic_weight: result.strategic_weight,
        parent_id: result.parent_id
      };

      setNodes(prev => [...prev, created]);
      setFeedback({ type: "success", message: `Territory "${title}" successfully registered in Question Capital.` });
      setIsCreating(false);
      resetForm();
    } catch (err) {
      setFeedback({ type: "error", message: `Failure: ${(err as Error).message}` });
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNode || !title.trim() || !slug.trim()) return;

    try {
      const updatedData = {
        title,
        slug,
        strategic_weight: Number(weight),
        parent_id: parentId || null
      };

      // Trigger server action
      const result = await updateQuestionCapitalNode(mockWorkspaceId, editingNode.id, updatedData);

      setNodes(prev => prev.map(n => n.id === editingNode.id ? {
        ...n,
        title: result.title,
        slug: result.slug,
        strategic_weight: result.strategic_weight,
        parent_id: result.parent_id
      } : n));

      setFeedback({ type: "success", message: `Territory "${title}" successfully updated.` });
      setEditingNode(null);
      resetForm();
    } catch (err) {
      setFeedback({ type: "error", message: `Failure: ${(err as Error).message}` });
    }
  };

  const startEdit = (node: CapitalNode) => {
    setEditingNode(node);
    setTitle(node.title);
    setSlug(node.slug);
    setWeight(node.strategic_weight);
    setParentId(node.parent_id || "");
    setIsCreating(false);
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-5xl w-full mx-auto text-slate-100 bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="flex items-center gap-4">
          <Link 
            href={`/${locale}/${workspaceSlug}/semantic-core`}
            className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="text-xs text-cyan-400 font-mono">{t('semantic_core.studio_title')}</div>
            <h1 className="text-2xl font-extrabold text-white">{t('semantic_core.capital_page_title')}</h1>
          </div>
        </div>
        <button
          onClick={() => {
            setIsCreating(true);
            setEditingNode(null);
            resetForm();
          }}
          className="px-4 py-2 text-xs font-bold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 transition-all shadow-lg shadow-cyan-500/10"
        >
          <Plus className="w-4 h-4" /> Define Territory
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
        {/* List of Capital Nodes */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 space-y-4">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <Boxes className="w-5 h-5 text-purple-400" />
              Strategic Territory Nodes Tree
            </h3>

            <div className="divide-y divide-white/5 border border-white/5 rounded-xl overflow-hidden bg-slate-900/60">
              {nodes.filter(n => !n.parent_id).map(parent => (
                <div key={parent.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-bold text-white flex items-center gap-2 text-sm">
                        <span className="w-2 h-2 rounded-full bg-purple-500" />
                        {parent.title}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono pl-4 mt-0.5">slug: {parent.slug}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono px-2 py-0.5 rounded-full border border-purple-500/20 text-purple-400 bg-purple-950/20">
                        Weight: {parent.strategic_weight}%
                      </span>
                      <button
                        onClick={() => startEdit(parent)}
                        className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Child nodes */}
                  <div className="pl-6 space-y-2 border-l border-white/10 ml-5">
                    {nodes.filter(child => child.parent_id === parent.id).map(child => (
                      <div key={child.id} className="flex items-center justify-between gap-4 bg-slate-950/20 p-2.5 rounded-lg">
                        <div>
                          <div className="font-semibold text-slate-300 text-xs flex items-center gap-1.5">
                            <GitMerge className="w-3 h-3 text-slate-500" />
                            {child.title}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono pl-4 mt-0.5">slug: {child.slug}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full border border-slate-700 text-slate-400 bg-slate-800">
                            Weight: {child.strategic_weight}%
                          </span>
                          <button
                            onClick={() => startEdit(child)}
                            className="p-1 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Editor Form Panel */}
        <div>
          {(isCreating || editingNode) ? (
            <form 
              onSubmit={isCreating ? handleCreate : handleUpdate}
              className="p-6 rounded-2xl border border-white/10 bg-slate-950/40 space-y-5"
            >
              <h3 className="font-bold text-sm text-slate-200">
                {isCreating ? "Define New Territory Node" : `Edit Node: ${editingNode?.title}`}
              </h3>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400">Territory Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs font-semibold"
                  placeholder="e.g. Skin Elasticity and Aging"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400">Territory Slug (Auto-generated)</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-900/60 text-slate-400 focus:outline-none text-xs font-mono cursor-not-allowed"
                  placeholder="skin-elasticity-and-aging"
                  readOnly
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400">Strategic Ownership Weight ({weight}%)</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400">Parent Territory (Optional)</label>
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-900 text-slate-200 focus:outline-none text-xs font-semibold"
                >
                  <option value="">-- No Parent (Root Level Node) --</option>
                  {nodes.filter(n => !n.parent_id && n.id !== editingNode?.id).map(parent => (
                    <option key={parent.id} value={parent.id}>{parent.title}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all text-xs text-center"
                >
                  {isCreating ? "Register Territory" : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingNode(null);
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
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                Strategic Weight System
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                BSW-OS maps Search spaces as capital assets. Allocating higher weights flags these spaces for premium AI agent coverage, rigorous claim verification checks, and proactive search-crawling.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
