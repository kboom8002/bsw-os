"use client";

/**
 * components/benchmark/AeoContentTrendPanel.tsx
 * 업종 AEO 콘텐츠 트렌드 — QIS 시그널 + AI 커버리지 + 떠오르는 질문
 */

import React from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { Zap, Eye, AlertTriangle, TrendingUp, Radio } from "lucide-react";
import type { ContentTrendPoint, TopPredictedQuestion } from "../../lib/benchmark/qis-benchmark-bridge";

interface Props {
  trends: ContentTrendPoint[];
  coverageDistribution: { none: number; sparse: number; moderate: number; saturated: number };
  topPredictions: TopPredictedQuestion[];
  activeSignals: number;
  totalPredictions: number;
  avgQvs: number;
}

const COVERAGE_COLORS = {
  none: "#ef4444",
  sparse: "#f59e0b",
  moderate: "#3b82f6",
  saturated: "#10b981",
};
const COVERAGE_LABELS = {
  none: "미커버",
  sparse: "희소",
  moderate: "보통",
  saturated: "포화",
};

const URGENCY_BADGE: Record<string, { cls: string; icon: React.ReactNode }> = {
  critical: { cls: "bg-red-500/20 text-red-400 border-red-500/30", icon: <AlertTriangle className="w-3 h-3" /> },
  medium: { cls: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: <Zap className="w-3 h-3" /> },
  low: { cls: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: <Eye className="w-3 h-3" /> },
};

export function AeoContentTrendPanel({
  trends,
  coverageDistribution,
  topPredictions,
  activeSignals,
  totalPredictions,
  avgQvs,
}: Props) {
  const hasData = trends.some(t => t.totalSignals > 0) || topPredictions.length > 0;

  // 커버리지 분포 파이 데이터
  const pieData = Object.entries(coverageDistribution)
    .filter(([_, v]) => v > 0)
    .map(([key, value]) => ({
      name: COVERAGE_LABELS[key as keyof typeof COVERAGE_LABELS] ?? key,
      value,
      color: COVERAGE_COLORS[key as keyof typeof COVERAGE_COLORS] ?? "#6b7280",
    }));
  const totalCoverage = pieData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="space-y-6">

      {/* KPI 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "활성 시그널", value: activeSignals, sub: "최근 30일", icon: Radio, color: "violet" },
          { label: "예측 질문", value: totalPredictions, sub: "미출현", icon: Zap, color: "amber" },
          { label: "평균 QVS", value: avgQvs, sub: "질문 가치 지수", icon: TrendingUp, color: "emerald" },
          { label: "미커버 비율", value: totalCoverage > 0 ? `${Math.round(coverageDistribution.none / totalCoverage * 100)}%` : "N/A", sub: "AI 답변 없음", icon: Eye, color: "red" },
        ].map(kpi => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 text-${kpi.color}-400`} />
                <span className="text-[11px] text-slate-400 font-semibold">{kpi.label}</span>
              </div>
              <div className={`text-2xl font-black text-${kpi.color}-400`}>{kpi.value}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{kpi.sub}</div>
            </div>
          );
        })}
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3 bg-slate-800/30 rounded-xl border border-slate-700/50">
          <Radio className="w-8 h-8 text-violet-400/40" />
          <div className="text-sm text-slate-400">QIS 시그널 데이터 수집 중</div>
          <div className="text-xs text-slate-500">
            Hub 연동이 활성화되면 업종 AEO 트렌드가 여기에 표시됩니다
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* 시그널 추이 차트 (2/3) */}
          <div className="lg:col-span-2 bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
            <h4 className="text-xs font-bold text-slate-300 mb-3">📡 시그널 추이 (30일)</h4>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={trends} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "#a1a1aa" }}
                  tickFormatter={(v: string) => { const d = new Date(v); return `${d.getMonth()+1}/${d.getDate()}`; }}
                />
                <YAxis tick={{ fontSize: 10, fill: "#a1a1aa" }} />
                <Tooltip
                  contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8, fontSize: 11 }}
                  labelStyle={{ color: "#e4e4e7" }}
                />
                <Area type="monotone" dataKey="totalSignals" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.15} name="총 시그널" />
                <Area type="monotone" dataKey="newPredictions" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} name="신규 예측" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* AI 커버리지 분포 (1/3) */}
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
            <h4 className="text-xs font-bold text-slate-300 mb-3">🔍 AI 커버리지 분포</h4>
            {totalCoverage > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={130}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={55}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {pieData.map((d, i) => (
                        <Cell key={i} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8, fontSize: 11 }}
                      formatter={(v: unknown) => [`${v}건`, ""]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 mt-2">
                  {pieData.map(d => (
                    <div key={d.name} className="flex items-center gap-1 text-[10px] text-slate-400">
                      <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                      {d.name}: {d.value}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-32 text-xs text-slate-500">
                커버리지 데이터 없음
              </div>
            )}
          </div>
        </div>
      )}

      {/* 떠오르는 질문 TOP 5 */}
      {topPredictions.length > 0 && (
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
          <h4 className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-2">
            🔥 떠오르는 질문 TOP {topPredictions.length}
            <span className="text-[10px] text-slate-500 font-normal">QVS 상위 · 미출현 · 고신뢰</span>
          </h4>
          <div className="space-y-2">
            {topPredictions.map((q, i) => {
              const urgency = q.firstMoverDays <= 3 ? 'critical' : q.firstMoverDays <= 7 ? 'medium' : 'low';
              const badge = URGENCY_BADGE[urgency];
              return (
                <div key={q.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-slate-700/30 transition-colors">
                  <span className="text-xs font-bold text-slate-500 w-5">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-200 truncate">{q.questionText}</div>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                      <span>의도: {q.predictedIntent}</span>
                      <span>·</span>
                      <span>볼륨: {q.predictedVolume}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-mono font-bold text-amber-400">QVS:{q.qvsComposite}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1 ${badge.cls}`}>
                      {badge.icon}
                      {q.firstMoverDays}일
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      q.aiCoverage === 'none' ? 'bg-red-500/20 text-red-400' :
                      q.aiCoverage === 'sparse' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>{COVERAGE_LABELS[q.aiCoverage as keyof typeof COVERAGE_LABELS] ?? q.aiCoverage}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
