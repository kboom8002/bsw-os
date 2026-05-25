"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  ArrowLeft,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  FileText,
  Save,
  MessageSquare,
  Activity,
  Cpu,
  Flame,
  ArrowUpRight,
  TrendingUp
} from "lucide-react";

export default function RetestRunDetail() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";
  const retestRunId = (params?.retestRunId as string) || "run-1";

  // State
  const [scores, setScores] = useState({
    baseline: { ARS: 50.00, AAS: 100.00, OCR: 0.00, BSF: 90.00, dark_patterns_count: 0 },
    retest: { ARS: 65.20, AAS: 100.00, OCR: 15.00, BSF: 92.00, dark_patterns_count: 0 }
  });

  const [notification, setNotification] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(
    retestRunId === "run-1" 
      ? "AI Retest Summary: Post-patch observation run compiled. ARS is verified at 65.2%. BSF index remains robust at 92%. Zero critical regressions detected in our compliance guardrails." 
      : null
  );

  const handleSimulateRegression = () => {
    // Simulates a critical guardrail regression to demonstrate mathematical override constraints!
    setScores(prev => ({
      ...prev,
      retest: {
        ...prev.retest,
        BSF: 80.00, // drops BSF from 90% to 80% (delta = -10%, > 5% regression!)
        dark_patterns_count: 2 // introduced scarcity dark patterns post-patch!
      }
    }));
    setNotification("⚠️ Guardrail regression simulated! Critical BSF drop >5% and 2 new dark patterns detected.");
    setTimeout(() => setNotification(null), 4000);
  };

  const handleTriggerSummaryAgent = () => {
    setNotification("🤖 AI Retest Summary Agent is analyzing the post-patch crawler metrics...");
    setTimeout(() => {
      setAiSummary(
        `AI Retest Summary: Post-patch observation run completed. ARS achieved a lift of ` +
        `+${(scores.retest.ARS - scores.baseline.ARS).toFixed(2)}% (from ${scores.baseline.ARS}% to ${scores.retest.ARS}%). ` +
        `BSF is verified at ${scores.retest.BSF}%. Guardrail validation checks: ` +
        `${scores.retest.BSF - scores.baseline.BSF < -5 ? "CRITICAL BSF REGRESSION DETECTED." : "NO CRITICAL REGRESSIONS DETECTED."}`
      );
      setNotification("✨ AI Summary complete! Draft compiled below.");
    }, 1200);
  };

  const arsDelta = scores.retest.ARS - scores.baseline.ARS;
  const bsfDelta = scores.retest.BSF - scores.baseline.BSF;
  const dpDelta = scores.retest.dark_patterns_count - scores.baseline.dark_patterns_count;

  // Determine regression
  const isRegressed = bsfDelta < -5 || dpDelta > 0;

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-6xl w-full mx-auto text-slate-100 bg-slate-900">
      {/* Back Link */}
      <div>
        <Link
          href={`/${workspaceSlug}/fixit/retests`}
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-500 hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          BACK TO RETESTS LIST
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
              RUN ID: {retestRunId}
            </span>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-white/5 text-slate-400">
              Crawl State: Completed
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 flex items-center gap-3">
            <Activity className="w-8 h-8 text-indigo-400" />
            Retest Run Auditor
          </h1>
          <p className="text-slate-400 text-sm">
            Compare crawler baseline scores against post-patch retests, evaluating statistical lifts and guardrails.
          </p>
        </div>

        {/* Simulator controls */}
        <div>
          <button
            onClick={handleSimulateRegression}
            className="px-3.5 py-1.5 text-xs font-bold rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-300 font-mono transition-all flex items-center gap-1.5"
          >
            <Flame className="w-3.5 h-3.5 text-red-400" />
            Simulate Regression
          </button>
        </div>
      </div>

      {/* Notifications Banner */}
      {notification && (
        <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-950/20 text-indigo-300 text-xs font-mono flex items-start gap-3 backdrop-blur-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{notification}</span>
        </div>
      )}

      {/* Comparison Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns: Comparison tables */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/30 space-y-6">
            <h3 className="font-bold text-lg text-white">Baseline vs Retest Scorecard</h3>

            <table className="w-full border-collapse text-xs text-left">
              <thead>
                <tr className="border-b border-white/5 font-mono text-[9px] uppercase text-slate-500">
                  <th className="pb-3 font-medium">Observed Metric</th>
                  <th className="pb-3 font-medium text-center">Baseline</th>
                  <th className="pb-3 font-medium text-center">Retest Post-Patch</th>
                  <th className="pb-3 font-medium text-right">Statistical Lift</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                <tr>
                  <td className="py-3 text-slate-300 font-sans font-semibold">AEO Readiness Score (ARS)</td>
                  <td className="py-3 text-center text-slate-400">{scores.baseline.ARS}%</td>
                  <td className="py-3 text-center text-white">{scores.retest.ARS}%</td>
                  <td className={`py-3 text-right font-bold ${arsDelta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {arsDelta >= 0 ? `+${arsDelta.toFixed(2)}%` : `${arsDelta.toFixed(2)}%`}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 text-slate-300 font-sans font-semibold">AI Answer Share (AAS)</td>
                  <td className="py-3 text-center text-slate-400">{scores.baseline.AAS}%</td>
                  <td className="py-3 text-center text-white">{scores.retest.AAS}%</td>
                  <td className={`py-3 text-right font-bold ${scores.retest.AAS - scores.baseline.AAS >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    +{scores.retest.AAS - scores.baseline.AAS}%
                  </td>
                </tr>
                <tr>
                  <td className="py-3 text-slate-300 font-sans font-semibold">Official Citation Rate (OCR)</td>
                  <td className="py-3 text-center text-slate-400">{scores.baseline.OCR}%</td>
                  <td className="py-3 text-center text-white">{scores.retest.OCR}%</td>
                  <td className={`py-3 text-right font-bold ${scores.retest.OCR - scores.baseline.OCR >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    +{scores.retest.OCR - scores.baseline.OCR}%
                  </td>
                </tr>
                <tr>
                  <td className="py-3 text-slate-300 font-sans font-semibold">Brand Semantic Fidelity (BSF)</td>
                  <td className="py-3 text-center text-slate-400">{scores.baseline.BSF}%</td>
                  <td className="py-3 text-center text-white">{scores.retest.BSF}%</td>
                  <td className={`py-3 text-right font-bold ${bsfDelta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {bsfDelta >= 0 ? `+${bsfDelta.toFixed(2)}%` : `${bsfDelta.toFixed(2)}%`}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* AI Retest summary log */}
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/30 space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h3 className="font-bold text-base text-white">AI Retest Summary Report</h3>
              <button
                onClick={handleTriggerSummaryAgent}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all flex items-center gap-1.5 font-mono"
              >
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                Synthesize Summary
              </button>
            </div>

            {aiSummary ? (
              <div className="p-4 rounded-xl border border-indigo-500/15 bg-indigo-950/5 text-slate-300 font-mono italic leading-relaxed text-xs">
                "{aiSummary}"
              </div>
            ) : (
              <p className="text-xs text-slate-500 font-mono italic">
                No summary generated yet. Click the agent trigger to compile metric lift conclusions.
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Guardrails and alarms */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/30 space-y-6">
            <h3 className="font-bold text-sm text-slate-300 uppercase tracking-wider font-mono border-b border-white/5 pb-3">
              Guardrail Regressions
            </h3>

            {isRegressed ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-red-500/20 bg-red-950/20 text-red-300 text-xs font-mono flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
                  <div>
                    <span className="font-bold text-white block mb-1">CRITICAL REGRESSION DETECTED</span>
                    <ul className="list-disc pl-4 space-y-1.5 leading-normal">
                      {bsfDelta < -5 && (
                        <li>BSF dropped by {Math.abs(bsfDelta).toFixed(2)}% (greater than 5% maximum threshold!)</li>
                      )}
                      {dpDelta > 0 && (
                        <li>Crawlers detected {dpDelta} new scarcity/urgency dark patterns post-patch!</li>
                      )}
                    </ul>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-white/5 text-[10px] text-slate-400 font-mono leading-relaxed">
                  * Note: In accordance with BSW-OS non-negotiable compliance rules, guardrail regressions override positive lift results. The patch is locked from passing.
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/20 text-emerald-300 text-xs font-mono flex items-start gap-3">
                <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
                <div>
                  <span className="font-bold text-white block mb-0.5">COMPLIANT VERDICT: PASS</span>
                  <p className="leading-normal">
                    The post-patch observation crawlers verified positive lifts with no critical drops in BSF and zero dark pattern regressions. Clear for production release.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
