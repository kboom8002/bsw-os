"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { BENCHMARK_DOMAINS } from "@/lib/benchmark/domain-config";
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
  AlertCircle,
  Database,
  Plus,
  Trash2,
  Play,
  RefreshCw,
  Globe,
  Rss,
  Code
} from "lucide-react";
import { 
  getCollectionSourcesAction,
  saveCollectionSourceAction,
  deleteCollectionSourceAction,
  toggleCollectionSourceAction,
  triggerCollectionAction,
  triggerAllCollectionsAction,
  getExternalSignalsAction
} from "@/app/actions/collection";


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
  const searchParams = useSearchParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";
  const locale = (params?.locale as string) || "ko";
  const domainFromUrl = searchParams.get('domain') || 'skincare';
  const { t } = useTranslation();

  const [wsId, setWsId] = useState<string>("");
  const [signals, setSignals] = useState<SignalItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Collection Source & Extracted Data states
  const [activeTab, setActiveTab] = useState<"analysis" | "sources">("analysis");
  const [sources, setSources] = useState<any[]>([]);
  const [externalSignals, setExternalSignals] = useState<any[]>([]);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [syncingSourceId, setSyncingSourceId] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);

  // Add Source Form states
  const [newSourceName, setNewSourceName] = useState("");
  const [newSourceUrl, setNewSourceUrl] = useState("");
  const [newSourceType, setNewSourceType] = useState<"rss" | "community_board" | "api" | "crawl">("rss");
  const [newSourceIdentifier, setNewSourceIdentifier] = useState("");

  // Filters & Sorting
  const [filterGate, setFilterGate] = useState<string>("all");
  const [filterYmyl, setFilterYmyl] = useState<string>("all");
  const [filterLayer, setFilterLayer] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"cps" | "volume" | "query">("cps");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [keywordSeed, setKeywordSeed] = useState(domainFromUrl);
  const domainConfig = BENCHMARK_DOMAINS[keywordSeed as keyof typeof BENCHMARK_DOMAINS];
  const [brandName, setBrandName] = useState(domainConfig?.brands?.[0]?.name || "");
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
      // 서버 액션으로 워크스페이스 해석 (Admin Client — RLS 우회)
      const { resolveWorkspaceSlug } = await import("@/app/actions/workspace");
      const resolvedId = await resolveWorkspaceSlug(workspaceSlug);

      if (resolvedId) {
        setWsId(resolvedId);
        await Promise.all([
          loadSignals(resolvedId),
          loadCollectionData(resolvedId)
        ]);
      } else {
        setDbError("워크스페이스 ID를 찾을 수 없습니다. 시드 데이터가 올바르게 실행되었는지 확인해 주세요.");
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
      // 서버 액션으로 시그널 데이터 로드 (Admin Client — RLS 우회)
      const { getQuestionSignals } = await import("@/app/actions/semantic");
      const data = await getQuestionSignals(currentWsId);

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

  const loadCollectionData = async (currentWsId: string) => {
    setSourcesLoading(true);
    try {
      const [srcData, sigData] = await Promise.all([
        getCollectionSourcesAction(currentWsId),
        getExternalSignalsAction(currentWsId)
      ]);
      setSources(srcData);
      setExternalSignals(sigData);
    } catch (err) {
      console.error("Failed to load collection data:", err);
    } finally {
      setSourcesLoading(false);
    }
  };

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wsId || !newSourceName.trim()) return;
    try {
      await saveCollectionSourceAction(wsId, {
        name: newSourceName,
        url: newSourceUrl.trim() || null,
        source_type: newSourceType,
        identifier: newSourceIdentifier.toUpperCase().trim() || 'CUSTOM',
        enabled: true,
        industry: keywordSeed === "웨딩" ? "wedding" : "beauty"
      });
      // Reset inputs
      setNewSourceName("");
      setNewSourceUrl("");
      setNewSourceIdentifier("");
      await loadCollectionData(wsId);
      alert("수집 소스가 추가되었습니다.");
    } catch (err: any) {
      alert("추가 실패: " + err.message);
    }
  };

  const handleDeleteSource = async (id: string) => {
    if (!wsId || !confirm("이 수집 소스를 삭제하시겠습니까?")) return;
    try {
      await deleteCollectionSourceAction(wsId, id);
      await loadCollectionData(wsId);
    } catch (err: any) {
      alert("삭제 실패: " + err.message);
    }
  };

  const handleToggleSource = async (id: string, enabled: boolean) => {
    if (!wsId) return;
    try {
      await toggleCollectionSourceAction(wsId, id, enabled);
      setSources(prev => prev.map(s => s.id === id ? { ...s, enabled } : s));
    } catch (err: any) {
      alert("변경 실패: " + err.message);
    }
  };

  const handleSyncSource = async (id: string) => {
    if (!wsId) return;
    setSyncingSourceId(id);
    try {
      const res = await triggerCollectionAction(wsId, id, [keywordSeed]);
      alert(`수집 완료! 새로 수집된 시그널: ${res.fetchedCount}건`);
      await Promise.all([
        loadCollectionData(wsId),
        loadSignals(wsId)
      ]);
    } catch (err: any) {
      alert("수집 실패: " + err.message);
    } finally {
      setSyncingSourceId(null);
    }
  };

  const handleSyncAll = async () => {
    if (!wsId) return;
    setSyncingAll(true);
    try {
      const res = await triggerAllCollectionsAction(wsId, [keywordSeed]);
      alert(`전체 수집 완료! 총 ${res.totalFetched}건의 새로운 시그널이 적재되었습니다.`);
      await Promise.all([
        loadCollectionData(wsId),
        loadSignals(wsId)
      ]);
    } catch (err: any) {
      alert("전체 수집 실패: " + err.message);
    } finally {
      setSyncingAll(false);
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

      {/* Tab Switcher */}
      <div className="flex gap-4 border-b border-white/5 pb-1">
        <button
          onClick={() => setActiveTab("analysis")}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === "analysis"
              ? "border-cyan-500 text-cyan-400 font-extrabold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          시그널 분석 & 승격
        </button>
        <button
          onClick={() => setActiveTab("sources")}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === "sources"
              ? "border-cyan-500 text-cyan-400 font-extrabold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          원천 수집원 관리 (Admin)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {activeTab === "analysis" ? (
            <>
              {/* AI Miner form */}
          <form onSubmit={handleRunAgent} className="p-6 rounded-2xl border border-white/5 bg-slate-950/40 space-y-4">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              AI 유기적 시그널 발굴 에이전트
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400">도메인 / 업종</label>
                <select
                  value={keywordSeed}
                  onChange={(e) => {
                    setKeywordSeed(e.target.value);
                    const cfg = BENCHMARK_DOMAINS[e.target.value as keyof typeof BENCHMARK_DOMAINS];
                    setBrandName(cfg?.brands?.[0]?.name || "");
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-slate-900 text-slate-100 focus:outline-none focus:border-cyan-500 text-sm font-mono"
                >
                  {Object.entries(BENCHMARK_DOMAINS).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.name} ({key})</option>
                  ))}
                </select>
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
          </>
          ) : (
            <div className="space-y-6">
              {/* Sync All & Add Source Form */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Add Source Form (Left 2 cols) */}
                <form onSubmit={handleAddSource} className="md:col-span-2 p-6 rounded-2xl border border-white/5 bg-slate-950/40 space-y-4">
                  <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-cyan-400" />
                    새로운 수집 소스 추가
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-400">수집원 이름</label>
                      <input
                        type="text"
                        value={newSourceName}
                        onChange={(e) => setNewSourceName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs"
                        placeholder="e.g. 올리브영 화장품 리뷰"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-400">식별 코드 (Identifier)</label>
                      <input
                        type="text"
                        value={newSourceIdentifier}
                        onChange={(e) => setNewSourceIdentifier(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs font-mono"
                        placeholder="e.g. OLIVEYOUNG_REVIEW"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-400">수집 방식</label>
                      <select
                        value={newSourceType}
                        onChange={(e) => setNewSourceType(e.target.value as any)}
                        className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-slate-900 text-slate-100 focus:outline-none focus:border-cyan-500 text-xs"
                      >
                        <option value="rss">RSS 피드 수집 (RSS)</option>
                        <option value="crawl">웹 cheerio 크롤러 (Crawl)</option>
                        <option value="api">외부 API 연동 (API)</option>
                      </select>
                    </div>
                    <div className="col-span-2 space-y-2">
                      <label className="block text-xs font-semibold text-slate-400">대상 URL (웹주소/RSS주소)</label>
                      <input
                        type="url"
                        value={newSourceUrl}
                        onChange={(e) => setNewSourceUrl(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs"
                        placeholder="https://example.com/rss.xml"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all text-xs flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    수집 소스 추가 등록
                  </button>
                </form>

                {/* Control card (Right 1 col) */}
                <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/40 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2 mb-2">
                      <RefreshCw className="w-5 h-5 text-cyan-400" />
                      전체 수집 일괄 실행
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">
                      활성화된 모든 수집원에서 실시간으로 새로운 원천 시그널 데이터를 가져옵니다. 수집된 시그널은 즉시 AI 예측 파이프라인의 분석 원천 데이터로 사용됩니다.
                    </p>
                  </div>
                  <button
                    onClick={handleSyncAll}
                    disabled={syncingAll}
                    className="w-full px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {syncingAll ? <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> : <Play className="w-4 h-4" />}
                    {syncingAll ? "전체 수집 동기화 중..." : "전체 수집 동기화 실행 (자동)"}
                  </button>
                </div>
              </div>

              {/* Data Sources List */}
              <div className="border border-white/5 rounded-2xl overflow-hidden bg-slate-950/20">
                <div className="p-4 bg-slate-950/40 border-b border-white/5 flex justify-between items-center">
                  <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                    <Database className="w-4 h-4 text-cyan-500" />
                    등록된 데이터 수집원 목록 ({sources.length}개)
                  </h3>
                </div>
                {sourcesLoading ? (
                  <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                    <span>수집 소스 목록을 불러오는 중...</span>
                  </div>
                ) : sources.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    등록된 수집 소스가 없습니다. 위의 폼에서 추가해 주세요.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 bg-slate-950/40 font-mono text-[10px] text-slate-400">
                        <th className="p-4 w-16 text-center">활성</th>
                        <th className="p-4">수집원 이름 / 식별자</th>
                        <th className="p-4">유형</th>
                        <th className="p-4">URL</th>
                        <th className="p-4 text-center">최근 수집 내역</th>
                        <th className="p-4 text-right">작업</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {sources.map((src) => (
                        <tr key={src.id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="p-4 text-center">
                            <input
                              type="checkbox"
                              checked={src.enabled}
                              onChange={(e) => handleToggleSource(src.id, e.target.checked)}
                              className="w-4 h-4 rounded border-white/20 bg-transparent accent-cyan-500 cursor-pointer"
                            />
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-slate-200">{src.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">{src.identifier}</div>
                          </td>
                          <td className="p-4">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono uppercase text-[9px]">
                              {src.source_type === 'rss' && <Rss className="w-2.5 h-2.5" />}
                              {src.source_type === 'crawl' && <Globe className="w-2.5 h-2.5" />}
                              {src.source_type === 'api' && <Code className="w-2.5 h-2.5" />}
                              {src.source_type}
                            </span>
                          </td>
                          <td className="p-4 max-w-[200px] truncate text-slate-400 font-mono text-[10px]">
                            {src.url || '—'}
                          </td>
                          <td className="p-4 text-center">
                            {src.last_fetched_at ? (
                              <div>
                                <div className="text-slate-300">{new Date(src.last_fetched_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                <div className="text-[10px] text-emerald-400 font-mono mt-0.5">+{src.last_fetch_count || 0}건</div>
                              </div>
                            ) : (
                              <span className="text-slate-600 text-[10px]">미실행</span>
                            )}
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <button
                              onClick={() => handleSyncSource(src.id)}
                              disabled={syncingSourceId === src.id || !src.enabled}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-all text-[11px] disabled:opacity-30 inline-flex items-center gap-1"
                            >
                              {syncingSourceId === src.id ? <Loader2 className="w-3 h-3 animate-spin text-slate-200" /> : <RefreshCw className="w-3 h-3" />}
                              수집
                            </button>
                            <button
                              onClick={() => handleDeleteSource(src.id)}
                              className="p-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all inline-flex items-center"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Raw Extracted Signals List */}
              <div className="border border-white/5 rounded-2xl overflow-hidden bg-slate-950/20">
                <div className="p-4 bg-slate-950/40 border-b border-white/5 flex justify-between items-center">
                  <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-cyan-500" />
                    최근 수집 완료된 원천 시그널 피드
                  </h3>
                </div>
                <div className="divide-y divide-white/5 max-h-[350px] overflow-y-auto">
                  {externalSignals.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      수집된 원천 시그널 피드가 없습니다. 소스를 수집해 보세요.
                    </div>
                  ) : (
                    externalSignals.map((sig) => (
                      <div key={sig.id} className="p-4 hover:bg-white/[0.01] transition-colors space-y-1.5">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="px-2 py-0.5 rounded bg-cyan-950/30 text-cyan-400 border border-cyan-900/30 uppercase font-mono">
                            {sig.source_type}
                          </span>
                          <span className="text-slate-500">
                            {new Date(sig.collected_at || sig.published_at || '').toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 font-bold leading-relaxed">
                          {sig.content}
                        </p>
                        {sig.url && (
                          <div className="text-[10px] text-slate-500 font-mono truncate">
                            <span className="text-slate-600">URL: </span>
                            <a href={sig.url} target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 underline">
                              {sig.url}
                            </a>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
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
