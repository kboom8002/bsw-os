"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  ArrowLeft, 
  FileText, 
  Workflow, 
  ExternalLink,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  Tag,
  Boxes
} from "lucide-react";

interface PageSection {
  id: string;
  section_title: string;
  section_type: string;
  content_body: string;
}

interface PageDetail {
  id: string;
  page_title: string;
  slug: string;
  meta_description: string;
  object_refs: string[];
  qis_refs: string[];
  claim_refs: string[];
  concept_refs: string[];
}

export default function PageDetailPage() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";
  const pageId = (params?.pageId as string) || "page-1";

  const [page] = useState<PageDetail>({
    id: pageId,
    page_title: "Active Niacinamide Skincare Specs & Formulations",
    slug: "products/active-niacinamide-skincare",
    meta_description: "Clinical grade active formula with 5% pure niacinamide to accelerate stratum corneum barrier recovery.",
    object_refs: ["obj-1"],
    qis_refs: ["qis-1"],
    claim_refs: ["claim-1"],
    concept_refs: ["concept-1"]
  });

  const [sections] = useState<PageSection[]>([
    { id: "sec-1", section_title: "Clinical Formulation specifications", section_type: "clinical_facts", content_body: "Factual Specifications for Active Niacinamide formula percentage. properties: concentration = 5%, purity = 99.8%, ph = 5.5." },
    { id: "sec-2", section_title: "Clinical evidence references", section_type: "clinical_facts", content_body: "Supporting Evidence: Stratum corneum recovery verified by Dermatological Safety Review 2025 PDF." },
    { id: "sec-3", section_title: "Regulatory Safety Disclosures & Boundaries", section_type: "safety_boundary", content_body: "Warning: Apply only on intact outer skin stratum corneum barriers. Do not ingest." }
  ]);

  const [linkRules] = useState([
    { id: "link-1", rule_name: "Active Niacinamide Concept Rule", anchor_text: "Niacinamide barrier repair", is_active: true }
  ]);

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-5xl w-full mx-auto text-slate-100 bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="flex items-center gap-4">
          <Link 
            href={`/${workspaceSlug}/website/pages`}
            className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="text-xs text-cyan-400 font-mono">Composed Pages Hub</div>
            <h1 className="text-2xl font-extrabold text-white">{page.page_title}</h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Composed Visible preview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 space-y-6">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              Pre-rendered page preview
            </h3>

            {/* Visual Sections */}
            <div className="space-y-4">
              {sections.map((sec) => (
                <div key={sec.id} className="p-4 rounded-xl border border-white/5 bg-slate-900/60 space-y-2 relative overflow-hidden">
                  <div className="absolute top-4 right-4">
                    <span className="text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-white/5">
                      {sec.section_type}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider">{sec.section_title}</h4>
                  <p className="text-xs text-slate-200 leading-relaxed pr-24">{sec.content_body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Traceability Panel */}
        <div className="space-y-6">
          {/* Mapped concept link rules */}
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/40 space-y-4">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <Workflow className="w-5 h-5 text-cyan-400" />
              Active concept link rules
            </h3>
            <div className="space-y-2 text-xs">
              {linkRules.map(rule => (
                <div key={rule.id} className="p-3 rounded-lg bg-slate-900/60 border border-white/5 space-y-1">
                  <span className="block font-bold text-slate-200">{rule.rule_name}</span>
                  <div className="text-[10px] text-cyan-400 flex items-center gap-1 font-mono">
                    <span>Anchor:</span>
                    <span className="underline">"{rule.anchor_text}"</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trace carrier refs */}
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 space-y-4">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <Tag className="w-5 h-5 text-purple-400" />
              Trace Carrier reference tags
            </h3>
            <div className="space-y-3 font-mono text-[9px] text-slate-500 max-h-60 overflow-y-auto">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 mb-1">Object References</span>
                {page.object_refs.map(r => (
                  <span key={r} className="block bg-slate-900 px-2 py-0.5 rounded border border-white/5 text-slate-300 truncate mb-1">{r}</span>
                ))}
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 mb-1">QIS References</span>
                {page.qis_refs.map(r => (
                  <span key={r} className="block bg-slate-900 px-2 py-0.5 rounded border border-white/5 text-slate-300 truncate mb-1">{r}</span>
                ))}
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 mb-1">Claim References</span>
                {page.claim_refs.map(r => (
                  <span key={r} className="block bg-slate-900 px-2 py-0.5 rounded border border-white/5 text-slate-300 truncate mb-1">{r}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
