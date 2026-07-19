"use client";
/**
 * components/benchmark/BenchmarkAdminPanel.tsx
 * 벤치마크 테마 및 프로브셋 관리 어드민 패널.
 */

import React, { useState, useMemo } from "react";
import {
  BarChart3, ChevronRight, ChevronDown, Plus, Search,
  Layers, Settings, Database, CheckCircle, AlertCircle,
  FileText, Users, Compass, Droplets, Camera, Music, Building2,
  X, Edit3, Eye, ToggleLeft, ToggleRight, Info
} from "lucide-react";
import { BENCHMARK_DOMAINS } from "../../lib/benchmark/domain-config";
import { INDUSTRY_PANELS_DATA } from "../../db/seed/industry-panels/questions-data";
import type { IndustryType } from "../../db/seed/industry-panels/questions-data";

// ─── Layer distribution chart ─────────────────────────────────────
const LAYER_COLORS: Record<string, string> = {
  L1_universal: '#6366f1',
  L2_competitive: '#8b5cf6',
  L3_ingredient: '#a78bfa',
  L4_journey: '#22d3ee',
  L5_ymyl: '#f43f5e',
  L6_trend: '#f59e0b',
  L7_brand: '#10b981',
};

const LAYER_LABELS: Record<string, string> = {
  L1_universal: 'L1 범용',
  L2_competitive: 'L2 경쟁',
  L3_ingredient: 'L3 심화',
  L4_journey: 'L4 여정',
  L5_ymyl: 'L5 YMYL',
  L6_trend: 'L6 트렌드',
  L7_brand: 'L7 브랜드',
};

function LayerBar({ layer, count, total }: { layer: string; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 text-[10px] text-slate-400 font-mono flex-shrink-0">
        {LAYER_LABELS[layer] ?? layer}
      </div>
      <div className="flex-1 bg-slate-800 rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: LAYER_COLORS[layer] ?? '#6366f1' }}
        />
      </div>
      <div className="w-8 text-[10px] text-slate-400 text-right">{count}</div>
    </div>
  );
}

function DomainIcon({ slug }: { slug: string }) {
  if (slug === 'skincare') return <Droplets className="h-4 w-4" />;
  if (slug === 'wedding_studio') return <Camera className="h-4 w-4" />;
  if (slug.startsWith('seoul_district')) return <Building2 className="h-4 w-4" />;
  if (slug.startsWith('kpop_idol')) return <Music className="h-4 w-4" />;
  if (slug.startsWith('jeju_place')) return <Compass className="h-4 w-4" />;
  if (slug.startsWith('jeju_attraction')) return <Compass className="h-4 w-4" />;
  if (slug.startsWith('jeju_smb')) return <Building2 className="h-4 w-4" />;
  return <BarChart3 className="h-4 w-4" />;
}

