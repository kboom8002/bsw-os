"use client";
/**
 * components/benchmark/ThemeSelectorModal.tsx
 * 벤치마크 테마(도메인) 선택 모달 — 카드 그리드 UI.
 * 수평 탭 바를 대체합니다.
 */

import React, { useState, useMemo } from "react";
import {
  X, Search, Compass, Droplets, Camera, BarChart3,
  Music, Building2, Plus, ChevronRight, Star
} from "lucide-react";
import { BENCHMARK_DOMAINS } from "../../lib/benchmark/domain-config";
import { INDUSTRY_PANELS_DATA } from "../../db/seed/industry-panels/questions-data";
import type { IndustryType } from "../../db/seed/industry-panels/questions-data";

interface ThemeSelectorModalProps {
  activeSlug: string;
  onSelect: (slug: string) => void;
  onClose: () => void;
  isAdmin?: boolean;
  onAddTheme?: () => void;
}

// Category groups for organizing themes
const THEME_CATEGORIES: { label: string; slugPrefix: string[]; color: string }[] = [
  { label: '플레이스 브랜드', slugPrefix: ['jeju', 'seoul'], color: 'emerald' },
  { label: 'K-컬처', slugPrefix: ['kpop'], color: 'pink' },
  { label: '뷰티/라이프스타일', slugPrefix: ['skincare', 'wedding'], color: 'violet' },
];

function getCategory(slug: string): string {
  for (const cat of THEME_CATEGORIES) {
    if (cat.slugPrefix.some((p) => slug.startsWith(p))) return cat.label;
  }
  return '기타';
}

function DomainIcon({ slug, className = "h-6 w-6" }: { slug: string; className?: string }) {
  if (slug === 'skincare') return <Droplets className={className} />;
  if (slug === 'wedding_studio') return <Camera className={className} />;
  if (slug.startsWith('seoul_district')) return <Building2 className={className} />;
  if (slug.startsWith('kpop_idol')) return <Music className={className} />;
  if (slug.startsWith('jeju_place')) return <Compass className={className} />;
  if (slug.startsWith('jeju_smb')) return <Building2 className={className} />;
  return <BarChart3 className={className} />;
}

function getCategoryColor(slug: string): string {
  for (const cat of THEME_CATEGORIES) {
    if (cat.slugPrefix.some((p) => slug.startsWith(p))) return cat.color;
  }
  return 'slate';
}

interface ThemeCardProps {
  slug: string;
  isActive: boolean;
  onSelect: () => void;
}

function ThemeCard({ slug, isActive, onSelect }: ThemeCardProps) {
  const cfg = BENCHMARK_DOMAINS[slug];
  const industryType = cfg.industryType as IndustryType;
  const panelData = INDUSTRY_PANELS_DATA[industryType];
  const questionCount = panelData?.questions?.length ?? 0;
  const brandCount = cfg.brands?.length ?? 0;
  const color = getCategoryColor(slug);

  const colorMap: Record<string, { bg: string; border: string; text: string; icon: string }> = {
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', icon: 'text-emerald-500' },
    pink: { bg: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-400', icon: 'text-pink-500' },
    violet: { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-400', icon: 'text-violet-500' },
    slate: { bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-400', icon: 'text-slate-500' },
  };
  const colors = colorMap[color] ?? colorMap.slate;

  return (
    <button
      onClick={onSelect}
      className={`group relative flex flex-col items-start gap-3 p-4 rounded-xl border text-left transition-all duration-200 w-full ${
        isActive
          ? `${colors.bg} ${colors.border} shadow-lg`
          : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
      }`}
    >
      {isActive && (
        <div className="absolute top-2 right-2">
          <Star className={`h-3.5 w-3.5 ${colors.text} fill-current`} />
        </div>
      )}

      {/* Icon */}
      <div className={`p-2 rounded-lg ${isActive ? colors.bg : 'bg-slate-800/60'}`}>
        <DomainIcon
          slug={slug}
          className={`h-5 w-5 ${isActive ? colors.icon : 'text-slate-400 group-hover:text-slate-200'}`}
        />
      </div>

      {/* Name */}
      <div>
        <div className={`text-sm font-bold leading-tight ${isActive ? colors.text : 'text-slate-200'}`}>
          {cfg.name}
        </div>
        <div className="text-[11px] text-slate-500 mt-0.5 leading-tight line-clamp-2">
          {cfg.description}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 mt-auto w-full">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Brands</span>
          <span className={`text-sm font-black ${isActive ? colors.text : 'text-slate-300'}`}>
            {brandCount}
          </span>
        </div>
        <div className="w-px h-6 bg-slate-800" />
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Questions</span>
          <span className={`text-sm font-black ${isActive ? colors.text : 'text-slate-300'}`}>
            {questionCount}
          </span>
        </div>
        {isActive && (
          <div className="ml-auto">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}>
              현재 선택
            </span>
          </div>
        )}
      </div>
    </button>
  );
}

export default function ThemeSelectorModal({
  activeSlug,
  onSelect,
  onClose,
  isAdmin = false,
  onAddTheme,
}: ThemeSelectorModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
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

  // Group by category
  const grouped = useMemo(() => {
    const groups: Record<string, string[]> = {};
    for (const slug of filteredSlugs) {
      const cat = getCategory(slug);
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(slug);
    }
    return groups;
  }, [filteredSlugs]);

  const handleSelect = (slug: string) => {
    onSelect(slug);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-3xl max-h-[85vh] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl shadow-black/80 flex flex-col overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 flex-shrink-0">
            <div>
              <h2 className="text-lg font-black text-slate-100">벤치마크 테마 선택</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                측정할 업종/도메인 테마를 선택하세요 — {allSlugs.length}개 테마 등록됨
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && onAddTheme && (
                <button
                  onClick={() => { onClose(); onAddTheme(); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all"
                >
                  <Plus className="h-3.5 w-3.5" />
                  테마 추가
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="px-6 py-3 border-b border-slate-800/60 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="테마 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all"
                autoFocus
              />
            </div>
          </div>

          {/* Theme Grid — scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {Object.keys(grouped).length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                검색 결과가 없습니다
              </div>
            ) : (
              Object.entries(grouped).map(([category, slugs]) => (
                <div key={category}>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                    <span>{category}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-500">
                      {slugs.length}
                    </span>
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {slugs.map((slug) => (
                      <ThemeCard
                        key={slug}
                        slug={slug}
                        isActive={slug === activeSlug}
                        onSelect={() => handleSelect(slug)}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-slate-800 flex items-center justify-between flex-shrink-0 bg-slate-950">
            <p className="text-[11px] text-slate-600">
              현재: <span className="text-slate-400 font-semibold">{BENCHMARK_DOMAINS[activeSlug]?.name}</span>
            </p>
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
            >
              닫기 <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
