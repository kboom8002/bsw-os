"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/context";
import { LanguageToggle } from "@/components/LanguageToggle";

export default function Home() {
  const { locale, t } = useTranslation();

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans selection:bg-cyan-500 selection:text-black relative">
      {/* Background gradients for premium aesthetic */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-900/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/20 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 backdrop-blur-md bg-slate-950/60 sticky top-0 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center font-bold text-lg text-black shadow-lg shadow-cyan-500/20">
            Ω
          </div>
          <div>
            <span className="font-bold tracking-tight text-lg bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              {t('dashboard.title')}
            </span>
            <span className="ml-2 text-xs font-mono px-2 py-0.5 rounded-full border border-cyan-500/30 text-cyan-400 bg-cyan-950/50">
              MVP-v2.0
            </span>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-400 font-medium">
          <a href="#thesis" className="hover:text-white transition-colors">Thesis</a>
          <a href="#loop" className="hover:text-white transition-colors">Core Loop</a>
          <a href="#domains" className="hover:text-white transition-colors">Domains</a>
        </nav>
        <div className="flex items-center gap-4">
          <LanguageToggle />
          <Link
            href={`/${locale}/demo-brand-semantic-lab`}
            className="px-4 py-2 text-sm font-semibold rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 shadow-md shadow-cyan-400/10 transition-all hover:scale-105"
          >
            Enter Demo Lab
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-20 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-3xl flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-slate-300 mb-8 font-mono">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            MeaningOps + Semantic Website Factory
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-b from-white via-slate-100 to-slate-300 bg-clip-text text-transparent leading-[1.15]">
            Treat Your Brand Website as a{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Measurable Semantic OS
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 leading-relaxed mb-10 max-w-2xl">
            {t('dashboard.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mb-20 w-full sm:w-auto">
            <Link
              href={`/${locale}/demo-brand-semantic-lab`}
              className="px-8 py-4 text-base font-bold rounded-full bg-white text-slate-950 hover:bg-slate-100 transition-all hover:scale-[1.03] shadow-xl shadow-white/5 flex items-center justify-center gap-2"
            >
              Launch Dashboard →
            </Link>
            <a
              href="#thesis"
              className="px-8 py-4 text-base font-semibold rounded-full border border-white/10 hover:bg-white/5 transition-all flex items-center justify-center"
            >
              Read Product Thesis
            </a>
          </div>
        </div>

        {/* Feature Grid / Product Loop */}
        <section id="loop" className="w-full py-12 border-t border-white/5">
          <h2 className="text-2xl font-bold mb-8 text-center text-slate-200 tracking-tight">
            The Core MeaningOps Loop
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/50 backdrop-blur-sm">
              <div className="text-cyan-400 font-mono text-sm mb-3">01 / TRUTH</div>
              <h3 className="font-semibold text-lg text-white mb-2">{t('nav.truth_studio')}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Formulate Strategic and Operational truths backed by rigid Evidence and Boundary Rules.
              </p>
            </div>
            <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/50 backdrop-blur-sm">
              <div className="text-cyan-400 font-mono text-sm mb-3">02 / CORE</div>
              <h3 className="font-semibold text-lg text-white mb-2">{t('nav.semantic_core')}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Map target queries to Canonical Questions and establish QIS (Query-Intent-Scenario) scenes.
              </p>
            </div>
            <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/50 backdrop-blur-sm">
              <div className="text-cyan-400 font-mono text-sm mb-3">03 / FACTORY</div>
              <h3 className="font-semibold text-lg text-white mb-2">{t('nav.objects_studio')}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Compose Representation Objects and Surface Contracts into SEO/AEO/GEO-compliant semantic pages.
              </p>
            </div>
            <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/50 backdrop-blur-sm">
              <div className="text-cyan-400 font-mono text-sm mb-3">04 / FIX-IT</div>
              <h3 className="font-semibold text-lg text-white mb-2">{t('nav.fixit')}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Measure answer share using Probe Panels, identify gaps, patch with hypotheses, and retest.
              </p>
            </div>
          </div>
        </section>

        {/* Thesis section */}
        <section id="thesis" className="w-full py-16 border-t border-white/5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-6 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                A Graph-based Website Factory Built for AI Search
              </h2>
              <p className="text-slate-400 leading-relaxed mb-6">
                Ordinary CMS tools think in static page trees. BSW-OS thinks in **Knowledge Graphs**. By strictly structuring your brand identity, claims, and boundaries at the API boundary, we construct websites that AI search engines can easily read, trust, and cite.
              </p>
              <div className="space-y-3 font-mono text-xs text-slate-300">
                <div className="flex items-center gap-3">
                  <span className="text-cyan-400">✔</span> Hard tenant workspace isolation boundaries
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-cyan-400">✔</span> Row-Level Security (RLS) backend source of truth
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-cyan-400">✔</span> AI agents generate candidate outputs ONLY
                </div>
              </div>
            </div>
            <div className="p-8 rounded-3xl border border-white/10 bg-slate-950/80 shadow-2xl shadow-cyan-900/5 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 pointer-events-none" />
              <div className="font-mono text-xs text-slate-400 border-b border-white/10 pb-4 mb-4 flex items-center justify-between">
                <span>SYSTEM_THESIS.md</span>
                <span className="text-cyan-500">v2.0</span>
              </div>
              <blockquote className="text-slate-300 text-sm leading-relaxed italic mb-4">
                &ldquo;Brand Semantic Website OS treats brand meaning as software code. We build deterministic verification gates, continuous integration pipelines, and targeted patches to protect a brand&apos;s digital representation from drift and AI hallucinations.&rdquo;
              </blockquote>
              <div className="flex items-center gap-3 mt-6">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-cyan-400">
                  AG
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">Antigravity Design Team</div>
                  <div className="text-[10px] text-slate-500 font-mono">Lead Release Architects</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Domain MVPs */}
        <section id="domains" className="w-full py-12 border-t border-white/5">
          <h2 className="text-2xl font-bold mb-8 text-center text-slate-200 tracking-tight">
            Target Domain Skeletons
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-950/40 border border-white/5 hover:border-cyan-500/20 transition-all">
              <h3 className="font-bold text-lg text-white mb-2">{t('dashboard.kbeauty_title')}</h3>
              <p className="text-slate-400 text-sm mb-4">
                {t('dashboard.kbeauty_desc')}
              </p>
              <div className="inline-block text-xs font-mono text-cyan-400 bg-cyan-950/30 px-3 py-1 rounded-full">
                k-beauty-skincare
              </div>
            </div>
            <div className="p-6 rounded-2xl bg-slate-950/40 border border-white/5 hover:border-purple-500/20 transition-all">
              <h3 className="font-bold text-lg text-white mb-2">{t('dashboard.convenience_title')}</h3>
              <p className="text-slate-400 text-sm mb-4">
                {t('dashboard.convenience_desc')}
              </p>
              <div className="inline-block text-xs font-mono text-purple-400 bg-purple-950/30 px-3 py-1 rounded-full">
                convenience-retail
              </div>
            </div>
            <div className="p-6 rounded-2xl bg-slate-950/40 border border-white/5 hover:border-blue-500/20 transition-all">
              <h3 className="font-bold text-lg text-white mb-2">{t('dashboard.wedding_title')}</h3>
              <p className="text-slate-400 text-sm mb-4">
                {t('dashboard.wedding_desc')}
              </p>
              <div className="inline-block text-xs font-mono text-blue-400 bg-blue-950/30 px-3 py-1 rounded-full">
                wedding-services
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-8 text-center text-slate-500 text-xs font-mono relative z-10">
        <p>© 2026 Brand Semantic Website OS. Programmed in partnership with Antigravity Pair-Coding Intelligence.</p>
      </footer>
    </div>
  );
}

