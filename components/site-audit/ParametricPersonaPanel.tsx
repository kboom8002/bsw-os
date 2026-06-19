"use client";

import React from "react";
import { ParametricPersonaSnapshot } from "../../lib/persona/parametric-persona-snapshot";
import { Activity, AlertCircle, TrendingUp, TrendingDown, Target, BrainCircuit } from "lucide-react";

interface ParametricPersonaPanelProps {
  snapshot: ParametricPersonaSnapshot | null;
}

export default function ParametricPersonaPanel({ snapshot }: ParametricPersonaPanelProps) {
  if (!snapshot) {
    return (
      <div className="border border-slate-800 rounded-2xl bg-slate-900/20 backdrop-blur-xl p-8 text-center text-slate-500 text-sm">
        파라메트릭 페르소나 v2.0 관측 데이터가 아직 수집되지 않았습니다.
      </div>
    );
  }

  const { cognitive_intensity, vibe_alignment, cognitive_map, b2c_distributions, b2b_distributions } = snapshot;

  const getIntensityColor = (grade: string) => {
    switch(grade) {
      case 'STRONG': return 'text-emerald-400';
      case 'MODERATE': return 'text-yellow-400';
      case 'WEAK': return 'text-orange-400';
      case 'ABSENT': return 'text-rose-500';
      default: return 'text-slate-400';
    }
  };

  const getDriftColor = (type: string) => {
    return type === 'OVER' ? 'text-rose-400' : 'text-blue-400';
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Overall Intensity */}
        <div className="border border-slate-800 rounded-2xl bg-slate-900/40 p-6 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-4 left-4 text-xs font-bold text-slate-400 tracking-wider">OVERALL COGNITIVE INTENSITY</div>
          <div className="relative w-32 h-32 flex items-center justify-center mt-6">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" className="text-slate-800" strokeWidth="8" />
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" 
                className={getIntensityColor(cognitive_intensity.overall.grade)} 
                strokeWidth="8" strokeDasharray={`${cognitive_intensity.overall.score * 2.83} 283`} />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl font-black text-white">{cognitive_intensity.overall.score}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 bg-slate-800 ${getIntensityColor(cognitive_intensity.overall.grade)}`}>
                {cognitive_intensity.overall.grade}
              </span>
            </div>
          </div>
        </div>

        {/* B2C & B2B Intensities */}
        <div className="col-span-2 border border-slate-800 rounded-2xl bg-slate-900/20 p-6 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-violet-400" />
            <h3 className="text-sm font-bold text-slate-300">B2C vs B2B 채널별 인지 강도 갭</h3>
          </div>
          
          <div className="space-y-6">
            {cognitive_intensity.b2c && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-blue-400">B2C (일반 소비자/팬)</span>
                  <span className="text-slate-300">{cognitive_intensity.b2c.score} 점 ({cognitive_intensity.b2c.grade})</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{width: `${cognitive_intensity.b2c.score}%`}}></div>
                </div>
              </div>
            )}
            
            {cognitive_intensity.b2b && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-orange-400">B2B (기업 바이어/파트너)</span>
                  <span className="text-slate-300">{cognitive_intensity.b2b.score} 점 ({cognitive_intensity.b2b.grade})</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500" style={{width: `${cognitive_intensity.b2b.score}%`}}></div>
                </div>
              </div>
            )}
          </div>

          {cognitive_intensity.gap_analysis && (
            <div className="mt-6 p-3 bg-slate-800/50 rounded-lg text-xs text-slate-300 flex items-start gap-3 border border-slate-700/50">
              <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-yellow-400 block mb-1">Gap Analysis (Δ {Math.abs(cognitive_intensity.gap_analysis.b2b_b2c_delta)}점)</span>
                {cognitive_intensity.gap_analysis.recommendation_ko}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vibe Drift Tolerance Bands */}
        <div className="border border-slate-800 rounded-2xl bg-slate-900/20 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-bold text-slate-300">Vibe Tolerance Band Drift (B2C 기준)</h3>
          </div>
          
          {!vibe_alignment?.b2c?.drifted_axes?.length ? (
            <div className="text-xs text-emerald-400 bg-emerald-900/20 p-3 rounded-lg border border-emerald-900/50">
              ✓ B2C 관점에서 모든 10가지 정동(Vibe) 축이 의도된 허용 범위 내에 있습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {vibe_alignment.b2c.drifted_axes.map((drift, i) => (
                <div key={i} className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-bold text-slate-200 capitalize">{drift.axis}</span>
                    <span className={`font-black ${getDriftColor(drift.type)}`}>
                      {drift.type} (Δ {Math.abs(drift.delta).toFixed(2)})
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">{drift.interpretation}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cognitive Map */}
        <div className="border border-slate-800 rounded-2xl bg-slate-900/20 p-6">
          <div className="flex items-center gap-2 mb-4">
            <BrainCircuit className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-300">Cognitive Map (자동 연상 구조)</h3>
          </div>
          
          {cognitive_map?.b2c && (
            <div className="space-y-4">
              <div>
                <div className="text-[10px] font-bold text-slate-500 mb-2">B2C 연상 키워드</div>
                <div className="flex flex-wrap gap-2">
                  {cognitive_map.b2c.auto_associations.map((kw, i) => (
                    <span key={i} className="px-2 py-1 bg-blue-900/30 text-blue-300 border border-blue-800/50 rounded-md text-[10px]">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="border-t border-slate-800/50 pt-4">
                <div className="text-[10px] font-bold text-slate-500 mb-2">동반 언급 경쟁사 (B2C)</div>
                <div className="flex gap-2">
                  {cognitive_map.b2c.competitive_frame.map((comp, i) => (
                    <span key={i} className="text-xs font-bold text-slate-300">
                      {i > 0 && <span className="text-slate-600 mr-2">vs</span>}
                      {comp}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
