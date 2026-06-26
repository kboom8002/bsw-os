"use client";

/**
 * components/benchmark/IndustryLeaderboard.tsx
 * 업종 내 TOP 브랜드 리더보드 — AEPI 점수 기준 랭킹 + 내 브랜드 위치
 */

import React, { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus, Crown, Award, Star } from "lucide-react";
import type { BenchmarkHistoryPoint } from "../../lib/benchmark/temporal-tracker";

interface Props {
  points: BenchmarkHistoryPoint[];
  myBrandUrl?: string;      // 감사 대상 브랜드 URL (리더보드에서 하이라이트)
  maxRows?: number;
  showMetrics?: string[];   // 부가 메트릭 컬럼 키 (최대 3개)
}

const TIER_BADGE: Record<string, { label: string; cls: string }> = {
  excellent: { label: "Excellent", cls: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" },
  average:   { label: "Average",   cls: "bg-amber-500/20 text-amber-400 border border-amber-500/30" },
  poor:      { label: "Poor",      cls: "bg-red-500/20 text-red-400 border border-red-500/30" },
};

const RANK_ICONS = [
  <Crown key={0} className="w-4 h-4 text-yellow-400" />,
  <Award key={1} className="w-4 h-4 text-zinc-300" />,
  <Star key={2} className="w-4 h-4 text-amber-600" />,
];

function AepiBar({ score }: { score: number }) {
  const color = score >= 70 ? "bg-emerald-500" : score >= 45 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(score, 100)}%` }} />
      </div>
      <span className="text-xs font-mono font-bold text-zinc-200 w-8 text-right">{score.toFixed(0)}</span>
    </div>
  );
}

export function IndustryLeaderboard({ points, myBrandUrl, maxRows = 10, showMetrics = [] }: Props) {
  const ranked = useMemo(() => {
    const sorted = [...points].sort((a, b) => b.aepiScore - a.aepiScore);
    return sorted.slice(0, maxRows);
  }, [points, maxRows]);

  const myRank = useMemo(() => {
    if (!myBrandUrl) return -1;
    const sorted = [...points].sort((a, b) => b.aepiScore - a.aepiScore);
    return sorted.findIndex((p) => p.url === myBrandUrl) + 1;
  }, [points, myBrandUrl]);

  if (ranked.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-zinc-500 text-sm">
        벤치마크 데이터 없음 — 배치 감사를 먼저 실행하세요
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* 내 브랜드 위치 뱃지 */}
      {myRank > 0 && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center gap-2 text-sm">
          <span className="text-indigo-400 font-bold">내 브랜드</span>
          <span className="text-zinc-300">업종 내 전체 {points.length}개 브랜드 중</span>
          <span className="text-indigo-300 font-bold">#{myRank}</span>
        </div>
      )}

      {/* 리더보드 테이블 */}
      <div className="rounded-xl overflow-hidden border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-800/60 text-zinc-400 text-xs">
              <th className="px-3 py-2 text-left w-8">#</th>
              <th className="px-3 py-2 text-left">브랜드</th>
              <th className="px-3 py-2 text-left w-24">등급</th>
              <th className="px-3 py-2 text-left min-w-[120px]">AEPI 점수</th>
              {showMetrics.slice(0, 3).map((k) => (
                <th key={k} className="px-3 py-2 text-right text-xs">{k}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {ranked.map((point, idx) => {
              const isMe = point.url === myBrandUrl;
              const tierBadge = TIER_BADGE[point.tier] ?? TIER_BADGE.average;
              return (
                <tr
                  key={point.id}
                  className={`transition-colors ${isMe ? "bg-indigo-500/10 border-l-2 border-indigo-500" : "hover:bg-zinc-800/30"}`}
                >
                  {/* 순위 */}
                  <td className="px-3 py-2.5">
                    {idx < 3 ? (
                      <span className="flex items-center justify-center">{RANK_ICONS[idx]}</span>
                    ) : (
                      <span className="text-zinc-500 text-xs font-mono">{idx + 1}</span>
                    )}
                  </td>

                  {/* 브랜드 */}
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div>
                        <div className={`font-medium ${isMe ? "text-indigo-300" : "text-zinc-200"}`}>
                          {point.brandName}
                          {isMe && <span className="ml-1.5 text-[10px] bg-indigo-500/30 text-indigo-400 px-1.5 py-0.5 rounded">나</span>}
                        </div>
                        <div className="text-[11px] text-zinc-500 truncate max-w-[180px]">{point.url}</div>
                      </div>
                    </div>
                  </td>

                  {/* 등급 */}
                  <td className="px-3 py-2.5">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${tierBadge.cls}`}>
                      {tierBadge.label}
                    </span>
                  </td>

                  {/* AEPI 점수 바 */}
                  <td className="px-3 py-2.5">
                    <AepiBar score={point.aepiScore} />
                  </td>

                  {/* 부가 메트릭 */}
                  {showMetrics.slice(0, 3).map((k) => (
                    <td key={k} className="px-3 py-2.5 text-right text-xs text-zinc-400 font-mono">
                      {(point.metrics[k] ?? 0).toFixed(0)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {points.length > maxRows && (
        <div className="mt-2 text-xs text-zinc-500 text-center">
          전체 {points.length}개 브랜드 중 상위 {maxRows}개 표시
        </div>
      )}
    </div>
  );
}
