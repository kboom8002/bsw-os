"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  Building2, 
  Activity, 
  HelpCircle, 
  Layers, 
  Eye, 
  FileText, 
  ArrowRight,
  Database,
  CheckCircle,
  Cpu,
  Boxes,
  Network,
  Lock
} from "lucide-react";

export default function SemanticCoreDashboard() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-6xl w-full mx-auto text-slate-100 bg-slate-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="text-xs text-cyan-400 font-mono font-bold tracking-wider uppercase mb-1">
            Studio Module
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
            Semantic Core Studio
          </h1>
          <p className="text-slate-400 text-sm">
            Model search intent, structure canonical questions, map operational concepts, and verify claim lineages.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/${workspaceSlug}/semantic-core/claims`}
            className="px-4 py-2 text-sm font-bold rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 shadow-md shadow-cyan-400/10 transition-all flex items-center gap-2"
          >
            <Lock className="w-4 h-4" />
            Lineage Gate Verifier
          </Link>
        </div>
      </div>

      {/* Semantic layers visual tree overview */}
      <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/40 space-y-4">
        <h3 className="font-bold text-sm text-slate-200">The Semantic Core Architecture</h3>
        <p className="text-slate-400 text-xs leading-relaxed max-w-2xl">
          BSW-OS enforces strict boundaries between strategic, normalized, and contextual layers. We do not collapse these definitions.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Layer 1 */}
          <div className="p-4 rounded-xl border border-white/5 bg-slate-900/60 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-cyan-400" />
            <div className="font-mono text-[10px] text-cyan-400 uppercase mb-1">Layer 1: Upstream Territory</div>
            <h4 className="font-bold text-white text-sm mb-1.5">Question Capital</h4>
            <p className="text-slate-500 text-[11px] leading-snug">
              Strategic search territories that represent what search spaces your brand must legally own.
            </p>
          </div>
          
          {/* Layer 2 */}
          <div className="p-4 rounded-xl border border-white/5 bg-slate-900/60 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-purple-400" />
            <div className="font-mono text-[10px] text-purple-400 uppercase mb-1">Layer 2: Normalized Identity</div>
            <h4 className="font-bold text-white text-sm mb-1.5">Canonical Questions</h4>
            <p className="text-slate-500 text-[11px] leading-snug">
              Stable, normalized question signatures that act as unique identities for query deduplication.
            </p>
          </div>

          {/* Layer 3 */}
          <div className="p-4 rounded-xl border border-white/5 bg-slate-900/60 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-400" />
            <div className="font-mono text-[10px] text-blue-400 uppercase mb-1">Layer 3: Runtime Context</div>
            <h4 className="font-bold text-white text-sm mb-1.5">QIS (Query-Intent-Scenario)</h4>
            <p className="text-slate-500 text-[11px] leading-snug">
              Dynamic scene templates holding intent models and specific context scopes evaluated by AI engines.
            </p>
          </div>
        </div>
      </div>

      {/* Primary Module Shortcuts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Signals */}
        <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 hover:border-white/10 transition-all flex flex-col justify-between">
          <div>
            <Cpu className="w-5 h-5 text-cyan-400 mb-4" />
            <h3 className="font-bold text-sm text-white mb-1.5">Question Signals</h3>
            <p className="text-slate-500 text-xs leading-normal">
              Mine organic user search keywords and evaluate query volume lists.
            </p>
          </div>
          <Link
            href={`/${workspaceSlug}/semantic-core/signals`}
            className="mt-6 flex items-center justify-between text-xs font-bold text-cyan-400 hover:underline"
          >
            <span>Organic Signals</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Question Capital */}
        <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 hover:border-white/10 transition-all flex flex-col justify-between">
          <div>
            <Boxes className="w-5 h-5 text-purple-400 mb-4" />
            <h3 className="font-bold text-sm text-white mb-1.5">Question Capital</h3>
            <p className="text-slate-500 text-xs leading-normal">
              Map strategic hierarchical territories and configure weights.
            </p>
          </div>
          <Link
            href={`/${workspaceSlug}/semantic-core/question-capital`}
            className="mt-6 flex items-center justify-between text-xs font-bold text-purple-400 hover:underline"
          >
            <span>Territory Tree</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Canonical Questions */}
        <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 hover:border-white/10 transition-all flex flex-col justify-between">
          <div>
            <HelpCircle className="w-5 h-5 text-blue-400 mb-4" />
            <h3 className="font-bold text-sm text-white mb-1.5">Canonical Questions</h3>
            <p className="text-slate-500 text-xs leading-normal">
              Manage deduped normalised question signatures.
            </p>
          </div>
          <Link
            href={`/${workspaceSlug}/semantic-core/canonical-questions`}
            className="mt-6 flex items-center justify-between text-xs font-bold text-blue-400 hover:underline"
          >
            <span>CQ Signatures</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* QIS Scenes */}
        <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 hover:border-white/10 transition-all flex flex-col justify-between">
          <div>
            <Eye className="w-5 h-5 text-green-400 mb-4" />
            <h3 className="font-bold text-sm text-white mb-1.5">QIS Scenes</h3>
            <p className="text-slate-500 text-xs leading-normal">
              Configure dynamic scenario templates and risk levels.
            </p>
          </div>
          <Link
            href={`/${workspaceSlug}/semantic-core/qis`}
            className="mt-6 flex items-center justify-between text-xs font-bold text-green-400 hover:underline"
          >
            <span>QIS Scenarios</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Advanced KG & Lineage row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* TCO Concepts */}
        <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-white mb-1.5">TCO Concepts Dictionary</h3>
            <p className="text-slate-500 text-xs leading-normal mb-4">
              Concepts are first-class operational dictionary schemas containing formal definitions, not simple keyword labels.
            </p>
          </div>
          <Link
            href={`/${workspaceSlug}/semantic-core/concepts`}
            className="flex items-center justify-between text-xs font-bold text-cyan-400 hover:underline"
          >
            <span>Concept Dictionary</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Ontology KG */}
        <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-white mb-1.5">Ontology Knowledge Graph</h3>
            <p className="text-slate-500 text-xs leading-normal mb-4">
              Map multi-tenant graph nodes and edges to mathematically represent the brand knowledge model.
            </p>
          </div>
          <Link
            href={`/${workspaceSlug}/semantic-core/kg`}
            className="flex items-center justify-between text-xs font-bold text-purple-400 hover:underline"
          >
            <span>Ontology Path Maps</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Claim Lineage */}
        <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-white mb-1.5">Claim Trace Lineage</h3>
            <p className="text-slate-500 text-xs leading-normal mb-4">
              Trace claim integrity through verified clinical evidence and safe disclosures to generate cryptographic lineage seals.
            </p>
          </div>
          <Link
            href={`/${workspaceSlug}/semantic-core/claims`}
            className="flex items-center justify-between text-xs font-bold text-green-400 hover:underline"
          >
            <span>Lineage Verification</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
