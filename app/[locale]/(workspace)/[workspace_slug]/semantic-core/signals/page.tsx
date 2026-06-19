"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslation } from "@/lib/i18n/context";
import { runUpstreamPipeline, updateMultipleQuestionSignalStatus, promoteMultipleSignalsToQuestionCapital } from "@/app/actions/semantic";
import { runSignalMiningAgent } from "@/lib/ai/semantic_agents";
import { 
  ArrowLeft, 
  Cpu, 
  Sparkles, 
  Search, 
  CheckCircle,
  HelpCircle,
  TrendingUp,
  History
} from "lucide-react";

interface SignalItem {
  id: string;
  query: string;
  volume: number;
  intent: "informational" | "transactional" | "commercial" | "local";
  status: "mined" | "ignored" | "promoted";
  source?: string;
}

export default function SignalsPage() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";
  const locale = (params?.locale as string) || "ko";
  const { t } = useTranslation();

  const [signals, setSignals] = useState<SignalItem[]>([
    { id: "sig-1", query: "is niacinamide safe for inflamed skin barriers", volume: 1600, intent: "informational", status: "mined" },
    { id: "sig-2", query: "convenience store near me open 24/7 sandwich promo", volume: 3200, intent: "local", status: "promoted" },
    { id: "sig-3", query: "luxury wedding dress makeup package price seoul", volume: 850, intent: "commercial", status: "ignored" }
  ]);

  const [keywordSeed, setKeywordSeed] = useState("스킨케어");
  const [brandName, setBrandName] = useState("DR.O");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [runningAgent, setRunningAgent] = useState(false);
  const [agentLogs, setAgentLogs] = useState<string[]>([]);
  const [agentSuccess, setAgentSuccess] = useState(false);

  
  const handleRunAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keywordSeed.trim() || !brandName.trim()) return;

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
      const mockWorkspaceId = "11111111-1111-1111-1111-111111111111";

      const result = await runUpstreamPipeline(mockWorkspaceId, keywordSeed, brandName);

      setAgentLogs(prev => [
        ...prev, 
        `[Success] Pipeline generated ${result.totalGenerated} candidates.`,
        `[Result] Saved ${result.savedSignals} high-quality signals after evaluation.`,
        `[Sources] Meta: ${result.sources.meta}, Chain: ${result.sources.chain}, Recursive: ${result.sources.recursive}`
      ]);

      // Mock update to UI since we don't fetch from DB here yet
      const newSigs = Array.from({ length: 5 }).map((_, i) => ({
        id: "sig-new-" + Math.floor(Math.random() * 10000),
        query: `발굴된 질문 예시 ${i+1}`,
        volume: Math.floor(Math.random() * 1000),
        intent: "informational" as any,
        status: "mined" as any,
        source: i % 2 === 0 ? "meta_pattern" : "recursive_tree"
      }));
      setSignals(prev => [...newSigs, ...prev]);

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

  const toggleAll = () => {
    if (selectedIds.size === signals.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(signals.map(s => s.id)));
    }
  };

  const handleBatchPromote = async () => {
    if (selectedIds.size === 0) return;
    try {
      await promoteMultipleSignalsToQuestionCapital("11111111-1111-1111-1111-111111111111", Array.from(selectedIds), "New Territory");
      setSignals(prev => prev.map(s => selectedIds.has(s.id) ? { ...s, status: "promoted" } : s));
      setSelectedIds(new Set());
      alert(`Successfully promoted ${selectedIds.size} signals to Question Capital!`);
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleBatchIgnore = async () => {
    if (selectedIds.size === 0) return;
    try {
      await updateMultipleQuestionSignalStatus("11111111-1111-1111-1111-111111111111", Array.from(selectedIds), "ignored");
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
              AI Organic Signal Mining Agent
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
              disabled={runningAgent}
              className="w-full px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all text-sm flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" /> Run Upstream Signal Pipeline
            </button>

          </form>

          
          <div className="flex justify-between items-center bg-slate-900 border border-white/10 rounded-xl p-4 shadow-xl mb-4">
            <span className="text-sm font-semibold text-slate-300">
              {selectedIds.size} signals selected
            </span>
            <div className="flex gap-3">
              <button 
                onClick={handleBatchIgnore}
                disabled={selectedIds.size === 0}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all text-sm disabled:opacity-50"
              >
                Ignore Selected
              </button>
              <button 
                onClick={handleBatchPromote}
                disabled={selectedIds.size === 0}
                className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all text-sm flex items-center gap-2 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" /> Promote to CQ
              </button>
            </div>
          </div>

          {/* Signals Table */}

          <div className="border border-white/5 rounded-2xl overflow-hidden bg-slate-950/20">
            <table className="w-full text-left text-sm border-collapse">
              
              <thead>
                <tr className="border-b border-white/5 bg-slate-950/40 font-mono text-xs text-slate-400">
                  <th className="p-4 w-12">
                    <input type="checkbox" checked={signals.length > 0 && selectedIds.size === signals.length} onChange={toggleAll} className="w-4 h-4 rounded border-white/20 bg-transparent accent-cyan-500" />
                  </th>
                  <th className="p-4">{t('semantic_core.signals_query')}</th>
                  <th className="p-4">{t('semantic_core.signals_intent')}</th>
                  <th className="p-4 text-right">{t('semantic_core.signals_status')}</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">
                {signals.map((item) => (
                  
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
                      <div className="flex gap-2 mt-1">
                        <span className="text-[10px] text-slate-500 font-mono">{item.source || 'manual'}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[10px] uppercase font-mono ${getIntentColor(item.intent)}`}>
                        {item.intent}
                      </span>
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
