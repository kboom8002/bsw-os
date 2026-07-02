"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  ArrowLeft, 
  Target, 
  Layers, 
  Sparkles, 
  ShieldAlert, 
  FileText, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  Eye
} from "lucide-react";
import { 
  getPatternAttractors, 
  generateMediaSolitons, 
  getMediaSolitons
} from "@/app/actions/semantic";

export default function AttractorsPage() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";
  const locale = (params?.locale as string) || "ko";

  const [wsId, setWsId] = useState<string>("");
  const [domains, setDomains] = useState<any[]>([]);
  const [selectedDomainId, setSelectedDomainId] = useState<string>("");
  const [attractors, setAttractors] = useState<any[]>([]);
  const [selectedAttractor, setSelectedAttractor] = useState<any>(null);
  const [solitons, setSolitons] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [generatingSoliton, setGeneratingSoliton] = useState(false);
  const [activeTab, setActiveTab] = useState<"trigger" | "concept" | "vibe" | "policy" | "soliton">("trigger");
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    initPage();
  }, [workspaceSlug]);

  const initPage = async () => {
    setLoading(true);
    setDbError(null);
    try {
      const { getSupabaseClient } = await import("@/lib/supabase");
      const supabase = getSupabaseClient();

      const { data: ws } = await supabase
        .from("workspaces")
        .select("id")
        .eq("slug", workspaceSlug)
        .single();

      if (ws?.id) {
        setWsId(ws.id);
        
        // Load domains
        const { data: domainList } = await supabase
          .from("domains")
          .select("*")
          .eq("workspace_id", ws.id);
        
        if (domainList && domainList.length > 0) {
          setDomains(domainList);
          setSelectedDomainId(domainList[0].id);
          await loadAttractors(ws.id, domainList[0].id);
        } else {
          setLoading(false);
        }
      } else {
        setDbError("워크스페이스를 찾을 수 없습니다.");
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Failed to init page:", err);
      setDbError(err.message || "페이지 로딩 중 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  const loadAttractors = async (currentWsId: string, domainId: string) => {
    setLoading(true);
    try {
      const list = await getPatternAttractors(currentWsId, { domainId });
      setAttractors(list);
      if (list.length > 0) {
        setSelectedAttractor(list[0]);
        await loadSolitons(currentWsId, list[0].id);
      } else {
        setSelectedAttractor(null);
        setSolitons([]);
      }
    } catch (err: any) {
      console.error("Failed to load attractors:", err);
      setDbError(err.message || "Attractor 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDomainChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedDomainId(id);
    await loadAttractors(wsId, id);
  };

  const handleAttractorSelect = async (attractor: any) => {
    setSelectedAttractor(attractor);
    setLoading(true);
    await loadSolitons(wsId, attractor.id);
    setLoading(false);
  };

  const loadSolitons = async (currentWsId: string, attractorId: string) => {
    try {
      const list = await getMediaSolitons(currentWsId, attractorId);
      setSolitons(list);
    } catch (err) {
      console.error("Failed to load solitons:", err);
    }
  };

  const handleGenerateSolitons = async () => {
    if (!selectedAttractor) return;
    setGeneratingSoliton(true);
    try {
      const channels = ["homepage", "answer_card", "chatbot", "cardnews", "ad", "sales_script", "llm_txt"];
      await generateMediaSolitons(wsId, selectedAttractor.id, channels);
      await loadSolitons(wsId, selectedAttractor.id);
    } catch (err: any) {
      alert(`Media Soliton 생성 실패: ${err.message}`);
    } finally {
      setGeneratingSoliton(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto text-slate-100 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}/${workspaceSlug}/semantic-core`}
            className="p-2.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-white rounded-xl border border-white/5 transition-all"
            id="back_btn"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              Pattern Attractor 관리
            </h1>
            <p className="text-xs text-slate-400">도메인 표준 및 브랜드 특화 패턴 어트랙터 스펙 관리</p>
          </div>
        </div>

        {/* Domain Selector */}
        <div className="flex items-center gap-2 bg-slate-800/60 p-1.5 rounded-xl border border-white/5 backdrop-blur-md">
          <span className="text-xs text-slate-400 px-2 font-medium">활성 도메인</span>
          <select
            value={selectedDomainId}
            onChange={handleDomainChange}
            className="bg-slate-900 border-none text-xs text-cyan-400 font-bold rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-cyan-500/30 cursor-pointer"
            id="domain_select"
          >
            {domains.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.slug})
              </option>
            ))}
          </select>
        </div>
      </div>

      {dbError && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center gap-2 animate-pulse">
          <AlertTriangle className="w-4 h-4" /> {dbError}
        </div>
      )}

      {loading && attractors.length === 0 ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <RefreshCw className="w-7 h-7 animate-spin text-cyan-400" />
        </div>
      ) : attractors.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] bg-slate-900/40 rounded-2xl border border-white/5 p-8 text-center space-y-4">
          <Target className="w-12 h-12 text-slate-600" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-300">표시할 Pattern Attractor가 없습니다</h3>
            <p className="text-xs text-slate-500">도메인 팩 관리자에서 YAML 팩을 로드하여 시드 데이터를 동기화해 주세요.</p>
          </div>
          <Link
            href={`/${locale}/${workspaceSlug}/semantic-core/domain-packs`}
            className="px-4 py-2 text-xs font-bold bg-cyan-500/25 hover:bg-cyan-500/35 text-cyan-300 border border-cyan-500/30 rounded-xl transition-all"
            id="go_domain_packs"
          >
            도메인 팩 관리로 이동
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Attractor List (좌측) */}
          <div className="lg:col-span-1 space-y-3 max-h-[75vh] overflow-y-auto pr-1">
            <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wider px-1">어트랙터 목록 ({attractors.length})</h3>
            {attractors.map((att) => {
              const isSelected = selectedAttractor?.id === att.id;
              return (
                <button
                  key={att.id}
                  onClick={() => handleAttractorSelect(att)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex flex-col gap-2.5 cursor-pointer relative overflow-hidden ${
                    isSelected 
                      ? "bg-slate-800/80 border-cyan-500/40 shadow-lg shadow-cyan-500/5" 
                      : "bg-slate-900/50 hover:bg-slate-800/40 border-white/5"
                  }`}
                  id={`att_btn_${att.id.replace(/\./g, '_')}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-900/60 px-2 py-0.5 rounded-md border border-white/5">
                      {att.id.split('.').slice(-2).join(' / ')}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      att.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-yellow-500/10 text-yellow-400"
                    }`}>
                      {att.status === "active" ? "활성" : "임시"}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 line-clamp-1">{att.natural_definition}</h4>
                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{att.trigger_state?.user_question_patterns?.[0]}</p>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {att.type?.map((t: string) => (
                      <span key={t} className="text-[9px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded-md font-medium border border-indigo-500/15">
                        {t}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Attractor Detail & Solitons (우측/중앙) */}
          <div className="lg:col-span-2 space-y-4">
            {selectedAttractor && (
              <div className="bg-slate-900/60 rounded-2xl border border-white/5 backdrop-blur-md overflow-hidden flex flex-col">
                {/* Attractor Title Header */}
                <div className="p-5 border-b border-white/5 bg-slate-900/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-cyan-400" />
                      {selectedAttractor.natural_definition}
                    </h2>
                    <span className="text-[10px] text-slate-500 font-medium font-mono">{selectedAttractor.id}</span>
                  </div>
                  
                  <button
                    onClick={handleGenerateSolitons}
                    disabled={generatingSoliton}
                    className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-cyan-500/10"
                    id="gen_solitons_btn"
                  >
                    {generatingSoliton ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    Media Soliton 일괄 생성
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/5 bg-slate-950/40 p-1 gap-1">
                  {(["trigger", "concept", "vibe", "policy", "soliton"] as const).map((tab) => {
                    const isActive = activeTab === tab;
                    const labels = {
                      trigger: "1. Trigger State",
                      concept: "2. Concept State",
                      vibe: "3. Vibe Signature",
                      policy: "4. Action Policy",
                      soliton: "5. Media Solitons"
                    };
                    return (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 text-center py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                          isActive 
                            ? "bg-slate-800 text-white shadow-sm" 
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                        id={`tab_btn_${tab}`}
                      >
                        {labels[tab]}
                      </button>
                    );
                  })}
                </div>

                {/* Tab Contents */}
                <div className="p-5 min-h-[45vh] max-h-[50vh] overflow-y-auto">
                  {activeTab === "trigger" && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5 text-cyan-400" /> 사용자 질문 패턴 (Trigger Patterns)
                        </h4>
                        <div className="space-y-1.5">
                          {selectedAttractor.trigger_state?.user_question_patterns?.map((p: string, idx: number) => (
                            <div key={idx} className="p-2.5 bg-slate-950/40 rounded-xl border border-white/5 text-xs text-slate-300 font-mono">
                              &ldquo;{p}&rdquo;
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3.5 bg-slate-950/40 rounded-xl border border-white/5">
                          <span className="text-[10px] text-slate-500 font-semibold block uppercase">Risk State Level</span>
                          <span className={`text-xs font-bold mt-1 inline-block ${
                            selectedAttractor.trigger_state?.risk_state?.level === "high" || selectedAttractor.trigger_state?.risk_state?.level === "critical"
                              ? "text-red-400" 
                              : selectedAttractor.trigger_state?.risk_state?.level === "medium" 
                                ? "text-yellow-400" 
                                : "text-emerald-400"
                          }`}>
                            {selectedAttractor.trigger_state?.risk_state?.level || "low"}
                          </span>
                        </div>

                        <div className="p-3.5 bg-slate-950/40 rounded-xl border border-white/5">
                          <span className="text-[10px] text-slate-500 font-semibold block uppercase">Intent State</span>
                          <span className="text-xs font-bold text-indigo-400 mt-1 block">
                            {selectedAttractor.trigger_state?.intent_state?.join(", ") || "None"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "concept" && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-cyan-400" /> 필수 활성화 개념 (Required Concepts)
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedAttractor.concept_state?.required_concepts?.map((c: string) => (
                            <span key={c} className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-3 py-1 rounded-xl font-mono">
                              {c}
                            </span>
                          ))}
                          {(!selectedAttractor.concept_state?.required_concepts || selectedAttractor.concept_state.required_concepts.length === 0) && (
                            <span className="text-xs text-slate-500">지정된 필수 개념이 없습니다.</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1 text-red-400">
                          <ShieldAlert className="w-3.5 h-3.5" /> 절대 금지 개념 (Forbidden Concepts)
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedAttractor.concept_state?.forbidden_concepts?.map((c: string) => (
                            <span key={c} className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-xl font-mono">
                              {c}
                            </span>
                          ))}
                          {(!selectedAttractor.concept_state?.forbidden_concepts || selectedAttractor.concept_state.forbidden_concepts.length === 0) && (
                            <span className="text-xs text-slate-500">지정된 금지 개념이 없습니다.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "vibe" && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Vibe Signature (L0-L3 Target Vector)
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* L0 Core Affect */}
                        <div className="p-4 bg-slate-950/40 rounded-xl border border-white/5 space-y-2">
                          <h5 className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">L0 Core Affect</h5>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between"><span className="text-slate-400">Valence:</span> <span className="font-bold text-slate-200">{selectedAttractor.vibe_signature?.L0_core_affect?.valence}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Arousal:</span> <span className="font-bold text-slate-200">{selectedAttractor.vibe_signature?.L0_core_affect?.arousal}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Control:</span> <span className="font-bold text-slate-200">{selectedAttractor.vibe_signature?.L0_core_affect?.control}</span></div>
                          </div>
                        </div>

                        {/* L1 Expressive Style */}
                        <div className="p-4 bg-slate-950/40 rounded-xl border border-white/5 space-y-2">
                          <h5 className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">L1 Expressive Style</h5>
                          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                            <div className="flex justify-between"><span className="text-slate-400">Warmth:</span> <span className="font-bold text-slate-200">{selectedAttractor.vibe_signature?.L1_expressive_style?.warmth_style}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Precision:</span> <span className="font-bold text-slate-200">{selectedAttractor.vibe_signature?.L1_expressive_style?.precision}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Energy:</span> <span className="font-bold text-slate-200">{selectedAttractor.vibe_signature?.L1_expressive_style?.energy}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Authentic:</span> <span className="font-bold text-slate-200">{selectedAttractor.vibe_signature?.L1_expressive_style?.authenticity}</span></div>
                          </div>
                        </div>

                        {/* L2 Motivational Affordance */}
                        <div className="p-4 bg-slate-950/40 rounded-xl border border-white/5 space-y-2">
                          <h5 className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">L2 Motivational</h5>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between"><span className="text-slate-400">Autonomy:</span> <span className="font-bold text-slate-200">{selectedAttractor.vibe_signature?.L2_motivational_affordance?.autonomy_support}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Competence:</span> <span className="font-bold text-slate-200">{selectedAttractor.vibe_signature?.L2_motivational_affordance?.competence_support}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Prevention:</span> <span className="font-bold text-slate-200">{selectedAttractor.vibe_signature?.L2_motivational_affordance?.prevention_frame}</span></div>
                          </div>
                        </div>

                        {/* L3 Social Appraisal */}
                        <div className="p-4 bg-slate-950/40 rounded-xl border border-white/5 space-y-2">
                          <h5 className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">L3 Social Appraisal</h5>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between"><span className="text-slate-400">Trust:</span> <span className="font-bold text-slate-200">{selectedAttractor.vibe_signature?.L3_social_appraisal?.trust}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Competence:</span> <span className="font-bold text-slate-200">{selectedAttractor.vibe_signature?.L3_social_appraisal?.competence}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Fairness:</span> <span className="font-bold text-slate-200">{selectedAttractor.vibe_signature?.L3_social_appraisal?.fairness}</span></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "policy" && (
                    <div className="space-y-4">
                      {/* Action Policy Allowed/Blocked */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-950/40 rounded-xl border border-white/5 space-y-2">
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Allowed Actions</span>
                          <ul className="text-xs space-y-1 text-slate-300 list-disc list-inside">
                            {selectedAttractor.action_policy?.allowed_actions?.map((a: string) => (
                              <li key={a}>{a}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="p-4 bg-slate-950/40 rounded-xl border border-white/5 space-y-2">
                          <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block">Blocked Actions</span>
                          <ul className="text-xs space-y-1 text-slate-300 list-disc list-inside">
                            {selectedAttractor.action_policy?.blocked_actions?.map((a: string) => (
                              <li key={a}>{a}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* CTA Policy */}
                      <div className="p-4 bg-slate-950/40 rounded-xl border border-white/5 space-y-2">
                        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">CTA Policy</span>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex gap-2"><span className="text-slate-400 w-16">Primary:</span> <span className="font-bold text-slate-200">{selectedAttractor.action_policy?.cta_policy?.primary}</span></div>
                          <div className="flex gap-2"><span className="text-slate-400 w-16">Secondary:</span> <span className="text-slate-300">{selectedAttractor.action_policy?.cta_policy?.secondary?.join(", ")}</span></div>
                          <div className="flex gap-2"><span className="text-slate-400 w-16 text-red-400">Blocked:</span> <span className="text-red-400/80 font-mono">{selectedAttractor.action_policy?.cta_policy?.blocked?.join(", ")}</span></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "soliton" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-cyan-400" /> 다채널 Media Soliton 자산 ({solitons.length})
                        </h4>
                      </div>

                      {solitons.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 bg-slate-950/30 rounded-xl border border-white/5 text-center text-slate-500">
                          <span>아직 생성된 솔리톤 자산이 없습니다. 우측 상단 일괄 생성을 실행해 주세요.</span>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {solitons.map((sol) => (
                            <div key={sol.id} className="p-4 bg-slate-950/40 rounded-xl border border-white/5 space-y-3">
                              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">{sol.channel_type}</span>
                                <div className="flex gap-2.5 text-[10px]">
                                  <span className="text-slate-400">보존율:</span>
                                  <span className="font-bold text-emerald-400">{(sol.preservation_scores?.overall * 100 || 90).toFixed(0)}%</span>
                                </div>
                              </div>
                              <div className="text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">
                                {sol.channel_content}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
