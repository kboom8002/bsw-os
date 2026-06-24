"use client";

import React, { useState } from "react";
import { ImprovementStrategy, StrategyItem } from "../../lib/industry/strategy-generator";
import { ChevronDown, ChevronUp, Zap, Target, BarChart2, ArrowUpRight } from "lucide-react";

interface StrategyPanelProps {
  strategy: ImprovementStrategy;
}

const GRADE_COLORS: Record<string, string> = {
  S: "text-emerald-400",
  A: "text-violet-400",
  B: "text-indigo-400",
  C: "text-blue-400",
  D: "text-amber-400",
  F: "text-red-400",
};

const GRADE_BG: Record<string, string> = {
  S: "bg-emerald-500/10 border-emerald-500/30",
  A: "bg-violet-500/10 border-violet-500/30",
  B: "bg-indigo-500/10 border-indigo-500/30",
  C: "bg-blue-500/10 border-blue-500/30",
  D: "bg-amber-500/10 border-amber-500/30",
  F: "bg-red-500/10 border-red-500/30",
};

const EFFORT_LABEL: Record<string, { label: string; color: string }> = {
  easy:     { label: "쉬움",     color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  moderate: { label: "보통",     color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  hard:     { label: "어려움",   color: "text-red-400 bg-red-500/10 border-red-500/20" },
};

const IMPACT_LABEL: Record<string, { label: string; icon: string }> = {
  high:   { label: "높음", icon: "🔥🔥🔥" },
  medium: { label: "중간", icon: "🔥🔥" },
  low:    { label: "낮음", icon: "🔥" },
};

const CATEGORY_LABEL: Record<string, string> = {
  tech_infra: "🖥️ 기술 인프라",
  schema:     "📋 구조화 데이터",
  content:    "✍️ 콘텐츠 전략",
  design:     "🎨 디자인/구조",
};

function StrategyCard({ item, expanded, onToggle }: {
  item: StrategyItem;
  expanded: boolean;
  onToggle: () => void;
}) {
  const effortConf = EFFORT_LABEL[item.implementationEffort];
  const impactConf = IMPACT_LABEL[item.expectedImpact];

  return (
    <div className="bg-slate-900/50 border border-slate-800 hover:border-slate-700 rounded-xl overflow-hidden transition-all">
      <button
        onClick={onToggle}
        className="w-full text-left p-4 flex items-start gap-3 cursor-pointer"
      >
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
          <span className="text-violet-400 text-sm font-black">#{item.rank}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[10px] font-semibold text-slate-500">
              {CATEGORY_LABEL[item.category]}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${effortConf.color}`}>
              {effortConf.label}
            </span>
            <span className="text-[10px] text-slate-500">{impactConf.icon}</span>
          </div>
          <h4 className="text-sm font-bold text-slate-100 leading-snug">{item.title}</h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">{item.description}</p>
        </div>
        <div className="flex-shrink-0 flex flex-col items-end gap-1">
          <div className="text-xs font-bold text-red-400">-{item.gap.toFixed(0)}pt Gap</div>
          <div className="text-xs text-slate-500">P{item.percentileRank} 백분위</div>
          {expanded
            ? <ChevronUp className="h-4 w-4 text-slate-500" />
            : <ChevronDown className="h-4 w-4 text-slate-500" />
          }
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-800/60 pt-3 space-y-3">
          {/* 수치 비교 */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-slate-800/60 rounded-lg p-2">
              <div className="text-lg font-black text-amber-400">{item.currentValue.toFixed(0)}</div>
              <div className="text-[10px] text-slate-500">현재값</div>
            </div>
            <div className="bg-slate-800/60 rounded-lg p-2">
              <div className="text-lg font-black text-slate-300">{item.industryAvg.toFixed(0)}</div>
              <div className="text-[10px] text-slate-500">업종 평균</div>
            </div>
            <div className="bg-slate-800/60 rounded-lg p-2">
              <div className="text-lg font-black text-violet-400">{item.industryTop.toFixed(0)}</div>
              <div className="text-[10px] text-slate-500">업종 Top</div>
            </div>
          </div>

          {/* 근거 */}
          <div className="bg-violet-500/5 border border-violet-500/20 rounded-lg p-3">
            <p className="text-[11px] text-violet-300 font-semibold">📊 근거</p>
            <p className="text-[11px] text-slate-400 mt-1">{item.evidenceBasis}</p>
          </div>

          {/* 실행 액션 */}
          <div>
            <p className="text-[11px] font-semibold text-slate-400 mb-2">🛠 실행 방법</p>
            <ul className="space-y-1.5">
              {item.actionItems.map((action, i) => (
                <li key={i} className="flex items-start gap-2 text-[11px] text-slate-300">
                  <ArrowUpRight className="h-3 w-3 text-indigo-400 mt-0.5 shrink-0" />
                  {action}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StrategyPanel({ strategy }: StrategyPanelProps) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set([1]));

  const toggleItem = (rank: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(rank)) next.delete(rank);
      else next.add(rank);
      return next;
    });
  };

  const gradeConf = GRADE_BG[strategy.overallGrade] ?? "bg-slate-800 border-slate-700";
  const gradeColor = GRADE_COLORS[strategy.overallGrade] ?? "text-slate-300";

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className={`bg-gradient-to-br ${gradeConf} border rounded-2xl p-6`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-slate-800/50 text-slate-400 border border-slate-700 mb-3">
              🎯 업종 기반 개선 전략: {strategy.displayNameKo}
            </div>
            <h2 className="text-xl font-black text-slate-100">{strategy.brandName}</h2>
            <p className="text-sm text-slate-400 mt-1 max-w-xl leading-relaxed">
              {strategy.executiveSummary}
            </p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-center">
              <div className={`text-5xl font-black ${gradeColor} leading-none`}>
                {strategy.overallGrade}
              </div>
              <div className="text-xs text-slate-500 mt-1">현재 등급</div>
            </div>
            <div className="text-center text-slate-600">→</div>
            <div className="text-center">
              <div className="text-5xl font-black text-violet-400 leading-none">
                {strategy.overallGrade === 'S' ? 'S' : String.fromCharCode(strategy.overallGrade.charCodeAt(0) - 1)}
              </div>
              <div className="text-xs text-slate-500 mt-1">목표 등급</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Wins */}
      {strategy.quickWins.length > 0 && (
        <div className="bg-slate-900/50 border border-emerald-800/30 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2 mb-4">
            <Zap className="h-4 w-4" />
            ⚡ Quick Wins — 빠른 효과 (쉬운 구현, 중간 이상 영향)
          </h3>
          <div className="space-y-2">
            {strategy.quickWins.map(item => (
              <StrategyCard
                key={item.rank}
                item={item}
                expanded={expandedIds.has(item.rank)}
                onToggle={() => toggleItem(item.rank)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 우선순위 전략 전체 */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-4">
          <Target className="h-4 w-4 text-indigo-400" />
          📈 우선순위 전략 (Impact × Feasibility 기준)
        </h3>

        {/* 전략 요약 테이블 */}
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-xs mb-4">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left py-2 pr-4 text-slate-500">#</th>
                <th className="text-left py-2 pr-4 text-slate-500">전략</th>
                <th className="text-left py-2 pr-4 text-slate-500">카테고리</th>
                <th className="text-right py-2 pr-4 text-slate-500">Gap</th>
                <th className="text-left py-2 pr-4 text-slate-500">난이도</th>
                <th className="text-left py-2 text-slate-500">영향도</th>
              </tr>
            </thead>
            <tbody>
              {strategy.prioritizedStrategies.map(item => (
                <tr
                  key={item.rank}
                  onClick={() => toggleItem(item.rank)}
                  className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors cursor-pointer"
                >
                  <td className="py-2 pr-4 text-slate-500 font-bold">#{item.rank}</td>
                  <td className="py-2 pr-4 text-slate-300 font-medium truncate max-w-xs">{item.title}</td>
                  <td className="py-2 pr-4 text-slate-500">{CATEGORY_LABEL[item.category]}</td>
                  <td className="py-2 pr-4 text-red-400 font-bold text-right">-{item.gap.toFixed(0)}</td>
                  <td className="py-2 pr-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${EFFORT_LABEL[item.implementationEffort]?.color}`}>
                      {EFFORT_LABEL[item.implementationEffort]?.label}
                    </span>
                  </td>
                  <td className="py-2">{IMPACT_LABEL[item.expectedImpact]?.icon}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 상세 카드 */}
        <div className="space-y-2">
          {strategy.prioritizedStrategies.map(item => (
            <StrategyCard
              key={item.rank}
              item={item}
              expanded={expandedIds.has(item.rank)}
              onToggle={() => toggleItem(item.rank)}
            />
          ))}
        </div>
      </div>

      {/* 장기 투자 */}
      {strategy.longTermInvestments.length > 0 && (
        <div className="bg-slate-900/50 border border-indigo-800/30 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-indigo-400 flex items-center gap-2 mb-4">
            <BarChart2 className="h-4 w-4" />
            🏗️ 장기 투자 — 어렵지만 효과 큰 전략
          </h3>
          <div className="space-y-2">
            {strategy.longTermInvestments.map(item => (
              <StrategyCard
                key={item.rank}
                item={item}
                expanded={expandedIds.has(item.rank)}
                onToggle={() => toggleItem(item.rank)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
