"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { validateSchemaMapping } from "@/app/actions/objects";
import { 
  ArrowLeft, 
  Workflow, 
  Lock, 
  ShieldCheck, 
  Fingerprint, 
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  ExternalLink,
  Code,
  Terminal,
  Cpu
} from "lucide-react";

export default function ExportsStudioPage() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";
  const mockWorkspaceId = "11111111-1111-1111-1111-111111111111";
  const mockPageId = "page-1";

  const [schemaJson, setSchemaJson] = useState({
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Active Niacinamide Skincare Specs & Formulations",
    "description": "Clinical grade active formula with 5% pure niacinamide to accelerate stratum corneum barrier recovery.",
    "claim": "Skin barrier repair cures eczema" // Simulated claim mismatch for validator demo
  });

  const [aeoMarkdown] = useState(
    `# AI-Readable Specification: Active Niacinamide Skincare Specs & Formulations\n\nVisible Facts: Clinical grade active formula with 5% pure niacinamide to accelerate stratum corneum barrier recovery.\n\n[Clinical Verification Signature: sha256-verified-niacinamide-gate-seal]`
  );

  const [logs, setLogs] = useState<string[]>([]);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  const triggerSchemaValidation = async () => {
    setChecking(true);
    setLogs([]);
    setIsValid(null);

    try {
      // Trigger the secure server mapping validator action
      const result = await validateSchemaMapping(mockWorkspaceId, mockPageId, "Product", schemaJson);

      setIsValid(result.isValid);
      setLogs(result.logs);
    } catch (err) {
      setLogs([`[Error] Validation aborted: ${(err as Error).message}`]);
      setIsValid(false);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-6xl w-full mx-auto text-slate-100 bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="flex items-center gap-4">
          <Link 
            href={`/${workspaceSlug}/website`}
            className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="text-xs text-cyan-400 font-mono">Website Studio</div>
            <h1 className="text-2xl font-extrabold text-white">SEO / AEO / GEO Exports Vault</h1>
          </div>
        </div>

        <button
          onClick={triggerSchemaValidation}
          disabled={checking}
          className="px-4 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 flex items-center gap-1.5 transition-all shadow-lg"
        >
          <Cpu className="w-4 h-4" />
          {checking ? "Checking..." : "Verify Schema Mapping"}
        </button>
      </div>

      {isValid !== null && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-sm ${
          isValid 
            ? "border-green-500/20 text-green-400 bg-green-950/20" 
            : "border-red-500/20 text-red-400 bg-red-950/20"
        }`}>
          {isValid ? <ShieldCheck className="w-5 h-5 text-green-400" /> : <AlertTriangle className="w-5 h-5 text-red-400" />}
          <span className="font-semibold">
            {isValid ? "CRITICAL PASS: Schema mappings match visible visible content." : "SCHEMA BLOCK: Mismatch validation failed."}
          </span>
        </div>
      )}

      {logs.length > 0 && (
        <div className="p-5 rounded-2xl border border-red-500/20 bg-red-950/10 space-y-2">
          <h4 className="text-xs font-bold font-mono text-red-400 uppercase">Schema Blocker Mismatch Logs:</h4>
          <ul className="space-y-1 pl-5 list-disc text-xs text-slate-300">
            {logs.map((log, idx) => (
              <li key={idx}>{log}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Schema JSON-LD Preview Terminal */}
        <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 space-y-4 flex flex-col h-[500px]">
          <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2 font-mono">
            <Terminal className="w-4 h-4 text-cyan-400" />
            GOOGLE_JSONLD_SCHEMA
          </h3>
          <div className="flex-1 rounded-xl bg-black p-4 font-mono text-xs text-green-400 overflow-y-auto border border-white/5 select-text whitespace-pre">
            {JSON.stringify(schemaJson, null, 2)}
          </div>
        </div>

        {/* AI-Readable AEO Block Preview Terminal */}
        <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 space-y-4 flex flex-col h-[500px]">
          <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2 font-mono">
            <Code className="w-4 h-4 text-purple-400" />
            AEO_AI_READABLE_MARKDOWN
          </h3>
          <div className="flex-1 rounded-xl bg-black p-4 font-mono text-xs text-purple-400 overflow-y-auto border border-white/5 select-text whitespace-pre-wrap leading-relaxed">
            {aeoMarkdown}
          </div>
        </div>
      </div>
    </div>
  );
}