// ─── Theme card (admin) ──────────────────────────────────────────
interface ThemeAdminCardProps {
  slug: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

function ThemeAdminCard({ slug, isExpanded, onToggleExpand }: ThemeAdminCardProps) {
  const cfg = BENCHMARK_DOMAINS[slug];
  const industryType = cfg.industryType as IndustryType;
  const panelData = INDUSTRY_PANELS_DATA[industryType];
  const questions = panelData?.questions ?? [];

  // Layer distribution
  const layerCounts: Record<string, number> = {};
  for (const q of questions) {
    const l = q.layer ?? 'unknown';
    layerCounts[l] = (layerCounts[l] ?? 0) + 1;
  }
  const totalQ = questions.length;

  // Validation checks
  const qWithFewVariants = questions.filter((q) => (q.query_variants?.length ?? 0) < 2).length;
  const qMissingMustInclude = questions.filter((q) => (q.must_include?.length ?? 0) === 0).length;
  const isHealthy = qWithFewVariants === 0 && qMissingMustInclude === 0;

  // Question type distribution
  const typeCounts: Record<string, number> = {};
  for (const q of questions) {
    const t = q.question_type ?? 'unknown';
    typeCounts[t] = (typeCounts[t] ?? 0) + 1;
  }

  return (
    <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/20">
      {/* Card header */}
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center gap-3 p-4 hover:bg-slate-800/30 transition-all text-left"
      >
        <div className="p-2 rounded-lg bg-slate-800">
          <DomainIcon slug={slug} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-100 text-sm">{cfg.name}</span>
            <span className="text-[10px] text-slate-500 font-mono">{slug}</span>
            {isHealthy ? (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle className="h-3 w-3" /> 정상
              </span>
            ) : (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <AlertCircle className="h-3 w-3" /> 점검 필요
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5 truncate">{cfg.description}</p>
        </div>

        <div className="flex items-center gap-4 text-right flex-shrink-0">
          <div>
            <div className="text-lg font-black text-slate-200">{cfg.brands?.length ?? 0}</div>
            <div className="text-[10px] text-slate-500">브랜드</div>
          </div>
          <div>
            <div className="text-lg font-black text-indigo-400">{totalQ}</div>
            <div className="text-[10px] text-slate-500">Questions</div>
          </div>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-400" />
          )}
        </div>
      </button>

      {/* Expanded detail */}
      {isExpanded && (
        <div className="border-t border-slate-800 p-4 grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Layer distribution */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5" /> 레이어 분포
            </h4>
            <div className="space-y-1.5">
              {Object.entries(LAYER_LABELS).map(([layer]) => (
                <LayerBar
                  key={layer}
                  layer={layer}
                  count={layerCounts[layer] ?? 0}
                  total={totalQ}
                />
              ))}
            </div>
          </div>

          {/* Question type distribution */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" /> 질문 유형
            </h4>
            <div className="space-y-1.5">
              {Object.entries(typeCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-mono truncate max-w-32">{type}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-800 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full bg-indigo-500"
                          style={{ width: `${(count / totalQ) * 100}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-slate-400 w-5 text-right">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Validation status + brands */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5" /> 유효성 검증
            </h4>
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">variants ≥ 2</span>
                <span className={`text-xs font-bold ${qWithFewVariants === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {qWithFewVariants === 0 ? '✓ 전체 통과' : `⚠ ${qWithFewVariants}개 부족`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">must_include ≥ 1</span>
                <span className={`text-xs font-bold ${qMissingMustInclude === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {qMissingMustInclude === 0 ? '✓ 전체 통과' : `⚠ ${qMissingMustInclude}개 누락`}
                </span>
              </div>
            </div>

            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" /> 브랜드 목록
            </h4>
            <div className="flex flex-wrap gap-1">
              {cfg.brands?.slice(0, 8).map((brand) => (
                <span
                  key={brand.slug}
                  className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700"
                >
                  {brand.name}
                </span>
              ))}
              {(cfg.brands?.length ?? 0) > 8 && (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-500 border border-slate-700">
                  +{(cfg.brands?.length ?? 0) - 8}개 더
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Admin Panel ─────────────────────────────────────────────
export default function BenchmarkAdminPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'themes' | 'questions'>('themes');
  const [questionSearch, setQuestionSearch] = useState('');
  const [selectedDomainForQ, setSelectedDomainForQ] = useState(Object.keys(BENCHMARK_DOMAINS)[0]);

  const allSlugs = Object.keys(BENCHMARK_DOMAINS);

  const filteredSlugs = useMemo(() => {
    if (!searchQuery.trim()) return allSlugs;
    const q = searchQuery.toLowerCase();
    return allSlugs.filter((slug) => {
      const cfg = BENCHMARK_DOMAINS[slug];
      return (
        cfg.name.toLowerCase().includes(q) ||
        cfg.description?.toLowerCase().includes(q) ||
        slug.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, allSlugs]);

  // Question browser for selected domain
  const selectedPanel = INDUSTRY_PANELS_DATA[BENCHMARK_DOMAINS[selectedDomainForQ]?.industryType as IndustryType];
  const selectedQuestions = selectedPanel?.questions ?? [];
  const filteredQuestions = useMemo(() => {
    if (!questionSearch.trim()) return selectedQuestions;
    const q = questionSearch.toLowerCase();
    return selectedQuestions.filter((qItem) =>
      qItem.question_text.toLowerCase().includes(q) ||
      (qItem.intent_context ?? '').toLowerCase().includes(q) ||
      (qItem.layer ?? '').toLowerCase().includes(q)
    );
  }, [selectedQuestions, questionSearch]);

  // Overall stats
  const totalThemes = allSlugs.length;
  const totalBrands = allSlugs.reduce((s, slug) => s + (BENCHMARK_DOMAINS[slug].brands?.length ?? 0), 0);
  const totalQuestions = allSlugs.reduce((s, slug) => {
    const panel = INDUSTRY_PANELS_DATA[BENCHMARK_DOMAINS[slug].industryType as IndustryType];
    return s + (panel?.questions?.length ?? 0);
  }, 0);

  return (
    <div className="min-h-0 flex-1 flex flex-col">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: '총 테마', value: totalThemes, icon: Database, color: 'indigo' },
          { label: '총 브랜드', value: totalBrands, icon: Users, color: 'violet' },
          { label: '총 프로브 질문', value: totalQuestions, icon: FileText, color: 'cyan' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 uppercase tracking-wider">{label}</span>
              <Icon className={`h-4 w-4 text-${color}-400`} />
            </div>
            <div className={`text-3xl font-black text-${color}-400`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Tab selector */}
      <div className="flex gap-2 mb-5 bg-slate-900/60 p-1 rounded-xl border border-slate-800 w-fit">
        {([['themes', '테마 관리', Settings], ['questions', '프로브셋 질문', FileText]] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all ${
              activeTab === key
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Theme management tab ── */}
      {activeTab === 'themes' && (
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="테마 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all"
              />
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Info className="h-4 w-4 flex-shrink-0" />
              <span className="text-xs">테마 추가/편집은 domain-config.ts와 questions-data.ts를 수정하세요</span>
            </div>
          </div>

          {filteredSlugs.map((slug) => (
            <ThemeAdminCard
              key={slug}
              slug={slug}
              isExpanded={expandedSlug === slug}
              onToggleExpand={() => setExpandedSlug(expandedSlug === slug ? null : slug)}
            />
          ))}
        </div>
      )}

      {/* ── Question browser tab ── */}
      {activeTab === 'questions' && (
        <div className="flex-1 space-y-4">
          {/* Domain selector */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex gap-1.5 flex-wrap">
              {allSlugs.map((slug) => (
                <button
                  key={slug}
                  onClick={() => setSelectedDomainForQ(slug)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                    selectedDomainForQ === slug
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {BENCHMARK_DOMAINS[slug].name}
                </button>
              ))}
            </div>
          </div>

          {/* Search within domain */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="질문 텍스트, 레이어, 카테고리로 검색..."
                value={questionSearch}
                onChange={(e) => setQuestionSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all"
              />
            </div>
            <span className="text-xs text-slate-500">{filteredQuestions.length} / {selectedQuestions.length}개</span>
          </div>

          {/* Layer distribution mini bar */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              {BENCHMARK_DOMAINS[selectedDomainForQ]?.name} — 레이어 분포
            </h4>
            <div className="space-y-1.5">
              {Object.entries(LAYER_LABELS).map(([layer, label]) => {
                const count = selectedQuestions.filter((q) => q.layer === layer).length;
                return (
                  <LayerBar
                    key={layer}
                    layer={layer}
                    count={count}
                    total={selectedQuestions.length}
                  />
                );
              })}
            </div>
          </div>

          {/* Question list */}
          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <div className="grid grid-cols-[auto_1fr_auto_auto_auto] text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-900 border-b border-slate-800 px-4 py-2 gap-3">
              <span>#</span>
              <span>질문</span>
              <span>레이어</span>
              <span>유형</span>
              <span>위험도</span>
            </div>
            <div className="divide-y divide-slate-800/50 max-h-[500px] overflow-y-auto">
              {filteredQuestions.map((q, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-3 px-4 py-3 hover:bg-slate-800/20 transition-all items-start"
                >
                  <span className="text-[11px] text-slate-600 font-mono w-6 text-right pt-0.5">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="text-xs text-slate-300 leading-relaxed">{q.question_text}</p>
                    {q.intent_context && (
                      <span className="text-[10px] text-slate-600 font-mono">{q.intent_context}</span>
                    )}
                  </div>
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-700 text-slate-400 bg-slate-800 whitespace-nowrap self-start"
                    style={{ color: LAYER_COLORS[q.layer ?? ''] }}
                  >
                    {LAYER_LABELS[q.layer ?? ''] ?? q.layer}
                  </span>
                  <span className="text-[10px] text-slate-500 whitespace-nowrap self-start">{q.question_type}</span>
                  <span className={`text-[10px] font-bold self-start ${
                    q.risk_level === 'high' ? 'text-rose-400' :
                    q.risk_level === 'medium' ? 'text-amber-400' : 'text-slate-500'
                  }`}>
                    {q.risk_level}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
