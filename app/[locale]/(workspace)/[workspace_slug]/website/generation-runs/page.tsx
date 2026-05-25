"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  ArrowLeft, 
  Database, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  Cpu
} from "lucide-react";

interface GenerationRunItem {
  id: string;
  run_status: "candidate" | "draft" | "completed" | "failed";
  generated_pages_count: number;
  details: { message: string; pagesCount?: number; error?: string };
  created_at: string;
}

export default function GenerationRunsPage() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";

  const [runs] = useState<GenerationRunItem[]>([
    {
      id: "run-1",
      run_status: "completed",
      generated_pages_count: 2,
      details: { message: "Website generation completed successfully!", pagesCount: 2 },
      created_at: "2026-05-23T18:30:00Z"
    },
    {
      id: "run-2",
      run_status: "candidate",
      generated_pages_count: 0,
      details: { message: "Gen run candidate initialized." },
      created_at: "2026-05-23T18:48:00Z"
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "border-green-500/20 text-green-400 bg-green-950/20";
      case "failed": return "border-red-500/20 text-red-400 bg-red-950/20";
      case "draft": return "border-yellow-500/20 text-yellow-400 bg-yellow-950/20";
      default: return "border-cyan-500/20 text-cyan-400 bg-cyan-950/20";
    }
  };

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
            <h1 className="text-2xl font-extrabold text-white">Generation Runs Log</h1>
          </div>
        </div>
      </div>

      {/* Runs Log */}
      <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 space-y-4">
        <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
          <Database className="w-5 h-5 text-cyan-400" />
          Pre-rendering history list
        </h3>

        <div className="border border-white/5 rounded-xl overflow-hidden bg-slate-900/60">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-slate-950/40 font-mono text-slate-400">
                <th className="p-4">Run ID & Timestamp</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Pages Pre-rendered</th>
                <th className="p-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {runs.map((r) => (
                <tr key={r.id} className="hover:bg-white/[0.01] transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-slate-200 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {r.id}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono pl-5.5 mt-0.5">{r.created_at}</div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-block text-[9px] font-bold font-mono px-2 py-0.5 rounded-full border ${getStatusColor(r.run_status)}`}>
                      {r.run_status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 text-center font-mono text-slate-300 font-bold">
                    {r.generated_pages_count}
                  </td>
                  <td className="p-4 text-right text-slate-400 italic">
                    {r.details.message}
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
