"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  listObservedTruths,
  deleteObservedTruth,
  runTruthExtraction,
  runTruthExtractionFromUrl,
  autoCompareTruthDelta,
} from "@/app/actions/truth";
import { resolveWorkspaceSlug } from "@/app/actions/workspace";
import {
  ArrowLeft, Eye, Plus, Trash2, Bot, Link2, AlignLeft,
  CheckCircle, AlertTriangle, Loader2, X, RefreshCw, Zap
} from "lucide-react";

interface ObservedClaim {
  id: string;
  observed_claim: string;
  source_domain: string;
  observed_at: string;
  confidence_score?: number | null;
  is_aligned_with_operational: boolean;
}

export default function ObservedClaimsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "ko";
  const workspaceSlug = (params?.workspace_slug as string) || "";

  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [claims, setClaims] = useState<ObservedClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extraction mode: "text" | "url"
  const [showForm, setShowForm] = useState(false);
  const [extractMode, setExtractMode] = useState<"text" | "url">("text");
  const [sourceText, setSourceText] = useState("");
  const [sourceDomain, setSourceDomain] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [running, setRunning] = useState(false);
  const [agentLogs, setAgentLogs] = useState<string[]>([]);
  const [comparingId, setComparingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!workspaceSlug) return;
      try {
        setLoading(true);
        const wsId = await resolveWorkspaceSlug(workspaceSlug);
        if (!wsId) throw new Error("워크스페이스를 찾을 수 없습니다.");
        setWorkspaceId(wsId);
        const data = await listObservedTruths(wsId);
        setClaims(data as ObservedClaim[]);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [workspaceSlug]);

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId) return;
    setRunning(true);
    setAgentLogs([]);
    setError(null);
    try {
      setAgentLogs(prev => [...prev, "🤖 AI 진실 추출 에이전트 시작..."]);
      let result: any;
      if (extractMode === "url") {
        setAgentLogs(prev => [...prev, `🌐 URL 크롤링 중: ${sourceUrl}`]);
        result = await runTruthExtractionFromUrl(workspaceId, sourceUrl);
      } else {
        setAgentLogs(prev => [...prev, `📄 텍스트 분석 중 (${sourceText.length}자)...`]);
        result = await runTruthExtraction(workspaceId, sourceText, sourceDomain);
      }
      setAgentLogs(prev => [...prev, `✅ ${result.extractedCount}개 클레임 추출 완료 (에이전트 실행 ID: ${result.agentRunId})`]);
      // Refresh list
      const updated = await listObservedTruths(workspaceId);
      setClaims(updated as ObservedClaim[]);
      setShowForm(false);
      setSourceText("");
      setSourceUrl("");
      setSourceDomain("");
    } catch (err: any) {
      setError(err.message);
      setAgentLogs(prev => [...prev, `❌ 오류: ${err.message}`]);
    } finally {
      setRunning(false);
    }
  };

  const handleCompare = async (id: string) => {
    if (!workspaceId) return;
    setComparingId(id);
    try {
      const result = await autoCompareTruthDelta(workspaceId, id);
      if (result.deltaCreated) {
        alert(`⚠ 불일치 감지! 델타가 생성되었습니다.\n\n${result.delta?.delta_summary}`);
      } else {
        alert(`✅ 정렬 확인: ${result.reason}`);
      }
      // Refresh to get updated is_aligned_with_operational
      const updated = await listObservedTruths(workspaceId);
      setClaims(updated as ObservedClaim[]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setComparingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!workspaceId || !confirm("이 관찰 클레임을 삭제하시겠습니까?")) return;
    setDeletingId(id);
    try {
      await deleteObservedTruth(workspaceId, id);
      setClaims(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 font-sans max-w-5xl w-full mx-auto text-slate-100 bg-slate-900">
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/${workspaceSlug}/truth`} className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <div className="text-xs text-cyan-400 font-mono">Brand Truth Studio</div>
          <h1 className="text-2xl font-extrabold text-white">관찰된 클레임 수집</h1>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold text-sm flex items-center gap-2 transition-all"
        >
          <Bot className="w-4 h-4" /> AI 추출 실행
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/20 text-red-400 text-xs">{error}</div>
      )}

      {/* Extraction Form */}
      {showForm && (
        <div className="bg-slate-950/60 rounded-2xl border border-green-500/20 p-6 space-y-4 relative">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-t-2xl" />
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center gap-2"><Bot className="w-4 h-4 text-green-400" /> AI 진실 추출</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          {/* Mode Toggle */}
          <div className="flex gap-2">
            <button onClick={() => setExtractMode("text")} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${extractMode === "text" ? "bg-green-600 text-white" : "border border-white/10 text-slate-400 hover:bg-white/5"}`}>
              <AlignLeft className="w-3.5 h-3.5" /> 텍스트 붙여넣기
            </button>
            <button onClick={() => setExtractMode("url")} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${extractMode === "url" ? "bg-emerald-600 text-white" : "border border-white/10 text-slate-400 hover:bg-white/5"}`}>
              <Link2 className="w-3.5 h-3.5" /> URL 크롤링
            </button>
          </div>

          <form onSubmit={handleExtract} className="space-y-3">
            {extractMode === "url" ? (
              <div>
                <label className="block text-xs text-slate-400 mb-1">브랜드 페이지 URL *</label>
                <input required type="url" value={sourceUrl} onChange={e => setSourceUrl(e.target.value)}
                  placeholder="https://brand-website.com/about"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-green-500/50" />
                <p className="text-[10px] text-slate-600 mt-1">브랜드 사이트를 자동으로 크롤링하여 클레임을 추출합니다 (최대 3페이지).</p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">출처 도메인 *</label>
                  <input required value={sourceDomain} onChange={e => setSourceDomain(e.target.value)}
                    placeholder="naver.com / ai-search.com"
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-green-500/50" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">분석할 텍스트 *</label>
                  <textarea required rows={5} value={sourceText} onChange={e => setSourceText(e.target.value)}
                    placeholder="AI 검색 답변, 블로그, 제품 설명 등 분석할 텍스트를 붙여넣으세요..."
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-green-500/50 resize-none" />
                </div>
              </>
            )}
            {/* Agent Logs */}
            {agentLogs.length > 0 && (
              <div className="p-3 bg-slate-900/80 rounded-xl border border-white/5 space-y-1">
                {agentLogs.map((log, i) => (
                  <div key={i} className="text-[10px] font-mono text-slate-400">{log}</div>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl border border-white/10 text-slate-400 text-sm hover:bg-white/5">취소</button>
              <button type="submit" disabled={running} className="px-5 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-sm flex items-center gap-2 disabled:opacity-50">
                {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                {running ? "추출 중..." : "AI 추출 시작"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Claims List */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> 관찰 클레임 로딩 중...
        </div>
      ) : claims.length === 0 ? (
        <div className="text-center py-16 text-slate-600">
          <Eye className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">아직 수집된 관찰 클레임이 없습니다.</p>
          <p className="text-xs mt-1">AI 추출 실행 버튼으로 외부 텍스트/URL에서 클레임을 수집하세요.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {claims.map(claim => (
            <div key={claim.id} className={`p-5 rounded-2xl border transition-all ${claim.is_aligned_with_operational ? "border-white/5 bg-slate-950/40" : "border-amber-500/20 bg-amber-950/10"}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-100 leading-relaxed">{claim.observed_claim}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] font-mono text-slate-500">
                    <span>출처: {claim.source_domain}</span>
                    <span>{new Date(claim.observed_at).toLocaleDateString("ko-KR")}</span>
                    {claim.confidence_score != null && <span>신뢰도: {Number(claim.confidence_score).toFixed(1)}%</span>}
                    {claim.is_aligned_with_operational ? (
                      <span className="flex items-center gap-1 text-green-400"><CheckCircle className="w-3 h-3" /> 정렬됨</span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-400"><AlertTriangle className="w-3 h-3" /> 불일치</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleCompare(claim.id)}
                    disabled={comparingId === claim.id}
                    title="운영 클레임과 자동 비교 (AI Delta 엔진)"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-yellow-400 hover:bg-yellow-950/20 transition-all disabled:opacity-40"
                  >
                    {comparingId === claim.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => handleDelete(claim.id)}
                    disabled={deletingId === claim.id}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/20 transition-all disabled:opacity-40"
                  >
                    {deletingId === claim.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
