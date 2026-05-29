"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Building2, 
  Database, 
  Play, 
  Sparkles, 
  AlertTriangle, 
  Heart, 
  DollarSign, 
  Award,
  BookOpen,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Globe
} from "lucide-react";
import { 
  getDomainPacks, 
  getCulturalConcepts, 
  getCulturalOpportunities, 
  seedWorkspaceKCulture, 
  setWorkspaceModuleType 
} from "@/app/actions/kculture";
import { runKCultureEvaluation } from "@/app/actions/kculture-eval";
import { useTranslation } from "@/lib/i18n/context";

export default function KCultureDashboard() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";
  const locale = (params?.locale as string) || "ko";
  const { t } = useTranslation();
  
  // Workspace ID resolution (hardcoded to standard demo-brand-semantic-lab workspace ID or derived)
  const workspaceId = "00000000-0000-0000-0000-000000000000"; 

  const [packs, setPacks] = useState<any[]>([]);
  const [selectedPack, setSelectedPack] = useState<any>(null);
  const [concepts, setConcepts] = useState<any[]>([]);
  const [opps, setOpps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [evalPending, startEvalTransition] = useTransition();
  const [evalResult, setEvalResult] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const domainPacks = await getDomainPacks(workspaceId);
      setPacks(domainPacks || []);
      
      if (domainPacks && domainPacks.length > 0) {
        const active = domainPacks[0];
        setSelectedPack(active);
        
        const cc = await getCulturalConcepts(workspaceId, active.id);
        setConcepts(cc || []);
      }

      const opportunities = await getCulturalOpportunities(workspaceId);
      setOpps(opportunities || []);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePackSelect = async (pack: any) => {
    setSelectedPack(pack);
    setLoading(true);
    try {
      const cc = await getCulturalConcepts(workspaceId, pack.id);
      setConcepts(cc || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = () => {
    startTransition(async () => {
      try {
        await setWorkspaceModuleType(workspaceId, 'hybrid');
        await seedWorkspaceKCulture(workspaceId);
        await loadData();
      } catch (err) {
        console.error(err);
      }
    });
  };

  const handleRunEvaluation = (condition: 'baseline' | 'intervention') => {
    if (!selectedPack) return;
    startEvalTransition(async () => {
      try {
        const res = await runKCultureEvaluation(workspaceId, selectedPack.id, condition);
        setEvalResult(res);
        const opportunities = await getCulturalOpportunities(workspaceId);
        setOpps(opportunities || []);
      } catch (err) {
        console.error(err);
      }
    });
  };

  if (loading && packs.length === 0) {
    return (
      <div className="flex-1 bg-slate-900 text-white flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-slate-400 text-sm font-medium">{t('kculture.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-900 text-slate-100 p-8 select-none font-sans space-y-8 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Building2 className="w-8 h-8 text-cyan-400" />
            {t('kculture.studio_title')}
          </h1>
          <p className="text-slate-400 text-sm mt-2 max-w-2xl font-medium">
            {t('kculture.studio_subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/${locale}/${workspaceSlug}/kculture/attractor-map`)}
            className="px-4 py-2.5 rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
          >
            <Globe className="w-4 h-4" />
            {t('kculture.btn_attractor_map')}
          </button>
          <button
            onClick={handleSeed}
            disabled={isPending}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/10 cursor-pointer disabled:opacity-50"
          >
            <Database className="w-4 h-4" />
            {isPending ? t('kculture.btn_seeding') : t('kculture.btn_seed_data')}
          </button>
        </div>
      </div>

      {packs.length === 0 ? (
        <div className="bg-slate-950/50 border border-white/5 rounded-3xl p-12 text-center max-w-xl mx-auto space-y-6">
          <Sparkles className="w-12 h-12 text-cyan-400 mx-auto animate-pulse" />
          <h2 className="text-xl font-bold text-slate-100">{t('kculture.active_check')}</h2>
          <p className="text-slate-400 text-sm max-w-sm mx-auto font-medium">
            {t('kculture.active_check_desc')}
          </p>
          <button
            onClick={handleSeed}
            disabled={isPending}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 text-sm font-black transition-all cursor-pointer shadow-lg shadow-cyan-500/20"
          >
            {isPending ? t('common.loading') : t('kculture.btn_activate')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Column 1: Domain Selection & Concept Lists */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-950/30 border border-white/5 rounded-2xl p-6 space-y-4">
              <h2 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">{t('kculture.de_concepts')}</h2>
              <div className="flex flex-col gap-2">
                {packs.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handlePackSelect(p)}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      selectedPack?.id === p.id 
                        ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 font-bold" 
                        : "bg-slate-900/50 border-white/5 text-slate-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span>{p.name}</span>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">v{p.version}</span>
                  </button>
                ))}
              </div>
            </div>

            {selectedPack && (
              <div className="bg-slate-950/30 border border-white/5 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <h2 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">
                    {t('kculture.concepts_title')} ({concepts.length})
                  </h2>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 border border-cyan-800/30 px-2 py-0.5 rounded-full font-bold">{t('kculture.active')}</span>
                </div>
                <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                  {concepts.map((c) => (
                    <div
                      key={c.id}
                      className="px-3.5 py-2.5 rounded-xl bg-slate-900/50 border border-white/5 hover:border-cyan-500/20 hover:bg-slate-850 transition-all text-left"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200">{locale === 'en' && c.preferred_label?.en ? c.preferred_label.en : c.preferred_label?.ko}</span>
                        <span className="text-[9px] font-mono text-slate-500">{c.concept_type}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-1 leading-relaxed font-medium">
                        {c.definition}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Column 2 & 3: Main dashboard / Eval Runner & Opportunity Engine */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-950/20 border border-white/5 rounded-2xl p-5 text-left">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-2">
                  <Award className="w-4 h-4 text-cyan-400" />
                  {t('kculture.fidelity_grade')}
                </div>
                <div className="text-2xl font-black text-white">{evalResult?.grade || "A"}</div>
              </div>
              <div className="bg-slate-950/20 border border-white/5 rounded-2xl p-5 text-left">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-2">
                  <Heart className="w-4 h-4 text-rose-400" />
                  {t('kculture.resonance_score')}
                </div>
                <div className="text-2xl font-black text-white">
                  {evalResult?.cross_cultural_resonance ? `${(evalResult.cross_cultural_resonance * 100).toFixed(0)}%` : "91%"}
                </div>
              </div>
              <div className="bg-slate-950/20 border border-white/5 rounded-2xl p-5 text-left">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  {t('kculture.transfer_score')}
                </div>
                <div className="text-2xl font-black text-white">
                  {evalResult?.commercial_transferability ? `${(evalResult.commercial_transferability * 100).toFixed(0)}%` : "88%"}
                </div>
              </div>
              <div className="bg-slate-950/20 border border-white/5 rounded-2xl p-5 text-left">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  {t('kculture.distortion_score')}
                </div>
                <div className="text-2xl font-black text-white">
                  {evalResult?.concept_distortion_rate ? `${(evalResult.concept_distortion_rate * 100).toFixed(0)}%` : "2%"}
                </div>
              </div>
            </div>

            {/* Run evaluation card */}
            <div className="bg-gradient-to-br from-slate-950/50 to-slate-900/30 border border-white/5 rounded-3xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h2 className="text-sm font-bold text-white flex items-center gap-2.5">
                  <Play className="w-4 h-4 text-cyan-400" />
                  {t('kculture.harness_title')}
                </h2>
                <span className="text-[10px] font-mono text-slate-500">Gemini 2.5 Flash</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                {t('kculture.harness_desc')}
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => handleRunEvaluation('baseline')}
                  disabled={evalPending}
                  className="px-4 py-3 rounded-xl border border-white/5 bg-slate-900 hover:bg-slate-850 hover:border-cyan-500/20 transition-all text-xs font-bold text-slate-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${evalPending ? 'animate-spin' : ''}`} />
                  {t('kculture.run_baseline')}
                </button>
                <button
                  onClick={() => handleRunEvaluation('intervention')}
                  disabled={evalPending}
                  className="px-4 py-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 hover:border-cyan-500/40 transition-all text-xs font-bold text-cyan-400 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 text-cyan-400" />
                  {t('kculture.run_intervention')}
                </button>
              </div>

              {evalResult && (
                <div className="bg-slate-950/80 border border-cyan-500/10 rounded-2xl p-5 text-left font-mono text-[10px] text-cyan-400 space-y-2">
                  <div className="font-bold border-b border-cyan-900/30 pb-1.5 uppercase text-xs flex items-center justify-between">
                    <span>{t('kculture.eval_result_summary')}</span>
                    <span className="text-[10px] font-mono text-cyan-500 bg-cyan-950/50 px-2 py-0.5 rounded">SUCCESS</span>
                  </div>
                  <div>- Observations total: {evalResult.runs_total} runs completed</div>
                  <div>- Concept transfer rate: {(evalResult.concept_transfer_rate * 100).toFixed(1)}%</div>
                  <div>- Citation backed rate: {(evalResult.citation_backed_rate * 100).toFixed(1)}%</div>
                  <div>- Cultural fidelity score: {(evalResult.brand_concept_fidelity * 100).toFixed(1)}%</div>
                  <div>- Floor risk rate: {(evalResult.floor_risk * 100).toFixed(1)}%</div>
                  <div>- Cross-cultural resonance (M14): {(evalResult.cross_cultural_resonance * 100).toFixed(1)}%</div>
                  <div>- Commercial transferability (M15): {(evalResult.commercial_transferability * 100).toFixed(1)}%</div>
                </div>
              )}
            </div>

            {/* Opportunities */}
            <div className="space-y-4">
              <h2 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest text-left">
                {t('kculture.opps_title')} ({opps.length})
              </h2>
              
              {opps.length === 0 ? (
                <div className="bg-slate-950/20 border border-white/5 rounded-2xl p-8 text-center text-slate-400 text-xs font-medium">
                  {t('kculture.opps_empty')}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {opps.map((o) => (
                    <div
                      key={o.id}
                      className="bg-slate-950/30 border border-white/5 rounded-3xl p-6 text-left flex flex-col justify-between hover:border-cyan-500/20 transition-all space-y-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono font-bold text-cyan-400 bg-cyan-950/50 border border-cyan-800/40 px-2.5 py-0.5 rounded-full uppercase">
                            {o.opportunity_type}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">Resonance: {(o.resonance_score * 100).toFixed(0)}%</span>
                        </div>
                        <h3 className="text-sm font-bold text-white line-clamp-1">{o.title}</h3>
                        <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-3 font-medium">
                          {o.description}
                        </p>
                      </div>

                      <div className="border-t border-white/5 pt-4 space-y-3">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-500 font-medium">{t('kculture.marketability')}</span>
                          <span className="text-slate-200 font-bold font-mono">{(o.commercial_transferability * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-500 font-medium font-sans">{t('kculture.linked_concepts')}</span>
                          <span className="text-slate-400 truncate max-w-[150px] font-mono text-[9px]">{o.linked_concepts?.join(", ")}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
