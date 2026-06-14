"use client";

import React, { useState, useMemo } from "react";
import { FileText, Link2, Tag, ChevronDown, ChevronUp, Search, Filter, CheckCircle, XCircle, Globe } from "lucide-react";
import type { QuestionDetail } from "../../lib/benchmark/lightweight-metric-runner";

interface RawQueryResult {
  questionIdx: number;
  text: string;
  citations: { url: string; domain: string; title: string }[];
}

interface EvidenceExplorerProps {
  questionDetails: QuestionDetail[];
  rawQueryResults: RawQueryResult[];   // full response text + citation URLs
  allBrandNames: string[];
}

// ─── Snippet extractor ────────────────────────────────────────
function extractSnippet(text: string, brandName: string, charRadius = 140): string {
  if (!text) return "";
  const lower = text.toLowerCase();
  const brandLower = brandName.toLowerCase();
  const idx = lower.indexOf(brandLower);
  if (idx === -1) {
    return text.slice(0, charRadius * 2) + (text.length > charRadius * 2 ? "…" : "");
  }
  const start = Math.max(0, idx - charRadius);
  const end = Math.min(text.length, idx + brandLower.length + charRadius);
  return (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
}

function highlightBrand(snippet: string, brandName: string) {
  const parts = snippet.split(new RegExp(`(${brandName})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === brandName.toLowerCase()
      ? <mark key={i} className="bg-amber-400/30 text-amber-200 rounded px-0.5">{part}</mark>
      : part
  );
}

// ─── Single question evidence card ────────────────────────────
function QuestionCard({
  qd,
  rawResult,
  focusBrand,
}: {
  qd: QuestionDetail;
  rawResult?: RawQueryResult;
  focusBrand: string | null;
}) {
  const [expanded, setExpanded] = useState(false);

  const engineKeys = Object.keys(qd.per_engine);
  const firstEngine = engineKeys[0];
  const ed = firstEngine ? qd.per_engine[firstEngine] : null;

  // Use rawResult for full text + proper citation URLs; fall back to per_engine data
  const fullText = rawResult?.text ?? ed?.raw_response_text ?? "";
  const citations = rawResult?.citations ?? [];
  const brandsFound = ed?.brands_mentioned ?? [];
  const hasTargetBrand = focusBrand ? brandsFound.includes(focusBrand) : brandsFound.length > 0;

  const previewText = focusBrand && hasTargetBrand
    ? extractSnippet(fullText, focusBrand)
    : fullText.slice(0, 280) + (fullText.length > 280 ? "…" : "");

  const LAYER_COLORS: Record<string, string> = {
    L1_universal: "bg-slate-700 text-slate-300",
    L3_ingredient: "bg-emerald-900/60 text-emerald-300",
    L5_ymyl: "bg-rose-900/60 text-rose-300",
    L6_trend: "bg-violet-900/60 text-violet-300",
    L7_brand: "bg-indigo-900/60 text-indigo-300",
    L2_competitive: "bg-orange-900/60 text-orange-300",
  };

  const TYPE_LABELS: Record<string, string> = {
    recommendation: "추천",
    comparison: "비교",
    informational: "정보",
    routine_guidance: "루틴",
    source_seeking: "출처",
    trust_verification: "신뢰",
    product_fit: "제품",
    risk_boundary: "리스크",
  };

  return (
    <div className={`rounded-xl border transition-all duration-200 ${
      hasTargetBrand && focusBrand
        ? "border-amber-500/30 bg-amber-950/10"
        : "border-slate-800 bg-slate-900/20"
    }`}>
      {/* Question header */}
      <div
        className="flex items-start gap-3 p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="shrink-0 mt-0.5">
          {hasTargetBrand && focusBrand ? (
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          ) : focusBrand ? (
            <XCircle className="w-4 h-4 text-slate-600" />
          ) : (
            <FileText className="w-4 h-4 text-slate-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-1.5 mb-1.5">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${LAYER_COLORS[qd.layer] ?? "bg-slate-700 text-slate-300"}`}>
              {qd.layer}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
              {TYPE_LABELS[qd.question_type] ?? qd.question_type}
            </span>
            {brandsFound.length > 0 && (
              <span className="text-[10px] text-slate-500">{brandsFound.length}개 브랜드 언급</span>
            )}
          </div>
          <p className="text-sm font-semibold text-slate-200 leading-snug">{qd.question_text}</p>
        </div>
        <div className="shrink-0 text-slate-600">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-800/60 pt-3">
          {/* AI Response snippet */}
          {fullText ? (
            <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Search className="w-3 h-3" />
                Gemini 응답 {focusBrand && hasTargetBrand ? "— 브랜드 언급 구간 하이라이트" : "— 미리보기"}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-mono">
                {focusBrand && hasTargetBrand
                  ? highlightBrand(previewText, focusBrand)
                  : previewText}
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-600 italic">응답 텍스트가 없습니다.</p>
          )}

          {/* Brand tags */}
          {brandsFound.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              {brandsFound.map((b) => (
                <span
                  key={b}
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                    b === focusBrand
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      : "bg-slate-800 text-slate-400 border-slate-700"
                  }`}
                >
                  {b}
                </span>
              ))}
            </div>
          )}

          {/* Citations */}
          {citations.length > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Link2 className="w-3 h-3" />
                인용 출처 ({citations.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {citations.slice(0, 6).map((c, i) => (
                  <a
                    key={i}
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 bg-cyan-950/30 border border-cyan-800/30 rounded-lg px-2 py-1 transition-colors"
                  >
                    <Globe className="w-2.5 h-2.5" />
                    {c.domain}
                  </a>
                ))}
                {citations.length > 6 && (
                  <span className="text-[11px] text-slate-600">+{citations.length - 6}개 더</span>
                )}
              </div>
            </div>
          )}

          {/* Domain-only citations fallback (from ed) */}
          {citations.length === 0 && ed && ed.citation_domains.length > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3 h-3" />
                인용 도메인 ({ed.citation_domains.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {ed.citation_domains.slice(0, 6).map((d, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-[11px] text-cyan-400/70 bg-cyan-950/20 border border-cyan-900/30 rounded-lg px-2 py-1">
                    <Globe className="w-2.5 h-2.5" />
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Brand summary bar ─────────────────────────────────────────
function BrandSummaryBar({
  brandName,
  total,
  mentioned,
  color,
  isSelected,
  onClick,
}: {
  brandName: string;
  total: number;
  mentioned: number;
  color: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  const pct = total > 0 ? Math.round((mentioned / total) * 100) : 0;
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-xl border transition-all ${
        isSelected
          ? "border-amber-500/40 bg-amber-950/20"
          : "border-slate-800 bg-slate-900/20 hover:border-slate-700"
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ backgroundColor: color }} />
          {brandName}
        </span>
        <span className="text-xs font-black" style={{ color }}>
          {mentioned}/{total}
        </span>
      </div>
      <div className="w-full bg-slate-800 rounded-full h-1.5">
        <div
          className="h-1.5 rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-[10px] text-slate-500 mt-1">{pct}% 질문에서 언급됨</p>
    </button>
  );
}

// ─── Main Evidence Explorer ────────────────────────────────────
export default function EvidenceExplorer({
  questionDetails,
  rawQueryResults,
  allBrandNames,
}: EvidenceExplorerProps) {
  const [focusBrand, setFocusBrand] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"all" | "mentioned" | "missing">("all");
  const [searchText, setSearchText] = useState("");

  // Per-brand mention counts
  const brandMentionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const name of allBrandNames) counts[name] = 0;
    for (const qd of questionDetails) {
      const engine = Object.keys(qd.per_engine)[0];
      if (!engine) continue;
      for (const b of qd.per_engine[engine].brands_mentioned) {
        if (counts[b] !== undefined) counts[b]++;
      }
    }
    return counts;
  }, [questionDetails, allBrandNames]);

  // Filtered questions
  const filtered = useMemo(() => {
    return questionDetails.filter((qd) => {
      const engine = Object.keys(qd.per_engine)[0];
      const brandsHere = engine ? qd.per_engine[engine].brands_mentioned : [];

      if (filterType === "mentioned" && focusBrand && !brandsHere.includes(focusBrand)) return false;
      if (filterType === "missing" && focusBrand && brandsHere.includes(focusBrand)) return false;
      if (searchText && !qd.question_text.toLowerCase().includes(searchText.toLowerCase())) return false;
      return true;
    });
  }, [questionDetails, focusBrand, filterType, searchText]);

  // Brand colors (simple cycle)
  const COLORS = [
    "#6366f1", "#f59e0b", "#10b981", "#06b6d4", "#f43f5e",
    "#8b5cf6", "#14b8a6", "#f97316", "#84cc16", "#ec4899",
    "#3b82f6", "#a855f7", "#ef4444", "#22d3ee", "#fbbf24",
    "#34d399", "#e879f9", "#fb923c", "#4ade80", "#38bdf8",
  ];
  const brandColors: Record<string, string> = {};
  allBrandNames.forEach((name, i) => { brandColors[name] = COLORS[i % COLORS.length]; });

  if (questionDetails.length === 0) return null;

  return (
    <div className="border border-cyan-500/20 rounded-2xl bg-slate-900/20 backdrop-blur-xl p-6 mb-8 shadow-2xl shadow-cyan-950/30">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-cyan-500/10 rounded-xl">
          <FileText className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-100">질문별 AI 응답 증거 탐색기</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {questionDetails.length}개 질문 · 브랜드를 클릭하면 해당 브랜드 언급 질문만 표시됩니다
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar: Brand summary */}
        <div className="lg:col-span-1 space-y-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
            <Tag className="w-3.5 h-3.5" />
            브랜드별 언급 현황
          </h3>
          <BrandSummaryBar
            brandName="전체 보기"
            total={questionDetails.length}
            mentioned={questionDetails.length}
            color="#94a3b8"
            isSelected={focusBrand === null}
            onClick={() => { setFocusBrand(null); setFilterType("all"); }}
          />
          {allBrandNames.map((name) => (
            <BrandSummaryBar
              key={name}
              brandName={name}
              total={questionDetails.length}
              mentioned={brandMentionCounts[name] ?? 0}
              color={brandColors[name]}
              isSelected={focusBrand === name}
              onClick={() => {
                setFocusBrand(focusBrand === name ? null : name);
                setFilterType("all");
              }}
            />
          ))}
        </div>

        {/* Main: Question cards */}
        <div className="lg:col-span-3 space-y-3">
          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <div className="relative flex-1 min-w-40">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="질문 검색..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
            {focusBrand && (
              <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg p-1">
                <Filter className="w-3 h-3 text-slate-500 ml-1" />
                {(["all", "mentioned", "missing"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilterType(f)}
                    className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all ${
                      filterType === f
                        ? "bg-cyan-500/20 text-cyan-300"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {f === "all" ? "전체" : f === "mentioned" ? "언급됨" : "미언급"}
                  </button>
                ))}
              </div>
            )}
            <span className="text-xs text-slate-500">{filtered.length}개 표시 중</span>
          </div>

          {/* Question list */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filtered.map((qd, i) => {
              const rawResult = rawQueryResults.find(
                (r) => questionDetails[r.questionIdx]?.question_text === qd.question_text
              );
              return (
                <QuestionCard
                  key={i}
                  qd={qd}
                  rawResult={rawResult}
                  focusBrand={focusBrand}
                />
              );
            })}
            {filtered.length === 0 && (
              <div className="py-12 text-center border border-slate-800 rounded-xl bg-slate-900/20">
                <Search className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">조건에 맞는 질문이 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
