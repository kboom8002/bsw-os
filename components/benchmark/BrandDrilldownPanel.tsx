"use client";

/**
 * components/benchmark/BrandDrilldownPanel.tsx
 * 브랜드 역설계 드릴다운 — 리더보드 클릭 시 표시되는 상세 패널
 * 역설계 요약 + 내 브랜드와의 격차 분석
 */

import React, { useMemo } from "react";
import { X, Globe, Shield, FileCode, BookOpen, TrendingUp, ChevronRight, AlertTriangle, CheckCircle } from "lucide-react";
import type { BenchmarkHistoryPoint } from "../../lib/benchmark/temporal-tracker";

interface Props {
  target: BenchmarkHistoryPoint;
  myBrand?: BenchmarkHistoryPoint;
  onClose: () => void;
}

const LAYER_CONFIG = [
  {
    key: "L1",
    label: "기술 인프라",
    icon: Shield,
    color: "cyan",
    metrics: [
      { key: "techInfraScore", label: "종합 점수" },
      { key: "aiCrawlerAccessScore", label: "AI 크롤러 접근" },
      { key: "sitemapFreshnessScore", label: "사이트맵 신선도" },
    ],
    boolMetrics: [
      { key: "httpsEnabled", label: "HTTPS" },
      { key: "llmsTxtExists", label: "llms.txt" },
    ],
  },
  {
    key: "L2",
    label: "스키마/시맨틱",
    icon: FileCode,
    color: "violet",
    metrics: [
      { key: "schemaQualityScore", label: "종합 점수" },
      { key: "ogCompleteness", label: "OG 완성도" },
      { key: "orgSameAsCount", label: "Organization sameAs" },
    ],
  },
  {
    key: "L3",
    label: "콘텐츠 시맨틱",
    icon: BookOpen,
    color: "emerald",
    metrics: [
      { key: "contentSemanticScore", label: "종합 점수" },
      { key: "eeatOverall", label: "E-E-A-T 종합" },
      { key: "answerFirstAvgScore", label: "Answer-First" },
      { key: "freshnessScore", label: "콘텐츠 신선도" },
      { key: "citationQualityScore", label: "인용 품질" },
    ],
  },
];

const COLOR_MAP: Record<string, string> = {
  cyan:    "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
  violet:  "text-violet-400 bg-violet-500/10 border-violet-500/30",
  emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
};

function ScoreBar({ value, myValue }: { value: number; myValue?: number }) {
  const pct = Math.min(value, 100);
  const myPct = myValue !== undefined ? Math.min(myValue, 100) : undefined;
  const color = pct >= 70 ? "bg-emerald-500" : pct >= 45 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="flex-1 h-2 bg-zinc-700 rounded-full overflow-visible relative">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
        {/* 내 브랜드 마커 */}
        {myPct !== undefined && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-2 h-4 bg-indigo-400 rounded-sm"
            style={{ left: `${myPct}%`, transform: "translate(-50%, -50%)" }}
            title={`내 브랜드: ${myValue?.toFixed(0)}`}
          />
        )}
      </div>
      <span className="text-xs font-mono font-bold text-zinc-200 w-8 text-right">{value.toFixed(0)}</span>
    </div>
  );
}

function GapChip({ target, mine }: { target: number; mine: number }) {
  const gap = target - mine;
  if (Math.abs(gap) < 2) return null;
  const up = gap > 0;
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${up ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"}`}>
      {up ? `+${gap.toFixed(0)} 격차` : `${gap.toFixed(0)} 앞섬`}
    </span>
  );
}

