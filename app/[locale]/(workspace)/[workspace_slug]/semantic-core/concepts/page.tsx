"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslation } from "@/lib/i18n/context";
import { createTcoConcept } from "@/app/actions/semantic";
import { 
  ArrowLeft, 
  BookOpen, 
  Plus, 
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  Tag,
  Star,
  Search
} from "lucide-react";

interface ConceptItem {
  id: string;
  concept_name: string;
  slug: string;
  definition: string;
  is_strategic: boolean;
}

export default function ConceptsPage() {
  const params = useParams();
  const { t } = useTranslation();
  const locale = (params?.locale as string) || "ko";
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";
  const mockWorkspaceId = "11111111-1111-1111-1111-111111111111";

  const [concepts, setConcepts] = useState<ConceptItem[]>([
    {
      id: "concept-1",
      concept_name: "Active Niacinamide Complex",
      slug: "active-niacinamide-complex",
      definition: "A premium clinical active consisting of 5% pure niacinamide blended with zinc PCA, optimized for damaged epidermal skin barrier repair.",
      is_strategic: true
    },
    {
      id: "concept-2",
      concept_name: "Epidermal Moisture Seal",
      slug: "epidermal-moisture-seal",
      definition: "A localized surface stratum corneum lipid layer composed of ceramides and hyaluronic acid to prevent transepidermal water loss.",
      is_strategic: true
    },
    {
      id: "concept-3",
      concept_name: "Zero-Waste Sandwich Prep",
      slug: "zero-waste-sandwich-prep",
      definition: "An operational kitchen assembly standard that maps exact vegetable cuttings and slice allocations to eliminate waste streams.",
      is_strategic: false
    }
  ]);

  const [isCreating, setIsCreating] = useState(false);
  const [conceptName, setConceptName] = useState("");
  const [slug, setSlug] = useState("");
  const [definition, setDefinition] = useState("");
  const [isStrategic, setIsStrategic] = useState(false);

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const resetForm = () => {
    setConceptName("");
    setSlug("");
    setDefinition("");
    setIsStrategic(false);
    setFeedback(null);
  };

  const handleNameChange = (val: string) => {
    setConceptName(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conceptName.trim() || !definition.trim()) return;

    try {
      const data = {
        concept_name: conceptName,
        slug,
        definition,
        is_strategic: isStrategic
      };

      const result = await createTcoConcept(mockWorkspaceId, data);
      
      const created: ConceptItem = {
        id: result.id || "concept-" + Math.floor(Math.random() * 1000),
        concept_name: result.concept_name,
        slug: result.slug,
        definition: result.definition,
        is_strategic: result.is_strategic
      };

      setConcepts(prev => [...prev, created]);
      setFeedback({ type: "success", message: `Concept "${conceptName}" successfully added to dictionary!` });
      setIsCreating(false);
      resetForm();
    } catch (err) {
      setFeedback({ type: "error", message: `Failure: ${(err as Error).message}` });
    }
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
            <h1 className="text-2xl font-extrabold text-white">{t('semantic_core.concepts_page_title')}</h1>
          </div>
        </div>
        <button
          onClick={() => {
            setIsCreating(true);
            setFeedback(null);
          }}
          className="px-4 py-2 text-xs font-bold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 transition-all shadow-lg shadow-cyan-500/10"
        >
          <Plus className="w-4 h-4" /> {t('semantic_core.concepts_define')}
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
        {/* Dictionary list */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 space-y-4">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              {t('semantic_core.concepts_active_dictionary')}
            </h3>

            <div className="space-y-4">
              {concepts.map((concept) => (
                <div key={concept.id} className="p-5 rounded-xl border border-white/5 bg-slate-900/60 flex flex-col justify-between space-y-3 relative overflow-hidden">
                  {concept.is_strategic && (
                    <div className="absolute top-4 right-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-yellow-500/20 text-yellow-400 bg-yellow-950/20 text-[10px] font-bold font-mono">
                        <Star className="w-3 h-3 fill-yellow-400/20" /> STRATEGIC
                      </span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-cyan-400" />
                      {concept.concept_name}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-mono">slug: {concept.slug}</p>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed pr-24">{concept.definition}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic creation panel */}
        <div>
          {isCreating ? (
            <form onSubmit={handleCreate} className="p-6 rounded-2xl border border-white/10 bg-slate-950/40 space-y-4">
              <h3 className="font-bold text-sm text-slate-200">{t('semantic_core.concepts_add_definition')}</h3>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400">{t('semantic_core.concepts_concept_name')}</label>
                <input
                  type="text"
                  value={conceptName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs font-semibold"
                  placeholder="e.g. Zinc PCA Stabilizer"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400">{t('semantic_core.concepts_slug')}</label>
                <input
                  type="text"
                  value={slug}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-900/60 text-slate-400 focus:outline-none text-xs font-mono cursor-not-allowed"
                  readOnly
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400">{t('semantic_core.concepts_formal_definition')}</label>
                <textarea
                  value={definition}
                  onChange={(e) => setDefinition(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs font-semibold h-28 resize-none"
                  placeholder="Provide precise regulatory or brand-truth standard definition of this operational concept..."
                  required
                />
              </div>

              <div className="flex items-center gap-2 p-1 pt-1.5">
                <input
                  type="checkbox"
                  id="is_strategic"
                  checked={isStrategic}
                  onChange={(e) => setIsStrategic(e.target.checked)}
                  className="rounded border-white/10 text-cyan-500 focus:ring-0 bg-slate-950"
                />
                <label htmlFor="is_strategic" className="text-xs text-slate-300 font-bold select-none cursor-pointer flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-yellow-400" />
                  {t('semantic_core.concepts_flag_strategic')}
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all text-xs text-center"
                >
                  {t('semantic_core.concepts_save')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    resetForm();
                  }}
                  className="px-4 py-2 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all text-xs"
                >
                  {t('semantic_core.btn_cancel')}
                </button>
              </div>
            </form>
          ) : (
            <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 space-y-4">
              <h3 className="font-bold text-sm text-slate-300 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                {t('semantic_core.concepts_operational_dictionaries')}
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                {t('semantic_core.concepts_operational_dictionaries_desc')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
