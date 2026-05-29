"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { 
  Building2, 
  ShieldCheck, 
  Activity, 
  HelpCircle, 
  Layers, 
  Eye, 
  FileText, 
  ArrowRight,
  Database
} from "lucide-react";
import { useTranslation } from "../../../../lib/i18n/context";

export default function WorkspaceDashboard() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";
  const { locale, t } = useTranslation();

  // Mock data mapping for visual presentation
  const workspacesInfo: Record<string, { name: string; domainsCount: number; brand: string }> = {
    "demo-brand-semantic-lab": { name: "Demo Brand Semantic Lab", domainsCount: 3, brand: "Demo Lab Inc" },
    "acme-skincare-lab": { name: "Acme Skincare Lab", domainsCount: 1, brand: "Acme Cosmetics" },
    "cornerstore-retail": { name: "Cornerstore Retail Corp", slug: "cornerstore-retail", domainsCount: 1, brand: "Cornerstore LLC" },
  } as any;

  const currentWorkspace = workspacesInfo[workspaceSlug] || workspacesInfo["demo-brand-semantic-lab"];

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-6xl w-full mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="text-xs text-cyan-400 font-mono font-bold tracking-wider uppercase mb-1">
            {t('dashboard.tenant_space')}
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
            {currentWorkspace.name}
          </h1>
          <p className="text-slate-400 text-sm">
            {t('dashboard.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-green-500/30 text-green-400 bg-green-950/30 text-xs font-mono">
            <ShieldCheck className="w-4 h-4" />
            {t('dashboard.rls_active')}
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 text-slate-300 bg-white/5 text-xs font-mono">
            <Database className="w-4 h-4" />
            {t('dashboard.postgres_db')}
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/50 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute right-4 top-4 text-slate-700">
            <Activity className="w-8 h-8" />
          </div>
          <div className="text-xs text-slate-500 font-mono uppercase mb-2">{t('dashboard.health_title')}</div>
          <div className="text-3xl font-extrabold text-white mb-1">84.2%</div>
          <p className="text-xs text-green-500 flex items-center gap-1 font-semibold">
            <span>↑ +2.4%</span> <span className="text-slate-500 font-normal">{t('dashboard.health_desc')}</span>
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/50 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute right-4 top-4 text-slate-700">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="text-xs text-slate-500 font-mono uppercase mb-2">{t('dashboard.ops_title')}</div>
          <div className="text-3xl font-extrabold text-white mb-1">79.5%</div>
          <p className="text-xs text-green-500 flex items-center gap-1 font-semibold">
            <span>↑ +1.1%</span> <span className="text-slate-500 font-normal">{t('dashboard.ops_desc')}</span>
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/50 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute right-4 top-4 text-slate-700">
            <Eye className="w-8 h-8" />
          </div>
          <div className="text-xs text-slate-500 font-mono uppercase mb-2">{t('observatory.score')}</div>
          <div className="text-3xl font-extrabold text-white mb-1">41.8%</div>
          <p className="text-xs text-red-500 flex items-center gap-1 font-semibold">
            <span>↓ -0.8%</span> <span className="text-slate-500 font-normal">comp citations active</span>
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/50 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute right-4 top-4 text-slate-700">
            <Layers className="w-8 h-8" />
          </div>
          <div className="text-xs text-slate-500 font-mono uppercase mb-2">{t('dashboard.nodes_title')}</div>
          <div className="text-3xl font-extrabold text-white mb-1">284</div>
          <p className="text-xs text-slate-400 font-mono">
            {t('dashboard.nodes_desc').replace('{count}', String(currentWorkspace.domainsCount))}
          </p>
        </div>
      </div>

      {/* Domain MVPs */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-slate-200">
          {t('dashboard.skeletons_title')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-950/30 border border-white/5 hover:border-cyan-500/10 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <h3 className="font-bold text-lg text-white">{t('dashboard.kbeauty_title')}</h3>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                {t('dashboard.kbeauty_desc')}
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-mono border-t border-white/5 pt-4">
              <span className="text-slate-500">slug: k-beauty-skincare</span>
              <Link href={`/${locale}/${workspaceSlug}/demo/k-beauty`} className="text-cyan-400 font-bold hover:underline flex items-center gap-1">
                {t('dashboard.explore_domain')} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-950/30 border border-white/5 hover:border-purple-500/10 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                <h3 className="font-bold text-lg text-white">{t('dashboard.convenience_title')}</h3>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                {t('dashboard.convenience_desc')}
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-mono border-t border-white/5 pt-4">
              <span className="text-slate-500">slug: convenience-retail</span>
              <Link href={`/${locale}/${workspaceSlug}/demo/convenience-retail`} className="text-purple-400 font-bold hover:underline flex items-center gap-1">
                {t('dashboard.explore_domain')} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-950/30 border border-white/5 hover:border-blue-500/10 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                <h3 className="font-bold text-lg text-white">{t('dashboard.wedding_title')}</h3>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                {t('dashboard.wedding_desc')}
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-mono border-t border-white/5 pt-4">
              <span className="text-slate-500">slug: wedding-services</span>
              <Link href={`/${locale}/${workspaceSlug}/demo/wedding`} className="text-blue-400 font-bold hover:underline flex items-center gap-1">
                {t('dashboard.explore_domain')} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Multi-Tenant Security & Traceability Info */}
      <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 backdrop-blur-sm space-y-4">
        <h3 className="font-bold text-lg text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-cyan-400" />
          {t('dashboard.guardrails_title')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="space-y-2">
            <div className="font-semibold text-slate-300">{t('dashboard.guardrails_desc1_title')}</div>
            <p className="text-slate-400 leading-relaxed text-xs">
              {t('dashboard.guardrails_desc1_text')}
            </p>
          </div>
          <div className="space-y-2">
            <div className="font-semibold text-slate-300">{t('dashboard.guardrails_desc2_title')}</div>
            <p className="text-slate-400 leading-relaxed text-xs">
              {t('dashboard.guardrails_desc2_text')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
