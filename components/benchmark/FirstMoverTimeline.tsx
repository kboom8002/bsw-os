"use client";

/**
 * components/benchmark/FirstMoverTimeline.tsx
 * 선점 기회 타임라인 — 마감일 기준 긴급도별 그룹
 */

import React from "react";
import { Clock, AlertTriangle, Zap, Eye, TrendingUp } from "lucide-react";
import type { FirstMoverItem } from "../../lib/benchmark/qis-benchmark-bridge";

interface Props {
  items: FirstMoverItem[];
}

const URGENCY_META = {
  critical: { label: "🔴 3일 이내", icon: AlertTriangle, cls: "border-red-500/30 bg-red-500/5", headerCls: "text-red-400" },
  medium:   { label: "🟡 7일 이내", icon: Zap, cls: "border-amber-500/30 bg-amber-500/5", headerCls: "text-amber-400" },
  low:      { label: "🟢 14일 이내", icon: Eye, cls: "border-emerald-500/30 bg-emerald-500/5", headerCls: "text-emerald-400" },
};

const COVERAGE_DOT: Record<string, string> = {
  none: "bg-red-500",
  sparse: "bg-amber-500",
  moderate: "bg-blue-500",
  saturated: "bg-emerald-500",
};

export function FirstMoverTimeline({ items }: Props) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 gap-2 bg-slate-800/30 rounded-xl border border-slate-700/50">
        <Clock className="w-6 h-6 text-slate-500" />
        <div className="text-xs text-slate-500">QIS 예측 데이터가 수집되면 선점 기회가 표시됩니다</div>
      </div>
    );
  }

  // 긴급도별 그룹
  const groups = {
    critical: items.filter(i => i.urgencyTier === 'critical'),
    medium: items.filter(i => i.urgencyTier === 'medium'),
    low: items.filter(i => i.urgencyTier === 'low'),
  };

  // 경쟁 압박 통계
  const highComp = items.filter(i => i.competition >= 0.7).length;
  const medComp = items.filter(i => i.competition >= 0.4 && i.competition < 0.7).length;
  const lowComp = items.filter(i => i.competition < 0.4).length;

  return (
    <div className="space-y-4">

      {(Object.entries(groups) as [keyof typeof URGENCY_META, FirstMoverItem[]][]).map(([tier, group]) => {
        if (group.length === 0) return null;
        const meta = URGENCY_META[tier];
        const Icon = meta.icon;
        return (
          <div key={tier} className={`rounded-xl border ${meta.cls} overflow-hidden`}>
            <div className={`px-4 py-2 flex items-center gap-2 text-xs font-bold ${meta.headerCls}`}>
              <Icon className="w-3.5 h-3.5" />
              {meta.label} ({group.length}건)
            </div>
            <div className="divide-y divide-slate-800/50">
              {group.map(item => (
                <div key={item.id} className="px-4 py-2.5 flex items-center gap-3 hover:bg-slate-800/20 transition-colors">
                  {/* 타임라인 도트 */}
                  <div className="flex flex-col items-center shrink-0 w-6">
                    <div className={`w-2.5 h-2.5 rounded-full ${COVERAGE_DOT[item.aiCoverage] ?? 'bg-gray-500'}`} />
                    <div className="w-px h-full bg-slate-700/50" />
                  </div>

                  {/* 질문 내용 */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-200 truncate">{item.questionText}</div>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                      <span>{item.predictedIntent}</span>
                      <span>·</span>
                      <span>볼륨: {item.predictedVolume}</span>
                      <span>·</span>
                      <span>신뢰도: {(item.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>

                  {/* 메트릭 */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-mono font-bold text-amber-400">QVS:{item.qvsComposite}</span>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-slate-500" />
                      <span className={`text-[10px] font-bold ${
                        item.competition >= 0.7 ? 'text-red-400' :
                        item.competition >= 0.4 ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {(item.competition * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* 경쟁 압박 요약 */}
      <div className="flex items-center gap-4 px-4 py-2.5 bg-slate-800/30 rounded-lg text-xs text-slate-400">
        <span className="font-semibold text-slate-300">📊 경쟁 압박:</span>
        <span className="text-red-400 font-bold">높음 {highComp}건</span>
        <span className="text-amber-400 font-bold">중간 {medComp}건</span>
        <span className="text-emerald-400 font-bold">낮음 {lowComp}건</span>
      </div>
    </div>
  );
}
