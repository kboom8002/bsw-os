"use client";

import React from "react";
import { RelativePosition, PositionTier } from "../../lib/industry/relative-positioner";
import IndustryComparisonChart from "./IndustryComparisonChart";
import PercentileBar from "./PercentileBar";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface RelativePositioningPanelProps {
  position: RelativePosition;
}

const OVERALL_TIER_CONFIG: Record<PositionTier, {
  label: string;
  color: string;
  bg: string;
  border: string;
  gradient: string;
}> = {
  top10:     { label: "업종 최상위", color: "text-emerald-300", bg: "bg-emerald-500/10", border: "border-emerald-500/30", gradient: "from-emerald-500/20 to-teal-500/10" },
  top25:     { label: "업종 상위",   color: "text-violet-300",  bg: "bg-violet-500/10",  border: "border-violet-500/30",  gradient: "from-violet-500/20 to-indigo-500/10" },
  above_avg: { label: "평균 이상",   color: "text-indigo-300",  bg: "bg-indigo-500/10",  border: "border-indigo-500/30",  gradient: "from-indigo-500/20 to-blue-500/10" },
  average:   { label: "업종 평균",   color: "text-blue-300",    bg: "bg-blue-500/10",    border: "border-blue-500/30",    gradient: "from-blue-500/20 to-sky-500/10" },
  below_avg: { label: "평균 이하",   color: "text-amber-300",   bg: "bg-amber-500/10",   border: "border-amber-500/30",   gradient: "from-amber-500/20 to-orange-500/10" },
  bottom25:  { label: "업종 하위",   color: "text-red-300",     bg: "bg-red-500/10",     border: "border-red-500/30",     gradient: "from-red-500/20 to-rose-500/10" },
};

const GRADE_MAP: Record<number, string> = {};
function getGrade(percentile: number): string {
  if (percentile >= 90) return 'S';
  if (percentile >= 75) return 'A';
  if (percentile >= 60) return 'B';
  if (percentile >= 40) return 'C';
  if (percentile >= 25) return 'D';
  return 'F';
}

