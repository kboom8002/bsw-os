"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { listTruthDeltas, resolveTruthDelta } from "@/app/actions/truth";
import { resolveWorkspaceSlug } from "@/app/actions/workspace";
import {
  ArrowLeft, GitCompare, CheckCircle, AlertTriangle, Loader2, XCircle
} from "lucide-react";

const SEVERITY_COLORS = { low: "green", medium: "amber", high: "orange", critical: "red" } as const;
const SEVERITY_LABELS = { low: "낮음", medium: "보통", high: "높음", critical: "위험" } as const;

interface Delta {
  id: string;
  delta_summary: string;
  severity: "low" | "medium" | "high" | "critical";
  is_resolved: boolean;
  created_at: string;
  source_observed?: { observed_claim: string; source_domain: string } | null;
  target_operational?: { claim: string } | null;
}

export default function TruthDeltasPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "ko";
  const workspaceSlug = (params?.workspace_slug as string) || "";

  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [deltas, setDeltas] = useState<Delta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!workspaceSlug) return;
      try {
        setLoading(true);
        const wsId = await resolveWorkspaceSlug(workspaceSlug);
        if (!wsId) throw new Error("워크스페이스를 찾을 수 없습니다.");
        setWorkspaceId(wsId);
        const data = await listTruthDeltas(wsId);
        setDeltas(data as Delta[]);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [workspaceSlug]);

  const handleResolve = async (id: string) => {
    if (!workspaceId) return;
    setResolvingId(id);
    try {
      await resolveTruthDelta(workspaceId, id);
      setDeltas(prev => prev.map(d => d.id === id ? { ...d, is_resolved: true } : d));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setResolvingId(null);
    }
  };

  const unresolved = deltas.filter(d => !d.is_resolved);
  const resolved = deltas.filter(d => d.is_resolved);

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 font-sans max-w-5xl w-full mx-auto text-slate-100 bg-slate-900">
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/${workspaceSlug}/truth`} className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <div className="text-xs text-cyan-400 font-mono">Brand Truth Studio</div>
          <h1 className="text-2xl font-extrabold text-white">Truth Delta 불일치 추적</h1>
        </div>
      </div>

      {error && <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/20 text-red-400 text-xs">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> 델타 로딩 중...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Unresolved Deltas */}
          <div>
            <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              미해결 델타 ({unresolved.length}개)
            </h3>
            {unresolved.length === 0 ? (
              <div className="text-center py-10 text-slate-600 bg-slate-950/30 rounded-2xl border border-white/5">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500/40" />
                <p className="text-sm">미해결 불일치가 없습니다 — 완전 정렬 상태입니다!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {unresolved.map(d => {
                  const sevColor = SEVERITY_COLORS[d.severity];
                  return (
                    <div key={d.id} className={`p-5 rounded-2xl border border-${sevColor}-500/20 bg-${sevColor}-950/10`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className={`w-4 h-4 text-${sevColor}-400 flex-shrink-0`} />
                            <span className={`text-[10px] px-2 py-0.5 rounded-full bg-${sevColor}-500/10 text-${sevColor}-400 border border-${sevColor}-500/20 font-mono`}>
                              {SEVERITY_LABELS[d.severity]}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">{new Date(d.created_at).toLocaleDateString("ko-KR")}</span>
                          </div>
                          <p className="text-sm text-slate-200 leading-relaxed mb-3">{d.delta_summary}</p>
                          {d.source_observed && (
                            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/10 mb-2">
                              <p className="text-[10px] text-amber-400 font-mono mb-1">관찰 클레임 (출처: {d.source_observed.source_domain})</p>
                              <p className="text-xs text-slate-300 line-clamp-2">{d.source_observed.observed_claim}</p>
                            </div>
                          )}
                          {d.target_operational && (
                            <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/10">
                              <p className="text-[10px] text-purple-400 font-mono mb-1">운영 클레임</p>
                              <p className="text-xs text-slate-300 line-clamp-2">{d.target_operational.claim}</p>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleResolve(d.id)}
                          disabled={resolvingId === d.id}
                          className="px-3 py-1.5 rounded-xl bg-green-600/20 border border-green-500/20 text-green-400 text-xs font-bold hover:bg-green-600/30 transition-all flex items-center gap-1.5 flex-shrink-0 disabled:opacity-40"
                        >
                          {resolvingId === d.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                          해결됨으로 표시
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Resolved Deltas */}
          {resolved.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-500 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400/50" />
                해결된 델타 ({resolved.length}개)
              </h3>
              <div className="space-y-2 opacity-60">
                {resolved.map(d => (
                  <div key={d.id} className="p-4 rounded-xl border border-white/5 bg-slate-950/20 flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-400/50 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-400 line-clamp-2">{d.delta_summary}</p>
                      <span className="text-[10px] font-mono text-slate-600">{new Date(d.created_at).toLocaleDateString("ko-KR")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
