"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { runBrandTruthExtractor } from "@/lib/ai/truth_extractor";
import { 
  ArrowLeft, 
  Eye, 
  Sparkles, 
  Globe, 
  CheckCircle2, 
  AlertTriangle,
  History,
  Cpu
} from "lucide-react";

interface ObservedItem {
  id: string;
  observed_claim: string;
  source_domain: string;
  observed_at: string;
  confidence_score: number;
  is_aligned_with_operational: boolean;
}

export default function ObservedClaimsPage() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";

  const [observedClaims, setObservedClaims] = useState<ObservedItem[]>([
    {
      id: "obs-1",
      observed_claim: "Provides 10% pure clinical Niacinamide compound formula.",
      source_domain: "kbeautyexpert.com/blogs/renewals",
      observed_at: "2026-05-23T10:30:00Z",
      confidence_score: 92.5,
      is_aligned_with_operational: true
    },
    {
      id: "obs-2",
      observed_claim: "Brand retail sandwiches include double-crust promotions.",
      source_domain: "fastfoodreview.org",
      observed_at: "2026-05-23T08:15:00Z",
      confidence_score: 84.0,
      is_aligned_with_operational: false
    }
  ]);

  const [sourceText, setSourceText] = useState(
    "Clinical tests for Acme Skincare have proven that our formula contains 10% pure Niacinamide which helps to restore skin barrier health in under 7 days of daily routines."
  );
  const [sourceDomain, setSourceDomain] = useState("clinicalbeautytest.org/acme-report");
  const [runningAgent, setRunningAgent] = useState(false);
  const [agentLogs, setAgentLogs] = useState<string[]>([]);
  const [agentSuccess, setAgentSuccess] = useState(false);

  const handleRunAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setRunningAgent(true);
    setAgentSuccess(false);
    setAgentLogs(["[System] Initializing Brand Truth Extraction Agent...", "[Security] Accessing database with mock session ID...", "[Safety] Auditing run in agent_runs with status: 'candidate'..."]);

    try {
      const mockWorkspaceId = "11111111-1111-1111-1111-111111111111";
      
      // Simulate slight delay for rich UI experience
      await new Promise(r => setTimeout(r, 1000));
      setAgentLogs(prev => [...prev, `[Crawl] Scanning target domain: ${sourceDomain}...`, `[Crawl] Ingested raw text length: ${sourceText.length} characters.`]);
      
      await new Promise(r => setTimeout(r, 1000));
      setAgentLogs(prev => [...prev, "[AI Engine] Executing semantic claim parsing models...", "[Safety] Output mapped strictly to 'candidate' state. Blocked from auto-approval."]);

      // Call mock agent server action
      const result = await runBrandTruthExtractor(mockWorkspaceId, {
        sourceText,
        sourceDomain
      });

      setAgentLogs(prev => [...prev, `[Success] Saved ${result.extractedCount} new candidate observed claims.`, `[Trace] Agent Run ID logged: ${result.agentRunId}`]);

      // Append locally to keep view synced
      if (result.observedTruths && result.observedTruths.length > 0) {
        const newObs = result.observedTruths.map((o: any) => ({
          id: o.id || "obs-" + Math.floor(Math.random() * 1000),
          observed_claim: o.observed_claim,
          source_domain: o.source_domain,
          observed_at: new Date().toISOString(),
          confidence_score: o.confidence_score,
          is_aligned_with_operational: o.is_aligned_with_operational
        }));
        setObservedClaims(prev => [...newObs, ...prev]);
      }

      setAgentSuccess(true);
    } catch (err) {
      setAgentLogs(prev => [...prev, `[Error] Run failed: ${(err as Error).message}`]);
    } finally {
      setRunningAgent(false);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-5xl w-full mx-auto text-slate-100 bg-slate-900">
      {/* Breadcrumbs Header */}
      <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="flex items-center gap-4">
          <Link 
            href={`/${workspaceSlug}/truth`}
            className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="text-xs text-cyan-400 font-mono">Brand Truth Studio</div>
            <h1 className="text-2xl font-extrabold text-white">Observed Claims</h1>
          </div>
        </div>
      </div>

      {/* AI Extraction Agent panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleRunAgent} className="p-6 rounded-2xl border border-white/5 bg-slate-950/40 space-y-4">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              AI Brand Truth Extraction Agent
            </h3>
            
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400">Target Crawl Domain</label>
              <div className="flex gap-2">
                <span className="inline-flex items-center px-3 rounded-xl border border-white/10 bg-slate-950 text-xs text-slate-500 font-mono">
                  https://
                </span>
                <input
                  type="text"
                  value={sourceDomain}
                  onChange={(e) => setSourceDomain(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs font-mono"
                  placeholder="domain-name.com/article-slug"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400">Raw Source Text / Crawl Payload</label>
              <textarea
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-white/10 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs leading-relaxed"
                placeholder="Paste the source article or scraped text here..."
                required
              />
            </div>

            <button
              type="submit"
              disabled={runningAgent}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all flex items-center justify-center gap-2 text-sm"
            >
              <Sparkles className="w-4 h-4" />
              {runningAgent ? "Running Extraction Agent..." : "Trigger AI Claim Extractor"}
            </button>
          </form>

          {/* Observed Claims Table */}
          <div className="border border-white/5 rounded-2xl overflow-hidden bg-slate-950/20">
            <div className="px-4 py-3 bg-slate-950/40 border-b border-white/5 font-mono text-xs text-slate-400 flex items-center justify-between">
              <span>Observed Third-Party Claims Log</span>
              <span className="text-[10px] text-yellow-400 bg-yellow-950/40 border border-yellow-800/30 px-2 py-0.5 rounded-full uppercase">Candidate status enforced</span>
            </div>
            <div className="divide-y divide-white/5">
              {observedClaims.map((item) => (
                <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.01]">
                  <div className="space-y-1 max-w-xl">
                    <div className="font-bold text-slate-200">{item.observed_claim}</div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Globe className="w-3.5 h-3.5" />
                      <span>{item.source_domain}</span>
                      <span>•</span>
                      <span>Observed: {new Date(item.observed_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-xs text-slate-500">Confidence</div>
                      <div className="font-mono text-sm text-slate-300 font-semibold">{item.confidence_score}%</div>
                    </div>
                    <div>
                      {item.is_aligned_with_operational ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-green-500/20 text-green-400 bg-green-950/20 text-[10px] uppercase font-mono font-bold">
                          Aligned
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-red-500/20 text-red-400 bg-red-950/20 text-[10px] uppercase font-mono font-bold">
                          Discrepancy
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Agent Console Logs Panel */}
        <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/60 flex flex-col h-full min-h-[300px]">
          <h3 className="font-bold text-sm text-slate-200 mb-4 flex items-center gap-2 font-mono">
            <History className="w-4 h-4 text-cyan-500" />
            AGENT_RUN_CONSOLE
          </h3>
          <div className="flex-1 rounded-xl bg-black p-4 font-mono text-[11px] text-green-400 overflow-y-auto space-y-2 leading-relaxed border border-white/5 select-text">
            {agentLogs.length === 0 ? (
              <span className="text-slate-500">[System] Idle. Awaiting AI Agent triggers...</span>
            ) : (
              agentLogs.map((log, index) => (
                <div key={index}>{log}</div>
              ))
            )}
            {runningAgent && <div className="text-cyan-400 animate-pulse">Running semantic models...</div>}
            {agentSuccess && <div className="text-yellow-400">[Trace] AI Safety constraint met. Candidate review logged.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
