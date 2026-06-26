"use client";

/**
 * components/benchmark/IndustryTrendChart.tsx
 * 업종 시계열 트렌드 — 특정 사이트의 AEPI + 핵심 메트릭 시간별 변화
 */

import React, { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine,
} from "recharts";
import type { BenchmarkHistoryPoint } from "../../lib/benchmark/temporal-tracker";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Props {
  history: BenchmarkHistoryPoint[];
  industryAvgHistory?: { date: string; aepiScore: number }[];
  showMetrics?: string[];
  height?: number;
}

const METRIC_COLORS: Record<string, string> = {
  aepiScore:              "#6366f1",  // indigo — 종합 AEPI
  techInfraScore:         "#06b6d4",  // cyan
  schemaQualityScore:     "#8b5cf6",  // violet
  contentSemanticScore:   "#10b981",  // emerald
  eeatOverall:            "#f59e0b",  // amber
  answerFirstAvgScore:    "#ec4899",  // pink
};

const METRIC_NAMES: Record<string, string> = {
  aepiScore:            "AEPI 종합",
  techInfraScore:       "L1 기술",
  schemaQualityScore:   "L2 스키마",
  contentSemanticScore: "L3 콘텐츠",
  eeatOverall:          "E-E-A-T",
  answerFirstAvgScore:  "Answer-First",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function DeltaBadge({ first, last }: { first: number; last: number }) {
  const delta = last - first;
  if (Math.abs(delta) < 1) return <span className="text-zinc-500 text-xs flex items-center gap-0.5"><Minus className="w-3 h-3" />변화 없음</span>;
  const up = delta > 0;
  return (
    <span className={`text-xs flex items-center gap-0.5 font-bold ${up ? "text-emerald-400" : "text-red-400"}`}>
      {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {up ? "+" : ""}{delta.toFixed(1)}
    </span>
  );
}

export function IndustryTrendChart({
  history,
  industryAvgHistory,
  showMetrics = ["aepiScore", "techInfraScore", "schemaQualityScore", "contentSemanticScore"],
  height = 260,
}: Props) {
  const { chartData, summaryStats } = useMemo(() => {
    if (history.length === 0) return { chartData: [], summaryStats: {} };

    const data: Array<Record<string, number | string>> = history.map((h) => ({
      date: formatDate(h.auditedAt),
      fullDate: h.auditedAt,
      aepiScore: h.aepiScore,
      ...h.metrics,
    }));

    // 업종 평균 병합
    if (industryAvgHistory) {
      industryAvgHistory.forEach((avg, i) => {
        if (data[i]) data[i].industryAvg = avg.aepiScore;
      });
    }

    // 요약 통계: 첫값 vs 마지막값
    const stats: Record<string, { first: number; last: number }> = {};
    for (const key of showMetrics) {
      const firstVal = key === "aepiScore" ? history[0]?.aepiScore : (history[0]?.metrics[key] ?? 0);
      const lastVal = key === "aepiScore" ? history[history.length - 1]?.aepiScore : (history[history.length - 1]?.metrics[key] ?? 0);
      stats[key] = { first: firstVal ?? 0, last: lastVal ?? 0 };
    }

    return { chartData: data, summaryStats: stats };
  }, [history, industryAvgHistory, showMetrics]);

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-2 text-zinc-500">
        <div className="text-sm">이력 데이터가 없습니다</div>
        <div className="text-xs">벤치마크 Cron이 실행되면 자동 축적됩니다</div>
      </div>
    );
  }

  if (history.length === 1) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-2 text-zinc-500">
        <div className="text-sm">측정 포인트 1개 (추세 보기: 2회 이상 필요)</div>
        <div className="text-xs font-mono">첫 측정: {formatDate(history[0].auditedAt)} | AEPI: {history[0].aepiScore}</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* 요약 뱃지 */}
      <div className="flex flex-wrap gap-3 mb-4">
        {showMetrics.map((key) => {
          const stat = summaryStats[key];
          if (!stat) return null;
          return (
            <div key={key} className="flex items-center gap-2 bg-zinc-800/50 rounded-lg px-3 py-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: METRIC_COLORS[key] ?? "#6366f1" }} />
              <span className="text-xs text-zinc-400">{METRIC_NAMES[key] ?? key}</span>
              <DeltaBadge first={stat.first} last={stat.last} />
            </div>
          );
        })}
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#a1a1aa" }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#a1a1aa" }} />
          <Tooltip
            contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: "#e4e4e7" }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
            formatter={(val: string) => METRIC_NAMES[val] ?? val}
          />

          {/* 업종 평균 */}
          {industryAvgHistory && (
            <Line
              dataKey="industryAvg"
              name="업종 평균"
              stroke="#52525b"
              strokeDasharray="6 3"
              dot={false}
              strokeWidth={1.5}
            />
          )}

          {/* 선택 메트릭 */}
          {showMetrics.map((key) => (
            <Line
              key={key}
              dataKey={key}
              name={key}
              stroke={METRIC_COLORS[key] ?? "#6366f1"}
              dot={{ r: 3, strokeWidth: 0 }}
              strokeWidth={2}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
