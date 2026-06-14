"use client";

import React, { useState } from "react";
import { SurfaceEntity } from "../../lib/schema";
import { FileCode2, Search, CheckCircle2, XCircle } from "lucide-react";

interface SurfaceMapPanelProps {
  entities: SurfaceEntity[];
}

export default function SurfaceMapPanel({ entities }: SurfaceMapPanelProps) {
  const types = ["all", "factoid", "procedural", "comparative", "authority", "schema_org", "topical_cluster", "local_geo"];
  const [activeType, setActiveType] = useState("all");

  const getLabel = (t: string) => {
    switch (t) {
      case "all": return "전체";
      case "factoid": return "사실형 (Factoid)";
      case "procedural": return "절차형 (Procedural)";
      case "comparative": return "비교형 (Comparative)";
      case "authority": return "권위성 (Authority)";
      case "schema_org": return "구조화 (Schema)";
      case "topical_cluster": return "주제 클러스터";
      case "local_geo": return "지역 정보 (Geo)";
      default: return t;
    }
  };

  const filteredEntities = activeType === "all"
    ? entities
    : entities.filter(e => e.surface_type === activeType);

  return (
    <div className="border border-slate-800 rounded-2xl bg-slate-900/20 backdrop-blur-xl p-6 shadow-2xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-4 mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileCode2 className="h-5 w-5 text-indigo-400" />
            웹사이트 지식 자산 추출 맵 (Surface Entity Map)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            크롤러와 LLM이 웹사이트 페이지에서 추출해낸 개별 지식 엔티티 목록입니다.
          </p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          총 {entities.length}개 엔티티 추출됨
        </span>
      </div>

      {/* Surface Type Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-800/60 pb-4">
        {types.map(t => {
          const count = t === "all" ? entities.length : entities.filter(e => e.surface_type === t).length;
          return (
            <button
              key={t}
              onClick={() => setActiveType(t)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeType === t
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-800/40 text-slate-400 hover:text-slate-200"
              }`}
            >
              {getLabel(t)} ({count})
            </button>
          );
        })}
      </div>

      {/* Entity Table */}
      {filteredEntities.length > 0 ? (
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800">
                <th className="pb-3 font-semibold uppercase tracking-wider pl-2">엔티티 명칭</th>
                <th className="pb-3 font-semibold uppercase tracking-wider w-32">분류 유형</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-center w-24">정보 완전성</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-center w-24">E-E-A-T 강도</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-center w-24">Schema 지원</th>
                <th className="pb-3 font-semibold uppercase tracking-wider">출처 페이지 URL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredEntities.map((entity, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 font-bold text-slate-200 pl-2 max-w-[220px] truncate" title={entity.entity_name}>
                    {entity.entity_name}
                  </td>
                  <td className="py-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                      {entity.surface_type}
                    </span>
                  </td>
                  <td className="py-4 text-center font-bold text-slate-300">
                    {entity.completeness_score}점
                  </td>
                  <td className="py-4 text-center font-bold text-slate-300">
                    {entity.eeat_strength}점
                  </td>
                  <td className="py-4">
                    <div className="flex justify-center">
                      {entity.has_schema_support ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <XCircle className="h-4 w-4 text-slate-600" />
                      )}
                    </div>
                  </td>
                  <td className="py-4 text-slate-500 max-w-[200px] truncate" title={entity.source_page_url}>
                    <a href={entity.source_page_url} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-indigo-400">
                      {entity.source_page_url}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-12 text-center text-slate-500 text-sm">
          해당 분류 유형에 해당하는 엔티티가 없습니다.
        </div>
      )}
    </div>
  );
}
