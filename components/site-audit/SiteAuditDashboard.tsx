"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  ShieldAlert, RefreshCw, BarChart3,
  FileCode2, UserCheck, CheckCircle2, Globe, Clock,
  Pencil, X, Search
} from "lucide-react";
import {
  SurfaceEntity, ReversedAnswerCard,
  EntityReflectionSnapshot, ObservedParametricPersona,
  PersonaSpec, SurfaceGapAnalysis
} from "../../lib/schema";

import AEPIScoreCard from "./AEPIScoreCard";
import ERRRadarChart from "./ERRRadarChart";
import GapQuadrantMatrix from "./GapQuadrantMatrix";
import PrescriptionList from "./PrescriptionList";
import SurfaceMapPanel from "./SurfaceMapPanel";
import AnswerCardList from "./AnswerCardList";
import PersonaDeltaPanel from "./PersonaDeltaPanel";

interface SiteAuditDashboardProps {
  brandName: string;
  websiteUrl: string;
  entities: SurfaceEntity[];
  cards: ReversedAnswerCard[];
  snapshot: EntityReflectionSnapshot | null;
  observedPersona: ObservedParametricPersona | null;
  personaSpec: PersonaSpec | null;
  gaps: SurfaceGapAnalysis[];
  onTriggerReRun?: () => Promise<any>;
}

