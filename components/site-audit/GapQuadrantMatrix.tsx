"use client";

import React from "react";
import { SurfaceGapAnalysis } from "../../lib/schema";
import { CheckCircle2, AlertTriangle, FilePlus2, Sparkles } from "lucide-react";

interface GapQuadrantMatrixProps {
  gaps: SurfaceGapAnalysis[];
}

export default function GapQuadrantMatrix({ gaps }: GapQuadrantMatrixProps) {
  // Filter by quadrants
  const greenItems = gaps.filter(g => g.quadrant === "green");
  const yellowItems = gaps.filter(g => g.quadrant === "yellow");
  const redItems = gaps.filter(g => g.quadrant === "red");
  const whiteItems = gaps.filter(g => g.quadrant === "white");

  return (
    <div className="bg-slate-900/20 border border-slate-800 rounded-2xl p-6 backdrop-blur-md shadow-2xl">
      <h3 className="text-base font-bold text-slate-200 mb-6 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-indigo-400" />
        4-사분면 자산 매트릭스 (Topical & Technical Alignment)
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* GREEN QUADRANT */}
        <div className="border border-emerald-500/20 bg-emerald-950/5 rounded-xl p-5 flex flex-col h-72">
          <div className="flex items-center justify-between border-b border-emerald-500/10 pb-3 mb-3">
            <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              GREEN : 자산 유지 (Keep & Monitor)
            </h4>
            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/10 text-emerald-400">
              {greenItems.length}개
            </span>
          </div>
          <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
            {greenItems.length > 0 ? (
              greenItems.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-900/40 border border-slate-800/60 rounded-lg p-2.5 text-xs">
                  <span className="text-slate-200 font-bold max-w-[70%] truncate">{item.entity_name}</span>
                  <span className="text-emerald-400/80 font-semibold">{item.entity_type}</span>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                반영된 지식 자산이 없습니다.
              </div>
            )}
          </div>
        </div>

        {/* YELLOW QUADRANT */}
        <div className="border border-yellow-500/20 bg-yellow-950/5 rounded-xl p-5 flex flex-col h-72">
          <div className="flex items-center justify-between border-b border-yellow-500/10 pb-3 mb-3">
            <h4 className="text-sm font-bold text-yellow-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 animate-pulse" />
              YELLOW : AEO 기술 최적화 (AEO Fixes)
            </h4>
            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-yellow-500/10 text-yellow-400">
              {yellowItems.length}개
            </span>
          </div>
          <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
            {yellowItems.length > 0 ? (
              yellowItems.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-900/40 border border-slate-800/60 rounded-lg p-2.5 text-xs hover:border-yellow-500/30 transition-colors">
                  <div className="flex flex-col max-w-[70%]">
                    <span className="text-slate-200 font-bold truncate">{item.entity_name}</span>
                    <span className="text-[10px] text-yellow-500/80 font-medium mt-0.5 truncate">{item.prescription_detail}</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-yellow-500/10 text-yellow-400 shrink-0">
                    우선순위: {item.priority_score}
                  </span>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                AEO 최적화 대상이 없습니다.
              </div>
            )}
          </div>
        </div>

        {/* RED QUADRANT */}
        <div className="border border-rose-500/20 bg-rose-950/5 rounded-xl p-5 flex flex-col h-72">
          <div className="flex items-center justify-between border-b border-rose-500/10 pb-3 mb-3">
            <h4 className="text-sm font-bold text-rose-400 flex items-center gap-2">
              <FilePlus2 className="h-4 w-4" />
              RED : 콘텐츠 부족 공백 (Content Gaps)
            </h4>
            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-500/10 text-rose-400">
              {redItems.length}개
            </span>
          </div>
          <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
            {redItems.length > 0 ? (
              redItems.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-900/40 border border-slate-800/60 rounded-lg p-2.5 text-xs hover:border-rose-500/30 transition-colors">
                  <div className="flex flex-col max-w-[70%]">
                    <span className="text-slate-200 font-bold truncate">{item.entity_name}</span>
                    <span className="text-[10px] text-rose-400/70 font-semibold mt-0.5">{item.industry_qis_layer}</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-500/10 text-rose-400 shrink-0">
                    우선순위: {item.priority_score}
                  </span>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                콘텐츠 공백이 검출되지 않았습니다.
              </div>
            )}
          </div>
        </div>

        {/* WHITE QUADRANT */}
        <div className="border border-violet-500/20 bg-violet-950/5 rounded-xl p-5 flex flex-col h-72">
          <div className="flex items-center justify-between border-b border-violet-500/10 pb-3 mb-3">
            <h4 className="text-sm font-bold text-violet-400 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              WHITE : 블루오션 선점 (Opportunistic Gap)
            </h4>
            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-violet-500/10 text-violet-400">
              {whiteItems.length}개
            </span>
          </div>
          <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
            {whiteItems.length > 0 ? (
              whiteItems.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-900/40 border border-slate-800/60 rounded-lg p-2.5 text-xs hover:border-violet-500/30 transition-colors">
                  <div className="flex flex-col max-w-[70%]">
                    <span className="text-slate-200 font-bold truncate">{item.entity_name}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 truncate">{item.prescription_detail}</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-violet-500/10 text-violet-400 shrink-0">
                    우선순위: {item.priority_score}
                  </span>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                검출된 블루오션 선점 항목이 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
