"use client";

import React from "react";
import { MetricPosition } from "../../lib/industry/relative-positioner";

interface PercentileBarProps {
  position: MetricPosition;
  showLabel?: boolean;
}

const TIER_COLOR: Record<string, string> = {
  top10: "bg-emerald-500",
  top25: "bg-violet-500",
  above_avg: "bg-indigo-400",
  average: "bg-blue-400",
  below_avg: "bg-amber-400",
  bottom25: "bg-red-500",
};

const TIER_TEXT: Record<string, string> = {
  top10: "text-emerald-400",
  top25: "text-violet-400",
  above_avg: "text-indigo-400",
  average: "text-blue-400",
  below_avg: "text-amber-400",
  bottom25: "text-red-400",
};

const TIER_LABEL: Record<string, string> = {
  top10: "Top 10%",
  top25: "Top 25%",
  above_avg: "평균 이상",
  average: "평균",
  below_avg: "평균 이하",
  bottom25: "하위 25%",
};

const STATUS_ICON: Record<string, string> = {
  top10: "✅",
  top25: "✅",
  above_avg: "✅",
  average: "⚡",
  below_avg: "⚠️",
  bottom25: "❌",
};

export default function PercentileBar({
  position,
  showLabel = true,
}: PercentileBarProps) {
  const pct = Math.min(100, Math.max(0, position.percentileRank));
  const barColor = TIER_COLOR[position.positionTier] ?? "bg-slate-500";
  const textColor = TIER_TEXT[position.positionTier] ?? "text-slate-400";

  return (
    <div className="flex items-center gap-3 py-1.5 group">
      {showLabel && (
        <div className="w-36 text-xs text-slate-400 truncate shrink-0">
          {position.metricNameKo}
        </div>
      )}

      {/* 진행바 영역 */}
      <div className="flex-1 relative">
        {/* P25, P50, P75 마커 */}
        <div className="absolute inset-0 flex pointer-events-none">
          <div className="absolute top-0 bottom-0 border-l border-dashed border-slate-600/60" style={{ left: "25%" }}>
            <span className="absolute -top-4 -translate-x-1/2 text-[9px] text-slate-600">P25</span>
          </div>
          <div className="absolute top-0 bottom-0 border-l border-dashed border-slate-500/80" style={{ left: "50%" }}>
            <span className="absolute -top-4 -translate-x-1/2 text-[9px] text-slate-500">평균</span>
          </div>
          <div className="absolute top-0 bottom-0 border-l border-dashed border-slate-500/60" style={{ left: "75%" }}>
            <span className="absolute -top-4 -translate-x-1/2 text-[9px] text-slate-600">P75</span>
          </div>
        </div>

        {/* 배경 트랙 */}
        <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
          {/* 채워진 바 */}
          <div
            className={`h-full rounded-full transition-all duration-700 ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* 수치 표시 */}
      <div className="flex items-center gap-2 shrink-0 w-32">
        <span className={`text-xs font-bold ${textColor}`}>
          {position.brandValue.toFixed(0)}{position.unit}
        </span>
        <span className={`text-[10px] font-semibold ${textColor} opacity-80`}>
          ({TIER_LABEL[position.positionTier]})
        </span>
        <span className="text-xs">{STATUS_ICON[position.positionTier]}</span>
      </div>
    </div>
  );
}