export default function SiteAuditDashboard({
  brandName,
  websiteUrl,
  entities,
  cards,
  snapshot,
  observedPersona,
  personaSpec,
  gaps,
  onTriggerReRun
}: SiteAuditDashboardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState("diagnostic");
  const [running, setRunning] = useState(false);

  // URL edit state
  const [urlEditMode, setUrlEditMode] = useState(false);
  const [editUrl, setEditUrl] = useState(websiteUrl);
  const [editBrand, setEditBrand] = useState(brandName);

  const handleUrlChange = (e: React.FormEvent) => {
    e.preventDefault();
    let normalized = editUrl.trim();
    if (!normalized.startsWith("http")) normalized = "https://" + normalized;
    const params = new URLSearchParams({
      url: normalized,
      ...(editBrand.trim() ? { brand: editBrand.trim() } : {}),
    });
    setUrlEditMode(false);
    router.push(`${pathname}?${params.toString()}`);
  };

  // Stateful metrics for dynamic updates
  const [localEntities, setLocalEntities] = useState<SurfaceEntity[]>(entities);
  const [localCards, setLocalCards] = useState<ReversedAnswerCard[]>(cards);
  const [localSnapshot, setLocalSnapshot] = useState<EntityReflectionSnapshot | null>(snapshot);
  const [localObservedPersona, setLocalObservedPersona] = useState<ObservedParametricPersona | null>(observedPersona);
  const [localGaps, setLocalGaps] = useState<SurfaceGapAnalysis[]>(gaps);

  const handleReRun = async () => {
    if (!onTriggerReRun) return;
    try {
      setRunning(true);
      const res = await onTriggerReRun();
      if (res) {
        if (res.entities) setLocalEntities(res.entities);
        if (res.cards) setLocalCards(res.cards);
        if (res.snapshot) setLocalSnapshot(res.snapshot);
        if (res.observedPersona) setLocalObservedPersona(res.observedPersona);
        if (res.gaps) setLocalGaps(res.gaps);
      }
    } catch (err) {
      console.error("Re-run audit error:", err);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-violet-500 to-indigo-600 rounded-lg shadow-lg shadow-indigo-500/20">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                AEO/GEO Surface Auditor
              </span>
              <span className="text-xs block text-slate-400 font-semibold">
                웹사이트 AI 검색엔진 노출 서피스 역설계 및 최적화 점검 도구
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* URL display / edit bar */}
            {urlEditMode ? (
              <form onSubmit={handleUrlChange} className="flex items-center gap-2">
                <input
                  autoFocus
                  type="text"
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-56 px-3 py-1.5 bg-slate-800 border border-indigo-500 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none"
                />
                <input
                  type="text"
                  value={editBrand}
                  onChange={(e) => setEditBrand(e.target.value)}
                  placeholder="브랜드명 (선택)"
                  className="w-36 px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none"
                />
                <button type="submit" className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer">
                  <Search className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => setUrlEditMode(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition-all cursor-pointer">
                  <X className="h-3.5 w-3.5" />
                </button>
              </form>
            ) : (
              <button
                onClick={() => { setEditUrl(websiteUrl); setEditBrand(brandName); setUrlEditMode(true); }}
                className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-400 font-semibold transition-colors group cursor-pointer"
                title="클릭하여 대상 URL 변경"
              >
                <Globe className="h-4 w-4 text-slate-500 group-hover:text-indigo-400" />
                <span className="text-indigo-400 font-bold">{websiteUrl}</span>
                <Pencil className="h-3 w-3 text-slate-600 group-hover:text-indigo-400" />
              </button>
            )}
            {onTriggerReRun && !urlEditMode && (
              <button
                onClick={handleReRun}
                disabled={running}
                className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 disabled:opacity-50 transition-all cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${running ? 'animate-spin' : ''}`} />
                실시간 감사 실행
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Brand Summary Board */}
        <div className="relative mb-8 bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <Globe className="h-3.5 w-3.5" />
              {brandName} ({websiteUrl})
            </div>
            <h1 className="text-2xl font-black text-slate-100 tracking-tight leading-tight">
              AEO/GEO 노출 및 최적화 감사 대시보드
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              본 감사는 대상 사이트 전체를 크롤링하여 내장 지식 그래프를 구성한 후,
              각 자산이 AI 검색결과(ChatGPT, Gemini)에 정상적으로 노출(Reflection)되는지 검증하고 처방을 내립니다.
            </p>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0 self-end md:self-center">
            <Clock className="h-3.5 w-3.5" />
            최근 감사일시: {localSnapshot?.measured_at 
              ? new Date(localSnapshot.measured_at).toLocaleDateString("ko-KR", {
                  year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                }) 
              : "기록 없음"}
          </div>
        </div>

        {/* Diagnostic Score Card Rows */}
        {localSnapshot && (
          <div className="mb-8">
            <AEPIScoreCard
              aepiScore={localSnapshot.aepi_score}
              techScore={localSnapshot.tech_mod_score}
              eeatScore={localSnapshot.eeat_mod_score}
              totalEntities={localSnapshot.total_entities_checked}
              reflectedEntities={localSnapshot.total_entities_reflected}
            />
          </div>
        )}

        {/* Tabs navigation */}
        <div className="flex gap-2 mb-8 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800 w-fit">
          <button
            onClick={() => setActiveTab("diagnostic")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === "diagnostic"
                ? "bg-indigo-600 text-white shadow-lg"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            AEO 가시성 종합 진단
          </button>
          
          <button
            onClick={() => setActiveTab("prescriptions")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === "prescriptions"
                ? "bg-indigo-600 text-white shadow-lg"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            최적화 처방전 목록 ({localGaps.filter(g => g.quadrant !== 'green' && g.prescription_type).length})
          </button>

          <button
            onClick={() => setActiveTab("entities")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === "entities"
                ? "bg-indigo-600 text-white shadow-lg"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileCode2 className="h-3.5 w-3.5" />
            추출 지식 자산 분석
          </button>

          <button
            onClick={() => setActiveTab("persona")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === "persona"
                ? "bg-indigo-600 text-white shadow-lg"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            AI 브랜드 페르소나 매칭
          </button>
        </div>

        {/* Tab contents */}
        <div className="space-y-8">
          {activeTab === "diagnostic" && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  {localSnapshot && (
                    <ERRRadarChart
                      errFactoid={localSnapshot.err_factoid}
                      errProcedural={localSnapshot.err_procedural}
                      errComparative={localSnapshot.err_comparative}
                      errAuthority={localSnapshot.err_authority}
                      errSchema={localSnapshot.err_schema}
                      errTopical={localSnapshot.err_topical}
                      errGeo={localSnapshot.err_geo}
                    />
                  )}
                </div>
                <div className="lg:col-span-2">
                  <GapQuadrantMatrix gaps={localGaps} />
                </div>
              </div>
            </>
          )}

          {activeTab === "prescriptions" && (
            <PrescriptionList gaps={localGaps} />
          )}

          {activeTab === "entities" && (
            <div className="space-y-8">
              <SurfaceMapPanel entities={localEntities} />
              <AnswerCardList cards={localCards} />
            </div>
          )}

          {activeTab === "persona" && (
            <PersonaDeltaPanel
              observedPersona={localObservedPersona}
              personaSpec={personaSpec}
            />
          )}
        </div>
      </main>


      <footer className="border-t border-slate-800 bg-slate-900/30 py-8 text-center text-xs text-slate-500 mt-12">
        <p>© 2026 BSW-OS Brand Semantic Website OS. All Rights Reserved.</p>
        <p className="mt-1">
          Powered by BSW-OS AEO/GEO Reverse-Engineering System V1.0
        </p>
      </footer>
    </div>
  );
}
