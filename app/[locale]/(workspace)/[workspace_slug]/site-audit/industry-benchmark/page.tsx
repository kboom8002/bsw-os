"use client";

import React, { useState, useCallback } from "react";
import {
  BarChart2, Play, RefreshCw, CheckCircle2, XCircle, Clock,
  ChevronDown, ChevronUp, TrendingUp, Target, Database, Plus, Trash2, Globe
} from "lucide-react";
import { INDUSTRY_TAXONOMY } from "../../../../../../lib/industry/industry-taxonomy";
import {
  getReferenceSitesBySubIndustry,
  getSeededSubIndustryKeys,
  ReferenceSite,
} from "../../../../../../lib/industry/reference-sites-registry";
import {
  runBatchAudit,
  getBenchmarkProfile,
  getIndustryBlueprint,
  getBenchmarkAuditHistory,
  addReferenceSite,
  deleteReferenceSite,
} from "../../../../../actions/industry-benchmark";
import { SiteAuditSnapshot } from "../../../../../../lib/industry/batch-audit-runner";
import { IndustryBenchmarkProfile, IndustryBlueprint } from "../../../../../../lib/industry/benchmark-aggregator";

interface RunState {
  status: 'idle' | 'running' | 'done' | 'error';
  progress: number;
  total: number;
  currentSite?: string;
  error?: string;
}

interface BenchmarkData {
  snapshots: SiteAuditSnapshot[];
  profile: IndustryBenchmarkProfile | null;
  blueprint: IndustryBlueprint | null;
}

