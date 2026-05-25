"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  createCanonicalQuestion, 
  mergeCanonicalQuestions 
} from "@/app/actions/semantic";
import { 
  ArrowLeft, 
  HelpCircle, 
  Plus, 
  GitMerge, 
  Fingerprint,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Search
} from "lucide-react";

interface CanonicalQuestion {
  id: string;
  normalized_question: string;
  slug: string;
  signature: string;
  question_capital_node_id: string | null;
}

export default function CanonicalQuestionsPage() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";
  const mockWorkspaceId = "11111111-1111-1111-1111-111111111111";

  const [questions, setQuestions] = useState<CanonicalQuestion[]>([
    { id: "cq-1", normalized_question: "Is niacinamide safe for inflamed skin barriers?", slug: "is-niacinamide-safe-for-inflamed-skin-barriers", signature: "7b0a6493e829dc74", question_capital_node_id: "cap-2" },
    { id: "cq-2", normalized_question: "What is the recommended daily dosage of niacinamide?", slug: "what-is-the-recommended-daily-dosage-of-niacinamide", signature: "fa081e72bc19a3b2", question_capital_node_id: "cap-2" },
    { id: "cq-3", normalized_question: "Are luxury skincare ingredients clinically tested?", slug: "are-luxury-skincare-ingredients-clinically-tested", signature: "ce02c815de58b11a", question_capital_node_id: "cap-1" },
    { id: "cq-4", normalized_question: "Is vitamin B3 safe for irritated facial tissue?", slug: "is-vitamin-b3-safe-for-irritated-facial-tissue", signature: "7b0a6493e829dc74", question_capital_node_id: "cap-2" } // Duplicate signature to simulate deduplication action
  ]);

  const [isCreating, setIsCreating] = useState(false);
  const [normalizedQuestion, setNormalizedQuestion] = useState("");
  const [slug, setSlug] = useState("");
  const [signature, setSignature] = useState("");
  
  // Merge state
  const [isMerging, setIsMerging] = useState(false);
  const [targetCqId, setTargetCqId] = useState("");
  const [sourceCqIds, setSourceCqIds] = useState<string[]>([]);

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const resetForm = () => {
    setNormalizedQuestion("");
    setSlug("");
    setSignature("");
    setFeedback(null);
  };

  const handleQuestionChange = (val: string) => {
    setNormalizedQuestion(val);
    const generatedSlug = val.toLowerCase()
      .replace(/[^a-z0-9\s?]+/g, "")
      .replace(/\s+/g, "-")
      .replace(/\?$/, "")
      .replace(/(^-|-$)/g, "");
    setSlug(generatedSlug);

    // Simple deterministic mock hash for unique signature
    let hash = 0;
    for (let i = 0; i < val.length; i++) {
      hash = (hash << 5) - hash + val.charCodeAt(i);
      hash = hash & hash;
    }
    setSignature(Math.abs(hash).toString(16).padStart(16, "0").substring(0, 16));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!normalizedQuestion.trim() || !slug.trim()) return;

    try {
      const data = {
        normalized_question: normalizedQuestion,
        slug,
        signature,
        question_capital_node_id: null
      };

      const result = await createCanonicalQuestion(mockWorkspaceId, data);
      
      const created: CanonicalQuestion = {
        id: result.id || "cq-" + Math.floor(Math.random() * 1000),
        normalized_question: result.normalized_question,
        slug: result.slug,
        signature: result.signature,
        question_capital_node_id: result.question_capital_node_id
      };

      setQuestions(prev => [...prev, created]);
      setFeedback({ type: "success", message: "Canonical Question successfully registered with semantic unique signature!" });
      setIsCreating(false);
      resetForm();
    } catch (err) {
      setFeedback({ type: "error", message: `Failure: ${(err as Error).message}` });
    }
  };

  const handleMerge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCqId || sourceCqIds.length === 0) return;

    try {
      const result = await mergeCanonicalQuestions(mockWorkspaceId, targetCqId, sourceCqIds);
      
      // Update local state by removing merged sources
      setQuestions(prev => prev.filter(q => !sourceCqIds.includes(q.id)));
      
      setFeedback({ 
        type: "success", 
        message: `Deduplication Success: Merged ${result.mergedCount} redundant signatures into Target CQ!` 
      });
      setIsMerging(false);
      setTargetCqId("");
      setSourceCqIds([]);
    } catch (err) {
      setFeedback({ type: "error", message: `Failure: ${(err as Error).message}` });
    }
  };

  const toggleSourceSelection = (id: string) => {
    if (sourceCqIds.includes(id)) {
      setSourceCqIds(prev => prev.filter(x => x !== id));
    } else {
      setSourceCqIds(prev => [...prev, id]);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-5xl w-full mx-auto text-slate-100 bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="flex items-center gap-4">
          <Link 
            href={`/${workspaceSlug}/semantic-core`}
            className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="text-xs text-cyan-400 font-mono">Semantic Core Studio</div>
            <h1 className="text-2xl font-extrabold text-white">Canonical Questions Registry</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsMerging(true);
              setIsCreating(false);
              setFeedback(null);
            }}
            className="px-4 py-2 text-xs font-bold rounded-xl border border-purple-500/20 text-purple-400 hover:bg-purple-950/20 bg-purple-950/10 flex items-center gap-1.5 transition-all"
          >
            <GitMerge className="w-4 h-4" /> Merge Deduplication
          </button>
          <button
            onClick={() => {
              setIsCreating(true);
              setIsMerging(false);
              resetForm();
            }}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 transition-all shadow-lg shadow-cyan-500/10"
          >
            <Plus className="w-4 h-4" /> Add CQ Signature
          </button>
        </div>
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
        {/* CQ Signatures Grid */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 space-y-4">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-400" />
              Stable Canonical Questions
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {questions.map((cq) => (
                <div key={cq.id} className="p-4 rounded-xl border border-white/5 bg-slate-900/60 flex flex-col justify-between space-y-3 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 font-mono text-[9px] text-cyan-400 flex items-center gap-1 bg-cyan-950/40 border-l border-b border-white/5 rounded-bl-lg">
                    <Fingerprint className="w-3 h-3" />
                    {cq.signature}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs leading-normal pr-16">{cq.normalized_question}</h4>
                    <p className="text-[10px] text-slate-500 font-mono mt-1.5">slug: {cq.slug}</p>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                    <span>Deduplicated stable identity</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Context Panels */}
        <div>
          {isCreating && (
            <form onSubmit={handleCreate} className="p-6 rounded-2xl border border-white/10 bg-slate-950/40 space-y-5">
              <h3 className="font-bold text-sm text-slate-200">Register CQ Signature</h3>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400">Normalized Question Phrase</label>
                <input
                  type="text"
                  value={normalizedQuestion}
                  onChange={(e) => handleQuestionChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs font-semibold"
                  placeholder="e.g. Is niacinamide safe for skin?"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400">Normalized Slug (Auto-generated)</label>
                <input
                  type="text"
                  value={slug}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-900/60 text-slate-400 focus:outline-none text-xs font-mono cursor-not-allowed"
                  readOnly
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400">Semantic Signature Hash</label>
                <div className="w-full px-3 py-2 rounded-lg border border-white/5 bg-slate-950 text-cyan-400 font-mono text-xs select-all flex items-center gap-1.5">
                  <Fingerprint className="w-3.5 h-3.5" />
                  {signature || "awaiting input..."}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all text-xs text-center"
                >
                  Create Signature
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

          {isMerging && (
            <form onSubmit={handleMerge} className="p-6 rounded-2xl border border-purple-500/20 bg-slate-950/40 space-y-5">
              <h3 className="font-bold text-sm text-slate-200 flex items-center gap-1.5">
                <GitMerge className="w-4 h-4 text-purple-400" />
                Merge & Deduplicate CQs
              </h3>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400">Target CQ (Stable Identity)</label>
                <select
                  value={targetCqId}
                  onChange={(e) => setTargetCqId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-900 text-slate-200 focus:outline-none text-xs font-semibold"
                  required
                >
                  <option value="">-- Select Target CQ --</option>
                  {questions.map(q => (
                    <option key={q.id} value={q.id}>{q.normalized_question.substring(0, 40)}...</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400">Select Redundant CQs to Merge</label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto border border-white/5 rounded-lg p-2 bg-slate-900">
                  {questions.filter(q => q.id !== targetCqId).map(q => (
                    <label key={q.id} className="flex items-center gap-2 p-1.5 hover:bg-white/5 rounded text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sourceCqIds.includes(q.id)}
                        onChange={() => toggleSourceSelection(q.id)}
                        className="rounded border-white/10 text-purple-500 focus:ring-0 bg-slate-950"
                      />
                      <span className="truncate">{q.normalized_question}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={!targetCqId || sourceCqIds.length === 0}
                  className="flex-1 px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold transition-all text-xs text-center disabled:opacity-50"
                >
                  Execute Merge
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMerging(false);
                    setTargetCqId("");
                    setSourceCqIds([]);
                  }}
                  className="px-4 py-2 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {!isCreating && !isMerging && (
            <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 space-y-4">
              <h3 className="font-bold text-sm text-slate-300 flex items-center gap-1.5">
                <Search className="w-4 h-4 text-cyan-400" />
                Query Deduplication
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                By grouping organic query signals under a unique **Canonical Question Signature**, BSW-OS avoids duplicating content assets and maps intent contexts in a single, stable location.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
