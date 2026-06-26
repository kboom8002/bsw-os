"use client";

/**
 * components/benchmark/MetricDistributionChart.tsx
 * 메트릭별 분포 히스토그램 — 사이트들의 점수 분포 + 내 브랜드 위치 마커
 */

import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from "recharts";
import type { BenchmarkHistoryPoint } from "../../lib/benchmark/temporal-tracker";

interface Props {
  points: BenchmarkHistoryPoint[];
  metricKey: string;
  metricNameKo: string;
  brandValue?: number;       // 현재 감사 대상 브랜드의 해당 메트릭 값
  industryAvg?: number;      // 업종 평균
  unit?: string;
}

interface BinData {
  range: string;
  count: number;
  minVal: number;
  maxVal: number;
  hasBrand: boolean;
  hasAvg: boolean;
}

const BINS = 5;
const TIER_COLORS = {
  excellent: "#10b981",
  average: "#f59e0b",
  poor: "#ef4444",
};

export function MetricDistributionChart({ points, metricKey, metricNameKo, brandValue, industryAvg, unit = "" }: Props) {
  const { bins, brandBin } = useMemo(() => {
    const values = points.map((p) => p.metrics[metricKey] ?? 0).filter((v) => !isNaN(v));
    if (values.length === 0) return { bins: [], brandBin: -1 };

    const min = Math.min(...values, brandValue ?? Infinity);
    const max = Math.max(...values, brandValue ?? -Infinity);
    const range = max - min || 1;
    const binSize = range / BINS;

    const binData: BinData[] = Array.from({ length: BINS }, (_, i) => {
      const lo = min + i * binSize;
      const hi = lo + binSize;
      const label = unit === "ms"
        ? `${Math.round(lo)}-${Math.round(hi)}`
        : `${Math.round(lo)}-${Math.round(hi)}`;
      return {
        range: label,
        count: 0,
        minVal: lo,
        maxVal: hi,
        hasBrand: false,
        hasAvg: false,
      };
    });

    // 사이트 분포 집계
    for (const v of values) {
      const idx = Math.min(Math.floor((v - min) / binSize), BINS - 1);
      binData[idx].count++;
    }

    // 브랜드 위치
    let bBin = -1;
    if (brandValue !== undefined) {
      bBin = Math.min(Math.floor((brandValue - min) / binSize), BINS - 1);
      if (bBin >= 0) binData[bBin].hasBrand = true;
    }

    // 업종 평균 위치
    if (industryAvg !== undefined) {
      const aBin = Math.min(Math.floor((industryAvg - min) / binSize), BINS - 1);
      if (aBin >= 0) binData[aBin].hasAvg = true;
    }

    return { bins: binData, brandBin: bBin };
  }, [points, metricKey, brandValue, industryAvg, unit]);

  if (bins.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-zinc-500 text-sm">
        데이터 없음
      </div>
    );
  }

  const CustomBar = (props: { x?: number; y?: number; width?: number; height?: number; index?: number }) => {
    const { x = 0, y = 0, width = 0, height = 0, index = 0 } = props;
    const bin = bins[index];
    const fill = bin?.hasBrand ? "#6366f1" : "#3b82f6";
    return (
      <g>
        <rect x={x} y={y} width={width} height={height} fill={fill} rx={3} opacity={bin?.hasBrand ? 1 : 0.7} />
        {bin?.hasBrand && (
          <text x={x + width / 2} y={y - 6} textAnchor="middle" fontSize={11} fill="#6366f1" fontWeight="bold">
            👤
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-4 mb-3 text-xs text-zinc-400">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-blue-500 opacity-70" /> 업종 사이트
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-indigo-500" /> 내 브랜드
        </span>
        {industryAvg !== undefined && (
          <span className="flex items-center gap-1">
            <span className="inline-block w-5 h-0.5 bg-amber-400 border-dashed border-t-2 border-amber-400" /> 업종 평균
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={bins} margin={{ top: 16, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="range" tick={{ fontSize: 10, fill: "#a1a1aa" }} />
          <YAxis tick={{ fontSize: 10, fill: "#a1a1aa" }} allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: "#e4e4e7" }}
            formatter={(val: unknown) => [`${typeof val === 'number' ? val : 0}개 사이트`, "사이트 수"]}
          />
          {industryAvg !== undefined && (
            <ReferenceLine
              x={bins.findIndex((b) => b.hasAvg) >= 0 ? bins[bins.findIndex((b) => b.hasAvg)]?.range : undefined}
              stroke="#f59e0b"
              strokeDasharray="4 2"
              label={{ value: `평균 ${industryAvg.toFixed(0)}`, position: "top", fontSize: 10, fill: "#f59e0b" }}
            />
          )}
          <Bar dataKey="count" shape={<CustomBar />}>
            {bins.map((_, idx) => (
              <Cell key={idx} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
