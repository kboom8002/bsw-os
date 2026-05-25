"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  ArrowLeft,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Download,
  Lock,
  Layers,
  FileText,
  Eye,
  CheckSquare,
  Sparkles,
  RefreshCw
} from "lucide-react";

export default function ExportGateWorkspace() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";
  const reportId = (params?.reportId as string) || "rep-1";

  // State
  const [format, setFormat] = useState<"markdown" | "html">("markdown");
  const [isPublished, setIsPublished] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");

  // Mock report content
  const reportName = reportId === "rep-2" 
    ? "Acme Competitive Skincare Report" 
    : "Weekly Retinol GEO Crawler Report";

  const scores = reportId === "rep-2" 
    ? { ARS: 50.00, AAS: 100.00, OCR: 0.00, BSF: 55.00 } 
    : { ARS: 98.50, AAS: 100.00, OCR: 100.00, BSF: 95.00 };

  // Gate evaluation status
  const [gateStatus, setGateStatus] = useState(reportId === "rep-2" ? {
    status: "fail",
    gates: {
      methodology: { passed: false, desc: "Methodology Disclosure linked" },
      caveat: { passed: false, desc: "Standard Proxy Caveat Disclaimer inside content" },
      unsafe: { passed: false, desc: "Zero unresolved unsafe wording findings" },
      competitive: { passed: false, desc: "Competitive strategist review signoff" }
    },
    blockers: [
      "No Methodology Appendix Linked.",
      "Proxy caveat disclaimer not verified in sections.",
      "Unresolved unsafe wording 'market share' finding.",
      "Requires APPROVED manual signoff for competitive brand report."
    ]
  } : {
    status: "pass",
    gates: {
      methodology: { passed: true, desc: "Methodology Disclosure linked" },
      caveat: { passed: true, desc: "Standard Proxy Caveat Disclaimer inside content" },
      unsafe: { passed: true, desc: "Zero unresolved unsafe wording findings" },
      competitive: { passed: true, desc: "Competitive strategist review signoff" }
    },
    blockers: []
  });

  const handleTriggerExport = () => {
    if (gateStatus.status === "fail") return;
    setIsPublished(true);
  };

  const handleSimulateFixes = () => {
    // Interactive action to bypass blockers and witness the export gate pass!
    setGateStatus({
      status: "pass",
      gates: {
        methodology: { passed: true, desc: "Methodology Disclosure linked (Simulated Fix)" },
        caveat: { passed: true, desc: "Standard Proxy Caveat Disclaimer inside content (Simulated Fix)" },
        unsafe: { passed: true, desc: "Zero unresolved unsafe wording findings (Simulated Fix)" },
        competitive: { passed: true, desc: "Competitive strategist review signoff (Simulated Fix)" }
      },
      blockers: []
    });
  };

  // Compile previews
  const markdownText = `# Benchmark Report: ${reportName}
*BSW-OS Governed Copy. Generated: ${new Date().toLocaleDateString()}*

## AI Crawler Observation Scores
| Metric | Score |
| --- | --- |
| AEO Readiness Score (ARS) | ${scores.ARS}% |
| AI Answer Share (AAS) | ${scores.AAS}% |
| Official Citation Rate (OCR) | ${scores.OCR}% |

## Executive Summary
Based on proxy crawls, the website shows high answer shares but lacks robust official links.

## Appendix: Methodology Disclosure
Applies 10,000 panel-based web crawler proxies across Google Search and OpenAI SearchGPT.

> **Standard Proxy Caveat Disclaimer**
> Observations are compiled from simulated cohort queries via panel-based proxies; results are statistical approximations.`;

  const htmlText = `<h1>Benchmark Report: ${reportName}</h1>
<p><em>BSW-OS Governed Copy. Generated: ${new Date().toLocaleDateString()}</em></p>

<h3>AI Crawler Observation Scores</h3>
<table border="1" cellpadding="5" style="border-collapse: collapse; border-color: rgba(255,255,255,0.1);">
  <tr><th>Metric</th><th>Score</th></tr>
  <tr><td>ARS</td><td>${scores.ARS}%</td></tr>
  <tr><td>AAS</td><td>${scores.AAS}%</td></tr>
  <tr><td>OCR</td><td>${scores.OCR}%</td></tr>
</table>

<h2>Executive Summary</h2>
<p>Based on proxy crawls, the website shows high answer shares but lacks robust official links.</p>

<h2>Appendix: Methodology Disclosure</h2>
<p>Applies 10,000 panel-based web crawler proxies across Google Search and OpenAI SearchGPT.</p>

<div style="padding: 12px; border-left: 3px solid #f59e0b; background: rgba(245, 158, 11, 0.1); color: #f59e0b; font-style: italic; font-family: monospace;">
  <strong>Standard Proxy Caveat Disclaimer</strong><br/>
  Observations are compiled from simulated cohort queries via panel-based proxies; results are statistical approximations.
</div>`;

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-6xl w-full mx-auto text-slate-100 bg-slate-900">
      {/* Back Link */}
      <div>
        <Link
          href={`/${workspaceSlug}/reports/${reportId}`}
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-500 hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          BACK TO PORTAL
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="text-xs text-indigo-400 font-mono font-bold tracking-wider uppercase mb-1">
            Export Compilation
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 flex items-center gap-3">
            <Layers className="w-8 h-8 text-indigo-400" />
            Compile & Export Suite
          </h1>
          <p className="text-slate-400 text-sm">
            Auditing strict publication release gates and compiling HTML/Markdown semantic outputs.
          </p>
        </div>

        {/* Bypasser for review */}
        {gateStatus.status === "fail" && (
          <button
            onClick={handleSimulateFixes}
            className="px-3.5 py-1.5 text-xs font-bold rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-mono transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Simulate Fix Actions
          </button>
        )}
      </div>

      {/* Grid: Left Column (Gate Status Console), Right Column (Canvas Previews) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Gate Auditer Console */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/30 space-y-6">
            <h3 className="font-bold text-sm text-slate-300 uppercase tracking-wider font-mono border-b border-white/5 pb-3">
              Gate Release Checklists
            </h3>

            {/* Checklists items */}
            <div className="space-y-4">
              {Object.keys(gateStatus.gates).map((key) => {
                const item = (gateStatus.gates as any)[key];
                return (
                  <div key={key} className="flex items-start justify-between gap-2 text-xs">
                    <span className="text-slate-400 font-sans leading-relaxed">{item.desc}</span>
                    <span className={`px-2 py-0.5 rounded font-mono text-[9px] uppercase font-bold flex-shrink-0 ${
                      item.passed 
                        ? "bg-emerald-500/10 text-emerald-400" 
                        : "bg-amber-500/10 text-amber-400"
                    }`}>
                      {item.passed ? "PASS" : "BLOCK"}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Final Decision */}
            <div className="border-t border-white/5 pt-6 space-y-4">
              <div>
                <span className="text-[10px] text-slate-500 font-mono uppercase block mb-1">Gate Status Verdict</span>
                <div className={`text-xl font-bold uppercase flex items-center gap-1.5 ${
                  gateStatus.status === "pass" ? "text-emerald-400" : "text-amber-400"
                }`}>
                  {gateStatus.status === "pass" ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                      FULLY AUTHORIZED
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5 text-amber-400" />
                      LOCKED
                    </>
                  )}
                </div>
              </div>

              {gateStatus.status === "fail" && (
                <div className="p-4 rounded-xl border border-red-500/20 bg-red-950/20 text-red-300 text-xs font-mono space-y-2">
                  <span className="font-bold text-white block">Blockers:</span>
                  <ul className="list-disc pl-4 space-y-1">
                    {gateStatus.blockers.map((b, idx) => (
                      <li key={idx}>{b}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Button */}
              {isPublished ? (
                <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-950/20 text-center font-mono text-xs text-indigo-300 flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4 text-indigo-400" />
                  REPORT PUBLISHED SUCCESSFULLY!
                </div>
              ) : (
                <button
                  disabled={gateStatus.status === "fail"}
                  onClick={handleTriggerExport}
                  className={`w-full py-3 rounded-xl font-bold text-xs font-mono flex items-center justify-center gap-2 transition-all ${
                    gateStatus.status === "pass"
                      ? "bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                      : "bg-slate-900 border border-white/5 text-slate-600 cursor-not-allowed"
                  }`}
                >
                  {gateStatus.status === "pass" ? (
                    <>
                      <Download className="w-4 h-4" />
                      COMPILE & EXPORT NOW
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      EXPORT SECURITIES LOCKED
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Previews canvas */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/30 space-y-6">
            
            {/* Header controls inside preview box */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-white">Export Vault Preview</span>
                <span className="text-[9px] font-mono text-slate-500 uppercase">
                  Format: {format}
                </span>
              </div>

              {/* Formats Toggler */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFormat("markdown")}
                  className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg border transition-all ${
                    format === "markdown" 
                      ? "border-indigo-500 bg-indigo-500/10 text-white" 
                      : "border-white/5 bg-slate-900 text-slate-400 hover:bg-slate-900/80"
                  }`}
                >
                  MARKDOWN
                </button>
                <button
                  onClick={() => setFormat("html")}
                  className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg border transition-all ${
                    format === "html" 
                      ? "border-indigo-500 bg-indigo-500/10 text-white" 
                      : "border-white/5 bg-slate-900 text-slate-400 hover:bg-slate-900/80"
                  }`}
                >
                  HTML
                </button>
              </div>
            </div>

            {/* Live Canvas View */}
            <div className="p-6 rounded-xl border border-white/5 bg-slate-900/60 font-sans text-xs max-h-[480px] overflow-y-auto space-y-4">
              {format === "markdown" ? (
                <div className="font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {markdownText}
                </div>
              ) : (
                <div className="text-slate-300 space-y-4 leading-relaxed font-sans">
                  <h1 className="text-xl font-extrabold text-white border-b border-white/5 pb-2">
                    Benchmark Report: {reportName}
                  </h1>
                  <p className="text-[10px] text-slate-500 italic">
                    BSW-OS Governed Copy. Generated: {new Date().toLocaleDateString()}
                  </p>

                  <h3 className="font-bold text-sm text-white pt-2">AI Crawler Observation Scores</h3>
                  <table className="w-full border-collapse border border-white/5 text-left">
                    <thead>
                      <tr className="bg-white/5 font-mono text-[9px] uppercase">
                        <th className="p-2 border border-white/5 text-slate-400">Metric</th>
                        <th className="p-2 border border-white/5 text-slate-400">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border border-white/5">
                        <td className="p-2 text-slate-400">AEO Readiness Score (ARS)</td>
                        <td className="p-2 font-mono font-bold text-white">{scores.ARS}%</td>
                      </tr>
                      <tr className="border border-white/5">
                        <td className="p-2 text-slate-400">AI Answer Share (AAS)</td>
                        <td className="p-2 font-mono font-bold text-cyan-400">{scores.AAS}%</td>
                      </tr>
                      <tr className="border border-white/5">
                        <td className="p-2 text-slate-400">Official Citation Rate (OCR)</td>
                        <td className="p-2 font-mono font-bold text-purple-400">{scores.OCR}%</td>
                      </tr>
                    </tbody>
                  </table>

                  <h3 className="font-bold text-sm text-white pt-2">Executive Summary</h3>
                  <p className="text-slate-400">
                    Based on proxy crawls, the website shows high answer shares but lacks robust official links.
                  </p>

                  <h3 className="font-bold text-sm text-white pt-2">Appendix: Methodology Disclosure</h3>
                  <p className="text-slate-400">
                    Applies 10,000 panel-based web crawler proxies across Google Search and OpenAI SearchGPT.
                  </p>

                  <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-950/20 text-amber-300 text-xs italic space-y-1">
                    <strong className="font-bold block text-white not-italic text-[10px] uppercase font-mono">
                      Standard Proxy Caveat Disclaimer
                    </strong>
                    Observations are compiled from simulated cohort queries via panel-based proxies; results are statistical approximations.
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
