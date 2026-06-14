"use client";

import React from "react";
import { SurfaceGapAnalysis } from "../../lib/schema";
import { Wrench, CheckCircle, TrendingUp, AlertCircle } from "lucide-react";

interface PrescriptionListProps {
  gaps: SurfaceGapAnalysis[];
}

export default function PrescriptionList({ gaps }: PrescriptionListProps) {
  // Filter only items that require actions (prescriptions exist) and sort by priority_score descending
  const actionablePrescriptions = gaps
    .filter(g => g.prescription_type && g.prescription_type !== null && g.quadrant !== "green")
    .sort((a, b) => b.priority_score - a.priority_score);

  const getPrescriptionTypeLabel = (type: SurfaceGapAnalysis['prescription_type']) => {
    switch (type) {
      case "add_schema": return "Schema 마크업 추가";
      case "improve_heading": return "헤딩 계층 구조 개선";
      case "add_eeat_signal": return "E-E-A-T 신원 증명 보강";
      case "create_content": return "신규 QIS 콘텐츠 발행";
      case "improve_internal_linking": return "내부 링킹 구조 개선";
      case "add_faq_markup": return "FAQ 구조화 추가";
      case "improve_meta": return "메타 정보 최적화";
      case "opportunity_content": return "블루오션 킬러 콘텐츠 생성";
      default: return "자산 최적화";
    }
  };

  const getPrescriptionTypeColor = (type: SurfaceGapAnalysis['prescription_type']) => {
    switch (type) {
      case "add_schema": return "text-cyan-400 bg-cyan-500/10 border-cyan-500/20";
      case "add_eeat_signal": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "create_content": return "text-rose-400 bg-rose-500/10 border-rose-500/20";
      case "opportunity_content": return "text-violet-400 bg-violet-500/10 border-violet-500/20";
      default: return "text-slate-400 bg-slate-500/10 border-slate-500/20";
    }
  };

  return (
    <div className="border border-slate-800 rounded-2xl bg-slate-900/20 backdrop-blur-xl p-6 shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 mb-6 gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Wrench className="h-5 w-5 text-indigo-400" />
            우선순위별 AEO 최적화 처방전 (Prescriptions Checklist)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            4-사분면 갭 분석을 기초로 자동 도출된 실행 계획입니다. 영향도가 크고 최적화가 손쉬운 항목순으로 나열됩니다.
          </p>
        </div>
      </div>

      {actionablePrescriptions.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800">
                <th className="pb-3 font-semibold uppercase tracking-wider pl-4 w-20">우선순위</th>
                <th className="pb-3 font-semibold uppercase tracking-wider w-40">처방 유형</th>
                <th className="pb-3 font-semibold uppercase tracking-wider">대상 엔티티/자산</th>
                <th className="pb-3 font-semibold uppercase tracking-wider">상세 처방 내용</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-center w-28">예상 AEPI 상승</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {actionablePrescriptions.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 pl-4">
                    <span className={`inline-flex items-center justify-center h-6 w-9 rounded text-xs font-black bg-slate-800 text-slate-300 ${
                      idx < 2 ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : ""
                    }`}>
                      {item.priority_score}점
                    </span>
                  </td>
                  <td className="py-4">
                    <span className={`px-2.5 py-1 rounded text-[10px] font-black border uppercase ${getPrescriptionTypeColor(item.prescription_type)}`}>
                      {getPrescriptionTypeLabel(item.prescription_type)}
                    </span>
                  </td>
                  <td className="py-4 font-bold text-slate-200 pr-4 max-w-[200px] truncate">
                    {item.entity_name}
                  </td>
                  <td className="py-4 text-slate-400 pr-4 leading-relaxed max-w-[400px]">
                    {item.prescription_detail}
                  </td>
                  <td className="py-4 text-center">
                    {item.estimated_aepi_impact > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-400">
                        <TrendingUp className="h-3.5 w-3.5" />
                        +{item.estimated_aepi_impact}pt
                      </span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-12 text-center text-slate-500 text-sm">
          <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
          모든 AEO 기술 최적화 및 콘텐츠 반영이 완료된 청정 상태입니다!
        </div>
      )}
    </div>
  );
}
