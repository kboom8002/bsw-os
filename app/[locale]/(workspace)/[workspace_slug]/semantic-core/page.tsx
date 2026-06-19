"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  Building2, 
  Activity, 
  HelpCircle, 
  Layers, 
  Eye, 
  FileText, 
  ArrowRight,
  Database,
  CheckCircle,
  Cpu,
  Boxes,
  Network,
  Lock
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import { BENCHMARK_DOMAINS } from "@/lib/benchmark/domain-config";

export default function SemanticCoreDashboard() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";
  const locale = (params?.locale as string) || "ko";
  const { t } = useTranslation();

  const [selectedDomain, setSelectedDomain] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');

  const domainConfig = selectedDomain ? BENCHMARK_DOMAINS[selectedDomain] : undefined;
  const brands = domainConfig?.brands ?? [];

  const buildHref = (subPath: string) => {
    const base = `/${locale}/${workspaceSlug}/semantic-core/${subPath}`;
    if (selectedDomain || selectedBrand) {
      const qp = new URLSearchParams();
      if (selectedDomain) qp.set('domain', selectedDomain);
      if (selectedBrand) qp.set('brand', selectedBrand);
      return `${base}?${qp.toString()}`;
    }
    return base;
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-6xl w-full mx-auto text-slate-100 bg-slate-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="text-xs text-cyan-400 font-mono font-bold tracking-wider uppercase mb-1">
            {t('semantic_core.studio_module')}
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
            {t('semantic_core.studio_title')}
          </h1>
          <p className="text-slate-400 text-sm">
            {t('semantic_core.studio_desc')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={buildHref('claims')}
            className="px-4 py-2 text-sm font-bold rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 shadow-md shadow-cyan-400/10 transition-all flex items-center gap-2"
          >
            <Lock className="w-4 h-4" />
            {t('semantic_core.btn_lineage_gate')}
          </Link>
        </div>
      </div>

      {/* Domain / Brand Selector */}
      <div className="flex flex-col sm:flex-row gap-4">
        <select
          value={selectedDomain}
          onChange={(e) => { setSelectedDomain(e.target.value); setSelectedBrand(''); }}
          className="px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-400"
        >
          <option value="">{t('semantic_core.all_domains')}</option>
          {Object.entries(BENCHMARK_DOMAINS).map(([slug, cfg]) => (
            <option key={slug} value={slug}>{cfg.icon} {cfg.name}</option>
          ))}
        </select>

        <select
          value={selectedBrand}
          onChange={(e) => setSelectedBrand(e.target.value)}
          disabled={!selectedDomain}
          className="px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-400 disabled:opacity-40"
        >
          <option value="">{t('semantic_core.all_brands')}</option>
          {brands.map((b) => (
            <option key={b.slug} value={b.slug}>{b.name}</option>
          ))}
        </select>
      </div>

      {/* Semantic layers visual tree overview */}
      <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/40 space-y-4">
        <h3 className="font-bold text-sm text-slate-200">{t('semantic_core.architecture_title')}</h3>
        <p className="text-slate-400 text-xs leading-relaxed max-w-2xl">
          {t('semantic_core.architecture_desc')}
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Layer 1 */}
          <div className="p-4 rounded-xl border border-white/5 bg-slate-900/60 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-cyan-400" />
            <div className="font-mono text-[10px] text-cyan-400 uppercase mb-1">{t('semantic_core.layer1_label')}</div>
            <h4 className="font-bold text-white text-sm mb-1.5">{t('semantic_core.layer1_title')}</h4>
            <p className="text-slate-500 text-[11px] leading-snug">
              {t('semantic_core.layer1_desc')}
            </p>
          </div>
          
          {/* Layer 2 */}
          <div className="p-4 rounded-xl border border-white/5 bg-slate-900/60 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-purple-400" />
            <div className="font-mono text-[10px] text-purple-400 uppercase mb-1">{t('semantic_core.layer2_label')}</div>
            <h4 className="font-bold text-white text-sm mb-1.5">{t('semantic_core.layer2_title')}</h4>
            <p className="text-slate-500 text-[11px] leading-snug">
              {t('semantic_core.layer2_desc')}
            </p>
          </div>

          {/* Layer 3 */}
          <div className="p-4 rounded-xl border border-white/5 bg-slate-900/60 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-400" />
            <div className="font-mono text-[10px] text-blue-400 uppercase mb-1">{t('semantic_core.layer3_label')}</div>
            <h4 className="font-bold text-white text-sm mb-1.5">{t('semantic_core.layer3_title')}</h4>
            <p className="text-slate-500 text-[11px] leading-snug">
              {t('semantic_core.layer3_desc')}
            </p>
          </div>
        </div>
      </div>

      {/* Primary Module Shortcuts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Signals */}
        <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 hover:border-white/10 transition-all flex flex-col justify-between">
          <div>
            <Cpu className="w-5 h-5 text-cyan-400 mb-4" />
            <h3 className="font-bold text-sm text-white mb-1.5">{t('semantic_core.signals_title')}</h3>
            <p className="text-slate-500 text-xs leading-normal">
              {t('semantic_core.signals_desc')}
            </p>
          </div>
          <Link
            href={buildHref('signals')}
            className="mt-6 flex items-center justify-between text-xs font-bold text-cyan-400 hover:underline"
          >
            <span>{t('semantic_core.signals_link')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Question Capital */}
        <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 hover:border-white/10 transition-all flex flex-col justify-between">
          <div>
            <Boxes className="w-5 h-5 text-purple-400 mb-4" />
            <h3 className="font-bold text-sm text-white mb-1.5">{t('semantic_core.capital_title')}</h3>
            <p className="text-slate-500 text-xs leading-normal">
              {t('semantic_core.capital_desc')}
            </p>
          </div>
          <Link
            href={buildHref('question-capital')}
            className="mt-6 flex items-center justify-between text-xs font-bold text-purple-400 hover:underline"
          >
            <span>{t('semantic_core.capital_link')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Canonical Questions */}
        <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 hover:border-white/10 transition-all flex flex-col justify-between">
          <div>
            <HelpCircle className="w-5 h-5 text-blue-400 mb-4" />
            <h3 className="font-bold text-sm text-white mb-1.5">{t('semantic_core.cq_title')}</h3>
            <p className="text-slate-500 text-xs leading-normal">
              {t('semantic_core.cq_desc')}
            </p>
          </div>
          <Link
            href={buildHref('canonical-questions')}
            className="mt-6 flex items-center justify-between text-xs font-bold text-blue-400 hover:underline"
          >
            <span>{t('semantic_core.cq_link')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* QIS Scenes */}
        <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 hover:border-white/10 transition-all flex flex-col justify-between">
          <div>
            <Eye className="w-5 h-5 text-green-400 mb-4" />
            <h3 className="font-bold text-sm text-white mb-1.5">{t('semantic_core.qis_title')}</h3>
            <p className="text-slate-500 text-xs leading-normal">
              {t('semantic_core.qis_desc')}
            </p>
          </div>
          <Link
            href={buildHref('qis')}
            className="mt-6 flex items-center justify-between text-xs font-bold text-green-400 hover:underline"
          >
            <span>{t('semantic_core.qis_link')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Advanced KG & Lineage row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* TCO Concepts */}
        <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-white mb-1.5">{t('semantic_core.concepts_title')}</h3>
            <p className="text-slate-500 text-xs leading-normal mb-4">
              {t('semantic_core.concepts_desc')}
            </p>
          </div>
          <Link
            href={buildHref('concepts')}
            className="flex items-center justify-between text-xs font-bold text-cyan-400 hover:underline"
          >
            <span>{t('semantic_core.concepts_link')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Ontology KG */}
        <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-white mb-1.5">{t('semantic_core.kg_title')}</h3>
            <p className="text-slate-500 text-xs leading-normal mb-4">
              {t('semantic_core.kg_desc')}
            </p>
          </div>
          <Link
            href={buildHref('kg')}
            className="flex items-center justify-between text-xs font-bold text-purple-400 hover:underline"
          >
            <span>{t('semantic_core.kg_link')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Claim Lineage */}
        <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-white mb-1.5">{t('semantic_core.claims_title')}</h3>
            <p className="text-slate-500 text-xs leading-normal mb-4">
              {t('semantic_core.claims_desc')}
            </p>
          </div>
          <Link
            href={buildHref('claims')}
            className="flex items-center justify-between text-xs font-bold text-green-400 hover:underline"
          >
            <span>{t('semantic_core.claims_link')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