export function BrandDrilldownPanel({ target, myBrand, onClose }: Props) {
  const keyGaps = useMemo(() => {
    if (!myBrand) return [];
    const keys = ["techInfraScore", "schemaQualityScore", "contentSemanticScore", "eeatOverall", "answerFirstAvgScore"];
    const labels: Record<string, string> = {
      techInfraScore: "기술 인프라",
      schemaQualityScore: "스키마",
      contentSemanticScore: "콘텐츠",
      eeatOverall: "E-E-A-T",
      answerFirstAvgScore: "Answer-First",
    };
    return keys
      .map((k) => ({
        key: k,
        label: labels[k] ?? k,
        mine: myBrand.metrics[k] ?? 0,
        theirs: target.metrics[k] ?? 0,
        gap: (target.metrics[k] ?? 0) - (myBrand.metrics[k] ?? 0),
      }))
      .sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap));
  }, [target, myBrand]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-zinc-900 rounded-2xl border border-zinc-700 shadow-2xl">

        {/* 헤더 */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/95 backdrop-blur">
          <div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-zinc-400" />
              <span className="font-bold text-zinc-100">{target.brandName}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                target.tier === "excellent" ? "bg-emerald-500/20 text-emerald-400" :
                target.tier === "average" ? "bg-amber-500/20 text-amber-400" :
                "bg-red-500/20 text-red-400"
              }`}>{target.tier}</span>
            </div>
            <div className="text-xs text-zinc-500 mt-0.5">{target.url}</div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* AEPI 종합 */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
            <div className="text-center">
              <div className="text-3xl font-black text-zinc-100">{target.aepiScore.toFixed(0)}</div>
              <div className="text-xs text-zinc-500 mt-0.5">AEPI 종합</div>
            </div>
            <div className="flex-1">
              <div className="h-3 bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${target.aepiScore >= 70 ? "bg-emerald-500" : target.aepiScore >= 45 ? "bg-amber-500" : "bg-red-500"}`}
                  style={{ width: `${target.aepiScore}%` }}
                />
              </div>
              {myBrand && (
                <div className="text-xs text-zinc-500 mt-1.5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-sm bg-indigo-500 inline-block" />
                  내 브랜드 AEPI: {myBrand.aepiScore.toFixed(0)}
                  <GapChip target={target.aepiScore} mine={myBrand.aepiScore} />
                </div>
              )}
            </div>
          </div>

          {/* 레이어별 메트릭 */}
          {LAYER_CONFIG.map((layer) => {
            const Icon = layer.icon;
            const colorCls = COLOR_MAP[layer.color] ?? "";
            return (
              <div key={layer.key} className="space-y-2">
                <div className={`flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-lg border ${colorCls}`}>
                  <Icon className="w-4 h-4" />
                  {layer.key} — {layer.label}
                </div>
                <div className="pl-2 space-y-2">
                  {layer.metrics.map((m) => (
                    <div key={m.key} className="flex items-center gap-3">
                      <span className="text-xs text-zinc-400 w-32 shrink-0">{m.label}</span>
                      <ScoreBar
                        value={target.metrics[m.key] ?? 0}
                        myValue={myBrand?.metrics[m.key]}
                      />
                    </div>
                  ))}
                  {/* 불리언 체크 */}
                  {layer.boolMetrics?.map((bm) => (
                    <div key={bm.key} className="flex items-center gap-2">
                      {(target.metrics[bm.key] ?? 0) > 0 ? (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      <span className="text-xs text-zinc-400">{bm.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* 내 브랜드와의 주요 격차 */}
          {myBrand && keyGaps.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                내 브랜드와의 주요 격차
              </div>
              <div className="rounded-xl overflow-hidden border border-zinc-800">
                {keyGaps.map((g, i) => (
                  <div
                    key={g.key}
                    className={`flex items-center gap-3 px-4 py-2.5 ${i % 2 === 0 ? "bg-zinc-800/30" : ""}`}
                  >
                    <ChevronRight className="w-3 h-3 text-zinc-600 shrink-0" />
                    <span className="text-xs text-zinc-400 w-28 shrink-0">{g.label}</span>
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="text-indigo-300">내: {g.mine.toFixed(0)}</span>
                      <span className="text-zinc-600">vs</span>
                      <span className="text-zinc-200">{target.brandName}: {g.theirs.toFixed(0)}</span>
                    </div>
                    <GapChip target={g.theirs} mine={g.mine} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 측정일 */}
          <div className="text-xs text-zinc-600 text-right">
            최종 측정: {new Date(target.auditedAt).toLocaleDateString("ko-KR")}
          </div>
        </div>
      </div>
    </div>
  );
}