const TIER_BADGE: Record<string, { label: string; color: string }> = {
  excellent: { label: "우수", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  average:   { label: "평균", color: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
  poor:      { label: "미흡", color: "bg-red-500/10 text-red-400 border-red-500/30" },
};

export default function IndustryBenchmarkPage() {
  const [selectedSubIndustry, setSelectedSubIndustry] = useState<string>("skincare");
  const [auditMode, setAuditMode] = useState<"quick" | "full">("quick");
  const [runState, setRunState] = useState<RunState>({
    status: 'idle', progress: 0, total: 0
  });
  const [benchmarkData, setBenchmarkData] = useState<BenchmarkData | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['sites', 'results']));
  const [addSiteForm, setAddSiteForm] = useState<{
    url: string; brandName: string; tier: "excellent" | "average" | "poor"; curatorNotes: string;
  }>({ url: "", brandName: "", tier: "average", curatorNotes: "" });
  const [addingSite, setAddingSite] = useState(false);

  // 선택된 업종의 레퍼런스 사이트
  const referenceSites = getReferenceSitesBySubIndustry(selectedSubIndustry);
  const seededKeys = getSeededSubIndustryKeys();

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  const handleRunBatchAudit = async () => {
    const total = referenceSites.length;
    setRunState({ status: 'running', progress: 0, total, currentSite: referenceSites[0]?.brandName || '준비 중...' });
    setBenchmarkData(null);

    try {
      // 사이트별 진행률 시뮬레이션 (실제 runBatchAudit는 일괄 처리)
      const progressInterval = setInterval(() => {
        setRunState(prev => {
          if (prev.progress < total - 1) {
            const nextIdx = prev.progress + 1;
            return {
              ...prev,
              progress: nextIdx,
              currentSite: referenceSites[nextIdx]?.brandName || '분석 중...',
            };
          }
          return prev;
        });
      }, auditMode === 'full' ? 8000 : 2000);

      const result = await runBatchAudit(selectedSubIndustry, "admin", auditMode);
      clearInterval(progressInterval);
      
      setBenchmarkData({
        snapshots: result.snapshots,
        profile: result.profile,
        blueprint: result.blueprint,
      });
      setRunState({ status: 'done', progress: result.snapshots.length, total });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setRunState(prev => ({ ...prev, status: 'error', error: msg }));
    }
  };

  const handleLoadExisting = async () => {
    try {
      const [profile, blueprint, history] = await Promise.all([
        getBenchmarkProfile(selectedSubIndustry),
        getIndustryBlueprint(selectedSubIndustry),
        getBenchmarkAuditHistory(selectedSubIndustry),
      ]);
      setBenchmarkData({
        snapshots: history,
        profile,
        blueprint,
      });
    } catch (err: unknown) {
      console.error('Failed to load existing benchmark:', err);
    }
  };

  const handleAddSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addSiteForm.url || !addSiteForm.brandName) return;
    setAddingSite(true);
    try {
      await addReferenceSite({
        url: addSiteForm.url,
        brandName: addSiteForm.brandName,
        tier: addSiteForm.tier,
        subIndustryKey: selectedSubIndustry,
        curatorNotes: addSiteForm.curatorNotes,
      });
      setAddSiteForm({ url: "", brandName: "", tier: "average", curatorNotes: "" });
    } catch (err) {
      console.error('Failed to add site:', err);
    } finally {
      setAddingSite(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 max-w-6xl mx-auto space-y-6 font-sans">
      {/* 헤더 */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-gradient-to-tr from-violet-500 to-indigo-600 rounded-lg">
              <BarChart2 className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              업종 벤치마크 관리
            </h1>
          </div>
          <p className="text-sm text-slate-400 ml-12">
            레퍼런스 사이트를 감사하여 업종 표준 설계안(Blueprint)과 통계 프로필을 생성합니다
          </p>
        </div>
      </div>

      {/* 컨트롤 패널 */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-5">
        <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
          <Database className="h-4 w-4 text-indigo-400" />
          감사 설정
        </h2>

        {/* 업종 선택 */}
        <div>
          <label className="text-xs font-semibold text-slate-400 mb-2 block">세부 업종 선택</label>
          <div className="flex flex-wrap gap-2">
            {INDUSTRY_TAXONOMY.flatMap(cat => cat.subIndustries).map(sub => {
              const isSeeded = seededKeys.includes(sub.key);
              return (
                <button
                  key={sub.key}
                  onClick={() => {
                    setSelectedSubIndustry(sub.key);
                    setBenchmarkData(null);
                    setRunState({ status: 'idle', progress: 0, total: 0 });
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-all cursor-pointer ${
                    selectedSubIndustry === sub.key
                      ? "bg-indigo-600 text-white border-indigo-500"
                      : isSeeded
                      ? "bg-slate-800 text-slate-300 border-slate-700 hover:border-indigo-500"
                      : "bg-slate-900 text-slate-500 border-slate-800 opacity-60"
                  }`}
                >
                  {sub.displayNameKo}
                  {isSeeded && (
                    <span className="ml-1 text-emerald-400">●</span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-slate-600 mt-1.5">
            ● 시드 데이터 있는 업종 | 회색 = 아직 큐레이션 필요
          </p>
        </div>

        {/* 감사 모드 */}
        <div>
          <label className="text-xs font-semibold text-slate-400 mb-2 block">감사 모드</label>
          <div className="flex gap-3">
            {[
              { id: "quick", label: "⚡ Quick (HTML-only)", desc: "AI API 비용 없음 • 5-10초/사이트" },
              { id: "full",  label: "🚀 Full Audit",        desc: "AI 반영도 포함 • 60-120초/사이트" },
            ].map(mode => (
              <button
                key={mode.id}
                onClick={() => setAuditMode(mode.id as "quick" | "full")}
                className={`flex-1 px-4 py-3 rounded-xl border text-left transition-all cursor-pointer ${
                  auditMode === mode.id
                    ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
                    : "bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600"
                }`}
              >
                <div className="text-sm font-bold">{mode.label}</div>
                <div className="text-[10px] opacity-70 mt-0.5">{mode.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleRunBatchAudit}
            disabled={runState.status === 'running' || referenceSites.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-indigo-500/20"
          >
            {runState.status === 'running' ? (
              <><RefreshCw className="h-4 w-4 animate-spin" /> 감사 중... ({runState.progress}/{runState.total})</>
            ) : (
              <><Play className="h-4 w-4" /> {selectedSubIndustry} 배치 감사 실행</>
            )}
          </button>
          <button
            onClick={handleLoadExisting}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm rounded-xl border border-slate-700 transition-all cursor-pointer"
          >
            <Database className="h-4 w-4" />
            기존 데이터 불러오기
          </button>
          {referenceSites.length === 0 && (
            <p className="text-xs text-amber-400">
              ⚠️ 이 업종은 아직 레퍼런스 사이트가 없습니다. 아래에서 추가해주세요.
            </p>
          )}
        </div>

        {/* 진행 상태 */}
        {runState.status === 'running' && (
          <div className="bg-slate-800/50 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                벤치마크 감사 진행 중...
              </span>
              <span className="font-bold text-indigo-400">{runState.progress}/{runState.total}개 완료</span>
            </div>
            <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${runState.total ? (runState.progress / runState.total) * 100 : 0}%` }}
              />
            </div>
            {/* 사이트별 상태 표시 */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {referenceSites.map((site, idx) => {
                const isCompleted = idx < runState.progress;
                const isCurrent = idx === runState.progress;
                return (
                  <div key={idx} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                    isCompleted 
                      ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
                      : isCurrent
                      ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 animate-pulse'
                      : 'bg-slate-800/30 border-slate-700/50 text-slate-500'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle2 className="h-3 w-3 shrink-0" />
                    ) : isCurrent ? (
                      <RefreshCw className="h-3 w-3 shrink-0 animate-spin" />
                    ) : (
                      <Clock className="h-3 w-3 shrink-0" />
                    )}
                    <span className="truncate">{site.brandName}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {runState.status === 'done' && (
          <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
            <CheckCircle2 className="h-4 w-4" />
            감사 완료! {runState.progress}개 사이트 분석 및 Blueprint 생성됨
          </div>
        )}

        {runState.status === 'error' && (
          <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            <XCircle className="h-4 w-4" />
            오류: {runState.error}
          </div>
        )}
      </div>

      {/* 레퍼런스 사이트 목록 */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
        <button
          onClick={() => toggleSection('sites')}
          className="w-full flex items-center justify-between p-5 text-left cursor-pointer hover:bg-slate-800/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-violet-400" />
            <h2 className="text-sm font-bold text-slate-100">
              레퍼런스 사이트 ({referenceSites.length}개)
            </h2>
          </div>
          {expandedSections.has('sites') ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
        </button>

        {expandedSections.has('sites') && (
          <div className="px-5 pb-5 space-y-3">
            {/* 사이트 목록 */}
            {referenceSites.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                레퍼런스 사이트가 없습니다. 아래 폼에서 추가해주세요.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {referenceSites.map(site => (
                  <div
                    key={site.id}
                    className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${TIER_BADGE[site.tier]?.color}`}>
                        {TIER_BADGE[site.tier]?.label}
                      </span>
                      <button
                        onClick={() => deleteReferenceSite(site.id).catch(console.error)}
                        className="text-slate-600 hover:text-red-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="font-bold text-sm text-slate-100">{site.brandName}</div>
                    <a href={site.url} target="_blank" rel="noopener noreferrer"
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 truncate block"
                    >
                      {site.url}
                    </a>
                    {site.curatorNotes && (
                      <p className="text-[10px] text-slate-500 leading-relaxed">{site.curatorNotes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 사이트 추가 폼 */}
            <div className="mt-4 bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
              <h3 className="text-xs font-bold text-slate-400 mb-3 flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                레퍼런스 사이트 추가
              </h3>
              <form onSubmit={handleAddSite} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="url"
                  value={addSiteForm.url}
                  onChange={e => setAddSiteForm(f => ({ ...f, url: e.target.value }))}
                  placeholder="https://example.com"
                  required
                  className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="text"
                  value={addSiteForm.brandName}
                  onChange={e => setAddSiteForm(f => ({ ...f, brandName: e.target.value }))}
                  placeholder="브랜드명"
                  required
                  className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                />
                <select
                  value={addSiteForm.tier}
                  onChange={e => setAddSiteForm(f => ({ ...f, tier: e.target.value as "excellent" | "average" | "poor" }))}
                  className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="excellent">우수 (Excellent)</option>
                  <option value="average">평균 (Average)</option>
                  <option value="poor">미흡 (Poor)</option>
                </select>
                <input
                  type="text"
                  value={addSiteForm.curatorNotes}
                  onChange={e => setAddSiteForm(f => ({ ...f, curatorNotes: e.target.value }))}
                  placeholder="큐레이터 메모 (선택)"
                  className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={addingSite}
                  className="md:col-span-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50 cursor-pointer"
                >
                  {addingSite ? "추가 중..." : "사이트 추가"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* 감사 결과 */}
      {benchmarkData && (
        <>
          {/* 스냅샷 결과 표 */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
            <button
              onClick={() => toggleSection('results')}
              className="w-full flex items-center justify-between p-5 text-left cursor-pointer hover:bg-slate-800/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-indigo-400" />
                <h2 className="text-sm font-bold text-slate-100">
                  감사 결과 ({benchmarkData.snapshots.length}개 사이트)
                </h2>
              </div>
              {expandedSections.has('results') ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
            </button>

            {expandedSections.has('results') && (
              <div className="px-5 pb-5 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="text-left py-2 pr-3 text-slate-500">브랜드</th>
                      <th className="text-left py-2 pr-3 text-slate-500">티어</th>
                      <th className="text-right py-2 pr-3 text-slate-500">L1 기술</th>
                      <th className="text-right py-2 pr-3 text-slate-500">L2 스키마</th>
                      <th className="text-right py-2 pr-3 text-slate-500">L3 콘텐츠</th>
                      <th className="text-right py-2 pr-3 text-slate-500">E-E-A-T</th>
                      <th className="text-right py-2 text-slate-500">AI봇 접근</th>
                    </tr>
                  </thead>
                  <tbody>
                    {benchmarkData.snapshots.map(s => (
                      <tr key={s.siteId} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                        <td className="py-2 pr-3">
                          <div className="font-semibold text-slate-200">{s.brandName}</div>
                          {s.error && <div className="text-[10px] text-red-400">오류: {s.error}</div>}
                        </td>
                        <td className="py-2 pr-3">
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold border ${TIER_BADGE[s.tier]?.color}`}>
                            {TIER_BADGE[s.tier]?.label}
                          </span>
                        </td>
                        <td className={`py-2 pr-3 font-bold text-right ${s.techInfraScore >= 70 ? 'text-emerald-400' : s.techInfraScore >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                          {s.techInfraScore.toFixed(0)}
                        </td>
                        <td className={`py-2 pr-3 font-bold text-right ${s.schemaQualityScore >= 70 ? 'text-emerald-400' : s.schemaQualityScore >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                          {s.schemaQualityScore.toFixed(0)}
                        </td>
                        <td className={`py-2 pr-3 font-bold text-right ${s.contentSemanticScore >= 70 ? 'text-emerald-400' : s.contentSemanticScore >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                          {s.contentSemanticScore.toFixed(0)}
                        </td>
                        <td className={`py-2 pr-3 font-bold text-right ${s.eeatOverall >= 70 ? 'text-emerald-400' : s.eeatOverall >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                          {s.eeatOverall.toFixed(0)}
                        </td>
                        <td className={`py-2 font-bold text-right ${s.aiCrawlerAccessScore >= 80 ? 'text-emerald-400' : s.aiCrawlerAccessScore >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                          {s.aiCrawlerAccessScore.toFixed(0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Blueprint 요약 */}
          {benchmarkData.blueprint && (
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
              <button
                onClick={() => toggleSection('blueprint')}
                className="w-full flex items-center justify-between p-5 text-left cursor-pointer hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-violet-400" />
                  <h2 className="text-sm font-bold text-slate-100">
                    {benchmarkData.blueprint.displayNameKo} 표준 설계안 (Blueprint)
                  </h2>
                  <span className="text-[10px] text-slate-500">
                    샘플 {benchmarkData.blueprint.sampleCount}개 기준
                  </span>
                </div>
                {expandedSections.has('blueprint') ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
              </button>

              {expandedSections.has('blueprint') && (
                <div className="px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { section: benchmarkData.blueprint.techInfraStandard, color: "blue" },
                    { section: benchmarkData.blueprint.schemaStandard, color: "violet" },
                    { section: benchmarkData.blueprint.contentStrategy, color: "indigo" },
                    { section: benchmarkData.blueprint.designPatterns, color: "emerald" },
                  ].map(({ section, color }) => (
                    <div key={section.title} className={`bg-slate-800/40 border border-slate-700 rounded-xl p-4`}>
                      <h3 className="text-xs font-bold text-slate-300 mb-3">{section.title}</h3>
                      <div className="flex gap-4 text-xs mb-3">
                        <div>
                          <span className="text-slate-500">목표 점수</span>
                          <div className="text-lg font-black text-violet-400">{section.targetScore.toFixed(0)}pt</div>
                        </div>
                        <div>
                          <span className="text-slate-500">현재 평균</span>
                          <div className="text-lg font-black text-slate-300">{section.currentIndustryAvg.toFixed(0)}pt</div>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        {section.recommendations.slice(0, 3).map((rec, i) => (
                          <div key={i} className="flex items-start gap-2 text-[11px]">
                            <span className="text-violet-400 font-black mt-0.5">#{rec.priority}</span>
                            <span className="text-slate-400">{rec.title}</span>
                          </div>
                        ))}
                        {section.recommendations.length > 3 && (
                          <p className="text-[10px] text-slate-600">+{section.recommendations.length - 3}개 더...</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 통계 프로필 */}
          {benchmarkData.profile && benchmarkData.profile.excellentPatterns.length > 0 && (
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
              <button
                onClick={() => toggleSection('profile')}
                className="w-full flex items-center justify-between p-5 text-left cursor-pointer hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  <h2 className="text-sm font-bold text-slate-100">우수 사이트 공통 패턴</h2>
                </div>
                {expandedSections.has('profile') ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
              </button>

              {expandedSections.has('profile') && (
                <div className="px-5 pb-5 space-y-2">
                  {benchmarkData.profile.excellentPatterns.map(pattern => (
                    <div key={pattern.metricKey} className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 flex items-start gap-4">
                      <div className="shrink-0">
                        <div className="text-lg font-black text-emerald-400">{pattern.excellentMean.toFixed(0)}</div>
                        <div className="text-[9px] text-slate-500">우수 평균</div>
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-slate-200 mb-0.5">{pattern.dimension} — {pattern.metricKey}</div>
                        <div className="text-[11px] text-slate-400">{pattern.observation}</div>
                        <div className="text-[11px] text-indigo-400 mt-1">💡 {pattern.actionableInsight}</div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-xs font-bold text-red-400">미흡: {pattern.poorMean.toFixed(0)}</div>
                        <div className="text-[10px] text-slate-500">Gap: {pattern.gap.toFixed(0)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
