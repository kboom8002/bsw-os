"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  HelpCircle, 
  Eye, 
  ArrowRight,
  Cpu,
  Boxes,
  Network,
  Lock,
  Loader2,
  Database,
  FileText,
  Shield,
  TrendingUp,
  GitFork,
  Newspaper,
  Factory,
  Sparkles,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import { BENCHMARK_DOMAINS } from "@/lib/benchmark/domain-config";
import { runE2EPipeline, getQisAssetOverview } from "@/app/actions/qis-bridge";

interface ModuleStats {
  signals: number;
  capitalNodes: number;
  canonicalQuestions: number;
  qisScenes: number;
  concepts: number;
  kgNodes: number;
  claims: number;
}

export default function SemanticCoreDashboard() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";
  const locale = (params?.locale as string) || "ko";
  const { t } = useTranslation();

  const [selectedDomain, setSelectedDomain] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [stats, setStats] = useState<ModuleStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [wsId, setWsId] = useState<string>('');
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [pipelineResult, setPipelineResult] = useState<any>(null);
  const [assetOverview, setAssetOverview] = useState<any>(null);
  const [isHubMode, setIsHubMode] = useState(false);

  const domainConfig = selectedDomain ? BENCHMARK_DOMAINS[selectedDomain] : undefined;
  const brands = domainConfig?.brands ?? [];

  // 실시간 데이터 카운트 로드
  useEffect(() => {
    loadStats();
  }, [workspaceSlug]);

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const { resolveWorkspaceSlug } = await import('@/app/actions/workspace');
      const { getSupabaseClient } = await import('@/lib/supabase');
      const supabase = getSupabaseClient();

      const resolvedId = await resolveWorkspaceSlug(workspaceSlug);
      const currentWsId = resolvedId || '11111111-1111-1111-1111-111111111111';
      setWsId(currentWsId);

      const [sig, cap, cq, qis, con, kg, cl] = await Promise.all([
        supabase.from('question_signals').select('id', { count: 'exact', head: true }).eq('workspace_id', currentWsId),
        supabase.from('question_capital_nodes').select('id', { count: 'exact', head: true }).eq('workspace_id', currentWsId),
        supabase.from('canonical_questions').select('id', { count: 'exact', head: true }).eq('workspace_id', currentWsId),
        supabase.from('qis_scenes').select('id', { count: 'exact', head: true }).eq('workspace_id', currentWsId),
        supabase.from('tco_concepts').select('id', { count: 'exact', head: true }).eq('workspace_id', currentWsId),
        supabase.from('brand_ontology_nodes').select('id', { count: 'exact', head: true }).eq('workspace_id', currentWsId),
        supabase.from('claim_nodes').select('id', { count: 'exact', head: true }).eq('workspace_id', currentWsId),
      ]);

      setStats({
        signals: sig.count ?? 0,
        capitalNodes: cap.count ?? 0,
        canonicalQuestions: cq.count ?? 0,
        qisScenes: qis.count ?? 0,
        concepts: con.count ?? 0,
        kgNodes: kg.count ?? 0,
        claims: cl.count ?? 0,
      });

      // Call Server Action for Overview
      try {
        const overview = await getQisAssetOverview(currentWsId);
        setAssetOverview(overview);
      } catch (err) {
        console.warn('Failed to load asset overview', err);
      }
    } catch {
      setStats({
        signals: 0, capitalNodes: 0, canonicalQuestions: 0,
        qisScenes: 0, concepts: 0, kgNodes: 0, claims: 0,
      });
    } finally {
      setStatsLoading(false);
    }
  };

  const handleRunPipeline = async () => {
    if (!wsId) return;
    setPipelineRunning(true);
    setPipelineResult(null);
    try {
      const brand = isHubMode ? "" : (selectedBrand || "default-brand");
      const res = await runE2EPipeline(wsId, selectedDomain || 'technology', brand, {
        mode: isHubMode ? 'hub' : 'standalone',
        industryKey: domainConfig?.industryType || 'wedding_studio', // 실측 패널 그라운딩 활성화
      });
      setPipelineResult(res);
      // Reload stats after pipeline finishes
      loadStats();
    } catch (e: any) {
      console.error(e);
      setPipelineResult({ error: e.message });
    } finally {
      setPipelineRunning(false);
    }
  };

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

  const statBadge = (count: number) => {
    if (statsLoading) return <Loader2 className="w-3 h-3 animate-spin text-slate-500" />;
    if (count === 0) return <span className="text-xs text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded-full">—</span>;
    return <span className="text-xs text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-full font-mono border border-cyan-500/20">{count}</span>;
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
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={buildHref('media-series')}
            className="px-4 py-2 text-sm font-bold rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white shadow-md shadow-amber-500/20 transition-all flex items-center gap-2"
          >
            <Newspaper className="w-4 h-4" />
            📰 Media Series Admin (8/3)
          </Link>
          <button
            onClick={handleRunPipeline}
            disabled={pipelineRunning}
            className="px-4 py-2 text-sm font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-white/10 shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {pipelineRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Network className="w-4 h-4" />}
            One-Click E2E Pipeline
          </button>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
            disabled={!selectedDomain || isHubMode}
            className="px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-400 disabled:opacity-40"
          >
            <option value="">{t('semantic_core.all_brands')}</option>
            {brands.map((b) => (
              <option key={b.slug} value={b.slug}>{b.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="hubModeToggle"
            checked={isHubMode}
            onChange={(e) => {
              setIsHubMode(e.target.checked);
              if (e.target.checked) setSelectedBrand('');
            }}
            className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-400 cursor-pointer"
          />
          <label htmlFor="hubModeToggle" className="text-xs font-bold text-slate-300 hover:text-white cursor-pointer select-none">
            허브 포털 모드 (브랜드 미지정, 업종 범용 수집)
          </label>
        </div>
      </div>

      {/* E2E Pipeline Result & Overview */}
      {(pipelineResult || assetOverview) && (
        <div className="p-6 rounded-2xl border border-cyan-500/20 bg-slate-900/80 space-y-4">
          <h3 className="font-bold text-sm text-cyan-400">E2E 파이프라인 & 자산 오버뷰</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pipelineResult && (
              <div className="space-y-3">
                <h4 className="text-xs text-slate-400 uppercase font-mono">최근 파이프라인 결과</h4>
                {pipelineResult.error ? (
                  <p className="text-red-400 text-xs">{pipelineResult.error}</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    <div className="p-3 rounded-lg bg-slate-800/50 border border-white/5 text-center">
                      <div className="text-[10px] text-slate-400 mb-1">수집된 시그널</div>
                      <div className="text-lg font-bold text-white">{pipelineResult.phase1_signals?.count || 0}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-800/50 border border-white/5 text-center">
                      <div className="text-[10px] text-slate-400 mb-1">딥다이브 타겟</div>
                      <div className="text-lg font-bold text-cyan-400">{pipelineResult.phase1_5_deepDive?.fedCount || 0}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-800/50 border border-white/5 text-center">
                      <div className="text-[10px] text-slate-400 mb-1">발견된 기회</div>
                      <div className="text-lg font-bold text-white">{pipelineResult.phase2_opportunities?.fedCount || 0}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-800/50 border border-white/5 text-center">
                      <div className="text-[10px] text-slate-400 mb-1">서피스 영속화</div>
                      <div className="text-lg font-bold text-purple-400">{pipelineResult.phase2_5_surfacePersist?.persisted || 0}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-800/50 border border-white/5 text-center">
                      <div className="text-[10px] text-slate-400 mb-1">승격된 CQ</div>
                      <div className="text-lg font-bold text-white">{pipelineResult.phase3_promotions?.cqCreated || 0}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {assetOverview && (
              <div className="space-y-3">
                <h4 className="text-xs text-slate-400 uppercase font-mono">QIS 자산 현황</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 rounded-lg bg-slate-800/50 border border-white/5 text-center">
                    <div className="text-[10px] text-slate-400 mb-1">발굴된 시그널 (Mined)</div>
                    <div className="text-lg font-bold text-cyan-400">{assetOverview.signals?.mined || 0}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800/50 border border-white/5 text-center">
                    <div className="text-[10px] text-slate-400 mb-1">승격됨 (Promoted)</div>
                    <div className="text-lg font-bold text-purple-400">{assetOverview.signals?.promoted || 0}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800/50 border border-white/5 text-center">
                    <div className="text-[10px] text-slate-400 mb-1">제외됨 (Ignored)</div>
                    <div className="text-lg font-bold text-slate-500">{assetOverview.signals?.ignored || 0}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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

      {/* Media Series & Answer Factory Featured Banner */}
      <div className="p-6 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-rose-950/30 to-slate-950/40 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-amber-500/5">
        <div className="space-y-1">
          <div className="text-xs text-amber-400 font-mono font-bold tracking-wider uppercase flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-ping" />
            2026.08.03 미디어 파트너 독점 런칭
          </div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-amber-400" />
            미디어 시리즈 연재 & 핸드오프 어드민 (뷰티경제 × BNT뉴스)
          </h2>
          <p className="text-slate-300 text-xs leading-normal max-w-3xl">
            주간 QVS TOP 3 자동 발굴, 3건 동시 배치 파이프라인 컴파일, 편집부 검수/승인 워크플로우 및 실시간 AI 인용 스코어보드를 관리합니다.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href={buildHref('answer-factory')}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all text-xs flex items-center gap-2"
          >
            <Factory className="w-4 h-4 text-cyan-400" />
            Answer Factory
          </Link>
          <Link
            href={buildHref('media-series')}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white font-bold transition-all text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20"
          >
            <Newspaper className="w-4 h-4" />
            미디어 어드민 가동 →
          </Link>
        </div>
      </div>

      {/* Pipeline Orchestration Banner */}
      <div className="p-6 rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-950/40 to-slate-950/40 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="text-xs text-cyan-400 font-mono font-bold tracking-wider uppercase flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            파이프라인 통합 관리
          </div>
          <h2 className="text-lg font-bold text-white">오케스트레이션 대시보드</h2>
          <p className="text-slate-400 text-xs leading-normal max-w-2xl">
            벤치마크, 골든 레퍼런스, 사이트 역설계, 딥 다이브 파이프라인의 수집 준비도 상태를 점검하고, 순차적으로 연동 실행을 제어합니다.
          </p>
        </div>
        <Link
          href={buildHref('orchestration')}
          className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all text-xs flex items-center gap-2 shrink-0 shadow-lg shadow-cyan-500/10"
        >
          <GitFork className="w-4 h-4" />
          대시보드 바로가기
        </Link>
      </div>

      {/* Primary Module Shortcuts Grid — with live counts */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {/* Media Series Admin */}
        <div className="p-6 rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-950/20 to-slate-950/40 hover:border-amber-400 transition-all flex flex-col justify-between group shadow-lg shadow-amber-500/5">
          <div>
            <div className="flex items-center justify-between mb-4">
              <Newspaper className="w-5 h-5 text-amber-400" />
              <span className="text-xs text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full font-mono border border-amber-500/30 font-bold">8/3 NEW</span>
            </div>
            <h3 className="font-bold text-sm text-white mb-1.5">미디어 시리즈 어드민</h3>
            <p className="text-slate-400 text-xs leading-normal">
              뷰티경제 & BNT뉴스 2대 연재 시리즈 TOP 3 배치 컴파일, 핸드오프, 스코어보드 관리.
            </p>
          </div>
          <Link
            href={buildHref('media-series')}
            className="mt-6 flex items-center justify-between text-xs font-bold text-amber-400 hover:underline"
          >
            <span>어드민 가동</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Signals */}
        <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 hover:border-cyan-500/20 transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-4">
              <Cpu className="w-5 h-5 text-cyan-400" />
              {statBadge(stats?.signals ?? 0)}
            </div>
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
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Question Capital */}
        <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 hover:border-purple-500/20 transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-4">
              <Boxes className="w-5 h-5 text-purple-400" />
              {statBadge(stats?.capitalNodes ?? 0)}
            </div>
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
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Canonical Questions */}
        <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 hover:border-blue-500/20 transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-4">
              <HelpCircle className="w-5 h-5 text-blue-400" />
              {statBadge(stats?.canonicalQuestions ?? 0)}
            </div>
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
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* QIS Scenes */}
        <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 hover:border-green-500/20 transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-4">
              <Eye className="w-5 h-5 text-green-400" />
              {statBadge(stats?.qisScenes ?? 0)}
            </div>
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
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* QVS × AEPI Strategy Matrix */}
        <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 hover:border-yellow-500/20 transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-5 h-5 text-yellow-400" />
              <span className="text-xs text-yellow-300 bg-yellow-500/10 px-2 py-0.5 rounded-full font-mono border border-yellow-500/20">LIVE</span>
            </div>
            <h3 className="font-bold text-sm text-white mb-1.5">전략 매트릭스 (QVS×AEPI)</h3>
            <p className="text-slate-500 text-xs leading-normal">
              AEPI 성능 및 QVS 가치를 기준으로 4사분면 질문자산 매트릭스를 시각화합니다.
            </p>
          </div>
          <Link
            href={buildHref('strategy')}
            className="mt-6 flex items-center justify-between text-xs font-bold text-yellow-400 hover:underline"
          >
            <span>전략 분석 보기</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Advanced KG & Lineage row — with live counts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* TCO Concepts */}
        <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 hover:border-white/10 transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-white">{t('semantic_core.concepts_title')}</h3>
              {statBadge(stats?.concepts ?? 0)}
            </div>
            <p className="text-slate-500 text-xs leading-normal mb-4">
              {t('semantic_core.concepts_desc')}
            </p>
          </div>
          <Link
            href={buildHref('concepts')}
            className="flex items-center justify-between text-xs font-bold text-cyan-400 hover:underline"
          >
            <span>{t('semantic_core.concepts_link')}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Ontology KG */}
        <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 hover:border-white/10 transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-white">{t('semantic_core.kg_title')}</h3>
              {statBadge(stats?.kgNodes ?? 0)}
            </div>
            <p className="text-slate-500 text-xs leading-normal mb-4">
              {t('semantic_core.kg_desc')}
            </p>
          </div>
          <Link
            href={buildHref('kg')}
            className="flex items-center justify-between text-xs font-bold text-purple-400 hover:underline"
          >
            <span>{t('semantic_core.kg_link')}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Claim Lineage */}
        <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 hover:border-white/10 transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-white">{t('semantic_core.claims_title')}</h3>
              {statBadge(stats?.claims ?? 0)}
            </div>
            <p className="text-slate-500 text-xs leading-normal mb-4">
              {t('semantic_core.claims_desc')}
            </p>
          </div>
          <Link
            href={buildHref('claims')}
            className="flex items-center justify-between text-xs font-bold text-green-400 hover:underline"
          >
            <span>{t('semantic_core.claims_link')}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Integration & Feedback Loop row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* QIS 3축 Hub Sync */}
        <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 hover:border-white/10 transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-white">QIS 3축 Hub 동기화</h3>
              <span className="text-[10px] text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20 font-mono">SYNC</span>
            </div>
            <p className="text-slate-500 text-xs leading-normal mb-4">
              업계 트렌드 채널, 질의 장소 및 포털 간의 시그널 및 QIS 자산을 실시간 동기화합니다.
            </p>
          </div>
          <Link
            href={buildHref('qis-triaxis')}
            className="flex items-center justify-between text-xs font-bold text-cyan-400 hover:underline"
          >
            <span>Hub 동기화 관리</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Signal Performance Feedback Loop */}
        <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 hover:border-white/10 transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-white">시그널 성과 피드백 루프</h3>
              <span className="text-[10px] text-violet-300 bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/20 font-mono">OPTIMIZER</span>
            </div>
            <p className="text-slate-500 text-xs leading-normal mb-4">
              승격된 시그널의 실제 검색 유입 성과를 추적하고, 차원별 QVS 가중치를 OLS 회귀 모델로 역산 조정합니다.
            </p>
          </div>
          <Link
            href={buildHref('performance')}
            className="flex items-center justify-between text-xs font-bold text-violet-400 hover:underline"
          >
            <span>성과 분석 및 최적화</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Pattern Attractor Foundry (PAF) row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pattern Attractor */}
        <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 hover:border-cyan-500/20 transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-white">Pattern Attractor 관리</h3>
              <span className="text-[10px] text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20 font-mono">RUNTIME</span>
            </div>
            <p className="text-slate-500 text-xs leading-normal mb-4">
              도메인 표준 및 브랜드 특화 패턴 어트랙터 스펙을 관리하고 다채널 Media Soliton을 일괄 생성합니다.
            </p>
          </div>
          <Link
            href={buildHref('attractors')}
            className="flex items-center justify-between text-xs font-bold text-cyan-400 hover:underline"
          >
            <span>어트랙터 스펙 관리</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Attractor Gap */}
        <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 hover:border-orange-500/20 transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-white">Attractor Gap 진단</h3>
              <span className="text-[10px] text-orange-300 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20 font-mono">GAP AUDITOR</span>
            </div>
            <p className="text-slate-500 text-xs leading-normal mb-4">
              도메인 표준 대비 브랜드 포트폴리오를 진단하여 결여되거나 취약한 어트랙터 보정 태스크를 트리거합니다.
            </p>
          </div>
          <Link
            href={buildHref('attractor-gap')}
            className="flex items-center justify-between text-xs font-bold text-orange-400 hover:underline"
          >
            <span>포트폴리오 Gap 진단</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Domain Packs */}
        <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 hover:border-emerald-500/20 transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-white">Domain Pack 관리</h3>
              <span className="text-[10px] text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono">YAML PACKS</span>
            </div>
            <p className="text-slate-500 text-xs leading-normal mb-4">
              YAML 파일 기반 업종별 표준 어트랙터와 TCO 온톨로지를 데이터베이스에 직접 동기화합니다.
            </p>
          </div>
          <Link
            href={buildHref('domain-packs')}
            className="flex items-center justify-between text-xs font-bold text-emerald-400 hover:underline"
          >
            <span>도메인 팩 동기화</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
