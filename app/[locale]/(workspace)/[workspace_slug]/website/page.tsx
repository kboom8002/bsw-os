"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { runWebsiteGeneration } from "@/app/actions/objects";
import { 
  ArrowLeft, 
  Database, 
  Sparkles, 
  Cpu, 
  History, 
  CheckCircle, 
  AlertTriangle, 
  HelpCircle, 
  FileText, 
  Workflow, 
  ExternalLink, 
  ShieldCheck, 
  ArrowRight
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";

export default function WebsiteHubOverview() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";
  const { locale, t } = useTranslation();
  const mockWorkspaceId = "11111111-1111-1111-1111-111111111111";

  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const triggerGeneration = async () => {
    setRunning(true);
    setSuccess(false);
    setFeedback(null);
    setLogs([
      "[System] Booting Website Generation Engine...",
      "[Security] Validating active workspace memberships...",
      "[Audit] Registering generation candidate in website_generation_runs..."
    ]);

    try {
      await new Promise(r => setTimeout(r, 650));
      setLogs(prev => [...prev, "[Read] Querying active validated Surface Contracts...", "[Audit] Fetching allowed spec objects & active clinical lineages..."]);

      await new Promise(r => setTimeout(r, 650));
      setLogs(prev => [...prev, "[Compiler] Pre-rendering visible content sections...", "[Compiler] Formulating schema JSON-LD and AEO payloads..."]);

      const result = await runWebsiteGeneration(mockWorkspaceId);

      setLogs(prev => [
        ...prev,
        `[Success] Pre-rendered ${result.generated_pages_count} semantic pages!`,
        `[Audit] Run completed successfully. ID: ${result.id}`
      ]);

      setFeedback({ type: "success", message: `E2E Generation completed! pre-rendered ${result.generated_pages_count} pages.` });
      setSuccess(true);
    } catch (err) {
      setLogs(prev => [...prev, `[Error] Run aborted: ${(err as Error).message}`]);
      setFeedback({ type: "error", message: `Generation failed: ${(err as Error).message}` });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-5xl w-full mx-auto text-slate-100 bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="flex items-center gap-4">
          <Link 
            href={`/${locale}/${workspaceSlug}`}
            className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="text-xs text-cyan-400 font-mono">BSW-OS Studio</div>
            <h1 className="text-2xl font-extrabold text-white">{t('nav.website')}</h1>
          </div>
        </div>
        <button
          onClick={triggerGeneration}
          disabled={running}
          className="px-4 py-2.5 text-xs font-bold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 transition-all shadow-lg shadow-cyan-500/10 disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" /> Generate Website
        </button>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-sm ${
          feedback.type === "success" 
            ? "border-green-500/20 text-green-400 bg-green-950/20" 
            : "border-red-500/20 text-red-400 bg-red-950/20"
        }`}>
          {feedback.type === "success" ? <ShieldCheck className="w-5 h-5 text-green-400" /> : <AlertTriangle className="w-5 h-5 text-red-400" />}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Core links grid */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pages */}
            <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 hover:border-white/10 transition-all flex flex-col justify-between">
              <div>
                <FileText className="w-5 h-5 text-cyan-400 mb-4" />
                <h3 className="font-bold text-sm text-white mb-1.5">Composed Pages</h3>
                <p className="text-slate-500 text-xs leading-normal">
                  View, preview, and audit fully pre-rendered visible semantic website page projections.
                </p>
              </div>
              <Link
                href={`/${locale}/${workspaceSlug}/website/pages`}
                className="mt-6 flex items-center justify-between text-xs font-bold text-cyan-400 hover:underline"
              >
                <span>Browse Pages</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Exports */}
            <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 hover:border-white/10 transition-all flex flex-col justify-between">
              <div>
                <Workflow className="w-5 h-5 text-purple-400 mb-4" />
                <h3 className="font-bold text-sm text-white mb-1.5">SEO/AEO/GEO Export Vault</h3>
                <p className="text-slate-500 text-xs leading-normal">
                  Browse Google JSON-LD mapping and structured AI-readable markdown blocks.
                </p>
              </div>
              <Link
                href={`/${locale}/${workspaceSlug}/website/exports`}
                className="mt-6 flex items-center justify-between text-xs font-bold text-purple-400 hover:underline"
              >
                <span>Preview Export Payloads</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Link rules */}
            <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 hover:border-white/10 transition-all flex flex-col justify-between">
              <div>
                <Database className="w-5 h-5 text-green-400 mb-4" />
                <h3 className="font-bold text-sm text-white mb-1.5">Generation Logs</h3>
                <p className="text-slate-500 text-xs leading-normal">
                  Browse full audit details of historical background compilation generation runs.
                </p>
              </div>
              <Link
                href={`/${locale}/${workspaceSlug}/website/generation-runs`}
                className="mt-6 flex items-center justify-between text-xs font-bold text-green-400 hover:underline"
              >
                <span>Audit Runs</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Dynamic AI Generator run logs */}
        <div>
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/60 flex flex-col h-full min-h-[300px]">
            <h3 className="font-bold text-sm text-slate-200 mb-4 flex items-center gap-2 font-mono">
              <Cpu className="w-4 h-4 text-cyan-400" />
              COMPILER_RUN_CONSOLE
            </h3>
            <div className="flex-1 rounded-xl bg-black p-4 font-mono text-[10px] text-green-400 overflow-y-auto space-y-1.5 leading-relaxed border border-white/5 select-text">
              {logs.length === 0 ? (
                <span className="text-slate-500">[System] Idle. Awaiting website compiler trigger...</span>
              ) : (
                logs.map((log, index) => (
                  <div key={index}>{log}</div>
                ))
              )}
              {running && <div className="text-cyan-400 animate-pulse">Pre-rendering website...</div>}
              {success && <div className="text-yellow-400">[Trace] Generation verified. E2E traceability tags compiled.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
