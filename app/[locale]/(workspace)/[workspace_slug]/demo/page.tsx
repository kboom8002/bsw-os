"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  Sparkles,
  CheckCircle,
  HelpCircle,
  FileText,
  Activity,
  Layers,
  ArrowRight,
  TrendingUp,
  Database,
  Cpu,
  BookOpen,
  ArrowLeft,
  Users,
  Compass,
  AlertTriangle,
  Play
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";

export default function DemoDashboard() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";
  const { locale, t } = useTranslation();

  // State
  const [seeded, setSeeded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const handleLaunchSeed = () => {
    setLoading(true);
    setNotification(locale === 'ko' ? "🧬 멱등성 도메인 시더 기동 중: PureBarrier, Quick25, Lumiere Hall..." : "🧬 Initializing Idempotent Domain Seeder: PureBarrier, Quick25, and Lumiere Hall...");
    
    setTimeout(() => {
      setSeeded(true);
      setLoading(false);
      setNotification(t('dashboard.seeding_success'));
    }, 2000);
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-6xl w-full mx-auto text-slate-100 bg-slate-900">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="text-xs text-indigo-400 font-mono font-bold tracking-wider uppercase mb-1">
            BSW-OS Full-Loop Demonstration
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-indigo-400" />
            {t('dashboard.launch_seed')}
          </h1>
          <p className="text-slate-400 text-sm">
            {t('dashboard.seed_desc')}
          </p>
        </div>

        <div>
          {seeded ? (
            <div className="px-4 py-2.5 text-xs font-bold rounded-xl border border-emerald-500/20 bg-emerald-950/20 text-emerald-300 font-mono flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              DATABASE SEEDED
            </div>
          ) : (
            <button
              onClick={handleLaunchSeed}
              disabled={loading}
              className="px-4 py-2.5 text-xs font-bold rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/10 font-mono"
            >
              {loading ? (
                <span>{locale === 'ko' ? "시드 적재 중..." : "SEEDING DATABASE..."}</span>
              ) : (
                <>
                  <Play className="w-4 h-4 text-white fill-current" />
                  {t('dashboard.seeding_button')}
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Notifications Banner */}
      {notification && (
        <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-950/20 text-indigo-300 text-xs font-mono flex items-start gap-3 backdrop-blur-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{notification}</span>
        </div>
      )}

      {/* E2E Matrix Table */}
      <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/30 space-y-6">
        <h3 className="font-bold text-lg text-white flex items-center gap-2 border-b border-white/5 pb-4">
          <Database className="w-5 h-5 text-indigo-400" />
          BSW-OS Full-Loop Seed Matrix
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 font-mono text-[9px] uppercase text-slate-500">
                <th className="pb-3 font-medium">Stage</th>
                <th className="pb-3 font-medium">K-Beauty Skincare</th>
                <th className="pb-3 font-medium">Convenience Retail</th>
                <th className="pb-3 font-medium">Wedding Services</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300 font-mono text-[11px]">
              <tr>
                <td className="py-3.5 font-bold text-white font-sans">Strategic Truth</td>
                <td className="py-3.5 text-slate-400">PureBarrier sensitive recovery</td>
                <td className="py-3.5 text-slate-400">Quick25 local inventory</td>
                <td className="py-3.5 text-slate-400">Lumiere Hall packages</td>
              </tr>
              <tr>
                <td className="py-3.5 font-bold text-white font-sans">Core QIS query</td>
                <td className="py-3.5 text-slate-400 italic">"민감성 피부 장벽 회복..."</td>
                <td className="py-3.5 text-slate-400 italic">"오늘 밤 편의점 야식..."</td>
                <td className="py-3.5 text-slate-400 italic">"웨딩홀 패키지 계약 전..."</td>
              </tr>
              <tr>
                <td className="py-3.5 font-bold text-white font-sans">Presentation Object</td>
                <td className="py-3.5 text-slate-400">PureBarrier Skin Recovery Cream</td>
                <td className="py-3.5 text-slate-400">Late-Night combo menu</td>
                <td className="py-3.5 text-slate-400">Lumiere Full package venue</td>
              </tr>
              <tr>
                <td className="py-3.5 font-bold text-white font-sans">Vibe / Persona</td>
                <td className="py-3.5 text-slate-400">Derm Advisor (Calm vibe)</td>
                <td className="py-3.5 text-slate-400">Budget Helper (Useful vibe)</td>
                <td className="py-3.5 text-slate-400">Wedding Curator (Elegant vibe)</td>
              </tr>
              <tr>
                <td className="py-3.5 font-bold text-white font-sans">AEO Observatory</td>
                <td className="py-3.5 text-slate-400">Sensitive Skincare Trust Panel</td>
                <td className="py-3.5 text-slate-400">Convenience Local Action Panel</td>
                <td className="py-3.5 text-slate-400">Wedding Vendor Contract Panel</td>
              </tr>
              <tr>
                <td className="py-3.5 font-bold text-white font-sans">Fidelity Patch</td>
                <td className="py-3.5 text-slate-400">Credential URL visibility patch</td>
                <td className="py-3.5 text-slate-400">Local business locator CTA patch</td>
                <td className="py-3.5 text-slate-400">Dress registry boundary patch</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Domain Portals Links Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* K-Beauty */}
        <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 space-y-4 hover:bg-slate-950/40 transition-all">
          <div className="flex justify-between items-center">
            <span className="px-2 py-0.5 text-[9px] font-mono rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold uppercase">
              YMYL TRUST
            </span>
            <span className="text-xs text-slate-500 font-mono font-bold">Domain 01</span>
          </div>
          <h3 className="text-lg font-bold text-white">{t('dashboard.kbeauty_title')}</h3>
          <p className="text-xs text-slate-400 leading-relaxed font-normal">
            {t('dashboard.kbeauty_desc')}
          </p>
          <Link
            href={`/${locale}/${workspaceSlug}/demo/k-beauty`}
            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 font-mono pt-2"
          >
            Walk E2E Flow <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Convenience Retail */}
        <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 space-y-4 hover:bg-slate-950/40 transition-all">
          <div className="flex justify-between items-center">
            <span className="px-2 py-0.5 text-[9px] font-mono rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold uppercase">
              LOCAL ACTION
            </span>
            <span className="text-xs text-slate-500 font-mono font-bold">Domain 02</span>
          </div>
          <h3 className="text-lg font-bold text-white">{t('dashboard.convenience_title')}</h3>
          <p className="text-xs text-slate-400 leading-relaxed font-normal">
            {t('dashboard.convenience_desc')}
          </p>
          <Link
            href={`/${locale}/${workspaceSlug}/demo/convenience-retail`}
            className="inline-flex items-center gap-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 font-mono pt-2"
          >
            Walk E2E Flow <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Wedding Services */}
        <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 space-y-4 hover:bg-slate-950/40 transition-all">
          <div className="flex justify-between items-center">
            <span className="px-2 py-0.5 text-[9px] font-mono rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold uppercase">
              VIBE & CONTRACT
            </span>
            <span className="text-xs text-slate-500 font-mono font-bold">Domain 03</span>
          </div>
          <h3 className="text-lg font-bold text-white">{t('dashboard.wedding_title')}</h3>
          <p className="text-xs text-slate-400 leading-relaxed font-normal">
            {t('dashboard.wedding_desc')}
          </p>
          <Link
            href={`/${locale}/${workspaceSlug}/demo/wedding`}
            className="inline-flex items-center gap-1 text-xs font-bold text-purple-400 hover:text-purple-300 font-mono pt-2"
          >
            Walk E2E Flow <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>

    </div>
  );
}

