"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  ShieldAlert, RefreshCw, BarChart3,
  FileCode2, UserCheck, CheckCircle2, Globe, Clock,
  Pencil, X, Search, Printer, Layers, FileJson, FileText, LayoutDashboard
} from "lucide-react";
import {
  SurfaceEntity, ReversedAnswerCard,
  EntityReflectionSnapshot, ObservedParametricPersona,
  PersonaSpec, SurfaceGapAnalysis
} from "../../lib/schema";

import { TechInfraAuditResult } from "../../lib/surface/tech-infra-auditor";
import { SchemaQualityAuditResult } from "../../lib/surface/schema-quality-auditor";
import { ContentSemanticResult } from "../../lib/surface/content-semantic-analyzer";

import AEPIScoreCard from "./AEPIScoreCard";
import ERRRadarChart from "./ERRRadarChart";
import GapQuadrantMatrix from "./GapQuadrantMatrix";
import PrescriptionList from "./PrescriptionList";
import SurfaceMapPanel from "./SurfaceMapPanel";
import AnswerCardList from "./AnswerCardList";
import PersonaDeltaPanel from "./PersonaDeltaPanel";
import ParametricPersonaPanel from "./ParametricPersonaPanel";
import PersonaFidelityPanel from "./PersonaFidelityPanel";
import TemporalTrendChart from "./TemporalTrendChart";
import { TemporalTrend } from "../../lib/benchmark/temporal-tracker";
import { ParametricPersonaSnapshot } from "../../lib/persona/parametric-persona-snapshot";
import LockedPanel from "./LockedPanel";
import EmailCaptureForm from "./EmailCaptureForm";
import { Lock } from "lucide-react";

import OverviewPanel from "./OverviewPanel";
import TechInfraPanel from "./TechInfraPanel";
import SchemaQualityPanel from "./SchemaQualityPanel";
import ContentSemanticPanel from "./ContentSemanticPanel";

interface SiteAuditDashboardProps {
  brandName: string;
  websiteUrl: string;
  entities: SurfaceEntity[];
  cards: ReversedAnswerCard[];
  snapshot: EntityReflectionSnapshot | null;
  observedPersona: ObservedParametricPersona | null;
  parametricSnapshot?: ParametricPersonaSnapshot | null;
  personaSpec: PersonaSpec | null;
  gaps: SurfaceGapAnalysis[];
  trends?: TemporalTrend[];
  auditMode?: 'estimated' | 'measured' | 'partial';
  tier?: 'free' | 'tier1' | 'tier1.5' | 'tier2' | 'tier3';
  onTriggerReRun?: () => Promise<any>;
  techInfra?: TechInfraAuditResult | null;
  schemaQuality?: SchemaQualityAuditResult | null;
  contentSemantic?: ContentSemanticResult | null;
}

