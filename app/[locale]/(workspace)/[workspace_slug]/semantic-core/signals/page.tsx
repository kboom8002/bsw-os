"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { runSignalMiningAgent, runQisGenAgent } from "@/lib/ai/semantic_agents";
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
}

export default function SignalsPage() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";

  const [signals, setSignals] = useState<SignalItem[]>([
    { id: "sig-1", query: "is niacinamide safe for inflamed skin barriers", volume: 1600, intent: "informational", status: "mined" },
    { id: "sig-2", query: "convenience store near me open 24/7 sandwich promo", volume: 3200, intent: "local", status: "promoted" },
    { id: "sig-3", query: "luxury wedding dress makeup package price seoul", volume: 850, intent: "commercial", status: "ignored" }
  ]);

  const [keywordSeed, setKeywordSeed] = useState("niacinamide skin barrier repair");
  const [runningAgent, setRunningAgent] = useState(false);
  const [agentLogs, setAgentLogs] = useState<string[]>([]);
  const [agentSuccess, setAgentSuccess] = useState(false);

  const handleRunAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keywordSeed.trim()) return;

    setRunningAgent(true);
    setAgentSuccess(false);
    setAgentLogs([
      "[System] Booting Question Signal Mining Agent...",
      "[Security] Initializing workspace database session...",
      "[Safety] Auditing run in agent_runs with status: 'candidate'..."
    ]);

    try {
      const mockWorkspaceId = "11111111-1111-1111-1111-111111111111";

      await new Promise(r => setTimeout(r, 800));
      setAgentLogs(prev => [...prev, `[Mining] Searching public crawlers for seed keyword: "${keywordSeed}"...`, "[Mining] Extracting user organic search volumes..."]);

      await new Promise(r => setTimeout(r, 800));
      setAgentLogs(prev => [...prev, "[AI Parse] Performing semantic intent clustering...", "[Safety] Tagging all query node outputs as 'candidate' state."]);

      // Call action
      const result = await runSignalMiningAgent(mockWorkspaceId, keywordSeed);

      setAgentLogs(prev => [...prev, `[Success] Ingested ${result.savedSignals.length} new organic question signals!`, `[Trace] Run ID logged: ${result.agentRunId}`]);

      // Append locally for fluid interactive demo
      const newSigs = result.savedSignals.map((s: any) => ({
        id: s.id || "sig-" + Math.floor(Math.random() * 1000),
        query: s.query,
        volume: s.volume,
        intent: s.intent as any,
        status: s.status as any
      }));
      setSignals(prev => [...newSigs, ...prev]);

      setAgentSuccess(true);
    } catch (err) {
      setAgentLogs(prev => [...prev, `[Error] Run failed: ${(err as Error).message}`]);
    } finally {
      setRunningAgent(false);
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
            href={`/${workspaceSlug}/semantic-core`}
            className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="text-xs text-cyan-400 font-mono">Semantic Core Studio</div>
            <h1 className="text-2xl font-extrabold text-white">Question Signals Miner</h1>
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
            
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400">Target Keyword Seed Phrase</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={keywordSeed}
                  onChange={(e) => setKeywordSeed(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm font-mono"
                  placeholder="e.g. skin barrier repair clinic..."
                  required
                />
                <button
                  type="submit"
                  disabled={runningAgent}
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all text-sm flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" /> Mine Signals
                </button>
              </div>
            </div>
          </form>

          {/* Signals Table */}
          <div className="border border-white/5 rounded-2xl overflow-hidden bg-slate-950/20">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-slate-950/40 font-mono text-xs text-slate-400">
                  <th className="p-4">Mined Organic Query</th>
                  <th className="p-4">Search Volume</th>
                  <th className="p-4">Clustered Intent</th>
                  <th className="p-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {signals.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-200 flex items-center gap-2">
                        <Search className="w-3.5 h-3.5 text-slate-500" />
                        {item.query}
                      </div>
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                        {item.volume.toLocaleString()} / mo
                      </span>
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
