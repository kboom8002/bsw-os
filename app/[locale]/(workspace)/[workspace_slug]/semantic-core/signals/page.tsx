"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslation } from "@/lib/i18n/context";
import { runUpstreamPipeline, updateMultipleQuestionSignalStatus, promoteMultipleSignalsToQuestionCapital } from "@/app/actions/semantic";
import { 
  ArrowLeft, 
  Cpu, 
  Sparkles, 
  Search, 
  CheckCircle,
  History,
  Loader2,
  ArrowUpDown,
  AlertTriangle,
  AlertCircle
} from "lucide-react";

interface SignalItem {
  id: string;
  query: string;
  volume: number;
  intent: "informational" | "transactional" | "commercial" | "local";
  status: "mined" | "ignored" | "promoted";
  source?: string;
  qvs_total?: number | null;
  cps_score?: number | null;
  gate_status?: string | null;
  eval_confidence?: string | null;
  is_ymyl?: boolean;
  panel_layer?: string | null;
}

export default function SignalsPage() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";
  const locale = (params?.locale as string) || "ko";
  const { t } = useTranslation();

  const [wsId, setWsId] = useState<string>("");
  const [signals, setSignals] = useState<SignalItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting
  const [filterGate, setFilterGate] = useState<string>("all");
  const [filterYmyl, setFilterYmyl] = useState<string>("all");
  const [filterLayer, setFilterLayer] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"cps" | "volume" | "query">("cps");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [keywordSeed, setKeywordSeed] = useState("스킨케어");
  const [brandName, setBrandName] = useState("DR.O");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [runningAgent, setRunningAgent] = useState(false);
  const [agentLogs, setAgentLogs] = useState<string[]>([]);
  const [agentSuccess, setAgentSuccess] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  // Load workspace ID and signals
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
        await loadSignals(ws.id);
      }
    } catch (err: any) {
      console.error("Failed to initialize signals page:", err);
      setDbError(err.message || "시그널 페이지 초기화 실패");
    } finally {
      setLoading(false);
    }
  };

  const loadSignals = async (currentWsId: string) => {
    setDbError(null);
    try {
      const { getSupabaseClient } = await import("@/lib/supabase");
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from("question_signals")
        .select("*")
        .eq("workspace_id", currentWsId)
        .order("cps_score", { ascending: false });

      if (error) throw error;

      setSignals(
        (data || []).map((s: any) => ({
          id: s.id,
          query: s.query || s.query_text || "",
          volume: s.volume || s.estimated_volume || 0,
          intent: s.intent || "informational",
          status: s.status || "mined",
          source: s.source_phase || s.source_type || "manual",
          qvs_total: s.qvs_total,
          cps_score: s.cps_score,
          gate_status: s.gate_status,
          eval_confidence: s.eval_confidence,
          is_ymyl: s.is_ymyl,
          panel_layer: s.panel_layer,
        }))
      );
    } catch (err: any) {
      console.error("Failed to load signals:", err);
      setDbError(err.message || "시그널 데이터를 불러오는 중 오류가 발생했습니다.");
    }
  };

  const handleRunAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wsId || !keywordSeed.trim() || !brandName.trim()) return;

    setRunningAgent(true);
    setAgentSuccess(false);
    setAgentLogs([
      "[System] Booting Upstream LLM-Native Pipeline...",
      `[Phase 1] Meta-Question analysis for ${keywordSeed} and ${brandName}...`,
      "[Phase 2] Exploratory chain deepening...",
      "[Phase 3] Recursive tree expansion...",
      "[Phase 4] LLM Automatic Evaluation & Clustering..."
    ]);

    try {
      const result = await runUpstreamPipeline(wsId, keywordSeed, brandName);

      setAgentLogs(prev => [
        ...prev, 
        `[Success] Pipeline generated ${result.totalGenerated} candidates.`,
        `[Result] Saved ${result.savedSignals} high-quality signals after evaluation.`,
        `[Sources] Meta: ${result.sources.meta || 0}, Chain: ${result.sources.chain || 0}, Recursive: ${result.sources.recursive || 0}`
      ]);

      await loadSignals(wsId);
      setAgentSuccess(true);
    } catch (err) {
      setAgentLogs(prev => [...prev, `[Error] Run failed: ${(err as Error).message}`]);
    } finally {
      setRunningAgent(false);
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = (filteredSignals: SignalItem[]) => {
    if (selectedIds.size === filteredSignals.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredSignals.map(s => s.id)));
    }
  };

  const handleBatchPromote = async () => {
    if (selectedIds.size === 0 || !wsId) return;
    try {
      await promoteMultipleSignalsToQuestionCapital(wsId, Array.from(selectedIds), "Strategic Territory");
      setSignals(prev => prev.map(s => selectedIds.has(s.id) ? { ...s, status: "promoted" } : s));
      setSelectedIds(new Set());
      alert(`Successfully promoted ${selectedIds.size} signals to Question Capital!`);
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleBatchIgnore = async () => {
    if (selectedIds.size === 0 || !wsId) return;
    try {
      await updateMultipleQuestionSignalStatus(wsId, Array.from(selectedIds), "ignored");
      setSignals(prev => prev.map(s => selectedIds.has(s.id) ? { ...s, status: "ignored" } : s));
      setSelectedIds(new Set());
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const getIntentColor = (intent: string) => {
    switch (intent) {
      case "transactional": return "text-purple-400 bg-purple-950/40 border-purple-900/30";
      case "commercial": return "text-blue-400 bg-blue-950/40 border-blue-900/30";
      case "local": return "text-green-400 bg-green-950/40 border-green-900/30";
      default: return "text-cyan-400 bg-cyan-950/40 border-cyan-900/30";
    }
  };

  // Filter & sort logic
  const filtered = signals.filter(item => {
    const queryMatch = item.query.toLowerCase().includes(searchQuery.toLowerCase());
    const gateMatch = filterGate === "all" || item.gate_status === filterGate;
    const ymylMatch = filterYmyl === "all" || (filterYmyl === "ymyl" && item.is_ymyl) || (filterYmyl === "non-ymyl" && !item.is_ymyl);
    const layerMatch = filterLayer === "all" || item.panel_layer === filterLayer;
    return queryMatch && gateMatch && ymylMatch && layerMatch;
  });

  const sorted = [...filtered].sort((a, b) => {
    let fieldA: any = a.cps_score ?? 0;
    let fieldB: any = b.cps_score ?? 0;

    if (sortBy === "volume") {
      fieldA = a.volume;
      fieldB = b.volume;
    } else if (sortBy === "query") {
      fieldA = a.query;
      fieldB = b.query;
    }

    if (fieldA < fieldB) return sortOrder === "asc" ? -1 : 1;
    if (fieldA > fieldB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const changeSort = (field: "cps" | "volume" | "query") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-5xl w-full mx-auto text-slate-100 bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="flex items-center gap-4">
          <Link 
            href={`/${locale}/${workspaceSlug}/semantic-core`}
            className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="text-xs text-cyan-400 font-mono">{t('semantic_core.studio_title')}</div>
            <h1 className="text-2xl font-extrabold text-white">{t('semantic_core.signals_page_title')}</h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* AI Miner form */}
          <form onSubmit={handleRunAgent} className="p-6 rounded-2xl border border-white/5 bg-slate-950/40 space-y-4">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              AI 유기적 시그널 발굴 에이전트
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400">도메인 / 업종</label>
                <input
                  type="text"
                  value={keywordSeed}
                  onChange={(e) => setKeywordSeed(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm font-mono"
                  placeholder="e.g. 스킨케어, 웨딩"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400">타겟 브랜드명</label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm font-mono"
                  placeholder="e.g. DR.O"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={runningAgent || !wsId}
              className="w-full px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all text-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {runningAgent ? <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> : <Sparkles className="w-4 h-4" />}
              {runningAgent ? "파이프라인 가동 중..." : "시그널 수집 파이프라인 가동"}
            </button>
            {!wsId && !loading && (
              <div className="flex items-center gap-2 p-3 text-xs bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>워크스페이스 ID를 찾을 수 없습니다. 시드 데이터가 올바르게 실행되었는지 확인해 주세요.</span>
              </div>
            )}
          </form>

          {/* Filtering and Search Controls */}
          <div className="p-4 rounded-xl border border-white/5 bg-slate-950/20 space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="질문 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-white/10 text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              
              {/* Filters */}
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                {/* Gate filter */}
                <select
                  value={filterGate}
                  onChange={(e) => setFilterGate(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-slate-100 text-xs focus:outline-none"
                >
                  <option value="all">모든 게이트</option>
                  <option value="Go">Go 🟢</option>
                  <option value="Watch">Watch 🟡</option>
                  <option value="No-Go">No-Go 🔴</option>
                </select>

                {/* YMYL filter */}
                <select
                  value={filterYmyl}
                  onChange={(e) => setFilterYmyl(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-slate-100 text-xs focus:outline-none"
                >
                  <option value="all">모든 YMYL</option>
                  <option value="ymyl">YMYL 전용 ⚕️</option>
                  <option value="non-ymyl">일반 질문</option>
                </select>

                {/* Layer filter */}
                <select
                  value={filterLayer}
                  onChange={(e) => setFilterLayer(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-slate-100 text-xs focus:outline-none"
                >
                  <option value="all">모든 레이어</option>
                  <option value="L1_universal">L1 Universal</option>
                  <option value="L2_competitive">L2 Competitive</option>
                  <option value="L3_ingredient">L3 Ingredient</option>
                  <option value="L4_journey">L4 Journey</option>
                  <option value="L5_ymyl">L5 YMYL</option>
                  <option value="L6_trend">L6 Trend</option>
                  <option value="L7_brand">L7 Brand</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Action header */}
          <div className="flex justify-between items-center bg-slate-900 border border-white/10 rounded-xl p-4 shadow-xl mb-4">
            <span className="text-sm font-semibold text-slate-300">
              {selectedIds.size} / {sorted.length}개 시그널 선택됨
            </span>
            <div className="flex gap-3">
              <button 
                onClick={handleBatchIgnore}
                disabled={selectedIds.size === 0}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all text-sm disabled:opacity-50"
              >
                선택 무시
              </button>
              <button 
                onClick={handleBatchPromote}
                disabled={selectedIds.size === 0}
                className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all text-sm flex items-center gap-2 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" /> 정규 질문 승격
              </button>
            </div>
          </div>

          {/* Signals Table */}
          <div className="border border-white/5 rounded-2xl overflow-hidden bg-slate-950/20">
            {dbError ? (
              <div className="p-8 text-center text-red-400 bg-red-950/10 border border-red-500/20 rounded-xl space-y-2">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
                <p className="font-bold text-sm">데이터베이스 통신 오류</p>
                <p className="text-xs text-slate-400">{dbError}</p>
                <button onClick={initPage} className="mt-2 px-3 py-1.5 text-xs font-bold rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10">다시 시도</button>
              </div>
            ) : loading ? (
              <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                <span>시그널 데이터 불러오는 중...</span>
              </div>
            ) : sorted.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <span>조건에 부합하는 질문 시그널이 없습니다. 상단에서 파이프라인을 실행해 시그널을 발굴해 보세요.</span>
              </div>
            ) : (
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-slate-950/40 font-mono text-xs text-slate-400">
                    <th className="p-4 w-12">
                      <input 
                        type="checkbox" 
                        checked={sorted.length > 0 && selectedIds.size === sorted.length} 
                        onChange={() => toggleAll(sorted)} 
                        className="w-4 h-4 rounded border-white/20 bg-transparent accent-cyan-500" 
                      />
                    </th>
                    <th className="p-4 cursor-pointer hover:text-white" onClick={() => changeSort("query")}>
                      <div className="flex items-center gap-1">
                        {t('semantic_core.signals_query')}
                        <ArrowUpDown className="w-3 h-3 text-slate-500" />
                      </div>
                    </th>
                    <th className="p-4">{t('semantic_core.signals_intent')}</th>
                    <th className="p-4 text-center cursor-pointer hover:text-white" title="CPS 복합 스코어 (0~100)" onClick={() => changeSort("cps")}>
                      <div className="flex items-center justify-center gap-1">
                        CPS
                        <ArrowUpDown className="w-3 h-3 text-slate-500" />
                      </div>
                    </th>
                    <th className="p-4 text-center" title="Go / Watch / No-Go 게이트 판정">GATE</th>
                    <th className="p-4 text-right">{t('semantic_core.signals_status')}</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/5">
                  {sorted.map((item) => (
                    <tr key={item.id} className={`hover:bg-white/[0.01] transition-colors ${selectedIds.has(item.id) ? 'bg-cyan-500/5' : ''}`}>
                      <td className="p-4">
                        <input 
                          type="checkbox" 
                          checked={selectedIds.has(item.id)} 
                          onChange={() => toggleSelect(item.id)}
                          className="w-4 h-4 rounded border-white/20 bg-transparent accent-cyan-500" 
                        />
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-200 flex items-center gap-2">
                          <Search className="w-3.5 h-3.5 text-slate-500" />
                          {item.query}
                        </div>
                        <div className="flex gap-2 mt-1 items-center">
                          <span className="text-[10px] text-slate-500 font-mono">{item.source || 'manual'}</span>
                          {item.panel_layer && (
                            <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                              {item.panel_layer}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[10px] uppercase font-mono ${getIntentColor(item.intent)}`}>
                          {item.intent}
                        </span>
                        {item.is_ymyl && (
                          <span className="ml-1 inline-block px-1.5 py-0.5 rounded border border-red-500/30 text-red-400 text-[9px] font-mono bg-red-950/20" title="YMYL: 의료·법률·금융 관련 안전 핵심 콘텐츠">
                            YMYL ⚕️
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {item.cps_score != null ? (
                          <div className="flex flex-col items-center gap-1">
                            <span
                              className={`inline-block text-[11px] font-bold font-mono px-2 py-0.5 rounded ${
                                item.cps_score >= 70
                                  ? 'text-emerald-300 bg-emerald-950/30'
                                  : item.cps_score >= 40
                                    ? 'text-amber-300 bg-amber-950/30'
                                    : 'text-red-400 bg-red-950/30'
                              }`}
                              title={`CPS 스코어: ${item.cps_score.toFixed(1)} / 100.0 (QVS 총점: ${item.qvs_total?.toFixed(1) ?? '—'})`}
                            >
                              {item.cps_score.toFixed(1)}
                            </span>
                            <div className="w-12 h-1 bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${item.cps_score >= 70 ? 'bg-emerald-500' : item.cps_score >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                                style={{ width: `${Math.min(100, item.cps_score)}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-600 text-[10px] font-mono">—</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {item.gate_status ? (
                          <span
                            className={`inline-block text-[9px] font-bold font-mono px-2 py-0.5 rounded-full border ${
                              item.gate_status === 'Go'
                                ? 'border-emerald-500/30 text-emerald-400 bg-emerald-950/20'
                                : item.gate_status === 'No-Go'
                                  ? 'border-red-500/30 text-red-400 bg-red-950/20'
                                  : 'border-amber-500/30 text-amber-400 bg-amber-950/20'
                            }`}
                          >
                            {item.gate_status}
                          </span>
                        ) : (
                          <span className="text-slate-600 text-[10px] font-mono">—</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <span className={`inline-block text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border ${
                          item.status === "promoted" 
                            ? "border-green-500/20 text-green-400 bg-green-950/20" 
                            : item.status === "ignored"
                              ? "border-white/5 text-slate-500 bg-slate-950/40"
                              : "border-cyan-500/20 text-cyan-400 bg-cyan-950/20"
                        }`}>
                          {item.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* AI Agent Console Logs Panel */}
        <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/60 flex flex-col h-full min-h-[300px]">
          <h3 className="font-bold text-sm text-slate-200 mb-4 flex items-center gap-2 font-mono">
            <History className="w-4 h-4 text-cyan-500" />
            MINER_RUN_CONSOLE
          </h3>
          <div className="flex-1 rounded-xl bg-black p-4 font-mono text-[11px] text-green-400 overflow-y-auto space-y-2 leading-relaxed border border-white/5 select-text">
            {agentLogs.length === 0 ? (
              <span className="text-slate-500">[System] Idle. Awaiting AI Agent triggers...</span>
            ) : (
              agentLogs.map((log, index) => (
                <div key={index}>{log}</div>
              ))
            )}
            {runningAgent && <div className="text-cyan-400 animate-pulse">Scanning search channels...</div>}
            {agentSuccess && <div className="text-yellow-400">[Trace] AI Safety constraint met. Candidate signals logged.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
