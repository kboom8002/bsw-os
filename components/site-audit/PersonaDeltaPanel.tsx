"use client";

import React from "react";
import { ObservedParametricPersona, PersonaSpec } from "../../lib/schema";
import { Sparkles, Activity, AlertCircle } from "lucide-react";

interface PersonaDeltaPanelProps {
  observedPersona: ObservedParametricPersona | null;
  personaSpec: PersonaSpec | null;
}

export default function PersonaDeltaPanel({ observedPersona, personaSpec }: PersonaDeltaPanelProps) {
  if (!observedPersona) {
    return (
      <div className="border border-slate-800 rounded-2xl bg-slate-900/20 backdrop-blur-xl p-8 text-center text-slate-500 text-sm">
        페르소나 관측 데이터가 아직 수집되지 않았습니다.
      </div>
    );
  }

  // Define comparative tones
  const tones = [
    { label: "친근함 (Warmth)", observed: observedPersona.tone_warmth, intended: 0.65 },
    { label: "격식성 (Formality)", observed: observedPersona.tone_formality, intended: 0.8 },
    { label: "확신성 (Confidence)", observed: observedPersona.tone_confidence, intended: 0.75 },
    { label: "전문성 (Expertise)", observed: observedPersona.tone_expertise, intended: 0.9 },
    { label: "공감도 (Empathy)", observed: observedPersona.tone_empathy, intended: 0.6 }
  ];

  const alignmentScore = observedPersona.persona_alignment_score !== null 
    ? observedPersona.persona_alignment_score 
    : 85; // mock default if null

  const getDeltaColor = (delta: number) => {
    if (delta > 0.2) return "text-rose-400";
    if (delta > 0.1) return "text-yellow-400";
    return "text-emerald-400";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Tone comparison bars */}
      <div className="lg:col-span-2 border border-slate-800 rounded-2xl bg-slate-900/20 backdrop-blur-xl p-6 shadow-2xl">
        <h3 className="text-sm font-bold text-slate-300 mb-6 flex items-center gap-2">
          <Activity className="h-4 w-4 text-violet-400" />
          의도 페르소나 vs 실제 관측 AI 페르소나 톤 매칭 (Delta Analysis)
        </h3>

        <div className="space-y-5">
          {tones.map((t, idx) => {
            const delta = Math.abs(t.observed - t.intended);
            const isAlert = delta > 0.15;
            
            return (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-bold">{t.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 font-semibold">의도: {(t.intended * 100).toFixed(0)}%</span>
                    <span className="text-slate-200 font-black">관측: {(t.observed * 100).toFixed(0)}%</span>
                    <span className={`font-black text-[10px] ${getDeltaColor(delta)}`}>
                      Δ {(delta * 100).toFixed(0)}% {isAlert ? "⚠" : ""}
                    </span>
                  </div>
                </div>

                <div className="relative w-full h-3.5 bg-slate-850 rounded-full overflow-hidden border border-slate-800/80">
                  {/* Intended background indicator */}
                  <div 
                    className="absolute top-0 bottom-0 bg-indigo-500/10 border-r border-dashed border-indigo-400" 
                    style={{ width: `${t.intended * 100}%` }}
                  />
                  {/* Observed solid bar */}
                  <div 
                    className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full" 
                    style={{ width: `${t.observed * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 rounded-lg bg-slate-950/40 border border-slate-800 text-[10px] text-slate-400 leading-relaxed">
          <span className="font-bold text-slate-300 block mb-1">💡 분석 가이드</span>
          의도된 페르소나 설계 대비 실제 AI 검색엔진 응답 톤의 차이(Delta)를 측정합니다.
          오차 범위 <span className="text-emerald-400">15% 이내(Green)</span>는 톤 정합성이 잘 관리되고 있음을 뜻하며,
          <span className="text-rose-400">15% 초과(Red)</span>는 사이트 내용 혹은 AEO 최적화 텍스트가 AI 학습 엔진에 왜곡되어 반영되었음을 가리킵니다.
        </div>
      </div>

      {/* Alignment summary and analysis details */}
      <div className="flex flex-col border border-slate-800 rounded-2xl bg-slate-900/20 backdrop-blur-xl p-6 shadow-2xl justify-between">
        <div className="space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
              브랜드 인격 정합도 점수
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-5xl font-black text-violet-400">
                {alignmentScore}
              </span>
              <span className="text-sm font-bold text-slate-500">/ 100 pt</span>
            </div>
          </div>

          <div className="space-y-3 border-t border-slate-800 pt-4 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-semibold">인용 시장 카테고리:</span>
              <span className="text-slate-200 font-bold bg-slate-800 px-2 py-0.5 rounded">
                {observedPersona.category_placement || "더마 코스메틱"}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-semibold">동반 언급 경쟁사:</span>
              <span className="text-slate-200 font-bold">
                {observedPersona.competitive_frame.slice(0, 3).join(", ") || "닥터자르트, CNP"}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-semibold">추천 지수 강도:</span>
              <span className="text-emerald-400 font-black">
                {observedPersona.recommendation_strength}%
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-semibold">감성 극성 분포:</span>
              <span className="text-indigo-400 font-black">
                {observedPersona.sentiment_valence > 0 ? "긍정적" : "중립적"} ({(observedPersona.sentiment_valence * 100).toFixed(0)}%)
              </span>
            </div>
          </div>
        </div>

        {observedPersona.analysis_details?.persona_alignment_rationale && (
          <div className="mt-5 p-3.5 bg-violet-950/10 border border-violet-500/10 rounded-lg text-[10px] text-slate-400 flex gap-2">
            <AlertCircle className="h-4 w-4 text-violet-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-300 block">AI 매칭 피드백</span>
              {observedPersona.analysis_details.persona_alignment_rationale}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
