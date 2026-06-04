"use client";

import React from "react";
import { Sparkles, Shield, Cpu } from "lucide-react";

interface AEPIScoreCardProps {
  aepiScore: number;
  techScore: number;
  eeatScore: number;
  totalEntities: number;
  reflectedEntities: number;
  auditMode?: 'estimated' | 'measured' | 'partial';
}

export default function AEPIScoreCard({
  aepiScore,
  techScore,
  eeatScore,
  totalEntities,
  reflectedEntities,
  auditMode = 'estimated'
}: AEPIScoreCardProps) {
  const modeBadge = auditMode === 'measured'
    ? { label: '실측값', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' }
    : auditMode === 'partial'
      ? { label: '부분 실측', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' }
      : { label: '추정값', color: 'bg-violet-500/20 text-violet-400 border-violet-500/30' };
  // Reflection percentage
  const reflectionRate = totalEntities > 0 
    ? Math.round((reflectedEntities / totalEntities) * 100) 
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* AEPI Score Card */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 to-slate-950 p-6 shadow-xl">
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <Sparkles className="h-20 w-20 text-indigo-400" />
        </div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
            AEPI 복합 가시성 지수
          </span>
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${modeBadge.color}`}>
            {modeBadge.label}
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            {aepiScore}
          </span>
          <span className="text-sm font-bold text-slate-500">pt</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2 mt-4">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000"
            style={{ width: `${aepiScore}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-4 leading-relaxed">
          AI Engine Presence Index: 웹사이트의 지식 엔티티가 AI 검색엔진 응답에 반영되는 총 가시성을 지수화한 점수입니다.
        </p>
      </div>

      {/* Technical Audit Card */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-xl shadow-xl shadow-slate-950/40">
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <Cpu className="h-20 w-20 text-cyan-400" />
        </div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
            기술 최적화 지수 (Tech Modifier)
          </span>
          <Cpu className="h-4 w-4 text-cyan-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black text-cyan-400">
            {techScore}%
          </span>
          <span className="text-xs text-slate-500 font-semibold">
            (Modifier: x{(0.8 + 0.2 * (techScore / 100)).toFixed(2)})
          </span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-1.5 mt-4">
          <div
            className="h-1.5 rounded-full bg-cyan-400 transition-all duration-1000"
            style={{ width: `${techScore}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-4 leading-relaxed">
          Schema.org 마크업 비율과 메타태그 구조의 완성도를 측정하여 가시성에 가중 보정치를 반영합니다.
        </p>
      </div>

      {/* EEAT Strength Card */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-xl shadow-xl shadow-slate-950/40">
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <Shield className="h-20 w-20 text-emerald-400" />
        </div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
            E-E-A-T 신뢰도 지수 (EEAT Modifier)
          </span>
          <Shield className="h-4 w-4 text-emerald-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black text-emerald-400">
            {eeatScore}%
          </span>
          <span className="text-xs text-slate-500 font-semibold">
            (Modifier: x{(0.8 + 0.2 * (eeatScore / 100)).toFixed(2)})
          </span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-1.5 mt-4">
          <div
            className="h-1.5 rounded-full bg-emerald-400 transition-all duration-1000"
            style={{ width: `${eeatScore}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-4 leading-relaxed">
          전문가 저작성 정보 및 신뢰도 증거 신호의 웹페이지 노출 정도를 측정하여 가중 보정치를 반영합니다.
        </p>
      </div>
    </div>
  );
}