export default function RelativePositioningPanel({ position }: RelativePositioningPanelProps) {
  const tierConf = OVERALL_TIER_CONFIG[position.overallTier];
  const grade = getGrade(position.overallPercentile);

  // 레이어별로 메트릭 분류
  const l1Metrics = position.metricPositions.filter(m => m.layer === 'L1');
  const l2Metrics = position.metricPositions.filter(m => m.layer === 'L2');
  const l3Metrics = position.metricPositions.filter(m => m.layer === 'L3');

  return (
    <div className="space-y-6">
      {/* 종합 포지션 헤더 */}
      <div className={`relative bg-gradient-to-br ${tierConf.gradient} border ${tierConf.border} rounded-2xl p-6 backdrop-blur-xl overflow-hidden`}>
        <div className="absolute inset-0 bg-slate-900/60" />
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${tierConf.bg} ${tierConf.color} border ${tierConf.border} mb-3`}>
              📊 업종 내 상대 포지션: {position.displayNameKo}
            </div>
            <h2 className="text-2xl font-black text-slate-100">
              {position.brandName}
              <span className={`ml-3 text-lg font-bold ${tierConf.color}`}>
                {tierConf.label}
              </span>
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              업종 내 {position.overallPercentile}백분위 •{" "}
              {position.metricPositions.length}개 지표 분석 •{" "}
              생성일: {new Date(position.generatedAt).toLocaleDateString("ko-KR")}
            </p>
          </div>

          {/* 종합 등급 */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-center">
              <div className={`text-6xl font-black ${tierConf.color} leading-none`}>
                {grade}
              </div>
              <div className="text-xs text-slate-500 mt-1 font-semibold">종합 등급</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-slate-200 leading-none">
                {position.overallPercentile}
              </div>
              <div className="text-xs text-slate-500 mt-1 font-semibold">백분위</div>
            </div>
          </div>
        </div>

        {/* 강점 / 약점 요약 칩 */}
        <div className="relative mt-4 flex flex-wrap gap-2">
          {position.strengths.slice(0, 3).map(s => (
            <div key={s.metricKey} className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs text-emerald-400 font-semibold">
              <TrendingUp className="h-3 w-3" />
              {s.metricNameKo} (P{s.percentileRank})
            </div>
          ))}
          {position.weaknesses.slice(0, 3).map(w => (
            <div key={w.metricKey} className="flex items-center gap-1 px-2.5 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-xs text-red-400 font-semibold">
              <TrendingDown className="h-3 w-3" />
              {w.metricNameKo} (P{w.percentileRank})
            </div>
          ))}
        </div>
      </div>

      {/* 레이더 차트 */}
      <IndustryComparisonChart
        metricPositions={position.metricPositions}
        displayNameKo={position.displayNameKo}
      />

      {/* 메트릭별 백분위 바 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* L1 */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <div className="h-6 w-6 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <span className="text-blue-400 text-xs font-black">L1</span>
            </div>
            <h4 className="text-sm font-bold text-slate-100">기술 인프라</h4>
          </div>
          <div className="space-y-3 mt-4">
            {l1Metrics.map(mp => (
              <PercentileBar key={mp.metricKey} position={mp} />
            ))}
          </div>
        </div>

        {/* L2 */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <div className="h-6 w-6 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <span className="text-violet-400 text-xs font-black">L2</span>
            </div>
            <h4 className="text-sm font-bold text-slate-100">구조화 데이터</h4>
          </div>
          <div className="space-y-3 mt-4">
            {l2Metrics.map(mp => (
              <PercentileBar key={mp.metricKey} position={mp} />
            ))}
          </div>
        </div>

        {/* L3 - full width */}
        <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <div className="h-6 w-6 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <span className="text-indigo-400 text-xs font-black">L3</span>
            </div>
            <h4 className="text-sm font-bold text-slate-100">콘텐츠 시맨틱</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 mt-4">
            {l3Metrics.map(mp => (
              <PercentileBar key={mp.metricKey} position={mp} />
            ))}
          </div>
        </div>
      </div>

      {/* 강점 / 약점 상세 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 강점 */}
        <div className="bg-slate-900/50 border border-emerald-800/30 rounded-2xl p-5">
          <h4 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            💪 강점 (업종 Top 25% 이상)
          </h4>
          {position.strengths.length === 0 ? (
            <p className="text-xs text-slate-500">아직 업종 상위 25% 이상 달성한 지표가 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {position.strengths.map(s => (
                <div key={s.metricKey} className="flex justify-between items-center text-xs py-1.5 border-b border-slate-800/50">
                  <span className="text-slate-300 font-medium">{s.metricNameKo}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">{s.brandValue}{s.unit}</span>
                    <span className="text-slate-500">(P{s.percentileRank})</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 약점 */}
        <div className="bg-slate-900/50 border border-red-800/30 rounded-2xl p-5">
          <h4 className="text-sm font-bold text-red-400 mb-3 flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            ⚠️ 약점 (업종 평균 이하)
          </h4>
          {position.weaknesses.length === 0 ? (
            <p className="text-xs text-slate-500">모든 지표가 업종 평균 이상입니다! 🎉</p>
          ) : (
            <div className="space-y-2">
              {position.weaknesses.slice(0, 6).map(w => (
                <div key={w.metricKey} className="flex justify-between items-center text-xs py-1.5 border-b border-slate-800/50">
                  <span className="text-slate-300 font-medium">{w.metricNameKo}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-red-400 font-bold">{w.brandValue}{w.unit}</span>
                    <span className="text-slate-500">→ 업종평균 {w.industryP50}{w.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Gap-to-Best 테이블 */}
      {position.gapToBest.length > 0 && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
          <h4 className="text-sm font-bold text-slate-100 mb-4">
            🎯 Gap-to-Best 분석 (우수 사이트 대비 개선 여지)
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left py-2 pr-4 text-slate-500 font-semibold">지표</th>
                  <th className="text-right py-2 pr-4 text-slate-500 font-semibold">현재값</th>
                  <th className="text-right py-2 pr-4 text-slate-500 font-semibold">우수 평균</th>
                  <th className="text-right py-2 pr-4 text-slate-500 font-semibold">Gap</th>
                  <th className="text-left py-2 text-slate-500 font-semibold">Blueprint 제안</th>
                </tr>
              </thead>
              <tbody>
                {position.gapToBest.map((g, i) => (
                  <tr key={g.metricKey} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="py-2 pr-4 text-slate-300 font-medium">
                      <span className="text-slate-600 mr-2">#{i + 1}</span>
                      {g.metricNameKo}
                    </td>
                    <td className="py-2 pr-4 text-amber-400 font-bold text-right">{g.brandValue}</td>
                    <td className="py-2 pr-4 text-violet-400 font-bold text-right">{g.excellentMean}</td>
                    <td className="py-2 pr-4 text-red-400 font-bold text-right">-{g.gap}</td>
                    <td className="py-2 text-slate-400 text-left truncate max-w-xs">
                      {g.blueprintRecommendation ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
