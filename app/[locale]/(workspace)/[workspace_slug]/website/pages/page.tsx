"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  ArrowLeft, 
  FileText, 
  Search, 
  ExternalLink,
  ShieldCheck,
  CheckCircle,
  HelpCircle
} from "lucide-react";

interface SemanticPageItem {
  id: string;
  page_title: string;
  slug: string;
  meta_description: string;
  is_published: boolean;
}

export default function SemanticPagesCatalog() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";

  const [pages] = useState<SemanticPageItem[]>([
    {
      id: "page-1",
      page_title: "Active Niacinamide Skincare Specs & Formulations",
      slug: "products/active-niacinamide-skincare",
      meta_description: "Clinical grade active formula with 5% pure niacinamide to accelerate stratum corneum barrier recovery.",
      is_published: true
    },
    {
      id: "page-2",
      page_title: "Eco Composted Sandwich Wrap Specifications",
      slug: "products/eco-sandwich-wrap",
      meta_description: "Corporate guidelines on organic sandwich wraps fully composted in retail open venues.",
      is_published: false
    }
  ]);

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-5xl w-full mx-auto text-slate-100 bg-slate-900">
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
            <h1 className="text-2xl font-extrabold text-white">Composed Semantic Pages</h1>
          </div>
        </div>
      </div>

      {/* Pages list table */}
      <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 space-y-4">
        <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
          <FileText className="w-5 h-5 text-cyan-400" />
          Pre-rendered visible projections
        </h3>

        <div className="border border-white/5 rounded-xl overflow-hidden bg-slate-900/60">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-slate-950/40 font-mono text-slate-400">
                <th className="p-4">Page Title & Slug</th>
                <th className="p-4">Meta Description</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {pages.map((p) => (
                <tr key={p.id} className="hover:bg-white/[0.01] transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-slate-200 flex items-center gap-2">
                      <Search className="w-3.5 h-3.5 text-slate-500" />
                      {p.page_title}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono pl-5.5 mt-0.5">slug: /{p.slug}</div>
                  </td>
                  <td className="p-4 text-slate-400 max-w-xs truncate leading-normal">
                    {p.meta_description}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-block text-[9px] font-bold font-mono px-2 py-0.5 rounded-full border ${
                      p.is_published 
                        ? "border-green-500/20 text-green-400 bg-green-950/20" 
                        : "border-yellow-500/20 text-yellow-400 bg-yellow-950/20"
                    }`}>
                      {p.is_published ? "PUBLISHED" : "CANDIDATE"}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      href={`/${workspaceSlug}/website/pages/${p.id}`}
                      className="px-3 py-1.5 rounded-lg border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition-all font-bold inline-flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Preview Page
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
