"use client";

import React, { useState, useEffect } from "react";
import {
  X, ExternalLink, Activity, Globe, Shield,
  TrendingUp, TrendingDown, Minus, BarChart3,
  Target, Eye, Search, Zap, FileText, MessageSquare, Link2, ChevronDown, ChevronUp, Clock, Award
} from "lucide-react";
import type { BenchmarkLeaderboardEntry, BenchmarkHistoryPoint } from "../../app/actions/benchmark";
import type { QuestionDetail } from "../../lib/benchmark/lightweight-metric-runner";

interface RawQueryResult {
  questionIdx: number;
  text: string;
  citations: { url: string; domain: string; title: string }[];
}

interface BrandDetailDrawerProps {
  brand: BenchmarkLeaderboardEntry | null;
  domainSlug: string;
  domainName: string;
  history: BenchmarkHistoryPoint[];
  onClose: () => void;
  questionDetails?: QuestionDetail[];
  rawQueryResults?: RawQueryResult[];
}

function TrendBadge({ value }: { value: number }) {
  if (value > 0) return (
    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
      <TrendingUp className="h-3 w-3" /> +{value}%
    </span>
  );
  if (value < 0) return (
    <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-400 bg-rose-400/10 px-2 py-0.5 rounded-full">
      <TrendingDown className="h-3 w-3" /> {value}%
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-500/10 px-2 py-0.5 rounded-full">
      <Minus className="h-3 w-3" /> 0%
    </span>
  );
}