export default function SiteAuditDashboard({
  brandName,
  websiteUrl,
  entities,
  cards,
  snapshot,
  observedPersona,
  parametricSnapshot,
  personaSpec,
  gaps,
  trends = [],
  auditMode: initialAuditMode = 'estimated',
  tier = 'free',
  onTriggerReRun,
  techInfra = null,
  schemaQuality = null,
  contentSemantic = null
}: SiteAuditDashboardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState("overview");
  const [running, setRunning] = useState(false);
  const [currentAuditMode, setCurrentAuditMode] = useState<'estimated' | 'measured' | 'partial'>(initialAuditMode);
  const [upgrading, setUpgrading] = useState(false);

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

  const [localEntities, setLocalEntities] = useState<SurfaceEntity[]>(entities);
  const [localCards, setLocalCards] = useState<ReversedAnswerCard[]>(cards);
  const [localSnapshot, setLocalSnapshot] = useState<EntityReflectionSnapshot | null>(snapshot);
  const [localObservedPersona, setLocalObservedPersona] = useState<ObservedParametricPersona | null>(observedPersona);
  const [localParametricSnapshot, setLocalParametricSnapshot] = useState<ParametricPersonaSnapshot | null>(parametricSnapshot || null);
  const [localGaps, setLocalGaps] = useState<SurfaceGapAnalysis[]>(gaps);
  const [localTrends, setLocalTrends] = useState<TemporalTrend[]>(trends);
  const [localTechInfra, setLocalTechInfra] = useState<TechInfraAuditResult | null>(techInfra);
  const [localSchemaQuality, setLocalSchemaQuality] = useState<SchemaQualityAuditResult | null>(schemaQuality);
  const [localContentSemantic, setLocalContentSemantic] = useState<ContentSemanticResult | null>(contentSemantic);

  const handleReRun = async () => {
    if (!onTriggerReRun) return;
    try {
      setRunning(true);
      const res = await onTriggerReRun();
      if (res) {
        if (res.entities) setLocalEntities(res.entities);
        if (res.cards) setLocalCards(res.cards);
        if (res.snapshot) setLocalSnapshot(res.snapshot);
        if (res.observedPersona !== undefined) setLocalObservedPersona(res.observedPersona);
        if (res.parametricSnapshot !== undefined) setLocalParametricSnapshot(res.parametricSnapshot);
        if (res.gaps) setLocalGaps(res.gaps);
        if (res.trends) setLocalTrends(res.trends);
        if (res.auditMode) setCurrentAuditMode(res.auditMode);
        if (res.techInfra) setLocalTechInfra(res.techInfra);
        if (res.schemaQuality) setLocalSchemaQuality(res.schemaQuality);
        if (res.contentSemantic) setLocalContentSemantic(res.contentSemantic);
      }
    } catch (err) {
      console.error("Re-run audit error:", err);
    } finally {
      setRunning(false);
    }
  };

  const handleUpgradeToFullAudit = async (tier: 'tier1' | 'tier2' | 'tier3' = 'tier2') => {
    setUpgrading(true);
    try {
      const res = await fetch('/api/audit/full-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteUrl,
          brandName,
          tier,
          competitors: [],
        }),
      });
      if (!res.ok) throw new Error('Failed to start full audit');
      const { sessionId } = await res.json();
      const localeMatch = pathname?.match(/^\/([a-z]{2})\//);
      const locale = localeMatch?.[1] || 'ko';
      router.push(`/${locale}/site-audit/progress/${sessionId}?tier=${tier}`);
    } catch (err) {
      console.error('Upgrade to full audit failed:', err);
    } finally {
      setUpgrading(false);
    }
  };

  const isFree = tier === 'free';
  const isProPlus = tier === 'tier2' || tier === 'tier3';
  const isEnterprise = tier === 'tier3';

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
            {tier !== 'free' && (
              <button
                onClick={() => window.print()}
                className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-all cursor-pointer print-hidden"
              >
                <Printer className="h-3.5 w-3.5" />
                PDF 다운로드
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

        {/* Full Audit Upgrade Banner */}
        {currentAuditMode === 'estimated' && (
          <div className="mb-6 bg-gradient-to-r from-violet-900/40 to-indigo-900/40 border border-violet-500/30 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  ⚡ 추정치 (HTML-only)
                </span>
              </div>
              <p className="text-sm font-bold text-slate-100">현재 결과는 HTML 파싱 기반 추정치입니다</p>
              <p className="text-xs text-slate-400 mt-0.5">
                ChatGPT·Gemini에 실제 질문을 던져 브랜드 반영률을 실측하고, LLM 기반 지식 그래프 구축 및 브랜드 페르소나를 역설계하려면 정밀 진단을 실행하세요.
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => handleUpgradeToFullAudit('tier1')}
                disabled={upgrading}
                className="px-4 py-2.5 text-xs font-bold rounded-xl bg-slate-700 hover:bg-slate-600 text-white border border-slate-600 transition-all disabled:opacity-50 cursor-pointer whitespace-nowrap"
              >
                🔬 Lite (~3분)
              </button>
              <button
                onClick={() => handleUpgradeToFullAudit('tier2')}
                disabled={upgrading}
                className="px-4 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white transition-all disabled:opacity-50 cursor-pointer whitespace-nowrap shadow-lg shadow-indigo-500/20"
              >
                {upgrading ? '⏳ 시작 중...' : '🚀 Pro 전체 진단 (~8분)'}
              </button>
            </div>
          </div>
        )}

        {/* Tabs navigation (8 Tabs) */}
        <div className="flex flex-wrap gap-1.5 mb-8 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800 w-full overflow-x-auto">
          {[
            { id: "overview", label: "진단 개요", icon: LayoutDashboard, lock: false },
            { id: "tech_infra", label: "기술 인프라", icon: Layers, lock: false },
            { id: "schema", label: "구조화 시맨틱", icon: FileJson, lock: isFree },
            { id: "content", label: "콘텐츠 시맨틱", icon: FileText, lock: isFree },
            { id: "prescriptions", label: "최적화 처방전", icon: ShieldAlert, lock: isFree },
            { id: "entities", label: "지식 자산", icon: FileCode2, lock: isFree },
            { id: "persona", label: "AI 페르소나", icon: UserCheck, lock: !isProPlus && !isFree },
            { id: "simulation", label: "8D 시뮬레이션", icon: ShieldAlert, lock: !isEnterprise && !isFree }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  active
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab.lock ? <Lock className="h-3 w-3 shrink-0 text-slate-500" /> : <Icon className="h-3.5 w-3.5 shrink-0" />}
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab contents */}
        <div className="space-y-8">
          {activeTab === "overview" && (
            <OverviewPanel
              snapshot={localSnapshot}
              techInfra={localTechInfra}
              schemaQuality={localSchemaQuality}
              contentSemantic={localContentSemantic}
              gaps={localGaps}
              trends={localTrends}
              auditMode={currentAuditMode}
            />
          )}

          {activeTab === "tech_infra" && (
            <TechInfraPanel techInfra={localTechInfra} />
          )}

          {activeTab === "schema" && (
            isFree ? (
              <LockedPanel 
                title="구조화 시맨틱 분석" 
                description="Schema.org 구조화 마크다운의 속성 레벨 완성도를 확인하고, 누락된 항목을 심층적으로 분석해보세요."
                requiredTierName="Lite"
                priceDelta="₩89,000"
                currentUrl={websiteUrl}
                currentBrand={brandName}
                targetTierId="tier1"
              >
                <div className="opacity-40 pointer-events-none">
                  <SchemaQualityPanel schemaQuality={localSchemaQuality} />
                </div>
              </LockedPanel>
            ) : (
              <SchemaQualityPanel schemaQuality={localSchemaQuality} />
            )
          )}

          {activeTab === "content" && (
            isFree ? (
              <LockedPanel 
                title="콘텐츠 시맨틱 분석" 
                description="E-E-A-T 4축 점수 및 웹사이트의 Answer-First 문체 분석, 콘텐츠 신선도 타임라인을 확인하세요."
                requiredTierName="Lite"
                priceDelta="₩89,000"
                currentUrl={websiteUrl}
                currentBrand={brandName}
                targetTierId="tier1"
              >
                <div className="opacity-40 pointer-events-none">
                  <ContentSemanticPanel contentSemantic={localContentSemantic} />
                </div>
              </LockedPanel>
            ) : (
              <ContentSemanticPanel contentSemantic={localContentSemantic} />
            )
          )}

          {activeTab === "prescriptions" && (
            isFree ? (
              <LockedPanel 
                title="최적화 처방전 분석" 
                description="발견된 최적화 기회에 대한 구체적인 원인과 콘텐츠 해결책(처방전)을 확인하세요."
                requiredTierName="Lite"
                priceDelta="₩89,000"
                currentUrl={websiteUrl}
                currentBrand={brandName}
                targetTierId="tier1"
              >
                <div className="opacity-40 pointer-events-none">
                  <PrescriptionList gaps={localGaps} />
                </div>
              </LockedPanel>
            ) : (
              <PrescriptionList gaps={localGaps} />
            )
          )}

          {activeTab === "entities" && (
            isFree ? (
              <LockedPanel 
                title="추출 지식 자산 전체 분석" 
                description="크롤링된 모든 웹사이트 데이터가 AI 지식 그래프로 어떻게 구성되었는지 상세히 확인합니다."
                requiredTierName="Lite"
                priceDelta="₩89,000"
                currentUrl={websiteUrl}
                currentBrand={brandName}
                targetTierId="tier1"
              >
                <div className="opacity-40 pointer-events-none space-y-8">
                  <SurfaceMapPanel entities={localEntities} />
                  <AnswerCardList cards={localCards} />
                </div>
              </LockedPanel>
            ) : (
              <div className="space-y-8">
                <SurfaceMapPanel entities={localEntities} />
                <AnswerCardList cards={localCards} />
              </div>
            )
          )}

          {activeTab === "persona" && (
            isFree ? (
              <LockedPanel 
                title="AI 브랜드 페르소나 역설계" 
                description="AI가 브랜드를 어떤 인격으로 인식하는지 B2B/B2C 이중 모델로 144회 반복 측정하여 정밀 해부합니다."
                requiredTierName="Pro"
                priceDelta="₩249,000"
                currentUrl={websiteUrl}
                currentBrand={brandName}
                targetTierId="tier1.5"
              >
                <div className="opacity-40 pointer-events-none min-h-[400px] bg-slate-800/50 rounded-xl" />
              </LockedPanel>
            ) : !isProPlus ? (
              <LockedPanel 
                title="AI 브랜드 페르소나 역설계" 
                description="AI가 브랜드를 어떤 인격으로 인식하는지 B2B/B2C 이중 모델로 144회 반복 측정하여 정밀 해부합니다."
                requiredTierName="Pro"
                priceDelta="₩249,000"
                currentUrl={websiteUrl}
                currentBrand={brandName}
                targetTierId="tier1.5"
              >
                <div className="opacity-40 pointer-events-none min-h-[400px] bg-slate-800/50 rounded-xl" />
              </LockedPanel>
            ) : (
              localParametricSnapshot ? (
                <ParametricPersonaPanel snapshot={localParametricSnapshot} />
              ) : (
                <PersonaDeltaPanel
                  observedPersona={localObservedPersona}
                  personaSpec={personaSpec}
                />
              )
            )
          )}

          {activeTab === "simulation" && (
            isFree ? (
              <LockedPanel 
                title="페르소나 8D 시뮬레이션 & Floor Risk" 
                description="적대적 공격 시나리오(Floor Risk)를 포함하여 AI가 브랜드 페르소나를 파괴하지 않고 방어하는지 8차원으로 시뮬레이션합니다."
                requiredTierName="Enterprise"
                priceDelta="₩590,000"
                currentUrl={websiteUrl}
                currentBrand={brandName}
                targetTierId="tier3"
              >
                <div className="opacity-40 pointer-events-none min-h-[400px] bg-slate-800/50 rounded-xl" />
              </LockedPanel>
            ) : !isEnterprise ? (
              <LockedPanel 
                title="페르소나 8D 시뮬레이션 & Floor Risk" 
                description="적대적 공격 시나리오(Floor Risk)를 포함하여 AI가 브랜드 페르소나를 파괴하지 않고 방어하는지 8차원으로 시뮬레이션합니다."
                requiredTierName="Enterprise"
                priceDelta="₩590,000"
                currentUrl={websiteUrl}
                currentBrand={brandName}
                targetTierId="tier3"
              >
                <div className="opacity-40 pointer-events-none min-h-[400px] bg-slate-800/50 rounded-xl" />
              </LockedPanel>
            ) : (
              localParametricSnapshot && <PersonaFidelityPanel snapshot={localParametricSnapshot} />
            )
          )}
        </div>
      
        {/* Email Capture (Only for Free tier) */}
        {tier === 'free' && (
          <div className="mt-12">
            <EmailCaptureForm />
          </div>
        )}
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
