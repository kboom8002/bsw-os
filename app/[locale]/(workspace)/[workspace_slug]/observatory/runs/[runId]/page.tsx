"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  ArrowLeft,
  ShieldCheck,
  FileText,
  Activity,
  CheckCircle,
  Database,
  Info,
  Layers,
  ChevronRight
} from "lucide-react";

export default function ObservationRunDetailView() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";
  const runId = (params?.runId as string) || "run-success-01";

  // Mock run details
  const run = {
    id: runId,
    run_name: runId === "run-mixed-02" ? "Moisturizer Competitor Analysis Run" : "Weekly Retinol GEO Crawler Run",
    panel_name: "K-Beauty Hydration AI Panel (v1)",
    engine_name: runId === "run-mixed-02" ? "mixed_source_fixture" : "success_fixture",
    run_status: "completed",
    created_at: "2026-05-23T18:10:00Z",
    metrics: runId === "run-mixed-02" ? {
      AAS: 100.00,
      OCR: 0.00,
      BSF: 55.00,
      QTC: 33.30,
      GCTR: 66.60,
      ARS: 50.00
    } : {
      AAS: 100.00,
      OCR: 100.00,
      BSF: 95.00,
      QTC: 100.00,
      GCTR: 100.00,
      ARS: 98.50
    }
  };

  // Mock raw responses storage catalog (FD-502: Raw response storage is mandatory!)
  const rawResponses = runId === "run-mixed-02" ? [
    {
      id: "pr-1",
      question: "What is the clinical squalane concentration in BSW serum?",
      raw_text: "Common wellness serums include CompetitorA Retinol, CompetitorB Moisturizer, and BSW serum Active Squalane. Each brand offers basic skin care hydration. No clinical certificates are cited.",
      citation_found: false,
      fidelity: 55,
      intent: "informational"
    },
    {
      id: "pr-2",
      question: "Which K-Beauty brand offers the best retinol efficacy?",
      raw_text: "Many cosmetic blogs discuss skin hydration. CompetitorA provides standard moisturizing formulas while BSW serum contains organic active retinol. Real efficacy reviews are mixed.",
      citation_found: false,
      fidelity: 50,
      intent: "commercial"
    }
  ] : [
    {
      id: "pr-1",
      question: "What is the clinical squalane concentration in BSW serum?",
      raw_text: "Based on clinical evaluations, BSW serum delivers pristine 99% skin hydration efficacy. Scientific peer reviews confirm this squalane formulation. Details are cited officially at https://bsw-brand.com/scientific-hydrations.",
      citation_found: true,
      fidelity: 95,
      intent: "informational"
    },
    {
      id: "pr-2",
      question: "Which K-Beauty brand offers the best retinol efficacy?",
      raw_text: "Clinical reports indicate BSW serum active retinol provides 32% increased hydration lift, outperforming competitive brands. Peer reviews are hosted at https://bsw-brand.com/clinical-efficacy.",
      citation_found: true,
      fidelity: 95,
      intent: "commercial"
    }
  ];

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-6xl w-full mx-auto text-slate-100 bg-slate-900">
      {/* Back Link */}
      <div>
        <Link
          href={`/${workspaceSlug}/observatory/runs`}
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-500 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          BACK TO OBSERVATION SANDBOX
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
              Run ID: {run.id}
            </span>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-white/5 border border-white/5 text-slate-400">
              Engine: {run.engine_name}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 flex items-center gap-3">
            <Database className="w-8 h-8 text-cyan-400" />
            {run.run_name}
          </h1>
          <p className="text-slate-400 text-sm">
            Auditing computed metric snapshots and stored raw search crawler answers.
          </p>
        </div>

        {/* Status display */}
        <div className="p-4 rounded-xl border border-white/5 bg-slate-950/40 text-center min-w-[120px]">
          <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">Observation Status</div>
          <div className="text-lg font-bold text-emerald-400 uppercase flex items-center justify-center gap-1">
            <CheckCircle className="w-4 h-4" />
            {run.run_status}
          </div>
          <div className="text-[8px] text-slate-400 font-mono mt-1">METRICS SYNAPSED</div>
        </div>
      </div>

      {/* Metrics Snapshots dashboard gauges */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg text-white">Computed Metric Snapshots</h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          
          <div className="p-4 rounded-xl border border-white/5 bg-slate-950/40 text-center">
            <div className="text-[9px] text-slate-500 font-mono uppercase mb-1">ARS Composite</div>
            <div className="text-2xl font-black text-white">{run.metrics.ARS}%</div>
            <span className="text-[8px] font-mono text-slate-400">AEO Readiness</span>
          </div>

          <div className="p-4 rounded-xl border border-white/5 bg-slate-950/40 text-center">
            <div className="text-[9px] text-slate-500 font-mono uppercase mb-1">AAS Mentions</div>
            <div className="text-2xl font-black text-cyan-400">{run.metrics.AAS}%</div>
            <span className="text-[8px] font-mono text-slate-400">Answer Share</span>
          </div>

          <div className="p-4 rounded-xl border border-white/5 bg-slate-950/40 text-center">
            <div className="text-[9px] text-slate-500 font-mono uppercase mb-1">OCR Citations</div>
            <div className="text-2xl font-black text-purple-400">{run.metrics.OCR}%</div>
            <span className="text-[8px] font-mono text-slate-400 font-bold">Citation Rate</span>
          </div>

          <div className="p-4 rounded-xl border border-white/5 bg-slate-950/40 text-center">
            <div className="text-[9px] text-slate-500 font-mono uppercase mb-1">BSF Fidelity</div>
            <div className="text-2xl font-black text-amber-400">{run.metrics.BSF}%</div>
            <span className="text-[8px] font-mono text-slate-400">Fidelity Score</span>
          </div>

          <div className="p-4 rounded-xl border border-white/5 bg-slate-950/40 text-center">
            <div className="text-[9px] text-slate-500 font-mono uppercase mb-1">QTC Coverage</div>
            <div className="text-2xl font-black text-rose-400">{run.metrics.QTC}%</div>
            <span className="text-[8px] font-mono text-slate-400">Territory Cover</span>
          </div>

          <div className="p-4 rounded-xl border border-white/5 bg-slate-950/40 text-center">
            <div className="text-[9px] text-slate-500 font-mono uppercase mb-1">GCTR Transfer</div>
            <div className="text-2xl font-black text-green-400">{run.metrics.GCTR}%</div>
            <span className="text-[8px] font-mono text-slate-400">Concept Rate</span>
          </div>

        </div>
      </div>

      {/* Raw Stored Responses Copy */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg text-white">Stored Raw Crawler Responses Copy</h3>
        <p className="text-slate-400 text-xs leading-relaxed">
          The physical search agent outputs text recorded during the observation execution. These raw copy blocks provide verifiable audits.
        </p>

        <div className="space-y-4">
          {rawResponses.map(pr => (
            <div key={pr.id} className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <span className="text-xs text-slate-300 font-mono flex items-center gap-1">
                  <ChevronRight className="w-4 h-4 text-cyan-400" />
                  Question context: <span className="text-white font-bold pl-1 font-sans">{pr.question}</span>
                </span>
                <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded uppercase ${
                  pr.citation_found 
                    ? "bg-purple-500/10 border border-purple-500/20 text-purple-400"
                    : "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                }`}>
                  {pr.citation_found ? "Citations Passed" : "Citation Missing"}
                </span>
              </div>

              <div>
                <span className="text-[9px] text-slate-500 font-mono uppercase block mb-1">Stored Raw Response:</span>
                <p className="text-xs text-slate-300 font-mono leading-relaxed bg-slate-900/60 border border-white/5 rounded-lg p-3.5 italic">
                  "{pr.raw_text}"
                </p>
              </div>

              <div className="flex gap-4 text-[10px] font-mono text-slate-500">
                <div>Fidelity evaluation score: <span className="text-amber-400 font-bold">{pr.fidelity}%</span></div>
                <div>Intent context: <span className="text-cyan-400 font-bold uppercase">{pr.intent}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