// ─── SVG Sparkline ────────────────────────────────────────
function Sparkline({ data, brandSlug, color }: {
  data: BenchmarkHistoryPoint[];
  brandSlug: string;
  color: string;
}) {
  const brandData = data.filter(d => d.brand_slug === brandSlug);
  if (brandData.length < 2) {
    return (
      <div className="w-full h-24 flex items-center justify-center text-slate-600 text-xs">
        히스토리 데이터 수집 중...
      </div>
    );
  }

  const values = brandData.map(d => d.aas);
  const min = Math.min(...values) - 5;
  const max = Math.max(...values) + 5;
  const range = max - min || 1;
  const w = 400;
  const h = 100;

  const points = brandData.map((d, i) => {
    const x = (i / (brandData.length - 1)) * w;
    const y = h - ((d.aas - min) / range) * (h - 20) - 10;
    return `${x},${y}`;
  });

  const areaPoints = [
    `0,${h}`,
    ...points,
    `${w},${h}`
  ].join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-24">
      <defs>
        <linearGradient id={`spark-grad-${brandSlug}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={areaPoints}
        fill={`url(#spark-grad-${brandSlug})`}
      />
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {brandData.length > 0 && (() => {
        const last = brandData[brandData.length - 1];
        const x = w;
        const y = h - ((last.aas - min) / range) * (h - 20) - 10;
        return (
          <>
            <circle cx={x} cy={y} r="5" fill={color} />
            <circle cx={x} cy={y} r="8" fill={color} opacity="0.3">
              <animate attributeName="r" from="5" to="12" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" from="0.3" to="0" dur="2s" repeatCount="indefinite" />
            </circle>
          </>
        );
      })()}
    </svg>
  );
}

// ─── Metric Ring ──────────────────────────────────────────
function MetricRing({ value, label, color, icon: Icon }: {
  value: number | null;
  label: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const v = value ?? 0;
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c - (v / 100) * c;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
          <circle cx="40" cy="40" r={r} fill="none" stroke="rgb(30 41 59)" strokeWidth="6" />
          <circle
            cx="40" cy="40" r={r}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div style={{ color }}>
            <Icon className="h-4 w-4 mb-0.5" />
          </div>
          <span className="text-lg font-black" style={{ color }}>
            {value !== null ? `${value}` : '—'}
          </span>
        </div>
      </div>
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
        {label}
      </span>
    </div>
  );
}

// ─── Main Drawer ──────────────────────────────────────────
export default function BrandDetailDrawer({
  brand, domainSlug, domainName, history, onClose,
  questionDetails = [], rawQueryResults = []
}: BrandDetailDrawerProps) {
  const [visible, setVisible] = useState(false);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'overview' | 'evidence'>('overview');

  useEffect(() => {
    if (brand) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [brand]);

  if (!brand) return null;

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleClose}
      />

      {/* Drawer Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-lg bg-slate-900 border-l border-slate-700/50 z-50 overflow-y-auto shadow-2xl transition-transform duration-300 ${
          visible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="h-4 w-4 rounded-full shadow-lg"
                style={{ backgroundColor: brand.color, boxShadow: `0 0 12px ${brand.color}40` }}
              />
              <div>
                <h2 className="text-lg font-black text-slate-100">{brand.brand_name}</h2>
                <span className="text-xs text-slate-400">{domainName} · 순위 #{brand.rank}</span>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        {/* Tabs */}
          <div className="flex items-center gap-1 bg-slate-800/60 rounded-lg p-1">
            <button
              onClick={() => setActiveDrawerTab('overview')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeDrawerTab === 'overview' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="h-3 w-3" /> 지표
            </button>
            <button
              onClick={() => setActiveDrawerTab('evidence')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeDrawerTab === 'evidence' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="h-3 w-3" /> 근거 ({questionDetails.filter(qd => {
                const eng = Object.keys(qd.per_engine)[0];
                return eng && qd.per_engine[eng].brands_mentioned.includes(brand?.brand_name ?? '');
              }).length})
            </button>
          </div>
        </div>

        {/* Content */}
        {activeDrawerTab === 'overview' ? (
        <div className="p-6 space-y-6">

          {/* Trend Badge */}
          <div className="flex items-center gap-3">
            <TrendBadge value={brand.aas_trend} />
            <span className="text-xs text-slate-500">vs 이전 측정</span>
          </div>

          {/* Metric Rings */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
            <MetricRing value={brand.aas} label="AAS" color={brand.color} icon={Search} />
            <MetricRing value={brand.ocr} label="OCR" color="#06b6d4" icon={Globe} />
            <MetricRing value={brand.bsf} label="BSF" color="#10b981" icon={Shield} />
            <MetricRing value={brand.bair} label="BAIR" color="#f59e0b" icon={Target} />
            <MetricRing value={brand.top3} label="Top-3" color="#22d3ee" icon={Award} />
            <MetricRing value={brand.top5} label="Top-5" color="#14b8a6" icon={Award} />
            <MetricRing value={brand.freshness} label="Fresh" color="#10b981" icon={Clock} />
          </div>

          {/* Sparkline */}
          <div className="border border-slate-800 rounded-xl bg-slate-900/40 p-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Activity className="h-3.5 w-3.5" />
              30일 AAS 추이
            </h3>
            <Sparkline data={history} brandSlug={brand.brand_slug} color={brand.color} />
          </div>

          {/* Metric Descriptions */}
          <div className="border border-slate-800 rounded-xl bg-slate-900/40 p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="h-3.5 w-3.5" />
              지표 해석
            </h3>

            <div className="space-y-2.5">
              <MetricExplainer
                label="AAS (Brand Answer Share)"
                value={brand.aas}
                color={brand.color}
                description="AI 검색 응답에서 이 브랜드가 언급되는 비율. 높을수록 AI가 이 브랜드를 자주 소환합니다."
              />
              <MetricExplainer
                label="OCR (Observed Citation Rate)"
                value={brand.ocr}
                color="#06b6d4"
                description="AI 답변의 Citations/Sources에 공식 도메인이 포함된 비율. SEO처럼 AI 인용을 측정합니다."
              />
              <MetricExplainer
                label="BSF (Brand Semantic Fidelity)"
                value={brand.bsf}
                color="#10b981"
                description="AI가 브랜드를 언급할 때 핵심 키워드가 정확히 반영되는 의미적 충실도."
              />
              <MetricExplainer
                label="BAIR (Brand AI Recommendation)"
                value={brand.bair}
                color="#f59e0b"
                description="AAS × BSF/100. AI가 '잘' 추천해 주는 정도의 복합 지수."
              />
              <MetricExplainer
                label="Top-3 / Top-5 Presence Rate"
                value={brand.top3}
                color="#22d3ee"
                description={`경쟁형 질문(L2)의 AI 답변 내 언급 순위 중 Top-3 진입 비율: ${brand.top3 ?? 0}%, Top-5 진입 비율: ${brand.top5 ?? 0}%.`}
              />
              <MetricExplainer
                label="Freshness (정보 최신성)"
                value={brand.freshness}
                color="#10b981"
                description="AI 응답에서 감지된 최신 시간 정보 강도 및 관련 최신성 점수."
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Zap className="h-3.5 w-3.5" />
              빠른 액션
            </h3>

            <a
              href={`/ko/site-audit?url=${encodeURIComponent(`https://${brand.brand_slug}.com`)}&brand=${encodeURIComponent(brand.brand_name)}`}
              className="flex items-center justify-between w-full px-4 py-3 rounded-xl border border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10">
                  <Eye className="h-4 w-4 text-indigo-400" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-100">AEO 표면 감사 실행</span>
                  <span className="text-[10px] text-slate-400 block">웹사이트 크롤링 → 엔티티 추출 → AEPI 산출</span>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>

            <a
              href={`/ko/sbs-index?brand=${encodeURIComponent(brand.brand_name)}`}
              className="flex items-center justify-between w-full px-4 py-3 rounded-xl border border-violet-500/30 bg-violet-500/5 hover:bg-violet-500/10 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-500/10">
                  <BarChart3 className="h-4 w-4 text-violet-400" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-100">SBS Index 이동</span>
                  <span className="text-[10px] text-slate-400 block">브랜드 AI 표현 충실도 상세 분석</span>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>
        </div>
        ) : (
          // Evidence Tab
          <EvidenceTab
            brandName={brand?.brand_name ?? ''}
            questionDetails={questionDetails}
            rawQueryResults={rawQueryResults}
          />
        )}
      </div>
    </>
  );
}

// ─── Sub-component: Metric Explainer ──────────────────────
function MetricExplainer({
  label, value, color, description
}: {
  label: string;
  value: number | null;
  color: string;
  description: string;
}) {
  const v = value ?? 0;
  return (
    <div className="flex gap-3">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-bold text-slate-200">{label}</span>
          <span className="text-xs font-black" style={{ color }}>{v}%</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-1.5 mb-1.5">
          <div
            className="h-1.5 rounded-full transition-all duration-1000"
            style={{ width: `${Math.min(v, 100)}%`, backgroundColor: color }}
          />
        </div>
        <p className="text-[10px] text-slate-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

// ─── Sub-component: Evidence Tab ───────────────────────────
interface RawQueryResultLocal {
  questionIdx: number;
  text: string;
  citations: { url: string; domain: string; title: string }[];
}
function EvidenceTab({
  brandName,
  questionDetails,
  rawQueryResults,
}: {
  brandName: string;
  questionDetails: QuestionDetail[];
  rawQueryResults: RawQueryResultLocal[];
}) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const brandQuestions = questionDetails.filter((qd) => {
    const eng = Object.keys(qd.per_engine)[0];
    return eng && qd.per_engine[eng].brands_mentioned.includes(brandName);
  });

  const missedQuestions = questionDetails.filter((qd) => {
    const eng = Object.keys(qd.per_engine)[0];
    return eng && !qd.per_engine[eng].brands_mentioned.includes(brandName);
  });

  function highlight(text: string, brand: string) {
    const parts = text.split(new RegExp(`(${brand})`, "gi"));
    return parts.map((p, i) =>
      p.toLowerCase() === brand.toLowerCase()
        ? <mark key={i} className="bg-amber-400/30 text-amber-200 rounded px-0.5">{p}</mark>
        : p
    );
  }

  function getSnippet(text: string, brand: string, radius = 200) {
    const lower = text.toLowerCase();
    const idx = lower.indexOf(brand.toLowerCase());
    if (idx === -1) return text.slice(0, radius * 2);
    const s = Math.max(0, idx - radius);
    const e = Math.min(text.length, idx + brand.length + radius);
    return (s > 0 ? "…" : "") + text.slice(s, e) + (e < text.length ? "…" : "");
  }

  return (
    <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-220px)]">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-emerald-950/30 border border-emerald-800/30 rounded-xl p-3 text-center">
          <div className="text-2xl font-black text-emerald-400">{brandQuestions.length}</div>
          <div className="text-[10px] text-emerald-300/70 mt-0.5">언급된 질문</div>
        </div>
        <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-3 text-center">
          <div className="text-2xl font-black text-slate-400">{missedQuestions.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">미언급 질문</div>
        </div>
      </div>

      {/* Mentioned questions */}
      {brandQuestions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3 h-3" /> 언급된 질문 — AI 응답 근거
          </h4>
          {brandQuestions.map((qd, i) => {
            const globalIdx = questionDetails.indexOf(qd);
            const raw = rawQueryResults.find((r) => r.questionIdx === globalIdx);
            const fullText = raw?.text ?? Object.values(qd.per_engine)[0]?.raw_response_text ?? "";
            const snippet = getSnippet(fullText, brandName);
            const citations = raw?.citations ?? [];
            const citDomains = Object.values(qd.per_engine)[0]?.citation_domains ?? [];
            const isExpanded = expandedIdx === i;

            return (
              <div
                key={i}
                className="border border-emerald-800/30 bg-emerald-950/10 rounded-xl overflow-hidden"
              >
                <button
                  className="w-full text-left p-3 flex items-start justify-between gap-2"
                  onClick={() => setExpandedIdx(isExpanded ? null : i)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-200 leading-snug">{qd.question_text}</p>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">{qd.question_type} · {qd.layer}</span>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />}
                </button>

                {isExpanded && (
                  <div className="px-3 pb-3 space-y-2 border-t border-emerald-900/30">
                    {/* Snippet */}
                    <div className="bg-slate-950/60 rounded-lg p-2.5 mt-2">
                      <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
                        {highlight(snippet, brandName)}
                      </p>
                    </div>
                    {/* Citations */}
                    {citations.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {citations.slice(0, 4).map((c, ci) => (
                          <a key={ci} href={c.url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-cyan-400 bg-cyan-950/30 border border-cyan-800/30 rounded px-2 py-0.5 hover:text-cyan-300">
                            <Globe className="w-2.5 h-2.5" />
                            {c.domain}
                          </a>
                        ))}
                      </div>
                    ) : citDomains.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {citDomains.slice(0, 4).map((d, di) => (
                          <span key={di} className="inline-flex items-center gap-1 text-[10px] text-cyan-400/60 bg-cyan-950/20 border border-cyan-900/20 rounded px-2 py-0.5">
                            <Globe className="w-2.5 h-2.5" />
                            {d}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Sample of missed questions */}
      {missedQuestions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Search className="w-3 h-3" /> 미언급 질문 샘플 (기회 영역)
          </h4>
          {missedQuestions.slice(0, 5).map((qd, i) => (
            <div key={i} className="border border-slate-800 bg-slate-900/20 rounded-xl p-3">
              <p className="text-xs text-slate-400 leading-snug">{qd.question_text}</p>
              <span className="text-[10px] text-slate-600 mt-0.5 block">{qd.question_type} · {qd.layer}</span>
            </div>
          ))}
          {missedQuestions.length > 5 && (
            <p className="text-[10px] text-slate-600 text-center">+{missedQuestions.length - 5}개 더...</p>
          )}
        </div>
      )}

      {brandQuestions.length === 0 && (
        <div className="py-12 text-center">
          <Search className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">이번 측정에서 AI가 {brandName}을 언급하지 않았습니다.</p>
          <p className="text-slate-600 text-xs mt-2">「즉시 실측 실행」 버튼을 클릭하여 측정하면 근거가 표시됩니다.</p>
        </div>
      )}
    </div>
  );
}
