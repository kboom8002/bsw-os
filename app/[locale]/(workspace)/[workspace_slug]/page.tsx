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
  Database,
  Search,
  Award
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

      {/* Global AI Audit & Benchmark Tools */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-slate-200">
          {locale === "ko" ? "글로벌 AI 진단 및 벤치마크 도구" : "Global AI Audit & Benchmark Tools"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-slate-950/40 border border-cyan-500/20 hover:border-cyan-500/40 transition-all flex flex-col justify-between relative overflow-hidden">
            <div className="absolute right-4 top-4 text-cyan-500/10">
              <Search className="w-16 h-16" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Search className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-lg text-white">
                  {locale === "ko" ? "사이트 서피스 역설계 분석 (Site Audit)" : "Site Surface Reverse Engineering Audit"}
                </h3>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                {locale === "ko" 
                  ? "특정 사이트 URL을 크롤링하여 AI 검색 엔진(ChatGPT, Gemini) 노출용 엔서카드 생성 및 세맨틱 갭을 역설계 분석하고, 최적화 처방전을 생성합니다."
                  : "Crawl a target URL to reverse engineer semantic gaps, extract generated answer cards, and calculate simulated AEPI scores for AI search engine visibility."}
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-mono border-t border-white/5 pt-4">
              <span className="text-slate-500">Route: /site-audit</span>
              <Link href={`/${locale}/site-audit`} className="text-cyan-400 font-bold hover:underline flex items-center gap-1">
                {locale === "ko" ? "분석 도구 실행" : "Run Audit Tool"} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-950/40 border border-purple-500/20 hover:border-purple-500/40 transition-all flex flex-col justify-between relative overflow-hidden">
            <div className="absolute right-4 top-4 text-purple-500/10">
              <Award className="w-16 h-16" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-lg text-white">
                  {locale === "ko" ? "업종별 공개 평판 지수 & 벤치마크" : "Industry Public Benchmark & AI Index"}
                </h3>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                {locale === "ko" 
                  ? "스킨케어, 웨딩홀, 피부과 리프팅 등 주요 산업군별 브랜드들의 실시간 AI 검색 출현율(OCR) 및 답변 정합성(AAS) 실측 순위를 투명하게 확인하고 진단합니다."
                  : "Compare brand performance (AAS, OCR, BAIR) across key industry sectors (skincare, wedding, lifting clinic) with real-time public indexes."}
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-mono border-t border-white/5 pt-4 gap-2">
              <span className="text-slate-500">Routes: /benchmark, /sbs-index</span>
              <div className="flex gap-4">
                <Link href={`/${locale}/benchmark`} className="text-purple-400 font-bold hover:underline flex items-center gap-1">
                  {locale === "ko" ? "실측 벤치마크" : "Live Benchmark"} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link href={`/${locale}/sbs-index`} className="text-indigo-400 font-bold hover:underline flex items-center gap-1 border-l border-white/10 pl-3">
                  {locale === "ko" ? "공개 평판지수" : "Public AI Index"} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
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
