"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  ArrowLeft, 
  Package, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  FolderOpen,
  Database
} from "lucide-react";
import { listDomainPacks, loadDomainPack } from "@/app/actions/semantic";

export default function DomainPacksPage() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";
  const locale = (params?.locale as string) || "ko";

  const [wsId, setWsId] = useState<string>("");
  const [packs, setPacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    initPage();
  }, [workspaceSlug]);

  const initPage = async () => {
    setLoading(true);
    setDbError(null);
    setSuccessMsg(null);
    try {
      const { getSupabaseClient } = await import("@/lib/supabase");
      const supabase = getSupabaseClient();

      const { data: ws } = await supabase
        .from("workspaces")
        .select("id")
        .eq("slug", workspaceSlug)
        .single();

      if (ws?.id) {
        setWsId(ws.id);
        await loadPacksList();
      }
    } catch (err: any) {
      console.error("Failed to init page:", err);
      setDbError(err.message || "페이지 로딩 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const loadPacksList = async () => {
    try {
      const list = await listDomainPacks();
      setPacks(list);
    } catch (err: any) {
      console.error("Failed to list packs:", err);
      setDbError(err.message || "도메인 팩 목록을 가져오지 못했습니다.");
    }
  };

  const handleSyncPack = async (packId: string) => {
    setSyncingId(packId);
    setDbError(null);
    setSuccessMsg(null);
    try {
      const result = await loadDomainPack(wsId, packId);
      setSuccessMsg(
        `도메인 팩 '${packId}' 동기화 성공: 신규 ${result.created}개 생성, ${result.updated}개 갱신 완료.`
      );
      await loadPacksList();
    } catch (err: any) {
      console.error("Failed to sync pack:", err);
      setDbError(`동기화 실패: ${err.message}`);
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto text-slate-100 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}/${workspaceSlug}/semantic-core`}
            className="p-2.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-white rounded-xl border border-white/5 transition-all"
            id="back_btn"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Domain Pack 관리
            </h1>
            <p className="text-xs text-slate-400">YAML 기반 업종별 표준 Attractor & TCO 온톨로지 동기화</p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center gap-2 animate-pulse">
          <CheckCircle className="w-4 h-4" /> {successMsg}
        </div>
      )}

      {dbError && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {dbError}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <RefreshCw className="w-7 h-7 animate-spin text-emerald-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {packs.map((pack) => {
            const isSyncing = syncingId === pack.id;
            return (
              <div 
                key={pack.id} 
                className="bg-slate-900/60 rounded-2xl border border-white/5 p-6 backdrop-blur-md flex flex-col justify-between gap-6 relative overflow-hidden"
              >
                {/* Decorative Icon Background */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-bl-full pointer-events-none" />

                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-200">{pack.name || pack.id}</h3>
                        <span className="text-[10px] text-slate-500 font-semibold font-mono uppercase">{pack.id}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-950/60 px-2 py-0.5 rounded-md border border-white/5 font-mono">
                      v{pack.version || "0.1.0"}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-slate-400 leading-relaxed min-h-[40px]">{pack.description || "등록된 설명이 없습니다."}</p>
                    <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/40 p-3 rounded-xl border border-white/5">
                      <div>
                        <span className="text-[10px] text-slate-500 font-semibold block uppercase">표준 Attractors</span>
                        <span className="text-sm font-bold text-slate-200 font-mono mt-0.5 block">{pack.attractors_count || 0}개</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-semibold block uppercase">TCO 개념 목록</span>
                        <span className="text-sm font-bold text-slate-200 font-mono mt-0.5 block">{pack.concepts_count || 0}개</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 mt-2">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{pack.subdomain || "General"}</span>
                  
                  <button
                    onClick={() => handleSyncPack(pack.id)}
                    disabled={isSyncing}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-emerald-500/10 font-bold"
                    id={`sync_btn_${pack.id.replace(/-/g, '_')}`}
                  >
                    {isSyncing ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Database className="w-3.5 h-3.5" />
                    )}
                    DB에 동기화
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
