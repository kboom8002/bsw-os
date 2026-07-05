"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useTranslation } from "@/lib/i18n/context";
import { createTcoConcept, generateIndustryConcepts } from "@/app/actions/semantic";
import { BENCHMARK_DOMAINS } from "@/lib/benchmark/domain-config";
import { 
  ArrowLeft, 
  BookOpen, 
  Plus, 
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  Tag,
  Star,
  Search,
  Loader2,
  Sparkles
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
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const locale = (params?.locale as string) || "ko";
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";
  const domainFromUrl = searchParams.get('domain') || '';
  const [workspaceId, setWorkspaceId] = useState<string>('');
  const [dbLoading, setDbLoading] = useState(true);
  const [concepts, setConcepts] = useState<ConceptItem[]>([]);

  // ── Industry / Brand selector state ──
  const brandFromUrl = searchParams.get('brand') || '';
  const [selectedDomain, setSelectedDomain] = useState(domainFromUrl);
  const domainConfig = selectedDomain ? BENCHMARK_DOMAINS[selectedDomain as keyof typeof BENCHMARK_DOMAINS] : undefined;
  const brands = domainConfig?.brands ?? [];
  const [selectedBrand, setSelectedBrand] = useState(brandFromUrl);

  // ── AI auto-generate state ──
  const [aiGenerating, setAiGenerating] = useState(false);

  useEffect(() => { loadFromDb(); }, [workspaceSlug]);

  const loadFromDb = async () => {
    setDbLoading(true);
    try {
      const { getSupabaseClient } = await import('@/lib/supabase');
      const supabase = getSupabaseClient();
      const { data: ws } = await supabase.from('workspaces').select('id').eq('slug', workspaceSlug).single();
      const resolvedWsId = ws?.id || '11111111-1111-1111-1111-111111111111';
      setWorkspaceId(resolvedWsId);
      const { data } = await supabase
        .from('tco_concepts')
        .select('id, concept_name, slug, definition, is_strategic')
        .eq('workspace_id', resolvedWsId)
        .order('created_at', { ascending: false });
      setConcepts(data ?? []);
    } catch (err) {
      console.error('Concepts DB 로드 실패:', err);
    } finally {
      setDbLoading(false);
    }
  };

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

    const data = { concept_name: conceptName, slug, definition, is_strategic: isStrategic };
    try {
      const result = await createTcoConcept(workspaceId, data);
      const created: ConceptItem = {
        id: result.id || "concept-" + Math.floor(Math.random() * 1000),
        concept_name: result.concept_name,
        slug: result.slug,
        definition: result.definition,
        is_strategic: result.is_strategic
      };
      setConcepts(prev => [...prev, created]);
      setFeedback({ type: "success", message: `"${conceptName}" 개념이 사전에 성공적으로 추가되었습니다.` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Unauthorized') || msg.includes('401')) {
        // 데모 모드: 로컬 상태만 업데이트
        setConcepts(prev => [...prev, {
          id: "demo-concept-" + Math.floor(Math.random() * 1000),
          concept_name: conceptName,
          slug,
          definition,
          is_strategic: isStrategic
        }]);
        setFeedback({ type: "success", message: `[데모] "${conceptName}" 개념 등록됨 (로그인 시 실제 저장)` });
      } else {
        setFeedback({ type: "error", message: `오류: ${msg}` });
      }
    }
    setIsCreating(false);
    resetForm();
  };

  // ── AI Auto-Generate Handler ──
  const handleAiGenerate = async () => {
    if (!domainConfig) return;
    setAiGenerating(true);
    setFeedback(null);

    const industryName = domainConfig.name;
    const brandObj = brands.find(b => b.slug === selectedBrand);
    const brandName = brandObj?.name;

    try {
      const result = await generateIndustryConcepts(
        workspaceId,
        industryName,
        brandName,
        domainConfig.industryType // 실측 패널 그라운딩 활성화
      );
      // Refresh the full list from DB to get accurate slugs/ids
      await loadFromDb();
      setFeedback({
        type: "success",
        message: `✅ "${industryName}"${brandName ? ` / ${brandName}` : ''} 업종 개념 ${result.created}개가 자동 생성되었습니다.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Unauthorized') || msg.includes('401') || msg.includes('UNAUTHORIZED')) {
        setFeedback({
          type: "success",
          message: `[데모] AI 개념 자동 도출 기능은 로그인 후 사용 가능합니다. 로그인하시면 "${domainConfig.name}" 업종의 핵심 개념 20개가 자동 생성됩니다.`,
        });
      } else {
        setFeedback({ type: "error", message: `AI 생성 오류: ${msg}` });
      }
    } finally {
      setAiGenerating(false);
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

      {/* ── Industry / Brand Selector + AI Generate ── */}
      <div className="p-5 rounded-2xl border border-white/5 bg-slate-950/30 space-y-4">
        <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-400" />
          업종별 AI 개념 자동 도출
        </h3>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedDomain}
            onChange={(e) => { setSelectedDomain(e.target.value); setSelectedBrand(''); }}
            className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-400"
          >
            <option value="">업종 선택...</option>
            {Object.entries(BENCHMARK_DOMAINS).map(([slug, cfg]) => (
              <option key={slug} value={slug}>{cfg.icon} {cfg.name}</option>
            ))}
          </select>

          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            disabled={!selectedDomain}
            className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <option value="">브랜드 전체 (선택사항)</option>
            {brands.map((b) => (
              <option key={b.slug} value={b.slug}>{b.name}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleAiGenerate}
          disabled={!selectedDomain || aiGenerating}
          className="w-full px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/20"
        >
          {aiGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              AI 개념 도출 중... 잠시만 기다려주세요
            </>
          ) : (
            <>
              🤖 업종 개념 AI 자동 도출
            </>
          )}
        </button>

        {!selectedDomain && (
          <p className="text-[11px] text-slate-500">
            위에서 업종을 선택하면 해당 업종에 최적화된 핵심 개념 20개를 AI가 자동으로 생성합니다.
          </p>
        )}
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-sm ${
          feedback.type === "success" 
            ? "border-green-500/20 text-green-400 bg-green-950/20" 
            : "border-red-500/20 text-red-400 bg-red-950/20"
        }`}>
          {feedback.type === "success" ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
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
              <span className="ml-auto text-[10px] font-mono text-slate-500">{concepts.length}개</span>
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

