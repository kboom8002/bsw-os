"use client";

import React from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend,
} from "recharts";
import { MetricPosition } from "../../lib/industry/relative-positioner";

interface IndustryComparisonChartProps {
  metricPositions: MetricPosition[];
  displayNameKo: string;
}

// 레이더 차트에 표시할 주요 6개 축
const RADAR_METRICS = [
  'techInfraScore',
  'schemaQualityScore',
  'eeatOverall',
  'answerFirstAvgScore',
  'freshnessScore',
  'multimediaScore',
];

const RADAR_LABELS: Record<string, string> = {
  techInfraScore: '기술 인프라',
  schemaQualityScore: '구조화 데이터',
  eeatOverall: 'E-E-A-T',
  answerFirstAvgScore: 'Answer-First',
  freshnessScore: '콘텐츠 신선도',
  multimediaScore: '멀티모달',
};

export default function IndustryComparisonChart({
  metricPositions,
  displayNameKo,
}: IndustryComparisonChartProps) {
  const data = RADAR_METRICS.map(key => {
    const mp = metricPositions.find(m => m.metricKey === key);
    return {
      metric: RADAR_LABELS[key] ?? key,
      내사이트: mp?.brandValue ?? 0,
      업종평균: mp?.industryP50 ?? 0,
      업종Top: mp?.industryP75 ?? 0,
    };
  });

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-2 w-2 rounded-full bg-indigo-400" />
        <h3 className="text-sm font-bold text-slate-100">
          {displayNameKo} 업종 6대 축 비교
        </h3>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
          <PolarGrid stroke="#334155" />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 600 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: "#475569", fontSize: 9 }}
            tickCount={4}
          />
          <Radar
            name="업종 Top (P75)"
            dataKey="업종Top"
            stroke="#6366f1"
            fill="#6366f1"
            fillOpacity={0.1}
            strokeWidth={1.5}
            strokeDasharray="4 2"
          />
          <Radar
            name="업종 평균"
            dataKey="업종평균"
            stroke="#475569"
            fill="#475569"
            fillOpacity={0.1}
            strokeWidth={1.5}
            strokeDasharray="2 2"
          />
          <Radar
            name="내 사이트"
            dataKey="내사이트"
            stroke="#a78bfa"
            fill="#a78bfa"
            fillOpacity={0.25}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              border: "1px solid #334155",
              borderRadius: "8px",
              fontSize: "12px",
              color: "#e2e8f0",
            }}
            formatter={(value: unknown) => [`${typeof value === 'number' ? value.toFixed(1) : value}pt`, undefined]}
          />
          <Legend
            wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
