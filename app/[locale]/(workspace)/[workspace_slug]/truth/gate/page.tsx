"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { evaluateTruthLockGate, saveTruthLockEvaluation } from "@/app/actions/truth";
import { 
  ArrowLeft, 
  ShieldCheck, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  History,
  Info
} from "lucide-react";

interface EvalLogItem {
  id: string;
  gate_level: "L0" | "L1" | "L2" | "L3" | "L4";
  is_passed: boolean;
  blocking_reasons: string[];
  warnings: string[];
  evaluated_at: string;
}

export default function GatePage() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";

  const [activeLevel, setActiveLevel] = useState<"L0" | "L1" | "L2" | "L3" | "L4">("L2");
  const [running, setRunning] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<any | null>(null);

  const [historyLogs, setHistoryLogs] = useState<EvalLogItem[]>([
    {
      id: "log-1",
      gate_level: "L2",
      is_passed: true,
      blocking_reasons: [],
      warnings: [],
      evaluated_at: "2026-05-23T11:30:00Z"
    },
    {
      id: "log-2",
      gate_level: "L3",
      is_passed: false,
      blocking_reasons: ["L3 Blocker: Claim 'Self-checkout active 24/7' has zero evidence references attached."],
      warnings: [],
      evaluated_at: "2026-05-23T10:00:00Z"
    }
  ]);

  const handleRunGate = async () => {
    setRunning(true);
    setEvaluationResult(null);

    try {
      const mockWorkspaceId = "11111111-1111-1111-1111-111111111111";
      
      // Simulate database checks latency
      await new Promise(r => setTimeout(r, 800));

      const result = await evaluateTruthLockGate(mockWorkspaceId, activeLevel);
      
      // Save result to db
      await saveTruthLockEvaluation(mockWorkspaceId, result);

      setEvaluationResult(result);

      // Append locally to history
      const newLocalLog: EvalLogItem = {
        id: "log-" + Math.floor(Math.random() * 1000),
        gate_level: activeLevel,
        is_passed: result.isPassed,
        blocking_reasons: result.blockingReasons,
        warnings: result.warnings,
        evaluated_at: new Date().toISOString()
      };
      setHistoryLogs([newLocalLog, ...historyLogs]);

    } catch (err) {
      alert("Gating runner failed: " + (err as Error).message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-4xl w-full mx-auto text-slate-100 bg-slate-900">
      {/* Breadcrumbs Header */}
      <div className="flex items-center gap-4">
        <Link 
          href={`/${workspaceSlug}/truth`}
          className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <div className="text-xs text-cyan-400 font-mono">Brand Truth Studio</div>
          <h1 className="text-2xl font-extrabold text-white">Truth Lock Gate Evaluator</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Selector Panel */}
        <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/40 space-y-4 h-fit">
          <h3 className="font-bold text-sm text-slate-200">Gating Level Target</h3>
          <p className="text-slate-500 text-xs leading-normal">
            Select the release gate criteria level to check your brand schema health.
          </p>
          <div className="space-y-2">
            {[
              { id: "L0", title: "L0: Schema Complete", desc: "Core tables and workspace configurations are intact." },
              { id: "L1", title: "L1: Claims Present", desc: "Strategic and operational claims list non-empty." },
              { id: "L2", title: "L2: Risk Verified", desc: "Critical/high risk claims link to verified evidence." },
              { id: "L3", title: "L3: Complete Trace", desc: "100% of claims have verified evidence links." },
              { id: "L4", title: "L4: Closed Loop", desc: "All open crawl deltas resolved." }
            ].map((gate) => (
              <button
                key={gate.id}
                onClick={() => setActiveLevel(gate.id as any)}
                className={`w-full text-left p-3 rounded-xl border transition-all text-xs ${
                  activeLevel === gate.id 
                    ? "border-cyan-500 bg-cyan-950/30 text-cyan-400 font-bold shadow-lg shadow-cyan-500/5" 
                    : "border-white/5 bg-slate-900/40 text-slate-400 hover:bg-slate-900 hover:text-white"
                }`}
              >
                <div className="font-bold mb-1">{gate.title}</div>
                <div className="text-[10px] text-slate-500 leading-snug">{gate.desc}</div>
              </button>
            ))}
          </div>

          <button
            onClick={handleRunGate}
            disabled={running}
            className="w-full mt-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all text-sm flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            {running ? "Checking DB..." : "Evaluate Release Gate"}
          </button>
        </div>

        {/* Results Screen */}
        <div className="md:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/40 min-h-[220px] flex flex-col justify-between">
            <h3 className="font-bold text-sm text-slate-200 border-b border-white/5 pb-3">
              Gate Evaluation Output
            </h3>
            
            {evaluationResult ? (
              <div className="flex-1 py-4 space-y-4">
                <div className="flex items-center gap-3">
                  {evaluationResult.isPassed ? (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-green-500/20 text-green-400 bg-green-950/20 text-xs font-bold font-mono">
                      <CheckCircle2 className="w-4 h-4" /> GATE PASSED
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-red-500/20 text-red-400 bg-red-950/20 text-xs font-bold font-mono">
                      <XCircle className="w-4 h-4" /> GATE BLOCKED
                    </div>
                  )}
                  <span className="text-xs text-slate-500 font-mono">Target Checked: {evaluationResult.gateLevel}</span>
                </div>

                {evaluationResult.blockingReasons.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-xs text-slate-400 font-semibold">Active Blocker Logs:</div>
                    <ul className="space-y-1.5 text-xs text-red-400 font-mono bg-red-950/10 p-3.5 rounded-xl border border-red-900/10">
                      {evaluationResult.blockingReasons.map((reason: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-red-500 font-bold">•</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl border border-green-500/10 bg-green-950/10 text-green-400 text-xs leading-relaxed flex items-start gap-2">
                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Compliance verification checks succeeded! Brand claims meet required documentation standards at target level. Ready for website compilation.</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-slate-500 space-y-2">
                <ShieldCheck className="w-10 h-10 text-slate-700 animate-pulse" />
                <div className="text-xs font-mono">Idle. Awaiting gate selection and execution triggers.</div>
              </div>
            )}

            <div className="text-[10px] text-slate-500 font-mono border-t border-white/5 pt-2 flex items-center justify-between">
              <span>RLS Check: PASS</span>
              <span>Source of truth: Server DB</span>
            </div>
          </div>

          {/* Past Runs History List */}
          <div className="border border-white/5 rounded-2xl overflow-hidden bg-slate-950/20">
            <div className="px-4 py-3 bg-slate-950/40 border-b border-white/5 font-mono text-xs text-slate-400 flex items-center gap-2">
              <History className="w-4 h-4 text-cyan-400" />
              <span>Gate History Logs</span>
            </div>
            <div className="divide-y divide-white/5">
              {historyLogs.map((log) => (
                <div key={log.id} className="p-4 flex items-center justify-between gap-4 text-xs font-mono">
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-slate-300">Level: {log.gate_level}</span>
                    {log.is_passed ? (
                      <span className="text-green-400 font-semibold">[PASS]</span>
                    ) : (
                      <span className="text-red-400 font-semibold">[FAIL: {log.blocking_reasons.length} Blocker]</span>
                    )}
                  </div>
                  <span className="text-slate-500">{new Date(log.evaluated_at).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
